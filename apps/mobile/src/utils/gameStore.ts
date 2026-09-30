import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SlotType, TurretSlot, OwnedModule, calcModuleCost, getModuleDef } from './modules';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export type TurretType = 'cannon' | 'laser' | 'missile' | 'tesla';

/** Module owned by the player (collection) */
export interface PlayerModule extends OwnedModule {
  defId: string;
  level: number;
}

/** Persistent build state for a single turret */
export interface TurretBuild {
  type: TurretType;
  level: number; // permanent level (1–20 base)
  xp: number; // permanent XP toward next level
  prestigeLevel: number; // resets level but adds a new slot
  slots: TurretSlot[]; // slot[n].type = X/V/C/E/O, slot[n].moduleDefId = owned def id | null
  maxLevel: number; // level cap before prestige (grows per prestige tier)
}

// ─────────────────────────────────────────────────────────────
// DEFAULT SLOT CONFIGURATIONS PER TURRET TYPE
// (grows by 1 slot per prestige — user picks the new slot type)
// ─────────────────────────────────────────────────────────────
export const TURRET_BASE_SLOTS: Record<TurretType, SlotType[]> = {
  cannon: ['X', 'X', 'O'], // damage + utility: 3 base slots
  laser: ['V', 'V', 'X'], // speed + damage: 3 base slots
  missile: ['X', 'X', 'E'], // damage + exotic: 3 base slots
  tesla: ['C', 'C', 'X'], // control + damage: 3 base slots
};

function makeTurretBuild(type: TurretType): TurretBuild {
  return {
    type,
    level: 1,
    xp: 0,
    prestigeLevel: 0,
    slots: TURRET_BASE_SLOTS[type].map((t) => ({ type: t, moduleDefId: null })),
    maxLevel: 10,
  };
}

// ─────────────────────────────────────────────────────────────
// STORE INTERFACE
// ─────────────────────────────────────────────────────────────
interface GameState {
  // ── Persistent global progress ─────────────────────────────
  gold: number;
  prestigePoints: number;
  prestigeLevel: number;
  characterLevel: number;
  characterXp: number;

  // Player module collection
  ownedModules: PlayerModule[];
  // Player character equipped module slot IDs (up to 8)
  playerEquippedMods: string[]; // defIds

  // Turret builds (permanent loadout between runs)
  turretBuilds: Record<TurretType, TurretBuild>;

  // ── In-run state (reset each run) ──────────────────────────
  isRunActive: boolean;
  runLevel: number;
  runXp: number;
  runHealth: number;
  maxRunHealth: number;
  wave: number;

  // ── Actions ────────────────────────────────────────────────
  addGold: (amount: number) => void;
  addXp: (amount: number) => void;
  prestige: () => void;

  startRun: () => void;
  endRun: () => void;
  updateRunState: (
    updates: Partial<Pick<GameState, 'runHealth' | 'maxRunHealth' | 'runLevel' | 'runXp' | 'wave'>>
  ) => void;

  // Player module management
  equipPlayerMod: (defId: string) => void;
  unequipPlayerMod: (defId: string) => void;
  upgradePlayerMod: (defId: string) => void;
  unlockModule: (defId: string) => void; // add to collection

  // Turret module management
  setTurretModSlot: (turretType: TurretType, slotIndex: number, moduleDefId: string | null) => void;
  upgradeTurretMod: (turretType: TurretType, slotIndex: number) => void;
  addTurretXp: (turretType: TurretType, amount: number) => void;
  prestigeTurret: (turretType: TurretType, newSlotType: SlotType) => void;
}

// ─────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────
const INITIAL_OWNED_MODULES: PlayerModule[] = [
  { defId: 'x_base_dmg', level: 1 },
  { defId: 'v_fire_rate', level: 1 },
  { defId: 'x_poison', level: 1 },
  { defId: 'o_magazine', level: 1 },
  { defId: 'o_max_hp', level: 1 },
  { defId: 'x_crit_chance', level: 1 },
];

const INITIAL_TURRET_BUILDS: Record<TurretType, TurretBuild> = {
  cannon: makeTurretBuild('cannon'),
  laser: makeTurretBuild('laser'),
  missile: makeTurretBuild('missile'),
  tesla: makeTurretBuild('tesla'),
};

// ─────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────
export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      gold: 800,
      prestigePoints: 0,
      prestigeLevel: 0,
      characterLevel: 1,
      characterXp: 0,
      ownedModules: INITIAL_OWNED_MODULES,
      playerEquippedMods: [],
      turretBuilds: INITIAL_TURRET_BUILDS,

      isRunActive: false,
      runLevel: 1,
      runXp: 0,
      runHealth: 100,
      maxRunHealth: 100,
      wave: 0,

      // ── Global ───────────────────────────────────────────
      addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

      addXp: (amount) =>
        set((s) => {
          const nextXp = s.characterXp + amount;
          const threshold = s.characterLevel * 1000;
          if (nextXp >= threshold)
            return { characterLevel: s.characterLevel + 1, characterXp: nextXp - threshold };
          return { characterXp: nextXp };
        }),

      prestige: () =>
        set((s) => ({
          prestigeLevel: s.prestigeLevel + 1,
          prestigePoints: s.prestigePoints + s.characterLevel * 10,
          characterLevel: 1,
          characterXp: 0,
          gold: 100,
        })),

      // ── Run ──────────────────────────────────────────────
      startRun: () =>
        set({
          isRunActive: true,
          runLevel: 1,
          runXp: 0,
          runHealth: 100,
          maxRunHealth: 100,
          wave: 1,
        }),

      endRun: () => set({ isRunActive: false }),

      updateRunState: (updates) => set((s) => ({ ...s, ...updates })),

      // ── Player modules ───────────────────────────────────
      unlockModule: (defId) =>
        set((s) => {
          if (s.ownedModules.some((m) => m.defId === defId)) return s;
          return { ownedModules: [...s.ownedModules, { defId, level: 1 }] };
        }),

      equipPlayerMod: (defId) =>
        set((s) => {
          if (s.playerEquippedMods.length >= 8 || s.playerEquippedMods.includes(defId)) return s;
          return { playerEquippedMods: [...s.playerEquippedMods, defId] };
        }),

      unequipPlayerMod: (defId) =>
        set((s) => ({ playerEquippedMods: s.playerEquippedMods.filter((id) => id !== defId) })),

      upgradePlayerMod: (defId) =>
        set((s) => {
          const owned = s.ownedModules.find((m) => m.defId === defId);
          const def = getModuleDef(defId);
          if (!owned || !def) return s;
          if (owned.level >= def.maxLevel) return s;
          const cost = calcModuleCost(def, owned.level + 1, null);
          if (s.gold < cost) return s;
          return {
            gold: s.gold - cost,
            ownedModules: s.ownedModules.map((m) =>
              m.defId === defId ? { ...m, level: m.level + 1 } : m
            ),
          };
        }),

      // ── Turret modules ───────────────────────────────────
      setTurretModSlot: (turretType, slotIndex, moduleDefId) =>
        set((s) => {
          const build = s.turretBuilds[turretType];
          if (slotIndex >= build.slots.length) return s;
          const newSlots = [...build.slots];
          newSlots[slotIndex] = { ...newSlots[slotIndex], moduleDefId };
          return {
            turretBuilds: {
              ...s.turretBuilds,
              [turretType]: { ...build, slots: newSlots },
            },
          };
        }),

      upgradeTurretMod: (turretType, slotIndex) =>
        set((s) => {
          const build = s.turretBuilds[turretType];
          const slot = build.slots[slotIndex];
          if (!slot || !slot.moduleDefId) return s;

          const defId = slot.moduleDefId;
          const def = getModuleDef(defId);
          const owned = s.ownedModules.find((m) => m.defId === defId);
          if (!def || !owned) return s;
          if (owned.level >= def.maxLevel) return s;

          const cost = calcModuleCost(def, owned.level + 1, slot.type);
          if (s.gold < cost) return s;

          return {
            gold: s.gold - cost,
            ownedModules: s.ownedModules.map((m) =>
              m.defId === defId ? { ...m, level: m.level + 1 } : m
            ),
          };
        }),

      addTurretXp: (turretType, amount) =>
        set((s) => {
          const build = s.turretBuilds[turretType];
          const nextXp = build.xp + amount;
          const threshold = build.level * 200;
          if (nextXp >= threshold && build.level < build.maxLevel) {
            return {
              turretBuilds: {
                ...s.turretBuilds,
                [turretType]: { ...build, level: build.level + 1, xp: nextXp - threshold },
              },
            };
          }
          return {
            turretBuilds: {
              ...s.turretBuilds,
              [turretType]: { ...build, xp: nextXp },
            },
          };
        }),

      prestigeTurret: (turretType, newSlotType) =>
        set((s) => {
          const build = s.turretBuilds[turretType];
          if (build.level < build.maxLevel) return s; // must be at max level
          const newSlot: TurretSlot = { type: newSlotType, moduleDefId: null };
          return {
            turretBuilds: {
              ...s.turretBuilds,
              [turretType]: {
                ...build,
                level: 1,
                xp: 0,
                prestigeLevel: build.prestigeLevel + 1,
                maxLevel: build.maxLevel + 5,
                slots: [...build.slots, newSlot],
              },
            },
          };
        }),
    }),
    {
      name: 'planet-defense-v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        gold: s.gold,
        prestigePoints: s.prestigePoints,
        prestigeLevel: s.prestigeLevel,
        characterLevel: s.characterLevel,
        characterXp: s.characterXp,
        ownedModules: s.ownedModules,
        playerEquippedMods: s.playerEquippedMods,
        turretBuilds: s.turretBuilds,
      }),
    }
  )
);

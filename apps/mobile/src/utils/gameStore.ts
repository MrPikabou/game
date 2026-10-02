import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SlotType,
  TurretSlot,
  ModuleInstance,
  calcPowerCost,
  getModuleDef,
  ALL_MODULE_DEFS,
} from './modules';
import { DAILY_MISSION_DEFS } from './dailyMissions';
import { openChest, LoginReward } from './loginRewards';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export type TurretType = 'cannon' | 'laser' | 'missile' | 'tesla';

export const TURRET_MAX_POWER: Record<TurretType, number> = {
  cannon: 100,
  laser: 80,
  missile: 120,
  tesla: 90,
};

export const TURRET_BASE_SLOTS: Record<TurretType, SlotType[]> = {
  cannon: ['X', 'X', 'O'],
  laser: ['V', 'V', 'X'],
  missile: ['X', 'X', 'E'],
  tesla: ['C', 'C', 'X'],
};

export interface TurretBuild {
  type: TurretType;
  level: number;
  xp: number;
  prestigeLevel: number;
  slots: TurretSlot[];
  maxLevel: number;
  maxPower: number;
}

export interface MissionProgress {
  missionId: string;
  current: number;
  claimed: boolean;
}

export interface MapStageReward {
  mapId: number;
  /** '25' | '50' | '100' — health % milestone */
  milestone: string;
  claimed: boolean;
}

function makeTurretBuild(type: TurretType): TurretBuild {
  return {
    type,
    level: 1,
    xp: 0,
    prestigeLevel: 0,
    slots: TURRET_BASE_SLOTS[type].map((t) => ({ type: t, instanceId: null })),
    maxLevel: 10,
    maxPower: TURRET_MAX_POWER[type],
  };
}

let _iid = 1;
export function newInstanceId(): string {
  return `inst_${Date.now()}_${_iid++}`;
}

/** Pick 3 random mission ids without replacement */
function pick3MissionIds(): string[] {
  const shuffled = [...DAILY_MISSION_DEFS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((m) => m.id);
}

// ─────────────────────────────────────────────────────────────
// STATE INTERFACE
// ─────────────────────────────────────────────────────────────
interface GameState {
  // ── Persistent ──────────────────────────────────────────
  gold: number;
  prestigePoints: number;
  prestigeLevel: number;
  characterLevel: number;
  characterXp: number;
  ownedModules: ModuleInstance[];
  playerEquippedMods: string[];
  turretBuilds: Record<TurretType, TurretBuild>;
  materials: Record<string, number>;

  // Missions — only 3 active per day
  activeMissionIds: string[];
  missions: MissionProgress[]; // all 50 missions (progress persisted)
  lastMissionRefresh: number;
  missionCounters: Record<string, number>;

  // Login rewards
  lastLoginDate: string; // 'YYYY-MM-DD'
  loginStreak: number;
  loginRewardsClaimed: Record<string, boolean>; // key = 'YYYY-MM-DD'
  currentMonthKey: string; // 'YYYY-MM' — resets when month changes

  // Maps & progression
  currentMap: number;
  unlockedMaps: number[];
  eliteMode: boolean;
  stageRewards: MapStageReward[];

  // Encyclopedia
  killedEnemies: Record<string, number>; // enemyId → total kills
  legendaryDropSeen: Record<string, boolean>; // materialId → ever dropped it

  // ── In-run ──────────────────────────────────────────────
  isRunActive: boolean;
  runLevel: number;
  runXp: number;
  runHealth: number;
  maxRunHealth: number;
  wave: number;

  // ── Actions ─────────────────────────────────────────────
  addGold: (a: number) => void;
  addXp: (a: number) => void;
  addMaterials: (drops: Record<string, number>) => void;
  prestige: () => void;
  startRun: () => void;
  endRun: () => void;
  updateRunState: (
    u: Partial<Pick<GameState, 'runHealth' | 'maxRunHealth' | 'runLevel' | 'runXp' | 'wave'>>
  ) => void;

  addModuleInstance: (defId: string) => ModuleInstance;
  equipPlayerMod: (instanceId: string) => void;
  unequipPlayerMod: (instanceId: string) => void;
  upgradeModuleInstance: (instanceId: string) => void;
  setTurretSlotInstance: (t: TurretType, slotIdx: number, instanceId: string | null) => void;
  upgradeTurretSlotModule: (t: TurretType, slotIdx: number) => void;
  addTurretXp: (t: TurretType, amount: number) => void;
  prestigeTurret: (t: TurretType, newSlotType: SlotType) => void;

  incrementCounter: (key: string, by?: number) => void;
  claimMission: (missionId: string) => void;
  refreshMissionsIfNeeded: () => void;

  checkLoginReward: () => void;
  claimLoginReward: (reward: LoginReward) => void;

  setMap: (mapId: number) => void;
  setEliteMode: (elite: boolean) => void;
  unlockMap: (mapId: number) => void;
  claimStageReward: (mapId: number, milestone: string) => void;
  recordEnemyKill: (enemyId: string, count?: number) => void;
  recordLegendaryDrop: (materialId: string) => void;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}
function dayOfMonth(): number {
  return new Date().getDate();
}

function makeFreshMissions(): MissionProgress[] {
  return DAILY_MISSION_DEFS.map((m) => ({ missionId: m.id, current: 0, claimed: false }));
}

const INIT_MODULES: ModuleInstance[] = [
  { instanceId: 'inst_init_1', defId: 'x_base_dmg', level: 1 },
  { instanceId: 'inst_init_2', defId: 'v_fire_rate', level: 1 },
  { instanceId: 'inst_init_3', defId: 'o_max_hp', level: 1 },
  { instanceId: 'inst_init_4', defId: 'x_crit_chance', level: 1 },
];

function makeStageRewards(): MapStageReward[] {
  const maps = [1, 2, 3, 4];
  const milestones = ['25', '50', '100'];
  return maps.flatMap((mapId) =>
    milestones.map((milestone) => ({ mapId, milestone, claimed: false }))
  );
}

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
      ownedModules: INIT_MODULES,
      playerEquippedMods: [],
      turretBuilds: {
        cannon: makeTurretBuild('cannon'),
        laser: makeTurretBuild('laser'),
        missile: makeTurretBuild('missile'),
        tesla: makeTurretBuild('tesla'),
      },
      materials: {},
      activeMissionIds: pick3MissionIds(),
      missions: makeFreshMissions(),
      lastMissionRefresh: Date.now(),
      missionCounters: {},
      lastLoginDate: '',
      loginStreak: 0,
      loginRewardsClaimed: {},
      currentMonthKey: monthKey(),
      currentMap: 1,
      unlockedMaps: [1],
      eliteMode: false,
      stageRewards: makeStageRewards(),
      killedEnemies: {},
      legendaryDropSeen: {},
      isRunActive: false,
      runLevel: 1,
      runXp: 0,
      runHealth: 100,
      maxRunHealth: 100,
      wave: 0,

      addGold: (a) => set((s) => ({ gold: s.gold + a })),

      addXp: (a) =>
        set((s) => {
          const nx = s.characterXp + a;
          const thr = s.characterLevel * 1000;
          if (nx >= thr) return { characterLevel: s.characterLevel + 1, characterXp: nx - thr };
          return { characterXp: nx };
        }),

      addMaterials: (drops) =>
        set((s) => {
          const m = { ...s.materials };
          for (const [id, qty] of Object.entries(drops)) m[id] = (m[id] ?? 0) + qty;
          return { materials: m };
        }),

      // Prestige — keeps everything, only resets character level
      prestige: () =>
        set((s) => ({
          prestigeLevel: s.prestigeLevel + 1,
          prestigePoints: s.prestigePoints + 50,
          characterLevel: 1,
          characterXp: 0,
        })),

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
      updateRunState: (u) => set((s) => ({ ...s, ...u })),

      // ── Module instances ─────────────────────────────────
      addModuleInstance: (defId: string) => {
        const inst: ModuleInstance = { instanceId: newInstanceId(), defId, level: 1 };
        set((s) => ({ ownedModules: [...s.ownedModules, inst] }));
        return inst;
      },
      equipPlayerMod: (instanceId) =>
        set((s) => {
          if (s.playerEquippedMods.length >= 8 || s.playerEquippedMods.includes(instanceId))
            return s;
          return { playerEquippedMods: [...s.playerEquippedMods, instanceId] };
        }),
      unequipPlayerMod: (instanceId) =>
        set((s) => ({
          playerEquippedMods: s.playerEquippedMods.filter((id) => id !== instanceId),
        })),
      upgradeModuleInstance: (instanceId) =>
        set((s) => {
          const inst = s.ownedModules.find((m) => m.instanceId === instanceId);
          const def = inst ? getModuleDef(inst.defId) : null;
          if (!inst || !def || inst.level >= def.maxLevel) return s;
          const cost = def.baseCost + def.costPerLevel * inst.level;
          if (s.gold < cost) return s;
          return {
            gold: s.gold - cost,
            ownedModules: s.ownedModules.map((m) =>
              m.instanceId === instanceId ? { ...m, level: m.level + 1 } : m
            ),
          };
        }),

      // ── Turret modules ─────────────────────────────────
      setTurretSlotInstance: (turretType, slotIndex, instanceId) =>
        set((s) => {
          const build = s.turretBuilds[turretType];
          if (slotIndex >= build.slots.length) return s;
          if (instanceId !== null) {
            const inst = s.ownedModules.find((m) => m.instanceId === instanceId);
            const def = inst ? getModuleDef(inst.defId) : null;
            if (!def) return s;
            const slot = build.slots[slotIndex];
            const newPower = calcPowerCost(def, slot.type);
            const usedPower = build.slots.reduce((acc, sl, i) => {
              if (i === slotIndex || !sl.instanceId) return acc;
              const si = s.ownedModules.find((m) => m.instanceId === sl.instanceId);
              const sd = si ? getModuleDef(si.defId) : null;
              return acc + (sd ? calcPowerCost(sd, sl.type) : 0);
            }, 0);
            if (usedPower + newPower > build.maxPower) return s;
          }
          const newSlots = build.slots.map((sl, i) =>
            i === slotIndex ? { ...sl, instanceId } : sl
          );
          return {
            turretBuilds: { ...s.turretBuilds, [turretType]: { ...build, slots: newSlots } },
          };
        }),
      upgradeTurretSlotModule: (turretType, slotIndex) =>
        set((s) => {
          const build = s.turretBuilds[turretType];
          const slot = build.slots[slotIndex];
          if (!slot?.instanceId) return s;
          const inst = s.ownedModules.find((m) => m.instanceId === slot.instanceId);
          const def = inst ? getModuleDef(inst.defId) : null;
          if (!inst || !def || inst.level >= def.maxLevel) return s;
          const cost = def.baseCost + def.costPerLevel * inst.level;
          if (s.gold < cost) return s;
          return {
            gold: s.gold - cost,
            ownedModules: s.ownedModules.map((m) =>
              m.instanceId === slot.instanceId ? { ...m, level: m.level + 1 } : m
            ),
          };
        }),
      addTurretXp: (turretType, amount) =>
        set((s) => {
          const build = s.turretBuilds[turretType];
          const nx = build.xp + amount;
          const thr = build.level * 200;
          if (nx >= thr && build.level < build.maxLevel)
            return {
              turretBuilds: {
                ...s.turretBuilds,
                [turretType]: { ...build, level: build.level + 1, xp: nx - thr },
              },
            };
          return { turretBuilds: { ...s.turretBuilds, [turretType]: { ...build, xp: nx } } };
        }),
      prestigeTurret: (turretType, newSlotType) =>
        set((s) => {
          const build = s.turretBuilds[turretType];
          if (build.level < build.maxLevel) return s;
          const newSlot: TurretSlot = { type: newSlotType, instanceId: null };
          return {
            turretBuilds: {
              ...s.turretBuilds,
              [turretType]: {
                ...build,
                level: 1,
                xp: 0,
                prestigeLevel: build.prestigeLevel + 1,
                maxLevel: build.maxLevel + 5,
                maxPower: build.maxPower + 20,
                slots: [...build.slots, newSlot],
              },
            },
          };
        }),

      // ── Missions (3 active per day) ────────────────────
      incrementCounter: (key, by = 1) =>
        set((s) => {
          const counters = { ...s.missionCounters, [key]: (s.missionCounters[key] ?? 0) + by };
          const missions = s.missions.map((mp) => {
            if (mp.claimed) return mp;
            const def = DAILY_MISSION_DEFS.find((d) => d.id === mp.missionId);
            if (!def || def.counterKey !== key) return mp;
            return { ...mp, current: Math.min(counters[key] ?? 0, def.target) };
          });
          return { missionCounters: counters, missions };
        }),
      claimMission: (missionId) =>
        set((s) => {
          const def = DAILY_MISSION_DEFS.find((d) => d.id === missionId);
          const mp = s.missions.find((m) => m.missionId === missionId);
          if (!def || !mp || mp.claimed || mp.current < def.target) return s;
          const mats = { ...s.materials };
          if (def.materialReward)
            mats[def.materialReward.materialId] =
              (mats[def.materialReward.materialId] ?? 0) + def.materialReward.qty;
          return {
            gold: s.gold + def.goldReward,
            missions: s.missions.map((m) =>
              m.missionId === missionId ? { ...m, claimed: true } : m
            ),
            materials: mats,
          };
        }),
      refreshMissionsIfNeeded: () =>
        set((s) => {
          const sameDay =
            new Date(Date.now()).toDateString() === new Date(s.lastMissionRefresh).toDateString();
          if (sameDay) return s;
          // New day → pick 3 fresh random missions
          return {
            activeMissionIds: pick3MissionIds(),
            missions: makeFreshMissions(),
            lastMissionRefresh: Date.now(),
          };
        }),

      // ── Login rewards ──────────────────────────────────
      checkLoginReward: () =>
        set((s) => {
          const today = todayStr();
          const mk = monthKey();
          if (s.lastLoginDate === today) return s; // already checked today
          // Reset if new month
          const loginRewardsClaimed = mk !== s.currentMonthKey ? {} : { ...s.loginRewardsClaimed };
          const streak = s.lastLoginDate === '' ? 1 : s.loginStreak + 1;
          return {
            lastLoginDate: today,
            loginStreak: streak,
            currentMonthKey: mk,
            loginRewardsClaimed,
          };
        }),
      claimLoginReward: (reward: LoginReward) =>
        set((s) => {
          const key = `${s.currentMonthKey}-d${reward.day}`;
          if (s.loginRewardsClaimed[key]) return s;
          const mats = { ...s.materials };
          let gold = s.gold;
          if (reward.goldAmount) gold += reward.goldAmount;
          if (reward.type === 'material' && reward.materialId) {
            mats[reward.materialId] = (mats[reward.materialId] ?? 0) + (reward.materialQty ?? 1);
          }
          if (
            reward.type === 'chest_basic' ||
            reward.type === 'chest_epic' ||
            reward.type === 'chest_legendary'
          ) {
            const { materialIds, gold: chestGold } = openChest(reward);
            gold += chestGold;
            for (const matId of materialIds) mats[matId] = (mats[matId] ?? 0) + 1;
          }
          return {
            gold,
            materials: mats,
            loginRewardsClaimed: { ...s.loginRewardsClaimed, [key]: true },
          };
        }),

      // ── Maps ──────────────────────────────────────────
      setMap: (mapId) => set({ currentMap: mapId }),
      setEliteMode: (elite) => set({ eliteMode: elite }),
      unlockMap: (mapId) =>
        set((s) => ({
          unlockedMaps: s.unlockedMaps.includes(mapId)
            ? s.unlockedMaps
            : [...s.unlockedMaps, mapId],
        })),
      claimStageReward: (mapId, milestone) =>
        set((s) => {
          const entry = s.stageRewards.find((r) => r.mapId === mapId && r.milestone === milestone);
          if (!entry || entry.claimed) return s;
          const mats = { ...s.materials };
          // Chest reward: give some materials based on milestone
          const matAmt = milestone === '100' ? 3 : milestone === '50' ? 2 : 1;
          mats['plasma_core'] = (mats['plasma_core'] ?? 0) + matAmt;
          return {
            stageRewards: s.stageRewards.map((r) =>
              r.mapId === mapId && r.milestone === milestone ? { ...r, claimed: true } : r
            ),
            materials: mats,
            gold: s.gold + (milestone === '100' ? 400 : milestone === '50' ? 200 : 100),
          };
        }),

      // ── Encyclopedia ──────────────────────────────────
      recordEnemyKill: (enemyId, count = 1) =>
        set((s) => ({
          killedEnemies: { ...s.killedEnemies, [enemyId]: (s.killedEnemies[enemyId] ?? 0) + count },
        })),
      recordLegendaryDrop: (materialId) =>
        set((s) => ({
          legendaryDropSeen: { ...s.legendaryDropSeen, [materialId]: true },
        })),
    }),
    {
      name: 'planet-defense-v5',
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
        materials: s.materials,
        activeMissionIds: s.activeMissionIds,
        missions: s.missions,
        lastMissionRefresh: s.lastMissionRefresh,
        missionCounters: s.missionCounters,
        lastLoginDate: s.lastLoginDate,
        loginStreak: s.loginStreak,
        loginRewardsClaimed: s.loginRewardsClaimed,
        currentMonthKey: s.currentMonthKey,
        currentMap: s.currentMap,
        unlockedMaps: s.unlockedMaps,
        eliteMode: s.eliteMode,
        stageRewards: s.stageRewards,
        killedEnemies: s.killedEnemies,
        legendaryDropSeen: s.legendaryDropSeen,
      }),
    }
  )
);

// ── Pure helpers ─────────────────────────────────────────────
export function getUsedPower(build: TurretBuild, owned: ModuleInstance[]): number {
  return build.slots.reduce((acc, slot) => {
    if (!slot.instanceId) return acc;
    const inst = owned.find((m) => m.instanceId === slot.instanceId);
    const def = inst ? getModuleDef(inst.defId) : null;
    return acc + (def ? calcPowerCost(def, slot.type) : 0);
  }, 0);
}

export function rollModuleDrop(): string {
  const weighted = ALL_MODULE_DEFS.flatMap((d) => {
    const w = d.rarity === 'common' ? 60 : d.rarity === 'rare' ? 28 : d.rarity === 'epic' ? 10 : 2;
    return Array<string>(w).fill(d.id);
  });
  return weighted[Math.floor(Math.random() * weighted.length)];
}

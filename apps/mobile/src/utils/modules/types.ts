/**
 * CORE MODULE TYPES
 * These types are shared across all module definition files.
 *
 * SlotType legend:
 *  X = eXplosive / Offensive damage
 *  V = Velocity / Speed & rate
 *  C = Control / Status debuffs
 *  E = Exotic / Build-defining
 *  O = Omni / Utility, defensive, passive
 *
 * When a module's slotType matches the slot it's placed in → 50% cost discount.
 */

export type SlotType = 'X' | 'V' | 'C' | 'E' | 'O';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** All turret type keys — extend this union when adding new turrets */
export type TurretTypeKey = 'cannon' | 'laser' | 'missile' | 'tesla';

export interface ModuleDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  slotType: SlotType;
  rarity: Rarity;
  /** Base gold cost at level 1 */
  baseCost: number;
  /** Additional gold cost per level (rarity-based). common=40, rare=100, epic=250, legendary=600 */
  costPerLevel: number;
  maxLevel: number;
  description: string;
  /** Internal stat key used by the game engine */
  statKey: string;
  /** Stat value added per level */
  baseValue: number;
  /** Display unit — '%', 'hp', 'px', 'dps', etc. */
  unit: string;
  /**
   * Which targets can equip this module:
   *  'all'    → player + all turrets
   *  'player' → player only
   *  TurretTypeKey[] → specific turrets only (player cannot equip)
   */
  applicableTo: 'all' | 'player' | TurretTypeKey[];
}

/** Persistent state for a single module instance in the player's collection */
export interface OwnedModule {
  defId: string; // references ModuleDef.id
  level: number;
}

/** A turret's module slot — the type determines the 50% cost discount */
export interface TurretSlot {
  type: SlotType;
  moduleDefId: string | null; // null = empty
}

/**
 * Returns the gold cost for a module at its current level,
 * applying a 50% discount when slotType matches module's slotType.
 */
export function calcModuleCost(def: ModuleDef, level: number, slotType: SlotType | null): number {
  const raw = def.baseCost + def.costPerLevel * (level - 1);
  return slotType === def.slotType ? Math.floor(raw * 0.5) : raw;
}

/** Rarity display helpers */
export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
};

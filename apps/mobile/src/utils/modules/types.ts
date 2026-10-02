/**
 * CORE MODULE TYPES
 *
 * SlotType legend:
 *  X = eXplosive / Offensive damage
 *  V = Velocity / Speed & rate
 *  C = Control / Status debuffs
 *  E = Exotic / Build-defining
 *  O = Omni / Utility, defensive, passive
 *
 * POWER SYSTEM:
 *  Each turret has a maxPower pool (e.g. 100 power).
 *  Each module has a powerCost (e.g. 16 power).
 *  When the module's slotType matches the slot it's placed in → 50% POWER cost reduction.
 *  (The slotType discount is NOT a gold cost discount — it's purely about power slots.)
 *  Turret can't equip a module if usedPower + effectivePowerCost > maxPower.
 *
 * DUPLICATE MODULES:
 *  Each owned module is a unique ModuleInstance with its own instanceId + level.
 *  You can own two instances of the same defId at different levels.
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
  /** Gold cost to upgrade to the next level */
  baseCost: number;
  /** Additional gold cost per level */
  costPerLevel: number;
  maxLevel: number;
  description: string;
  statKey: string;
  baseValue: number;
  unit: string;
  /**
   * Base POWER cost when equipped in any slot.
   * common ≈ 8, rare ≈ 16, epic ≈ 24, legendary ≈ 36.
   * If the slot's type matches this module's slotType → powerCost is halved.
   * Optional — falls back to RARITY_POWER_COST[rarity] if omitted.
   */
  powerCost?: number;
  applicableTo: 'all' | 'player' | TurretTypeKey[];
}

/**
 * A single owned module instance — each has its own id so duplicates are possible.
 * Two instances of the same defId can exist at different levels.
 */
export interface ModuleInstance {
  /** Unique instance id (e.g. "inst_1234") */
  instanceId: string;
  defId: string;
  level: number;
}

/** A turret's module slot */
export interface TurretSlot {
  type: SlotType;
  /** instanceId of the equipped module (null = empty) */
  instanceId: string | null;
}

/** Gold cost to upgrade a module from its current level to the next */
export function calcUpgradeCost(def: ModuleDef, currentLevel: number): number {
  return def.baseCost + def.costPerLevel * currentLevel;
}

/**
 * Effective power cost when a module is placed in a slot.
 * Halved if slot type matches module's slotType.
 */
export function calcPowerCost(def: ModuleDef, slotType: SlotType): number {
  const cost = def.powerCost ?? RARITY_POWER_COST[def.rarity];
  return slotType === def.slotType ? Math.floor(cost * 0.5) : cost;
}

/** @deprecated — kept for backward compat; use calcUpgradeCost instead */
export function calcModuleCost(def: ModuleDef, level: number, _slotType: SlotType | null): number {
  return calcUpgradeCost(def, level - 1);
}

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

/** Default power costs by rarity */
export const RARITY_POWER_COST: Record<Rarity, number> = {
  common: 8,
  rare: 16,
  epic: 24,
  legendary: 36,
};

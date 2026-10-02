/**
 * MATERIAL TYPES
 *
 * Materials are dropped by enemies and used to level up modules and turrets.
 * Each material has a rarity and belongs to a category.
 *
 * To add a new material: create an entry in the relevant category file.
 * To add a new category: create a new file and add it to index.ts.
 */

export type MaterialRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type MaterialCategory = 'scrap' | 'energy' | 'bio' | 'exotic';

export interface MaterialDef {
  id: string;
  name: string;
  icon: string;
  rarity: MaterialRarity;
  category: MaterialCategory;
  description: string;
  /** Base drop weight (relative probability) — higher = more common */
  dropWeight: number;
}

/**
 * A single requirement for leveling a module or turret.
 * `fromLevel` = the level being upgraded FROM (so fromLevel 1 = upgrading to level 2).
 */
export interface MaterialCost {
  materialId: string;
  qty: number;
  /** If specified, only required when upgrading from this level */
  fromLevel?: number;
}

/** Rarity display colors */
export const MAT_RARITY_COLOR: Record<MaterialRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

/**
 * MATERIAL REGISTRY
 * Add new material categories by:
 * 1. Creating a new file with MaterialDef[]
 * 2. Importing and spreading it into ALL_MATERIAL_DEFS
 */
export * from './types';
export { BASIC_MATERIALS } from './basic';
export { ADVANCED_MATERIALS } from './advanced';

import { MaterialDef } from './types';
import { BASIC_MATERIALS } from './basic';
import { ADVANCED_MATERIALS } from './advanced';

export const ALL_MATERIAL_DEFS: MaterialDef[] = [...BASIC_MATERIALS, ...ADVANCED_MATERIALS];

export const MATERIAL_MAP: Record<string, MaterialDef> = Object.fromEntries(
  ALL_MATERIAL_DEFS.map((m) => [m.id, m])
);

export function getMaterial(id: string): MaterialDef | undefined {
  return MATERIAL_MAP[id];
}

/**
 * MODULE UPGRADE MATERIAL COSTS
 * Keyed by rarity → array of MaterialCost per level bracket.
 * from level N = upgrading FROM level N (to N+1).
 *
 * To customise per-module costs override in the module def file using
 * the optional `materialCosts` array (not yet wired — future extension).
 */
export const UPGRADE_MATERIAL_COST: Record<
  string,
  Array<{ materialId: string; qty: number; minLevel: number }>
> = {
  common: [
    { materialId: 'iron_scrap', qty: 2, minLevel: 1 },
    { materialId: 'copper_wire', qty: 1, minLevel: 1 },
    { materialId: 'energy_cell', qty: 2, minLevel: 4 },
    { materialId: 'plasma_core', qty: 1, minLevel: 7 },
  ],
  rare: [
    { materialId: 'iron_scrap', qty: 3, minLevel: 1 },
    { materialId: 'energy_cell', qty: 2, minLevel: 1 },
    { materialId: 'plasma_core', qty: 1, minLevel: 1 },
    { materialId: 'void_shard', qty: 1, minLevel: 4 },
    { materialId: 'neural_matrix', qty: 1, minLevel: 6 },
  ],
  epic: [
    { materialId: 'plasma_core', qty: 2, minLevel: 1 },
    { materialId: 'void_shard', qty: 2, minLevel: 1 },
    { materialId: 'quantum_filament', qty: 1, minLevel: 1 },
    { materialId: 'titan_alloy', qty: 1, minLevel: 3 },
    { materialId: 'stellar_fragment', qty: 1, minLevel: 5 },
  ],
  legendary: [
    { materialId: 'void_shard', qty: 3, minLevel: 1 },
    { materialId: 'quantum_filament', qty: 2, minLevel: 1 },
    { materialId: 'titan_alloy', qty: 2, minLevel: 1 },
    { materialId: 'stellar_fragment', qty: 2, minLevel: 1 },
    { materialId: 'dark_matter_core', qty: 1, minLevel: 3 },
  ],
};

/** Returns required materials to upgrade a module of given rarity from level `fromLevel` */
export function getUpgradeCost(
  rarity: string,
  fromLevel: number
): Array<{ materialId: string; qty: number }> {
  const table = UPGRADE_MATERIAL_COST[rarity] ?? UPGRADE_MATERIAL_COST.common;
  return table
    .filter((c) => fromLevel >= c.minLevel)
    .map((c) => ({ materialId: c.materialId, qty: c.qty }));
}

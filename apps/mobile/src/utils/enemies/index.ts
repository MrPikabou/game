/**
 * ENEMY REGISTRY
 * Add new enemy categories by:
 * 1. Creating a new file in this folder with EnemyDef[]
 * 2. Importing and spreading it into ALL_ENEMY_DEFS
 */
export * from './types';
export { SCOUTS } from './scouts';
export { HEAVY } from './heavy';
export { SWARM } from './swarm';
export { BOSSES } from './bosses';

import { EnemyDef } from './types';
import { SCOUTS } from './scouts';
import { HEAVY } from './heavy';
import { SWARM } from './swarm';
import { BOSSES } from './bosses';

/** Flat registry — keyed by enemy id */
export const ALL_ENEMY_DEFS: EnemyDef[] = [...SCOUTS, ...HEAVY, ...SWARM, ...BOSSES];

export const ENEMY_MAP: Record<string, EnemyDef> = Object.fromEntries(
  ALL_ENEMY_DEFS.map((e) => [e.id, e])
);

export function getEnemy(id: string): EnemyDef | undefined {
  return ENEMY_MAP[id];
}

// ── Wave pools ─────────────────────────────────────────────
// Each array is the enemy id pool for that wave tier.
// Any wave not listed falls back to 'default'.
export const WAVE_POOLS: Record<string, string[]> = {
  '1': ['scout', 'scout', 'scout', 'swarmer', 'runner'],
  '2': ['scout', 'runner', 'swarmer', 'swarmer'],
  '3': ['scout', 'runner', 'swarmer', 'tank', 'glass_cannon'],
  '4': ['runner', 'swarmer', 'tank', 'bomber_swarm'],
  '5': ['swarmer', 'tank', 'bomber_swarm', 'shielder'],
  '6': ['tank', 'bomber_swarm', 'shielder', 'juggernaut'],
  '7': ['shielder', 'juggernaut', 'swarmer', 'leech'],
  '8': ['juggernaut', 'elite', 'bomber_swarm', 'leech'],
  '9': ['elite', 'juggernaut', 'shielder', 'leech'],
  '10': ['elite', 'void_lord', 'juggernaut', 'swarmer'],
  '15': ['void_lord', 'corrupted_titan', 'juggernaut', 'leech'],
  '20': ['corrupted_titan', 'void_lord', 'elite', 'juggernaut'],
  default: ['scout', 'runner', 'swarmer', 'tank', 'bomber_swarm', 'shielder', 'juggernaut'],
};

export function pickEnemyId(wave: number): string {
  const pool = WAVE_POOLS[String(wave)] ?? WAVE_POOLS.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Material drop helper ───────────────────────────────────
import { ALL_MATERIAL_DEFS } from '../materials';

/**
 * Rolls a material drop for a killed enemy.
 * Returns a material id if the roll succeeds, null otherwise.
 */
export function rollMaterialDrop(enemyDef: EnemyDef): string | null {
  if (Math.random() > enemyDef.materialDropChance) return null;
  const totalWeight = ALL_MATERIAL_DEFS.reduce((a, m) => a + m.dropWeight, 0);
  let roll = Math.random() * totalWeight;
  for (const mat of ALL_MATERIAL_DEFS) {
    roll -= mat.dropWeight;
    if (roll <= 0) return mat.id;
  }
  return ALL_MATERIAL_DEFS[0].id;
}

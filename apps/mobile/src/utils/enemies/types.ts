/**
 * ENEMY TYPES — core interfaces
 *
 * DamageType is used for weak_to / strong_against.
 * Add new damage types here and reference them in enemy definitions.
 */

export type DamageType =
  | 'physical'
  | 'electric'
  | 'fire'
  | 'ice'
  | 'poison'
  | 'explosive'
  | 'laser';

export type EnemyCategory = 'scout' | 'heavy' | 'swarm' | 'boss' | 'special';

export interface EnemyDef {
  /** Unique string key — used in wave pools */
  id: string;
  name: string;
  icon: string;
  category: EnemyCategory;

  // ── Base stats ───────────────────────────────────────
  /** Base HP at wave 1 */
  baseHp: number;
  /** Additional HP per wave */
  hpPerWave: number;
  /** Base movement speed (pixels per frame) */
  speed: number;
  /** Additional speed per wave (keeps enemies threatening) */
  speedPerWave: number;
  /** Flat damage reduction (0 = no armor). Applied before % resistances */
  armor: number;
  /** Visual size in pixels */
  size: number;

  // ── Resistances / Vulnerabilities ────────────────────
  /**
   * Damage types this enemy takes MORE damage from.
   * Value = damage multiplier (e.g. 1.5 = +50% damage).
   */
  weakTo: Partial<Record<DamageType, number>>;
  /**
   * Damage types this enemy takes LESS damage from.
   * Value = damage multiplier (e.g. 0.5 = -50% damage).
   */
  strongAgainst: Partial<Record<DamageType, number>>;

  // ── Rewards ──────────────────────────────────────────
  goldReward: number;
  /** XP rewarded to the PLAYER character */
  xpReward: number;
  /** XP rewarded to each active TURRET that got a kill */
  turretXpReward: number;
  /** Chance (0-1) of dropping a material on death */
  materialDropChance: number;

  // ── Spawn behaviour ───────────────────────────────────
  /** How many of this type spawn per spawn event */
  spawnCount: number;
  /** Offset Y between simultaneous spawns */
  spawnYOffset: number;

  // ── Visuals ──────────────────────────────────────────
  color: string;
  borderColor: string;
  /** Damage dealt to player base on breach */
  baseDamage: number;
  /** Boss-tier enemies get a special indicator */
  isBoss?: boolean;
}

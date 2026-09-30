import { Dimensions } from 'react-native';
import { TurretType } from './gameStore';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// LAYOUT CONSTANTS
// ─────────────────────────────────────────────────────────────
export const GROUND_H = 80;
export const PLAYER_W = 52;
export const PLAYER_H = 62;
export const SURFACE_TURRET_W = 48;
export const SURFACE_TURRET_H = 52;

// Turrets sit on the planet surface, 2 left and 2 right of the player
// Player starts at center. Turrets are fixed X positions.
export const SURFACE_Y = height - GROUND_H - SURFACE_TURRET_H; // top of turret (sits on ground)

// Slot order: [left-far, left-near, right-near, right-far]
export const TURRET_SURFACE_X = [
  8, // left-far
  64, // left-near
  width - 64 - SURFACE_TURRET_W, // right-near
  width - 8 - SURFACE_TURRET_W, // right-far
];

export const TURRET_SLOT_LABELS = ['LEFT ◄◄', 'LEFT ◄', 'RIGHT ►', 'RIGHT ►►'];

// ─────────────────────────────────────────────────────────────
// TURRET DEFINITIONS  ← add new turrets here, no logic changes needed
// ─────────────────────────────────────────────────────────────
export interface TurretDef {
  type: TurretType;
  name: string;
  icon: string;
  color: string;
  accentColor: string;
  /** Base damage at turret level 1 */
  damage: number;
  /** Frames between shots at level 1 (lower = faster) */
  fireRateFrames: number;
  /** Pixel detection radius */
  range: number;
  bulletSpeed: number;
  bulletSize: number;
  bulletColor: string;
  description: string;
  /** Laser bullets pierce enemies instead of being consumed */
  piercing?: boolean;
  /** Stat gains per level */
  dmgPerLevel: number;
  rangePerLevel: number;
}

export const TURRET_DEFS: Record<TurretType, TurretDef> = {
  cannon: {
    type: 'cannon',
    name: 'CANNON',
    icon: '🔴',
    color: '#991b1b',
    accentColor: '#ef4444',
    damage: 50,
    fireRateFrames: 55,
    range: 280,
    bulletSpeed: 12,
    bulletSize: 12,
    bulletColor: '#f97316',
    description: 'High damage · Slow fire',
    dmgPerLevel: 8,
    rangePerLevel: 10,
  },
  laser: {
    type: 'laser',
    name: 'LASER',
    icon: '🟣',
    color: '#5b21b6',
    accentColor: '#a855f7',
    damage: 11,
    fireRateFrames: 7,
    range: 340,
    bulletSpeed: 22,
    bulletSize: 5,
    bulletColor: '#c084fc',
    description: 'Rapid fire · Long range · Pierces',
    piercing: true,
    dmgPerLevel: 2,
    rangePerLevel: 15,
  },
  missile: {
    type: 'missile',
    name: 'MISSILE',
    icon: '🟡',
    color: '#92400e',
    accentColor: '#f59e0b',
    damage: 120,
    fireRateFrames: 130,
    range: 300,
    bulletSpeed: 8,
    bulletSize: 17,
    bulletColor: '#fbbf24',
    description: 'Max damage · Very slow · AoE',
    dmgPerLevel: 18,
    rangePerLevel: 12,
  },
  tesla: {
    type: 'tesla',
    name: 'TESLA',
    icon: '🔵',
    color: '#164e63',
    accentColor: '#22d3ee',
    damage: 28,
    fireRateFrames: 22,
    range: 220,
    bulletSpeed: 16,
    bulletSize: 8,
    bulletColor: '#67e8f9',
    description: 'Chain damage · Slows enemies',
    dmgPerLevel: 4,
    rangePerLevel: 8,
  },
};

// Derive scaled stats from turret level
export function getTurretStats(type: TurretType, level: number) {
  const def = TURRET_DEFS[type];
  return {
    damage: def.damage + def.dmgPerLevel * (level - 1),
    fireRateFrames: Math.max(4, def.fireRateFrames - Math.floor(level * 0.8)),
    range: def.range + def.rangePerLevel * (level - 1),
    bulletSpeed: def.bulletSpeed,
    bulletSize: def.bulletSize,
    bulletColor: def.bulletColor,
  };
}

// ─────────────────────────────────────────────────────────────
// ENEMY DEFINITIONS  ← add new types here, no logic changes needed
// ─────────────────────────────────────────────────────────────
export type EnemyTypeName = 'scout' | 'tank' | 'swarmer' | 'bomber' | 'elite';

export interface EnemyDef {
  hp: number;
  speed: number;
  color: string;
  borderColor: string;
  size: number;
  reward: number;
  xpReward: number;
  emoji: string;
  spawnCount: number;
  isBoss?: boolean;
}

export const ENEMY_DEFS: Record<EnemyTypeName, EnemyDef> = {
  scout: {
    hp: 45,
    speed: 2.0,
    color: '#7f1d1d',
    borderColor: '#ef4444',
    size: 34,
    reward: 6,
    xpReward: 15,
    emoji: '👾',
    spawnCount: 1,
  },
  swarmer: {
    hp: 12,
    speed: 3.8,
    color: '#4c1d95',
    borderColor: '#a855f7',
    size: 22,
    reward: 3,
    xpReward: 8,
    emoji: '◆',
    spawnCount: 3,
  },
  tank: {
    hp: 280,
    speed: 0.6,
    color: '#7c2d12',
    borderColor: '#f97316',
    size: 54,
    reward: 35,
    xpReward: 70,
    emoji: '🛡️',
    spawnCount: 1,
  },
  bomber: {
    hp: 95,
    speed: 1.2,
    color: '#78350f',
    borderColor: '#f59e0b',
    size: 44,
    reward: 18,
    xpReward: 35,
    emoji: '💥',
    spawnCount: 1,
  },
  elite: {
    hp: 450,
    speed: 1.0,
    color: '#1e3a5f',
    borderColor: '#60a5fa',
    size: 60,
    reward: 80,
    xpReward: 160,
    emoji: '⭐',
    spawnCount: 1,
    isBoss: true,
  },
};

export const WAVE_POOLS: Record<string, EnemyTypeName[]> = {
  '1': ['scout', 'scout', 'scout', 'swarmer'],
  '2': ['scout', 'scout', 'swarmer', 'swarmer'],
  '3': ['scout', 'scout', 'swarmer', 'tank'],
  '4': ['scout', 'swarmer', 'tank', 'bomber'],
  '5': ['swarmer', 'tank', 'bomber', 'bomber'],
  '8': ['tank', 'bomber', 'elite', 'swarmer'],
  '10': ['elite', 'elite', 'tank', 'bomber'],
  default: ['scout', 'swarmer', 'tank', 'bomber', 'tank', 'swarmer'],
};

export function pickEnemyType(wave: number): EnemyTypeName {
  const pool = WAVE_POOLS[String(wave)] ?? WAVE_POOLS.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─────────────────────────────────────────────────────────────
// RUN AUGMENTS  ← data-driven, add new entries freely
// Augments apply to player stats (applyKey) OR unlock a turret (applyKey = 'unlock_<type>')
// ─────────────────────────────────────────────────────────────
export interface RunAugment {
  id: string;
  label: string;
  description: string;
  category: 'player' | 'turret_unlock';
  applyKey: string;
  applyValue: number;
  /** If category = turret_unlock, this is the turret type to deploy */
  turretType?: TurretType;
  /** Which run slots (0-3) this unlock targets */
  turretSlot?: number;
}

/** Player stat augments */
export const PLAYER_AUGMENTS: RunAugment[] = [
  {
    id: 'dmg_20',
    label: '⚔️  DAMAGE +20%',
    description: 'Increases all shot damage',
    category: 'player',
    applyKey: 'dmg',
    applyValue: 1.2,
  },
  {
    id: 'dmg_40',
    label: '💥 DAMAGE +40%',
    description: 'Major damage boost',
    category: 'player',
    applyKey: 'dmg',
    applyValue: 1.4,
  },
  {
    id: 'fr_20',
    label: '⚡ FIRE RATE +20%',
    description: 'Shoots faster',
    category: 'player',
    applyKey: 'fr',
    applyValue: 1.2,
  },
  {
    id: 'fr_35',
    label: '🔥 FIRE RATE +35%',
    description: 'Major fire rate boost',
    category: 'player',
    applyKey: 'fr',
    applyValue: 1.35,
  },
  {
    id: 'spd_25',
    label: '🚀 BULLET SPEED +25%',
    description: 'Bullets travel faster',
    category: 'player',
    applyKey: 'spd',
    applyValue: 1.25,
  },
  {
    id: 'heal_25',
    label: '❤️  RESTORE 25 HP',
    description: 'Immediately restore HP',
    category: 'player',
    applyKey: 'heal',
    applyValue: 25,
  },
  {
    id: 'heal_50',
    label: '💊 RESTORE 50 HP',
    description: 'Large HP restore',
    category: 'player',
    applyKey: 'heal',
    applyValue: 50,
  },
  {
    id: 'mhp_20',
    label: '🛡️  MAX SHIELD +20',
    description: 'Increases max HP',
    category: 'player',
    applyKey: 'mhp',
    applyValue: 20,
  },
  {
    id: 'mhp_40',
    label: '🔰 MAX SHIELD +40',
    description: 'Large max HP increase',
    category: 'player',
    applyKey: 'mhp',
    applyValue: 40,
  },
];

/** Turret unlock augments — one per turret type per slot pair */
export const TURRET_UNLOCK_AUGMENTS: RunAugment[] = [
  {
    id: 'unlock_cannon_0',
    label: '🔴 DEPLOY CANNON [L◄◄]',
    description: 'Deploy a Cannon turret on the left flank',
    category: 'turret_unlock',
    applyKey: 'unlock_turret',
    applyValue: 0,
    turretType: 'cannon',
    turretSlot: 0,
  },
  {
    id: 'unlock_laser_1',
    label: '🟣 DEPLOY LASER [L◄]',
    description: 'Deploy a Laser turret near-left',
    category: 'turret_unlock',
    applyKey: 'unlock_turret',
    applyValue: 0,
    turretType: 'laser',
    turretSlot: 1,
  },
  {
    id: 'unlock_missile_3',
    label: '🟡 DEPLOY MISSILE [R►►]',
    description: 'Deploy a Missile turret on the right flank',
    category: 'turret_unlock',
    applyKey: 'unlock_turret',
    applyValue: 0,
    turretType: 'missile',
    turretSlot: 3,
  },
  {
    id: 'unlock_tesla_2',
    label: '🔵 DEPLOY TESLA [R►]',
    description: 'Deploy a Tesla turret near-right',
    category: 'turret_unlock',
    applyKey: 'unlock_turret',
    applyValue: 0,
    turretType: 'tesla',
    turretSlot: 2,
  },
];

export const ALL_AUGMENTS: RunAugment[] = [...PLAYER_AUGMENTS, ...TURRET_UNLOCK_AUGMENTS];

/** Pick N random augments — always include at least 1 turret unlock option if any slots still empty */
export function pickAugments(count: number, unlockedSlots: boolean[]): RunAugment[] {
  const emptySlotUnlocks = TURRET_UNLOCK_AUGMENTS.filter((a) => !unlockedSlots[a.turretSlot ?? -1]);
  const playerPool = [...PLAYER_AUGMENTS].sort(() => Math.random() - 0.5);

  const picks: RunAugment[] = [];

  // Guarantee 1 turret unlock option if there are empty slots
  if (emptySlotUnlocks.length > 0 && count > 1) {
    const shuffled = [...emptySlotUnlocks].sort(() => Math.random() - 0.5);
    picks.push(shuffled[0]);
  }

  // Fill rest with player augments
  for (const a of playerPool) {
    if (picks.length >= count) break;
    if (!picks.find((p) => p.id === a.id)) picks.push(a);
  }

  return picks.slice(0, count).sort(() => Math.random() - 0.5);
}

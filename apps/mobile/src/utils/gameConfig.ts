import { Dimensions } from 'react-native';
import { TurretType } from './gameStore';
import { EnemyDef, pickEnemyId, ENEMY_MAP } from './enemies';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────
export const GROUND_H = 80;
export const PLAYER_W = 52;
export const PLAYER_H = 62;
export const SURFACE_TURRET_W = 48;
export const SURFACE_TURRET_H = 52;
export const SURFACE_Y = height - GROUND_H - SURFACE_TURRET_H;

// [left-far, left-near, right-near, right-far]
export const TURRET_SURFACE_X = [
  8,
  64,
  width - 64 - SURFACE_TURRET_W,
  width - 8 - SURFACE_TURRET_W,
];

export const TURRET_SLOT_LABELS = ['LEFT ◄◄', 'LEFT ◄', 'RIGHT ►', 'RIGHT ►►'];

export { pickEnemyId, ENEMY_MAP };
export type { EnemyDef };

// ─────────────────────────────────────────────────────────────
// MAP DEFINITIONS
// ─────────────────────────────────────────────────────────────
export interface MapDef {
  id: number;
  name: string;
  icon: string;
  description: string;
  enemySpeedMult: number;
  enemyHpMult: number;
  color: string;
}

export const MAP_DEFS: MapDef[] = [
  {
    id: 1,
    name: 'TERRA BASE',
    icon: '🌍',
    description: 'Standard invasion',
    enemySpeedMult: 1.0,
    enemyHpMult: 1.0,
    color: '#1d4ed8',
  },
  {
    id: 2,
    name: 'ACID WASTES',
    icon: '🟢',
    description: 'Faster enemies',
    enemySpeedMult: 1.3,
    enemyHpMult: 1.2,
    color: '#15803d',
  },
  {
    id: 3,
    name: 'VOID RIFT',
    icon: '🟣',
    description: 'Tankier enemies',
    enemySpeedMult: 1.1,
    enemyHpMult: 1.8,
    color: '#7e22ce',
  },
  {
    id: 4,
    name: 'OMEGA NEXUS',
    icon: '🔴',
    description: 'Maximum threat',
    enemySpeedMult: 1.5,
    enemyHpMult: 2.5,
    color: '#991b1b',
  },
];

export function getMapDef(id: number): MapDef {
  return MAP_DEFS.find((m) => m.id === id) ?? MAP_DEFS[0];
}

// ─────────────────────────────────────────────────────────────
// TURRET DEFINITIONS
// ─────────────────────────────────────────────────────────────
export interface TurretDef {
  type: TurretType;
  name: string;
  icon: string;
  color: string;
  accentColor: string;
  damage: number;
  fireRateFrames: number;
  range: number;
  bulletSpeed: number;
  bulletSize: number;
  bulletColor: string;
  description: string;
  piercing?: boolean;
  isLightning?: boolean;
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
    dmgPerLevel: 2,
    rangePerLevel: 15,
    piercing: true,
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
    bulletSpeed: 7,
    bulletSize: 17,
    bulletColor: '#fbbf24',
    description: 'Max damage · Homing · Retargets on kill',
    dmgPerLevel: 18,
    rangePerLevel: 12,
  },
  tesla: {
    type: 'tesla',
    name: 'TESLA',
    icon: '🔵',
    color: '#164e63',
    accentColor: '#22d3ee',
    damage: 35,
    fireRateFrames: 28,
    range: 230,
    bulletSpeed: 0,
    bulletSize: 0,
    bulletColor: '#67e8f9',
    description: 'Instant chain lightning · Chains to 2 targets',
    dmgPerLevel: 5,
    rangePerLevel: 8,
    isLightning: true,
  },
};

export function getTurretStats(type: TurretType, level: number) {
  const def = TURRET_DEFS[type];
  return {
    damage: def.damage + def.dmgPerLevel * (level - 1),
    fireRateFrames: Math.max(4, def.fireRateFrames - Math.floor(level * 0.8)),
    range: def.range + def.rangePerLevel * (level - 1),
    bulletSpeed: def.bulletSpeed,
    bulletSize: def.bulletSize,
    bulletColor: def.bulletColor,
    isLightning: def.isLightning ?? false,
    piercing: def.piercing ?? false,
  };
}

// ─────────────────────────────────────────────────────────────
// RUN AUGMENTS — tower-specific with optional negative aspects
// ─────────────────────────────────────────────────────────────
export interface AugEffect {
  applyKey: 'dmg' | 'fr' | 'spd' | 'heal' | 'mhp';
  applyValue: number;
}

export interface RunAugment {
  id: string;
  label: string;
  description: string;
  /** 'player' | 'turret' (specific turret) | 'turret_unlock' (deploy new turret) */
  category: 'player' | 'turret' | 'turret_unlock';
  effects: AugEffect[];
  turretType?: TurretType;
  turretSlot?: number;
  isNegative?: boolean;
}

export const PLAYER_AUGMENTS: RunAugment[] = [
  {
    id: 'p_dmg_20',
    label: '⚔️  DAMAGE +20%',
    description: 'All shots deal more damage',
    category: 'player',
    effects: [{ applyKey: 'dmg', applyValue: 1.2 }],
  },
  {
    id: 'p_dmg_40',
    label: '💥 DAMAGE +40%',
    description: 'Major damage boost',
    category: 'player',
    effects: [{ applyKey: 'dmg', applyValue: 1.4 }],
  },
  {
    id: 'p_fr_20',
    label: '⚡ FIRE RATE +20%',
    description: 'Shoot faster',
    category: 'player',
    effects: [{ applyKey: 'fr', applyValue: 1.2 }],
  },
  {
    id: 'p_fr_35',
    label: '🔥 FIRE RATE +35%',
    description: 'Major fire rate boost',
    category: 'player',
    effects: [{ applyKey: 'fr', applyValue: 1.35 }],
  },
  {
    id: 'p_spd_25',
    label: '🚀 BULLET SPEED +25%',
    description: 'Faster bullets hit fast enemies',
    category: 'player',
    effects: [{ applyKey: 'spd', applyValue: 1.25 }],
  },
  {
    id: 'p_heal_25',
    label: '❤️  RESTORE 25 HP',
    description: 'Immediately restore HP',
    category: 'player',
    effects: [{ applyKey: 'heal', applyValue: 25 }],
  },
  {
    id: 'p_heal_50',
    label: '💊 RESTORE 50 HP',
    description: 'Large HP restore',
    category: 'player',
    effects: [{ applyKey: 'heal', applyValue: 50 }],
  },
  {
    id: 'p_mhp_20',
    label: '🛡️  MAX SHIELD +20',
    description: 'More max HP',
    category: 'player',
    effects: [{ applyKey: 'mhp', applyValue: 20 }],
  },
  {
    id: 'p_mhp_40',
    label: '🔰 MAX SHIELD +40',
    description: 'Large max HP increase',
    category: 'player',
    effects: [{ applyKey: 'mhp', applyValue: 40 }],
  },
  // Negative tradeoffs
  {
    id: 'p_glass_cannon',
    label: '💎 DMG +60% / MAX HP -30',
    description: '⚠️ High risk, high reward',
    category: 'player',
    isNegative: true,
    effects: [
      { applyKey: 'dmg', applyValue: 1.6 },
      { applyKey: 'mhp', applyValue: -30 },
    ],
  },
  {
    id: 'p_rapid_weak',
    label: '🌀 RATE +50% / DMG -20%',
    description: '⚠️ Spray & pray — less power',
    category: 'player',
    isNegative: true,
    effects: [
      { applyKey: 'fr', applyValue: 1.5 },
      { applyKey: 'dmg', applyValue: 0.8 },
    ],
  },
];

export const TURRET_AUGMENTS: RunAugment[] = [
  // ── Cannon ──
  {
    id: 'c_dmg_30',
    label: '🔴 CANNON: DMG +30%',
    description: 'More cannon firepower',
    category: 'turret',
    turretType: 'cannon',
    effects: [{ applyKey: 'dmg', applyValue: 1.3 }],
  },
  {
    id: 'c_fr_25',
    label: '🔴 CANNON: RATE +25%',
    description: 'Faster cannon bursts',
    category: 'turret',
    turretType: 'cannon',
    effects: [{ applyKey: 'fr', applyValue: 1.25 }],
  },
  {
    id: 'c_over',
    label: '🔴 CANNON: DMG+40% / SPD-20%',
    description: '⚠️ Overcharged, slower reload',
    category: 'turret',
    turretType: 'cannon',
    isNegative: true,
    effects: [
      { applyKey: 'dmg', applyValue: 1.4 },
      { applyKey: 'fr', applyValue: 0.8 },
    ],
  },
  // ── Laser ──
  {
    id: 'l_fr_40',
    label: '🟣 LASER: RATE +40%',
    description: 'Faster beam pulses',
    category: 'turret',
    turretType: 'laser',
    effects: [{ applyKey: 'fr', applyValue: 1.4 }],
  },
  {
    id: 'l_dmg_30',
    label: '🟣 LASER: PIERCE DMG +30%',
    description: 'Burns through more targets',
    category: 'turret',
    turretType: 'laser',
    effects: [{ applyKey: 'dmg', applyValue: 1.3 }],
  },
  {
    id: 'l_over',
    label: '🟣 LASER: DMG+50% / RATE-25%',
    description: '⚠️ Focus beam, slower pulse',
    category: 'turret',
    turretType: 'laser',
    isNegative: true,
    effects: [
      { applyKey: 'dmg', applyValue: 1.5 },
      { applyKey: 'fr', applyValue: 0.75 },
    ],
  },
  // ── Missile ──
  {
    id: 'm_dmg_40',
    label: '🟡 MISSILE: DMG +40%',
    description: 'Bigger warheads',
    category: 'turret',
    turretType: 'missile',
    effects: [{ applyKey: 'dmg', applyValue: 1.4 }],
  },
  {
    id: 'm_fr_30',
    label: '🟡 MISSILE: RATE +30%',
    description: 'Faster launcher reload',
    category: 'turret',
    turretType: 'missile',
    effects: [{ applyKey: 'fr', applyValue: 1.3 }],
  },
  {
    id: 'm_nuke',
    label: '🟡 MISSILE: DMG+70% / RATE-40%',
    description: '⚠️ Nuke rounds — very slow',
    category: 'turret',
    turretType: 'missile',
    isNegative: true,
    effects: [
      { applyKey: 'dmg', applyValue: 1.7 },
      { applyKey: 'fr', applyValue: 0.6 },
    ],
  },
  // ── Tesla ──
  {
    id: 't_chain',
    label: '🔵 TESLA: CHAIN DMG +25%',
    description: 'More chain lightning damage',
    category: 'turret',
    turretType: 'tesla',
    effects: [{ applyKey: 'dmg', applyValue: 1.25 }],
  },
  {
    id: 't_fr_35',
    label: '🔵 TESLA: RATE +35%',
    description: 'Faster lightning strikes',
    category: 'turret',
    turretType: 'tesla',
    effects: [{ applyKey: 'fr', applyValue: 1.35 }],
  },
  {
    id: 't_storm',
    label: '🔵 TESLA: DMG+60% / RATE-30%',
    description: '⚠️ Intense storm, slow cooldown',
    category: 'turret',
    turretType: 'tesla',
    isNegative: true,
    effects: [
      { applyKey: 'dmg', applyValue: 1.6 },
      { applyKey: 'fr', applyValue: 0.7 },
    ],
  },
];

export const TURRET_UNLOCK_AUGMENTS: RunAugment[] = [
  {
    id: 'unlock_cannon_0',
    label: '🔴 DEPLOY CANNON [L◄◄]',
    description: 'Deploy Cannon on the left flank',
    category: 'turret_unlock',
    effects: [],
    turretType: 'cannon',
    turretSlot: 0,
  },
  {
    id: 'unlock_laser_1',
    label: '🟣 DEPLOY LASER [L◄]',
    description: 'Deploy Laser turret near-left',
    category: 'turret_unlock',
    effects: [],
    turretType: 'laser',
    turretSlot: 1,
  },
  {
    id: 'unlock_tesla_2',
    label: '🔵 DEPLOY TESLA [R►]',
    description: 'Deploy Tesla chain-lightning',
    category: 'turret_unlock',
    effects: [],
    turretType: 'tesla',
    turretSlot: 2,
  },
  {
    id: 'unlock_missile_3',
    label: '🟡 DEPLOY MISSILE [R►►]',
    description: 'Deploy Missile on the right flank',
    category: 'turret_unlock',
    effects: [],
    turretType: 'missile',
    turretSlot: 3,
  },
];

export function pickAugments(
  count: number,
  activeSlots: boolean[],
  activeTurretTypes: (TurretType | null)[]
): RunAugment[] {
  const emptyUnlocks = TURRET_UNLOCK_AUGMENTS.filter((a) => !activeSlots[a.turretSlot ?? -1]);
  const activeTurretAugs = TURRET_AUGMENTS.filter(
    (a) => a.turretType && activeTurretTypes.includes(a.turretType)
  );
  const picks: RunAugment[] = [];

  // Guarantee at least 1 turret unlock when empty slots exist
  if (emptyUnlocks.length > 0 && count > 1) {
    picks.push([...emptyUnlocks].sort(() => Math.random() - 0.5)[0]);
  }

  const pool = [...PLAYER_AUGMENTS, ...activeTurretAugs].sort(() => Math.random() - 0.5);
  for (const a of pool) {
    if (picks.length >= count) break;
    if (!picks.find((p) => p.id === a.id)) picks.push(a);
  }
  return picks.slice(0, count).sort(() => Math.random() - 0.5);
}

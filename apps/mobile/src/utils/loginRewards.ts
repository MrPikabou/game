/**
 * DAILY LOGIN REWARDS
 * Resets every calendar month. Each day 1-30 has a reward.
 * Day 7: chest (random rewards pool)
 * Day 14: epic-or-higher guaranteed reward
 * Day 21: another chest
 * Day 28: legendary reward
 *
 * To add or change rewards, edit the MONTHLY_REWARDS array.
 */

export type LoginRewardType =
  | 'gold'
  | 'material'
  | 'chest_basic'
  | 'chest_epic'
  | 'chest_legendary';

export interface LoginReward {
  day: number;
  type: LoginRewardType;
  icon: string;
  label: string;
  goldAmount?: number;
  materialId?: string;
  materialQty?: number;
  /** Used for chest types — random pool of materialIds */
  chestPool?: string[];
  chestGold?: number;
  isSpecial?: boolean;
}

/** Basic chest: 3 random materials from common/rare pool + some gold */
export const BASIC_CHEST_POOL = [
  'iron_scrap',
  'copper_wire',
  'energy_cell',
  'bio_fiber',
  'nano_dust',
  'iron_scrap',
  'copper_wire',
  'energy_cell', // weighted toward common
];

/** Epic chest: guaranteed 1 epic+ material + gold */
export const EPIC_CHEST_POOL = [
  'plasma_core',
  'void_shard',
  'cryo_crystal',
  'neural_matrix',
  'quantum_filament',
  'plasma_core',
];

/** Legendary chest: 1 legendary material */
export const LEGENDARY_CHEST_POOL = [
  'titan_alloy',
  'stellar_fragment',
  'dark_matter_core',
  'void_shard',
];

export const MONTHLY_REWARDS: LoginReward[] = [
  { day: 1, type: 'gold', icon: '💰', label: '100 Gold', goldAmount: 100 },
  {
    day: 2,
    type: 'material',
    icon: '🔩',
    label: '3× Iron Scrap',
    materialId: 'iron_scrap',
    materialQty: 3,
  },
  { day: 3, type: 'gold', icon: '💰', label: '150 Gold', goldAmount: 150 },
  {
    day: 4,
    type: 'material',
    icon: '⚡',
    label: '2× Energy Cell',
    materialId: 'energy_cell',
    materialQty: 2,
  },
  { day: 5, type: 'gold', icon: '💰', label: '200 Gold', goldAmount: 200 },
  {
    day: 6,
    type: 'material',
    icon: '🧬',
    label: '2× Bio-Fiber',
    materialId: 'bio_fiber',
    materialQty: 2,
  },
  {
    day: 7,
    type: 'chest_basic',
    icon: '📦',
    label: 'Basic Chest',
    chestPool: BASIC_CHEST_POOL,
    chestGold: 300,
    isSpecial: true,
  },
  { day: 8, type: 'gold', icon: '💰', label: '250 Gold', goldAmount: 250 },
  {
    day: 9,
    type: 'material',
    icon: '🔬',
    label: '2× Nano Dust',
    materialId: 'nano_dust',
    materialQty: 2,
  },
  { day: 10, type: 'gold', icon: '💰', label: '300 Gold', goldAmount: 300 },
  {
    day: 11,
    type: 'material',
    icon: '🔌',
    label: '2× Copper Wire',
    materialId: 'copper_wire',
    materialQty: 2,
  },
  { day: 12, type: 'gold', icon: '💰', label: '350 Gold', goldAmount: 350 },
  {
    day: 13,
    type: 'material',
    icon: '🧪',
    label: '1× Plasma Core',
    materialId: 'plasma_core',
    materialQty: 1,
  },
  {
    day: 14,
    type: 'chest_epic',
    icon: '🎁',
    label: 'Epic Chest',
    chestPool: EPIC_CHEST_POOL,
    chestGold: 500,
    isSpecial: true,
  },
  { day: 15, type: 'gold', icon: '💰', label: '400 Gold', goldAmount: 400 },
  {
    day: 16,
    type: 'material',
    icon: '❄️',
    label: '1× Cryo Crystal',
    materialId: 'cryo_crystal',
    materialQty: 1,
  },
  { day: 17, type: 'gold', icon: '💰', label: '450 Gold', goldAmount: 450 },
  {
    day: 18,
    type: 'material',
    icon: '🧠',
    label: '1× Neural Matrix',
    materialId: 'neural_matrix',
    materialQty: 1,
  },
  { day: 19, type: 'gold', icon: '💰', label: '500 Gold', goldAmount: 500 },
  {
    day: 20,
    type: 'material',
    icon: '💎',
    label: '1× Void Shard',
    materialId: 'void_shard',
    materialQty: 1,
  },
  {
    day: 21,
    type: 'chest_basic',
    icon: '📦',
    label: 'Basic Chest',
    chestPool: BASIC_CHEST_POOL,
    chestGold: 600,
    isSpecial: true,
  },
  { day: 22, type: 'gold', icon: '💰', label: '600 Gold', goldAmount: 600 },
  {
    day: 23,
    type: 'material',
    icon: '🌀',
    label: '1× Quantum Filament',
    materialId: 'quantum_filament',
    materialQty: 1,
  },
  { day: 24, type: 'gold', icon: '💰', label: '700 Gold', goldAmount: 700 },
  {
    day: 25,
    type: 'material',
    icon: '⚗️',
    label: '1× Plasma Core ×2',
    materialId: 'plasma_core',
    materialQty: 2,
  },
  { day: 26, type: 'gold', icon: '💰', label: '800 Gold', goldAmount: 800 },
  {
    day: 27,
    type: 'material',
    icon: '🔮',
    label: '1× Stellar Fragment',
    materialId: 'stellar_fragment',
    materialQty: 1,
  },
  {
    day: 28,
    type: 'chest_legendary',
    icon: '👑',
    label: 'Legendary Chest',
    chestPool: LEGENDARY_CHEST_POOL,
    chestGold: 1000,
    isSpecial: true,
  },
  { day: 29, type: 'gold', icon: '💰', label: '1000 Gold', goldAmount: 1000 },
  {
    day: 30,
    type: 'material',
    icon: '🌟',
    label: '1× Dark Matter Core',
    materialId: 'dark_matter_core',
    materialQty: 1,
  },
];

export const LOGIN_REWARD_MAP: Record<number, LoginReward> = Object.fromEntries(
  MONTHLY_REWARDS.map((r) => [r.day, r])
);

/** Roll a chest and return the material id + gold earned */
export function openChest(reward: LoginReward): { materialIds: string[]; gold: number } {
  const pool = reward.chestPool ?? BASIC_CHEST_POOL;
  const gold = reward.chestGold ?? 0;
  // Pick 3 random materials for basic, 2 for epic, 1 for legendary
  const count = reward.type === 'chest_legendary' ? 1 : reward.type === 'chest_epic' ? 2 : 3;
  const materialIds: string[] = [];
  for (let i = 0; i < count; i++) {
    materialIds.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return { materialIds, gold };
}

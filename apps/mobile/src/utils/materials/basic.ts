/** BASIC MATERIALS — common drops from all enemy types */
import { MaterialDef } from './types';

export const BASIC_MATERIALS: MaterialDef[] = [
  {
    id: 'iron_scrap',
    name: 'Iron Scrap',
    icon: '🔩',
    rarity: 'common',
    category: 'scrap',
    description: 'Salvaged metal from destroyed enemies. Used in basic upgrades.',
    dropWeight: 60,
  },
  {
    id: 'copper_wire',
    name: 'Copper Wire',
    icon: '🔌',
    rarity: 'common',
    category: 'scrap',
    description: 'Conductive wiring salvaged from enemy drones.',
    dropWeight: 55,
  },
  {
    id: 'energy_cell',
    name: 'Energy Cell',
    icon: '🔋',
    rarity: 'common',
    category: 'energy',
    description: 'Small power cells dropped by defeated units.',
    dropWeight: 50,
  },
  {
    id: 'bio_fiber',
    name: 'Bio-Fiber',
    icon: '🧬',
    rarity: 'common',
    category: 'bio',
    description: 'Organic material from biological enemies. Used in defensive modules.',
    dropWeight: 45,
  },
  {
    id: 'nano_dust',
    name: 'Nano Dust',
    icon: '✨',
    rarity: 'common',
    category: 'scrap',
    description: 'Microscopic particles useful in precision calibration.',
    dropWeight: 40,
  },
];

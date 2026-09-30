/**
 * MODULE REGISTRY
 *
 * All modules are defined in their category files.
 * To add a new category: create a file, export ModuleDef[], and add it to ALL_MODULE_DEFS below.
 * To add modules to an existing category: open that category file and add an entry.
 */

export * from './types';
export { OFFENSIVE_DAMAGE } from './offensive-damage';
export { OFFENSIVE_SPEED } from './offensive-speed';
export { UTILITY } from './utility';
export { DEFENSIVE } from './defensive';
export { CONTROL } from './control';
export { PASSIVE } from './passive';
export { EXOTIC } from './exotic';

import { OFFENSIVE_DAMAGE } from './offensive-damage';
import { OFFENSIVE_SPEED } from './offensive-speed';
import { UTILITY } from './utility';
import { DEFENSIVE } from './defensive';
import { CONTROL } from './control';
import { PASSIVE } from './passive';
import { EXOTIC } from './exotic';
import { ModuleDef } from './types';

/** Complete flat list of all available modules — built at startup */
export const ALL_MODULE_DEFS: ModuleDef[] = [
  ...OFFENSIVE_DAMAGE,
  ...OFFENSIVE_SPEED,
  ...UTILITY,
  ...DEFENSIVE,
  ...CONTROL,
  ...PASSIVE,
  ...EXOTIC,
];

/** Look up a module definition by id */
export function getModuleDef(id: string): ModuleDef | undefined {
  return ALL_MODULE_DEFS.find((m) => m.id === id);
}

/** Get all modules usable by a specific target ('player' or TurretTypeKey) */
export function getModulesFor(target: 'player' | string): ModuleDef[] {
  return ALL_MODULE_DEFS.filter((m) => {
    if (m.applicableTo === 'all') return true;
    if (m.applicableTo === 'player') return target === 'player';
    return Array.isArray(m.applicableTo) && m.applicableTo.includes(target as never);
  });
}

import type { CurriculumLevel } from '../curriculum.types';
import { level1 } from './level1.keyboardGeography';
import { level2 } from './level2.fingerTechnique';
import { level3 } from './level3.rhythmTiming';
import { level4 } from './level4.scalesPatterns';
import { level5 } from './level5.chordsHarmony';
import { level6 } from './level6.musicReading';
import { level7 } from './level7.playingPatterns';
import { level8 } from './level8.performanceFluency';

/**
 * The eight-level path, in order.
 *
 * ── Adding a level ────────────────────────────────────────────────────
 * 1. Create data/level<N>.<slug>.ts and export `defineLevel({ order: N, … })`
 * 2. Add it to the array below
 *
 * Nothing else changes: the registry indexes it, the pages list it, and the
 * routes already accept any level id.
 */
export const REGISTERED_LEVELS: readonly CurriculumLevel[] = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
];

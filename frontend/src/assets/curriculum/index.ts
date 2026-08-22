import level1 from './level-1.webp';
import level1Thumb from './level-1-thumb.webp';
import level2 from './level-2.webp';
import level2Thumb from './level-2-thumb.webp';
import level3 from './level-3.webp';
import level3Thumb from './level-3-thumb.webp';
import level4 from './level-4.webp';
import level4Thumb from './level-4-thumb.webp';
import level5 from './level-5.webp';
import level5Thumb from './level-5-thumb.webp';
import level6 from './level-6.webp';
import level6Thumb from './level-6-thumb.webp';
import level7 from './level-7.webp';
import level7Thumb from './level-7-thumb.webp';
import level8 from './level-8.webp';
import level8Thumb from './level-8-thumb.webp';

/**
 * The level mind-maps.
 *
 * Each level ships in two sizes so a page only pays for what it shows:
 * `thumb` (800px wide) for card grids, `full` (1536px) for the level page.
 * Vite fingerprints and copies both, so importing them here is what puts
 * them in the build — a stray file in this folder ships nothing.
 *
 * ── Adding one ────────────────────────────────────────────────────────
 * 1. Drop level-<N>.webp and level-<N>-thumb.webp in this folder
 * 2. Import them above and add a row to LEVEL_DIAGRAMS
 */
export interface LevelDiagram {
  /** Longest side 800px — card grids and small screens. */
  thumb: string;
  /** Full-resolution original — the level page. */
  full: string;
  width: number;
  height: number;
  /** Intrinsic ratio, so a placeholder can hold the exact space. */
  aspectRatio: number;
}

/**
 * Landscape is the house style, but not every map fits it — L4 is portrait —
 * so the real dimensions are recorded per level instead of assumed.
 */
function diagram(full: string, thumb: string, width: number, height: number): LevelDiagram {
  return { full, thumb, width, height, aspectRatio: width / height };
}

/** Level id → its diagram. Keys match CurriculumLevel.id. */
export const LEVEL_DIAGRAMS: Readonly<Record<string, LevelDiagram>> = {
  L1: diagram(level1, level1Thumb, 1536, 1024),
  L2: diagram(level2, level2Thumb, 1536, 1024),
  L3: diagram(level3, level3Thumb, 1536, 1024),
  L4: diagram(level4, level4Thumb, 1024, 1536),
  L5: diagram(level5, level5Thumb, 1536, 1024),
  L6: diagram(level6, level6Thumb, 1536, 1024),
  L7: diagram(level7, level7Thumb, 1536, 1024),
  L8: diagram(level8, level8Thumb, 1536, 1024),
};

/**
 * The diagram for a level, or undefined when none has been drawn yet.
 *
 * Undefined is a normal answer, not an error: a level added before its map
 * exists simply renders without one.
 */
export function getLevelDiagram(levelId: string | undefined | null): LevelDiagram | undefined {
  return levelId ? LEVEL_DIAGRAMS[levelId.trim().toUpperCase()] : undefined;
}

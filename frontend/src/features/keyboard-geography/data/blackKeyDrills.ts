import type { Letter } from '@/features/music-theory';
import { LANDMARK_RULES, groupLabel } from './blackKeys';

/** Which way a black-key drill can be asked. */
export type GroupDirection = 'count' | 'find';

export interface GroupDrillConfig {
  id: string;
  /** Group shapes this drill deals in. */
  sizes: readonly (2 | 3)[];
  directions: readonly GroupDirection[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** 1.2.1 and 1.2.2 — the two landmark shapes. */
export const GROUP_DRILLS: Readonly<Record<string, GroupDrillConfig>> = {
  two: {
    id: 'two',
    sizes: [2],
    // Nothing to tell apart yet, so the task is locating the shape, not counting it.
    directions: ['find'],
    goal: 'See a group of 2 black keys as one shape, anywhere on the board.',
    steps: [
      'Find a pair of black keys and tap either of them.',
      'Say "two black keys" out loud as you do it.',
      'Move around — hit every pair on the board, not the same one twice.',
    ],
    watchFor:
      'Counting single black keys to check. A pair should register as one shape, the way a word does rather than its letters.',
  },
  both: {
    id: 'both',
    sizes: [2, 3],
    directions: ['count', 'find'],
    goal: 'Tell the group of 2 from the group of 3 instantly, in both directions.',
    steps: [
      'Count mode: a group lights up — answer 2 or 3.',
      'Find mode: you are asked for a shape — tap any group of that size.',
      'Say the answer before you tap it.',
    ],
    watchFor:
      'Looking at the whole keyboard to work out where you are. The shape alone tells you, wherever it sits.',
  },
};

export function getGroupDrill(id: string): GroupDrillConfig {
  const config = GROUP_DRILLS[id];
  if (!config) throw new Error(`Unknown group drill: ${id}`);
  return config;
}

export interface LandmarkDrillConfig {
  id: string;
  /** The white keys this drill asks for. */
  letters: readonly Letter[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/**
 * 1.2.3 – 1.2.9 — one white key per drill, found from its landmark.
 *
 * The copy is generated from the rules rather than written out seven times, so
 * the wording of "left of the group of 2" exists in exactly one place and the
 * screens cannot drift from the map they teach.
 */
function landmarkDrill(letter: Letter): LandmarkDrillConfig {
  const rule = LANDMARK_RULES[letter];

  return {
    id: letter,
    letters: [letter],
    goal: `${letter} straight from the landmark: ${rule.where.toLowerCase()}.`,
    steps: [
      `Find a ${groupLabel(rule.group)} anywhere on the keyboard.`,
      rule.detail,
      `Press it, say "${letter}" out loud, then find ${letter} again in another octave.`,
    ],
    watchFor:
      'Counting up from C. The group is the anchor — the note sits right against it, wherever you are on the board.',
  };
}

export const LANDMARK_DRILLS: Readonly<Record<Letter, LandmarkDrillConfig>> = {
  C: landmarkDrill('C'),
  D: landmarkDrill('D'),
  E: landmarkDrill('E'),
  F: landmarkDrill('F'),
  G: landmarkDrill('G'),
  A: landmarkDrill('A'),
  B: landmarkDrill('B'),
};

export function getLandmarkDrill(letter: Letter): LandmarkDrillConfig {
  return LANDMARK_DRILLS[letter];
}

/** How 1.2.10 – 1.2.12 label the five black keys. */
export type BlackNaming = 'position' | 'sharp' | 'flat';

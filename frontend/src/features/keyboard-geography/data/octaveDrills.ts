import type { Letter } from '@/features/music-theory';
import { LANDMARK_RULES } from './blackKeys';
import { NATURALS } from './naturals';

/** How a sweep gives its target: by naming it, or by lighting one key of it. */
export type SweepPrompt = 'name' | 'key';

export interface SweepDrillConfig {
  id: string;
  /** One letter fixes the target; several draw a fresh one every pass. */
  letters: readonly Letter[];
  /**
   * Letters offered alongside the target once it is automatic.
   *
   * 1.3.2 asks for C and F mixed together — the point being that the two
   * landmarks have to be told apart at speed, not just found one at a time.
   */
  mixLetters?: readonly Letter[];
  /** Which way the target is given to start with; the screen offers both. */
  prompt: SweepPrompt;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/**
 * 1.3.1 and 1.3.2 — sweep one named letter across the whole board.
 *
 * The copy is generated from the landmark rules of bucket 1.2 rather than typed
 * out per letter, so "left of the group of 2" is written in exactly one place
 * and the octave drills cannot drift from the map they were built on.
 */
function letterSweep(letter: Letter): SweepDrillConfig {
  const rule = LANDMARK_RULES[letter];

  return {
    id: letter.toLowerCase(),
    letters: [letter],
    prompt: 'name',
    goal: `Every ${letter} on the board, in order, without hunting for any of them.`,
    steps: [
      `Start from the lowest ${letter} — ${rule.where.toLowerCase()}.`,
      `Move up an octave at a time. Every ${letter} sits against the same landmark.`,
      'Then sweep back down, and run both directions on your real keyboard.',
    ],
    watchFor: `Counting white keys from one ${letter} to the next. Jump to the landmark instead — the shape repeats, so the distance never has to be measured.`,
  };
}

/** 1.3.4 — a key is lit, find that same note in every other octave. */
const SAME_NOTE: SweepDrillConfig = {
  id: 'same-note',
  letters: NATURALS,
  prompt: 'key',
  goal: 'One lit key → the same note everywhere else on the board.',
  steps: [
    'Name the lit key to yourself first — that is bucket 1.1 doing its job.',
    'Then press that same letter in every other octave, low to high.',
    'Play them one after another so you hear the same note at different heights.',
  ],
  watchFor:
    'Pressing the neighbours of the lit key. An octave is the same letter — if the landmark under your finger looks different, it is the wrong key.',
};

export const SWEEP_DRILLS: Readonly<Record<string, SweepDrillConfig>> = {
  c: letterSweep('C'),
  // F is the second landmark, so it is the one that gets mixed with the first.
  f: { ...letterSweep('F'), mixLetters: ['C'] },
  'same-note': SAME_NOTE,
};

export function getSweepDrill(id: string): SweepDrillConfig {
  const config = SWEEP_DRILLS[id];
  if (!config) throw new Error(`Unknown sweep drill: ${id}`);
  return config;
}

/** Which way a jump drill starts out. */
export type JumpDirection = 'up' | 'down' | 'mixed';

export interface JumpDrillConfig {
  id: string;
  /** Letters the anchor key can be. */
  letters: readonly Letter[];
  /** Jump sizes in octaves, smallest first. The first one is the default. */
  distances: readonly number[];
  /** Direction the drill opens on — the rest stay one tap away. */
  initialDirection: JumpDirection;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/**
 * 1.3.3 and 1.3.6 — land the key one octave from the lit one.
 *
 * The same screen twice: C alone first, because C is the letter with a landmark
 * on both sides of it, then all seven, where the jump has to be measured by the
 * shape under the hand rather than recognised.
 */
export const JUMP_DRILLS: Readonly<Record<string, JumpDrillConfig>> = {
  'c-to-c': {
    id: 'c-to-c',
    letters: ['C'],
    distances: [1],
    initialDirection: 'up',
    goal: 'C to the next C — one octave, felt as a distance rather than counted.',
    steps: [
      'Play the lit C, then the C an octave above it. Both, in that order.',
      'Notice the shape: the next C is the white key left of the next group of 2.',
      'One octave is 7 white keys, 12 keys in all — know the numbers, then stop counting them.',
      'Switch to Down, then Mixed. Same distance, other way.',
    ],
    watchFor:
      'Counting seven white keys each time. After a few passes the hand should know the width of an octave without measuring it.',
  },
  any: {
    id: 'any',
    letters: NATURALS,
    // Two octaves is the jump that stops the hand from stepping there.
    distances: [1, 2],
    initialDirection: 'mixed',
    goal: 'Any note → the same note one octave away, either direction, first try.',
    steps: [
      'Read the lit key, then jump — do not walk up the white keys to get there.',
      'Play both keys so the ear confirms what the eye chose.',
      'Move to 2 octaves once one is reliable, then Mixed.',
      'On your real keyboard, make the same jump with one hand, thumb to thumb.',
    ],
    watchFor:
      'Landing a key either side of the target. The landing key must sit against the same landmark as the one you left.',
  },
};

export function getJumpDrill(id: string): JumpDrillConfig {
  const config = JUMP_DRILLS[id];
  if (!config) throw new Error(`Unknown jump drill: ${id}`);
  return config;
}

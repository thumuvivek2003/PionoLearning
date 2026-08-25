import type { RunNote } from './intervalRuns';

/** How a run is chosen for each attempt. */
export type RunSource =
  /** Always the same shape; only the start note moves. */
  | 'fixed'
  /** A jump of a random size, drawn per attempt. */
  | 'random';

export interface IntervalDrillConfig {
  id: string;
  source: RunSource;
  /** The shape, for a fixed drill. */
  run?: readonly RunNote[];
  /** How many notes a random run has. */
  length?: number;
  /** Interval sizes a random run may use, in white-key steps. */
  sizes?: readonly number[];
  /** Start notes offered; every white key when absent. */
  starts?: readonly string[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** The sizes the bucket works in: a 2nd up to a 5th. */
const JUMP_SIZES: readonly number[] = [1, 2, 3, 4];

/** 1 → 3, 1 → 4, 1 → 5: one finger to another, a fixed distance apart. */
function reach(id: string, steps: number, finger: 3 | 4 | 5): IntervalDrillConfig {
  const name = steps === 2 ? 'third' : steps === 3 ? 'fourth' : 'fifth';

  return {
    id,
    source: 'fixed',
    run: [
      { offset: 0, finger: 1 },
      { offset: steps, finger },
    ],
    goal: `1 → ${finger}: the ${name}, recognised as a distance rather than counted out.`,
    steps: [
      `Thumb on the start, finger ${finger} on the target. Play them in order.`,
      'The start moves every attempt — C, then D, then E. The distance never changes.',
      'Say the destination before you play it. Eyes, brain, hand — not eyes, fingers.',
    ],
    watchFor:
      'Counting up from the start note. A distance you have to count is a distance you do not know yet, and the panel below will show it as a slow one.',
  };
}

/**
 * Bucket 2.4 as data.
 *
 * Every practice is the same act — put your hand somewhere and cover a distance
 * — so they differ only in what the distance is and how much of it is decided
 * for you. The last one turns the whole thing round: the shape stays fixed and
 * the *start* is what varies, which is what makes a pattern transferable rather
 * than memorised.
 */
export const INTERVAL_DRILLS: Readonly<Record<string, IntervalDrillConfig>> = {
  'one-three': reach('one-three', 2, 3),
  'one-four': reach('one-four', 3, 4),
  'one-five': reach('one-five', 4, 5),
  'stacked-thirds': {
    id: 'stacked-thirds',
    source: 'fixed',
    run: [
      { offset: 0, finger: 1 },
      { offset: 2, finger: 3 },
      { offset: 4, finger: 5 },
    ],
    goal: '1 → 3 → 5: two thirds stacked, the shape under every broken chord you will play.',
    steps: [
      'C, E, G from the start note given — skip, skip.',
      'Then try it as the reference does: up and back, C-E-G-E-C, at your own keyboard.',
      'The start moves each attempt: D gives D-F-A, E gives E-G-B.',
    ],
    watchFor:
      'Reading the three notes separately. It is one shape — skip, skip — and it stays that shape wherever it starts.',
  },
  'reverse-thirds': {
    id: 'reverse-thirds',
    source: 'fixed',
    run: [
      { offset: 0, finger: 5 },
      { offset: -2, finger: 3 },
      { offset: -4, finger: 1 },
    ],
    goal: '5 → 3 → 1: the same shape downward, where nothing can be anticipated.',
    steps: [
      'Start on the note given and work down: G-E-C, A-F-D, B-G-E.',
      'Downward is harder because the destination is behind you — that is the point.',
      'Alternate with the upward run at your keyboard: C-E-G-E-C, then G-E-C-E-G.',
    ],
    watchFor:
      'Being much slower down than up. Compare the two practices’ average times; the gap between them is what this one is closing.',
  },
  'random-two': {
    id: 'random-two',
    source: 'random',
    length: 2,
    sizes: JUMP_SIZES,
    goal: 'Two notes, a distance you were not expecting — see it, name it, then play it.',
    steps: [
      'Read the start, read the interval, find the destination, then play.',
      'Do not press until you know where you are going.',
      'The panel names the intervals you are slowest on; those are the ones to repeat.',
    ],
    watchFor:
      'Playing first and checking afterwards. That trains eyes-to-fingers, which is the habit this practice is meant to replace.',
  },
  'random-three': {
    id: 'random-three',
    source: 'random',
    length: 3,
    sizes: JUMP_SIZES,
    goal: 'Three notes, two unpredictable distances — melodies do not move politely.',
    steps: [
      'Process the first jump, then the second, without stopping in between.',
      'Pause after the run and ask whether you actually landed where you meant to.',
      'Then take the pause out and let it run: C-E-A, D-A-F, E-C-G.',
    ],
    watchFor:
      'The second jump collapsing because the first one used all your attention. If that happens, slow the whole run down rather than rushing the recovery.',
  },
  transfer: {
    id: 'transfer',
    source: 'fixed',
    run: [
      { offset: 0, finger: 1 },
      { offset: 2, finger: 3 },
    ],
    goal: 'Same fingers, different keys: 1 → 3 is a relationship, not the notes C and E.',
    steps: [
      'The shape never changes; the start note does, every single attempt.',
      'Think "skip one white key", never "C to E".',
      'The panel scores by start note here, so it will name the ones your hand does not know yet.',
    ],
    watchFor:
      'Being quick from C and slow from B or F. That is the tell that the pattern is still attached to one place on the board.',
  },
};

export function getIntervalDrill(id: string): IntervalDrillConfig {
  const config = INTERVAL_DRILLS[id];
  if (!config) throw new Error(`Unknown interval drill: ${id}`);
  return config;
}

export { JUMP_SIZES };

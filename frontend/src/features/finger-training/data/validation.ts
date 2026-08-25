/**
 * Quality control for everything the level taught.
 *
 * The reference's argument is that repetition strengthens whatever movement you
 * repeat, correct or not — so the drill's job here is not to hand out more
 * repetitions but to stop the wrong ones. Two ideas do most of that work: a run
 * shortened until it comes out right, and a rule about when to shorten it.
 */

/** How many times one spot may go wrong before the drill intervenes. */
export const ERROR_LIMIT = 3;

/** Clean passes owed at a shortened length before it grows back. */
export const CLEAN_TO_GROW = 2;

/** The shortest a repaired run is allowed to get. */
export const MIN_LENGTH = 3;

export interface RepairState {
  /** How many notes the run is currently cut to; null means full length. */
  length: number | null;
  /** Clean passes banked at this length. */
  clean: number;
  /** Misses on the spot being repaired. */
  errors: number;
}

export const NO_REPAIR: RepairState = { length: null, clean: 0, errors: 0 };

/**
 * What a miss does to the run.
 *
 * Three misses in the same place is the reference's line for "stop" — so that
 * is where the run gets cut back, to the notes before the trouble plus one.
 */
export function afterMiss(state: RepairState, at: number, full: number): RepairState {
  const errors = state.errors + 1;
  if (errors < ERROR_LIMIT) return { ...state, errors };

  return {
    length: Math.max(MIN_LENGTH, Math.min(state.length ?? full, at + 1)),
    clean: 0,
    errors: 0,
  };
}

/**
 * What a clean pass does to it.
 *
 * Two in a row and the run grows back a note at a time, so the rebuild is
 * earned in the same currency the cut was made in.
 */
export function afterCleanPass(state: RepairState, full: number): RepairState {
  if (state.length === null) return { ...NO_REPAIR };

  const clean = state.clean + 1;
  if (clean < CLEAN_TO_GROW) return { ...state, clean, errors: 0 };

  const grown = state.length + 1;
  return grown >= full ? { ...NO_REPAIR } : { length: grown, clean: 0, errors: 0 };
}

/** What the drill says while a run is cut back. */
export function repairNote(state: RepairState, full: number): string | null {
  if (state.length === null) return null;
  return `Cut back to ${state.length} of ${full} notes — ${CLEAN_TO_GROW - state.clean} clean ${
    CLEAN_TO_GROW - state.clean === 1 ? 'pass' : 'passes'
  } to grow it back`;
}

/**
 * What to check while you play — the reference's inspection list.
 *
 * Rotated one item at a time rather than shown as a wall of text, because the
 * point of the eyes-open practice is to look for *one* thing and actually see
 * it.
 */
export const INSPECTIONS: readonly string[] = [
  'Is the hand still in position, or has it drifted?',
  'Are the fingers landing in the middle of the keys?',
  'Is anything stretching that could have moved instead?',
  'Is the thumb hanging under the palm, or resting beside it?',
  'Is any finger collapsing at the knuckle?',
  'Are you catching the edges of neighbouring keys?',
  'Are the fingers lifting higher than they need to?',
  'Are the shoulders and wrist still loose?',
];

/** What to look and listen for in a recording, split the way a camera sees it. */
export const REVIEW_POINTS: Readonly<Record<'hands' | 'sound', readonly string[]>> = {
  hands: [
    'Fingers lifting further than the movement needs',
    'The wrist rising, dropping or twisting at a crossing',
    'Tension in the hand between notes',
    'A finger collapsing as it takes weight',
    'The whole arm moving where a finger would do',
    'A hesitation before one particular note',
  ],
  sound: [
    'Notes that are louder than their neighbours by accident',
    'Gaps where the line should be continuous',
    'A rhythm that speeds up as it goes',
    'The same note arriving late every time',
    'Notes that did not sound at all',
  ],
};

/** Picks the inspection to show, so it changes as the run goes on. */
export function inspectionFor(pass: number): string {
  return INSPECTIONS[pass % INSPECTIONS.length] as string;
}

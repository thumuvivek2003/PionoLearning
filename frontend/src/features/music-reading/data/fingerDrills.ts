import type { Clef, Step } from '../reading.types';
import { TOP_STEP, stepRange } from './staff';

/**
 * 6.8 as data — the numbers printed over the notes.
 *
 * Fingering is the one thing on the page that is not about pitch at all, and it
 * is the part beginners skip. What can honestly be tested on a screen is the
 * *reading* half: which finger is assigned to this note, which note does a given
 * finger cover, and where does the hand have to move when the printed fingering
 * says it does. Whether you physically used that finger is something only you
 * can check, and every practice here says so rather than pretending.
 */
export type Hand = 'right' | 'left';

/** The numbering, which is the same for both hands. */
export const FINGER_NAMES: readonly string[] = ['thumb', 'index', 'middle', 'ring', 'little'];

export function fingerName(finger: number): string {
  return FINGER_NAMES[finger - 1] ?? String(finger);
}

export function handName(hand: Hand): string {
  return hand === 'right' ? 'right hand' : 'left hand';
}

/** What a fingering practice asks. */
export type FingerTask =
  /** Which finger is this number? */
  | 'name'
  /** Which finger plays the marked note? */
  | 'which-finger'
  /** Which note does a named finger play? */
  | 'which-note'
  /** Press the note that finger covers. */
  | 'play-finger';

export interface FingerDrillConfig {
  id: string;
  tasks: readonly FingerTask[];
  hands: readonly Hand[];
  clef: Clef;
  /** The steps the printed run covers. */
  steps: readonly Step[];
  /**
   * The fingering printed under the run.
   *
   * Written out rather than derived: a fingering is a choice a player or an
   * editor makes, not a fact about the notes, and pretending otherwise would be
   * the one dishonest thing this bucket could do.
   */
  fingering: readonly number[];
  /** What the fingering is called, for the prompt. */
  patternName: string;
  allowanceMs: number;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

/** A five-finger position: one finger per note, in order. */
const FIVE: readonly number[] = [1, 2, 3, 4, 5];
/** The scale fingering level 4 drilled, for the right hand going up. */
const SCALE_RH: readonly number[] = [1, 2, 3, 1, 2, 3, 4, 5];
/** And the left hand, which crosses somewhere else. */
const SCALE_LH: readonly number[] = [5, 4, 3, 2, 1, 3, 2, 1];

const base = {
  hands: ['right', 'left'] as readonly Hand[],
  clef: 'treble' as Clef,
  allowanceMs: 4000,
} as const;

export const FINGER_DRILLS: Readonly<Record<string, FingerDrillConfig>> = {
  'finger-numbers': {
    ...base,
    id: 'finger-numbers',
    tasks: ['name'],
    steps: stepRange(0, 4),
    fingering: FIVE,
    patternName: '1 to 5',
    allowanceMs: 3000,
    goal: '1 is always the thumb and 5 is always the little finger — in both hands.',
    guidance: [
      'A number is given; name the finger. Nothing to play.',
      'The numbering does not mirror. Finger 1 is the thumb of whichever hand you are using.',
      'This is the smallest thing in the level and everything printed above a note depends on it.',
    ],
    watchFor:
      'Mirroring the numbers for the left hand. It is the most common misunderstanding there is, and it makes every printed fingering wrong.',
  },
  'right-hand': {
    ...base,
    id: 'right-hand',
    tasks: ['which-finger', 'which-note', 'play-finger'],
    hands: ['right'],
    steps: stepRange(0, 4),
    fingering: FIVE,
    patternName: '1-2-3-4-5 rising',
    goal: 'A right-hand five-finger position: thumb on the lowest note, little finger on the highest.',
    guidance: [
      'The fingering is printed under the run. Read which finger covers which note.',
      'Rising notes take rising numbers in the right hand. That is the whole pattern.',
      'The app cannot tell which finger you actually used — the reading is what it checks.',
    ],
    watchFor:
      'Reading the number as a note. The number under a note says which finger, never which key.',
  },
  'left-hand': {
    ...base,
    id: 'left-hand',
    tasks: ['which-finger', 'which-note', 'play-finger'],
    hands: ['left'],
    clef: 'bass',
    steps: stepRange(0, 4),
    fingering: [5, 4, 3, 2, 1],
    patternName: '5-4-3-2-1 rising',
    goal: 'A left-hand five-finger position: the little finger takes the lowest note.',
    guidance: [
      'Rising notes take falling numbers in the left hand, because the hand faces the other way.',
      'The numbering has not changed — 1 is still the thumb. What changed is which note the thumb reaches.',
      'Drawn in bass clef, which is where left-hand music is written.',
    ],
    watchFor:
      'Carrying the right hand’s pattern over. The numbers are the same and the order they appear in is reversed.',
  },
  'five-finger': {
    ...base,
    id: 'five-finger',
    tasks: ['which-note', 'play-finger'],
    steps: stepRange(0, 4),
    fingering: FIVE,
    patternName: 'a five-finger position',
    allowanceMs: 3000,
    goal: 'Five notes under five fingers, with no hand movement at all.',
    guidance: [
      'The hand sits still and each finger owns one note. Which note does finger 4 have?',
      'Both hands, so the mapping has to be worked out rather than remembered from one.',
      'Everything harder than this involves the hand moving; this is the position it moves from.',
    ],
    watchFor:
      'Counting up from the thumb every time. Finger 4 should arrive as a note, not as "one, two, three, four".',
  },
  'scale-fingering': {
    ...base,
    id: 'scale-fingering',
    tasks: ['which-finger', 'which-note'],
    steps: stepRange(0, 7),
    fingering: SCALE_RH,
    patternName: '1-2-3-1-2-3-4-5',
    goal: 'Eight notes under five fingers — the thumb has to turn under, and the printed number says when.',
    guidance: [
      'The fingering repeats 1 after the third finger. That 1 is the thumb crossing under.',
      'This is level 4’s scale fingering as it appears on a page rather than under your hand.',
      'Where the number drops back to 1 is the moment the hand moves.',
    ],
    watchFor:
      'Reading past the crossing. The second 1 is not a mistake in the printing; it is the instruction.',
  },
  'melody-fingering': {
    ...base,
    id: 'melody-fingering',
    tasks: ['which-finger', 'play-finger'],
    steps: [0, 2, 4, 3, 1, 2, 4, 5],
    fingering: [1, 3, 5, 4, 2, 3, 5, 5],
    patternName: 'a melody with leaps',
    goal: 'Fingering over a line that leaps — where the printed number stops being obvious.',
    guidance: [
      'The notes skip about, so the fingering does too. Read it rather than assuming it.',
      'A leap up of a third often takes a finger two higher; often, not always.',
      'This is why editors print fingering at all: the obvious choice is frequently wrong.',
    ],
    watchFor:
      'Assuming rising notes mean rising fingers. Over a leaping line that assumption runs out of fingers almost immediately.',
  },
  'fingering-reading': {
    ...base,
    id: 'fingering-reading',
    tasks: ['which-finger', 'which-note', 'play-finger', 'name'],
    steps: [0, 2, 4, 3, 1, 2, 4, 5],
    fingering: [1, 3, 5, 4, 2, 3, 5, 5],
    patternName: 'notes and fingering together',
    allowanceMs: 3000,
    goal: 'Both at once: which note it is, and which finger the page says to use.',
    guidance: [
      'Every question of the bucket mixed, on a leaping line in both hands.',
      'Reading the note and reading the number are separate jobs done at the same moment.',
      'Three seconds. The tasks are scored apart, so whichever half lags gets named.',
    ],
    watchFor:
      'Reading the notes fluently and ignoring the numbers. Fingering skipped is the reason a passage stops working at speed.',
  },
};

export function getFingerDrill(id: string): FingerDrillConfig {
  const config = FINGER_DRILLS[id];
  if (!config) throw new Error(`Unknown finger drill: ${id}`);
  return config;
}

/** The scale fingerings, exported so the checks can hold them to level 4's. */
export const SCALE_FINGERINGS: Readonly<Record<Hand, readonly number[]>> = {
  right: SCALE_RH,
  left: SCALE_LH,
};

/** True when a printed fingering never asks for a finger that does not exist. */
export function fingeringIsReachable(fingering: readonly number[]): boolean {
  return fingering.every((finger) => finger >= 1 && finger <= 5);
}

/** Where the thumb turns under, if it does — the moment the hand moves. */
export function crossingsIn(fingering: readonly number[]): readonly number[] {
  return fingering.flatMap((finger, index) => {
    if (index === 0) return [];
    const previous = fingering[index - 1] as number;
    return finger === 1 && previous > 1 ? [index] : [];
  });
}

export const STAFF_TOP = TOP_STEP;

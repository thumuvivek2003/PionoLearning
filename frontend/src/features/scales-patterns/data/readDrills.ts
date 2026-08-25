import { RELATIVE_PAIRS, MAJOR, MINOR } from './relatives';
import type { KeyRef } from './relatives';

/**
 * 4.10 as data — the scales read rather than named.
 *
 * Every earlier bucket says which key it is and asks what follows. This one
 * turns that round: a run of notes is printed and the key, the root, the
 * missing note or the direction has to come back out of it. That is the
 * contest question, and it is a different skill from construction — you can
 * build D major from the formula all day and still not recognise it on sight.
 *
 * Everything here is timed. A recognition answer that takes eight seconds is
 * not recognition, so the allowance is part of the practice rather than a
 * setting, and running out is graded exactly like a wrong answer.
 */

/** What a printed run is asked about. */
export type ReadTask =
  /** Press the note the run is built on. */
  | 'root'
  /** How many sharps or flats the run carries. */
  | 'accidentals'
  /** Press the note behind the blank. */
  | 'missing'
  /** Is this fragment climbing or falling? */
  | 'direction'
  /** Which key is this — including which of a relative pair. */
  | 'name-key'
  /** Major or minor, read from the notes rather than heard. */
  | 'quality';

export interface ScaleReadConfig {
  id: string;
  tasks: readonly ReadTask[];
  /** Keys the printed run is drawn from. */
  keys: readonly KeyRef[];
  /** Which way a printed run may go. */
  directions: readonly ('up' | 'down')[];
  /** How many notes start hidden on the missing task. */
  gaps: number;
  /** True when the number of blanks climbs with a clean streak. */
  ladder: boolean;
  /** The contest allowance in ms. 0 turns the clock off. */
  allowanceMs: number;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

/**
 * Every key the level has built, majors and their relative minors.
 *
 * Derived from the relative pairs so the pool cannot drift from the keys the
 * earlier buckets taught — and so a minor is always in play beside the major
 * that shares its notes, which is the pairing the naming task turns on.
 */
export const RECOGNITION_KEYS: readonly KeyRef[] = RELATIVE_PAIRS.flatMap((pair) => [
  { root: pair.major, scale: MAJOR },
  { root: pair.minor, scale: MINOR },
]);

/** The handful of keys a beginner meets first, for the practices that start narrow. */
const CORE_KEYS: readonly KeyRef[] = [
  { root: 'C', scale: MAJOR },
  { root: 'G', scale: MAJOR },
  { root: 'D', scale: MAJOR },
  { root: 'A', scale: MAJOR },
  { root: 'F', scale: MAJOR },
  { root: 'A', scale: MINOR },
  { root: 'E', scale: MINOR },
  { root: 'D', scale: MINOR },
];

const BOTH_WAYS: readonly ('up' | 'down')[] = ['up', 'down'];

export const SCALE_READ_DRILLS: Readonly<Record<string, ScaleReadConfig>> = {
  'start-note': {
    id: 'start-note',
    tasks: ['root'],
    keys: RECOGNITION_KEYS,
    directions: ['up'],
    gaps: 1,
    ladder: false,
    allowanceMs: 2000,
    goal: 'A run of notes appears; put a finger on the note it is built on, inside two seconds.',
    guidance: [
      'The run is printed, not named. Press its root on the keyboard.',
      'Two things are being timed at once: reading the note name, and knowing where that key is.',
      'Tighten the allowance as it gets reliable. The contest standard is under a second.',
    ],
    watchFor:
      'Reading the whole run before answering. The first note is the answer; everything after it is there to slow you down.',
  },
  'spot-accidentals': {
    id: 'spot-accidentals',
    tasks: ['accidentals'],
    keys: RECOGNITION_KEYS,
    directions: BOTH_WAYS,
    gaps: 1,
    ladder: false,
    allowanceMs: 3000,
    goal: 'See the sharps and flats in a printed run and count them without reading note by note.',
    guidance: [
      'How many accidentals does the run carry? Count what is altered, not what is black.',
      'Accidentals are the fastest clue to a key — two sharps narrows it to D major or B minor and nothing else.',
      'Runs come both ways round, so the answer cannot be read off the shape of the line.',
    ],
    watchFor:
      'Counting the same accidental twice when it appears in both octaves. It is one accidental, however many times it is printed.',
  },
  'missing-note': {
    id: 'missing-note',
    tasks: ['missing'],
    keys: CORE_KEYS,
    directions: BOTH_WAYS,
    gaps: 1,
    ladder: true,
    allowanceMs: 3000,
    goal: 'A note is blanked out of a run. Supply it — and keep supplying it as more of the run disappears.',
    guidance: [
      'One blank to start. Five clean answers and a second blank appears, up to three.',
      'A miss takes a blank away again, so the practice sits at the hardest level you can actually hold.',
      'The scale is not named. What tells you the answer is the notes still showing.',
    ],
    watchFor:
      'Rebuilding the scale from its root each time. That works with one blank and falls apart with three, which is what the ladder is for.',
  },
  'ascending': {
    id: 'ascending',
    tasks: ['direction', 'missing'],
    keys: CORE_KEYS,
    directions: ['up'],
    gaps: 1,
    ladder: true,
    allowanceMs: 2000,
    goal: 'Runs that climb: name the direction on sight, and fill what is missing on the way up.',
    guidance: [
      'Fragments arrive four notes long; say which way they run before you read them properly.',
      'Then the same scales with a note blanked, always ascending.',
      'This is the direction your hands already know. It is here to be the fast one.',
    ],
    watchFor:
      'Treating this as the easy half and skipping it. The point of drilling up on its own is to have something to compare down against.',
  },
  'descending': {
    id: 'descending',
    tasks: ['direction', 'missing'],
    keys: CORE_KEYS,
    directions: ['down'],
    gaps: 1,
    ladder: true,
    allowanceMs: 2000,
    goal: 'The same runs backwards — where most people are two or three times slower and have never measured it.',
    guidance: [
      'Fragments and blanks, all descending.',
      'Compare your time here against the ascending practice. A gap between them is the thing to close.',
      'A scale known only forwards is a sequence; a scale known both ways is a set of notes.',
    ],
    watchFor:
      'Silently running the scale up in your head and then reading it off backwards. It gives the right answer and it will never be fast.',
  },
  'scale-to-key': {
    id: 'scale-to-key',
    tasks: ['name-key'],
    keys: RECOGNITION_KEYS,
    directions: BOTH_WAYS,
    gaps: 1,
    ladder: false,
    allowanceMs: 3000,
    goal: 'Notes in, key out — including which of a relative pair it is.',
    guidance: [
      'The choices always include the relative, because the notes alone cannot separate them.',
      'What separates them is where the run starts and ends. That is the only evidence there is.',
      'Accidentals narrow it to a pair; the root decides between them.',
    ],
    watchFor:
      'Answering the major every time. Half of these are minors built from the same notes, and guessing scores 50% for a while.',
  },
  'major-or-minor': {
    id: 'major-or-minor',
    tasks: ['quality'],
    keys: RECOGNITION_KEYS,
    directions: BOTH_WAYS,
    gaps: 1,
    ladder: false,
    allowanceMs: 2000,
    goal: 'Major or minor, decided by reading the notes rather than hearing them.',
    guidance: [
      'The third above the root is the whole answer: four semitones is major, three is minor.',
      'Do not sound it out. This is the version of the question you can answer on paper.',
      '4.6.1 asks the same thing by ear; the two should eventually agree instantly.',
    ],
    watchFor:
      'Looking at the accidentals instead of the third. F major and D minor carry the same one flat and are not the same quality.',
  },
};

export function getScaleReadDrill(id: string): ScaleReadConfig {
  const config = SCALE_READ_DRILLS[id];
  if (!config) throw new Error(`Unknown scale read drill: ${id}`);
  return config;
}

/** How many blanks a clean streak has earned, inside the reference's range. */
export const MAX_GAPS = 3;
/** Clean answers needed before another note disappears. */
export const GAP_STREAK = 5;

export function nextGaps(current: number, correct: boolean, streak: number): number {
  if (!correct) return Math.max(1, current - 1);
  return streak >= GAP_STREAK ? Math.min(MAX_GAPS, current + 1) : current;
}

export type { KeyRef };

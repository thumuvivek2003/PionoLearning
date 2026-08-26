import type { Clef, Step } from '../reading.types';
import { TOP_STEP, stepRange } from './staff';

/**
 * 6.10.10 as data — the level's final test.
 *
 * Ten rounds of things earlier buckets taught, arriving without warning and
 * against a clock. Nothing here is a new skill: what the contest adds is that
 * you do not choose which one is next, which is the only condition that
 * resembles reading music you have not seen.
 */
export interface ReadingRound {
  /** What the card calls it. */
  label: string;
  clef: Clef;
  /** How many notes to read and play. One is a single-note round. */
  length: number;
  /** Steps the run may start from. */
  starts: readonly Step[];
  /** Allow leaps. */
  skips: boolean;
  /** A key signature in force. */
  key?: string;
  /** Cover the keyboard. */
  blind?: boolean;
  /** Seconds allowed for the whole round. */
  seconds: number;
  brief: string;
}

const MID: readonly Step[] = stepRange(0, 4);
const WIDE: readonly Step[] = stepRange(-2, TOP_STEP - 2);

/** The ten rounds, easiest first and tightening throughout. */
export const READING_ROUNDS: readonly ReadingRound[] = [
  { label: 'Note 1', clef: 'treble', length: 1, starts: WIDE, skips: false, seconds: 4, brief: 'One treble note. Play it.' },
  { label: 'Note 2', clef: 'bass', length: 1, starts: WIDE, skips: false, seconds: 4, brief: 'One bass note, with less time.' },
  { label: 'Note 3', clef: 'treble', length: 1, starts: WIDE, skips: false, seconds: 3, brief: 'And again, at contest speed.' },
  { label: 'Steps', clef: 'treble', length: 3, starts: MID, skips: false, seconds: 8, brief: 'Three notes moving by step.' },
  { label: 'Leaps', clef: 'treble', length: 3, starts: MID, skips: true, seconds: 9, brief: 'Three notes with leaps in them.' },
  { label: 'Bass run', clef: 'bass', length: 4, starts: MID, skips: true, seconds: 12, brief: 'Four notes on the lower staff.' },
  { label: 'In G', clef: 'treble', length: 4, starts: MID, skips: true, key: 'G', seconds: 12, brief: 'A signature is in force — apply it.' },
  { label: 'In F', clef: 'bass', length: 4, starts: MID, skips: true, key: 'F', seconds: 12, brief: 'The other direction, on the lower staff.' },
  { label: 'Blind', clef: 'treble', length: 4, starts: MID, skips: false, blind: true, seconds: 14, brief: 'Keyboard covered — read and reach.' },
  { label: 'Long run', clef: 'treble', length: 6, starts: MID, skips: true, seconds: 15, brief: 'Six notes, no help, no stopping.' },
];

export interface ReadingContestConfig {
  id: string;
  rounds: readonly ReadingRound[];
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

export const READING_CONTEST_DRILLS: Readonly<Record<string, ReadingContestConfig>> = {
  'reading-contest': {
    id: 'reading-contest',
    rounds: READING_ROUNDS,
    goal: 'Ten rounds, no warning: single notes, runs, both clefs, two key signatures and a covered keyboard.',
    guidance: [
      'Every round is timed and the card records what each one cost.',
      'Run it daily and read the card rather than the total — the rounds fail in different ways.',
      'A round you run out of time on counts against you exactly as a wrong note does.',
    ],
    watchFor:
      'Judging the run by the score. Two identical scores can hide a bass-clef problem in one and a key-signature problem in the other, and only the card tells them apart.',
  },
};

export function getReadingContestDrill(id: string): ReadingContestConfig {
  const config = READING_CONTEST_DRILLS[id];
  if (!config) throw new Error(`Unknown reading contest drill: ${id}`);
  return config;
}

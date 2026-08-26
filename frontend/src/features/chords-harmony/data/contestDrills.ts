import type { ChordQuality, Inversion } from '../chords.types';
import { TRIAD_ROOTS } from './triads';

/**
 * 5.10.10 as data — the level's final test.
 *
 * Ten rounds that each ask for something different, run back to back and scored
 * on one card. Nothing here is a new skill: every round is a thing an earlier
 * bucket taught, and what the contest adds is that they arrive without warning
 * and against a clock, which is the only condition that matters on the day.
 */

/** What a round asks for. */
export type RoundKind =
  /** A chord is named; play it. */
  | 'chord'
  /** A chord is named with a position; play that shape. */
  | 'inverted'
  /** A progression of numerals; play it through. */
  | 'progression'
  /** The same progression, played twice with no break. */
  | 'continuous'
  /** A progression in a key you were not just playing in. */
  | 'transpose'
  /** A chord, then a short melody drawn from it. */
  | 'melody'
  /** A progression with the keyboard covered. */
  | 'blind';

export interface ContestRound {
  kind: RoundKind;
  /** What the round is called on the card. */
  label: string;
  /** Seconds allowed before it counts against you. */
  seconds: number;
  /** What to do, in one line. */
  brief: string;
}

/**
 * The ten rounds, in the reference's order.
 *
 * Two of its rounds — the strummed one and the melody one — are judged here on
 * continuity and on the melody itself rather than against a click, because the
 * metronome versions have their own practices and a contest round is not the
 * place to set one up. What is being tested is the same: can the progression
 * keep going while something else is happening.
 */
export const CONTEST_ROUNDS: readonly ContestRound[] = [
  { kind: 'chord', label: 'Chord 1', seconds: 5, brief: 'A chord is named. Play it.' },
  { kind: 'chord', label: 'Chord 2', seconds: 4, brief: 'Another, with less time.' },
  { kind: 'chord', label: 'Chord 3', seconds: 3, brief: 'And again, at contest speed.' },
  { kind: 'progression', label: 'Progression', seconds: 12, brief: 'Play the progression through.' },
  { kind: 'progression', label: 'Progression 2', seconds: 10, brief: 'A different one, quicker.' },
  { kind: 'continuous', label: 'Continuous', seconds: 16, brief: 'Twice through with no break.' },
  { kind: 'inverted', label: 'Inversions', seconds: 12, brief: 'The progression, closest positions.' },
  { kind: 'melody', label: 'Chord + melody', seconds: 12, brief: 'The chord, then its melody notes.' },
  { kind: 'transpose', label: 'Transpose', seconds: 14, brief: 'The same numerals in a new key.' },
  { kind: 'blind', label: 'Blind', seconds: 14, brief: 'The progression, keyboard covered.' },
];

export interface ChordContestConfig {
  id: string;
  rounds: readonly ContestRound[];
  /** Keys a round may be set in. */
  keys: readonly string[];
  /** Progressions the progression rounds draw from. */
  progressions: readonly (readonly string[])[];
  /** Roots the single-chord rounds draw from. */
  roots: readonly string[];
  qualities: readonly ChordQuality[];
  inversions: readonly Inversion[];
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

export const CHORD_CONTEST_DRILLS: Readonly<Record<string, ChordContestConfig>> = {
  'chord-contest': {
    id: 'chord-contest',
    rounds: CONTEST_ROUNDS,
    keys: ['C', 'G', 'D', 'A', 'F'],
    progressions: [
      ['I', 'IV', 'V', 'I'],
      ['I', 'V', 'vi', 'IV'],
      ['vi', 'IV', 'I', 'V'],
      ['ii', 'V', 'I'],
      ['I', 'vi', 'IV', 'V'],
    ],
    roots: TRIAD_ROOTS,
    qualities: ['major', 'minor'],
    inversions: [0, 1, 2],
    goal: 'Ten rounds, no warning and no preparation — the whole level in one sitting.',
    guidance: [
      'Chords, progressions, inversions, melody, a new key and a covered keyboard, in that order.',
      'Every round is timed and the card records what each one cost. Run it daily and read the card, not the total.',
      'A round you run out of time on counts against you exactly as a wrong note does.',
    ],
    watchFor:
      'Judging the run by the score alone. Two identical scores can hide a transposition problem in one and a blind-playing problem in the other — the card is what tells them apart.',
  },
};

export function getChordContestDrill(id: string): ChordContestConfig {
  const config = CHORD_CONTEST_DRILLS[id];
  if (!config) throw new Error(`Unknown chord contest drill: ${id}`);
  return config;
}

/** How many chords a round asks to be played. */
export function chordsInRound(round: ContestRound, progression: readonly string[]): number {
  if (round.kind === 'chord' || round.kind === 'inverted' || round.kind === 'melody') return 1;
  if (round.kind === 'continuous') return progression.length * 2;
  return progression.length;
}

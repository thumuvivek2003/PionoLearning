import type { Letter } from '@/features/music-theory';

/**
 * A step between white keys, measured in natural letters rather than semitones.
 *
 * The bucket is about the *map*, not about pitch: "one to the right of E" is F
 * whether or not a black key sits between them, so everything here counts
 * letters and lets the keyboard worry about semitones.
 */
export interface Relation {
  id: string;
  /** Signed letter distance: +1 right neighbour, -2 skip-one left. */
  steps: number;
  /** Segmented-control label, e.g. "Right". */
  label: string;
  /** Read above the prompt, e.g. "One white key right of". */
  question: string;
}

/** Everything a relation drill needs to introduce itself. */
export interface RelationDrillConfig {
  id: string;
  goal: string;
  steps: readonly string[];
  watchFor: string;
  relations: readonly Relation[];
}

export type SequenceDirection = 'ascending' | 'descending';

/** A step of a recited run: the letter, and whether it has been played yet. */
export interface SequenceSlot {
  letter: Letter;
  done: boolean;
}

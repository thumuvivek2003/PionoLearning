import type { Letter, PitchClass } from '@/features/music-theory';

/**
 * Both hands use the same numbering — 1 is always the thumb, 3 is always the
 * middle finger. Keeping one scale for both hands is the whole point of the
 * bucket, so there is deliberately no left/right variant of this type.
 */
export type FingerNumber = 1 | 2 | 3 | 4 | 5;

export type Hand = 'right' | 'left';

export interface Finger {
  number: FingerNumber;
  /** Anatomical name, e.g. "Middle". */
  name: string;
}

/** One key of a five-finger position: the note and the finger that owns it. */
export interface PositionSlot {
  letter: Letter;
  pitchClass: PitchClass;
  finger: FingerNumber;
}

/** A named tapping order, e.g. "1-3-5-2-4". */
export interface FingerPattern {
  id: string;
  label: string;
  /** Empty for the generated pattern — the drill fills it per run. */
  sequence: readonly FingerNumber[];
  /** True when the sequence should be re-rolled on every start. */
  generated?: boolean;
}

/** Which way a prompt runs in the recognition drills. */
export type QuizDirection = 'toNumber' | 'toName' | 'mixed';

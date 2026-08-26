import type { Letter, PitchClass } from '@/features/music-theory';

/** The two clefs level 6 reads. */
export type Clef = 'treble' | 'bass';

/**
 * A vertical position on the staff, counted in diatonic steps.
 *
 * 0 is the bottom line; every step is one line-or-space upward, so even steps
 * are lines and odd steps are spaces. Counting in steps rather than in pixels
 * is what lets the same number mean "line 3" to the geometry, "B" to the
 * treble clef and "D" to the bass one — the staff is one map read by two
 * decoders, which is the whole idea of 6.1.6.
 */
export type Step = number;

/** A note as the page shows it: where it sits, and what that means. */
export interface StaffNote {
  step: Step;
  letter: Letter;
  octave: number;
  /** "G4" — letter and octave together. */
  name: string;
  pitchClass: PitchClass;
  midi: number;
  /** True when the step lands on a line rather than in a space. */
  onLine: boolean;
  /** Line 1–5 or space 1–4, or null when the note sits off the staff. */
  place: number | null;
  /** How many ledger lines it needs, and which side. */
  ledgers: number;
  ledgerBelow: boolean;
}

import { intervalName } from '@/features/music-theory';
import { whiteStep } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import type { FingerNumber, Hand } from '../finger.types';

/**
 * Runs measured in distance, not position.
 *
 * Bucket 2.4 is the moment the hand stops living in one five-finger position:
 * "1 → 3" has to mean *a third from wherever I am*, so a run is stored as
 * offsets from its own first note and a start key is drawn separately. That is
 * what makes the transfer practice possible — the same run, started anywhere.
 */

export interface RunNote {
  /** White-key steps from the run's first note; negative goes left. */
  offset: number;
  /** The finger the reference prescribes, where it prescribes one. */
  finger?: FingerNumber;
}

/** One run placed on the board: the keys, in the order they are played. */
export interface PlacedRun {
  keys: readonly PianoKey[];
  notes: readonly RunNote[];
}

/** Places a run on a start key, or null when it would fall off the board. */
export function placeRun(
  layout: KeyboardLayout,
  start: PianoKey,
  notes: readonly RunNote[],
): PlacedRun | null {
  const keys: PianoKey[] = [];

  for (const note of notes) {
    const key = whiteStep(layout, start, note.offset);
    if (!key) return null;
    keys.push(key);
  }

  return { keys, notes };
}

/** Every white key a run can start from on this board. */
export function startsFor(
  layout: KeyboardLayout,
  notes: readonly RunNote[],
  letters?: readonly string[],
): readonly PianoKey[] {
  return layout.keys.filter(
    (key) =>
      !key.isBlack &&
      (letters === undefined || letters.includes(key.sharpName)) &&
      placeRun(layout, key, notes) !== null,
  );
}

/** The distances a run is made of, e.g. [2, 2] for C-E-G. */
export function runSteps(notes: readonly RunNote[]): readonly number[] {
  return notes
    .slice(1)
    .map((note, index) => note.offset - (notes[index] as RunNote).offset);
}

/**
 * How a run reads as distances, e.g. "3rd up · 3rd up".
 *
 * The reference is emphatic that a melody is a chain of distances rather than a
 * list of notes, so this is the vocabulary the drill reports in.
 */
export function runShape(notes: readonly RunNote[]): string {
  const steps = runSteps(notes);
  if (steps.length === 0) return 'single note';
  return steps
    .map((step) => `${intervalName(step)} ${step > 0 ? 'up' : 'down'}`)
    .join(' · ');
}

/** How a run reads in fingers, e.g. "1 → 3 → 5". */
export function runFingers(notes: readonly RunNote[]): string {
  const numbers = notes.map((note) => note.finger).filter(Boolean);
  return numbers.length === notes.length ? numbers.join(' → ') : '';
}

/** The interval a two-note run spans, for scoring and for the prompt. */
export function runInterval(notes: readonly RunNote[]): string {
  const steps = runSteps(notes);
  const widest = steps.reduce((worst, step) => (Math.abs(step) > Math.abs(worst) ? step : worst), 0);
  return `${intervalName(widest)} ${widest > 0 ? 'up' : 'down'}`;
}

/**
 * Fingering for a run drawn at random.
 *
 * The reference fingers the fixed runs (1→3, 1→4, 1→5) and leaves the random
 * ones alone, because a random pair can span further than a hand does. So a
 * finger is offered only when the whole run fits inside one position.
 */
export function fingerFor(hand: Hand, offset: number, base: number): FingerNumber | null {
  const span = offset - base;
  if (span < 0 || span > 4) return null;
  return (hand === 'right' ? span + 1 : 5 - span) as FingerNumber;
}

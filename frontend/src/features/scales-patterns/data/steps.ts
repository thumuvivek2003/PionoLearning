import { SEMITONES_PER_OCTAVE, getScaleType } from '@/features/music-theory';
import type { IntervalSet } from '@/features/music-theory';

/**
 * The two distances a scale is built from.
 *
 * Level 4 rests on one sentence — a major scale is whole, whole, half, whole,
 * whole, whole, half — so the formula is the primitive here and the scales are
 * what falls out of it. Everything is derived from the interval set rather than
 * written twice, which means a scale's steps can never disagree with its notes.
 */
export type Step = 'W' | 'H';

export const WHOLE = 2;
export const HALF = 1;

export function semitonesOf(step: Step): number {
  return step === 'W' ? WHOLE : HALF;
}

export function stepLabel(step: Step): string {
  return step === 'W' ? 'whole step' : 'half step';
}

/** The gap between consecutive notes, e.g. "2 keys" — how the board sees it. */
export function stepKeys(step: Step): string {
  return step === 'W' ? '2 keys' : '1 key';
}

/**
 * The step pattern of a scale, including the step back up to the octave.
 *
 * Derived from the intervals, so the pattern for the major scale comes out as
 * W W H W W W H without anyone typing it — and any scale added to music-theory
 * gets its formula for free.
 */
export function stepsOf(intervals: IntervalSet): readonly Step[] {
  const degrees = [...intervals, SEMITONES_PER_OCTAVE];
  return degrees
    .slice(1)
    .map((interval, index) => ((interval - (degrees[index] as number)) === WHOLE ? 'W' : 'H'));
}

/** The formula every practice in bucket 4.1 is about. */
export const MAJOR_STEPS: readonly Step[] = ['W', 'W', 'H', 'W', 'W', 'W', 'H'];

/** How a formula reads, e.g. "W-W-H-W-W-W-H". */
export function formulaLabel(steps: readonly Step[]): string {
  return steps.join('-');
}

/**
 * The same formula counted in semitones, e.g. "2-2-1-2-2-2-1".
 *
 * The two readings are the same fact in different units, and the conversion
 * between them is what turns a formula into something a hand can use: W is not
 * an idea, it is two keys along.
 */
export function semitoneLabel(steps: readonly Step[]): string {
  return steps.map(semitonesOf).join('-');
}

/** The notes a formula produces from a starting key, as MIDI numbers. */
export function applySteps(rootMidi: number, steps: readonly Step[]): readonly number[] {
  const midis = [rootMidi];
  let at = rootMidi;

  for (const step of steps) {
    at += semitonesOf(step);
    midis.push(at);
  }

  return midis;
}

/** Where the half steps fall, counting degrees from 1 — 3→4 and 7→8 in major. */
export function halfStepDegrees(steps: readonly Step[]): readonly number[] {
  return steps.flatMap((step, index) => (step === 'H' ? [index + 1] : []));
}

/**
 * The step pattern of a named scale type.
 *
 * Lets a practice say which scale it is about and get the formula for it, so
 * the drills are not written around one pattern. An unknown type falls back to
 * major rather than throwing, since a bad id in a config should not blank a
 * screen.
 */
export function stepsForType(typeId: string): readonly Step[] {
  const type = getScaleType(typeId);
  return type ? stepsOf(type.intervals) : MAJOR_STEPS;
}

/** W-H-W-W-H-W-W — the natural minor, and the whole of bucket 4.6. */
export const MINOR_STEPS: readonly Step[] = stepsForType('natural-minor');

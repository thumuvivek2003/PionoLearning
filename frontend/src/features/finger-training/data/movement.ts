import type { FingerNumber } from '../finger.types';

/**
 * Choosing the movement, which is what bucket 2.8 is actually about.
 *
 * The reference gives a three-question test — how far is it, is the line
 * continuous, what happens after — and then answers it the same way every time.
 * That makes the answer derivable rather than something to be listed by hand, so
 * a situation is classified here and the drill can generate as many as it likes
 * without anyone writing down what each one needs.
 */
export type Technique =
  /** Nearby: shuffle the hand a little rather than stretching at it. */
  | 'move'
  /** Comfortably inside the hand's span: let the finger reach. */
  | 'stretch'
  /** Too far, or scattered: pick the hand up and put it down. */
  | 'reposition'
  /** Continuous and stepwise: the thumb goes under and the line carries on. */
  | 'cross'
  /** More than one of the above in a single passage. */
  | 'combine';

export const TECHNIQUES: readonly Technique[] = ['move', 'stretch', 'reposition', 'cross', 'combine'];

/** What a five-finger hand covers without leaving its position. */
const HAND_SPAN = 4;

/** A step of this size or less is a nudge rather than a movement. */
const NEARBY = 1;

/** A stepwise line needs to be this long before crossing is the answer. */
const CONTINUOUS_FROM = 4;

export interface Situation {
  id: string;
  /** White-key offsets from the first note. */
  offsets: readonly number[];
  /** Prescribed where the reference prescribes one, absent where it does not. */
  fingers?: readonly FingerNumber[];
}

/** The gaps between consecutive notes, signed. */
export function situationSteps(offsets: readonly number[]): readonly number[] {
  return offsets.slice(1).map((offset, index) => offset - (offsets[index] as number));
}

/**
 * The movement a situation calls for.
 *
 * Straight out of the reference's own answers: two notes are judged by
 * distance, a long stepwise line means crossing, scattered notes mean
 * repositioning, and anything mixing the two needs more than one answer.
 */
export function classify(offsets: readonly number[]): Technique {
  const steps = situationSteps(offsets);
  if (steps.length === 0) return 'move';

  const stepwise = steps.every((step) => Math.abs(step) === 1);
  if (stepwise) return offsets.length >= CONTINUOUS_FROM ? 'cross' : 'move';

  if (steps.length === 1) {
    const distance = Math.abs(steps[0] as number);
    if (distance <= NEARBY) return 'move';
    return distance <= HAND_SPAN ? 'stretch' : 'reposition';
  }

  // Every gap a leap: isolated notes, so the hand travels between them.
  if (steps.every((step) => Math.abs(step) >= 2)) return 'reposition';
  return 'combine';
}

export function techniqueLabel(technique: Technique): string {
  switch (technique) {
    case 'move':
      return 'Small move';
    case 'stretch':
      return 'Stretch';
    case 'reposition':
      return 'Reposition';
    case 'cross':
      return 'Cross';
    default:
      return 'Combination';
  }
}

/** The one-line reason, which is the part worth remembering. */
export function techniqueWhy(technique: Technique): string {
  switch (technique) {
    case 'move':
      return 'The next note is right there — shuffle the hand across rather than reaching for it.';
    case 'stretch':
      return 'It is inside the hand’s span, so the finger can take it and the hand can stay put.';
    case 'reposition':
      return 'Too far to reach, or going nowhere in particular — pick the hand up and land it.';
    case 'cross':
      return 'Continuous and stepwise: the thumb goes under and the line keeps going.';
    default:
      return 'This passage needs more than one answer — the strategy changes partway through.';
  }
}

/** Why the answer given was the wrong one, said plainly. */
export function techniqueCorrection(given: Technique, wanted: Technique): string {
  if (given === 'stretch' && wanted === 'reposition') {
    return 'That is further than the hand comfortably spans — stretching for it builds tension.';
  }
  if (given === 'reposition' && wanted === 'stretch') {
    return 'The finger reaches this one on its own; moving the hand costs more than it saves.';
  }
  if (given === 'cross' && wanted === 'reposition') {
    return 'These notes are not a scale — crossing is for continuous lines, not leaps.';
  }
  if (wanted === 'cross') {
    return 'Stepwise and continuous, and long enough that the position runs out: this one crosses.';
  }
  return techniqueWhy(wanted);
}

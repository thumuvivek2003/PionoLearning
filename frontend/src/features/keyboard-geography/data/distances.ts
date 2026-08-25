import { SEMITONES_PER_OCTAVE, intervalName } from '@/features/music-theory';
import { whiteStep } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import { octaveKey } from './octaves';

/**
 * Distance on the keyboard, measured the way a hand measures it.
 *
 * Bucket 1.6 is not about note names — it is about "how far is that from here".
 * So a distance is a signed number of steps in one of two units, and resolving
 * one is a question put to the board: the target either exists under your hand
 * or the board has run out, and a distance that runs off the end is not a
 * question worth asking.
 */
export type DistanceUnit =
  /** Steps along the white keys — the ruler the bucket teaches. */
  | 'white'
  /** Whole octaves of the same letter. */
  | 'octave';

export interface Distance {
  unit: DistanceUnit;
  /** Signed: positive is to the right, negative to the left. */
  steps: number;
}

/** Distances the bucket works in, as magnitudes: a 2nd up to a 5th. */
export const WHITE_STEPS: readonly number[] = [1, 2, 3, 4];

/** Where a distance lands, whichever unit it is stated in. */
export function targetOf(
  layout: KeyboardLayout,
  from: PianoKey,
  distance: Distance,
): PianoKey | undefined {
  return distance.unit === 'octave'
    ? octaveKey(layout, from.midi, distance.steps)
    : whiteStep(layout, from, distance.steps);
}

/** The prompt line, e.g. "3 white keys right · a 4th" or "One octave up". */
export function distanceLabel(distance: Distance): string {
  const size = Math.abs(distance.steps);

  if (distance.unit === 'octave') {
    const octaves = size === 1 ? 'One octave' : `${size} octaves`;
    return `${octaves} ${distance.steps > 0 ? 'up' : 'down'}`;
  }

  const keys = `${size} white ${size === 1 ? 'key' : 'keys'}`;
  return `${keys} ${distance.steps > 0 ? 'right' : 'left'} · a ${intervalName(size).toLowerCase()}`;
}

export interface DistanceAnswer {
  label: string;
  sub: string;
}

/** How a distance reads on an answer button: the name over the count. */
export function distanceAnswer(distance: Distance): DistanceAnswer {
  const size = Math.abs(distance.steps);

  if (distance.unit === 'octave') {
    return {
      label: size === 1 ? 'Octave' : `${size} octaves`,
      sub: `${size * SEMITONES_PER_OCTAVE} keys`,
    };
  }

  return { label: intervalName(size), sub: `${size} ${size === 1 ? 'step' : 'steps'}` };
}

/** Which way a distance goes, for a label that has no room for words. */
export function directionArrow(steps: number): string {
  return steps > 0 ? '↑' : '↓';
}

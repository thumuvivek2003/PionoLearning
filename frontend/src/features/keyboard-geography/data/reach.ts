import { SEMITONES_PER_OCTAVE } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import { whiteKeys } from './distances';
import { keyLabel } from './octaves';

/**
 * Judging a reach — why the hand landed where it did.
 *
 * The reference for bucket 1.7 is explicit that a miss is only useful if you
 * know *which* miss it was: one key too far, the right note in the wrong
 * octave, or the wrong landmark altogether. Those are different mistakes with
 * different fixes, and they are all readable from the two keys involved, so the
 * drill can name them instead of just buzzing.
 */
export type MissReason =
  /** Right letter, wrong octave. */
  | 'octave'
  /** One white key out — the classic near miss. */
  | 'neighbour'
  /** Landed on the black key beside the target. */
  | 'black-neighbour'
  /** Two or three keys out: the landmark was found, the count off it was not. */
  | 'wrong-step'
  /** Nowhere near — a different part of the board. */
  | 'far';

export interface ReachResult {
  hit: boolean;
  /** Signed semitones from target to where the hand landed. */
  semitones: number;
  /** Signed white-key steps, when both keys are white. */
  whiteSteps: number | null;
  reason: MissReason | null;
}

/** Anything further out than this is a different region, not a near miss. */
const FAR_STEPS = 4;

export function judgeReach(
  layout: KeyboardLayout,
  target: PianoKey,
  pressed: PianoKey,
): ReachResult {
  const semitones = pressed.midi - target.midi;
  if (semitones === 0) return { hit: true, semitones: 0, whiteSteps: 0, reason: null };

  const whites = whiteKeys(layout);
  const whiteSteps =
    target.isBlack || pressed.isBlack
      ? null
      : whites.findIndex((key) => key.midi === pressed.midi) -
        whites.findIndex((key) => key.midi === target.midi);

  const reason: MissReason = (() => {
    if (pressed.pitchClass === target.pitchClass) return 'octave';
    if (pressed.isBlack !== target.isBlack && Math.abs(semitones) === 1) return 'black-neighbour';
    if (whiteSteps !== null && Math.abs(whiteSteps) === 1) return 'neighbour';
    if (whiteSteps !== null && Math.abs(whiteSteps) < FAR_STEPS) return 'wrong-step';
    if (Math.abs(semitones) < SEMITONES_PER_OCTAVE) return 'wrong-step';
    return 'far';
  })();

  return { hit: false, semitones, whiteSteps, reason };
}

/** What the miss says, in the drill's own words. */
export function missNote(result: ReachResult, pressed: PianoKey): string {
  const side = result.semitones > 0 ? 'right' : 'left';

  switch (result.reason) {
    case 'octave':
      return `Right note, wrong octave — you landed on ${keyLabel(pressed)}`;
    case 'neighbour':
      return `One white key too far ${side} — that was ${pressed.sharpName}`;
    case 'black-neighbour':
      return `Half a step ${side} — you caught the black key beside it`;
    case 'wrong-step':
      return `A few keys ${side} of it — ${pressed.sharpName}. The landmark was right, the count was not`;
    default:
      return `Wrong part of the board — ${keyLabel(pressed)}`;
  }
}

/** What to do about it, which is the half the reference cares about. */
export function missAdvice(reason: MissReason): string {
  switch (reason) {
    case 'octave':
      return 'Fix the octave first: find the C nearest your hand, then count octaves from middle C.';
    case 'neighbour':
      return 'Anchor on the black-key group before you move. A neighbour miss means the hand started from the wrong key, not that the aim was off.';
    case 'black-neighbour':
      return 'You were on the right spot but between keys. Aim for the wide part of the white key, past the black ones.';
    case 'wrong-step':
      return 'The landmark was found and the steps off it were miscounted. Slow the count down, keep the landmark.';
    default:
      return 'Take a peek, rebuild the picture from the 2- and 3-black-key groups, then reach again.';
  }
}

/**
 * A running measure of how far off the hand tends to land.
 *
 * Two numbers matter and they are different: how far out you are, and whether
 * you are consistently out the *same way*. A steady pull to the left is a
 * posture problem with an easy fix; scatter in both directions is a map problem.
 */
export interface ReachTally {
  attempts: number;
  hits: number;
  /** Sum of |error|, for the mean. */
  totalError: number;
  /** Sum of signed error, for the bias. */
  signedError: number;
  worst: number;
}

export const EMPTY_TALLY: ReachTally = {
  attempts: 0,
  hits: 0,
  totalError: 0,
  signedError: 0,
  worst: 0,
};

export function recordReach(tally: ReachTally, semitones: number): ReachTally {
  const error = Math.abs(semitones);

  return {
    attempts: tally.attempts + 1,
    hits: tally.hits + (error === 0 ? 1 : 0),
    totalError: tally.totalError + error,
    signedError: tally.signedError + semitones,
    worst: Math.max(tally.worst, error),
  };
}

/** Mean miss distance in keys, or null before anything has been tried. */
export function meanError(tally: ReachTally): number | null {
  return tally.attempts === 0 ? null : tally.totalError / tally.attempts;
}

/** Which way the hand leans, once there is enough to tell. */
export function biasNote(tally: ReachTally): string {
  const misses = tally.attempts - tally.hits;
  if (misses < 3) return 'centred';

  const lean = tally.signedError / tally.attempts;
  if (Math.abs(lean) < 0.4) return 'centred';
  return lean > 0 ? 'pulls right' : 'pulls left';
}

export function hitRate(tally: ReachTally): number | null {
  return tally.attempts === 0 ? null : tally.hits / tally.attempts;
}

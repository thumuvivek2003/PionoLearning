import type { FingerNumber, Hand } from '../finger.types';
import { slotOfFinger } from './positions';

/**
 * One step of a pattern: the finger each hand uses.
 *
 * Fingers rather than keys, because that is what both buckets are written in —
 * "the same finger numbers" means the same thing in either hand even though the
 * notes differ, and a pattern that stored notes could not say that. The board
 * position is derived when a step is played, never authored.
 */
export type PatternStep = Partial<Record<Hand, FingerNumber>> & {
  /** The step is pressed and held down for the rest of the run. */
  hold?: boolean;
};

export interface PatternVariant {
  id: string;
  /** Written out only when the finger numbers do not tell the story, e.g. a hold. */
  label?: string;
  sequence: readonly PatternStep[];
}

/** Whether the listed hands play at once, or the drill offers a choice of one. */
export type HandPlay = 'together' | 'either';

export interface FivePatternConfig {
  id: string;
  hands: readonly Hand[];
  play: HandPlay;
  /** Patterns the practice draws from; more than one adds a Pattern control. */
  variants: readonly PatternVariant[];
  /** Opens playing the pattern backwards — the "reverse" practices. */
  reversed: boolean;
  /** The first step is held down while the rest of the run plays (2.3.7). */
  holdFirst?: boolean;
  /** Cue a different accented finger every run (2.3.8). */
  accents?: boolean;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/* ---------------- authoring helpers ---------------- */

/** A one-handed run, written in finger numbers. */
export function fingers(hand: Hand, run: readonly FingerNumber[]): readonly PatternStep[] {
  return run.map((finger) => ({ [hand]: finger }) as PatternStep);
}

/**
 * A run for whichever hand the drill is set to.
 *
 * Authored against the right hand and remapped by `forHand`, so a practice that
 * says "the same numbers in either hand" is stored once.
 */
export function eitherHand(run: readonly FingerNumber[]): readonly PatternStep[] {
  return fingers('right', run);
}

/** A two-handed run — the hands move together, step for step. */
export function bothHands(
  right: readonly FingerNumber[],
  left: readonly FingerNumber[],
): readonly PatternStep[] {
  return right.map((finger, index) => ({ right: finger, left: left[index] ?? finger }));
}

/** A hold-and-move run: the first finger stays down while the rest play. */
export function holdRun(
  held: FingerNumber,
  movers: readonly FingerNumber[],
): readonly PatternStep[] {
  return [
    { right: held, hold: true } as PatternStep,
    ...movers.map((finger) => ({ right: finger }) as PatternStep),
  ];
}

/** Doubles every finger, for the repeated-note practice. */
export function doubled(run: readonly FingerNumber[]): readonly FingerNumber[] {
  return run.flatMap((finger) => [finger, finger]);
}

/**
 * Moves a run written for one hand onto another.
 *
 * The finger numbers are the pattern, so this only changes whose hand plays
 * them — which is exactly what "use the same finger numbers in the left hand"
 * asks for.
 */
export function forHand(
  sequence: readonly PatternStep[],
  hand: Hand,
  from: Hand = 'right',
): readonly PatternStep[] {
  if (hand === from) return sequence;
  return sequence.map((step) => {
    const finger = step[from];
    if (finger === undefined) return step;
    const { [from]: _dropped, ...rest } = step;
    return { ...rest, [hand]: finger } as PatternStep;
  });
}

/* ---------------- reading a pattern ---------------- */

/** How a run reads in finger numbers, e.g. "1-3-2-4-3-5". */
export function patternLabel(
  sequence: readonly PatternStep[],
  hand: Hand,
  reversed = false,
): string {
  const steps = reversed ? [...sequence].reverse() : sequence;
  return steps
    .map((step) => step[hand])
    .filter((finger): finger is FingerNumber => finger !== undefined)
    .join('-');
}

/** How a run reads in note names, given the letters under the hand. */
export function patternNotes(
  sequence: readonly PatternStep[],
  hand: Hand,
  letters: readonly string[],
  reversed = false,
): string {
  const steps = reversed ? [...sequence].reverse() : sequence;
  return steps
    .map((step) => step[hand])
    .filter((finger): finger is FingerNumber => finger !== undefined)
    .map((finger) => letters[slotOfFinger(hand, finger)] ?? '?')
    .join('-');
}

export function getVariant(
  config: FivePatternConfig,
  id: string,
): PatternVariant | undefined {
  return config.variants.find((variant) => variant.id === id);
}

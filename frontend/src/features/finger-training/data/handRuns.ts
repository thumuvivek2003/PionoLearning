import type { FingerNumber, Hand } from '../finger.types';
import { SLOT_COUNT } from './positions';

/**
 * Runs that move the hand.
 *
 * Buckets 2.5 and 2.6 are the same act seen twice: a fingered run with a *move*
 * inside it. Shifting moves the whole hand to a new position; crossing moves the
 * thumb so the hand can carry on. Both are stored the same way — an offset from
 * where the run starts, the finger that plays it, and a mark on the steps you
 * have to move to reach — because the interesting measurement in both is the
 * same: how long the move took, and whether it landed.
 */

export type MoveKind = 'shift' | 'cross';

export interface RunStep {
  /** White-key steps from the run's first note; negative goes left. */
  offset: number;
  finger: FingerNumber;
  /** Set when the hand has to move to reach this step. */
  move?: MoveKind;
}

/** One hand position, and how much of it is played before moving on. */
export interface SegmentSpec {
  /**
   * Where this position sits relative to the one before it, in white keys.
   * 'draw' asks the drill to pick from the shifts it offers.
   */
  shift: number | 'draw';
  notes: number;
}

/** The finger that plays the nth key of a position, counting from its lowest. */
export function positionFinger(hand: Hand, index: number): FingerNumber {
  return (hand === 'right' ? index + 1 : SLOT_COUNT - index) as FingerNumber;
}

/**
 * A run built from hand positions, one segment at a time.
 *
 * Every segment restarts the fingering from its own anchor — which is the whole
 * lesson of 2.5: the hand does not stretch to reach the next note, it moves and
 * starts again.
 */
export function buildShiftRun(
  hand: Hand,
  segments: readonly { shift: number; notes: number }[],
  descending = false,
): readonly RunStep[] {
  const steps: RunStep[] = [];
  let anchor = 0;

  segments.forEach((segment, index) => {
    anchor += segment.shift;
    for (let note = 0; note < segment.notes; note += 1) {
      // Descending runs walk the position from its top key downwards.
      const withinPosition = descending ? SLOT_COUNT - 1 - note : note;
      steps.push({
        offset: anchor + withinPosition,
        finger: positionFinger(hand, withinPosition),
        ...(index > 0 && note === 0 ? { move: 'shift' as const } : {}),
      });
    }
  });

  return steps;
}

/**
 * A crossing run, written for the right hand going up.
 *
 * The left hand mirrors it rather than copying it: a right-hand thumb crossing
 * upward is the same movement as a left-hand thumb crossing downward, so the
 * offsets flip and the fingering stays exactly as written.
 */
export function buildCrossRun(hand: Hand, pattern: readonly RunStep[]): readonly RunStep[] {
  return hand === 'right' ? pattern : pattern.map((step) => ({ ...step, offset: -step.offset }));
}

/**
 * The lowest offset of the position a step belongs to.
 *
 * Which finger sits on the lowest key differs by hand — the right hand's thumb,
 * the left hand's little finger — so the position a step implies has to be
 * worked back through the hand's own numbering.
 */
export function positionBase(hand: Hand, step: RunStep): number {
  return hand === 'right' ? step.offset - (step.finger - 1) : step.offset - (SLOT_COUNT - step.finger);
}

/** The lowest and highest offsets a run touches — what a board has to cover. */
export function runSpan(steps: readonly RunStep[]): { low: number; high: number } {
  const offsets = steps.map((step) => step.offset);
  return { low: Math.min(...offsets), high: Math.max(...offsets) };
}

/** The steps that need a move, by index — where the interesting gaps are. */
export function moveIndexes(steps: readonly RunStep[]): readonly number[] {
  return steps.flatMap((step, index) => (step.move ? [index] : []));
}

/** How a shift reads, e.g. "2 right" — also how its score is filed. */
export function shiftLabel(shift: number): string {
  const size = Math.abs(shift);
  if (size === 0) return 'stay';
  return `${size} ${shift > 0 ? 'right' : 'left'}`;
}

/** How a run reads in fingers, with the moves marked: "1 2 3 ↷1". */
export function runFingerLabels(steps: readonly RunStep[]): readonly string[] {
  return steps.map((step) =>
    step.move === 'cross'
      ? `↷${step.finger}`
      : step.move === 'shift'
        ? `→${step.finger}`
        : String(step.finger),
  );
}

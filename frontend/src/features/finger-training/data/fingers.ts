import { LETTER_PITCH_CLASS } from '@/features/music-theory';
import type { Letter } from '@/features/music-theory';
import type { Finger, FingerNumber, FingerPattern, Hand, PositionSlot } from '../finger.types';

export const FINGERS: readonly Finger[] = [
  { number: 1, name: 'Thumb' },
  { number: 2, name: 'Index' },
  { number: 3, name: 'Middle' },
  { number: 4, name: 'Ring' },
  { number: 5, name: 'Little' },
];

export const FINGER_NUMBERS: readonly FingerNumber[] = [1, 2, 3, 4, 5];

const FINGER_INDEX: ReadonlyMap<FingerNumber, Finger> = new Map(
  FINGERS.map((finger) => [finger.number, finger]),
);

export function fingerName(number: FingerNumber): string {
  return FINGER_INDEX.get(number)?.name ?? String(number);
}

export function handLabel(hand: Hand): string {
  return hand === 'right' ? 'Right hand' : 'Left hand';
}

export function handShort(hand: Hand): string {
  return hand === 'right' ? 'RH' : 'LH';
}

/**
 * The C five-finger position: C D E F G under fingers 1–5.
 *
 * It is written right-hand-first because that is the position the bucket
 * teaches; the left hand takes the same notes with the numbering reversed
 * (G under 1, C under 5), which `positionFor` returns.
 */
const C_POSITION_LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G'];

export function positionFor(hand: Hand): readonly PositionSlot[] {
  return C_POSITION_LETTERS.map((letter, index) => ({
    letter,
    pitchClass: LETTER_PITCH_CLASS[letter],
    // Left hand plays this position from the top down: G is its thumb.
    finger: (hand === 'right' ? index + 1 : 5 - index) as FingerNumber,
  }));
}

/** The tapping orders from the bucket, plus one that is re-rolled each run. */
export const TAPPING_PATTERNS: readonly FingerPattern[] = [
  { id: 'up', label: '1-2-3-4-5', sequence: [1, 2, 3, 4, 5] },
  { id: 'down', label: '5-4-3-2-1', sequence: [5, 4, 3, 2, 1] },
  { id: 'odd-even', label: '1-3-5-2-4', sequence: [1, 3, 5, 2, 4] },
  { id: 'scatter', label: '4-1-5-3-2', sequence: [4, 1, 5, 3, 2] },
  { id: 'random', label: 'Random', sequence: [], generated: true },
];

/** Orders the lift drill walks through. */
export const LIFT_ORDERS: readonly FingerPattern[] = [
  { id: 'up', label: '1 → 5', sequence: [1, 2, 3, 4, 5] },
  { id: 'down', label: '5 → 1', sequence: [5, 4, 3, 2, 1] },
  { id: 'random', label: 'Random', sequence: [], generated: true },
];

/** A shuffled run of all five fingers — a fresh order every start. */
export function shuffledFingers(random: () => number = Math.random): FingerNumber[] {
  const fingers = [...FINGER_NUMBERS];
  for (let index = fingers.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [fingers[index], fingers[swap]] = [fingers[swap] as FingerNumber, fingers[index] as FingerNumber];
  }
  return fingers;
}

/** The sequence a pattern should run this time round. */
export function resolvePattern(pattern: FingerPattern): readonly FingerNumber[] {
  return pattern.generated ? shuffledFingers() : pattern.sequence;
}

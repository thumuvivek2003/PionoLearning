import { SEMITONES_PER_OCTAVE } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import type { FingerNumber, Hand, PositionSlot } from '../finger.types';
import { positionFor } from './fingers';

/**
 * Where the hands sit on a real board.
 *
 * The five-finger position is C D E F G for both hands, but two hands cannot
 * share five keys: on an instrument the left hand takes the octave below. Fixing
 * that here is what lets a both-hands drill tell the hands apart — press C3 and
 * the left hand answered, press C4 and the right one did.
 */
export const HAND_ANCHOR: Readonly<Record<Hand, number>> = {
  /** Middle C. */
  right: 60,
  left: 60 - SEMITONES_PER_OCTAVE,
};

/** Semitones from the anchor for the five slots — C D E F G. */
export const SLOT_OFFSETS: readonly number[] = [0, 2, 4, 5, 7];

export const SLOT_COUNT = SLOT_OFFSETS.length;

/** The key a slot falls on for one hand. */
export function slotMidi(hand: Hand, slot: number): number {
  return HAND_ANCHOR[hand] + (SLOT_OFFSETS[slot] ?? 0);
}

/** Where a finger sits in the position — the inverse of `slotFinger`. */
export function slotOfFinger(hand: Hand, finger: FingerNumber): number {
  return positionFor(hand).findIndex((slot) => slot.finger === finger);
}

/** The key a finger rests on. */
export function fingerMidi(hand: Hand, finger: FingerNumber): number {
  return slotMidi(hand, slotOfFinger(hand, finger));
}

/** The finger resting on a key, when it is inside the hand's position. */
export function fingerOfMidi(hand: Hand, midi: number): FingerNumber | null {
  const slot = slotOfMidi(hand, midi);
  return slot === null ? null : slotFinger(hand, slot);
}

/** The finger that owns a slot — 1–5 rising for the right hand, falling for the left. */
export function slotFinger(hand: Hand, slot: number): FingerNumber {
  return (positionFor(hand)[slot] as PositionSlot).finger;
}

/** Every key under one hand, low to high. */
export function positionMidis(hand: Hand): readonly number[] {
  return SLOT_OFFSETS.map((_, slot) => slotMidi(hand, slot));
}

/** Which slot a key is, for the hand that owns it — null when it is outside. */
export function slotOfMidi(hand: Hand, midi: number): number | null {
  const slot = SLOT_OFFSETS.indexOf(midi - HAND_ANCHOR[hand]);
  return slot === -1 ? null : slot;
}

/** The hand a pressed key belongs to, when a drill has both on the board. */
export function handOfMidi(hands: readonly Hand[], midi: number): Hand | null {
  return hands.find((hand) => slotOfMidi(hand, midi) !== null) ?? null;
}

/**
 * The keys one step of a pattern asks for, across the hands taking part.
 *
 * Fingers are paired with their own hand rather than by position in a list: a
 * step where only one hand plays would otherwise hand its finger to the wrong
 * one, and land an octave out.
 */
export function stepMidis(
  hands: readonly Hand[],
  step: Partial<Record<Hand, FingerNumber>>,
): readonly number[] {
  return hands.flatMap((hand) => {
    const finger = step[hand];
    return finger === undefined ? [] : [fingerMidi(hand, finger)];
  });
}

/** True when a board holds both hand positions — otherwise the drill cannot run. */
export function fitsPositions(layout: KeyboardLayout, hands: readonly Hand[]): boolean {
  const midis = new Set(layout.keys.map((key: PianoKey) => key.midi));
  return hands.every((hand) => positionMidis(hand).every((midi) => midis.has(midi)));
}

import { FLAT_NAMES, SHARP_NAMES, isBlackPitchClass, toPitchClass } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '../types/piano.types';

/**
 * Build a keyboard of any size. 61-key boards start at C2 (MIDI 36).
 * Keeping this a function means 76- and 88-key layouts are one call away.
 */
export function buildKeyboard(
  id: string,
  name: string,
  startMidi: number,
  keyCount: number,
): KeyboardLayout {
  const keys: PianoKey[] = [];
  let whiteCursor = 0;

  for (let step = 0; step < keyCount; step += 1) {
    const midi = startMidi + step;
    const pitchClass = toPitchClass(midi);
    const black = isBlackPitchClass(pitchClass);

    keys.push({
      midi,
      pitchClass,
      octave: Math.floor(midi / 12) - 1,
      isBlack: black,
      sharpName: SHARP_NAMES[pitchClass] as string,
      flatName: FLAT_NAMES[pitchClass] as string,
      // A black key straddles the boundary it follows, hence the -0.5 shift.
      offset: black ? whiteCursor - 0.5 : whiteCursor,
      whiteIndex: black ? -1 : whiteCursor,
    });

    if (!black) whiteCursor += 1;
  }

  return { id, name, startMidi, keyCount, keys, whiteKeyCount: whiteCursor };
}

/** C2 → C7: the standard 61-key board. */
export const KEYBOARD_61 = buildKeyboard('61', '61 Keys', 36, 61);

/** Smaller boards, handy on narrow screens. */
export const KEYBOARD_49 = buildKeyboard('49', '49 Keys', 36, 49);
export const KEYBOARD_25 = buildKeyboard('25', '25 Keys', 48, 25);

export const KEYBOARD_LAYOUTS: readonly KeyboardLayout[] = [
  KEYBOARD_25,
  KEYBOARD_49,
  KEYBOARD_61,
];

export function getKeyboardLayout(id: string): KeyboardLayout {
  return KEYBOARD_LAYOUTS.find((layout) => layout.id === id) ?? KEYBOARD_61;
}

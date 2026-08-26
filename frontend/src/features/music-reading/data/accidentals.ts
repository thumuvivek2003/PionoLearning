import type { Clef, StaffNote, Step } from '../reading.types';
import { noteAt } from './staff';

/**
 * The three signs 6.5 teaches.
 *
 * An accidental does not move a note on the page — it changes what the same
 * position sounds like, which is exactly why it is drawn beside the notehead
 * rather than above or below it. That distinction is the bucket's content, so
 * the model keeps position and alteration apart everywhere.
 */
export type Accidental = 'sharp' | 'flat' | 'natural';

export const ACCIDENTALS: readonly Accidental[] = ['sharp', 'flat', 'natural'];

/** How each sign is drawn. */
export const GLYPH: Readonly<Record<Accidental, string>> = {
  sharp: '♯',
  flat: '♭',
  natural: '♮',
};

/** How each sign is said. */
export const SIGN_NAME: Readonly<Record<Accidental, string>> = {
  sharp: 'sharp',
  flat: 'flat',
  natural: 'natural',
};

/** What each sign does, in one line — the answer 6.5.1 to 6.5.3 want. */
export const SIGN_EFFECT: Readonly<Record<Accidental, string>> = {
  sharp: 'raises the note one semitone',
  flat: 'lowers the note one semitone',
  natural: 'cancels a sharp or a flat',
};

/** The semitones a sign shifts a note by. */
export function shiftOf(accidental: Accidental | null): number {
  if (accidental === 'sharp') return 1;
  if (accidental === 'flat') return -1;
  return 0;
}

/** A note with a sign attached: same place on the page, different key. */
export interface AlteredNote extends StaffNote {
  accidental: Accidental | null;
  /** "F#4" — the letter, the sign and the octave. */
  soundingName: string;
  /** The key it actually asks for. */
  soundingMidi: number;
}

export function alteredNote(clef: Clef, step: Step, accidental: Accidental | null): AlteredNote {
  const note = noteAt(clef, step);
  const shift = shiftOf(accidental);
  const sign = accidental === 'sharp' ? '#' : accidental === 'flat' ? 'b' : '';

  return {
    ...note,
    accidental,
    soundingName: `${note.letter}${sign}${note.octave}`,
    soundingMidi: note.midi + shift,
  };
}

/**
 * Which signs are worth asking about at a position.
 *
 * A natural only means something where there is something to cancel, and this
 * bucket has no key signatures in play yet — so a natural is asked about as a
 * sign to recognise rather than as a note to play differently.
 */
export function playableSigns(): readonly Accidental[] {
  return ['sharp', 'flat'];
}

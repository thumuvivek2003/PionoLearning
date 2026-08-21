import { LETTER_PITCH_CLASS, toPitchClass } from '../data/noteNames';
import type { Letter, SpelledNote } from '../types/music.types';

const NOTE_PATTERN = /^([A-Ga-g])([#b♯♭x]*)$/;

/** Accidental characters mapped to their semitone shift. */
const ACCIDENTAL_SHIFT: Readonly<Record<string, number>> = {
  '#': 1,
  '♯': 1,
  x: 2,
  b: -1,
  '♭': -1,
};

/**
 * Parse a written note ("C", "f#", "Bb", "C##") into a spelled note.
 * Returns null when the text is not a note — callers decide how to report it.
 */
export function parseNote(input: string): SpelledNote | null {
  const text = input.trim();
  const match = NOTE_PATTERN.exec(text);
  if (!match) return null;

  const [, rawLetter = '', rawAccidentals = ''] = match;
  const letter = rawLetter.toUpperCase() as Letter;

  let alteration = 0;
  for (const char of rawAccidentals) {
    const shift = ACCIDENTAL_SHIFT[char];
    if (shift === undefined) return null;
    alteration += shift;
  }
  if (Math.abs(alteration) > 2) return null;

  return createNote(letter, alteration);
}

/** Build a spelled note from a letter plus an alteration in semitones. */
export function createNote(letter: Letter, alteration: number): SpelledNote {
  return {
    name: letter + accidentalSymbol(alteration),
    letter,
    alteration,
    pitchClass: toPitchClass(LETTER_PITCH_CLASS[letter] + alteration),
  };
}

export function accidentalSymbol(alteration: number): string {
  if (alteration === 0) return '';
  return alteration > 0 ? '#'.repeat(alteration) : 'b'.repeat(-alteration);
}

/** True when two notes sound the same, however they are written (C# === Db). */
export function isEnharmonic(a: SpelledNote, b: SpelledNote): boolean {
  return a.pitchClass === b.pitchClass;
}

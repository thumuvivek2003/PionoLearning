import { LETTERS, LETTER_PITCH_CLASS, SEMITONES_PER_OCTAVE } from '../data/noteNames';
import type { AccidentalPreference, IntervalSet, Letter, SpelledNote } from '../types/music.types';
import { createNote } from './normalizeNote';

/** Keys that are conventionally written with flats rather than sharps. */
const FLAT_ROOTS: ReadonlySet<string> = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']);

export function preferredAccidental(root: SpelledNote): AccidentalPreference {
  if (root.alteration < 0) return 'flat';
  if (root.alteration > 0) return 'sharp';
  return FLAT_ROOTS.has(root.name) ? 'flat' : 'sharp';
}

function letterAt(start: Letter, steps: number): Letter {
  const index = LETTERS.indexOf(start);
  return LETTERS[(index + steps) % LETTERS.length] as Letter;
}

/**
 * Spell a set of intervals above a root.
 *
 * Seven-note scales get one letter per degree (the musically correct spelling,
 * so D Major reads D E F# G A B C# and never D E Gb G A B Db). Everything else
 * falls back to the accidental preference implied by the root.
 */
export function spellIntervals(
  root: SpelledNote,
  intervals: IntervalSet,
  options: { oneLetterPerDegree?: boolean } = {},
): SpelledNote[] {
  const oneLetterPerDegree = options.oneLetterPerDegree ?? intervals.length === 7;
  const preference = preferredAccidental(root);

  return intervals.map((semitones, degree) => {
    if (degree === 0) return root;

    if (oneLetterPerDegree) {
      const letter = letterAt(root.letter, degree);
      const naturalDistance = mod12(LETTER_PITCH_CLASS[letter] - LETTER_PITCH_CLASS[root.letter]);
      const targetDistance = mod12(semitones + root.alteration);
      const alteration = normalizeAlteration(targetDistance - naturalDistance);
      return createNote(letter, alteration);
    }

    return spellByPreference(root, semitones, preference);
  });
}

/** Spell a single interval above the root using a sharp/flat preference. */
export function spellByPreference(
  root: SpelledNote,
  semitones: number,
  preference: AccidentalPreference,
): SpelledNote {
  const targetPc = mod12(LETTER_PITCH_CLASS[root.letter] + root.alteration + semitones);

  for (const letter of LETTERS) {
    if (LETTER_PITCH_CLASS[letter] === targetPc) return createNote(letter, 0);
  }

  const alteration = preference === 'flat' ? -1 : 1;
  for (const letter of LETTERS) {
    if (mod12(LETTER_PITCH_CLASS[letter] + alteration) === targetPc) {
      return createNote(letter, alteration);
    }
  }

  // Unreachable for 12-TET, but keeps the function total.
  return createNote('C', 0);
}

function mod12(value: number): number {
  return ((value % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
}

/** Fold a raw semitone difference into the -2..+2 range accidentals can express. */
function normalizeAlteration(diff: number): number {
  let value = diff;
  while (value > 6) value -= SEMITONES_PER_OCTAVE;
  while (value < -6) value += SEMITONES_PER_OCTAVE;
  return value;
}

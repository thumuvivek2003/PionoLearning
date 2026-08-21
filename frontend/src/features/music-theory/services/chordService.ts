import {
  CHORD_TYPES,
  MAJOR_DIATONIC_SEVENTHS,
  MAJOR_DIATONIC_TRIADS,
  MINOR_DIATONIC_SEVENTHS,
  MINOR_DIATONIC_TRIADS,
  ROMAN_NUMERALS,
  chordTypeFromSymbol,
  getChordType,
} from '../data/chords';
import type { Chord, ChordType, PitchClass, Scale, SpelledNote } from '../types/music.types';
import { parseNote } from '../utils/normalizeNote';
import { spellIntervals } from '../utils/spelling';

/**
 * Answers one question only: "which notes belong to this chord?"
 * Chords are spelled from the root so Db7 reads Db F Ab Cb, not C# E# G# B.
 */
export function buildChord(root: SpelledNote, type: ChordType): Chord {
  const notes = spellIntervals(root, type.intervals, { oneLetterPerDegree: false });
  return {
    root,
    type,
    symbol: root.name + type.symbol,
    notes,
    pitchClasses: notes.map((note) => note.pitchClass) as PitchClass[],
  };
}

export function buildChordFrom(rootName: string, chordTypeId: string): Chord | null {
  const root = parseNote(rootName);
  const type = getChordType(chordTypeId);
  if (!root || !type) return null;
  return buildChord(root, type);
}

const CHORD_SYMBOL_PATTERN = /^([A-Ga-g][#b♯♭x]*)(.*)$/;

/** Parse a typed chord symbol such as "Dm7", "F#m7b5" or "Bb". */
export function parseChordSymbol(input: string): Chord | null {
  const match = CHORD_SYMBOL_PATTERN.exec(input.trim());
  if (!match) return null;

  const [, rootText = '', suffix = ''] = match;
  const root = parseNote(rootText);
  if (!root) return null;

  const type = chordTypeFromSymbol(suffix);
  if (!type) return null;

  return buildChord(root, type);
}

export type DiatonicSet = 'triads' | 'sevenths';

/** Chords harmonised from every degree of a diatonic scale. */
export function diatonicChords(scale: Scale, set: DiatonicSet = 'triads'): Chord[] {
  if (!scale.type.diatonic) return [];

  const isMinor = scale.type.intervals[2] === 3;
  const recipe =
    set === 'sevenths'
      ? isMinor
        ? MINOR_DIATONIC_SEVENTHS
        : MAJOR_DIATONIC_SEVENTHS
      : isMinor
        ? MINOR_DIATONIC_TRIADS
        : MAJOR_DIATONIC_TRIADS;

  return scale.notes.flatMap((note, degree) => {
    const typeId = recipe[degree];
    const type = typeId ? getChordType(typeId) : undefined;
    return type ? [buildChord(note, type)] : [];
  });
}

/** Roman-numeral label for a scale degree, cased by chord quality (ii, V, vii°). */
export function romanNumeral(degree: number, chord: Chord): string {
  const base = ROMAN_NUMERALS[degree] ?? '';
  switch (chord.type.quality) {
    case 'minor':
      return base.toLowerCase();
    case 'diminished':
      return `${base.toLowerCase()}°`;
    case 'augmented':
      return `${base}+`;
    default:
      return base;
  }
}

/** Every chord of one type across all twelve roots, e.g. all dominant 7ths. */
export function chordsOfType(chordTypeId: string, roots: readonly string[]): Chord[] {
  const type = getChordType(chordTypeId);
  if (!type) return [];
  return roots.flatMap((rootName) => {
    const root = parseNote(rootName);
    return root ? [buildChord(root, type)] : [];
  });
}

/** Spelled-out note names for a chord, e.g. "D · F · A". */
export function chordNoteNames(chord: Chord, separator = ' · '): string {
  return chord.notes.map((note) => note.name).join(separator);
}

export { CHORD_TYPES };

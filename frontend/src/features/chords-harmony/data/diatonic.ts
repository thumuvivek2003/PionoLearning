import { buildScaleFrom, diatonicChords, romanNumeral } from '@/features/music-theory';
import type { ChordForm, ChordQuality } from '../chords.types';
import { chordForm, qualityName } from './triads';

/**
 * The chords a key contains, and the numerals that name them.
 *
 * 5.6's argument is that a key's chords are not a list to learn but a
 * consequence of its scale: harmonise every degree and the pattern
 * major-minor-minor-major-major-minor-diminished falls out. So the family is
 * derived through the shared chord service, and the reference's table is used to
 * check the result rather than to produce it.
 */

/** A chord of a key, with its position and numeral. */
export interface DegreeChord {
  /** 1 to 7. */
  degree: number;
  /** "I", "ii", "vii°" — cased by quality, which is the whole convention. */
  numeral: string;
  form: ChordForm;
}

/** Which kind of key a family is drawn from. */
export type KeyMode = 'major' | 'minor';

/** The quality of each degree of a major key, in order. */
export const MAJOR_PATTERN: readonly ChordQuality[] = [
  'major',
  'minor',
  'minor',
  'major',
  'major',
  'minor',
  'dim',
];

/**
 * And of a natural minor key.
 *
 * Note the fifth: natural minor gives a *minor* v. The major V heard in most
 * minor-key music is borrowed from the harmonic minor, which is a later bucket —
 * so the drills here use the natural-minor chord and say so rather than quietly
 * substituting one the scale does not contain.
 */
export const MINOR_PATTERN: readonly ChordQuality[] = [
  'minor',
  'dim',
  'major',
  'minor',
  'minor',
  'major',
  'major',
];

function patternFor(mode: KeyMode): readonly ChordQuality[] {
  return mode === 'minor' ? MINOR_PATTERN : MAJOR_PATTERN;
}

/** "M – m – m – M – M – m – dim", the pattern the reference asks you to memorise. */
export function patternLine(mode: KeyMode = 'major'): string {
  return patternFor(mode)
    .map((quality) => (quality === 'dim' ? 'dim' : quality === 'major' ? 'M' : 'm'))
    .join(' – ');
}

/** Every chord of a key, degree 1 first. */
export function familyOf(key: string, mode: KeyMode = 'major'): readonly DegreeChord[] {
  const scale = buildScaleFrom(key, mode === 'minor' ? 'natural-minor' : 'major');
  if (!scale) return [];

  const pattern = patternFor(mode);
  return diatonicChords(scale, 'triads').flatMap((chord, index) => {
    const quality = pattern[index];
    const form = quality ? chordForm(chord.root.name, quality) : null;
    return form
      ? [{ degree: index + 1, numeral: romanNumeral(index, chord), form }]
      : [];
  });
}

/** The chord a numeral names in a key, or undefined if it is not diatonic. */
export function chordFor(key: string, numeral: string, mode: KeyMode = 'major'): DegreeChord | undefined {
  return familyOf(key, mode).find((entry) => entry.numeral === numeral);
}

/** The numeral a chord answers to in a key, or null when it is not in the key. */
export function numeralOf(key: string, form: ChordForm, mode: KeyMode = 'major'): string | null {
  return familyOf(key, mode).find((entry) => entry.form.id === form.id)?.numeral ?? null;
}

/** The numerals of a key, in order: I ii iii IV V vi vii°. */
export function numeralsOf(key: string, mode: KeyMode = 'major'): readonly string[] {
  return familyOf(key, mode).map((entry) => entry.numeral);
}

/** "C – Dm – Em – F – G – Am – Bdim" — the family written out. */
export function familyLine(key: string, mode: KeyMode = 'major'): string {
  return familyOf(key, mode)
    .map((entry) => entry.form.symbol)
    .join(' – ');
}

/** What a degree does in a key, in the words the reference uses. */
const ROLES: Readonly<Record<number, string>> = {
  1: 'home — the chord everything else is measured against',
  2: 'a minor chord that pulls towards the fifth',
  3: 'a minor chord, and the weakest of the seven',
  4: 'the move away from home',
  5: 'the tension that wants to resolve to home',
  6: 'the relative minor, sharing the key’s own notes',
  7: 'built on the leading tone, and pulling hard upward to home',
};

export function roleOf(degree: number): string {
  return ROLES[degree] ?? '';
}

/** "ii is Dm, a minor chord" — one line about a degree in a key. */
export function degreeLine(key: string, degree: number): string {
  const entry = familyOf(key)[degree - 1];
  if (!entry) return '';
  return `${entry.numeral} in ${key} major is ${entry.form.symbol} — ${qualityName(entry.form.quality)}`;
}

/** Keys the progression work uses, in the order the reference introduces them. */
export const PROGRESSION_KEYS: readonly string[] = ['C', 'G', 'D', 'A', 'E', 'F'];

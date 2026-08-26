import {
  FLAT_NAMES,
  SHARP_NAMES,
  buildChordFrom,
  getChordType,
  isBlackPitchClass,
} from '@/features/music-theory';
import type { PitchClass, SpelledNote } from '@/features/music-theory';
import type { ChordForm, ChordQuality, TriadQuality } from '../chords.types';

/**
 * Triads, built from the shared chord service rather than listed.
 *
 * Level 5's whole argument is that twenty-four chords are two formulas, so the
 * code says it that way: a root and a quality go in, the notes come out, and
 * nothing here holds a table of chords that could disagree with the theory the
 * rest of the app uses. Spelling comes with it — C minor arrives as C Eb G, not
 * C D# G, which is the distinction 5.1.5 turns on.
 */

/** Where the third sits, in semitones. The one number that decides quality. */
export const MAJOR_THIRD = 4;
export const MINOR_THIRD = 3;
/** The fifth is the same in both, which is why it is never the answer. */
export const PERFECT_FIFTH = 7;

/** The position of each chord tone in the triad, counting from the root. */
export const ROOT_AT = 0;
export const THIRD_AT = 1;
export const FIFTH_AT = 2;

export const QUALITIES: readonly TriadQuality[] = ['major', 'minor'];
/** The three sevenths 5.5 teaches, in the order it teaches them. */
export const SEVENTH_QUALITIES: readonly ChordQuality[] = ['maj7', 'dom7', 'min7'];
export const ALL_QUALITIES: readonly ChordQuality[] = [...QUALITIES, ...SEVENTH_QUALITIES];

/** The chord-type id each quality maps to in the shared chord service. */
const TYPE_IDS: Readonly<Record<ChordQuality, string>> = {
  major: 'major',
  minor: 'minor',
  dim: 'dim',
  maj7: 'maj7',
  dom7: 'dom7',
  min7: 'min7',
};

/** How a quality is said, for prompts and score labels. */
const QUALITY_NAMES: Readonly<Record<ChordQuality, string>> = {
  major: 'major',
  minor: 'minor',
  dim: 'diminished',
  maj7: 'major 7',
  dom7: 'dominant 7',
  min7: 'minor 7',
};

export function qualityName(quality: ChordQuality): string {
  return QUALITY_NAMES[quality];
}

/**
 * A chord degree, written the way a formula writes it.
 *
 * Derived from the interval rather than listed per quality, so a chord's
 * formula can never disagree with its notes — 3 semitones is always a flat
 * third, in a minor triad and a minor seventh alike.
 */
const DEGREE_BY_SEMITONE: Readonly<Record<number, string>> = {
  0: '1',
  3: '♭3',
  6: '♭5',
  4: '3',
  7: '5',
  10: '♭7',
  11: '7',
};

export function degreeLabel(semitones: number): string {
  return DEGREE_BY_SEMITONE[semitones] ?? String(semitones);
}

/** How the formula is written for each quality — the thing to be recited. */
export function formulaOf(quality: ChordQuality): readonly string[] {
  const type = getChordType(TYPE_IDS[quality]);
  return (type?.intervals ?? [0, 4, 7]).map(degreeLabel);
}

export function formulaLine(quality: ChordQuality): string {
  return formulaOf(quality).join(' - ');
}

/** The twelve roots, spelled the way a chord chart writes them. */
export const TRIAD_ROOTS: readonly string[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

/** The white-key roots 5.1 works through before it opens up to all twelve. */
export const NATURAL_ROOTS: readonly string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * Any of level 5's chords, built from the shared chord service.
 *
 * One function for triads and sevenths because they differ only in how many
 * notes come back — the formula, the spelling and the degrees all come from the
 * same place, so a seventh chord cannot end up spelled by different rules than
 * the triad inside it.
 */
export function chordForm(root: string, quality: ChordQuality): ChordForm | null {
  const chord = buildChordFrom(root, TYPE_IDS[quality]);
  const type = getChordType(TYPE_IDS[quality]);
  if (!chord || !type) return null;

  return {
    id: `${root}-${quality}`,
    root,
    quality,
    symbol: chord.symbol,
    label: `${root} ${qualityName(quality)}`,
    notes: chord.notes,
    pitchClasses: chord.pitchClasses,
    degrees: formulaOf(quality),
    tones: chord.notes.length,
  };
}

/** The triad-only view, for the practices that must not be offered a seventh. */
export function triadOf(root: string, quality: TriadQuality): ChordForm | null {
  return chordForm(root, quality);
}

/** The note that decides whether a chord is major or minor. */
export function thirdOf(triad: ChordForm): SpelledNote | undefined {
  return triad.notes[THIRD_AT];
}

/**
 * The same root as a major and a minor, for the comparisons.
 *
 * Returned as a pair rather than looked up twice, because every practice that
 * teaches the third needs both halves and needs them to agree on the root.
 */
export function pairOn(root: string): readonly ChordForm[] {
  return QUALITIES.flatMap((quality) => {
    const triad = triadOf(root, quality);
    return triad ? [triad] : [];
  });
}

/**
 * Which pitch classes two triads on the same root disagree about.
 *
 * Should always be exactly the third — that claim is the bucket, so the checks
 * assert it across all twelve roots rather than trusting the prose.
 */
export function differenceBetween(a: ChordForm, b: ChordForm): readonly PitchClass[] {
  const inB = new Set(b.pitchClasses);
  return a.pitchClasses.filter((pitch) => !inB.has(pitch));
}

/** Every triad the bucket can draw: twelve roots, both qualities. */
export const ALL_TRIADS: readonly ChordForm[] = TRIAD_ROOTS.flatMap((root) => pairOn(root));

export function triadById(id: string): ChordForm | undefined {
  return ALL_TRIADS.find((triad) => triad.id === id);
}

/** How a chord tone reads in a prompt: "the third", "the fifth". */
export function toneName(position: number): string {
  if (position === ROOT_AT) return 'the root';
  if (position === THIRD_AT) return 'the third';
  if (position === FIFTH_AT) return 'the fifth';
  return 'the seventh';
}

/** The five black keys, under both of their names. */
export interface EnharmonicPair {
  sharp: string;
  flat: string;
  pitchClass: PitchClass;
}

/**
 * The enharmonic pairs, read off the two name tables.
 *
 * 5.2.9 exists because a contest may call for Ab major when you learnt it as
 * G# major, and they are the same three keys. Deriving the pairs rather than
 * listing them means the app cannot disagree with itself about which names go
 * together.
 */
export const ENHARMONIC_PAIRS: readonly EnharmonicPair[] = SHARP_NAMES.flatMap((sharp, pitch) =>
  isBlackPitchClass(pitch as PitchClass)
    ? [{ sharp, flat: FLAT_NAMES[pitch] as string, pitchClass: pitch as PitchClass }]
    : [],
);

/** The other name for a black key, or null for a white one. */
export function enharmonicOf(name: string): string | null {
  const pair = ENHARMONIC_PAIRS.find((entry) => entry.sharp === name || entry.flat === name);
  if (!pair) return null;
  return pair.sharp === name ? pair.flat : pair.sharp;
}

/** Black-key roots written as sharps — how 5.2.8 and 5.3.8 list them. */
export const SHARP_ROOTS: readonly string[] = ENHARMONIC_PAIRS.map((pair) => pair.sharp);
/** The same five written as flats. */
export const FLAT_ROOTS: readonly string[] = ENHARMONIC_PAIRS.map((pair) => pair.flat);

/**
 * Where a note sits relative to its white neighbour.
 *
 * The references teach every black chord tone this way — "Eb is the black key
 * immediately to the left of E" — so the sentence is generated from the
 * spelling rather than written out fourteen times.
 */
export function landmarkFor(note: SpelledNote): string {
  if (note.alteration === 0) return `${note.name} is a white key.`;
  const side = note.alteration > 0 ? 'right' : 'left';
  return `${note.name} is the black key immediately to the ${side} of ${note.letter}.`;
}

/** True when every note of the triad is a white key. */
export function isAllWhite(triad: ChordForm): boolean {
  return triad.notes.every((note) => note.alteration === 0);
}

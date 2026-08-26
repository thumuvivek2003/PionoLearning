import type { ChordType } from '../types/music.types';

/** Chord recipes, ordered from simplest to most colourful. */
export const CHORD_TYPES: readonly ChordType[] = [
  { id: 'major', symbol: '', name: 'Major triad', intervals: [0, 4, 7], quality: 'major', tertian: true },
  { id: 'minor', symbol: 'm', name: 'Minor triad', intervals: [0, 3, 7], quality: 'minor', tertian: true },
  { id: 'dim', symbol: 'dim', name: 'Diminished triad', intervals: [0, 3, 6], quality: 'diminished', tertian: true },
  { id: 'aug', symbol: 'aug', name: 'Augmented triad', intervals: [0, 4, 8], quality: 'augmented', tertian: true },
  { id: 'sus2', symbol: 'sus2', name: 'Suspended 2nd', intervals: [0, 2, 7], quality: 'suspended' },
  { id: 'sus4', symbol: 'sus4', name: 'Suspended 4th', intervals: [0, 5, 7], quality: 'suspended' },
  { id: 'maj7', symbol: 'maj7', name: 'Major 7th', intervals: [0, 4, 7, 11], quality: 'major', tertian: true },
  { id: 'dom7', symbol: '7', name: 'Dominant 7th', intervals: [0, 4, 7, 10], quality: 'major', tertian: true },
  { id: 'min7', symbol: 'm7', name: 'Minor 7th', intervals: [0, 3, 7, 10], quality: 'minor', tertian: true },
  { id: 'min-maj7', symbol: 'mMaj7', name: 'Minor major 7th', intervals: [0, 3, 7, 11], quality: 'minor', tertian: true },
  { id: 'half-dim7', symbol: 'm7b5', name: 'Half-diminished 7th', intervals: [0, 3, 6, 10], quality: 'diminished', tertian: true },
  { id: 'dim7', symbol: 'dim7', name: 'Diminished 7th', intervals: [0, 3, 6, 9], quality: 'diminished', tertian: true },
  { id: 'maj6', symbol: '6', name: 'Major 6th', intervals: [0, 4, 7, 9], quality: 'major' },
  { id: 'min6', symbol: 'm6', name: 'Minor 6th', intervals: [0, 3, 7, 9], quality: 'minor' },
];

const CHORD_BY_ID: ReadonlyMap<string, ChordType> = new Map(
  CHORD_TYPES.map((type) => [type.id, type]),
);

/**
 * Symbol lookup for parsing typed chords.
 *
 * Case is significant here: "M" means major and "m" means minor, so an
 * exact match is always tried before the forgiving lower-cased one.
 */
const CHORD_BY_EXACT_SYMBOL: readonly (readonly [string, ChordType])[] = CHORD_TYPES.flatMap(
  (type) => symbolAliases(type).map((alias) => [alias, type] as const),
);

const CHORD_BY_LOWER_SYMBOL: readonly (readonly [string, ChordType])[] = CHORD_TYPES.flatMap(
  (type) => symbolAliases(type).map((alias) => [alias.toLowerCase(), type] as const),
);

/** Alternative spellings a learner is likely to type. */
function symbolAliases(type: ChordType): string[] {
  const aliases: Record<string, string[]> = {
    major: ['', 'maj', 'M'],
    minor: ['m', 'min', '-'],
    dim: ['dim', 'o', '°'],
    aug: ['aug', '+'],
    maj7: ['maj7', 'M7', 'Δ7', 'Δ'],
    dom7: ['7', 'dom7'],
    min7: ['m7', 'min7', '-7'],
    'min-maj7': ['mMaj7', 'mM7', 'minmaj7'],
    'half-dim7': ['m7b5', 'ø', 'ø7', 'halfdim'],
    dim7: ['dim7', 'o7', '°7'],
    maj6: ['6', 'maj6', 'M6'],
    min6: ['m6', 'min6'],
    sus2: ['sus2'],
    sus4: ['sus4', 'sus'],
  };
  return aliases[type.id] ?? [type.symbol];
}

export function getChordType(id: string): ChordType | undefined {
  return CHORD_BY_ID.get(id);
}

/** Resolve a typed suffix ("m7", "M", "Δ", "") to a chord type. */
export function chordTypeFromSymbol(symbol: string): ChordType | undefined {
  const needle = symbol.trim();
  const exact = CHORD_BY_EXACT_SYMBOL.find(([alias]) => alias === needle);
  if (exact) return exact[1];
  const lowered = needle.toLowerCase();
  return CHORD_BY_LOWER_SYMBOL.find(([alias]) => alias === lowered)?.[1];
}

/** Triads built on each degree of the major scale. */
export const MAJOR_DIATONIC_TRIADS: readonly string[] = [
  'major',
  'minor',
  'minor',
  'major',
  'major',
  'minor',
  'dim',
];

/** Triads built on each degree of the natural minor scale. */
export const MINOR_DIATONIC_TRIADS: readonly string[] = [
  'minor',
  'dim',
  'major',
  'minor',
  'minor',
  'major',
  'major',
];

/** Seventh chords built on each degree of the major scale. */
export const MAJOR_DIATONIC_SEVENTHS: readonly string[] = [
  'maj7',
  'min7',
  'min7',
  'maj7',
  'dom7',
  'min7',
  'half-dim7',
];

/** Seventh chords built on each degree of the natural minor scale. */
export const MINOR_DIATONIC_SEVENTHS: readonly string[] = [
  'min7',
  'half-dim7',
  'maj7',
  'min7',
  'min7',
  'maj7',
  'dom7',
];

export const ROMAN_NUMERALS: readonly string[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

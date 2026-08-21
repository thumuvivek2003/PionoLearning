import type { ScaleType } from '../types/music.types';

/**
 * Scale recipes. Adding a scale here makes it available everywhere —
 * presets, custom parsing and diatonic chord building all read this list.
 */
export const SCALE_TYPES: readonly ScaleType[] = [
  {
    id: 'major',
    name: 'Major',
    short: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    diatonic: true,
  },
  {
    id: 'natural-minor',
    name: 'Natural Minor',
    short: 'Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    diatonic: true,
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic Minor',
    short: 'Harm. Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    diatonic: true,
  },
  {
    id: 'melodic-minor',
    name: 'Melodic Minor',
    short: 'Mel. Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    diatonic: true,
  },
  {
    id: 'dorian',
    name: 'Dorian',
    short: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    diatonic: true,
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    short: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    diatonic: true,
  },
  {
    id: 'major-pentatonic',
    name: 'Major Pentatonic',
    short: 'Maj Pent',
    intervals: [0, 2, 4, 7, 9],
    diatonic: false,
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor Pentatonic',
    short: 'Min Pent',
    intervals: [0, 3, 5, 7, 10],
    diatonic: false,
  },
  {
    id: 'blues',
    name: 'Blues',
    short: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    diatonic: false,
  },
  {
    id: 'chromatic',
    name: 'Chromatic',
    short: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    diatonic: false,
  },
];

const SCALE_INDEX: ReadonlyMap<string, ScaleType> = new Map(
  SCALE_TYPES.map((type) => [type.id, type]),
);

export function getScaleType(id: string): ScaleType | undefined {
  return SCALE_INDEX.get(id);
}

/**
 * Roots used to build the preset list, written the way musicians normally
 * write those keys (flat keys as flats, sharp keys as sharps).
 */
export const COMMON_MAJOR_ROOTS: readonly string[] = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'Db',
  'Ab',
  'Eb',
  'Bb',
  'F',
];

export const COMMON_MINOR_ROOTS: readonly string[] = [
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'G#',
  'Eb',
  'Bb',
  'F',
  'C',
  'G',
  'D',
];

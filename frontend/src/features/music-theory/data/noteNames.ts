import type { AccidentalPreference, Letter, PitchClass } from '../types/music.types';

export const SEMITONES_PER_OCTAVE = 12;

export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/** Semitone offset of each natural letter within the octave. */
export const LETTER_PITCH_CLASS: Readonly<Record<Letter, PitchClass>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export const SHARP_NAMES: readonly string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export const FLAT_NAMES: readonly string[] = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

/** Pitch classes that require an accidental to write. */
export const BLACK_PITCH_CLASSES: ReadonlySet<PitchClass> = new Set<PitchClass>([1, 3, 6, 8, 10]);

export function isBlackPitchClass(pc: PitchClass): boolean {
  return BLACK_PITCH_CLASSES.has(pc);
}

/** Wrap any integer into a valid pitch class. */
export function toPitchClass(value: number): PitchClass {
  return (((value % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) %
    SEMITONES_PER_OCTAVE) as PitchClass;
}

/** Default spelling for a pitch class when no key context is available. */
export function pitchClassName(
  pc: PitchClass,
  preference: AccidentalPreference = 'sharp',
): string {
  const table = preference === 'flat' ? FLAT_NAMES : SHARP_NAMES;
  return table[pc] as string;
}

/** Both enharmonic spellings, e.g. 1 -> ["C#", "Db"]; naturals return one entry. */
export function enharmonicNames(pc: PitchClass): string[] {
  const sharp = SHARP_NAMES[pc] as string;
  const flat = FLAT_NAMES[pc] as string;
  return sharp === flat ? [sharp] : [sharp, flat];
}

/** MIDI number for a pitch class in a given octave (C4 = 60, scientific pitch). */
export function toMidi(pc: PitchClass, octave: number): number {
  return (octave + 1) * SEMITONES_PER_OCTAVE + pc;
}

/** Equal-tempered frequency of a MIDI note, A4 = 440 Hz. */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

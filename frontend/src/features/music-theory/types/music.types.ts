/** Pitch class: 0 = C, 1 = C#/Db … 11 = B. */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Natural letter of a note, before any accidental is applied. */
export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** How an accidental should be spelled when we have a free choice. */
export type AccidentalPreference = 'sharp' | 'flat';

/** A note that knows both how it is written and how it sounds. */
export interface SpelledNote {
  /** Display form, e.g. "C#", "Eb", "B". */
  name: string;
  letter: Letter;
  /** -2..+2 semitones of accidental. */
  alteration: number;
  pitchClass: PitchClass;
}

/** Interval recipe measured in semitones from the root. */
export type IntervalSet = readonly number[];

export interface ScaleType {
  id: string;
  name: string;
  /** Short suffix used in labels, e.g. "Major", "Minor". */
  short: string;
  intervals: IntervalSet;
  /** True for 7-note scales that can be spelled one-letter-per-degree. */
  diatonic: boolean;
}

export interface ChordType {
  id: string;
  /** Suffix appended to the root, e.g. "m", "7", "maj7". */
  symbol: string;
  name: string;
  intervals: IntervalSet;
  /** Roman-numeral case hint used when labelling scale degrees. */
  quality: 'major' | 'minor' | 'diminished' | 'augmented' | 'suspended';
}

export interface Scale {
  root: SpelledNote;
  type: ScaleType;
  /** Ascending notes of one octave, root first. */
  notes: SpelledNote[];
}

export interface Chord {
  root: SpelledNote;
  type: ChordType;
  /** Chord symbol, e.g. "Dm7". */
  symbol: string;
  notes: SpelledNote[];
  pitchClasses: PitchClass[];
}

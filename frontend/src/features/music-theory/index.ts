/** Public surface of the music-theory domain. Nothing above this layer
 *  should reach into its data/ or utils/ folders directly. */
export type {
  AccidentalPreference,
  Chord,
  ChordType,
  IntervalSet,
  Letter,
  PitchClass,
  Scale,
  ScaleType,
  SpelledNote,
} from './types/music.types';

export {
  BLACK_PITCH_CLASSES,
  FLAT_NAMES,
  LETTERS,
  LETTER_PITCH_CLASS,
  SEMITONES_PER_OCTAVE,
  SHARP_NAMES,
  enharmonicNames,
  isBlackPitchClass,
  midiToFrequency,
  pitchClassName,
  toMidi,
  toPitchClass,
} from './data/noteNames';

export {
  CHORD_TYPES,
  MAJOR_DIATONIC_SEVENTHS,
  MAJOR_DIATONIC_TRIADS,
  MINOR_DIATONIC_SEVENTHS,
  MINOR_DIATONIC_TRIADS,
  chordTypeFromSymbol,
  getChordType,
} from './data/chords';

export {
  COMMON_MAJOR_ROOTS,
  COMMON_MINOR_ROOTS,
  SCALE_TYPES,
  getScaleType,
} from './data/scales';

export { intervalName, intervalSteps } from './data/intervals';
export type { NoteLabel, NoteNaming } from './data/noteLabels';
export { noteKey, noteLabel } from './data/noteLabels';
export { accidentalSymbol, createNote, isEnharmonic, parseNote } from './utils/normalizeNote';
export { dedupeBy, formatNoteList, parseNoteList, tokenize } from './utils/parseNotes';
export type { ParsedList } from './utils/parseNotes';
export { preferredAccidental, spellByPreference, spellIntervals } from './utils/spelling';

export { buildScale, buildScaleFrom, scaleLabel } from './services/scaleService';
export {
  buildChord,
  buildChordFrom,
  chordNoteNames,
  chordsOfType,
  diatonicChords,
  parseChordSymbol,
  romanNumeral,
} from './services/chordService';
export type { DiatonicSet } from './services/chordService';

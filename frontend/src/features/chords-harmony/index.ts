/**
 * Level 5 — chords and harmony.
 *
 * Triads first: two formulas, one difference between them, and the practice of
 * getting from a root to the right three notes without thinking. The theory
 * comes from music-theory, the board from piano and the engines from the
 * practice kit; what lives here is the joining of them for chords.
 */
export type { ChordForm, ChordQuality, Inversion, TriadQuality, Voicing } from './chords.types';
export {
  INVERSIONS,
  bassOf,
  inversionFrom,
  inversionName,
  inversionShort,
  movesFrom,
  nearestMove,
  patternOf,
  playable,
  positionsOf,
  travel,
  voicingOf,
} from './data/inversions';
export type { Move } from './data/inversions';
export type { EnharmonicPair } from './data/triads';
export {
  ALL_QUALITIES,
  ALL_TRIADS,
  ENHARMONIC_PAIRS,
  SEVENTH_QUALITIES,
  chordForm,
  degreeLabel,
  qualityName,
  FLAT_ROOTS,
  SHARP_ROOTS,
  enharmonicOf,
  isAllWhite,
  landmarkFor,
  FIFTH_AT,
  MAJOR_THIRD,
  MINOR_THIRD,
  NATURAL_ROOTS,
  PERFECT_FIFTH,
  QUALITIES,
  ROOT_AT,
  THIRD_AT,
  TRIAD_ROOTS,
  differenceBetween,
  formulaLine,
  formulaOf,
  pairOn,
  thirdOf,
  toneName,
  triadById,
  triadOf,
} from './data/triads';
export type { TriadBuildConfig } from './data/buildDrills';
export { TRIAD_BUILD_DRILLS, allowanceAt, getTriadBuildDrill } from './data/buildDrills';
export type { TriadQuizConfig, TriadTask } from './data/quizDrills';
export { TRIAD_QUIZZES, getTriadQuiz, isHeard, isPressed } from './data/quizDrills';
export type { DegreeChord, KeyMode } from './data/diatonic';
export {
  MAJOR_PATTERN,
  MINOR_PATTERN,
  PROGRESSION_KEYS,
  chordFor,
  degreeLine,
  familyLine,
  familyOf,
  numeralOf,
  numeralsOf,
  patternLine,
  roleOf,
} from './data/diatonic';
export type { ProgressionConfig } from './data/progressions';
export {
  PROGRESSION_DRILLS,
  PROGRESSION_POOL,
  allowanceFor,
  getProgressionDrill,
} from './data/progressions';
export type { ChordRhythmConfig, Slot, StrumPattern } from './data/rhythmDrills';
export {
  CHORD_RHYTHM_DRILLS,
  STRUM_PATTERNS,
  beatsInLoop,
  getChordRhythmDrill,
  rotated,
  slotsOf,
  strumPattern,
} from './data/rhythmDrills';
export type { ChordContestConfig, ContestRound, RoundKind } from './data/contestDrills';
export {
  CHORD_CONTEST_DRILLS,
  CONTEST_ROUNDS,
  chordsInRound,
  getChordContestDrill,
} from './data/contestDrills';
export type { ChordEarConfig, EarTask } from './data/earDrills';
export { CHORD_EAR_DRILLS, getChordEarDrill, pressesKey } from './data/earDrills';
export { ChordKeyboard } from './components/ChordKeyboard';
export { TriadBuildDrill } from './drills/TriadBuildDrill';
export { TriadQuizDrill } from './drills/TriadQuizDrill';
export { ChordContestDrill } from './drills/ChordContestDrill';
export { ChordEarDrill } from './drills/ChordEarDrill';
export { ChordRhythmDrill } from './drills/ChordRhythmDrill';
export { ProgressionDrill } from './drills/ProgressionDrill';

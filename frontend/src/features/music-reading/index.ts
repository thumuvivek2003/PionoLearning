/**
 * Level 6 — reading the page.
 *
 * The staff is a map and a clef is the decoder for it: everything here counts
 * in diatonic steps from the bottom line, so the geometry never has an opinion
 * about which note it is drawing. The board comes from piano and the engines
 * from the practice kit; what lives here is the page and the reading of it.
 */
export type { Clef, StaffNote, Step } from './reading.types';
export {
  ANCHOR,
  CLEFS,
  LINES,
  MIDDLE_C_OCTAVE,
  MNEMONICS,
  SPACES,
  TOP_STEP,
  clefName,
  isLine,
  ledgersFor,
  lineLetters,
  lineNotes,
  lineStep,
  middleCStep,
  noteAt,
  placeLabel,
  placeOf,
  spaceLetters,
  spaceNotes,
  spaceStep,
  stepOf,
  stepRange,
} from './data/staff';
export type { Accidental, AlteredNote } from './data/accidentals';
export {
  ACCIDENTALS,
  GLYPH,
  SIGN_EFFECT,
  SIGN_NAME,
  alteredNote,
  playableSigns,
  shiftOf,
} from './data/accidentals';
export type { KeySignature } from './data/keySignatures';
export {
  KEY_SIGNATURES,
  altersLetter,
  signatureLetters,
  signatureLine,
  signatureOf,
  signatureSteps,
} from './data/keySignatures';
export type { ReadingConfig, ReadTask } from './data/readingDrills';
export { READING_DRILLS, drawableSteps, getReadingDrill } from './data/readingDrills';
export type { Contour, NoteValue, StaffRunConfig } from './data/runDrills';
export {
  CONTOURS,
  CONTOUR_NAME,
  STAFF_RUN_DRILLS,
  VALUE_BEATS,
  allowanceAt,
  beatsOf,
  getStaffRunDrill,
  runSteps,
} from './data/runDrills';
export type { FingerDrillConfig, FingerTask, Hand } from './data/fingerDrills';
export {
  FINGER_DRILLS,
  FINGER_NAMES,
  SCALE_FINGERINGS,
  crossingsIn,
  fingerName,
  fingeringIsReachable,
  getFingerDrill,
  handName,
} from './data/fingerDrills';
export type { ReadingContestConfig, ReadingRound } from './data/contestDrills';
export {
  READING_CONTEST_DRILLS,
  READING_ROUNDS,
  getReadingContestDrill,
} from './data/contestDrills';
export type { SignatureMark, StaffMark } from './components/Staff';
export { Staff } from './components/Staff';
export { StaffSystem } from './components/StaffSystem';
export { ReadingKeyboard } from './components/ReadingKeyboard';
export { FingeringDrill } from './drills/FingeringDrill';
export { ReadingContestDrill } from './drills/ReadingContestDrill';
export { StaffQuizDrill } from './drills/StaffQuizDrill';
export { StaffRunDrill } from './drills/StaffRunDrill';

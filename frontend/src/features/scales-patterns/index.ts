/**
 * Level 4 — scales and keyboard patterns.
 *
 * One formula turned into notes, and those notes turned into something the
 * hands can play. The theory comes from music-theory, the board from piano, the
 * fingering vocabulary from the finger work and the clock from the practice
 * kit; what lives here is the joining of them.
 */
export type { Step } from './data/steps';
export {
  HALF,
  MAJOR_STEPS,
  MINOR_STEPS,
  stepsForType,
  semitoneLabel,
  WHOLE,
  applySteps,
  formulaLabel,
  halfStepDegrees,
  semitonesOf,
  stepKeys,
  stepLabel,
  stepsOf,
} from './data/steps';
export type { ScaleShape } from './data/scaleShapes';
export {
  MIDDLE_C,
  SCALE_FINGERINGS,
  accidentalsOf,
  differencesBetween,
  signatureOf,
  crossingsIn,
  degreeAt,
  fingeringFor,
  middleStart,
  scaleKeys,
  scaleMidis,
  scaleShape,
  scaleStarts,
} from './data/scaleShapes';
export type { AccidentalKind, MajorKey } from './data/keyFamily';
export {
  FLAT_ORDER,
  MAJOR_KEYS,
  SHARP_ORDER,
  accidentalOrder,
  accidentalPitch,
  accidentalsNamed,
  flatKeys,
  keySummary,
  majorKey,
  ordinal,
  sharpKeys,
} from './data/keyFamily';
export type { KeyRef, RelativePair } from './data/relatives';
export {
  MAJOR,
  MINOR,
  RELATIVE_DEGREE,
  RELATIVE_MAJOR_DEGREE,
  RELATIVE_PAIRS,
  pairOfMajor,
  relativeMajorOf,
  relativeMinorOf,
  sameNotes,
  scaleName,
} from './data/relatives';
export type { ReadTask, ScaleReadConfig } from './data/readDrills';
export {
  GAP_STREAK,
  MAX_GAPS,
  RECOGNITION_KEYS,
  SCALE_READ_DRILLS,
  getScaleReadDrill,
  nextGaps,
} from './data/readDrills';
export type { CauseOption, MistakeCause, RecallPhase, ScaleRecallConfig } from './data/recallDrills';
export {
  MISTAKE_CAUSES,
  SCALE_RECALL_DRILLS,
  allowanceAt,
  getScaleRecallDrill,
  phaseLabel,
  stepsInPhase,
} from './data/recallDrills';
export type { EarDrillConfig } from './data/earDrills';
export { EAR_DRILLS, getEarDrill, pairsOf } from './data/earDrills';
export type { FormulaDrillConfig, FormulaMode, QuizTask, ScaleQuizConfig } from './data/scaleDrills';
export {
  FORMULA_DRILLS,
  SCALE_QUIZZES,
  getFormulaDrill,
  getScaleQuiz,
} from './data/scaleDrills';
export type { PlayFocus, PlaySegment, ScalePlayConfig } from './data/playDrills';
export { SCALE_PLAY_DRILLS, getScalePlayDrill } from './data/playDrills';
export { ScaleKeyboard } from './components/ScaleKeyboard';
export { FormulaDrill } from './drills/FormulaDrill';
export { ScalePlayDrill } from './drills/ScalePlayDrill';
export { EarModeDrill } from './drills/EarModeDrill';
export { ScaleQuizDrill } from './drills/ScaleQuizDrill';
export { ScaleReadDrill } from './drills/ScaleReadDrill';
export { ScaleRecallDrill } from './drills/ScaleRecallDrill';

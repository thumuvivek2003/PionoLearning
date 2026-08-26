/**
 * Level 8 — everything earlier, at random and at speed.
 *
 * The last level introduces no material: a round is something an earlier level
 * taught, dealt without warning and against a clock. Scales, chords and
 * diatonic families all come from the shared music-theory service the earlier
 * levels were built on, so nothing here can disagree with what taught it.
 */
export type { Challenge, Hand, PieceBar, Quality, Round } from './performance.types';
export type { KeyLine } from './data/challenges';
export {
  ALL_KEYS,
  ALL_NOTES,
  BLACK_NOTES,
  QUALITY_NAME,
  SCALE_KEYS,
  WHITE_NOTES,
  chordKeys,
  dealRound,
  pieceLine,
  rhythmBeats,
  rhythmLine,
  scaleDegreeKeys,
  nameOf,
  progressionKeys,
  scaleKeys,
  symbolOf,
} from './data/challenges';
export type { ChallengeConfig } from './data/challengeDrills';
export { CHALLENGE_DRILLS, allowanceAt, getChallengeDrill } from './data/challengeDrills';
export { ChallengeKeyboard } from './components/ChallengeKeyboard';
export { ChallengeDrill } from './drills/ChallengeDrill';

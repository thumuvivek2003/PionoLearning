/**
 * Shared kit for practice screens.
 *
 * Everything here is drill-agnostic: the frame, the prompt, the pills, the
 * counters and the three engines — a prompt→answer quiz, a paced sequence, and
 * a guided run for practising on a real instrument. A bucket's own feature
 * folder holds only what is specific to it — a hand diagram, a keyboard — which
 * keeps the buckets independent of each other.
 */
export { BeatLamps } from './components/BeatLamps';
export { Choice, ChoicePills, ChoiceRow } from './components/Choices';
export { PracticeClock } from './components/PracticeClock';
export {
  PracticeClockProvider,
  useOptionalPracticeClock,
  usePracticeClock,
} from './PracticeClockContext';
export type { ClockStatus } from './PracticeClockContext';
export {
  Counter,
  CounterRow,
  RunCounters,
  ScoreBoard,
  formatMs,
  formatSeconds,
} from './components/Counters';
export { DrillPrompt, DrillShell, StageRow } from './components/DrillShell';
export { GuidedNote, GuidedSound, PlayWhere } from './components/PlayWhere';
export type { PlaySurface } from './components/PlayWhere';
export { StepStrip } from './components/StepStrip';
export { TimerBar } from './components/TimerBar';
export { WeakSpots } from './components/WeakSpots';
export { evenness, meanInterval, percent, slowestStep } from './evenness';
export type { TimingTally } from './timing';
export {
  EMPTY_TIMING,
  LEAD_IN_BEATS,
  ON_BEAT_MS,
  beatMs,
  claims,
  meanTiming,
  onBeatRate,
  recordTiming,
  timingBias,
  timingNote,
} from './timing';
export type { ItemScore, Repair, ScoreBook } from './scoring';
export {
  TARGET_MS,
  drawWeights,
  nextRepair,
  recordAnswer,
  weakSpots,
  weaknessWeight,
} from './scoring';
export { useQuizDrill } from './hooks/useQuizDrill';
export type { QuizStats, QuizVerdict } from './hooks/useQuizDrill';
export { ALLOWANCE_OPTIONS, useAnswerDeadline } from './hooks/useAnswerDeadline';
export { useSprint } from './hooks/useSprint';
export type { SprintStatus } from './hooks/useSprint';
export { useMetronome } from './hooks/useMetronome';
export { useGuidedRun } from './hooks/useGuidedRun';
export type { GuidedPhase, GuidedTick } from './hooks/useGuidedRun';
export { useScoreBook } from './hooks/useScoreBook';
export { useTimedRun } from './hooks/useTimedRun';
export type { RunStats } from './hooks/useTimedRun';
export { usePacedSequence } from './hooks/usePacedSequence';
export type { PacedStep } from './hooks/usePacedSequence';

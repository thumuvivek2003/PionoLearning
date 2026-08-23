/**
 * Shared kit for practice screens.
 *
 * Everything here is drill-agnostic: the frame, the prompt, the pills, the
 * counters and the two engines (a prompt→answer quiz and a paced sequence).
 * A bucket's own feature folder holds only what is specific to it — a hand
 * diagram, a keyboard — which keeps the buckets independent of each other.
 */
export { Choice, ChoicePills, ChoiceRow } from './components/Choices';
export { PracticeClock } from './components/PracticeClock';
export {
  PracticeClockProvider,
  useOptionalPracticeClock,
  usePracticeClock,
} from './PracticeClockContext';
export type { ClockStatus } from './PracticeClockContext';
export { Counter, CounterRow, ScoreBoard, formatMs } from './components/Counters';
export { DrillPrompt, DrillShell, StageRow } from './components/DrillShell';
export { StepStrip } from './components/StepStrip';
export { useQuizDrill } from './hooks/useQuizDrill';
export type { QuizStats, QuizVerdict } from './hooks/useQuizDrill';
export { usePacedSequence } from './hooks/usePacedSequence';
export type { PacedStep } from './hooks/usePacedSequence';

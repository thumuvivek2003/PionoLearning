import type { AnswerVerdict, PracticeMode } from '@/features/trainer/types/trainer.types';
import type { Timestamp } from '@/types/common.types';

/** One graded answer in test mode. */
export interface AnswerRecord {
  itemId: string;
  itemLabel: string;
  verdict: AnswerVerdict;
  /** Milliseconds between the item appearing and the answer being given. */
  responseMs: number;
}

/** A finished practice run, kept for History and Statistics. */
export interface SessionRecord {
  id: string;
  moduleId: string;
  moduleTitle: string;
  setLabel: string;
  /** Preset the pool came from; absent for custom pools and pre-lessons records. */
  presetId?: string;
  mode: PracticeMode;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationMs: number;
  intervalSeconds: number;
  itemsShown: number;
  correct: number;
  wrong: number;
  answers: AnswerRecord[];
}

export interface StatisticsSummary {
  sessions: number;
  itemsShown: number;
  practiceMs: number;
  correct: number;
  wrong: number;
  /** 0 → 1, or null when nothing has been graded yet. */
  accuracy: number | null;
  averageResponseMs: number | null;
}

export interface ItemStat {
  itemId: string;
  itemLabel: string;
  correct: number;
  wrong: number;
  accuracy: number;
}

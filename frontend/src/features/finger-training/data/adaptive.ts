import type { NoteScope } from './randomNotes';

/**
 * Difficulty that follows your accuracy.
 *
 * The reference gives the rule outright: at 90% and above, make it harder; below
 * 70%, make it easier; in between, stay where you are and slow down. So the
 * ladder is a rule the drill applies rather than advice it prints — the whole
 * point being that nobody judges their own accuracy honestly mid-practice.
 */
export interface DifficultyLevel {
  label: string;
  length: number;
  scope: NoteScope;
  /** Time allowed per note, in ms. 0 leaves it open. */
  allowanceMs: number;
}

/** Rungs in the order the reference builds them: length, then keys, then time. */
export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  { label: '3 notes · white', length: 3, scope: 'white', allowanceMs: 3000 },
  { label: '4 notes · white', length: 4, scope: 'white', allowanceMs: 3000 },
  { label: '5 notes · white', length: 5, scope: 'white', allowanceMs: 2500 },
  { label: '4 notes · all keys', length: 4, scope: 'all', allowanceMs: 2500 },
  { label: '5 notes · all keys', length: 5, scope: 'all', allowanceMs: 2000 },
  { label: '5 notes · all keys, quick', length: 5, scope: 'all', allowanceMs: 1500 },
];

/** How many attempts the judgement looks back over. */
export const WINDOW = 10;

/** Accuracy at or above this earns a step up. */
export const UP_AT = 0.9;
/** Accuracy below this drops a step. */
export const DOWN_BELOW = 0.7;

export type Verdict = 'up' | 'hold' | 'down';

/** What the last window of attempts says should happen next. */
export function judge(accuracy: number | null): Verdict {
  if (accuracy === null) return 'hold';
  if (accuracy >= UP_AT) return 'up';
  return accuracy < DOWN_BELOW ? 'down' : 'hold';
}

/** The level after applying a verdict, kept inside the ladder. */
export function nextLevel(current: number, verdict: Verdict): number {
  const moved = verdict === 'up' ? current + 1 : verdict === 'down' ? current - 1 : current;
  return Math.max(0, Math.min(DIFFICULTY_LEVELS.length - 1, moved));
}

/** Accuracy over the most recent attempts, or null before there are enough. */
export function rollingAccuracy(results: readonly boolean[], window = WINDOW): number | null {
  if (results.length < window) return null;
  const recent = results.slice(-window);
  return recent.filter(Boolean).length / recent.length;
}

/** What the drill says when the level moves, in the reference's own terms. */
export function verdictNote(verdict: Verdict, level: DifficultyLevel): string {
  switch (verdict) {
    case 'up':
      return `90% and holding — up to ${level.label}`;
    case 'down':
      return `Under 70% — back to ${level.label}, and slow down`;
    default:
      return `Holding at ${level.label} — accuracy before speed`;
  }
}

import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { QuizStats } from '../hooks/useQuizDrill';
import styles from './kit.module.css';

/** The counter strip at the foot of a drill's control panel. */
export function CounterRow({ children }: { children: ReactNode }) {
  return <div className={styles.counters}>{children}</div>;
}

export function Counter({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn(styles.counter, className)}>
      <span className={styles.counterLabel}>{label}</span>
      <span className={styles.counterValue}>{value}</span>
      {hint && <span className={styles.counterHint}>{hint}</span>}
    </div>
  );
}

export function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

/**
 * Counters for a recognition drill.
 *
 * Reaction time leads because that is what these buckets are actually after —
 * they are finished when the answer is instant, not when a rep count is hit.
 */
export function ScoreBoard({ stats, onReset }: { stats: QuizStats; onReset: () => void }) {
  const accuracy = stats.asked > 0 ? Math.round((stats.correct / stats.asked) * 100) : null;

  return (
    <CounterRow>
      <Counter label="Correct" value={`${stats.correct}/${stats.asked}`} />
      <Counter label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} />
      <Counter label="Streak" value={String(stats.streak)} hint={`best ${stats.bestStreak}`} />
      <Counter
        label="Avg answer"
        value={formatMs(stats.averageMs)}
        hint={`best ${formatMs(stats.fastestMs)}`}
      />
      <Button variant="ghost" icon="reset" size="sm" onClick={onReset}>
        Reset
      </Button>
    </CounterRow>
  );
}

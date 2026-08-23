import { Button } from '@/components/ui';
import type { QuizStats } from '../hooks/useQuizDrill';
import styles from './finger.module.css';

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

/**
 * Counters for a recognition drill.
 *
 * Reaction time is the number that matters here — the bucket is finished when
 * "3 = middle" is instant, not when a rep count is reached.
 */
export function ScoreBoard({ stats, onReset }: { stats: QuizStats; onReset: () => void }) {
  const accuracy = stats.asked > 0 ? Math.round((stats.correct / stats.asked) * 100) : null;

  return (
    <div className={styles.scores}>
      <Stat label="Correct" value={`${stats.correct}/${stats.asked}`} />
      <Stat label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} />
      <Stat label="Streak" value={String(stats.streak)} hint={`best ${stats.bestStreak}`} />
      <Stat label="Avg answer" value={formatMs(stats.averageMs)} hint={`best ${formatMs(stats.fastestMs)}`} />
      <Button variant="ghost" icon="reset" size="sm" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {hint && <span className={styles.statHint}>{hint}</span>}
    </div>
  );
}

import { cn } from '@/lib/cn';
import styles from './kit.module.css';

interface TimerBarProps {
  /** 0 → 1 through the allowance. */
  progress: number;
  /** Seconds left, shown alongside the bar. */
  remainingMs: number;
  label: string;
}

/** How little time is left before the bar counts as urgent. */
const URGENT_FROM = 0.65;

/** The per-answer clock, drawn as a bar that drains left to right. */
export function TimerBar({ progress, remainingMs, label }: TimerBarProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div
      className={styles.timerBar}
      role="timer"
      aria-label={`${label}: ${(remainingMs / 1000).toFixed(1)} seconds left`}
    >
      <span className={styles.timerLabel}>{label}</span>
      <span className={styles.timerTrack}>
        <span
          className={cn(styles.timerFill, clamped > URGENT_FROM && styles.timerFillUrgent)}
          style={{ width: `${(1 - clamped) * 100}%` }}
        />
      </span>
      <span className={styles.timerValue}>{(remainingMs / 1000).toFixed(1)}s</span>
    </div>
  );
}

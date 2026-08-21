import { Button, ProgressRing } from '@/components/ui';
import type { PracticeMode } from '../types/trainer.types';
import styles from './trainer.module.css';

interface TransportPanelProps {
  isActive: boolean;
  isRunning: boolean;
  canStart: boolean;
  secondsLeft: number;
  progress: number;
  /** The configured whole-session budget; 0 means unlimited. */
  sessionSeconds: number;
  /** Live countdown against that budget; null until a timed run starts. */
  sessionSecondsLeft: number | null;
  sessionProgress: number;
  /** Practice time so far — the readout when no budget is set. */
  elapsedSeconds: number;
  itemsShown: number;
  correct: number;
  wrong: number;
  mode: PracticeMode;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onAnswer: (verdict: 'correct' | 'wrong') => void;
}

/** Countdowns round up so they only hit 0:00 when truly spent; count-ups round down. */
function formatClock(totalSeconds: number, round: (value: number) => number = Math.ceil): string {
  const whole = round(Math.max(0, totalSeconds));
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Start / pause / stop, the countdown ring, and Test-mode grading. */
export function TransportPanel({
  isActive,
  isRunning,
  canStart,
  secondsLeft,
  progress,
  sessionSeconds,
  sessionSecondsLeft,
  sessionProgress,
  elapsedSeconds,
  itemsShown,
  correct,
  wrong,
  mode,
  onStart,
  onPause,
  onResume,
  onStop,
  onAnswer,
}: TransportPanelProps) {
  const isTimed = sessionSeconds > 0;
  // Before a timed run starts there is no countdown yet, so preview the full budget.
  const sessionClock = sessionSecondsLeft ?? sessionSeconds;
  const sessionFill = sessionSecondsLeft === null ? 1 : sessionProgress;
  const graded = correct + wrong;
  const accuracy = graded > 0 ? Math.round((correct / graded) * 100) : null;

  return (
    <aside className={styles.transport}>
      {isActive ? (
        <>
          <Button variant="danger" size="lg" icon="stop" block onClick={onStop}>
            STOP
          </Button>
          <Button
            variant="secondary"
            icon={isRunning ? 'pause' : 'play'}
            block
            onClick={isRunning ? onPause : onResume}
          >
            {isRunning ? 'PAUSE' : 'RESUME'}
          </Button>
        </>
      ) : (
        <Button variant="primary" size="lg" icon="play" block disabled={!canStart} onClick={onStart}>
          START
        </Button>
      )}

      <div className={styles.transportTimer}>
        <span className={styles.transportLabel}>Time left</span>
        <ProgressRing
          progress={progress}
          value={isActive ? secondsLeft.toFixed(1) : '—'}
          unit="sec"
        />
      </div>

      <div className={styles.sessionMeter}>
        <div className={styles.sessionMeterHead}>
          <span className={styles.transportLabel}>{isTimed ? 'Session left' : 'Session time'}</span>
          <span className={styles.sessionMeterValue}>
            {isTimed ? formatClock(sessionClock) : formatClock(elapsedSeconds, Math.floor)}
          </span>
        </div>
        {isTimed ? (
          <div className={styles.sessionMeterTrack}>
            <div
              className={styles.sessionMeterFill}
              style={{ width: `${Math.round(sessionFill * 100)}%` }}
            />
          </div>
        ) : (
          <span className={styles.sessionMeterHint}>
            No limit — set a session timer above to practise against the clock.
          </span>
        )}
      </div>

      {mode === 'test' && isActive && (
        <div className={styles.answerBar}>
          <Button variant="success" icon="check" onClick={() => onAnswer('correct')}>
            CORRECT
          </Button>
          <Button variant="danger" icon="x" onClick={() => onAnswer('wrong')}>
            WRONG
          </Button>
        </div>
      )}

      <div className={styles.transportStats}>
        <span className={styles.stat}>
          <span className={styles.statValue}>{itemsShown}</span>
          <span className={styles.statLabel}>Shown</span>
        </span>
        <span className={styles.stat}>
          <span className={`${styles.statValue} ${styles.statCorrect}`}>{correct}</span>
          <span className={styles.statLabel}>Correct</span>
        </span>
        <span className={styles.stat}>
          <span className={`${styles.statValue} ${styles.statWrong}`}>{wrong}</span>
          <span className={styles.statLabel}>Wrong</span>
        </span>
        {accuracy !== null && (
          <span className={styles.stat}>
            <span className={styles.statValue}>{accuracy}%</span>
            <span className={styles.statLabel}>Accuracy</span>
          </span>
        )}
      </div>

      <p className={styles.shortcutHint}>
        <span>
          <kbd className={styles.kbd}>Space</kbd>play / pause
        </span>
        <span>
          <kbd className={styles.kbd}>→</kbd>next
        </span>
        {mode === 'test' && (
          <span>
            <kbd className={styles.kbd}>1</kbd>/<kbd className={styles.kbd}>2</kbd>grade
          </span>
        )}
      </p>
    </aside>
  );
}

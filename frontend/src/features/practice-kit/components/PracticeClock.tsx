import { Button, Icon } from '@/components/ui';
import { SESSION_TIMER_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import { usePracticeClock } from '../PracticeClockContext';
import { Choice, ChoiceRow } from './Choices';
import styles from './kit.module.css';

function clock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, '0')}`;
}

function durationLabel(seconds: number): string {
  if (seconds === 0) return 'Open';
  return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
}

/**
 * The session clock, shown above every practice screen.
 *
 * Set a length and it counts down; leave it Open and it counts up. It starts on
 * its own the first time you answer or press play in a drill, and it keeps
 * running as you move between practices, so "ten minutes on this bucket" is one
 * session rather than one screen.
 */
export function PracticeClock() {
  const {
    durationSeconds,
    setDuration,
    status,
    elapsedSeconds,
    remainingSeconds,
    progress,
    start,
    pause,
    resume,
    reset,
  } = usePracticeClock();

  const timed = durationSeconds > 0;
  const finished = status === 'finished';
  const running = status === 'running';
  const reading = timed ? (remainingSeconds ?? 0) : elapsedSeconds;

  return (
    <section className={cn(styles.clock, finished && styles.clockDone)} aria-label="Practice timer">
      <div className={styles.clockMain}>
        <span className={styles.clockLabel}>
          <Icon name="clock" size={13} />
          {finished ? "Time's up" : timed ? 'Time left' : 'Practising'}
        </span>
        <span className={styles.clockValue}>{clock(reading)}</span>
        {timed && (
          <span className={styles.clockElapsed}>
            {clock(elapsedSeconds)} of {durationLabel(durationSeconds)}
          </span>
        )}
      </div>

      <div className={styles.clockChoices}>
        <span className={styles.clockChoicesLabel}>Session length</span>
        <ChoiceRow>
          {SESSION_TIMER_OPTIONS.map((seconds) => (
            <Choice
              key={seconds}
              active={seconds === durationSeconds}
              onClick={() => setDuration(seconds)}
              label={seconds === 0 ? 'No limit' : `${durationLabel(seconds)} session`}
            >
              {durationLabel(seconds)}
            </Choice>
          ))}
        </ChoiceRow>
      </div>

      <div className={styles.clockActions}>
        {running ? (
          <Button variant="secondary" icon="pause" size="sm" onClick={pause}>
            Pause
          </Button>
        ) : (
          <Button
            variant={finished ? 'secondary' : 'primary'}
            icon="play"
            size="sm"
            onClick={status === 'paused' ? resume : start}
          >
            {status === 'paused' ? 'Resume' : finished ? 'Again' : 'Start'}
          </Button>
        )}
        <Button variant="ghost" icon="reset" size="sm" onClick={reset}>
          Reset
        </Button>
      </div>

      {timed && (
        <div className={styles.clockMeter}>
          <div
            className={cn(styles.clockMeterFill, finished && styles.clockMeterFillDone)}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
    </section>
  );
}

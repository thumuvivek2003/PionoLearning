import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterval } from '@/hooks/useInterval';
import { TICK_MS } from '@/lib/constants';
import { useOptionalPracticeClock } from '../PracticeClockContext';

export type SprintStatus = 'idle' | 'running' | 'done';

interface SprintOptions {
  seconds: number;
  /** Called once when the clock runs out. */
  onFinish?: () => void;
  /** Called when a sprint starts — the moment to clear what it will be judged on. */
  onStart?: () => void;
}

/**
 * A fixed-length run against the clock.
 *
 * Separate from the session clock on purpose: that one measures how long you
 * practised, this one *is* the drill — a score only means something because the
 * window was the same length every time.
 */
export function useSprint({ seconds, onFinish, onStart }: SprintOptions) {
  const [status, setStatus] = useState<SprintStatus>('idle');
  const [remainingMs, setRemainingMs] = useState(seconds * 1000);
  const remaining = useRef(seconds * 1000);
  const clock = useOptionalPracticeClock();

  const callbacks = useRef({ onFinish, onStart });
  useEffect(() => {
    callbacks.current = { onFinish, onStart };
  }, [onFinish, onStart]);

  // A new length re-dials a sprint that has not started; a finished one keeps
  // its zero on screen until the next start.
  useEffect(() => {
    if (status !== 'idle') return;
    remaining.current = seconds * 1000;
    setRemainingMs(seconds * 1000);
  }, [seconds, status]);

  const start = useCallback(() => {
    clock?.markActivity();
    remaining.current = seconds * 1000;
    setRemainingMs(seconds * 1000);
    setStatus('running');
    callbacks.current.onStart?.();
  }, [clock, seconds]);

  const stop = useCallback(() => {
    setStatus('idle');
  }, []);

  useInterval(
    () => {
      remaining.current = Math.max(0, remaining.current - TICK_MS);
      setRemainingMs(remaining.current);
      if (remaining.current === 0) {
        setStatus('done');
        callbacks.current.onFinish?.();
      }
    },
    status === 'running' ? TICK_MS : null,
  );

  const total = seconds * 1000;

  return {
    status,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    /** 1 → 0 as the sprint runs, for a countdown ring. */
    progress: total > 0 ? remainingMs / total : 0,
    start,
    stop,
  };
}

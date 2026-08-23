import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterval } from '@/hooks/useInterval';
import { TICK_MS } from '@/lib/constants';

export interface PacedStep<T> {
  value: T;
  /** How long this step holds, in milliseconds. */
  ms: number;
}

interface PacedSequenceOptions {
  /** Start again from the top instead of stopping at the end. */
  loop?: boolean;
  /** Called once per completed pass. */
  onCycle?: () => void;
  /** Called when a step begins, including the first. */
  onStep?: (index: number) => void;
}

/**
 * A metronome for a list of steps.
 *
 * The physical drills — tapping, lifting, the press/relax cycle — are all the
 * same shape: hold a step for a while, move on, maybe loop. One ticker drives
 * them so their pacing, progress rings and cycle counts behave identically.
 */
export function usePacedSequence<T>(
  steps: readonly PacedStep<T>[],
  { loop = true, onCycle, onStep }: PacedSequenceOptions = {},
) {
  const [index, setIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);

  // Callbacks are read at fire time so a new closure never restarts the timer.
  const callbacks = useRef({ onCycle, onStep });
  useEffect(() => {
    callbacks.current = { onCycle, onStep };
  }, [onCycle, onStep]);

  const current = steps[Math.min(index, Math.max(steps.length - 1, 0))];
  const stepMs = current?.ms ?? 0;

  const stop = useCallback(() => {
    setIsRunning(false);
    setIndex(0);
    setElapsedMs(0);
  }, []);

  const start = useCallback(() => {
    setIndex(0);
    setElapsedMs(0);
    setCycles(0);
    setIsRunning(true);
    callbacks.current.onStep?.(0);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) stop();
    else start();
  }, [isRunning, start, stop]);

  useInterval(
    () => {
      setElapsedMs((previous) => {
        const next = previous + TICK_MS;
        if (next < stepMs) return next;

        // Step is up — move on, wrap, or stop at the end.
        setIndex((currentIndex) => {
          const following = currentIndex + 1;
          if (following < steps.length) {
            callbacks.current.onStep?.(following);
            return following;
          }

          setCycles((count) => count + 1);
          callbacks.current.onCycle?.();
          if (!loop) {
            setIsRunning(false);
            return currentIndex;
          }
          callbacks.current.onStep?.(0);
          return 0;
        });
        return 0;
      });
    },
    isRunning && steps.length > 0 ? TICK_MS : null,
  );

  // Re-pacing mid-run (a new pattern or tempo) restarts cleanly.
  useEffect(() => {
    setIndex(0);
    setElapsedMs(0);
  }, [steps]);

  return {
    index,
    current: current?.value,
    isRunning,
    cycles,
    /** 0 → 1 through the current step. */
    progress: stepMs > 0 ? Math.min(1, elapsedMs / stepMs) : 0,
    /** Seconds left in the current step, for a countdown label. */
    secondsLeft: Math.max(0, (stepMs - elapsedMs) / 1000),
    start,
    stop,
    toggle,
  };
}

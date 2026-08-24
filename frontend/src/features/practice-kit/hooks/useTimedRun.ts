import { useCallback, useEffect, useRef, useState } from 'react';
import { useOptionalPracticeClock } from '../PracticeClockContext';

/** How long a finished run stays on screen before the next one is dealt. */
const HOLD_MS = 1100;

export interface RunStats {
  /** Runs carried all the way to the end. */
  runs: number;
  /** Wrong entries, counted across every run. */
  stumbles: number;
  lastSeconds: number | null;
  bestSeconds: number | null;
}

const EMPTY_STATS: RunStats = { runs: 0, stumbles: 0, lastSeconds: null, bestSeconds: null };

interface TimedRunOptions {
  /** Deals a fresh run: clears the board and picks whatever comes next. */
  onDeal: () => void;
  /** How long a finished run is left on screen before `onDeal` fires. */
  holdMs?: number;
}

/**
 * Clock and tally for a *chain* drill.
 *
 * A chain is not a quiz: one long answer is given step by step, so what counts
 * is how long the whole run took and what it cost in stumbles — not per-prompt
 * reaction time, which is `useQuizDrill`'s job. Timing, the tally and the pause
 * between runs live here so every chain drill in the app paces identically.
 *
 * It owns no notion of what a run *is*: the drill decides when a run begins,
 * stumbles and finishes, and how the next one is set up.
 */
export function useTimedRun({ onDeal, holdMs = HOLD_MS }: TimedRunOptions) {
  const clock = useOptionalPracticeClock();
  const [stats, setStats] = useState<RunStats>(EMPTY_STATS);

  const startedAt = useRef<number | null>(null);
  const holdTimer = useRef<number | null>(null);
  // Read at fire time, so a fresh closure each render never restarts the hold.
  const deal = useRef(onDeal);
  useEffect(() => {
    deal.current = onDeal;
  }, [onDeal]);

  const clearHold = useCallback(() => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }, []);

  /** First right step of a run — starts the stopwatch and the session clock. */
  const begin = useCallback(() => {
    clock?.markActivity();
    if (startedAt.current === null) startedAt.current = performance.now();
  }, [clock]);

  const stumble = useCallback(() => {
    clock?.markActivity();
    setStats((current) => ({ ...current, stumbles: current.stumbles + 1 }));
  }, [clock]);

  /** Last step of a run — banks the time, holds the finish, then deals again. */
  const finish = useCallback(() => {
    const seconds =
      startedAt.current === null ? null : (performance.now() - startedAt.current) / 1000;
    startedAt.current = null;

    setStats((current) => ({
      ...current,
      runs: current.runs + 1,
      lastSeconds: seconds,
      bestSeconds:
        seconds === null ? current.bestSeconds : Math.min(current.bestSeconds ?? seconds, seconds),
    }));

    clearHold();
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      deal.current();
    }, holdMs);
  }, [clearHold, holdMs]);

  /** Abandon what is on screen and deal now — a settings change, or "new run". */
  const dealNow = useCallback(() => {
    clearHold();
    startedAt.current = null;
    deal.current();
  }, [clearHold]);

  const reset = useCallback(() => {
    setStats(EMPTY_STATS);
    dealNow();
  }, [dealNow]);

  useEffect(() => clearHold, [clearHold]);

  return { stats, begin, stumble, finish, dealNow, reset };
}

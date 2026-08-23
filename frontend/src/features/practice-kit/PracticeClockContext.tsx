import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSettings } from '@/features/settings';
import { useInterval } from '@/hooks/useInterval';
import { instrument } from '@/lib/audio';

/** Refresh rate for the clock — smooth enough for a meter, cheap to run. */
const TICK_MS = 250;

export type ClockStatus = 'idle' | 'running' | 'paused' | 'finished';

interface PracticeClockValue {
  /** Chosen practice length in seconds; 0 means open-ended. */
  durationSeconds: number;
  setDuration: (seconds: number) => void;
  status: ClockStatus;
  /** Time practised so far, in seconds. Pausing freezes it. */
  elapsedSeconds: number;
  /** Seconds left, or null when open-ended. */
  remainingSeconds: number | null;
  /** 0 → 1 through the chosen length; 0 when open-ended. */
  progress: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  /**
   * Called by the drill engines the moment you actually practise, so the clock
   * starts itself rather than needing to be remembered.
   */
  markActivity: () => void;
}

const PracticeClockContext = createContext<PracticeClockValue | null>(null);

/**
 * One clock for the whole practice session.
 *
 * It lives above the router so it keeps running as you move from practice to
 * practice — "give me ten minutes of black-key geography" is one session, not
 * one screen. The chosen length is the app's existing `sessionSeconds` setting,
 * so it persists and matches the trainers' session timer.
 */
export function PracticeClockProvider({ children }: { children: ReactNode }) {
  const { settings, update } = useSettings();
  const durationSeconds = settings.sessionSeconds;

  const [status, setStatus] = useState<ClockStatus>('idle');
  /** Time already banked from earlier run stretches. */
  const [bankedMs, setBankedMs] = useState(0);
  const startedAt = useRef<number | null>(null);
  /** Bumped by the ticker so the elapsed reading re-renders. */
  const [, setTick] = useState(0);

  const liveMs = () =>
    bankedMs + (startedAt.current === null ? 0 : performance.now() - startedAt.current);

  const start = useCallback(() => {
    setBankedMs(0);
    startedAt.current = performance.now();
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setBankedMs(liveMs());
    startedAt.current = null;
    setStatus((current) => (current === 'running' ? 'paused' : current));
    // liveMs reads refs and state at call time; a dep array would stale it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankedMs]);

  const resume = useCallback(() => {
    startedAt.current = performance.now();
    setStatus((current) => (current === 'paused' ? 'running' : current));
  }, []);

  const reset = useCallback(() => {
    setBankedMs(0);
    startedAt.current = null;
    setStatus('idle');
  }, []);

  const markActivity = useCallback(() => {
    // Only an untouched clock auto-starts: a deliberate pause must stay paused.
    if (status === 'idle') start();
  }, [start, status]);

  const setDuration = useCallback(
    (seconds: number) => {
      update('sessionSeconds', seconds);
      // A new length is a new session — carrying elapsed time over would lie.
      reset();
    },
    [reset, update],
  );

  const elapsedMs = liveMs();
  const totalMs = durationSeconds > 0 ? durationSeconds * 1000 : null;
  const remainingMs = totalMs === null ? null : Math.max(0, totalMs - elapsedMs);

  useInterval(
    () => {
      if (totalMs !== null && liveMs() >= totalMs) {
        setBankedMs(totalMs);
        startedAt.current = null;
        setStatus('finished');
        if (settings.soundEnabled) instrument.play([0, 4, 7]);
        return;
      }
      setTick((count) => count + 1);
    },
    status === 'running' ? TICK_MS : null,
  );

  const value = useMemo<PracticeClockValue>(
    () => ({
      durationSeconds,
      setDuration,
      status,
      elapsedSeconds: elapsedMs / 1000,
      remainingSeconds: remainingMs === null ? null : remainingMs / 1000,
      progress: totalMs === null ? 0 : Math.min(1, elapsedMs / totalMs),
      start,
      pause,
      resume,
      reset,
      markActivity,
    }),
    [
      durationSeconds,
      elapsedMs,
      markActivity,
      pause,
      remainingMs,
      reset,
      resume,
      setDuration,
      start,
      status,
      totalMs,
    ],
  );

  return <PracticeClockContext.Provider value={value}>{children}</PracticeClockContext.Provider>;
}

export function usePracticeClock(): PracticeClockValue {
  const context = useContext(PracticeClockContext);
  if (!context) throw new Error('usePracticeClock must be used inside <PracticeClockProvider>');
  return context;
}

/**
 * The clock if there is one.
 *
 * The engines use this so a drill still works when mounted outside the
 * provider — in a test, say — instead of throwing.
 */
export function useOptionalPracticeClock(): PracticeClockValue | null {
  return useContext(PracticeClockContext);
}

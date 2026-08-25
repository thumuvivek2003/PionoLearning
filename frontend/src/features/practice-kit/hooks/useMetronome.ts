import { useCallback, useEffect, useRef, useState } from 'react';
import { useInterval } from '@/hooks/useInterval';
import { TICK_MS } from '@/lib/constants';
import { useOptionalPracticeClock } from '../PracticeClockContext';

interface MetronomeOptions {
  bpm: number;
  /** Fires as each beat comes round, for the click and the flash. */
  onBeat?: (index: number) => void;
}

/**
 * A beat to play against.
 *
 * The click is driven by a ticker, but nothing is *measured* from it: the drill
 * asks `elapsed()` at the moment of a keypress and compares that against when
 * the note was due. That keeps the timing honest at any tick rate — the ticker
 * only has to be good enough to hear, while the measurement stays exact.
 */
export function useMetronome({ bpm, onBeat }: MetronomeOptions) {
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const startedAt = useRef<number | null>(null);
  const lastBeat = useRef(-1);
  const clock = useOptionalPracticeClock();

  const callback = useRef(onBeat);
  useEffect(() => {
    callback.current = onBeat;
  }, [onBeat]);

  const beatMs = (60 / bpm) * 1000;

  const start = useCallback(() => {
    clock?.markActivity();
    startedAt.current = performance.now();
    lastBeat.current = -1;
    setBeat(-1);
    setRunning(true);
  }, [clock]);

  const stop = useCallback(() => {
    setRunning(false);
    startedAt.current = null;
    setBeat(-1);
  }, []);

  // A new tempo restarts the count rather than bending the beat you are on.
  useEffect(() => {
    if (running) start();
    // Restarting on `running` would loop; the tempo is what should restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  useInterval(
    () => {
      const at = startedAt.current;
      if (at === null) return;
      const index = Math.floor((performance.now() - at) / beatMs);
      if (index === lastBeat.current) return;
      lastBeat.current = index;
      setBeat(index);
      callback.current?.(index);
    },
    running ? TICK_MS : null,
  );

  /** Milliseconds since the count started, or null while stopped. */
  const elapsed = useCallback(
    () => (startedAt.current === null ? null : performance.now() - startedAt.current),
    [],
  );

  return { running, beat, beatMs, start, stop, elapsed };
}

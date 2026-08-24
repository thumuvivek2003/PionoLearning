import { useEffect, useRef, useState } from 'react';
import { useInterval } from '@/hooks/useInterval';
import { TICK_MS } from '@/lib/constants';

interface DeadlineOptions {
  /** How long an answer may take, in ms. 0 turns the deadline off. */
  ms: number;
  /** False while a verdict is showing, so the clock only runs on live prompts. */
  active: boolean;
  /** Changes when a new prompt appears — that is what restarts the clock. */
  resetKey: string;
  onExpire: () => void;
}

/**
 * A per-prompt clock, for the drills whose whole point is that you cannot
 * afford to count.
 *
 * It only measures and reports; the drill decides what running out means — in
 * practice a miss, graded exactly like a wrong answer. Keeping the two apart is
 * what lets the same engine run a relaxed drill and a two-second one.
 */
export function useAnswerDeadline({ ms, active, resetKey, onExpire }: DeadlineOptions) {
  const [remainingMs, setRemainingMs] = useState(ms);
  const elapsed = useRef(0);
  const fired = useRef(false);
  const expire = useRef(onExpire);

  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  // A new prompt — or a new limit — is a new clock.
  useEffect(() => {
    elapsed.current = 0;
    fired.current = false;
    setRemainingMs(ms);
  }, [ms, resetKey]);

  useInterval(
    () => {
      elapsed.current += TICK_MS;
      setRemainingMs(Math.max(0, ms - elapsed.current));
      if (elapsed.current >= ms && !fired.current) {
        fired.current = true;
        expire.current();
      }
    },
    active && ms > 0 && !fired.current ? TICK_MS : null,
  );

  return {
    remainingMs,
    /** 0 → 1 through the allowance, for a draining bar. */
    progress: ms > 0 ? Math.min(1, elapsed.current / ms) : 0,
    expired: fired.current,
  };
}

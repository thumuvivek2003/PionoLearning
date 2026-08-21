import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { generateSequence, getStrategy } from '@/features/randomizer';
import type { SessionRecord } from '@/features/statistics';
import { useInterval } from '@/hooks/useInterval';
import { SEQUENCE_LOOKAHEAD, TICK_MS } from '@/lib/constants';
import type { AnswerVerdict, PracticeMode, TrainerItem } from '../types/trainer.types';
import { initialSessionState, sessionReducer } from './sessionReducer';

export interface TrainerSessionOptions {
  /** The items that may be drawn. Changing it resets an idle session. */
  pool: readonly TrainerItem[];
  intervalSeconds: number;
  /** Whole-session budget in seconds; 0 or less means unlimited. */
  sessionSeconds: number;
  strategyId: string;
  mode: PracticeMode;
  /** Describes the run for History; only read when a session finishes. */
  meta: { moduleId: string; moduleTitle: string; setLabel: string; presetId?: string };
  onSessionEnd?: (session: SessionRecord) => void;
}

type SessionStatusView = 'idle' | 'running' | 'paused' | 'finished';

export interface TrainerSession {
  status: SessionStatusView;
  current: TrainerItem | null;
  previous: TrainerItem | null;
  next: TrainerItem | null;
  sequence: readonly TrainerItem[];
  index: number;
  /** Seconds left on the current item, one decimal. */
  secondsLeft: number;
  /** 0 → 1 for the countdown ring. */
  progress: number;
  /** Seconds left of the whole-session budget; null when unlimited. */
  sessionSecondsLeft: number | null;
  /** 0 → 1 for the session ring; 0 when unlimited. */
  sessionProgress: number;
  /** Practice time counted so far. Pausing freezes it, prev/next do not. */
  elapsedSeconds: number;
  /** Increments on each item change — use as an effect dependency. */
  stepId: number;
  itemsShown: number;
  correct: number;
  wrong: number;
  isRunning: boolean;
  isPaused: boolean;
  isActive: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  stop: () => void;
  goNext: () => void;
  goPrevious: () => void;
  answer: (verdict: AnswerVerdict) => void;
}

/**
 * Drives one practice run: timing, sequence growth, navigation and grading.
 *
 * It is deliberately item-agnostic — notes, chords or any future module all
 * flow through here unchanged.
 */
export function useTrainerSession({
  pool,
  intervalSeconds,
  sessionSeconds,
  strategyId,
  mode,
  meta,
  onSessionEnd,
}: TrainerSessionOptions): TrainerSession {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const intervalMs = Math.max(200, Math.round(intervalSeconds * 1000));
  const strategy = useMemo(() => getStrategy(strategyId), [strategyId]);

  // Refs keep callbacks stable without going stale.
  const poolRef = useRef(pool);
  const metaRef = useRef(meta);
  const onEndRef = useRef(onSessionEnd);
  poolRef.current = pool;
  metaRef.current = meta;
  onEndRef.current = onSessionEnd;

  const status = state.status as SessionStatusView;
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isActive = isRunning || isPaused;

  /* ---- timing ---- */
  useInterval(() => dispatch({ type: 'tick', deltaMs: TICK_MS }), isRunning ? TICK_MS : null);

  useEffect(() => {
    dispatch({ type: 'setInterval', intervalMs });
  }, [intervalMs]);

  /* ---- keep the upcoming buffer full ---- */
  useEffect(() => {
    if (!isActive) return;
    const remaining = state.sequence.length - state.index;
    if (remaining > SEQUENCE_LOOKAHEAD / 2) return;

    const items = generateSequence({
      pool: poolRef.current,
      strategy,
      count: SEQUENCE_LOOKAHEAD,
      history: state.sequence,
    });
    dispatch({ type: 'extend', items });
  }, [isActive, state.index, state.sequence, strategy]);

  /* ---- an edited pool invalidates an idle sequence ---- */
  useEffect(() => {
    if (!isActive && state.sequence.length > 0) dispatch({ type: 'reset' });
    // Only the pool identity should trigger this reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  /* ---- actions ---- */
  const sessionMs = sessionSeconds > 0 ? Math.round(sessionSeconds * 1000) : null;

  const start = useCallback(() => {
    if (poolRef.current.length === 0) return;
    const sequence = generateSequence({
      pool: poolRef.current,
      strategy,
      count: SEQUENCE_LOOKAHEAD,
    });
    dispatch({ type: 'start', sequence, intervalMs, sessionMs, at: Date.now() });
  }, [intervalMs, sessionMs, strategy]);

  const pause = useCallback(() => dispatch({ type: 'pause' }), []);
  const resume = useCallback(() => dispatch({ type: 'resume' }), []);
  const goNext = useCallback(() => dispatch({ type: 'advance' }), []);
  const goPrevious = useCallback(() => dispatch({ type: 'back' }), []);

  // Live snapshot of the run, read by callbacks that must not re-create.
  const stateRef = useRef(state);
  stateRef.current = state;

  const answer = useCallback((verdict: AnswerVerdict) => {
    // Time already spent on the current item — how long the answer took.
    const { intervalMs: itemMs, remainingMs } = stateRef.current;
    dispatch({ type: 'answer', verdict, responseMs: Math.max(0, itemMs - remainingMs) });
  }, []);

  const stop = useCallback(() => {
    const snapshot = stateRef.current;
    if (snapshot.status === 'idle') return;

    if (snapshot.startedAt !== null && snapshot.itemsShown > 0) {
      const endedAt = Date.now();
      onEndRef.current?.({
        id: `${snapshot.startedAt}`,
        moduleId: metaRef.current.moduleId,
        moduleTitle: metaRef.current.moduleTitle,
        setLabel: metaRef.current.setLabel,
        presetId: metaRef.current.presetId,
        mode,
        startedAt: new Date(snapshot.startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        durationMs: endedAt - snapshot.startedAt,
        intervalSeconds: snapshot.intervalMs / 1000,
        itemsShown: snapshot.itemsShown,
        correct: snapshot.correct,
        wrong: snapshot.wrong,
        answers: snapshot.answers,
      });
    }

    dispatch({ type: 'reset' });
  }, [mode]);

  /* When the session budget runs out the reducer flips to 'finished';
     stop() then records the run and resets — same path as pressing STOP. */
  useEffect(() => {
    if (status === 'finished') stop();
  }, [status, stop]);

  const togglePlay = useCallback(() => {
    if (isRunning) pause();
    else if (isPaused) resume();
    else start();
  }, [isPaused, isRunning, pause, resume, start]);

  /* ---- derived view ---- */
  const current = state.sequence[state.index] ?? null;
  const previous = state.index > 0 ? (state.sequence[state.index - 1] ?? null) : null;
  const next = state.sequence[state.index + 1] ?? null;

  return {
    status,
    current,
    previous,
    next,
    sequence: state.sequence,
    index: state.index,
    secondsLeft: Math.max(0, state.remainingMs) / 1000,
    progress: state.intervalMs > 0 ? Math.max(0, state.remainingMs) / state.intervalMs : 0,
    sessionSecondsLeft:
      state.sessionRemainingMs === null ? null : Math.max(0, state.sessionRemainingMs) / 1000,
    sessionProgress:
      state.sessionTotalMs && state.sessionRemainingMs !== null
        ? Math.max(0, state.sessionRemainingMs) / state.sessionTotalMs
        : 0,
    elapsedSeconds: state.elapsedMs / 1000,
    stepId: state.stepId,
    itemsShown: state.itemsShown,
    correct: state.correct,
    wrong: state.wrong,
    isRunning,
    isPaused,
    isActive,
    start,
    pause,
    resume,
    togglePlay,
    stop,
    goNext,
    goPrevious,
    answer,
  };
}

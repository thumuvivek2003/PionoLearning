import type { AnswerRecord } from '@/features/statistics';
import type { AnswerVerdict, SessionStatus, TrainerItem } from '../types/trainer.types';

export interface SessionState {
  status: SessionStatus;
  /** Whole-session budget in ms; null = unlimited. */
  sessionTotalMs: number | null;
  /** Counts down only while running, so pausing freezes practice time. */
  sessionRemainingMs: number | null;
  /** The full generated stream; grows as practice continues. */
  sequence: TrainerItem[];
  index: number;
  remainingMs: number;
  intervalMs: number;
  /** Bumped on every item change so side effects (audio) can fire reliably. */
  stepId: number;
  startedAt: number | null;
  elapsedMs: number;
  itemsShown: number;
  correct: number;
  wrong: number;
  answers: AnswerRecord[];
}

export type SessionAction =
  | { type: 'start'; sequence: TrainerItem[]; intervalMs: number; sessionMs: number | null; at: number }
  | { type: 'tick'; deltaMs: number }
  | { type: 'advance' }
  | { type: 'back' }
  | { type: 'extend'; items: TrainerItem[] }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'stop' }
  | { type: 'reset' }
  | { type: 'setInterval'; intervalMs: number }
  | { type: 'answer'; verdict: AnswerVerdict; responseMs: number };

export const initialSessionState: SessionState = {
  status: 'idle',
  sessionTotalMs: null,
  sessionRemainingMs: null,
  sequence: [],
  index: 0,
  remainingMs: 0,
  intervalMs: 2000,
  stepId: 0,
  startedAt: null,
  elapsedMs: 0,
  itemsShown: 0,
  correct: 0,
  wrong: 0,
  answers: [],
};

/** Move to a neighbouring index and restart that item's countdown. */
function moveTo(state: SessionState, index: number): SessionState {
  const clamped = Math.max(0, Math.min(index, state.sequence.length - 1));
  if (clamped === state.index) return { ...state, remainingMs: state.intervalMs };

  return {
    ...state,
    index: clamped,
    remainingMs: state.intervalMs,
    stepId: state.stepId + 1,
    itemsShown: Math.max(state.itemsShown, clamped + 1),
  };
}

/**
 * Pure state machine for a practice run.
 * Sequence generation happens outside (it needs randomness), which keeps every
 * transition here deterministic and testable.
 */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'start':
      return {
        ...initialSessionState,
        status: 'running',
        sequence: action.sequence,
        intervalMs: action.intervalMs,
        remainingMs: action.intervalMs,
        sessionTotalMs: action.sessionMs,
        sessionRemainingMs: action.sessionMs,
        stepId: state.stepId + 1,
        startedAt: action.at,
        itemsShown: action.sequence.length > 0 ? 1 : 0,
      };

    case 'tick': {
      if (state.status !== 'running') return state;

      const sessionRemainingMs =
        state.sessionRemainingMs === null
          ? null
          : Math.max(0, state.sessionRemainingMs - action.deltaMs);

      // The whole-session budget outranks the per-item countdown.
      if (sessionRemainingMs === 0) {
        return { ...state, sessionRemainingMs, status: 'finished' };
      }

      const remainingMs = state.remainingMs - action.deltaMs;
      const elapsedMs = state.elapsedMs + action.deltaMs;
      const ticked = { ...state, sessionRemainingMs, elapsedMs };
      if (remainingMs > 0) return { ...ticked, remainingMs };
      return moveTo(ticked, state.index + 1);
    }

    case 'advance':
      return state.status === 'idle' ? state : moveTo(state, state.index + 1);

    case 'back':
      return state.status === 'idle' ? state : moveTo(state, state.index - 1);

    case 'extend':
      return action.items.length === 0
        ? state
        : { ...state, sequence: [...state.sequence, ...action.items] };

    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state;

    case 'resume':
      return state.status === 'paused' ? { ...state, status: 'running' } : state;

    case 'stop':
      return state.status === 'idle' ? state : { ...state, status: 'finished' };

    case 'reset':
      return { ...initialSessionState, intervalMs: state.intervalMs };

    case 'setInterval':
      return {
        ...state,
        intervalMs: action.intervalMs,
        // Never leave a longer countdown than the new interval allows.
        remainingMs: Math.min(state.remainingMs, action.intervalMs),
      };

    case 'answer': {
      const item = state.sequence[state.index];
      if (!item) return state;

      const record: AnswerRecord = {
        itemId: item.id,
        itemLabel: item.label,
        verdict: action.verdict,
        responseMs: action.responseMs,
      };

      const graded: SessionState = {
        ...state,
        answers: [...state.answers, record],
        correct: state.correct + (action.verdict === 'correct' ? 1 : 0),
        wrong: state.wrong + (action.verdict === 'wrong' ? 1 : 0),
      };

      return moveTo(graded, state.index + 1);
    }

    default:
      return state;
  }
}

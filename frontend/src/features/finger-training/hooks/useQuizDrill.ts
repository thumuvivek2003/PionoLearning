import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStrategy } from '@/features/randomizer';
import type { Identifiable } from '@/features/randomizer';

/** How long a verdict stays on screen before the next prompt. */
const CORRECT_HOLD_MS = 450;
const WRONG_HOLD_MS = 900;

export type QuizVerdict = 'waiting' | 'correct' | 'wrong';

export interface QuizStats {
  asked: number;
  correct: number;
  /** Correct answers in a row, reset by any miss. */
  streak: number;
  bestStreak: number;
  /** Mean time to a first-try correct answer, in ms. */
  averageMs: number | null;
  fastestMs: number | null;
}

const EMPTY_STATS: QuizStats = {
  asked: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  averageMs: null,
  fastestMs: null,
};

interface QuizDrillOptions<Q extends Identifiable, A> {
  /** Everything that can be asked. */
  pool: readonly Q[];
  /** The answer a prompt is looking for. */
  answerOf: (question: Q) => A;
  /** Draw policy — defaults to never repeating the prompt just shown. */
  strategyId?: string;
}

/**
 * The prompt → answer → verdict loop shared by the recognition drills.
 *
 * It owns no rendering and knows nothing about fingers: give it a pool and a
 * way to read the expected answer, and it handles drawing, grading, timing and
 * the streak. Draw policy is delegated to the randomizer feature so difficulty
 * behaves the same here as it does in the trainers.
 */
export function useQuizDrill<Q extends Identifiable, A>({
  pool,
  answerOf,
  strategyId = 'no-repeat',
}: QuizDrillOptions<Q, A>) {
  const strategy = useMemo(() => getStrategy(strategyId), [strategyId]);

  // Held in a ref so an inline `answerOf` cannot re-create `answer` every
  // render — the drills bind it to key handlers, which would resubscribe.
  const readAnswer = useRef(answerOf);
  useEffect(() => {
    readAnswer.current = answerOf;
  }, [answerOf]);

  const draw = useCallback(
    (history: readonly Q[]) => strategy.pick({ pool, history, random: Math.random }),
    [pool, strategy],
  );

  const [question, setQuestion] = useState<Q>(() => draw([]));
  const [verdict, setVerdict] = useState<QuizVerdict>('waiting');
  const [given, setGiven] = useState<A | null>(null);
  const [stats, setStats] = useState<QuizStats>(EMPTY_STATS);

  /** Prompts already shown, so the strategy can avoid repeats. */
  const history = useRef<Q[]>([]);
  const shownAt = useRef<number>(performance.now());
  /** A miss means the time to the eventual correct answer no longer counts. */
  const missed = useRef(false);
  const advanceTimer = useRef<number | null>(null);

  const clearTimer = () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
  };

  const present = useCallback(
    (next: Q) => {
      history.current = [...history.current, next].slice(-8);
      setQuestion(next);
      setVerdict('waiting');
      setGiven(null);
      missed.current = false;
      shownAt.current = performance.now();
    },
    [],
  );

  const advance = useCallback(() => {
    clearTimer();
    present(draw(history.current));
  }, [draw, present]);

  const answer = useCallback(
    (value: A) => {
      // Ignore input while a verdict is showing, so a double tap cannot skip one.
      if (verdict !== 'waiting') return;

      const elapsed = performance.now() - shownAt.current;
      const isCorrect = value === readAnswer.current(question);
      setGiven(value);
      setVerdict(isCorrect ? 'correct' : 'wrong');

      setStats((current) => {
        if (!isCorrect) {
          missed.current = true;
          return {
            ...current,
            asked: current.asked + 1,
            streak: 0,
          };
        }

        // Only clean first-try answers are timed — a corrected one is not recall.
        const timed = !missed.current;
        const correct = current.correct + 1;
        const streak = current.streak + 1;
        const previousTotal = (current.averageMs ?? 0) * current.correct;

        return {
          asked: current.asked + 1,
          correct,
          streak,
          bestStreak: Math.max(current.bestStreak, streak),
          averageMs: timed ? (previousTotal + elapsed) / correct : current.averageMs,
          fastestMs: timed ? Math.min(current.fastestMs ?? elapsed, elapsed) : current.fastestMs,
        };
      });

      clearTimer();
      advanceTimer.current = window.setTimeout(
        // A miss re-asks the same prompt: you have to produce the right answer.
        isCorrect ? advance : () => setVerdict('waiting'),
        isCorrect ? CORRECT_HOLD_MS : WRONG_HOLD_MS,
      );
    },
    [advance, question, verdict],
  );

  const reset = useCallback(() => {
    clearTimer();
    history.current = [];
    setStats(EMPTY_STATS);
    present(draw([]));
  }, [draw, present]);

  // A changed pool (a mode switch) invalidates the prompt on screen.
  useEffect(() => {
    reset();
    // reset is stable per pool; re-running on identity alone would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  useEffect(() => clearTimer, []);

  return {
    question,
    verdict,
    /** What the user last answered, for showing which chip was wrong. */
    given,
    expected: readAnswer.current(question),
    stats,
    answer,
    skip: advance,
    reset,
  };
}

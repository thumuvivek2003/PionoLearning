import { useCallback, useState } from 'react';
import { recordAnswer } from '../scoring';
import type { ItemScore, ScoreBook } from '../scoring';

/**
 * A ledger of how you are doing, item by item.
 *
 * Held apart from any one engine because both kinds of drill need it: a quiz
 * records one answer per prompt, a chain records one per step of a run, and
 * both want the same question answered afterwards — which of these do I keep
 * getting wrong?
 */
export function useScoreBook() {
  const [book, setBook] = useState<ScoreBook>(() => new Map<string, ItemScore>());

  /** `elapsedMs` is null when the timing does not count, e.g. a second try. */
  const record = useCallback((key: string, isCorrect: boolean, elapsedMs: number | null) => {
    setBook((current) => {
      const next = new Map(current);
      next.set(key, recordAnswer(current.get(key), key, isCorrect, elapsedMs));
      return next;
    });
  }, []);

  const clear = useCallback(() => setBook(new Map<string, ItemScore>()), []);

  return { book, record, clear };
}

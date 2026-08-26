import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import type { CurriculumBucket, CurriculumLevel } from './curriculum.types';

/**
 * Which practices you have ticked off.
 *
 * Stored as a flat list of practice ids rather than a tree, because that is the
 * only shape that survives the curriculum changing: a bucket can gain or lose
 * practices and every tick still points at the right thing. Ids are stable and
 * derived from the level and bucket, so nothing here needs to know the shape of
 * the tree it is recording progress through.
 */
interface ProgressValue {
  /** True when this practice has been ticked. */
  isDone: (practiceId: string) => boolean;
  toggle: (practiceId: string) => void;
  /** Ticks or clears every practice of a bucket at once. */
  setBucket: (bucket: CurriculumBucket, done: boolean) => void;
  /** How many of a list of practices are ticked. */
  countDone: (practiceIds: readonly string[]) => number;
  /** Everything ticked, for the counters. */
  doneCount: number;
  clearAll: () => void;
}

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [ids, setIds, reset] = useLocalStorage<readonly string[]>(STORAGE_KEYS.progress, []);

  // A set for the lookups, rebuilt only when the stored list changes.
  const done = useMemo(() => new Set(ids), [ids]);

  const isDone = useCallback((practiceId: string) => done.has(practiceId), [done]);

  const toggle = useCallback(
    (practiceId: string) =>
      setIds((current) => {
        const next = new Set(current);
        if (next.has(practiceId)) next.delete(practiceId);
        else next.add(practiceId);
        return [...next];
      }),
    [setIds],
  );

  const setBucket = useCallback(
    (bucket: CurriculumBucket, wanted: boolean) =>
      setIds((current) => {
        const next = new Set(current);
        for (const practice of bucket.practices) {
          if (wanted) next.add(practice.id);
          else next.delete(practice.id);
        }
        return [...next];
      }),
    [setIds],
  );

  const countDone = useCallback(
    (practiceIds: readonly string[]) => practiceIds.reduce((sum, id) => sum + (done.has(id) ? 1 : 0), 0),
    [done],
  );

  const value = useMemo<ProgressValue>(
    () => ({ isDone, toggle, setBucket, countDone, doneCount: done.size, clearAll: reset }),
    [countDone, done.size, isDone, reset, setBucket, toggle],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used inside <ProgressProvider>');
  return context;
}

/** Every practice id of a bucket, for the counters and the tick-all control. */
export function bucketPracticeIds(bucket: CurriculumBucket): readonly string[] {
  return bucket.practices.map((practice) => practice.id);
}

/** Every practice id of a level. */
export function levelPracticeIds(level: CurriculumLevel): readonly string[] {
  return level.buckets.flatMap(bucketPracticeIds);
}

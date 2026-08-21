import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { SessionRecord } from '@/features/statistics';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import {
  LESSON_PLAN,
  LESSON_SPEEDS,
  drillKey,
  getLesson,
  requiredItemsFor,
} from './lessonPlan';
import type { DrillProgress, LessonStatus } from './lessons.types';

const EMPTY_DRILL: DrillProgress = {
  done: false,
  bestItems: 0,
  bestAccuracy: null,
  attempts: 0,
  completedAt: null,
};

type ProgressStore = Record<string, DrillProgress>;

interface LessonsContextValue {
  /** Every lesson with its four drills, in ladder order. */
  statuses: readonly LessonStatus[];
  /** The first drill that is not cleared yet — what to practise next. */
  nextUp: { lessonId: string; seconds: number } | null;
  clearedDrills: number;
  totalDrills: number;
  progressFor: (lessonId: string, seconds: number) => DrillProgress;
  /** Fold a finished run into lesson progress. Ignores non-lesson runs. */
  registerSession: (session: SessionRecord) => void;
  reset: () => void;
}

const LessonsContext = createContext<LessonsContextValue | null>(null);

/**
 * Lesson progress is stored on its own rather than derived from history:
 * History keeps only the most recent runs, and the ladder is 64 drills long,
 * so a derived version would forget rungs you had already cleared.
 */
export function LessonsProvider({ children }: { children: ReactNode }) {
  const [store, setStore, resetStore] = useLocalStorage<ProgressStore>(STORAGE_KEYS.lessons, {});

  const progressFor = useCallback(
    (lessonId: string, seconds: number) => store[drillKey(lessonId, seconds)] ?? EMPTY_DRILL,
    [store],
  );

  const registerSession = useCallback(
    (session: SessionRecord) => {
      const lesson = getLesson(session.presetId);
      if (!lesson) return;
      // Only the four ladder speeds count — a run at 3 s is practice, not a drill.
      if (!LESSON_SPEEDS.includes(session.intervalSeconds)) return;

      const key = drillKey(lesson.id, session.intervalSeconds);
      const graded = session.correct + session.wrong;
      const accuracy = graded > 0 ? session.correct / graded : null;

      setStore((current) => {
        const previous = current[key] ?? EMPTY_DRILL;
        const bestItems = Math.max(previous.bestItems, session.itemsShown);
        const done = previous.done || bestItems >= requiredItemsFor(lesson);

        return {
          ...current,
          [key]: {
            done,
            bestItems,
            bestAccuracy:
              accuracy === null
                ? previous.bestAccuracy
                : Math.max(previous.bestAccuracy ?? 0, accuracy),
            attempts: previous.attempts + 1,
            completedAt: previous.completedAt ?? (done ? session.endedAt : null),
          },
        };
      });
    },
    [setStore],
  );

  const statuses = useMemo<readonly LessonStatus[]>(
    () =>
      LESSON_PLAN.map((lesson) => {
        const drills = LESSON_SPEEDS.map((seconds) => ({
          seconds,
          progress: store[drillKey(lesson.id, seconds)] ?? EMPTY_DRILL,
        }));
        const cleared = drills.filter((drill) => drill.progress.done).length;
        return {
          lesson,
          drills,
          cleared,
          complete: cleared === LESSON_SPEEDS.length,
          started: drills.some((drill) => drill.progress.attempts > 0),
        };
      }),
    [store],
  );

  const nextUp = useMemo(() => {
    for (const status of statuses) {
      const drill = status.drills.find((entry) => !entry.progress.done);
      if (drill) return { lessonId: status.lesson.id, seconds: drill.seconds };
    }
    return null;
  }, [statuses]);

  const value = useMemo<LessonsContextValue>(
    () => ({
      statuses,
      nextUp,
      clearedDrills: statuses.reduce((total, status) => total + status.cleared, 0),
      totalDrills: LESSON_PLAN.length * LESSON_SPEEDS.length,
      progressFor,
      registerSession,
      reset: resetStore,
    }),
    [nextUp, progressFor, registerSession, resetStore, statuses],
  );

  return <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>;
}

export function useLessons(): LessonsContextValue {
  const context = useContext(LessonsContext);
  if (!context) throw new Error('useLessons must be used inside <LessonsProvider>');
  return context;
}

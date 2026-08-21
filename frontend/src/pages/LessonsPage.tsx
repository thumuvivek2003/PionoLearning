import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { Button, Icon } from '@/components/ui';
import {
  LESSON_GROUP_ORDER,
  LESSON_MODULE_ID,
  requiredItemsFor,
  useLessons,
} from '@/features/lessons';
import type { LessonStatus } from '@/features/lessons';
import { cn } from '@/lib/cn';
import styles from './lessons.module.css';
import pageStyles from './pages.module.css';

function speedLabel(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

/**
 * The lesson ladder: sixteen sets, each drilled at four speeds.
 *
 * The page owns no practice logic — every drill is a deep link into the note
 * trainer with a preset and an interval already chosen.
 */
export function LessonsPage() {
  const navigate = useNavigate();
  const { statuses, nextUp, clearedDrills, totalDrills } = useLessons();

  const startDrill = (lessonId: string, seconds: number) => {
    navigate(`/train/${LESSON_MODULE_ID}?preset=${encodeURIComponent(lessonId)}&interval=${seconds}`);
  };

  const percent = Math.round((clearedDrills / totalDrills) * 100);

  const grouped = LESSON_GROUP_ORDER.map((group) => ({
    group,
    entries: statuses.filter((status) => status.lesson.group === group),
  })).filter((section) => section.entries.length > 0);

  return (
    <AppShell
      title="Lessons"
      subtitle="Sixteen sets, four speeds each — learn every key against the 2–3 black-key pattern"
      activeModuleId={LESSON_MODULE_ID}
    >
      <section className={styles.summary}>
        <div className={styles.summaryHead}>
          <div>
            <span className={pageStyles.tileLabel}>Ladder progress</span>
            <p className={styles.summaryValue}>
              {clearedDrills}
              <span className={styles.summaryTotal}> / {totalDrills} drills cleared</span>
            </p>
          </div>
          {nextUp && (
            <Button
              variant="primary"
              icon="play"
              onClick={() => startDrill(nextUp.lessonId, nextUp.seconds)}
            >
              Continue — {speedLabel(nextUp.seconds)}
            </Button>
          )}
        </div>
        <div className={pageStyles.meter}>
          <div className={pageStyles.meterFill} style={{ width: `${percent}%` }} />
        </div>
        <p className={pageStyles.tileHint}>
          A drill is cleared once you reach its rep target in a single run at that speed. Nothing is
          locked — the ladder is a suggested order, not a gate.
        </p>
      </section>

      {grouped.map((section) => (
        <section key={section.group} className={styles.group}>
          <h2 className={styles.groupTitle}>{section.group}</h2>
          <div className={styles.lessonList}>
            {section.entries.map((status) => (
              <LessonRow
                key={status.lesson.id}
                status={status}
                isNext={nextUp?.lessonId === status.lesson.id}
                nextSeconds={nextUp?.lessonId === status.lesson.id ? nextUp.seconds : null}
                onStart={startDrill}
              />
            ))}
          </div>
        </section>
      ))}
    </AppShell>
  );
}

interface LessonRowProps {
  status: LessonStatus;
  isNext: boolean;
  nextSeconds: number | null;
  onStart: (lessonId: string, seconds: number) => void;
}

function LessonRow({ status, isNext, nextSeconds, onStart }: LessonRowProps) {
  const { lesson, drills, complete, cleared } = status;
  const target = requiredItemsFor(lesson);

  return (
    <article className={cn(styles.lesson, complete && styles.lessonDone, isNext && styles.lessonNext)}>
      <span className={cn(styles.order, complete && styles.orderDone)}>
        {complete ? <Icon name="check" size={16} /> : String(lesson.order).padStart(2, '0')}
      </span>

      <div className={styles.lessonBody}>
        <div className={styles.lessonHead}>
          <h3 className={styles.lessonTitle}>{lesson.title}</h3>
          <span className={styles.lessonCount}>
            {cleared}/{drills.length} speeds · {target} reps to clear
          </span>
        </div>
        <p className={styles.lessonFocus}>{lesson.focus}</p>

        <div className={styles.drills}>
          {drills.map(({ seconds, progress }) => {
            const isTarget = nextSeconds === seconds;
            return (
              <button
                key={seconds}
                type="button"
                className={cn(
                  styles.drill,
                  progress.done && styles.drillDone,
                  isTarget && styles.drillNext,
                )}
                onClick={() => onStart(lesson.id, seconds)}
                title={
                  progress.done
                    ? `Cleared — best ${progress.bestItems} reps`
                    : `Best so far: ${progress.bestItems} of ${target} reps`
                }
              >
                {progress.done && <Icon name="check" size={13} />}
                {speedLabel(seconds)}
                {!progress.done && progress.bestItems > 0 && (
                  <span className={styles.drillProgress}>
                    {progress.bestItems}/{target}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}

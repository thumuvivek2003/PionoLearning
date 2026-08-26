import { Link } from 'react-router-dom';
import { getLevelDiagram } from '@/assets/curriculum';
import { AppShell } from '@/components/layout';
import { AsyncImage, Chip, Icon } from '@/components/ui';
import {
  curriculumReadiness,
  levelHref,
  levelPracticeIds,
  levelReadiness,
  listLevels,
  useProgress,
} from '@/features/curriculum';
import type { CurriculumLevel } from '@/features/curriculum';
import { DEFAULT_MODULE_ID } from '@/modules/registry';
import { ProgressBar } from './CurriculumBucketPage';
import styles from './curriculum.module.css';
import pageStyles from '../pages.module.css';

/**
 * The whole path at a glance: eight levels, each its own card.
 *
 * The page derives everything it shows from the curriculum data, so adding a
 * level or wiring one up changes this screen without touching it.
 */
export function CurriculumPage() {
  const levels = listLevels();
  const totals = curriculumReadiness();
  const buckets = levels.reduce((count, level) => count + level.buckets.length, 0);
  const progress = useProgress();
  const done = progress.doneCount;

  return (
    <AppShell
      title="Curriculum"
      subtitle={`${levels.length} levels · ${buckets} buckets · ${totals.total} practices`}
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <section className={styles.surface}>
        <div className={styles.overall}>
          <div className={styles.overallTop}>
            <span className={styles.overallCount}>
              {done} <span className={styles.overallOf}>of {totals.total} practices done</span>
            </span>
            {done > 0 && (
              <button type="button" className={styles.tickAll} onClick={progress.clearAll}>
                Reset progress
              </button>
            )}
          </div>
          <ProgressBar done={done} total={totals.total} />
        </div>

        <div className={styles.introSteps}>
          <div className={styles.step}>
            <span className={styles.stepLabel}>Level</span>
            <span className={styles.stepText}>
              A stage of playing — geography, technique, rhythm, and on to performance.
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepLabel}>Bucket</span>
            <span className={styles.stepText}>
              One skill inside that level, e.g. black-key geography or thumb crossings.
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepLabel}>Practice</span>
            <span className={styles.stepText}>
              A single drill you actually sit down and repeat until it is automatic.
            </span>
          </div>
        </div>
        <p className={pageStyles.tileHint}>
          The path is mapped out end to end; the drills behind each practice are being built one at
          a time, so anything not ready yet says <strong>Coming soon</strong>. The{' '}
          <Link to="/lessons">lesson ladder</Link> is playable today and covers the ground of
          Level&nbsp;1.
        </p>
      </section>

      <div className={styles.levelGrid}>
        {levels.map((level) => (
          <LevelCard key={level.id} level={level} />
        ))}
      </div>
    </AppShell>
  );
}

function LevelCard({ level }: { level: CurriculumLevel }) {
  const { total, ready } = levelReadiness(level);
  const diagram = getLevelDiagram(level.id);
  const done = useProgress().countDone(levelPracticeIds(level));

  return (
    <Link to={levelHref(level)} className={styles.card}>
      {diagram && (
        <AsyncImage
          src={diagram.thumb}
          alt={`Map of ${level.title}: its buckets and the practices inside them`}
          className={styles.cardMedia}
        />
      )}

      <div className={styles.cardContent}>
        <div className={styles.cardTop}>
          <span className={styles.headEmoji} aria-hidden="true">
            {level.emoji}
          </span>
          <span className={styles.cardHeading}>
            <span className={styles.code}>{level.id}</span>
            <h2 className={styles.cardTitle}>{level.title}</h2>
          </span>
          <Icon name="chevron-right" className={styles.cardArrow} />
        </div>

        <p className={styles.cardSummary}>{level.summary}</p>

        <div className={styles.meta}>
          <span>{level.buckets.length} buckets</span>
          <span>·</span>
          <span>{total} practices</span>
          {done > 0 && (
            <Chip tone={done === total ? 'accent' : 'neutral'}>
              {done === total ? 'Done' : `${done} done`}
            </Chip>
          )}
          {ready > 0 ? <Chip tone="accent">{ready} ready</Chip> : <Chip>Coming soon</Chip>}
        </div>
        <ProgressBar done={done} total={total} />
      </div>
    </Link>
  );
}

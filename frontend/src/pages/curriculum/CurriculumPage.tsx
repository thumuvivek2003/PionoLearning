import { Link } from 'react-router-dom';
import { getLevelDiagram } from '@/assets/curriculum';
import { AppShell } from '@/components/layout';
import { AsyncImage, Chip, Icon } from '@/components/ui';
import {
  curriculumReadiness,
  levelHref,
  levelReadiness,
  listLevels,
} from '@/features/curriculum';
import type { CurriculumLevel } from '@/features/curriculum';
import { DEFAULT_MODULE_ID } from '@/modules/registry';
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

  return (
    <AppShell
      title="Curriculum"
      subtitle={`${levels.length} levels · ${buckets} buckets · ${totals.total} practices`}
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <section className={styles.surface}>
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
          {ready > 0 ? <Chip tone="accent">{ready} ready</Chip> : <Chip>Coming soon</Chip>}
        </div>
      </div>
    </Link>
  );
}

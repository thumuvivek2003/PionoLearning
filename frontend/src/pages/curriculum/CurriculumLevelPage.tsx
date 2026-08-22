import { Link, useParams } from 'react-router-dom';
import { getLevelDiagram } from '@/assets/curriculum';
import type { LevelDiagram } from '@/assets/curriculum';
import { AppShell, Breadcrumbs } from '@/components/layout';
import { AsyncImage, Chip, Icon } from '@/components/ui';
import {
  CURRICULUM_ROOT,
  bucketHref,
  bucketReadiness,
  levelHref,
  levelNeighbours,
  levelReadiness,
  resolvePath,
} from '@/features/curriculum';
import type { CurriculumBucket, CurriculumLevel } from '@/features/curriculum';
import { cn } from '@/lib/cn';
import { DEFAULT_MODULE_ID } from '@/modules/registry';
import { CurriculumMissing } from './CurriculumMissing';
import styles from './curriculum.module.css';

/** One level: its buckets, and where to go next. */
export function CurriculumLevelPage() {
  const { levelId } = useParams();
  const path = resolvePath({ levelId });

  if (!path) return <CurriculumMissing what="level" />;

  const { level } = path;
  const { total, ready } = levelReadiness(level);
  const { previous, next } = levelNeighbours(level);
  const diagram = getLevelDiagram(level.id);

  return (
    <AppShell
      title={`${level.id} · ${level.title}`}
      subtitle={`${level.buckets.length} buckets · ${total} practices`}
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <Breadcrumbs
        items={[
          { label: 'Curriculum', to: CURRICULUM_ROOT },
          { label: `${level.id} — ${level.title}` },
        ]}
      />

      <section className={styles.head}>
        <div className={styles.headTop}>
          <span className={styles.headEmoji} aria-hidden="true">
            {level.emoji}
          </span>
          <span className={styles.cardHeading}>
            <span className={styles.code}>Level {level.order}</span>
            <h2 className={styles.headTitle}>{level.title}</h2>
          </span>
          {ready > 0 ? <Chip tone="accent">{ready} ready</Chip> : <Chip>Coming soon</Chip>}
        </div>
        <p className={styles.cardSummary}>{level.summary}</p>
      </section>

      {diagram && <LevelMap level={level} diagram={diagram} />}

      <div className={styles.bucketGrid}>
        {level.buckets.map((bucket) => (
          <BucketCard key={bucket.id} bucket={bucket} />
        ))}
      </div>

      <LevelPager previous={previous} next={next} />
    </AppShell>
  );
}

/**
 * The level's mind-map, shown full width.
 *
 * It carries the whole level at once — buckets down the left, practices across
 * each row — so it reads as the map the cards below are an index to.
 */
function LevelMap({ level, diagram }: { level: CurriculumLevel; diagram: LevelDiagram }) {
  return (
    <figure className={styles.figure}>
      <div className={styles.figureHead}>
        <figcaption className={styles.figureCaption}>
          <Icon name="layers" size={14} />
          {level.id} at a glance
        </figcaption>
        <a className={styles.figureLink} href={diagram.full} target="_blank" rel="noreferrer">
          Open full size
          <Icon name="chevron-right" size={13} />
        </a>
      </div>
      <AsyncImage
        src={diagram.full}
        srcSet={`${diagram.thumb} 800w, ${diagram.full} ${diagram.width}w`}
        sizes="(max-width: 700px) 100vw, 900px"
        alt={`Map of ${level.title}: ${level.buckets.map((bucket) => bucket.title).join(', ')}`}
        aspectRatio={diagram.aspectRatio}
        eager
      />
    </figure>
  );
}

function BucketCard({ bucket }: { bucket: CurriculumBucket }) {
  const { total, ready } = bucketReadiness(bucket);
  const preview = bucket.practices.slice(0, 3).map((practice) => practice.title);

  return (
    <Link to={bucketHref(bucket)} className={styles.card}>
      <div className={styles.cardContent}>
        <div className={styles.cardTop}>
          <span className={styles.cardHeading}>
            <span className={styles.code}>{bucket.id}</span>
            <h3 className={styles.cardTitle}>{bucket.title}</h3>
          </span>
          <Icon name="chevron-right" className={styles.cardArrow} />
        </div>

        <p className={styles.bucketPreview}>
          {preview.join(' · ')}
          {total > preview.length && ` · +${total - preview.length} more`}
        </p>

        <div className={styles.meta}>
          <span>{total} practices</span>
          {ready > 0 ? <Chip tone="accent">{ready} ready</Chip> : <Chip>Coming soon</Chip>}
        </div>
      </div>
    </Link>
  );
}

interface LevelPagerProps {
  previous: CurriculumLevel | null;
  next: CurriculumLevel | null;
}

function LevelPager({ previous, next }: LevelPagerProps) {
  if (!previous && !next) return null;

  return (
    <nav className={styles.pager} aria-label="Levels">
      {previous && (
        <Link to={levelHref(previous)} className={styles.pagerLink}>
          <span className={styles.pagerLabel}>
            <Icon name="chevron-left" size={13} />
            Previous level
          </span>
          <span className={styles.pagerTitle}>
            {previous.id} — {previous.title}
          </span>
        </Link>
      )}
      {next && (
        <Link to={levelHref(next)} className={cn(styles.pagerLink, styles.pagerNext)}>
          <span className={styles.pagerLabel}>
            Next level
            <Icon name="chevron-right" size={13} />
          </span>
          <span className={styles.pagerTitle}>
            {next.id} — {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}

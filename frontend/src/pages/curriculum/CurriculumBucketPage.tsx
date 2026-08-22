import { Link, useParams } from 'react-router-dom';
import { AppShell, Breadcrumbs } from '@/components/layout';
import { Chip, Icon } from '@/components/ui';
import {
  CURRICULUM_ROOT,
  bucketHref,
  bucketNeighbours,
  bucketReadiness,
  isPracticeReady,
  levelHref,
  practiceHref,
  resolvePath,
} from '@/features/curriculum';
import type { CurriculumBucket, CurriculumPractice } from '@/features/curriculum';
import { cn } from '@/lib/cn';
import { DEFAULT_MODULE_ID } from '@/modules/registry';
import { CurriculumMissing } from './CurriculumMissing';
import styles from './curriculum.module.css';

/** One bucket: the list of practices it holds. */
export function CurriculumBucketPage() {
  const { levelId, bucketId } = useParams();
  const path = resolvePath({ levelId, bucketId });

  if (!path) return <CurriculumMissing what="level" />;
  if (!path.bucket) return <CurriculumMissing what="bucket" />;

  const { level, bucket } = path;
  const { total, ready } = bucketReadiness(bucket);
  const { previous, next } = bucketNeighbours(level, bucket);

  return (
    <AppShell
      title={`${bucket.id} · ${bucket.title}`}
      subtitle={`${level.id} ${level.title} · ${total} practices`}
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <Breadcrumbs
        items={[
          { label: 'Curriculum', to: CURRICULUM_ROOT },
          { label: level.id, to: levelHref(level) },
          { label: `${bucket.id} — ${bucket.title}` },
        ]}
      />

      <section className={styles.head}>
        <div className={styles.headTop}>
          <span className={styles.cardHeading}>
            <span className={styles.code}>{bucket.id}</span>
            <h2 className={styles.headTitle}>{bucket.title}</h2>
          </span>
          {ready > 0 ? <Chip tone="accent">{ready} of {total} ready</Chip> : <Chip>Coming soon</Chip>}
        </div>
        <p className={styles.cardSummary}>
          Work down the list — each step is a drill on its own. Open one to see what it asks of you.
        </p>
      </section>

      <div className={styles.practiceList}>
        {bucket.practices.map((practice, index) => (
          <PracticeRow
            key={practice.id}
            bucket={bucket}
            practice={practice}
            position={index + 1}
          />
        ))}
      </div>

      <BucketPager previous={previous} next={next} />
    </AppShell>
  );
}

interface PracticeRowProps {
  bucket: CurriculumBucket;
  practice: CurriculumPractice;
  position: number;
}

function PracticeRow({ bucket, practice, position }: PracticeRowProps) {
  const ready = isPracticeReady(practice);

  return (
    <Link to={practiceHref(bucket, practice)} className={styles.practice}>
      <span className={styles.practiceIndex}>{String(position).padStart(2, '0')}</span>

      <span className={styles.practiceBody}>
        <span className={styles.practiceTitle}>{practice.title}</span>
        <span className={styles.code}>{practice.id}</span>
      </span>

      <span className={styles.practiceRight}>
        {ready ? <Chip tone="accent">Ready</Chip> : <Icon name="lock" size={15} />}
        <Icon name="chevron-right" size={16} />
      </span>
    </Link>
  );
}

interface BucketPagerProps {
  previous: CurriculumBucket | null;
  next: CurriculumBucket | null;
}

function BucketPager({ previous, next }: BucketPagerProps) {
  if (!previous && !next) return null;

  return (
    <nav className={styles.pager} aria-label="Buckets">
      {previous && (
        <Link to={bucketHref(previous)} className={styles.pagerLink}>
          <span className={styles.pagerLabel}>
            <Icon name="chevron-left" size={13} />
            Previous bucket
          </span>
          <span className={styles.pagerTitle}>
            {previous.id} — {previous.title}
          </span>
        </Link>
      )}
      {next && (
        <Link to={bucketHref(next)} className={cn(styles.pagerLink, styles.pagerNext)}>
          <span className={styles.pagerLabel}>
            Next bucket
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

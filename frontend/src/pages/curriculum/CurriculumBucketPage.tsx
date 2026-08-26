import { Link, useParams } from 'react-router-dom';
import { AppShell, Breadcrumbs } from '@/components/layout';
import { Chip, Icon, Tick } from '@/components/ui';
import {
  CURRICULUM_ROOT,
  bucketHref,
  bucketNeighbours,
  bucketPracticeIds,
  bucketReadiness,
  isPracticeReady,
  levelHref,
  practiceHref,
  resolvePath,
  useProgress,
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
  const progress = useProgress();

  if (!path) return <CurriculumMissing what="level" />;
  if (!path.bucket) return <CurriculumMissing what="bucket" />;

  const { level, bucket } = path;
  const { total, ready } = bucketReadiness(bucket);
  const { previous, next } = bucketNeighbours(level, bucket);
  const ids = bucketPracticeIds(bucket);
  const done = progress.countDone(ids);
  const allDone = done === total && total > 0;

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
          <span className={styles.headChips}>
            <Chip tone={allDone ? 'accent' : 'neutral'}>
              {done} of {total} done
            </Chip>
            {ready > 0 ? <Chip>{ready} ready</Chip> : <Chip>Coming soon</Chip>}
          </span>
        </div>
        <p className={styles.cardSummary}>
          Work down the list — each step is a drill on its own. Tick one off when it is reliable, not
          the first time it goes right.
        </p>
        <div className={styles.progressRow}>
          <ProgressBar done={done} total={total} />
          <button
            type="button"
            className={styles.tickAll}
            onClick={() => progress.setBucket(bucket, !allDone)}
          >
            {allDone ? 'Clear the bucket' : 'Tick them all'}
          </button>
        </div>
      </section>

      <div className={styles.practiceList}>
        {bucket.practices.map((practice, index) => (
          <PracticeRow
            key={practice.id}
            bucket={bucket}
            practice={practice}
            position={index + 1}
            done={progress.isDone(practice.id)}
            onToggle={() => progress.toggle(practice.id)}
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
  done: boolean;
  onToggle: () => void;
}

/**
 * One practice: a tick, a link, and whether a drill exists behind it.
 *
 * The tick sits outside the link rather than inside it, so marking something
 * done never navigates. They look like one row and behave as two controls,
 * which is what the row actually is.
 */
function PracticeRow({ bucket, practice, position, done, onToggle }: PracticeRowProps) {
  const ready = isPracticeReady(practice);

  return (
    <div className={cn(styles.practiceRow, done && styles.practiceRowDone)}>
      <Tick checked={done} onChange={onToggle} label={`Mark ${practice.title} done`} />

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
    </div>
  );
}

/** How far through a list of practices you are, as a bar. */
export function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <span
      className={styles.bar}
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${done} of ${total} practices done`}
    >
      <span className={styles.barFill} style={{ width: `${percent}%` }} />
    </span>
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

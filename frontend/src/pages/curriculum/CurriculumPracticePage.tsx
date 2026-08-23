import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell, Breadcrumbs } from '@/components/layout';
import { Button, Chip, Icon } from '@/components/ui';
import {
  CURRICULUM_ROOT,
  bucketHref,
  isPracticeReady,
  levelHref,
  practiceHref,
  practiceNeighbours,
  resolvePath,
  trainerHref,
} from '@/features/curriculum';
import type {
  CurriculumPractice,
  PracticeActivity,
  PracticeLocation,
  TrainerActivity,
} from '@/features/curriculum';
import { getDrill } from '@/drills/registry';
import { cn } from '@/lib/cn';
import { DEFAULT_MODULE_ID } from '@/modules/registry';
import { CurriculumMissing } from './CurriculumMissing';
import styles from './curriculum.module.css';

/**
 * One practice — the leaf of the tree.
 *
 * A practice that carries an activity launches the trainer; one without says
 * Coming soon. The page reads that from the data alone, so switching a practice
 * on later means attaching an activity in its level file and nothing else.
 */
export function CurriculumPracticePage() {
  const { levelId, bucketId, practiceId } = useParams();
  const path = resolvePath({ levelId, bucketId, practiceId });

  if (!path) return <CurriculumMissing what="level" />;
  if (!path.bucket) return <CurriculumMissing what="bucket" />;
  if (!path.practice) return <CurriculumMissing what="practice" />;

  const { level, bucket, practice } = path;
  const { previous, next } = practiceNeighbours(level, practice);
  const backHref = bucketHref(bucket);

  return (
    <AppShell
      title={`${practice.id} · ${practice.title}`}
      subtitle={`${level.id} ${level.title} · ${bucket.title}`}
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <Breadcrumbs
        items={[
          { label: 'Curriculum', to: CURRICULUM_ROOT },
          { label: level.id, to: levelHref(level) },
          { label: bucket.id, to: backHref },
          { label: practice.title },
        ]}
      />

      <section className={styles.head}>
        <div className={styles.headTop}>
          <span className={styles.cardHeading}>
            <span className={styles.code}>{practice.id}</span>
            <h2 className={styles.headTitle}>{practice.title}</h2>
          </span>
          {isPracticeReady(practice) ? <Chip tone="accent">Ready</Chip> : <Chip>Coming soon</Chip>}
        </div>
        <p className={styles.cardSummary}>
          {bucket.title} — step {stepNumber(practice)} of {bucket.practices.length} in this bucket.
        </p>
      </section>

      {practice.activity ? (
        <PracticeRunner activity={practice.activity} backHref={backHref} />
      ) : (
        <ComingSoonPanel bucketTitle={bucket.title} backHref={backHref} />
      )}

      <PracticePager previous={previous} next={next} />
    </AppShell>
  );
}

/** Position of a practice inside its bucket, read off the trailing code. */
function stepNumber(practice: CurriculumPractice): string {
  return practice.id.split('.').pop() ?? '1';
}

/**
 * Mounts whatever runs this practice.
 *
 * The two activity kinds are the only place the page branches: a drill has its
 * own screen and renders in place, a trainer practice hands off to the trainer.
 */
function PracticeRunner({ activity, backHref }: { activity: PracticeActivity; backHref: string }) {
  if (activity.kind === 'trainer') return <ReadyPanel activity={activity} backHref={backHref} />;

  const drill = getDrill(activity.drillId);
  if (!drill) {
    return (
      <section className={styles.soon}>
        <span className={styles.soonMark}>
          <Icon name="lock" size={22} />
        </span>
        <h3 className={styles.soonTitle}>Screen not registered</h3>
        <p className={styles.soonText}>
          This practice points at the drill <code>{activity.drillId}</code>, which is not in the
          drill registry. Register it in <code>src/drills/registry.tsx</code>.
        </p>
      </section>
    );
  }

  return <drill.render />;
}

function ReadyPanel({ activity, backHref }: { activity: TrainerActivity; backHref: string }) {
  const navigate = useNavigate();

  return (
    <section className={styles.soon}>
      <span className={styles.soonMark}>
        <Icon name="play" size={22} />
      </span>
      <h3 className={styles.soonTitle}>Ready when you are</h3>
      <p className={styles.soonText}>
        This drill opens in the trainer with its set and speed already chosen.
      </p>
      <div className={styles.soonActions}>
        <Button variant="primary" icon="play" onClick={() => navigate(trainerHref(activity))}>
          Start practice
        </Button>
        <Button variant="ghost" icon="layers" onClick={() => navigate(backHref)}>
          Back to bucket
        </Button>
      </div>
    </section>
  );
}

function ComingSoonPanel({ bucketTitle, backHref }: { bucketTitle: string; backHref: string }) {
  const navigate = useNavigate();

  return (
    <section className={styles.soon}>
      <span className={styles.soonMark}>
        <Icon name="lock" size={22} />
      </span>
      <h3 className={styles.soonTitle}>Coming soon</h3>
      <p className={styles.soonText}>
        This drill is mapped out but not built yet. The <strong>{bucketTitle}</strong> bucket will
        light up step by step — until then, practise the live drills on the lesson ladder or in the
        random trainers.
      </p>
      <div className={styles.soonActions}>
        <Button variant="primary" icon="crown" onClick={() => navigate('/lessons')}>
          Open lesson ladder
        </Button>
        <Button variant="ghost" icon="layers" onClick={() => navigate(backHref)}>
          Back to bucket
        </Button>
      </div>
    </section>
  );
}

interface PracticePagerProps {
  previous: PracticeLocation | null;
  next: PracticeLocation | null;
}

function PracticePager({ previous, next }: PracticePagerProps) {
  if (!previous && !next) return null;

  return (
    <nav className={styles.pager} aria-label="Practices">
      {previous && (
        <Link to={practiceHref(previous.bucket, previous.practice)} className={styles.pagerLink}>
          <span className={styles.pagerLabel}>
            <Icon name="chevron-left" size={13} />
            Previous
          </span>
          <span className={styles.pagerTitle}>{previous.practice.title}</span>
        </Link>
      )}
      {next && (
        <Link
          to={practiceHref(next.bucket, next.practice)}
          className={cn(styles.pagerLink, styles.pagerNext)}
        >
          <span className={styles.pagerLabel}>
            Next
            <Icon name="chevron-right" size={13} />
          </span>
          <span className={styles.pagerTitle}>{next.practice.title}</span>
        </Link>
      )}
    </nav>
  );
}

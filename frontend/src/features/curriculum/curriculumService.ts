import type {
  CurriculumBucket,
  CurriculumLevel,
  CurriculumPath,
  CurriculumPractice,
  PracticeActivity,
  ReadinessCount,
} from './curriculum.types';
import { getBucket, getLevel, getPractice, listLevels, sameId } from './curriculumRegistry';

/** Base path for every curriculum route. */
export const CURRICULUM_ROOT = '/curriculum';

/* ---------------- resolving a URL into the tree ---------------- */

interface PathParams {
  levelId?: string;
  bucketId?: string;
  practiceId?: string;
}

/**
 * Turn route params into a validated position in the tree.
 *
 * Returns null when the level is unknown. A bucket or practice that exists but
 * does not belong to its parent is dropped rather than rendered, so a hand-typed
 * URL like /curriculum/L1/B3.2 cannot show a level-3 bucket under level 1.
 */
export function resolvePath({ levelId, bucketId, practiceId }: PathParams): CurriculumPath | null {
  const level = getLevel(levelId);
  if (!level) return null;

  const candidateBucket = getBucket(bucketId);
  const bucket = candidateBucket && sameId(candidateBucket.levelId, level.id) ? candidateBucket : null;
  if (bucketId && !bucket) return { level, bucket: null, practice: null };

  const candidatePractice = getPractice(practiceId);
  const practice =
    bucket && candidatePractice && bucket.practices.some((entry) => sameId(entry.id, candidatePractice.id))
      ? candidatePractice
      : null;

  return { level, bucket, practice };
}

/* ---------------- readiness ---------------- */

/** A practice is playable only once someone attaches an activity to it. */
export function isPracticeReady(practice: CurriculumPractice): boolean {
  return practice.activity !== undefined;
}

export function bucketReadiness(bucket: CurriculumBucket): ReadinessCount {
  return {
    total: bucket.practices.length,
    ready: bucket.practices.filter(isPracticeReady).length,
  };
}

export function levelReadiness(level: CurriculumLevel): ReadinessCount {
  return level.buckets.reduce<ReadinessCount>(
    (total, bucket) => {
      const count = bucketReadiness(bucket);
      return { total: total.total + count.total, ready: total.ready + count.ready };
    },
    { total: 0, ready: 0 },
  );
}

export function curriculumReadiness(): ReadinessCount {
  return listLevels().reduce<ReadinessCount>(
    (total, level) => {
      const count = levelReadiness(level);
      return { total: total.total + count.total, ready: total.ready + count.ready };
    },
    { total: 0, ready: 0 },
  );
}

/* ---------------- links ---------------- */

export function levelHref(level: CurriculumLevel): string {
  return `${CURRICULUM_ROOT}/${level.id}`;
}

export function bucketHref(bucket: CurriculumBucket): string {
  return `${CURRICULUM_ROOT}/${bucket.levelId}/${bucket.id}`;
}

export function practiceHref(bucket: CurriculumBucket, practice: CurriculumPractice): string {
  return `${bucketHref(bucket)}/${practice.id}`;
}

/**
 * Where a ready practice sends you: the shared trainer deep link the lesson
 * ladder already uses, so both entry points stay identical.
 */
export function trainerHref(activity: PracticeActivity): string {
  const params = new URLSearchParams();
  if (activity.presetId) params.set('preset', activity.presetId);
  if (activity.intervalSeconds !== undefined) params.set('interval', String(activity.intervalSeconds));
  const query = params.toString();
  return `/train/${activity.moduleId}${query ? `?${query}` : ''}`;
}

/* ---------------- walking the tree ---------------- */

/** One practice together with the bucket it sits in. */
export interface PracticeLocation {
  bucket: CurriculumBucket;
  practice: CurriculumPractice;
}

/** Every practice in a level, flattened in reading order. */
export function flattenLevel(level: CurriculumLevel): readonly PracticeLocation[] {
  return level.buckets.flatMap((bucket) =>
    bucket.practices.map((practice) => ({ bucket, practice })),
  );
}

/**
 * The practices either side of this one, crossing bucket boundaries so
 * Next keeps moving through the level instead of dead-ending.
 */
export function practiceNeighbours(
  level: CurriculumLevel,
  practice: CurriculumPractice,
): { previous: PracticeLocation | null; next: PracticeLocation | null } {
  const all = flattenLevel(level);
  const index = all.findIndex((entry) => sameId(entry.practice.id, practice.id));
  if (index === -1) return { previous: null, next: null };

  return {
    previous: all[index - 1] ?? null,
    next: all[index + 1] ?? null,
  };
}

/** The buckets either side of this one inside its own level. */
export function bucketNeighbours(
  level: CurriculumLevel,
  bucket: CurriculumBucket,
): { previous: CurriculumBucket | null; next: CurriculumBucket | null } {
  const index = level.buckets.findIndex((entry) => sameId(entry.id, bucket.id));
  if (index === -1) return { previous: null, next: null };

  return {
    previous: index > 0 ? (level.buckets[index - 1] as CurriculumBucket) : null,
    next: index < level.buckets.length - 1 ? (level.buckets[index + 1] as CurriculumBucket) : null,
  };
}

/** The levels either side of this one, for the level-page footer nav. */
export function levelNeighbours(level: CurriculumLevel): {
  previous: CurriculumLevel | null;
  next: CurriculumLevel | null;
} {
  const levels = listLevels();
  const index = levels.findIndex((entry) => sameId(entry.id, level.id));
  return {
    previous: index > 0 ? (levels[index - 1] as CurriculumLevel) : null,
    next: index >= 0 && index < levels.length - 1 ? (levels[index + 1] as CurriculumLevel) : null,
  };
}

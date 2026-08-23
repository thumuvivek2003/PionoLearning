import type {
  BucketBlueprint,
  CurriculumBucket,
  CurriculumLevel,
  CurriculumPractice,
  LevelBlueprint,
  PracticeBlueprint,
} from '../curriculum.types';

/**
 * Factory that turns a blueprint into a level.
 *
 * Data files list titles only; every id is derived from position here:
 *
 *   level 1 → "L1"
 *   its 2nd bucket → "B1.2"
 *   that bucket's 3rd practice → "B1.2.3"
 *
 * One place owns the numbering, so codes stay consistent no matter how many
 * levels get added or how deep they grow.
 */
export function defineLevel(blueprint: LevelBlueprint): CurriculumLevel {
  const levelId = `L${blueprint.order}`;

  return {
    id: levelId,
    order: blueprint.order,
    emoji: blueprint.emoji,
    title: blueprint.title,
    summary: blueprint.summary,
    buckets: blueprint.buckets.map((bucket, index) =>
      defineBucket(bucket, levelId, `B${blueprint.order}.${index + 1}`),
    ),
  };
}

function defineBucket(
  blueprint: BucketBlueprint,
  levelId: string,
  bucketId: string,
): CurriculumBucket {
  return {
    id: bucketId,
    levelId,
    title: blueprint.title,
    practices: blueprint.practices.map((practice, index) =>
      definePractice(practice, `${bucketId}.${index + 1}`),
    ),
  };
}

/** A bare string is a practice with nothing behind it yet. */
function definePractice(blueprint: PracticeBlueprint, id: string): CurriculumPractice {
  return typeof blueprint === 'string'
    ? { id, title: blueprint }
    : { id, title: blueprint.title, activity: blueprint.activity };
}

import type { CurriculumBucket, CurriculumLevel, CurriculumPractice } from './curriculum.types';
import { REGISTERED_LEVELS } from './data';

/**
 * Lookup layer over the curriculum tree.
 *
 * The whole tree is indexed once at module load, so a page can resolve a URL
 * segment in O(1) instead of walking eight levels of nested arrays. This file
 * only *finds* things — anything derived lives in curriculumService.
 */

/** Ids come from the URL, so match them case- and whitespace-insensitively. */
function key(id: string): string {
  return id.trim().toUpperCase();
}

const LEVEL_INDEX = new Map<string, CurriculumLevel>();
const BUCKET_INDEX = new Map<string, CurriculumBucket>();
const PRACTICE_INDEX = new Map<string, CurriculumPractice>();

for (const level of REGISTERED_LEVELS) {
  LEVEL_INDEX.set(key(level.id), level);
  for (const bucket of level.buckets) {
    BUCKET_INDEX.set(key(bucket.id), bucket);
    for (const practice of bucket.practices) {
      PRACTICE_INDEX.set(key(practice.id), practice);
    }
  }
}

export function listLevels(): readonly CurriculumLevel[] {
  return REGISTERED_LEVELS;
}

export function getLevel(id: string | undefined | null): CurriculumLevel | undefined {
  return id ? LEVEL_INDEX.get(key(id)) : undefined;
}

export function getBucket(id: string | undefined | null): CurriculumBucket | undefined {
  return id ? BUCKET_INDEX.get(key(id)) : undefined;
}

export function getPractice(id: string | undefined | null): CurriculumPractice | undefined {
  return id ? PRACTICE_INDEX.get(key(id)) : undefined;
}

/** True when two ids refer to the same node, whatever case the URL used. */
export function sameId(a: string | undefined | null, b: string | undefined | null): boolean {
  return !!a && !!b && key(a) === key(b);
}

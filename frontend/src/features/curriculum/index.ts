export type {
  BucketBlueprint,
  CurriculumBucket,
  CurriculumLevel,
  CurriculumPath,
  CurriculumPractice,
  DrillActivity,
  LevelBlueprint,
  PracticeActivity,
  PracticeBlueprint,
  ReadinessCount,
  TrainerActivity,
} from './curriculum.types';
export { getBucket, getLevel, getPractice, listLevels, sameId } from './curriculumRegistry';
export type { PracticeLocation } from './curriculumService';
export {
  CURRICULUM_ROOT,
  bucketHref,
  bucketNeighbours,
  bucketReadiness,
  curriculumReadiness,
  flattenLevel,
  isPracticeReady,
  levelHref,
  levelNeighbours,
  levelReadiness,
  practiceHref,
  practiceNeighbours,
  resolvePath,
  trainerHref,
} from './curriculumService';
export {
  ProgressProvider,
  bucketPracticeIds,
  levelPracticeIds,
  useProgress,
} from './ProgressContext';

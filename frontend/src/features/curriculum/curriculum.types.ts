/**
 * The curriculum is a three-deep tree: level → bucket → practice.
 *
 * It is pure data. Nothing here imports React, the trainer engine or the
 * lesson ladder — the pages read the tree, and a practice only becomes
 * runnable when someone attaches an `activity` to it.
 */

/**
 * Where a practice sends you once it is built.
 *
 * Two shapes, because practices divide in two: most are a random-item run the
 * existing trainers already do, and the rest need a screen of their own (a hand
 * diagram, a paced cycle). Both are referenced by id, so the data stays pure —
 * wiring a practice up is a data change, not a code change (Open/Closed).
 */
export type PracticeActivity = TrainerActivity | DrillActivity;

/** Runs in a trainer module via its deep link, e.g. /train/notes?preset=… */
export interface TrainerActivity {
  kind: 'trainer';
  /** Trainer module that runs it, e.g. "notes" or "chords". */
  moduleId: string;
  /** Preset id inside that module, e.g. "lesson:01". */
  presetId?: string;
  /** Seconds per item to start the drill at. */
  intervalSeconds?: number;
}

/** Runs a purpose-built screen registered in src/drills. */
export interface DrillActivity {
  kind: 'drill';
  drillId: string;
}

/** A single drill — the leaf of the tree. */
export interface CurriculumPractice {
  /** Canonical code, e.g. "B1.2.3". Also the URL segment. */
  id: string;
  title: string;
  /** How to run it. Absent means "not built yet" and the UI says Coming soon. */
  activity?: PracticeActivity;
}

/** A themed group of practices inside one level, e.g. "Black-Key Geography". */
export interface CurriculumBucket {
  /** Canonical code, e.g. "B1.2". */
  id: string;
  title: string;
  /** Id of the level this bucket belongs to — lets a bucket be resolved alone. */
  levelId: string;
  practices: readonly CurriculumPractice[];
}

/** One rung of the eight-step path, e.g. "Keyboard Geography". */
export interface CurriculumLevel {
  /** Canonical code, e.g. "L1". */
  id: string;
  /** 1-based position in the path. */
  order: number;
  /** Rendered next to the title — cheaper and warmer than an icon per level. */
  emoji: string;
  title: string;
  /** One line on what the level buys you, shown on the level card. */
  summary: string;
  buckets: readonly CurriculumBucket[];
}

/**
 * A validated position in the tree.
 *
 * `bucket` and `practice` are only set when the requested ids exist *and* are
 * actually children of their parent, so a page can render straight from this
 * without re-checking the hierarchy.
 */
export interface CurriculumPath {
  level: CurriculumLevel;
  bucket: CurriculumBucket | null;
  practice: CurriculumPractice | null;
}

/** How much of a level or bucket is playable today. */
export interface ReadinessCount {
  total: number;
  ready: number;
}

/* ---------------- authoring shapes ---------------- */

/**
 * What a data file writes. Ids are derived from position by `defineLevel`, so
 * the codes in the app can never drift out of step with the tree.
 */
/**
 * One practice as written in a data file: a bare title while it is unbuilt,
 * or a title with the activity that runs it.
 */
export type PracticeBlueprint = string | { title: string; activity: PracticeActivity };

export interface BucketBlueprint {
  title: string;
  /** Practices in order — the order fixes their codes. */
  practices: readonly PracticeBlueprint[];
}

export interface LevelBlueprint {
  order: number;
  emoji: string;
  title: string;
  summary: string;
  buckets: readonly BucketBlueprint[];
}

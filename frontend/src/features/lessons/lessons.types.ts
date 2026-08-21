/** Where a lesson sits in the ladder — used to band the list into sections. */
export type LessonGroup = 'Naturals' | 'Sharps' | 'Flats' | 'Chromatic';

/**
 * One rung of the ladder: a small set of notes drilled at four speeds.
 *
 * Lessons are pure data — no TrainerItem, no React. The note module turns
 * `notes` into a preset, and the trainer engine never learns they exist.
 */
export interface Lesson {
  /** Also the preset id in the note module, e.g. "lesson:01". */
  id: string;
  /** 1-based position in the ladder. */
  order: number;
  /** The set as written, e.g. "C♯ D♯". */
  title: string;
  /** Note tokens the module can parse, e.g. ["C#", "D#"]. */
  notes: readonly string[];
  /** Why this set comes here, in terms of the 2–3 black-key pattern. */
  focus: string;
  group: LessonGroup;
}

/** How one lesson is going at one speed. */
export interface DrillProgress {
  /** Cleared the rep target at least once. */
  done: boolean;
  /** Most reps reached in a single run at this speed. */
  bestItems: number;
  /** Best graded accuracy 0 → 1, or null if never run in Test mode. */
  bestAccuracy: number | null;
  attempts: number;
  /** ISO timestamp of the run that first cleared it. */
  completedAt: string | null;
}

/** Roll-up of one lesson across all four speeds. */
export interface LessonStatus {
  lesson: Lesson;
  drills: readonly { seconds: number; progress: DrillProgress }[];
  /** How many of the four speeds are cleared. */
  cleared: number;
  complete: boolean;
  started: boolean;
}

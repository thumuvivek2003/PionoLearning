/**
 * Per-item scoring — what a drill knows about *your* weak spots.
 *
 * The aggregate score on a drill says how you are doing; this says what to do
 * next. Items are tallied under a short key the drill chooses ("F#", "up:B"),
 * so the same weakness is recognised wherever it shows up — every F# on the
 * board counts towards one F#, rather than to 5 unrelated keys.
 *
 * Pure data in, pure numbers out: the ledger is kept by the quiz engine, the
 * draw policy reads the weights, and the UI reads the spots. None of them
 * needs to know how weakness is defined, which is the point of this file.
 */

export interface ItemScore {
  /** The drill's own label for the thing being tested, e.g. "F#". */
  key: string;
  asked: number;
  correct: number;
  /** Mean time to a clean first-try answer, in ms. Null until there is one. */
  averageMs: number | null;
}

export type ScoreBook = ReadonlyMap<string, ItemScore>;

/** Answer time a recognition drill is aiming for. */
export const TARGET_MS = 1500;

/** Weight of an item nobody has been asked about yet — plain average odds. */
const BASELINE = 1;
/** How much a miss counts for, relative to being merely slow. */
const MISS_PULL = 4;
const SLOW_PULL = 1.5;
/** Slowness is capped so one distracted answer cannot own the whole drill. */
const MAX_SLOW = 2;

/**
 * How badly an item needs practice.
 *
 * Never zero: an item you have mastered still has to come round, or the drill
 * stops being a test and becomes a list of your mistakes.
 */
export function weaknessWeight(score: ItemScore | undefined, targetMs = TARGET_MS): number {
  if (!score || score.asked === 0) return BASELINE;

  const missRate = 1 - score.correct / score.asked;
  const slow =
    score.averageMs === null ? 0 : Math.min(MAX_SLOW, Math.max(0, score.averageMs / targetMs - 1));

  return BASELINE + missRate * MISS_PULL + slow * SLOW_PULL;
}

/** Records one answer against an item, returning the updated score. */
export function recordAnswer(
  score: ItemScore | undefined,
  key: string,
  isCorrect: boolean,
  /** Time to answer, or null when it does not count (a corrected miss). */
  elapsedMs: number | null,
): ItemScore {
  const current: ItemScore = score ?? { key, asked: 0, correct: 0, averageMs: null };
  const correct = current.correct + (isCorrect ? 1 : 0);

  return {
    key,
    asked: current.asked + 1,
    correct,
    averageMs:
      isCorrect && elapsedMs !== null
        ? ((current.averageMs ?? 0) * current.correct + elapsedMs) / correct
        : current.averageMs,
  };
}

interface WeakSpotOptions {
  /** How many to report. */
  limit?: number;
  /** Ignore items with too little evidence to be worth naming. */
  minAsked?: number;
  targetMs?: number;
}

/**
 * The items worth working on, worst first.
 *
 * Anything answered right and quickly is left out entirely: a weak-spot list
 * that names everything tells you nothing.
 */
export function weakSpots(
  book: ScoreBook,
  { limit = 3, minAsked = 2, targetMs = TARGET_MS }: WeakSpotOptions = {},
): readonly ItemScore[] {
  return [...book.values()]
    .filter((score) => score.asked >= minAsked)
    .filter((score) => weaknessWeight(score, targetMs) > BASELINE)
    .sort((a, b) => weaknessWeight(b, targetMs) - weaknessWeight(a, targetMs))
    .slice(0, limit);
}

/** Draw weights for a pool, keyed by pool-item id. */
export function drawWeights<T extends { id: string }>(
  pool: readonly T[],
  book: ScoreBook,
  keyOf: (item: T) => string,
  targetMs = TARGET_MS,
): ReadonlyMap<string, number> {
  return new Map(pool.map((item) => [item.id, weaknessWeight(book.get(keyOf(item)), targetMs)]));
}

/** A prompt pinned for repair, and how many clean answers it still owes. */
export interface Repair {
  id: string;
  remaining: number;
}

/**
 * The repair debt after one attempt.
 *
 * A miss pins the prompt for `reps` clean answers; each clean answer pays one
 * off; clearing it releases the prompt. With `reps` of 1 nothing is ever pinned,
 * which is the ordinary "answer it right and move on" loop.
 */
export function nextRepair(
  current: Repair | null,
  questionId: string,
  isCorrect: boolean,
  reps: number,
): Repair | null {
  if (!isCorrect) return reps > 1 ? { id: questionId, remaining: reps } : null;
  if (current?.id !== questionId) return current;

  const remaining = current.remaining - 1;
  return remaining > 0 ? { id: questionId, remaining } : null;
}

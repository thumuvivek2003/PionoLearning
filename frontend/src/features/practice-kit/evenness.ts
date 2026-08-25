/**
 * How steady a run was.
 *
 * Being even is a different question from being on the beat: a run can sit
 * inside the metronome's window and still lurch, and a run with no metronome at
 * all can be perfectly steady. It is the gaps *between* notes that have to
 * match, so that is what gets measured — which makes this an engine concern
 * rather than one bucket's, since the finger work and the rhythm work both ask
 * it.
 */

/** Gaps shorter than this are a double-tap, not a step. */
const MIN_INTERVAL_MS = 40;

export function meanInterval(intervals: readonly number[]): number | null {
  if (intervals.length === 0) return null;
  return intervals.reduce((sum, gap) => sum + gap, 0) / intervals.length;
}

/**
 * 0 → 1, where 1 is a metronome.
 *
 * Scored as 1 − (spread ÷ mean), so it says nothing about tempo: a slow, steady
 * run scores as well as a quick one, which is exactly the order the reference
 * wants them learnt in.
 */
export function evenness(intervals: readonly number[]): number | null {
  const usable = intervals.filter((gap) => gap >= MIN_INTERVAL_MS);
  if (usable.length < 2) return null;

  const mean = meanInterval(usable) as number;
  if (mean <= 0) return null;

  const variance =
    usable.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / usable.length;
  return Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / mean));
}

/** Which step held the run up — the index of the longest gap. */
export function slowestStep(intervals: readonly number[]): number | null {
  if (intervals.length === 0) return null;

  let worst = 0;
  intervals.forEach((gap, index) => {
    if (gap > (intervals[worst] as number)) worst = index;
  });
  return worst;
}

/** Reads a share as a percentage, e.g. "86%". */
export function percent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

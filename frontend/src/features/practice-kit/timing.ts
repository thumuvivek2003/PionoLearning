/**
 * Playing to a beat, and how far off you were.
 *
 * Timing is asked about the same way wherever it comes up — a note is due at a
 * moment, it arrives at another, and the gap between them is the answer. So the
 * beat maths and the tally live with the other engines rather than inside any
 * one bucket: the finger work plays lines against a click, the rhythm work
 * plays durations against one, and both want these numbers to mean the same
 * thing.
 */

/** One beat, in milliseconds. */
export function beatMs(bpm: number): number {
  return (60 / bpm) * 1000;
}

/** Beats of count-in before the first note, so nobody starts cold. */
export const LEAD_IN_BEATS = 4;

/** Inside this, a note counts as on the beat. */
export const ON_BEAT_MS = 90;

export interface TimingTally {
  notes: number;
  onBeat: number;
  /** Sum of |error|, for the mean. */
  totalError: number;
  /** Sum of signed error, for the rush-or-drag reading. */
  signedError: number;
  worst: number;
}

export const EMPTY_TIMING: TimingTally = {
  notes: 0,
  onBeat: 0,
  totalError: 0,
  signedError: 0,
  worst: 0,
};

/** `error` is signed: negative is early, positive is late. */
export function recordTiming(tally: TimingTally, error: number): TimingTally {
  const size = Math.abs(error);

  return {
    notes: tally.notes + 1,
    onBeat: tally.onBeat + (size <= ON_BEAT_MS ? 1 : 0),
    totalError: tally.totalError + size,
    signedError: tally.signedError + error,
    worst: Math.max(tally.worst, size),
  };
}

export function meanTiming(tally: TimingTally): number | null {
  return tally.notes === 0 ? null : tally.totalError / tally.notes;
}

export function onBeatRate(tally: TimingTally): number | null {
  return tally.notes === 0 ? null : tally.onBeat / tally.notes;
}

/** How far ahead of this the drill stops taking a press as the next note. */
const IGNORE_BEFORE_MS = 400;

/** True when a press is close enough to a due note to be that note. */
export function claims(error: number): boolean {
  return error > -IGNORE_BEFORE_MS;
}

/**
 * Which way you lean, once there is enough to tell.
 *
 * Rushing and dragging need different fixes — one is anticipation, the other is
 * usually tension — so a steady lean is worth naming separately from being
 * merely inaccurate.
 */
export function timingBias(tally: TimingTally): string {
  if (tally.notes < 4) return 'settling';

  const lean = tally.signedError / tally.notes;
  if (Math.abs(lean) < ON_BEAT_MS / 2) return 'on the beat';
  return lean < 0 ? 'rushing' : 'dragging';
}

/** Reads an error as words, e.g. "40ms early". */
export function timingNote(error: number): string {
  const size = Math.round(Math.abs(error));
  if (size <= ON_BEAT_MS) return 'on the beat';
  return `${size}ms ${error < 0 ? 'early' : 'late'}`;
}

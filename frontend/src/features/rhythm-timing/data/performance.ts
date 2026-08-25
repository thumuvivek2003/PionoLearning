import { beatMs } from '@/features/practice-kit';

/**
 * Reading a performance rather than a note.
 *
 * Bucket 3.8 asks questions nobody can answer from inside a piece: did it speed
 * up between the start and the end, did it actually stop anywhere, and how long
 * did a mistake cost. Those are all properties of a whole run, so they are
 * measured across one — and then, for the mock contest, turned into the
 * scorecard the reference lays out.
 */

/** A gap longer than this many times the expected one is a stop, not a note. */
const STOP_FACTOR = 2.5;

/** The tempo a stretch of playing implies, from the gaps between its notes. */
export function bpmFromGaps(gaps: readonly number[], beatsPerNote = 1): number | null {
  const usable = gaps.filter((gap) => gap > 0);
  if (usable.length === 0) return null;
  const mean = usable.reduce((sum, gap) => sum + gap, 0) / usable.length;
  return mean <= 0 ? null : (60_000 * beatsPerNote) / mean;
}

export interface Drift {
  /** Tempo over the opening third. */
  start: number | null;
  /** Tempo over the closing third. */
  end: number | null;
  /** End minus start, in BPM. Positive means it sped up. */
  change: number | null;
}

/**
 * Whether the run finished at the tempo it started.
 *
 * Thirds rather than halves, so the middle — where the hard part usually is —
 * does not smear the comparison the reference asks for: beginning, middle,
 * ending.
 */
export function driftOf(gaps: readonly number[], beatsPerNote = 1): Drift {
  if (gaps.length < 6) return { start: null, end: null, change: null };

  const third = Math.floor(gaps.length / 3);
  const start = bpmFromGaps(gaps.slice(0, third), beatsPerNote);
  const end = bpmFromGaps(gaps.slice(-third), beatsPerNote);
  return {
    start,
    end,
    change: start === null || end === null ? null : end - start,
  };
}

/** How a drift reads, in the terms a player would use. */
export function driftNote(change: number | null): string {
  if (change === null) return 'not enough played yet';
  const size = Math.round(Math.abs(change));
  if (size < 2) return 'held the tempo';
  return change > 0 ? `finished ${size} BPM faster` : `finished ${size} BPM slower`;
}

/** Gaps far longer than the music asked for — the run stopping. */
export function countStops(gaps: readonly number[], expectedMs: number): number {
  return gaps.filter((gap) => gap > expectedMs * STOP_FACTOR).length;
}

export interface RunReading {
  /** Signed error of the first note, in ms. */
  entry: number | null;
  /** Signed error of the last note. */
  ending: number | null;
  /** Share of notes inside the on-beat window. */
  accuracy: number | null;
  /** Notes it took to get back inside the window after a miss, worst case. */
  recovery: number | null;
  stops: number;
  drift: Drift;
}

export interface Scorecard {
  startingTempo: number;
  consistency: number;
  accuracy: number;
  recovery: number;
  continuity: number;
  ending: number;
  overall: number;
}

/** Turns a measurement into a mark out of ten, gently rather than harshly. */
function mark(value: number, good: number, bad: number): number {
  if (!Number.isFinite(value)) return 0;
  const share = (bad - Math.min(bad, Math.max(good, value))) / (bad - good);
  return Math.round(share * 10);
}

/**
 * The reference's own scorecard, filled in from what was measured.
 *
 * Only the categories a screen can honestly judge appear here — how you looked
 * and how it felt are yours to add. Each mark is generous at the good end and
 * unforgiving at the bad, because the point is to show which row is lowest, not
 * to hand out a grade.
 */
export function scorecardOf(reading: RunReading, tolerance: number): Scorecard {
  const startingTempo = mark(Math.abs(reading.entry ?? tolerance * 3), tolerance / 2, tolerance * 4);
  const consistency = mark(Math.abs(reading.drift.change ?? 10), 1, 12);
  const accuracy = mark(1 - (reading.accuracy ?? 0), 0.05, 0.6);
  const recovery = mark(reading.recovery ?? 4, 1, 6);
  const continuity = mark(reading.stops, 0, 4);
  const ending = mark(Math.abs(reading.ending ?? tolerance * 3), tolerance / 2, tolerance * 4);

  const rows = [startingTempo, consistency, accuracy, recovery, continuity, ending];
  return {
    startingTempo,
    consistency,
    accuracy,
    recovery,
    continuity,
    ending,
    overall: Math.round(rows.reduce((sum, row) => sum + row, 0) / rows.length),
  };
}

/** The row that needs work — the reference insists on one, not six. */
export function weakestRow(card: Scorecard): string {
  const rows: readonly [string, number][] = [
    ['starting tempo', card.startingTempo],
    ['tempo consistency', card.consistency],
    ['rhythm accuracy', card.accuracy],
    ['recovery from mistakes', card.recovery],
    ['playing without stopping', card.continuity],
    ['ending stability', card.ending],
  ];
  return rows.reduce((worst, row) => (row[1] < worst[1] ? row : worst), rows[0] as [string, number])[0];
}

/** What a bar lasts, for judging whether a gap was a stop. */
export function barMs(bpm: number, beatsPerBar = 4): number {
  return beatMs(bpm) * beatsPerBar;
}

/** What the reference asks you to look for in a recording of a piece. */
export const REVIEW_POINTS: readonly string[] = [
  'Did the tempo hold from the beginning to the end?',
  'Did any section pull ahead — usually the easy one after a hard one?',
  'Were some notes noticeably louder than their neighbours?',
  'Did a mistake take the beat with it, or did the pulse carry on?',
  'Did the phrases sound connected, or like separate presses?',
  'Did the ending arrive where it was meant to?',
];

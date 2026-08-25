import { LEAD_IN_BEATS, beatMs } from '@/features/practice-kit';
import { beatsOf, countLabel } from './noteValues';
import type { NoteValue } from './noteValues';

/**
 * A written rhythm, and when its notes fall.
 *
 * Everything in level 3 is the same shape underneath: a list of durations, some
 * of which are silent, laid over a pulse that does not care either way. Turning
 * that into times is the one calculation the drills share, and a rest occupies
 * the road exactly as a note does — which is the lesson, not an implementation
 * detail.
 */

export interface RhythmEvent {
  value: NoteValue;
  /** A rest fills its length with silence; the beat carries on regardless. */
  rest?: boolean;
  /**
   * White keys above the phrase's first note, for the practices that have a
   * tune. Left out where the drill supplies its own pitch — the rhythm work
   * cares when a note happens, and only sometimes which one.
   */
  step?: number;
}

export interface ScoreEvent {
  index: number;
  value: NoteValue;
  rest: boolean;
  /** When it falls due, in ms from the metronome starting. */
  at: number;
  /** How long it lasts, in ms. */
  lasts: number;
  /** Which beat of the bar it starts on, counting from 0. */
  beat: number;
  /** What to say as it arrives: "1", "&", "3". */
  count: string;
  /** True on the first note of a bar — the accented one. */
  downbeat: boolean;
  /** White keys above the phrase's first note, when the phrase has pitches. */
  step?: number;
}

export interface Score {
  events: readonly ScoreEvent[];
  /** Total length including the count-in, in ms. */
  length: number;
  beatsPerBar: number;
}

/** Lays a written rhythm on the clock. */
export function buildScore(
  events: readonly RhythmEvent[],
  bpm: number,
  beatsPerBar = 4,
): Score {
  const beat = beatMs(bpm);
  const lead = LEAD_IN_BEATS * beat;
  const laid: ScoreEvent[] = [];
  let beats = 0;

  events.forEach((event, index) => {
    const length = beatsOf(event.value);
    laid.push({
      index,
      value: event.value,
      rest: event.rest === true,
      step: event.step,
      at: lead + beats * beat,
      lasts: length * beat,
      beat: beats % beatsPerBar,
      count: countLabel(beats % beatsPerBar, beatsPerBar),
      downbeat: beats % beatsPerBar === 0,
    });
    beats += length;
  });

  return { events: laid, length: lead + beats * beat, beatsPerBar };
}

/** The notes of a score, in order — the ones you actually play. */
export function playable(score: Score): readonly ScoreEvent[] {
  return score.events.filter((event) => !event.rest);
}

/** How many bars a rhythm fills. */
export function barCountOf(events: readonly RhythmEvent[], beatsPerBar = 4): number {
  const beats = events.reduce((sum, event) => sum + beatsOf(event.value), 0);
  return Math.ceil(beats / beatsPerBar);
}

/** True when a rhythm fills whole bars exactly — a written rhythm should. */
export function fillsBars(events: readonly RhythmEvent[], beatsPerBar = 4): boolean {
  const beats = events.reduce((sum, event) => sum + beatsOf(event.value), 0);
  return beats > 0 && Math.abs(beats % beatsPerBar) < 1e-9;
}

/** Held this much of what it was worth: 1 is exact, below 1 is cut short. */
export function heldShare(held: number, owed: number): number {
  return owed <= 0 ? 0 : held / owed;
}

/** Inside this much of the written length, a note counts as held properly. */
export const HOLD_TOLERANCE = 0.2;

/** What the hold did, in words. */
export function holdNote(share: number): string {
  if (Math.abs(share - 1) <= HOLD_TOLERANCE) return 'held for its full value';
  return share < 1
    ? `cut short — ${Math.round(share * 100)}% of its length`
    : `held over — ${Math.round(share * 100)}% of its length`;
}

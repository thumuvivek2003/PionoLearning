import { LEAD_IN_BEATS, beatMs } from '@/features/practice-kit';

/**
 * The rhythms of bucket 2.11.
 *
 * A rhythm is a list of note lengths in beats, cycled over however many notes a
 * line has; the beat maths itself belongs to the practice kit, since the rhythm
 * work in level 3 measures against exactly the same clock.
 */

export type RhythmId = 'quarter' | 'eighth' | 'long-short' | 'short-long';

export interface Rhythm {
  id: RhythmId;
  label: string;
  /** Note lengths in beats, cycled over however many notes there are. */
  beats: readonly number[];
  hint: string;
}

export const RHYTHMS: readonly Rhythm[] = [
  { id: 'quarter', label: 'Quarters', beats: [1], hint: 'One note per click.' },
  { id: 'eighth', label: 'Eighths', beats: [0.5], hint: 'Two notes per click, evenly spaced.' },
  {
    id: 'long-short',
    label: 'Long–short',
    beats: [1.5, 0.5],
    hint: 'LONG-short, LONG-short — same notes, different timing.',
  },
  {
    id: 'short-long',
    label: 'Short–long',
    beats: [0.5, 1.5],
    hint: 'short-LONG, short-LONG — the other way round.',
  },
];

export function getRhythm(id: RhythmId): Rhythm {
  return RHYTHMS.find((rhythm) => rhythm.id === id) ?? (RHYTHMS[0] as Rhythm);
}


/**
 * When each note of a run falls due, in ms from the metronome starting.
 *
 * The count-in is included, which is why this is one function rather than an
 * offset applied later: a note's due time is the only thing the drill compares
 * a press against, and it should be right at the point of use.
 */
export function dueTimes(count: number, rhythm: Rhythm, bpm: number): readonly number[] {
  const beat = beatMs(bpm);
  const times: number[] = [];
  let at = LEAD_IN_BEATS * beat;

  for (let index = 0; index < count; index += 1) {
    times.push(at);
    at += (rhythm.beats[index % rhythm.beats.length] as number) * beat;
  }

  return times;
}

/** How long a run lasts, count-in included. */
export function runLength(count: number, rhythm: Rhythm, bpm: number): number {
  const times = dueTimes(count, rhythm, bpm);
  const last = times[times.length - 1] ?? 0;
  return last + (rhythm.beats[(count - 1) % rhythm.beats.length] ?? 1) * beatMs(bpm);
}

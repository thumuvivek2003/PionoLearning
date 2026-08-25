import type { RhythmEvent } from './score';

/**
 * Things to play: one key, a few keys, and a tune.
 *
 * Bucket 3.7 walks from rhythm with no pitch at all up to a melody, so the
 * material is stored as one shape — notes with a duration and, where it
 * matters, a step above the phrase's first note. A single-key exercise is then
 * just a phrase whose steps are all zero, which is exactly how the reference
 * describes it: the note does not determine the rhythm.
 */

export interface Phrase {
  id: string;
  label: string;
  events: readonly RhythmEvent[];
}

const q = (step: number): RhythmEvent => ({ value: 'quarter', step });
const e = (step: number): RhythmEvent => ({ value: 'eighth', step });
const h = (step: number): RhythmEvent => ({ value: 'half', step });
const qr: RhythmEvent = { value: 'quarter', rest: true };

/** Two bars of the same idea, so a phrase has time to settle. */
const twice = (events: readonly RhythmEvent[]): readonly RhythmEvent[] => [...events, ...events];

const phrase = (id: string, label: string, events: readonly RhythmEvent[]): Phrase => ({
  id,
  label,
  events,
});

/** 3.7.1 — one key, several rhythms. The pitch never moves. */
export const SINGLE_NOTE: readonly Phrase[] = [
  phrase('quarters', 'Quarters', twice([q(0), q(0), q(0), q(0)])),
  phrase('offbeats', 'Offbeats', twice([{ value: 'eighth', rest: true }, e(0), { value: 'eighth', rest: true }, e(0), { value: 'eighth', rest: true }, e(0), { value: 'eighth', rest: true }, e(0)])),
  phrase('rests', 'Note, rest, note, rest', twice([q(0), qr, q(0), qr])),
  phrase('eighths', 'Eighths', twice([e(0), e(0), e(0), e(0), e(0), e(0), e(0), e(0)])),
];

/** 3.7.2 — two keys, so pitch starts moving without the rhythm noticing. */
export const TWO_NOTE: readonly Phrase[] = [
  phrase('alternating', 'C D C D', twice([q(0), q(1), q(0), q(1)])),
  phrase('eighths', 'Eighths, alternating', twice([e(0), e(1), e(0), e(1), e(0), e(1), e(0), e(1)])),
  phrase('gap', 'C - D D', twice([q(0), qr, q(1), q(1)])),
  phrase('late', 'C C - D', twice([q(0), q(0), qr, q(1)])),
];

/** 3.7.3 — three keys, as one small sentence rather than three presses. */
export const THREE_NOTE: readonly Phrase[] = [
  phrase('up-down', 'C D E D', twice([q(0), q(1), q(2), q(1)])),
  phrase('mixed', 'C E D C', twice([q(0), q(2), q(1), q(0)])),
  phrase('doubled', 'C C D E', twice([q(0), q(0), q(1), q(2)])),
  phrase('rest', 'C - D E', twice([q(0), qr, q(1), q(2)])),
];

/** 3.7.4 — four keys: movement and rhythm at the same time. */
export const FOUR_NOTE: readonly Phrase[] = [
  phrase('up', 'C D E F', twice([q(0), q(1), q(2), q(3)])),
  phrase('down', 'F E D C', twice([q(3), q(2), q(1), q(0)])),
  phrase('gap', 'C D - F', twice([q(0), q(1), qr, q(3)])),
  phrase(
    'eighths',
    'C D E F E D C D',
    twice([e(0), e(1), e(2), e(3), e(2), e(1), e(0), e(1)]),
  ),
];

/**
 * 3.7.5 onwards — an actual tune.
 *
 * The reference's own example, which is the opening of a song everybody
 * already knows: the point is that the notes are not the problem, so the only
 * thing left to get wrong is the timing.
 */
export const MELODIES: readonly Phrase[] = [
  phrase('twinkle', 'C C G G A A G', [q(0), q(0), q(4), q(4), q(5), q(5), h(4)]),
  phrase('scale', 'C D E F G F E D', [q(0), q(1), q(2), q(3), q(4), q(3), q(2), q(1)]),
  phrase(
    'mixed',
    'C C G G A G F E',
    [q(0), q(0), q(4), q(4), q(5), q(4), q(3), q(2)],
  ),
];

export const PHRASE_SETS: Readonly<Record<string, readonly Phrase[]>> = {
  single: SINGLE_NOTE,
  two: TWO_NOTE,
  three: THREE_NOTE,
  four: FOUR_NOTE,
  melody: MELODIES,
};

export function phraseSet(id: string): readonly Phrase[] {
  return PHRASE_SETS[id] ?? SINGLE_NOTE;
}

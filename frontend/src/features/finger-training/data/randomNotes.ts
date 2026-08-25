import type { PitchClass } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import type { FingerNumber } from '../finger.types';

/**
 * Drawing notes that cannot be anticipated.
 *
 * Bucket 2.10 is about deciding rather than remembering, so its material has to
 * be generated: a written-out list becomes a pattern the hand learns, which is
 * exactly the dependency the bucket exists to remove. Notes are drawn inside a
 * span around an anchor, because a random note from anywhere on an 88-key board
 * is a different exercise — the point is choosing a finger, not sprinting.
 */

/** Which keys may be drawn. */
export type NoteScope = 'white' | 'all';

export interface DrawOptions {
  length: number;
  scope: NoteScope;
  /** How wide a stretch of board the notes may come from, in semitones. */
  spanSemitones: number;
  /** Require the line to change direction — no accidental scales. */
  turns?: boolean;
  random?: () => number;
}

/** A fixed shape, written as semitones from its own first note. */
export interface ChromaticPattern {
  id: string;
  label: string;
  semitones: readonly number[];
  fingers?: readonly FingerNumber[];
}

function candidates(layout: KeyboardLayout, scope: NoteScope): readonly PianoKey[] {
  return scope === 'all' ? layout.keys : layout.keys.filter((key) => !key.isBlack);
}

/** True when a line only ever goes one way — a scale in disguise. */
export function isMonotonic(keys: readonly PianoKey[]): boolean {
  if (keys.length < 3) return false;
  const steps = keys.slice(1).map((key, index) => key.midi - (keys[index] as PianoKey).midi);
  return steps.every((step) => step > 0) || steps.every((step) => step < 0);
}

/**
 * A run of unpredictable notes inside one stretch of the board.
 *
 * Consecutive repeats are refused — a repeated note asks nothing of the hand —
 * and, when `turns` is set, so is a line that only travels one way, since the
 * bucket's whole complaint about scales is that the next note is guessable.
 */
export function drawNotes(
  layout: KeyboardLayout,
  { length, scope, spanSemitones, turns = false, random = Math.random }: DrawOptions,
): readonly PianoKey[] {
  const pool = candidates(layout, scope);
  if (pool.length === 0 || length <= 0) return [];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const anchor = pool[Math.floor(random() * pool.length)] as PianoKey;
    const within = pool.filter((key) => Math.abs(key.midi - anchor.midi) <= spanSemitones / 2);
    if (within.length < 2) continue;

    const keys: PianoKey[] = [];
    for (let step = 0; step < length; step += 1) {
      const previous = keys[keys.length - 1];
      const options = previous ? within.filter((key) => key.midi !== previous.midi) : within;
      keys.push(options[Math.floor(random() * options.length)] as PianoKey);
    }

    if (!turns || !isMonotonic(keys)) return keys;
  }

  // Nothing satisfied the extra condition; a plain draw still beats no notes.
  return drawNotes(layout, { length, scope, spanSemitones, turns: false, random });
}

/** Places a fixed shape on a start key, or null when it runs off the board. */
export function placeChromatic(
  layout: KeyboardLayout,
  start: PianoKey,
  semitones: readonly number[],
): readonly PianoKey[] | null {
  const keys: PianoKey[] = [];

  for (const offset of semitones) {
    const key = layout.keys.find((entry) => entry.midi === start.midi + offset);
    if (!key) return null;
    keys.push(key);
  }

  return keys;
}

/** Every key a fixed shape can start from, optionally restricted by name. */
export function chromaticStarts(
  layout: KeyboardLayout,
  pattern: ChromaticPattern,
  roots?: readonly PitchClass[],
): readonly PianoKey[] {
  return layout.keys.filter(
    (key) =>
      (roots === undefined || roots.includes(key.pitchClass)) &&
      placeChromatic(layout, key, pattern.semitones) !== null,
  );
}

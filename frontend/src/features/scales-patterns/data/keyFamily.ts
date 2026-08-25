import { LETTER_PITCH_CLASS } from '@/features/music-theory';
import type { Letter, PitchClass } from '@/features/music-theory';
import { scaleShape } from './scaleShapes';
import type { ScaleShape } from './scaleShapes';

/**
 * The twelve major keys as a family rather than a list.
 *
 * Bucket 4.5 is about relationships: keys are not twelve separate things to
 * memorise but one sequence, each adding a single accidental to the one before.
 * That sequence is the only thing written down here — everything else, including
 * which accidentals a key carries, is read off the scale itself so the two can
 * never disagree.
 */

/**
 * The order sharps accumulate: F#, then C#, then G#, and so on.
 *
 * Each is a fifth above the last, which is why the keys accumulate them in this
 * order too — G takes the first, D the first two, A the first three.
 */
export const SHARP_ORDER: readonly string[] = ['F#', 'C#', 'G#', 'D#', 'A#'];

/** Flats accumulate the other way round, in fourths: Bb, Eb, Ab, Db, Gb. */
export const FLAT_ORDER: readonly string[] = ['Bb', 'Eb', 'Ab', 'Db', 'Gb'];

export type AccidentalKind = 'sharp' | 'flat';

export function accidentalOrder(kind: AccidentalKind): readonly string[] {
  return kind === 'sharp' ? SHARP_ORDER : FLAT_ORDER;
}

export interface MajorKey {
  root: string;
  /** How many accidentals it carries. */
  count: number;
  kind: AccidentalKind | 'none';
  shape: ScaleShape;
}

/** Roots in the order the bucket teaches them: up the sharps, then the flats. */
const ROOTS: readonly string[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb', 'Eb', 'Ab', 'Db'];

/**
 * The family, built from the scales themselves.
 *
 * A key's accidental count is a consequence of its spelling, so it is counted
 * rather than declared — which means adding a key is one entry in the list
 * above and nothing else.
 */
export const MAJOR_KEYS: readonly MajorKey[] = ROOTS.flatMap((root) => {
  const shape = scaleShape(root);
  if (!shape) return [];

  const accidentals = shape.notes.filter((note) => note.name.length > 1);
  const kind: MajorKey['kind'] =
    accidentals.length === 0
      ? 'none'
      : (accidentals[0] as { name: string }).name.includes('#')
        ? 'sharp'
        : 'flat';

  return [{ root, count: accidentals.length, kind, shape }];
});

export function majorKey(root: string): MajorKey | undefined {
  return MAJOR_KEYS.find((key) => key.root === root);
}

/** Keys carrying sharps, fewest first — the order they are learnt in. */
export function sharpKeys(): readonly MajorKey[] {
  return MAJOR_KEYS.filter((key) => key.kind === 'sharp').sort((a, b) => a.count - b.count);
}

export function flatKeys(): readonly MajorKey[] {
  return MAJOR_KEYS.filter((key) => key.kind === 'flat').sort((a, b) => a.count - b.count);
}

/**
 * The accidentals a key carries, in the order they accumulate.
 *
 * Accumulation order, not scale order: D major's are F# then C# even though the
 * scale meets C# last. That ordering is the point of the bucket — it makes the
 * final entry the note this key added to the key a fifth below it, and it is
 * how a key signature is written down. The list should always be the first N of
 * the relevant order; the checks assert that rather than trusting it.
 */
export function accidentalsNamed(key: MajorKey): readonly string[] {
  const names = key.shape.notes.flatMap((note) => (note.name.length > 1 ? [note.name] : []));
  if (key.kind === 'none') return [];
  const order = accidentalOrder(key.kind);
  return [...names].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** How a key reads in one line, e.g. "D major — 2 sharps: F#, C#". */
export function keySummary(key: MajorKey): string {
  if (key.kind === 'none') return `${key.root} major — no sharps or flats`;
  const names = accidentalsNamed(key).join(', ');
  return `${key.root} major — ${key.count} ${key.kind}${key.count === 1 ? '' : 's'}: ${names}`;
}

/** Where an accidental sits on the keyboard, e.g. Bb → 10. */
export function accidentalPitch(name: string): PitchClass {
  const letter = LETTER_PITCH_CLASS[name[0] as Letter] ?? 0;
  const shift = name.includes('#') ? 1 : name.includes('b') ? -1 : 0;
  return (((letter + shift) % 12) + 12) % 12 as PitchClass;
}

/** "1st", "2nd", "3rd" — how a position in the order reads in a prompt. */
export function ordinal(position: number): string {
  const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
  return `${position}${suffix}`;
}

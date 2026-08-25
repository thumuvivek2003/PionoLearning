import { scaleShape } from './scaleShapes';
import type { ScaleShape } from './scaleShapes';
import { MAJOR_KEYS } from './keyFamily';

/**
 * The major ↔ relative minor relationship.
 *
 * Bucket 4.6 turns on one fact — a major scale and the minor built on its sixth
 * degree hold the same seven notes — and the whole point is that the fact is a
 * rule rather than a table to learn. So the pairs are derived by applying the
 * rule to every major key, and the reference's table is used to check the
 * result rather than to produce it.
 */

/** The natural minor is built on the sixth degree of its relative major. */
export const RELATIVE_DEGREE = 6;
/** Read the other way, a major scale starts on the minor's third degree. */
export const RELATIVE_MAJOR_DEGREE = 3;

export const MINOR = 'natural-minor';
export const MAJOR = 'major';

/** A key: a root and the scale it builds. Major unless the scale says otherwise. */
export interface KeyRef {
  root: string;
  scale: string;
}

export interface RelativePair {
  major: string;
  minor: string;
  /** Shared by both, since the two scales are the same seven notes. */
  accidentals: number;
}

/** The minor that shares a major key's notes, spelled as that key spells it. */
export function relativeMinorOf(majorRoot: string): string | null {
  const shape = scaleShape(majorRoot, MAJOR);
  return shape?.notes[RELATIVE_DEGREE - 1]?.name ?? null;
}

/** The major that shares a minor key's notes. */
export function relativeMajorOf(minorRoot: string): string | null {
  const shape = scaleShape(minorRoot, MINOR);
  return shape?.notes[RELATIVE_MAJOR_DEGREE - 1]?.name ?? null;
}

/** Every major key in the family with the minor that shares its notes. */
export const RELATIVE_PAIRS: readonly RelativePair[] = MAJOR_KEYS.flatMap((key) => {
  const minor = relativeMinorOf(key.root);
  return minor ? [{ major: key.root, minor, accidentals: key.count }] : [];
});

export function pairOfMajor(majorRoot: string): RelativePair | undefined {
  return RELATIVE_PAIRS.find((pair) => pair.major === majorRoot);
}

/**
 * Whether two scales are built from the same seven notes.
 *
 * Compared as a set of pitch classes, because that is the claim being made —
 * same notes, different home — and it holds however the two are spelled.
 */
export function sameNotes(a: ScaleShape | null, b: ScaleShape | null): boolean {
  if (!a || !b || a.pitchClasses.length !== b.pitchClasses.length) return false;
  const inB = new Set(b.pitchClasses);
  return a.pitchClasses.every((pitch) => inB.has(pitch));
}

/** How a scale reads in a prompt: "G major", "E minor". */
export function scaleName(root: string, scale: string = MAJOR): string {
  return `${root} ${scale === MINOR ? 'minor' : 'major'}`;
}

import type { Letter, PitchClass } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';

/** The two landmark shapes the whole level leans on. */
export type BlackGroup = 'two' | 'three';

export interface BlackKeySpec {
  pitchClass: PitchClass;
  group: BlackGroup;
  /** 1-based position inside its group. */
  indexInGroup: number;
  /** e.g. "C#". */
  sharpName: string;
  /** e.g. "Db" — the same physical key under its other name. */
  flatName: string;
  /** e.g. "1st of 2" — where it sits, with no note name attached. */
  positionLabel: string;
}

/**
 * The five black keys, described by where they sit rather than by pitch.
 *
 * The bucket's whole point is that a black key is found by its place in a group
 * of two or three, so the group and the index come first and the names hang off
 * them — not the other way round.
 */
export const BLACK_KEYS: readonly BlackKeySpec[] = [
  { pitchClass: 1, group: 'two', indexInGroup: 1, sharpName: 'C#', flatName: 'Db', positionLabel: '1st of 2' },
  { pitchClass: 3, group: 'two', indexInGroup: 2, sharpName: 'D#', flatName: 'Eb', positionLabel: '2nd of 2' },
  { pitchClass: 6, group: 'three', indexInGroup: 1, sharpName: 'F#', flatName: 'Gb', positionLabel: '1st of 3' },
  { pitchClass: 8, group: 'three', indexInGroup: 2, sharpName: 'G#', flatName: 'Ab', positionLabel: '2nd of 3' },
  { pitchClass: 10, group: 'three', indexInGroup: 3, sharpName: 'A#', flatName: 'Bb', positionLabel: '3rd of 3' },
];

const BY_PITCH_CLASS: ReadonlyMap<number, BlackKeySpec> = new Map(
  BLACK_KEYS.map((spec) => [spec.pitchClass, spec]),
);

export function blackKeySpec(pitchClass: number): BlackKeySpec | undefined {
  return BY_PITCH_CLASS.get(pitchClass);
}

export function groupSize(group: BlackGroup): 2 | 3 {
  return group === 'two' ? 2 : 3;
}

export function groupLabel(group: BlackGroup): string {
  return group === 'two' ? 'group of 2' : 'group of 3';
}

/**
 * Identity of one physical group on the board.
 *
 * Two black keys in the same octave belong to the same pair, so the octave plus
 * the shape is enough to tell "that pair" from "the next pair up".
 */
export function groupIdOf(key: PianoKey): string | null {
  const spec = blackKeySpec(key.pitchClass);
  return spec ? `${key.octave}:${spec.group}` : null;
}

export interface KeyGroup {
  id: string;
  group: BlackGroup;
  /** The keys of the group, left to right. */
  keys: readonly PianoKey[];
}

/**
 * Every complete black-key group on a layout.
 *
 * Partial groups at the edges of a short keyboard are dropped: half a pair is
 * not a landmark, and asking about one would teach the wrong shape.
 */
export function blackGroups(layout: KeyboardLayout): readonly KeyGroup[] {
  const buckets = new Map<string, PianoKey[]>();

  for (const key of layout.keys) {
    const id = groupIdOf(key);
    if (!id) continue;
    const bucket = buckets.get(id);
    if (bucket) bucket.push(key);
    else buckets.set(id, [key]);
  }

  return [...buckets.entries()]
    .map(([id, keys]) => {
      const group = keys[0] ? (blackKeySpec(keys[0].pitchClass)?.group as BlackGroup) : 'two';
      return {
        id,
        group,
        keys: [...keys].sort((a, b) => a.midi - b.midi),
      };
    })
    .filter((entry) => entry.keys.length === groupSize(entry.group))
    .sort((a, b) => (a.keys[0]?.midi ?? 0) - (b.keys[0]?.midi ?? 0));
}

/** How a white key is found from the black-key groups. */
export interface LandmarkRule {
  letter: Letter;
  group: BlackGroup;
  /** Read as a prompt on its own, e.g. "Left of the group of 2". */
  where: string;
  /** The same thing said in full, for the guidance panel. */
  detail: string;
}

/**
 * The seven rules this bucket exists to install.
 *
 * Every white key is described only in terms of the two landmarks — never as
 * "the third white key from C", which is the counting habit being replaced.
 */
export const LANDMARK_RULES: Readonly<Record<Letter, LandmarkRule>> = {
  C: {
    letter: 'C',
    group: 'two',
    where: 'Left of the group of 2',
    detail: 'C is the white key immediately left of a group of 2 black keys.',
  },
  D: {
    letter: 'D',
    group: 'two',
    where: 'Between the group of 2',
    detail: 'D is the white key between the 2 black keys.',
  },
  E: {
    letter: 'E',
    group: 'two',
    where: 'Right of the group of 2',
    detail: 'E is the white key immediately right of a group of 2 black keys.',
  },
  F: {
    letter: 'F',
    group: 'three',
    where: 'Left of the group of 3',
    detail: 'F is the white key immediately left of a group of 3 black keys.',
  },
  G: {
    letter: 'G',
    group: 'three',
    where: 'Between black 1 and 2 of the group of 3',
    detail: 'G is the white key between the 1st and 2nd black keys of a group of 3.',
  },
  A: {
    letter: 'A',
    group: 'three',
    where: 'Between black 2 and 3 of the group of 3',
    detail: 'A is the white key between the 2nd and 3rd black keys of a group of 3.',
  },
  B: {
    letter: 'B',
    group: 'three',
    where: 'Right of the group of 3',
    detail: 'B is the white key immediately right of a group of 3 black keys.',
  },
};

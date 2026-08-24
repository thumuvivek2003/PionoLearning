import { SEMITONES_PER_OCTAVE } from '@/features/music-theory';
import type { Letter } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';

/**
 * Octave arithmetic on a real board.
 *
 * Bucket 1.3 rests on one fact — the same letter comes back every twelve keys —
 * so everything here is phrased as "the same letter, N octaves away", and the
 * layout is what decides whether that key actually exists. Nothing in here
 * knows about drills: the screens ask questions of the board, not of each other.
 */

/** Every white key with this letter, low to high. */
export function keysOfLetter(layout: KeyboardLayout, letter: Letter): readonly PianoKey[] {
  return layout.keys.filter((key) => !key.isBlack && key.sharpName === letter);
}

/** The key `octaves` away, or undefined when the board runs out first. */
export function octaveKey(
  layout: KeyboardLayout,
  midi: number,
  octaves: number,
): PianoKey | undefined {
  const target = midi + octaves * SEMITONES_PER_OCTAVE;
  return layout.keys.find((key) => key.midi === target);
}

/** Octave numbers the board touches, low to high. */
export function octavesOf(layout: KeyboardLayout): readonly number[] {
  return [...new Set(layout.keys.map((key) => key.octave))].sort((a, b) => a - b);
}

/**
 * Letters that appear more than once on this board.
 *
 * A letter with a single key has no octaves to travel between, so asking for
 * one would be a drill with nowhere to go — short boards drop out here.
 */
export function repeatedLetters(
  layout: KeyboardLayout,
  letters: readonly Letter[],
): readonly Letter[] {
  return letters.filter((letter) => keysOfLetter(layout, letter).length > 1);
}

/** Scientific name of a key, e.g. "C4" — how every octave drill labels one. */
export function keyLabel(key: Pick<PianoKey, 'sharpName' | 'octave'>): string {
  return `${key.sharpName}${key.octave}`;
}

export interface BoardRegion {
  id: 'low' | 'middle' | 'high';
  label: string;
  /** Octave numbers this region covers, low to high. */
  octaves: readonly number[];
}

const REGION_IDS: readonly BoardRegion['id'][] = ['low', 'middle', 'high'];
const REGION_LABELS: Readonly<Record<BoardRegion['id'], string>> = {
  low: 'Low',
  middle: 'Middle',
  high: 'High',
};

/**
 * The board split into low, middle and high thirds.
 *
 * Landmark recognition is only real if it survives moving around: a drill that
 * says "find a C" lets you keep answering in the octave you are looking at,
 * where one that says "find a C in the high third" does not. The split follows
 * whatever board is on screen, so it stays meaningful on 25 keys and on 61.
 */
export function boardRegions(layout: KeyboardLayout): readonly BoardRegion[] {
  const octaves = octavesOf(layout);
  const size = Math.ceil(octaves.length / REGION_IDS.length);

  return REGION_IDS.map((id, index) => ({
    id,
    label: REGION_LABELS[id],
    octaves: octaves.slice(index * size, (index + 1) * size),
  })).filter((region) => region.octaves.length > 0);
}

/** Which third of the board an octave falls in, if any. */
export function regionOf(
  regions: readonly BoardRegion[],
  octave: number,
): BoardRegion | undefined {
  return regions.find((region) => region.octaves.includes(octave));
}

/** Reads a region's span, e.g. "octaves 5–6". */
export function regionSpan(region: BoardRegion): string {
  const first = region.octaves[0];
  const last = region.octaves[region.octaves.length - 1];
  return first === last ? `octave ${first}` : `octaves ${first}–${last}`;
}

/** Reads a jump out loud, e.g. "One octave up". */
export function jumpLabel(octaves: number): string {
  const size = Math.abs(octaves) === 1 ? 'One octave' : `${Math.abs(octaves)} octaves`;
  return `${size} ${octaves > 0 ? 'up' : 'down'}`;
}

/**
 * The reminder bucket 1.3 leans on.
 *
 * Both halves matter: an octave is a distance you can see (7 white keys, 12 in
 * all), and the number changes at C rather than at A.
 */
export const OCTAVE_HINT =
  'An octave is the same letter again — 7 white keys up, 12 keys in all · the number changes at every C, so B3 is followed by C4.';

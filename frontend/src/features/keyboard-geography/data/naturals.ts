import { LETTERS } from '@/features/music-theory';
import type { Letter } from '@/features/music-theory';

/** C D E F G A B — the seven naturals in keyboard order. */
export const NATURALS: readonly Letter[] = LETTERS;

export function letterIndex(letter: Letter): number {
  return NATURALS.indexOf(letter);
}

/**
 * Move `steps` white keys from `letter`, wrapping at both ends.
 *
 * The wrap is the point of several drills: B's right neighbour is C, and C's
 * left neighbour is B. The alphabet is a circle, not a line.
 */
export function stepLetter(letter: Letter, steps: number): Letter {
  const size = NATURALS.length;
  const index = (((letterIndex(letter) + steps) % size) + size) % size;
  return NATURALS[index] as Letter;
}

/** The run of seven starting from `letter`, in either direction. */
export function runFrom(letter: Letter, ascending: boolean): readonly Letter[] {
  return NATURALS.map((_, index) => stepLetter(letter, ascending ? index : -index));
}

export function randomLetter(exclude?: Letter): Letter {
  const pool = exclude ? NATURALS.filter((letter) => letter !== exclude) : NATURALS;
  return pool[Math.floor(Math.random() * pool.length)] as Letter;
}

/**
 * The two landmarks the whole bucket leans on.
 *
 * Shown as a reminder in the recognition drills, because the pass condition is
 * "found it from the black-key groups", not "counted up from C".
 */
export const LANDMARK_HINT =
  'C sits left of the group of 2 black keys · F sits left of the group of 3.';

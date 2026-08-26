import { LETTERS, LETTER_PITCH_CLASS, toMidi } from '@/features/music-theory';
import type { Letter } from '@/features/music-theory';
import type { Clef, StaffNote, Step } from '../reading.types';

/**
 * The staff as a map, and the clefs that decode it.
 *
 * Everything here counts in diatonic steps from the bottom line, because that
 * is the one number that means something to all of it: the geometry turns it
 * into a y position, a clef turns it into a note, and the reverse lookups turn
 * a note back into a place. Nothing stores a table of "line 3 is B" — that
 * falls out of the clef, which is exactly what 6.1.6 says a clef is for.
 */

export const LINES = 5;
export const SPACES = 4;
/** Steps the staff itself covers: 0 (bottom line) to 8 (top line). */
export const TOP_STEP = (LINES - 1) * 2;

/** A letter and octave as one number, so steps are simple arithmetic. */
function diatonic(letter: Letter, octave: number): number {
  return octave * LETTERS.length + LETTERS.indexOf(letter);
}

/**
 * What each clef puts on its bottom line.
 *
 * Treble starts on E4 and bass on G2, which is the only fact either clef
 * contributes; every other note on the staff follows from counting.
 */
const BOTTOM: Readonly<Record<Clef, number>> = {
  treble: diatonic('E', 4),
  bass: diatonic('G', 2),
};

/**
 * The line each clef is named for and curls around.
 *
 * The treble clef is a G clef: its curl circles line 2, which is therefore G.
 * The bass clef is an F clef: its two dots straddle line 4, which is F. This is
 * 6.2.1's actual content — the symbol is a pointer, not a decoration.
 */
export const ANCHOR: Readonly<Record<Clef, { step: Step; letter: Letter; name: string }>> = {
  treble: { step: 2, letter: 'G', name: 'G clef' },
  bass: { step: 6, letter: 'F', name: 'F clef' },
};

export const CLEFS: readonly Clef[] = ['treble', 'bass'];

/** How a clef is written down, for prompts and labels. */
export function clefName(clef: Clef): string {
  return clef === 'treble' ? 'treble' : 'bass';
}

/** True when a step lands on a line rather than in a space. */
export function isLine(step: Step): boolean {
  return ((step % 2) + 2) % 2 === 0;
}

/** Line 1–5 or space 1–4 for a step inside the staff, or null outside it. */
export function placeOf(step: Step): number | null {
  if (step < 0 || step > TOP_STEP) return null;
  return isLine(step) ? step / 2 + 1 : (step - 1) / 2 + 1;
}

/** "line 3" or "space 2" — how a position reads in a prompt. */
export function placeLabel(step: Step): string {
  const place = placeOf(step);
  if (place === null) return isLine(step) ? 'a ledger line' : 'off the staff';
  return `${isLine(step) ? 'line' : 'space'} ${place}`;
}

/** The step of a numbered line, counting from the bottom. */
export function lineStep(line: number): Step {
  return (line - 1) * 2;
}

/** The step of a numbered space. */
export function spaceStep(space: number): Step {
  return (space - 1) * 2 + 1;
}

/**
 * How many ledger lines a note needs.
 *
 * A note two steps above the top line sits *on* the first ledger; one step
 * above hangs in the space just past the staff and needs none. Counting them
 * here rather than in the renderer keeps the drawing free of music theory.
 */
export function ledgersFor(step: Step): { count: number; below: boolean } {
  if (step > TOP_STEP) return { count: Math.floor((step - TOP_STEP) / 2), below: false };
  if (step < 0) return { count: Math.floor(-step / 2), below: true };
  return { count: 0, below: false };
}

/** The note a clef puts at a given step. */
export function noteAt(clef: Clef, step: Step): StaffNote {
  const index = BOTTOM[clef] + step;
  const letters = LETTERS.length;
  const letter = LETTERS[((index % letters) + letters) % letters] as Letter;
  const octave = Math.floor(index / letters);
  const pitchClass = LETTER_PITCH_CLASS[letter];
  const ledgers = ledgersFor(step);

  return {
    step,
    letter,
    octave,
    name: `${letter}${octave}`,
    pitchClass,
    midi: toMidi(pitchClass, octave),
    onLine: isLine(step),
    place: placeOf(step),
    ledgers: ledgers.count,
    ledgerBelow: ledgers.below,
  };
}

/** Where a clef puts a named note, or null when that note is not reachable. */
export function stepOf(clef: Clef, letter: Letter, octave: number): Step {
  return diatonic(letter, octave) - BOTTOM[clef];
}

/** Middle C, which is the note both clefs meet at. */
export const MIDDLE_C_OCTAVE = 4;

export function middleCStep(clef: Clef): Step {
  return stepOf(clef, 'C', MIDDLE_C_OCTAVE);
}

/** The notes of a clef's five lines, bottom to top. */
export function lineNotes(clef: Clef): readonly StaffNote[] {
  return Array.from({ length: LINES }, (_entry, index) => noteAt(clef, lineStep(index + 1)));
}

/** The notes of a clef's four spaces, bottom to top. */
export function spaceNotes(clef: Clef): readonly StaffNote[] {
  return Array.from({ length: SPACES }, (_entry, index) => noteAt(clef, spaceStep(index + 1)));
}

/** "E G B D F" — the line letters, which is what a mnemonic spells. */
export function lineLetters(clef: Clef): string {
  return lineNotes(clef)
    .map((note) => note.letter)
    .join(' ');
}

export function spaceLetters(clef: Clef): string {
  return spaceNotes(clef)
    .map((note) => note.letter)
    .join(' ');
}

/** The mnemonics the reference gives, kept beside the letters they spell. */
export const MNEMONICS: Readonly<Record<Clef, { lines: string; spaces: string }>> = {
  treble: { lines: 'Every Good Boy Does Fine', spaces: 'FACE' },
  bass: { lines: 'Good Boys Do Fine Always', spaces: 'All Cows Eat Grass' },
};

/** Steps a practice may draw, from the staff and a little way past it. */
export function stepRange(from: Step, to: Step): readonly Step[] {
  return Array.from({ length: to - from + 1 }, (_entry, index) => from + index);
}

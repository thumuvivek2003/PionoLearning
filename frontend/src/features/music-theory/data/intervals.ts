/**
 * Generic interval names.
 *
 * Counted by letter distance, not by semitones: C→G and D→A are both 5ths even
 * though one spans seven semitones and the other seven as well — but C→F# would
 * still be called a 4th here. Quality (major, minor, diminished) arrives with
 * the scale work in level 4; until then the size is the whole story, and it is
 * the size that a hand actually feels.
 */
const GENERIC_INTERVALS: readonly string[] = [
  'Unison',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  'Octave',
];

/** What a span of white-key steps is called, e.g. 2 → "3rd". */
export function intervalName(steps: number): string {
  const size = Math.abs(steps);
  return GENERIC_INTERVALS[size] ?? `${size + 1}th`;
}

/** How many white-key steps an interval spans, e.g. "4th" → 3. */
export function intervalSteps(name: string): number | null {
  const index = GENERIC_INTERVALS.indexOf(name);
  return index === -1 ? null : index;
}

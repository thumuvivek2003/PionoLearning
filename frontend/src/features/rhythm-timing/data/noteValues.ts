/**
 * How much of the clock a note takes up.
 *
 * The reference's picture is a road with fixed markings: the beats are the
 * markings and a note occupies some length of road. So a value is defined by
 * one number — how many beats it lasts — and everything else about it, its
 * counting syllables and how it is drawn, follows from that.
 */
export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';

export interface ValueSpec {
  id: NoteValue;
  label: string;
  /** Length in beats. */
  beats: number;
  /** How the beat is counted when a bar is filled with these. */
  count: string;
}

export const VALUES: readonly ValueSpec[] = [
  { id: 'whole', label: 'Whole', beats: 4, count: '1 2 3 4' },
  { id: 'half', label: 'Half', beats: 2, count: '1 2' },
  { id: 'quarter', label: 'Quarter', beats: 1, count: '1' },
  { id: 'eighth', label: 'Eighth', beats: 0.5, count: '1 &' },
  { id: 'sixteenth', label: 'Sixteenth', beats: 0.25, count: '1 e & a' },
];

const BY_ID: ReadonlyMap<NoteValue, ValueSpec> = new Map(VALUES.map((spec) => [spec.id, spec]));

export function valueSpec(value: NoteValue): ValueSpec {
  return BY_ID.get(value) ?? (VALUES[2] as ValueSpec);
}

export function beatsOf(value: NoteValue): number {
  return valueSpec(value).beats;
}

/** The syllables of one beat at a given subdivision: 1, 1 &, 1 e & a. */
const SYLLABLES: readonly string[] = ['1', 'e', '&', 'a'];

/**
 * What to say on a note, given where in the beat it falls.
 *
 * Counting is the whole vocabulary of this level — "one ee and a" is how a
 * sixteenth is found — so the drill says it rather than leaving you to work it
 * out from a number of milliseconds.
 */
export function countLabel(beatPosition: number, beatsPerBar: number): string {
  const beat = Math.floor(beatPosition) % beatsPerBar;
  const within = beatPosition - Math.floor(beatPosition);
  const sixteenth = Math.round(within * 4);
  return sixteenth === 0 ? String(beat + 1) : (SYLLABLES[sixteenth] as string);
}

/** Every counting syllable of a bar at a given subdivision. */
export function barCount(beatsPerBar: number, per: 1 | 2 | 4): readonly string[] {
  const labels: string[] = [];
  for (let beat = 0; beat < beatsPerBar; beat += 1) {
    for (let part = 0; part < per; part += 1) {
      labels.push(countLabel(beat + part / per, beatsPerBar));
    }
  }
  return labels;
}

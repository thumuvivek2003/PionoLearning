import { SEMITONES_PER_OCTAVE } from '@/features/music-theory';
import type { SpelledNote } from '@/features/music-theory';
import { VOICING_ANCHOR_MIDI } from '@/features/piano';
import type { ChordForm, Inversion, Voicing } from '../chords.types';

/**
 * Chord positions, and the movement between them.
 *
 * An inversion is not a new chord — it is the same notes in a different order —
 * so nothing here builds chords. It takes a form and rotates it, which is
 * exactly what the reference's mental model says: root position is 1-3-5, first
 * inversion is 3-5-1, second is 5-1-3. Rotation is the whole idea, and it works
 * for a seventh chord's four positions without another rule.
 */

export const INVERSIONS: readonly Inversion[] = [0, 1, 2, 3];

const NAMES: readonly string[] = [
  'root position',
  '1st inversion',
  '2nd inversion',
  '3rd inversion',
];

export function inversionName(inversion: Inversion): string {
  return NAMES[inversion] ?? `inversion ${inversion}`;
}

/** Short form for a strip or a score label: "root", "1st", "2nd". */
export function inversionShort(inversion: Inversion): string {
  return inversion === 0 ? 'root' : `${inversion}${['st', 'nd', 'rd'][inversion - 1] ?? 'th'}`;
}

/** How many positions a chord has — three for a triad, four for a seventh. */
export function positionsOf(form: ChordForm): readonly Inversion[] {
  return INVERSIONS.slice(0, form.tones) as readonly Inversion[];
}

/** The inversions of a chord that a practice may ask for. */
export function playable(form: ChordForm, wanted: readonly Inversion[]): readonly Inversion[] {
  const available = positionsOf(form);
  return wanted.filter((entry) => available.includes(entry));
}

/** Rotate a list so it begins at `by`, keeping the cycle intact. */
function rotate<T>(items: readonly T[], by: number): readonly T[] {
  if (items.length === 0) return items;
  const at = ((by % items.length) + items.length) % items.length;
  return [...items.slice(at), ...items.slice(0, at)];
}

/**
 * A chord in one position, voiced as rising keys from an anchor.
 *
 * Voiced here rather than by the shared voicing helper because an inversion has
 * to start on a *particular* note — the point of 5-1-3 is that the fifth is at
 * the bottom — while the shared helper always stacks from the root upward.
 */
export function voicingOf(
  form: ChordForm,
  inversion: Inversion,
  anchorMidi: number = VOICING_ANCHOR_MIDI,
): Voicing {
  const notes = rotate(form.notes, inversion);
  const degrees = rotate(form.degrees, inversion);
  const pitches = rotate(form.pitchClasses, inversion);

  const midis: number[] = [];
  let floor = anchorMidi - 1;
  for (const pitch of pitches) {
    const offset = ((pitch - (anchorMidi % SEMITONES_PER_OCTAVE)) % SEMITONES_PER_OCTAVE +
      SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
    let midi = anchorMidi + offset;
    while (midi <= floor) midi += SEMITONES_PER_OCTAVE;
    midis.push(midi);
    floor = midi;
  }

  return { form, inversion, midis, notes, degrees };
}

/** "3 - 5 - 1" — the degree pattern this position sounds. */
export function patternOf(form: ChordForm, inversion: Inversion): string {
  return voicingOf(form, inversion).degrees.join(' - ');
}

/** The note at the bottom, which is what names the inversion. */
export function bassOf(form: ChordForm, inversion: Inversion): SpelledNote | undefined {
  return voicingOf(form, inversion).notes[0];
}

/**
 * Which inversion a voicing is in, read from its lowest note.
 *
 * The recognition practices need this the other way round: given the keys, say
 * the position. Returns null when the notes are not this chord at all.
 */
export function inversionFrom(form: ChordForm, midis: readonly number[]): Inversion | null {
  const lowest = midis[0];
  if (lowest === undefined) return null;
  const at = form.pitchClasses.indexOf((lowest % SEMITONES_PER_OCTAVE) as never);
  return at === -1 ? null : (at as Inversion);
}

export interface Move {
  inversion: Inversion;
  midis: readonly number[];
  /** Total semitones every finger has to travel to get here. */
  distance: number;
}

/**
 * How far the hand moves from one shape to each position of the next chord.
 *
 * This is 5.4.9, and it is the only calculation in the bucket that is not a
 * lookup. Distance is summed per voice against the nearest note of the target
 * — that is what voice leading means, and it is why C-E-G goes to B-D-G rather
 * than G-B-D: the same chord, a third of the movement.
 */
export function movesFrom(
  from: readonly number[],
  form: ChordForm,
  wanted: readonly Inversion[] = INVERSIONS,
): readonly Move[] {
  const anchor = from[0] ?? VOICING_ANCHOR_MIDI;

  return playable(form, wanted)
    .map((inversion) => {
      // Voiced around where the hand already is, not from a fixed middle C, or
      // "closest" would just mean "nearest to the anchor".
      const options = [-SEMITONES_PER_OCTAVE, 0, SEMITONES_PER_OCTAVE].map((shift) =>
        voicingOf(form, inversion, anchor + shift).midis,
      );

      let best = options[0] ?? [];
      let least = Infinity;
      for (const midis of options) {
        const distance = travel(from, midis);
        if (distance < least) {
          least = distance;
          best = midis;
        }
      }
      return { inversion, midis: best, distance: least };
    })
    .sort((a, b) => a.distance - b.distance || a.inversion - b.inversion);
}

/** Total movement between two shapes, each voice to its nearest target note. */
export function travel(from: readonly number[], to: readonly number[]): number {
  if (from.length === 0 || to.length === 0) return 0;
  return from.reduce((sum, midi) => {
    const nearest = to.reduce(
      (best, target) => Math.min(best, Math.abs(target - midi)),
      Infinity,
    );
    return sum + nearest;
  }, 0);
}

/** The closest position of a chord to where the hand already is. */
export function nearestMove(
  from: readonly number[],
  form: ChordForm,
  wanted: readonly Inversion[] = INVERSIONS,
): Move | undefined {
  return movesFrom(from, form, wanted)[0];
}

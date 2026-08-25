import { buildScaleFrom, toMidi } from '@/features/music-theory';
import type { PitchClass, Scale, SpelledNote } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import type { FingerNumber, Hand } from '@/features/finger-training';
import { stepsOf } from './steps';
import type { Step } from './steps';

/**
 * A scale as something you can put your hands on.
 *
 * The notes and their spelling come from music-theory, which already knows that
 * G major has an F# and not a Gb. What this adds is everything physical: where
 * the notes sit on a board, which finger takes each one, and where the thumb
 * has to cross — the part that turns a scale from a fact into something played.
 */

export interface ScaleShape {
  id: string;
  /** Root as it is written, e.g. "C" or "F#". */
  root: string;
  label: string;
  scale: Scale;
  /** Ascending pitch classes, root first. */
  pitchClasses: readonly PitchClass[];
  /** How the notes are spelled, root first. */
  notes: readonly SpelledNote[];
  steps: readonly Step[];
}

/** Builds a shape, or null when the root cannot be spelled. */
export function scaleShape(root: string, typeId = 'major'): ScaleShape | null {
  const scale = buildScaleFrom(root, typeId);
  if (!scale) return null;

  return {
    id: `${root}-${typeId}`,
    root,
    label: `${scale.root.name} ${scale.type.short}`,
    scale,
    pitchClasses: scale.notes.map((note) => note.pitchClass),
    notes: scale.notes,
    steps: stepsOf(scale.type.intervals),
  };
}

/**
 * The scale laid out from a starting key, one octave, root to root.
 *
 * Eight notes rather than seven: a scale that stops on the seventh has not
 * arrived anywhere, and the octave is where the fingering resolves.
 */
export function scaleMidis(shape: ScaleShape, rootMidi: number): readonly number[] {
  const octave = 12;
  return [...shape.scale.type.intervals.map((interval) => rootMidi + interval), rootMidi + octave];
}

/** The same, resolved to keys on a given board. */
export function scaleKeys(
  layout: KeyboardLayout,
  shape: ScaleShape,
  rootMidi: number,
): readonly PianoKey[] {
  const wanted = scaleMidis(shape, rootMidi);
  return wanted.flatMap((midi) => {
    const key = layout.keys.find((entry) => entry.midi === midi);
    return key ? [key] : [];
  });
}

/** Every octave of the root a board can start a full scale from. */
export function scaleStarts(layout: KeyboardLayout, shape: ScaleShape): readonly PianoKey[] {
  const root = shape.pitchClasses[0];
  return layout.keys.filter(
    (key) => key.pitchClass === root && scaleKeys(layout, shape, key.midi).length === 8,
  );
}

/** A comfortable middle-of-the-board root, for a drill that just needs one. */
export function middleStart(layout: KeyboardLayout, shape: ScaleShape): PianoKey | undefined {
  const starts = scaleStarts(layout, shape);
  return starts[Math.floor(starts.length / 2)] ?? starts[0];
}

/**
 * Standard fingerings, ascending, root to octave.
 *
 * Most keys share one shape — the thumb turns under after the third finger, and
 * the little finger takes the octave — which is why they are the ones every
 * method teaches first. F is the exception and is written out separately: its
 * right hand runs 1-2-3-4 twice, because the fourth finger has to take the Bb
 * and the thumb follows it. A fingering is a fact about a key, so it is stored
 * per key rather than assumed.
 */
export const SCALE_FINGERINGS: Readonly<Record<string, Readonly<Record<Hand, readonly FingerNumber[]>>>> = {
  C: { right: [1, 2, 3, 1, 2, 3, 4, 5], left: [5, 4, 3, 2, 1, 3, 2, 1] },
  G: { right: [1, 2, 3, 1, 2, 3, 4, 5], left: [5, 4, 3, 2, 1, 3, 2, 1] },
  D: { right: [1, 2, 3, 1, 2, 3, 4, 5], left: [5, 4, 3, 2, 1, 3, 2, 1] },
  A: { right: [1, 2, 3, 1, 2, 3, 4, 5], left: [5, 4, 3, 2, 1, 3, 2, 1] },
  E: { right: [1, 2, 3, 1, 2, 3, 4, 5], left: [5, 4, 3, 2, 1, 3, 2, 1] },
  // The fourth finger takes Bb, so the thumb turns under after it rather than
  // after the third — the one early scale that does not follow the pattern.
  F: { right: [1, 2, 3, 4, 1, 2, 3, 4], left: [5, 4, 3, 2, 1, 3, 2, 1] },
};

/** The fingering for a hand, ascending; descending is its reverse. */
export function fingeringFor(root: string, hand: Hand): readonly FingerNumber[] {
  return SCALE_FINGERINGS[root]?.[hand] ?? SCALE_FINGERINGS['C']![hand];
}

/**
 * Where the hand crosses, by index into the ascending run.
 *
 * The two hands cross at different moments and in opposite ways, which is the
 * thing beginners are surprised by. Going up, the right hand's thumb turns
 * *under* — so the crossing is where the thumb lands. The left hand's thumb is
 * already there and a longer finger comes *over* it — so the crossing is the
 * note after the thumb, not the thumb itself.
 */
export function crossingsIn(
  fingering: readonly FingerNumber[],
  hand: Hand,
): readonly number[] {
  return fingering.flatMap((finger, index) => {
    if (index === 0) return [];
    const previous = fingering[index - 1] as FingerNumber;
    const crosses = hand === 'right' ? finger === 1 && previous > 1 : previous === 1 && finger > 1;
    return crosses ? [index] : [];
  });
}

/** Which degree a position in the run is, counting from 1. */
export function degreeAt(index: number): number {
  return (index % 7) + 1;
}

/**
 * The accidentals a scale needs, in the order they appear.
 *
 * Read off the spelling rather than stored, so "G major has one sharp" is a
 * consequence of how G major is spelled instead of a second fact that could
 * disagree with the first.
 */
export function accidentalsOf(shape: ScaleShape): readonly SpelledNote[] {
  return shape.notes.filter((note) => note.name.length > 1);
}

/** How a key signature reads, e.g. "one sharp — F#" or "no sharps or flats". */
export function signatureOf(shape: ScaleShape): string {
  const accidentals = accidentalsOf(shape);
  if (accidentals.length === 0) return 'no sharps or flats';

  const kind = (accidentals[0] as SpelledNote).name.includes('#') ? 'sharp' : 'flat';
  const count = accidentals.length === 1 ? 'one' : String(accidentals.length);
  const names = accidentals.map((note) => note.name).join(', ');
  return `${count} ${kind}${accidentals.length === 1 ? '' : 's'} — ${names}`;
}

/**
 * Degrees of `a` whose note `b` does not contain, counting from 1.
 *
 * Membership rather than position: two scales with different roots disagree at
 * every degree if you line them up side by side, which says nothing. What the
 * comparison practices are about is the *note* — G major has an F# where C
 * major has no F# at all — so the answer for G against C is its seventh degree,
 * and for F against C its fourth.
 */
export function differencesBetween(a: ScaleShape, b: ScaleShape): readonly number[] {
  const inB = new Set(b.pitchClasses);
  return a.pitchClasses.flatMap((pitchClass, index) => (inB.has(pitchClass) ? [] : [index + 1]));
}

/** Middle C, the root every bucket-4.2 practice sits on. */
export const MIDDLE_C = toMidi(0, 4);

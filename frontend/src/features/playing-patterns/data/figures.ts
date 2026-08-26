import { buildChordFrom, buildScaleFrom, toMidi } from '@/features/music-theory';
import type {
  Contour,
  FigureEvent,
  FigureNote,
  FigureSource,
  Hand,
  NoteValue,
  Quality,
} from '../patterns.types';

/**
 * Figures: a chord or a scale turned into an ordered line of notes.
 *
 * Level 7 is one idea in three costumes. A broken chord is a triad played one
 * note at a time; an arpeggio is the same thing reaching an octave; a melody is
 * a line through a scale. All three are an ordered list of notes with a finger
 * on each, so all three are built here and played by one engine.
 */

/** Beats each note length lasts. */
export const VALUE_BEATS: Readonly<Record<NoteValue, number>> = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
};

/** Where the figures sit: middle C's octave for the right hand, one below for the left. */
const OCTAVE: Readonly<Record<Hand, number>> = { right: 4, left: 3 };

/**
 * Which semitone a chord degree sits at.
 *
 * 1, 3 and 5 are the triad; 8 is the octave above the root, which is what turns
 * a broken chord into an arpeggio. The third is the only one that moves with the
 * quality, which is the same fact level 5 was built on.
 */
function chordSemitone(degree: number, quality: Quality): number {
  if (degree === 1) return 0;
  if (degree === 3) return quality === 'major' ? 4 : 3;
  if (degree === 5) return 7;
  if (degree === 8) return 12;
  // A degree outside the triad falls back to the root rather than inventing one.
  return 0;
}

/**
 * The fingering a chord figure is printed with.
 *
 * A fingering is a choice rather than a fact, so these are written down — they
 * are the ones both references give. The left hand is not the right hand
 * mirrored: the numbering is identical and the *order* reverses, because the
 * thumb is on the other side of the hand.
 */
const CHORD_FINGERING: Readonly<Record<string, Readonly<Record<Hand, readonly number[]>>>> = {
  '1,3,5': { right: [1, 3, 5], left: [5, 3, 1] },
  '5,3,1': { right: [5, 3, 1], left: [1, 3, 5] },
  '1,3,5,3': { right: [1, 3, 5, 3], left: [5, 3, 1, 3] },
  '1,3,5,8': { right: [1, 2, 3, 5], left: [5, 3, 2, 1] },
  '8,5,3,1': { right: [5, 3, 2, 1], left: [1, 2, 3, 5] },
  '1,3,5,8,5,3': { right: [1, 2, 3, 5, 3, 2], left: [5, 3, 2, 1, 2, 3] },
  // Alberti bass: the outer fingers take the root and the fifth, and the third
  // is reached by the middle finger without the hand moving at all.
  '1,5,3,5': { right: [1, 5, 3, 5], left: [5, 1, 3, 1] },
};

/** The fingering for a degree pattern, falling back to a five-finger reading. */
export function fingeringFor(degrees: readonly number[], hand: Hand): readonly number[] {
  const printed = CHORD_FINGERING[degrees.join(',')];
  if (printed) return printed[hand];
  // Anything unlisted takes one finger per note in order, which is what a
  // five-finger position does and is always playable for up to five notes.
  return degrees.map((_degree, index) => (hand === 'right' ? index + 1 : degrees.length - index));
}

/** How wide a five-finger position is — the span a melody figure stays inside. */
export const SPAN = 5;

/** Fold a degree back inside the hand, keeping it between 1 and the span. */
function fold(degree: number, span: number): number {
  return (((degree - 1) % span) + span) % span + 1;
}

/**
 * The scale degrees a contour visits, inside one five-finger position.
 *
 * A descending line has to *start* high or it has nowhere to go, and a wave has
 * to come back down rather than run off the bottom of the hand — so the shape
 * decides where it begins as well as where it moves. Everything is folded back
 * inside the span as a safety net, because a figure the hand cannot reach is not
 * a figure.
 */
export function contourDegrees(contour: Contour, length: number): readonly number[] {
  if (contour === 'same') return Array.from({ length }, () => 1);
  if (contour === 'wave') {
    // A triangle: up to the middle, then back down the way it came.
    const peak = Math.floor((length - 1) / 2);
    return Array.from({ length }, (_entry, index) =>
      fold(1 + (index <= peak ? index : 2 * peak - index), SPAN),
    );
  }

  const start = contour === 'down' ? Math.min(SPAN, length) : 1;
  const degrees: number[] = [start];
  for (let index = 1; index < length; index += 1) {
    const previous = degrees[index - 1] as number;
    if (contour === 'up') degrees.push(fold(previous + 1, SPAN));
    else if (contour === 'down') degrees.push(fold(previous - 1, SPAN));
    // A skip leaps a third and fills back in, which is what a leaping line does.
    else degrees.push(fold(previous + (index % 2 === 1 ? 2 : -1), SPAN));
  }
  return degrees;
}

/** Which positions of a line are the moment it changes direction. */
export function turnsIn(midis: readonly number[]): readonly boolean[] {
  return midis.map((midi, index) => {
    if (index === 0 || index === midis.length - 1) return false;
    const before = midis[index - 1] as number;
    const after = midis[index + 1] as number;
    // A turn is where the line stops going the way it was going.
    return (midi - before) * (after - midi) < 0;
  });
}

export interface BuiltFigure {
  notes: readonly FigureNote[];
  /** "C–E–G–E" — the figure written out. */
  line: string;
  /** "1–3–5–3" — its fingering. */
  fingering: string;
}

/**
 * Builds a figure: the notes, their fingers, their lengths and its turns.
 *
 * The whole of level 7's playing side comes through here, which is why the
 * timing measurements downstream can be the same for a broken chord and a
 * melody — by the time the engine sees it, they are the same kind of thing.
 */
export function buildFigure(
  source: FigureSource,
  root: string,
  quality: Quality,
  hand: Hand,
  values: readonly NoteValue[],
): BuiltFigure | null {
  const chord = buildChordFrom(root, quality);
  const scale = buildScaleFrom(root, quality === 'major' ? 'major' : 'natural-minor');
  if (!chord || !scale) return null;

  const rootMidi = toMidi(chord.pitchClasses[0] ?? 0, OCTAVE[hand]);

  /** A chord degree as an absolute key. */
  const keyOf = (degree: number): number => rootMidi + chordSemitone(degree, quality);
  /** A scale degree as an absolute key, walking the scale rather than the chord. */
  const scaleKey = (degree: number): number => {
    const note = scale.notes[(degree - 1) % scale.notes.length];
    const offset = note ? (note.pitchClass - (chord.pitchClasses[0] ?? 0) + 12) % 12 : 0;
    return rootMidi + offset;
  };

  // An accompaniment says how many notes sound at each moment; the other two
  // sources are one note at a time, which is the same thing with one degree.
  const groups: readonly (readonly number[])[] =
    source.kind === 'accompaniment'
      ? source.steps.map((step) => step.degrees)
      : (source.kind === 'chord'
          ? source.degrees
          : contourDegrees(source.contour, source.length)
        ).map((degree) => [degree]);

  const midiGroups = groups.map((degrees) =>
    degrees.map((degree) => (source.kind === 'scale' ? scaleKey(degree) : keyOf(degree))),
  );

  const fingering =
    source.kind === 'chord'
      ? fingeringFor(source.degrees, hand)
      : source.kind === 'scale'
        ? contourDegrees(source.contour, source.length).map((degree) =>
            hand === 'right' ? degree : 6 - degree,
          )
        : // An accompaniment names the finger for its lowest note: the thumb in
          // the right hand, the little finger in the left, which is where a
          // bass note is actually taken.
          groups.map(() => (hand === 'right' ? 1 : 5));

  // A turn is read from the lowest note of each moment, which is the voice the
  // hand actually follows.
  const turns = turnsIn(midiGroups.map((group) => Math.min(...group)));

  const notes: readonly FigureNote[] = midiGroups.map((midis, index) => ({
    midis,
    name: midis.map(nameOf).join('+'),
    finger: fingering[index] ?? 1,
    degree: groups[index]?.[0] ?? 1,
    beats:
      source.kind === 'accompaniment'
        ? (source.steps[index]?.beats ?? 1)
        : VALUE_BEATS[values[index % values.length] ?? 'quarter'],
    turn: turns[index] ?? false,
  }));

  return {
    notes,
    line: notes.map((note) => note.name).join('–'),
    fingering: notes.map((note) => note.finger).join('–'),
  };
}

/**
 * Two figures laid on one clock.
 *
 * A left-hand pattern and a right-hand melody rarely have the same number of
 * notes, so they cannot simply be zipped: what matters is which keys fall on
 * the same *beat*. Merging by beat is what makes "the hands land together"
 * something the drill can check rather than something you have to trust.
 */
export function buildEvents(
  right: BuiltFigure | null,
  left: BuiltFigure | null,
): readonly FigureEvent[] {
  const at = new Map<number, FigureEvent>();

  const place = (figure: BuiltFigure | null, hand: Hand) => {
    if (!figure) return;
    let beat = 0;
    for (const note of figure.notes) {
      const existing = at.get(beat);
      const event: FigureEvent = existing ?? { beat, midis: [], turn: false };
      event.midis = [...event.midis, ...note.midis];
      event.turn = event.turn || note.turn;
      if (hand === 'right') event.right = note;
      else event.left = note;
      at.set(beat, event);
      beat += note.beats;
    }
  };

  place(right, 'right');
  place(left, 'left');

  return [...at.values()].sort((a, b) => a.beat - b.beat);
}

const SHARP_LETTERS: readonly string[] = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** A midi as a letter and octave, for the prompt and the score labels. */
export function nameOf(midi: number): string {
  const pitch = ((midi % 12) + 12) % 12;
  return `${SHARP_LETTERS[pitch]}${Math.floor(midi / 12) - 1}`;
}

/** When each note of a figure falls, in beats from the start. */
export function beatsOf(notes: readonly FigureNote[]): readonly number[] {
  const beats: number[] = [];
  let at = 0;
  for (const note of notes) {
    beats.push(at);
    at += note.beats;
  }
  return beats;
}

/** How long the whole figure lasts, in beats. */
export function lengthOf(notes: readonly FigureNote[]): number {
  return notes.reduce((sum, note) => sum + note.beats, 0);
}

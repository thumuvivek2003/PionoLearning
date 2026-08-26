/** Which hand a figure is being played with. */
export type Hand = 'right' | 'left';

/** The two qualities level 7's figures are built on. */
export type Quality = 'major' | 'minor';

/** Shapes a melody can take. */
export type Contour = 'up' | 'down' | 'wave' | 'skip' | 'same';

/** Note lengths a figure can be played in, as the references count them. */
export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth';

/**
 * Where a figure's notes come from.
 *
 * A broken chord and an arpeggio are both a chord taken apart in a stated
 * order; a melody is a line through a scale. Keeping the two sources apart as a
 * union means a config says exactly one thing about where its notes came from,
 * and the engine never has to guess.
 */
export type FigureSource =
  | {
      kind: 'chord';
      /** Degrees of the triad, in the order they are played. 8 is the octave. */
      degrees: readonly number[];
    }
  | {
      kind: 'scale';
      contour: Contour;
      length: number;
    }
  | {
      kind: 'accompaniment';
      /** Positions that may sound more than one note at once. */
      steps: readonly AccompStep[];
    };

/**
 * One moment of an accompaniment.
 *
 * A left-hand pattern is not a line of single notes: a bass note is one key, a
 * chord is three, and an octave bass is two. Saying so explicitly is what lets
 * 7.6's six patterns be six configs rather than six drills.
 */
export interface AccompStep {
  /** Chord degrees sounding together. One entry is a single note. */
  degrees: readonly number[];
  /** How long it lasts, in beats. */
  beats: number;
}

/** One moment of a figure — a note, or several sounding together. */
export interface FigureNote {
  /** Every key due at this moment. One for a melody, three for a chord. */
  midis: readonly number[];
  /** "C4", or "C4+E4+G4" — what it is called. */
  name: string;
  /** Which finger the printed fingering assigns to the lowest note. */
  finger: number;
  /** Which degree of the chord or scale it is. */
  degree: number;
  /** How long it lasts, in beats. */
  beats: number;
  /** True where the figure changes direction — the join that costs most. */
  turn: boolean;
}

/** A moment on the shared clock, with whichever hands are due on it. */
export interface FigureEvent {
  /** When it falls, in beats from the start of the figure. */
  beat: number;
  /** Every key due, from both hands together. */
  midis: readonly number[];
  right?: FigureNote;
  left?: FigureNote;
  /** True where either hand changes direction — the join that costs most. */
  turn: boolean;
}

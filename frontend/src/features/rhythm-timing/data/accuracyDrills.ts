import type { NoteValue } from './noteValues';

/**
 * Bucket 3.6 as data.
 *
 * The bucket is a set of separate questions about the same playing, so a
 * practice is named by what is being asked rather than by what is played:
 * whether the notes sit on the beat, whether they are evenly spaced, whether
 * you can *tell* which of those is wrong, whether you can start and stop where
 * you meant to, and whether a mistake takes the rhythm with it.
 */
export type AccuracyFocus =
  /** One key, several rhythms, switched between deliberately. */
  | 'rhythms'
  /** A long run of one value, judged on spacing as much as placement. */
  | 'repeats'
  /** Play a phrase, then say whether you were early, on, or late. */
  | 'judge'
  /** Spacing alone: the same gap every time, machine-like. */
  | 'evenness'
  /** One entry, exactly on the beat, over and over. */
  | 'start'
  /** The last note where it was meant to be, and then silence. */
  | 'stop'
  /** A mistake happens; how quickly does the rhythm come back? */
  | 'recover';

export interface AccuracyDrillConfig {
  id: string;
  focus: AccuracyFocus;
  /** Note values the practice plays, cycled through where more than one. */
  values: readonly NoteValue[];
  /** Notes in a phrase, before it is judged. */
  phrase: number;
  /**
   * What each phrase is asked to do, cycled.
   *
   * The reference teaches rushing and dragging by having you produce them on
   * purpose and then notice the difference — so the drill names the target,
   * measures whether you hit it, and only then asks what you thought happened.
   */
  demonstrate?: readonly Judgement[];
  tempos: readonly number[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

export const ACCURACY_DRILLS: Readonly<Record<string, AccuracyDrillConfig>> = {
  rhythms: {
    id: 'rhythms',
    focus: 'rhythms',
    values: ['quarter', 'half', 'whole', 'eighth'],
    phrase: 8,
    tempos: [60, 70, 80],
    goal: 'One pitch, four rhythms — the note stays put and only the timing changes.',
    steps: [
      'The drill moves through quarters, halves, wholes and eighths on the same key.',
      'Count all the way through the change; the pulse does not pause for it.',
      'Each value is scored on its own, so the panel names the one that slips.',
    ],
    watchFor:
      'Speeding up when the values get shorter. The eighths should sit inside the same beat the wholes did.',
  },
  repeats: {
    id: 'repeats',
    focus: 'repeats',
    values: ['quarter'],
    phrase: 16,
    tempos: [60, 70, 80, 90],
    goal: 'Sixteen identical notes, identically spaced — the same C, sixteen times, no drift.',
    steps: [
      'Play with the click until your note and the click sound like one thing.',
      'Sixteen at 60 before 70, and only then 80.',
      'Evenness is scored beside placement: sitting in the window while lurching still counts as lurching.',
    ],
    watchFor:
      'A gap that grows or shrinks across the run. That is drift, and it is invisible from note to note — only the whole run shows it.',
  },
  rushing: {
    id: 'rushing',
    focus: 'judge',
    values: ['quarter'],
    phrase: 4,
    demonstrate: ['on', 'early'],
    tempos: [50, 60],
    goal: 'Learn what rushing feels like by doing it on purpose — then by hearing it.',
    steps: [
      'One phrase on the beat, the next deliberately early. The drill names which is which.',
      'Afterwards, say where you think you were. Your answer is scored beside the measurement.',
      'Do not stay in the rushing phrases long: this is recognition, not a habit to build.',
    ],
    watchFor:
      'Guessing "on the beat" every time. Rushing feels like sitting on top of the beat, which is exactly why it needs measuring rather than sensing.',
  },
  dragging: {
    id: 'dragging',
    focus: 'judge',
    values: ['quarter'],
    phrase: 4,
    demonstrate: ['on', 'late'],
    tempos: [50, 60],
    goal: 'The other direction: produce dragging deliberately, then learn to hear it.',
    steps: [
      'One phrase on the beat, the next deliberately behind it.',
      'Say where you were before the drill tells you.',
      'Dragging usually comes from tension, or from waiting to hear the click before moving.',
    ],
    watchFor:
      'Being unable to tell late from on the beat. Early is easier to feel than late, so this half often needs the most work.',
  },
  evenness: {
    id: 'evenness',
    focus: 'evenness',
    values: ['eighth'],
    phrase: 16,
    tempos: [50, 60, 70],
    goal: 'Spacing alone: if someone closed their eyes, the notes should sound mechanical.',
    steps: [
      'Sixteen eighths in a row, every gap the same as the last.',
      'Keep the volume level too — no accent on the first of each group.',
      'The score is the spread between your gaps, not how close they are to the click.',
    ],
    watchFor:
      'The first note of every beat coming out louder or earlier. Grouping creeps in by itself; this practice is about removing it.',
  },
  start: {
    id: 'start',
    focus: 'start',
    values: ['quarter'],
    phrase: 1,
    tempos: [60, 70, 80],
    goal: 'One note, exactly on the beat, after a bar of counting — the entry, ten times over.',
    steps: [
      'A bar of clicks, then you come in on the next one. Nothing else.',
      'Do not tap along beforehand; count it internally and enter.',
      'Only the entry is scored, so there is nowhere to hide.',
    ],
    watchFor:
      'Entering just after the click because you were waiting to hear it. Predict the beat rather than reacting to it.',
  },
  stop: {
    id: 'stop',
    focus: 'stop',
    values: ['quarter'],
    phrase: 8,
    tempos: [60, 70],
    goal: 'Finish where you meant to: the last note on the last beat, then silence.',
    steps: [
      'Eight notes, and the eighth is the end. Nothing after it.',
      'An extra note after the ending is scored against you.',
      'A release is timing too — let go where the music stops.',
    ],
    watchFor:
      'Trailing off, or adding one more note because the hand was still going. An ending is played, not arrived at.',
  },
  recover: {
    id: 'recover',
    focus: 'recover',
    values: ['quarter'],
    phrase: 16,
    tempos: [60, 70],
    goal: 'A mistake happens. How many notes before the rhythm is back where it should be?',
    steps: [
      'Play the line. When you miss — and you will — do not stop, do not go back.',
      'Find the next beat and carry on; the drill counts how long that takes.',
      'The number to improve is the recovery, not the miss.',
    ],
    watchFor:
      'The bar after a mistake falling apart worse than the mistake did. That is the habit this practice exists to break, and it is the one that costs a performance.',
  },
};

export function getAccuracyDrill(id: string): AccuracyDrillConfig {
  const config = ACCURACY_DRILLS[id];
  if (!config) throw new Error(`Unknown accuracy drill: ${id}`);
  return config;
}

/** What a self-judgement can be — the three the reference asks you to hear. */
export const JUDGEMENTS = ['early', 'on', 'late'] as const;
export type Judgement = (typeof JUDGEMENTS)[number];

export const JUDGEMENT_LABELS: Readonly<Record<Judgement, string>> = {
  early: 'I was early',
  on: 'I was on it',
  late: 'I was late',
};

/** What the measurement says, in the same three terms. */
export function judgementOf(meanError: number | null, tolerance: number): Judgement {
  if (meanError === null || Math.abs(meanError) <= tolerance) return 'on';
  return meanError < 0 ? 'early' : 'late';
}

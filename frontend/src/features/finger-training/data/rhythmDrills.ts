import type { FingerNumber } from '../finger.types';
import type { RhythmId } from './timing';

/** How the tempo is chosen for a practice. */
export type TempoMode =
  /** One tempo, picked from a short list. */
  | 'fixed'
  /** A ladder: clean passes earn the next rung, messy ones give it back. */
  | 'ladder';

export interface RhythmDrillConfig {
  id: string;
  /** The line to play, as white-key steps from the start. */
  offsets: readonly number[];
  /** The finger for each note. */
  fingers: readonly FingerNumber[];
  /** Rhythms offered; the first is where the drill opens. */
  rhythms: readonly RhythmId[];
  tempos: readonly number[];
  tempoMode: TempoMode;
  /** Accent every nth note; several entries add a control. */
  accents?: readonly number[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** C D E F G and back — the line every practice in this bucket uses. */
const UP_AND_DOWN: readonly number[] = [0, 1, 2, 3, 4, 3, 2, 1, 0];
const UP_AND_DOWN_FINGERS: readonly FingerNumber[] = [1, 2, 3, 4, 5, 4, 3, 2, 1];

/** Five notes up, for the practices that only need one direction. */
const UP: readonly number[] = [0, 1, 2, 3, 4];
const UP_FINGERS: readonly FingerNumber[] = [1, 2, 3, 4, 5];

/** Eight notes, so accents of 2, 3 and 4 all have room to repeat. */
const EIGHT: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7];
const EIGHT_FINGERS: readonly FingerNumber[] = [1, 2, 3, 1, 2, 3, 4, 1];

/** The reference's ladder: five rungs, five BPM apart. */
const LADDER: readonly number[] = [50, 55, 60, 65, 70];

/**
 * Bucket 2.11 as data.
 *
 * The notes barely change across the six practices, which is the point: what
 * moves is the clock. One note per beat, then two, then the same line held to a
 * slow click, then a tempo that has to be earned, then the same fingers under
 * four different rhythms, and finally accents inside a steady stream.
 */
export const RHYTHM_DRILLS: Readonly<Record<string, RhythmDrillConfig>> = {
  quarters: {
    id: 'quarters',
    offsets: UP_AND_DOWN,
    fingers: UP_AND_DOWN_FINGERS,
    rhythms: ['quarter'],
    tempos: [40, 50, 60],
    tempoMode: 'fixed',
    goal: 'One note per click, landing with the beat rather than near it.',
    steps: [
      'Four clicks of count-in, then C D E F G and back down — one note per click.',
      'Every note is scored against when it was due, so early counts as much as late.',
      'Five clean passes at 50 before you think about anything faster.',
    ],
    watchFor:
      'Arriving early. Rushing feels like being on top of the beat and reads as "rushing" in the panel — that is the tell.',
  },
  eighths: {
    id: 'eighths',
    offsets: UP_AND_DOWN,
    fingers: UP_AND_DOWN_FINGERS,
    rhythms: ['eighth'],
    tempos: [40, 50, 60],
    tempoMode: 'fixed',
    goal: 'Two notes per click, evenly spaced — faster fingers, same pulse.',
    steps: [
      'One-and, two-and: the note on "and" matters as much as the one on the click.',
      'Stay at 50 until the offbeats sit exactly halfway.',
      'The panel scores each finger separately, so it will name the one that is late.',
    ],
    watchFor:
      'Pairs that clump — CD… EF… rather than an even stream. Uneven eighths usually mean the hand is playing in twos rather than through the line.',
  },
  slow: {
    id: 'slow',
    offsets: UP_AND_DOWN,
    fingers: UP_AND_DOWN_FINGERS,
    rhythms: ['quarter', 'eighth'],
    tempos: [40, 45, 50],
    tempoMode: 'fixed',
    goal: 'The metronome is the boss and the fingers follow — at a tempo slow enough to prove it.',
    steps: [
      'Forty is deliberately slow. Listen to the click rather than watching your hand.',
      'A mistake is not a reason to speed up and catch the beat again. Stop, reset, start with the click.',
      'The start note moves each pass, so the line is the same but the position is not.',
    ],
    watchFor:
      'The click turning into background noise. If you cannot predict the next one, you are following your fingers instead of the beat.',
  },
  ladder: {
    id: 'ladder',
    offsets: UP_AND_DOWN,
    fingers: UP_AND_DOWN_FINGERS,
    rhythms: ['quarter', 'eighth'],
    tempos: LADDER,
    tempoMode: 'ladder',
    goal: 'Speed earned five beats at a time — and given straight back when it costs accuracy.',
    steps: [
      'A pass that lands on the beat and hits every note moves the tempo up a rung.',
      'A pass that does not takes it back down. That is the rule, not a punishment.',
      'The rung you settle at is your real tempo today; the one above it only teaches tension.',
    ],
    watchFor:
      'Body tension climbing with the tempo — stiff wrist, high fingers, held breath. If any of that appears, the rung is too high whatever the score says.',
  },
  rhythms: {
    id: 'rhythms',
    offsets: UP,
    fingers: UP_FINGERS,
    rhythms: ['quarter', 'eighth', 'long-short', 'short-long'],
    tempos: [50, 60, 70],
    tempoMode: 'fixed',
    goal: 'Same notes, same fingers, four different rhythms — timing separated from movement.',
    steps: [
      'Play the line as quarters, then eighths, then long-short, then short-long.',
      'The finger pattern never changes. Only when the notes arrive changes.',
      'Switch rhythm without stopping to relearn the notes; that is the whole exercise.',
    ],
    watchFor:
      'The long-short rhythms flattening out into even notes. If the long is not clearly longer, the rhythm has quietly become a quarter again.',
  },
  accents: {
    id: 'accents',
    offsets: EIGHT,
    fingers: EIGHT_FINGERS,
    rhythms: ['eighth', 'quarter'],
    tempos: [50, 60],
    tempoMode: 'fixed',
    accents: [2, 3, 4],
    goal: 'Groups of two, three and four felt inside one steady stream of notes.',
    steps: [
      'The accented notes are marked and played louder, so you can hear the target.',
      'Make the accent with the finger. The other notes stay light and the beat stays where it is.',
      'Change the grouping without changing the notes — that is what teaches you to feel groups.',
    ],
    watchFor:
      'The accent pulling the timing with it. An accent that arrives early came from the arm; the panel will show it as a rush on that note.',
  },
};

export function getRhythmDrill(id: string): RhythmDrillConfig {
  const config = RHYTHM_DRILLS[id];
  if (!config) throw new Error(`Unknown rhythm drill: ${id}`);
  return config;
}

import { WHITE_STEPS } from './distances';
import type { DistanceUnit } from './distances';

/** Which way round a distance is asked. */
export type DistanceAsk =
  /** Given a start and a distance, land on the target. */
  | 'produce'
  /** Given two keys, say how far apart they are. */
  | 'identify';

/** What is applying pressure beyond the notes themselves. */
export type DistanceChallenge = 'none' | 'deadline';

export interface DistanceDrillConfig {
  id: string;
  unit: DistanceUnit;
  /** Distance magnitudes offered; direction is a separate control. */
  distances: readonly number[];
  /** Ways of asking. The first is where the drill opens. */
  asks: readonly DistanceAsk[];
  challenge: DistanceChallenge;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/**
 * Bucket 1.6 as data — one engine, six settings.
 *
 * The progression is the distance itself: an octave, then one white key, then
 * two, then three, then the whole range named as intervals, then all of it at
 * random against a clock. Only the last two ask you to *identify* a distance;
 * a single-distance drill would answer that question for you.
 */
export const DISTANCE_DRILLS: Readonly<Record<string, DistanceDrillConfig>> = {
  'same-note': {
    id: 'same-note',
    unit: 'octave',
    distances: [1, 2],
    asks: ['produce', 'identify'],
    challenge: 'none',
    goal: 'The same letter again, up or down, felt as a distance rather than searched for.',
    steps: [
      'Play the lit key, then the same letter one octave away.',
      'Switch to Down, then Mixed — the same distance the other way is a different habit.',
      'Name it asks the reverse: two keys are lit, say how far apart they are.',
    ],
    watchFor:
      'Walking up the white keys to get there. An octave is one movement — if your hand travels through the notes between, it is still counting.',
  },
  neighbour: {
    id: 'neighbour',
    unit: 'white',
    distances: [1],
    asks: ['produce'],
    challenge: 'none',
    goal: 'One white key either side, instantly — the smallest distance there is.',
    steps: [
      'The lit key is where you are. Land on its neighbour in the direction asked.',
      'Run Up until it is automatic, then Down, then Mixed.',
      'Watch the wrap: left of C is B, right of B is C.',
    ],
    watchFor:
      'Being quick to the right and slow to the left. The panel below will name the start notes you hesitate on — those are the ones to repeat.',
  },
  'jump-2': {
    id: 'jump-2',
    unit: 'white',
    distances: [2],
    asks: ['produce'],
    challenge: 'none',
    goal: 'Two white keys away — a 3rd — skipping the key between without looking at it.',
    steps: [
      'Land two white keys away. Do not touch the one you skip.',
      'Then play the skipped note to hear what you jumped over.',
      'Chain them on your real keyboard: C E G, D F A.',
    ],
    watchFor:
      'Counting "one, two". Look for the shape instead — a 3rd is one white key visible between your fingers.',
  },
  'jump-3': {
    id: 'jump-3',
    unit: 'white',
    distances: [3],
    asks: ['produce'],
    challenge: 'none',
    goal: 'Three white keys away — a 4th — as one hand movement.',
    steps: [
      'Land three white keys away, in the direction asked.',
      'Keep your eyes on the target, not on the keys in between.',
      'On your real keyboard, make the same jump thumb to little finger.',
    ],
    watchFor:
      'Landing one key short or long. A 4th leaves two white keys visible between your fingers — check the gap, not the count.',
  },
  intervals: {
    id: 'intervals',
    unit: 'white',
    distances: WHITE_STEPS,
    asks: ['identify', 'produce'],
    challenge: 'none',
    goal: 'Distance recognised, not measured: see two keys and know it is a 3rd, a 4th, a 5th.',
    steps: [
      'Name it lights two keys — answer with the interval, or with the number of steps.',
      'Play it turns it round: you are given the interval and have to land it.',
      'Pick one start note and run 2nd, 3rd, 4th, 5th from it, so the sizes line up next to each other.',
    ],
    watchFor:
      'Guessing between neighbours — a 3rd read as a 4th. One white key visible between the two is a 3rd, two is a 4th, three is a 5th.',
  },
  random: {
    id: 'random',
    unit: 'white',
    distances: WHITE_STEPS,
    asks: ['produce', 'identify'],
    challenge: 'deadline',
    goal: 'Random start, random direction, random distance — inside the allowance. The bucket final.',
    steps: [
      'Read all three parts of the prompt at once: start, direction, distance.',
      'Every prompt has a clock. Counting does not fit inside it — that is the design.',
      'Start at 3 seconds and drop a step once your accuracy holds above 90%.',
    ],
    watchFor:
      'Accuracy collapsing when the allowance shortens. Go back up a step and work the distances the panel names, then come back down.',
  },
};

export function getDistanceDrill(id: string): DistanceDrillConfig {
  const config = DISTANCE_DRILLS[id];
  if (!config) throw new Error(`Unknown distance drill: ${id}`);
  return config;
}

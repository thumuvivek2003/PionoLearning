import type { FingerNumber } from '../finger.types';
import type { Situation, Technique } from './movement';
import { classify } from './movement';

/** The kinds of situation a practice can draw. */
export type SituationKind =
  | 'nearby'
  | 'reach'
  | 'jump'
  | 'ascending'
  | 'descending'
  | 'isolated'
  | 'mixed';

export interface MovementDrillConfig {
  id: string;
  /** Situation kinds this practice draws from. */
  kinds: readonly SituationKind[];
  /** Open with the decision step on — the drill that asks before it lets you play. */
  decide: boolean;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** How far a group of leaps may wander before it has to come back. */
const DRIFT_LIMIT = 4;

/**
 * The widest a generated group may be, in white keys.
 *
 * The smallest board the app offers holds fifteen white keys, and a situation
 * has to be placeable on it with somewhere to start — so anything wider than
 * this is redrawn rather than left to fail on a short keyboard.
 */
const SPAN_LIMIT = 9;

function spanOf(offsets: readonly number[]): number {
  return Math.max(...offsets) - Math.min(...offsets);
}

/** Fingering for a stepwise line: the reference's 1-2-3-1-2-3. */
function crossingFingers(length: number, ascending: boolean): readonly FingerNumber[] {
  const cycle: FingerNumber[] = ascending ? [1, 2, 3] : [1, 2, 3];
  return Array.from({ length }, (_, index) => cycle[index % cycle.length] as FingerNumber);
}

function situation(id: string, offsets: readonly number[], fingers?: readonly FingerNumber[]): Situation {
  return { id, offsets, fingers };
}

/**
 * One situation of the requested kind.
 *
 * Generated rather than listed, so the drill never runs out and cannot be
 * memorised — which matters most for the mixed practice, where recognising the
 * shape is the entire exercise.
 */
export function generateSituation(kind: SituationKind, random: () => number = Math.random): Situation {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;
  const sign = () => (random() < 0.5 ? 1 : -1);

  switch (kind) {
    case 'nearby':
      return situation('nearby', [0, sign()]);
    case 'reach': {
      const distance = pick([2, 3, 4]);
      return situation('reach', [0, distance], [1, (distance + 1) as FingerNumber]);
    }
    case 'jump':
      return situation('jump', [0, pick([5, 6, 7]) * sign()]);
    case 'ascending': {
      const length = pick([4, 5, 6]);
      return situation(
        'ascending',
        Array.from({ length }, (_, index) => index),
        crossingFingers(length, true),
      );
    }
    case 'descending': {
      const length = pick([4, 5, 6]);
      return situation(
        'descending',
        Array.from({ length }, (_, index) => -index),
        crossingFingers(length, false),
      );
    }
    case 'isolated': {
      const length = pick([3, 4]);

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const offsets = [0];
        for (let step = 1; step < length; step += 1) {
          const previous = offsets[step - 1] as number;
          // Leaps all one way would walk off a short board, so a group that has
          // drifted turns back. It stays a set of leaps either way.
          const direction = Math.abs(previous) > DRIFT_LIMIT ? -Math.sign(previous) : sign();
          offsets.push(previous + pick([2, 3, 4, 5]) * direction);
        }
        if (spanOf(offsets) <= SPAN_LIMIT) return situation('isolated', offsets);
      }

      // Three leaps that always fit, for the vanishingly rare stubborn draw.
      return situation('isolated', [0, 3, -2]);
    }
    default: {
      // A stepwise stretch, then a leap, then stepwise again: the passage that
      // needs the strategy to change partway through.
      const run = pick([3, 4]);
      const offsets = Array.from({ length: run }, (_, index) => index);
      const leap = (offsets[run - 1] as number) + pick([3, 4, 5]);
      offsets.push(leap, leap + 1, leap + 2);
      return situation('mixed', offsets);
    }
  }
}

/** What a kind is called on screen, and what it is teaching. */
export const KIND_LABELS: Readonly<Record<SituationKind, string>> = {
  nearby: 'Nearby note',
  reach: 'Comfortable reach',
  jump: 'Large jump',
  ascending: 'Ascending line',
  descending: 'Descending line',
  isolated: 'Isolated notes',
  mixed: 'Mixed passage',
};

/** The answer a kind should produce — used to check the generators stay honest. */
export function expectedTechnique(kind: SituationKind): Technique {
  return classify(generateSituation(kind, () => 0.5).offsets);
}

const ALL_KINDS: readonly SituationKind[] = [
  'nearby',
  'reach',
  'jump',
  'ascending',
  'descending',
  'isolated',
  'mixed',
];

/**
 * Bucket 2.8 as data.
 *
 * Six practices that drill one answer each, and a seventh that mixes everything
 * so the answer has to be chosen rather than remembered. Decide mode is what
 * turns the last one into the exercise the reference describes: stop, name the
 * movement, then play it.
 */
export const MOVEMENT_DRILLS: Readonly<Record<string, MovementDrillConfig>> = {
  nearby: {
    id: 'nearby',
    kinds: ['nearby'],
    decide: false,
    goal: 'A note just outside the position: move the hand a little, do not reach for it.',
    steps: [
      'Two notes, one white key apart at the edge of the hand.',
      'Let the hand shuffle across. The fingers should never feel like they are straining.',
      'Turn Decide on to name the movement before you play it.',
    ],
    watchFor:
      'Stretching the little finger because it is quicker than moving. It is quicker once, and expensive every time after that.',
  },
  reach: {
    id: 'reach',
    kinds: ['reach'],
    decide: false,
    goal: 'Inside the hand’s span: let the finger take it and leave the hand where it is.',
    steps: [
      'A 3rd, a 4th or a 5th from the start — all reachable without moving.',
      'A good stretch is relaxed, controlled and temporary. A bad one is none of those.',
      'If any of these feel cramped, stop stretching them and move instead.',
    ],
    watchFor:
      'Spreading the fingers as wide as they go. A reach is not a stretch competition; the hand should return to its shape immediately.',
  },
  jump: {
    id: 'jump',
    kinds: ['jump'],
    decide: false,
    goal: 'Too far to reach: pick the hand up, move it, land — no stretching involved.',
    steps: [
      'Six or seven white keys away, either direction.',
      'Do not lean towards it in advance. Play, move, land, relax.',
      'The landing is what is being scored, not the speed.',
    ],
    watchFor:
      'Anticipating the jump by opening the hand early. That is tension arriving before the note does.',
  },
  ascending: {
    id: 'ascending',
    kinds: ['ascending'],
    decide: false,
    goal: 'Continuous and going up: this is what crossing is for.',
    steps: [
      'Stepwise notes, fingered 1-2-3-1-2-3 — the thumb comes under at the fourth.',
      'The line should not break at the crossing; the evenness score will tell you if it did.',
      'The start moves every run, so crossing stops being attached to C.',
    ],
    watchFor:
      'Trying to hold the original position and stretch through. Five fingers do not cover eight notes.',
  },
  descending: {
    id: 'descending',
    kinds: ['descending'],
    decide: false,
    goal: 'Continuous and coming down: the hand reorganises rather than stretching indefinitely.',
    steps: [
      'The same idea in reverse; the left hand meets this shape more often than the right.',
      'Keep the movement continuous — the reorganisation happens while the line carries on.',
      'Compare the timing with the ascending practice; most hands are worse one way.',
    ],
    watchFor:
      'Freezing the hand and reaching backwards with the little finger. Let it move.',
  },
  isolated: {
    id: 'isolated',
    kinds: ['isolated'],
    decide: false,
    goal: 'Scattered notes going nowhere in particular: jump, do not cross.',
    steps: [
      'Three or four notes, none of them next to each other.',
      'Look, move, land, relax — one movement per note, no crossing involved.',
      'Accuracy first. These are worth nothing played fast and missed.',
    ],
    watchFor:
      'Crossing out of habit because the last practice crossed. Crossing is for lines; these are leaps.',
  },
  mixed: {
    id: 'mixed',
    kinds: ALL_KINDS,
    decide: true,
    goal: 'Anything at all — decide which movement it needs, then play it.',
    steps: [
      'Every run draws a different kind of situation. Name the movement first.',
      'A wrong answer explains itself, which is the part worth reading.',
      'The panel scores by movement, so it will name the decision you keep getting wrong.',
    ],
    watchFor:
      'Guessing from the shape of the strip rather than the distances. Count the gap, then decide.',
  },
};

export function getMovementDrill(id: string): MovementDrillConfig {
  const config = MOVEMENT_DRILLS[id];
  if (!config) throw new Error(`Unknown movement drill: ${id}`);
  return config;
}

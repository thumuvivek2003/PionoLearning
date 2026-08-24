import type { Letter } from '@/features/music-theory';
import { LANDMARK_RULES, groupLabel } from './blackKeys';
import { LANDMARK_LETTERS } from './landmarks';
import type { ChainKind } from './landmarks';

/**
 * Bucket 1.4 as data.
 *
 * Two screens serve the seven practices: a hunt against the clock, and a run
 * away from a landmark. Everything that differs between the practices — which
 * landmarks, how far the run goes, whether the board is divided into regions —
 * is written here, so a new practice is a config rather than a component.
 */

export interface SprintDrillConfig {
  id: string;
  /** Landmarks this drill hunts for. */
  letters: readonly Letter[];
  /** Open with the board split into low/middle/high thirds. */
  byRegion: boolean;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** 1.4.1 and 1.4.2 — one landmark, found over and over, anywhere. */
function landmarkSprint(letter: Letter): SprintDrillConfig {
  const rule = LANDMARK_RULES[letter];

  return {
    id: letter.toLowerCase(),
    letters: [letter],
    byRegion: false,
    goal: `See a ${groupLabel(rule.group)} → know where ${letter} is, with no thought in between.`,
    steps: [
      rule.detail,
      `Find one, press it, say "${letter}" out loud — then move somewhere else on the board.`,
      'Run a 2-minute sprint. Twenty-odd finds with no hesitation is the pass mark.',
      'Switch the target to By region once it is quick — it stops you camping in one octave.',
    ],
    watchFor: `Counting up from another note, and answering in the same octave every time. Both feel fine and both mean ${letter} is not a landmark yet.`,
  };
}

/** 1.4.7 — the integration drill: C and F, interleaved, all over the board. */
const RANDOM_LANDMARKS: SprintDrillConfig = {
  id: 'random',
  letters: LANDMARK_LETTERS,
  byRegion: true,
  goal: 'C or F, wherever the prompt lands, without a beat of hesitation between them.',
  steps: [
    'Read the letter and the region, then go straight there — 2 black keys for C, 3 for F.',
    'Do not settle: the prompt moves you low, middle and high on purpose.',
    'Sprint for two minutes and read the weak spots afterwards. That is your homework.',
  ],
  watchFor:
    'A pause when the letter changes. If F is slower than C, run 1.4.2 again before coming back — the panel below will tell you which one it is.',
};

export const SPRINT_DRILLS: Readonly<Record<string, SprintDrillConfig>> = {
  c: landmarkSprint('C'),
  f: landmarkSprint('F'),
  random: RANDOM_LANDMARKS,
};

export function getSprintDrill(id: string): SprintDrillConfig {
  const config = SPRINT_DRILLS[id];
  if (!config) throw new Error(`Unknown landmark sprint: ${id}`);
  return config;
}

export interface ChainDrillConfig {
  id: string;
  /** Landmarks a run may start from. */
  landmarks: readonly Letter[];
  kind: ChainKind;
  /** What the run looks like, for the goal line, e.g. "C D E". */
  shape: string;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/**
 * 1.4.3 – 1.4.6 — the notes around a landmark, played as one shape.
 *
 * The four configs are one idea at four sizes: the block above C, the block
 * above F, both blocks joined into an octave, and the same blocks with the
 * black keys put back in. `kind` decides where a run stops, so the data never
 * has to spell out note names that the board already knows.
 */
export const CHAIN_DRILLS: Readonly<Record<string, ChainDrillConfig>> = {
  'c-block': {
    id: 'c-block',
    landmarks: ['C'],
    kind: 'white-block',
    shape: 'C D E',
    goal: 'See C and see C D E — one shape, not three notes.',
    steps: [
      'The run starts on the lit C. Play C, D, E in order.',
      'Then switch to Descending and play E, D, C.',
      'Say the names out loud, and do it in a different octave every run.',
    ],
    watchFor:
      'Looking for D and E separately. They are the two white keys sitting on the group of 2 — the shape gives you all three at once.',
  },
  'f-block': {
    id: 'f-block',
    landmarks: ['F'],
    kind: 'white-block',
    shape: 'F G A B',
    goal: 'See F and see F G A B — the four-note half of the keyboard.',
    steps: [
      'The run starts on the lit F. Play F, G, A, B.',
      'Then reverse it: B, A, G, F.',
      'Notice the halves: C D E on the group of 2, F G A B on the group of 3.',
    ],
    watchFor:
      'Losing B. B is the white key right of the group of 3, and the next key up is the C that starts the other block.',
  },
  'white-run': {
    id: 'white-run',
    landmarks: ['C', 'F'],
    kind: 'white-octave',
    shape: 'C D E F G A B C · F G A B C D E F',
    goal: 'A full octave of white keys from either landmark, no counting anywhere in it.',
    steps: [
      'The run starts wherever the lit key is — sometimes C, sometimes F.',
      'Play all eight, landmark back to landmark.',
      'From F the run crosses into the other block: F G A B, then C D E F.',
    ],
    watchFor:
      'Slowing down at the join. B → C and E → F are the two places with no black key between them, and they are where a counted run falls apart.',
  },
  'black-run': {
    id: 'black-run',
    landmarks: ['C', 'F'],
    kind: 'chromatic-block',
    shape: 'C C# D D# E · F F# G G# A A# B',
    goal: 'Every key in a landmark block, black ones included, in order.',
    steps: [
      'The run starts on the lit landmark and takes every key — white and black.',
      'From C: C, C#, D, D#, E. From F: F, F#, G, G#, A, A#, B.',
      'Say each name as you press it; the black keys are where hesitation shows.',
    ],
    watchFor:
      'Treating the black keys as gaps. They are the landmark itself — the group of 2 sits inside the C block, the group of 3 inside the F block.',
  },
};

export function getChainDrill(id: string): ChainDrillConfig {
  const config = CHAIN_DRILLS[id];
  if (!config) throw new Error(`Unknown landmark chain: ${id}`);
  return config;
}

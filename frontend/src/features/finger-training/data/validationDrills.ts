import type { FingerNumber } from '../finger.types';

/** Where the notes of a run come from. */
export type RunSource =
  /** One written line, played as written. */
  | 'fixed'
  /** The same line, starting somewhere new every pass. */
  | 'transposed'
  /** Drawn fresh each pass, so no order can be memorised. */
  | 'random'
  /** One line, played under more than one sensible fingering. */
  | 'refingered';

/** How much the board gives you while you play. */
export type Vision =
  /** Everything visible. */
  | 'open'
  /** Visible, with one thing to check named on every pass. */
  | 'inspect'
  /** Covered once the hand is placed. */
  | 'covered';

export interface ValidationConfig {
  id: string;
  source: RunSource;
  vision: Vision;
  /** White-key steps from the start, for the written lines. */
  offsets?: readonly number[];
  /** Fingerings offered — more than one adds a control. */
  fingerings?: readonly { id: string; label: string; fingers: readonly FingerNumber[] }[];
  /** Notes per pass, for the drawn lines. */
  length?: number;
  /** Refuse notes played faster than this. */
  minGapMs?: number;
  /** Cut the run back after repeated misses in one place. */
  repair?: boolean;
  /** Offer the recording checklist after each pass. */
  review?: boolean;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

const FIVE: readonly number[] = [0, 1, 2, 3, 4];
const FIVE_FINGERS: readonly FingerNumber[] = [1, 2, 3, 4, 5];

/**
 * Bucket 2.12 as data.
 *
 * Eight ways of asking the same question — is this movement actually learnt, or
 * only learnt *here*, *this way*, *at this speed*? So the axes are exactly the
 * ways an answer can be false: the notes, the place, the fingering, the tempo,
 * and whether you were watching.
 */
export const VALIDATION_DRILLS: Readonly<Record<string, ValidationConfig>> = {
  slow: {
    id: 'slow',
    source: 'fixed',
    vision: 'open',
    offsets: FIVE,
    fingerings: [{ id: 'standard', label: '1-2-3-4-5', fingers: FIVE_FINGERS }],
    minGapMs: 900,
    goal: 'Slow enough to watch the movement happen — the foundation everything else sits on.',
    steps: [
      'Notes played early are refused, so the pace is not yours to hurry.',
      'Use the gap: which finger is moving, is the hand relaxed, is the next finger ready?',
      'Only speed up when the movement is clean and automatic, never before.',
    ],
    watchFor:
      'Treating the wait as dead time. The waiting is where the checking happens; without it this is just slow playing.',
  },
  'eyes-open': {
    id: 'eyes-open',
    source: 'fixed',
    vision: 'inspect',
    offsets: FIVE,
    fingerings: [{ id: 'standard', label: '1-2-3-4-5', fingers: FIVE_FINGERS }],
    goal: 'Eyes as an inspection camera, not a navigation system.',
    steps: [
      'Each pass names one thing to check. Play, then look for that one thing.',
      'Do not watch continuously — check, then go back to playing.',
      'If a check fails, slow down and fix it before the next pass.',
    ],
    watchFor:
      'Staring at your hands the whole way through. Constant watching hides the very habits you are trying to catch.',
  },
  'eyes-off': {
    id: 'eyes-off',
    source: 'fixed',
    vision: 'covered',
    offsets: FIVE,
    fingerings: [{ id: 'standard', label: '1-2-3-4-5', fingers: FIVE_FINGERS }],
    goal: 'The same line with the board covered — does the hand know where it is?',
    steps: [
      'The first note is shown so the hand can be placed; then the board covers itself.',
      'Start with the five-note line, then move to the harder sources once it holds.',
      'This comes after understanding, not instead of it.',
    ],
    watchFor:
      'Feeling around for the keys. One reach, one landing — hunting is the thing the cover is here to expose.',
  },
  randomized: {
    id: 'randomized',
    source: 'random',
    vision: 'open',
    length: 5,
    repair: true,
    goal: 'Notes in no order at all, so no sequence can be running the hand.',
    steps: [
      'Every pass is a fresh line — nothing to memorise, everything to decide.',
      'A spot missed three times cuts the run back until it comes out right.',
      'This is 2.10 used as a test rather than as practice.',
    ],
    watchFor:
      'A pass that goes well because it happened to resemble the last one. The panel scores per note, so the awkward ones show up wherever they land.',
  },
  transposed: {
    id: 'transposed',
    source: 'transposed',
    vision: 'open',
    offsets: FIVE,
    fingerings: [{ id: 'standard', label: '1-2-3-4-5', fingers: FIVE_FINGERS }],
    goal: 'One movement, started somewhere new every pass — is it the technique or is it C?',
    steps: [
      'The shape never changes. The start does, every single pass.',
      'Say the start note before you play, and never route through C to find it.',
      'The panel scores by start note, so it names the places your hand does not know yet.',
    ],
    watchFor:
      'Being reliably good from C, D and E and shaky from A and B. That is a location that was learnt, not a movement.',
  },
  refingered: {
    id: 'refingered',
    source: 'refingered',
    vision: 'open',
    offsets: [0, 1, 2, 3],
    fingerings: [
      { id: 'standard', label: '1-2-3-4', fingers: [1, 2, 3, 4] },
      { id: 'crossing', label: '1-2-3-1', fingers: [1, 2, 3, 1] },
      { id: 'upper', label: '2-3-4-5', fingers: [2, 3, 4, 5] },
    ],
    goal: 'The same four notes under three sensible fingerings — no note belongs to one finger.',
    steps: [
      'Each fingering is a real one, not a random one: position, crossing, and starting higher up the hand.',
      'Play each cleanly before mixing them.',
      'The point is that the technique survives the fingering changing, not that fingering is arbitrary.',
    ],
    watchFor:
      'One fingering being dramatically worse than the others. That is a dependency, and it is exactly what this practice is for.',
  },
  review: {
    id: 'review',
    source: 'random',
    vision: 'open',
    length: 5,
    review: true,
    goal: 'Play, then look at what you did — with the app supplying the half it can see.',
    steps: [
      'Play a pass, then read the checklist and your own numbers together.',
      'Record yourself as well if you can: the app hears timing, it cannot see your wrist.',
      'Pick one problem. One. Then go and work on that alone.',
    ],
    watchFor:
      'Collecting six problems and fixing none. The next practice session should have exactly one subject.',
  },
  'stop-on-errors': {
    id: 'stop-on-errors',
    source: 'random',
    vision: 'open',
    length: 6,
    repair: true,
    minGapMs: 350,
    goal: 'The correction loop, enforced: three misses in one place and the run gets cut back.',
    steps: [
      'Miss the same spot three times and the drill shortens the line rather than letting you repeat it.',
      'Two clean passes at the shorter length grow it back a note at a time.',
      'That is the whole rule: never rehearse the wrong movement twenty times.',
    ],
    watchFor:
      'Pushing through a bad patch out of stubbornness. Twenty attempts at a mistake teaches the mistake — that is what the cut-back is preventing.',
  },
};

export function getValidationDrill(id: string): ValidationConfig {
  const config = VALIDATION_DRILLS[id];
  if (!config) throw new Error(`Unknown validation drill: ${id}`);
  return config;
}

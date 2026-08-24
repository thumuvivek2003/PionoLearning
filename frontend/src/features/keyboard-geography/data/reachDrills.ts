import { LANDMARK_LETTERS } from './landmarks';
import type { Letter } from '@/features/music-theory';

/**
 * How much the board gives you while you aim.
 *
 * The bucket's whole progression is this one axis: look while you reach, look
 * then look away, or never look at all.
 */
export type Visibility =
  /** The board stays open — seeing the target is allowed. */
  | 'open'
  /** A timed look, then the board is covered for the reach. */
  | 'peek'
  /** Covered from the start; the target is named, never shown. */
  | 'covered';

/** What the prompt hands over. */
export type ReachTarget =
  /** A letter — any octave counts. */
  | 'note'
  /** A letter and an octave: C4 and nothing else. */
  | 'exact'
  /** Steps from a landmark: "two white keys right of F". */
  | 'landmark';

export interface ReachDrillConfig {
  id: string;
  visibility: Visibility;
  /** Target styles offered; the first is where the drill opens. */
  targets: readonly ReachTarget[];
  /** Landmarks a 'landmark' target may anchor on. */
  landmarks: readonly Letter[];
  /** White-key steps a 'landmark' target may ask for. */
  landmarkSteps: readonly number[];
  /** Clean reaches demanded of a target after a miss. */
  repairReps: number;
  /** Attempts in one assessed set. */
  setSize: number;
  /** Share of the set that has to land, per the reference's pass marks. */
  passRate: number;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/**
 * Bucket 1.7 as data.
 *
 * One reach engine covers five of the six practices, because they differ only
 * in how much the board shows and how the target is named. The sixth — touch
 * first, name it afterwards — runs the other way round and has its own screen.
 */
export const REACH_DRILLS: Readonly<Record<string, ReachDrillConfig>> = {
  'look-touch': {
    id: 'look-touch',
    visibility: 'open',
    targets: ['note', 'exact'],
    landmarks: LANDMARK_LETTERS,
    landmarkSteps: [0],
    repairReps: 1,
    setSize: 20,
    passRate: 0.95,
    goal: 'See the note, and the hand goes straight there. Accuracy first, speed later.',
    steps: [
      'Read the note, find it on the board, press it. The board stays open here.',
      'Say the name out loud as you press, then let go before the next one.',
      'Twenty in a row at 95% is the pass mark — the set counter is in the panel.',
    ],
    watchFor:
      'Drifting into speed before the accuracy is there. This is the one practice in the bucket where taking your time is correct.',
  },
  'look-away': {
    id: 'look-away',
    visibility: 'peek',
    targets: ['note', 'exact'],
    landmarks: LANDMARK_LETTERS,
    landmarkSteps: [0],
    repairReps: 1,
    setSize: 20,
    passRate: 0.85,
    goal: 'Look, hold the picture, then reach with the board covered.',
    steps: [
      'The target lights up for a moment — spend it looking at where the key sits, not at its name.',
      'The board then covers itself. Reach from the picture you kept.',
      'It uncovers when you answer, so you can see exactly where the hand went.',
    ],
    watchFor:
      'Memorising the name instead of the place. If the miss is usually one key out, you kept the letter and lost the position.',
  },
  landmark: {
    id: 'landmark',
    visibility: 'peek',
    targets: ['landmark'],
    landmarks: LANDMARK_LETTERS,
    landmarkSteps: [0, 1, 2, 3],
    repairReps: 1,
    setSize: 15,
    passRate: 0.85,
    goal: 'Anchor on C or F from the black-key groups, then step off it — covered.',
    steps: [
      'The prompt names a landmark and how far to step from it.',
      'Use the peek to place the landmark, not the target. The steps are yours to do blind.',
      'D is between the group of 2; G and A sit inside the group of 3 — that is the map you are using.',
    ],
    watchFor:
      'Reaching for the target directly and skipping the landmark. The landmark is the only thing on this board you can find without looking.',
  },
  'random-blind': {
    id: 'random-blind',
    visibility: 'covered',
    targets: ['note', 'exact'],
    landmarks: LANDMARK_LETTERS,
    landmarkSteps: [0],
    repairReps: 1,
    setSize: 15,
    passRate: 0.8,
    goal: 'A note is called, the board is covered, the hand goes there. No look at all.',
    steps: [
      'Start with Any octave on a small board — that is level one.',
      'Widen the board for level two: the same letters, further apart.',
      'Switch to Named octave for level three, where C4 and C5 are different answers.',
    ],
    watchFor:
      'Hunting around after the first touch. One reach, one answer — the miss is worth more to you than a correction.',
  },
  accuracy: {
    id: 'accuracy',
    visibility: 'covered',
    targets: ['note', 'exact'],
    landmarks: LANDMARK_LETTERS,
    landmarkSteps: [0],
    // The reference's corrective loop: a missed target owes three clean reaches.
    repairReps: 3,
    setSize: 20,
    passRate: 0.85,
    goal: 'The feedback loop: reach, check, and repair every miss before moving on.',
    steps: [
      'Reach covered. The board uncovers to show you exactly where you landed.',
      'A miss pins that note — it comes back until you have reached it cleanly three times.',
      'Read the miss reason each time. One key out, wrong octave and wrong landmark have different fixes.',
    ],
    watchFor:
      'Rushing the repair reps to get past them. They are the drill; the random targets in between are just the delivery.',
  },
};

export function getReachDrill(id: string): ReachDrillConfig {
  const config = REACH_DRILLS[id];
  if (!config) throw new Error(`Unknown reach drill: ${id}`);
  return config;
}

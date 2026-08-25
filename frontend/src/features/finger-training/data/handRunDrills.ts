import type { RunStep, SegmentSpec } from './handRuns';

/** Which of the two moves a practice is about. */
export type RunKind = 'shift' | 'cross';

/** One rung of a speed ladder: a name, and how slow it holds you to. */
export interface LadderStage {
  label: string;
  minGapMs: number;
}

/**
 * Slow, medium, fast — climbed by earning it.
 *
 * The reference is blunt about this: speed is the result of efficient movement,
 * and the moment accuracy breaks you go back down. So the ladder is a rule the
 * drill enforces rather than a suggestion it prints: a clean run moves you up a
 * rung, a run with a stumble moves you back down one.
 */
export const SPEED_LADDER: readonly LadderStage[] = [
  { label: 'Slow', minGapMs: 800 },
  { label: 'Medium', minGapMs: 450 },
  { label: 'Fast', minGapMs: 0 },
];

export interface HandRunConfig {
  id: string;
  kind: RunKind;
  /** Positions in order, for a shifting practice. */
  segments?: readonly SegmentSpec[];
  /** The finger pattern, written right-hand ascending, for a crossing practice. */
  crossing?: readonly RunStep[];
  /** Shift sizes a 'draw' segment may take. */
  shifts?: readonly number[];
  /** Start notes offered; every white key when absent. */
  starts?: readonly string[];
  /** Let the run be played downwards through each position. */
  reversible?: boolean;
  /** A moved step pressed sooner than this is rejected — let the hand settle. */
  settleMs?: number;
  /** Any step pressed sooner than this is rejected — the slow-crossing rule. */
  minGapMs?: number;
  /** Rungs the drill climbs and falls down, replacing a fixed minimum gap. */
  ladder?: readonly LadderStage[];
  /** Several shapes to draw from, when a practice teaches a principle not a pattern. */
  crossings?: readonly { id: string; label: string; steps: readonly RunStep[] }[];
  /** Hide the position markers, so the landing comes from memory. */
  hideMarkers?: boolean;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** A plain five-note position. */
const FULL = 5;

/** The shifts the random practices draw from. */
const SHIFTS: readonly number[] = [1, 2, -1, -2];

/* ---------------- 2.5 · Position Shifting ---------------- */

/** Two positions, a fixed distance apart — the first three practices. */
function shiftBy(id: string, shift: number, goal: string, watchFor: string): HandRunConfig {
  const way = shift > 0 ? 'right' : 'left';

  return {
    id,
    kind: 'shift',
    segments: [
      { shift: 0, notes: FULL },
      { shift, notes: FULL },
    ],
    reversible: true,
    goal,
    steps: [
      'Play the position through, then move the whole hand and play the new one.',
      `The marked step is the landing — thumb on the new anchor, ${Math.abs(shift)} white ${Math.abs(shift) === 1 ? 'key' : 'keys'} ${way}.`,
      'Move time in the panel is the number to watch. Clean first, then quick.',
    ],
    watchFor,
  };
}

const POSITION_SHIFTS: Readonly<Record<string, HandRunConfig>> = {
  'right-1': shiftBy(
    'right-1',
    1,
    'Leave the C position and set up a new one, one white key right.',
    'Stretching the little finger to reach the extra note instead of moving. If the thumb has not moved, neither has the position.',
  ),
  'right-2': shiftBy(
    'right-2',
    2,
    'A bigger move: two white keys right, in one deliberate gesture.',
    'Landing a key short. A two-key shift is one movement, not two one-key movements stitched together.',
  ),
  'left-1': shiftBy(
    'left-1',
    -1,
    'The same skill going the other way — one white key left.',
    'Being noticeably slower to the left. Compare the move times between this practice and Shift right by 1; they should match.',
  ),
  'after-5': {
    id: 'after-5',
    kind: 'shift',
    segments: [
      { shift: 0, notes: FULL },
      { shift: 1, notes: FULL },
      { shift: 1, notes: FULL },
      { shift: 1, notes: FULL },
    ],
    reversible: true,
    goal: 'Four positions in a row: play five, move, play five — the beginning of navigation.',
    steps: [
      'When the little finger lands, the next thing to happen is a move.',
      'Keep the moves the same size and the same speed all the way up.',
      'The evenness score covers the notes; move time covers the gaps between positions.',
    ],
    watchFor:
      'The run getting ragged after the second shift. That is where hands usually start rushing — slow the whole thing down rather than the last bit.',
  },
  'after-3': {
    id: 'after-3',
    kind: 'shift',
    segments: [
      { shift: 0, notes: 3 },
      { shift: 1, notes: 3 },
      { shift: 1, notes: 3 },
    ],
    reversible: true,
    goal: 'Move before you are stuck: three notes, then reposition, three more.',
    steps: [
      'Only three notes come out of each position, so the move arrives early.',
      'Real music rarely waits for your little finger to run out of keys.',
      'Reverse runs each position downward — the same instinct, other direction.',
    ],
    watchFor:
      'Waiting for the edge out of habit. If the hand only moves when it has to, it will always be late.',
  },
  'random-start': {
    id: 'random-start',
    kind: 'shift',
    segments: [
      { shift: 0, notes: FULL },
      { shift: 'draw', notes: FULL },
    ],
    shifts: SHIFTS,
    reversible: true,
    goal: 'Any starting position, any shift — C stops being the safe place.',
    steps: [
      'The run starts wherever it lands and moves by whatever it draws.',
      'Ask "where is my position", never "where is C".',
      'The panel scores by the shift, so it will name the direction and distance you are slowest on.',
    ],
    watchFor:
      'Silently translating everything back to C. If a position starting on A takes longer than one on C, that habit is still there.',
  },
  recognition: {
    id: 'recognition',
    kind: 'shift',
    segments: [{ shift: 0, notes: FULL }],
    goal: 'Named position → hand placed → five notes, with no working out in between.',
    steps: [
      'The prompt names a position. Place the thumb on its anchor and play through.',
      'One position per run, so what is being timed is the placing.',
      'Look at the whole position before the first note, not one key at a time.',
    ],
    watchFor:
      'Finding the anchor and then hunting for the other four. Five keys under five fingers is one shape.',
  },
  silent: {
    id: 'silent',
    kind: 'shift',
    segments: [
      { shift: 0, notes: FULL },
      { shift: 'draw', notes: FULL },
      { shift: 'draw', notes: FULL },
    ],
    shifts: SHIFTS,
    hideMarkers: true,
    settleMs: 350,
    goal: 'Play, move in silence, land already settled — the move itself invisible.',
    steps: [
      'The position markers are off: the new position has to be found rather than read.',
      'Nothing is played while the hand travels, and the landing waits until the hand has arrived.',
      'Clean landings in the panel counts the moves that arrived right first time.',
    ],
    watchFor:
      'Feeling for the new position with the thumb before committing. Move once, land once — a search costs more than a slow move.',
  },
};

/* ---------------- 2.6 · Thumb Movement ---------------- */

/** Written right-hand ascending; the left hand mirrors it. */
const CROSS_123_1: readonly RunStep[] = [
  { offset: 0, finger: 1 },
  { offset: 1, finger: 2 },
  { offset: 2, finger: 3 },
  { offset: 3, finger: 1, move: 'cross' },
];

const CROSS_1234_1: readonly RunStep[] = [
  { offset: 0, finger: 1 },
  { offset: 1, finger: 2 },
  { offset: 2, finger: 3 },
  { offset: 3, finger: 4 },
  { offset: 4, finger: 1, move: 'cross' },
];

const REVERSE_CROSS: readonly RunStep[] = [
  { offset: 0, finger: 4 },
  { offset: -1, finger: 3 },
  { offset: -2, finger: 2 },
  { offset: -3, finger: 1, move: 'cross' },
];

const THUMB_MOVES: Readonly<Record<string, HandRunConfig>> = {
  'thumb-under': {
    id: 'thumb-under',
    kind: 'cross',
    crossing: CROSS_123_1,
    starts: ['C'],
    settleMs: 600,
    goal: 'The thumb changes position without the hand jumping — play three, then let it travel.',
    steps: [
      'Play 1, 2, 3. Then pause, relax, and let the thumb move to the next key.',
      'The drill holds the landing back until the pause has happened, so the move cannot be rushed.',
      'Feel play → move → continue, not play → jump → twist.',
    ],
    watchFor:
      'The wrist lifting or the elbow swinging to deliver the thumb. The movement should be small enough that a watcher barely sees it.',
  },
  'thumb-beside': {
    id: 'thumb-beside',
    kind: 'cross',
    crossing: CROSS_123_1,
    settleMs: 300,
    goal: 'The same movement, started anywhere, until it stops feeling like a manoeuvre.',
    steps: [
      'C, then D, then E, then F — the start moves every run.',
      'Think "the thumb is going to the next place it is needed", not "the thumb goes under".',
      'Keep the pause short here. The move should feel ordinary rather than careful.',
    ],
    watchFor:
      'The thumb disappearing dramatically under the palm. It travels beside the hand, a small efficient movement.',
  },
  'cross-basic': {
    id: 'cross-basic',
    kind: 'cross',
    crossing: CROSS_123_1,
    goal: '1-2-3-1: the first real crossing, played as one connected line.',
    steps: [
      'C D E F, with the thumb taking F. No pause this time — it should join up.',
      'After 3 plays, the thumb moves. Do not throw the hand forward to help it.',
      'Move time in the panel is the gap into the crossing note; it should shrink and then stay put.',
    ],
    watchFor:
      'A bump at the crossing. The evenness score falls when the thumb arrives late — that gap is the whole exercise.',
  },
  'cross-extended': {
    id: 'cross-extended',
    kind: 'cross',
    crossing: CROSS_1234_1,
    goal: '1-2-3-4-1: the crossing that scales are built on.',
    steps: [
      'C D E F G, thumb on G. The travel starts while 4 is playing, not after it.',
      'Say it as "the hand keeps going right and the thumb changes position".',
      'Run it in both hands — the left mirrors it downward, which is the same movement.',
    ],
    watchFor:
      'Wrist collapse or the hand hopping at the crossing. If either happens, go back to the pause practices for a few minutes.',
  },
  'reverse-cross': {
    id: 'reverse-cross',
    kind: 'cross',
    crossing: REVERSE_CROSS,
    goal: '4-3-2-1 coming down, where the thumb has to arrive rather than be thrown.',
    steps: [
      'F E D C. The thumb lands last and lands quietly.',
      'Most hands are comfortable crossing one way only; this is the other way.',
      'Compare the move time with the ascending practices — they should end up level.',
    ],
    watchFor:
      'The wrist twisting to place the thumb. It should already be near the key by the time 2 has played.',
  },
  'slow-cross': {
    id: 'slow-cross',
    kind: 'cross',
    crossing: CROSS_1234_1,
    minGapMs: 800,
    goal: 'Ridiculously slow, on purpose: crossing without a trace of tension.',
    steps: [
      'Every note has to wait — press early and the drill will not take it.',
      'Relax between notes. At the crossing, pause, relax, then let the thumb travel.',
      'Follow mode at 40 BPM does the same job with a metronome for your own keyboard.',
    ],
    watchFor:
      'Treating the wait as dead time. The relaxing is the exercise; the notes are just what marks it out.',
  },
};

/* ---------------- 2.7 · Finger Crossing ---------------- */

/** 3-2-1-3: after the thumb, the hand moves so another finger can carry on. */
const CROSS_321_3: readonly RunStep[] = [
  { offset: 0, finger: 3 },
  { offset: -1, finger: 2 },
  { offset: -2, finger: 1 },
  { offset: 1, finger: 3, move: 'cross' },
];

/** 1-2-3-4-5 then the thumb again, one key past the position. */
const CROSS_12345_1: readonly RunStep[] = [
  { offset: 0, finger: 1 },
  { offset: 1, finger: 2 },
  { offset: 2, finger: 3 },
  { offset: 3, finger: 4 },
  { offset: 4, finger: 5 },
  { offset: 5, finger: 1, move: 'cross' },
];

/** Six notes of a scale, as the reference fingers them: 1-2-3-1-2-3. */
const SCALE_SIX: readonly RunStep[] = [
  { offset: 0, finger: 1 },
  { offset: 1, finger: 2 },
  { offset: 2, finger: 3 },
  { offset: 3, finger: 1, move: 'cross' },
  { offset: 4, finger: 2 },
  { offset: 5, finger: 3 },
];

/** The octave the reference writes out: 1-2-3-1-2-3-4-1. */
const SCALE_OCTAVE: readonly RunStep[] = [
  ...SCALE_SIX,
  { offset: 6, finger: 4 },
  { offset: 7, finger: 1, move: 'cross' },
];

const CROSSINGS: Readonly<Record<string, HandRunConfig>> = {
  'seven-basic': {
    id: 'seven-basic',
    kind: 'cross',
    crossing: CROSS_123_1,
    reversible: true,
    goal: '1-2-3-1, ten times slowly, then the same thing backwards.',
    steps: [
      'C D E F. After 3 plays, the thumb travels and the hand follows it.',
      'Reverse turns the run round — F E D C, thumb first, 3 crossing back over.',
      'Ten clean runs before you think about anything else.',
    ],
    watchFor:
      'The hand lifting to deliver the thumb. The thumb goes; the hand follows quietly. If the move time jumps around, the movement is still being invented each time.',
  },
  'seven-reverse': {
    id: 'seven-reverse',
    kind: 'cross',
    crossing: CROSS_321_3,
    goal: '3-2-1-3: crossing away from the thumb, which most hands never practise.',
    steps: [
      'E D C, then the hand moves so 3 can take the note above where you started.',
      'The moment that matters is 1 → 3: after the thumb, the hand relocates.',
      'Very slowly. This one is unfamiliar rather than difficult.',
    ],
    watchFor:
      'Reaching for the last note with the thumb still down. The thumb releases, the hand moves, then 3 lands.',
  },
  'seven-extended': {
    id: 'seven-extended',
    kind: 'cross',
    crossing: CROSS_12345_1,
    goal: '1-2-3-4-5-1: the position runs out, so the hand moves on.',
    steps: [
      'Five notes, then the thumb takes the sixth from the new position.',
      'Do not squeeze the thumb under finger 5 — the hand moves to the next position.',
      'Ask whether the transition after G felt smooth, quiet and relaxed. That is the pass mark.',
    ],
    watchFor:
      'Trying to keep the old position and stretch. Five fingers have run out of keys; that is information, not a problem.',
  },
  'seven-scale': {
    id: 'seven-scale',
    kind: 'cross',
    crossing: SCALE_SIX,
    crossings: [
      { id: 'fragment', label: '6 notes', steps: SCALE_SIX },
      { id: 'octave', label: 'Octave', steps: SCALE_OCTAVE },
    ],
    goal: 'Crossing inside a real scale line, where it stops being a trick.',
    steps: [
      'Six notes first: 1-2-3-1-2-3, crossing once.',
      'Then the octave, which crosses twice — the second one sets up the octave above.',
      'Isolate the crossing if it is rough: play the three notes before it and the one after, nothing else.',
    ],
    watchFor:
      'A bump exactly at the crossing. Evenness is the number that catches it, because the ear forgives what the timing does not.',
  },
  'seven-varied': {
    id: 'seven-varied',
    kind: 'cross',
    crossing: CROSS_123_1,
    crossings: [
      { id: 'after-3', label: 'After 3', steps: CROSS_123_1 },
      { id: 'after-4', label: 'After 4', steps: CROSS_1234_1 },
      {
        id: 'from-3',
        label: 'From 3',
        steps: [
          { offset: 0, finger: 3 },
          { offset: 1, finger: 4 },
          { offset: 2, finger: 5 },
          { offset: 3, finger: 1, move: 'cross' },
        ],
      },
      {
        id: 'from-2',
        label: 'From 2',
        steps: [
          { offset: 0, finger: 2 },
          { offset: 1, finger: 3 },
          { offset: 2, finger: 4 },
          { offset: 3, finger: 5 },
          { offset: 4, finger: 1, move: 'cross' },
        ],
      },
    ],
    goal: 'Crossing after whichever finger the line happens to end on — the principle, not one pattern.',
    steps: [
      'Leave the shape on Mixed so you cannot settle into "crossing always follows 3".',
      'The start note moves every run too.',
      'The panel scores by start note, so it will tell you which places your hand has not met yet.',
    ],
    watchFor:
      'Playing the pattern you expected rather than the one on screen. Read the strip before the first note.',
  },
  'seven-ladder': {
    id: 'seven-ladder',
    kind: 'cross',
    crossing: SCALE_SIX,
    ladder: SPEED_LADDER,
    goal: 'Slow, then medium, then fast — earned a rung at a time, and lost the same way.',
    steps: [
      'Every rung sets a minimum gap between notes; press early and the note is refused.',
      'A clean run moves you up. A run with a stumble moves you back down — that is the rule, not a punishment.',
      'Getting stuck between two rungs is useful information: that is your real tempo today.',
    ],
    watchFor:
      'Chasing the top rung. Speed is the result of an efficient movement, so the way up is to make the crossing smaller, not faster.',
  },
};

export const HAND_RUN_DRILLS: Readonly<Record<string, HandRunConfig>> = {
  ...POSITION_SHIFTS,
  ...THUMB_MOVES,
  ...CROSSINGS,
};

export function getHandRunDrill(id: string): HandRunConfig {
  const config = HAND_RUN_DRILLS[id];
  if (!config) throw new Error(`Unknown hand-run drill: ${id}`);
  return config;
}

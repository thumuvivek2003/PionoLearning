import type { ChromaticPattern, NoteScope } from './randomNotes';

/** What is applying pressure beyond the notes themselves. */
export type RandomChallenge =
  /** Nothing but the notes. */
  | 'none'
  /** A per-note allowance, plus a 30-second count-up. */
  | 'timed'
  /** Difficulty follows accuracy, per the reference's A/B/C levels. */
  | 'adaptive';

export interface RandomNotesConfig {
  id: string;
  /** Notes per pattern. Ignored when the practice is adaptive. */
  length: number;
  scope: NoteScope;
  /** How wide a stretch the notes are drawn from, in semitones. */
  spanSemitones: number;
  /** Refuse lines that only travel one way. */
  turns?: boolean;
  challenge: RandomChallenge;
  /** Fixed shapes instead of a random draw — the natural + black combinations. */
  patterns?: readonly ChromaticPattern[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** One octave: far enough that the hand has to move, near enough to be playable. */
const OCTAVE = 12;

/* ---------------- 2.9.7 · natural + black combinations ---------------- */

/** White → black → white, the shapes the reference lists. */
const NEIGHBOUR_PATTERNS: readonly ChromaticPattern[] = [
  { id: 'up', label: 'white → black → white', semitones: [0, 1, 2], fingers: [1, 2, 3] },
  { id: 'down', label: 'reversed', semitones: [0, -1, -2], fingers: [3, 2, 1] },
  { id: 'four-up', label: 'four notes up', semitones: [0, 1, 2, 4], fingers: [1, 2, 3, 5] },
  { id: 'four-down', label: 'four notes down', semitones: [0, -1, -2, -4], fingers: [5, 3, 2, 1] },
];

/* ---------------- 2.10 · random finger decisions ---------------- */

/** The practices that only differ in how many notes come at once. */
function randomLength(
  id: string,
  length: number,
  goal: string,
  watchFor: string,
  steps: readonly string[],
): RandomNotesConfig {
  return { id, length, scope: 'white', spanSemitones: OCTAVE, challenge: 'none', goal, steps, watchFor };
}

export const RANDOM_NOTE_DRILLS: Readonly<Record<string, RandomNotesConfig>> = {
  neighbours: {
    id: 'neighbours',
    length: 3,
    scope: 'all',
    spanSemitones: OCTAVE,
    challenge: 'none',
    patterns: NEIGHBOUR_PATTERNS,
    goal: 'White to black to white, until the black keys stop being a separate country.',
    steps: [
      'C, C#, D — then the same shape from D, from F, from G, from A.',
      'Reversed and four-note shapes are one control away; leave it on Mixed once both are easy.',
      'Look at the keyboard rather than at your fingers.',
    ],
    watchFor:
      'Hesitating on the way back down. Reversing the shape is a different movement, and most hands only practise one of them.',
  },
  naturals: randomLength(
    'naturals',
    1,
    'One note at a time, nowhere near a five-finger position: find it, choose a finger, play it.',
    'Reaching for the finger the C position would have used. There is no position here — the finger follows the hand, not a table.',
    [
      'A single white key, anywhere within an octave of where you are.',
      'See, locate, decide, play, release, next.',
      'Two or three seconds a note is fine to start. Speed is the last thing to arrive.',
    ],
  ),
  'two-note': randomLength(
    'two-note',
    2,
    'Two notes, unpredictably apart — where is my hand now, and where does it need to be?',
    'Deciding the fingering before you have looked at the distance. Look first; the distance chooses the finger.',
    [
      'Play the pair, then let the drill deal another.',
      'Both directions come up, so neither becomes the expected one.',
      'Land accurately rather than quickly.',
    ],
  ),
  'three-note': randomLength(
    'three-note',
    3,
    'Three notes without stopping — the beginning of planning more than one move ahead.',
    'Playing note one while still reading note one. Read the whole group before you start.',
    [
      'Look at all three before the first note.',
      'Then play them without a pause in the middle.',
      'A stumble is not a restart — carry on to the end.',
    ],
  ),
  'four-note': randomLength(
    'four-note',
    4,
    'Four notes, no comfortable pattern to fall back on — the hard one, on purpose.',
    'Automatically stretching. If a note is awkward, reposition and play it — do not force the fingers apart.',
    [
      'Every group asks the question again: shift, stretch, reposition or cross?',
      'This is where the movement-choice work from 2.8 gets used for real.',
      'Slowly. Four notes played well beats eight played hopefully.',
    ],
  ),
  'five-note': randomLength(
    'five-note',
    5,
    'Five unpredictable notes, played through — real playing, in miniature.',
    'Restarting the group after a mistake. Carry on: recovery is the skill this one teaches.',
    [
      'Look ahead by two or three notes while your hand plays the current one.',
      'Do not stop in the middle, and do not go back.',
      'The panel names the notes you keep missing, whichever group they turn up in.',
    ],
  ),
  'random-start': {
    id: 'random-start',
    length: 4,
    scope: 'white',
    // Half an octave: the notes cluster, so the hand has to be *somewhere* first.
    spanSemitones: 7,
    challenge: 'none',
    goal: 'The notes cluster somewhere new every time — so C stops being home.',
    steps: [
      'Each group sits in its own small area of the board, and the area moves.',
      'Put the hand where the notes are before you play the first one.',
      'Never return to C between groups; go straight to the next area.',
    ],
    watchFor:
      'Travelling back through C to get your bearings. If the group near A is slower than the one near C, that dependency is still there.',
  },
  'random-direction': {
    id: 'random-direction',
    length: 5,
    scope: 'white',
    spanSemitones: OCTAVE,
    turns: true,
    challenge: 'none',
    goal: 'Up, down, up again — the hand stops assuming which way the next note is.',
    steps: [
      'Every group changes direction at least once; none of them is a scale.',
      'Ask where the next note is relative to your hand, not relative to the last one.',
      'Both hands, separately.',
    ],
    watchFor:
      'Carrying on upward because the last two notes went up. That assumption is what this practice is removing.',
  },
  'black-white': {
    id: 'black-white',
    length: 4,
    scope: 'all',
    spanSemitones: OCTAVE,
    challenge: 'none',
    goal: 'The whole keyboard in the pool — black keys are just more places, not special cases.',
    steps: [
      'Groups mix black and white freely.',
      'Do not reserve a finger for black keys; the geography decides.',
      'The panel scores per note, so it will name the black keys that slow you down.',
    ],
    watchFor:
      'Treating a black key as an event. It is a key that sits slightly further in — nothing else changes.',
  },
  timed: {
    id: 'timed',
    length: 4,
    scope: 'white',
    spanSemitones: OCTAVE,
    challenge: 'timed',
    goal: 'The gap between seeing and playing, made smaller — with the clock as the judge.',
    steps: [
      'Start at 3 seconds a note. Drop a step only while accuracy holds.',
      'Run the 30-second count when you want a number: correct answers, not notes attempted.',
      'If accuracy collapses, put the time back up. Do not train quick mistakes.',
    ],
    watchFor:
      'Beating your score by playing faster rather than deciding faster. The number worth beating is correct-in-thirty-seconds, not speed.',
  },
  adaptive: {
    id: 'adaptive',
    length: 3,
    scope: 'white',
    spanSemitones: OCTAVE,
    challenge: 'adaptive',
    goal: 'Difficulty that follows your accuracy — the quality control for everything above.',
    steps: [
      'The drill watches the last ten notes: 90% moves you up, under 70% moves you back down.',
      'Levels add notes first, then black keys, then take time away.',
      'Where you settle is the honest answer to how this bucket is going.',
    ],
    watchFor:
      'Wanting the top level. The level that holds at 90% is the one that is teaching you something; the one above it just teaches mistakes.',
  },
};

export function getRandomNoteDrill(id: string): RandomNotesConfig {
  const config = RANDOM_NOTE_DRILLS[id];
  if (!config) throw new Error(`Unknown random-note drill: ${id}`);
  return config;
}

import type { FingerNumber } from '../finger.types';
import {
  bothHands,
  doubled,
  eitherHand,
  fingers,
  holdRun,
} from './fivePatterns';
import type { FivePatternConfig, PatternVariant } from './fivePatterns';

/**
 * The patterns of buckets 2.2 and 2.3, as data.
 *
 * They share one screen because they are one exercise with the difficulty
 * turned up: a run of fingers, played in the C position, measured on whether it
 * came out evenly. What changes is which fingers, in what order, and whether
 * something else has to stay still while they move.
 */

const UP: readonly FingerNumber[] = [1, 2, 3, 4, 5];
const DOWN: readonly FingerNumber[] = [5, 4, 3, 2, 1];

/** A pattern with nothing to say beyond its own numbers. */
function plain(id: string, sequence: readonly ReturnType<typeof eitherHand>[number][]): PatternVariant {
  return { id, sequence };
}

/* ---------------- 2.2 · Five-Finger Position ---------------- */

const FIVE_FINGER: Readonly<Record<string, FivePatternConfig>> = {
  'rh-up': {
    id: 'rh-up',
    hands: ['right'],
    play: 'together',
    variants: [plain('up', fingers('right', UP))],
    reversed: false,
    goal: 'The right-hand home position: 1 is C and 5 is G, with no counting in between.',
    steps: [
      'Play mode names a finger; press the key that finger owns. Follow mode paces it for your real keyboard.',
      'Keep the hand still — only the fingers move.',
      'Watch the evenness score, not the clock. Equal gaps beat fast ones here.',
    ],
    watchFor:
      'Finger 4 lagging behind the rest. It is the weakest finger on both hands, and the panel below will name it long before you feel it.',
  },
  'rh-down': {
    id: 'rh-down',
    hands: ['right'],
    play: 'together',
    variants: [plain('up', fingers('right', UP))],
    reversed: true,
    goal: 'The same five keys the other way: 5 is G coming down to 1 on C.',
    steps: [
      'Run it backwards until it is as steady as the way up.',
      'Then set Direction to Alternate — up, down, up, down, one run each.',
      'Say the numbers out loud as you go: five, four, three, two, one.',
    ],
    watchFor:
      'Being noticeably slower downward. The same five keys should cost the same either way; if they do not, this is the direction to spend time on.',
  },
  'lh-up': {
    id: 'lh-up',
    hands: ['left'],
    play: 'together',
    variants: [plain('up', fingers('left', DOWN))],
    reversed: false,
    goal: 'The left-hand home position, where the notes rise as the numbers fall: C is 5, G is 1.',
    steps: [
      'Play C up to G. The finger numbers count down while the notes count up.',
      'Say the number, not the note, as you press each key.',
      'The left hand sits an octave below the right on the board — that is where it lives when both play.',
    ],
    watchFor:
      'Reading the right hand’s numbers onto the left. C is 5 here, not 1, and that swap is the whole difficulty of this practice.',
  },
  'lh-down': {
    id: 'lh-down',
    hands: ['left'],
    play: 'together',
    variants: [plain('up', fingers('left', DOWN))],
    reversed: true,
    goal: 'Left hand from G down to C — thumb first, little finger last.',
    steps: [
      'Start on G with the thumb and walk down to C.',
      'Alternate with the way up once both are steady.',
      'Keep the wrist level; the hand should not rock as the thumb takes its turn.',
    ],
    watchFor:
      'The thumb thumping. It is the heaviest finger and it starts this run — even it out against 2 and 3.',
  },
  'rh-alternating': {
    id: 'rh-alternating',
    hands: ['right'],
    play: 'together',
    variants: [plain('alt', fingers('right', [1, 2, 1, 2, 1, 2]))],
    reversed: false,
    goal: 'Two fingers trading places — 1 and 2 alone, with the hand perfectly still.',
    steps: [
      'C, D, C, D, C, D. Only the two fingers move.',
      'Reverse it to start on D, then alternate.',
      'If the hand rocks side to side, slow down until it stops.',
    ],
    watchFor:
      'Moving the whole hand instead of the fingers. This is the first practice where a still hand matters more than the notes.',
  },
  'rh-odd': {
    id: 'rh-odd',
    hands: ['right'],
    play: 'together',
    variants: [plain('odd', fingers('right', [1, 3, 5, 3, 1]))],
    reversed: false,
    goal: 'Thumb, middle, little and back — 1-3-5-3-1 without the hand shifting.',
    steps: [
      'C, E, G, E, C. Skip a key every time.',
      'Keep 2 and 4 resting quietly on their own keys; they are not taking part.',
      'Very slowly at first — this one exposes independence problems faster than any other.',
    ],
    watchFor:
      'Fingers 2 and 4 lifting along with the ones playing. That is the weakness this practice exists to find.',
  },
  'rh-mixed': {
    id: 'rh-mixed',
    hands: ['right'],
    play: 'together',
    variants: [plain('mixed', fingers('right', [2, 4, 1, 3, 5]))],
    reversed: false,
    goal: '2-4-1-3-5 — an order your hand cannot guess, so each finger must be chosen.',
    steps: [
      'D, F, C, E, G. Read the next finger before you play the current one.',
      'Reverse gives 5-3-1-4-2; alternate between them once both hold together.',
      'Turn the pattern strip off when it starts to feel automatic.',
    ],
    watchFor:
      'Falling back into 1-2-3-4-5 under pressure. A stumble here is worth more than a clean run of the easy pattern.',
  },
  'lh-combo': {
    id: 'lh-combo',
    hands: ['left'],
    play: 'together',
    variants: [plain('combo', fingers('left', [5, 3, 1, 3, 5]))],
    reversed: false,
    goal: 'The left hand’s own independence run: 5-3-1-3-5 on C E G E C.',
    steps: [
      'Same keys as the right-hand odd-finger run, opposite numbering.',
      'It is symmetrical, so the aim is that every note sounds equally controlled.',
      'Play it without watching your hand once the shape is there.',
    ],
    watchFor:
      'The left hand being quietly worse than the right and getting less practice for it. Compare the evenness scores between the two.',
  },
  'both-same': {
    id: 'both-same',
    hands: ['right', 'left'],
    play: 'together',
    variants: [plain('same', bothHands(UP, DOWN))],
    reversed: false,
    goal: 'Both hands, same notes, mirrored fingers — landing together every time.',
    steps: [
      'Each step needs both keys: the right hand at C4, the left an octave below.',
      'Press either one first; the drill measures how far apart they were.',
      'Start together, change together, arrive together. That is the whole test.',
    ],
    watchFor:
      'One hand leading. The gap counter in the panel is the honest version of "together" — under 100ms is tight, over 250ms is two separate hands.',
  },
  'both-opposite': {
    id: 'both-opposite',
    hands: ['right', 'left'],
    play: 'together',
    variants: [plain('opposite', bothHands(UP, UP))],
    reversed: false,
    goal: 'Hands moving apart: right hand up from C, left hand down from G, at the same time.',
    steps: [
      'Both hands use fingers 1 to 5 — they simply travel in opposite directions.',
      'They meet in the middle on E, which is the step most people stumble on.',
      'Slowly. This is coordination, and coordination does not respond to hurrying.',
    ],
    watchFor:
      'The left hand copying the right. If it starts following instead of mirroring, drop to a single step at a time until it stops.',
  },
};

/* ---------------- 2.3 · Finger Independence ---------------- */

/** Every independence practice runs in one hand at a time, either hand. */
const EITHER: Pick<FivePatternConfig, 'hands' | 'play'> = {
  hands: ['right', 'left'],
  play: 'either',
};

const INDEPENDENCE: Readonly<Record<string, FivePatternConfig>> = {
  'non-sequential': {
    ...EITHER,
    id: 'non-sequential',
    variants: [plain('a', eitherHand([1, 3, 2, 4, 3, 5]))],
    reversed: false,
    goal: 'Break the habit of playing fingers in order: 1-3-2-4-3-5, and back.',
    steps: [
      'Play it very slowly. Reverse gives 5-3-4-2-3-1 — alternate once both hold.',
      'When 3 plays, 2 and 4 should not move with it. That is the whole exercise.',
      'Switch hands with the Hand control; the numbers stay the same, the notes do not.',
    ],
    watchFor:
      'Neighbouring fingers twitching along with the one playing. Slow down until only the chosen finger moves — pushing through builds the wrong habit.',
  },
  'reverse-irregular': {
    ...EITHER,
    id: 'reverse-irregular',
    variants: [plain('a', eitherHand([5, 3, 4, 2, 1]))],
    reversed: false,
    goal: 'The same idea backwards: 5-3-4-2-1, where the hand cannot coast downhill.',
    steps: [
      'Reverse gives 1-2-4-3-5. Five runs of each, then alternate.',
      'Before every note, name the next finger to yourself.',
      'Keep the wrist still — an irregular pattern tempts the arm to help.',
    ],
    watchFor:
      'The hand guessing the next finger and getting it right by luck. If a run comes out fast but you could not say what you played, slow it down.',
  },
  randomized: {
    ...EITHER,
    id: 'randomized',
    variants: [
      plain('a', eitherHand([1, 2, 4, 3, 5])),
      plain('b', eitherHand([1, 3, 2, 5, 4])),
      plain('c', eitherHand([2, 4, 1, 3, 5])),
      plain('d', eitherHand([5, 2, 4, 1, 3])),
    ],
    reversed: false,
    goal: 'Four unpredictable orders, drawn at random — see, decide, move, play.',
    steps: [
      'Leave the Pattern control on Mixed so you cannot settle into one of them.',
      'Do not memorise a run and fire it off; read the next finger each time.',
      'Three to five clean passes of each is plenty.',
    ],
    watchFor:
      'Speeding up on the pattern you happen to know and slowing on the others. The panel shows which fingers are costing you, whichever pattern they turn up in.',
  },
  'skip-fingers': {
    ...EITHER,
    id: 'skip-fingers',
    variants: [plain('a', eitherHand([1, 3, 5, 2, 4]))],
    reversed: false,
    goal: 'Jumping between fingers: 1-3-5-2-4, the groundwork for interval playing.',
    steps: [
      'Practise 1-3-5, pause, then 2-4, before joining them up.',
      'Reverse gives 4-2-5-3-1.',
      'The hand should not travel as a block — the fingers take turns while it stays put.',
    ],
    watchFor:
      'The wrist swinging to deliver each finger. If the hand moves, the fingers are not doing the work yet.',
  },
  'large-changes': {
    ...EITHER,
    id: 'large-changes',
    variants: [plain('a', eitherHand([2, 4, 1, 5, 3])), plain('b', eitherHand([3, 5, 1, 4, 2]))],
    reversed: false,
    goal: '2-4-1-5-3 — the biggest jumps between finger numbers there are.',
    steps: [
      'Start with pauses between every note: 2 … 4 … 1 … 5 … 3.',
      'Take the pauses out only when nothing else in the hand twitches.',
      'The second pattern, 3-5-1-4-2, is the same difficulty from another angle.',
    ],
    watchFor:
      'Tension creeping into the hand as the jumps get bigger. Stop and reset rather than pushing on — this bucket is neuromuscular, and tension trains in.',
  },
  repeated: {
    ...EITHER,
    id: 'repeated',
    variants: [
      { id: 'up', sequence: eitherHand(doubled(UP)) },
      { id: 'down', sequence: eitherHand(doubled(DOWN)) },
      { id: 'mixed', sequence: eitherHand(doubled([1, 3, 2, 5, 4])) },
      { id: 'scatter', sequence: eitherHand(doubled([2, 4, 1, 5, 3])) },
    ],
    reversed: false,
    goal: 'Two hits per finger — controlled, not dropped: 1-1-2-2-3-3-4-4-5-5.',
    steps: [
      'The second hit is the exercise. Keep the finger responsive between them.',
      'Not down-relax-down: controlled, then controlled again.',
      'The mixed orders make the repeat harder to coast through.',
    ],
    watchFor:
      'The two hits landing at different strengths or unevenly spaced. Evenness is the score to watch here more than anywhere else in the bucket.',
  },
  'hold-move': {
    ...EITHER,
    id: 'hold-move',
    variants: [
      { id: 'hold-1', label: 'Hold 1', sequence: holdRun(1, [2, 3, 4, 5]) },
      { id: 'hold-2', label: 'Hold 2', sequence: holdRun(2, [1, 3, 4, 5]) },
      { id: 'hold-3', label: 'Hold 3', sequence: holdRun(3, [1, 2, 4, 5]) },
      { id: 'hold-4', label: 'Hold 4', sequence: holdRun(4, [1, 2, 3, 5]) },
      { id: 'hold-5', label: 'Hold 5', sequence: holdRun(5, [1, 2, 3, 4]) },
    ],
    reversed: false,
    holdFirst: true,
    goal: 'One finger stays down while the others play — the real test of independence.',
    steps: [
      'Press the held key first; it stays down for the whole run. Then play the others in order.',
      'On screen the drill checks the order and warns if you retake the held key. The holding itself is yours to feel at the instrument.',
      'Change the held finger with the Pattern control, and give 4 and 5 the most time.',
    ],
    watchFor:
      'The held finger collapsing, or the whole hand tightening to keep it down. It should rest, not grip — if the wrist rises, stop and reset.',
  },
  accents: {
    ...EITHER,
    id: 'accents',
    variants: [plain('up', eitherHand(UP)), plain('down', eitherHand(DOWN))],
    reversed: false,
    accents: true,
    goal: 'One finger speaks, the others stay calm — an accent that costs the hand nothing.',
    steps: [
      'Each run marks a different finger to accent; the drill plays that note louder so you can hear the target.',
      'Make the accent with the finger alone. No arm, no wrist, no shoulder.',
      'The screen cannot hear you, so it watches the rhythm instead: an accent that disturbs the timing came from the arm.',
    ],
    watchFor:
      'The evenness score dropping on accent runs. That is the tell — a controlled accent leaves the timing exactly where it was.',
  },
};

export const FIVE_PATTERNS: Readonly<Record<string, FivePatternConfig>> = {
  ...FIVE_FINGER,
  ...INDEPENDENCE,
};

export function getFivePattern(id: string): FivePatternConfig {
  const config = FIVE_PATTERNS[id];
  if (!config) throw new Error(`Unknown five-finger pattern: ${id}`);
  return config;
}

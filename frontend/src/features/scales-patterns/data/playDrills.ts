import type { Hand } from '@/features/finger-training';
import type { KeyRef } from './relatives';
import { MINOR_KEYS } from './scaleDrills';

/**
 * Bucket 4.2's playing half, as data.
 *
 * Everything here is one scale — C major — under different conditions: one
 * hand, the other hand, both, slowly against a click, and started from a degree
 * that is not the root. The scale never changes, which is the point: what is
 * being learnt is the hand, not the notes.
 */

/** Which part of the scale a run covers. */
export type PlaySegment =
  /** All eight notes. */
  | 'full'
  /** Only the four notes around the thumb turn. */
  | 'crossing'
  /** Rotating four-note windows across the scale. */
  | 'groups';

/** Which measure a practice is really about, and so reports first. */
export type PlayFocus = 'notes' | 'evenness' | 'crossing' | 'timing';

export interface ScalePlayConfig {
  id: string;
  root: string;
  /** Which scale the root builds; major unless a practice says otherwise. */
  scale?: string;
  /**
   * Keys the practice may be run in.
   *
   * The technique bucket rotates through keys rather than living in C, because
   * a thumb that only turns under on F has learnt a position, not a movement.
   * Absent means the one key named by `root`.
   */
  keys?: readonly KeyRef[];
  /** How much of the scale a run covers; the whole thing unless stated. */
  segment?: PlaySegment;
  /** Notes per click. One unless a practice is deliberately subdividing. */
  subdivisions?: readonly number[];
  /** True when the tempo climbs on clean runs and drops back on a stumble. */
  ladder?: boolean;
  /** Consecutive clean runs the practice is asking for. */
  cleanTarget?: number;
  /** The measure this practice reports first; the notes unless stated. */
  focus?: PlayFocus;
  /** Directions offered; all three unless a practice narrows them. */
  directions?: readonly string[];
  /** Hands offered. Two entries with `together` means both at once. */
  hands: readonly Hand[];
  together: boolean;
  /** Play against a click, and score the timing. */
  metronome: boolean;
  /** Start from a drawn degree rather than the root. */
  randomStart: boolean;
  tempos: readonly number[];
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const base = {
  root: 'C',
  together: false,
  metronome: false,
  randomStart: false,
  tempos: [50, 60, 72],
} as const;

const C_MAJOR: Readonly<Record<string, ScalePlayConfig>> = {
  'rh-c': {
    ...base,
    id: 'rh-c',
    hands: ['right'],
    goal: 'C major in the right hand, thumb turning under after the third finger.',
    guidance: [
      'Fingering is 1-2-3 then 1-2-3-4-5: the thumb crosses under on F.',
      'Coming down it reverses, and the third finger crosses over the thumb.',
      'The crossing is marked in the strip, and its timing is measured on its own.',
    ],
    watchFor:
      'A bump at the crossing. The gap into the thumb note is scored separately, so you can see it rather than guess at it.',
  },
  'lh-c': {
    ...base,
    id: 'lh-c',
    hands: ['left'],
    goal: 'C major in the left hand, which crosses in a different place.',
    guidance: [
      'Fingering is 5-4-3-2-1 then 3-2-1: the third finger crosses over after the thumb on G.',
      'It is not the right hand mirrored — the crossing lands somewhere else.',
      'Slowly, and watch the crossing rather than the notes.',
    ],
    watchFor:
      'Assuming the left hand does what the right one does. Most people are much worse here and have not noticed.',
  },
  'together-c': {
    ...base,
    id: 'together-c',
    hands: ['right', 'left'],
    together: true,
    goal: 'Both hands, an octave apart, crossing in different places at the same time.',
    guidance: [
      'Each step needs both keys; press them in either order and the gap is measured.',
      'The hands cross at different moments, which is the whole difficulty.',
      'Under 100ms apart is together; slow down until it is.',
    ],
    watchFor:
      'One hand leading. It is nearly always the right, and nearly always at its own crossing.',
  },
  slow: {
    ...base,
    id: 'slow',
    hands: ['right', 'left'],
    metronome: true,
    tempos: [40, 50, 60],
    goal: 'One note per click, so every note gets the same amount of time as the others.',
    guidance: [
      'A bar of count-in, then one note per beat, up and back down.',
      'Evenness is the score to watch — a scale is judged on it more than on speed.',
      'Forty is not too slow. The crossing is where the evenness goes.',
    ],
    watchFor:
      'Hurrying the notes after the crossing to catch up. Evenness falls even when every note is right.',
  },
  'random-start': {
    ...base,
    id: 'random-start',
    hands: ['right', 'left'],
    randomStart: true,
    goal: 'The same seven notes started from a degree that is not the root.',
    guidance: [
      'The run begins on a drawn degree and carries on through the scale.',
      'The notes are identical; only where you enter changes.',
      'The panel scores by starting degree, so it names the ones your hand does not know.',
    ],
    watchFor:
      'Silently restarting from C. If a run beginning on A is much slower than one on C, the scale is still a sequence rather than a set of notes.',
  },
};

/* ---------------- 4.3 and 4.4 · the same scale in two more keys ---------------- */

/** What a key needs said about it before its three playing practices read right. */
interface PlayingSetOptions {
  /** Which scale the root builds; major unless given. */
  scale?: string;
  /** The note that makes this key what it is, if it has one. */
  accidental?: string;
  /** Where each hand's crossing lands, as a note name. */
  crossings: Readonly<Record<'right' | 'left', string>>;
}

/**
 * The three playing practices a key needs: each hand, then both.
 *
 * The three are identical in structure for every key, so the only thing worth
 * writing per key is what makes it awkward — the accidental to watch, and where
 * the thumb goes. A key with no accidental (A minor is the first) simply drops
 * that sentence rather than needing its own copy.
 */
function playingSet(root: string, options: PlayingSetOptions): readonly ScalePlayConfig[] {
  const { scale, accidental, crossings } = options;
  const name = `${root} ${scale === 'natural-minor' ? 'minor' : 'major'}`;
  const shared = {
    root,
    ...(scale ? { scale } : {}),
    together: false,
    metronome: false,
    randomStart: false,
    tempos: [50, 60, 72],
  } as const;

  return [
    {
      ...shared,
      id: `rh-${root.toLowerCase()}${scale === 'natural-minor' ? 'm' : ''}`,
      hands: ['right'],
      goal: accidental
        ? `${name} in the right hand, with ${accidental} where the formula puts it.`
        : `${name} in the right hand, thumb turning under after the third finger.`,
      guidance: [
        `Ascending fingering is shown in the strip; the thumb turns under on ${crossings.right}.`,
        'Correct notes, correct fingering, smooth thumb, relaxed hand — in that order.',
        'Then descending, which reverses the fingering and the crossing with it.',
      ],
      watchFor: accidental
        ? `Playing the natural instead of ${accidental}. It is the one note the hand has not met in C major.`
        : 'A bump at the crossing. The gap into the thumb note is scored on its own, so it shows rather than hides.',
    },
    {
      ...shared,
      id: `lh-${root.toLowerCase()}${scale === 'natural-minor' ? 'm' : ''}`,
      hands: ['left'],
      goal: `${name} in the left hand, which crosses somewhere else entirely.`,
      guidance: [
        `The third finger comes over the thumb on ${crossings.left}.`,
        'Play the two halves apart first, then join them up.',
        'The left hand feels less natural at first; give it the slower tempo.',
      ],
      watchFor:
        'Lifting the whole hand to deliver the crossing. It should be a small movement nobody watching would notice.',
    },
    {
      ...shared,
      id: `together-${root.toLowerCase()}${scale === 'natural-minor' ? 'm' : ''}`,
      hands: ['right', 'left'],
      together: true,
      goal: `${name} with both hands, crossing in two different places at once.`,
      guidance: [
        'One note per count, both hands moving together.',
        'Five clean repetitions before you think about tempo.',
        'The gap between the hands is measured; under 100ms is together.',
      ],
      watchFor:
        'One hand arriving first at its own crossing. That is where hands-together playing comes apart.',
    },
  ];
}

/* ---------------- 4.11 · technique, across keys ---------------- */

/**
 * The keys the reference rotates through.
 *
 * Technique practised in one key is a position rather than a movement, so every
 * 4.11 practice offers the rotation. The list is the reference's own day-by-day
 * cycle: five majors and the minor the level just built.
 */
const ROTATION: readonly KeyRef[] = [
  { root: 'C', scale: 'major' },
  { root: 'G', scale: 'major' },
  { root: 'D', scale: 'major' },
  { root: 'A', scale: 'major' },
  { root: 'F', scale: 'major' },
  { root: 'D', scale: 'natural-minor' },
];

const TECHNIQUE = {
  root: 'C',
  keys: ROTATION,
  hands: ['right', 'left'] as readonly Hand[],
  together: false,
  metronome: false,
  randomStart: false,
  tempos: [50, 60, 72],
} as const;

const TECHNIQUE_DRILLS: Readonly<Record<string, ScalePlayConfig>> = {
  'finger-numbers': {
    ...TECHNIQUE,
    id: 'finger-numbers',
    cleanTarget: 3,
    focus: 'notes',
    goal: 'The right finger on every note, three runs in a row, before anything else is worth doing.',
    guidance: [
      'The fingering is shown above the keys and in the strip. Say it before you play it.',
      'A wrong finger ends the run’s clean streak even when the note was right — that is the whole measure here.',
      'Rotate the key once three clean runs come easily; the numbers stay the same, the notes do not.',
    ],
    watchFor:
      'Getting the notes right with whatever finger is nearest. It works for one octave and blocks everything after it.',
  },
  'thumb-tuck': {
    ...TECHNIQUE,
    id: 'thumb-tuck',
    segment: 'crossing',
    cleanTarget: 5,
    focus: 'crossing',
    goal: 'Four notes: the ones either side of the thumb turning under, and nothing else.',
    guidance: [
      'The run is cut down to the crossing, so you get one hard transition per attempt instead of one per eight.',
      'Thumb bump compares the time into the thumb note against the notes around it. 1.0 is smooth.',
      'Do not lift the hand or twist the wrist — the thumb travels underneath on its own.',
    ],
    watchFor:
      'A bump above about 1.2. The note is on time by the clock and late to the ear, and that is what an accent sounds like.',
  },
  'finger-crossing': {
    ...TECHNIQUE,
    id: 'finger-crossing',
    segment: 'groups',
    cleanTarget: 5,
    focus: 'crossing',
    goal: 'Four-note windows across the whole scale, so every transition gets the same attention.',
    guidance: [
      'The window moves one group each run: the start, the middle, the top.',
      'Both hands cross, and they cross in different places — swap hands and the hard window moves.',
      'Small groups repeated beat whole scales repeated, because the difficulty is a fraction of a scale.',
    ],
    watchFor:
      'Practising only the group that already works. The panel scores by degree, so the one you avoid is the one it names.',
  },
  'even-notes': {
    ...TECHNIQUE,
    id: 'even-notes',
    cleanTarget: 3,
    focus: 'evenness',
    tempos: [40, 50, 60],
    goal: 'One continuous stream of notes rather than eight fingers taking turns.',
    guidance: [
      'Play slowly and watch evenness: it is the spread between the gaps, so 100% is a metronome.',
      'The fourth and fifth fingers are usually where it falls, and the thumb turn is where it falls furthest.',
      'Slower makes this harder, not easier — there is more room for a gap to be wrong.',
    ],
    watchFor:
      'Chasing the number by playing faster. Speed hides unevenness; it does not fix it.',
  },
  'slow-fast': {
    ...TECHNIQUE,
    id: 'slow-fast',
    metronome: true,
    ladder: true,
    cleanTarget: 3,
    focus: 'timing',
    tempos: [50, 60, 70, 80, 90, 100],
    goal: 'Speed earned rather than attempted: three clean runs move the tempo up, one stumble moves it back.',
    guidance: [
      'The tempo is not yours to set. Play cleanly and it climbs; miss and it drops ten.',
      'The number you settle at is your real tempo, which is usually well below the one you would have chosen.',
      'Accuracy is the input and speed is the output, in that order.',
    ],
    watchFor:
      'Fighting the ladder back up after a drop. It dropped because the last run was not clean; the fix is the next clean run, not a faster one.',
  },
  'metronome': {
    ...TECHNIQUE,
    id: 'metronome',
    metronome: true,
    subdivisions: [1, 2, 4],
    cleanTarget: 3,
    focus: 'timing',
    tempos: [60, 70, 80],
    goal: 'The click sets the tempo, not your fingers — at one, two and four notes per beat.',
    guidance: [
      'One note per click first, and only then two. Four is a long way after that.',
      'On the beat counts how many notes landed inside the slot; the bias says which way you drift.',
      'Finish at the tempo you started, and see whether it got harder. That is tension showing up.',
    ],
    watchFor:
      'Speeding up through the easy notes and waiting at the crossing. The average tempo looks right and nothing was in time.',
  },
  'accent-free': {
    ...TECHNIQUE,
    id: 'accent-free',
    segment: 'full',
    cleanTarget: 3,
    focus: 'crossing',
    tempos: [40, 50, 60],
    goal: 'Nobody listening should be able to tell which finger played which note.',
    guidance: [
      'A screen cannot hear volume, so this measures the thing that comes with an accent: the hesitation before it.',
      'Thumb bump is the time into the thumb note against every other note. Under 1.15 and the join is invisible.',
      'Play it slowly with your eyes closed and ask where you can hear the hand change. Then check the number.',
    ],
    watchFor:
      'Treating an even-looking evenness score as accent-free. Evenness averages the whole run; the bump is about one note.',
  },
  'up-and-down': {
    ...TECHNIQUE,
    id: 'up-and-down',
    directions: ['both'],
    metronome: true,
    cleanTarget: 3,
    focus: 'evenness',
    tempos: [50, 60, 72],
    goal: 'The whole scale up and back down, in one movement, without a seam at the top.',
    guidance: [
      'Direction is fixed: fifteen notes, no stopping at the turn.',
      'Coming down reverses the fingering, so the crossing arrives in a different place and usually costs more.',
      'No restarting after a small mistake — stay with the beat and finish, the way a performance goes.',
    ],
    watchFor:
      'A pause at the top note while the hand works out the way back. It shows up in evenness as one long gap.',
  },
};

export const SCALE_PLAY_DRILLS: Readonly<Record<string, ScalePlayConfig>> = {
  ...TECHNIQUE_DRILLS,
  ...C_MAJOR,
  ...Object.fromEntries(
    [
      ...playingSet('G', { accidental: 'F#', crossings: { right: 'C', left: 'E' } }),
      ...playingSet('F', { accidental: 'Bb', crossings: { right: 'C', left: 'D' } }),
      // 4.7, 4.8 and 4.9. Each minor key borrows its major's fingering
      // unchanged, so what moves is the note under the crossing, not the
      // finger that makes it — which the key table records and the checks
      // verify against the fingering itself.
      ...MINOR_KEYS.flatMap((entry) =>
        playingSet(entry.root, { scale: 'natural-minor', crossings: entry.crossings }),
      ),
    ].map((config) => [config.id, config]),
  ),
};

export function getScalePlayDrill(id: string): ScalePlayConfig {
  const config = SCALE_PLAY_DRILLS[id];
  if (!config) throw new Error(`Unknown scale play drill: ${id}`);
  return config;
}

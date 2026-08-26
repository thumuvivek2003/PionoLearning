import type { ChordQuality, Inversion, TriadQuality } from '../chords.types';
import {
  FLAT_ROOTS,
  NATURAL_ROOTS,
  QUALITIES,
  SEVENTH_QUALITIES,
  SHARP_ROOTS,
  THIRD_AT,
  TRIAD_ROOTS,
  chordForm,
  formulaLine,
  isAllWhite,
  landmarkFor,
  qualityName,
  triadOf,
} from './triads';
import { patternOf } from './inversions';

/**
 * The building half of 5.1, as data.
 *
 * Five practices that are one action — put the notes of a triad under your hand
 * — with different amounts taken away. The first shows the degree you are on
 * and asks for one note at a time; the last gives a root and a quality and
 * starts a clock. Nothing between them is a different exercise.
 */
export interface TriadBuildConfig {
  id: string;
  /**
   * How many notes a round asks for.
   *
   * `[1, 2, 3]` walks up the stack — one note, then two, then three — which is
   * 5.1.1's whole argument that a chord is notes sounding together. Everything
   * later asks for all three.
   */
  sizes: readonly number[];
  qualities: readonly ChordQuality[];
  /**
   * Positions the practice may ask for. Root position only unless stated.
   *
   * A chord is asked for in one of these each round; positions the chord does
   * not have — a triad's third inversion — are dropped rather than skipped, so
   * a mixed pool of triads and sevenths needs no special case.
   */
  inversions?: readonly Inversion[];
  roots: readonly string[];
  /** Show which degree is being asked for, 1 then 3 then 5. */
  cues: boolean;
  /** Per-chord allowance in ms. 0 turns the clock off. */
  deadlineMs: number;
  /** Tighter allowances the practice steps through as the rounds go by. */
  ladder: readonly number[];
  /** Sound the chord once it is complete, so the build has a result. */
  sound: boolean;
  /**
   * How the next chord is chosen.
   *
   * `'roots'` swaps between the roots in the pool rather than drawing freely,
   * which is what the references mean by "Cm → Dm → Cm → Dm": the skill being
   * trained is changing shape, and a random draw lets the same chord repeat.
   * `'quality'` keeps the root and flips major to minor, so only the third
   * moves. `'inversion'` keeps the chord and walks its positions in order,
   * which is the root → 1st → 2nd → root cycle 5.4 drills. Absent draws at
   * random.
   */
  alternate?: 'roots' | 'quality' | 'inversion';
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const base = {
  sizes: [3],
  qualities: QUALITIES,
  roots: NATURAL_ROOTS,
  cues: false,
  deadlineMs: 0,
  ladder: [] as readonly number[],
  sound: true,
} as const;

/* ---------------- 5.2 and 5.3 · one chord at a time ---------------- */

/**
 * A single chord's practice, generated from the chord.
 *
 * Fourteen of the twenty practices in these two buckets are the same session
 * pointed at a different chord — build it, play it, alternate it against the
 * one before. The references differ only in which notes they print and which
 * black key they describe, and both of those are readable off the triad, so
 * nothing here writes them out by hand. What a chord cannot tell us is which
 * chord came before it in the teaching order, and that is the only argument.
 */
function chordSession(root: string, quality: TriadQuality, previous: string): TriadBuildConfig {
  const triad = triadOf(root, quality);
  const notes = triad?.notes.map((note) => note.name).join(' - ') ?? root;
  const third = triad?.notes[THIRD_AT];
  const white = triad ? isAllWhite(triad) : false;

  return {
    ...base,
    id: `${root.toLowerCase()}-${quality}`,
    qualities: [quality],
    // The chord before it is in the pool too: alternating between two shapes is
    // what the references drill, and a chord practised alone stays a picture.
    roots: [root, previous],
    alternate: 'roots',
    cues: false,
    goal: `${triad?.symbol ?? root} = ${notes}${white ? ', every note a white key' : ''}.`,
    guidance: [
      `${root} ${quality} is ${notes}. Root, third, fifth — lowest first.`,
      third ? landmarkFor(third) : `The third is what makes it ${quality}.`,
      `It alternates with ${previous} ${quality}, because moving between two shapes is the skill; holding one is not.`,
    ],
    watchFor: white
      ? 'Finding it by shape and never checking the notes. A white-key chord is easy to place and easy to place one key out.'
      : `Reaching for the white key next to ${third?.name ?? 'the third'}. That is the note the whole chord turns on.`,
  };
}

/** The teaching order, each chord paired with the one it is drilled against. */
const SESSION_ORDER: readonly (readonly [string, string])[] = [
  ['C', 'G'],
  ['D', 'C'],
  ['E', 'D'],
  ['F', 'C'],
  ['G', 'F'],
  ['A', 'G'],
  ['B', 'A'],
];

const SESSIONS: Readonly<Record<string, TriadBuildConfig>> = Object.fromEntries(
  QUALITIES.flatMap((quality) =>
    SESSION_ORDER.map(([root, previous]) => {
      const config = chordSession(root, quality, previous);
      return [config.id, config] as const;
    }),
  ),
);

/** 5.2.8 and 5.3.8 — the five chords whose roots are black keys. */
function blackKeySet(quality: TriadQuality): TriadBuildConfig {
  const word = quality === 'major' ? 'major' : 'minor';

  return {
    ...base,
    id: `black-${quality}`,
    qualities: [quality],
    roots: SHARP_ROOTS,
    goal: `The five ${word} chords built on black keys — the half of the twelve that gets skipped.`,
    guidance: [
      `${SHARP_ROOTS.join(', ')} — one a day, then all five together.`,
      'A black root is not a harder chord, it is an unfamiliar one. The formula has not changed.',
      'Scores are kept per chord, so the panel names whichever of the five you keep avoiding.',
    ],
    watchFor:
      'Treating a black key as a special case and slowing down for it. The third is still three or four semitones up, whatever colour the root is.',
  };
}

/** 5.2.9's other half — the same chords called by their flat names. */
const FLAT_NAMING: TriadBuildConfig = {
  ...base,
  id: 'flat-naming',
  qualities: ['major'],
  roots: FLAT_ROOTS,
  goal: 'The same five black-key chords, asked for by their flat names.',
  guidance: [
    `${FLAT_ROOTS.join(', ')} — the names a contest is just as likely to use.`,
    'Ab major and G# major are the same three keys. Only the spelling on the page changed.',
    'The notes are spelled to match the name, so Ab major arrives as Ab C Eb rather than G# C D#.',
  ],
  watchFor:
    'Translating to the sharp name first and then playing. It works and it costs you a second every time; the flat name should reach the hand directly.',
};

/** 5.3.9 — the same root, both qualities, one note apart. */
const QUALITY_SWITCH: TriadBuildConfig = {
  ...base,
  id: 'quality-switch',
  roots: NATURAL_ROOTS,
  alternate: 'quality',
  deadlineMs: 4000,
  goal: 'C then Cm then C then Cm: the root stays, the third moves, and the hand has to notice.',
  guidance: [
    'Rounds come in pairs on the same root — major, then its minor.',
    'Only the middle note changes. If your whole hand moves, it is moving further than the chord did.',
    'Four seconds a chord, so the decision has to be made before you start rather than during.',
  ],
  watchFor:
    'Playing the major both times on the roots you know best. The quality is the question here, and C is where it is easiest to stop reading.',
};

/** 5.2.10 and 5.3.10 — all twelve, drawn at random, against the clock. */
function twelveDrill(quality: TriadQuality): TriadBuildConfig {
  const word = quality === 'major' ? 'major' : 'minor';

  return {
    ...base,
    id: `twelve-${quality}`,
    qualities: [quality],
    roots: TRIAD_ROOTS,
    deadlineMs: 5000,
    ladder: [5000, 3000, 2000],
    goal: `All twelve ${word} chords, drawn at random, five seconds down to two.`,
    guidance: [
      'The bucket’s final test. No order to lean on and no chart to check against.',
      'The allowance tightens as the session runs — the reference’s three weeks in one sitting.',
      'The panel scores every chord separately, so the four or five that are slow get named rather than averaged away.',
    ],
    watchFor:
      'Rebuilding from the formula every time. That is the backup system working; the chords that need it are the ones still to learn.',
  };
}

/* ---------------- 5.4 · positions ---------------- */

const POSITIONS: readonly Inversion[] = [0, 1, 2];

/** 5.4.1–5.4.3 — one position at a time, added to the ones before it. */
function positionSession(
  upTo: Inversion,
  goal: string,
  guidance: readonly string[],
  watchFor: string,
): TriadBuildConfig {
  return {
    ...base,
    id: `position-${upTo}`,
    qualities: ['major'],
    roots: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    // Positions are walked in order rather than drawn, because the movement
    // between them is what is being learnt — root, then 1st, then back.
    inversions: POSITIONS.slice(0, upTo + 1) as readonly Inversion[],
    alternate: 'inversion',
    cues: true,
    goal,
    guidance,
    watchFor,
  };
}

/** 5.4.5 and 5.4.6 — all three positions of every chord of one quality. */
function allPositions(quality: TriadQuality): TriadBuildConfig {
  return {
    ...base,
    id: `positions-${quality}`,
    qualities: [quality],
    roots: NATURAL_ROOTS,
    inversions: POSITIONS,
    goal: `Root, 1st and 2nd position of all seven natural-root ${quality} chords.`,
    guidance: [
      'A chord and a position are named; play that shape from the bottom up.',
      'Twenty-one shapes in all, but only seven chords — the pattern is 1-3-5, 3-5-1, 5-1-3 every time.',
      'Scores are kept per chord and per position, so the panel names the shape you keep hunting for.',
    ],
    watchFor:
      'Building the root position and then rotating it in your head. That works and it is slow; the inverted shape has to be its own thing.',
  };
}

/** 5.4.7 — the positions of one chord, cycled without stopping. */
const SWITCHING: TriadBuildConfig = {
  ...base,
  id: 'inversion-switching',
  qualities: QUALITIES,
  roots: NATURAL_ROOTS,
  inversions: POSITIONS,
  alternate: 'inversion',
  goal: 'Root → 1st → 2nd → root, on one chord, until the movement stops needing thought.',
  guidance: [
    'The chord stays and the position moves, one step each round.',
    'Look at the shape rather than the individual keys — that is the difference between recognising a position and working it out.',
    'Both qualities are in the pool, so the pattern has to hold with a flat third as well.',
  ],
  watchFor:
    'Losing the chord while changing position. If the notes change, the position did not move — a different chord did.',
};

/** 5.4.10 — root, quality and position all drawn at random, against a clock. */
const RANDOM_INVERSION: TriadBuildConfig = {
  ...base,
  id: 'random-inversion',
  qualities: QUALITIES,
  roots: TRIAD_ROOTS,
  inversions: POSITIONS,
  deadlineMs: 5000,
  ladder: [5000, 3000, 2000],
  goal: 'Any root, either quality, any position — five seconds down to two.',
  guidance: [
    'Three decisions in one prompt: which chord, which third, which position.',
    'Seventy-two shapes in the pool, and the panel scores every one of them separately.',
    'The bucket’s final test. Out of time counts as a miss.',
  ],
  watchFor:
    'Getting the chord right and the position wrong. They are scored together, so a shape you place in the wrong octave still reads as a miss — which is what a wrong bass note is.',
};

/* ---------------- 5.5 · sevenths ---------------- */

/** 5.5.1 — the triad, then the same chord with its seventh on top. */
const WHAT_IS_A_SEVENTH: TriadBuildConfig = {
  ...base,
  id: 'what-is-a-seventh',
  qualities: ['maj7'],
  roots: ['C', 'F', 'G'],
  sizes: [3, 4],
  cues: true,
  goal: 'Three notes, then four: a seventh chord is a triad with one more note stacked on it.',
  guidance: [
    'Some rounds ask for the triad and some for all four notes. Same chord either way.',
    'Each round sounds what you built, so the extra note is something you hear rather than something you are told about.',
    'The seventh is a third above the fifth — the stack just keeps going.',
  ],
  watchFor:
    'Treating a seventh chord as a new shape to memorise. It is 1-3-5 with a 7 on top, and the 1-3-5 is already yours.',
};

/** 5.5.2–5.5.4 — one seventh type across the roots the reference lists. */
function seventhFormula(quality: ChordQuality): TriadBuildConfig {
  return {
    ...base,
    id: `${quality}-formula`,
    qualities: [quality],
    roots: ['C', 'D', 'F', 'G', 'A'],
    goal: `${qualityName(quality)}: ${formulaLine(quality)}.`,
    guidance: [
      `${qualityName(quality)} chords on C, D, F, G and A — the five the reference drills first.`,
      quality === 'maj7'
        ? 'A major triad with a major seventh: the seventh is one semitone below the octave.'
        : quality === 'dom7'
          ? 'A major triad with a flat seventh. One note below maj7, and it is what makes the chord want to resolve.'
          : 'A minor triad with a flat seventh — the third and the seventh are both lowered.',
      'Timing is banked per degree, so the note this quality actually changes is the one reported.',
    ],
    watchFor:
      quality === 'dom7'
        ? 'Playing the major seventh out of habit. Cmaj7 and C7 differ by one semitone at the top and sound nothing alike.'
        : quality === 'min7'
          ? 'Lowering the third and forgetting the seventh, which leaves a minor triad with a wrong note on top.'
          : 'Reaching an octave instead of a seventh. One semitone short of home is the whole colour of the chord.',
  };
}

/** 5.5.5–5.5.7 — one chord on one root, mastered in every position. */
function seventhMastery(quality: ChordQuality): TriadBuildConfig {
  return {
    ...base,
    id: `${quality}-mastery`,
    qualities: [quality],
    roots: ['C'],
    inversions: [0, 1, 2, 3],
    alternate: 'inversion',
    goal: `${chordForm('C', quality)?.symbol ?? ''} in all four of its positions, walked in order.`,
    guidance: [
      `Root position first, then each inversion in turn: ${[0, 1, 2, 3]
        .map((entry) => patternOf(chordForm('C', quality)!, entry as Inversion))
        .join(', ')}.`,
      'One chord, one root, four shapes. This is the mastery session, not a variety session.',
      'A four-note chord has four positions, which is one more place for the hand to get lost than a triad has.',
    ],
    watchFor:
      'Rotating the root-position shape in your head each time. By the fourth position that is four rotations, and the shape should arrive whole.',
  };
}

/** 5.5.9 — the positions of all three seventh types. */
const SEVENTH_INVERSIONS: TriadBuildConfig = {
  ...base,
  id: 'seventh-inversions',
  qualities: SEVENTH_QUALITIES,
  roots: ['C', 'F', 'G', 'D'],
  inversions: [0, 1, 2, 3],
  goal: 'All four positions of maj7, 7 and m7 — sixteen shapes per root.',
  guidance: [
    'A chord, a quality and a position are named; play the shape.',
    'The rotation rule is the same as a triad’s, with one more note to carry round.',
    'Scores are kept per chord and position, so the sparse ones get named rather than averaged.',
  ],
  watchFor:
    'Third inversion. Its lowest note is the seventh, which is the one place a chord stops looking like itself.',
};

/** 5.5.10 — the three types across many roots, against the clock. */
const RANDOM_SEVENTH: TriadBuildConfig = {
  ...base,
  id: 'random-seventh',
  qualities: SEVENTH_QUALITIES,
  roots: NATURAL_ROOTS,
  deadlineMs: 5000,
  ladder: [5000, 4000, 3000],
  goal: 'maj7, 7 or m7 on any natural root, inside three seconds by the end.',
  guidance: [
    'The reference’s three rounds run automatically as the allowance tightens.',
    'Three qualities that differ by one or two notes, so the quality has to be read before you start.',
    'Out of time counts as a miss, exactly like a wrong note.',
  ],
  watchFor:
    'Confusing 7 with maj7 under time pressure. They differ at one note and are the two most common seventh chords there are.',
};

export const TRIAD_BUILD_DRILLS: Readonly<Record<string, TriadBuildConfig>> = {
  'what-is-a-chord': {
    ...base,
    id: 'what-is-a-chord',
    sizes: [1, 2, 3],
    qualities: ['major'],
    roots: ['C', 'D', 'E', 'F', 'G'],
    cues: true,
    goal: 'One note, then two, then three — and hearing what changes each time.',
    guidance: [
      'A root is given. Play just it, then it and the third, then all three.',
      'Each round sounds what you built, so the difference between one note and a chord is audible rather than described.',
      'No quality decisions yet. This is only about notes sounding together.',
    ],
    watchFor:
      'Skipping the one-note and two-note rounds. The point of the stack is the comparison, and there is nothing to compare if you always play three.',
  },
  'triad-concept': {
    ...base,
    id: 'triad-concept',
    qualities: ['major'],
    roots: ['C', 'D', 'E', 'F', 'G'],
    cues: true,
    goal: 'Three notes, taken as the 1st, 3rd and 5th of the scale you are standing on.',
    guidance: [
      'The degree you are on is shown as you go: 1, then 3, then 5.',
      'The reference’s five roots, so the shape is met before the twelve keys are.',
      'Think root → third → fifth rather than the chord’s name. The name comes later.',
    ],
    watchFor:
      'Playing a shape you recognise instead of counting the degrees. From C and G those give the same answer, and from E they do not.',
  },
  'major-formula': {
    ...base,
    id: 'major-formula',
    qualities: ['major'],
    roots: TRIAD_ROOTS,
    goal: '1 - 3 - 5, applied from any root, with no cues and no chord chart.',
    guidance: [
      'A root arrives; build its major triad. All twelve are in the pool.',
      'The time to each of the three tones is measured separately, so a slow third shows as one.',
      'Do not recall the chord — apply the formula. The two come apart on the roots you have not drilled.',
    ],
    watchFor:
      'Hesitating before the third and calling it thinking. The third is the note the formula is for, and it should not be the slow one.',
  },
  'minor-formula': {
    ...base,
    id: 'minor-formula',
    qualities: ['minor'],
    roots: TRIAD_ROOTS,
    goal: '1 - ♭3 - 5: the same chord with its third dropped one semitone.',
    guidance: [
      'Build the minor triad from the root given. Only the third moves.',
      'The fifth is identical to the major’s, which is why it is never the note that catches you.',
      'A minor third is three semitones above the root. If you are counting four, you have built a major.',
    ],
    watchFor:
      'Flattening the wrong note. Dropping the fifth gives a diminished chord, which is a different thing entirely.',
  },
  'construction-drill': {
    ...base,
    id: 'construction-drill',
    roots: TRIAD_ROOTS,
    deadlineMs: 5000,
    ladder: [5000, 3000, 2000],
    goal: 'Random root, random quality, against the clock: five seconds down to two.',
    guidance: [
      'Majors and minors are drawn from the same pool, so the quality is part of the question.',
      'The allowance tightens as the session runs — the reference’s five, three, two.',
      'Out of time counts as a miss. A chord you can build in eight seconds is not built.',
    ],
    watchFor:
      'Reading the quality after starting to play. The third is the second note you press, and by then the decision is already made.',
  },
  ...SESSIONS,
  'black-major': blackKeySet('major'),
  'black-minor': blackKeySet('minor'),
  'flat-naming': FLAT_NAMING,
  'quality-switch': QUALITY_SWITCH,
  'twelve-major': twelveDrill('major'),
  'twelve-minor': twelveDrill('minor'),
  'position-0': positionSession(
    0,
    'Root position: the root at the bottom, then the third, then the fifth.',
    [
      'A chord is named; play it with its root as the lowest note.',
      'Seven chords, one shape each. This is the position everything else is measured against.',
      'The fingering is 1-3-5 in the right hand, and the shape is the same in every key.',
    ],
    'Calculating each note. By now the root position of a natural-root major chord should arrive whole.',
  ),
  'position-1': positionSession(
    1,
    'First inversion: the root moves to the top and 1-3-5 becomes 3-5-1.',
    [
      'Rounds alternate between root position and first inversion on the same chord.',
      'C-E-G becomes E-G-C. It is still C major — only the order changed.',
      'The lowest note is now the third, which is what names the position.',
    ],
    'Hearing a different chord. E-G-C is not E minor with a wrong note; it is C major, and the ear has to learn that.',
  ),
  'position-2': positionSession(
    2,
    'Second inversion: 5-1-3, with the fifth at the bottom.',
    [
      'The cycle is root → 1st → 2nd → root, one step each round, without stopping.',
      'C-E-G → E-G-C → G-C-E. Every step moves the lowest note to the top.',
      'Three positions is all a triad has; after 5-1-3 the next rotation is root position an octave up.',
    ],
    'Skipping to the shape you know. The point of the cycle is the movement between positions, not the positions themselves.',
  ),
  'positions-major': allPositions('major'),
  'positions-minor': allPositions('minor'),
  'inversion-switching': SWITCHING,
  'random-inversion': RANDOM_INVERSION,
  'what-is-a-seventh': WHAT_IS_A_SEVENTH,
  'maj7-formula': seventhFormula('maj7'),
  'dom7-formula': seventhFormula('dom7'),
  'min7-formula': seventhFormula('min7'),
  'maj7-mastery': seventhMastery('maj7'),
  'dom7-mastery': seventhMastery('dom7'),
  'min7-mastery': seventhMastery('min7'),
  'seventh-inversions': SEVENTH_INVERSIONS,
  'random-seventh': RANDOM_SEVENTH,
  /* 5.10.9 — root, quality and position drawn together, against a clock. */
  'song-random': {
    ...base,
    id: 'song-random',
    qualities: ['major', 'minor', 'maj7', 'dom7', 'min7'],
    roots: TRIAD_ROOTS,
    inversions: [0, 1, 2],
    deadlineMs: 5000,
    ladder: [5000, 3000, 2000],
    goal: 'Any root, any of five qualities, any position — five seconds down to two.',
    guidance: [
      'The widest pool in the level: twelve roots, five qualities, and every position each chord has.',
      'Three decisions before your hand moves, and the clock counts all of them.',
      'Scores are kept per chord and position, so the handful you keep failing get named rather than averaged.',
    ],
    watchFor:
      'Reading the root, starting to play, and reading the quality afterwards. The third is the second note you press, and by then it is too late.',
  },
};

export function getTriadBuildDrill(id: string): TriadBuildConfig {
  const config = TRIAD_BUILD_DRILLS[id];
  if (!config) throw new Error(`Unknown triad build drill: ${id}`);
  return config;
}

/** The allowance for a round, stepping through the ladder as the session runs. */
export function allowanceAt(config: TriadBuildConfig, round: number, perRung = 5): number {
  if (config.ladder.length === 0) return config.deadlineMs;
  const rung = Math.min(config.ladder.length - 1, Math.floor(round / perRung));
  return config.ladder[rung] ?? config.deadlineMs;
}

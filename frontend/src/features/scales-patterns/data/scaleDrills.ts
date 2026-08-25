import type { Step } from './steps';
import { MAJOR, MINOR, relativeMajorOf } from './relatives';
import type { KeyRef } from './relatives';
import { RECOGNITION_KEYS } from './readDrills';
import { halfStepDegrees } from './steps';
import { scaleShape } from './scaleShapes';
import {
  accidentalOrder,
  accidentalsNamed,
  flatKeys,
  keySummary,
  majorKey,
  sharpKeys,
} from './keyFamily';
import type { AccidentalKind } from './keyFamily';

/**
 * Buckets 4.1 and 4.2 as data.
 *
 * The level has one idea in it — a formula turns a starting note into a scale —
 * so the practices are that idea approached from different sides: the steps on
 * their own, the formula recited, the formula applied, and then the result
 * played with both hands. Which side a practice takes is the config.
 */

/** What a knowledge practice asks about. */
export type QuizTask =
  /** A key is lit; press the one a given step away. */
  | 'step-up'
  /** Two keys are lit; say whether that is a whole step or a half. */
  | 'step-name'
  /** Name or find a numbered degree of the scale. */
  | 'degree'
  /** Is this note in the scale or not? */
  | 'membership'
  /** Natural or altered at this degree — the F# and Bb question. */
  | 'accidental'
  /** Which degree differs between two scales. */
  | 'difference'
  /** How many sharps or flats a key carries. */
  | 'signature'
  /** The minor that shares a major's notes, or the major that shares a minor's. */
  | 'relative'
  /** Do these two scales hold the same seven notes? */
  | 'shares'
  /** A note of the scale is named; give its degree number. */
  | 'position'
  /** A note of the scale is named; play the one either side of it. */
  | 'neighbour'
  /** Which accidental comes next in the order sharps or flats accumulate. */
  | 'order';

export interface ScaleQuizConfig {
  id: string;
  tasks: readonly QuizTask[];
  /** Steps in play, for the interval tasks. */
  steps: readonly Step[];
  /** The scale the degree and membership tasks are about. */
  root: string;
  /** Which scale type the root builds; major unless a practice says otherwise. */
  scale?: string;
  /**
   * Ask downwards as well as upwards.
   *
   * The relative task reads it as "ask from the minor side too", which is the
   * same idea — the question run backwards.
   */
  bothWays: boolean;
  /** Scales set beside this one, for the comparison practices. */
  compareWith?: readonly string[];
  /** The scale type the comparisons build; major unless stated. */
  compareScale?: string;
  /** Which accumulation order the ordering task walks. */
  accidentalOrder?: AccidentalKind;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const CORE: Readonly<Record<string, ScaleQuizConfig>> = {
  whole: {
    id: 'whole',
    tasks: ['step-up', 'step-name'],
    steps: ['W'],
    root: 'C',
    bothWays: true,
    goal: 'A whole step is two keys — counting the black ones — in either direction.',
    guidance: [
      'A key lights up; press the one a whole step away, up or down as asked.',
      'Two keys along, black keys included. E to F# is a whole step; E to F is not.',
      'Name it mode turns it round: two keys light and you say what the gap is.',
    ],
    watchFor:
      'Counting white keys only. Half the trouble with scales comes from treating E–F and B–C like every other pair.',
  },
  half: {
    id: 'half',
    tasks: ['step-up', 'step-name'],
    steps: ['H'],
    root: 'C',
    bothWays: true,
    goal: 'A half step is the very next key — nothing between, whatever colour it is.',
    guidance: [
      'Press the key immediately next to the lit one, in the direction asked.',
      'E to F and B to C are half steps with no black key involved. Those two are the whole point.',
      'Mixed mode puts whole and half steps in the same pool.',
    ],
    watchFor:
      'Skipping over a black key. "Next key" means next, including the black ones — that is what makes it a half step.',
  },
  'c-notes': {
    id: 'c-notes',
    tasks: ['degree', 'membership'],
    steps: ['W', 'H'],
    root: 'C',
    bothWays: false,
    goal: 'The seven notes of C major, by name and by number.',
    guidance: [
      'Find the fifth degree, name the third, say whether F# belongs.',
      'C major is the one scale with no sharps or flats — every white key, in order.',
      'Degrees matter more than names later; the fifth is a job, not just a letter.',
    ],
    watchFor:
      'Counting up from C every time. The fifth of C should arrive as G, not as "C, D, E, F, G".',
  },
};

/* ---------------- 4.3 and 4.4 · one sharp, then one flat ---------------- */

/** The notes practice for a key whose accidental is the whole story. */
function notesOf(
  id: string,
  root: string,
  accidental: string,
  landmark: string,
  goal: string,
  watchFor: string,
): ScaleQuizConfig {
  return {
    id,
    tasks: ['degree', 'membership'],
    steps: ['W', 'H'],
    root,
    bothWays: false,
    goal,
    guidance: [
      `${root} major has one black key: ${accidental}. Everything else is white.`,
      landmark,
      'Degrees first, names second — the fifth is a job before it is a letter.',
    ],
    watchFor,
  };
}

/** The accidental practice: natural or altered, and why. */
function accidentalOf(
  id: string,
  root: string,
  accidental: string,
  natural: string,
  reason: string,
  watchFor: string,
): ScaleQuizConfig {
  return {
    id,
    tasks: ['accidental', 'membership'],
    steps: ['W', 'H'],
    root,
    bothWays: false,
    goal: `${accidental}, not ${natural} — and the reason, not just the fact.`,
    guidance: [
      `Each prompt names a degree of ${root} major; choose the natural or the altered note.`,
      reason,
      `In or out mode mixes ${natural} and ${accidental} with everything else, so the pair has to be told apart at speed.`,
    ],
    watchFor,
  };
}

const KEYS: Readonly<Record<string, ScaleQuizConfig>> = {
  'g-notes': notesOf(
    'g-notes',
    'G',
    'F#',
    'G is the white key immediately left of a group of three black keys.',
    'G major by name and by number: G A B C D E F# G.',
    'Answering the seventh as F. That one note is the whole difference between G major and a wrong scale.',
  ),
  'f-sharp': accidentalOf(
    'f-sharp',
    'G',
    'F#',
    'F',
    'E to F is a half step, and the sixth to seventh has to be a whole one — so the seventh is F#, and F# to G closes with the half step the formula wants.',
    'Choosing F because it is white. The formula does not care what colour a key is.',
  ),
  'f-notes': notesOf(
    'f-notes',
    'F',
    'Bb',
    'F is the white key immediately left of a group of three black keys — the same landmark as G, one key along.',
    'F major by name and by number: F G A Bb C D E F.',
    'Answering the fourth as B. F major is the first scale where the accidental arrives early rather than at the end.',
  ),
  'b-flat': accidentalOf(
    'b-flat',
    'F',
    'Bb',
    'B',
    'A to B is a whole step, and the third to fourth has to be a half one — so the fourth is Bb, the black key immediately left of B.',
    'Confusing Bb with A#. Same key, but in F major it is spelled Bb, because every letter appears exactly once.',
  ),
  'c-g': {
    id: 'c-g',
    tasks: ['difference', 'signature'],
    steps: ['W', 'H'],
    root: 'G',
    bothWays: false,
    compareWith: ['C'],
    goal: 'C major and G major, side by side: one note apart and one sharp different.',
    guidance: [
      'Which degree differs, and how many sharps does each key carry?',
      'G major is not "C major moved" — it is a scale with one sharp, and the sharp is F#.',
      'Answer the degree, then say why that degree had to change.',
    ],
    watchFor:
      'Remembering "G has an F#" without knowing it is the seventh degree. The position is what transfers to the next key.',
  },
  'c-g-f': {
    id: 'c-g-f',
    tasks: ['difference', 'signature'],
    steps: ['W', 'H'],
    root: 'F',
    bothWays: false,
    compareWith: ['C', 'G'],
    goal: 'Three keys at once: none, one sharp, one flat — and where each one bites.',
    guidance: [
      'C has nothing, G sharpens its seventh, F flattens its fourth.',
      'Sharps arrive late in a scale and flats arrive early; that is the pattern behind every key to come.',
      'The comparison rotates between the pairs, so no single answer keeps working.',
    ],
    watchFor:
      'Mixing up which key takes the sharp and which the flat. G is one sharp, F is one flat, and they alter different degrees.',
  },
};

/* ---------------- 4.5 · the family, key by key ---------------- */

interface KeyEntry {
  root: string;
  /** The key one step round the circle — the one it differs from by a single note. */
  previous: string;
  /** True for the keys earlier buckets already built; those are drilled for speed. */
  known?: boolean;
  /** A line about this key in particular, not about keys in general. */
  landmark: string;
  watchFor: string;
}

/**
 * One practice per key, built from the key itself.
 *
 * The eleven practices differ only in which key they point at, so writing them
 * out eleven times would be eleven chances to get a spelling wrong. The notes,
 * the accidental count and the degree that moved all come from the scale; only
 * the copy that could not be derived is written down.
 */
function familyQuiz(entry: KeyEntry): ScaleQuizConfig {
  const key = majorKey(entry.root);
  const summary = key ? keySummary(key) : `${entry.root} major`;
  const added = key && key.count > 0 ? accidentalsNamed(key)[key.count - 1] : null;
  // Sharps always land on the seventh and flats on the fourth; that is the
  // pattern the bucket is teaching, so it is stated rather than looked up.
  const degree = key?.kind === 'flat' ? 4 : 7;

  return {
    id: `family-${entry.root.toLowerCase()}`,
    tasks: entry.known
      ? ['degree', 'membership', 'signature']
      : ['degree', 'accidental', 'difference', 'signature'],
    steps: ['W', 'H'],
    root: entry.root,
    bothWays: false,
    compareWith: [entry.previous],
    goal: entry.known
      ? `${summary} — and quickly, since this one is already built.`
      : `${summary}, known as a shape rather than counted out.`,
    guidance: [
      added
        ? `${entry.root} major is ${entry.previous} major with one more: ${added}, at degree ${degree}.`
        : 'C major is the key the others are measured against — seven white keys, nothing added.',
      summary,
      entry.landmark,
    ],
    watchFor: entry.watchFor,
  };
}

const FAMILY_KEYS: readonly KeyEntry[] = [
  {
    root: 'C',
    previous: 'G',
    known: true,
    landmark: 'Every white key in order, which is why it is the one everybody starts on.',
    watchFor:
      'Treating C as easy and skipping it. It is the reference every other key is described against, so it has to be instant.',
  },
  {
    root: 'G',
    previous: 'C',
    known: true,
    landmark: 'The first sharp key, and F# is the first sharp there is.',
    watchFor: 'Reaching for F. One note separates G major from a wrong scale, and this is it.',
  },
  {
    root: 'D',
    previous: 'G',
    landmark: 'Both black keys are the pair in the middle of a group of three.',
    watchFor:
      'Remembering two sharps but not which two. F# came from G major; C# is the new one, and it is the seventh of D.',
  },
  {
    root: 'A',
    previous: 'D',
    landmark: 'Three sharps, and all three sit in a group-of-three cluster.',
    watchFor:
      'Sharpening the wrong third note. A major keeps F# and C#, adds G#, and leaves D natural.',
  },
  {
    root: 'E',
    previous: 'A',
    landmark: 'Four sharps: D# joins, in the group of two.',
    watchFor:
      'Losing count past three. Each key keeps everything the last one had — E major is A major plus D#.',
  },
  {
    root: 'B',
    previous: 'E',
    landmark: 'Five sharps — every black key except one, and the odd one out is Bb.',
    watchFor:
      'Playing A natural. B major is the first key where more of the scale is black than the eye expects.',
  },
  {
    root: 'F',
    previous: 'C',
    known: true,
    landmark: 'The first flat key, and Bb is the first flat there is.',
    watchFor:
      'Carrying a sharp habit over. F alters its fourth, not its seventh — flats arrive early in a scale.',
  },
  {
    root: 'Bb',
    previous: 'F',
    landmark: 'Two flats, and the scale starts on one of them.',
    watchFor:
      'Starting on A#. Same key under the finger, but in this scale the note is Bb, and its own name matters.',
  },
  {
    root: 'Eb',
    previous: 'Bb',
    landmark: 'Three flats — Bb, Eb, Ab, the group of three read right to left.',
    watchFor:
      'Answering Ab as G#. Eb major spells every letter once, so the sixth is A-something, not G-something.',
  },
  {
    root: 'Ab',
    previous: 'Eb',
    landmark: 'Four flats, and the fourth is Db — the left-hand key of the group of two.',
    watchFor:
      'Slipping to D natural. Ab major keeps everything Eb major had and adds Db on top.',
  },
  {
    root: 'Db',
    previous: 'Ab',
    landmark: 'Five flats: every black key is in, and only two white keys survive.',
    watchFor:
      'Reading Gb as F#. Db major is B major’s mirror — same keys, opposite spelling, and the spelling is what is being tested.',
  },
];

/** 4.5.12 and 4.5.13 — the order accidentals arrive in, asked from both ends. */
function orderQuiz(
  kind: AccidentalKind,
  keys: readonly string[],
  landmark: string,
  watchFor: string,
): ScaleQuizConfig {
  const word = kind === 'sharp' ? 'Sharps' : 'Flats';
  const order = accidentalOrder(kind).join(' → ');

  return {
    id: `${kind}-order`,
    tasks: ['order', 'signature'],
    steps: ['W', 'H'],
    root: 'C',
    bothWays: false,
    accidentalOrder: kind,
    compareWith: keys,
    goal: `${word} arrive in one fixed order: ${order}. Never a different order, never a different place to start.`,
    guidance: [
      `Asked one way: which ${kind} comes third. Asked the other: which one a given key adds.`,
      landmark,
      'How many mode counts them instead, so the list and the key signatures line up.',
    ],
    watchFor,
  };
}

/* ---------------- 4.6 and 4.7 · the minor side ---------------- */

/** The keys the reference's relative table names, in its order. */
const RELATIVE_TABLE: readonly string[] = ['C', 'G', 'D', 'A', 'E', 'F', 'Bb'];

const MINOR_QUIZZES: Readonly<Record<string, ScaleQuizConfig>> = {
  'relative-concept': {
    id: 'relative-concept',
    tasks: ['shares', 'relative'],
    steps: ['W', 'H'],
    root: 'C',
    bothWays: true,
    compareWith: RELATIVE_TABLE,
    compareScale: MAJOR,
    goal: 'Two scales, the same seven notes, a different home — and being sure which pairs really are pairs.',
    guidance: [
      'Same notes asks whether a major and a minor are built from the same seven; some of the pairs offered are not.',
      'Its relative asks for the partner itself, from either side.',
      'C major and A minor are the pair to start from: identical white keys, and only the resting note tells them apart.',
    ],
    watchFor:
      'Answering yes to any major-and-minor pairing. Only one minor shares a given major’s notes; the rest are near misses.',
  },
  'relative-sixth': {
    id: 'relative-sixth',
    tasks: ['relative'],
    steps: ['W', 'H'],
    root: 'C',
    bothWays: false,
    compareWith: RELATIVE_TABLE,
    compareScale: MAJOR,
    goal: 'The shortcut: the sixth degree of a major scale is its relative minor.',
    guidance: [
      'A major key is named; press the tonic of its relative minor.',
      'Count 1-2-3-4-5-6 through the scale rather than counting semitones — the sixth degree is the answer every time.',
      'Speed is the point here. The concept is already yours; this makes it usable mid-piece.',
    ],
    watchFor:
      'Counting up nine semitones instead. It lands on the same key and takes three times as long, and it breaks on keys with accidentals.',
  },
};

/**
 * A minor key's three knowledge practices, generated from the key.
 *
 * 4.7, 4.8 and 4.9 are the same six practices pointed at A, E and D — the
 * references differ only in which notes they print. Writing them out three
 * times would be three chances for a scale to be spelled wrong in prose while
 * the code spells it right, so the notes, the accidental, the half steps and
 * the relative major are all read off the scale. What is written down per key
 * is only what cannot be derived: where the root sits under the eye, and the
 * mistake that key in particular invites.
 */
export interface MinorKeyEntry {
  root: string;
  /** How to find the tonic without counting up from C. */
  landmark: string;
  /** The mistake this key invites, in its own words. */
  watchFor: string;
  /** What the comparison with the relative major keeps catching out. */
  compareWatch: string;
  /** Where each hand's crossing lands, as a note name. */
  crossings: Readonly<Record<'right' | 'left', string>>;
}

/** "F#–G and B–C" — the two places the scale's half steps fall, spelled. */
function halfStepPairs(root: string): string {
  const shape = scaleShape(root, MINOR);
  if (!shape) return '';
  const names = shape.notes.map((note) => note.name);
  return halfStepDegrees(shape.steps)
    .map((degree) => `${names[degree - 1]}–${names[degree % names.length]}`)
    .join(' and ');
}

/** The accidentals a minor key carries, or a note that it carries none. */
function minorAccidentals(root: string): string {
  const shape = scaleShape(root, MINOR);
  const altered = shape?.notes.filter((note) => note.name.length > 1).map((note) => note.name) ?? [];
  return altered.length === 0 ? 'no sharps or flats' : altered.join(' and ');
}

function minorNotesQuiz(entry: MinorKeyEntry): ScaleQuizConfig {
  const shape = scaleShape(entry.root, MINOR);
  const spelled = shape?.notes.map((note) => note.name).join(' ') ?? entry.root;

  return {
    id: `${entry.root.toLowerCase()}-minor-notes`,
    // Degree → note, note → degree, and note → the one beside it. The first is
    // the one everybody drills; the other two are where the recall actually
    // breaks, because a scale learnt as a sequence only runs forwards.
    tasks: ['degree', 'position', 'neighbour', 'membership'],
    steps: ['W', 'H'],
    root: entry.root,
    scale: MINOR,
    bothWays: true,
    goal: `${spelled} — recalled from any point in the scale, not just from the top.`,
    guidance: [
      `${entry.root} minor is ${spelled}, with ${minorAccidentals(entry.root)}.`,
      entry.landmark,
      'What comes next asks it backwards as well as forwards, which is the half a sequence never teaches you.',
    ],
    watchFor: entry.watchFor,
  };
}

function minorCompareQuiz(entry: MinorKeyEntry): ScaleQuizConfig {
  const major = relativeMajorOf(entry.root) ?? 'C';

  return {
    id: `${entry.root.toLowerCase()}-minor-vs-${major.toLowerCase()}`,
    tasks: ['difference', 'relative', 'membership'],
    steps: ['W', 'H'],
    root: entry.root,
    scale: MINOR,
    bothWays: true,
    compareWith: [major],
    compareScale: MAJOR,
    goal: `${entry.root} minor and ${major} major are the same seven notes. Only home moves.`,
    guidance: [
      'What differs asks which degree separates them — and the honest answer is none.',
      `Its relative asks for the partner from either side: ${major} major’s minor, and ${entry.root} minor’s major.`,
      'In or out then tests the shared set note by note, so the claim has to hold up.',
    ],
    watchFor: entry.compareWatch,
  };
}

/** The keys 4.7, 4.8 and 4.9 build, in the order the curriculum teaches them. */
export const MINOR_KEYS: readonly MinorKeyEntry[] = [
  {
    root: 'A',
    landmark: 'A is the white key between the second and third black keys of a group of three.',
    watchFor:
      'Counting up from A every time. The fifth should arrive as E, not as "A, B, C, D, E".',
    compareWatch:
      'Expecting a difference because the scales have different names. Nothing in the notes changes; only the tonal centre does.',
    crossings: { right: 'D', left: 'F' },
  },
  {
    root: 'E',
    landmark: 'E is the white key immediately right of a group of two black keys.',
    watchFor:
      'Answering the second as F. E minor’s one black key arrives immediately, at the second degree, before the hand has settled.',
    compareWatch:
      'Knowing G major has an F# but forgetting E minor has the same one. They are one scale with two homes, not two scales.',
    crossings: { right: 'A', left: 'C' },
  },
  {
    root: 'D',
    landmark: 'D is the white key between the two black keys of a pair.',
    watchFor:
      'Playing B instead of Bb at the sixth. D minor is the first minor key whose accidental is a flat, and the eye reaches for the white key.',
    compareWatch:
      'Reading Bb as A#. F major and D minor both spell it Bb, because in both scales every letter appears exactly once.',
    crossings: { right: 'G', left: 'Bb' },
  },
];

const MINOR_KEY_QUIZZES: Readonly<Record<string, ScaleQuizConfig>> = Object.fromEntries(
  MINOR_KEYS.flatMap((entry) =>
    [minorNotesQuiz(entry), minorCompareQuiz(entry)].map((config) => [config.id, config]),
  ),
);

const FAMILY: Readonly<Record<string, ScaleQuizConfig>> = Object.fromEntries(
  FAMILY_KEYS.map((entry) => {
    const config = familyQuiz(entry);
    return [config.id, config];
  }),
);

export const SCALE_QUIZZES: Readonly<Record<string, ScaleQuizConfig>> = {
  ...CORE,
  ...KEYS,
  ...FAMILY,
  ...MINOR_QUIZZES,
  ...MINOR_KEY_QUIZZES,
  'sharp-order': orderQuiz(
    'sharp',
    sharpKeys().map((key) => key.root),
    'Each sharp is a fifth above the last, and each key takes one more than the key a fifth below it.',
    'Learning the list without learning where it stops. Three sharps means the first three, and knowing which three is the point.',
  ),
  'flat-order': orderQuiz(
    'flat',
    flatKeys().map((key) => key.root),
    'Flats run the other way, a fifth down each time — and the list is the sharp list backwards.',
    'Starting the flat list from F. Sharps begin on F#, flats begin on Bb; mixing the two starting points scrambles every key signature after it.',
  ),
};

export function getScaleQuiz(id: string): ScaleQuizConfig {
  const config = SCALE_QUIZZES[id];
  if (!config) throw new Error(`Unknown scale quiz: ${id}`);
  return config;
}

/** How a formula practice is answered. */
export type FormulaMode =
  /** Tap the steps in order: W, W, H, and so on. */
  | 'steps'
  /** Play the keys the formula produces from the given root. */
  | 'keys';

export interface FormulaDrillConfig {
  id: string;
  modes: readonly FormulaMode[];
  /** Which formula is being applied; major unless a practice says otherwise. */
  scale?: string;
  /**
   * Keys to draw a whole run from — root and scale together.
   *
   * `roots` alone cannot express "sometimes a major, sometimes a minor", and
   * that mixture is the point of the recognition practice: a key arrives with
   * no warning which kind it is.
   */
  mix?: readonly KeyRef[];
  /** Roots the practice may start from; empty means anywhere on the board. */
  roots: readonly string[];
  /** Show which step comes next while you play. */
  cues: boolean;
  /** Count the formula in semitones as well as in W and H. */
  semitones?: boolean;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const CORE_FORMULAS: Readonly<Record<string, FormulaDrillConfig>> = {
  formula: {
    id: 'formula',
    modes: ['steps'],
    roots: ['C'],
    cues: false,
    goal: 'W-W-H-W-W-W-H, recited until it is one thing rather than seven.',
    guidance: [
      'Tap the seven steps in order. No keyboard yet — this is the pattern alone.',
      'The two half steps come third and last. Everything else is whole.',
      'The panel scores each position, so it will name the one you hesitate on.',
    ],
    watchFor:
      'Getting the third step wrong. The first half step arrives sooner than the hand expects, and that is where scales go wrong later.',
  },
  'any-note': {
    id: 'any-note',
    modes: ['keys'],
    roots: [],
    cues: true,
    goal: 'The formula applied from wherever you happen to be standing.',
    guidance: [
      'A root is given; play the eight notes the formula produces from it.',
      'The next step is shown as you go, so the arithmetic is visible.',
      'Black keys appear on their own — you are not choosing them, the formula is.',
    ],
    watchFor:
      'Reaching for a white key because it feels like a scale should be white. Follow the step, not the colour.',
  },
  keyboard: {
    id: 'keyboard',
    modes: ['keys'],
    roots: [],
    cues: false,
    semitones: true,
    goal: 'The formula in keys rather than letters: 2-2-1-2-2-2-1 along the board.',
    guidance: [
      'W is two keys, H is one — so the formula counted in keys is 2-2-1-2-2-2-1.',
      'Count keys as you go, black ones included, and let the notes be whatever they turn out to be.',
      'The root moves every run, so nothing can be recognised by shape alone.',
    ],
    watchFor:
      'Playing a scale you already know instead of counting. From an unfamiliar root those are different things, and the counting is the one that transfers.',
  },
  construct: {
    id: 'construct',
    modes: ['keys', 'steps'],
    roots: [],
    cues: false,
    goal: 'Build a scale from any note, either by naming the steps or by playing them.',
    guidance: [
      'Mixed asks for the steps one run and the keys the next.',
      'This is the test of the bucket: root in, scale out, no help.',
      'Timing is scored per position, so hesitation shows up where it happens.',
    ],
    watchFor:
      'Slowing down at the same place every time. That position is the one to drill on its own.',
  },
  'c-formula': {
    id: 'c-formula',
    modes: ['keys'],
    roots: ['C'],
    cues: true,
    goal: 'Why C major has no black keys — the formula walking the white ones exactly.',
    guidance: [
      'Apply the formula from C and watch it land on white key after white key.',
      'The two half steps fall where the white keys already touch: E to F, and B to C.',
      'That coincidence is the whole reason C major is the first scale anyone learns.',
    ],
    watchFor:
      'Assuming every scale works out this neatly. It is C that is unusual, not the formula.',
  },
};

/** 4.3.3 and 4.4.3 — the formula applied to a key that needs an accidental. */
function formulaFor(
  id: string,
  root: string,
  accidental: string,
  goal: string,
  watchFor: string,
): FormulaDrillConfig {
  return {
    id,
    modes: ['keys'],
    roots: [root],
    cues: true,
    goal,
    guidance: [
      `Start on ${root} and apply the formula. The steps decide the notes, not your memory of them.`,
      `${accidental} appears because the formula asks for it — watch the moment it does.`,
      'Turn the cues off once the scale builds itself.',
    ],
    watchFor,
  };
}

/** 4.6.2, 4.6.5 and 4.7.2 — the same engine, a different formula. */
/**
 * 4.7.2, 4.8.2 and 4.9.2 — one key's formula, with its half steps named.
 *
 * Where the half steps land is the whole reason a key looks the way it does, so
 * the copy states them; `halfStepPairs` reads them off the scale rather than
 * repeating what the reference printed.
 */
function minorFormulaDrill(entry: MinorKeyEntry): FormulaDrillConfig {
  const pairs = halfStepPairs(entry.root);
  const accidentals = minorAccidentals(entry.root);

  return {
    id: `${entry.root.toLowerCase()}-minor-formula`,
    modes: ['keys', 'steps'],
    scale: MINOR,
    roots: [entry.root],
    cues: true,
    goal: `Why ${entry.root} minor is spelled the way it is: the formula, and where its half steps land.`,
    guidance: [
      `Apply W-H-W-W-H-W-W from ${entry.root} and let the notes fall out of it.`,
      `The half steps arrive at ${pairs} — those two places decide everything else.`,
      accidentals === 'no sharps or flats'
        ? 'Nothing black is needed here, because the scale\u2019s half steps land where the white keys already touch.'
        : `${accidentals} appears because the formula asks for it, not because the key was memorised that way.`,
    ],
    watchFor:
      'Playing the notes from memory and calling it the formula. From a key you have not drilled, those come apart — and the formula is the half that transfers.',
  };
}

const MINOR_FORMULAS: Readonly<Record<string, FormulaDrillConfig>> = {
  'minor-formula': {
    id: 'minor-formula',
    modes: ['steps', 'keys'],
    scale: MINOR,
    roots: ['A', 'D', 'E', 'G', 'B', 'C'],
    cues: true,
    goal: 'W-H-W-W-H-W-W — the natural minor, one pattern rather than seven steps.',
    guidance: [
      'Tap the steps, or play what they produce from the root you are given.',
      'Counted in keys it is 2-1-2-2-1-2-2. The half steps come second and fifth, not third and seventh.',
      'Major puts its first half step at the third; minor puts it at the second. That one place is the whole difference.',
    ],
    watchFor:
      'Falling back into the major pattern at step two. It is the position your hand knows best, and it is the position that moved.',
  },
  'minor-build': {
    id: 'minor-build',
    modes: ['keys', 'steps'],
    scale: MINOR,
    roots: ['A', 'E', 'B', 'F#', 'C#', 'G#', 'Eb', 'Bb', 'F', 'C', 'G', 'D'],
    cues: false,
    goal: 'Any starting note in, its natural minor out — calculated, not remembered.',
    guidance: [
      'A root is drawn from all twelve; build its natural minor with no cues.',
      'Accidentals will appear. That is the formula working, not a mistake — you are calculating them, not recalling them.',
      'Every position is timed, so the step you always pause before gets named.',
    ],
    watchFor:
      'Reaching for the relative major’s notes instead of applying the formula. Both give the right scale; only one works from a root you have never tried.',
  },
};

/** 4.10.6 — a key is called out and the scale has to arrive, major or minor. */
const KEY_TO_SCALE: FormulaDrillConfig = {
  id: 'key-to-scale',
  modes: ['keys'],
  cues: false,
  roots: [],
  mix: RECOGNITION_KEYS,
  goal: 'A key is named — any of them, major or minor — and the scale follows immediately.',
  guidance: [
    'No cues and no formula shown. The key is announced; play its eight notes.',
    'Majors and minors are drawn from the same pool, so nothing tells you which kind is coming.',
    'The run is timed end to end and scored per position, which is what names the key you have to stop and work out.',
  ],
  watchFor:
    'Starting the formula instead of starting the scale. Calculating is the fallback, and the keys you fall back on are the ones still to learn.',
};

/** 4.5.14 — a key is named and the scale has to arrive, with nothing to lean on. */
const FAMILY_RANDOM: FormulaDrillConfig = {
  id: 'family-random',
  modes: ['keys'],
  roots: FAMILY_KEYS.map((entry) => entry.root),
  cues: false,
  goal: 'Any of the eleven keys, drawn at random, played straight through.',
  guidance: [
    'A key is named; play its seven notes and the octave. No step cues, no counting.',
    'By now the formula should only be the fallback — the answer wanted here is recall.',
    'Every position is timed, so the key you have to think about is the one the panel names.',
  ],
  watchFor:
    'Rebuilding the scale from the formula every time. That works and it is slow; the keys you rebuild are the keys still to learn.',
};

export const FORMULA_DRILLS: Readonly<Record<string, FormulaDrillConfig>> = {
  ...CORE_FORMULAS,
  ...MINOR_FORMULAS,
  'key-to-scale': KEY_TO_SCALE,
  ...Object.fromEntries(
    MINOR_KEYS.map((entry) => {
      const config = minorFormulaDrill(entry);
      return [config.id, config];
    }),
  ),
  'family-random': FAMILY_RANDOM,
  'g-formula': formulaFor(
    'g-formula',
    'G',
    'F#',
    'Build G major from the formula and watch the F# arrive on its own.',
    'Stopping on F because six notes went white and the seventh felt like it should too.',
  ),
  'f-formula': formulaFor(
    'f-formula',
    'F',
    'Bb',
    'Build F major and meet its flat at the fourth, much earlier than G meets its sharp.',
    'Carrying G major’s habit over. F alters its fourth, not its seventh.',
  ),
};

export function getFormulaDrill(id: string): FormulaDrillConfig {
  const config = FORMULA_DRILLS[id];
  if (!config) throw new Error(`Unknown formula drill: ${id}`);
  return config;
}

import type { ChordQuality, Inversion } from '../chords.types';
import { NATURAL_ROOTS, QUALITIES, SEVENTH_QUALITIES, TRIAD_ROOTS } from './triads';

/**
 * The recognising half of 5.1, as data.
 *
 * Building a chord and naming one are different skills, and the second lags —
 * you can construct D minor from the formula for weeks and still not recognise
 * D F A on sight. These three practices run the arrow the other way.
 */
export type TriadTask =
  /** A degree number is given; press it in the named scale. */
  | 'degree'
  /** A key is lit; say which degree of the scale it is. */
  | 'degree-name'
  /** A triad is lit on the board; major or minor? */
  | 'quality-seen'
  /** A triad is played; major or minor, by ear? */
  | 'quality-heard'
  /** A triad is lit; press the note that decides its quality. */
  | 'third'
  /** A triad is lit; press the note it is built on. */
  | 'root'
  /** A triad is lit; name it, root and quality together. */
  | 'name-chord'
  /** A chord is played and not shown; name it. */
  | 'name-heard'
  /** A chord is lit in some position; say which position. */
  | 'inversion'
  /** A numeral is named in a key; press the chord's root. */
  | 'numeral-root'
  /** A chord of a key is lit; say which numeral it answers to. */
  | 'numeral-name';

export interface TriadQuizConfig {
  id: string;
  tasks: readonly TriadTask[];
  /** Roots in play. */
  roots: readonly string[];
  qualities: readonly ChordQuality[];
  /** Positions a shown chord may be in. Root position only unless stated. */
  inversions?: readonly Inversion[];
  /** The scale the degree tasks are counted in. */
  scaleRoots: readonly string[];
  /** Sound the chord as well as showing it, where the task allows. */
  sound: boolean;
  /** Per-answer allowance in ms. 0 turns the clock off. */
  allowanceMs: number;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const base = {
  roots: NATURAL_ROOTS,
  qualities: QUALITIES,
  scaleRoots: ['C'],
  sound: true,
  allowanceMs: 0,
} as const;

const CORE_QUIZZES: Readonly<Record<string, TriadQuizConfig>> = {
  'scale-degrees': {
    ...base,
    id: 'scale-degrees',
    tasks: ['degree', 'degree-name'],
    scaleRoots: ['C', 'G', 'F', 'D'],
    sound: false,
    allowanceMs: 3000,
    goal: 'Numbers instead of letters: 1-2-3-4-5-6-7, both ways round.',
    guidance: [
      'Asked one way, a number arrives and you press the note. Asked the other, a note is lit and you give its number.',
      'C first, then G, F and D — because a degree is a job in a key, not a letter you memorised in C.',
      'This is the skill the rest of level 5 stands on. 1-3-5 means nothing until the numbers are instant.',
    ],
    watchFor:
      'Counting up from the tonic every time. The fifth of G should arrive as D, not as "G, A, B, C, D".',
  },
  'major-vs-minor': {
    ...base,
    id: 'major-vs-minor',
    tasks: ['quality-seen', 'third', 'quality-heard'],
    roots: TRIAD_ROOTS,
    goal: 'One note separates the two chords. Find it, see it, and hear it.',
    guidance: [
      'Seen: a triad is lit — major or minor? Heard: the same question with nothing to look at.',
      'The third asks you to press the note that decides it, which is the answer to both other questions.',
      'Both qualities are drawn on the same roots, so the root never gives it away.',
    ],
    watchFor:
      'Answering by feel on the heard rounds and by counting on the seen ones. They should agree; when they do not, the ear is the half to practise.',
  },
  'triad-recognition': {
    ...base,
    id: 'triad-recognition',
    tasks: ['root', 'name-chord', 'quality-seen'],
    roots: TRIAD_ROOTS,
    allowanceMs: 3000,
    goal: 'Chord in, name out — the reverse of everything built so far.',
    guidance: [
      'A triad is lit. Press its root, or name it outright: root and quality together.',
      'The lowest note is the root here; inversions come in 5.4 and change that.',
      'Three seconds. A chord you recognise after working it out is one you have not recognised.',
    ],
    watchFor:
      'Naming the quality right and the root wrong. They are scored apart, so the panel will say which half is costing you.',
  },
};

/* ---------------- 5.4 and 5.5 · recognising positions and colours ---------------- */

const POSITIONS: readonly Inversion[] = [0, 1, 2];

const RECOGNITION: Readonly<Record<string, TriadQuizConfig>> = {
  'inversion-recognition': {
    ...base,
    id: 'inversion-recognition',
    tasks: ['inversion', 'name-chord'],
    roots: NATURAL_ROOTS,
    inversions: POSITIONS,
    allowanceMs: 3000,
    goal: 'A shape appears. Say which position it is — and which chord, which is the harder half.',
    guidance: [
      'The lowest note names the position: the root, the third, or the fifth at the bottom.',
      'Naming the chord is the same question read the other way. G-C-E is C major, not a G chord.',
      'Three seconds. A position you work out is a position you have not recognised.',
    ],
    watchFor:
      'Reading the lowest note as the root every time. That is exactly the habit inversions break, and it turns C major second inversion into a G chord with wrong notes.',
  },
  'same-chord': {
    ...base,
    id: 'same-chord',
    tasks: ['name-chord', 'name-heard'],
    roots: ['C', 'F', 'G', 'A', 'D'],
    inversions: POSITIONS,
    allowanceMs: 0,
    goal: 'Three shapes, one chord. Name it whichever position it arrives in — seen or heard.',
    guidance: [
      'C-E-G, E-G-C and G-C-E are all C major. The colour changes and the chord does not.',
      'Heard rounds play the shape with nothing on screen, which is the version that matters in a band.',
      'Root position sounds grounded, first inversion less so, second more open. Same three notes.',
    ],
    watchFor:
      'Naming the bass note. It is the single most common inversion mistake, and the heard rounds are where it shows.',
  },
  'roman-numerals': {
    ...base,
    id: 'roman-numerals',
    tasks: ['numeral-root', 'numeral-name'],
    scaleRoots: ['C', 'G', 'F', 'D'],
    sound: false,
    allowanceMs: 3000,
    goal: 'Numeral to chord and chord to numeral, in four keys — the translation both ways.',
    guidance: [
      'Asked one way: "vi in G major" — press its root. Asked the other: a chord is lit and you name its numeral.',
      'The pattern is the same in every major key: major, minor, minor, major, major, minor, diminished.',
      'Four keys on purpose. A numeral you can only resolve in C is not yet a numeral.',
    ],
    watchFor:
      'Answering by counting up the scale. It gives the right chord and it is far too slow to use inside a progression.',
  },
  'seventh-comparison': {
    ...base,
    id: 'seventh-comparison',
    tasks: ['quality-seen', 'quality-heard'],
    roots: ['C', 'F', 'G'],
    qualities: SEVENTH_QUALITIES,
    allowanceMs: 3000,
    goal: 'maj7, 7 and m7 on the same root — one or two notes apart, and nothing alike.',
    guidance: [
      'Seen rounds show the shape; heard rounds only play it.',
      'maj7 is open and bright, 7 is tense and wants to move, m7 is darker and settled.',
      'The roots stay few on purpose, so the ear is comparing colours rather than pitches.',
    ],
    watchFor:
      'Guessing 7 whenever it sounds unresolved. Half of these are dominant sevenths, so that scores well for a while and teaches nothing.',
  },
};

export const TRIAD_QUIZZES: Readonly<Record<string, TriadQuizConfig>> = {
  ...CORE_QUIZZES,
  ...RECOGNITION,
};

export function getTriadQuiz(id: string): TriadQuizConfig {
  const config = TRIAD_QUIZZES[id];
  if (!config) throw new Error(`Unknown triad quiz: ${id}`);
  return config;
}

/** Whether a task is answered by ear alone — no board, nothing to read. */
export function isHeard(task: TriadTask): boolean {
  return task === 'quality-heard' || task === 'name-heard';
}

/** Whether a task is answered by pressing a key rather than choosing a label. */
export function isPressed(task: TriadTask): boolean {
  return task === 'degree' || task === 'third' || task === 'root' || task === 'numeral-root';
}

export { QUALITIES };

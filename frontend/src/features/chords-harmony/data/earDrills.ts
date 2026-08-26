import type { ChordQuality, Inversion } from '../chords.types';
import { NATURAL_ROOTS, QUALITIES, TRIAD_ROOTS } from './triads';

/**
 * 5.9 as data — the chords heard rather than seen.
 *
 * A separate engine from the seen-chord quiz because the interaction is
 * different in kind: there is nothing on the screen to read, the sound can be
 * replayed, and some questions deliberately wait before letting you answer. The
 * questions themselves are the same ones asked of a printed chord, which is the
 * point — the two should eventually agree.
 */
export type EarTask =
  /** Major or minor — the third, by ear. */
  | 'quality'
  /** Press the note the chord is built on. */
  | 'root'
  /** Press the lowest note sounding, which is not always the root. */
  | 'bass'
  /** Root position, 1st or 2nd — read from the bass. */
  | 'position'
  /** Which function the chord serves in an established key. */
  | 'function';

export interface ChordEarConfig {
  id: string;
  tasks: readonly EarTask[];
  /** Roots the chord may be built on. */
  roots: readonly string[];
  qualities: readonly ChordQuality[];
  /** Positions it may be voiced in. Root position only unless stated. */
  inversions?: readonly Inversion[];
  /** The key the function task is heard against; its I chord is sounded first. */
  key?: string;
  /** Numerals the function task may draw. */
  numerals?: readonly string[];
  /** Hold the answer back this long, so the chord has to be remembered. */
  delayMs: number;
  /** Play the chord as a rising line rather than a block, once per prompt. */
  arpeggio: boolean;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const base = {
  roots: NATURAL_ROOTS,
  qualities: QUALITIES,
  delayMs: 0,
  arpeggio: false,
} as const;

export const CHORD_EAR_DRILLS: Readonly<Record<string, ChordEarConfig>> = {
  'ear-quality': {
    ...base,
    id: 'ear-quality',
    tasks: ['quality'],
    roots: TRIAD_ROOTS,
    goal: 'Major or minor, by ear, on any root — inside two seconds.',
    guidance: [
      'A chord sounds. Say which quality it is; the board stays empty.',
      'Both qualities are drawn on the same roots, so the pitch tells you nothing.',
      'Listen to the third, not the mood. Bright and dark stop being reliable as soon as the register changes.',
    ],
    watchFor:
      'Deciding by feel. It works on C major and C minor and starts failing the moment the root is unfamiliar.',
  },
  'ear-root': {
    ...base,
    id: 'ear-root',
    tasks: ['root'],
    roots: ['C', 'F', 'G'],
    goal: 'Hear a chord and put a finger on the note it is built from.',
    guidance: [
      'Three chords to begin with — C, F and G — so the ear is comparing three things rather than twelve.',
      'Hear it, name the root to yourself, then find it. The naming is the part that transfers.',
      'Widen the pool once these three are reliable; the panel names whichever you keep missing.',
    ],
    watchFor:
      'Hunting on the keyboard until something matches. That is searching, not hearing, and it does not get faster.',
  },
  'ear-bass': {
    ...base,
    id: 'ear-bass',
    tasks: ['bass'],
    roots: ['C', 'F', 'G'],
    inversions: [0, 1, 2],
    arpeggio: true,
    goal: 'The lowest note sounding — which is only the root when the chord is in root position.',
    guidance: [
      'The chord arrives as a rising line so the bottom note is unmistakable, then as a block.',
      'Root is which chord it is. Bass is what is at the bottom right now. They come apart in every inversion.',
      'Press the lowest note you heard, not the note you think names the chord.',
    ],
    watchFor:
      'Answering the root every time. Two thirds of these are inversions, so that scores a third and teaches nothing.',
  },
  'ear-position': {
    ...base,
    id: 'ear-position',
    tasks: ['position', 'bass'],
    roots: ['C', 'F', 'G'],
    inversions: [0, 1, 2],
    goal: 'Same chord, three positions: hear which one is sounding.',
    guidance: [
      'Root position sounds grounded, first inversion less settled, second more open.',
      'The bass is the evidence. Find it first, then the position follows from it.',
      'Then name both: "C major, E bass, first inversion" is the answer worth being able to give.',
    ],
    watchFor:
      'Hearing an inversion as a different chord. E-G-C is C major, and the ear has to stop calling it an E chord.',
  },
  'ear-function': {
    ...base,
    id: 'ear-function',
    tasks: ['function'],
    key: 'C',
    numerals: ['I', 'IV', 'V'],
    goal: 'I, IV or V — the three functions, heard against a key rather than named as letters.',
    guidance: [
      'The key is established first: the I chord sounds, then the chord in question.',
      'I is home, IV is away, V is tension pulling back. Answer the job, not the letter.',
      'This is the beginning of functional hearing, and it is what lets you follow a song you have never played.',
    ],
    watchFor:
      'Working out the letter and then converting it. That is two steps where there should be one, and at speed the second one gets skipped.',
  },
  'ear-qualities': {
    ...base,
    id: 'ear-qualities',
    tasks: ['quality'],
    roots: ['C', 'F', 'G'],
    qualities: [...QUALITIES, 'dom7'],
    goal: 'Major, minor or dominant seventh — three characters rather than three chords.',
    guidance: [
      'The same three roots with three qualities each, so the quality is all that varies.',
      'A dominant seventh has a fourth note and an unfinished sound; it wants to move somewhere.',
      'Learn the character, not the chord. The aim is hearing "that is a dominant seventh" on a root you have never drilled.',
    ],
    watchFor:
      'Guessing the seventh whenever something sounds unresolved. A third of these are sevenths, so it scores well for a while.',
  },
  'ear-recall': {
    ...base,
    id: 'ear-recall',
    tasks: ['root'],
    roots: NATURAL_ROOTS,
    delayMs: 3000,
    goal: 'Hold the root in your head for three seconds after the sound stops, then find it.',
    guidance: [
      'The chord sounds, then silence, and only then can you answer.',
      'The reference asks you to sing the root. The app cannot hear you sing — so it asks for the next best thing: hold the pitch, then place it.',
      'Hum it during the wait. That is what the exercise is for, even though nothing is listening.',
    ],
    watchFor:
      'Playing along with the chord to find the root. The waiting is the practice; without it this is 5.9.2 again.',
  },
  'ear-everything': {
    ...base,
    id: 'ear-everything',
    tasks: ['quality', 'root', 'bass', 'position'],
    roots: TRIAD_ROOTS,
    inversions: [0, 1, 2],
    delayMs: 0,
    goal: 'Everything at once: quality, root, bass and position, drawn at random.',
    guidance: [
      'The bucket’s final test. Any chord, any position, and any of the four questions about it.',
      'Mixed mode is the drill; single tasks are the practice for whichever one the panel keeps naming.',
      'Hear E-G-C and the complete answer is "C major, E bass, first inversion".',
    ],
    watchFor:
      'Being reliable on quality and guessing at position. They are scored apart, so the panel will say which half of your hearing is behind.',
  },
};

export function getChordEarDrill(id: string): ChordEarConfig {
  const config = CHORD_EAR_DRILLS[id];
  if (!config) throw new Error(`Unknown chord ear drill: ${id}`);
  return config;
}

/** Whether a task is answered by pressing a key rather than choosing a label. */
export function pressesKey(task: EarTask): boolean {
  return task === 'root' || task === 'bass';
}

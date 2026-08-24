import type { KeyScope, NoteNaming } from './naming';

/** How a prompt is put: light a key and ask for its name, or the other way. */
export type AskDirection = 'name' | 'find';

/** What is being made hard, beyond the notes themselves. */
export type Challenge =
  /** No clock beyond the usual reaction timer. */
  | 'none'
  /** Each prompt has an allowance; running out costs the same as a wrong answer. */
  | 'deadline'
  /** A fixed window, scored on how many you get through. */
  | 'sprint';

export interface RecognitionDrillConfig {
  id: string;
  scope: KeyScope;
  naming: NoteNaming;
  /** Directions offered. The first one is where the drill opens. */
  directions: readonly AskDirection[];
  challenge: Challenge;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

const BOTH_WAYS: readonly AskDirection[] = ['name', 'find'];

/**
 * Bucket 1.5 — the same engine, nine ways.
 *
 * By this point every fact has been taught; what is left is the speed at which
 * it comes back, so the configs differ only in what is on the table (white
 * keys, black keys, one spelling or both) and in what is applying pressure
 * (nothing, a per-answer allowance, or a clock on the whole run).
 */
export const RECOGNITION_DRILLS: Readonly<Record<string, RecognitionDrillConfig>> = {
  white: {
    id: 'white',
    scope: 'white',
    naming: 'sharp',
    directions: BOTH_WAYS,
    challenge: 'none',
    goal: 'Any white key, anywhere on the board, named in about a second.',
    steps: [
      'Name the lit key, or find the named one — the drill alternates.',
      'Answer with a letter button or by pressing the key itself. Any octave counts.',
      'Landmark first: 2 black keys for C D E, 3 for F G A B.',
    ],
    watchFor:
      'Reciting the alphabet to get there. If C is fast and A is slow, the panel below will say so — that is the note to work on.',
  },
  black: {
    id: 'black',
    scope: 'black',
    naming: 'both',
    directions: BOTH_WAYS,
    challenge: 'none',
    goal: 'Any black key, by either of its names, without working out the group first.',
    steps: [
      'Every button carries both names — one key, two spellings.',
      'Answer by button or by pressing the key on the board.',
      'Say both names out loud: "C sharp, D flat".',
    ],
    watchFor:
      'Counting up from C# through the group. The pair is C# D#, the three are F# G# A# — the shape names them.',
  },
  sharp: {
    id: 'sharp',
    scope: 'black',
    naming: 'sharp',
    directions: BOTH_WAYS,
    challenge: 'none',
    goal: 'The five black keys under their sharp names, at speed.',
    steps: [
      'Sharp means the black key immediately right of that letter.',
      'Group, then position, then the name — then answer.',
      'Play each one as you name it.',
    ],
    watchFor: 'Guessing between neighbours. D# and F# look alike until you check which group you are in.',
  },
  flat: {
    id: 'flat',
    scope: 'black',
    naming: 'flat',
    directions: BOTH_WAYS,
    challenge: 'none',
    goal: 'The same five keys under their flat names, just as fast.',
    steps: [
      'Flat means the black key immediately left of that letter.',
      'Db is the same key as C# — the answer is the key, not the spelling.',
      'Name the flat first, then check which sharp it is.',
    ],
    watchFor:
      'Being slower on flats than sharps. Most beginners are; the panel below will confirm it, and this is the drill that fixes it.',
  },
  mixed: {
    id: 'mixed',
    scope: 'all',
    naming: 'both',
    directions: BOTH_WAYS,
    challenge: 'none',
    goal: 'Every key on the board in one pool — white, black, both spellings.',
    steps: [
      'No warning which kind is coming. That is the drill.',
      'Answer by button or by pressing the key.',
      'Keep the landmarks doing the work; nothing here is found by counting.',
    ],
    watchFor:
      'A rhythm of fast-fast-slow. The slow ones are the notes still being worked out rather than recognised.',
  },
  'to-key': {
    id: 'to-key',
    scope: 'all',
    naming: 'both',
    directions: ['find'],
    challenge: 'none',
    goal: 'Name → key, one direction only: read it and your hand goes there.',
    steps: [
      'Read the name, find the key, press it. Any octave counts.',
      'Do not scan the board — go to the black-key group first.',
      'Do the same on your real keyboard, eyes on the keys.',
    ],
    watchFor: 'Hunting from the left edge. The name tells you which group to look at before you look at all.',
  },
  'to-name': {
    id: 'to-name',
    scope: 'all',
    naming: 'both',
    directions: ['name'],
    challenge: 'none',
    goal: 'Key → name, one direction only: see it and the name is already there.',
    steps: [
      'A key lights up. Name it before you reach for an answer.',
      'Answer with the buttons, or press the same note in any octave.',
      'Say the name out loud — that is what makes it stick.',
    ],
    watchFor: 'Reading the answer off the board with names turned on. Turn them off; this is recall, not reading.',
  },
  'no-counting': {
    id: 'no-counting',
    scope: 'all',
    naming: 'both',
    directions: BOTH_WAYS,
    challenge: 'deadline',
    goal: 'Answer inside the allowance. Counting takes longer than the allowance — that is the whole design.',
    steps: [
      'Every prompt has a clock. Running out costs exactly what a wrong answer costs.',
      'Start at 3 seconds. Drop to 2, then 1.5, as your accuracy holds.',
      'If you feel yourself counting, let it time out — the miss is the information.',
    ],
    watchFor:
      'Accuracy falling apart at the shorter limits. Go back up a step, and work the weak notes below until they hold.',
  },
  speed: {
    id: 'speed',
    scope: 'all',
    naming: 'both',
    directions: BOTH_WAYS,
    challenge: 'sprint',
    goal: 'As many correct as you can in one minute — the bucket final.',
    steps: [
      'Press Start sprint. Answer whatever comes, as fast as it comes.',
      'Read the score and the weak spots afterwards, then run the drill that fixes them.',
      'Come back tomorrow and beat the number.',
    ],
    watchFor:
      'Racing into wrong answers. A miss re-asks the same prompt, so guessing costs more time than looking.',
  },
};

export function getRecognitionDrill(id: string): RecognitionDrillConfig {
  const config = RECOGNITION_DRILLS[id];
  if (!config) throw new Error(`Unknown recognition drill: ${id}`);
  return config;
}

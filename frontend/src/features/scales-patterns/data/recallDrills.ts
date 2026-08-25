import { MAJOR, MINOR } from './relatives';
import type { KeyRef } from './relatives';
import { RECOGNITION_KEYS } from './readDrills';

/**
 * 4.12 as data — the level's last bucket, and the one that runs every day.
 *
 * Everything level 4 built arrives here as a single chain: a key is drawn, and
 * it has to be located, spelled, played up, played back down, and any mistake
 * accounted for. The ten practices are that chain with different links removed,
 * which is why they are one engine and ten configs rather than ten drills — the
 * contest simulation is not a different exercise from the ascending challenge,
 * it is the same one with nothing taken out.
 */

/** One link of the chain. A practice runs the links it names, in order. */
export type RecallPhase =
  /** Press the tonic of the key you were given. */
  | 'locate'
  /** Spell the scale: tap its seven note names, in order, correctly spelled. */
  | 'name'
  /** Press the eight keys with the names still showing. */
  | 'find'
  /** Press the eight keys ascending, with no support. */
  | 'play'
  /** Press the eight keys descending, which is the half that lags. */
  | 'reverse';

/**
 * Why a note came out wrong.
 *
 * The reference's diagnosis, and the most useful thing in the bucket: four
 * mistakes that look identical on the keyboard and need four different fixes.
 * Tallying which one keeps happening is what turns "I keep getting D major
 * wrong" into something you can act on.
 */
export type MistakeCause = 'forgot' | 'geography' | 'rushed' | 'finger';

export interface CauseOption {
  value: MistakeCause;
  label: string;
  /** What to do about it, since naming a cause is only useful with a fix. */
  fix: string;
}

export const MISTAKE_CAUSES: readonly CauseOption[] = [
  {
    value: 'forgot',
    label: 'I did not know the note',
    fix: 'A recall problem. Go back to the key’s own practice and its formula.',
  },
  {
    value: 'geography',
    label: 'I knew it and hit the wrong key',
    fix: 'A geography problem. Find the note slowly, away from the scale, until the hand stops guessing.',
  },
  {
    value: 'rushed',
    label: 'I went before I knew',
    fix: 'A pacing problem. Give yourself a longer allowance — the speed is meant to be the result, not the input.',
  },
  {
    value: 'finger',
    label: 'Wrong finger for the note',
    fix: 'A technique problem. 4.11’s crossing practices, in this key.',
  },
];

export interface ScaleRecallConfig {
  id: string;
  /** The links this practice runs, in order. */
  phases: readonly RecallPhase[];
  /** Keys it may draw from. */
  mix: readonly KeyRef[];
  /** Keys in a session. Ten is the reference's round. */
  rounds: number;
  /** How long a whole key may take, in ms. 0 turns the clock off. */
  deadlineMs: number;
  /** Tighter allowances the practice steps through as the rounds go by. */
  ladder: readonly number[];
  /** Cover the keyboard once the key is drawn. */
  blind: boolean;
  /** Ask why a wrong note happened, and repair the phrase around it. */
  diagnose: boolean;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

/**
 * Same root, both qualities.
 *
 * The major/minor challenge needs a pool where the root tells you nothing — D
 * major and D minor start on the same key and share four notes, so the decision
 * has to be made rather than skipped.
 */
const SAME_ROOT_PAIRS: readonly KeyRef[] = ['A', 'D', 'E', 'G', 'C', 'B', 'F'].flatMap((root) => [
  { root, scale: MAJOR },
  { root, scale: MINOR },
]);

const base = {
  mix: RECOGNITION_KEYS,
  rounds: 10,
  deadlineMs: 0,
  ladder: [] as readonly number[],
  blind: false,
  diagnose: false,
} as const;

export const SCALE_RECALL_DRILLS: Readonly<Record<string, ScaleRecallConfig>> = {
  'key-recognition': {
    ...base,
    id: 'key-recognition',
    phases: ['locate'],
    deadlineMs: 3000,
    goal: 'A key is called. Put a finger on its tonic before you have finished reading the name.',
    guidance: [
      'Ten keys, one press each. Nothing to play yet — this is recognition speed on its own.',
      'Majors and minors both appear; the tonic is the tonic either way.',
      'Five seconds is a beginner’s time, three is good, and the contest wants it instant.',
    ],
    watchFor:
      'Working out the notes before pressing. You were not asked for the scale — only where it starts.',
  },
  'name-notes': {
    ...base,
    id: 'name-notes',
    phases: ['name'],
    deadlineMs: 0,
    goal: 'Spell the scale out loud, in order, with the right names — Bb, never A#.',
    guidance: [
      'Tap the seven names in order. The wrong spelling of the right key counts as wrong.',
      'This is the one practice a keyboard cannot test: press a black key and you have not said which note it was.',
      'Every letter appears exactly once in a scale. That rule alone rules out most of the wrong answers.',
    ],
    watchFor:
      'Reaching for the sharp name out of habit. Half these keys are flat keys, and their notes have flat names.',
  },
  'find-notes': {
    ...base,
    id: 'find-notes',
    phases: ['find'],
    deadlineMs: 0,
    goal: 'The notes are given. Put them under your hand without counting up from the root.',
    guidance: [
      'The names stay on the keys here — this link is about locating, not recalling.',
      'Point at each one in turn. Accuracy first; the speed comes from knowing the board.',
      'If you find yourself counting white keys, that is the thing being practised.',
    ],
    watchFor:
      'Finding the notes by running the scale from the start each time. That is recall doing geography’s job.',
  },
  'play-blind': {
    ...base,
    id: 'play-blind',
    phases: ['play'],
    blind: true,
    goal: 'The whole scale with the keyboard covered — the hands knowing where they are.',
    guidance: [
      'The cover goes on once the key is drawn. Presses still land; you just cannot see where.',
      'A wrong note tells you exactly how far off the hand was, which watching would have hidden.',
      'Accuracy is the whole measure. There is no credit here for being quickly wrong.',
    ],
    watchFor:
      'Playing the keys you can still picture and guessing the rest. The guesses are the notes to take back to 4.12.3.',
  },
  'ascending-challenge': {
    ...base,
    id: 'ascending-challenge',
    phases: ['play'],
    deadlineMs: 10000,
    ladder: [15000, 10000, 8000, 5000],
    goal: 'Random key to played scale, upward, inside the clock.',
    guidance: [
      'The allowance tightens as the rounds go by: fifteen seconds, then ten, then eight, then five.',
      'Recognise, recall, play. No twenty seconds of preparation.',
      'Accuracy first — a fast wrong scale scores nothing here.',
    ],
    watchFor:
      'Freezing on the keys you have not drilled. The clock will name them for you; those are tomorrow’s practice.',
  },
  'descending-challenge': {
    ...base,
    id: 'descending-challenge',
    phases: ['reverse'],
    deadlineMs: 10000,
    ladder: [15000, 10000, 8000, 5000],
    goal: 'The same thing backwards, where most people are twice as slow and have never checked.',
    guidance: [
      'From the upper tonic down. Same clock as the ascending challenge, deliberately.',
      'Compare the two times. The gap between them is the honest measure of whether you know the scale or the sequence.',
      'Let the hand find the pattern rather than reciting the notes in reverse.',
    ],
    watchFor:
      'Running the scale up in your head first. It gives the right answer every time and it will never be quick.',
  },
  'quality-challenge': {
    ...base,
    id: 'quality-challenge',
    phases: ['name', 'play'],
    mix: SAME_ROOT_PAIRS,
    deadlineMs: 12000,
    goal: 'Key and quality together: D major and D minor start on the same note and are not the same scale.',
    guidance: [
      'The pool is same-root pairs, so the root tells you nothing at all.',
      'Spell it first, then play it. Getting the spelling right and the notes wrong is a different problem from the reverse.',
      'Both links are scored, so it shows which of the two the decision breaks.',
    ],
    watchFor:
      'Answering with whichever version you drilled most recently. The quality is part of the question, not a detail.',
  },
  'timed-challenge': {
    ...base,
    id: 'timed-challenge',
    phases: ['play'],
    deadlineMs: 15000,
    ladder: [15000, 10000, 7000, 5000],
    goal: 'Four rounds, each one tighter: fifteen seconds down to five.',
    guidance: [
      'The reference’s four rounds, run automatically — the allowance drops as you get through the keys.',
      'The number to watch is not how fast you played. It is the tightest round you were still accurate in.',
      'Out of time counts as a miss, exactly like a wrong note.',
    ],
    watchFor:
      'Chasing the five-second round before the ten-second one is clean. Speed is what accuracy turns into, not a substitute for it.',
  },
  'mistake-correction': {
    ...base,
    id: 'mistake-correction',
    phases: ['play'],
    diagnose: true,
    goal: 'Not "I made a mistake" — which of the four mistakes, and the repair that fits it.',
    guidance: [
      'A wrong note stops the run and asks why: forgot it, mislocated it, rushed it, or wrong finger.',
      'Then the three notes around the error are replayed on their own, and the scale is finished.',
      'The tally is the point. Four causes need four different practices, and yours will not be evenly spread.',
    ],
    watchFor:
      'Answering "I rushed" every time. It is the comfortable answer, and it sends you to the wrong practice.',
  },
  'contest-simulation': {
    ...base,
    id: 'contest-simulation',
    phases: ['locate', 'name', 'play', 'reverse'],
    deadlineMs: 20000,
    ladder: [25000, 20000, 15000],
    diagnose: true,
    goal: 'Ten keys, the whole chain each time: find it, spell it, play it up, play it back down.',
    guidance: [
      'This is the level’s measurement drill. Run it daily and record the card at the end.',
      'Every phase is timed and every mistake is diagnosed, so the card says where the time went as well as how much.',
      'No restarting. A mistake is repaired and the round continues, the way a performance does.',
    ],
    watchFor:
      'Judging the day by the total alone. Two identical totals can hide a spelling problem in one and a descending problem in the other — the per-phase split is what to read.',
  },
};

export function getScaleRecallDrill(id: string): ScaleRecallConfig {
  const config = SCALE_RECALL_DRILLS[id];
  if (!config) throw new Error(`Unknown scale recall drill: ${id}`);
  return config;
}

/**
 * The allowance for a round, stepping through the ladder as the session runs.
 *
 * The rounds are spread evenly across the rungs, so a ten-round session on a
 * four-rung ladder spends two or three rounds at each — the reference's "ten
 * keys per round" without having to keep count.
 */
export function allowanceAt(config: ScaleRecallConfig, round: number): number {
  if (config.ladder.length === 0) return config.deadlineMs;
  const perRung = Math.max(1, Math.ceil(config.rounds / config.ladder.length));
  const rung = Math.min(config.ladder.length - 1, Math.floor(round / perRung));
  return config.ladder[rung] ?? config.deadlineMs;
}

/** How many notes a phase asks for: one, seven names, or eight keys. */
export function stepsInPhase(phase: RecallPhase): number {
  if (phase === 'locate') return 1;
  if (phase === 'name') return 7;
  return 8;
}

/** How a phase reads in the card and the prompt. */
export function phaseLabel(phase: RecallPhase): string {
  if (phase === 'locate') return 'find the tonic';
  if (phase === 'name') return 'spell it';
  if (phase === 'find') return 'locate the notes';
  if (phase === 'play') return 'play it up';
  return 'play it down';
}

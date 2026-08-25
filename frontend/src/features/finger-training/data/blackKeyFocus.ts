import type { NoteNaming, PitchClass } from '@/features/music-theory';

/**
 * Black keys by where they sit, not by counting up to them.
 *
 * Everything a black key needs to be found is in its pitch class: which group
 * it belongs to, which of that group it is, and which white key anchors the
 * group. So the geography is derived rather than described — no scanning the
 * board for clusters, and no chance of the copy disagreeing with the keyboard.
 */

/** C#, D#, F#, G#, A# — the five, in order. */
export const BLACK_PITCH_CLASSES: readonly PitchClass[] = [1, 3, 6, 8, 10];

/** How many black keys are in this one's group. */
export function groupSizeOf(pitchClass: PitchClass): 2 | 3 {
  return pitchClass < 5 ? 2 : 3;
}

/** Which of its group it is, counting from the left. */
export function groupIndexOf(pitchClass: PitchClass): number {
  return groupSizeOf(pitchClass) === 2 ? (pitchClass - 1) / 2 : (pitchClass - 6) / 2;
}

/** The white key the group hangs off: C for a pair, F for a three. */
export function anchorOf(pitchClass: PitchClass): PitchClass {
  return groupSizeOf(pitchClass) === 2 ? 0 : 5;
}

const PLACES: readonly string[] = ['left', 'middle', 'right'];

/** Where it sits, in words: "the left key of the group of 2". */
export function blackPlace(pitchClass: PitchClass): string {
  const size = groupSizeOf(pitchClass);
  const index = groupIndexOf(pitchClass);
  const place = size === 2 ? (index === 0 ? 'left' : 'right') : (PLACES[index] ?? 'left');
  return `the ${place} key of the group of ${size}`;
}

/** Which way a black-key prompt is put. */
export type BlackTask =
  /** Named, in one spelling or the other — go and press it. */
  | 'find'
  /** Lit on the board — say what it is. */
  | 'name'
  /** Lit on the board — is it in a group of 2 or a group of 3? */
  | 'group'
  /** Lit on the board — press the white key its group hangs off. */
  | 'white';

export interface BlackKeyConfig {
  id: string;
  /** The black keys in play. One of them makes a focused practice. */
  keys: readonly PitchClass[];
  naming: NoteNaming;
  /** Ways of asking; the first is where the drill opens. */
  tasks: readonly BlackTask[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** 2.9.2 – 2.9.6: one key, both its names, everywhere on the board. */
function focus(id: string, pitchClass: PitchClass, sharp: string, flat: string): BlackKeyConfig {
  return {
    id,
    keys: [pitchClass],
    naming: 'both',
    tasks: ['find', 'name'],
    goal: `${sharp} and ${flat} are one key — ${blackPlace(pitchClass)} — found without counting.`,
    steps: [
      `The prompt uses both spellings at random. ${sharp} and ${flat} are the same physical key.`,
      `Find the group first, then take ${blackPlace(pitchClass)}. Never count up from C.`,
      'Move around the board; every group has one of these.',
    ],
    watchFor: `Being slower on ${flat} than on ${sharp}. The panel scores the spellings separately, so it will tell you if you are.`,
  };
}

export const BLACK_KEY_DRILLS: Readonly<Record<string, BlackKeyConfig>> = {
  groups: {
    id: 'groups',
    keys: BLACK_PITCH_CLASSES,
    naming: 'both',
    tasks: ['group', 'white'],
    goal: 'The 2s and the 3s, and the white keys they hang off — the map everything else uses.',
    steps: [
      'A black key lights up. Say which group it is in — 2 or 3.',
      'Then the other half: press the white key immediately left of that group. C for a pair, F for a three.',
      'The pattern repeats the whole way up, so where you are on the board never matters.',
    ],
    watchFor:
      'Working out the answer from the note name. The shape tells you before the name does — that is the whole point of a landmark.',
  },
  'c-sharp': focus('c-sharp', 1, 'C#', 'Db'),
  'd-sharp': focus('d-sharp', 3, 'D#', 'Eb'),
  'f-sharp': focus('f-sharp', 6, 'F#', 'Gb'),
  'g-sharp': focus('g-sharp', 8, 'G#', 'Ab'),
  'a-sharp': focus('a-sharp', 10, 'A#', 'Bb'),
  random: {
    id: 'random',
    keys: BLACK_PITCH_CLASSES,
    naming: 'both',
    tasks: ['find', 'name', 'group'],
    goal: 'All five, in any order, both directions — name to key and key to name.',
    steps: [
      'No predictable order: the drill jumps between groups on purpose.',
      'Mixed asks all three ways, so you are never only doing the easy direction.',
      'Focus keeps calling the ones you are slow on until they stop being slow.',
    ],
    watchFor:
      'Translating a flat into a sharp before you move. Db should reach the key directly, not by way of C#.',
  },
};

export function getBlackKeyDrill(id: string): BlackKeyConfig {
  const config = BLACK_KEY_DRILLS[id];
  if (!config) throw new Error(`Unknown black-key drill: ${id}`);
  return config;
}

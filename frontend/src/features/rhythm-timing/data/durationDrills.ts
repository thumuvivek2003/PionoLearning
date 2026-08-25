import type { RhythmEvent } from './score';
import type { NoteValue } from './noteValues';

/**
 * Bucket 3.2 as data.
 *
 * Each practice is a written rhythm plus what it is testing. The first five
 * teach one value at a time, then rests put silence on the same footing as
 * sound, then the values are mixed so the pulse has to survive them changing,
 * and the last one stops asking when a note starts and starts asking when it
 * ends.
 */

export interface DurationDrillConfig {
  id: string;
  /** The written rhythm, in bars of four. */
  pattern: readonly RhythmEvent[];
  /** Values this practice is about — what the ledger is keyed on. */
  values: readonly NoteValue[];
  /** Walk up the five-finger position instead of repeating one note. */
  walking: boolean;
  /** Judge the release as well as the attack. */
  judgeRelease: boolean;
  tempos: readonly number[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

const note = (value: NoteValue): RhythmEvent => ({ value });
const rest = (value: NoteValue): RhythmEvent => ({ value, rest: true });
const times = (count: number, value: NoteValue): readonly RhythmEvent[] =>
  Array.from({ length: count }, () => note(value));

export const DURATION_DRILLS: Readonly<Record<string, DurationDrillConfig>> = {
  whole: {
    id: 'whole',
    pattern: times(2, 'whole'),
    values: ['whole'],
    walking: false,
    judgeRelease: true,
    tempos: [50, 60],
    goal: 'One note held across all four beats — pressed on one, released after four.',
    steps: [
      'Press on beat one and keep holding while you count to four.',
      'Release as four ends, not during it. The drill scores the release as well as the attack.',
      'Ten of these before anything shorter.',
    ],
    watchFor:
      'Letting go around beat two or three. The panel shows what share of the value you actually held, and a whole note is where the cutting-short habit starts.',
  },
  half: {
    id: 'half',
    pattern: times(4, 'half'),
    values: ['half'],
    walking: true,
    judgeRelease: true,
    tempos: [50, 60],
    goal: 'Two beats a note — and beat two belongs to the note, not to the next one.',
    steps: [
      'Press on one, hold through two, release, then again on three.',
      'The notes walk up the position, so the duration is the constant and the key is not.',
      'Do not play again on beat two. That is the mistake this practice exists to catch.',
    ],
    watchFor:
      'Re-attacking on the second beat of each note. Holding is doing something, even though it feels like doing nothing.',
  },
  quarter: {
    id: 'quarter',
    pattern: times(8, 'quarter'),
    values: ['quarter'],
    walking: true,
    judgeRelease: false,
    tempos: [50, 60, 72],
    goal: 'One sound placed on every pulse — not four keys pressed in a row.',
    steps: [
      'A note on each beat, walking up and back down the position.',
      'Think of it as placing a sound on a beat that was going to happen anyway.',
      'Even spacing matters more than speed; the panel scores each beat separately.',
    ],
    watchFor:
      'The line taking over from the click. If the notes start leading, the pulse has quietly become yours rather than the metronome’s.',
  },
  eighth: {
    id: 'eighth',
    pattern: times(16, 'eighth'),
    values: ['eighth'],
    walking: true,
    judgeRelease: false,
    tempos: [50, 60],
    goal: 'Two notes to a beat, evenly — one and two and three and four and.',
    steps: [
      'Start with the same note repeated, then let it walk once the grid is even.',
      'The gap from "1" to "&" must equal the gap from "&" to "2".',
      'The panel scores the offbeats separately, which is where the unevenness lives.',
    ],
    watchFor:
      'The "and" arriving late and clinging to the next beat. Uneven eighths almost always mean the offbeat is being played as a pickup.',
  },
  sixteenth: {
    id: 'sixteenth',
    pattern: times(16, 'sixteenth'),
    values: ['sixteenth'],
    walking: false,
    judgeRelease: false,
    tempos: [40, 50],
    goal: 'Four to a beat: one-ee-and-a — dividing a beat accurately, not playing fast.',
    steps: [
      'One note repeated, counted one ee and a, at a genuinely slow tempo.',
      'The four parts of the beat should be identical in length.',
      'Forty is not too slow for this. Speed is not what is being learnt.',
    ],
    watchFor:
      'The four notes bunching towards the front of the beat. If the last one is squeezed, slow down until all four are level.',
  },
  rests: {
    id: 'rests',
    pattern: [
      note('quarter'),
      rest('quarter'),
      note('quarter'),
      rest('quarter'),
      note('quarter'),
      note('quarter'),
      rest('quarter'),
      note('quarter'),
    ],
    values: ['quarter'],
    walking: true,
    judgeRelease: false,
    tempos: [50, 60],
    goal: 'Silence with a length: a rest is a beat you chose not to play.',
    steps: [
      'The score shows which beats are rests. Keep counting through them.',
      'Playing during a rest counts against you — the silence is written, not spare time.',
      'Say all four numbers out loud, including the silent ones.',
    ],
    watchFor:
      'Rushing after a rest. The beat did not go anywhere while you were silent, so the next note is not early.',
  },
  switching: {
    id: 'switching',
    pattern: [
      note('whole'),
      note('half'),
      note('half'),
      note('quarter'),
      note('quarter'),
      note('quarter'),
      note('quarter'),
      note('half'),
      note('eighth'),
      note('eighth'),
      note('eighth'),
      note('eighth'),
    ],
    values: ['whole', 'half', 'quarter', 'eighth'],
    walking: true,
    judgeRelease: true,
    tempos: [50, 60],
    goal: 'Values changing underneath an unchanged beat — whole to half to quarter to eighth.',
    steps: [
      'Read one bar ahead: the value changes, the pulse does not.',
      'Each note is scored under its own value, so the panel names the one that goes wrong.',
      'When a long note follows a short one, the temptation is to shorten it. Do not.',
    ],
    watchFor:
      'The long notes shrinking after a run of short ones. Momentum from eighths bleeds into the next whole note and cuts it in half.',
  },
  'hold-release': {
    id: 'hold-release',
    pattern: times(8, 'quarter'),
    values: ['quarter'],
    walking: true,
    judgeRelease: true,
    tempos: [50, 60],
    goal: 'The release is timed too: press on the beat, let go at the boundary.',
    steps: [
      'Press, hold, release, press — the release lands where the next beat begins.',
      'Both ends are scored: when the note started and how much of its value it kept.',
      'Neither clipped short nor running into the next beat.',
    ],
    watchFor:
      'Releasing halfway through the beat and waiting. That gap is silence you did not write, and it is what makes playing sound hesitant.',
  },
};

export function getDurationDrill(id: string): DurationDrillConfig {
  const config = DURATION_DRILLS[id];
  if (!config) throw new Error(`Unknown duration drill: ${id}`);
  return config;
}

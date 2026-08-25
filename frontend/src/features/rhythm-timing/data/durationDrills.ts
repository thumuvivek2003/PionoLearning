import type { DiceOptions } from './dice';
import type { RhythmEvent } from './score';
import type { NoteValue } from './noteValues';

/** One written rhythm a practice can deal. */
export interface PatternVariant {
  id: string;
  label: string;
  events: readonly RhythmEvent[];
}

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
  /** Written rhythms, in bars of four. More than one adds a control. */
  patterns: readonly PatternVariant[];
  /** Roll a fresh bar for every pass instead of dealing a written one. */
  dice?: Omit<DiceOptions, 'random'>;
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

const DURATIONS: Readonly<Record<string, DurationDrillConfig>> = {
  whole: {
    id: 'whole',
    patterns: [{ id: 'whole', label: 'Whole notes', events: times(2, 'whole') }],
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
    patterns: [{ id: 'half', label: 'Half notes', events: times(4, 'half') }],
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
    patterns: [{ id: 'quarter', label: 'Quarter notes', events: times(8, 'quarter') }],
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
    patterns: [{ id: 'eighth', label: 'Eighth notes', events: times(16, 'eighth') }],
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
    patterns: [{ id: 'sixteenth', label: 'Sixteenths', events: times(16, 'sixteenth') }],
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
    patterns: [
      {
        id: 'rests',
        label: 'Note and rest',
        events: [
          note('quarter'),
          rest('quarter'),
          note('quarter'),
          rest('quarter'),
          note('quarter'),
          note('quarter'),
          rest('quarter'),
          note('quarter'),
        ],
      },
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
    patterns: [
      {
        id: 'switching',
        label: 'Whole to eighths',
        events: [
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
      },
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
    patterns: [{ id: 'hold', label: 'Quarter notes', events: times(8, 'quarter') }],
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

/* ---------------- 3.5 · Rhythm Patterns ---------------- */

const bar = (id: string, label: string, events: readonly RhythmEvent[]): PatternVariant => ({
  id,
  label,
  events,
});

/** Two bars of the same shape, so a pattern has time to settle. */
const twice = (events: readonly RhythmEvent[]): readonly RhythmEvent[] => [...events, ...events];

const Q = note('quarter');
const E = note('eighth');
const H = note('half');
const ER = rest('eighth');

const PATTERNS: Readonly<Record<string, DurationDrillConfig>> = {
  'four-quarters': {
    id: 'four-quarters',
    patterns: [bar('quarters', '1 2 3 4', twice([Q, Q, Q, Q]))],
    values: ['quarter'],
    walking: false,
    judgeRelease: false,
    tempos: [60, 70, 80, 90],
    goal: 'One note on every beat, eight bars of it, without drifting.',
    steps: [
      'One key only — middle C. Count out loud and play on every number.',
      'Sixty first. Move up a step only when eight bars come out clean.',
      'The panel scores each beat separately; drift usually starts on one of them.',
    ],
    watchFor:
      'Playing between beats. A note that is nearly on the click is not on the click, and at this tempo there is no excuse for it.',
  },
  'half-half': {
    id: 'half-half',
    patterns: [bar('halves', 'Half + half', twice([H, H]))],
    values: ['half'],
    walking: false,
    judgeRelease: true,
    tempos: [60, 70, 80],
    goal: 'Two notes to a bar, each holding its full two beats.',
    steps: [
      'Play on one and on three. Nothing happens on two or four.',
      'Hold each note right through its second beat — the release is scored.',
      'Eight bars without an extra note creeping in.',
    ],
    watchFor:
      'Releasing early and waiting. That gap is silence you did not write, and it is the most common fault in this bucket.',
  },
  'quarter-half-quarter': {
    id: 'quarter-half-quarter',
    patterns: [
      bar('q-h-q', 'Q H Q', twice([Q, H, Q])),
      bar('h-q-q', 'H Q Q', twice([H, Q, Q])),
    ],
    values: ['quarter', 'half'],
    walking: false,
    judgeRelease: true,
    tempos: [60, 70, 80],
    goal: 'Short, long, short — durations changing while the pulse does not.',
    steps: [
      'Quarter on one, half across two and three, quarter on four.',
      'The other shape puts the long note first; alternate them once both hold.',
      'Each value is scored under its own name, so the panel names the one that slips.',
    ],
    watchFor:
      'The half note shrinking towards a quarter. Coming out of a short note, the hand wants to keep moving.',
  },
  'eighth-pairs': {
    id: 'eighth-pairs',
    patterns: [bar('eighths', '1 & 2 & 3 & 4 &', twice([E, E, E, E, E, E, E, E]))],
    values: ['eighth'],
    walking: false,
    judgeRelease: false,
    tempos: [50, 60, 70],
    goal: 'Two notes a beat, with the offbeat exactly halfway.',
    steps: [
      'Say the "and" out loud — properly, not swallowed.',
      'The gap from 1 to & must equal the gap from & to 2.',
      'The panel scores "&" apart from the numbers; that is where it goes wrong.',
    ],
    watchFor:
      'The offbeat drifting late and leaning on the next beat. Even eighths are a grid, not a pair of notes.',
  },
  'quarter-eighths': {
    id: 'quarter-eighths',
    patterns: [
      bar('a', 'Q E E E E Q', twice([Q, E, E, E, E, Q])),
      bar('b', 'E E Q E E Q', twice([E, E, Q, E, E, Q])),
      bar('c', 'Q E E Q E E', twice([Q, E, E, Q, E, E])),
    ],
    values: ['quarter', 'eighth'],
    walking: false,
    judgeRelease: false,
    tempos: [60, 70, 80],
    goal: 'Switching between one note a beat and two, without the tempo moving.',
    steps: [
      'Count all eight subdivisions whichever shape is on screen.',
      'Mixed deals a different one each pass, so the shape has to be read.',
      'The quarter after a pair of eighths is where the tempo usually shifts.',
    ],
    watchFor:
      'Speeding up during the eighths and slowing for the quarters. The beat is the same size throughout.',
  },
  'eighth-quarter': {
    id: 'eighth-quarter',
    patterns: [
      bar('a', 'E E Q E E Q', twice([E, E, Q, E, E, Q])),
      bar('b', 'E E Q Q E E', twice([E, E, Q, Q, E, E])),
      bar('c', 'E E E E Q Q', twice([E, E, E, E, Q, Q])),
    ],
    values: ['eighth', 'quarter'],
    walking: false,
    judgeRelease: false,
    tempos: [60, 70, 80],
    goal: 'Starting on the fast notes, which is harder than arriving at them.',
    steps: [
      'Say the subdivision, clap the shape, then play it — in that order.',
      'Eight repetitions of each shape before mixing them.',
      'Starting with eighths means the tempo is set by the first two notes; set it right.',
    ],
    watchFor:
      'The opening pair being too quick and the bar sagging afterwards to compensate.',
  },
  'note-rest': {
    id: 'note-rest',
    patterns: [
      bar('on-beats', 'Play on the numbers', twice([E, ER, E, ER, E, ER, E, ER])),
      bar('offbeats', 'Play on the "and"', twice([ER, E, ER, E, ER, E, ER, E])),
      bar('mixed', 'C - - C  C - - C', twice([E, ER, ER, E, E, ER, ER, E])),
    ],
    values: ['eighth'],
    walking: false,
    judgeRelease: false,
    tempos: [50, 60, 70],
    goal: 'Silence with a length — and counting that never stops for it.',
    steps: [
      'Clap the shape first, then play it, then count it without playing.',
      'The offbeat pattern is the hard one: nothing lands on the numbers at all.',
      'Playing during a rest is scored against you.',
    ],
    watchFor:
      'Getting lost after a rest. Never stop counting because you stopped playing — that is the whole bucket in one sentence.',
  },
  random: {
    id: 'random',
    patterns: [bar('seed', 'Rolled', twice([Q, E, E, Q, Q]).slice(0, 5))],
    dice: { palette: ['half', 'quarter', 'eighth'], bars: 2, rests: true },
    values: ['half', 'quarter', 'eighth'],
    walking: false,
    judgeRelease: false,
    tempos: [60, 70],
    goal: 'A bar you have never seen, played first time — one attempt, no restart.',
    steps: [
      'Roll a bar, read it, then play it with the click.',
      'A mistake is not a reason to start again: find the next beat and carry on.',
      'That recovery is the contest skill; real music does not stop for you.',
    ],
    watchFor:
      'Studying the bar until it is memorised. Read it once, play it once — the reading is the exercise.',
  },
};

export const DURATION_DRILLS: Readonly<Record<string, DurationDrillConfig>> = {
  ...DURATIONS,
  ...PATTERNS,
};

export function getDurationDrill(id: string): DurationDrillConfig {
  const config = DURATION_DRILLS[id];
  if (!config) throw new Error(`Unknown duration drill: ${id}`);
  return config;
}

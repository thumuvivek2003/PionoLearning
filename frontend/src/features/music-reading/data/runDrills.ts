import type { Clef, Step } from '../reading.types';
import { TOP_STEP, stepRange } from './staff';

/**
 * 6.2, 6.3, 6.9 and 6.10 as data — notes read in a line rather than one at a
 * time.
 *
 * Reading a single note is recognition; reading a line is reading, and the two
 * are not the same skill. Everything here is one printed run played left to
 * right, and what varies between the practices is how much of it you have to
 * take in at once: how many notes, whether they only step or may leap, whether
 * a second staff is going at the same time, and whether a click decides when
 * each one is due.
 */

/** The shapes a run may take — 6.10.2's patterns. */
export type Contour = 'up' | 'down' | 'same' | 'wave' | 'broken';

export const CONTOURS: readonly Contour[] = ['up', 'down', 'same', 'wave', 'broken'];

/** How each shape reads in a prompt. */
export const CONTOUR_NAME: Readonly<Record<Contour, string>> = {
  up: 'ascending',
  down: 'descending',
  same: 'repeated',
  wave: 'a wave',
  broken: 'broken',
};

/** Note lengths 6.10.5 reads against a click, in beats. */
export type NoteValue = 'whole' | 'half' | 'quarter';

export const VALUE_BEATS: Readonly<Record<NoteValue, number>> = {
  whole: 4,
  half: 2,
  quarter: 1,
};

export interface StaffRunConfig {
  id: string;
  clef: Clef;
  /** A second staff, sounding at the same time — the grand staff of 6.9.8. */
  second?: Clef;
  /** Shapes a run may take. */
  contours: readonly Contour[];
  /** How many notes a run shows. */
  length: number;
  /** Steps a run may start from. */
  starts: readonly Step[];
  /** Allow leaps of a third or more, not only neighbouring steps. */
  skips: boolean;
  /** A key signature in force for the whole run. */
  key?: string;
  /** Note lengths in play. One value means every note is the same length. */
  values: readonly NoteValue[];
  /** Play against a click, and score when each note landed. */
  metronome: boolean;
  tempos: readonly number[];
  /** Carry on through a wrong note rather than waiting for the right one. */
  noStopping: boolean;
  /** Allowance for the whole run, in ms, tightening as the session goes. */
  ladder: readonly number[];
  /** Runs before the session is done. */
  runs: number;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const base = {
  clef: 'treble' as Clef,
  contours: ['up'] as readonly Contour[],
  length: 5,
  skips: false,
  values: ['quarter'] as readonly NoteValue[],
  metronome: false,
  tempos: [50, 60, 70] as readonly number[],
  noStopping: false,
  ladder: [12000, 9000, 6000] as readonly number[],
  runs: 12,
} as const;

/** Starts that keep a run on or near the staff. */
const STARTS_UP: readonly Step[] = [-2, -1, 0, 1, 2, 3, 4];
const STARTS_DOWN: readonly Step[] = [TOP_STEP + 2, TOP_STEP + 1, TOP_STEP, 7, 6, 5, 4];
const STARTS_MID: readonly Step[] = [0, 1, 2, 3, 4, 5, 6];

/**
 * The steps of a run: a start, a shape, and whether leaps are allowed.
 *
 * Generated rather than stored so a practice can say "five notes, wave, no
 * leaps" and get something readable every time. The shape decides direction
 * per note; `skips` decides how far each move goes.
 */
export function runSteps(config: StaffRunConfig, start: Step, contour: Contour): readonly Step[] {
  const size = config.skips ? 2 : 1;
  const steps: Step[] = [start];

  for (let index = 1; index < config.length; index += 1) {
    const previous = steps[index - 1] as Step;
    if (contour === 'same') {
      steps.push(previous);
      continue;
    }
    if (contour === 'up') {
      steps.push(previous + size);
      continue;
    }
    if (contour === 'down') {
      steps.push(previous - size);
      continue;
    }
    if (contour === 'wave') {
      // Up, up, down, down — a line that turns round rather than one that runs.
      steps.push(previous + (index % 4 < 2 ? size : -size));
      continue;
    }
    // Broken: alternate a leap up with a step down, which is what an arpeggiated
    // figure looks like on the page.
    steps.push(previous + (index % 2 === 1 ? size + 1 : -size));
  }

  return steps;
}

/** The allowance for a run, stepping through the ladder as the session goes. */
export function allowanceAt(config: StaffRunConfig, run: number): number {
  if (config.ladder.length === 0) return 0;
  const perRung = Math.max(1, Math.ceil(config.runs / config.ladder.length));
  const rung = Math.min(config.ladder.length - 1, Math.floor(run / perRung));
  return config.ladder[rung] ?? 0;
}

/** When each note of a run is due, in beats, given its lengths. */
export function beatsOf(values: readonly NoteValue[]): readonly number[] {
  const beats: number[] = [];
  let at = 0;
  for (const value of values) {
    beats.push(at);
    at += VALUE_BEATS[value];
  }
  return beats;
}

/* ---------------- 6.2 and 6.3 · reading a line in one clef ---------------- */

/** The two direction practices each clef gets. */
function directionRun(clef: Clef, direction: 'up' | 'down'): StaffRunConfig {
  const rising = direction === 'up';
  return {
    ...base,
    id: `${clef === 'treble' ? '' : 'bass-'}${rising ? 'ascending' : 'descending'}`,
    clef,
    contours: [direction],
    starts: rising ? STARTS_UP : STARTS_DOWN,
    goal: `Five notes ${rising ? 'climbing' : 'falling'} — played in order, without naming each one first.`,
    guidance: [
      'A run appears and you play it left to right. Each note lights as you get it right.',
      'Steps rather than leaps, so the shape carries you: once you have the first note, the rest is direction.',
      'The whole run is timed, and the allowance tightens as the session runs.',
    ],
    watchFor: rising
      ? 'Reading every note from scratch. A rising run is one note plus four steps, and reading it that way is several times faster.'
      : 'Working out the top note and then counting downward one at a time. That is reading the run backwards, and it never gets quick.',
  };
}

/* ---------------- 6.9 · sight reading ---------------- */

/** 6.9.1 to 6.9.3 — one note, then two, then three. */
function sightSize(length: number, goal: string, watchFor: string): StaffRunConfig {
  return {
    ...base,
    id: `sight-${length}`,
    contours: length === 1 ? ['same'] : ['up', 'down', 'wave'],
    length,
    starts: STARTS_MID,
    ladder: [8000, 6000, 4000],
    runs: 15,
    goal,
    guidance: [
      `${length} note${length === 1 ? '' : 's'} at a time, taken in as one thing rather than ${length === 1 ? 'a puzzle' : 'one at a time'}.`,
      'Look at the whole group before you play any of it.',
      'The allowance covers the whole group, so stopping between notes costs you.',
    ],
    watchFor,
  };
}

const SIGHT_DRILLS: Readonly<Record<string, StaffRunConfig>> = {
  'sight-melody': {
    ...base,
    id: 'sight-melody',
    contours: CONTOURS,
    length: 8,
    starts: STARTS_MID,
    skips: true,
    ladder: [20000, 15000, 12000],
    runs: 10,
    goal: 'Eight notes with leaps in them — a melody rather than a run.',
    guidance: [
      'Shapes of every kind, including leaps. This is what music actually looks like.',
      'Read the shape first, then the notes it is made of.',
      'Do not learn the melody before playing it. Reading it once is the exercise.',
    ],
    watchFor:
      'Memorising the run and then playing from memory. That is practising recall, and it is the opposite of sight reading.',
  },
  'sight-treble': {
    ...base,
    id: 'sight-treble',
    contours: CONTOURS,
    length: 6,
    starts: STARTS_MID,
    skips: true,
    ladder: [15000, 12000, 9000],
    goal: 'The upper staff, read comfortably — six notes at a time.',
    guidance: [
      'Treble only, with leaps and every shape in the pool.',
      'The clef is fixed, so nothing is being tested except reading the notes.',
      'Where you hesitate, the panel names the note rather than the run.',
    ],
    watchFor:
      'Counting up from the bottom line each time. Use the G line as the anchor and count from there.',
  },
  'sight-bass': {
    ...base,
    id: 'sight-bass',
    clef: 'bass',
    contours: CONTOURS,
    length: 6,
    starts: STARTS_MID,
    skips: true,
    ladder: [15000, 12000, 9000],
    goal: 'The lower staff, which almost everybody reads more slowly.',
    guidance: [
      'Identical to the treble practice except for the clef. Compare the two times.',
      'Anchor on the F line, the same way you anchor on G in treble.',
      'A gap between the clefs is normal and worth closing.',
    ],
    watchFor:
      'Converting bass to treble in your head and then adjusting. It gives the right note eventually and it never becomes fast.',
  },
  'sight-hands-separately': {
    ...base,
    id: 'sight-hands-separately',
    contours: CONTOURS,
    length: 6,
    starts: STARTS_MID,
    skips: true,
    ladder: [15000, 12000, 9000],
    runs: 16,
    goal: 'Each staff on its own, alternating — so neither hand gets to be the one you never practise.',
    guidance: [
      'Runs come in treble and bass in turn. Switch the clef in the panel to change hands.',
      'Both hands need to read independently before either can read together.',
      'Scores are kept per note, and the notes are per clef, so the weaker staff shows up on its own.',
    ],
    watchFor:
      'Practising the comfortable clef because progress feels better there. The panel counts both, and the gap is the thing to work on.',
  },
  'sight-hands-together': {
    ...base,
    id: 'sight-hands-together',
    second: 'bass',
    contours: ['up', 'down', 'wave'],
    length: 5,
    starts: STARTS_MID,
    ladder: [20000, 16000, 12000],
    runs: 10,
    goal: 'Both staves at once: a note in each hand, sounding together.',
    guidance: [
      'Treble above, bass below, one note each. Press both before the next pair.',
      'Read the pair as one thing. Reading the top and then the bottom is two readings and twice the time.',
      'Slower than one staff, and that is expected. Accuracy is the whole measure.',
    ],
    watchFor:
      'Reading the treble and letting the bass follow. Both staves are being read; the lower one is not an accompaniment to the reading.',
  },
  'sight-no-stopping': {
    ...base,
    id: 'sight-no-stopping',
    contours: CONTOURS,
    length: 8,
    starts: STARTS_MID,
    skips: true,
    noStopping: true,
    ladder: [18000, 14000, 11000],
    runs: 10,
    goal: 'Carry on through mistakes — a wrong note does not stop the run.',
    guidance: [
      'A wrong note is recorded and the run moves on. There is no waiting for the right one.',
      'Stopping to fix things is the habit that makes reading unusable in performance.',
      'The score is how many you got right, not whether you got through cleanly.',
    ],
    watchFor:
      'Going back to correct yourself out of habit. The run has already moved on; the correction costs you the next note as well.',
  },
  'sight-metronome': {
    ...base,
    id: 'sight-metronome',
    contours: ['up', 'down', 'wave'],
    length: 8,
    starts: STARTS_MID,
    metronome: true,
    noStopping: true,
    tempos: [40, 50, 60, 70],
    ladder: [],
    runs: 10,
    goal: 'Reading in time: one note per click, and the click does not wait.',
    guidance: [
      'The metronome decides when each note is due. Land on the beat rather than as soon as you have read it.',
      'A note missed is a note gone — the run carries on either way.',
      'Forty is not too slow to start. Reading in time is harder than reading.',
    ],
    watchFor:
      'Speeding up on the easy notes and stalling on the hard ones. The click is what turns reading into playing.',
  },
};

/* ---------------- 6.10 · fluency ---------------- */

const FLUENCY_DRILLS: Readonly<Record<string, StaffRunConfig>> = {
  'fluency-rhythm': {
    ...base,
    id: 'fluency-rhythm',
    contours: ['up', 'down', 'wave'],
    length: 6,
    starts: STARTS_MID,
    values: ['whole', 'half', 'quarter'],
    metronome: true,
    noStopping: true,
    tempos: [50, 60, 70],
    ladder: [],
    runs: 10,
    goal: 'Notes with lengths: read what to play and how long to hold it.',
    guidance: [
      'A hollow notehead is a half or whole note; a filled one is a quarter. The strip shows how many beats each lasts.',
      'The next note is due when the last one has had its beats, not as soon as you have read it.',
      'Pitch and rhythm together is the point — either alone is easier than both.',
    ],
    watchFor:
      'Playing every note as a quarter because the pitches are right. Half the information on the page is how long each note lasts.',
  },
  'fluency-signature': {
    ...base,
    id: 'fluency-signature',
    contours: CONTOURS,
    length: 6,
    starts: STARTS_MID,
    skips: true,
    key: 'G',
    ladder: [15000, 12000, 9000],
    goal: 'A key signature in force while you read — remembered, with nothing beside the notes.',
    guidance: [
      'The signature is drawn once after the clef and applies to every note of that letter.',
      'No sign appears next to the altered notes. Remembering the key is the task.',
      'This is where reading and 6.6 finally meet.',
    ],
    watchFor:
      'Playing the plain note because nothing was drawn beside it. That is exactly what a signature does, and exactly how it catches people.',
  },
  'fluency-slow': {
    ...base,
    id: 'fluency-slow',
    contours: CONTOURS,
    length: 8,
    starts: STARTS_MID,
    skips: true,
    ladder: [24000, 20000, 16000],
    runs: 8,
    goal: 'Eight notes with as much time as you need — accuracy before anything else.',
    guidance: [
      'A generous allowance on purpose. Get every note right.',
      'Read the shape, then the notes, then play. Do not rush the reading to save time on the playing.',
      'When this is reliably clean, move to the medium practice.',
    ],
    watchFor:
      'Using the time to work notes out one at a time. Slow is for reading properly, not for calculating.',
  },
  'fluency-medium': {
    ...base,
    id: 'fluency-medium',
    contours: CONTOURS,
    length: 8,
    starts: STARTS_MID,
    skips: true,
    ladder: [14000, 11000, 8000],
    runs: 10,
    goal: 'The same runs at a pace that does not allow calculating.',
    guidance: [
      'Half the time of the slow practice, on identical material.',
      'If accuracy falls apart here, the slow practice was being got through rather than learnt.',
      'The panel names the notes that cost you the time.',
    ],
    watchFor:
      'Accepting a lower accuracy because it is faster. Speed that costs accuracy is not progress, it is a different exercise.',
  },
  'fluency-timed': {
    ...base,
    id: 'fluency-timed',
    contours: CONTOURS,
    length: 8,
    starts: STARTS_MID,
    skips: true,
    key: 'G',
    noStopping: true,
    ladder: [12000, 9000, 7000, 5000],
    runs: 12,
    goal: 'Contest conditions: a signature in force, no stopping, and a clock that keeps tightening.',
    guidance: [
      'Everything at once — leaps, a key signature, and an allowance that ends at five seconds for eight notes.',
      'Wrong notes do not stop the run. Neither does running out of time.',
      'The number worth knowing is the tightest rung you stayed accurate at.',
    ],
    watchFor:
      'Chasing the last rung. The rung you can hold cleanly is your reading speed; the one past it is just noise.',
  },
};

/* ---------------- 8.5 · sight reading at level 8 ---------------- */

/**
 * The same act as 6.9, under performance conditions.
 *
 * Level 8 adds no reading skill — it adds pressure. These are longer runs, both
 * clefs, tighter clocks and no stopping, and they live here because reading is
 * what this feature owns. What makes them level 8 is that nothing is optional.
 */
const PERFORMANCE_READING: Readonly<Record<string, StaffRunConfig>> = {
  'perf-notes': {
    ...base,
    id: 'perf-notes',
    contours: ['same'],
    length: 1,
    starts: stepRange(-2, TOP_STEP + 2),
    ladder: [3000, 2000, 1500],
    runs: 20,
    goal: 'One note at a time, down to a second and a half — recognition, not counting.',
    guidance: [
      'Single notes from across the staff and past it, played as fast as they can be read.',
      'A second and a half is not enough to count lines. It is enough to recognise one.',
      'Scores are per note, so the two or three that always cost you get named.',
    ],
    watchFor:
      'Counting up from a landmark. It gives the right key and it is the ceiling on your reading speed.',
  },
  'perf-melodies': {
    ...base,
    id: 'perf-melodies',
    contours: CONTOURS,
    length: 6,
    starts: stepRange(0, 4),
    skips: true,
    ladder: [14000, 11000, 8000],
    runs: 12,
    goal: 'Six-note melodies with leaps, read once and played.',
    guidance: [
      'Every shape in the pool, including leaps. This is what music looks like.',
      'Read the shape first, then the notes it is made of.',
      'Do not learn it before playing it. Reading it once is the exercise.',
    ],
    watchFor:
      'Memorising the run and playing from memory. That practises recall and is the opposite of sight reading.',
  },
  'perf-rh': {
    ...base,
    id: 'perf-rh',
    contours: CONTOURS,
    length: 6,
    starts: stepRange(0, 4),
    skips: true,
    ladder: [12000, 10000, 8000],
    runs: 12,
    goal: 'The treble staff under a clock — the right hand on its own.',
    guidance: [
      'Treble only, so nothing is tested but reading the notes.',
      'Anchor on the G line and count from there rather than the bottom.',
      'Compare your time against the bass practice afterwards.',
    ],
    watchFor:
      'Being fast inside the staff and slow past it. Ledger notes are in the pool for a reason.',
  },
  'perf-lh': {
    ...base,
    id: 'perf-lh',
    clef: 'bass',
    contours: CONTOURS,
    length: 6,
    starts: stepRange(0, 4),
    skips: true,
    ladder: [12000, 10000, 8000],
    runs: 12,
    goal: 'The bass staff under the same clock — where almost everybody is slower.',
    guidance: [
      'Identical to the treble practice with the clef changed.',
      'Anchor on the F line the way you anchor on G in treble.',
      'The gap between the two clefs is normal, measurable and worth closing.',
    ],
    watchFor:
      'Converting bass to treble in your head. It gives the right note eventually and never becomes fast.',
  },
  'perf-together': {
    ...base,
    id: 'perf-together',
    second: 'bass',
    contours: ['up', 'down', 'wave'],
    length: 5,
    starts: stepRange(0, 4),
    ladder: [18000, 15000, 12000],
    runs: 10,
    goal: 'Both staves at once, against a clock.',
    guidance: [
      'A note in each hand, sounding together, five times over.',
      'Read the pair as one thing. Reading the top and then the bottom is two readings.',
      'Slower than one staff, and that is expected.',
    ],
    watchFor:
      'Reading the treble and letting the bass follow. Both staves are being read.',
  },
  'perf-rhythm': {
    ...base,
    id: 'perf-rhythm',
    contours: ['up', 'down', 'wave'],
    length: 6,
    starts: stepRange(0, 4),
    values: ['whole', 'half', 'quarter'],
    metronome: true,
    noStopping: true,
    tempos: [50, 60, 70],
    ladder: [],
    runs: 10,
    goal: 'Notes and their lengths together, against a click that does not wait.',
    guidance: [
      'Hollow heads are longer notes; the strip shows how many beats each lasts.',
      'The next note is due when the last has had its beats, not when your finger is ready.',
      'Half the information on a page is how long each note lasts.',
    ],
    watchFor:
      'Playing everything as quarters because the pitches are right. That is half a reading.',
  },
  'perf-nostop': {
    ...base,
    id: 'perf-nostop',
    contours: CONTOURS,
    length: 8,
    starts: stepRange(0, 4),
    skips: true,
    noStopping: true,
    ladder: [16000, 13000, 10000],
    runs: 10,
    goal: 'Eight notes, and a wrong one does not stop the run.',
    guidance: [
      'A miss is recorded and the run moves on. There is no waiting.',
      'Stopping to fix things is what makes reading unusable in performance.',
      'The score is how many landed right, not whether it was tidy.',
    ],
    watchFor:
      'Going back to correct yourself. The run has moved on and the correction costs the next note too.',
  },
  'perf-first-play': {
    ...base,
    id: 'perf-first-play',
    contours: CONTOURS,
    length: 8,
    starts: stepRange(-2, 4),
    skips: true,
    noStopping: true,
    ladder: [12000, 10000, 8000],
    runs: 8,
    goal: 'First play, no second chance — the tightest reading in the curriculum.',
    guidance: [
      'Eight notes with leaps and ledgers, no stopping, and eight seconds by the end.',
      'You get one attempt at each run. That is what sight reading is.',
      'Read the whole run before the first note rather than reading as you go.',
    ],
    watchFor:
      'Starting before you have looked at the end of the run. The last two notes are where a first play falls apart.',
  },
};

export const STAFF_RUN_DRILLS: Readonly<Record<string, StaffRunConfig>> = {
  ascending: directionRun('treble', 'up'),
  descending: directionRun('treble', 'down'),
  'bass-ascending': directionRun('bass', 'up'),
  'bass-descending': directionRun('bass', 'down'),
  'sight-1': sightSize(
    1,
    'One note at a time, read and played — the smallest possible unit of sight reading.',
    'Naming the note out loud before playing it. The name is a step you should be able to skip.',
  ),
  'sight-2': sightSize(
    2,
    'Two notes taken in together — the movement between them, not two separate readings.',
    'Reading the first, playing it, then reading the second. That is one-note reading done twice.',
  ),
  'sight-3': sightSize(
    3,
    'Three notes as one shape — the beginning of reading in groups.',
    'Losing the third note while playing the first. Three is where short-term visual memory starts being tested.',
  ),
  ...SIGHT_DRILLS,
  ...FLUENCY_DRILLS,
  ...PERFORMANCE_READING,
};

export function getStaffRunDrill(id: string): StaffRunConfig {
  const config = STAFF_RUN_DRILLS[id];
  if (!config) throw new Error(`Unknown staff run drill: ${id}`);
  return config;
}

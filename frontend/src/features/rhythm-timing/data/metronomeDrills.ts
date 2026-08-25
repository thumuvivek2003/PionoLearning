/**
 * Bucket 3.4 as data.
 *
 * All ten practices are the same act — play with the click — separated by what
 * the click is doing. It can sit at one tempo while you prove you can stay with
 * it, climb until you fall off, disappear for a stretch to see whether you kept
 * going, or walk through several tempos to find where your timing starts to
 * slide. The last of those is the one worth having: rushing rarely arrives all
 * at once, it arrives at a particular speed.
 */

export type MetronomeMode =
  /** Listen and tap; nothing to play. */
  | 'listen'
  /** One tempo, held until it is comfortable. */
  | 'fixed'
  /** Rungs earned by clean repetitions and lost by messy ones. */
  | 'ladder'
  /** The click drops out for a stretch and comes back to check on you. */
  | 'gap'
  /** The same test at several tempos, to find where the timing goes. */
  | 'sweep';

/** What to play against the click. */
export type LineId = 'single' | 'four' | 'scale';

export interface MetronomeDrillConfig {
  id: string;
  mode: MetronomeMode;
  /** One tempo for a fixed practice, the rungs for a ladder, the set for a sweep. */
  tempos: readonly number[];
  line: LineId;
  /** Beats the click drops out for; several entries add a control. */
  gaps?: readonly number[];
  /** Clean repetitions needed to earn the next rung. */
  repsPerRung?: number;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/** The lines, in white-key steps from where the hand starts. */
export const LINES: Readonly<Record<LineId, readonly number[]>> = {
  single: [0],
  four: [0, 1, 2, 3, 4, 3, 2, 1],
  scale: [0, 1, 2, 3, 4, 5, 6, 7],
};

export const LINE_LABELS: Readonly<Record<LineId, string>> = {
  single: 'One note',
  four: 'C D E F G F E D',
  scale: 'Scale, C to C',
};

/** 3.4.2 – 3.4.7: one tempo each, from very slow to quick. */
function atTempo(bpm: number, goal: string, steps: readonly string[], watchFor: string): MetronomeDrillConfig {
  return { id: `bpm-${bpm}`, mode: 'fixed', tempos: [bpm], line: 'four', goal, steps, watchFor };
}

export const METRONOME_DRILLS: Readonly<Record<string, MetronomeDrillConfig>> = {
  understanding: {
    id: 'understanding',
    mode: 'listen',
    tempos: [60, 80, 100, 120],
    line: 'single',
    goal: 'What a tempo actually is: 60 BPM is one click a second, and 120 is two.',
    steps: [
      'Listen first without tapping. Count one two three four along with the clicks.',
      'Then tap on every click — the pad, the space bar, or a key.',
      'Change the tempo and notice how the same counting feels at each one.',
    ],
    watchFor:
      'Chasing the click rather than sitting on it. If every tap lands slightly late, you are following the sound instead of predicting it.',
  },
  'bpm-40': atTempo(
    40,
    'Forty is deliberately slow, and slow tempos show timing problems that fast ones hide.',
    [
      'One note per click: click, play, wait. Do not fill the silence between them.',
      'Three unbroken minutes is the target — no rushing, no dragging, no extra notes.',
      'The waiting is the exercise; that gap is where patience gets built.',
    ],
    'Adding an unwritten note in the gap. A long space between clicks is uncomfortable, and the hand tries to fill it.',
  ),
  'bpm-50': atTempo(
    50,
    'A little quicker, and the note changes have to land with the click rather than between them.',
    [
      'Play the line straight through and keep the pulse when you make a mistake.',
      'Do not stop for an error — recover and stay with the beat.',
      'Three minutes with very few timing errors before moving up.',
    ],
    'Stopping to fix a wrong note. Losing the beat costs more than the note did.',
  ),
  'bpm-60': atTempo(
    60,
    'Your baseline: one click a second, comfortable rather than stressful.',
    [
      'The line, one note per click, ascending and back down.',
      'A minute of listening, then a few minutes of playing.',
      'This is the tempo everything else gets compared against.',
    ],
    'Comfort turning into inattention. Sixty is easy enough that the click can become background noise.',
  ),
  'bpm-80': atTempo(
    80,
    'Moderate: the first tempo where accuracy has to be defended rather than assumed.',
    [
      'Ten repetitions of the line at the same tempo throughout.',
      'Do not accelerate as you go — the last repetition should match the first.',
      'The panel scores each beat of the bar; drift shows up there first.',
    ],
    'A creeping "click-note, click-notenote" — that is rushing arriving, and it starts on one beat before it spreads.',
  ),
  'bpm-100': atTempo(
    100,
    'Quick enough that timing has to be led rather than followed.',
    [
      'A familiar line only. The point is the timing, not the difficulty.',
      'Play eight beats, stop for four, come back in exactly on one.',
      'If accuracy drops here, go back to 80. That is training, not failure.',
    ],
    'Technique quietly collapsing to keep up. If the hand tightens, the tempo is above your current one.',
  ),
  'bpm-120': atTempo(
    120,
    'Two beats a second — can the pulse hold at all, never mind the notes.',
    [
      'Simple material only, played continuously for about a minute.',
      'Three of those with rests between them.',
      'If it will not hold, walk it down: 110, 100, 90 — the first one that holds is your tempo.',
    ],
    'Treating this as a target. The fastest tempo where you are still accurate is the useful number, and it is often not this one.',
  ),
  ladder: {
    id: 'ladder',
    mode: 'ladder',
    tempos: [60, 70, 80, 90, 100, 110, 120],
    line: 'four',
    repsPerRung: 5,
    goal: 'Climb one rung at a time and stop where accuracy stops — that tempo is the useful one.',
    steps: [
      'Five clean repetitions earn the next rung; a messy one gives it back.',
      'Sixty up to a hundred and twenty, ten at a time.',
      'The rung you settle on is today’s honest tempo. Next session, try to make the one above it stable.',
    ],
    watchFor:
      'Forcing a rung that keeps failing. Repeating it badly five times teaches the mistake — go back down and earn it instead.',
  },
  gap: {
    id: 'gap',
    mode: 'gap',
    tempos: [60, 80],
    line: 'four',
    gaps: [4, 8, 16, 32],
    goal: 'The click disappears for a stretch and returns — did your pulse stay where it was?',
    steps: [
      'Play with the click, then keep playing through the silence at the same tempo.',
      'When it comes back, the drill measures how far your beat had drifted.',
      'Four beats of silence first, then eight, then sixteen, then thirty-two.',
    ],
    watchFor:
      'Speeding up in the silence, which is what almost everyone does. The number the drill shows on the return is the honest one.',
  },
  accuracy: {
    id: 'accuracy',
    mode: 'sweep',
    tempos: [60, 80, 100, 120],
    line: 'single',
    repsPerRung: 4,
    goal: 'Where does your timing start to slide? The same test at four tempos, scored separately.',
    steps: [
      'One note repeated with the click, a few bars at each tempo in turn.',
      'Listen for whether your note and the click merge into one sound.',
      'The panel scores each tempo on its own, so it names the one where it starts going wrong.',
    ],
    watchFor:
      'Assuming a problem is everywhere. Most timing faults belong to a particular speed — this is the practice that finds which.',
  },
};

export function getMetronomeDrill(id: string): MetronomeDrillConfig {
  const config = METRONOME_DRILLS[id];
  if (!config) throw new Error(`Unknown metronome drill: ${id}`);
  return config;
}

/**
 * Buckets 3.7 and 3.8 as data.
 *
 * Both play a phrase against the click; what changes is how much help there is
 * and what is being watched. The practical bucket climbs from one key to a tune
 * and then removes the counting; the contest bucket takes the same tune and
 * asks whether it starts, holds and finishes like a performance.
 */

export type PhraseFocus =
  /** Play the phrase and land the notes. */
  | 'play'
  /** The count for each note is shown as it arrives. */
  | 'count'
  /** The click drops out for stretches; the pulse is yours. */
  | 'internal'
  /** A full run, then the numbers and the review list. */
  | 'review'
  /** A full run scored as a performance would be. */
  | 'perform';

export interface PhraseDrillConfig {
  id: string;
  /** Which set of phrases the practice draws from. */
  set: string;
  focus: PhraseFocus;
  tempos: readonly number[];
  /** Bars the click sounds for, and then drops out for. */
  gap?: { sounding: number; silent: readonly number[] };
  /** Judge the run as a contest performance and show the card. */
  scorecard?: boolean;
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

/* ---------------- 3.7 · Practical Keyboard Rhythm ---------------- */

const PRACTICAL: Readonly<Record<string, PhraseDrillConfig>> = {
  'single-note': {
    id: 'single-note',
    set: 'single',
    focus: 'play',
    tempos: [60, 70, 80, 90],
    goal: 'One key, several rhythms — the note is not what makes the rhythm.',
    steps: [
      'Middle C throughout. Only the timing changes between the shapes.',
      'Quarters, offbeats, notes with rests, then eighths.',
      'Move the tempo up only while the placement holds.',
    ],
    watchFor:
      'Judging yourself on speed. The question here is only whether each note landed where it was meant to.',
  },
  'two-note': {
    id: 'two-note',
    set: 'two',
    focus: 'play',
    tempos: [60, 70, 80],
    goal: 'Two keys: pitch starts moving and the pulse does not notice.',
    steps: [
      'C and D, alternating, then the same with gaps in it.',
      'The fingers should follow the rhythm, not play just because there is another key.',
      'Keep the hand relaxed — a change of note is not a change of effort.',
    ],
    watchFor:
      'The second note arriving early because the hand was already there. Moving is not the same as playing.',
  },
  'three-note': {
    id: 'three-note',
    set: 'three',
    focus: 'play',
    tempos: [60, 70, 80],
    goal: 'Three notes as one small sentence, with a clean start and a clean end.',
    steps: [
      'C D E in several orders. Play each shape as a phrase, not as three presses.',
      'Land every note where the count says, then stop cleanly.',
      'Different orders stop the hand running a memorised sequence.',
    ],
    watchFor:
      'Rushing the middle note. In a three-note shape it is always the one that gets squeezed.',
  },
  'four-note': {
    id: 'four-note',
    set: 'four',
    focus: 'play',
    tempos: [60, 70, 80],
    goal: 'Four keys, movement and rhythm together — the beat leads, the fingers follow.',
    steps: [
      'C D E F up and back, then the same with a rest in it, then in eighths.',
      'The metronome stays where it is while the shape changes.',
      'Your fingers adapt to the beat. The beat never adapts to your fingers.',
    ],
    watchFor:
      'The tempo bending to suit the eighth-note shape. If the click and the notes disagree, the click is right.',
  },
  melody: {
    id: 'melody',
    set: 'melody',
    focus: 'play',
    tempos: [60, 70, 80],
    goal: 'A real tune with the click — timing first, and no stopping for a wrong note.',
    steps: [
      'A melody you already know, so the notes are not the problem.',
      'A wrong note is not a reason to stop; find the next beat and carry on.',
      'Sixty, then seventy, then eighty, as consistency allows.',
    ],
    watchFor:
      'Stopping to fix something. A slightly wrong note in time is worth more than a right one out of it.',
  },
  'melody-counting': {
    id: 'melody-counting',
    set: 'melody',
    focus: 'count',
    tempos: [60, 70],
    goal: 'The same tune with the counting shown — brain, voice and fingers together.',
    steps: [
      'Every note shows the count it lands on. Say it out loud as you play.',
      'You are learning "this note happens on beat two", not "this key comes after that key".',
      'If counting and playing will not go together, slow down rather than push on.',
    ],
    watchFor:
      'The counting stopping the moment the tune gets awkward. The voice should be the steady part.',
  },
  'melody-internal': {
    id: 'melody-internal',
    set: 'melody',
    focus: 'internal',
    tempos: [60, 70],
    gap: { sounding: 2, silent: [2, 4] },
    goal: 'The same tune with the click coming and going — the pulse has to be yours.',
    steps: [
      'Two bars of clicking, then two without. Keep playing straight through.',
      'Do not guess when it returns; keep counting and let it arrive.',
      'The drill scores the first note back on its own — that is the test.',
    ],
    watchFor:
      'Speeding up in the silence. It is the commonest result, and it feels like nothing at all from inside.',
  },
  review: {
    id: 'review',
    set: 'melody',
    focus: 'review',
    tempos: [60, 70, 80],
    goal: 'Play it through once, then read what happened — become your own rhythm teacher.',
    steps: [
      'One full run, no restarting, whatever happens.',
      'Then read the numbers and the list together, and record yourself too if you can.',
      'Pick one problem for the next session. One.',
    ],
    watchFor:
      'Fixing everything at once and therefore nothing. The list is there to be narrowed down, not worked through.',
  },
};

/* ---------------- 3.8 · Contest-Level Timing ---------------- */

const CONTEST: Readonly<Record<string, PhraseDrillConfig>> = {
  'count-in': {
    id: 'count-in',
    set: 'melody',
    focus: 'play',
    tempos: [60, 70, 80],
    goal: 'Begin exactly on the beat and at the right tempo, every single time.',
    steps: [
      'A bar of clicks, then start on the next one. Five to ten repetitions.',
      'Count aloud first, then internally, then with nothing but the click.',
      'The first note is scored on its own, so hesitation shows immediately.',
    ],
    watchFor:
      'Starting while still deciding to start. The count-in is where the decision is made; the downbeat is where the note goes.',
  },
  consistent: {
    id: 'consistent',
    set: 'melody',
    focus: 'perform',
    tempos: [60, 70, 80, 90],
    goal: 'One tempo from the first note to the last — no acceleration, no sagging.',
    steps: [
      'Play the whole thing. Beauty is not the job; the same speed throughout is.',
      'The drill compares your opening third with your closing third and names the difference.',
      'Then try it at each tempo in turn.',
    ],
    watchFor:
      'Speeding up after the hard part is over. Relief is the most common cause of a tempo change.',
  },
  'through-mistakes': {
    id: 'through-mistakes',
    set: 'melody',
    focus: 'perform',
    tempos: [60, 70],
    goal: 'A wrong note is a small problem. Losing the beat is a bigger one.',
    steps: [
      'Play it through. When something goes wrong, think "next beat" and nothing else.',
      'The drill counts how long recovery takes and whether the run ever actually stopped.',
      'Do not correct the note you just played. It has gone.',
    ],
    watchFor:
      'The pause after a mistake. A listener forgives a wrong note; they cannot miss a silence.',
  },
  tempos: {
    id: 'tempos',
    set: 'melody',
    focus: 'perform',
    tempos: [50, 60, 70, 80, 90, 100],
    goal: 'The same piece at six tempos — the rhythm should survive all of them.',
    steps: [
      'Fifty for accuracy and relaxation, eighty for consistency, a hundred for holding on.',
      'Slow is not easy: there is more time to hear every error.',
      'Change tempo between runs and see which ones fall apart.',
    ],
    watchFor:
      'Only ever practising at the one comfortable speed. A piece that works at a single tempo does not really work.',
  },
  'no-metronome': {
    id: 'no-metronome',
    set: 'melody',
    focus: 'internal',
    tempos: [60, 70],
    gap: { sounding: 4, silent: [4, 8, 16] },
    goal: 'Play with the click, then without it, and see where your tempo went.',
    steps: [
      'Four bars with, four without, and keep everything the same.',
      'When the click returns it either agrees with you or it does not.',
      'Lengthen the silence to eight bars, then sixteen.',
    ],
    watchFor:
      'Trying to guess where the click will be. Keep counting instead; guessing is what makes the return sound wrong.',
  },
  'return-test': {
    id: 'return-test',
    set: 'melody',
    focus: 'internal',
    tempos: [60],
    gap: { sounding: 4, silent: [8, 16] },
    goal: 'The long version: eight or sixteen bars alone, then the click again.',
    steps: [
      'Four bars with the click, then a long stretch without.',
      'The first note back is measured on its own — that number is your internal clock.',
      'Sixteen bars is the real test, and it is meant to be hard.',
    ],
    watchFor:
      'Drift that grows the longer the silence runs. A small error a bar becomes a large one by the end.',
  },
  performance: {
    id: 'performance',
    set: 'melody',
    focus: 'perform',
    tempos: [60, 70, 80],
    goal: 'Beginning to end without stopping — a performance rather than a practice.',
    steps: [
      'Sit properly, hear the tempo, count in, begin. Then do not stop for anything.',
      'While playing, ask where the beat is, never whether that note was right.',
      'Afterwards, read the numbers before you play it again.',
    ],
    watchFor:
      'Practising the beginning ten times and the ending never. A performance is the whole thing, every time.',
  },
  mock: {
    id: 'mock',
    set: 'melody',
    focus: 'perform',
    tempos: [60, 70, 80],
    scorecard: true,
    goal: 'Contest conditions: one attempt, scored the way the reference scores it.',
    steps: [
      'No restarting, no stopping, no fixing. One run, whatever happens.',
      'The card marks starting tempo, consistency, accuracy, recovery, continuity and the ending.',
      'Then take the lowest row and make that alone your next session.',
    ],
    watchFor:
      'Treating a poor card as a verdict. It is a list of what to practise, and the lowest row is the whole message.',
  },
};

export const PHRASE_DRILLS: Readonly<Record<string, PhraseDrillConfig>> = {
  ...PRACTICAL,
  ...CONTEST,
};

export function getPhraseDrill(id: string): PhraseDrillConfig {
  const config = PHRASE_DRILLS[id];
  if (!config) throw new Error(`Unknown phrase drill: ${id}`);
  return config;
}

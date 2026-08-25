/**
 * How much of the click is left switched on.
 *
 * The internal-counting practice is a ladder of support being taken away: every
 * subdivision, then only the beats, then only the downbeat, then nothing. The
 * drill climbs it when a bar holds together and drops back when it does not, so
 * where you settle is a reading of how much of the pulse is actually yours.
 */
export type ClickSupport = 'all' | 'beats' | 'downbeat' | 'none';

export const SUPPORT_LADDER: readonly ClickSupport[] = ['all', 'beats', 'downbeat', 'none'];

/** What each rung is called, and what it leaves you with. */
export const SUPPORT_LABELS: Readonly<Record<ClickSupport, string>> = {
  all: 'every count',
  beats: 'beats only',
  downbeat: 'beat 1 only',
  none: 'no click',
};

/**
 * Bucket 3.1 and 3.3 as data.
 *
 * The bucket is one exercise with pieces removed: keep a pulse, then keep it
 * while only some beats are played, then keep it while the click itself goes
 * away. So a practice is described by what the pulse asks of you rather than by
 * what it sounds like — which beats to mark, how many bars fall silent, and
 * whether the first beat is leaned on.
 */

export interface PulseDrillConfig {
  id: string;
  beatsPerBar: number;
  /** Counts inside each beat: 1 is the pulse, 2 is "and", 4 is "e and a". */
  subdivision: 1 | 2 | 4;
  /**
   * Which counts of the bar to mark, one entry per subdivision slot. All true is
   * a plain pulse; a mixture is the beat-versus-note lesson, where the pulse
   * carries on under the silence.
   */
  playOn: readonly boolean[];
  /** Bars where the click drops out and you carry the pulse alone. */
  silentBars: number;
  /** Bars of clicking between the silent ones. */
  soundingBars: number;
  /** Lean on the first beat of the bar. */
  accentFirst: boolean;
  /** Offer the keyboard as well as the tap pad. */
  withKeyboard: boolean;
  /** Climb the support ladder as bars hold together — the internal-counting practice. */
  ladder?: boolean;
  tempos: readonly number[];
  goal: string;
  steps: readonly string[];
  watchFor: string;
}

const FOUR = [true, true, true, true];

const PULSE_ONLY: Readonly<Record<string, PulseDrillConfig>> = {
  understanding: {
    id: 'understanding',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: FOUR,
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: false,
    tempos: [50, 60, 72],
    goal: 'A beat is a clock, evenly spaced — before any of it is played.',
    steps: [
      'No keyboard. Tap the pad, or the space bar, once on every click.',
      'Say the numbers out loud as you go: one, two, three, four.',
      'Every gap should be the same. The panel tells you which beat you rush.',
    ],
    watchFor:
      'Speeding up as you settle in. Drift is gradual and feels fine from the inside, which is exactly why it is measured here.',
  },
  counting: {
    id: 'counting',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: FOUR,
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: false,
    tempos: [50, 60, 72, 84],
    goal: 'Four beats to a bar, over and over — the group, not just the pulse.',
    steps: [
      'Count one two three four and start again at one; the bar line is where the group restarts.',
      'The beat display shows where you are, so you can check whether you agree with it.',
      'Move the tempo up only once the numbers stay level at the slower one.',
    ],
    watchFor:
      'Losing the count at the bar line. A hesitation at the turn is the tell that the group has not settled yet.',
  },
  tapping: {
    id: 'tapping',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: FOUR,
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: true,
    tempos: [50, 60, 72],
    goal: 'The pulse leaves your head and becomes something the body does.',
    steps: [
      'Tap your foot on every beat while you play a single key with the click.',
      'The foot sets the pulse; the fingers play inside it, never the other way round.',
      'Three layers at once: foot, voice, key. Add them one at a time.',
    ],
    watchFor:
      'The foot following the fingers. If a wrong note makes your foot hesitate, the pulse is not independent yet.',
  },
  clapping: {
    id: 'clapping',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: FOUR,
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: false,
    tempos: [60, 72, 84, 96],
    goal: 'A steady beat reproduced by the body, faster and faster, still even.',
    steps: [
      'Clap on every beat and tap the pad with the same movement, so the drill can see it.',
      'Thirty seconds slow, then a little quicker, keeping the gaps identical.',
      'Foot and hands together on every beat once each is steady alone.',
    ],
    watchFor:
      'Spacing that tightens as the tempo rises. Faster should mean the same evenness, not merely more claps.',
  },
  'beat-vs-note': {
    id: 'beat-vs-note',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: [true, false, true, false],
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: true,
    tempos: [50, 60, 72],
    goal: 'Play on 1 and 3 only — and notice the beat carrying on underneath 2 and 4.',
    steps: [
      'The marked beats are the ones to play. The others are still beats.',
      'Keep counting all four out loud even though two of them are silent.',
      'Playing on an unmarked beat counts against you: the silence is part of the exercise.',
    ],
    watchFor:
      'Speeding up through the silences. No note does not mean no time — the gap is exactly as long as the sound was.',
  },
  silent: {
    id: 'silent',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: FOUR,
    silentBars: 1,
    soundingBars: 1,
    accentFirst: false,
    withKeyboard: true,
    tempos: [50, 60, 72],
    goal: 'The click disappears for a bar. Keep the pulse and come back exactly on one.',
    steps: [
      'One bar sounding, one bar silent, over and over. Keep tapping through the silence.',
      'The drill measures the first beat back separately — that is the honest test.',
      'Once one bar is reliable, the silence can be two.',
    ],
    watchFor:
      'Coming back early. Almost everyone does: silence feels longer than it is, so the internal clock hurries to fill it.',
  },
  accent: {
    id: 'accent',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: FOUR,
    silentBars: 0,
    soundingBars: 4,
    accentFirst: true,
    withKeyboard: true,
    tempos: [50, 60, 72],
    goal: 'One is stronger than two, three and four — a group you can feel, not just count.',
    steps: [
      'The click leans on beat one and so should you; the other three stay light.',
      'The accent changes the feeling, never the spacing. The foot stays perfectly even.',
      'Play a single key along with it, slightly stronger on one.',
    ],
    watchFor:
      'The accented beat arriving early, or the bar speeding up after it. An accent is weight, not haste.',
  },
};

/* ---------------- 3.3 · Counting & Subdivision ---------------- */

/** Every slot marked, for a grid of this many counts. */
const all = (count: number): readonly boolean[] => Array.from({ length: count }, () => true);

const COUNTING: Readonly<Record<string, PulseDrillConfig>> = {
  'count-basic': {
    id: 'count-basic',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: all(4),
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: true,
    tempos: [60, 72],
    goal: 'One two three four, evenly, for as long as it takes to stop drifting.',
    steps: [
      'Tap or play on every count while saying the numbers out loud.',
      'Eight to sixteen bars without speeding up or slowing down.',
      'The panel scores each number separately — one beat is usually worse than the others.',
    ],
    watchFor:
      'A gradual acceleration. It never feels like rushing from the inside, which is why the average is measured rather than guessed at.',
  },
  'count-eighths': {
    id: 'count-eighths',
    beatsPerBar: 4,
    subdivision: 2,
    playOn: all(8),
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: true,
    tempos: [50, 60, 72],
    goal: 'Inside the beat: one and two and three and four and, all equally spaced.',
    steps: [
      'Eight counts to the bar. Say them out loud as you tap or play.',
      'Do not rush the "and" — it sits exactly halfway.',
      'Your eight notes have to occupy exactly four beats, no more.',
    ],
    watchFor:
      'The "and" arriving late and clinging to the next number. The panel scores "&" apart from the numbers, so it will tell you.',
  },
  'count-sixteenths': {
    id: 'count-sixteenths',
    beatsPerBar: 4,
    subdivision: 4,
    playOn: all(16),
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: true,
    tempos: [40, 50, 60],
    goal: 'One ee and a — four equal positions inside every beat.',
    steps: [
      'Sixteen counts to the bar. Slowly, and say every syllable.',
      'This is about dividing a beat accurately, not about playing fast.',
      '"e" and "a" are scored separately from "1" and "&"; those two are where it goes wrong.',
    ],
    watchFor:
      'The four counts bunching towards the front of the beat. If "a" is squeezed against the next number, slow the tempo until all four are level.',
  },
  'clap-quarters': {
    id: 'clap-quarters',
    beatsPerBar: 4,
    subdivision: 1,
    playOn: all(4),
    silentBars: 1,
    soundingBars: 3,
    accentFirst: false,
    withKeyboard: false,
    tempos: [60, 72],
    goal: 'The pulse made physical — one clap per beat, and it keeps going when the click stops.',
    steps: [
      'Clap on every number and tap the pad with the same movement so it can be measured.',
      'Every fourth bar the click drops out. Keep clapping.',
      'Coming back in on beat one is the test — that is internal timing starting.',
    ],
    watchFor:
      'The clap sliding early once the click goes. The panel scores the return separately, so you will see it happen.',
  },
  'clap-eighths': {
    id: 'clap-eighths',
    beatsPerBar: 4,
    subdivision: 2,
    playOn: all(8),
    silentBars: 1,
    soundingBars: 3,
    accentFirst: false,
    withKeyboard: false,
    tempos: [50, 60],
    goal: 'Subdivisions made physical: a clap on every count, including the offbeats.',
    steps: [
      'Speak it, then speak and clap it, then add the click, then drop the speaking.',
      'The click leaves for a bar at a time; the offbeats have to survive that.',
      'Feel the "and" even in the bar where nothing is marking it.',
    ],
    watchFor:
      'The offbeats disappearing when the click does. If only the numbers survive the silence, the subdivision is still borrowed rather than internal.',
  },
  'notes-rests': {
    id: 'notes-rests',
    beatsPerBar: 4,
    subdivision: 2,
    // 1, the & of 2, 3, the & of 4 — the reference's own pattern.
    playOn: [true, false, false, true, true, false, false, true],
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: true,
    tempos: [50, 60],
    goal: 'Play on 1, the "and" of 2, 3 and the "and" of 4 — counting straight through the gaps.',
    steps: [
      'The marked counts are the ones to play; the rest are silence with a length.',
      'Keep saying all eight counts, including the ones you are not playing.',
      'Playing on an unmarked count is scored against you — the silence is written.',
    ],
    watchFor:
      'Losing the place after a gap. Never stop counting because you stopped playing; that is the whole difference between pressing keys and keeping time.',
  },
  'count-playing': {
    id: 'count-playing',
    beatsPerBar: 4,
    subdivision: 2,
    playOn: [true, false, true, true, true, false, true, true],
    silentBars: 0,
    soundingBars: 4,
    accentFirst: true,
    withKeyboard: true,
    tempos: [50, 60, 72],
    goal: 'Voice, hands and pulse working together on a pattern that is not all one thing.',
    steps: [
      'Count all eight out loud while playing only the marked ones.',
      'Say the count, anticipate the note, press, carry on counting.',
      'The keyboard is on: play a single key so the coordination is real.',
    ],
    watchFor:
      'The counting stopping the moment the pattern gets awkward. The voice should be the steady part, not the first thing to go.',
  },
  internal: {
    id: 'internal',
    beatsPerBar: 4,
    subdivision: 2,
    playOn: all(8),
    silentBars: 0,
    soundingBars: 4,
    accentFirst: false,
    withKeyboard: true,
    ladder: true,
    tempos: [50, 60],
    goal: 'The click taken away a layer at a time until the pulse is entirely yours.',
    steps: [
      'Every count clicks to begin with. Hold a bar together and one layer of support is removed.',
      'Counts, then beats, then beat one only, then nothing at all.',
      'A bar that falls apart puts a layer back. Where you settle is the honest reading.',
    ],
    watchFor:
      'Rushing the moment the offbeat click disappears. The support was doing more work than it felt like.',
  },
};

export const PULSE_DRILLS: Readonly<Record<string, PulseDrillConfig>> = {
  ...PULSE_ONLY,
  ...COUNTING,
};

export function getPulseDrill(id: string): PulseDrillConfig {
  const config = PULSE_DRILLS[id];
  if (!config) throw new Error(`Unknown pulse drill: ${id}`);
  return config;
}

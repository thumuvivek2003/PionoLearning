/**
 * 5.8 as data — chords in time.
 *
 * Every earlier bucket asks "which chord". This one asks "at what moment", and
 * a chord played correctly two beats late is wrong in the only way that matters
 * on stage. So the practices differ by rhythm and tempo rather than by chord:
 * one progression, drilled at every subdivision the reference lists.
 */
/**
 * A strum pattern, as the eighth notes of a bar that carry a hit.
 *
 * 0 is the downbeat and 7 is the last eighth, so "down, down-up, up-down-up" —
 * the reference's pop pattern — is [0, 2, 3, 5, 6, 7]. Writing them as positions
 * rather than as arrows means the drill can place them on the clock exactly.
 */
export interface StrumPattern {
  id: string;
  label: string;
  /** Which eighths of the bar are struck. */
  eighths: readonly number[];
  hint: string;
}

/** The four patterns 5.10.5 works through. */
export const STRUM_PATTERNS: readonly StrumPattern[] = [
  { id: 'basic', label: 'Basic', eighths: [0, 2, 4, 6], hint: 'down down down down' },
  { id: 'pop', label: 'Pop', eighths: [0, 2, 3, 5, 6, 7], hint: 'down, down-up, up-down-up' },
  { id: 'slow', label: 'Slow', eighths: [0, 4, 5, 7], hint: 'down, rest, down-up, rest, up' },
  { id: 'sustained', label: 'Sustained', eighths: [0], hint: 'one strike, held' },
];

export function strumPattern(id: string): StrumPattern | undefined {
  return STRUM_PATTERNS.find((entry) => entry.id === id);
}

export interface ChordRhythmConfig {
  id: string;
  /** The progression, as numerals. */
  numerals: readonly string[];
  /** Progressions drawn one per loop, for the practices that vary them. */
  pool?: readonly (readonly string[])[];
  key: string;
  /** Beats each chord lasts: 4 for one chord a bar, 2 for two. */
  beatsPerChord: number;
  /** Chord hits inside a bar: 1 whole, 2 half, 4 quarter. */
  hitsPerBar: number;
  /** Shift the hits off the strong beats, for the 2-and-4 variation. */
  offBeat: boolean;
  tempos: readonly number[];
  /** Tempo climbs on a clean loop and drops back on a miss. */
  ladder: boolean;
  /** Play a melody line over the chord on the beats it does not fall on. */
  melody: boolean;
  /** Report hand movement and reward the nearest shape. */
  smooth: boolean;
  /** Clean loops the practice is asking for. */
  loops: number;
  /**
   * Strum patterns the practice offers instead of an even subdivision.
   *
   * When present, `hitsPerBar` is ignored: the hits land where the pattern puts
   * them, which is the difference between a chord progression and an
   * accompaniment.
   */
  patterns?: readonly string[];
  /** Rotate the progression's starting chord each loop. */
  rotate?: boolean;
  /** Cover the keyboard once the loop starts. */
  blind?: boolean;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

/** The progression every 5.8 session uses: I – vi – IV – V. */
const LOOP: readonly string[] = ['I', 'vi', 'IV', 'V'];

const base = {
  numerals: LOOP,
  key: 'C',
  beatsPerChord: 4,
  hitsPerBar: 1,
  offBeat: false,
  tempos: [60, 70, 80, 90],
  ladder: false,
  melody: false,
  smooth: false,
  loops: 8,
} as const;

/* ---------------- 5.10 · songs ---------------- */

/** The two-chord changes 5.10.1 starts from, as numerals in C. */
const TWO_CHORD_POOL: readonly (readonly string[])[] = [
  ['I', 'V'],
  ['I', 'IV'],
  ['vi', 'IV'],
  ['V', 'I'],
  ['vi', 'V'],
];

const SONG_DRILLS: Readonly<Record<string, ChordRhythmConfig>> = {
  'song-two': {
    ...base,
    id: 'song-two',
    pool: TWO_CHORD_POOL,
    numerals: ['I', 'V'],
    loops: 10,
    tempos: [60, 70, 80],
    goal: 'Two chords, back and forth, until the change needs no thought at all.',
    guidance: [
      'A pair is drawn each loop: C and G, C and F, Am and F, and so on.',
      'Four beats each, no stopping between them. Two minutes of this is worth an hour of anything else.',
      'A mistake is not a reason to stop — carry on and let the next change be right.',
    ],
    watchFor:
      'Preparing the second chord during the first. The hand should already know where it goes rather than being aimed.',
  },
  'song-three': {
    ...base,
    id: 'song-three',
    numerals: ['I', 'IV', 'V', 'I'],
    rotate: true,
    loops: 10,
    goal: 'I–IV–V, started from a different chord each time round.',
    guidance: [
      'The progression rotates every loop: I IV V I, then IV V I IV, then V I IV V.',
      'The harmony is identical and the thing you have to play is not, which is the difference between a function and a memorised order.',
      'Ask of any song you know: where is I, where is IV, where is V.',
    ],
    watchFor:
      'Being fluent only from the top. If starting on IV is much harder than starting on I, the progression is still a sequence.',
  },
  'song-four': {
    ...base,
    id: 'song-four',
    numerals: ['I', 'V', 'vi', 'IV'],
    hitsPerBar: 2,
    ladder: true,
    loops: 3,
    tempos: [60, 70, 80, 90],
    goal: 'I–V–vi–IV with the tempo earned: three clean loops move it up, one slip moves it back.',
    guidance: [
      'The four chords behind most modern songs, twice a bar.',
      'Sixty to ninety, and the drill decides which rung you are on.',
      'Speed that arrives before accuracy is speed you lose the moment anyone is listening.',
    ],
    watchFor:
      'Forcing the top rung. The tempo you can hold cleanly is the one worth having, and it is usually two rungs down.',
  },
  'song-melody': {
    ...base,
    id: 'song-melody',
    numerals: ['I', 'V'],
    melody: true,
    loops: 8,
    tempos: [40, 50, 60],
    goal: 'Left hand holding the harmony while the right hand carries a line over it.',
    guidance: [
      'Chord on the downbeat, then three melody notes drawn from that chord.',
      'Two chords only, so the attention can go on the independence rather than on the changes.',
      'If the melody pauses while the chord changes, drop the tempo. That pause is the thing being trained away.',
    ],
    watchFor:
      'Letting the pulse stop for the melody. The chord is the floor; it does not get to wobble because the right hand is busy.',
  },
  'song-patterns': {
    ...base,
    id: 'song-patterns',
    numerals: ['I', 'V', 'vi', 'IV'],
    patterns: ['basic', 'pop', 'slow', 'sustained'],
    loops: 8,
    tempos: [60, 70, 80],
    goal: 'One progression, four accompaniments — harmony and rhythm pulled apart.',
    guidance: [
      'The chords never change. Only where in the bar you strike them does.',
      'Basic is four downs; pop puts hits on the off-beats; slow leaves gaps; sustained strikes once and holds.',
      'Two minutes on each pattern, in order, without changing the progression.',
    ],
    watchFor:
      'Letting the chords drift when the pattern gets busy. Harmony is one job and accompaniment is another, and this practice exists to keep them separate.',
  },
  'song-inversions': {
    ...base,
    id: 'song-inversions',
    numerals: ['I', 'V', 'vi', 'IV'],
    hitsPerBar: 2,
    smooth: true,
    loops: 8,
    tempos: [50, 60, 70],
    goal: 'The same progression with the hand barely moving.',
    guidance: [
      'Any position is accepted, and the panel reports what your route cost against the shortest one.',
      'C to G/B to Am to F/A — the notes stay close and the hand stops jumping.',
      'This is what makes accompaniment sound finished rather than assembled.',
    ],
    watchFor:
      'Reverting to root position once the tempo rises. That is exactly when the movement stops fitting in the time available.',
  },
  'song-blind': {
    ...base,
    id: 'song-blind',
    numerals: ['I', 'V', 'vi', 'IV'],
    hitsPerBar: 2,
    blind: true,
    loops: 8,
    tempos: [50, 60, 70],
    goal: 'The progression with the keyboard covered — chords found by touch.',
    guidance: [
      'The cover goes on when the click starts. Presses still land; you just cannot see where.',
      'A wrong note tells you exactly how far off the hand was, which watching would have hidden.',
      'Slower than you think. Accuracy is the whole measure here.',
    ],
    watchFor:
      'Playing the chords you can still picture and guessing the rest. The guesses are what to take back to the individual chord practices.',
  },
};

export const CHORD_RHYTHM_DRILLS: Readonly<Record<string, ChordRhythmConfig>> = {
  ...SONG_DRILLS,
  'one-per-bar': {
    ...base,
    id: 'one-per-bar',
    goal: 'One chord a bar, changing exactly on beat 1, for eight loops without drifting.',
    guidance: [
      'C, Am, F, G — one chord per bar, struck on the downbeat and held.',
      'The click decides when the chord changes. Your hand does not get a vote.',
      'The panel keeps the timing of a chord *change* apart from the rest, because that is where the beat goes.',
    ],
    watchFor:
      'Arriving late on the change and then catching up. The average tempo looks right and every bar was wrong.',
  },
  'two-per-bar': {
    ...base,
    id: 'two-per-bar',
    beatsPerChord: 2,
    hitsPerBar: 2,
    tempos: [40, 50, 60, 70],
    goal: 'Two chords a bar: the change lands on beat 3, not near it.',
    guidance: [
      'C on 1, G on 3, Am on 1, F on 3. Twice the changes and the same pulse.',
      'Start at forty. The reference is right that this is where rushing begins.',
      'Only move the tempo up when the second change of the bar is as clean as the first.',
    ],
    watchFor:
      'Rushing the beat-3 change. The first change of a bar gets prepared and the second gets grabbed at.',
  },
  metronome: {
    ...base,
    id: 'metronome',
    tempos: [60, 70, 80, 90],
    loops: 10,
    goal: 'Ten clean loops at each tempo, from sixty to ninety.',
    guidance: [
      'The same progression, one chord a bar, with the click in charge.',
      'On the beat counts how many hits landed inside the slot; the bias says which way you drift.',
      'Raise the tempo because you were accurate, never because you could go faster.',
    ],
    watchFor:
      'Speeding up through the easy chords and waiting on the hard one. The average is fine and nothing was in time.',
  },
  'whole-notes': {
    ...base,
    id: 'whole-notes',
    hitsPerBar: 1,
    tempos: [60, 70, 80],
    goal: 'One strike a bar, held for all four beats — a stable floor for a melody to sit on.',
    guidance: [
      'Strike on beat 1 and do not strike again. Let it ring for the whole bar.',
      'Relaxed hand, no extra movement, and the change exactly on the next downbeat.',
      'This is the texture your left hand needs when your right hand is busy.',
    ],
    watchFor:
      'Re-striking the chord mid-bar to reassure yourself it is still there. It makes the harmony twitch.',
  },
  'half-notes': {
    ...base,
    id: 'half-notes',
    hitsPerBar: 2,
    tempos: [60, 70, 80],
    goal: 'Two strikes a bar, on 1 and 3, with identical spacing between them.',
    guidance: [
      'The chord repeats on beat 3 rather than changing — the harmony holds and the rhythm moves.',
      'Evenness between the two strikes is the measure; a late second strike is the usual fault.',
      'Once it is solid, turn the off-beat option on and strike 2 and 4 instead.',
    ],
    watchFor:
      'Adding a third strike by accident. Two hits a bar means two, and the count tells you when.',
  },
  'quarter-notes': {
    ...base,
    id: 'quarter-notes',
    hitsPerBar: 4,
    tempos: [60, 70, 80, 90],
    goal: 'Four strikes a bar with identical spacing — rhythm control rather than chord knowledge.',
    guidance: [
      'Every beat gets the chord. The notes never change inside a bar, so only the timing is being tested.',
      'Even and light. Four equal hits, not four accents.',
      'The change to the next chord still lands on beat 1, in among the repeats.',
    ],
    watchFor:
      'Hitting the downbeat harder and the rest late. Four hits should be indistinguishable from each other.',
  },
  'chord-melody': {
    ...base,
    id: 'chord-melody',
    hitsPerBar: 1,
    melody: true,
    tempos: [40, 50, 60],
    goal: 'Chord on the downbeat, melody on the beats after it, neither stopping for the other.',
    guidance: [
      'Beat 1 is the chord. Beats 2, 3 and 4 are single notes drawn from it.',
      'Start at forty. If the melody pauses while the chord changes, the tempo is too high.',
      'What is measured is whether the melody keeps time *through* the change — the join is scored on its own.',
    ],
    watchFor:
      'The melody hesitating at every bar line. That gap is the sound of two hands taking turns instead of playing together.',
  },
  smooth: {
    ...base,
    id: 'smooth',
    smooth: true,
    tempos: [50, 60, 70],
    goal: 'The same loop with the smallest hand movement available.',
    guidance: [
      'Any position of the next chord is accepted, and the panel reports what your route cost.',
      'C to Am shares C and E — two of three notes can simply stay where they are.',
      'Small movement is not a style choice at tempo; it is the only way the changes fit in the time.',
    ],
    watchFor:
      'Jumping to root position every time out of habit. It is correct, it is several times the movement, and at ninety it stops being possible.',
  },
  loop: {
    ...base,
    id: 'loop',
    hitsPerBar: 2,
    loops: 12,
    tempos: [60, 70, 80],
    goal: 'Twelve loops without a break, until the progression continues while you think about something else.',
    guidance: [
      'The same four chords, twice a bar, for a long time. Automaticity is built by repetition and nothing else.',
      'The measure is the streak: how many loops in a row landed clean.',
      'When you can hold a conversation over it, this practice is done.',
    ],
    watchFor:
      'Losing it at loop seven because concentration slipped. That is exactly what the practice is for — the aim is playing that does not need concentration.',
  },
  speed: {
    ...base,
    id: 'speed',
    hitsPerBar: 2,
    ladder: true,
    tempos: [50, 60, 70, 80, 90, 100, 110],
    loops: 3,
    goal: 'The tempo ladder: three clean loops move it up, one miss moves it back.',
    guidance: [
      'Fifty to a hundred and ten, and the drill decides which rung you are on.',
      'The tempo you settle at is your maximum clean tempo, which is the only one worth knowing.',
      'Most of your practice should sit two rungs below it, not at it.',
    ],
    watchFor:
      'Forcing the rung after a drop. It dropped because a loop was not clean; the way back up is a clean loop, not a faster attempt.',
  },
};

export function getChordRhythmDrill(id: string): ChordRhythmConfig {
  const config = CHORD_RHYTHM_DRILLS[id];
  if (!config) throw new Error(`Unknown chord rhythm drill: ${id}`);
  return config;
}

/**
 * The beats of one loop that need something played, in order.
 *
 * A slot says which chord is sounding, whether this is the moment the chord
 * *changes* — which is measured separately — and whether a melody note rather
 * than the chord is due.
 */
export interface Slot {
  /** Which chord of the progression, counting from 0. */
  chord: number;
  /** Beat within the loop, counting from 0. Halves for eighth-note patterns. */
  beat: number;
  /** True on the first hit of a new chord. */
  change: boolean;
  /** True when a single melody note is due instead of the chord. */
  melody: boolean;
  /** Which note of the melody line, when one is due. */
  step: number;
}

const BEATS_PER_BAR = 4;

/**
 * The whole loop as a list of slots — the schedule the drill plays against.
 *
 * A pattern places the hits by eighth note; otherwise they fall on an even
 * subdivision of the bar. Either way a slot knows which chord it belongs to and
 * whether it is the moment that chord *changes*, since that is what the drill
 * measures separately.
 */
export function slotsOf(config: ChordRhythmConfig, patternId?: string): readonly Slot[] {
  const slots: Slot[] = [];
  const beatsPerBar = BEATS_PER_BAR;
  const pattern = patternId ? strumPattern(patternId) : undefined;
  const gap = Math.max(1, Math.floor(beatsPerBar / config.hitsPerBar));
  const shift = config.offBeat ? 1 : 0;

  config.numerals.forEach((_numeral, chord) => {
    const from = chord * config.beatsPerChord;

    if (pattern) {
      // Eighths are half a beat, so the pattern lands on fractional beats.
      pattern.eighths
        .filter((eighth) => eighth / 2 < config.beatsPerChord)
        .forEach((eighth, index) => {
          slots.push({ chord, beat: from + eighth / 2, change: index === 0, melody: false, step: 0 });
        });
      return;
    }

    let step = 0;
    for (let offset = 0; offset < config.beatsPerChord; offset += 1) {
      const beat = from + offset;
      const inBar = beat % beatsPerBar;
      const isHit = (inBar - shift + beatsPerBar) % gap === 0 && inBar >= shift;
      if (isHit) {
        slots.push({ chord, beat, change: offset === 0, melody: false, step: 0 });
        continue;
      }
      // Beats the chord does not fall on carry the melody, when there is one.
      if (config.melody) {
        step += 1;
        slots.push({ chord, beat, change: false, melody: true, step });
      }
    }
  });

  return slots;
}

/** The progression rotated so it starts on a different chord. */
export function rotated(numerals: readonly string[], by: number): readonly string[] {
  if (numerals.length === 0) return numerals;
  const at = ((by % numerals.length) + numerals.length) % numerals.length;
  return [...numerals.slice(at), ...numerals.slice(0, at)];
}

/** How many beats a whole loop lasts. */
export function beatsInLoop(config: ChordRhythmConfig): number {
  return config.numerals.length * config.beatsPerChord;
}

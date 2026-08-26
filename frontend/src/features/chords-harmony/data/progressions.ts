import { PROGRESSION_KEYS } from './diatonic';
import type { KeyMode } from './diatonic';

/**
 * Progressions as data — 5.4.9, all of 5.6 and all of 5.7.
 *
 * Written as roman numerals rather than chord names, which is the whole point
 * of both buckets: `I–V–vi–IV` is one thing that can be played in any key, and
 * a practice that stored "C, G, Am, F" would have to be written out twelve
 * times and would teach the letters instead of the function.
 */
export interface ProgressionConfig {
  id: string;
  /** The progression, as numerals. Ignored when a pool is given. */
  numerals: readonly string[];
  /** Progressions drawn at random, one per cycle — for the random drills. */
  pool?: readonly (readonly string[])[];
  /** Keys it may be played in. More than one offers a picker. */
  keys: readonly string[];
  /** Whether those keys are major or minor. Major unless stated. */
  mode?: KeyMode;
  /** How many times through before the session is done. */
  cycles: number;
  /** Show the chord symbols beside the numerals, or numerals alone. */
  showChords: boolean;
  /** Measure hand travel and report it against the shortest route. */
  measureMovement: boolean;
  /** Accept any position and report the cost, rather than insisting on the closest. */
  freeChoice: boolean;
  /** Play the progression and ask which one it was, before playing it back. */
  identify: boolean;
  /**
   * Play the progression short of its last chord and ask for the ending.
   *
   * The reference's prediction drill: hearing where harmony is going is a
   * different skill from recognising where it has been, and it is the one that
   * lets you follow a song you have not played.
   */
  predict?: boolean;
  /** The numeral this session is teaching; marked in the strip. */
  focus?: string;
  /** Per-chord allowance in ms, tightening as the session runs. Empty for none. */
  allowance: readonly number[];
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const base = {
  keys: ['C'],
  cycles: 4,
  showChords: true,
  measureMovement: false,
  freeChoice: true,
  identify: false,
  allowance: [] as readonly number[],
} as const;

/** The seven progressions 5.7 teaches, and 5.7.10 draws from. */
export const PROGRESSION_POOL: readonly (readonly string[])[] = [
  ['I', 'IV', 'V', 'I'],
  ['I', 'V', 'I'],
  ['I', 'V', 'vi', 'IV'],
  ['vi', 'IV', 'I', 'V'],
  ['I', 'vi', 'IV', 'V'],
  ['ii', 'V', 'I'],
  ['IV', 'V', 'I'],
];

/* ---------------- 5.6 · the family, degree by degree ---------------- */

/**
 * One degree's session, generated from the degree.
 *
 * The seven sessions are the same exercise pointed at a different chord: play a
 * short progression that features it, with that chord marked. What each degree
 * *does* is written down, because that is the one thing a chord cannot tell you
 * about itself.
 */
function degreeSession(
  numeral: string,
  numerals: readonly string[],
  role: string,
  watchFor: string,
): ProgressionConfig {
  return {
    ...base,
    id: `degree-${numeral}`,
    numerals,
    focus: numeral,
    cycles: 5,
    goal: `${numeral} — ${role}`,
    guidance: [
      `${numerals.join(' → ')}, with ${numeral} marked so you hear where it sits.`,
      'Press each chord in any order; the shape is what matters, not the order of the fingers.',
      'Say the numeral as you play it. The letter name is a detail; the numeral is the thing that moves between keys.',
    ],
    watchFor,
  };
}

/* ---------------- 5.7 · the progressions themselves ---------------- */

/** One of the named progressions, with a clock that tightens. */
function progression(
  id: string,
  numerals: readonly string[],
  goal: string,
  guidance: readonly string[],
  watchFor: string,
): ProgressionConfig {
  return {
    ...base,
    id,
    numerals,
    cycles: 6,
    // The reference's four-beats, two-beats, one-beat ladder, expressed as the
    // time a chord is allowed rather than as a metronome.
    allowance: [6000, 4000, 2500],
    goal,
    guidance,
    watchFor,
  };
}

/* ---------------- 5.9.6 and 5.9.7 · progressions by ear ---------------- */

/** The progressions the minor-key reference works through, in A minor. */
const MINOR_POOL: readonly (readonly string[])[] = [
  ['i', 'iv', 'v', 'i'],
  ['i', 'VI', 'III', 'VII'],
  ['i', 'VII', 'VI', 'v'],
  ['i', 'iv', 'i', 'v'],
];

const EAR_PROGRESSIONS: Readonly<Record<string, ProgressionConfig>> = {
  'prog-predict': {
    ...base,
    id: 'prog-predict',
    numerals: ['I', 'IV', 'V', 'I'],
    pool: PROGRESSION_POOL,
    keys: ['C', 'G', 'F'],
    cycles: 8,
    identify: true,
    predict: true,
    showChords: false,
    goal: 'A progression plays short of its ending. Play the chord you expect.',
    guidance: [
      'All but the last chord sounds, then you supply the ending — no options offered.',
      'Most of these come home to I. Hearing that it *wants* to is the skill, not remembering that it does.',
      'Three keys, so the prediction cannot be a memory of one set of letters.',
    ],
    watchFor:
      'Counting the chords you heard and looking the answer up. Prediction is a feeling about tension arriving somewhere, and it is faster than counting.',
  },
  'prog-minor': {
    ...base,
    id: 'prog-minor',
    numerals: ['i', 'VI', 'III', 'VII'],
    pool: MINOR_POOL,
    keys: ['A', 'E', 'D'],
    mode: 'minor',
    cycles: 8,
    identify: true,
    showChords: false,
    goal: 'The same listening in minor keys, where home is a minor chord.',
    guidance: [
      'A minor first: i is Am, iv is Dm, VI is F, VII is G. The whole family comes from the natural minor scale.',
      'Am → F → C → G is i → VI → III → VII, and it is everywhere.',
      'The major V heard in a lot of minor music is borrowed from the harmonic minor — a later bucket. These use the chords the scale actually contains.',
    ],
    watchFor:
      'Hearing a minor progression as a major one in a different place. Am–F–C–G and C–G–Am–F use the same four chords; what differs is which one is home.',
  },
};

export const PROGRESSION_DRILLS: Readonly<Record<string, ProgressionConfig>> = {
  /* 5.4.9 — inversions used rather than recited. */
  'minimal-movement': {
    ...base,
    id: 'minimal-movement',
    numerals: ['I', 'V', 'vi', 'IV'],
    cycles: 4,
    measureMovement: true,
    goal: 'Play the next chord in whichever position is closest to where your hand already is.',
    guidance: [
      'C, G, Am, F. The first is root position; after that, any position you like.',
      'Every round shows what your hand travelled and what the shortest route would have been.',
      'From C-E-G, G major in first inversion is B-D-G — three semitones of movement instead of eight.',
    ],
    watchFor:
      'Playing everything in root position because it is what you practised. It is correct, it is four times the movement, and it is why chord playing sounds like jumping.',
  },

  /* 5.6.1 — a chord on every note of the scale. */
  'family-build': {
    ...base,
    id: 'family-build',
    numerals: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    cycles: 3,
    goal: 'A chord built on every note of the scale — seven chords, none of them chosen.',
    guidance: [
      'Take every other note of the scale from each degree in turn: C E G, D F A, E G B, and so on.',
      'The qualities are not a decision. They fall out of the scale: major, minor, minor, major, major, minor, diminished.',
      'Say each chord aloud as you play it. This is the map the rest of the level is drawn on.',
    ],
    watchFor:
      'Expecting the chords to be all major because the scale is. Only three of the seven are, and knowing which three is the point.',
  },

  /* 5.6.2 – 5.6.8 — one degree at a time. */
  'degree-I': degreeSession(
    'I',
    ['I', 'V', 'I'],
    'home, and the chord everything else is heard against.',
    'Treating home as obvious. If I does not feel like arrival, nothing else in the key can feel like tension.',
  ),
  'degree-ii': degreeSession(
    'ii',
    ['I', 'ii', 'V', 'I'],
    'a minor chord on the second degree, pulling towards V.',
    'Playing D major. The second degree of a major key is always minor, and it is the most commonly mistaken one.',
  ),
  'degree-iii': degreeSession(
    'iii',
    ['I', 'iii', 'IV', 'V', 'I'],
    'a minor chord on the third degree — the weakest of the seven.',
    'Confusing iii with I. Em and C share two notes, and at speed the hand reaches for the one it knows.',
  ),
  'degree-IV': degreeSession(
    'IV',
    ['I', 'IV', 'V', 'I'],
    'the move away from home, and half of the most common pattern in music.',
    'Rushing past IV to get to V. It is the chord that makes leaving home mean something.',
  ),
  'degree-V': degreeSession(
    'V',
    ['V', 'I', 'V', 'I'],
    'the tension, and the strongest pull back to home there is.',
    'Playing V and not hearing it as unfinished. If G sounds as settled as C, the ear has not learnt the key yet.',
  ),
  'degree-vi': degreeSession(
    'vi',
    ['I', 'V', 'vi', 'IV'],
    'the relative minor, built from the key’s own notes.',
    'Hearing vi as a new key. Am is inside C major, not next door to it.',
  ),
  'degree-vii°': degreeSession(
    'vii°',
    ['vii°', 'I'],
    'a diminished chord on the leading tone, pulling hard upward to home.',
    'Playing B minor. The seventh degree is diminished — its fifth is flat too, which is what makes it lean so hard on I.',
  ),

  /* 5.6.10 — the whole family, from memory. */
  'chord-family': {
    ...base,
    id: 'chord-family',
    numerals: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    keys: ['C', 'G'],
    cycles: 3,
    showChords: false,
    allowance: [6000, 4000, 3000],
    goal: 'The complete family from the numerals alone — no chord names on screen.',
    guidance: [
      'Only the numerals are shown. The letters have to come from you.',
      'C major first, then G major, because a family you can only produce in C is a list rather than a pattern.',
      'The allowance tightens as the session runs. Every chord is scored separately.',
    ],
    watchFor:
      'Counting up the scale to find each degree. That works and it is slow; by now vi in C should arrive as Am.',
  },

  /* 5.7.1 – 5.7.7 — the named progressions. */
  'prog-i-iv-v': progression(
    'prog-i-iv-v',
    ['I', 'IV', 'V', 'I'],
    'I–IV–V–I: away from home, into tension, and back.',
    [
      'The most important harmonic pattern there is. C, F, G, C in this key.',
      'Hold each chord, then shorten the gap, then remove it. The allowance does that for you.',
      'Home, move away, strong tension, home. Learn the shape of the feeling, not just the letters.',
    ],
    'Stopping between chords to rebuild the next one. A progression is one movement; the gaps are what make it sound like four separate chords.',
  ),
  'prog-i-v-i': progression(
    'prog-i-v-i',
    ['I', 'V', 'I'],
    'I–V–I: home, tension, home — the smallest complete harmonic sentence.',
    [
      'Three chords, and the whole of tonal harmony in miniature.',
      'Listen to V. It should feel like it needs to go somewhere.',
      'Then I again, and it should feel like arriving rather than just changing.',
    ],
    'Hearing three chords instead of one gesture. If V does not sound unresolved on its own, play just V→I for a while.',
  ),
  'prog-i-v-vi-iv': progression(
    'prog-i-v-vi-iv',
    ['I', 'V', 'vi', 'IV'],
    'I–V–vi–IV: the four chords most modern songs are built from.',
    [
      'C, G, Am, F here. You have heard it a thousand times.',
      'The move from V to vi is the one that gives this progression its character.',
      'Once it is smooth, look away from your hands and keep playing.',
    ],
    'Learning it as C-G-Am-F. Then it works in one key. Learn it as I-V-vi-IV and it works in all twelve.',
  ),
  'prog-vi-iv-i-v': progression(
    'prog-vi-iv-i-v',
    ['vi', 'IV', 'I', 'V'],
    'vi–IV–I–V: the same four chords starting somewhere else entirely.',
    [
      'Am, F, C, G. Identical chords to the last progression, rotated.',
      'It sounds different because it starts away from home rather than at it.',
      'This is the practice that proves you learnt numerals rather than a sequence of letters.',
    ],
    'Silently reordering it into I-V-vi-IV and playing that. The starting chord is part of the progression.',
  ),
  'prog-i-vi-iv-v': progression(
    'prog-i-vi-iv-v',
    ['I', 'vi', 'IV', 'V'],
    'I–vi–IV–V: home, its relative minor, away, tension.',
    [
      'C, Am, F, G in this key — four chords that walk downward and then push back.',
      'vi shares two notes with I, so the first change is small and easy to fumble.',
      'Ask yourself what this would be in G major before you finish the session.',
    ],
    'Blurring I into vi. They differ by one note, and a progression where the first change is inaudible has not happened.',
  ),
  'prog-ii-v-i': progression(
    'prog-ii-v-i',
    ['ii', 'V', 'I'],
    'ii–V–I: minor, dominant, home — the strongest way back there is.',
    [
      'Dm, G, C. Each chord shares notes with the next, so the whole thing can be played with tiny movements.',
      'The pull from ii to V is as strong as V to I. That is why the pattern is everywhere.',
      'minor → major → tonic. Say it while you play it.',
    ],
    'Playing D major instead of Dm. The second degree is minor, and this progression is the one where that matters most.',
  ),
  'prog-iv-v-i': progression(
    'prog-iv-v-i',
    ['IV', 'V', 'I'],
    'IV–V–I: away, tension, home, with no run-up.',
    [
      'F, G, C. Starting on IV means the tension arrives immediately.',
      'Then V→I on its own, several times, until the resolution is something you feel rather than notice.',
      'This is the cadence most pieces end on.',
    ],
    'Treating V→I as just another change. It is the sound of an ending, and recognising it is worth more than any single chord.',
  ),

  /* 5.7.8 — the same pattern, five keys. */
  'prog-keys': {
    ...base,
    id: 'prog-keys',
    numerals: ['I', 'V', 'vi', 'IV'],
    keys: PROGRESSION_KEYS,
    cycles: 6,
    showChords: false,
    allowance: [8000, 6000, 4000],
    goal: 'One progression, six keys: the numerals stay and every chord changes.',
    guidance: [
      'I–V–vi–IV in C, then G, D, A, E and F. The chord names are not shown.',
      'In G that is G, D, Em, C. In D it is D, A, Bm, G. Work it out from the key, not from a table.',
      'Each key is scored separately, so the ones you cannot yet transpose into get named.',
    ],
    watchFor:
      'Transposing by moving your hand up the same shape. That gives the right chords in some keys and wrong ones in the rest — the numerals have to be resolved in the new key.',
  },

  /* 5.7.9 — the progression heard rather than read. */
  'prog-listen': {
    ...base,
    id: 'prog-listen',
    numerals: ['I', 'V', 'vi', 'IV'],
    pool: PROGRESSION_POOL,
    cycles: 8,
    identify: true,
    showChords: false,
    goal: 'A progression plays. Say which one it was, then play it back.',
    guidance: [
      'The chords sound in order with nothing on screen. Choose the numerals you heard.',
      'Listen for where home is. Everything else is heard against that.',
      'Then play it back, which is what turns recognising into knowing.',
    ],
    watchFor:
      'Counting chords instead of hearing function. Two of these have three chords and five have four; the length narrows it down and never decides it.',
  },

  /* 5.7.10 — any progression, any key, against the clock. */
  ...EAR_PROGRESSIONS,
  'song-transpose': {
    ...base,
    id: 'song-transpose',
    numerals: ['I', 'V', 'vi', 'IV'],
    keys: ['C', 'G', 'D', 'A', 'E'],
    cycles: 8,
    showChords: false,
    allowance: [10000, 7000, 5000],
    goal: 'One song in five keys, with ten seconds a chord falling to five.',
    guidance: [
      'The key changes each cycle and the numerals do not. Work the chords out from the key.',
      'In G that is G D Em C; in A it is A E F#m D. Neither is a shape moved up the board.',
      'Each key is scored separately, so the ones you cannot yet transpose into get named.',
    ],
    watchFor:
      'Freezing on the vi chord. It is the one most people have never worked out in an unfamiliar key, and it is where the clock catches you.',
  },
  'prog-random': {
    ...base,
    id: 'prog-random',
    numerals: ['I', 'V', 'vi', 'IV'],
    pool: PROGRESSION_POOL,
    keys: ['C', 'G', 'D', 'A'],
    cycles: 8,
    showChords: false,
    allowance: [6000, 4000, 3000],
    goal: 'Any of the seven progressions, in any of four keys, with the numerals only.',
    guidance: [
      'A progression and a key are drawn together. Nothing is shown but the numerals.',
      'The bucket’s final test: numeral → chord → shape → next chord, without stopping.',
      'Out of time counts as a miss, exactly like a wrong note.',
    ],
    watchFor:
      'Freezing on the key rather than the progression. If G major is the problem, the progressions are fine and 5.6 is where to go back to.',
  },
};

export function getProgressionDrill(id: string): ProgressionConfig {
  const config = PROGRESSION_DRILLS[id];
  if (!config) throw new Error(`Unknown progression drill: ${id}`);
  return config;
}

/** The allowance for a cycle, stepping through the ladder as the session runs. */
export function allowanceFor(config: ProgressionConfig, cycle: number): number {
  if (config.allowance.length === 0) return 0;
  const perRung = Math.max(1, Math.ceil(config.cycles / config.allowance.length));
  const rung = Math.min(config.allowance.length - 1, Math.floor(cycle / perRung));
  return config.allowance[rung] ?? 0;
}

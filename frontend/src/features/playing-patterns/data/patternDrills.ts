import type { FigureSource, Hand, NoteValue, Quality } from '../patterns.types';

/**
 * 7.1, 7.2 and 7.3 as data.
 *
 * Twenty-three practices, one engine. A melody, a broken chord and an arpeggio
 * are the same act — an ordered line of notes played with a printed fingering,
 * in time — so what varies between the practices is the figure, the hand, the
 * rhythm and the clock, and none of that needs a second drill.
 */
export interface PatternConfig {
  id: string;
  /** Where the notes come from: a triad taken apart, or a line through a scale. */
  source: FigureSource;
  /**
   * A figure for the other hand, played at the same time.
   *
   * The two are merged by beat rather than zipped, so a four-note accompaniment
   * and an eight-note melody line up the way they would on a page. Absent means
   * one hand at a time.
   */
  left?: FigureSource;
  /** Roots the figure may be built on. */
  roots: readonly string[];
  qualities: readonly Quality[];
  hands: readonly Hand[];
  /** Note lengths in play, cycling across the figure. */
  values: readonly NoteValue[];
  /** Play against a click, and score when each note landed. */
  metronome: boolean;
  tempos: readonly number[];
  /** Tempo climbs on clean loops and drops back on a miss. */
  ladder: boolean;
  /** Loops through the figure without stopping before it counts as held. */
  loops: number;
  /** Show the fingering under the notes. */
  cues: boolean;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const base = {
  roots: ['C'] as readonly string[],
  qualities: ['major'] as readonly Quality[],
  hands: ['right', 'left'] as readonly Hand[],
  values: ['quarter'] as readonly NoteValue[],
  metronome: false,
  tempos: [50, 60, 72] as readonly number[],
  ladder: false,
  loops: 4,
  cues: true,
} as const;

/** The three keys 7.2 and 7.3 work through, in the order they are taught. */
const CORE_KEYS: readonly string[] = ['C', 'F', 'G'];
/** All twelve, for the practices that open up. */
const ALL_KEYS: readonly string[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

/* ---------------- 7.1 · melodies ---------------- */

const MELODY_DRILLS: Readonly<Record<string, PatternConfig>> = {
  'melody-right': {
    ...base,
    id: 'melody-right',
    source: { kind: 'scale', contour: 'wave', length: 5 },
    hands: ['right'],
    loops: 5,
    goal: 'A short melody in the right hand, played without looking for every note.',
    guidance: [
      'Five notes inside one five-finger position, so the hand stays still and only the fingers work.',
      'Correct note, correct finger, correct rhythm, then smoothness. Speed is last and it arrives on its own.',
      'The panel scores each note where it sits, so the one you keep fumbling gets named.',
    ],
    watchFor:
      'Playing the right notes with whatever finger is nearest. It works for five notes and blocks everything after them.',
  },
  'melody-left': {
    ...base,
    id: 'melody-left',
    source: { kind: 'scale', contour: 'wave', length: 5 },
    hands: ['left'],
    loops: 5,
    goal: 'The same melody in the left hand, which almost certainly needs longer.',
    guidance: [
      'Identical figure, other hand. The numbering is the same; the finger that plays the lowest note is not.',
      'The left hand is not a weaker right hand — it is an unpractised one.',
      'Compare your times against the right-hand practice; the gap is the thing to close.',
    ],
    watchFor:
      'Giving the left hand less time because progress feels slower. That is exactly why it stays slower.',
  },
  'melody-stepwise': {
    ...base,
    id: 'melody-stepwise',
    source: { kind: 'scale', contour: 'up', length: 5 },
    roots: ['C', 'G', 'F'],
    loops: 6,
    goal: 'Neighbouring notes: the melody moves to the next key along, every time.',
    guidance: [
      'A line that only steps. Once you have the first note, the rest is direction.',
      'Three keys, so the shape has to be recognised rather than remembered as letters.',
      'Stepwise motion is most of what melodies do, which is why it is worth being effortless.',
    ],
    watchFor:
      'Finding each note from scratch. A step is the next finger — there is nothing to work out.',
  },
  'melody-skips': {
    ...base,
    id: 'melody-skips',
    source: { kind: 'scale', contour: 'skip', length: 5 },
    roots: ['C', 'G', 'F'],
    loops: 6,
    goal: 'A melody that jumps over notes — where accuracy starts to slip.',
    guidance: [
      'The line leaps a third and fills back in. The hand has to reach rather than walk.',
      'Slow enough that every leap lands. A missed leap is worth more than a slow one.',
      'Scores are per note, so the leap you keep missing is named rather than averaged.',
    ],
    watchFor:
      'Rushing the leap because the note before it was easy. The leap is where the practice is.',
  },
  'melody-repeated': {
    ...base,
    id: 'melody-repeated',
    source: { kind: 'scale', contour: 'same', length: 6 },
    values: ['quarter'],
    metronome: true,
    tempos: [60, 72, 84],
    loops: 8,
    goal: 'The same note repeatedly — finger control and evenness with nothing else in the way.',
    guidance: [
      'One note, six times, against the click. Nothing to read and nowhere to move.',
      'Evenness is the only measure here: six identical gaps.',
      'Change finger between loops if you want the harder version — the same note under 2, then 3, then 4.',
    ],
    watchFor:
      'The first note being louder and the rest drifting late. Repeated notes expose timing that a moving line hides.',
  },
  'melody-rhythms': {
    ...base,
    id: 'melody-rhythms',
    source: { kind: 'scale', contour: 'wave', length: 8 },
    values: ['quarter', 'quarter', 'half', 'eighth', 'eighth', 'quarter', 'half', 'whole'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 6,
    goal: 'One melody in mixed note lengths — reading pitch and rhythm at the same time.',
    guidance: [
      'Quarters, halves, eighths and a whole note, all in one line. The strip shows how long each lasts.',
      'The next note is due when the last one has had its beats, not as soon as your finger is ready.',
      'Either alone is easier than both, which is the whole point of putting them together.',
    ],
    watchFor:
      'Playing everything as quarters because the notes are right. Half the information in a melody is how long each note lasts.',
  },
  'melody-memorise': {
    ...base,
    id: 'melody-memorise',
    source: { kind: 'scale', contour: 'skip', length: 6 },
    roots: ['C', 'G', 'F', 'A'],
    cues: false,
    loops: 8,
    goal: 'A short melody from memory: no fingering shown, and the same figure until it sticks.',
    guidance: [
      'The fingering is hidden. The figure repeats until you can play it without reading it.',
      'Eight clean loops is the target — memorised means reliable, not once-correct.',
      'A new key on the next session, so what is being memorised is the shape rather than the notes.',
    ],
    watchFor:
      'Calling it memorised after one clean run. A figure you can play once is a figure you got lucky with.',
  },
};

/* ---------------- 7.2 · broken chords ---------------- */

/** 7.2.3 to 7.2.5 — one key's broken chord, generated from the key. */
function brokenKey(root: string): PatternConfig {
  return {
    ...base,
    id: `broken-${root.toLowerCase()}`,
    source: { kind: 'chord', degrees: [1, 3, 5, 3] },
    roots: [root],
    loops: 6,
    goal: `${root} major broken: 1–3–5–3, with the turn at the top.`,
    guidance: [
      'Up to the fifth and back to the third, over and over. Four notes, one shape.',
      'Fingering is 1–3–5–3 in the right hand and 5–3–1–3 in the left.',
      'The gap into the note *after* the top is measured on its own — that is where the figure lurches.',
    ],
    watchFor:
      'Hurrying the note after the fifth. The turn is the only hard moment in the figure and it is the one everybody rushes.',
  };
}

const BROKEN_DRILLS: Readonly<Record<string, PatternConfig>> = {
  'broken-135': {
    ...base,
    id: 'broken-135',
    source: { kind: 'chord', degrees: [1, 3, 5] },
    loops: 6,
    goal: '1–3–5: the chord taken apart and played one note at a time.',
    guidance: [
      'Root, third, fifth — the same three notes as the chord, arriving in order.',
      'Fingers 1, 3 and 5 in the right hand; 5, 3 and 1 in the left, because the thumb is on the other side.',
      'Even and unhurried. Three notes is few enough that evenness is the only thing being tested.',
    ],
    watchFor:
      'Letting the third arrive late. It is the middle finger reaching between two easy notes, and it is where evenness goes.',
  },
  'broken-531': {
    ...base,
    id: 'broken-531',
    source: { kind: 'chord', degrees: [5, 3, 1] },
    loops: 6,
    goal: '5–3–1: the same three notes coming down.',
    guidance: [
      'Downward from the fifth. The notes are identical to 1–3–5 and the movement is not.',
      'Compare your evenness against the ascending practice; most people are worse coming down.',
      'The fingering reverses with the direction, in both hands.',
    ],
    watchFor:
      'Thinking of it as 1–3–5 backwards. It is its own figure, and playing it as a reversal is what makes it slower.',
  },
  'broken-c': brokenKey('C'),
  'broken-f': brokenKey('F'),
  'broken-g': brokenKey('G'),
  'broken-major': {
    ...base,
    id: 'broken-major',
    source: { kind: 'chord', degrees: [1, 3, 5, 3] },
    roots: ALL_KEYS,
    loops: 4,
    goal: 'The same broken shape on all twelve major roots.',
    guidance: [
      'One figure, twelve keys. The shape never changes; the keys under it do.',
      'Black-key roots are not harder, only less familiar. The fingering is identical.',
      'Scores are kept per key, so the four or five you avoid get named.',
    ],
    watchFor:
      'Slowing down for a black root. The figure is the same distance apart whatever colour it starts on.',
  },
  'broken-minor': {
    ...base,
    id: 'broken-minor',
    source: { kind: 'chord', degrees: [1, 3, 5, 3] },
    roots: ALL_KEYS,
    qualities: ['minor'],
    loops: 4,
    goal: 'The minor version: one note lower in the middle, and it changes everything.',
    guidance: [
      'The third drops a semitone. The root, the fifth and the fingering are unchanged.',
      'It feels different under the hand because the middle finger reaches less far.',
      'All twelve roots, so the flattened third has to be found rather than remembered.',
    ],
    watchFor:
      'Playing the major third out of habit on the keys you know best. The third is the only note that moved and it is the one to check.',
  },
  'broken-continuous': {
    ...base,
    id: 'broken-continuous',
    source: { kind: 'chord', degrees: [1, 3, 5, 3] },
    roots: CORE_KEYS,
    qualities: ['major', 'minor'],
    metronome: true,
    ladder: true,
    tempos: [50, 60, 72, 84, 96],
    loops: 3,
    goal: 'Round and round without a seam — three clean loops move the tempo up.',
    guidance: [
      'The figure loops continuously against the click. There is no gap between the last note and the first.',
      'The tempo is not yours to set: clean loops raise it, a stumble lowers it.',
      'The join from the end back to the start is the hardest moment and it is scored as a turn.',
    ],
    watchFor:
      'A gap between loops. A broken chord accompanies music continuously, and a seam every four notes is audible.',
  },
};

/* ---------------- 7.3 · arpeggios ---------------- */

/** 7.3.4 to 7.3.6 — one key's arpeggio, generated from the key. */
function arpeggioKey(root: string): PatternConfig {
  return {
    ...base,
    id: `arpeggio-${root.toLowerCase()}`,
    source: { kind: 'chord', degrees: [1, 3, 5, 8, 5, 3] },
    roots: [root],
    loops: 6,
    goal: `${root} major arpeggio: up to the octave and back down.`,
    guidance: [
      'Six notes: 1–3–5–8, then back through the fifth and third.',
      'Fingering is 1–2–3–5 going up, and it reverses coming down.',
      'The octave at the top is the turn, and the note after it is scored on its own.',
    ],
    watchFor:
      'Reaching the octave and then hesitating. Coming down is a different movement, not a rewind.',
  };
}

const ARPEGGIO_DRILLS: Readonly<Record<string, PatternConfig>> = {
  'arpeggio-1358': {
    ...base,
    id: 'arpeggio-1358',
    source: { kind: 'chord', degrees: [1, 3, 5, 8] },
    loops: 6,
    goal: '1–3–5–8: the broken chord reaching an octave, which makes it an arpeggio.',
    guidance: [
      'The same three chord tones plus the root an octave up.',
      'Fingering changes because the span does: 1–2–3–5 in the right hand rather than 1–3–5.',
      'The hand has to open. That, and nothing else, is the difference from a broken chord.',
    ],
    watchFor:
      'Keeping the broken-chord fingering. 1–3–5 cannot reach an octave, and forcing it twists the wrist.',
  },
  'arpeggio-up': {
    ...base,
    id: 'arpeggio-up',
    source: { kind: 'chord', degrees: [1, 3, 5, 8] },
    roots: CORE_KEYS,
    loops: 6,
    goal: 'Upward arpeggios in three keys — C, F and G.',
    guidance: [
      'One direction only, so the reach is what is being practised.',
      'C, F and G. The shape is identical; only the starting key moves.',
      'Even and relaxed. A rushed octave is the commonest fault here.',
    ],
    watchFor:
      'The last note arriving late. The octave is the widest reach in the figure and it needs the same time as the others, not more.',
  },
  'arpeggio-down': {
    ...base,
    id: 'arpeggio-down',
    source: { kind: 'chord', degrees: [8, 5, 3, 1] },
    roots: CORE_KEYS,
    loops: 6,
    goal: 'Downward arpeggios — high, middle, low, and not simply the other one backwards.',
    guidance: [
      'Start on the octave and come down. The fingering reverses with it.',
      'Think high → middle → low rather than "backwards", which is what makes descending slow.',
      'Compare your evenness against the ascending practice.',
    ],
    watchFor:
      'Playing it as the ascending figure in reverse. That means reading it backwards every time, and it never gets quick.',
  },
  'arpeggio-c': arpeggioKey('C'),
  'arpeggio-f': arpeggioKey('F'),
  'arpeggio-g': arpeggioKey('G'),
  'arpeggio-minor': {
    ...base,
    id: 'arpeggio-minor',
    source: { kind: 'chord', degrees: [1, 3, 5, 8, 5, 3] },
    roots: CORE_KEYS,
    qualities: ['minor'],
    loops: 5,
    goal: 'Minor arpeggios: the third drops and the reach stays the same.',
    guidance: [
      'Root, minor third, fifth, octave. Only the second note moved.',
      'The hand shape is nearly identical, which is why the wrong third is so easy to play.',
      'Three keys, both directions inside the figure.',
    ],
    watchFor:
      'Playing the major third. It is one semitone and it is the entire difference between the two shapes.',
  },
  'arpeggio-repetition': {
    ...base,
    id: 'arpeggio-repetition',
    source: { kind: 'chord', degrees: [1, 3, 5, 8, 5, 3] },
    roots: CORE_KEYS,
    qualities: ['major', 'minor'],
    metronome: true,
    ladder: true,
    tempos: [50, 60, 72, 84, 96, 108],
    loops: 3,
    goal: 'The arpeggio looped against a click, with the tempo earned rather than chosen.',
    guidance: [
      'Continuous loops. Three clean ones move the tempo up; one stumble moves it back.',
      'The tempo you settle at is your real arpeggio speed, and it is usually well below the one you would pick.',
      'Both qualities and three keys, so nothing can be played from muscle memory alone.',
    ],
    watchFor:
      'Forcing the next rung. It dropped because a loop was not clean, and a clean loop is the only way back up.',
  },
};

/* ---------------- 7.4 · Alberti bass ---------------- */

/** The pattern itself: root, fifth, third, fifth, over and over. */
const ALBERTI: FigureSource = { kind: 'chord', degrees: [1, 5, 3, 5] };

/** 7.4.2 to 7.4.4 — one key's Alberti bass, generated from the key. */
function albertiKey(root: string): PatternConfig {
  return {
    ...base,
    id: `alberti-${root.toLowerCase()}`,
    source: ALBERTI,
    roots: [root],
    hands: ['left'],
    loops: 6,
    goal: `${root} major Alberti bass — the same four notes until the hand stops thinking about them.`,
    guidance: [
      'Root, fifth, third, fifth. The hand does not move; only the fingers do.',
      'Fingering is 5–1–3–1 in the left hand, which is where this pattern lives.',
      'Even and quiet. An Alberti bass is accompaniment, and accompaniment that is heard is too loud.',
    ],
    watchFor:
      'The third arriving late. It is the middle finger reaching between two easy notes, and it is where the pattern lurches.',
  };
}

const ALBERTI_DRILLS: Readonly<Record<string, PatternConfig>> = {
  'alberti-pattern': {
    ...base,
    id: 'alberti-pattern',
    source: ALBERTI,
    hands: ['left', 'right'],
    loops: 6,
    goal: '1–5–3–5: the oldest accompaniment pattern there is, and the one your hand will use most.',
    guidance: [
      'A C major chord played as C–G–E–G rather than all at once.',
      'The outer fingers take the root and the fifth; the third is reached in between without moving.',
      'Two turns in four notes, which is why it needs to be even before it is quick.',
    ],
    watchFor:
      'Playing it as a broken chord. 1–3–5 goes up; 1–5–3–5 goes up, down, up — the movement is completely different.',
  },
  'alberti-c': albertiKey('C'),
  'alberti-f': albertiKey('F'),
  'alberti-g': albertiKey('G'),
  'alberti-continuous': {
    ...base,
    id: 'alberti-continuous',
    source: ALBERTI,
    roots: ['C', 'F', 'G'],
    hands: ['left'],
    metronome: true,
    ladder: true,
    tempos: [50, 60, 72, 84, 96],
    loops: 3,
    goal: 'Round and round with no seam — three clean loops move the tempo up.',
    guidance: [
      'The pattern loops against the click, changing key between loops.',
      'The join from the last fifth back to the root is scored as a turn, because it is one.',
      'The tempo is earned. A stumble drops it and a clean loop is the only way back.',
    ],
    watchFor:
      'A gap at the loop join. An Alberti bass runs continuously under a melody; a seam every four notes is the thing an audience hears.',
  },
  'alberti-melody': {
    ...base,
    id: 'alberti-melody',
    source: { kind: 'scale', contour: 'wave', length: 5 },
    left: ALBERTI,
    roots: ['C', 'F', 'G'],
    hands: ['right'],
    metronome: true,
    tempos: [40, 50, 60],
    loops: 5,
    goal: 'The pattern underneath while the right hand plays a tune over it.',
    guidance: [
      'Left hand keeps the Alberti bass; right hand takes the melody. Both hands land on the same beats.',
      'Forty to start. If the bass falters when the melody moves, the tempo is too high.',
      'This is what the whole bucket was for — the pattern is only useful once something sits on top of it.',
    ],
    watchFor:
      'The bass pausing whenever the melody does something. The accompaniment is the floor and it does not get to wobble.',
  },
};

/* ---------------- 7.5 · chord and melody ---------------- */

/** A held triad under the melody — the simplest accompaniment there is. */
const BLOCK: FigureSource = { kind: 'accompaniment', steps: [{ degrees: [1, 3, 5], beats: 4 }] };
/** The same chord struck on every beat. */
const PULSE: FigureSource = {
  kind: 'accompaniment',
  steps: [1, 2, 3, 4].map(() => ({ degrees: [1, 3, 5], beats: 1 })),
};

const MELODY_CHORD_DRILLS: Readonly<Record<string, PatternConfig>> = {
  'chord-single': {
    ...base,
    id: 'chord-single',
    source: { kind: 'scale', contour: 'wave', length: 4 },
    left: BLOCK,
    hands: ['right'],
    loops: 6,
    goal: 'One chord held underneath while the melody moves above it.',
    guidance: [
      'Left hand plays C–E–G once and holds; right hand plays a short line over it.',
      'Four notes over one chord, so the hands only meet on the first beat.',
      'The point is that the hands do different things at different times, which is new.',
    ],
    watchFor:
      'Releasing the chord to play the melody. The harmony holds; only the melody moves.',
  },
  'chord-block': {
    ...base,
    id: 'chord-block',
    source: { kind: 'scale', contour: 'up', length: 4 },
    left: PULSE,
    hands: ['right'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 6,
    goal: 'The chord struck on every beat with the melody moving over it — both hands together, all four beats.',
    guidance: [
      'Block chords on 1, 2, 3 and 4, and a melody note on each of them.',
      'Every beat needs four keys: three in the left hand and one in the right.',
      'The hands land together every time, which is easier to coordinate and harder to make even.',
    ],
    watchFor:
      'The chord arriving a fraction before the melody. It is the commonest fault in two-hand playing and it is very audible.',
  },
  'chord-c': {
    ...base,
    id: 'chord-c',
    source: { kind: 'scale', contour: 'wave', length: 4 },
    left: BLOCK,
    roots: ['C'],
    hands: ['right'],
    loops: 8,
    goal: 'C major held, and a melody built from its own scale over the top.',
    guidance: [
      'One key, one chord, and a line that belongs to it. Nothing to decide.',
      'Eight clean loops. This is the figure to have completely secure before it moves.',
      'Then change the melody shape and keep the chord — the accompaniment should not notice.',
    ],
    watchFor:
      'Learning the pair as one thing. The chord and the melody are separate jobs, and they will come apart in the next practice.',
  },
  'chord-cfg': {
    ...base,
    id: 'chord-cfg',
    source: { kind: 'scale', contour: 'wave', length: 4 },
    left: BLOCK,
    roots: ['C', 'F', 'G'],
    hands: ['right'],
    loops: 8,
    goal: 'The chord changes between loops and the melody follows it into the new key.',
    guidance: [
      'C, F and G in turn. Both the chord and the melody move with the key.',
      'The melody is built from the chord’s own scale, so it always fits.',
      'Scores are kept per key, so the one you fumble gets named.',
    ],
    watchFor:
      'Keeping the melody in C while the chord moves. If the two disagree it is instantly obvious, which is a useful kind of mistake.',
  },
  'chord-changes': {
    ...base,
    id: 'chord-changes',
    source: { kind: 'scale', contour: 'up', length: 4 },
    left: PULSE,
    roots: ['C', 'F', 'G', 'A'],
    qualities: ['major', 'minor'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 8,
    goal: 'Chords changing under a moving melody, in time, without either hand stopping.',
    guidance: [
      'The chord changes every loop and both qualities are in the pool.',
      'Neither hand waits for the other. The click decides when the change happens.',
      'This is accompaniment as it actually works.',
    ],
    watchFor:
      'The melody pausing while the left hand finds the next chord. That pause is the whole problem this level exists to remove.',
  },
  'melody-phrasing': {
    ...base,
    id: 'melody-phrasing',
    source: { kind: 'scale', contour: 'wave', length: 8 },
    left: BLOCK,
    values: ['quarter', 'quarter', 'half', 'quarter', 'eighth', 'eighth', 'quarter', 'whole'],
    metronome: true,
    tempos: [50, 60],
    hands: ['right'],
    loops: 6,
    goal: 'A melody with shape: different lengths, and a chord underneath that does not move.',
    guidance: [
      'The melody has long notes and short ones. The accompaniment does not.',
      'A phrase is not a row of equal notes; the lengths are what make it say something.',
      'The strip shows how long each note lasts, and the click keeps the chord honest.',
    ],
    watchFor:
      'Flattening every note to the same length because the fingers are busy. The rhythm is the phrasing.',
  },
  'song-arrangement': {
    ...base,
    id: 'song-arrangement',
    source: { kind: 'scale', contour: 'wave', length: 4 },
    left: ALBERTI,
    roots: ['C', 'F', 'G'],
    metronome: true,
    ladder: true,
    tempos: [40, 50, 60, 72, 84],
    hands: ['right'],
    loops: 4,
    goal: 'Everything at once: a melody, an Alberti bass under it, and a key that changes.',
    guidance: [
      'This is a small arrangement rather than an exercise — melody, accompaniment and harmony together.',
      'The tempo is earned: four clean loops move it up and a stumble moves it back.',
      'Where you settle is how fast you can actually play two parts at once.',
    ],
    watchFor:
      'Chasing the tempo. Two hands doing different things fall apart a long way below the speed either hand manages alone.',
  },
};

/* ---------------- 7.6 · left-hand accompaniment ---------------- */

/** The patterns 7.6 works through, written as what sounds when. */
const ROOTS_ONLY: FigureSource = {
  kind: 'accompaniment',
  steps: [{ degrees: [1], beats: 4 }],
};
const ROOT_CHORD: FigureSource = {
  kind: 'accompaniment',
  steps: [
    { degrees: [1], beats: 1 },
    { degrees: [1, 3, 5], beats: 1 },
    { degrees: [1], beats: 1 },
    { degrees: [1, 3, 5], beats: 1 },
  ],
};
const OCTAVE_BASS: FigureSource = {
  kind: 'accompaniment',
  steps: [
    { degrees: [1, 8], beats: 2 },
    { degrees: [1, 8], beats: 2 },
  ],
};
const BASS_CHORD: FigureSource = {
  kind: 'accompaniment',
  steps: [
    { degrees: [1, 8], beats: 1 },
    { degrees: [1, 3, 5], beats: 1 },
    { degrees: [5], beats: 1 },
    { degrees: [1, 3, 5], beats: 1 },
  ],
};
/** Three beats to the bar: bass, chord, chord. */
const WALTZ: FigureSource = {
  kind: 'accompaniment',
  steps: [
    { degrees: [1], beats: 1 },
    { degrees: [1, 3, 5], beats: 1 },
    { degrees: [1, 3, 5], beats: 1 },
  ],
};
/** The pop pattern: root, fifth, chord, fifth. */
const POP: FigureSource = {
  kind: 'accompaniment',
  steps: [
    { degrees: [1], beats: 1 },
    { degrees: [5], beats: 1 },
    { degrees: [1, 3, 5], beats: 1 },
    { degrees: [5], beats: 1 },
  ],
};

const ACCOMPANIMENT_DRILLS: Readonly<Record<string, PatternConfig>> = {
  'lh-roots': {
    ...base,
    id: 'lh-roots',
    source: ROOTS_ONLY,
    roots: ['C', 'F', 'G'],
    hands: ['left'],
    metronome: true,
    tempos: [60, 72, 84],
    loops: 8,
    goal: 'One note a bar, changing key on the beat — the simplest accompaniment there is.',
    guidance: [
      'The root of the chord, held for the whole bar, changing between bars.',
      'C, F and G. Nothing to play except the right note at the right moment.',
      'The little finger takes the root, which is where a bass line lives.',
    ],
    watchFor:
      'Changing early or late. With one note a bar there is nothing else to get wrong, which makes it the best place to fix timing.',
  },
  'lh-root-chord': {
    ...base,
    id: 'lh-root-chord',
    source: ROOT_CHORD,
    roots: ['C', 'F', 'G'],
    hands: ['left'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 8,
    goal: 'Bass, chord, bass, chord — the pattern behind most simple songs.',
    guidance: [
      'A single low note on 1 and 3, the full chord on 2 and 4.',
      'The hand opens for the chord and closes for the bass. That alternation is the pattern.',
      'Both parts have to be even. A heavy bass and a scrambled chord is the usual result.',
    ],
    watchFor:
      'The chord arriving late because three keys take longer than one. They do not have to — the hand should already be shaped.',
  },
  'lh-octave': {
    ...base,
    id: 'lh-octave',
    source: OCTAVE_BASS,
    roots: ['C', 'F', 'G'],
    hands: ['left'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 8,
    goal: 'Two notes an octave apart, sounding together — the fullest bass a single hand can make.',
    guidance: [
      'Thumb and little finger, root and root. Nothing in between.',
      'Both keys must land at the same moment; one arriving first sounds like a mistake.',
      'The stretch is fixed, so the hand can find it by feel rather than by looking.',
    ],
    watchFor:
      'The two notes not landing together. An octave played as a fast pair of notes is a different sound entirely.',
  },
  'lh-bass-chord': {
    ...base,
    id: 'lh-bass-chord',
    source: BASS_CHORD,
    roots: ['C', 'F', 'G'],
    hands: ['left'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 8,
    goal: 'Octave bass, chord, fifth, chord — a fuller pattern with the bass line moving.',
    guidance: [
      'The bass alternates between the root and the fifth while the chord answers each time.',
      'A moving bass under a still chord is what makes an accompaniment sound like a part rather than padding.',
      'Four different hand shapes in four beats, which is what makes this the hardest one so far.',
    ],
    watchFor:
      'Losing the fifth on beat three. It is the one note in the pattern that is not the root, and it is the one that gets dropped.',
  },
  'lh-waltz': {
    ...base,
    id: 'lh-waltz',
    source: WALTZ,
    roots: ['C', 'F', 'G'],
    hands: ['left'],
    metronome: true,
    tempos: [60, 72, 84, 96],
    loops: 8,
    goal: 'Three to the bar: bass, chord, chord — and the first beat must be the strong one.',
    guidance: [
      'Bass on one, chord on two and three. Three beats rather than four.',
      'The bass is heavier and the chords are lighter; that difference is the whole character.',
      'Counting in three is unfamiliar after everything else in this level, which is the point.',
    ],
    watchFor:
      'Slipping back into four beats. Adding a chord on an imaginary fourth beat turns a waltz into something else entirely.',
  },
  'lh-pop': {
    ...base,
    id: 'lh-pop',
    source: POP,
    roots: ['C', 'F', 'G', 'A'],
    qualities: ['major', 'minor'],
    metronome: true,
    tempos: [60, 72, 84],
    loops: 8,
    goal: 'Root, fifth, chord, fifth — the pattern under most modern songs.',
    guidance: [
      'The fifth is the pivot: it appears twice and the hand returns to it.',
      'Both qualities, because a pop progression is rarely all major.',
      'Light and steady. This pattern runs for an entire song without changing.',
    ],
    watchFor:
      'Accenting the chord because it has three notes in it. Three keys should not be louder than one.',
  },
  'lh-broken': {
    ...base,
    id: 'lh-broken',
    source: ALBERTI,
    roots: ['C', 'F', 'G'],
    qualities: ['major', 'minor'],
    hands: ['left'],
    metronome: true,
    tempos: [60, 72, 84],
    loops: 8,
    goal: 'A broken-chord accompaniment: the same harmony, arriving one note at a time.',
    guidance: [
      'The Alberti figure used as accompaniment rather than as an exercise.',
      'Continuous and even — this is the texture that runs under a melody for minutes at a time.',
      'Both qualities and three keys, so the shape has to be found rather than remembered.',
    ],
    watchFor:
      'Playing it as loudly as a block chord. A broken accompaniment works because it stays out of the way.',
  },
  'lh-progression': {
    ...base,
    id: 'lh-progression',
    source: ROOT_CHORD,
    roots: ['C', 'F', 'G', 'A'],
    qualities: ['major', 'minor'],
    metronome: true,
    ladder: true,
    tempos: [50, 60, 72, 84, 96],
    hands: ['left'],
    loops: 4,
    goal: 'The pattern carried through a changing progression, with the tempo earned.',
    guidance: [
      'The key changes every loop; the pattern does not.',
      'Four clean loops raise the tempo, one stumble lowers it.',
      'This is a whole song’s worth of left hand, and it is the last thing before both hands.',
    ],
    watchFor:
      'The pattern breaking down at the chord change. The change is one moment in the bar and it should cost nothing.',
  },
};

/* ---------------- 7.7 · two hands ---------------- */

const TWO_HAND_DRILLS: Readonly<Record<string, PatternConfig>> = {
  'two-same-rhythm': {
    ...base,
    id: 'two-same-rhythm',
    source: { kind: 'scale', contour: 'up', length: 5 },
    left: { kind: 'scale', contour: 'up', length: 5 },
    hands: ['right'],
    loops: 8,
    goal: 'Both hands, the same notes, the same rhythm — the easiest thing two hands can do.',
    guidance: [
      'Five notes rising in each hand, an octave apart, landing together every time.',
      'Every beat needs two keys. Neither hand leads.',
      'Start here even if it feels trivial; everything else is this with something removed.',
    ],
    watchFor:
      'One hand arriving first. It is almost always the right, and at this speed it is entirely fixable.',
  },
  'two-different-notes': {
    ...base,
    id: 'two-different-notes',
    source: { kind: 'scale', contour: 'up', length: 5 },
    left: { kind: 'scale', contour: 'down', length: 5 },
    hands: ['right'],
    loops: 8,
    goal: 'Same rhythm, opposite directions — the hands move apart and still land together.',
    guidance: [
      'The right hand rises while the left falls. Same beats, different notes.',
      'This is where "my hands can do different things" actually starts.',
      'Both keys of every beat before the next one.',
    ],
    watchFor:
      'The left hand copying the right. Contrary motion is the first thing the hands try to refuse.',
  },
  'two-steady-melody': {
    ...base,
    id: 'two-steady-melody',
    source: { kind: 'scale', contour: 'wave', length: 4 },
    left: BLOCK,
    hands: ['right'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 8,
    goal: 'Left hand still, right hand moving — the most common shape in all of piano playing.',
    guidance: [
      'One held chord and a melody over it. The hands meet only on the first beat.',
      'The left hand has the easier job and it is the one that will falter.',
      'Once this is comfortable, everything in 7.5 becomes easier too.',
    ],
    watchFor:
      'The left hand re-striking whenever the melody moves. It is holding, not playing along.',
  },
  'two-different-rhythms': {
    ...base,
    id: 'two-different-rhythms',
    source: { kind: 'scale', contour: 'wave', length: 8 },
    left: ROOT_CHORD,
    values: ['eighth'],
    hands: ['right'],
    metronome: true,
    tempos: [40, 50, 60],
    loops: 6,
    goal: 'Two notes in the right hand for every one in the left — genuinely different rhythms.',
    guidance: [
      'Eighths above, quarters below. The hands coincide on every other note.',
      'Forty to start. This is the hardest coordination in the level.',
      'Count aloud if it helps; the hands need something outside them to agree with.',
    ],
    watchFor:
      'The left hand speeding up to match the right. Two against one is two independent parts, not one fast one.',
  },
  'two-repeating': {
    ...base,
    id: 'two-repeating',
    source: { kind: 'scale', contour: 'wave', length: 4 },
    left: ALBERTI,
    roots: ['C', 'F', 'G'],
    hands: ['right'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 8,
    goal: 'A repeating left-hand pattern with a melody that does not repeat.',
    guidance: [
      'The Alberti bass loops unchanged while the melody moves over it.',
      'The left hand should become automatic; that is what frees your attention for the right.',
      'Change the key between loops and the bass should not notice.',
    ],
    watchFor:
      'Thinking about the accompaniment. If it still needs attention, drill it alone in 7.4 until it does not.',
  },
  'two-chord-changes': {
    ...base,
    id: 'two-chord-changes',
    source: { kind: 'scale', contour: 'up', length: 4 },
    left: PULSE,
    roots: ['C', 'F', 'G', 'A'],
    qualities: ['major', 'minor'],
    metronome: true,
    tempos: [50, 60, 72],
    loops: 8,
    goal: 'The harmony changing under a melody, with both hands on every beat.',
    guidance: [
      'Chords on all four beats and a melody note on each of them.',
      'The chord changes between loops; the melody moves with it.',
      'Four keys a beat, landing together, every time.',
    ],
    watchFor:
      'A gap at the chord change. It is one moment in the bar and it should cost nothing at all.',
  },
  'two-speed': {
    ...base,
    id: 'two-speed',
    source: { kind: 'scale', contour: 'wave', length: 4 },
    left: ROOT_CHORD,
    roots: ['C', 'F', 'G'],
    metronome: true,
    ladder: true,
    tempos: [40, 50, 60, 72, 84, 96],
    hands: ['right'],
    loops: 3,
    goal: 'Slow, then medium, then fast — with the drill deciding when you have earned each step.',
    guidance: [
      'Three clean loops move the tempo up; one stumble moves it back.',
      'Forty to ninety-six. Where you settle is your real two-hand tempo.',
      'It will be far below either hand alone, and that is the honest number.',
    ],
    watchFor:
      'Forcing the next rung. Two hands fall apart before one hand does, and pushing past that just practises falling apart.',
  },
  'two-independent': {
    ...base,
    id: 'two-independent',
    source: { kind: 'scale', contour: 'skip', length: 4 },
    left: WALTZ,
    roots: ['C', 'F', 'G'],
    hands: ['right'],
    metronome: true,
    tempos: [40, 50, 60],
    loops: 6,
    goal: 'A leaping melody over a three-beat accompaniment — neither hand helping the other.',
    guidance: [
      'Four melody notes over three accompaniment beats, so they do not line up neatly.',
      'The hands agree on the downbeat and disagree everywhere else. That is independence.',
      'Slowly. This is the practice that proves the two hands are separate.',
    ],
    watchFor:
      'One hand pulling the other into its rhythm. When the parts disagree, the click is the only thing either should follow.',
  },
  'two-continuous': {
    ...base,
    id: 'two-continuous',
    source: { kind: 'scale', contour: 'wave', length: 4 },
    left: ALBERTI,
    roots: ['C', 'F', 'G'],
    qualities: ['major', 'minor'],
    metronome: true,
    tempos: [50, 60, 72],
    hands: ['right'],
    loops: 12,
    goal: 'Twelve loops without stopping — playing rather than practising.',
    guidance: [
      'The key and the quality change as it runs, and nothing stops.',
      'A mistake is not a reason to go back. Carry on and let the next loop be right.',
      'The measure is the streak: how many loops in a row landed clean.',
    ],
    watchFor:
      'Restarting after a slip. In performance the piece keeps going, and practising stopping is practising the wrong thing.',
  },
  'two-song': {
    ...base,
    id: 'two-song',
    source: { kind: 'scale', contour: 'wave', length: 8 },
    left: ALBERTI,
    roots: ['C', 'F', 'G', 'A'],
    qualities: ['major', 'minor'],
    values: ['quarter', 'quarter', 'half', 'eighth', 'eighth', 'quarter', 'half', 'whole'],
    metronome: true,
    ladder: true,
    tempos: [40, 50, 60, 72],
    hands: ['right'],
    loops: 4,
    goal: 'The level’s finish: a phrased melody, an Alberti bass, changing keys, at an earned tempo.',
    guidance: [
      'Everything level 7 built, at once — figure, accompaniment, rhythm and two hands.',
      'Mixed note lengths in the melody and a bass that does not change with them.',
      'Four clean loops move the tempo. Where it settles is where your playing actually is.',
    ],
    watchFor:
      'Judging it by the tempo alone. A clean sixty with two independent parts is worth far more than a ragged ninety.',
  },
};

export const PATTERN_DRILLS: Readonly<Record<string, PatternConfig>> = {
  ...MELODY_DRILLS,
  ...BROKEN_DRILLS,
  ...ARPEGGIO_DRILLS,
  ...ALBERTI_DRILLS,
  ...MELODY_CHORD_DRILLS,
  ...ACCOMPANIMENT_DRILLS,
  ...TWO_HAND_DRILLS,
};

export function getPatternDrill(id: string): PatternConfig {
  const config = PATTERN_DRILLS[id];
  if (!config) throw new Error(`Unknown pattern drill: ${id}`);
  return config;
}

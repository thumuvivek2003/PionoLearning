import type { Challenge } from '../performance.types';
import { ALL_KEYS, ALL_NOTES, BLACK_NOTES, SCALE_KEYS, WHITE_NOTES } from './challenges';

/**
 * 8.1 to 8.4 as data.
 *
 * Level 8 introduces no material. Every round asks something an earlier level
 * taught, drawn at random and against a clock — so a practice here is a pool, a
 * number of rounds and an allowance, and nothing else. What makes it hard is
 * that you do not get to choose what comes next.
 */
export interface ChallengeConfig {
  id: string;
  challenge: Challenge;
  /** Rounds in a session. */
  rounds: number;
  /** Allowances in ms, tightening as the session runs. */
  ladder: readonly number[];
  /** Cover the keyboard once the round is dealt. */
  blind: boolean;
  /** Offer a hand picker, for the practices that name one. */
  hands: boolean;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

const base = {
  rounds: 20,
  ladder: [5000, 3500, 2500] as readonly number[],
  blind: false,
  hands: false,
} as const;

const MID_OCTAVES: readonly number[] = [4];
const WIDE_OCTAVES: readonly number[] = [3, 4, 5];

/* ---------------- 8.1 · random notes ---------------- */

const NOTE_DRILLS: Readonly<Record<string, ChallengeConfig>> = {
  'white-keys': {
    ...base,
    id: 'white-keys',
    challenge: { kind: 'note', notes: WHITE_NOTES, octaves: MID_OCTAVES },
    ladder: [4000, 3000, 2000],
    goal: 'The seven white keys, called at random and found without searching.',
    guidance: [
      'A note is named; press it. One octave to begin with, so only the letter matters.',
      'Twenty of them. The reference wants all twenty inside twenty seconds.',
      'The panel scores each letter separately, so the two or three you hunt for get named.',
    ],
    watchFor:
      'Counting up from C. It gives the right key and it is the habit that caps every later speed.',
  },
  'black-keys': {
    ...base,
    id: 'black-keys',
    challenge: { kind: 'note', notes: BLACK_NOTES, octaves: MID_OCTAVES },
    ladder: [5000, 4000, 3000],
    goal: 'The five black keys, by name — including the flat names.',
    guidance: [
      'C♯, E♭, F♯, A♭ and B♭. The names used are the ones a chord chart would use.',
      'A black key is found by its white neighbours: E♭ is left of E, F♯ is right of F.',
      'Slower than the white keys, and that gap is what this practice is for.',
    ],
    watchFor:
      'Translating a flat name into a sharp one before playing. Both names should reach the hand directly.',
  },
  'note-to-key': {
    ...base,
    id: 'note-to-key',
    challenge: { kind: 'note', notes: ALL_NOTES, octaves: MID_OCTAVES },
    ladder: [4000, 3000, 2000],
    goal: 'All twelve notes mixed, named and played.',
    guidance: [
      'White and black together, so nothing can be answered by colour.',
      'Two seconds by the end of the session.',
      'This is the foundation every other bucket in the level stands on.',
    ],
    watchFor:
      'Being fast on white keys and slow on black ones. They are equally common in real music.',
  },
  'key-to-note': {
    ...base,
    id: 'key-to-note',
    challenge: { kind: 'name-note', notes: ALL_NOTES, octaves: MID_OCTAVES, askOctave: false },
    ladder: [4000, 3000, 2000],
    goal: 'The other way round: a key lights up and you name it.',
    guidance: [
      'Reading the board rather than searching it — the reverse of every other note practice.',
      'Recognising a key and finding one are different skills, and the second usually lags.',
      'The choices are all twelve names, so there is nothing to narrow down.',
    ],
    watchFor:
      'Working out the name from middle C each time. A lit key should have a name before you have counted anything.',
  },
  octaves: {
    ...base,
    id: 'octaves',
    challenge: { kind: 'name-note', notes: ALL_NOTES, octaves: WIDE_OCTAVES, askOctave: true },
    ladder: [5000, 4000, 3000],
    goal: 'Which octave — the same letter in three different places on the board.',
    guidance: [
      'A key lights up; say which octave it is in. Three octaves are in play.',
      'The letter is not the question. Where on the board it sits is.',
      'Middle C is the landmark everything else is counted from.',
    ],
    watchFor:
      'Guessing the middle octave because it is the commonest. The outer two are where reading actually breaks down.',
  },
  'random-notes': {
    ...base,
    id: 'random-notes',
    challenge: { kind: 'note', notes: ALL_NOTES, octaves: WIDE_OCTAVES },
    ladder: [5000, 4000, 3000],
    goal: 'Any note, any of three octaves, called by name and octave together.',
    guidance: [
      'C3, G4, E5 — the letter and the octave, both of which have to land.',
      'Three octaves means the hand has to travel, which is a different skill from finding a note nearby.',
      'Scores are kept per letter, so a note that is fine in one octave and lost in another still gets named.',
    ],
    watchFor:
      'Playing the right letter in the wrong octave. It is the commonest miss here and it is a real mistake, not a near one.',
  },
  'blind-notes': {
    ...base,
    id: 'blind-notes',
    challenge: { kind: 'note', notes: ALL_NOTES, octaves: MID_OCTAVES },
    blind: true,
    ladder: [6000, 5000, 4000],
    goal: 'The same notes with the keyboard covered — found by touch alone.',
    guidance: [
      'The cover goes on as the round is dealt. Presses still land; you just cannot see where.',
      'A wrong note tells you exactly how far off your hand was, which watching would have hidden.',
      'Slower on purpose. Accuracy is the only measure here.',
    ],
    watchFor:
      'Feeling for the black-key groups every time before committing. That works and it is what the practice is meant to replace.',
  },
  'speed-notes': {
    ...base,
    id: 'speed-notes',
    challenge: { kind: 'note', notes: ALL_NOTES, octaves: WIDE_OCTAVES },
    rounds: 25,
    ladder: [3000, 2000, 1500, 1000],
    goal: 'Down to a second a note — reflex rather than recall.',
    guidance: [
      'The tightest allowance in the level, and it ends at one second.',
      'Out of time counts as a miss, exactly like a wrong key.',
      'The number worth knowing is the tightest rung you were still accurate at.',
    ],
    watchFor:
      'Chasing the last rung. A second per note with mistakes is worth less than two seconds clean.',
  },
};

/* ---------------- 8.2 · random scales ---------------- */

/** 8.2.1 to 8.2.6 — one key's scale, recalled and played. */
function scaleKey(key: string, note: string): ChallengeConfig {
  return {
    ...base,
    id: `scale-${key.toLowerCase()}`,
    challenge: { kind: 'scale', keys: [key], direction: 'up' },
    rounds: 10,
    ladder: [12000, 9000, 7000],
    hands: true,
    goal: `${key} major, called and played straight through — ${note}`,
    guidance: [
      'The key is named; play its eight notes upward without working them out.',
      'One key at a time, so what is being tested is recall rather than choosing.',
      'Each note is scored where it sits, so the one you hesitate on gets named rather than the scale.',
    ],
    watchFor:
      'Rebuilding the scale from the formula. That is level 4 working; by level 8 the notes should already be there.',
  };
}

const SCALE_DRILLS: Readonly<Record<string, ChallengeConfig>> = {
  'scale-c': {
    ...base,
    id: 'scale-c',
    challenge: { kind: 'scale', keys: ['C'], direction: 'both' },
    rounds: 10,
    ladder: [16000, 13000, 10000],
    hands: true,
    goal: 'C major up and back, started from wherever the round puts it.',
    guidance: [
      'Eight up and seven back, with no pause at the top.',
      'The turn at the octave is the only hard moment in the whole scale.',
      'No accidentals to remember, so this is about the movement and nothing else.',
    ],
    watchFor:
      'Stopping at the top note to work out the way back down. Descending is its own direction, not a rewind.',
  },
  'scale-g': scaleKey('G', 'one sharp, F♯.'),
  'scale-d': scaleKey('D', 'two sharps, F♯ and C♯.'),
  'scale-f': scaleKey('F', 'one flat, B♭.'),
  'scale-a': scaleKey('A', 'three sharps, F♯, C♯ and G♯.'),
  'scale-e': scaleKey('E', 'four sharps, F♯, C♯, G♯ and D♯.'),
  'scale-random': {
    ...base,
    id: 'scale-random',
    challenge: { kind: 'scale', keys: SCALE_KEYS, direction: 'up' },
    rounds: 12,
    ladder: [12000, 9000, 7000],
    hands: true,
    goal: 'Any of the six keys, drawn without warning.',
    guidance: [
      'C, G, D, F, A and E. No order to lean on.',
      'The key arrives and the scale has to follow — no time to recite the accidentals first.',
      'Scores are per key, so the two you keep stalling on get named.',
    ],
    watchFor:
      'Reciting the sharps before starting. That is a step you should be able to skip by now.',
  },
  'scale-both-ways': {
    ...base,
    id: 'scale-both-ways',
    challenge: { kind: 'scale', keys: SCALE_KEYS, direction: 'both' },
    rounds: 10,
    ladder: [18000, 15000, 12000],
    hands: true,
    goal: 'Any key, up and back down, without a seam at the turn.',
    guidance: [
      'Fifteen notes a round. The turn is the moment to watch.',
      'Compare your time against the one-direction practice: it should be a little over double, not far more.',
      'A long round, so the allowance is generous and still tightens.',
    ],
    watchFor:
      'Coming down more slowly than you went up. Everyone does; measuring it is how it changes.',
  },
  'scale-hands': {
    ...base,
    id: 'scale-hands',
    challenge: { kind: 'scale', keys: SCALE_KEYS, direction: 'up' },
    rounds: 12,
    ladder: [14000, 11000, 9000],
    hands: true,
    goal: 'Each hand on its own, alternating, so neither gets to be the one you never practise.',
    guidance: [
      'The hand picker chooses which one plays. Alternate deliberately.',
      'Both hands need the scale independently before either can play it with the other.',
      'The panel scores by note, and the notes are the same either way, so the gap between hands shows in the times.',
    ],
    watchFor:
      'Practising the comfortable hand because progress feels better there. The other one is the practice.',
  },
  'scale-speed': {
    ...base,
    id: 'scale-speed',
    challenge: { kind: 'scale', keys: SCALE_KEYS, direction: 'up' },
    rounds: 15,
    ladder: [10000, 8000, 6000, 4500],
    hands: true,
    goal: 'Scales at contest speed — eight notes in four and a half seconds by the end.',
    guidance: [
      'Four rungs, ending well below what feels comfortable.',
      'Out of time is a miss. The tightest rung you stay accurate at is your real scale speed.',
      'The first note is timed apart from the rest, so a slow *start* shows as a slow start.',
    ],
    watchFor:
      'A long pause before the first note and then a fast scale. That is recall being slow, not playing.',
  },
};

/* ---------------- 8.3 · random chords ---------------- */

const CHORD_DRILLS: Readonly<Record<string, ChallengeConfig>> = {
  'major-triads': {
    ...base,
    id: 'major-triads',
    challenge: { kind: 'chord', roots: ALL_KEYS, qualities: ['major'], inversions: [0] },
    ladder: [5000, 3500, 2500],
    goal: 'Any major triad, called by name and played immediately.',
    guidance: [
      'All twelve roots. Root position, three notes, no thinking time.',
      'A♭ major is A♭–C–E♭ — the name it is called by is the name it is spelled with.',
      'Scores are per chord, so the four or five you rebuild each time get named.',
    ],
    watchFor:
      'Counting four semitones for the third. By level 8 the shape should arrive whole.',
  },
  'minor-triads': {
    ...base,
    id: 'minor-triads',
    challenge: { kind: 'chord', roots: ALL_KEYS, qualities: ['minor'], inversions: [0] },
    ladder: [5000, 3500, 2500],
    goal: 'Any minor triad, at the same speed as the majors.',
    guidance: [
      'The third drops a semitone; nothing else moves.',
      'F♯ minor is F♯–A–C♯. All twelve roots, root position.',
      'Compare your times against the major practice — they should match.',
    ],
    watchFor:
      'Playing the major and correcting. That is two chords in the time for one, and it never gets fast.',
  },
  'dim-triads': {
    ...base,
    id: 'dim-triads',
    challenge: { kind: 'chord', roots: ALL_KEYS, qualities: ['dim'], inversions: [0] },
    rounds: 16,
    ladder: [6000, 4500, 3500],
    goal: 'Diminished triads: three semitones, then three more.',
    guidance: [
      'Both the third and the fifth are lowered. G diminished is G–B♭–D♭.',
      'It is the only symmetrical triad — the two gaps are identical, which makes the shape easy to feel.',
      'Rarer than the other two, so a slower allowance and fewer rounds.',
    ],
    watchFor:
      'Flattening the third and forgetting the fifth. That leaves a minor triad, which is a different chord.',
  },
  'chord-to-notes': {
    ...base,
    id: 'chord-to-notes',
    challenge: { kind: 'chord', roots: ALL_KEYS, qualities: ['major', 'minor'], inversions: [0] },
    ladder: [5000, 3500, 2500],
    goal: 'A chord name in, three keys out — both qualities, all twelve roots.',
    guidance: [
      'Twenty-four chords in the pool and no warning which is coming.',
      'The quality is part of the question; reading it after starting is too late.',
      'Two and a half seconds by the end.',
    ],
    watchFor:
      'Reading the root, starting to play, and reading the quality afterwards. The third is the second key you press.',
  },
  'notes-to-chord': {
    ...base,
    id: 'notes-to-chord',
    challenge: { kind: 'name-chord', roots: ALL_KEYS, qualities: ['major', 'minor', 'dim'] },
    ladder: [5000, 4000, 3000],
    goal: 'The reverse: three keys light up and you name the chord.',
    guidance: [
      'The wrong answers are the same root with the other qualities, so only the third can decide it.',
      'Recognising a chord and building one are different skills, and this is the one that lags.',
      'All three qualities in the pool.',
    ],
    watchFor:
      'Naming the root correctly and the quality wrongly. They are one answer here, and the third is the whole of it.',
  },
  'random-chords': {
    ...base,
    id: 'random-chords',
    challenge: {
      kind: 'chord',
      roots: ALL_KEYS,
      qualities: ['major', 'minor', 'dim'],
      inversions: [0],
    },
    rounds: 24,
    ladder: [5000, 3500, 2500],
    goal: 'Thirty-six chords in the pool — every root, every quality.',
    guidance: [
      'Major, minor and diminished on all twelve roots.',
      'This is the bucket in one practice, and the panel names whichever handful you cannot yet reach.',
      'Twenty-four rounds, so the weak ones come round more than once.',
    ],
    watchFor:
      'Being reliable on major and minor and losing every diminished. It is a third of the pool.',
  },
  'chord-inversions': {
    ...base,
    id: 'chord-inversions',
    challenge: {
      kind: 'chord',
      roots: ALL_KEYS,
      qualities: ['major', 'minor'],
      inversions: [0, 1, 2],
    },
    rounds: 24,
    ladder: [6000, 4500, 3500],
    goal: 'Root position, first and second inversion — three shapes for every chord.',
    guidance: [
      'Seventy-two shapes in the pool. The name and the position both have to land.',
      'An inversion is the same notes starting somewhere else, and the lowest one names it.',
      'Scores are per chord *and* position, so a chord you know in root position and lose inverted gets named.',
    ],
    watchFor:
      'Playing root position when an inversion was asked for. The notes are right and the answer is not.',
  },
  'chord-speed': {
    ...base,
    id: 'chord-speed',
    challenge: {
      kind: 'chord',
      roots: ALL_KEYS,
      qualities: ['major', 'minor'],
      inversions: [0],
    },
    rounds: 25,
    ladder: [3500, 2500, 2000, 1500],
    goal: 'A chord and a half per second by the end — reflex, not recall.',
    guidance: [
      'Four rungs down to a second and a half for three keys.',
      'The first key is timed apart from the other two, so a slow start shows as one.',
      'Out of time is a miss.',
    ],
    watchFor:
      'A long pause and then a fast chord. The pause is the recall, and it is the part this level exists to remove.',
  },
};

/* ---------------- 8.4 · random progressions ---------------- */

/** The four progressions 8.4 names, and the pool the random ones draw from. */
const I_IV_V: readonly string[] = ['I', 'IV', 'V', 'I'];
const I_V_VI_IV: readonly string[] = ['I', 'V', 'vi', 'IV'];
const I_VI_IV_V: readonly string[] = ['I', 'vi', 'IV', 'V'];
const II_V_I: readonly string[] = ['ii', 'V', 'I'];
const SEQUENCES: readonly (readonly string[])[] = [I_IV_V, I_V_VI_IV, I_VI_IV_V, II_V_I];

/** 8.4.1 to 8.4.4 — one progression, drawn across keys. */
function progression(
  id: string,
  numerals: readonly string[],
  goal: string,
  watchFor: string,
): ChallengeConfig {
  return {
    ...base,
    id,
    challenge: { kind: 'progression', keys: SCALE_KEYS, sequences: [numerals] },
    rounds: 10,
    ladder: [16000, 13000, 10000],
    goal,
    guidance: [
      `${numerals.join(' → ')}, in a key drawn without warning.`,
      'The numerals stay and every chord changes with the key. Work them out from the key rather than from memory.',
      'Each chord is scored inside its key, so a progression you can play in C and not in A gets named as exactly that.',
    ],
    watchFor,
  };
}

const PROGRESSION_DRILLS: Readonly<Record<string, ChallengeConfig>> = {
  'prog-i-iv-v': progression(
    'prog-i-iv-v',
    I_IV_V,
    'I–IV–V–I in any key: away from home, into tension, and back.',
    'Learning it as C–F–G. Then it works in one key; as numerals it works in all twelve.',
  ),
  'prog-i-v-vi-iv': progression(
    'prog-i-v-vi-iv',
    I_V_VI_IV,
    'I–V–vi–IV, the four chords behind most modern songs, in any key.',
    'Freezing on the vi chord. It is the one most people have never worked out away from C.',
  ),
  'prog-i-vi-iv-v': progression(
    'prog-i-vi-iv-v',
    I_VI_IV_V,
    'I–vi–IV–V — home, its relative minor, away, tension.',
    'Blurring I into vi. They share two notes, and a change nobody hears has not happened.',
  ),
  'prog-ii-v-i': progression(
    'prog-ii-v-i',
    II_V_I,
    'ii–V–I: minor, dominant, home — the strongest way back there is.',
    'Playing a major chord on the second degree. It is minor in every major key, and this is where that matters most.',
  ),
  'prog-random-key': {
    ...base,
    id: 'prog-random-key',
    challenge: { kind: 'progression', keys: SCALE_KEYS, sequences: [I_V_VI_IV] },
    rounds: 12,
    ladder: [16000, 13000, 10000],
    goal: 'One progression, a new key every round — transposition at speed.',
    guidance: [
      'The numerals never change. Six keys, drawn without warning.',
      'In G that is G, D, Em, C. In A it is A, E, F♯m, D. Neither is a shape moved up the board.',
      'Scores are per key, so the ones you cannot yet transpose into get named.',
    ],
    watchFor:
      'Moving the same hand shape up the keyboard. That gives the right chords in some keys and wrong ones in the rest.',
  },
  'prog-random-sequence': {
    ...base,
    id: 'prog-random-sequence',
    challenge: { kind: 'progression', keys: SCALE_KEYS, sequences: SEQUENCES },
    rounds: 14,
    ladder: [16000, 13000, 10000],
    goal: 'Any of the four progressions, in any of six keys.',
    guidance: [
      'Twenty-four combinations and no warning which arrives.',
      'Read the numerals, resolve them in the key, and play — one step, not three.',
      'The bucket in one practice.',
    ],
    watchFor:
      'Recognising the progression and still having to work out the key. Those should resolve together by now.',
  },
  'prog-smooth': {
    ...base,
    id: 'prog-smooth',
    challenge: {
      kind: 'chord',
      roots: ['C', 'F', 'G', 'A', 'D', 'E'],
      qualities: ['major', 'minor'],
      inversions: [0, 1, 2],
    },
    rounds: 20,
    ladder: [6000, 4500, 3500],
    goal: 'Chords in every position, so the nearest one is always available.',
    guidance: [
      'A progression is only smooth if you can reach any position of the next chord.',
      'Root position, first and second inversion, drawn at random.',
      'This is the vocabulary a smooth transition needs; 7.4 taught the choosing.',
    ],
    watchFor:
      'Knowing every chord in root position and none of them inverted. That is what forces a hand to jump.',
  },
  'prog-rhythm': {
    ...base,
    id: 'prog-rhythm',
    challenge: { kind: 'progression', keys: SCALE_KEYS, sequences: SEQUENCES },
    rounds: 12,
    ladder: [12000, 9000, 7000],
    goal: 'The same progressions with the clock tight enough to force a steady pace.',
    guidance: [
      'A shorter allowance for the same twelve keys, so the chords have to arrive evenly.',
      'There is no time to stop between chords, which is the point.',
      'The first chord is timed apart from the rest — a slow start and a slow progression are different faults.',
    ],
    watchFor:
      'Rushing the first three chords to leave time for the fourth. Even is what a progression has to be.',
  },
};





/* ---------------- 8.6 · ear to keyboard ---------------- */

const EAR_NOTES: readonly string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const EAR_DRILLS: Readonly<Record<string, ChallengeConfig>> = {
  'ear-one-note': {
    ...base,
    id: 'ear-one-note',
    challenge: { kind: 'hear-note', notes: ['C', 'G'], octaves: [4], length: 1 },
    rounds: 20,
    ladder: [8000, 6000, 5000],
    goal: 'Two notes to begin with: hear one and put a finger on it.',
    guidance: [
      'C and G only. Two notes far enough apart that the ear has something to hold on to.',
      'Hear it, name it to yourself, then find it. The naming is the part that transfers.',
      'Eighteen right out of twenty before widening the pool.',
    ],
    watchFor:
      'Hunting on the keyboard until something matches. That is searching, not hearing, and it does not get faster.',
  },
  'ear-note-to-key': {
    ...base,
    id: 'ear-note-to-key',
    challenge: { kind: 'hear-note', notes: EAR_NOTES, octaves: [4], length: 1 },
    rounds: 20,
    ladder: [8000, 6000, 4000],
    goal: 'All seven white notes, heard and played back.',
    guidance: [
      'The pool widens from two notes to all seven of one octave.',
      'Sound, then note name, then keyboard location — three steps that should collapse into one.',
      'Scores are per note, so whichever one you keep missing gets named.',
    ],
    watchFor:
      'Being reliable on C and G and lost on the ones between. The neighbours are the hard part of pitch.',
  },
  'ear-two-notes': {
    ...base,
    id: 'ear-two-notes',
    challenge: { kind: 'hear-note', notes: EAR_NOTES, octaves: [4], length: 2 },
    rounds: 16,
    ladder: [10000, 8000, 6000],
    goal: 'Two notes in a row — the second heard against the first.',
    guidance: [
      'A pair sounds; play both back in order.',
      'The second note is heard as a distance from the first, which is easier than hearing it alone.',
      'Getting the first right and the second wrong is the common shape of the mistake.',
    ],
    watchFor:
      'Losing the second note while playing the first. Two notes have to be held in mind together.',
  },
  'ear-three-notes': {
    ...base,
    id: 'ear-three-notes',
    challenge: { kind: 'hear-note', notes: EAR_NOTES, octaves: [4], length: 3 },
    rounds: 14,
    ladder: [12000, 10000, 8000],
    goal: 'Three notes — the beginning of hearing a phrase rather than pitches.',
    guidance: [
      'Three in a row, played back in order.',
      'Three is where short-term musical memory starts being tested rather than pitch alone.',
      'If the third is always the one lost, the pattern is memory rather than hearing.',
    ],
    watchFor:
      'Playing the first two quickly to get to the third before it fades. Play them in time; the memory improves with use.',
  },
  'ear-major-minor': {
    ...base,
    id: 'ear-major-minor',
    challenge: { kind: 'hear-chord', roots: ALL_KEYS, qualities: ['major', 'minor'], nameOnly: true },
    rounds: 20,
    ladder: [5000, 4000, 3000],
    goal: 'Major or minor, by ear, on any root.',
    guidance: [
      'A chord sounds and you name its quality. Nothing is shown.',
      'Both qualities are drawn on the same roots, so pitch tells you nothing.',
      'Listen to the third, not the mood. Bright and dark stop working as the register changes.',
    ],
    watchFor:
      'Deciding by feeling. It works on the roots you know and fails on the rest.',
  },
  'ear-major-chords': {
    ...base,
    id: 'ear-major-chords',
    challenge: { kind: 'hear-chord', roots: ['C', 'F', 'G'], qualities: ['major'], nameOnly: false },
    rounds: 16,
    ladder: [8000, 6000, 5000],
    goal: 'Hear a major chord and play it back — three roots to begin with.',
    guidance: [
      'C, F and G. The chord sounds; play its three notes.',
      'Find the root first; the rest of the shape follows from it.',
      'Playing it back is harder than naming it, and it is the skill that matters.',
    ],
    watchFor:
      'Playing a major chord on the wrong root. Hearing the quality and hearing the root are separate jobs.',
  },
  'ear-minor-chords': {
    ...base,
    id: 'ear-minor-chords',
    challenge: { kind: 'hear-chord', roots: ['C', 'F', 'G'], qualities: ['minor'], nameOnly: false },
    rounds: 16,
    ladder: [8000, 6000, 5000],
    goal: 'The same three roots as minor chords, heard and played back.',
    guidance: [
      'Identical to the major practice with the third lowered.',
      'Compare your times: if minor is much slower, it is the third you are not hearing.',
      'Root first, then the quality, then the shape.',
    ],
    watchFor:
      'Playing the major and correcting. The correction takes longer than hearing it right would have.',
  },
  'ear-chord-to-key': {
    ...base,
    id: 'ear-chord-to-key',
    challenge: {
      kind: 'hear-chord',
      roots: ALL_KEYS,
      qualities: ['major', 'minor'],
      nameOnly: false,
    },
    rounds: 20,
    ladder: [8000, 6000, 5000],
    goal: 'Any chord, any root, heard and played back.',
    guidance: [
      'Twenty-four chords in the pool with no warning which is coming.',
      'The whole chain: sound, root, quality, keys.',
      'Scores are per chord, so the handful you cannot yet hear get named.',
    ],
    watchFor:
      'Reaching for C major whenever the sound is unfamiliar. A guess that scores occasionally teaches nothing.',
  },
  'ear-melody': {
    ...base,
    id: 'ear-melody',
    challenge: { kind: 'hear-note', notes: EAR_NOTES, octaves: [4], length: 4 },
    rounds: 12,
    ladder: [15000, 12000, 10000],
    goal: 'Four notes — a short melody heard once and played back.',
    guidance: [
      'The longest heard round in the level. Listen to the whole thing before starting.',
      'Play it back in time rather than hunting note by note; the shape holds it together.',
      'This is playing by ear, which is what the whole bucket was for.',
    ],
    watchFor:
      'Starting before the phrase has finished sounding. Hearing it whole is what makes it playable.',
  },
};

/* ---------------- 8.7 · rhythm to keyboard ---------------- */

const RHYTHM_DRILLS: Readonly<Record<string, ChallengeConfig>> = {
  'steady-beat': {
    ...base,
    id: 'steady-beat',
    challenge: { kind: 'rhythm', beats: [0], bars: 4, note: 'C' },
    rounds: 10,
    ladder: [0],
    goal: 'One strike a bar, four bars, dead on the beat.',
    guidance: [
      'The downbeat and nothing else. Start the click first.',
      'Four bars is long enough for drift to show and short enough to hold.',
      'Everything in this bucket is this with more notes added.',
    ],
    watchFor:
      'Drifting late across the four bars. A steady beat is not four correct strikes; it is four evenly spaced ones.',
  },
  'quarter-notes': {
    ...base,
    id: 'quarter-notes',
    challenge: { kind: 'rhythm', beats: [0, 1, 2, 3], bars: 4, note: 'C' },
    rounds: 10,
    ladder: [0],
    goal: 'Every beat struck — sixteen even notes.',
    guidance: [
      'One note per click, four bars.',
      'Even, and no accent on the downbeat unless you mean one.',
      'The on-the-beat figure is the measure; the note itself is never in doubt.',
    ],
    watchFor:
      'Hitting the first of each bar harder and letting the rest drift. Four identical strikes a bar.',
  },
  'eighth-notes': {
    ...base,
    id: 'eighth-notes',
    challenge: { kind: 'rhythm', beats: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], bars: 2, note: 'C' },
    rounds: 10,
    ladder: [0],
    goal: 'Two notes per beat — the off-beats have to be as even as the beats.',
    guidance: [
      'Count "1 and 2 and 3 and 4 and". The "and" is exactly halfway.',
      'Two bars rather than four, because sixteen eighths is already a lot of strikes.',
      'The off-beats are the ones that drift; the panel counts them the same as the rest.',
    ],
    watchFor:
      'Rushing the "and" so it sits closer to the next beat than the last. That is a swing, and it is not what is written.',
  },
  rests: {
    ...base,
    id: 'rests',
    challenge: { kind: 'rhythm', beats: [0, 2, 3], bars: 4, note: 'C' },
    rounds: 10,
    ladder: [0],
    goal: 'A rest is a beat you do not play — and it still has to be counted.',
    guidance: [
      'Strike on 1, 3 and 4. Beat 2 is silent and must still last exactly one beat.',
      'The strip shows the pattern: a dot is a rest.',
      'Rests are where beginners speed up, because nothing is happening to keep time with.',
    ],
    watchFor:
      'Coming in early after the rest. Silence takes exactly as long as sound does.',
  },
  'rhythm-imitation': {
    ...base,
    id: 'rhythm-imitation',
    challenge: { kind: 'rhythm', beats: [0, 1, 1.5, 2, 3.5], bars: 2, note: 'C' },
    rounds: 12,
    ladder: [0],
    goal: 'A mixed pattern with off-beats and rests together.',
    guidance: [
      'Beats 1, 2, the "and" of 2, 3, and the "and" of 4.',
      'Read the pattern from the strip before starting the click.',
      'This is what a real rhythm looks like: neither all on the beat nor all off it.',
    ],
    watchFor:
      'Smoothing the pattern into something even. The unevenness is the rhythm.',
  },
  'melody-rhythm': {
    ...base,
    id: 'melody-rhythm',
    challenge: { kind: 'rhythm', beats: [0, 1, 2, 2.5, 3], bars: 2, note: 'C' },
    rounds: 12,
    ladder: [0],
    goal: 'The rhythm of a melody, played on one note so only the timing is tested.',
    guidance: [
      'A melodic rhythm stripped of its pitches. Nothing to read, nothing to find.',
      'Once the rhythm is secure, adding notes to it is the easy half.',
      'This is how to learn a passage whose rhythm is the difficult part.',
    ],
    watchFor:
      'Treating this as easier because there is one note. Timing with nothing to hide behind is harder, not easier.',
  },
  'metronome-challenge': {
    ...base,
    id: 'metronome-challenge',
    challenge: { kind: 'rhythm', beats: [0, 0.5, 1, 2, 2.5, 3], bars: 2, note: 'C' },
    rounds: 12,
    ladder: [0],
    goal: 'A busier pattern held against the click for two bars at a time.',
    guidance: [
      'Six strikes a bar with off-beats in two places.',
      'Raise the tempo only when the on-the-beat figure stays high.',
      'The bias tells you which way you drift, which is more useful than the percentage.',
    ],
    watchFor:
      'Watching the percentage rather than the bias. Consistently early and consistently late need opposite corrections.',
  },
  'random-rhythm': {
    ...base,
    id: 'random-rhythm',
    challenge: { kind: 'rhythm', beats: [0, 1.5, 2, 3, 3.5], bars: 2, note: 'C' },
    rounds: 14,
    ladder: [0],
    goal: 'The bucket’s test: off-beats, rests and a full bar to hold together.',
    guidance: [
      'Strikes on 1, the "and" of 2, 3, 4 and the "and" of 4.',
      'Read it, count it, then play it. Do not start until the pattern is clear.',
      'Every strike is scored against the beat it was due on.',
    ],
    watchFor:
      'Playing the pattern you expected rather than the one shown. The strip is the instruction.',
  },
};

/* ---------------- 8.8 · performance ---------------- */

/** The closing piece: four bars of I–IV–V–I with a melody over it. */
const PIECE: readonly { numeral: string; melody: readonly number[] }[] = [
  { numeral: 'I', melody: [1, 2, 3, 2] },
  { numeral: 'IV', melody: [4, 3, 2, 1] },
  { numeral: 'V', melody: [5, 4, 3, 2] },
  { numeral: 'I', melody: [3, 2, 1, 1] },
];

/** One performance condition applied to the same piece. */
function performance(
  id: string,
  key: string,
  rounds: number,
  ladder: readonly number[],
  blind: boolean,
  goal: string,
  guidance: readonly string[],
  watchFor: string,
): ChallengeConfig {
  return {
    ...base,
    id,
    challenge: { kind: 'piece', key, bars: PIECE },
    rounds,
    ladder,
    blind,
    goal,
    guidance,
    watchFor,
  };
}

const PERFORMANCE_DRILLS: Readonly<Record<string, ChallengeConfig>> = {
  'piece-complete': performance(
    'piece-complete',
    'C',
    6,
    [40000, 32000, 26000],
    false,
    'The whole piece, start to finish, in your own time.',
    [
      'Four bars of I–IV–V–I with a melody over it: a chord on each downbeat and a note on every beat.',
      'A generous allowance. Getting all the way through is the only thing being asked.',
      'Every key is scored where it sits, so the bar that costs you gets named.',
    ],
    'Practising the opening over and over. The end of a piece gets the least practice and needs the most.',
  ),
  'piece-no-stopping': performance(
    'piece-no-stopping',
    'C',
    8,
    [30000, 26000, 22000],
    false,
    'Carry on through mistakes — the piece does not wait for you.',
    [
      'A wrong key is recorded and you keep going. Nothing pauses.',
      'Stopping to fix things is the habit that makes a piece unplayable in front of anyone.',
      'The score is how many keys landed right, not whether the run was tidy.',
    ],
    'Going back to correct yourself. The piece has already moved on and the correction costs the next note too.',
  ),
  'piece-metronome': performance(
    'piece-metronome',
    'C',
    8,
    [26000, 22000, 18000],
    false,
    'The piece at a steadier and steadier pace.',
    [
      'The allowance tightens, which forces an even tempo rather than a fast one.',
      'Each chord is due on its downbeat and each melody note on its beat.',
      'Timing stability is what an audience hears before anything else.',
    ],
    'Speeding through the easy bar and stalling at the change. The average looks fine and nothing was steady.',
  ),
  'piece-memory': performance(
    'piece-memory',
    'C',
    8,
    [32000, 28000, 24000],
    true,
    'From memory, with the keyboard covered.',
    [
      'The cover goes on as the round is dealt. Presses still land; you just cannot see where.',
      'The piece is short enough to hold in memory, which is why it is short.',
      'A wrong key tells you exactly how far off your hand was.',
    ],
    'Peeking at the strip for the next note. The strip is a record of what you played, not a score to read.',
  ),
  'piece-random-start': performance(
    'piece-random-start',
    'G',
    8,
    [32000, 28000, 24000],
    false,
    'The same piece in another key — the shape rather than the keys.',
    [
      'G major now. The numerals and the melody degrees are identical; every key changes.',
      'If you learnt the piece as a sequence of keys, this will be a different piece.',
      'If you learnt it as I–IV–V–I with a melody over it, it will not.',
    ],
    'Discovering the piece was memorised as finger positions. That is what this practice is for.',
  ),
  'piece-recovery': performance(
    'piece-recovery',
    'F',
    8,
    [30000, 26000, 22000],
    false,
    'A third key, and a tighter clock — recovering when it goes wrong.',
    [
      'F major, which has a flat in it and is the least familiar of the three.',
      'Mistakes will happen here. What is being practised is what you do next.',
      'The card records misses per round, so recovery shows as a clean second half.',
    ],
    'Letting one mistake become three. The recovery is a skill and it is trained by needing it.',
  ),
  'piece-full-speed': performance(
    'piece-full-speed',
    'C',
    10,
    [22000, 18000, 15000, 12000],
    false,
    'Four rungs down to twelve seconds for the whole piece.',
    [
      'The tightest the piece gets. Out of time counts as a miss.',
      'The rung you stay accurate at is your performance tempo; the one past it is noise.',
      'Reaction and run are timed apart, so a slow start shows as a slow start.',
    ],
    'Chasing the last rung. A clean run one rung down is worth more than a ragged one at the bottom.',
  ),
  'piece-one-take': performance(
    'piece-one-take',
    'C',
    3,
    [26000],
    false,
    'Three rounds only. Each one counts.',
    [
      'No warm-up and no second chance — three attempts and the card is the result.',
      'A short session on purpose: performing is not repeating.',
      'Read the card afterwards rather than during.',
    ],
    'Treating the first round as practice. In performance there is no first round.',
  ),
  'piece-pressure': performance(
    'piece-pressure',
    'G',
    5,
    [18000, 15000, 13000],
    true,
    'Covered keyboard, unfamiliar key, tight clock — everything at once.',
    [
      'G major, from memory, against the shortest allowance the piece has had.',
      'This is deliberately harder than the contest itself.',
      'If it falls apart here, the individual conditions are the ones to go back to.',
    ],
    'Judging yourself on this one. It is a stress test, not a measurement — the measurement is the next practice.',
  ),
  'piece-contest': performance(
    'piece-contest',
    'C',
    10,
    [24000, 20000, 16000],
    false,
    'The level’s finish: ten runs of the whole piece, recorded on one card.',
    [
      'Ten rounds, tightening as they go. Everything the curriculum built ends here.',
      'Run it daily and read the card — the rounds fail in different ways.',
      'Clean runs, total time, and where the time went. That is the whole report.',
    ],
    'Judging the day by the total. Two identical totals can hide a bad bar in one and a slow start in the other.',
  ),
};

export const CHALLENGE_DRILLS: Readonly<Record<string, ChallengeConfig>> = {
  ...NOTE_DRILLS,
  ...SCALE_DRILLS,
  ...CHORD_DRILLS,
  ...PROGRESSION_DRILLS,
  ...EAR_DRILLS,
  ...RHYTHM_DRILLS,
  ...PERFORMANCE_DRILLS,
};

export function getChallengeDrill(id: string): ChallengeConfig {
  const config = CHALLENGE_DRILLS[id];
  if (!config) throw new Error(`Unknown challenge drill: ${id}`);
  return config;
}

/**
 * The allowance for a round, stepping through the ladder as the session runs.
 *
 * An empty ladder means no clock at all, which is what the rhythm practices
 * want: they are judged against the metronome rather than against a stopwatch.
 */
export function allowanceAt(config: ChallengeConfig, round: number): number {
  if (config.ladder.length === 0 || config.ladder[0] === 0) return 0;
  const perRung = Math.max(1, Math.ceil(config.rounds / config.ladder.length));
  const rung = Math.min(config.ladder.length - 1, Math.floor(round / perRung));
  return config.ladder[rung] ?? 0;
}

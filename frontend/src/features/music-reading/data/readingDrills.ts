import type { Clef, Step } from '../reading.types';
import {
  ANCHOR,
  CLEFS,
  MNEMONICS,
  TOP_STEP,
  clefName,
  lineLetters,
  noteAt,
  spaceLetters,
  stepRange,
} from './staff';
import type { Accidental } from './accidentals';
import { ACCIDENTALS, GLYPH, SIGN_EFFECT, SIGN_NAME } from './accidentals';
import { KEY_SIGNATURES, signatureLine } from './keySignatures';

/**
 * 6.1 and 6.2 as data.
 *
 * The bucket's own progression is the argument for one engine: every practice
 * shows a note on a staff and asks something about it, and what changes is only
 * *what* — which line, which note, which key, which way it moved. 6.1 asks about
 * the position and 6.2 asks about the note, which is the same question with the
 * clef switched on.
 */
export type ReadTask =
  /** Which numbered line is this note on? */
  | 'line'
  /** Which numbered space? */
  | 'space'
  /** Line or space, and which — the two answered together. */
  | 'place'
  /** Of two notes, which sounds higher? */
  | 'higher'
  /** Which way does this short run move? */
  | 'direction'
  /** Which clef is this? */
  | 'clef'
  /** Which line does this clef name itself after? */
  | 'anchor'
  /** Name the note. */
  | 'name'
  /** Given a letter, put it where it belongs on the staff. */
  | 'place-note'
  /** Press the note on the keyboard. */
  | 'key'
  /** Which sign is beside this note? */
  | 'accidental'
  /** What does this sign do to the note? */
  | 'sign-effect'
  /** Press the key the sign asks for, not the one the position names. */
  | 'altered-key'
  /** Which key does this signature announce? */
  | 'signature'
  /** How many sharps or flats does it carry? */
  | 'signature-count'
  /** Is this note altered by the signature, or by a sign of its own? */
  | 'signature-vs-accidental'
  /** How far apart are these two notes? */
  | 'distance'
  /** Does the line step, skip, or repeat? */
  | 'motion'
  /** Which of the five shapes is this run? */
  | 'pattern';

export interface ReadingConfig {
  id: string;
  tasks: readonly ReadTask[];
  /** Clefs in play. Two means the clef itself becomes part of the question. */
  clefs: readonly Clef[];
  /** Steps a note may be drawn at. */
  steps: readonly Step[];
  /** Restrict draws to lines, to spaces, or leave both in. */
  only?: 'lines' | 'spaces';
  /** Print the letter under each note — support, so usually off. */
  showLabels: boolean;
  /** Number the lines and spaces down the edge. */
  showPlaces: boolean;
  /** Ring the line the clef is named for. */
  showAnchor: boolean;
  /** Per-answer allowance in ms. 0 turns the clock off. */
  allowanceMs: number;
  /** A mnemonic to offer, where the practice is built round one. */
  mnemonic?: string;
  /** Signs that may be attached to a drawn note. */
  signs?: readonly Accidental[];
  /** Keys whose signature may be drawn. */
  keys?: readonly string[];
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

/** The staff itself, with a little room past it for ledger notes. */
const ON_STAFF: readonly Step[] = stepRange(0, TOP_STEP);
const WITH_LEDGERS: readonly Step[] = stepRange(-2, TOP_STEP + 2);

const base = {
  clefs: ['treble'] as readonly Clef[],
  steps: ON_STAFF,
  showLabels: false,
  showPlaces: false,
  showAnchor: false,
  allowanceMs: 0,
} as const;

/* ---------------- 6.1 · the staff as a map ---------------- */

const STAFF_DRILLS: Readonly<Record<string, ReadingConfig>> = {
  'staff-map': {
    ...base,
    id: 'staff-map',
    tasks: ['place'],
    showPlaces: true,
    goal: 'Five lines and four spaces, counted from the bottom — and named without counting.',
    guidance: [
      'A note appears. Say whether it is on a line or in a space, and which one.',
      'The numbers are down the left edge to begin with. Turn them off once they stop being needed.',
      'No note names yet. This is the vertical geography and nothing else.',
    ],
    watchFor:
      'Counting up from line 1 every time. That is the habit this bucket exists to replace, and it gets slower as the music gets faster.',
  },
  lines: {
    ...base,
    id: 'lines',
    tasks: ['line'],
    only: 'lines',
    allowanceMs: 3000,
    goal: 'Line 1 to line 5, recognised on sight rather than counted.',
    guidance: [
      'Only line notes are drawn. Which line is it?',
      'Three seconds. Counting from the bottom does not fit inside that, which is the point.',
      'Line 3 in the middle is the easiest anchor; the two either side of it come next.',
    ],
    watchFor:
      'Being fast on lines 1 and 5 and slow on 2 and 4. The outer ones are landmarks; the inner ones have to be learnt.',
  },
  spaces: {
    ...base,
    id: 'spaces',
    tasks: ['space'],
    only: 'spaces',
    allowanceMs: 3000,
    goal: 'Space 1 to space 4, on sight.',
    guidance: [
      'Only space notes are drawn. Which space is it?',
      'Four spaces rather than five lines, so this should settle sooner.',
      'A space is named for the number of lines below it, not the line it touches.',
    ],
    watchFor:
      'Reading a space as the line above it. Half a step of misreading is a whole note wrong.',
  },
  notes: {
    ...base,
    id: 'notes',
    tasks: ['higher'],
    steps: WITH_LEDGERS,
    goal: 'Two notes: which one sounds higher. Position on the page is pitch.',
    guidance: [
      'Two noteheads appear. Say which is higher — no names needed.',
      'Higher on the staff is higher in pitch, and further right on the keyboard.',
      'This is the connection between paper geography and keyboard geography, and everything later rests on it.',
    ],
    watchFor:
      'Reading left-to-right as high-to-low. Horizontal is time; only vertical is pitch.',
  },
  direction: {
    ...base,
    id: 'direction',
    tasks: ['direction'],
    steps: WITH_LEDGERS,
    allowanceMs: 3000,
    goal: 'A short run: is it rising, falling, or staying put?',
    guidance: [
      'Three or four notes at a time. Name the shape, not the notes.',
      'Reading contour is how sight-reading actually works — you follow the line and check the notes.',
      'Rising, falling, or the same. Mixed shapes count as whichever way the line ends up going.',
    ],
    watchFor:
      'Naming every note before answering. The whole value of contour is that it is faster than reading.',
  },
  clefs: {
    ...base,
    id: 'clefs',
    tasks: ['clef', 'anchor'],
    clefs: CLEFS,
    showAnchor: true,
    goal: 'A clef decodes the staff — and the same position means different notes under each one.',
    guidance: [
      'Which clef is this, and which line is it named after?',
      'The treble clef curls around line 2, which is therefore G. The bass clef straddles line 4, which is F.',
      'A clef is a pointer, not a decoration. Reading it first is the habit to build.',
    ],
    watchFor:
      'Reading the notes before the clef. Every note on the page changes meaning depending on which one is there.',
  },
  'treble-map': {
    ...base,
    id: 'treble-map',
    tasks: ['name'],
    clefs: ['treble'],
    showAnchor: true,
    goal: `The treble map: lines ${lineLetters('treble')}, spaces ${spaceLetters('treble')}.`,
    guidance: [
      'Name the note. Lines and spaces both, in the clef most right-hand music is written in.',
      `The mnemonics are ${MNEMONICS.treble.lines} and ${MNEMONICS.treble.spaces} — useful now, to be outgrown.`,
      'The G line is ringed as an anchor. Count from it rather than from the bottom.',
    ],
    watchFor:
      'Reciting the whole mnemonic to reach line 4. Counting five words is not faster than counting five lines.',
  },
  'bass-map': {
    ...base,
    id: 'bass-map',
    tasks: ['name'],
    clefs: ['bass'],
    showAnchor: true,
    goal: `The bass map: lines ${lineLetters('bass')}, spaces ${spaceLetters('bass')}.`,
    guidance: [
      'The same question in the other clef, where most left-hand music lives.',
      `${MNEMONICS.bass.lines} and ${MNEMONICS.bass.spaces}.`,
      'Every position means a different note here than it did in treble. That is the clef doing its job.',
    ],
    watchFor:
      'Reading bass notes as treble ones. It is the single most common reading mistake, and it is worth two lines of error.',
  },
  'staff-keyboard': {
    ...base,
    id: 'staff-keyboard',
    tasks: ['key'],
    clefs: CLEFS,
    steps: WITH_LEDGERS,
    goal: 'The whole chain: see the note, know the note, find the key, play it.',
    guidance: [
      'A note appears in either clef. Press it on the keyboard.',
      'This is the exercise the whole bucket exists for — reading that does not reach the keys is not reading.',
      'Both clefs are drawn, so the clef has to be read before the note.',
    ],
    watchFor:
      'Naming the note out loud and then hunting for it. The name is a step on the way, not the destination.',
  },
};

/* ---------------- 6.2 and 6.3 · one clef at a time ---------------- */

/**
 * A clef's ten practices, generated from the clef.
 *
 * 6.2 and 6.3 are the same ten sessions pointed at treble and bass: recognise
 * the clef, read its lines, read its spaces, place them back, find middle C,
 * reach the keyboard, and read runs both ways. The references differ only in
 * which letters they print and which mnemonic they use, and both of those come
 * from the clef — so nothing here is written twice. What a clef cannot tell us
 * is what makes *it* awkward, and that is the only argument each entry takes.
 */
interface ClefNotes {
  /** What the clef is for, in one line. */
  role: string;
  /** The mistake this clef in particular invites. */
  watchFor: string;
  /** What the comparison with the other clef keeps catching out. */
  crossWatch: string;
}

const CLEF_NOTES: Readonly<Record<Clef, ClefNotes>> = {
  treble: {
    role: 'where most right-hand music is written',
    watchFor:
      'Reciting the whole mnemonic to reach line 4. Counting five words is not faster than counting five lines.',
    crossWatch:
      'Reading a bass note as a treble one. It is the single most common reading mistake, and it is worth two lines of error.',
  },
  bass: {
    role: 'where most left-hand music lives',
    watchFor:
      'Reading it as treble moved down. Every position means a different note here, and guessing by shape lands a third away.',
    crossWatch:
      'Coming to bass straight from treble practice and carrying the letters over. The staff looks identical; nothing on it means the same thing.',
  },
};

function clefSet(clef: Clef): readonly ReadingConfig[] {
  const notes = CLEF_NOTES[clef];
  const name = clefName(clef);
  const anchor = ANCHOR[clef];
  const mnemonics = MNEMONICS[clef];
  const short = clef === 'treble' ? 'treble' : 'bass';

  return [
    {
      ...base,
      id: `${short}-clef`,
      tasks: ['anchor', 'clef'],
      clefs: CLEFS,
      showAnchor: true,
      allowanceMs: 3000,
      goal: `The ${name} clef names ${anchor.letter} on line ${anchor.step / 2 + 1}, and everything else follows.`,
      guidance: [
        'Which line does this clef name? Treble says G on line 2; bass says F on line 4.',
        'Knowing the anchor means never counting the whole staff — you count from the named line.',
        'The clef comes first on every line of music ever written. Read it first too.',
      ],
      watchFor:
        'Treating the clef as scenery. It is the only thing on the page that says what the lines mean.',
    },
    {
      ...base,
      id: `${short}-lines`,
      tasks: ['name'],
      clefs: [clef],
      only: 'lines',
      allowanceMs: 3000,
      mnemonic: mnemonics.lines,
      goal: `The five ${name} lines: ${lineLetters(clef)}.`,
      guidance: [
        'Line notes only, named on sight.',
        `${mnemonics.lines} spells them, bottom to top.`,
        'Three seconds each. Reciting a five-word sentence does not fit, which is deliberate.',
      ],
      watchFor: notes.watchFor,
    },
    {
      ...base,
      id: `${short}-spaces`,
      tasks: ['name'],
      clefs: [clef],
      only: 'spaces',
      allowanceMs: 3000,
      mnemonic: mnemonics.spaces,
      goal: `The four ${name} spaces: ${spaceLetters(clef)}.`,
      guidance: [
        'Space notes only. Four of them rather than five lines, so this should settle sooner.',
        `${mnemonics.spaces}, bottom to top.`,
        'Once these are automatic, half of every line you read is already free.',
      ],
      watchFor:
        'Spelling the mnemonic downwards. It reads bottom to top, the same direction pitch rises in.',
    },
    {
      ...base,
      id: `${short}-place-spaces`,
      tasks: ['place-note'],
      clefs: [clef],
      only: 'spaces',
      mnemonic: mnemonics.spaces,
      allowanceMs: 4000,
      goal: `${mnemonics.spaces} backwards: given the letter, put it where it belongs.`,
      guidance: [
        'A letter is named. Click the space it lives in.',
        'Reading the staff and writing to it are different skills, and the second one lags badly.',
        'If you can place a letter as fast as you can name a space, the pattern is really yours.',
      ],
      watchFor:
        'Being able to read the mnemonic but not place it. That gap is the difference between recognising a word and being able to spell it.',
    },
    {
      ...base,
      id: `${short}-place-lines`,
      tasks: ['place-note'],
      clefs: [clef],
      only: 'lines',
      mnemonic: mnemonics.lines,
      allowanceMs: 4000,
      goal: `${mnemonics.lines} backwards: given the letter, find its line.`,
      guidance: [
        'A letter is named. Click the line it belongs on.',
        `${mnemonics.lines} — but the aim is to stop needing the sentence.`,
        'Five lines rather than four spaces, so expect this to take longer than the spaces did.',
      ],
      watchFor:
        'Counting words up from the first one. That is the mnemonic being used as a ladder, and it is exactly what to grow out of.',
    },
    {
      ...base,
      id: `${short}-middle-c`,
      tasks: ['name', 'key'],
      clefs: CLEFS,
      steps: clef === 'treble' ? stepRange(-2, 2) : stepRange(TOP_STEP - 2, TOP_STEP + 2),
      goal: 'Middle C: one ledger below the treble staff, one above the bass staff, and the same key either way.',
      guidance: [
        'Notes around the bottom of the treble staff and the top of the bass one.',
        'Middle C is where the two clefs meet — the same note written two ways.',
        'Its ledger line is the landmark. Everything near the middle of the keyboard is counted from it.',
      ],
      watchFor:
        'Reading a ledger note as the nearest staff note. A ledger line is a real line and the note on it is two steps from the staff, not one.',
    },
    {
      ...base,
      id: `${short}-keyboard`,
      tasks: ['key'],
      clefs: [clef],
      steps: WITH_LEDGERS,
      allowanceMs: 4000,
      goal: `${name.charAt(0).toUpperCase()}${name.slice(1)} note in, key out — with a clock running.`,
      guidance: [
        'Press the note you see. No naming step required; the name is just how you got there.',
        'Four seconds, tightening as it gets easy.',
        'The panel scores each note separately, so the two or three you always hesitate on get named.',
      ],
      watchFor:
        'Finding the note by counting up from a landmark. It works, it is slow, and it fails as soon as the note is far from one.',
    },
    {
      ...base,
      id: `${short}-random`,
      tasks: ['name', 'key'],
      clefs: [clef],
      steps: WITH_LEDGERS,
      allowanceMs: 3000,
      goal: `Any ${name} note, named or played, in three seconds.`,
      guidance: [
        'Mixed: sometimes name it, sometimes play it. No order to lean on.',
        'Ledger notes are in the pool, because real music does not stop at the fifth line.',
        'The two tasks are scored apart, so if naming is fine and playing is not, the panel says so.',
      ],
      watchFor: notes.crossWatch,
    },
  ];
}

/* ---------------- 6.7 · notation to the keyboard ---------------- */

const KEYBOARD_DRILLS: Readonly<Record<string, ReadingConfig>> = {
  'note-to-key': {
    ...base,
    id: 'note-to-key',
    tasks: ['key'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    allowanceMs: 4000,
    goal: 'See the note, find the key, play it — the chain the whole level exists for.',
    guidance: [
      'Staff notes only to begin with, in both clefs.',
      'No naming step is required. The letter is how you got there, not the destination.',
      'Four seconds, and the panel scores each note where it sits.',
    ],
    watchFor:
      'Counting up from a landmark every time. It gives the right key and it is the habit that caps your reading speed.',
  },
  'treble-to-key': {
    ...base,
    id: 'treble-to-key',
    tasks: ['key'],
    clefs: ['treble'],
    steps: stepRange(-2, TOP_STEP + 2),
    allowanceMs: 3000,
    goal: 'Treble notes to keys, ledgers included, in three seconds.',
    guidance: [
      'One clef, so nothing is being tested except the reading.',
      'Ledger notes are in the pool — real music does not stop at the fifth line.',
      'Anchor on the G line and count from there rather than from the bottom.',
    ],
    watchFor:
      'Being quick inside the staff and slow past it. The ledger notes are the ones worth drilling on their own.',
  },
  'bass-to-key': {
    ...base,
    id: 'bass-to-key',
    tasks: ['key'],
    clefs: ['bass'],
    steps: stepRange(-2, TOP_STEP + 2),
    allowanceMs: 3000,
    goal: 'Bass notes to keys — the half most readers are slower at.',
    guidance: [
      'Identical to the treble practice with the clef changed. Compare your times.',
      'Bass notation is where your left hand actually lives; C2 to C4 is most of it.',
      'Anchor on the F line the way you anchor on G in treble.',
    ],
    watchFor:
      '"I can read treble but bass takes forever." That gap is normal, measurable, and the reason this practice exists.',
  },
  'accidental-to-key': {
    ...base,
    id: 'accidental-to-key',
    tasks: ['altered-key'],
    clefs: CLEFS,
    steps: stepRange(-2, TOP_STEP + 2),
    signs: ACCIDENTALS,
    allowanceMs: 3000,
    goal: 'A sign and a note straight to the key, either clef, in three seconds.',
    guidance: [
      'Read the position first, then apply the sign. The other order means holding a sign in mind while reading.',
      'All three signs, and naturals ask for the plain key.',
      'This is 6.5 at reading speed rather than at learning speed.',
    ],
    watchFor:
      'Slowing down for every accidental. The sign is one semitone of arithmetic; the reading should take the time.',
  },
  'note-distance': {
    ...base,
    id: 'note-distance',
    tasks: ['distance'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    allowanceMs: 4000,
    goal: 'Two notes: how far apart are they, counted as an interval rather than in lines.',
    guidance: [
      'Both notes are shown. Say the distance — a second, a third, a fourth, a fifth.',
      'Count the positions inclusively: C to E is C, D, E, which is a third.',
      'Distance is what lets you read the second note without reading it — it follows from the first.',
    ],
    watchFor:
      'Counting the gap rather than the notes. C to E is a third, not a two; intervals include both ends.',
  },
  'stepwise-motion': {
    ...base,
    id: 'stepwise-motion',
    tasks: ['motion', 'distance'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    allowanceMs: 3000,
    goal: 'Line to space to line: a step is the smallest move there is, and it looks like one.',
    guidance: [
      'Say whether the two notes step, skip, or repeat.',
      'A step goes line to space or space to line — adjacent positions, always.',
      'Most melodies are mostly steps, which is why reading them as steps is so much faster.',
    ],
    watchFor:
      'Reading both notes to work out that they are neighbours. Adjacent positions are a shape you can see without naming either one.',
  },
  skips: {
    ...base,
    id: 'skips',
    tasks: ['motion', 'distance'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    allowanceMs: 3000,
    goal: 'A skip stays on lines or stays on spaces — which is what makes it visible at a glance.',
    guidance: [
      'Line to line, or space to space: that is a skip, and it is always a third.',
      'The two notes look alike on the page — both sitting on lines, or both in spaces.',
      'Steps and skips together account for nearly all of what a melody does.',
    ],
    watchFor:
      'Confusing a skip with a step when the notes are close together. The test is whether both sit on lines, not how near they look.',
  },
  'repeated-notes': {
    ...base,
    id: 'repeated-notes',
    tasks: ['motion'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    allowanceMs: 2000,
    goal: 'The same position twice — no reading required the second time.',
    guidance: [
      'Two notes at the same height mean the same key, played again.',
      'This is the cheapest thing on the page and the easiest to over-read.',
      'Two seconds, because there is genuinely nothing to work out.',
    ],
    watchFor:
      'Re-reading a repeated note as though it might have changed. If it has not moved, it is the same key.',
  },
  'random-notes': {
    ...base,
    id: 'random-notes',
    tasks: ['key', 'distance', 'motion'],
    clefs: CLEFS,
    steps: stepRange(-2, TOP_STEP + 2),
    allowanceMs: 3000,
    goal: 'Every question of the bucket mixed together, both clefs, with ledgers in.',
    guidance: [
      'Play the note, name the distance, or say how the line moved.',
      'The bucket’s test. Three seconds each, and the tasks are scored apart.',
      'If playing is fine and distance is not, reading single notes is ahead of reading pairs.',
    ],
    watchFor:
      'Being reliable one note at a time and lost between two. Reading is about the relationship as much as the note.',
  },
};

/* ---------------- 6.10 · fluency, the reading half ---------------- */

const FLUENCY_READING: Readonly<Record<string, ReadingConfig>> = {
  'speed-notes': {
    ...base,
    id: 'speed-notes',
    tasks: ['key', 'name'],
    clefs: CLEFS,
    steps: stepRange(-2, TOP_STEP + 2),
    allowanceMs: 2000,
    goal: 'Note to key in two seconds — recognition rather than calculation.',
    guidance: [
      'Both clefs, ledgers included, and two seconds an answer.',
      'Two seconds is deliberately not enough to count lines. It is enough to recognise.',
      'If the allowance is impossible, loosen it, get accurate, and tighten it again.',
    ],
    watchFor:
      'Counting from a landmark. It is the difference between note → key and note → count → calculate → key, and only the first one gets fast.',
  },
  'pattern-recognition': {
    ...base,
    id: 'pattern-recognition',
    tasks: ['pattern'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    allowanceMs: 3000,
    goal: 'Five shapes a line can make — read as a shape rather than as five notes.',
    guidance: [
      'Ascending, descending, repeated, a wave, or broken. Name the shape without naming a note.',
      'This is what lets you read a bar ahead of your hands.',
      'The shape is the first thing to see and the last thing beginners look for.',
    ],
    watchFor:
      'Reading the notes and then deducing the shape. The shape is visible before any note is identified — that is the whole saving.',
  },
  'interval-recognition': {
    ...base,
    id: 'interval-recognition',
    tasks: ['distance'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    allowanceMs: 2000,
    goal: 'Seconds, thirds, fourths and fifths, on sight.',
    guidance: [
      'Two notes. How far apart, counted inclusively.',
      'A third looks like line-to-line or space-to-space; a second looks like line-to-space. They are shapes.',
      'Reading the interval means the second note follows from the first without being read.',
    ],
    watchFor:
      'Counting positions one at a time. C to E is a third because of how it looks, not because you counted three.',
  },
  'direction-recognition': {
    ...base,
    id: 'direction-recognition',
    tasks: ['direction', 'motion'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    allowanceMs: 2000,
    goal: 'Which way, and by how much — the two things you can see before reading anything.',
    guidance: [
      'Rising, falling or staying; stepping, skipping or repeating.',
      'Both questions are answerable from the shape alone.',
      'Two seconds. Neither requires identifying a single note.',
    ],
    watchFor:
      'Naming notes to answer a question about direction. Nothing here needs a letter.',
  },
};

/* ---------------- 6.4 · ledger lines ---------------- */

/**
 * A ledger practice, generated from the side of the staff it works.
 *
 * All five of 6.4's positional sessions are the same exercise pointed above or
 * below one clef or the other. What differs is the range of steps and the
 * landmark note the reference names, and both come from the clef.
 */
function ledgerSet(clef: Clef, above: boolean): ReadingConfig {
  const name = clefName(clef);
  const side = above ? 'above' : 'below';
  const steps = above ? stepRange(TOP_STEP + 1, TOP_STEP + 6) : stepRange(-6, -1);
  const first = noteAt(clef, above ? TOP_STEP + 2 : -2);
  const edge = noteAt(clef, above ? TOP_STEP : 0);

  return {
    ...base,
    id: `ledger-${side}-${clef}`,
    tasks: ['name', 'key'],
    clefs: [clef],
    steps,
    allowanceMs: 4000,
    goal: `Notes ${side} the ${name} staff — carrying on past ${edge.name} in the same alternating pattern.`,
    guidance: [
      `${edge.name} is the ${above ? 'top' : 'bottom'} line. The next space is ${noteAt(clef, above ? TOP_STEP + 1 : -1).name}, and the first ledger line is ${first.name}.`,
      'Nothing new is happening: line, space, line, space, exactly as inside the staff.',
      'Count from the edge of the staff, not from the middle. Two positions out is as far as most music goes.',
    ],
    watchFor:
      `Memorising "the first ledger ${side} is ${first.name}" and stopping there. The pattern keeps going, and the second and third are where it is actually tested.`,
  };
}

const LEDGER_DRILLS: Readonly<Record<string, ReadingConfig>> = {
  'ledger-concept': {
    ...base,
    id: 'ledger-concept',
    tasks: ['place', 'higher'],
    clefs: CLEFS,
    steps: stepRange(-4, TOP_STEP + 4),
    showPlaces: true,
    goal: 'A ledger line is the staff continuing — the same alternation of line and space, drawn only where a note needs it.',
    guidance: [
      'Notes appear inside the staff and past it. Say whether each is on a line or in a space.',
      'A ledger is not a new kind of thing. It is line six, or line zero, drawn just for that note.',
      'Higher on the page is still higher in pitch, past the staff exactly as within it.',
    ],
    watchFor:
      'Treating the top and bottom lines as the edge of what can be written. They are the edge of what is *drawn*, and the map carries on either way.',
  },
  'ledger-middle-c': {
    ...base,
    id: 'ledger-middle-c',
    tasks: ['name', 'key', 'clef'],
    clefs: CLEFS,
    steps: stepRange(-2, 1),
    goal: 'The most important ledger line there is: middle C, below the treble staff and above the bass one.',
    guidance: [
      'The same key written two ways, one ledger line from each staff.',
      'It is the join between the clefs and the landmark the middle of the keyboard is counted from.',
      'The clef is asked about too, because the same drawn position means different notes under each.',
    ],
    watchFor:
      'Reading middle C as the note just below the staff. That note is D — middle C is a whole step further, on its own line.',
  },
  'ledger-random': {
    ...base,
    id: 'ledger-random',
    tasks: ['name', 'key'],
    clefs: CLEFS,
    steps: [...stepRange(-6, -1), ...stepRange(TOP_STEP + 1, TOP_STEP + 6)],
    allowanceMs: 4000,
    goal: 'Ledger notes only, either clef, either side — nothing inside the staff to lean on.',
    guidance: [
      'Every note drawn here is past the staff. The comfortable ones are excluded on purpose.',
      'Read the clef, find the nearest staff edge, and count out from it.',
      'Four seconds. The panel scores each note separately, so the far ones get named.',
    ],
    watchFor:
      'Being fine one position out and lost at three. The far ledgers are rare in music and are exactly what stops a reader when they appear.',
  },
};

/* ---------------- 6.5 · accidentals ---------------- */

/** 6.5.1 to 6.5.3 — one sign, what it looks like and what it does. */
function signSession(sign: Accidental): ReadingConfig {
  return {
    ...base,
    id: `sign-${sign}`,
    tasks: ['accidental', 'sign-effect'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    signs: [sign, ...ACCIDENTALS.filter((entry) => entry !== sign)],
    goal: `The ${SIGN_NAME[sign]} sign: it ${SIGN_EFFECT[sign]}.`,
    guidance: [
      `${GLYPH[sign]} is drawn immediately before the notehead, at the same height.`,
      `It ${SIGN_EFFECT[sign]} — the note does not move on the page, only the key you press changes.`,
      'The other two signs appear too, so recognising this one has to mean something.',
    ],
    watchFor:
      sign === 'natural'
        ? 'Expecting a natural to do something on its own. It undoes an alteration; with nothing to undo it means "play the plain note".'
        : `Confusing ${GLYPH[sign]} with the other sign at a glance. They are drawn quite differently and they move the note in opposite directions.`,
  };
}

const ACCIDENTAL_DRILLS: Readonly<Record<string, ReadingConfig>> = {
  'sharp-notes': {
    ...base,
    id: 'sharp-notes',
    tasks: ['altered-key'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    signs: ['sharp'],
    allowanceMs: 4000,
    goal: 'Sharps on the staff: play the key one semitone above the note written.',
    guidance: [
      'A sharpened note appears. Press the key it asks for, not the one the position names.',
      'F♯ is the black key immediately right of F. E♯ is the white key F — a sharp means "one semitone up", not "the black key".',
      'That last point is the one this practice exists for.',
    ],
    watchFor:
      'Reaching for a black key automatically. E♯ and B♯ are white keys, and they are the two that catch everybody.',
  },
  'flat-notes': {
    ...base,
    id: 'flat-notes',
    tasks: ['altered-key'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    signs: ['flat'],
    allowanceMs: 4000,
    goal: 'Flats on the staff: play the key one semitone below the note written.',
    guidance: [
      'A flattened note appears. One semitone down from the written position.',
      'B♭ is the black key left of B. C♭ is the white key B, and F♭ is E.',
      'Same rule as sharps, in the other direction — the colour of the key is never part of it.',
    ],
    watchFor:
      'Flattening to the note below rather than the key below. A flat moves one semitone, which is sometimes a white key and sometimes not.',
  },
  'accidental-staff': {
    ...base,
    id: 'accidental-staff',
    tasks: ['accidental', 'name'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    signs: ACCIDENTALS,
    allowanceMs: 3000,
    goal: 'Read the sign and the note together — which sign it is, and which note it is beside.',
    guidance: [
      'Both questions about the same drawn note: the sign, and the position it belongs to.',
      'The sign never changes which line or space the note sits on. It is not part of the position.',
      'Naming the note means the letter it is written on, before the sign is applied.',
    ],
    watchFor:
      'Letting the sign shift where you think the note sits. A sharpened F is still on the F line — that is the whole reason accidentals work.',
  },
  'accidental-keyboard': {
    ...base,
    id: 'accidental-keyboard',
    tasks: ['altered-key'],
    clefs: CLEFS,
    steps: stepRange(-2, TOP_STEP + 2),
    signs: ACCIDENTALS,
    allowanceMs: 3000,
    goal: 'Sign and note straight to the key, in three seconds, either clef.',
    guidance: [
      'All three signs, both clefs, and ledger notes in the pool.',
      'Position first, then the sign. Doing it the other way round means holding a sign in mind while you read.',
      'Naturals appear too, and they ask for the plain key.',
    ],
    watchFor:
      'Slowing down for every accidental. The sign is one semitone of arithmetic; the reading is the part that should take the time.',
  },
  'random-accidentals': {
    ...base,
    id: 'random-accidentals',
    tasks: ['accidental', 'altered-key', 'sign-effect'],
    clefs: CLEFS,
    steps: stepRange(-2, TOP_STEP + 2),
    signs: ACCIDENTALS,
    allowanceMs: 3000,
    goal: 'Every accidental question mixed together, with no warning which is coming.',
    guidance: [
      'Name the sign, say what it does, or play the key it asks for.',
      'The bucket’s test. Three seconds each, and the tasks are scored apart.',
      'If naming the sign is fine and playing it is not, the reading is fine and the arithmetic is not.',
    ],
    watchFor:
      'Being reliable on sharps and slow on flats. They are equally common in real music and the panel will tell you which is which.',
  },
};

/* ---------------- 6.6 · key signatures ---------------- */

/** 6.6.3 to 6.6.6 — one key, its signature and what it implies. */
function keySession(key: string): ReadingConfig {
  const signature = KEY_SIGNATURES.find((entry) => entry.key === key);
  const line = signatureLine(key);

  return {
    ...base,
    id: `key-${key.toLowerCase()}`,
    tasks: ['signature-count', 'altered-key'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    keys: [key],
    signs: [],
    allowanceMs: 4000,
    goal: `${key} major: ${line}.`,
    guidance: [
      `The signature is drawn once, after the clef, and holds for every note on the line.`,
      signature && signature.count > 0
        ? `Every ${signature.names.map((entry) => entry[0]).join(' and ')} on the staff is played ${signature.kind === 'sharp' ? 'sharp' : 'flat'}, in any octave, with no sign beside it.`
        : 'Nothing is altered. C major is the key you check the others against.',
      'How many, then which key: those are the two things a signature tells you at a glance.',
    ],
    watchFor:
      signature && signature.count > 0
        ? `Applying the signature only to the octave it is written in. It applies to every ${signature.names[0]?.[0]} on the page.`
        : 'Assuming an empty signature means no accidentals will appear. It means none are *implied*; individual signs can still be written.',
  };
}

const KEY_DRILLS: Readonly<Record<string, ReadingConfig>> = {
  'signature-concept': {
    ...base,
    id: 'signature-concept',
    tasks: ['signature-count', 'signature'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    keys: KEY_SIGNATURES.map((entry) => entry.key),
    signs: [],
    goal: 'A key signature is written once and applies to the whole line — the shortcut that saves writing a sign on every note.',
    guidance: [
      'The accidentals sit between the clef and the music. Count them, then name the key.',
      'They are always written in the same order and always in the same places, which is what makes them recognisable at a glance.',
      'Sharps and flats are never mixed in one signature.',
    ],
    watchFor:
      'Reading the signature note by note. It is a shape to recognise, not a list to work through.',
  },
  'signature-vs-accidental': {
    ...base,
    id: 'signature-vs-accidental',
    tasks: ['signature-vs-accidental'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    keys: ['G', 'D', 'F', 'Bb'],
    signs: ['sharp', 'flat', 'natural'],
    allowanceMs: 4000,
    goal: 'A note can be altered by the signature or by a sign of its own. Which is doing it?',
    guidance: [
      'A signature is in force and a note appears. Is it altered because of the key, because of its own sign, or not at all?',
      'A sign beside a note overrides the signature for that note — including a natural, which cancels it.',
      'This is the distinction the whole bucket turns on, and it is the one that gets skipped.',
    ],
    watchFor:
      'Ignoring the signature once a sign appears somewhere in the bar. A written sign changes one note; the signature is still in force for the rest.',
  },
  'signature-patterns': {
    ...base,
    id: 'signature-patterns',
    tasks: ['signature'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    keys: KEY_SIGNATURES.map((entry) => entry.key),
    signs: [],
    allowanceMs: 3000,
    goal: 'Signature to key, on sight — the shape of it rather than a count.',
    guidance: [
      'One sharp is G. Two sharps is D. One flat is F. Two flats is B♭.',
      'The last sharp is one semitone below the key; the second-to-last flat *is* the key.',
      'Three seconds. Counting the accidentals and then working it out does not fit.',
    ],
    watchFor:
      'Counting every time. The shape a signature makes on the staff is as recognisable as a word, and that is how to read it.',
  },
  'signature-scale': {
    ...base,
    id: 'signature-scale',
    tasks: ['altered-key', 'signature'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    keys: ['G', 'D', 'F', 'Bb'],
    signs: [],
    allowanceMs: 4000,
    goal: 'A signature tells you which notes are altered — so play them altered, with nothing beside them to remind you.',
    guidance: [
      'A key signature is in force. Play the note shown, applying the signature yourself.',
      'No sign appears beside the note. Remembering the key is the whole task.',
      'Both clefs, because the signature applies to both staves of a piece.',
    ],
    watchFor:
      'Playing the plain note because nothing was drawn beside it. That is exactly what a signature is for, and exactly how it catches people.',
  },
  'signature-random': {
    ...base,
    id: 'signature-random',
    tasks: ['signature', 'signature-count', 'altered-key'],
    clefs: CLEFS,
    steps: stepRange(0, TOP_STEP),
    keys: KEY_SIGNATURES.map((entry) => entry.key),
    signs: [],
    allowanceMs: 3000,
    goal: 'Any signature, any question about it, in three seconds.',
    guidance: [
      'Name the key, count the accidentals, or play a note the signature alters.',
      'The bucket’s test, and the last thing before reading real music.',
      'Tasks are scored apart, so a key you can name but cannot play is named as exactly that.',
    ],
    watchFor:
      'Naming keys well and playing them badly. Recognising a signature is worth nothing until it changes what your hands do.',
  },
};

const CLEF_DRILLS: Readonly<Record<string, ReadingConfig>> = Object.fromEntries(
  CLEFS.flatMap((clef) => clefSet(clef).map((config) => [config.id, config] as const)),
);

const LEDGER_SIDES: Readonly<Record<string, ReadingConfig>> = Object.fromEntries(
  CLEFS.flatMap((clef) =>
    [true, false].map((above) => {
      const config = ledgerSet(clef, above);
      return [config.id, config] as const;
    }),
  ),
);

export const READING_DRILLS: Readonly<Record<string, ReadingConfig>> = {
  ...STAFF_DRILLS,
  ...CLEF_DRILLS,
  ...KEYBOARD_DRILLS,
  ...FLUENCY_READING,
  ...LEDGER_DRILLS,
  ...LEDGER_SIDES,
  ...Object.fromEntries(ACCIDENTALS.map((sign) => [`sign-${sign}`, signSession(sign)])),
  ...ACCIDENTAL_DRILLS,
  ...KEY_DRILLS,
  ...Object.fromEntries(
    ['C', 'G', 'D', 'F'].map((key) => [`key-${key.toLowerCase()}`, keySession(key)]),
  ),
};

export function getReadingDrill(id: string): ReadingConfig {
  const config = READING_DRILLS[id];
  if (!config) throw new Error(`Unknown reading drill: ${id}`);
  return config;
}

/** The steps a config may actually draw, once lines-or-spaces is applied. */
export function drawableSteps(config: ReadingConfig): readonly Step[] {
  if (!config.only) return config.steps;
  const wantLine = config.only === 'lines';
  return config.steps.filter((step) => (((step % 2) + 2) % 2 === 0) === wantLine);
}

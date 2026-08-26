import {
  SHARP_NAMES,
  buildChordFrom,
  buildScaleFrom,
  diatonicChords,
  parseNote,
  romanNumeral,
  toMidi,
} from '@/features/music-theory';
import type { Challenge, PieceBar, Quality, Round } from '../performance.types';

/**
 * Level 8's rounds, dealt from a challenge.
 *
 * This level asks nothing new — it asks everything earlier again, at random and
 * against a clock. So nothing here re-derives any theory: scales, chords and
 * diatonic families all come from the shared service that levels 4 to 7 were
 * built on, and what lives here is only the turning of a drawn item into a
 * prompt, a list of keys and a place in the ledger.
 */

/** Where the challenges sit on the board. */
const BASE_OCTAVE = 4;

export const WHITE_NOTES: readonly string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const BLACK_NOTES: readonly string[] = ['C#', 'Eb', 'F#', 'Ab', 'Bb'];
export const ALL_NOTES: readonly string[] = [...WHITE_NOTES, ...BLACK_NOTES];

/** The keys level 8 recalls scales and progressions in. */
export const SCALE_KEYS: readonly string[] = ['C', 'G', 'D', 'F', 'A', 'E'];
export const ALL_KEYS: readonly string[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

/** The chord-type id each quality maps to in the shared service. */
const TYPE_ID: Readonly<Record<Quality, string>> = {
  major: 'major',
  minor: 'minor',
  dim: 'dim',
};

/** How a quality is said. */
export const QUALITY_NAME: Readonly<Record<Quality, string>> = {
  major: 'major',
  minor: 'minor',
  dim: 'diminished',
};

/** The chord symbol a root and quality make. */
export function symbolOf(root: string, quality: Quality): string {
  return `${root}${quality === 'minor' ? 'm' : quality === 'dim' ? 'dim' : ''}`;
}

/** A midi as a letter and octave. */
export function nameOf(midi: number): string {
  const pitch = ((midi % 12) + 12) % 12;
  return `${SHARP_NAMES[pitch]}${Math.floor(midi / 12) - 1}`;
}

/**
 * Keys and the names they are called by.
 *
 * The two travel together because a chord's keys are unambiguous and its
 * *spelling* is not: A♭ major is played G♯–C–D♯ and written Ab–C–Eb, and a
 * level about recall must show the name it asked for. Every builder here
 * returns the spelling the theory produced rather than a sharp-name lookup.
 */
export interface KeyLine {
  midis: readonly number[];
  names: readonly string[];
}

const EMPTY: KeyLine = { midis: [], names: [] };

/** Stacks pitch classes upward from an octave, keeping their spellings. */
function stack(
  pitches: readonly number[],
  names: readonly string[],
  octave: number,
): KeyLine {
  const midis: number[] = [];
  let floor = toMidi((pitches[0] ?? 0) as never, octave) - 1;
  for (const pitch of pitches) {
    let midi = toMidi(pitch as never, octave);
    while (midi <= floor) midi += 12;
    midis.push(midi);
    floor = midi;
  }
  return { midis, names: [...names] };
}

/** The keys of a chord, voiced upward from an octave, in a given position. */
export function chordKeys(root: string, quality: Quality, inversion: number, octave: number): KeyLine {
  const chord = buildChordFrom(root, TYPE_ID[quality]);
  if (!chord) return EMPTY;
  const pitches = chord.pitchClasses;
  const spelled = chord.notes.map((note) => note.name);
  // Rotate first: an inversion is the same notes starting somewhere else.
  const at = ((inversion % pitches.length) + pitches.length) % pitches.length;
  return stack(
    [...pitches.slice(at), ...pitches.slice(0, at)],
    [...spelled.slice(at), ...spelled.slice(0, at)],
    octave,
  );
}

/** The keys of a scale, one octave, in the direction asked for. */
export function scaleKeys(key: string, direction: 'up' | 'down' | 'both', octave: number): KeyLine {
  const scale = buildScaleFrom(key, 'major');
  if (!scale) return EMPTY;

  const rising = stack(
    scale.notes.map((note) => note.pitchClass),
    scale.notes.map((note) => note.name),
    octave,
  );
  // The octave above closes the scale, with the root's own name.
  const up = {
    midis: [...rising.midis, (rising.midis[0] ?? 0) + 12],
    names: [...rising.names, rising.names[0] ?? ''],
  };

  if (direction === 'up') return up;
  const down = { midis: [...up.midis].reverse(), names: [...up.names].reverse() };
  if (direction === 'down') return down;
  return {
    midis: [...up.midis, ...down.midis.slice(1)],
    names: [...up.names, ...down.names.slice(1)],
  };
}

/** The chords a roman numeral sequence names in a key, one after another. */
export function progressionKeys(key: string, numerals: readonly string[], octave: number): KeyLine {
  const scale = buildScaleFrom(key, 'major');
  if (!scale) return EMPTY;
  const family = diatonicChords(scale, 'triads');

  const midis: number[] = [];
  const names: string[] = [];
  for (const numeral of numerals) {
    const at = family.findIndex((chord, degree) => romanNumeral(degree, chord) === numeral);
    const chord = at === -1 ? undefined : family[at];
    if (!chord) continue;
    const line = stack(chord.pitchClasses, chord.notes.map((note) => note.name), octave);
    midis.push(...line.midis);
    names.push(...line.names);
  }
  return { midis, names };
}

/** How many keys the first chord of a progression asks for. */
function firstChordSize(key: string, numerals: readonly string[]): number {
  const first = numerals[0];
  if (!first) return 1;
  return progressionKeys(key, [first], BASE_OCTAVE).midis.length;
}

/** Picks from a list without repeating what was drawn last. */
function draw<T>(items: readonly T[], last: T | undefined): T | undefined {
  const options = items.filter((entry) => entry !== last);
  const from = options.length > 0 ? options : items;
  return from[Math.floor(Math.random() * from.length)];
}

/**
 * Deals one round.
 *
 * `firstItem` is the number of keys belonging to the first thing asked for,
 * which is what lets the engine time the *reaction* apart from the *run*.
 * Knowing a scale and starting it quickly are different skills, and a level
 * about recall at speed has to be able to tell them apart.
 */
export function dealRound(challenge: Challenge, lastPrompt?: string): Round | null {
  if (challenge.kind === 'note' || challenge.kind === 'name-note') {
    const name = draw(challenge.notes, undefined) ?? 'C';
    const octave = draw(challenge.octaves, undefined) ?? BASE_OCTAVE;
    const note = parseNote(name);
    if (!note) return null;
    const midi = toMidi(note.pitchClass, octave);

    if (challenge.kind === 'note') {
      return {
        prompt: challenge.octaves.length > 1 ? `${name}${octave}` : name,
        scoreKey: name,
        keys: [midi],
        labels: [name],
        choices: [],
        answer: '',
        firstItem: 1,
      };
    }

    // Naming rounds light a key and ask what it is — or which octave it was in.
    return {
      prompt: challenge.askOctave ? 'Which octave is this?' : 'Which note is this?',
      scoreKey: challenge.askOctave ? `octave ${octave}` : name,
      keys: [midi],
      labels: [name],
      choices: challenge.askOctave
        ? challenge.octaves.map((entry) => ({
            value: `o${entry}`,
            label: String(entry),
            sub: `${nameOf(toMidi(0, entry))} upward`,
          }))
        : challenge.notes.map((entry) => ({ value: entry, label: entry, sub: 'note' })),
      answer: challenge.askOctave ? `o${octave}` : name,
      firstItem: 1,
    };
  }

  if (challenge.kind === 'scale') {
    const key = draw(challenge.keys, lastPrompt?.split(' ')[0]) ?? 'C';
    const line = scaleKeys(key, challenge.direction, BASE_OCTAVE);
    if (line.midis.length === 0) return null;
    const way =
      challenge.direction === 'up' ? 'up' : challenge.direction === 'down' ? 'down' : 'up and back';
    return {
      prompt: `${key} major — ${way}`,
      scoreKey: `${key} major`,
      keys: line.midis,
      labels: line.names,
      choices: [],
      answer: '',
      firstItem: 1,
    };
  }

  if (challenge.kind === 'chord' || challenge.kind === 'name-chord') {
    const root = draw(challenge.roots, undefined) ?? 'C';
    const quality = draw(challenge.qualities, undefined) ?? 'major';
    const symbol = symbolOf(root, quality);

    if (challenge.kind === 'name-chord') {
      const line = chordKeys(root, quality, 0, BASE_OCTAVE);
      if (line.midis.length === 0) return null;
      // Wrong answers that are genuinely confusable: the same root, other
      // qualities, and one other root's chord.
      const others = challenge.qualities
        .filter((entry) => entry !== quality)
        .map((entry) => symbolOf(root, entry));
      const stranger = symbolOf(draw(challenge.roots.filter((entry) => entry !== root), undefined) ?? 'G', quality);
      const options = [...new Set([symbol, ...others, stranger])];
      return {
        prompt: 'Which chord is this?',
        scoreKey: `${symbol} named`,
        keys: line.midis,
        labels: line.names,
        choices: options
          .sort((a, b) => a.localeCompare(b))
          .map((entry) => ({ value: entry, label: entry, sub: 'chord' })),
        answer: symbol,
        firstItem: line.midis.length,
      };
    }

    const inversion = draw(challenge.inversions, undefined) ?? 0;
    const line = chordKeys(root, quality, inversion, BASE_OCTAVE);
    if (line.midis.length === 0) return null;
    const position = inversion === 0 ? '' : ` · ${inversion === 1 ? '1st' : '2nd'} inversion`;
    return {
      prompt: `${symbol}${position}`,
      scoreKey: challenge.inversions.length > 1 ? `${symbol} ${inversion === 0 ? 'root' : `inv ${inversion}`}` : symbol,
      keys: line.midis,
      labels: line.names,
      choices: [],
      answer: '',
      firstItem: line.midis.length,
    };
  }

  if (challenge.kind === 'hear-note') {
    // A heard round sounds its keys and shows nothing; the prompt is the sound.
    const midis: number[] = [];
    const names: string[] = [];
    for (let index = 0; index < challenge.length; index += 1) {
      const name = draw(challenge.notes, names[index - 1]) ?? 'C';
      const octave = draw(challenge.octaves, undefined) ?? BASE_OCTAVE;
      const note = parseNote(name);
      if (!note) return null;
      midis.push(toMidi(note.pitchClass, octave));
      names.push(name);
    }
    return {
      prompt: challenge.length === 1 ? 'Play what you heard' : `Play the ${challenge.length} notes you heard`,
      scoreKey: challenge.length === 1 ? `${names[0]} by ear` : `${challenge.length} notes by ear`,
      keys: midis,
      labels: names,
      choices: [],
      answer: '',
      firstItem: 1,
      heard: true,
    };
  }

  if (challenge.kind === 'hear-chord') {
    const root = draw(challenge.roots, undefined) ?? 'C';
    const quality = draw(challenge.qualities, undefined) ?? 'major';
    const line = chordKeys(root, quality, 0, BASE_OCTAVE);
    if (line.midis.length === 0) return null;

    if (challenge.nameOnly) {
      return {
        prompt: 'What quality was that?',
        scoreKey: `${QUALITY_NAME[quality]} by ear`,
        keys: line.midis,
        labels: line.names,
        choices: challenge.qualities.map((entry) => ({
          value: entry,
          label: QUALITY_NAME[entry],
          sub: entry === 'major' ? 'a major third' : entry === 'minor' ? 'a minor third' : 'both lowered',
        })),
        answer: quality,
        firstItem: line.midis.length,
        heard: true,
      };
    }
    return {
      prompt: 'Play the chord you heard',
      scoreKey: `${symbolOf(root, quality)} by ear`,
      keys: line.midis,
      labels: line.names,
      choices: [],
      answer: '',
      firstItem: line.midis.length,
      heard: true,
    };
  }

  if (challenge.kind === 'rhythm') {
    const note = parseNote(challenge.note);
    if (!note) return null;
    const midi = toMidi(note.pitchClass, BASE_OCTAVE);
    const dueAt = rhythmBeats(challenge.beats, challenge.bars);
    return {
      prompt: `${rhythmLine(challenge.beats)} · ${challenge.bars} bar${challenge.bars === 1 ? '' : 's'}`,
      scoreKey: `${rhythmLine(challenge.beats)}`,
      keys: dueAt.map(() => midi),
      labels: dueAt.map(() => challenge.note),
      choices: [],
      answer: '',
      firstItem: 1,
      dueAt,
    };
  }

  if (challenge.kind === 'piece') {
    const line = pieceLine(challenge.key, challenge.bars, BASE_OCTAVE);
    if (line.midis.length === 0) return null;
    return {
      prompt: `${challenge.key} major — ${challenge.bars.map((bar) => bar.numeral).join(' → ')}`,
      scoreKey: `${challenge.key} piece`,
      keys: line.midis,
      labels: line.names,
      choices: [],
      answer: '',
      firstItem: line.dueAt.filter((beat) => beat === 0).length,
      dueAt: line.dueAt,
    };
  }

  const key = draw(challenge.keys, undefined) ?? 'C';
  const numerals = draw(challenge.sequences, undefined) ?? ['I', 'IV', 'V', 'I'];
  const line = progressionKeys(key, numerals, BASE_OCTAVE);
  if (line.midis.length === 0) return null;
  return {
    prompt: `${key} major — ${numerals.join(' → ')}`,
    scoreKey: `${numerals.join('-')} in ${key}`,
    keys: line.midis,
    labels: line.names,
    choices: [],
    answer: '',
    firstItem: firstChordSize(key, numerals),
  };
}


/* ---------------- 8.6, 8.7 and 8.8 ---------------- */

/** The scale degrees of a key as absolute keys, for a melody line. */
export function scaleDegreeKeys(key: string, octave: number): KeyLine {
  const scale = buildScaleFrom(key, 'major');
  if (!scale) return EMPTY;
  return stack(
    scale.notes.map((note) => note.pitchClass),
    scale.notes.map((note) => note.name),
    octave,
  );
}

/**
 * A rhythm as a list of beats to strike.
 *
 * Rests are not stored: a rest is a beat that is not struck, and modelling it
 * as an absence rather than an object is what keeps the engine from having to
 * ask "is this one a real note".
 */
export function rhythmBeats(beats: readonly number[], bars: number): readonly number[] {
  return Array.from({ length: bars }, (_entry, bar) => beats.map((beat) => bar * 4 + beat)).flat();
}

/**
 * How a rhythm reads in a prompt.
 *
 * Counted the way the reference counts it: "1 · 3 ·" in quarters, and
 * "1 & 2 & 3 & 4 &" once anything falls off the beat. A pattern with eighths in
 * it drawn on a quarter grid would be indistinguishable from a pattern without,
 * which is exactly the distinction 8.7.3 is about.
 */
export function rhythmLine(beats: readonly number[]): string {
  const hasOffbeats = beats.some((beat) => beat % 1 !== 0);
  if (!hasOffbeats) {
    return [0, 1, 2, 3].map((beat) => (beats.includes(beat) ? String(beat + 1) : '·')).join(' ');
  }
  return [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]
    .map((beat) => {
      if (!beats.includes(beat)) return '·';
      return beat % 1 === 0 ? String(beat + 1) : '&';
    })
    .join(' ');
}

/**
 * The closing piece, laid out as keys and the beats they fall on.
 *
 * Both hands, bar by bar: the chord underneath on beat one and a melody note on
 * every beat. It is deliberately short — the point of 8.8 is playing something
 * all the way through under pressure, not learning a long piece.
 */
export function pieceLine(key: string, bars: readonly PieceBar[], octave: number): {
  midis: readonly number[];
  names: readonly string[];
  dueAt: readonly number[];
} {
  const melodyKeys = scaleDegreeKeys(key, octave + 1);
  const midis: number[] = [];
  const names: string[] = [];
  const dueAt: number[] = [];

  bars.forEach((bar, index) => {
    const start = index * 4;
    const chord = progressionKeys(key, [bar.numeral], octave);
    chord.midis.forEach((midi, at) => {
      midis.push(midi);
      names.push(chord.names[at] ?? nameOf(midi));
      dueAt.push(start);
    });
    bar.melody.forEach((degree, beat) => {
      const step = ((degree - 1) % melodyKeys.midis.length + melodyKeys.midis.length) %
        melodyKeys.midis.length;
      midis.push(melodyKeys.midis[step] ?? 0);
      names.push(melodyKeys.names[step] ?? '');
      dueAt.push(start + beat);
    });
  });

  return { midis, names, dueAt };
}

import type { PitchClass, SpelledNote } from '@/features/music-theory';

/**
 * The two qualities level 5 starts with.
 *
 * Kept as its own type because 5.1 to 5.4 are genuinely about one difference —
 * the third — and a config that offered sevenths there would blur it. The wider
 * set below is what 5.5 opens up to.
 */
export type TriadQuality = 'major' | 'minor';

/**
 * Every chord quality level 5 covers.
 *
 * The two triads, the diminished one the seventh degree of a major scale
 * produces, and the three sevenths.
 */
export type ChordQuality = TriadQuality | 'dim' | 'maj7' | 'dom7' | 'min7';

/**
 * Which note of the chord is at the bottom.
 *
 * 0 is root position. A triad has three positions and a seventh chord four, so
 * the type allows 3 and the chord decides whether it is reachable.
 */
export type Inversion = 0 | 1 | 2 | 3;

/** A chord, with the facts the drills ask about pulled to the front. */
export interface ChordForm {
  id: string;
  root: string;
  quality: ChordQuality;
  /** "C", "Cm", "Cmaj7" — how the chord is written. */
  symbol: string;
  /** "C major", "C minor 7" — how the chord is said. */
  label: string;
  notes: readonly SpelledNote[];
  pitchClasses: readonly PitchClass[];
  /** The degrees as the formula writes them: 1 · ♭3 · 5 · ♭7. */
  degrees: readonly string[];
  /** How many notes: three for a triad, four for a seventh. */
  tones: number;
}

/** A chord in one particular position, ready to be played. */
export interface Voicing {
  form: ChordForm;
  inversion: Inversion;
  /** Rising midis, lowest first — the shape the hand actually makes. */
  midis: readonly number[];
  /** The notes in the order this position sounds them. */
  notes: readonly SpelledNote[];
  /** The degrees in that order: "3 - 5 - 1" for a first inversion. */
  degrees: readonly string[];
}

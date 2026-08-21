import type { PitchClass } from '@/features/music-theory';

export interface PianoKey {
  /** MIDI number — the key's true identity. C4 = 60. */
  midi: number;
  pitchClass: PitchClass;
  /** Scientific octave, so middle C is C4. */
  octave: number;
  isBlack: boolean;
  /** Sharp spelling, e.g. "C#". */
  sharpName: string;
  /** Flat spelling, e.g. "Db". Equals sharpName for white keys. */
  flatName: string;
  /**
   * Horizontal position measured in white-key widths.
   * White keys sit at whole numbers; black keys sit on the boundary between
   * two whites, which is what produces the 2–3 grouping visually.
   */
  offset: number;
  /** Index among white keys only; -1 for black keys. */
  whiteIndex: number;
}

export interface KeyboardLayout {
  id: string;
  name: string;
  startMidi: number;
  keyCount: number;
  keys: readonly PianoKey[];
  whiteKeyCount: number;
}

export type KeyHighlight = 'none' | 'current' | 'previous' | 'next';

/** The three colours the legend can switch on and off. */
export type HighlightChannel = Exclude<KeyHighlight, 'none'>;

/**
 * Highlight lookup. Pitch-class entries light a note in every octave; MIDI
 * entries light one exact key and take precedence over them.
 */
export interface HighlightMap {
  byPitchClass: ReadonlyMap<PitchClass, KeyHighlight>;
  byMidi: ReadonlyMap<number, KeyHighlight>;
}

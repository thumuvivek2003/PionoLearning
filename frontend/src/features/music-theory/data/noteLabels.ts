import { FLAT_NAMES, SHARP_NAMES, isBlackPitchClass } from './noteNames';
import type { PitchClass } from '../types/music.types';

/**
 * How a key is written down.
 *
 * A black key has two names and is one key, so naming is a presentation choice
 * rather than a fact about the note — which is why it lives here beside the
 * names themselves rather than inside any one drill. Both the geography work and
 * the technique work ask the same question of it.
 */
export type NoteNaming = 'sharp' | 'flat' | 'both';

export interface NoteLabel {
  /** What the button or prompt reads, e.g. "C#". */
  label: string;
  /** The same key's other name, when both are being taught. */
  sub?: string;
}

export function noteLabel(pitchClass: PitchClass, naming: NoteNaming): NoteLabel {
  const sharp = SHARP_NAMES[pitchClass] as string;
  const flat = FLAT_NAMES[pitchClass] as string;

  if (!isBlackPitchClass(pitchClass)) return { label: sharp };
  if (naming === 'sharp') return { label: sharp };
  if (naming === 'flat') return { label: flat };
  return { label: sharp, sub: flat };
}

/** Both names when they differ, e.g. "C#/Db" — how a score is keyed. */
export function noteKey(pitchClass: PitchClass, naming: NoteNaming): string {
  const { label, sub } = noteLabel(pitchClass, naming);
  return sub ? `${label}/${sub}` : label;
}

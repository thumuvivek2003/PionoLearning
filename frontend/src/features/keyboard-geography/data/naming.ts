import { FLAT_NAMES, SHARP_NAMES, isBlackPitchClass } from '@/features/music-theory';
import type { PitchClass } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';

/**
 * Which keys a drill deals in, and what it calls them.
 *
 * Bucket 1.5 is the same recognition task under different vocabularies — white
 * keys, black keys, sharps, flats, everything — so the vocabulary is data. The
 * *answer* is always the key itself (a pitch class): C# and Db are one key with
 * two names, and a drill that treated them as two answers would be teaching
 * something untrue.
 */
export type KeyScope = 'white' | 'black' | 'all';

export type NoteNaming = 'sharp' | 'flat' | 'both';

export interface NoteLabel {
  /** What the button or prompt reads, e.g. "C#". */
  label: string;
  /** The same key's other name, when both are being taught. */
  sub?: string;
}

/** How one key is written under a given naming. */
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

export function inScope(key: PianoKey, scope: KeyScope): boolean {
  if (scope === 'all') return true;
  return scope === 'black' ? key.isBlack : !key.isBlack;
}

/** Keys of the board a scope covers. */
export function scopeKeys(layout: KeyboardLayout, scope: KeyScope): readonly PianoKey[] {
  return layout.keys.filter((key) => inScope(key, scope));
}

/** The distinct notes a scope covers, low to high within one octave. */
export function scopePitchClasses(layout: KeyboardLayout, scope: KeyScope): readonly PitchClass[] {
  return [...new Set(scopeKeys(layout, scope).map((key) => key.pitchClass))].sort((a, b) => a - b);
}

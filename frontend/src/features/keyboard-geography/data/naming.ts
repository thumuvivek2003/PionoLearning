import type { PitchClass } from '@/features/music-theory';
import type { KeyboardLayout, PianoKey } from '@/features/piano';

/**
 * Which keys a drill deals in.
 *
 * Bucket 1.5 is the same recognition task over different parts of the board, so
 * the scope is data. What those keys are *called* is a shared fact rather than a
 * geography one, and lives in music-theory: C# and Db are one key with two
 * names, and a drill that treated them as two answers would teach something
 * untrue.
 */
export type KeyScope = 'white' | 'black' | 'all';

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

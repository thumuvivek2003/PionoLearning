import type { Clef, Step } from '../reading.types';
import type { Accidental } from './accidentals';
import { noteAt } from './staff';

/**
 * Key signatures, and where their accidentals are written.
 *
 * The order sharps and flats accumulate is a fact level 4 already derived; what
 * is new here is *where on the staff* each one is drawn. Those positions are a
 * notational convention rather than a consequence of anything — a signature's
 * F♯ goes on the top line of the treble staff because that is where it has
 * always gone — so they are written down, and the checks confirm each position
 * really lands on the letter it claims to alter.
 */

/** Where each sharp of a signature is written, in the order they are added. */
const SHARP_STEPS: Readonly<Record<Clef, readonly Step[]>> = {
  // F5 C5 G5 D5 A4 E5 B4 — top line first, then alternating down and up.
  treble: [8, 5, 9, 6, 3, 7, 4],
  // The same shape a third lower: F3 C3 G3 D3 A2 E3 B2.
  bass: [6, 3, 7, 4, 1, 5, 2],
};

/** And each flat: B4 E5 A4 D5 G4 C5 F4 in treble. */
const FLAT_STEPS: Readonly<Record<Clef, readonly Step[]>> = {
  treble: [4, 7, 3, 6, 2, 5, 1],
  bass: [2, 5, 1, 4, 0, 3, -1],
};

/** A key, and the signature that announces it. */
export interface KeySignature {
  key: string;
  /** How many accidentals, and of which kind. */
  count: number;
  kind: Accidental | null;
  /** The notes altered, in order: F#, C#, … */
  names: readonly string[];
}

/**
 * The keys 6.6 teaches, with the accidentals each carries.
 *
 * Kept to the four the bucket names plus the two that complete the first steps
 * either way, so a signature drill has something to confuse them with.
 */
export const KEY_SIGNATURES: readonly KeySignature[] = [
  { key: 'C', count: 0, kind: null, names: [] },
  { key: 'G', count: 1, kind: 'sharp', names: ['F#'] },
  { key: 'D', count: 2, kind: 'sharp', names: ['F#', 'C#'] },
  { key: 'A', count: 3, kind: 'sharp', names: ['F#', 'C#', 'G#'] },
  { key: 'F', count: 1, kind: 'flat', names: ['Bb'] },
  { key: 'Bb', count: 2, kind: 'flat', names: ['Bb', 'Eb'] },
];

export function signatureOf(key: string): KeySignature | undefined {
  return KEY_SIGNATURES.find((entry) => entry.key === key);
}

/** The staff positions a key's signature is drawn at, in order. */
export function signatureSteps(key: string, clef: Clef): readonly Step[] {
  const signature = signatureOf(key);
  if (!signature || signature.kind === null) return [];
  const steps = signature.kind === 'sharp' ? SHARP_STEPS[clef] : FLAT_STEPS[clef];
  return steps.slice(0, signature.count);
}

/** The letters those positions land on — which must be the altered ones. */
export function signatureLetters(key: string, clef: Clef): readonly string[] {
  return signatureSteps(key, clef).map((step) => noteAt(clef, step).letter);
}

/** Whether a letter is altered by a key's signature. */
export function altersLetter(key: string, letter: string): boolean {
  return signatureOf(key)?.names.some((name) => name[0] === letter) ?? false;
}

/** "one sharp — F#", or "no sharps or flats". */
export function signatureLine(key: string): string {
  const signature = signatureOf(key);
  if (!signature) return '';
  if (signature.count === 0) return 'no sharps or flats';
  const word = signature.kind === 'sharp' ? 'sharp' : 'flat';
  return `${signature.count} ${word}${signature.count === 1 ? '' : 's'} — ${signature.names.join(', ')}`;
}

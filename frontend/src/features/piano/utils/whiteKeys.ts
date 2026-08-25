import type { KeyboardLayout, PianoKey } from '../types/piano.types';

/**
 * The white keys as a ruler.
 *
 * Almost every "how far" question on a keyboard is asked in white keys rather
 * than semitones — a 3rd is two white keys along whether or not black keys sit
 * between them — so the white keys are worth having as an ordered list you can
 * step through. It lives with the board rather than with any one drill, because
 * both the geography and the technique work measure against it.
 */
export function whiteKeys(layout: KeyboardLayout): readonly PianoKey[] {
  return layout.keys.filter((key) => !key.isBlack);
}

/** Position of a key on that ruler, or -1 when it is a black key. */
export function whiteIndexOf(layout: KeyboardLayout, midi: number): number {
  return whiteKeys(layout).findIndex((key) => key.midi === midi);
}

/** The key `steps` white keys from `from`, or undefined off either end. */
export function whiteStep(
  layout: KeyboardLayout,
  from: PianoKey,
  steps: number,
): PianoKey | undefined {
  const whites = whiteKeys(layout);
  const index = whites.findIndex((key) => key.midi === from.midi);
  return index < 0 ? undefined : whites[index + steps];
}

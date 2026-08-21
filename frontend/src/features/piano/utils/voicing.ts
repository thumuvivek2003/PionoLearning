import { SEMITONES_PER_OCTAVE } from '@/features/music-theory';
import type { PitchClass } from '@/features/music-theory';

/** Middle C. Chords are voiced from here so their shape lands in one place. */
export const VOICING_ANCHOR_MIDI = 60;

/**
 * Stack pitch classes into one rising, playable position.
 *
 * Lighting every octave of a four-note chord would set fire to most of the
 * board; a single voicing shows the *shape* your hand has to make instead.
 */
export function voicePitchClasses(
  pitchClasses: readonly PitchClass[],
  anchorMidi: number = VOICING_ANCHOR_MIDI,
): number[] {
  const voiced: number[] = [];
  let floor = anchorMidi - 1;

  for (const pitchClass of pitchClasses) {
    const offset =
      ((pitchClass - (anchorMidi % SEMITONES_PER_OCTAVE)) % SEMITONES_PER_OCTAVE +
        SEMITONES_PER_OCTAVE) %
      SEMITONES_PER_OCTAVE;
    let midi = anchorMidi + offset;
    while (midi <= floor) midi += SEMITONES_PER_OCTAVE;
    voiced.push(midi);
    floor = midi;
  }

  return voiced;
}

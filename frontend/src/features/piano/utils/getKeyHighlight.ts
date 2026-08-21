import type { PitchClass } from '@/features/music-theory';
import type { HighlightMap, KeyHighlight, PianoKey } from '../types/piano.types';

/**
 * Where a highlight applies.
 *
 * `pitchClasses` lights the note in every octave — the right answer for single
 * notes ("find every C"). `midis` lights exact keys — the right answer for
 * chords, which would otherwise cover the whole keyboard.
 */
export interface HighlightSource {
  pitchClasses?: readonly PitchClass[];
  midis?: readonly number[];
}

export interface HighlightInput {
  current?: HighlightSource;
  previous?: HighlightSource;
  next?: HighlightSource;
}

/**
 * Merge the three sources into one lookup.
 * Precedence is current > next > previous, so an overlap always shows the
 * state that matters most for what you are playing right now.
 */
export function buildHighlightMap({ current, previous, next }: HighlightInput): HighlightMap {
  const byPitchClass = new Map<PitchClass, KeyHighlight>();
  const byMidi = new Map<number, KeyHighlight>();

  const apply = (source: HighlightSource | undefined, state: KeyHighlight) => {
    if (!source) return;
    for (const pitchClass of source.pitchClasses ?? []) byPitchClass.set(pitchClass, state);
    for (const midi of source.midis ?? []) byMidi.set(midi, state);
  };

  apply(previous, 'previous');
  apply(next, 'next');
  apply(current, 'current');

  return { byPitchClass, byMidi };
}

/** Exact keys win over whole-octave highlights. */
export function highlightFor(map: HighlightMap, key: PianoKey): KeyHighlight {
  return map.byMidi.get(key.midi) ?? map.byPitchClass.get(key.pitchClass) ?? 'none';
}

export const EMPTY_HIGHLIGHTS: HighlightMap = { byPitchClass: new Map(), byMidi: new Map() };

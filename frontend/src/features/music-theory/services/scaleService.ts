import { getScaleType } from '../data/scales';
import type { Scale, ScaleType, SpelledNote } from '../types/music.types';
import { parseNote } from '../utils/normalizeNote';
import { spellIntervals } from '../utils/spelling';

/**
 * Answers one question only: "which notes belong to this scale?"
 * It knows nothing about React, timers or the piano.
 */
export function buildScale(root: SpelledNote, type: ScaleType): Scale {
  return {
    root,
    type,
    notes: spellIntervals(root, type.intervals, { oneLetterPerDegree: type.diatonic }),
  };
}

/** Convenience wrapper for callers holding plain strings ("Bb", "major"). */
export function buildScaleFrom(rootName: string, scaleTypeId: string): Scale | null {
  const root = parseNote(rootName);
  const type = getScaleType(scaleTypeId);
  if (!root || !type) return null;
  return buildScale(root, type);
}

/** Human label for a scale, e.g. "Bb Major". */
export function scaleLabel(scale: Scale): string {
  return `${scale.root.name} ${scale.type.short}`;
}

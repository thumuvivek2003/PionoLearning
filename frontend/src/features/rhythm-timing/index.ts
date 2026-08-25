/**
 * Level 3 — rhythm and timing.
 *
 * The clock rather than the keyboard: what a beat is, how long a note lasts,
 * and whether the pulse survives you playing over it. It leans on the practice
 * kit for the timing maths and on the piano feature for a board that reports
 * press and release; nothing here knows about geography or fingering.
 */
export type { NoteValue, ValueSpec } from './data/noteValues';
export { VALUES, barCount, beatsOf, countLabel, valueSpec } from './data/noteValues';
export type { RhythmEvent, Score, ScoreEvent } from './data/score';
export {
  HOLD_TOLERANCE,
  barCountOf,
  buildScore,
  fillsBars,
  heldShare,
  holdNote,
  playable,
} from './data/score';
export type { ClickSupport, PulseDrillConfig } from './data/pulseDrills';
export {
  PULSE_DRILLS,
  SUPPORT_LABELS,
  SUPPORT_LADDER,
  getPulseDrill,
} from './data/pulseDrills';
export type { LineId, MetronomeDrillConfig, MetronomeMode } from './data/metronomeDrills';
export { LINES, LINE_LABELS, METRONOME_DRILLS, getMetronomeDrill } from './data/metronomeDrills';
export type { DurationDrillConfig } from './data/durationDrills';
export { DURATION_DRILLS, getDurationDrill } from './data/durationDrills';
export { BeatBar } from './components/BeatBar';
export { Keyboard } from './components/Keyboard';
export { ScoreStrip } from './components/ScoreStrip';
export { DurationDrill } from './drills/DurationDrill';
export { MetronomeDrill } from './drills/MetronomeDrill';
export { PulseDrill } from './drills/PulseDrill';

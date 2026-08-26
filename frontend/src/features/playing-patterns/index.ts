/**
 * Level 7 — the shapes real pieces are made of.
 *
 * A melody, a broken chord and an arpeggio are one thing seen three ways: an
 * ordered line of notes with a finger on each, played in time. The theory comes
 * from music-theory, the board from piano and the clock from the practice kit;
 * what lives here is the turning of a chord or a scale into a figure, and the
 * measuring of how evenly it is played.
 */
export type {
  AccompStep,
  Contour,
  FigureEvent,
  FigureNote,
  FigureSource,
  Hand,
  NoteValue,
  Quality,
} from './patterns.types';
export type { BuiltFigure } from './data/figures';
export {
  SPAN,
  VALUE_BEATS,
  beatsOf,
  buildEvents,
  buildFigure,
  contourDegrees,
  fingeringFor,
  lengthOf,
  nameOf,
  turnsIn,
} from './data/figures';
export type { PatternConfig } from './data/patternDrills';
export { PATTERN_DRILLS, getPatternDrill } from './data/patternDrills';
export { PatternKeyboard } from './components/PatternKeyboard';
export { PatternDrill } from './drills/PatternDrill';

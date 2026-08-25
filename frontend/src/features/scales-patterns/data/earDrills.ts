import { RELATIVE_PAIRS } from './relatives';

/**
 * 4.6.1 as data — the one practice in the level answered by ear.
 *
 * A relative pair is the fairest possible test of tonality: the two scales hold
 * exactly the same seven notes, so nothing about the pitches gives the answer
 * away. Only the note the line starts and ends on differs, which is precisely
 * the thing the reference asks you to learn to hear.
 */
export interface EarDrillConfig {
  id: string;
  /** Major roots in play; each brings its relative minor with it. */
  pairs: readonly string[];
  /** Sound the tonic once more at the end, so home is stated twice. */
  settleOnTonic: boolean;
  goal: string;
  guidance: readonly string[];
  watchFor: string;
}

/** The three pairs the reference works through, in the order it gives them. */
const EAR_PAIRS: readonly string[] = ['C', 'G', 'F'];

export const EAR_DRILLS: Readonly<Record<string, EarDrillConfig>> = {
  'major-minor': {
    id: 'major-minor',
    pairs: EAR_PAIRS,
    settleOnTonic: true,
    goal: 'Hear major against minor, on scales built from identical notes.',
    guidance: [
      'A scale plays. Say whether it was major or minor — the keyboard stays out of it.',
      'C major and A minor use the same seven white keys, so the notes cannot tell you. Only the note it comes to rest on can.',
      'G against E minor and F against D minor follow, and the panel names whichever pair you keep missing.',
    ],
    watchFor:
      'Answering "minor" because it sounded sad. That works until it does not; listen for which note feels like home instead.',
  },
};

export function getEarDrill(id: string): EarDrillConfig {
  const config = EAR_DRILLS[id];
  if (!config) throw new Error(`Unknown ear drill: ${id}`);
  return config;
}

/** The pairs a config puts in play, resolved to major and minor roots. */
export function pairsOf(config: EarDrillConfig) {
  return RELATIVE_PAIRS.filter((pair) => config.pairs.includes(pair.major));
}

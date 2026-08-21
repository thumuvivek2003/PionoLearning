import type { PianoKey } from '../types/piano.types';

/** Black keys are narrower than whites; this is the ratio used for layout. */
export const BLACK_KEY_WIDTH_RATIO = 0.62;

/** Percentage geometry so the keyboard scales with its container. */
export interface KeyGeometry {
  left: string;
  width: string;
}

export function getKeyGeometry(key: PianoKey, whiteKeyCount: number): KeyGeometry {
  const unit = 100 / whiteKeyCount;

  if (!key.isBlack) {
    return { left: `${key.whiteIndex * unit}%`, width: `${unit}%` };
  }

  const width = unit * BLACK_KEY_WIDTH_RATIO;
  // key.offset already points at the boundary; centre the key on it.
  return { left: `${(key.offset + 0.5) * unit - width / 2}%`, width: `${width}%` };
}

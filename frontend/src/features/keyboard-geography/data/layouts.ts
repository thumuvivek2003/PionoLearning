import { KEYBOARD_LAYOUTS } from '@/features/piano';

/**
 * Keyboard-size choices for a drill's control panel.
 *
 * Read from the registered layouts rather than written out, so adding a 76-key
 * board to the piano feature offers it in every drill at once.
 */
export const LAYOUT_OPTIONS = KEYBOARD_LAYOUTS.map((layout) => ({
  value: layout.id,
  label: `${layout.keyCount} keys`,
}));

/** One octave, C to C — enough for the drills that only need the shapes. */
export const SMALL_LAYOUT_ID = '25';

/** Several octaves — the default wherever the drill is *about* octaves. */
export const WIDE_LAYOUT_ID = '49';

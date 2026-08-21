export type {
  HighlightChannel,
  HighlightMap,
  KeyHighlight,
  KeyboardLayout,
  PianoKey,
} from './types/piano.types';
export {
  KEYBOARD_25,
  KEYBOARD_49,
  KEYBOARD_61,
  KEYBOARD_LAYOUTS,
  buildKeyboard,
  getKeyboardLayout,
} from './data/keyboardLayouts';
export { EMPTY_HIGHLIGHTS, buildHighlightMap, highlightFor } from './utils/getKeyHighlight';
export type { HighlightInput, HighlightSource } from './utils/getKeyHighlight';
export { VOICING_ANCHOR_MIDI, voicePitchClasses } from './utils/voicing';
export { getKeyGeometry } from './utils/getKeyPosition';
export { PianoKeyboard } from './components/PianoKeyboard';

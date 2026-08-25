import { PianoKeyboard } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';

interface KeyboardProps {
  layout: KeyboardLayout;
  /** Keys currently sounding, so a held note is visible. */
  lit?: readonly number[];
  showNames?: boolean;
  onKeyPress?: (key: PianoKey) => void;
  onKeyDown?: (key: PianoKey) => void;
  onKeyUp?: (key: PianoKey) => void;
  footerNote?: string;
}

/**
 * The board as this level uses it.
 *
 * Rhythm work needs press *and* release — a note's length is the drill — so
 * this wraps the shared keyboard with both, and lights whatever is currently
 * sounding rather than whatever is correct. There is nothing to be right about
 * here except when you let go.
 */
export function Keyboard({
  layout,
  lit,
  showNames = true,
  onKeyPress,
  onKeyDown,
  onKeyUp,
  footerNote,
}: KeyboardProps) {
  return (
    <PianoKeyboard
      layout={layout}
      highlights={{
        byMidi: new Map((lit ?? []).map((midi) => [midi, 'current' as const])),
        byPitchClass: new Map(),
      }}
      showNoteNames={showNames}
      showLegend={false}
      onKeyPress={onKeyPress}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      footerNote={footerNote}
    />
  );
}

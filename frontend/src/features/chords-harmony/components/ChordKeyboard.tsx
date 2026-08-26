import { useMemo } from 'react';
import { PianoKeyboard, buildHighlightMap, getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';

interface ChordKeyboardProps {
  layoutId: string;
  /** The chord being shown, or the tone being asked for. */
  lit?: readonly number[];
  /** Tones already played in this build. */
  done?: readonly number[];
  /** A wrong press. */
  secondary?: readonly number[];
  showNames: boolean;
  onKeyPress?: (key: PianoKey) => void;
  footerNote?: string;
}

/**
 * The board as the chord work uses it.
 *
 * Its own wrapper rather than a borrowed one, so this feature depends on the
 * shared piano and on nothing else. A chord lights as a shape — several keys at
 * once — which is the difference from the scale board, where one note is live
 * at a time.
 */
export function ChordKeyboard({
  layoutId,
  lit,
  done,
  secondary,
  showNames,
  onKeyPress,
  footerNote,
}: ChordKeyboardProps) {
  const layout = getKeyboardLayout(layoutId);

  const highlights = useMemo(
    () =>
      buildHighlightMap({
        current: lit && lit.length > 0 ? { midis: [...lit] } : undefined,
        next: secondary && secondary.length > 0 ? { midis: [...secondary] } : undefined,
        previous: done && done.length > 0 ? { midis: [...done] } : undefined,
      }),
    [done, lit, secondary],
  );

  return (
    <PianoKeyboard
      layout={layout}
      highlights={highlights}
      showNoteNames={showNames}
      showLegend={false}
      onKeyPress={onKeyPress}
      footerNote={footerNote}
    />
  );
}

import { useMemo } from 'react';
import { PianoKeyboard, buildHighlightMap, getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';

interface ScaleKeyboardProps {
  layoutId: string;
  /** The note being asked for, or the one just played. */
  lit?: readonly number[];
  /** Notes already played in this run. */
  done?: readonly number[];
  /** A wrong press, or a scaffold showing where the scale lies. */
  secondary?: readonly number[];
  showNames: boolean;
  onKeyPress?: (key: PianoKey) => void;
  footerNote?: string;
}

/**
 * The board as the scale work uses it.
 *
 * Its own wrapper rather than a borrowed one, so this feature depends on the
 * shared piano and on nothing else. What it shows is the run so far and where
 * you are in it — never the note coming next, since working that out from the
 * formula is the entire exercise.
 */
export function ScaleKeyboard({
  layoutId,
  lit,
  done,
  secondary,
  showNames,
  onKeyPress,
  footerNote,
}: ScaleKeyboardProps) {
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

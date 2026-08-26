import { useMemo } from 'react';
import { PianoKeyboard, buildHighlightMap, getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';

interface PatternKeyboardProps {
  layoutId: string;
  /** The note being asked for. */
  lit?: readonly number[];
  /** Notes already played in this loop. */
  done?: readonly number[];
  /** A wrong press. */
  secondary?: readonly number[];
  showNames: boolean;
  onKeyPress?: (key: PianoKey) => void;
  footerNote?: string;
}

/**
 * The board as the pattern work uses it.
 *
 * Its own wrapper so this feature depends on the shared piano and nothing else.
 * What it shows is the figure so far and where you are in it — never the note
 * coming next, since anticipating that from the shape is the exercise.
 */
export function PatternKeyboard({
  layoutId,
  lit,
  done,
  secondary,
  showNames,
  onKeyPress,
  footerNote,
}: PatternKeyboardProps) {
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

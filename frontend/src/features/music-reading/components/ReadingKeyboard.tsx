import { useMemo } from 'react';
import { PianoKeyboard, buildHighlightMap, getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';

interface ReadingKeyboardProps {
  layoutId: string;
  /** The note being asked for, or the one just answered. */
  lit?: readonly number[];
  /** A wrong press. */
  secondary?: readonly number[];
  showNames: boolean;
  onKeyPress?: (key: PianoKey) => void;
  footerNote?: string;
}

/**
 * The board as the reading work uses it.
 *
 * Its own wrapper so this feature depends on the shared piano and nothing else.
 * Nothing is lit while a question is open: the whole exercise is going from the
 * page to the key without the key being pointed at.
 */
export function ReadingKeyboard({
  layoutId,
  lit,
  secondary,
  showNames,
  onKeyPress,
  footerNote,
}: ReadingKeyboardProps) {
  const layout = getKeyboardLayout(layoutId);

  const highlights = useMemo(
    () =>
      buildHighlightMap({
        current: lit && lit.length > 0 ? { midis: [...lit] } : undefined,
        next: secondary && secondary.length > 0 ? { midis: [...secondary] } : undefined,
      }),
    [lit, secondary],
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

import { useMemo } from 'react';
import { PianoKeyboard, buildHighlightMap, getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';

interface ChallengeKeyboardProps {
  layoutId: string;
  /** The keys being shown — a lit chord for a naming round. */
  lit?: readonly number[];
  /** Keys already played in this round. */
  done?: readonly number[];
  /** A wrong press. */
  secondary?: readonly number[];
  showNames: boolean;
  onKeyPress?: (key: PianoKey) => void;
  footerNote?: string;
}

/**
 * The board as the performance work uses it.
 *
 * Its own wrapper so this feature depends on the shared piano and nothing else.
 * Nothing is lit while a round is open unless the round is a naming one — the
 * whole level is about reaching the key without being shown it.
 */
export function ChallengeKeyboard({
  layoutId,
  lit,
  done,
  secondary,
  showNames,
  onKeyPress,
  footerNote,
}: ChallengeKeyboardProps) {
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

import { useMemo } from 'react';
import { PianoKeyboard, buildHighlightMap, getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';

interface HandKeyboardProps {
  layoutId: string;
  /** Keys played so far in this run, drawn coolest. */
  done?: readonly number[];
  /** Where the hands are resting — a scaffold, shown before a run starts. */
  positions?: readonly number[];
  /** The key just played, or the one being cued in a paced run. */
  lit?: readonly number[];
  /** A wrong press, marked apart from everything else. */
  wrong?: number | null;
  showNames: boolean;
  onKeyPress?: (key: PianoKey) => void;
  footerNote?: string;
}

/**
 * The board as a hand rest.
 *
 * A sibling of the geography feature's keyboard rather than a reuse of it: this
 * one thinks in hands, so it wraps the shared piano component directly and
 * leaves the two features independent of each other. What it shows is the
 * *position* — where the hands live and what they have played — never what to
 * play next, because in this bucket the pattern is the prompt and the board is
 * only where it lands.
 */
export function HandKeyboard({
  layoutId,
  done,
  positions,
  lit,
  wrong,
  showNames,
  onKeyPress,
  footerNote,
}: HandKeyboardProps) {
  const layout = getKeyboardLayout(layoutId);

  const highlights = useMemo(
    () =>
      buildHighlightMap({
        current: lit && lit.length > 0 ? { midis: [...lit] } : undefined,
        next: wrong === null || wrong === undefined ? undefined : { midis: [wrong] },
        // Played keys win over the resting position, so a run writes over its
        // own scaffold as it goes.
        previous:
          done && done.length > 0
            ? { midis: [...done] }
            : positions && positions.length > 0
              ? { midis: [...positions] }
              : undefined,
      }),
    [done, lit, positions, wrong],
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

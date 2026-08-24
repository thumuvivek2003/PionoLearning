import { useMemo } from 'react';
import { PianoKeyboard, buildHighlightMap, getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import type { PitchClass } from '@/features/music-theory';

interface GeographyKeyboardProps {
  layoutId: string;
  /** Lights exact keys — one key, or a whole black-key group. */
  litMidis?: readonly number[];
  /** Lights notes in every octave, when only the letter matters. */
  litPitchClasses?: readonly PitchClass[];
  /** A second, cooler highlight: the answer that was given, or a hint. */
  secondaryMidis?: readonly number[];
  /** Coolest highlight — keys already collected in this run. */
  doneMidis?: readonly number[];
  showNames: boolean;
  onKeyPress?: (key: PianoKey) => void;
  footerNote?: string;
}

/**
 * The app's keyboard, set up as a drill surface.
 *
 * It reuses the trainer keyboard rather than drawing a simplified one, so the
 * shapes you learn here — where C sits against the group of two, how far F is
 * from the group of three — are the shapes you meet everywhere else.
 */
export function GeographyKeyboard({
  layoutId,
  litMidis,
  litPitchClasses,
  secondaryMidis,
  doneMidis,
  showNames,
  onKeyPress,
  footerNote,
}: GeographyKeyboardProps) {
  const layout = getKeyboardLayout(layoutId);

  const highlights = useMemo(() => {
    // Exact keys win over pitch classes: "this D#" is more specific than "every D#".
    const current =
      litMidis && litMidis.length > 0
        ? { midis: [...litMidis] }
        : litPitchClasses && litPitchClasses.length > 0
          ? { pitchClasses: [...litPitchClasses] }
          : undefined;

    return buildHighlightMap({
      current,
      next:
        secondaryMidis && secondaryMidis.length > 0 ? { midis: [...secondaryMidis] } : undefined,
      previous: doneMidis && doneMidis.length > 0 ? { midis: [...doneMidis] } : undefined,
    });
  }, [doneMidis, litMidis, litPitchClasses, secondaryMidis]);

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

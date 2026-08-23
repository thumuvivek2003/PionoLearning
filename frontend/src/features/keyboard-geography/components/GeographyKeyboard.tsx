import { useMemo } from 'react';
import { PianoKeyboard, buildHighlightMap, getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import type { PitchClass } from '@/features/music-theory';

interface GeographyKeyboardProps {
  layoutId: string;
  /** Lights one exact key — used when the drill asks about a specific octave. */
  midi?: number | null;
  /** Lights a note in every octave — used when only the letter matters. */
  pitchClass?: PitchClass | null;
  /** A second, cooler highlight: the answer that was given, or a hint. */
  secondaryMidi?: number | null;
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
  midi = null,
  pitchClass = null,
  secondaryMidi = null,
  showNames,
  onKeyPress,
  footerNote,
}: GeographyKeyboardProps) {
  const layout = getKeyboardLayout(layoutId);

  const highlights = useMemo(
    () =>
      buildHighlightMap({
        current:
          midi !== null
            ? { midis: [midi] }
            : pitchClass !== null
              ? { pitchClasses: [pitchClass] }
              : undefined,
        next: secondaryMidi !== null ? { midis: [secondaryMidi] } : undefined,
      }),
    [midi, pitchClass, secondaryMidi],
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

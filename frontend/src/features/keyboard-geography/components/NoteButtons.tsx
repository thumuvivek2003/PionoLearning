import { useMemo } from 'react';
import type { Letter } from '@/features/music-theory';
import { NATURALS } from '../data/naturals';
import { LabelButtons } from './LabelButtons';

interface NoteButtonsProps {
  onAnswer: (letter: Letter) => void;
  correct?: Letter | null;
  wrong?: Letter | null;
  disabled?: boolean;
}

/**
 * The seven naturals as answer keys.
 *
 * Deliberately in keyboard order rather than alphabetical: the answer should
 * come from the map, and A–G order would teach the alphabet instead.
 */
export function NoteButtons({ onAnswer, correct, wrong, disabled }: NoteButtonsProps) {
  const options = useMemo(
    () => NATURALS.map((letter) => ({ value: letter, label: letter })),
    [],
  );

  return (
    <LabelButtons
      options={options}
      onAnswer={onAnswer}
      correct={correct}
      wrong={wrong}
      disabled={disabled}
    />
  );
}

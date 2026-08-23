import type { Letter } from '@/features/music-theory';
import { cn } from '@/lib/cn';
import { NATURALS } from '../data/naturals';
import styles from './geography.module.css';

interface NoteButtonsProps {
  onAnswer: (letter: Letter) => void;
  /** Marked green once the verdict is in. */
  correct?: Letter | null;
  /** Marked red — what was answered when it was wrong. */
  wrong?: Letter | null;
  disabled?: boolean;
}

/**
 * The seven naturals as answer keys.
 *
 * Deliberately in keyboard order rather than alphabetical: the answer should
 * come from the map, and A–G order would teach the alphabet instead.
 */
export function NoteButtons({ onAnswer, correct = null, wrong = null, disabled }: NoteButtonsProps) {
  return (
    <div className={styles.notes}>
      {NATURALS.map((letter) => (
        <button
          key={letter}
          type="button"
          disabled={disabled}
          className={cn(
            styles.note,
            correct === letter && styles.noteCorrect,
            wrong === letter && styles.noteWrong,
          )}
          onClick={() => onAnswer(letter)}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}

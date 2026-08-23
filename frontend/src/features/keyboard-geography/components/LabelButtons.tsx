import { cn } from '@/lib/cn';
import styles from './geography.module.css';

export interface AnswerOption<T> {
  value: T;
  label: string;
  /** Small second line, e.g. the other name of the same key. */
  sub?: string;
}

interface LabelButtonsProps<T extends string | number> {
  options: readonly AnswerOption<T>[];
  onAnswer: (value: T) => void;
  /** Marked green once the verdict is in. */
  correct?: T | null;
  /** Marked red — what was answered when it was wrong. */
  wrong?: T | null;
  disabled?: boolean;
}

/**
 * The answer keys for a geography drill.
 *
 * One component for every answer set in the level — seven naturals, five black
 * keys, five group positions — so answering always looks and behaves the same
 * no matter what is being asked.
 */
export function LabelButtons<T extends string | number>({
  options,
  onAnswer,
  correct = null,
  wrong = null,
  disabled,
}: LabelButtonsProps<T>) {
  return (
    <div className={styles.notes}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          disabled={disabled}
          className={cn(
            styles.note,
            correct === option.value && styles.noteCorrect,
            wrong === option.value && styles.noteWrong,
          )}
          onClick={() => onAnswer(option.value)}
        >
          {option.label}
          {option.sub && <span className={styles.noteSub}>{option.sub}</span>}
        </button>
      ))}
    </div>
  );
}

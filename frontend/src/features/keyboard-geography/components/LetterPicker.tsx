import type { Letter } from '@/features/music-theory';
import { cn } from '@/lib/cn';
import { NATURALS } from '../data/naturals';
import styles from './geography.module.css';

interface LetterPickerProps {
  value: Letter;
  onChange: (letter: Letter) => void;
  /** Narrow the choices — defaults to all seven naturals, in keyboard order. */
  letters?: readonly Letter[];
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Pick one natural as a drill *setting* — not as an answer.
 *
 * Kept smaller and quieter than LabelButtons on purpose: choosing "run from A"
 * is setup that lives in the aside, so it must never read as the answer keys.
 */
export function LetterPicker({
  value,
  onChange,
  letters = NATURALS,
  disabled,
  ariaLabel,
}: LetterPickerProps) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label={ariaLabel}>
      {letters.map((letter) => (
        <button
          key={letter}
          type="button"
          role="radio"
          aria-checked={letter === value}
          disabled={disabled}
          className={cn(styles.pickerKey, letter === value && styles.pickerKeyActive)}
          onClick={() => onChange(letter)}
        >
          {letter}
        </button>
      ))}
    </div>
  );
}

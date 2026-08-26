import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import styles from './ui.module.css';

interface TickProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Read out to a screen reader, e.g. "Mark C Major done". */
  label: string;
  size?: 'sm' | 'md';
}

/**
 * A checkbox that looks like a checkbox and behaves like one.
 *
 * A real input underneath rather than a styled div: it is focusable, it toggles
 * with the keyboard, and a screen reader announces it as a checkbox — none of
 * which comes free with a decorated span.
 */
export function Tick({ checked, onChange, label, size = 'md' }: TickProps) {
  return (
    <label className={cn(styles.tick, size === 'sm' && styles.tickSm)}>
      <input
        type="checkbox"
        className={styles.tickInput}
        checked={checked}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
        // A tick inside a link must not follow it.
        onClick={(event) => event.stopPropagation()}
      />
      <span className={cn(styles.tickBox, checked && styles.tickBoxOn)} aria-hidden="true">
        {checked && <Icon name="check" size={size === 'sm' ? 11 : 13} />}
      </span>
    </label>
  );
}

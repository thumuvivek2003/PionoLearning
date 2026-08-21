import { cn } from '@/lib/cn';
import styles from './ui.module.css';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className={styles.toggleRow}>
      <span>
        <span className={styles.toggleLabel}>{label}</span>
        {description && <span className={styles.toggleDescription}>{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={cn(styles.toggle, checked && styles.toggleOn)}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.toggleKnob} />
      </button>
    </div>
  );
}

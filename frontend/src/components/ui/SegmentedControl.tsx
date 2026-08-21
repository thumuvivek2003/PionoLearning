import type { Option } from '@/types/common.types';
import { cn } from '@/lib/cn';
import styles from './ui.module.css';

interface SegmentedControlProps<T extends string> {
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  block?: boolean;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  block = false,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(styles.segmented, block && styles.segmentedBlock)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          disabled={option.disabled}
          className={cn(styles.segment, option.value === value && styles.segmentActive)}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

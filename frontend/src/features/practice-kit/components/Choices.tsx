import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './kit.module.css';

/** A row of small settings pills — pattern, tempo, hold length. */
export function ChoiceRow({ children }: { children: ReactNode }) {
  return <div className={styles.choiceRow}>{children}</div>;
}

interface ChoiceProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  label?: string;
}

export function Choice({ active, onClick, children, label }: ChoiceProps) {
  return (
    <button
      type="button"
      className={cn(styles.choice, active && styles.choiceActive)}
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * Renders a list of options as pills.
 *
 * Saves every drill writing the same map: the options are data, and which one
 * is on is the caller's business.
 */
export function ChoicePills<T extends string | number>({
  options,
  value,
  onChange,
  format,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (value: T) => ReactNode;
}) {
  return (
    <ChoiceRow>
      {options.map((option) => (
        <Choice key={String(option)} active={option === value} onClick={() => onChange(option)}>
          {format ? format(option) : String(option)}
        </Choice>
      ))}
    </ChoiceRow>
  );
}

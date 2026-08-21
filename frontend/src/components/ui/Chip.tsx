import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './ui.module.css';

interface ChipProps {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'next' | 'danger';
}

export function Chip({ children, tone = 'neutral' }: ChipProps) {
  return (
    <span
      className={cn(
        styles.chip,
        tone === 'accent' && styles.chipAccent,
        tone === 'next' && styles.chipNext,
        tone === 'danger' && styles.chipDanger,
      )}
    >
      {children}
    </span>
  );
}

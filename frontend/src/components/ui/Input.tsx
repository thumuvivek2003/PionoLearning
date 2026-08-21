import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import styles from './ui.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  mono?: boolean;
}

export function Input({ invalid = false, mono = false, className, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        styles.control,
        mono && styles.controlMono,
        invalid && styles.controlInvalid,
        className,
      )}
      aria-invalid={invalid || undefined}
      autoComplete="off"
      spellCheck={false}
      {...rest}
    />
  );
}

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import styles from './ui.module.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Required — the glyph alone carries no meaning for assistive tech. */
  label: string;
  active?: boolean;
}

export function IconButton({ icon, label, active = false, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cn(styles.iconButton, active && styles.iconButtonActive, className)}
      aria-label={label}
      title={label}
      aria-pressed={active}
      {...rest}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}

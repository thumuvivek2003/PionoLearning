import { Icon } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { cn } from '@/lib/cn';
import styles from './pages.module.css';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  tone?: 'default' | 'accent' | 'success' | 'danger';
}

export function StatCard({ label, value, hint, icon, tone = 'default' }: StatCardProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileLabel}>
        {icon && <Icon name={icon} size={14} />}
        {label}
      </span>
      <span
        className={cn(
          styles.tileValue,
          tone === 'accent' && styles.accentText,
          tone === 'success' && styles.successText,
          tone === 'danger' && styles.dangerText,
        )}
      >
        {value}
      </span>
      {hint && <span className={styles.tileHint}>{hint}</span>}
    </div>
  );
}

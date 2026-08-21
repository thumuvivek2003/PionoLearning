import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import styles from './ui.module.css';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'history', title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Icon name={icon} size={28} />
      <span className={styles.emptyTitle}>{title}</span>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

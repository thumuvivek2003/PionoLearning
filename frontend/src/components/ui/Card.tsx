import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import styles from './ui.module.css';

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Skip the inner padding when the child manages its own layout. */
  bare?: boolean;
}

export function Card({ title, action, children, className, bare = false }: CardProps) {
  return (
    <section className={cn(styles.card, !title && !bare && styles.cardPadded, className)}>
      {title && (
        <header className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{title}</h2>
          {action}
        </header>
      )}
      {title && !bare ? <div className={styles.cardBody}>{children}</div> : children}
    </section>
  );
}

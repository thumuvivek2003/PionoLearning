import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui';
import styles from './layout.module.css';

export interface Crumb {
  label: string;
  /** Omit on the last crumb — the page you are already on is not a link. */
  to?: string;
}

/**
 * Trail for the nested curriculum routes.
 *
 * Presentational only: it takes the crumbs it is handed and never looks up the
 * tree itself, so any nested area of the app can reuse it.
 */
export function Breadcrumbs({ items }: { items: readonly Crumb[] }) {
  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      <ol className={styles.crumbList}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className={styles.crumbItem}>
              {item.to && !isLast ? (
                <Link to={item.to} className={styles.crumbLink}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.crumbCurrent} aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && <Icon name="chevron-right" size={13} className={styles.crumbSep} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

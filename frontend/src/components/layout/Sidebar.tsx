import { NavLink } from 'react-router-dom';
import { Icon } from '@/components/ui';
import { useSettings } from '@/features/settings';
import { cn } from '@/lib/cn';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import { listModules } from '@/modules/registry';
import styles from './layout.module.css';

interface SidebarProps {
  /** The trainer the mode shortcuts should jump to. */
  activeModuleId: string;
}

const PROGRESS_LINKS = [
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/statistics', label: 'Statistics', icon: 'stats' },
] as const;

const SYSTEM_LINKS = [
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/about', label: 'About', icon: 'about' },
] as const;

export function Sidebar({ activeModuleId }: SidebarProps) {
  const { settings, update } = useSettings();
  const modules = listModules();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(styles.navItem, isActive && styles.navItemActive);

  return (
    <nav className={styles.sidebar} aria-label="Main">
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <Icon name="music-note" size={20} />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>{APP_NAME}</span>
          <span className={styles.brandSub}>{APP_SUBTITLE}</span>
        </span>
      </div>

      <div className={styles.nav}>
        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Trainers</span>
          {modules.map((module) => (
            <NavLink key={module.id} to={`/train/${module.id}`} className={navClass}>
              <Icon name={module.icon} />
              {module.title}
            </NavLink>
          ))}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Mode</span>
          {(['practice', 'test'] as const).map((mode) => (
            <NavLink
              key={mode}
              to={`/train/${activeModuleId}`}
              onClick={() => update('mode', mode)}
              className={({ isActive }) =>
                cn(styles.navItem, isActive && settings.mode === mode && styles.navItemActive)
              }
            >
              <Icon name={mode} />
              {mode === 'practice' ? 'Practice' : 'Test'}
            </NavLink>
          ))}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Progress</span>
          {PROGRESS_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              <Icon name={link.icon} />
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>App</span>
          {SYSTEM_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              <Icon name={link.icon} />
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      <span className={styles.promo}>
        <Icon name="star" size={15} />
        Practise daily
      </span>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { Icon, IconButton } from '@/components/ui';
import { useSettings } from '@/features/settings';
import { cn } from '@/lib/cn';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import { listModules } from '@/modules/registry';
import styles from './layout.module.css';

interface SidebarProps {
  /** The trainer the mode shortcuts should jump to. */
  activeModuleId: string;
  /**
   * Whether the drawer is showing.
   *
   * Only meaningful on a narrow screen: on a wide one the sidebar is always
   * there and this is ignored, which is why the shell rather than the sidebar
   * owns the state.
   */
  open?: boolean;
  /** Closes the drawer — a link was followed, or the close button was pressed. */
  onClose?: () => void;
}

/**
 * Learn comes first.
 *
 * The curriculum is the map of what to do next; the trainers below it are tools
 * you reach for once you know which practice you are on. Putting them first
 * invited picking a drill at random, which is what the curriculum exists to
 * stop.
 */
const LEARN_LINKS = [
  { to: '/curriculum', label: 'Curriculum', icon: 'layers' },
  { to: '/lessons', label: 'Lessons', icon: 'crown' },
] as const;

const PROGRESS_LINKS = [
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/statistics', label: 'Statistics', icon: 'stats' },
] as const;

const SYSTEM_LINKS = [
  { to: '/settings', label: 'Settings', icon: 'settings' },
  { to: '/about', label: 'About', icon: 'about' },
] as const;

export function Sidebar({ activeModuleId, open = false, onClose }: SidebarProps) {
  const { settings, update } = useSettings();
  const modules = listModules();
  const collapsed = settings.sidebarCollapsed;

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(styles.navItem, isActive && styles.navItemActive);

  /**
   * Collapsed items keep their label in the DOM — CSS hides it, so the accessible
   * name stays intact — and gain a tooltip, since the glyph is all that shows.
   */
  const itemTitle = (label: string) => (collapsed ? label : undefined);

  return (
    <nav
      className={cn(styles.sidebar, collapsed && styles.sidebarCollapsed, open && styles.sidebarOpen)}
      aria-label="Main"
      // Following a link should put the drawer away; on a wide screen there is
      // no drawer and the handler does nothing.
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('a')) onClose?.();
      }}
    >
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <Icon name="music-note" size={20} />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>{APP_NAME}</span>
          <span className={styles.brandSub}>{APP_SUBTITLE}</span>
        </span>
        <IconButton
          className={styles.collapseButton}
          icon={collapsed ? 'sidebar-expand' : 'sidebar-collapse'}
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => update('sidebarCollapsed', !collapsed)}
        />
        <IconButton
          className={styles.drawerClose}
          icon="x"
          label="Close menu"
          onClick={onClose}
        />
      </div>

      <div className={styles.nav}>
        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Learn</span>
          {LEARN_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} title={itemTitle(link.label)}>
              <Icon name={link.icon} />
              <span className={styles.navLabel}>{link.label}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Trainers</span>
          {modules.map((module) => (
            <NavLink
              key={module.id}
              to={`/train/${module.id}`}
              className={navClass}
              title={itemTitle(module.title)}
            >
              <Icon name={module.icon} />
              <span className={styles.navLabel}>{module.title}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Mode</span>
          {(['practice', 'test'] as const).map((mode) => {
            const label = mode === 'practice' ? 'Practice' : 'Test';
            return (
              <NavLink
                key={mode}
                to={`/train/${activeModuleId}`}
                onClick={() => update('mode', mode)}
                title={itemTitle(label)}
                className={({ isActive }) =>
                  cn(styles.navItem, isActive && settings.mode === mode && styles.navItemActive)
                }
              >
                <Icon name={mode} />
                <span className={styles.navLabel}>{label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>Progress</span>
          {PROGRESS_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} title={itemTitle(link.label)}>
              <Icon name={link.icon} />
              <span className={styles.navLabel}>{link.label}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles.navGroup}>
          <span className={styles.navGroupLabel}>App</span>
          {SYSTEM_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} title={itemTitle(link.label)}>
              <Icon name={link.icon} />
              <span className={styles.navLabel}>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <span className={styles.promo}>
        <Icon name="star" size={15} />
        <span className={styles.navLabel}>Practise daily</span>
      </span>
    </nav>
  );
}

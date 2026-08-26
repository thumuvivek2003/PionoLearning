import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '@/features/settings';
import { cn } from '@/lib/cn';
import { Header } from './Header';
import { MobileBar } from './MobileBar';
import { Sidebar } from './Sidebar';
import styles from './layout.module.css';

interface AppShellProps {
  title: string;
  subtitle?: string;
  activeModuleId: string;
  children: ReactNode;
}

export function AppShell({ title, subtitle, activeModuleId, children }: AppShellProps) {
  // The grid column is the shell's business; what goes inside it is the nav's.
  const { settings } = useSettings();
  /**
   * The drawer lives here rather than in the sidebar.
   *
   * Three things need to agree about it — the menu button, the panel and the
   * backdrop — and they are siblings, so the state belongs to their parent.
   */
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Navigating away closes it: a drawer left open over the page you just asked
  // for is the commonest fault in this pattern.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Escape closes it, and while it is open the page behind must not scroll.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  return (
    <div className={cn(styles.shell, settings.sidebarCollapsed && styles.shellCollapsed)}>
      <MobileBar title={title} onOpen={() => setMenuOpen(true)} />
      <Sidebar activeModuleId={activeModuleId} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {menuOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className={styles.main}>
        <Header title={title} subtitle={subtitle} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

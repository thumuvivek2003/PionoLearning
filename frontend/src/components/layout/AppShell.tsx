import type { ReactNode } from 'react';
import { useSettings } from '@/features/settings';
import { cn } from '@/lib/cn';
import { Header } from './Header';
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

  return (
    <div className={cn(styles.shell, settings.sidebarCollapsed && styles.shellCollapsed)}>
      <Sidebar activeModuleId={activeModuleId} />
      <div className={styles.main}>
        <Header title={title} subtitle={subtitle} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

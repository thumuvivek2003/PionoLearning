import type { ReactNode } from 'react';
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
  return (
    <div className={styles.shell}>
      <Sidebar activeModuleId={activeModuleId} />
      <div className={styles.main}>
        <Header title={title} subtitle={subtitle} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

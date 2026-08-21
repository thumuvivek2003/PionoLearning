import { IconButton } from '@/components/ui';
import { useSettings } from '@/features/settings';
import styles from './layout.module.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { settings, update } = useSettings();

  return (
    <header className={styles.header}>
      <div className={styles.headerTitles}>
        <h1 className={styles.headerTitle}>{title}</h1>
        {subtitle && <p className={styles.headerSubtitle}>{subtitle}</p>}
      </div>

      <div className={styles.headerActions}>
        <IconButton
          icon={settings.soundEnabled ? 'sound-on' : 'sound-off'}
          label={settings.soundEnabled ? 'Mute playback' : 'Play each item'}
          active={settings.soundEnabled}
          onClick={() => update('soundEnabled', !settings.soundEnabled)}
        />
        <IconButton
          icon={settings.theme === 'dark' ? 'sun' : 'moon'}
          label={settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => update('theme', settings.theme === 'dark' ? 'light' : 'dark')}
        />
        <span className={styles.avatar} aria-hidden="true">
          VT
        </span>
      </div>
    </header>
  );
}

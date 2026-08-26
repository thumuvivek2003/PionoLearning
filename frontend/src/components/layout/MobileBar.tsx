import { Icon, IconButton } from '@/components/ui';
import { useSettings } from '@/features/settings';
import { APP_NAME } from '@/lib/constants';
import styles from './layout.module.css';

interface MobileBarProps {
  onOpen: () => void;
  /** What the current screen is, so the bar says where you are. */
  title: string;
}

/**
 * The narrow-screen top bar: a menu button, the mark, and where you are.
 *
 * Only ever visible below the layout's breakpoint — a wide screen already has
 * the sidebar, and a second set of navigation would be two places to look.
 *
 * It stands in for the header at that width, which is why it carries the title
 * and the same two controls: hiding the header must not cost you the ability to
 * mute the app or change the theme.
 */
export function MobileBar({ onOpen, title }: MobileBarProps) {
  const { settings, update } = useSettings();

  return (
    <div className={styles.mobileBar}>
      <IconButton icon="menu" label="Open menu" onClick={onOpen} />
      <span className={styles.mobileBrand}>
        <span className={styles.mobileMark}>
          <Icon name="music-note" size={15} />
        </span>
        <span className={styles.mobileTitle}>{title || APP_NAME}</span>
      </span>
      <span className={styles.mobileActions}>
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
      </span>
    </div>
  );
}

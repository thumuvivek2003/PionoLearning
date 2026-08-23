import { memo } from 'react';
import type { KeyHighlight, PianoKey } from '../types/piano.types';
import { getKeyGeometry } from '../utils/getKeyPosition';
import styles from './piano.module.css';

interface BlackKeyProps {
  pianoKey: PianoKey;
  whiteKeyCount: number;
  highlight: KeyHighlight;
  showName: boolean;
  /** Given only when the keyboard is being used as an input. */
  onPress?: () => void;
}

function BlackKeyComponent({
  pianoKey,
  whiteKeyCount,
  highlight,
  showName,
  onPress,
}: BlackKeyProps) {
  const { left, width } = getKeyGeometry(pianoKey, whiteKeyCount);
  const className = [styles.key, styles.black, highlight !== 'none' ? styles[highlight] : '']
    .filter(Boolean)
    .join(' ');
  const label = (
    <span className={showName ? styles.label : styles.labelHidden}>
      {pianoKey.sharpName}
      <span className={styles.flatLabel}>{pianoKey.flatName}</span>
    </span>
  );

  return onPress ? (
    <button
      type="button"
      className={[className, styles.pressable].join(' ')}
      style={{ left, width }}
      data-midi={pianoKey.midi}
      data-highlight={highlight}
      aria-label={`${pianoKey.sharpName}${pianoKey.octave}`}
      onClick={onPress}
    >
      {label}
    </button>
  ) : (
    <div
      className={className}
      style={{ left, width }}
      data-midi={pianoKey.midi}
      data-highlight={highlight}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

export const BlackKey = memo(BlackKeyComponent);

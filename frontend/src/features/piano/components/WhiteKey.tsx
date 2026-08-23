import { memo } from 'react';
import type { KeyHighlight, PianoKey } from '../types/piano.types';
import { getKeyGeometry } from '../utils/getKeyPosition';
import styles from './piano.module.css';

interface WhiteKeyProps {
  pianoKey: PianoKey;
  whiteKeyCount: number;
  highlight: KeyHighlight;
  showName: boolean;
  /** Given only when the keyboard is being used as an input. */
  onPress?: () => void;
}

function WhiteKeyComponent({
  pianoKey,
  whiteKeyCount,
  highlight,
  showName,
  onPress,
}: WhiteKeyProps) {
  const { left, width } = getKeyGeometry(pianoKey, whiteKeyCount);
  const className = [styles.key, styles.white, highlight !== 'none' ? styles[highlight] : '']
    .filter(Boolean)
    .join(' ');
  const label = <span className={showName ? styles.label : styles.labelHidden}>{pianoKey.sharpName}</span>;

  // A display keyboard is decoration; an answerable one is a real control.
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

export const WhiteKey = memo(WhiteKeyComponent);

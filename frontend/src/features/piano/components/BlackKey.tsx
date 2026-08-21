import { memo } from 'react';
import type { KeyHighlight, PianoKey } from '../types/piano.types';
import { getKeyGeometry } from '../utils/getKeyPosition';
import styles from './piano.module.css';

interface BlackKeyProps {
  pianoKey: PianoKey;
  whiteKeyCount: number;
  highlight: KeyHighlight;
  showName: boolean;
}

function BlackKeyComponent({ pianoKey, whiteKeyCount, highlight, showName }: BlackKeyProps) {
  const { left, width } = getKeyGeometry(pianoKey, whiteKeyCount);

  return (
    <div
      className={[styles.key, styles.black, highlight !== 'none' ? styles[highlight] : '']
        .filter(Boolean)
        .join(' ')}
      style={{ left, width }}
      data-midi={pianoKey.midi}
      data-highlight={highlight}
      aria-hidden="true"
    >
      <span className={showName ? styles.label : styles.labelHidden}>
        {pianoKey.sharpName}
        <span className={styles.flatLabel}>{pianoKey.flatName}</span>
      </span>
    </div>
  );
}

export const BlackKey = memo(BlackKeyComponent);

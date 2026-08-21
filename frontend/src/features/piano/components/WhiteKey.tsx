import { memo } from 'react';
import type { KeyHighlight, PianoKey } from '../types/piano.types';
import { getKeyGeometry } from '../utils/getKeyPosition';
import styles from './piano.module.css';

interface WhiteKeyProps {
  pianoKey: PianoKey;
  whiteKeyCount: number;
  highlight: KeyHighlight;
  showName: boolean;
}

function WhiteKeyComponent({ pianoKey, whiteKeyCount, highlight, showName }: WhiteKeyProps) {
  const { left, width } = getKeyGeometry(pianoKey, whiteKeyCount);

  return (
    <div
      className={[styles.key, styles.white, highlight !== 'none' ? styles[highlight] : '']
        .filter(Boolean)
        .join(' ')}
      style={{ left, width }}
      data-midi={pianoKey.midi}
      data-highlight={highlight}
      aria-hidden="true"
    >
      <span className={showName ? styles.label : styles.labelHidden}>{pianoKey.sharpName}</span>
    </div>
  );
}

export const WhiteKey = memo(WhiteKeyComponent);

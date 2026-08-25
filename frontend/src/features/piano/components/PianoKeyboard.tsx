import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import type { HighlightChannel, HighlightMap, KeyboardLayout, PianoKey } from '../types/piano.types';
import { EMPTY_HIGHLIGHTS, highlightFor } from '../utils/getKeyHighlight';
import { BlackKey } from './BlackKey';
import { WhiteKey } from './WhiteKey';
import styles from './piano.module.css';

interface PianoKeyboardProps {
  layout: KeyboardLayout;
  highlights?: HighlightMap;
  /** Test mode hides every highlight so you must find the key yourself. */
  highlightsVisible?: boolean;
  showNoteNames?: boolean;
  showLegend?: boolean;
  /** Which colours are on. Supply it with onChannelChange to make the legend interactive. */
  channels?: Readonly<Record<HighlightChannel, boolean>>;
  onChannelChange?: (channel: HighlightChannel, enabled: boolean) => void;
  /**
   * Turns the keys into buttons — the geography drills answer "where is F?" by
   * pressing one. Left out, the keyboard stays the read-only display the
   * trainers use, so no existing screen changes behaviour.
   */
  onKeyPress?: (key: PianoKey) => void;
  /**
   * Press and release, for drills that measure how long a key is held.
   * Supplied alongside or instead of `onKeyPress`.
   */
  onKeyDown?: (key: PianoKey) => void;
  onKeyUp?: (key: PianoKey) => void;
  /** Replaces the layout name in the footer, e.g. "Naturals only". */
  footerNote?: string;
}

const LEGEND: readonly { channel: HighlightChannel; label: string; swatch?: string }[] = [
  { channel: 'previous', label: 'Previous', swatch: styles.swatchPrevious },
  { channel: 'current', label: 'Current', swatch: styles.swatchCurrent },
  { channel: 'next', label: 'Next', swatch: styles.swatchNext },
];

/**
 * The heart of the app: a full keyboard whose only job is to answer
 * "where is this note?". It takes a highlight map and renders it — it never
 * reaches into scales, sessions or timers.
 */
export function PianoKeyboard({
  layout,
  highlights = EMPTY_HIGHLIGHTS,
  highlightsVisible = true,
  showNoteNames = true,
  showLegend = true,
  channels,
  onChannelChange,
  onKeyPress,
  onKeyDown,
  onKeyUp,
  footerNote,
}: PianoKeyboardProps) {
  // Blacks render after whites so they always stack on top without z-index games.
  const [whiteKeys, blackKeys] = useMemo(
    () => [layout.keys.filter((key) => !key.isBlack), layout.keys.filter((key) => key.isBlack)],
    [layout],
  );

  const resolve = (key: (typeof layout.keys)[number]) =>
    highlightsVisible ? highlightFor(highlights, key) : 'none';

  return (
    <section className={styles.panel} aria-label={`${layout.name} piano keyboard`}>
      {showLegend && (
        <header className={styles.header}>
          <div className={styles.legend}>
            {LEGEND.map(({ channel, label, swatch }) => {
              const on = channels?.[channel] ?? true;
              const dot = cn(styles.swatch, swatch, !on && styles.swatchOff);

              // Without channels the legend stays a plain read-only key.
              return channels ? (
                <label key={channel} className={cn(styles.legendItem, styles.legendToggle)}>
                  <input
                    type="checkbox"
                    className={styles.legendCheckbox}
                    checked={on}
                    onChange={(event) => onChannelChange?.(channel, event.target.checked)}
                  />
                  <i className={dot} />
                  {label}
                </label>
              ) : (
                <span key={channel} className={styles.legendItem}>
                  <i className={dot} /> {label}
                </span>
              );
            })}
          </div>
          {!highlightsVisible && (
            <span className={`${styles.legend} ${styles.hiddenNotice}`}>
              Test mode — highlights off
            </span>
          )}
        </header>
      )}

      <div className={styles.keyboardScroll}>
        <div
          className={styles.keyboard}
          style={{ '--white-keys': layout.whiteKeyCount } as CSSProperties}
        >
          <div className={styles.keyLayer}>
            {whiteKeys.map((key) => (
              <WhiteKey
                key={key.midi}
                pianoKey={key}
                whiteKeyCount={layout.whiteKeyCount}
                highlight={resolve(key)}
                showName={showNoteNames}
                onPress={onKeyPress ? () => onKeyPress(key) : undefined}
                onDown={onKeyDown ? () => onKeyDown(key) : undefined}
                onUp={onKeyUp ? () => onKeyUp(key) : undefined}
              />
            ))}
            {blackKeys.map((key) => (
              <BlackKey
                key={key.midi}
                pianoKey={key}
                whiteKeyCount={layout.whiteKeyCount}
                highlight={resolve(key)}
                showName={showNoteNames}
                onPress={onKeyPress ? () => onKeyPress(key) : undefined}
                onDown={onKeyDown ? () => onKeyDown(key) : undefined}
                onUp={onKeyUp ? () => onKeyUp(key) : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <span>{footerNote ?? layout.name}</span>
        <span className={styles.scrollHint}>
          {onKeyPress || onKeyDown ? 'Tap a key to answer' : 'Swipe the keys sideways'}
        </span>
      </footer>
    </section>
  );
}

import { Fragment } from 'react';
import { cn } from '@/lib/cn';
import type { Clef, Step } from '../reading.types';
import { ANCHOR, TOP_STEP, ledgersFor, noteAt } from '../data/staff';
import type { Accidental } from '../data/accidentals';
import { GLYPH as SIGN } from '../data/accidentals';
import styles from './reading.module.css';

/** Height of one space, in user units. A step is half of this. */
const SPACE = 14;
const STEP_H = SPACE / 2;
/** Room above and below for ledger lines. */
const PAD = 44;
const STAFF_H = SPACE * 4;
const HEIGHT = STAFF_H + PAD * 2;
const TOP_Y = PAD;
/** Width taken by the clef before any notes. */
const CLEF_W = 44;
const NOTE_W = 46;
const LEDGER_W = 26;
/** Width one accidental of a key signature takes up. */
const SIGN_W = 11;

/** The unicode musical symbols, with a drawn anchor as the fallback meaning. */
const GLYPH: Readonly<Record<Clef, string>> = { treble: '\u{1D11E}', bass: '\u{1D122}' };

export interface StaffMark {
  step: Step;
  /** A sign drawn just before the notehead, at the same height. */
  accidental?: Accidental | null;
  /** Draw the head hollow — a half or whole note rather than a quarter. */
  hollow?: boolean;
  /** Marks the note being asked about, or the one just answered. */
  tone?: 'accent' | 'success' | 'danger' | 'muted';
  /** Prints the note's letter under it — the answer, so usually off. */
  label?: string;
}

/** One accidental of a key signature: where it goes and which sign it is. */
export interface SignatureMark {
  step: Step;
  accidental: Accidental;
}

interface StaffProps {
  clef: Clef;
  /** The notes to draw, left to right. */
  marks: readonly StaffMark[];
  /**
   * A key signature, drawn between the clef and the notes.
   *
   * Kept separate from `marks` because that is what it is: a signature applies
   * to every note of that letter for the whole line, while an accidental beside
   * a notehead applies to that note. Drawing them the same way would blur the
   * one distinction 6.6.2 exists to teach.
   */
  signature?: readonly SignatureMark[];
  /** Draw a ring on the line the clef is named for. */
  showAnchor?: boolean;
  /** Number every line and space down the left edge. */
  showPlaces?: boolean;
  /** Makes every position clickable, for "put the note where it goes". */
  onPick?: (step: Step) => void;
  /** Steps a click may land on, when picking is on. */
  pickable?: readonly Step[];
  label: string;
}

function yOf(step: Step): number {
  return TOP_Y + (TOP_STEP - step) * STEP_H;
}

/**
 * Five lines, a clef, and notes on them.
 *
 * Drawn rather than borrowed because the drills need to point at positions the
 * way the practices talk about them — this line, that space, a ledger — and a
 * picture of a stave cannot be asked questions. Everything vertical comes from
 * the step number, so the geometry never has an opinion about which note it is
 * drawing; the clef decides that, which is what a clef is for.
 *
 * The clef is a unicode glyph, and the line it is named for is drawn as a ring
 * regardless. That ring is the part that matters — a treble clef *is* a pointer
 * at the G line — and it means the staff still teaches correctly on a system
 * with no musical font.
 */
export function Staff({
  clef,
  marks,
  signature = [],
  showAnchor = false,
  showPlaces = false,
  onPick,
  pickable,
  label,
}: StaffProps) {
  const signatureW = signature.length * SIGN_W + (signature.length > 0 ? 8 : 0);
  const notesFrom = CLEF_W + signatureW;
  const width = notesFrom + Math.max(1, marks.length) * NOTE_W + 20;
  const anchor = ANCHOR[clef];
  const picking = onPick !== undefined;
  const targets = pickable ?? [];

  return (
    <svg
      className={styles.staff}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      {Array.from({ length: 5 }, (_entry, index) => {
        const step = index * 2;
        return (
          <line
            key={step}
            className={cn(styles.staffLine, showAnchor && step === anchor.step && styles.staffLineAnchor)}
            x1={4}
            x2={width - 4}
            y1={yOf(step)}
            y2={yOf(step)}
          />
        );
      })}

      {showPlaces &&
        Array.from({ length: 9 }, (_entry, step) => (
          <text key={step} className={styles.placeLabel} x={0} y={yOf(step) + 3}>
            {step % 2 === 0 ? `L${step / 2 + 1}` : `S${(step - 1) / 2 + 1}`}
          </text>
        ))}

      <text className={styles.clefGlyph} x={10} y={yOf(clef === 'treble' ? 2 : 6) + 20}>
        {GLYPH[clef]}
      </text>
      {showAnchor && (
        <circle className={styles.anchorRing} cx={26} cy={yOf(anchor.step)} r={6} />
      )}

      {signature.map((mark, index) => (
        <text
          key={`sig-${mark.step}-${index}`}
          className={styles.signGlyph}
          x={CLEF_W + index * SIGN_W}
          y={yOf(mark.step) + 5}
        >
          {SIGN[mark.accidental]}
        </text>
      ))}

      {marks.map((mark, index) => {
        const x = notesFrom + index * NOTE_W + NOTE_W / 2;
        const y = yOf(mark.step);
        const { count, below } = ledgersFor(mark.step);
        const note = noteAt(clef, mark.step);

        return (
          <Fragment key={`${mark.step}-${index}`}>
            {Array.from({ length: count }, (_entry, at) => {
              const step = below ? -2 * (at + 1) : TOP_STEP + 2 * (at + 1);
              return (
                <line
                  key={step}
                  className={styles.ledger}
                  x1={x - LEDGER_W / 2}
                  x2={x + LEDGER_W / 2}
                  y1={yOf(step)}
                  y2={yOf(step)}
                />
              );
            })}
            {mark.accidental && (
              <text className={styles.signGlyph} x={x - 22} y={y + 5}>
                {SIGN[mark.accidental]}
              </text>
            )}
            <ellipse
              className={cn(
                styles.notehead,
                mark.tone === 'accent' && styles.noteheadAccent,
                mark.tone === 'success' && styles.noteheadSuccess,
                mark.tone === 'danger' && styles.noteheadDanger,
                mark.tone === 'muted' && styles.noteheadMuted,
                mark.hollow && styles.noteheadHollow,
              )}
              cx={x}
              cy={y}
              rx={8}
              ry={6}
              transform={`rotate(-20 ${x} ${y})`}
            />
            {mark.label && (
              <text className={styles.noteLabel} x={x} y={HEIGHT - 8} textAnchor="middle">
                {mark.label}
              </text>
            )}
            <title>{`${note.name}, ${note.onLine ? 'line' : 'space'}`}</title>
          </Fragment>
        );
      })}

      {picking &&
        targets.map((step) => (
          <rect
            key={step}
            className={styles.pick}
            x={notesFrom}
            y={yOf(step) - STEP_H}
            width={width - notesFrom - 8}
            height={SPACE}
            rx={3}
            onClick={() => onPick?.(step)}
            role="button"
            aria-label={`Put it on ${noteAt(clef, step).onLine ? 'line' : 'space'} ${step}`}
          />
        ))}
    </svg>
  );
}

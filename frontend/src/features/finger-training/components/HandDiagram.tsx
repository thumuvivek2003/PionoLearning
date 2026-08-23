import { cn } from '@/lib/cn';
import { FINGERS, fingerName, handShort } from '../data/fingers';
import type { FingerNumber, Hand } from '../finger.types';
import styles from './finger.module.css';

const VIEW_WIDTH = 210;
const VIEW_HEIGHT = 280;

interface Shape {
  finger: FingerNumber;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise. Only the thumb leans. */
  rotate: number;
  /** Point the capsule pivots on — its knuckle, so the base stays on the palm. */
  pivotX: number;
  pivotY: number;
  /** Where the number sits — given explicitly so the thumb's label stays level. */
  labelX: number;
  labelY: number;
}

/**
 * Geometry for a right hand, palm down, thumb on the left.
 *
 * Every capsule is drawn upright and then rotated about its knuckle, which is
 * why the thumb needs a pivot inside the palm: rotating it about its own centre
 * would swing the base off the hand. A left hand is this mirrored about the
 * vertical centre line by flipping coordinates rather than with an SVG
 * transform — a `scale(-1,1)` would flip the numbers too and leave them
 * reading backwards.
 */
const RIGHT_HAND: readonly Shape[] = [
  {
    finger: 1,
    x: 51,
    y: 136,
    width: 30,
    height: 96,
    rotate: -40,
    pivotX: 66,
    pivotY: 232,
    labelX: 38,
    labelY: 203,
  },
  { finger: 2, x: 62, y: 60, width: 30, height: 108, rotate: 0, pivotX: 77, pivotY: 168, labelX: 77, labelY: 98 },
  { finger: 3, x: 96, y: 42, width: 30, height: 126, rotate: 0, pivotX: 111, pivotY: 168, labelX: 111, labelY: 80 },
  { finger: 4, x: 130, y: 58, width: 30, height: 110, rotate: 0, pivotX: 145, pivotY: 168, labelX: 145, labelY: 96 },
  { finger: 5, x: 163, y: 86, width: 28, height: 82, rotate: 0, pivotX: 177, pivotY: 168, labelX: 177, labelY: 124 },
];

const PALM = { x: 56, y: 150, width: 138, height: 98, rx: 32 };

function mirrorShape(shape: Shape): Shape {
  return {
    ...shape,
    x: VIEW_WIDTH - shape.x - shape.width,
    rotate: -shape.rotate,
    pivotX: VIEW_WIDTH - shape.pivotX,
    labelX: VIEW_WIDTH - shape.labelX,
  };
}

function shapesFor(hand: Hand): readonly Shape[] {
  return hand === 'right' ? RIGHT_HAND : RIGHT_HAND.map(mirrorShape);
}

function palmFor(hand: Hand) {
  return hand === 'right'
    ? PALM
    : { ...PALM, x: VIEW_WIDTH - PALM.x - PALM.width };
}

export type FingerTone = 'accent' | 'success' | 'danger';

interface HandDiagramProps {
  hand: Hand;
  /** The finger being asked for or cued, drawn in `tone`. */
  highlight?: FingerNumber | null;
  tone?: FingerTone;
  /** Fingers already covered this pass, drawn faintly. */
  done?: readonly FingerNumber[];
  /** Makes every finger clickable — used to answer "which finger is 3?". */
  onSelect?: (finger: FingerNumber) => void;
  /** Hide the printed numbers for a no-look round. */
  showNumbers?: boolean;
  size?: number;
}

export function HandDiagram({
  hand,
  highlight = null,
  tone = 'accent',
  done = [],
  onSelect,
  showNumbers = true,
  size = 250,
}: HandDiagramProps) {
  const shapes = shapesFor(hand);
  const palm = palmFor(hand);
  const interactive = onSelect !== undefined;

  return (
    <div className={styles.hand} style={{ width: size }}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.handSvg}
        role={interactive ? 'group' : 'img'}
        aria-label={`${handShort(hand)} — fingers 1 to 5`}
      >
        {shapes.map((shape) => {
          const isHighlight = highlight === shape.finger;
          const isDone = done.includes(shape.finger);
          const label = `${fingerName(shape.finger)} — finger ${shape.finger}`;

          return (
            <g
              key={shape.finger}
              className={cn(
                styles.finger,
                interactive && styles.fingerInteractive,
                isDone && styles.fingerDone,
                isHighlight && styles.fingerLit,
                isHighlight && tone === 'success' && styles.fingerSuccess,
                isHighlight && tone === 'danger' && styles.fingerDanger,
              )}
              transform={`rotate(${shape.rotate} ${shape.pivotX} ${shape.pivotY})`}
              onClick={interactive ? () => onSelect?.(shape.finger) : undefined}
              onKeyDown={
                interactive
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelect?.(shape.finger);
                      }
                    }
                  : undefined
              }
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? label : undefined}
            >
              <rect
                x={shape.x}
                y={shape.y}
                width={shape.width}
                // Run the capsule into the palm so there is no seam at the knuckle.
                height={shape.height + 24}
                rx={shape.width / 2}
                className={styles.fingerBody}
              />
            </g>
          );
        })}

        {/* Palm last so it covers where the capsules run under the knuckles. */}
        <rect
          x={palm.x}
          y={palm.y}
          width={palm.width}
          height={palm.height}
          rx={palm.rx}
          className={styles.palm}
        />

        {/* Labels sit outside the rotated groups so every number reads level. */}
        {showNumbers &&
          shapes.map((shape) => (
            <text
              key={`label-${shape.finger}`}
              x={shape.labelX}
              y={shape.labelY}
              className={cn(
                styles.fingerLabel,
                highlight === shape.finger && styles.fingerLabelLit,
              )}
              textAnchor="middle"
            >
              {shape.finger}
            </text>
          ))}
      </svg>
    </div>
  );
}

/** The numbering table, used as a reference panel beside the drills. */
export function FingerLegend({ highlight }: { highlight?: FingerNumber | null }) {
  return (
    <ul className={styles.legend}>
      {FINGERS.map((finger) => (
        <li
          key={finger.number}
          className={cn(styles.legendRow, highlight === finger.number && styles.legendRowLit)}
        >
          <span className={styles.legendNumber}>{finger.number}</span>
          {finger.name}
        </li>
      ))}
    </ul>
  );
}

import styles from './ui.module.css';

interface ProgressRingProps {
  /** 0 → 1. Values outside the range are clamped. */
  progress: number;
  size?: number;
  thickness?: number;
  value: string;
  unit?: string;
}

/** Countdown ring used by the transport panel. */
export function ProgressRing({
  progress,
  size = 96,
  thickness = 5,
  value,
  unit,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg className={styles.ringSvg} width={size} height={size} aria-hidden="true">
        <circle
          className={styles.ringTrack}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
        />
        <circle
          className={styles.ringIndicator}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </svg>
      <div className={styles.ringContent}>
        <span className={styles.ringValue}>{value}</span>
        {unit && <span className={styles.ringUnit}>{unit}</span>}
      </div>
    </div>
  );
}

import type { Clef } from '../reading.types';
import { Staff } from './Staff';
import type { SignatureMark, StaffMark } from './Staff';
import styles from './reading.module.css';

interface StaffSystemProps {
  /** The upper staff, and the lower one when a practice reads both. */
  staves: readonly { clef: Clef; marks: readonly StaffMark[] }[];
  signature?: readonly SignatureMark[];
  showAnchor?: boolean;
  label: string;
}

/**
 * One or two staves, stacked.
 *
 * A grand staff is not a different kind of drawing — it is two staves read at
 * the same moment — so this stacks the existing one rather than replacing it.
 * Keeping it a wrapper means the single-staff practices are unaffected by
 * anything the two-staff ones need.
 */
export function StaffSystem({ staves, signature, showAnchor, label }: StaffSystemProps) {
  return (
    <div className={styles.system} role="group" aria-label={label}>
      {staves.map((staff, index) => (
        <Staff
          key={`${staff.clef}-${index}`}
          clef={staff.clef}
          marks={staff.marks}
          signature={signature}
          showAnchor={showAnchor}
          label={`${staff.clef} staff`}
        />
      ))}
    </div>
  );
}

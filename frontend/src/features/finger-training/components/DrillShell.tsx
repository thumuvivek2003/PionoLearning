import type { ReactNode } from 'react';
import { Icon } from '@/components/ui';
import styles from './finger.module.css';

interface DrillShellProps {
  /** One line on what this drill is actually training. */
  goal: string;
  /** How to run it, in order. Kept short — this is read once, then ignored. */
  steps: readonly string[];
  /** The mistake this drill exists to catch. */
  watchFor?: string;
  /** The interactive part. */
  children: ReactNode;
  /** Settings and counters for the drill. */
  aside: ReactNode;
}

/**
 * The frame every finger drill shares: stage on the left, controls on the
 * right, guidance underneath. Uniform so the drills feel like one bucket
 * rather than six separate toys.
 */
export function DrillShell({ goal, steps, watchFor, children, aside }: DrillShellProps) {
  return (
    <div className={styles.drill}>
      <section className={styles.stage}>{children}</section>

      <aside className={styles.aside}>{aside}</aside>

      <section className={styles.guide}>
        <p className={styles.goal}>
          <Icon name="target" size={15} />
          {goal}
        </p>
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {watchFor && (
          <p className={styles.watch}>
            <strong>Watch for:</strong> {watchFor}
          </p>
        )}
      </section>
    </div>
  );
}

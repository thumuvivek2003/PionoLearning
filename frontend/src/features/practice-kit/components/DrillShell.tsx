import type { ReactNode } from 'react';
import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { PracticeClock } from './PracticeClock';
import styles from './kit.module.css';

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
 * The frame every practice screen shares: session clock on top, stage on the
 * left, controls on the right, guidance underneath.
 *
 * Uniform on purpose — a bucket of drills should feel like one thing, and a
 * learner should never have to work out where the Start button went. The clock
 * lives here rather than in each drill so every practice is timed the same way.
 */
export function DrillShell({ goal, steps, watchFor, children, aside }: DrillShellProps) {
  return (
    <div className={styles.frame}>
      <PracticeClock />

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
    </div>
  );
}

interface DrillPromptProps {
  /** Small line above the prompt, e.g. "RH · Which finger?". */
  label: ReactNode;
  /** The prompt itself — one glyph, or a word when `wide`. */
  children: ReactNode;
  /** Use the proportional face, for prompts that are words rather than glyphs. */
  wide?: boolean;
  /** Verdict or hint under the prompt. Reserves its line either way. */
  footer?: ReactNode;
}

/** The question, big enough to read from the piano bench. */
export function DrillPrompt({ label, children, wide = false, footer }: DrillPromptProps) {
  return (
    <div className={styles.promptRow}>
      <span className={styles.promptLabel}>{label}</span>
      <p className={cn(styles.prompt, wide && styles.promptWide)}>{children}</p>
      <span className={styles.promptFooter}>{footer}</span>
    </div>
  );
}

/** Side-by-side stage pieces — a diagram next to a ring, say. */
export function StageRow({ children }: { children: ReactNode }) {
  return <div className={styles.stageRow}>{children}</div>;
}

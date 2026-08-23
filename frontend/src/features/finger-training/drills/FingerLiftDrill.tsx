import { useMemo, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl } from '@/components/ui';
import { cn } from '@/lib/cn';
import { LIFT_ORDERS, fingerName, handShort, resolvePattern } from '../data/fingers';
import type { FingerNumber, Hand } from '../finger.types';
import { usePacedSequence } from '../hooks/usePacedSequence';
import type { PacedStep } from '../hooks/usePacedSequence';
import { DrillShell } from '../components/DrillShell';
import { HandDiagram } from '../components/HandDiagram';
import styles from '../components/finger.module.css';

const HANDS = [
  { value: 'right', label: 'Right hand' },
  { value: 'left', label: 'Left hand' },
] as const;

const SECONDS: readonly number[] = [0.5, 1, 1.5, 2];

interface LiftStep {
  phase: 'lift' | 'relax';
  finger: FingerNumber;
}

/**
 * 2.1.3 — lift one finger, hold, let go.
 *
 * Every lift is followed by a real relax step rather than running straight into
 * the next finger: the release is the half most people skip, and it is where
 * the tension they are trying to lose actually goes.
 */
export function FingerLiftDrill() {
  const [hand, setHand] = useState<Hand>('right');
  const [orderId, setOrderId] = useState<string>(LIFT_ORDERS[0]?.id ?? 'up');
  const [holdSeconds, setHoldSeconds] = useState(1);
  const [relaxSeconds, setRelaxSeconds] = useState(1);
  const [sequence, setSequence] = useState<readonly FingerNumber[]>(
    () => resolvePattern(LIFT_ORDERS[0] as (typeof LIFT_ORDERS)[number]),
  );

  const order = useMemo(
    () => LIFT_ORDERS.find((entry) => entry.id === orderId) ?? LIFT_ORDERS[0],
    [orderId],
  );

  const steps = useMemo<readonly PacedStep<LiftStep>[]>(
    () =>
      sequence.flatMap((finger) => [
        { value: { phase: 'lift' as const, finger }, ms: holdSeconds * 1000 },
        { value: { phase: 'relax' as const, finger }, ms: relaxSeconds * 1000 },
      ]),
    [holdSeconds, relaxSeconds, sequence],
  );

  const paced = usePacedSequence(steps, { loop: true });
  const current = paced.current;
  const lifting = current?.phase === 'lift';

  const start = () => {
    if (order) setSequence(resolvePattern(order));
    paced.start();
  };

  // Two steps per finger, so a pass is one trip through the order.
  const liftsDone = paced.cycles * sequence.length + Math.floor(paced.index / 2);

  return (
    <DrillShell
      goal="Lift one finger cleanly. Precision and release, not speed."
      steps={[
        'Rest all five fingertips on the keys or a table, hand loose.',
        'On LIFT, raise only the named finger and hold it there.',
        'On RELAX, put it down and let the whole hand go soft before the next one.',
      ]}
      watchFor="Neighbours rising with the lifted finger, and a wrist that creeps upward. Discovering that is the point — it is not a failed rep."
      aside={
        <>
          <Field label="Hand">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>

          <Field label="Order">
            <div className={styles.chipRow}>
              {LIFT_ORDERS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={cn(styles.choice, entry.id === orderId && styles.choiceActive)}
                  onClick={() => setOrderId(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Hold" hint="Seconds the finger stays up.">
            <div className={styles.chipRow}>
              {SECONDS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  className={cn(styles.choice, seconds === holdSeconds && styles.choiceActive)}
                  onClick={() => setHoldSeconds(seconds)}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </Field>

          <Field label="Relax" hint="Seconds between lifts.">
            <div className={styles.chipRow}>
              {SECONDS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  className={cn(styles.choice, seconds === relaxSeconds && styles.choiceActive)}
                  onClick={() => setRelaxSeconds(seconds)}
                >
                  {seconds}s
                </button>
              ))}
            </div>
          </Field>

          <div className={styles.transport}>
            <Button
              variant={paced.isRunning ? 'danger' : 'primary'}
              icon={paced.isRunning ? 'stop' : 'play'}
              onClick={paced.isRunning ? paced.stop : start}
              block
            >
              {paced.isRunning ? 'Stop' : 'Start'}
            </Button>
          </div>

          <div className={styles.scores}>
            <span className={styles.stat}>
              <span className={styles.statLabel}>Lifts</span>
              <span className={styles.statValue}>{liftsDone}</span>
            </span>
            <span className={styles.stat}>
              <span className={styles.statLabel}>Passes</span>
              <span className={styles.statValue}>{paced.cycles}</span>
            </span>
          </div>
        </>
      }
    >
      <div className={styles.promptRow}>
        <span className={styles.promptLabel}>
          {handShort(hand)} · {paced.isRunning ? (lifting ? 'Lift' : 'Relax') : 'Ready'}
        </span>
        <p className={styles.prompt}>
          {paced.isRunning ? (lifting ? current?.finger : '—') : '·'}
        </p>
        <span className={styles.verdictLine}>
          {paced.isRunning ? (
            lifting && current ? (
              <Chip tone="accent">{fingerName(current.finger)} up</Chip>
            ) : (
              <Chip tone="next">Let it go</Chip>
            )
          ) : (
            <Chip>Press start</Chip>
          )}
        </span>
      </div>

      <div className={styles.stageRow}>
        <HandDiagram
          hand={hand}
          highlight={paced.isRunning && lifting ? current?.finger ?? null : null}
          tone="accent"
          showNumbers
          size={220}
        />
        <ProgressRing
          progress={paced.isRunning ? paced.progress : 0}
          value={paced.isRunning ? paced.secondsLeft.toFixed(1) : '0.0'}
          unit={lifting ? 'hold' : 'relax'}
          size={104}
        />
      </div>
    </DrillShell>
  );
}

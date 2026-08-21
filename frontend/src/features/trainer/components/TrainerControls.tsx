import { useMemo } from 'react';
import { Button, Field, Input, SegmentedControl, Select } from '@/components/ui';
import { SESSION_TIMER_OPTIONS, TIMER_OPTIONS } from '@/lib/constants';
import type { Option } from '@/types/common.types';
import type { TrainerSetup } from '../hooks/useTrainerSetup';
import type { PracticeMode, TrainerModule } from '../types/trainer.types';
import styles from './trainer.module.css';

interface TrainerControlsProps {
  module: TrainerModule;
  setup: TrainerSetup;
  intervalSeconds: number;
  onIntervalChange: (seconds: number) => void;
  sessionSeconds: number;
  onSessionSecondsChange: (seconds: number) => void;
  mode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  /** Controls lock while a run is in progress. */
  disabled: boolean;
}

const MODE_OPTIONS: readonly Option<PracticeMode>[] = [
  { value: 'practice', label: 'Practice' },
  { value: 'test', label: 'Test' },
];

export function TrainerControls({
  module,
  setup,
  intervalSeconds,
  onIntervalChange,
  sessionSeconds,
  onSessionSecondsChange,
  mode,
  onModeChange,
  disabled,
}: TrainerControlsProps) {
  const timerOptions = useMemo<Option[]>(() => {
    const known = TIMER_OPTIONS.map((seconds) => ({
      value: String(seconds),
      label: `${seconds.toFixed(1)} sec`,
    }));
    // Keep a custom interval visible in the list rather than silently snapping.
    return TIMER_OPTIONS.includes(intervalSeconds)
      ? known
      : [...known, { value: String(intervalSeconds), label: `${intervalSeconds} sec (custom)` }];
  }, [intervalSeconds]);

  const sessionOptions = useMemo<Option[]>(() => {
    const label = (seconds: number) =>
      seconds === 0
        ? 'No limit'
        : seconds % 60 === 0
          ? `${seconds / 60} min`
          : `${seconds} sec`;
    const known = SESSION_TIMER_OPTIONS.map((seconds) => ({
      value: String(seconds),
      label: label(seconds),
    }));
    return SESSION_TIMER_OPTIONS.includes(sessionSeconds)
      ? known
      : [...known, { value: String(sessionSeconds), label: `${label(sessionSeconds)} (custom)` }];
  }, [sessionSeconds]);

  const parseError =
    setup.invalid.length > 0
      ? `Not recognised: ${setup.invalid.join(', ')}`
      : setup.items.length === 0
        ? 'Add at least one item to practise.'
        : undefined;

  return (
    <div className={styles.controls}>
      <Field label={module.presetLabel} htmlFor="preset">
        <Select
          id="preset"
          leadingIcon="crown"
          value={setup.presetId}
          options={setup.presetOptions}
          disabled={disabled}
          onChange={(event) => setup.selectPreset(event.target.value)}
        />
      </Field>

      <Field
        label={module.inputLabel}
        htmlFor="pool-input"
        hint={module.inputHint}
        error={parseError}
      >
        <div className={styles.inputRow}>
          <Input
            id="pool-input"
            mono
            invalid={setup.invalid.length > 0}
            value={setup.input}
            placeholder={module.inputPlaceholder}
            disabled={disabled}
            onChange={(event) => setup.setInput(event.target.value)}
          />
          {setup.isCustom && (
            <Button
              icon="reset"
              onClick={setup.restorePreset}
              disabled={disabled}
              aria-label="Restore the default set"
            />
          )}
        </div>
      </Field>

      <Field label="Time per note" htmlFor="interval">
        <Select
          id="interval"
          leadingIcon="clock"
          value={String(intervalSeconds)}
          options={timerOptions}
          onChange={(event) => onIntervalChange(Number(event.target.value))}
        />
      </Field>

      <Field label="Session timer" htmlFor="session-timer">
        <Select
          id="session-timer"
          leadingIcon="stats"
          value={String(sessionSeconds)}
          options={sessionOptions}
          disabled={disabled}
          onChange={(event) => onSessionSecondsChange(Number(event.target.value))}
        />
      </Field>

      <Field label="Play mode">
        <SegmentedControl
          value={mode}
          options={MODE_OPTIONS}
          onChange={onModeChange}
          ariaLabel="Play mode"
        />
      </Field>
    </div>
  );
}

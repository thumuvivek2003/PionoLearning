import { AppShell } from '@/components/layout';
import { Button, Card, Field, Input, Select, Toggle } from '@/components/ui';
import { KEYBOARD_LAYOUTS } from '@/features/piano';
import { STRATEGIES } from '@/features/randomizer';
import { useSettings } from '@/features/settings';
import { cn } from '@/lib/cn';
import {
  MAX_INTERVAL_SECONDS,
  MIN_INTERVAL_SECONDS,
  SESSION_TIMER_OPTIONS,
  TIMER_OPTIONS,
} from '@/lib/constants';
import { DEFAULT_MODULE_ID, listModules } from '@/modules/registry';
import type { AccentColor } from '@/types/common.types';
import styles from './pages.module.css';

const ACCENTS: readonly { id: AccentColor; color: string }[] = [
  { id: 'violet', color: '#8b5cf6' },
  { id: 'blue', color: '#3b82f6' },
  { id: 'emerald', color: '#10b981' },
  { id: 'amber', color: '#f59e0b' },
  { id: 'rose', color: '#f43f5e' },
];

export function SettingsPage() {
  const { settings, update, reset } = useSettings();

  return (
    <AppShell
      title="Settings"
      subtitle="Tune the trainer to the way you practise"
      activeModuleId={DEFAULT_MODULE_ID}
    >
      <div className={styles.settingsGrid}>
        <Card title="Practice">
          <div className={styles.stack}>
            <Field label="Time per item" hint="Start around 3 s, then work down to 1 s.">
              <Select
                leadingIcon="clock"
                value={String(settings.intervalSeconds)}
                options={[
                  ...TIMER_OPTIONS.map((seconds) => ({
                    value: String(seconds),
                    label: `${seconds.toFixed(1)} sec`,
                  })),
                  ...(TIMER_OPTIONS.includes(settings.intervalSeconds)
                    ? []
                    : [
                        {
                          value: String(settings.intervalSeconds),
                          label: `${settings.intervalSeconds} sec (custom)`,
                        },
                      ]),
                ]}
                onChange={(event) => update('intervalSeconds', Number(event.target.value))}
              />
            </Field>

            <Field
              label="Custom interval (seconds)"
              hint={`Anything from ${MIN_INTERVAL_SECONDS} to ${MAX_INTERVAL_SECONDS} seconds.`}
            >
              <Input
                type="number"
                min={MIN_INTERVAL_SECONDS}
                max={MAX_INTERVAL_SECONDS}
                step={0.1}
                value={settings.intervalSeconds}
                onChange={(event) => {
                  const seconds = Number(event.target.value);
                  if (Number.isFinite(seconds)) {
                    update(
                      'intervalSeconds',
                      Math.min(MAX_INTERVAL_SECONDS, Math.max(MIN_INTERVAL_SECONDS, seconds)),
                    );
                  }
                }}
              />
            </Field>

            <Field
              label="Session timer"
              hint="Auto-stops and saves the run when the time is up. Pause freezes it."
            >
              <Select
                leadingIcon="stats"
                value={String(settings.sessionSeconds)}
                options={[
                  ...SESSION_TIMER_OPTIONS.map((seconds) => ({
                    value: String(seconds),
                    label:
                      seconds === 0
                        ? 'No limit'
                        : seconds % 60 === 0
                          ? `${seconds / 60} min`
                          : `${seconds} sec`,
                  })),
                  ...(SESSION_TIMER_OPTIONS.includes(settings.sessionSeconds)
                    ? []
                    : [
                        {
                          value: String(settings.sessionSeconds),
                          label: `${settings.sessionSeconds} sec (custom)`,
                        },
                      ]),
                ]}
                onChange={(event) => update('sessionSeconds', Number(event.target.value))}
              />
            </Field>

            <Field
              label="Randomness"
              hint={STRATEGIES.find((s) => s.id === settings.strategyId)?.description}
            >
              <Select
                value={settings.strategyId}
                options={STRATEGIES.map((strategy) => ({
                  value: strategy.id,
                  label: strategy.name,
                }))}
                onChange={(event) => update('strategyId', event.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card title="Keyboard">
          <div className={styles.stack}>
            <Field label="Layout" hint="61 keys matches most home keyboards.">
              <Select
                leadingIcon="keyboard"
                value={settings.keyboardLayoutId}
                options={KEYBOARD_LAYOUTS.map((layout) => ({
                  value: layout.id,
                  label: layout.name,
                }))}
                onChange={(event) => update('keyboardLayoutId', event.target.value)}
              />
            </Field>

            <Toggle
              label="Show note names on keys"
              description="Turn off once you can read the 2–3 black-key pattern."
              checked={settings.showNoteNames}
              onChange={(value) => update('showNoteNames', value)}
            />
            <Toggle
              label="Highlight every octave"
              description="Single notes light up everywhere they appear. Chords always show one voicing."
              checked={settings.highlightAllOctaves}
              onChange={(value) => update('highlightAllOctaves', value)}
            />
            <Toggle
              label="Show the next item"
              description="Hiding it stops your eyes reading ahead of your hands."
              checked={settings.showNextItem}
              onChange={(value) => update('showNextItem', value)}
            />
            <div className={styles.divider} />

            <Toggle
              label="Colour the current key"
              description="The main highlight. Also switchable from the legend above the keyboard."
              checked={settings.highlightCurrent}
              onChange={(value) => update('highlightCurrent', value)}
            />
            <Toggle
              label="Colour the previous key"
              description="Shows what you just played. Off keeps the board clean."
              checked={settings.highlightPrevious}
              onChange={(value) => update('highlightPrevious', value)}
            />
            <Toggle
              label="Colour the next key"
              description="Lights the key coming up. Needs “Show the next item” on as well."
              checked={settings.highlightNext}
              onChange={(value) => update('highlightNext', value)}
            />

            <div className={styles.divider} />

            <Toggle
              label="Play sound"
              description="Hear each note or chord as it appears."
              checked={settings.soundEnabled}
              onChange={(value) => update('soundEnabled', value)}
            />
          </div>
        </Card>

        <Card title="Appearance">
          <div className={styles.stack}>
            <Toggle
              label="Dark theme"
              checked={settings.theme === 'dark'}
              onChange={(value) => update('theme', value ? 'dark' : 'light')}
            />

            <div className={styles.divider} />

            <Field label="Accent colour">
              <div className={styles.swatchRow}>
                {ACCENTS.map((accent) => (
                  <button
                    key={accent.id}
                    type="button"
                    aria-label={`${accent.id} accent`}
                    aria-pressed={settings.accent === accent.id}
                    className={cn(
                      styles.swatchButton,
                      settings.accent === accent.id && styles.swatchActive,
                    )}
                    style={{ background: accent.color }}
                    onClick={() => update('accent', accent.id)}
                  />
                ))}
              </div>
            </Field>

            <div className={styles.divider} />

            <Button variant="ghost" icon="reset" onClick={reset}>
              Reset all settings
            </Button>
          </div>
        </Card>

        {listModules().map((module) => (
          <Card key={module.id} title={`${module.title} — input format`}>
            <div className={styles.stack}>
              <p className={styles.tileHint}>{module.inputHint}</p>
              <div className={styles.exampleList}>
                {module.examples.map((example) => (
                  <span key={example}>{example}</span>
                ))}
              </div>
              <p className={styles.tileHint}>
                {module.presets.length} presets available in the {module.presetLabel.toLowerCase()}{' '}
                dropdown.
              </p>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

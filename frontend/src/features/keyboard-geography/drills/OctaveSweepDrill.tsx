import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  DrillPrompt,
  DrillShell,
  RunCounters,
  StepStrip,
  useTimedRun,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LANDMARK_RULES } from '../data/blackKeys';
import { LAYOUT_OPTIONS, WIDE_LAYOUT_ID } from '../data/layouts';
import { randomFrom } from '../data/naturals';
import { OCTAVE_HINT, keyLabel, keysOfLetter, repeatedLetters } from '../data/octaves';
import type { SweepDrillConfig, SweepPrompt } from '../data/octaveDrills';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LetterPicker } from '../components/LetterPicker';
import styles from '../components/geography.module.css';

/** Which way a sweep has to be walked. */
type SweepOrder = 'up' | 'down' | 'any';

/** Whether every pass sweeps the same letter, or a fresh one. */
type TargetMode = 'chosen' | 'random';

const ORDERS = [
  { value: 'up' as SweepOrder, label: 'Low → high' },
  { value: 'down' as SweepOrder, label: 'High → low' },
  { value: 'any' as SweepOrder, label: 'Any order' },
];

const TARGET_MODES = [
  { value: 'chosen' as TargetMode, label: 'One letter' },
  { value: 'random' as TargetMode, label: 'Mixed' },
];

const PROMPTS = [
  { value: 'name' as SweepPrompt, label: 'By name' },
  { value: 'key' as SweepPrompt, label: 'By lit key' },
];

/** The keys one pass has to collect, in the order that pass wants them. */
function passTargets(
  layout: KeyboardLayout,
  letter: Letter,
  order: SweepOrder,
  seedMidi: number | null,
): readonly PianoKey[] {
  // The lit reference is given, not found, so it is not one of the targets.
  const keys = keysOfLetter(layout, letter).filter((key) => key.midi !== seedMidi);
  return order === 'down' ? [...keys].reverse() : keys;
}

/**
 * 1.3.1, 1.3.2 and 1.3.4 — collect one letter across every octave.
 *
 * A chain drill, not a quiz: one pass is a single answer with as many steps as
 * the board has octaves, so it is timed as a whole and scored in stumbles. All
 * three configurations are the same sweep, opened at a different difficulty —
 * C alone, F mixed with C, and "whatever this lit key is" — and every screen
 * can be pushed to the next one from its own control panel.
 */
export function OctaveSweepDrill({ config }: { config: SweepDrillConfig }) {
  const [layoutId, setLayoutId] = useState(WIDE_LAYOUT_ID);
  const [order, setOrder] = useState<SweepOrder>('up');
  const [promptStyle, setPromptStyle] = useState<SweepPrompt>(config.prompt);
  // Named keys would answer a "which note is lit?" prompt outright.
  const [showNames, setShowNames] = useState(config.prompt === 'name');
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  /** Letters this drill may ask for, minus any the board does not repeat. */
  const choices = useMemo(
    () => repeatedLetters(layout, [...config.letters, ...(config.mixLetters ?? [])]),
    [config, layout],
  );

  const [targetMode, setTargetMode] = useState<TargetMode>(
    config.letters.length > 1 ? 'random' : 'chosen',
  );
  const [chosen, setChosen] = useState<Letter>(() => config.letters[0] ?? 'C');
  const [letter, setLetter] = useState<Letter>(() => config.letters[0] ?? 'C');
  /** The key handed over as the reference, when the prompt is a key. */
  const [seedMidi, setSeedMidi] = useState<number | null>(null);
  const [found, setFound] = useState<readonly number[]>([]);
  const [wrongMidi, setWrongMidi] = useState<number | null>(null);

  /** Deals the next pass: a letter to sweep, and a clean board. */
  const deal = useCallback(() => {
    const next = targetMode === 'random' && choices.length > 1 ? randomFrom(choices, letter) : chosen;
    const keys = keysOfLetter(layout, next);
    setLetter(next);
    setSeedMidi(
      promptStyle === 'key' ? (keys[Math.floor(Math.random() * keys.length)]?.midi ?? null) : null,
    );
    setFound([]);
    setWrongMidi(null);
  }, [choices, chosen, layout, letter, promptStyle, targetMode]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  // A wider board, another order or a different target is a different sweep —
  // deal it rather than leaving half a pass on screen.
  useEffect(() => {
    dealNow();
  }, [chosen, dealNow, layout, order, promptStyle, targetMode]);

  const targets = useMemo(
    () => passTargets(layout, letter, order, seedMidi),
    [layout, letter, order, seedMidi],
  );
  /** In a walked sweep the next key is fixed; in "any order" nothing is. */
  const expected = order === 'any' ? undefined : targets[found.length];
  const complete = targets.length > 0 && found.length === targets.length;
  const wrongKey = layout.keys.find((key) => key.midi === wrongMidi);
  const revealed = promptStyle === 'name' || complete;

  const press = (key: PianoKey) => {
    if (complete || key.isBlack) return;
    // The reference is there to be played, not answered — pressing it is free.
    if (key.midi === seedMidi) {
      if (settings.soundEnabled) instrument.playMidis([key.midi]);
      return;
    }
    if (found.includes(key.midi)) return;

    const rightKey = key.sharpName === letter;
    const inTurn = order === 'any' || expected?.midi === key.midi;
    if (!rightKey || !inTurn) {
      stumble();
      setWrongMidi(key.midi);
      window.setTimeout(() => setWrongMidi(null), 500);
      return;
    }

    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrongMidi(null);
    const next = [...found, key.midi];
    setFound(next);
    if (next.length === targets.length) finish();
  };

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          {choices.length > 1 && (
            <Field label="Target" hint="Mixed draws a fresh letter for every sweep.">
              <SegmentedControl
                value={targetMode}
                options={TARGET_MODES}
                onChange={setTargetMode}
                block
                ariaLabel="Target letter"
              />
              <LetterPicker
                value={chosen}
                onChange={setChosen}
                letters={choices}
                disabled={targetMode === 'random'}
                ariaLabel="Letter to sweep"
              />
            </Field>
          )}
          {config.letters.length > 1 && (
            <Field label="Prompt" hint="By lit key never names the note — you have to read it.">
              <SegmentedControl
                value={promptStyle}
                options={PROMPTS}
                onChange={setPromptStyle}
                block
                ariaLabel="Prompt style"
              />
            </Field>
          )}
          <Field label="Order" hint="Any order drops the walk and just asks for all of them.">
            <SegmentedControl
              value={order}
              options={ORDERS}
              onChange={setOrder}
              block
              ariaLabel="Sweep order"
            />
          </Field>
          <Field label="Keyboard" hint="A wider board is more octaves to sweep.">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill — the landmark has to place the key."
          />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New sweep
          </Button>
          <RunCounters stats={stats} runsLabel="Sweeps" />
        </>
      }
    >
      <DrillPrompt
        label={promptStyle === 'key' ? 'Same note, every other octave' : 'Find every'}
        footer={
          <>
            {complete && (
              <Chip tone="accent">
                Sweep complete
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!complete && wrongKey && <Chip tone="danger">{keyLabel(wrongKey)} is not it</Chip>}
            {!complete && !wrongKey && (
              <Chip>
                {found.length} of {targets.length} found
              </Chip>
            )}
          </>
        }
      >
        {revealed ? letter : '?'}
      </DrillPrompt>

      <StepStrip
        items={targets.map((key) => (found.includes(key.midi) ? String(key.octave) : '·'))}
        index={complete || order === 'any' ? -1 : found.length}
        wrong={wrongMidi !== null}
        label="Octaves in this sweep"
      />

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={seedMidi === null ? undefined : [seedMidi]}
          doneMidis={found}
          secondaryMidis={wrongMidi === null ? undefined : [wrongMidi]}
          showNames={showNames}
          onKeyPress={press}
          footerNote={
            promptStyle === 'key' ? 'Match the lit key in every octave' : `Press every ${letter}`
          }
        />
      </div>

      <p className={styles.landmark}>
        {revealed ? LANDMARK_RULES[letter].detail : OCTAVE_HINT}
      </p>
    </DrillShell>
  );
}

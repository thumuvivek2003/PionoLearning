import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  DrillPrompt,
  DrillShell,
  RunCounters,
  StepStrip,
  WeakSpots,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import {
  applySteps,
  formulaLabel,
  semitoneLabel,
  stepKeys,
  stepLabel,
  stepsForType,
} from '../data/steps';
import type { Step } from '../data/steps';
import type { FormulaDrillConfig, FormulaMode } from '../data/scaleDrills';
import { scaleShape } from '../data/scaleShapes';
import { scaleName } from '../data/relatives';
import type { KeyRef } from '../data/relatives';
import { ScaleKeyboard } from '../components/ScaleKeyboard';
import styles from '../components/scales.module.css';

const LAYOUT_ID = '49';
const MIXED = 'mixed';

/** A step worked out rather than known takes about this long. */
const TARGET_MS = 1800;

/**
 * 4.1.3 – 4.1.6 and 4.2.2 — the formula, recited and applied.
 *
 * A chain rather than a quiz: the answer is the whole scale, given a step at a
 * time, so it is timed end to end and scored per position. Two ways to give it —
 * tapping the steps, or playing the keys they produce — because knowing the
 * pattern and being able to use it are genuinely different, and most people can
 * do the first long before the second.
 *
 * The root moves every run once a practice stops fixing it, which is what stops
 * this becoming a scale you recognise rather than a formula you apply. Scores
 * are kept per position in the formula, so the panel can name the step you
 * always hesitate before — usually the third, where the first half step arrives
 * sooner than the hand expects.
 */
export function FormulaDrill({ config }: { config: FormulaDrillConfig }) {
  const [mode, setMode] = useState<FormulaMode | typeof MIXED>(
    config.modes.length > 1 ? MIXED : (config.modes[0] ?? 'steps'),
  );
  const [showCues, setShowCues] = useState(config.cues);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  // The key this run is in. A practice with a mix draws one per run, so the
  // scale can change between runs; everything else names it once up front.
  const [runKey, setRunKey] = useState<KeyRef | null>(config.mix?.[0] ?? null);
  const scale = (config.mix ? runKey?.scale : config.scale) ?? config.scale ?? 'major';
  const steps = useMemo(() => stepsForType(scale), [scale]);

  const [runMode, setRunMode] = useState<FormulaMode>(config.modes[0] ?? 'steps');
  const [root, setRoot] = useState<PianoKey | null>(null);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const stepAt = useRef<number | null>(null);

  /** Roots the board can carry a whole scale from. */
  const roots = useMemo(() => {
    // Roots are configured the way the key is spelled — Bb, not A# — so they
    // are matched by pitch rather than by name.
    const wanted = new Set(
      config.roots.flatMap((name) => {
        const shape = scaleShape(name);
        return shape ? [shape.pitchClasses[0]] : [];
      }),
    );
    return layout.keys.filter((key) => {
      if (wanted.size > 0 && !wanted.has(key.pitchClass)) return false;
      // The eighth note has to exist, or the formula has nowhere to land.
      const top = key.midi + 12;
      return layout.keys.some((entry) => entry.midi === top);
    });
  }, [config.roots, layout, scale]);

  /** Deals a run: a way of answering, and somewhere to start. */
  const deal = useCallback(() => {
    setRunMode(
      mode === MIXED
        ? ((config.modes[Math.floor(Math.random() * config.modes.length)] ?? 'steps') as FormulaMode)
        : (mode as FormulaMode),
    );
    const mix = config.mix;
    if (mix && mix.length > 0) {
      // Root and scale are drawn together, so the board key always belongs to
      // the key that was announced.
      const drawn = mix[Math.floor(Math.random() * mix.length)] as KeyRef;
      setRunKey(drawn);
      const pitch = scaleShape(drawn.root, drawn.scale)?.pitchClasses[0];
      const options = layout.keys.filter(
        (key) =>
          key.pitchClass === pitch && layout.keys.some((top) => top.midi === key.midi + 12),
      );
      setRoot(options[Math.floor(Math.random() * options.length)] ?? null);
    } else {
      setRoot((current) => {
        const options = roots.filter((key) => key.midi !== current?.midi);
        const from = options.length > 0 ? options : roots;
        return from[Math.floor(Math.random() * from.length)] ?? current;
      });
    }
    setIndex(0);
    setWrong(null);
    stepAt.current = performance.now();
  }, [config.mix, config.modes, layout, mode, roots]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, mode]);

  const midis = useMemo(
    () => (root ? applySteps(root.midi, steps) : []),
    [root, steps],
  );
  /** Playing means eight notes; reciting means seven steps. */
  const length = runMode === 'keys' ? midis.length : steps.length;
  const complete = length > 0 && index >= length;
  const expectedStep = steps[runMode === 'keys' ? index - 1 : index];
  const expectedMidi = midis[index];

  /** Scores are filed by position, so a weak step is named as one. */
  const scoreKey = (position: number) =>
    runMode === 'keys' && position === 0 ? 'the root' : `step ${runMode === 'keys' ? position : position + 1}`;

  const land = (correct: boolean, position: number) => {
    const now = performance.now();
    if (!correct) {
      stumble();
      record(scoreKey(position), false, null);
      return false;
    }
    begin();
    record(scoreKey(position), true, stepAt.current === null ? null : now - stepAt.current);
    stepAt.current = now;
    return true;
  };

  const tapStep = (step: Step) => {
    if (runMode !== 'steps' || complete) return;
    if (step !== expectedStep) {
      land(false, index);
      setWrong(step);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    land(true, index);
    setWrong(null);
    const next = index + 1;
    setIndex(next);
    if (next >= length) finish();
  };

  const press = (key: PianoKey) => {
    if (runMode !== 'keys' || complete) return;
    if (key.midi !== expectedMidi) {
      land(false, index);
      setWrong(key.sharpName);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    land(true, index);
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    const next = index + 1;
    setIndex(next);
    if (next >= length) finish();
  };

  /**
   * Note names taken from the key's own spelling.
   *
   * A run in Db major has to call its fourth Gb rather than F#; sharp names for
   * a flat key are the kind of small lie that makes the next bucket harder.
   * Roots the practice did not name fall back to the board's own labels.
   */
  const spelled = useMemo(() => {
    const named = config.mix
      ? runKey?.root
      : config.roots.find((name) => scaleShape(name, scale)?.pitchClasses[0] === root?.pitchClass);
    return named ? (scaleShape(named, scale)?.notes.map((note) => note.name) ?? []) : [];
  }, [config.mix, config.roots, root, runKey, scale]);

  const nameAt = (position: number, midi: number) =>
    spelled[position % 7] ?? layout.keys.find((key) => key.midi === midi)?.sharpName ?? '·';
  const rootName = spelled[0] ?? root?.sharpName ?? '?';

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const strip =
    runMode === 'keys'
      ? midis.map((midi, position) =>
          position < index
            ? nameAt(position, midi)
            : showCues && position === index && position > 0
              ? (steps[position - 1] ?? '·')
              : '·',
        )
      : steps.map((step, position) => (position < index ? step : '·'));

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          {config.modes.length > 1 && (
            <Field label="Answer with" hint="Mixed alternates between naming and playing.">
              <SegmentedControl
                value={mode}
                options={[
                  ...config.modes.map((entry) => ({
                    value: entry,
                    label: entry === 'steps' ? 'The steps' : 'The keys',
                  })),
                  { value: MIXED, label: 'Mixed' },
                ]}
                onChange={(value) => setMode(value as FormulaMode | typeof MIXED)}
                block
                ariaLabel="Answer style"
              />
            </Field>
          )}
          <Toggle
            checked={showCues}
            onChange={setShowCues}
            label="Show the next step"
            description="Off is the drill — the formula has to come from you."
          />
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New root
          </Button>
          <RunCounters stats={stats} runsLabel="Scales" />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — build a few scales." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          runMode === 'keys'
            ? config.mix && runKey
              ? `Play ${scaleName(runKey.root, runKey.scale)}`
              : `From ${rootName}`
            : 'Recite the formula',
          config.semitones ? semitoneLabel(steps) : formulaLabel(steps),
          showCues && expectedStep && !complete && runMode === 'keys'
            ? `${stepLabel(expectedStep)} · ${stepKeys(expectedStep)}`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {complete && (
              <Chip tone="accent">
                Scale complete
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!complete && wrong && <Chip tone="danger">{wrong} is not next</Chip>}
            {!complete && !wrong && (
              <Chip>
                {runMode === 'keys' && index === 0
                  ? 'Start on the root'
                  : `Step ${runMode === 'keys' ? index : index + 1} of 7`}
              </Chip>
            )}
          </>
        }
      >
        {complete
          ? '✓'
          : runMode === 'keys'
            ? rootName
            : `${index + 1}`}
      </DrillPrompt>

      <StepStrip
        items={strip}
        index={complete ? -1 : index}
        wrong={wrong !== null}
        label={runMode === 'keys' ? 'The scale' : 'The formula'}
      />

      {runMode === 'steps' ? (
        <div className={styles.steps}>
          {(['W', 'H'] as const).map((step) => (
            <button
              key={step}
              type="button"
              className={styles.step}
              disabled={complete}
              onClick={() => tapStep(step)}
            >
              {step}
              <span className={styles.stepSub}>{stepLabel(step)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.board}>
          <ScaleKeyboard
            layoutId={LAYOUT_ID}
            lit={root && index === 0 ? [root.midi] : undefined}
            done={midis.slice(0, index)}
            showNames={showNames || complete}
            onKeyPress={press}
            footerNote="Apply the formula, one step at a time"
          />
        </div>
      )}

      <p className={styles.note}>
        {formulaLabel(steps)} — {semitoneLabel(steps)} counted in keys. From any note at all, that
        is a {scale === 'major' ? 'major' : 'natural minor'} scale.
      </p>
    </DrillShell>
  );
}

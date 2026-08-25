import { useEffect, useMemo, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { toMidi } from '@/features/music-theory';
import {
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  WeakSpots,
  useQuizDrill,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { MAJOR, MINOR, scaleName } from '../data/relatives';
import { scaleShape } from '../data/scaleShapes';
import { applySteps, stepsForType } from '../data/steps';
import type { EarDrillConfig } from '../data/earDrills';
import { pairsOf } from '../data/earDrills';
import styles from '../components/scales.module.css';

const ALL = 'all';
/** Low enough to sound like a piano and high enough to stay clear. */
const OCTAVE = 4;
/** A scale slow enough to follow, quick enough to hold in the ear at once. */
const GAP_SECONDS = 0.34;
/** Hearing a key centre is not a reflex; this is a generous target. */
const TARGET_MS = 4000;

interface Prompt {
  id: string;
  /** The major of the pair — the minor is derived from it. */
  major: string;
  minor: string;
  /** Which of the two actually plays. */
  mode: typeof MAJOR | typeof MINOR;
}

/**
 * 4.6.1 — major against minor, decided by ear alone.
 *
 * The only drill in the level with nothing to look at. Everything else here can
 * be reasoned out; this one cannot, so the screen deliberately offers no
 * keyboard and no note names until the answer is in. What it plays is a
 * relative pair, which removes the last visual crutch: the two scales are the
 * same seven notes, so a right answer can only come from hearing where the line
 * rests.
 *
 * Scores are filed per scale rather than per pair, because the two halves fail
 * differently — most people hear the major and guess at the minor — and a
 * ledger that averaged them would hide it.
 */
export function EarModeDrill({ config }: { config: EarDrillConfig }) {
  const [pair, setPair] = useState<string>(ALL);
  const [focusWeak, setFocusWeak] = useState(true);
  const [settle, setSettle] = useState(config.settleOnTonic);
  const { settings } = useSettings();

  const pairs = useMemo(() => pairsOf(config), [config]);

  const pool = useMemo<readonly Prompt[]>(
    () =>
      pairs
        .filter((entry) => pair === ALL || entry.major === pair)
        .flatMap((entry) =>
          ([MAJOR, MINOR] as const).map((mode) => ({
            id: `${entry.major}-${mode}`,
            major: entry.major,
            minor: entry.minor,
            mode,
          })),
        ),
    [pair, pairs],
  );

  const answerOf = useMemo(() => (prompt: Prompt) => prompt.mode, []);
  /** Named as the scale itself, so a weak spot reads "E minor". */
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) =>
      prompt.mode === MAJOR ? `${prompt.major} major` : `${prompt.minor} minor`,
    [],
  );

  const drill = useQuizDrill<Prompt, string>({
    pool,
    answerOf,
    scoreKeyOf,
    strategyId: focusWeak ? 'weak-focus' : 'no-repeat',
  });
  const { question, verdict, stats } = drill;
  const settled = verdict !== 'waiting';

  /** The line the ear is given: the scale up, then home stated once more. */
  const line = useMemo(() => {
    const root = question.mode === MAJOR ? question.major : question.minor;
    const shape = scaleShape(root, question.mode);
    if (!shape) return [];
    const from = toMidi(shape.pitchClasses[0] ?? 0, OCTAVE);
    const run = applySteps(from, stepsForType(question.mode));
    return settle ? [...run, from] : run;
  }, [question, settle]);

  const heard = () => {
    if (!settings.soundEnabled) return;
    instrument.playSequence(line, GAP_SECONDS);
  };

  // A new question plays itself; there is nothing to read, so waiting for a
  // click would just add a step between every answer.
  useEffect(() => {
    if (!settings.soundEnabled) return;
    instrument.playSequence(line, GAP_SECONDS);
    return () => instrument.silence();
  }, [line, settings.soundEnabled]);

  const spots = weakSpots(drill.scores, { targetMs: TARGET_MS });
  const played = question.mode === MAJOR
    ? scaleName(question.major, MAJOR)
    : scaleName(question.minor, MINOR);

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Pairs" hint="One pair at a time until it is reliable, then all of them.">
            <SegmentedControl
              value={pair}
              options={[
                ...pairs.map((entry) => ({
                  value: entry.major,
                  label: `${entry.major} / ${entry.minor}m`,
                })),
                { value: ALL, label: 'All' },
              ]}
              onChange={setPair}
              block
              ariaLabel="Which relative pair"
            />
          </Field>
          <Toggle
            checked={settle}
            onChange={setSettle}
            label="Sound home twice"
            description="Repeats the tonic at the end. Off is harder, and closer to real listening."
          />
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Plays more often whichever scale you keep misnaming."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — listen to a few more." />
        </>
      }
    >
      <DrillPrompt
        label={settled ? `That was ${played}` : 'Major or minor?'}
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">Right</Chip>}
            {verdict === 'wrong' && <Chip tone="danger">It was {played}</Chip>}
            {!settled && settings.soundEnabled && (
              <Chip>Listen for the note it comes to rest on</Chip>
            )}
            {!settings.soundEnabled && (
              <Chip tone="danger">Turn sound on in settings — this practice is only sound</Chip>
            )}
          </>
        }
      >
        {settled ? (question.mode === MAJOR ? question.major : `${question.minor}m`) : '♪'}
      </DrillPrompt>

      <div className={styles.steps}>
        {(
          [
            { value: MAJOR, label: 'Major', sub: 'brighter, more settled' },
            { value: MINOR, label: 'Minor', sub: 'darker, more serious' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.step}
            disabled={settled || !settings.soundEnabled}
            onClick={() => drill.answer(option.value)}
          >
            {option.label}
            <span className={styles.stepSub}>{option.sub}</span>
          </button>
        ))}
      </div>

      <div className={styles.board}>
        <Button variant="secondary" icon="play" onClick={heard} disabled={!settings.soundEnabled} block>
          Play it again
        </Button>
      </div>

      <p className={styles.note}>
        Both scales in a pair are built from the same seven notes. What changes is which one the
        line calls home.
      </p>
    </DrillShell>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Cover, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import { getKeyboardLayout, whiteKeys, whiteStep } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  TimerBar,
  WeakSpots,
  useAnswerDeadline,
  useQuizDrill,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LANDMARK_RULES } from '../data/blackKeys';
import { LAYOUT_OPTIONS, SMALL_LAYOUT_ID } from '../data/layouts';
import { keyLabel } from '../data/octaves';
import {
  EMPTY_TALLY,
  biasNote,
  hitRate,
  judgeReach,
  meanError,
  missAdvice,
  missNote,
  recordReach,
} from '../data/reach';
import type { ReachTally } from '../data/reach';
import type { ReachDrillConfig, ReachTarget } from '../data/reachDrills';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import styles from '../components/geography.module.css';

/** How long the look lasts, per the reference's "about a second". */
const LOOKS = [
  { value: '1500', label: '1.5s' },
  { value: '1000', label: '1s' },
  { value: '500', label: '0.5s' },
];

/** Where a prompt is in its own little cycle. */
type Phase = 'look' | 'reach';

interface Prompt {
  id: string;
  target: PianoKey;
  kind: ReachTarget;
  /** Set for landmark prompts: the anchor and how far to step off it. */
  from?: PianoKey;
  steps?: number;
}

function buildPool(
  layout: KeyboardLayout,
  config: ReachDrillConfig,
  kind: ReachTarget,
): readonly Prompt[] {
  const whites = whiteKeys(layout);

  if (kind === 'landmark') {
    return whites.flatMap((from) => {
      if (!config.landmarks.includes(from.sharpName as Letter)) return [];
      return config.landmarkSteps.flatMap((steps) => {
        const target = whiteStep(layout, from, steps);
        return target ? [{ id: `l-${from.midi}-${steps}`, target, kind, from, steps }] : [];
      });
    });
  }

  // Any octave counts, so one prompt per letter; a named octave asks per key.
  if (kind === 'note') {
    const letters = [...new Set(whites.map((key) => key.sharpName))];
    return letters.flatMap((letter) => {
      const target = whites.find((key) => key.sharpName === letter);
      return target ? [{ id: `n-${letter}`, target, kind }] : [];
    });
  }

  return whites.map<Prompt>((target) => ({ id: `x-${target.midi}`, target, kind }));
}

/** What the prompt reads out. */
function promptText(prompt: Prompt): string {
  if (prompt.kind === 'landmark') {
    const steps = prompt.steps ?? 0;
    if (steps === 0) return `${prompt.from?.sharpName ?? '?'} itself`;
    return `${steps} white ${steps === 1 ? 'key' : 'keys'} right of ${prompt.from?.sharpName ?? '?'}`;
  }
  return prompt.kind === 'exact' ? keyLabel(prompt.target) : prompt.target.sharpName;
}

/**
 * 1.7.1, 1.7.3 – 1.7.6 — reaching for a key you cannot see.
 *
 * The cover is what makes this possible on a screen: it hides the board but
 * takes no presses, so your aim lands on whatever is really underneath and the
 * drill can measure the error rather than take your word for it. That turns the
 * bucket's own error list — one key out, right note wrong octave, wrong
 * landmark — into something the screen can name and act on.
 *
 * Accuracy is reported two ways on purpose: how far out you are (mean error)
 * and whether you are always out the same way (bias). A steady pull to one side
 * is a different problem from scatter, and the fixes are different too.
 */
export function BlindReachDrill({ config }: { config: ReachDrillConfig }) {
  const [layoutId, setLayoutId] = useState(SMALL_LAYOUT_ID);
  const [kind, setKind] = useState<ReachTarget>(config.targets[0] ?? 'note');
  const [look, setLook] = useState(LOOKS[0]?.value ?? '1500');
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const pool = useMemo(() => buildPool(layout, config, kind), [config, kind, layout]);

  const answerOf = useMemo(
    () => (prompt: Prompt) =>
      // A letter target accepts the letter anywhere; everything else is one key.
      prompt.kind === 'note' ? prompt.target.sharpName : `k${prompt.target.midi}`,
    [],
  );
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) =>
      prompt.kind === 'exact' ? keyLabel(prompt.target) : promptText(prompt),
    [],
  );

  const drill = useQuizDrill<Prompt, string>({
    pool,
    answerOf,
    scoreKeyOf,
    strategyId: focusWeak ? 'weak-focus' : 'no-repeat',
    repairReps: config.repairReps,
  });
  const { question, verdict, stats, repairsLeft } = drill;
  const settled = verdict !== 'waiting';

  const [phase, setPhase] = useState<Phase>(config.visibility === 'peek' ? 'look' : 'reach');
  const [landed, setLanded] = useState<PianoKey | null>(null);
  const [tally, setTally] = useState<ReachTally>(EMPTY_TALLY);

  // Every prompt starts its own cycle: a look if the drill grants one, then the
  // reach. Attempts count too, so a repair rep gets a fresh look.
  useEffect(() => {
    setPhase(config.visibility === 'peek' ? 'look' : 'reach');
    setLanded(null);
  }, [config.visibility, question.id, stats.asked]);

  const lookWindow = useAnswerDeadline({
    ms: config.visibility === 'peek' ? Number(look) : 0,
    active: phase === 'look' && !settled,
    resetKey: `${question.id}:${stats.asked}`,
    onExpire: useCallback(() => setPhase('reach'), []),
  });

  const press = useCallback(
    (key: PianoKey) => {
      if (settled) return;
      if (settings.soundEnabled) instrument.playMidis([key.midi]);
      setLanded(key);
      setTally((current) => recordReach(current, judgeReach(layout, question.target, key).semitones));
      drill.answer(question.kind === 'note' ? key.sharpName : `k${key.midi}`);
    },
    [drill, layout, question.kind, question.target, settings.soundEnabled, settled],
  );

  const result = landed ? judgeReach(layout, question.target, landed) : null;
  // A letter target is a hit in any octave, whatever the raw distance says.
  const hit = verdict === 'correct';
  const covered = config.visibility !== 'open' && phase === 'reach' && !settled;
  const spots = weakSpots(drill.scores);
  const setDone = stats.asked >= config.setSize;
  const rate = hitRate(tally);
  const passed = rate !== null && rate >= config.passRate;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          {config.visibility === 'peek' && (
            <Field label="Look" hint="Shorten it once the picture survives the cover.">
              <SegmentedControl
                value={look}
                options={LOOKS}
                onChange={setLook}
                block
                ariaLabel="Look window"
              />
            </Field>
          )}
          {config.targets.length > 1 && (
            <Field label="Target" hint="Named octave is the hardest level — C4, not any C.">
              <SegmentedControl
                value={kind}
                options={[
                  { value: 'note', label: 'Any octave' },
                  { value: 'exact', label: 'Named octave' },
                ]}
                onChange={(value) => setKind(value as ReachTarget)}
                block
                ariaLabel="Target style"
              />
            </Field>
          )}
          <Field label="Keyboard" hint="One octave first, then widen — that is levels 1 and 2.">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Calls the notes you keep missing more often."
          />
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Only worth it while the board is open."
          />
          <CounterRow>
            <Counter
              label="Set"
              value={`${Math.min(stats.asked, config.setSize)}/${config.setSize}`}
              hint={`${Math.round(config.passRate * 100)}% to pass`}
            />
            <Counter
              label="Mean error"
              value={meanError(tally) === null ? '—' : `${(meanError(tally) as number).toFixed(1)}`}
              hint="keys off target"
            />
            <Counter label="Aim" value={biasNote(tally)} hint={`worst ${tally.worst}`} />
          </CounterRow>
          <ScoreBoard stats={stats} onReset={() => {
            setTally(EMPTY_TALLY);
            drill.reset();
          }} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — keep reaching." />
        </>
      }
    >
      <DrillPrompt
        label={
          phase === 'look' && !settled
            ? 'Look at it — the board is about to cover'
            : config.visibility === 'open'
              ? 'Find and press'
              : 'Reach for it, covered'
        }
        wide={question.kind === 'landmark'}
        footer={
          <>
            {repairsLeft > 0 && (
              <Chip tone="danger">
                {repairsLeft} clean {repairsLeft === 1 ? 'reach' : 'reaches'} to clear this one
              </Chip>
            )}
            {hit && (
              <Chip tone="accent">
                {landed ? keyLabel(landed) : 'On it'}
                {tally.attempts > 1 && rate !== null ? ` · ${Math.round(rate * 100)}% landed` : ''}
              </Chip>
            )}
            {verdict === 'wrong' && result && landed && (
              <Chip tone="danger">{missNote(result, landed)}</Chip>
            )}
            {!settled && repairsLeft === 0 && (
              <Chip>{setDone ? (passed ? 'Set passed' : 'Set short — run it again') : 'One reach, one answer'}</Chip>
            )}
          </>
        }
      >
        {promptText(question)}
      </DrillPrompt>

      {config.visibility === 'peek' && phase === 'look' && !settled && (
        <TimerBar
          progress={lookWindow.progress}
          remainingMs={lookWindow.remainingMs}
          label="Cover drops in"
        />
      )}

      <div className={styles.keyboard}>
        <Cover covered={covered} note="Covered — reach from memory">
          <GeographyKeyboard
            layoutId={layoutId}
            // The target is only ever shown during the look, or on the way back
            // to check: never while the hand is choosing.
            litMidis={
              (phase === 'look' && !settled) || settled ? [question.target.midi] : undefined
            }
            secondaryMidis={verdict === 'wrong' && landed ? [landed.midi] : undefined}
            showNames={showNames || settled}
            onKeyPress={press}
            footerNote={covered ? 'Aim, then press' : 'Target lit — this is your look'}
          />
        </Cover>
      </div>

      <p className={styles.landmark}>
        {verdict === 'wrong' && result?.reason
          ? missAdvice(result.reason)
          : question.kind === 'landmark' && question.from
            ? LANDMARK_RULES[question.from.sharpName as Letter].detail
            : 'Anchor on a black-key group before you move — it is the only thing you can find covered.'}
      </p>

      {setDone && (
        <Button variant="primary" icon="reset" onClick={() => {
          setTally(EMPTY_TALLY);
          drill.reset();
        }}>
          {passed ? 'Set passed — go again' : 'Run the set again'}
        </Button>
      )}
    </DrillShell>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { buildScaleFrom } from '@/features/music-theory';
import type { PitchClass } from '@/features/music-theory';
import { voicePitchClasses } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
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
import type { ChordForm, ChordQuality, Inversion } from '../chords.types';
import { THIRD_AT, chordForm, qualityName } from '../data/triads';
import { inversionName, inversionShort, patternOf, playable, voicingOf } from '../data/inversions';
import { familyOf, numeralsOf } from '../data/diatonic';

/** One line on what separates each quality from the others. */
const FORMULA_HINTS: Readonly<Record<string, string>> = {
  major: '1 - 3 - 5',
  minor: '1 - ♭3 - 5',
  maj7: '1 - 3 - 5 - 7',
  dom7: '1 - 3 - 5 - ♭7',
  min7: '1 - ♭3 - 5 - ♭7',
};
import type { TriadQuizConfig, TriadTask } from '../data/quizDrills';
import { isHeard, isPressed } from '../data/quizDrills';
import { ChordKeyboard } from '../components/ChordKeyboard';
import styles from '../components/chords.module.css';

const LAYOUT_ID = '25';
const MIXED = 'mixed';
/** Recognition, not calculation: past this it was worked out. */
const TARGET_MS = 1500;

const TASK_LABELS: Readonly<Record<TriadTask, string>> = {
  degree: 'Find the degree',
  'degree-name': 'Name the degree',
  'quality-seen': 'Seen',
  'quality-heard': 'Heard',
  third: 'Find the third',
  root: 'Find the root',
  'name-chord': 'Name it',
  'name-heard': 'Name what you hear',
  inversion: 'Which position',
  'numeral-root': 'Numeral to chord',
  'numeral-name': 'Chord to numeral',
};

interface Prompt {
  id: string;
  task: TriadTask;
  /** For the chord tasks: the chord in question. */
  triad?: ChordForm;
  /** For the chord tasks: which position it is shown in. */
  inversion?: Inversion;
  /** For the degree and numeral tasks: the key, and which degree of it. */
  scaleRoot?: string;
  degree?: number;
  /** For the numeral tasks: the numeral in question. */
  numeral?: string;
}

const keyAnswer = (pitchClass: PitchClass) => `k${pitchClass}`;
const countAnswer = (count: number) => `n${count}`;

/** Three plausible wrong names, with the same-root opposite quality first. */
function nameChoices(triad: ChordForm, pool: readonly ChordForm[]): readonly ChordForm[] {
  const opposite = chordForm(triad.root, triad.quality === 'major' ? 'minor' : 'major');
  const taken = new Set([triad.id, opposite?.id]);
  const others = pool.filter((entry) => !taken.has(entry.id)).slice(0, 2);
  const options = [triad, ...(opposite ? [opposite] : []), ...others];
  return [...options].sort((a, b) => a.id.localeCompare(b.id));
}

function buildPool(config: TriadQuizConfig, task: string): readonly Prompt[] {
  const wanted = task === MIXED ? config.tasks : config.tasks.filter((entry) => entry === task);
  const prompts: Prompt[] = [];

  for (const entry of wanted) {
    if (entry === 'degree' || entry === 'degree-name') {
      for (const scaleRoot of config.scaleRoots) {
        for (let degree = 1; degree <= 7; degree += 1) {
          prompts.push({ id: `${entry}-${scaleRoot}-${degree}`, task: entry, scaleRoot, degree });
        }
      }
      continue;
    }
    if (entry === 'numeral-root' || entry === 'numeral-name') {
      for (const scaleRoot of config.scaleRoots) {
        // Every degree of every key in play, so the ledger can name the one
        // numeral you cannot resolve rather than reporting the key.
        for (const degree of familyOf(scaleRoot)) {
          prompts.push({
            id: `${entry}-${scaleRoot}-${degree.numeral}`,
            task: entry,
            scaleRoot,
            degree: degree.degree,
            numeral: degree.numeral,
            triad: degree.form,
          });
        }
      }
      continue;
    }
    for (const root of config.roots) {
      for (const quality of config.qualities) {
        const triad = chordForm(root, quality as ChordQuality);
        if (!triad) continue;
        // One prompt per position, so the ledger can name the inversion you
        // keep misreading rather than averaging the chord across all of them.
        for (const inversion of playable(triad, config.inversions ?? [0])) {
          prompts.push({ id: `${entry}-${triad.id}-${inversion}`, task: entry, triad, inversion });
        }
      }
    }
  }

  return prompts;
}

/**
 * 5.1.3, 5.1.6 and 5.1.8 — the chord recognised rather than built.
 *
 * Building and naming are different skills and the second lags badly: a chord
 * can be constructible from the formula for weeks and still not be recognisable
 * on sight. So these run the arrow backwards — a chord is shown or sounded, and
 * what comes back is a degree, a quality, a root or a name.
 *
 * Every task lands in one answer space (a key pressed, a number, a quality, a
 * chord id), which is what lets one pool hold all of them and mixed mode come
 * free. Scores are filed under what was being recognised, so "the root is fine
 * and the quality is not" is a thing the panel can actually say.
 */
export function TriadQuizDrill({ config }: { config: TriadQuizConfig }) {
  const [task, setTask] = useState<string>(config.tasks[0] ?? MIXED);
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const pool = useMemo(() => buildPool(config, task), [config, task]);
  const allTriads = useMemo(
    () =>
      config.roots.flatMap((root) =>
        config.qualities.flatMap((quality) => {
          const form = chordForm(root, quality);
          return form ? [form] : [];
        }),
      ),
    [config.qualities, config.roots],
  );

  const answerOf = useMemo(
    () => (prompt: Prompt) => {
      if (prompt.task === 'degree' || prompt.task === 'degree-name') {
        const scale = buildScaleFrom(prompt.scaleRoot ?? 'C', 'major');
        const pitch = scale?.notes[(prompt.degree ?? 1) - 1]?.pitchClass ?? 0;
        return prompt.task === 'degree' ? keyAnswer(pitch as PitchClass) : countAnswer(prompt.degree ?? 1);
      }
      if (!prompt.triad) return '';
      if (prompt.task === 'quality-seen' || prompt.task === 'quality-heard') return prompt.triad.quality;
      if (prompt.task === 'numeral-name') return `r${prompt.numeral ?? ''}`;
      if (prompt.task === 'name-chord' || prompt.task === 'name-heard') return prompt.triad.id;
      if (prompt.task === 'inversion') return `i${prompt.inversion ?? 0}`;
      if (prompt.task === 'numeral-root') {
        return keyAnswer((prompt.triad.pitchClasses[0] ?? 0) as PitchClass);
      }
      const at = prompt.task === 'third' ? THIRD_AT : 0;
      return keyAnswer((prompt.triad.pitchClasses[at] ?? 0) as PitchClass);
    },
    [],
  );

  /** Filed under what was being recognised, not under the chord it came from. */
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) => {
      if (prompt.task === 'degree') return `${prompt.scaleRoot} degree ${prompt.degree}`;
      if (prompt.task === 'degree-name') return `naming degree ${prompt.degree}`;
      if (prompt.task === 'quality-heard') return `${prompt.triad?.quality ?? ''} by ear`;
      if (prompt.task === 'quality-seen') return `${prompt.triad?.quality ?? ''} on sight`;
      if (prompt.task === 'third') return `${prompt.triad?.label ?? ''} third`;
      if (prompt.task === 'root') return `${prompt.triad?.label ?? ''} root`;
      if (prompt.task === 'inversion') return `${inversionName((prompt.inversion ?? 0) as Inversion)}`;
      if (prompt.task === 'numeral-root' || prompt.task === 'numeral-name') {
        return `${prompt.numeral} in ${prompt.scaleRoot}`;
      }
      if (prompt.task === 'name-heard') return `${prompt.triad?.symbol ?? ''} by ear`;
      return (config.inversions?.length ?? 0) > 1
        ? `${prompt.triad?.symbol ?? ''} ${inversionShort((prompt.inversion ?? 0) as Inversion)}`
        : (prompt.triad?.label ?? '');
    },
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

  const voiced = useMemo(
    () =>
      question.triad
        ? voicingOf(question.triad, (question.inversion ?? 0) as Inversion).midis
        : [],
    [question.inversion, question.triad],
  );

  const heard = isHeard(question.task);
  // A heard question plays itself; there is nothing on screen to read.
  useEffect(() => {
    if (!heard || !settings.soundEnabled || voiced.length === 0) return;
    instrument.playMidis(voiced);
  }, [heard, settings.soundEnabled, voiced]);

  const deadline = useAnswerDeadline({
    ms: config.allowanceMs,
    active: !settled,
    resetKey: `${question.id}:${stats.asked}`,
    onExpire: drill.timeout,
  });

  const press = (key: PianoKey) => {
    if (!isPressed(question.task)) return;
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    drill.answer(keyAnswer(key.pitchClass));
  };

  const spots = weakSpots(drill.scores, { targetMs: TARGET_MS });
  const scale = question.scaleRoot ? buildScaleFrom(question.scaleRoot, 'major') : null;

  const buttons: readonly { value: string; label: string; sub: string }[] =
    question.task === 'quality-seen' || question.task === 'quality-heard'
      ? // Offered from the practice's own list, so 5.5 can ask maj7 against 7
        // against m7 with the same engine that asks major against minor.
        config.qualities.map((entry) => ({
          value: entry,
          label: qualityName(entry),
          sub: FORMULA_HINTS[entry] ?? '',
        }))
      : question.task === 'numeral-name'
        ? numeralsOf(question.scaleRoot ?? 'C').map((entry) => ({
            value: `r${entry}`,
            label: entry,
            sub: entry === entry.toUpperCase() ? 'major' : entry.includes('°') ? 'diminished' : 'minor',
          }))
      : question.task === 'inversion' && question.triad
        ? playable(question.triad, config.inversions ?? [0]).map((entry) => ({
            value: `i${entry}`,
            label: inversionName(entry),
            sub: patternOf(question.triad!, entry),
          }))
      : (question.task === 'name-chord' || question.task === 'name-heard') && question.triad
        ? nameChoices(question.triad, allTriads).map((entry) => ({
            value: entry.id,
            label: entry.symbol,
            sub: entry.label,
          }))
        : question.task === 'degree-name'
          ? [1, 2, 3, 4, 5, 6, 7].map((degree) => ({
              value: countAnswer(degree),
              label: String(degree),
              sub: 'degree',
            }))
          : [];

  /** The single key a degree question is about, voiced onto the board. */
  const degreeMidi = useMemo(() => {
    const pitch = scale?.notes[(question.degree ?? 1) - 1]?.pitchClass;
    return pitch === undefined ? null : (voicePitchClasses([pitch], 60)[0] ?? null);
  }, [question.degree, scale]);

  /**
   * What the board shows.
   *
   * A "find the degree" question must show nothing until it is answered — the
   * whole task is locating the key — while "name the degree" has to light the
   * key it is asking about. Chord questions light the chord.
   */
  const lit = ((): readonly number[] | undefined => {
    if (heard) return undefined;
    if (question.task === 'degree') return settled && degreeMidi !== null ? [degreeMidi] : undefined;
    if (question.task === 'degree-name') return degreeMidi === null ? undefined : [degreeMidi];
    return voiced;
  })();

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          {config.tasks.length > 1 && (
            <Field label="Ask" hint="Mixed keeps every way of asking in play.">
              <SegmentedControl
                value={task}
                options={[
                  ...config.tasks.map((entry) => ({ value: entry, label: TASK_LABELS[entry] })),
                  { value: MIXED, label: 'Mixed' },
                ]}
                onChange={setTask}
                block
                ariaLabel="Question type"
              />
            </Field>
          )}
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Asks more often for whatever you are slowest on."
          />
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more answers." />
        </>
      }
    >
      <DrillPrompt
        label={
          question.task === 'degree'
            ? `Degree ${question.degree} of ${question.scaleRoot} major`
            : question.task === 'degree-name'
              ? `Which degree of ${question.scaleRoot} major is this?`
              : question.task === 'quality-heard'
                ? 'Major or minor?'
                : question.task === 'quality-seen'
                  ? 'This chord — major or minor?'
                  : question.task === 'third'
                    ? 'Press the note that decides the quality'
                    : question.task === 'root'
                      ? 'Press the note this chord is built on'
                      : question.task === 'inversion'
                        ? 'Which position is this chord in?'
                        : question.task === 'name-heard'
                          ? 'Name the chord you just heard'
                          : question.task === 'numeral-root'
                            ? `${question.numeral} in ${question.scaleRoot} major — press its root`
                            : question.task === 'numeral-name'
                              ? `Which numeral is this in ${question.scaleRoot} major?`
                              : 'Which chord is this?'
        }
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">Right</Chip>}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {deadline.expired
                  ? 'Out of time — that counts as a miss'
                  : question.triad
                    ? `It is ${question.triad.label}`
                    : 'Not that one'}
              </Chip>
            )}
            {!settled && !heard && question.triad && (
              <Chip>
                {question.task === 'inversion'
                  ? 'The lowest note says which position it is'
                  : (config.inversions?.length ?? 0) > 1
                    ? 'The root is not always at the bottom'
                    : 'The third is the second note from the bottom'}
              </Chip>
            )}
            {!settled && heard && !settings.soundEnabled && (
              <Chip tone="danger">Turn sound on in settings — this question is only sound</Chip>
            )}
          </>
        }
      >
        {heard ? '♪' : question.task === 'degree' ? question.degree : settled && question.triad ? question.triad.symbol : '?'}
      </DrillPrompt>

      {config.allowanceMs > 0 && !settled && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="Answer in" />
      )}

      {buttons.length > 0 && (
        <div className={styles.steps}>
          {buttons.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.step}
              disabled={settled}
              onClick={() => drill.answer(option.value)}
            >
              {option.label}
              <span className={styles.stepSub}>{option.sub}</span>
            </button>
          ))}
        </div>
      )}

      {!heard && (
        <div className={styles.board}>
          <ChordKeyboard
            layoutId={LAYOUT_ID}
            lit={lit}
            secondary={settled && question.triad ? voiced : undefined}
            showNames={showNames || settled}
            onKeyPress={press}
            footerNote={buttons.length > 0 ? 'Answer below' : 'Press the key you were asked for'}
          />
        </div>
      )}

      <p className={styles.note}>
        Root, third, fifth. Only the third tells you whether a chord is major or minor.
      </p>
    </DrillShell>
  );
}

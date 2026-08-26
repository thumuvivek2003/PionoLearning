import { useEffect, useMemo, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { PitchClass } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
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
import type { ChordForm, ChordQuality, Inversion } from '../chords.types';
import { chordForm, qualityName } from '../data/triads';
import { chordFor } from '../data/diatonic';
import { inversionName, playable, voicingOf } from '../data/inversions';
import type { ChordEarConfig, EarTask } from '../data/earDrills';
import { pressesKey } from '../data/earDrills';
import { ChordKeyboard } from '../components/ChordKeyboard';
import styles from '../components/chords.module.css';

const LAYOUT_ID = '25';
const MIXED = 'mixed';
/** Hearing a chord is not a reflex; this is a generous target. */
const TARGET_MS = 4000;
/** How quickly an arpeggio rises, when a practice asks for one. */
const ARPEGGIO_GAP = 0.28;

const TASK_LABELS: Readonly<Record<EarTask, string>> = {
  quality: 'Quality',
  root: 'Root',
  bass: 'Bass note',
  position: 'Position',
  function: 'Function',
};

interface Prompt {
  id: string;
  task: EarTask;
  form: ChordForm;
  inversion: Inversion;
  /** For the function task: which numeral this chord is in the key. */
  numeral?: string;
}

const keyAnswer = (pitchClass: PitchClass) => `k${pitchClass}`;

function buildPool(config: ChordEarConfig, task: string): readonly Prompt[] {
  const wanted = task === MIXED ? config.tasks : config.tasks.filter((entry) => entry === task);
  const prompts: Prompt[] = [];

  for (const entry of wanted) {
    if (entry === 'function') {
      for (const numeral of config.numerals ?? []) {
        const chord = chordFor(config.key ?? 'C', numeral);
        if (!chord) continue;
        prompts.push({ id: `${entry}-${numeral}`, task: entry, form: chord.form, inversion: 0, numeral });
      }
      continue;
    }
    for (const root of config.roots) {
      for (const quality of config.qualities) {
        const form = chordForm(root, quality as ChordQuality);
        if (!form) continue;
        for (const inversion of playable(form, config.inversions ?? [0])) {
          prompts.push({ id: `${entry}-${form.id}-${inversion}`, task: entry, form, inversion });
        }
      }
    }
  }

  return prompts;
}

/**
 * 5.9 — chords identified by ear.
 *
 * Its own engine rather than a mode of the seen-chord quiz, because the
 * interaction differs in kind: nothing is drawn until the answer is in, the
 * sound can be replayed, and one practice deliberately makes you wait before
 * answering so the pitch has to be held rather than matched.
 *
 * The questions are the same ones asked of a printed chord — quality, root,
 * bass, position, function — which is the point of the bucket: the seen answer
 * and the heard answer should eventually agree, and where they do not, the ear
 * is the half to practise. Scores are filed per question, so "quality is fine
 * and position is not" is a thing the panel can say.
 */
export function ChordEarDrill({ config }: { config: ChordEarConfig }) {
  const [task, setTask] = useState<string>(config.tasks.length > 1 ? MIXED : (config.tasks[0] ?? MIXED));
  const [focusWeak, setFocusWeak] = useState(true);
  const [arpeggio, setArpeggio] = useState(config.arpeggio);
  const { settings } = useSettings();

  const pool = useMemo(() => buildPool(config, task), [config, task]);

  const answerOf = useMemo(
    () => (prompt: Prompt) => {
      const voicing = voicingOf(prompt.form, prompt.inversion);
      if (prompt.task === 'quality') return prompt.form.quality;
      if (prompt.task === 'position') return `i${prompt.inversion}`;
      if (prompt.task === 'function') return `r${prompt.numeral ?? ''}`;
      if (prompt.task === 'bass') {
        return keyAnswer(((voicing.midis[0] ?? 60) % 12) as PitchClass);
      }
      return keyAnswer((prompt.form.pitchClasses[0] ?? 0) as PitchClass);
    },
    [],
  );

  /** Filed per question, so the weak half of your hearing is named. */
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) => {
      if (prompt.task === 'quality') return `${qualityName(prompt.form.quality)} by ear`;
      if (prompt.task === 'position') return `${inversionName(prompt.inversion)} by ear`;
      if (prompt.task === 'function') return `${prompt.numeral} by ear`;
      if (prompt.task === 'bass') return `bass of ${prompt.form.symbol}`;
      return `root of ${prompt.form.symbol}`;
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

  const voicing = useMemo(
    () => voicingOf(question.form, question.inversion),
    [question.form, question.inversion],
  );

  /** True while the answer is held back, so the chord must be remembered. */
  const [waiting, setWaiting] = useState(config.delayMs > 0);

  /** The key's I chord, sounded first so a function question has a context. */
  const tonic = useMemo(() => {
    if (question.task !== 'function') return null;
    const home = chordFor(config.key ?? 'C', 'I');
    return home ? voicingOf(home.form, 0).midis : null;
  }, [config.key, question.task]);

  const sound = () => {
    if (!settings.soundEnabled) return;
    if (arpeggio) {
      instrument.playSequence(voicing.midis, ARPEGGIO_GAP);
      return;
    }
    // A function question needs its key established before the chord lands.
    if (tonic) {
      instrument.playMidis(tonic);
      window.setTimeout(() => instrument.playMidis(voicing.midis), 900);
      return;
    }
    instrument.playMidis(voicing.midis);
  };

  // A new prompt plays itself; there is nothing on screen to read.
  useEffect(() => {
    setWaiting(config.delayMs > 0);
    if (!settings.soundEnabled) return;
    sound();
    if (config.delayMs > 0) {
      const timer = window.setTimeout(() => setWaiting(false), config.delayMs);
      return () => window.clearTimeout(timer);
    }
    return undefined;
    // Replayed when the prompt changes, which is what a new question is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, stats.asked, settings.soundEnabled]);

  const press = (key: PianoKey) => {
    if (!pressesKey(question.task) || waiting) return;
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    drill.answer(keyAnswer(key.pitchClass));
  };

  const spots = weakSpots(drill.scores, { targetMs: TARGET_MS });

  const buttons: readonly { value: string; label: string; sub: string }[] =
    question.task === 'quality'
      ? config.qualities.map((entry) => ({
          value: entry,
          label: qualityName(entry),
          sub: entry === 'major' ? 'a major third' : entry === 'minor' ? 'a minor third' : 'four notes, unresolved',
        }))
      : question.task === 'position'
        ? playable(question.form, config.inversions ?? [0]).map((entry) => ({
            value: `i${entry}`,
            label: inversionName(entry),
            sub: entry === 0 ? 'the root at the bottom' : entry === 1 ? 'the third at the bottom' : 'the fifth at the bottom',
          }))
        : question.task === 'function'
          ? (config.numerals ?? []).map((numeral) => ({
              value: `r${numeral}`,
              label: numeral,
              sub: numeral === 'I' ? 'home' : numeral === 'IV' ? 'away' : 'tension',
            }))
          : [];

  const answering = buttons.length > 0;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          {config.tasks.length > 1 && (
            <Field label="Ask" hint="Mixed is the drill; one at a time is the practice.">
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
            checked={arpeggio}
            onChange={setArpeggio}
            label="Play it as a line"
            description="One note at a time makes the bass unmistakable. Off is harder and more musical."
          />
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Plays more often whichever question you keep missing."
          />
          <Button variant="secondary" icon="play" onClick={sound} disabled={!settings.soundEnabled} block>
            Play it again
          </Button>
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — listen to a few more." />
        </>
      }
    >
      <DrillPrompt
        label={
          waiting
            ? 'Hold the sound — the answer opens in a moment'
            : question.task === 'quality'
              ? 'What quality was that?'
              : question.task === 'root'
                ? 'Press the note it was built on'
                : question.task === 'bass'
                  ? 'Press the lowest note you heard'
                  : question.task === 'position'
                    ? 'Which position was it in?'
                    : `Was that I, IV or V in ${config.key} major?`
        }
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">Right</Chip>}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {question.form.symbol} · {voicing.notes[0]?.name} bass · {inversionName(question.inversion)}
              </Chip>
            )}
            {!settled && !waiting && settings.soundEnabled && (
              <Chip>
                {question.task === 'quality'
                  ? 'Listen to the third, not the mood'
                  : question.task === 'bass'
                    ? 'The lowest note is not always the root'
                    : question.task === 'function'
                      ? 'Home sounded first — this one is heard against it'
                      : 'Nothing is shown until you answer'}
              </Chip>
            )}
            {!settings.soundEnabled && (
              <Chip tone="danger">Turn sound on in settings — this practice is only sound</Chip>
            )}
          </>
        }
      >
        {settled ? question.form.symbol : waiting ? '…' : '♪'}
      </DrillPrompt>

      {answering ? (
        <div className={styles.steps}>
          {buttons.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.step}
              disabled={settled || waiting || !settings.soundEnabled}
              onClick={() => drill.answer(option.value)}
            >
              {option.label}
              <span className={styles.stepSub}>{option.sub}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.board}>
          <ChordKeyboard
            layoutId={LAYOUT_ID}
            lit={settled ? voicing.midis : undefined}
            showNames={settled}
            onKeyPress={press}
            footerNote={waiting ? 'Wait for it' : 'Press the key you were asked for'}
          />
        </div>
      )}

      <p className={styles.note}>
        Root is which chord it is. Bass is what is at the bottom. In an inversion they are different
        notes, and hearing which is which is the skill.
      </p>
    </DrillShell>
  );
}

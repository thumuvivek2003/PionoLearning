import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl } from '@/components/ui';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  EMPTY_TIMING,
  ON_BEAT_MS,
  WeakSpots,
  beatMs,
  evenness,
  formatMs,
  meanTiming,
  onBeatRate,
  percent,
  recordTiming,
  timingBias,
  timingNote,
  useMetronome,
  useScoreBook,
  weakSpots,
} from '@/features/practice-kit';
import type { TimingTally } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { beatsOf, countLabel, valueSpec } from '../data/noteValues';
import { JUDGEMENTS, JUDGEMENT_LABELS, judgementOf } from '../data/accuracyDrills';
import type { AccuracyDrillConfig, Judgement } from '../data/accuracyDrills';
import { BeatBar } from '../components/BeatBar';
import { Keyboard } from '../components/Keyboard';
import styles from '../components/rhythm.module.css';

const LAYOUT_ID = '25';
const BEATS_PER_BAR = 4;
const CLICK_MIDI = 84;

/** A press this far from a note's due time is that note. */
const CLAIM_MS = 450;

/** Beats of counting before an entry practice expects you in. */
const ENTRY_BAR = 4;

/**
 * 3.6.1 – 3.6.8 — accuracy, asked one question at a time.
 *
 * The bucket is not more playing but more *looking*: the same line examined for
 * placement, for spacing, for the entry, for the ending, and for what happens
 * after a mistake. Each practice therefore measures one thing and reports it
 * plainly, because "my rhythm is bad" is not something anyone can act on.
 *
 * Two of them are worth calling out. **Judge** asks you to say whether you were
 * early, on, or late *before* it tells you — your answer is scored beside the
 * measurement, which is the only way to train an ear that can correct itself
 * without a teacher in the room. And **recover** counts the notes between a
 * mistake and the rhythm being back inside the window, because that number is
 * what a performance actually costs you, and it is not the same number as how
 * many mistakes you made.
 */
export function AccuracyDrill({ config }: { config: AccuracyDrillConfig }) {
  const [tempo, setTempo] = useState(config.tempos[0] ?? 60);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  const [tally, setTally] = useState<TimingTally>(EMPTY_TIMING);
  const [note, setNote] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [judged, setJudged] = useState<{ said: Judgement; was: Judgement } | null>(null);
  const [judgeScore, setJudgeScore] = useState({ right: 0, asked: 0 });
  const [phrases, setPhrases] = useState(0);
  const [produced, setProduced] = useState({ right: 0, asked: 0 });
  const [spread, setSpread] = useState<number | null>(null);
  const [recovery, setRecovery] = useState<{ notes: number; worst: number } | null>(null);
  const [extras, setExtras] = useState(0);

  /** Notes of the phrase in progress, and the gaps between them. */
  const phrase = useRef<TimingTally>(EMPTY_TIMING);
  const gaps = useRef<number[]>([]);
  const lastAt = useRef<number | null>(null);
  const claimed = useRef<Set<number>>(new Set());
  /** Notes played since the last miss, while the rhythm comes back. */
  const sinceMiss = useRef<number | null>(null);

  /** What this phrase is asked to do: sit on the beat, or miss it on purpose. */
  const intent: Judgement = config.demonstrate?.[phrases % config.demonstrate.length] ?? 'on';

  /** The value each note of the phrase takes — cycled for the switching practice. */
  const valueAt = useCallback(
    (index: number) => config.values[index % config.values.length] ?? 'quarter',
    [config.values],
  );

  /** When note `index` of the phrase falls due, in ms from the start. */
  const dueAt = useCallback(
    (index: number) => {
      const beat = beatMs(tempo);
      const lead = ENTRY_BAR * beat;
      let at = 0;
      for (let step = 0; step < index; step += 1) at += beatsOf(valueAt(step)) * beat;
      return lead + at;
    },
    [tempo, valueAt],
  );

  const onBeat = useCallback(
    (beat: number) => {
      if (!settings.soundEnabled) return;
      instrument.playMidis([CLICK_MIDI], beat % BEATS_PER_BAR === 0 ? 1.1 : 0.6);
    },
    [settings.soundEnabled],
  );

  const metronome = useMetronome({ bpm: tempo, onBeat });

  const reset = useCallback(() => {
    setTally(EMPTY_TIMING);
    setNote(null);
    setAsking(false);
    setJudged(null);
    setJudgeScore({ right: 0, asked: 0 });
    setPhrases(0);
    setProduced({ right: 0, asked: 0 });
    setSpread(null);
    setRecovery(null);
    setExtras(0);
    phrase.current = EMPTY_TIMING;
    gaps.current = [];
    lastAt.current = null;
    claimed.current = new Set();
    sinceMiss.current = null;
  }, []);

  useEffect(() => {
    reset();
  }, [config, reset, tempo]);

  /** Closes a phrase: the spacing, the self-judgement, and the tally. */
  const finishPhrase = useCallback(() => {
    setPhrases((current) => current + 1);
    const even = evenness(gaps.current);
    if (even !== null) setSpread(even);

    if (config.focus === 'judge') {
      setAsking(true);
      metronome.stop();
    } else {
      phrase.current = EMPTY_TIMING;
      gaps.current = [];
      lastAt.current = null;
      claimed.current = new Set();
    }
  }, [config.focus, metronome]);

  const play = (key: PianoKey) => {
    if (!metronome.running || asking) return;

    const at = metronome.elapsed();
    if (at === null) return;

    // Which note of the phrase is this closest to?
    let index = 0;
    let best = Infinity;
    for (let step = 0; step < config.phrase; step += 1) {
      const gap = Math.abs(at - dueAt(step));
      if (gap < best) {
        best = gap;
        index = step;
      }
    }

    const error = at - dueAt(index);
    if (best > CLAIM_MS) {
      // Nothing was due here — an extra note, which the ending practice counts.
      setExtras((current) => current + 1);
      setNote('Nothing was due there — that note is extra');
      return;
    }
    if (claimed.current.has(index)) return;
    claimed.current.add(index);

    if (settings.soundEnabled) instrument.playMidis([key.midi]);

    const value = valueAt(index);
    const clean = Math.abs(error) <= ON_BEAT_MS;
    setTally((current) => recordTiming(current, error));
    phrase.current = recordTiming(phrase.current, error);
    if (lastAt.current !== null) gaps.current.push(at - lastAt.current);
    lastAt.current = at;

    // Recovery is counted in notes, from the first miss until the rhythm holds.
    if (!clean && sinceMiss.current === null) sinceMiss.current = 0;
    else if (sinceMiss.current !== null) {
      const notes = sinceMiss.current + 1;
      if (clean) {
        setRecovery((current) => ({
          notes,
          worst: Math.max(current?.worst ?? 0, notes),
        }));
        sinceMiss.current = null;
      } else {
        sinceMiss.current = notes;
      }
    }

    const scoreKey =
      config.focus === 'rhythms'
        ? valueSpec(value).label
        : config.focus === 'start'
          ? 'entry'
          : countLabel(index % BEATS_PER_BAR, BEATS_PER_BAR);
    record(scoreKey, clean, Math.abs(error));
    setNote(timingNote(error));

    if (index + 1 >= config.phrase) finishPhrase();
  };

  const judge = (said: Judgement) => {
    const lean = phrase.current.notes === 0 ? null : phrase.current.signedError / phrase.current.notes;
    const was = judgementOf(lean, ON_BEAT_MS);
    setJudged({ said, was });
    setJudgeScore((current) => ({ right: current.right + (said === was ? 1 : 0), asked: current.asked + 1 }));
    // Two separate questions: did you do what was asked, and did you hear it?
    if (config.demonstrate) {
      setProduced((current) => ({
        right: current.right + (was === intent ? 1 : 0),
        asked: current.asked + 1,
      }));
    }
    record(`heard ${was}`, said === was, null);
    phrase.current = EMPTY_TIMING;
    gaps.current = [];
    lastAt.current = null;
    claimed.current = new Set();
    setAsking(false);
  };

  const spots = weakSpots(book, { targetMs: ON_BEAT_MS });
  const rate = onBeatRate(tally);
  const beat = metronome.beat < 0 ? -1 : metronome.beat % BEATS_PER_BAR;
  const counting = metronome.running && metronome.beat < ENTRY_BAR - 1;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Tempo" hint="Move up only when the accuracy holds.">
            <SegmentedControl
              value={String(tempo)}
              options={config.tempos.map((bpm) => ({ value: String(bpm), label: `${bpm}` }))}
              onChange={(value) => setTempo(Number(value))}
              block
              ariaLabel="Tempo"
            />
          </Field>
          <Button
            variant={metronome.running ? 'danger' : 'primary'}
            icon={metronome.running ? 'stop' : 'play'}
            onClick={() => {
              reset();
              if (metronome.running) metronome.stop();
              else metronome.start();
            }}
            block
          >
            {metronome.running ? 'Stop' : 'Start the click'}
          </Button>
          <CounterRow>
            <Counter
              label="On the beat"
              value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
              hint={timingBias(tally)}
            />
            <Counter label="Average off" value={formatMs(meanTiming(tally))} />
            <Counter label="Phrases" value={String(phrases)} />
          </CounterRow>
          {(config.focus === 'evenness' || config.focus === 'repeats') && (
            <CounterRow>
              <Counter label="Evenness" value={percent(spread)} hint="gap against gap" />
            </CounterRow>
          )}
          {config.focus === 'judge' && (
            <CounterRow>
              <Counter
                label="Your ear"
                value={`${judgeScore.right}/${judgeScore.asked}`}
                hint="judgements that matched"
              />
              {config.demonstrate && (
                <Counter
                  label="On purpose"
                  value={`${produced.right}/${produced.asked}`}
                  hint="phrases that did as asked"
                />
              )}
            </CounterRow>
          )}
          {config.focus === 'recover' && (
            <CounterRow>
              <Counter
                label="Recovery"
                value={recovery === null ? '—' : `${recovery.notes}`}
                hint={recovery === null ? 'notes after a miss' : `worst ${recovery.worst}`}
              />
            </CounterRow>
          )}
          {config.focus === 'stop' && (
            <CounterRow>
              <Counter label="Extra notes" value={String(extras)} hint="played after the end" />
            </CounterRow>
          )}
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — play a phrase." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${tempo} BPM`,
          `${config.phrase} ${config.phrase === 1 ? 'note' : 'notes'}`,
          config.values.length > 1
            ? 'values change'
            : valueSpec(config.values[0] ?? 'quarter').label.toLowerCase(),
          config.demonstrate ? (intent === 'on' ? 'on the beat' : `deliberately ${intent}`) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {asking && <Chip tone="accent">Now say where you were</Chip>}
            {!asking && config.demonstrate && metronome.running && !note && (
              <Chip tone="accent">
                {intent === 'on'
                  ? 'Play this phrase on the beat'
                  : `Play this phrase deliberately ${intent}`}
              </Chip>
            )}
            {!asking && judged && (
              <Chip tone={judged.said === judged.was ? 'accent' : 'danger'}>
                You said {judged.said}; you were {judged.was}
              </Chip>
            )}
            {!asking && !judged && counting && <Chip tone="accent">Counting in</Chip>}
            {!asking && !judged && !counting && note && (
              <Chip tone={note === 'on the beat' ? 'accent' : 'danger'}>{note}</Chip>
            )}
            {!asking && !judged && !counting && !note && (
              <Chip>{metronome.running ? 'Play with the click' : 'Press start'}</Chip>
            )}
          </>
        }
      >
        {metronome.running ? beat + 1 : '·'}
      </DrillPrompt>

      <BeatBar beatsPerBar={BEATS_PER_BAR} beat={metronome.running ? beat : -1} />

      {asking ? (
        <div className={styles.judge}>
          {JUDGEMENTS.map((option) => (
            <button key={option} type="button" className={styles.pad} onClick={() => judge(option)}>
              {JUDGEMENT_LABELS[option]}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.board}>
          <Keyboard
            layout={layout}
            onKeyPress={play}
            footerNote={
              metronome.running
                ? config.focus === 'start'
                  ? 'One note, on the first beat of the next bar'
                  : 'Play with the click'
                : 'Start the click first'
            }
          />
        </div>
      )}

      <p className={styles.note}>
        Your fingers should land where your counting says they land — and you should be able to hear
        when they do not.
      </p>
    </DrillShell>
  );
}

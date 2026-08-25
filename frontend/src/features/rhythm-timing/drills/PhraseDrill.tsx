import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl } from '@/components/ui';
import { getKeyboardLayout, whiteStep } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  EMPTY_TIMING,
  LEAD_IN_BEATS,
  ON_BEAT_MS,
  WeakSpots,
  beatMs,
  formatMs,
  meanTiming,
  onBeatRate,
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
import { buildScore, playable } from '../data/score';
import { phraseSet } from '../data/phrases';
import type { Phrase } from '../data/phrases';
import {
  REVIEW_POINTS,
  countStops,
  driftNote,
  driftOf,
  scorecardOf,
  weakestRow,
} from '../data/performance';
import type { PhraseDrillConfig } from '../data/phraseDrills';
import { BeatBar } from '../components/BeatBar';
import { ScoreStrip } from '../components/ScoreStrip';
import { Keyboard } from '../components/Keyboard';
import styles from '../components/rhythm.module.css';

const LAYOUT_ID = '25';
const CLICK_MIDI = 84;

/** A press this far from a note's due time is that note. */
const CLAIM_MS = 500;

/**
 * 3.7.1 – 3.7.8 and 3.8.1 – 3.8.8 — playing a piece, and being read while you do.
 *
 * The two closing buckets of the level share a screen because they share the
 * act: a phrase against a click, from a single repeated key up to a tune. What
 * separates them is what gets watched. The practical bucket looks at each note —
 * where it landed, what it was counted as — while the contest bucket looks at
 * the run: whether it started on time, held its tempo from the first third to
 * the last, ever actually stopped, and finished where it meant to.
 *
 * A mistake never restarts anything, anywhere in either bucket. That is the
 * rule the references repeat most often, and building it into the engine is
 * more use than printing it: the run carries on, the miss is recorded, and the
 * recovery gets counted.
 */
export function PhraseDrill({ config }: { config: PhraseDrillConfig }) {
  const phrases = useMemo(() => phraseSet(config.set), [config.set]);
  const [phraseId, setPhraseId] = useState<string>(
    phrases.length > 1 ? (phrases[0] as Phrase).id : (phrases[0]?.id ?? ''),
  );
  const [tempo, setTempo] = useState(config.tempos[0] ?? 60);
  const [silentBars, setSilentBars] = useState(config.gap?.silent[0] ?? 0);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  const phrase = useMemo(
    () => phrases.find((entry) => entry.id === phraseId) ?? (phrases[0] as Phrase),
    [phraseId, phrases],
  );
  const score = useMemo(() => buildScore(phrase.events, tempo), [phrase.events, tempo]);
  const notes = useMemo(() => playable(score), [score]);

  /** The phrase placed on the board, from middle C upwards. */
  const keys = useMemo(() => {
    const root = layout.keys.find((key) => key.midi === 60);
    if (!root) return [];
    return notes.map((event) => whiteStep(layout, root, event.step ?? 0) ?? root);
  }, [layout, notes]);

  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState<TimingTally>(EMPTY_TIMING);
  const [returns, setReturns] = useState<TimingTally>(EMPTY_TIMING);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [misses, setMisses] = useState(0);
  /** Gaps between the notes actually played, for tempo drift and stops. */
  const gaps = useRef<number[]>([]);
  const lastAt = useRef<number | null>(null);
  const entry = useRef<number | null>(null);
  const ending = useRef<number | null>(null);
  const recovery = useRef<{ since: number | null; worst: number }>({ since: null, worst: 0 });

  const bar = beatMs(tempo) * score.beatsPerBar;

  /** True while the click is away and the pulse is yours to keep. */
  const inGap = useCallback(
    (beat: number) => {
      const gap = config.gap;
      if (!gap || silentBars === 0 || beat < LEAD_IN_BEATS) return false;
      const barIndex = Math.floor((beat - LEAD_IN_BEATS) / score.beatsPerBar);
      return barIndex % (gap.sounding + silentBars) >= gap.sounding;
    },
    [config.gap, score.beatsPerBar, silentBars],
  );

  const onBeat = useCallback(
    (beat: number) => {
      if (!settings.soundEnabled || inGap(beat)) return;
      instrument.playMidis([CLICK_MIDI], beat % score.beatsPerBar === 0 ? 1.1 : 0.6);
    },
    [inGap, score.beatsPerBar, settings.soundEnabled],
  );

  const metronome = useMetronome({ bpm: tempo, onBeat });

  const reset = useCallback(() => {
    setIndex(0);
    setTally(EMPTY_TIMING);
    setReturns(EMPTY_TIMING);
    setNote(null);
    setDone(false);
    setMisses(0);
    gaps.current = [];
    lastAt.current = null;
    entry.current = null;
    ending.current = null;
    recovery.current = { since: null, worst: 0 };
  }, []);

  useEffect(() => {
    reset();
  }, [config, phraseId, reset, silentBars, tempo]);

  const expected = notes[index];
  const expectedKey = keys[index];

  const play = (key: PianoKey) => {
    if (!metronome.running || done || !expected || !expectedKey) return;

    const at = metronome.elapsed();
    if (at === null) return;
    const error = at - expected.at;
    if (error < -CLAIM_MS) return;

    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    const right = key.midi === expectedKey.midi;
    const clean = right && Math.abs(error) <= ON_BEAT_MS;

    // A wrong note never restarts anything — the run moves on and so do you.
    if (!right) setMisses((current) => current + 1);
    if (index === 0) entry.current = error;
    if (index === notes.length - 1) ending.current = error;

    if (lastAt.current !== null) gaps.current.push(at - lastAt.current);
    lastAt.current = at;

    // Recovery is counted in notes, from a miss until the beat is held again.
    if (!clean && recovery.current.since === null) recovery.current.since = 0;
    else if (recovery.current.since !== null) {
      const since = recovery.current.since + 1;
      if (clean) {
        recovery.current = { since: null, worst: Math.max(recovery.current.worst, since) };
      } else {
        recovery.current = { ...recovery.current, since };
      }
    }

    setTally((current) => recordTiming(current, error));
    const returning = inGap(Math.floor((at - error) / beatMs(tempo)) - 1) && !inGap(Math.floor(at / beatMs(tempo)));
    if (returning) setReturns((current) => recordTiming(current, error));
    record(config.focus === 'count' ? `count ${expected.count}` : `note ${index + 1}`, clean, Math.abs(error));
    setNote(right ? timingNote(error) : 'Wrong note — stay with the beat and carry on');

    const next = index + 1;
    setIndex(next);
    if (next >= notes.length) {
      setDone(true);
      metronome.stop();
    }
  };

  const spots = weakSpots(book, { targetMs: ON_BEAT_MS });
  const rate = onBeatRate(tally);
  const drift = driftOf(gaps.current);
  const stops = countStops(gaps.current, bar / score.beatsPerBar);
  const card = config.scorecard
    ? scorecardOf(
        {
          entry: entry.current,
          ending: ending.current,
          accuracy: rate,
          recovery: recovery.current.worst === 0 ? null : recovery.current.worst,
          stops,
          drift,
        },
        ON_BEAT_MS,
      )
    : null;
  const beat = metronome.beat < 0 ? -1 : metronome.beat % score.beatsPerBar;
  const gapNow = inGap(metronome.beat);
  const performing = config.focus === 'perform';

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          {phrases.length > 1 && (
            <Field label="Phrase" hint="What to play; the rhythm is the exercise.">
              <SegmentedControl
                value={phraseId}
                options={phrases.map((entry) => ({ value: entry.id, label: entry.label }))}
                onChange={setPhraseId}
                block
                ariaLabel="Phrase"
              />
            </Field>
          )}
          <Field label="Tempo" hint="Move up only while the timing holds.">
            <SegmentedControl
              value={String(tempo)}
              options={config.tempos.map((bpm) => ({ value: String(bpm), label: `${bpm}` }))}
              onChange={(value) => setTempo(Number(value))}
              block
              ariaLabel="Tempo"
            />
          </Field>
          {config.gap && config.gap.silent.length > 1 && (
            <Field label="Silence" hint="Bars the click drops out for.">
              <SegmentedControl
                value={String(silentBars)}
                options={config.gap.silent.map((bars) => ({ value: String(bars), label: `${bars}` }))}
                onChange={(value) => setSilentBars(Number(value))}
                block
                ariaLabel="Silent bars"
              />
            </Field>
          )}
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
            {metronome.running ? 'Stop' : done ? 'Play it again' : 'Count in and play'}
          </Button>
          <CounterRow>
            <Counter
              label="On the beat"
              value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
              hint={timingBias(tally)}
            />
            <Counter label="Average off" value={formatMs(meanTiming(tally))} />
            <Counter label="Wrong notes" value={String(misses)} hint="the run carried on" />
          </CounterRow>
          {(performing || config.focus === 'review') && (
            <CounterRow>
              <Counter label="Tempo" value={driftNote(drift.change)} hint="start against end" />
              <Counter label="Stops" value={String(stops)} hint="gaps the music did not ask for" />
              <Counter
                label="Recovery"
                value={recovery.current.worst === 0 ? '—' : `${recovery.current.worst}`}
                hint="notes after a miss"
              />
            </CounterRow>
          )}
          {config.gap && (
            <CounterRow>
              <Counter
                label="Coming back"
                value={formatMs(meanTiming(returns))}
                hint={`${returns.notes} returns`}
              />
            </CounterRow>
          )}
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — play it through." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${tempo} BPM · ${phrase.label}`,
          gapNow ? 'click away — keep going' : null,
          config.focus === 'count' ? 'count out loud' : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {done && (
              <Chip tone="accent">
                Finished{rate === null ? '' : ` — ${Math.round(rate * 100)}% on the beat`}
              </Chip>
            )}
            {!done && note && (
              <Chip tone={note === 'on the beat' ? 'accent' : 'danger'}>{note}</Chip>
            )}
            {!done && !note && (
              <Chip>{metronome.running ? 'Play with the click' : 'Press start — a bar of count-in first'}</Chip>
            )}
          </>
        }
      >
        {metronome.running && expected
          ? config.focus === 'count'
            ? expected.count
            : (expectedKey?.sharpName ?? '·')
          : done
            ? '✓'
            : '·'}
      </DrillPrompt>

      <BeatBar beatsPerBar={score.beatsPerBar} beat={metronome.running ? beat : -1} silent={gapNow} />

      <ScoreStrip
        events={score.events}
        index={metronome.running ? (expected?.index ?? -1) : -1}
        done={expected?.index ?? score.events.length}
        beatsPerBar={score.beatsPerBar}
      />

      <div className={styles.board}>
        <Keyboard
          layout={layout}
          lit={expectedKey && metronome.running && index === 0 ? [expectedKey.midi] : []}
          onKeyPress={play}
          footerNote={metronome.running ? 'Play the phrase with the click' : 'Start the click first'}
        />
      </div>

      {done && card && (
        <div className={styles.review}>
          <p className={styles.reviewTitle}>
            Scorecard — {card.overall}/10 overall. Work on {weakestRow(card)}.
          </p>
          <ul className={styles.reviewList}>
            <li>Starting tempo — {card.startingTempo}/10</li>
            <li>Tempo consistency — {card.consistency}/10</li>
            <li>Rhythm accuracy — {card.accuracy}/10</li>
            <li>Recovery from mistakes — {card.recovery}/10</li>
            <li>Playing without stopping — {card.continuity}/10</li>
            <li>Ending stability — {card.ending}/10</li>
          </ul>
        </div>
      )}

      {done && config.focus === 'review' && (
        <div className={styles.review}>
          <p className={styles.reviewTitle}>Now listen back, and pick one thing.</p>
          <ul className={styles.reviewList}>
            {REVIEW_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <p className={styles.note}>
        A wrong note is a small problem. Losing the beat is a bigger one.
      </p>
    </DrillShell>
  );
}

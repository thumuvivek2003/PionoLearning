import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout, whiteStep } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  EMPTY_TIMING,
  ON_BEAT_MS,
  WeakSpots,
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
import { valueSpec } from '../data/noteValues';
import { HOLD_TOLERANCE, buildScore, heldShare, holdNote, playable } from '../data/score';
import type { ScoreEvent } from '../data/score';
import type { DurationDrillConfig } from '../data/durationDrills';
import { BeatBar } from '../components/BeatBar';
import { ScoreStrip } from '../components/ScoreStrip';
import { Keyboard } from '../components/Keyboard';
import styles from '../components/rhythm.module.css';

/** Two octaves is more than the five-finger position needs. */
const LAYOUT_ID = '25';

/** A press this far from a note's due time is that note. */
const CLAIM_MS = 500;

/** The click, and the louder downbeat. */
const CLICK_MIDI = 84;

/**
 * 3.2.1 – 3.2.8 — how long a note lasts.
 *
 * The first bucket in the app that cares when you let *go*. Keys report press
 * and release, so a note is judged twice: when it arrived against when it was
 * due, and how much of its written length it actually kept. Those are separate
 * failures with separate fixes — a whole note can start perfectly and still be
 * half a note if the hand lets go on beat two.
 *
 * Rests are events like any other, which is the lesson rather than a
 * convenience: playing during one is scored as a miss, because silence with a
 * length is still rhythm. And the ledger is kept per note value, so the panel
 * can say "your whole notes are the short ones" — the single most common fault
 * in the bucket, and invisible from inside.
 */
export function DurationDrill({ config }: { config: DurationDrillConfig }) {
  const [tempo, setTempo] = useState(config.tempos[0] ?? 50);
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  const score = useMemo(() => buildScore(config.pattern, tempo), [config.pattern, tempo]);
  const notes = useMemo(() => playable(score), [score]);

  /** Where the line sits: one key, or walking up the position. */
  const keys = useMemo(() => {
    const middleC = layout.keys.find((key) => key.midi === 60);
    if (!middleC) return [];
    return notes.map((_, index) =>
      config.walking ? (whiteStep(layout, middleC, index % 5) ?? middleC) : middleC,
    );
  }, [config.walking, layout, notes]);

  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const [onset, setOnset] = useState<TimingTally>(EMPTY_TIMING);
  const [holds, setHolds] = useState({ good: 0, total: 0, share: 0 });
  const [lastNote, setLastNote] = useState<string | null>(null);
  const pressedAt = useRef<number | null>(null);
  const pressedEvent = useRef<ScoreEvent | null>(null);

  const onBeat = useCallback(
    (beat: number) => {
      if (!settings.soundEnabled) return;
      instrument.playMidis([CLICK_MIDI], beat % score.beatsPerBar === 0 ? 1.1 : 0.6);
    },
    [score.beatsPerBar, settings.soundEnabled],
  );

  const metronome = useMetronome({ bpm: tempo, onBeat });

  const reset = useCallback(() => {
    setIndex(0);
    setHeld(null);
    setOnset(EMPTY_TIMING);
    setHolds({ good: 0, total: 0, share: 0 });
    setLastNote(null);
    pressedAt.current = null;
    pressedEvent.current = null;
  }, []);

  useEffect(() => {
    reset();
  }, [config, reset, tempo]);

  // The run ends itself: when the score is over, the click stops with it.
  useEffect(() => {
    if (!metronome.running || index < notes.length) return;
    const at = metronome.elapsed();
    if (at !== null && at >= score.length) metronome.stop();
  }, [index, metronome, notes.length, score.length]);

  const expected = notes[index];
  const expectedKey = keys[index];

  const down = (key: PianoKey) => {
    if (!metronome.running || !expected || !expectedKey) return;

    const at = metronome.elapsed();
    if (at === null) return;
    const error = at - expected.at;
    // A press well before the note is due belongs to nothing yet.
    if (error < -CLAIM_MS) return;

    setHeld(key.midi);
    if (settings.soundEnabled) instrument.playMidis([key.midi]);

    if (key.midi !== expectedKey.midi) {
      record(valueSpec(expected.value).label, false, null);
      setLastNote('Wrong key — the rhythm carries on, so pick it up on the next note');
      pressedAt.current = null;
      pressedEvent.current = null;
      setIndex((current) => current + 1);
      return;
    }

    pressedAt.current = at;
    pressedEvent.current = expected;
    setOnset((current) => recordTiming(current, error));
    setLastNote(timingNote(error));
  };

  const up = () => {
    setHeld(null);
    const event = pressedEvent.current;
    const startedAt = pressedAt.current;
    const at = metronome.elapsed();
    pressedAt.current = null;
    pressedEvent.current = null;
    if (!event || startedAt === null || at === null) return;

    const share = heldShare(at - startedAt, event.lasts);
    const clean = Math.abs(share - 1) <= HOLD_TOLERANCE;
    setHolds((current) => ({
      good: current.good + (clean ? 1 : 0),
      total: current.total + 1,
      share: current.share + share,
    }));
    // Both halves are scored under the value, since both are how long it lasts.
    record(valueSpec(event.value).label, clean, null);
    if (config.judgeRelease) setLastNote(holdNote(share));
    setIndex((current) => current + 1);
  };

  const spots = weakSpots(book, { targetMs: ON_BEAT_MS });
  const rate = onBeatRate(onset);
  const meanShare = holds.total === 0 ? null : holds.share / holds.total;
  const beat = metronome.beat < 0 ? -1 : metronome.beat % score.beatsPerBar;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Tempo" hint="Slow enough to count every part of the beat.">
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
              hint={timingBias(onset)}
            />
            <Counter label="Average off" value={formatMs(meanTiming(onset))} />
            {config.judgeRelease && (
              <Counter
                label="Held"
                value={meanShare === null ? '—' : `${Math.round(meanShare * 100)}%`}
                hint={`${holds.good}/${holds.total} full length`}
              />
            )}
          </CounterRow>
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <WeakSpots
            spots={spots}
            emptyNote="Nothing weak yet — play the rhythm through."
            onClear={clear}
          />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${score.beatsPerBar}/4 · ${tempo} BPM`,
          expected ? `${valueSpec(expected.value).label.toLowerCase()} · count ${valueSpec(expected.value).count}` : 'done',
        ].join(' · ')}
        footer={
          <>
            {!metronome.running && index >= notes.length && notes.length > 0 && (
              <Chip tone="accent">
                Rhythm complete{rate === null ? '' : ` — ${Math.round(rate * 100)}% on the beat`}
              </Chip>
            )}
            {!metronome.running && index < notes.length && <Chip>Press start, then play the rhythm</Chip>}
            {metronome.running && lastNote && (
              <Chip tone={lastNote.includes('on the beat') || lastNote.includes('full value') ? 'accent' : 'danger'}>
                {lastNote}
              </Chip>
            )}
            {metronome.running && !lastNote && (
              <Chip>
                Note {index + 1} of {notes.length}
              </Chip>
            )}
          </>
        }
      >
        {metronome.running ? (expected?.count ?? '✓') : '·'}
      </DrillPrompt>

      <BeatBar beatsPerBar={score.beatsPerBar} beat={metronome.running ? beat : -1} />

      <ScoreStrip
        events={score.events}
        index={metronome.running ? (expected?.index ?? -1) : -1}
        done={expected?.index ?? score.events.length}
        beatsPerBar={score.beatsPerBar}
      />

      <div className={styles.board}>
        <Keyboard
          layout={layout}
          lit={held === null ? [] : [held]}
          showNames={showNames}
          onKeyDown={down}
          onKeyUp={up}
          footerNote={
            metronome.running
              ? config.judgeRelease
                ? 'Press on the beat, hold for its value, release at the boundary'
                : 'Press on the beat'
              : 'Start the click first'
          }
        />
      </div>

      <p className={styles.note}>
        A beat is the clock; the value says how much of it a sound occupies. A rest occupies it too.
      </p>
    </DrillShell>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout, whiteStep } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  ChoicePills,
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  StepStrip,
  WeakSpots,
  formatMs,
  EMPTY_TIMING,
  LEAD_IN_BEATS,
  ON_BEAT_MS,
  claims,
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
import { handShort } from '../data/fingers';
import { positionFinger } from '../data/handRuns';
import { RHYTHMS, dueTimes, getRhythm } from '../data/timing';
import type { RhythmId } from '../data/timing';
import type { RhythmDrillConfig } from '../data/rhythmDrills';
import type { FingerNumber, Hand } from '../finger.types';
import { HandDiagram } from '../components/HandDiagram';
import { HandKeyboard } from '../components/HandKeyboard';
import styles from '../components/finger.module.css';

/** Wide enough that the line can start anywhere sensible. */
const LAYOUT_ID = '49';

/** The click, and the accent the drill demonstrates. */
const CLICK_MIDI = 84;
const ACCENT_GAIN = 1.8;

/** A pass this accurate has earned the next rung of the tempo ladder. */
const LADDER_ON_BEAT = 0.8;

const HANDS = [
  { value: 'right' as Hand, label: 'Right hand' },
  { value: 'left' as Hand, label: 'Left hand' },
];

/**
 * 2.11.1 – 2.11.6 — the same fingers, now on a clock.
 *
 * Everything before this bucket asked whether the right key was pressed. This
 * one asks *when*, so the drill schedules every note — four beats of count-in,
 * then a due time per note from the rhythm — and scores each press against the
 * moment it was owed. That is measured from the metronome's own start rather
 * than from its ticker, so the reading stays exact however coarse the click is.
 *
 * The two readings it reports are deliberately different questions. **On the
 * beat** is how often you landed inside the window; **rushing or dragging** is
 * whether you miss the same way every time — anticipation and tension are
 * different problems with different fixes, and an average would hide both. The
 * ledger is kept per finger, so "4 is always late" is a sentence the panel can
 * say.
 */
export function RhythmDrill({ config }: { config: RhythmDrillConfig }) {
  const [hand, setHand] = useState<Hand>('right');
  const [rhythmId, setRhythmId] = useState<RhythmId>(config.rhythms[0] ?? 'quarter');
  const [rung, setRung] = useState(0);
  const [tempo, setTempo] = useState(config.tempos[0] ?? 50);
  const [accentEvery, setAccentEvery] = useState(config.accents?.[0] ?? 0);
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const rhythm = useMemo(() => getRhythm(rhythmId), [rhythmId]);
  const bpm = config.tempoMode === 'ladder' ? (config.tempos[rung] ?? 50) : tempo;

  const { book, record, clear } = useScoreBook();
  const [keys, setKeys] = useState<readonly PianoKey[]>([]);
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [tally, setTally] = useState<TimingTally>(EMPTY_TIMING);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [passNote, setPassNote] = useState<string | null>(null);
  /** Timing of the pass being played, judged when it ends. */
  const pass = useRef<TimingTally>(EMPTY_TIMING);
  const misses = useRef(0);

  const due = useMemo(() => dueTimes(config.offsets.length, rhythm, bpm), [bpm, config.offsets.length, rhythm]);

  /** Puts the line somewhere on the board, hand by hand. */
  const place = useCallback(() => {
    const whites = layout.keys.filter((key) => !key.isBlack);
    const room = whites.filter((key) =>
      config.offsets.every((offset) => whiteStep(layout, key, offset) !== undefined),
    );
    const start = room[Math.floor(Math.random() * room.length)];
    if (!start) return;
    setKeys(
      config.offsets.flatMap((offset) => {
        const key = whiteStep(layout, start, offset);
        return key ? [key] : [];
      }),
    );
  }, [config.offsets, layout]);

  const reset = useCallback(() => {
    setIndex(0);
    setPlayed([]);
    setWrong(null);
    setLastNote(null);
    pass.current = EMPTY_TIMING;
    misses.current = 0;
  }, []);

  const beatSound = useCallback(
    (index: number) => {
      if (!settings.soundEnabled) return;
      // The count-in clicks louder, so the start of the line is unmistakable.
      instrument.playMidis([CLICK_MIDI], index < LEAD_IN_BEATS ? 1.2 : 0.6);
    },
    [settings.soundEnabled],
  );

  const metronome = useMetronome({ bpm, onBeat: beatSound });

  useEffect(() => {
    place();
    reset();
  }, [config, hand, place, reset]);

  /** Judges the pass that has just finished, and moves the ladder with it. */
  const finishPass = useCallback(() => {
    const rate = onBeatRate(pass.current);
    setTally((current) => ({
      notes: current.notes + pass.current.notes,
      onBeat: current.onBeat + pass.current.onBeat,
      totalError: current.totalError + pass.current.totalError,
      signedError: current.signedError + pass.current.signedError,
      worst: Math.max(current.worst, pass.current.worst),
    }));

    if (config.tempoMode === 'ladder') {
      const clean = misses.current === 0 && rate !== null && rate >= LADDER_ON_BEAT;
      setRung((current) => {
        const moved = Math.min(config.tempos.length - 1, Math.max(0, current + (clean ? 1 : -1)));
        setPassNote(
          moved === current
            ? `Holding at ${config.tempos[moved]} BPM`
            : `${clean ? 'Up' : 'Back'} to ${config.tempos[moved]} BPM`,
        );
        return moved;
      });
    } else {
      setPassNote(rate === null ? null : `${Math.round(rate * 100)}% on the beat`);
    }

    reset();
    place();
  }, [config.tempoMode, config.tempos, place, reset]);

  const expected = keys[index];
  const accented = accentEvery > 0 && index % accentEvery === 0;

  const press = (key: PianoKey) => {
    if (!metronome.running || !expected) return;

    const at = metronome.elapsed();
    const owed = due[index] ?? 0;
    const error = at === null ? 0 : at - owed;
    // A press well before the next note is due is not that note yet.
    if (!claims(error)) return;

    const finger = config.fingers[index] ?? positionFinger(hand, index);
    if (key.midi !== expected.midi) {
      misses.current += 1;
      record(`${handShort(hand)} ${finger}`, false, null);
      setLastNote('Wrong note — find the beat again and carry on');
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 400);
      return;
    }

    if (settings.soundEnabled) {
      instrument.playMidis([key.midi], accented ? ACCENT_GAIN : 1);
    }
    pass.current = recordTiming(pass.current, error);
    // Timing is the score here, so the ledger holds the error, not the delay.
    record(`${handShort(hand)} ${finger}`, Math.abs(error) <= ON_BEAT_MS, Math.abs(error));
    setLastNote(timingNote(error));
    setWrong(null);
    setPlayed((current) => [...current, key.midi]);

    const next = index + 1;
    setIndex(next);
    if (next >= keys.length) finishPass();
  };

  const spots = weakSpots(book, { targetMs: ON_BEAT_MS });
  const rate = onBeatRate(tally);
  const beatsIn = Math.max(0, LEAD_IN_BEATS - 1 - metronome.beat);
  const counting = metronome.running && metronome.beat < LEAD_IN_BEATS - 1;
  const strip = config.fingers.map((finger, position) =>
    accentEvery > 0 && position % accentEvery === 0 ? `>${finger}` : String(finger),
  );

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Hand">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>
          {config.rhythms.length > 1 && (
            <Field label="Rhythm" hint={rhythm.hint}>
              <SegmentedControl
                value={rhythmId}
                options={config.rhythms.map((id) => ({
                  value: id,
                  label: RHYTHMS.find((entry) => entry.id === id)?.label ?? id,
                }))}
                onChange={(value) => setRhythmId(value as RhythmId)}
                block
                ariaLabel="Rhythm"
              />
            </Field>
          )}
          {config.accents && config.accents.length > 0 && (
            <Field label="Accent" hint="Feel the notes in groups without changing them.">
              <SegmentedControl
                value={String(accentEvery)}
                options={[
                  { value: '0', label: 'None' },
                  ...config.accents.map((every) => ({ value: String(every), label: `Every ${every}` })),
                ]}
                onChange={(value) => setAccentEvery(Number(value))}
                block
                ariaLabel="Accent grouping"
              />
            </Field>
          )}
          {config.tempoMode === 'ladder' ? (
            <CounterRow>
              <Counter label="Rung" value={`${bpm}`} hint={`BPM · ${rung + 1} of ${config.tempos.length}`} />
            </CounterRow>
          ) : (
            <Field label="Tempo" hint="Slow enough to land on every click.">
              <ChoicePills options={config.tempos} value={tempo} onChange={setTempo} />
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
            {metronome.running ? 'Stop' : 'Start the click'}
          </Button>
          <CounterRow>
            <Counter
              label="On the beat"
              value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
              hint={`inside ${ON_BEAT_MS}ms`}
            />
            <Counter label="Average off" value={formatMs(meanTiming(tally))} hint={timingBias(tally)} />
            <Counter label="Worst" value={formatMs(tally.worst === 0 ? null : tally.worst)} />
          </CounterRow>
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <WeakSpots
            spots={spots}
            emptyNote="Nothing weak yet — play a few passes."
            onClear={clear}
          />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${handShort(hand)} · ${rhythm.label.toLowerCase()} · ${bpm} BPM`,
          keys[0] ? `from ${keys[0].sharpName}` : '',
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {counting && <Chip tone="accent">Counting in — {beatsIn + 1}</Chip>}
            {!counting && !metronome.running && (
              <Chip>{passNote ?? 'Press start and play with the click'}</Chip>
            )}
            {!counting && metronome.running && lastNote && (
              <Chip tone={lastNote === 'on the beat' ? 'accent' : 'danger'}>{lastNote}</Chip>
            )}
            {!counting && metronome.running && !lastNote && (
              <Chip>
                Note {index + 1} of {keys.length}
              </Chip>
            )}
          </>
        }
      >
        {metronome.running ? (config.fingers[index] ?? '·') : '·'}
      </DrillPrompt>

      <div className={styles.pulse}>
        <ProgressRing
          progress={metronome.running ? ((metronome.beat % 4) + 1) / 4 : 0}
          value={metronome.running ? String((metronome.beat % 4) + 1) : '·'}
          unit={`${bpm} BPM`}
          size={104}
        />
        <HandDiagram
          hand={hand}
          highlight={metronome.running ? ((config.fingers[index] ?? null) as FingerNumber | null) : null}
          showNumbers
          size={168}
        />
      </div>

      <StepStrip
        items={strip}
        index={metronome.running ? index : -1}
        showProgress={metronome.running}
        wrong={wrong !== null}
        label="The line"
      />

      <div className={styles.board}>
        <HandKeyboard
          layoutId={LAYOUT_ID}
          done={played}
          lit={index === 0 && keys[0] ? [keys[0].midi] : undefined}
          wrong={wrong}
          showNames={showNames}
          onKeyPress={press}
          footerNote={metronome.running ? 'Land with the click' : 'Start the click first'}
        />
      </div>

      <p className={styles.note}>
        Metronome is the boss; the fingers follow. A missed note is not a reason to hurry the next
        one — reconnect with the beat and carry on.
      </p>
    </DrillShell>
  );
}

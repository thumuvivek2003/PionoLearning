import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
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
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { SUPPORT_LABELS, SUPPORT_LADDER } from '../data/pulseDrills';
import type { ClickSupport, PulseDrillConfig } from '../data/pulseDrills';
import { countLabel } from '../data/noteValues';
import { BeatBar } from '../components/BeatBar';
import { Keyboard } from '../components/Keyboard';
import styles from '../components/rhythm.module.css';

/** The click, and the louder one that marks a downbeat. */
const CLICK_MIDI = 84;
const ACCENT_GAIN = 1.6;

/** A tap this far from a count belongs to that count rather than the next one. */
const CLAIM_MS = 400;

/** A bar this accurate has earned one less layer of click. */
const LADDER_RATE = 0.75;

/**
 * 3.1.1 – 3.1.7 — the pulse itself.
 *
 * Nothing here is about notes, so the input is a pad rather than a keyboard:
 * one tap per beat, measured against when the beat was actually due. That is
 * the same measurement the whole level uses, and it is the only way a screen can
 * tell an even pulse from one that merely feels even.
 *
 * Two things it can say that a metronome cannot. It scores **per beat of the
 * bar**, so "you rush beat three" is a sentence rather than a suspicion. And
 * when the click drops out, it keeps measuring — the first beat back after a
 * silent bar is scored on its own, because carrying a pulse through silence is
 * the actual skill and coming back early is what almost everyone does.
 */
export function PulseDrill({ config }: { config: PulseDrillConfig }) {
  const [tempo, setTempo] = useState(config.tempos[0] ?? 60);
  const [silentBars, setSilentBars] = useState(config.silentBars);
  const [showKeyboard, setShowKeyboard] = useState(config.withKeyboard);
  /** Which rung of the support ladder the practice is on. */
  const [rung, setRung] = useState(0);
  const [rungNote, setRungNote] = useState<string | null>(null);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout('25'), []);
  const { book, record, clear } = useScoreBook();

  const [tally, setTally] = useState<TimingTally>(EMPTY_TIMING);
  const [returns, setReturns] = useState<TimingTally>(EMPTY_TIMING);
  const [lastNote, setLastNote] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  /** Beats already answered, so one tap cannot score twice. */
  const claimed = useRef<Set<number>>(new Set());

  /** Counts, not beats: everything is measured on the subdivision grid. */
  const slots = config.beatsPerBar * config.subdivision;
  const slot = beatMs(tempo) / config.subdivision;
  const cycle = config.soundingBars + silentBars;
  const support: ClickSupport = config.ladder ? (SUPPORT_LADDER[rung] ?? 'all') : 'all';
  /** Accuracy of the bar being played, for the ladder to judge. */
  const bar = useRef<TimingTally>(EMPTY_TIMING);

  /** True while the click is muted — the bar you have to carry alone. */
  const isSilentBar = useCallback(
    (index: number) => {
      if (silentBars === 0 || index < 0) return false;
      const which = Math.floor(index / slots);
      return which % cycle >= config.soundingBars;
    },
    [config.soundingBars, cycle, silentBars, slots],
  );

  /** Whether this count gets a click, given how much support is left. */
  const clicks = useCallback(
    (index: number) => {
      if (isSilentBar(index)) return false;
      switch (support) {
        case 'none':
          return false;
        case 'downbeat':
          return index % slots === 0;
        case 'beats':
          return index % config.subdivision === 0;
        default:
          return true;
      }
    },
    [config.subdivision, isSilentBar, slots, support],
  );

  /** Judges the bar just finished, and moves the ladder with it. */
  const judgeBar = useCallback(() => {
    if (!config.ladder) return;
    const rate = onBeatRate(bar.current);
    bar.current = EMPTY_TIMING;
    if (rate === null) return;

    setRung((current) => {
      const moved = Math.min(
        SUPPORT_LADDER.length - 1,
        Math.max(0, current + (rate >= LADDER_RATE ? 1 : -1)),
      );
      const level = SUPPORT_LADDER[moved] ?? 'all';
      setRungNote(
        moved === current
          ? `Holding at ${SUPPORT_LABELS[level]}`
          : `${moved > current ? 'Down to' : 'Back to'} ${SUPPORT_LABELS[level]}`,
      );
      return moved;
    });
  }, [config.ladder]);

  const onSlot = useCallback(
    (index: number) => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 120);
      if (index > 0 && index % slots === 0) judgeBar();
      if (!settings.soundEnabled || !clicks(index)) return;
      const downbeat = index % slots === 0;
      instrument.playMidis([CLICK_MIDI], config.accentFirst && downbeat ? ACCENT_GAIN : 0.7);
    },
    [clicks, config.accentFirst, judgeBar, settings.soundEnabled, slots],
  );

  // The metronome counts in subdivisions, so a "beat" here is one count.
  const metronome = useMetronome({ bpm: tempo * config.subdivision, onBeat: onSlot });

  const reset = useCallback(() => {
    setTally(EMPTY_TIMING);
    setReturns(EMPTY_TIMING);
    setLastNote(null);
    setRungNote(null);
    claimed.current = new Set();
    bar.current = EMPTY_TIMING;
  }, []);

  useEffect(() => {
    reset();
  }, [config, reset, silentBars, tempo]);

  /** Scores one tap against the beat it was aiming at. */
  const tap = useCallback(() => {
    const at = metronome.elapsed();
    if (at === null) return;

    const index = Math.round(at / slot);
    const error = at - index * slot;
    if (Math.abs(error) > Math.min(CLAIM_MS, slot / 2) || index < 0) return;
    if (claimed.current.has(index)) return;
    claimed.current.add(index);

    const position = index % slots;
    // Scores are filed under the count itself, so "&" can be slower than "1".
    const label = countLabel(position / config.subdivision, config.beatsPerBar);

    // An unmarked count is one you were asked to leave alone.
    if (!(config.playOn[position] ?? true)) {
      record(label, false, null);
      setLastNote(`"${label}" is silent here — the pulse carries on without you`);
      return;
    }

    setTally((current) => recordTiming(current, error));
    bar.current = recordTiming(bar.current, error);
    // The first count back after silence is the honest test of an inner pulse.
    const returning = silentBars > 0 && isSilentBar(index - 1) && !isSilentBar(index);
    if (returning) setReturns((current) => recordTiming(current, error));
    record(label, Math.abs(error) <= ON_BEAT_MS, Math.abs(error));
    setLastNote(returning ? `Back in — ${timingNote(error)}` : `"${label}" ${timingNote(error)}`);
  }, [config.beatsPerBar, config.playOn, config.subdivision, isSilentBar, metronome, record, silentBars, slot, slots]);

  useKeyboardShortcuts(useMemo(() => ({ ' ': tap }), [tap]), metronome.running);

  const press = (key: PianoKey) => {
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    tap();
  };

  const spots = weakSpots(book, { targetMs: ON_BEAT_MS });
  const rate = onBeatRate(tally);
  const returnRate = meanTiming(returns);
  const position = metronome.beat < 0 ? -1 : metronome.beat % slots;
  const silentNow = isSilentBar(metronome.beat);
  const counted = position < 0 ? '·' : countLabel(position / config.subdivision, config.beatsPerBar);

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Tempo" hint="Every beat should be the same distance from the next.">
            <SegmentedControl
              value={String(tempo)}
              options={config.tempos.map((bpm) => ({ value: String(bpm), label: `${bpm}` }))}
              onChange={(value) => setTempo(Number(value))}
              block
              ariaLabel="Tempo"
            />
          </Field>
          {config.silentBars > 0 && (
            <Field label="Silence" hint="How many bars the click drops out for.">
              <SegmentedControl
                value={String(silentBars)}
                options={[
                  { value: '1', label: '1 bar' },
                  { value: '2', label: '2 bars' },
                ]}
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
            {metronome.running ? 'Stop' : 'Start the pulse'}
          </Button>
          <CounterRow>
            {config.ladder && (
              <Counter
                label="Click"
                value={SUPPORT_LABELS[support]}
                hint={`rung ${rung + 1} of ${SUPPORT_LADDER.length}`}
              />
            )}
            <Counter
              label="On the beat"
              value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
              hint={`inside ${ON_BEAT_MS}ms`}
            />
            <Counter label="Average off" value={formatMs(meanTiming(tally))} hint={timingBias(tally)} />
            {silentBars > 0 && (
              <Counter
                label="Coming back"
                value={formatMs(returnRate)}
                hint={`${returns.notes} returns`}
              />
            )}
          </CounterRow>
          {config.withKeyboard && (
            <Toggle
              checked={showKeyboard}
              onChange={setShowKeyboard}
              label="Show the keyboard"
              description="Play a single key on the beat as well as tapping."
            />
          )}
          <WeakSpots
            spots={spots}
            emptyNote="Nothing weak yet — tap a few bars."
            onClear={clear}
          />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${config.beatsPerBar}/4 · ${tempo} BPM`,
          config.subdivision === 1 ? null : config.subdivision === 2 ? 'eighths' : 'sixteenths',
          silentNow ? 'silent bar' : null,
          config.ladder ? SUPPORT_LABELS[support] : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {!metronome.running && <Chip>{rungNote ?? 'Press start, then tap on every count'}</Chip>}
            {metronome.running && lastNote && (
              <Chip tone={lastNote.includes('on the beat') ? 'accent' : 'danger'}>{lastNote}</Chip>
            )}
            {metronome.running && !lastNote && <Chip tone="accent">Tap with the click</Chip>}
          </>
        }
      >
        {metronome.running ? counted : '·'}
      </DrillPrompt>

      <BeatBar
        beatsPerBar={config.beatsPerBar}
        beat={metronome.running ? position : -1}
        subdivision={config.subdivision}
        playOn={config.playOn}
        accentFirst={config.accentFirst}
        silent={silentNow}
      />

      <button
        type="button"
        className={styles.pad}
        disabled={!metronome.running}
        onPointerDown={tap}
      >
        {flash && metronome.running ? '●' : 'Tap'}
        <span className={styles.padHint}>tap here, or press the space bar</span>
      </button>

      {config.withKeyboard && showKeyboard && (
        <div className={styles.board}>
          <Keyboard layout={layout} onKeyPress={press} footerNote="Play one key on every beat" />
        </div>
      )}

      <p className={styles.note}>
        Foot keeps the pulse · voice keeps the count · fingers play inside it. The pulse carries on
        whatever the fingers are doing.
      </p>
    </DrillShell>
  );
}

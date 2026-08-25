import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Cover, Toggle } from '@/components/ui';
import { FLAT_NAMES, SHARP_NAMES } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  RunCounters,
  StepStrip,
  TimerBar,
  WeakSpots,
  useAnswerDeadline,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { scaleName } from '../data/relatives';
import type { KeyRef } from '../data/relatives';
import { scaleKeys, scaleShape, scaleStarts } from '../data/scaleShapes';
import type { ScaleShape } from '../data/scaleShapes';
import { MISTAKE_CAUSES, allowanceAt, phaseLabel, stepsInPhase } from '../data/recallDrills';
import type { MistakeCause, RecallPhase, ScaleRecallConfig } from '../data/recallDrills';
import { ScaleKeyboard } from '../components/ScaleKeyboard';
import styles from '../components/scales.module.css';

const LAYOUT_ID = '49';
/** A note reached more slowly than this was worked out rather than recalled. */
const TARGET_MS = 1200;

/** What one key of the session cost. */
interface Round {
  key: KeyRef;
  seconds: number | null;
  mistakes: number;
  /** True when the clock ran out before the chain was finished. */
  expired: boolean;
}

/** Where a run is: which link of the chain, and how far into it. */
interface Position {
  phase: number;
  step: number;
}

/**
 * Four names for one key, with the enharmonic first among the wrong ones.
 *
 * The trap this phase exists for is A# offered beside Bb: same key under the
 * finger, and only one of them is how the scale spells it.
 */
function nameChoices(shape: ScaleShape, index: number): readonly string[] {
  const note = shape.notes[index];
  if (!note) return [];
  const correct = note.name;
  const sharp = SHARP_NAMES[note.pitchClass] as string;
  const flat = FLAT_NAMES[note.pitchClass] as string;

  const wrong = [
    // The other spelling of the same key, when there is one.
    correct === sharp ? flat : sharp,
    // The natural of the same letter, or its sharp — the other common slip.
    correct.length > 1 ? (correct[0] as string) : `${correct}#`,
    // The note the scale actually goes to next, for answering half a beat early.
    shape.notes[(index + 1) % shape.notes.length]?.name ?? correct,
  ].filter((name) => name !== correct);

  const options = [correct, ...Array.from(new Set(wrong)).slice(0, 3)];
  return [...options].sort((a, b) => a.localeCompare(b));
}

/**
 * 4.12 — the level's last bucket, and its daily measurement.
 *
 * One chain per key: find it, spell it, play it up, play it back down. Each of
 * the ten practices runs a different part of that chain, which is why they are
 * configs of one engine — the contest simulation is not a different exercise
 * from the ascending challenge, it is the same one with nothing left out.
 *
 * Three things are measured rather than one, because by this point a mistake
 * has more than one possible cause. Time per key says whether recall is quick
 * enough. The per-phase split says *which* link is slow — a good total can hide
 * a spelling problem behind fast playing. And the diagnosis tally says why the
 * wrong notes happen, which is the only one of the three that tells you which
 * practice to go back to.
 */
export function ScaleRecallDrill({ config }: { config: ScaleRecallConfig }) {
  const [showCard, setShowCard] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  const [key, setKey] = useState<KeyRef>(config.mix[0] ?? { root: 'C', scale: 'major' });
  const [at, setAt] = useState<Position>({ phase: 0, step: 0 });
  const [rounds, setRounds] = useState<readonly Round[]>([]);
  const [phaseMs, setPhaseMs] = useState<Readonly<Record<string, number>>>({});
  const [causes, setCauses] = useState<Readonly<Record<string, number>>>({});
  /** The step a wrong answer stopped on, while the cause is being chosen. */
  const [asking, setAsking] = useState<number | null>(null);
  const [fix, setFix] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [played, setPlayed] = useState<readonly number[]>([]);

  const stepAt = useRef<number | null>(null);
  const mistakes = useRef(0);
  const startedAt = useRef<number | null>(null);
  /** Set when a round ends by the clock, so it is banked once and only once. */
  const closing = useRef(false);

  const shape = useMemo(() => scaleShape(key.root, key.scale), [key.root, key.scale]);
  const done = rounds.length >= config.rounds;

  /** The eight keys of this scale, sitting in the middle of the board. */
  const keys = useMemo<readonly PianoKey[]>(() => {
    if (!shape) return [];
    const starts = scaleStarts(layout, shape);
    const start = starts[Math.max(0, Math.floor(starts.length / 2))];
    return start ? scaleKeys(layout, shape, start.midi) : [];
  }, [layout, shape]);

  const phase = (config.phases[at.phase] ?? 'play') as RecallPhase;
  const descending = phase === 'reverse';
  const order = useMemo(() => (descending ? [...keys].reverse() : keys), [descending, keys]);

  const deal = useCallback(() => {
    setKey((current) => {
      const options = config.mix.filter((entry) => entry.root !== current.root || entry.scale !== current.scale);
      const from = options.length > 0 ? options : config.mix;
      return from[Math.floor(Math.random() * from.length)] ?? current;
    });
    setAt({ phase: 0, step: 0 });
    setPlayed([]);
    setWrong(null);
    setAsking(null);
    setFix(null);
    mistakes.current = 0;
    startedAt.current = null;
    stepAt.current = null;
    closing.current = false;
  }, [config.mix]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow]);

  /** Banks the round and moves on — from the last phase, or from the clock. */
  const closeRound = useCallback(
    (expired: boolean) => {
      if (closing.current || done) return;
      closing.current = true;
      const seconds =
        startedAt.current === null ? null : (performance.now() - startedAt.current) / 1000;
      setRounds((current) => [
        ...current,
        { key, seconds, mistakes: mistakes.current, expired },
      ]);
      finish();
    },
    [done, finish, key],
  );

  const allowance = allowanceAt(config, rounds.length);
  const deadline = useAnswerDeadline({
    ms: done ? 0 : allowance,
    active: !done && asking === null && fix === null,
    resetKey: `${rounds.length}`,
    onExpire: () => closeRound(true),
  });

  /** One right step: bank its time, and move to the next link of the chain. */
  const advance = useCallback(() => {
    const now = performance.now();
    begin();
    if (startedAt.current === null) startedAt.current = now;
    const took = stepAt.current === null ? null : now - stepAt.current;
    stepAt.current = now;

    record(scaleName(key.root, key.scale), true, took);
    if (took !== null) {
      setPhaseMs((current) => ({ ...current, [phase]: (current[phase] ?? 0) + took }));
    }

    const last = at.step + 1 >= stepsInPhase(phase);
    if (!last) {
      setAt((current) => ({ ...current, step: current.step + 1 }));
      return;
    }
    if (at.phase + 1 >= config.phases.length) {
      closeRound(false);
      return;
    }
    setAt({ phase: at.phase + 1, step: 0 });
    setPlayed([]);
  }, [at, begin, closeRound, config.phases.length, key, phase, record]);

  const miss = useCallback(
    (label: string) => {
      stumble();
      mistakes.current += 1;
      record(scaleName(key.root, key.scale), false, null);
      setWrong(label);
      window.setTimeout(() => setWrong(null), 600);
      // The diagnosis is the practice in 4.12.9; elsewhere a miss just costs.
      if (config.diagnose) setAsking(at.step);
    },
    [at.step, config.diagnose, key, record, stumble],
  );

  const press = (pressed: PianoKey) => {
    if (done || asking !== null || fix !== null) return;
    if (phase === 'name') return;

    if (settings.soundEnabled) instrument.playMidis([pressed.midi]);
    const wanted = phase === 'locate' ? keys[0] : order[at.step];
    if (!wanted || pressed.midi !== wanted.midi) {
      // Named as this scale would spell it, so a correction in a flat key reads
      // "Bb is not it" rather than "A#".
      const inScale = shape?.pitchClasses.indexOf(pressed.pitchClass) ?? -1;
      miss(inScale === -1 ? pressed.sharpName : (shape?.notes[inScale]?.name ?? pressed.sharpName));
      return;
    }
    setPlayed((current) => [...current, pressed.midi]);
    advance();
  };

  const tapName = (name: string) => {
    if (done || asking !== null || fix !== null) return;
    if (name !== shape?.notes[at.step]?.name) {
      miss(name);
      return;
    }
    advance();
  };

  /** The cause is banked, the fix shown, and the phrase around the error redone. */
  const diagnose = (cause: MistakeCause) => {
    const chosen = MISTAKE_CAUSES.find((entry) => entry.value === cause);
    setCauses((current) => ({ ...current, [cause]: (current[cause] ?? 0) + 1 }));
    setFix(chosen?.fix ?? null);
    setAsking(null);
    // The repair: back up two notes, so the transition is replayed rather than
    // the single key that happened to be wrong.
    setAt((current) => ({ ...current, step: Math.max(0, current.step - 2) }));
    setPlayed([]);
  };

  const restart = () => {
    setRounds([]);
    setPhaseMs({});
    setCauses({});
    clear();
    dealNow();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const totalSeconds = rounds.reduce((sum, round) => sum + (round.seconds ?? 0), 0);
  const totalMistakes = rounds.reduce((sum, round) => sum + round.mistakes, 0);
  const clean = rounds.filter((round) => round.mistakes === 0 && !round.expired).length;
  const worstCause = Object.entries(causes).sort(([, a], [, b]) => b - a)[0];
  const causeLabel = worstCause
    ? (MISTAKE_CAUSES.find((entry) => entry.value === worstCause[0])?.label ?? '—')
    : '—';

  /** The strip: names for the spelling phase, note names for the playing ones. */
  const strip = useMemo(() => {
    if (!shape) return [];
    if (phase === 'name') {
      return shape.notes.map((note, index) => (index < at.step ? note.name : '·'));
    }
    const names = order.map((entry) => {
      const index = shape.pitchClasses.indexOf(entry.pitchClass);
      return shape.notes[index]?.name ?? entry.sharpName;
    });
    if (phase === 'locate') return [names[0] ?? '·'];
    return names.map((name, index) => (index < at.step || phase === 'find' ? name : '·'));
  }, [at.step, order, phase, shape]);

  const covered = config.blind && !done && asking === null && fix === null;
  const choices = phase === 'name' && shape ? nameChoices(shape, at.step) : [];

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          <RunCounters stats={stats} runsLabel="Keys" />
          <CounterRow>
            <Counter label="Round" value={`${Math.min(rounds.length + 1, config.rounds)}/${config.rounds}`} hint="keys this session" />
            <Counter label="Clean" value={`${clean}/${rounds.length}`} hint="no mistakes, in time" />
            <Counter
              label="Total"
              value={totalSeconds === 0 ? '—' : `${totalSeconds.toFixed(1)}s`}
              hint={rounds.length === 0 ? 'across the session' : `${(totalSeconds / rounds.length).toFixed(1)}s a key`}
            />
          </CounterRow>
          {config.phases.length > 1 && (
            <CounterRow>
              {config.phases.map((entry) => (
                <Counter
                  key={entry}
                  label={phaseLabel(entry)}
                  value={phaseMs[entry] ? `${(phaseMs[entry]! / 1000).toFixed(1)}s` : '—'}
                  hint="time in this link"
                />
              ))}
            </CounterRow>
          )}
          {config.diagnose && (
            <CounterRow>
              <Counter label="Mistakes" value={String(totalMistakes)} hint="across the session" />
              <Counter label="Usual cause" value={worstCause ? String(worstCause[1]) : '—'} hint={causeLabel} />
            </CounterRow>
          )}
          <Toggle
            checked={showCard}
            onChange={setShowCard}
            label="Show the card"
            description="One line per key — the thing worth recording each day."
          />
          <Button variant="secondary" icon="reset" onClick={restart} block>
            New session
          </Button>
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — play a few keys." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={
          done
            ? `Session done — ${clean} of ${config.rounds} clean`
            : `${scaleName(key.root, key.scale)} · ${phaseLabel(phase)}`
        }
        footer={
          <>
            {done && (
              <Chip tone={clean === config.rounds ? 'accent' : 'neutral'}>
                {totalSeconds.toFixed(1)}s total · {totalMistakes} mistake
                {totalMistakes === 1 ? '' : 's'}
              </Chip>
            )}
            {!done && wrong !== null && <Chip tone="danger">{wrong} is not it</Chip>}
            {!done && wrong === null && asking === null && fix === null && (
              <Chip>
                {phase === 'locate'
                  ? 'Press the note it starts on'
                  : `${at.step + 1} of ${stepsInPhase(phase)}`}
              </Chip>
            )}
            {fix !== null && <Chip tone="accent">Replay the three notes around it</Chip>}
          </>
        }
      >
        {done ? '✓' : phase === 'name' ? at.step + 1 : (strip[at.step] ?? '?')}
      </DrillPrompt>

      {!done && <StepStrip items={strip} index={at.step} wrong={wrong !== null} label="The scale" />}

      {!done && allowance > 0 && asking === null && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="This key" />
      )}

      {asking !== null && (
        <div className={styles.causes}>
          {MISTAKE_CAUSES.map((cause) => (
            <button
              key={cause.value}
              type="button"
              className={styles.cause}
              onClick={() => diagnose(cause.value)}
            >
              {cause.label}
            </button>
          ))}
        </div>
      )}

      {fix !== null && (
        <div className={styles.causes}>
          <p className={styles.note}>{fix}</p>
          <Button variant="secondary" onClick={() => setFix(null)} block>
            Play the phrase again
          </Button>
        </div>
      )}

      {!done && asking === null && fix === null && phase === 'name' && (
        <div className={styles.steps}>
          {choices.map((name) => (
            <button key={name} type="button" className={styles.step} onClick={() => tapName(name)}>
              {name}
              <span className={styles.stepSub}>degree {at.step + 1}</span>
            </button>
          ))}
        </div>
      )}

      {!done && phase !== 'name' && (
        <div className={styles.board}>
          <Cover covered={covered} note="Covered — the hands know where they are">
            <ScaleKeyboard
              layoutId={LAYOUT_ID}
              done={played}
              showNames={phase === 'find' && !covered}
              onKeyPress={press}
              footerNote={descending ? 'Play it downward' : 'Play the scale'}
            />
          </Cover>
        </div>
      )}

      {showCard && rounds.length > 0 && (
        <ol className={styles.card} aria-label="Session card">
          {rounds.map((round, index) => (
            <li
              key={`${round.key.root}-${index}`}
              className={cn(styles.cardRow, (round.mistakes > 0 || round.expired) && styles.cardRowMiss)}
            >
              <span className={styles.cardIndex}>{index + 1}</span>
              <span>{scaleName(round.key.root, round.key.scale)}</span>
              <span className={styles.cardTime}>
                {round.seconds === null ? '—' : `${round.seconds.toFixed(1)}s`}
              </span>
              <span>{round.expired ? 'out of time' : round.mistakes === 0 ? '✓' : `${round.mistakes}✗`}</span>
            </li>
          ))}
        </ol>
      )}

      <p className={styles.note}>
        A key, then the whole chain. The total is worth recording; the split between the links is
        worth reading.
      </p>
    </DrillShell>
  );
}

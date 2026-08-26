import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Chip, Cover, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  EMPTY_TIMING,
  StepStrip,
  TimerBar,
  WeakSpots,
  beatMs,
  onBeatRate,
  recordTiming,
  timingBias,
  useAnswerDeadline,
  useMetronome,
  useScoreBook,
  weakSpots,
} from '@/features/practice-kit';
import type { TimingTally } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { cn } from '@/lib/cn';
import type { Hand, Round } from '../performance.types';
import { dealRound } from '../data/challenges';
import type { ChallengeConfig } from '../data/challengeDrills';
import { allowanceAt } from '../data/challengeDrills';
import { ChallengeKeyboard } from '../components/ChallengeKeyboard';
import styles from '../components/performance.module.css';

const LAYOUT_ID = '49';
const CLICK_MIDI = 84;
/** How quickly a heard phrase is played back to you. */
const HEARD_GAP = 0.55;
/** A strike this far from its beat is late enough to hear. */
const ON_BEAT_MS = 130;
/** An item reached more slowly than this was recalled rather than known. */
const TARGET_MS = 1200;

/** What one round cost. */
interface Scored {
  prompt: string;
  seconds: number | null;
  misses: number;
  expired: boolean;
}

/**
 * Level 8 — everything earlier, drawn at random and against a clock.
 *
 * One engine for the whole level because the level introduces nothing: a round
 * is a thing an earlier bucket taught, dealt without warning, and what varies
 * is only which pool it came from. Notes, scales, chords and progressions all
 * arrive here as a prompt and a list of keys.
 *
 * **The first item is timed apart from the rest**, and that is the diagnosis
 * this level needs. A long pause and then a fluent scale is a *recall* problem;
 * an even crawl all the way through is an *execution* problem, and they need
 * completely different practice. A single figure for the round would report
 * them identically.
 */
export function ChallengeDrill({ config }: { config: ChallengeConfig }) {
  const [hand, setHand] = useState<Hand>('right');
  const [showNames, setShowNames] = useState(false);
  const [showCard, setShowCard] = useState(true);
  const { settings } = useSettings();
  const { book, record, clear } = useScoreBook();

  const [round, setRound] = useState<Round | null>(() => dealRound(config.challenge));
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [card, setCard] = useState<readonly Scored[]>([]);
  const startedAt = useRef<number | null>(null);
  const firstAt = useRef<number | null>(null);
  const misses = useRef(0);
  const closing = useRef(false);
  /** Time to the first item, and to everything after it, banked apart. */
  const [reactionMs, setReactionMs] = useState<readonly number[]>([]);
  const [runMs, setRunMs] = useState<readonly number[]>([]);
  const [tempo, setTempo] = useState(60);
  const [timing, setTiming] = useState<TimingTally>(EMPTY_TIMING);

  /** True when the round is played against the click rather than a stopwatch. */
  const timed = (round?.dueAt?.length ?? 0) > 0;

  const done = card.length >= config.rounds;
  const naming = (round?.choices.length ?? 0) > 0;
  const settled = round === null;

  const onBeat = useCallback(
    (beat: number) => {
      if (!settings.soundEnabled) return;
      instrument.playMidis([CLICK_MIDI], beat % 4 === 0 ? 1.1 : 0.6);
    },
    [settings.soundEnabled],
  );
  const metronome = useMetronome({ bpm: tempo, onBeat });

  const deal = useCallback(() => {
    setRound((current) => dealRound(config.challenge, current?.prompt));
    setIndex(0);
    setPlayed([]);
    setWrong(null);
    startedAt.current = null;
    firstAt.current = null;
    misses.current = 0;
    closing.current = false;
  }, [config.challenge]);

  useEffect(() => {
    deal();
  }, [deal]);

  /** Sounds a heard round: a chord as a block, a phrase one note at a time. */
  const sound = useCallback(() => {
    if (!round?.heard || !settings.soundEnabled) return;
    if (round.keys.length > 1 && round.scoreKey.includes('by ear') && round.choices.length > 0) {
      instrument.playMidis(round.keys);
      return;
    }
    // A chord to play back sounds together; a phrase sounds in order.
    if (round.labels.length > 1 && new Set(round.labels).size < round.labels.length) {
      instrument.playSequence(round.keys, HEARD_GAP);
      return;
    }
    if (round.keys.length > 1 && round.scoreKey.includes('chord')) {
      instrument.playMidis(round.keys);
      return;
    }
    instrument.playSequence(round.keys, HEARD_GAP);
  }, [round, settings.soundEnabled]);

  useEffect(() => {
    sound();
    return () => instrument.silence();
  }, [sound]);

  const closeRound = useCallback(
    (expired: boolean) => {
      if (closing.current || done || !round) return;
      closing.current = true;
      const seconds =
        startedAt.current === null ? null : (performance.now() - startedAt.current) / 1000;
      setCard((current) => [
        ...current,
        { prompt: round.prompt, seconds, misses: misses.current, expired },
      ]);
      record(round.scoreKey, !expired && misses.current === 0, seconds === null ? null : seconds * 1000);
      window.setTimeout(deal, 350);
    },
    [deal, done, record, round],
  );

  const allowance = allowanceAt(config, card.length);
  const deadline = useAnswerDeadline({
    ms: done ? 0 : allowance,
    active: !done && !settled,
    resetKey: `${card.length}:${round?.prompt ?? ''}`,
    onExpire: () => closeRound(true),
  });

  /** Banks the split between reacting and running, once the first item lands. */
  const bankFirst = (now: number) => {
    if (firstAt.current !== null || startedAt.current === null) return;
    firstAt.current = now;
    setReactionMs((current) => [...current, now - startedAt.current!]);
  };

  const press = (key: PianoKey) => {
    if (done || !round || naming) return;
    const wanted = round.keys[index];
    if (wanted === undefined) return;

    if (startedAt.current === null) startedAt.current = performance.now();

    if (key.midi !== wanted) {
      misses.current += 1;
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 350);
      return;
    }

    const now = performance.now();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    setPlayed((current) => [...current, key.midi]);

    // A round with beats is judged against the click rather than the clock.
    if (timed && metronome.running) {
      const elapsed = metronome.elapsed();
      const due = round.dueAt?.[index];
      if (elapsed !== null && due !== undefined) {
        const slot = beatMs(tempo);
        const span = ((round.dueAt?.at(-1) ?? 0) + 1) * slot;
        const into = span > 0 ? elapsed % span : elapsed;
        const error = into - due * slot;
        const folded = error > span / 2 ? error - span : error < -span / 2 ? error + span : error;
        setTiming((current) => recordTiming(current, folded));
        if (Math.abs(folded) > ON_BEAT_MS) misses.current += 1;
      }
    }

    const next = index + 1;
    if (next === round.firstItem) bankFirst(now);
    if (next >= round.keys.length) {
      if (firstAt.current !== null) setRunMs((current) => [...current, now - firstAt.current!]);
      closeRound(false);
      return;
    }
    setIndex(next);
  };

  const choose = (value: string) => {
    if (done || !round) return;
    if (startedAt.current === null) startedAt.current = performance.now();
    if (value !== round.answer) {
      misses.current += 1;
      setWrong(-1);
      window.setTimeout(() => setWrong(null), 350);
      return;
    }
    bankFirst(performance.now());
    closeRound(false);
  };

  const restart = () => {
    setCard([]);
    setReactionMs([]);
    setRunMs([]);
    setTiming(EMPTY_TIMING);
    clear();
    deal();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const mean = (values: readonly number[]) =>
    values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
  const reaction = mean(reactionMs);
  const run = mean(runMs);
  const total = card.reduce((sum, entry) => sum + (entry.seconds ?? 0), 0);
  const clean = card.filter((entry) => entry.misses === 0 && !entry.expired).length;
  const covered = config.blind && !done;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          {config.hands && (
            <Field label="Hand" hint="Alternate deliberately; neither should be the untrained one.">
              <SegmentedControl
                value={hand}
                options={[
                  { value: 'right', label: 'Right' },
                  { value: 'left', label: 'Left' },
                ]}
                onChange={(value) => setHand(value as Hand)}
                block
                ariaLabel="Hand"
              />
            </Field>
          )}
          {timed && (
            <>
              <Field label="Tempo" hint="The click decides when each strike is due.">
                <SegmentedControl
                  value={String(tempo)}
                  options={[60, 72, 84, 96].map((bpm) => ({ value: String(bpm), label: `${bpm}` }))}
                  onChange={(value) => setTempo(Number(value))}
                  block
                  ariaLabel="Tempo"
                />
              </Field>
              <Button
                variant={metronome.running ? 'danger' : 'primary'}
                icon={metronome.running ? 'stop' : 'play'}
                onClick={() => (metronome.running ? metronome.stop() : metronome.start())}
                block
              >
                {metronome.running ? 'Stop the click' : 'Start the click'}
              </Button>
            </>
          )}
          {round?.heard && (
            <Button variant="secondary" icon="play" onClick={sound} disabled={!settings.soundEnabled} block>
              Play it again
            </Button>
          )}
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <Toggle
            checked={showCard}
            onChange={setShowCard}
            label="Show the card"
            description="One line per round — the thing worth recording."
          />
          <Button variant="secondary" icon="reset" onClick={restart} block>
            New session
          </Button>
          <CounterRow>
            <Counter label="Round" value={`${Math.min(card.length + 1, config.rounds)}/${config.rounds}`} hint="of the session" />
            <Counter label="Clean" value={`${clean}/${card.length}`} hint="no misses, in time" />
            <Counter label="Total" value={total === 0 ? '—' : `${total.toFixed(1)}s`} hint="across the session" />
          </CounterRow>
          <CounterRow>
            <Counter
              label="Reaction"
              value={reaction === null ? '—' : `${(reaction / 1000).toFixed(2)}s`}
              hint="to the first key"
            />
            {timed && (
              <Counter
                label="On the beat"
                value={onBeatRate(timing) === null ? '—' : `${Math.round((onBeatRate(timing) ?? 0) * 100)}%`}
                hint={timingBias(timing)}
              />
            )}
            <Counter
              label="Run"
              value={run === null ? '—' : `${(run / 1000).toFixed(2)}s`}
              hint={
                reaction === null || run === null
                  ? 'everything after it'
                  : reaction > run
                    ? 'recall is the slow half'
                    : 'playing is the slow half'
              }
            />
          </CounterRow>
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more rounds." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={
          done
            ? `Session done — ${clean} of ${config.rounds} clean in ${total.toFixed(1)}s`
            : (round?.prompt ?? '')
        }
        footer={
          <>
            {done && (
              <Chip tone={clean === config.rounds ? 'accent' : 'neutral'}>
                {card.filter((entry) => entry.expired).length} out of time ·{' '}
                {card.reduce((sum, entry) => sum + entry.misses, 0)} misses
              </Chip>
            )}
            {!done && wrong !== null && <Chip tone="danger">Not that one</Chip>}
            {!done && !settings.soundEnabled && round?.heard && (
              <Chip tone="danger">Turn sound on in settings — this round is only sound</Chip>
            )}
            {!done && timed && !metronome.running && (
              <Chip>Start the click — this round is about when, not what</Chip>
            )}
            {!done && wrong === null && round && (
              <Chip>
                {round.heard
                  ? 'Nothing is shown — play what you heard'
                  : naming
                  ? 'Name what you heard'
                  : `${index + 1} of ${round.keys.length}${index < round.firstItem ? ' · the reaction' : ''}`}
              </Chip>
            )}
          </>
        }
      >
        {done ? '✓' : round?.heard || naming ? '♪' : (round?.labels[index] ?? '?')}
      </DrillPrompt>

      {!done && round && !naming && round.keys.length > 1 && (
        <StepStrip
          items={round.labels.map((label, at) => (at < index && !round.heard ? label : '·'))}
          index={index}
          wrong={wrong !== null}
          label="This round"
        />
      )}

      {!done && allowance > 0 && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="This round" />
      )}

      {!done && naming && round && (
        <div className={styles.steps}>
          {round.choices.map((choice) => (
            <button
              key={choice.value}
              type="button"
              className={styles.step}
              onClick={() => choose(choice.value)}
            >
              {choice.label}
              <span className={styles.stepSub}>{choice.sub}</span>
            </button>
          ))}
        </div>
      )}

      {!done && (
        <div className={styles.board}>
          <Cover covered={covered} note="Covered — find it by touch">
            <ChallengeKeyboard
              layoutId={LAYOUT_ID}
              lit={naming && !round?.heard ? round?.keys : undefined}
              done={played}
              secondary={wrong === null || wrong < 0 ? undefined : [wrong]}
              showNames={showNames && !covered}
              onKeyPress={press}
              footerNote={naming ? 'Answer below' : 'Play what was called'}
            />
          </Cover>
        </div>
      )}

      {showCard && card.length > 0 && (
        <ol className={styles.card} aria-label="Session card">
          {card.slice(-8).map((entry, at) => (
            <li
              key={`${entry.prompt}-${at}`}
              className={cn(styles.cardRow, (entry.misses > 0 || entry.expired) && styles.cardRowMiss)}
            >
              <span className={styles.cardIndex}>{card.length - Math.min(8, card.length) + at + 1}</span>
              <span>{entry.prompt}</span>
              <span className={styles.cardTime}>
                {entry.seconds === null ? '—' : `${entry.seconds.toFixed(1)}s`}
              </span>
              <span>{entry.expired ? 'out of time' : entry.misses === 0 ? '✓' : `${entry.misses}✗`}</span>
            </li>
          ))}
        </ol>
      )}

      <p className={styles.note}>
        Time to the first key is recall; everything after it is playing. They are reported apart
        because they need different practice.
      </p>
    </DrillShell>
  );
}

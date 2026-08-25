import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, ProgressRing, SegmentedControl, Toggle } from '@/components/ui';
import { noteKey, noteLabel } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  ALLOWANCE_OPTIONS,
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
  useSprint,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import {
  DIFFICULTY_LEVELS,
  WINDOW,
  judge,
  nextLevel,
  rollingAccuracy,
  verdictNote,
} from '../data/adaptive';
import { handShort } from '../data/fingers';
import { chromaticStarts, drawNotes, placeChromatic } from '../data/randomNotes';
import type { ChromaticPattern } from '../data/randomNotes';
import type { RandomNotesConfig } from '../data/randomNoteDrills';
import type { Hand } from '../finger.types';
import { HandKeyboard } from '../components/HandKeyboard';
import styles from '../components/finger.module.css';

/** Wide enough that a drawn group can sit anywhere sensible. */
const LAYOUT_ID = '49';

/** The reference's own thirty-second count. */
const SPRINT_SECONDS = 30;

/** A decision worth calling quick. */
const TARGET_MS = 1500;

const MIXED = 'mixed';

const HANDS = [
  { value: 'right' as Hand, label: 'Right hand' },
  { value: 'left' as Hand, label: 'Left hand' },
];

/**
 * 2.9.7 and 2.10.1 – 2.10.10 — notes you cannot see coming.
 *
 * Everything above this bucket taught a shape; this one takes the shapes away.
 * Notes are drawn rather than listed, because a written-out sequence becomes a
 * pattern the hand learns — which is the exact dependency the reference is
 * trying to remove. The same engine plays fixed shapes when a practice needs
 * them, which is how the white-black-white combinations of 2.9 fit here too.
 *
 * Two things it does that the earlier drills do not. A miss does **not** reset
 * the group: you play the right note and carry on, because recovering mid-line
 * is the skill, and stopping to start again is the habit worth losing. And the
 * accuracy-first practice moves its own difficulty — ten notes at 90% adds a
 * note or a black key, ten notes under 70% takes one away — so the level you
 * settle at is a measurement rather than a preference.
 */
export function RandomNotesDrill({ config }: { config: RandomNotesConfig }) {
  const [hand, setHand] = useState<Hand>('right');
  const [patternId, setPatternId] = useState<string>(
    config.patterns && config.patterns.length > 1 ? MIXED : (config.patterns?.[0]?.id ?? ''),
  );
  const [allowance, setAllowance] = useState(ALLOWANCE_OPTIONS[0]?.value ?? '3000');
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const { book, record, clear } = useScoreBook();

  /** Where the adaptive practice currently sits. */
  const [level, setLevel] = useState(0);
  const [levelNote, setLevelNote] = useState<string | null>(null);
  /** Every note attempted, right or wrong — what the ladder judges. */
  const results = useRef<boolean[]>([]);

  const difficulty = config.challenge === 'adaptive' ? DIFFICULTY_LEVELS[level] : undefined;
  const length = difficulty?.length ?? config.length;
  const scope = difficulty?.scope ?? config.scope;

  const [keys, setKeys] = useState<readonly PianoKey[]>([]);
  const [shape, setShape] = useState<ChromaticPattern | null>(null);
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [missedHere, setMissedHere] = useState(false);
  const stepAt = useRef<number | null>(null);
  const [sprintScore, setSprintScore] = useState({ right: 0, asked: 0 });

  /** Deals the next group: drawn from the board, or one of the fixed shapes. */
  const deal = useCallback(() => {
    if (config.patterns && config.patterns.length > 0) {
      const chosen =
        patternId === MIXED
          ? (config.patterns[Math.floor(Math.random() * config.patterns.length)] as ChromaticPattern)
          : (config.patterns.find((entry) => entry.id === patternId) ?? config.patterns[0]);
      const pattern = chosen as ChromaticPattern;
      const starts = chromaticStarts(layout, pattern);
      const start = starts[Math.floor(Math.random() * starts.length)];
      setShape(pattern);
      setKeys(start ? (placeChromatic(layout, start, pattern.semitones) ?? []) : []);
    } else {
      setShape(null);
      setKeys(drawNotes(layout, { length, scope, spanSemitones: config.spanSemitones, turns: config.turns }));
    }
    setIndex(0);
    setPlayed([]);
    setWrong(null);
    setMissedHere(false);
    stepAt.current = performance.now();
  }, [config.patterns, config.spanSemitones, config.turns, layout, length, patternId, scope]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, hand, level, patternId]);

  const expected = keys[index];
  const complete = keys.length > 0 && index >= keys.length;

  const sprint = useSprint({
    seconds: SPRINT_SECONDS,
    onStart: () => setSprintScore({ right: 0, asked: 0 }),
  });
  const frozen = config.challenge === 'timed' && sprint.status === 'done';

  /** Records one note against the ladder, and moves it when the window is full. */
  const registerResult = useCallback(
    (isRight: boolean) => {
      if (config.challenge !== 'adaptive') return;
      results.current = [...results.current, isRight].slice(-WINDOW);
      if (results.current.length < WINDOW) return;

      const verdict = judge(rollingAccuracy(results.current));
      setLevel((current) => {
        const moved = nextLevel(current, verdict);
        setLevelNote(verdictNote(verdict, DIFFICULTY_LEVELS[moved] ?? DIFFICULTY_LEVELS[0]!));
        // A judged window starts a fresh one, so a level is earned each time.
        if (moved !== current) results.current = [];
        return moved;
      });
    },
    [config.challenge],
  );

  const missNote = useCallback(() => {
    if (!expected) return;
    stumble();
    setMissedHere(true);
    record(noteKey(expected.pitchClass, 'both'), false, null);
    registerResult(false);
    if (config.challenge === 'timed' && sprint.status === 'running') {
      setSprintScore((current) => ({ right: current.right, asked: current.asked + 1 }));
    }
  }, [config.challenge, expected, record, registerResult, sprint.status, stumble]);

  const allowanceMs =
    config.challenge === 'adaptive'
      ? (difficulty?.allowanceMs ?? 0)
      : config.challenge === 'timed'
        ? Number(allowance)
        : 0;

  const deadline = useAnswerDeadline({
    ms: allowanceMs,
    active: !complete && !frozen && keys.length > 0,
    // Notes, not groups: every note gets its own allowance.
    resetKey: `${keys[0]?.midi ?? 0}:${index}:${stats.runs}:${stats.stumbles}`,
    onExpire: missNote,
  });

  const press = (key: PianoKey) => {
    if (complete || frozen || !expected) return;

    if (key.midi !== expected.midi) {
      missNote();
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }

    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    setPlayed((current) => [...current, key.midi]);

    const now = performance.now();
    const previous = stepAt.current;
    // A note reached after a miss is a correction, not a decision — untimed.
    record(noteKey(key.pitchClass, 'both'), !missedHere, missedHere || previous === null ? null : now - previous);
    if (!missedHere) registerResult(true);
    if (config.challenge === 'timed' && sprint.status === 'running') {
      setSprintScore((current) => ({
        right: current.right + (missedHere ? 0 : 1),
        asked: current.asked + (missedHere ? 0 : 1),
      }));
    }
    stepAt.current = now;
    setMissedHere(false);

    const next = index + 1;
    setIndex(next);
    // A stumble never restarts the group — carrying on is the exercise.
    if (next >= keys.length) finish();
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const accuracy = rollingAccuracy(results.current);
  const strip = keys.map((key, position) => {
    const finger = shape?.fingers?.[position];
    return `${noteLabel(key.pitchClass, 'both').label}${finger ? `·${finger}` : ''}`;
  });

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Hand" hint="Alternate them — the left hand gets less of this work.">
            <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
          </Field>
          {config.patterns && config.patterns.length > 1 && (
            <Field label="Shape" hint="Mixed draws a different combination each time.">
              <SegmentedControl
                value={patternId}
                options={[
                  ...config.patterns.map((entry) => ({ value: entry.id, label: entry.label })),
                  { value: MIXED, label: 'Mixed' },
                ]}
                onChange={setPatternId}
                block
                ariaLabel="Shape"
              />
            </Field>
          )}
          {config.challenge === 'timed' && (
            <>
              <Field label="Allowance" hint="Drop a step only while accuracy holds.">
                <SegmentedControl
                  value={allowance}
                  options={ALLOWANCE_OPTIONS}
                  onChange={setAllowance}
                  block
                  ariaLabel="Time per note"
                />
              </Field>
              <ProgressRing
                progress={sprint.progress}
                value={String(sprint.remainingSeconds)}
                unit={sprint.status === 'done' ? 'time up' : 'seconds'}
              />
              <Button
                variant={sprint.status === 'running' ? 'secondary' : 'primary'}
                icon={sprint.status === 'running' ? 'reset' : 'play'}
                onClick={sprint.status === 'running' ? sprint.stop : sprint.start}
                block
              >
                {sprint.status === 'running' ? 'Stop the count' : 'Start 30 seconds'}
              </Button>
              {sprint.status !== 'idle' && (
                <CounterRow>
                  <Counter
                    label="Correct"
                    value={String(sprintScore.right)}
                    hint={`of ${sprintScore.asked} in ${SPRINT_SECONDS}s`}
                  />
                </CounterRow>
              )}
            </>
          )}
          {config.challenge === 'adaptive' && (
            <CounterRow>
              <Counter
                label="Level"
                value={String(level + 1)}
                hint={difficulty?.label ?? ''}
              />
              <Counter
                label="Last 10"
                value={accuracy === null ? '—' : `${Math.round(accuracy * 100)}%`}
                hint={`${results.current.length}/${WINDOW} notes`}
              />
            </CounterRow>
          )}
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New group
          </Button>
          <RunCounters stats={stats} runsLabel="Groups" />
          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — a few more groups." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${handShort(hand)} · ${keys.length} ${keys.length === 1 ? 'note' : 'notes'}`,
          shape?.label ?? (scope === 'all' ? 'black and white' : 'white keys'),
        ].join(' · ')}
        footer={
          <>
            {frozen && <Chip tone="accent">Time — {sprintScore.right} correct</Chip>}
            {!frozen && complete && (
              <Chip tone="accent">
                {levelNote ?? 'Group complete'}
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!frozen && !complete && wrong !== null && (
              <Chip tone="danger">Not that one — play the right note and carry on</Chip>
            )}
            {!frozen && !complete && wrong === null && (
              <Chip>
                Note {index + 1} of {keys.length}
              </Chip>
            )}
          </>
        }
      >
        {expected ? noteLabel(expected.pitchClass, 'both').label : complete ? '✓' : '—'}
      </DrillPrompt>

      {allowanceMs > 0 && !complete && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="Play in" />
      )}

      <StepStrip
        items={strip}
        index={complete ? -1 : index}
        wrong={wrong !== null}
        label="The group"
      />

      <div className={styles.board}>
        <HandKeyboard
          layoutId={LAYOUT_ID}
          done={played}
          wrong={wrong}
          showNames={showNames}
          onKeyPress={press}
          footerNote={frozen ? 'Count finished' : 'Play the notes in order'}
        />
      </div>

      <p className={styles.note}>
        See · locate · decide · play · move · next. The finger follows the hand, not a table.
      </p>
    </DrillShell>
  );
}

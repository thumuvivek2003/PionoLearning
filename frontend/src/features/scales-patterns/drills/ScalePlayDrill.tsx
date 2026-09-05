import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import type { FingerNumber, Hand } from '@/features/finger-training';
import { HandDiagram, handShort } from '@/features/finger-training';
import {
  BeatLamps,
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  EMPTY_TIMING,
  GuidedNote,
  GuidedSound,
  LEAD_IN_BEATS,
  PlayWhere,
  RunCounters,
  StageRow,
  StepStrip,
  WeakSpots,
  beatMs,
  evenness,
  formatMs,
  onBeatRate,
  percent,
  recordTiming,
  timingBias,
  useGuidedRun,
  useMetronome,
  useScoreBook,
  useTimedRun,
  weakSpots,
} from '@/features/practice-kit';
import type { GuidedTick, PlaySurface, TimingTally } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import {
  crossingsIn,
  degreeAt,
  fingeringFor,
  scaleKeys,
  scaleShape,
  scaleStarts,
} from '../data/scaleShapes';
import type { ScalePlayConfig } from '../data/playDrills';
import { ScaleKeyboard } from '../components/ScaleKeyboard';
import styles from '../components/scales.module.css';

const LAYOUT_ID = '49';
const CLICK_MIDI = 84;
const BEATS_PER_BAR = 4;
/** Notes in a windowed run — the size the reference practises transitions in. */
const GROUP = 4;

/** How far apart two hands may land and still count as together. */
const TOGETHER_MS = 100;

/** A note reached this slowly is being worked out rather than played. */
const TARGET_MS = 900;

const HANDS = [
  { value: 'right' as Hand, label: 'Right hand' },
  { value: 'left' as Hand, label: 'Left hand' },
];

const DIRECTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'both', label: 'Up and back' },
];

interface Landing {
  hand: Hand;
  at: number;
}

/**
 * 4.2.3 – 4.2.7 — the scale under the hands.
 *
 * Everything the level has built arrives here at once: the notes come from the
 * formula, the fingering comes from the crossing work of level 2, and the
 * timing comes from level 3. So the drill measures all three — where the notes
 * are, how evenly they are spaced, and what the crossing costs.
 *
 * **The crossing gap is kept apart from the others**, because that is where a
 * scale actually goes wrong: a run can be right in every note and still lurch
 * at the thumb, and an average across eight notes hides exactly that. Two hands
 * add the gap between them, since a scale played together is judged on landing
 * together rather than on either hand alone.
 */
export function ScalePlayDrill({ config }: { config: ScalePlayConfig }) {
  const [hand, setHand] = useState<Hand>(config.hands[0] ?? 'right');
  const directions = useMemo(
    () => DIRECTIONS.filter((entry) => (config.directions ?? []).length === 0 || config.directions?.includes(entry.value)),
    [config.directions],
  );
  const [direction, setDirection] = useState<string>(directions[0]?.value ?? 'up');
  const [tempo, setTempo] = useState(config.tempos[0] ?? 60);
  const [subdivision, setSubdivision] = useState(config.subdivisions?.[0] ?? 1);
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();
  /** Clean runs asked for before the practice counts the stage as held. */
  const target = config.cleanTarget ?? 3;

  /**
   * Which instrument this practice is running on.
   *
   * Seeded from the app-wide preference but held locally, so someone at the
   * piano can still drop one drill back to the screen — to check a fingering,
   * say — without changing how every other practice behaves.
   */
  const [surface, setSurface] = useState<PlaySurface>(
    settings.externalKeyboard ? 'external' : 'screen',
  );
  useEffect(() => {
    setSurface(settings.externalKeyboard ? 'external' : 'screen');
  }, [settings.externalKeyboard]);
  const guiding = surface === 'external';
  /** Sound each cue as it falls due, so a run can be checked by ear. */
  const [guideNotes, setGuideNotes] = useState(false);

  /** The key this practice is running in — one of several, for the rotation. */
  const [keyIndex, setKeyIndex] = useState(0);
  const inKey = config.keys?.[keyIndex] ?? { root: config.root, scale: config.scale ?? 'major' };

  const layout = useMemo(() => getKeyboardLayout(LAYOUT_ID), []);
  const shape = useMemo(() => scaleShape(inKey.root, inKey.scale), [inKey.root, inKey.scale]);
  const { book, record, clear } = useScoreBook();

  const hands = useMemo<readonly Hand[]>(
    () => (config.together ? config.hands : [hand]),
    [config.hands, config.together, hand],
  );

  /** Where each hand's scale sits: the right at middle C, the left below it. */
  const runs = useMemo(() => {
    if (!shape) return new Map<Hand, readonly PianoKey[]>();
    const starts = scaleStarts(layout, shape);
    const middle = Math.max(0, Math.floor(starts.length / 2));
    const entries = hands.map((entry) => {
      const start = starts[entry === 'right' ? middle : Math.max(0, middle - 1)];
      return [entry, start ? scaleKeys(layout, shape, start.midi) : []] as const;
    });
    return new Map<Hand, readonly PianoKey[]>(entries);
  }, [hands, layout, shape]);

  const fingering = useMemo(
    () => new Map(hands.map((entry) => [entry, fingeringFor(inKey.root, entry)] as const)),
    [hands, inKey.root],
  );

  const [offset, setOffset] = useState(0);
  const [index, setIndex] = useState(0);
  const [landed, setLanded] = useState<readonly Landing[]>([]);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [timing, setTiming] = useState<TimingTally>(EMPTY_TIMING);
  const [gaps, setGaps] = useState<readonly number[]>([]);
  const [crossGaps, setCrossGaps] = useState<readonly number[]>([]);
  const [handGaps, setHandGaps] = useState<readonly number[]>([]);
  const [lastEven, setLastEven] = useState<number | null>(null);
  const [clean, setClean] = useState(0);
  const stepAt = useRef<number | null>(null);
  /** Set by any wrong note, so a run knows whether it stayed clean. */
  const dirty = useRef(false);

  /** Which four notes a windowed run covers, rotated one window per run. */
  const [groupAt, setGroupAt] = useState(0);

  /**
   * The order the run visits its notes: up, down, or up and back — and, for the
   * technique practices, only the stretch of the scale being isolated.
   *
   * Practising a difficult transition inside the whole scale means playing
   * seven easy notes for every hard one, which is why 4.11 works in windows.
   */
  const order = useMemo(() => {
    const length = 8;
    const all = Array.from({ length }, (_, position) => position);
    const segment = config.segment ?? 'full';

    let positions = all;
    if (segment !== 'full') {
      const first = hands[0] ?? 'right';
      const marks = crossingsIn(fingeringFor(inKey.root, first), first);
      const start =
        segment === 'crossing'
          ? Math.min(Math.max(0, (marks[0] ?? 3) - 2), length - GROUP)
          : Math.min(groupAt * 2, length - GROUP);
      positions = all.slice(start, start + GROUP);
    }

    const down = [...positions].reverse();
    if (direction === 'up') return positions;
    if (direction === 'down') return down;
    return [...positions, ...down.slice(1)];
  }, [config.segment, direction, groupAt, hands, inKey.root]);

  /** Which positions in the order are thumb crossings, for the timing split. */
  const crossings = useMemo(() => {
    const first = hands[0] ?? 'right';
    const marks = new Set(crossingsIn(fingering.get(first) ?? [], first));
    return order.map((position, step) => step > 0 && marks.has(position));
  }, [fingering, hands, order]);

  const onBeat = useCallback(
    (beat: number) => {
      if (!config.metronome || !settings.soundEnabled) return;
      instrument.playMidis([CLICK_MIDI], beat % BEATS_PER_BAR === 0 ? 1.1 : 0.6);
    },
    [config.metronome, settings.soundEnabled],
  );

  const metronome = useMetronome({ bpm: tempo, onBeat });

  /** Deals a run, and picks where it starts when the practice moves that. */
  const deal = useCallback(() => {
    if (config.segment === 'groups') setGroupAt((current) => (current + 1) % 3);
    dirty.current = false;
    setOffset(config.randomStart ? Math.floor(Math.random() * 7) : 0);
    setIndex(0);
    setLanded([]);
    setPlayed([]);
    setWrong(null);
    setGaps([]);
    stepAt.current = null;
  }, [config.randomStart, config.segment]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, direction, hand, keyIndex, subdivision, tempo]);

  const positionAt = (step: number) => (order[step] ?? 0);
  /** A random-start run enters the scale partway and wraps round it. */
  const noteFor = (entry: Hand, step: number): PianoKey | undefined => {
    const keys = runs.get(entry) ?? [];
    const position = (positionAt(step) + offset) % 7;
    return keys[position];
  };

  /**
   * What each slot of a guided run sounds like.
   *
   * Clicks are accented at the bar so the count stays findable away from the
   * screen, and the notes between clicks get a quieter tick — at two or four
   * notes per click the subdivision is the thing being learnt, so it has to be
   * audible rather than merely implied.
   *
   * A plain function rather than a memoised one: the engine reads it afresh on
   * every slot, so it always sees this render's hand, key and offset.
   */
  const handleTick = ({ counting, index: cue, onBeat: onClick, accented }: GuidedTick) => {
    if (!settings.soundEnabled) return;
    instrument.playMidis([CLICK_MIDI], onClick ? (accented ? 1.1 : 0.6) : 0.25);
    if (counting || !guideNotes) return;
    for (const entry of hands) {
      const key = noteFor(entry, cue);
      if (key) instrument.playMidis([key.midi], 0.85);
    }
  };

  const guided = useGuidedRun({
    length: order.length,
    bpm: tempo,
    subdivision,
    onTick: handleTick,
    // A pass boundary is the only honest place to move what a run is about, so
    // the rotating practices advance there rather than mid-scale.
    onCycle: () => {
      if (config.segment === 'groups') setGroupAt((current) => (current + 1) % 3);
      if (config.randomStart) setOffset(Math.floor(Math.random() * 7));
    },
  });

  /** Which cue the screen is on: the beat's in guided mode, the press's on screen. */
  const cue = guiding ? guided.index : index;
  /** A guided run goes round rather than ending, so nothing is ever complete. */
  const complete = !guiding && order.length > 0 && index >= order.length;
  const owed = hands;

  const press = (key: PianoKey) => {
    if (guiding || complete) return;

    const pressedHand = hands.find((entry) => noteFor(entry, index)?.midi === key.midi);
    if (!pressedHand) {
      dirty.current = true;
      stumble();
      record(`degree ${degreeAt(positionAt(index) + offset)}`, false, null);
      setWrong(key.midi);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    if (landed.some((entry) => entry.hand === pressedHand)) return;

    const now = performance.now();
    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    setWrong(null);
    setPlayed((current) => [...current, key.midi]);

    const landings = [...landed, { hand: pressedHand, at: now }];
    if (landings.length < owed.length) {
      setLanded(landings);
      return;
    }

    // The step is complete: bank its gap, and keep the crossing gap apart.
    const previous = stepAt.current;
    if (previous !== null) {
      const gap = now - previous;
      if (crossings[index]) setCrossGaps((current) => [...current, gap]);
      else setGaps((current) => [...current, gap]);
    }
    if (landings.length > 1) {
      const times = landings.map((entry) => entry.at);
      setHandGaps((current) => [...current, Math.max(...times) - Math.min(...times)]);
    }
    if (config.metronome && metronome.running) {
      const at = metronome.elapsed();
      if (at !== null) {
        const slot = beatMs(tempo) / subdivision;
        const error = at - Math.round(at / slot) * slot;
        setTiming((current) => recordTiming(current, error));
      }
    }
    record(
      `degree ${degreeAt(positionAt(index) + offset)}`,
      true,
      previous === null ? null : now - previous,
    );
    stepAt.current = now;

    setLanded([]);
    const next = index + 1;
    setIndex(next);
    if (next >= order.length) {
      setLastEven(evenness(gaps));
      settleRun(!dirty.current);
      finish();
    }
  };

  /**
   * What a finished run does to the streak and the tempo.
   *
   * The ladder only climbs on clean runs and drops on a stumble, so the
   * practice parks itself at the fastest tempo you can actually play rather
   * than the fastest you can attempt — which is the reference's rule, applied
   * without having to remember it.
   */
  function settleRun(wasClean: boolean) {
    const streak = wasClean ? clean + 1 : 0;
    setClean(streak >= target ? 0 : streak);
    if (!config.ladder) return;
    const at = config.tempos.indexOf(tempo);
    if (!wasClean) {
      setTempo(config.tempos[Math.max(0, at - 1)] ?? tempo);
      return;
    }
    if (streak >= target) setTempo(config.tempos[Math.min(config.tempos.length - 1, at + 1)] ?? tempo);
  }

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const mean = (values: readonly number[]) =>
    values.length === 0 ? null : values.reduce((sum, gap) => sum + gap, 0) / values.length;
  const meanCross = mean(crossGaps);
  const meanHands = mean(handGaps);
  const meanGap = mean(gaps);
  /**
   * The crossing measured against the notes around it.
   *
   * A screen cannot hear a thumb accent, but it can see the hesitation that
   * comes with one: an even scale takes the same time into the thumb note as
   * into any other, so anything far from 1.0 is the bump made visible.
   */
  const bump = meanCross !== null && meanGap !== null && meanGap > 0 ? meanCross / meanGap : null;
  const rate = onBeatRate(timing);
  const first = hands[0] ?? 'right';
  const fingers = fingering.get(first) ?? [];
  /** The notes due on this cue, for the board to light in guided mode. */
  const cueMidis = guiding
    ? hands.flatMap((entry) => {
        const key = noteFor(entry, cue);
        return key ? [key.midi] : [];
      })
    : [];
  /** Cues already gone by this pass, so the board shows how far round it is. */
  const passDone = guiding
    ? order.slice(0, cue).flatMap((_position, at) =>
        hands.flatMap((entry) => {
          const key = noteFor(entry, at);
          return key ? [key.midi] : [];
        }),
      )
    : played;

  const strip = order.map((position, step) => {
    const finger = fingers[position];
    const label = finger ? String(finger) : '·';
    return step < cue ? label : crossings[step] ? `↷${label}` : label;
  });

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          <PlayWhere
            value={surface}
            onChange={setSurface}
            hint="On my keyboard counts you in and moves the cue on the beat."
          />
          {!config.together && config.hands.length > 1 && (
            <Field label="Hand" hint="The two hands cross in different places.">
              <SegmentedControl value={hand} options={HANDS} onChange={setHand} block ariaLabel="Hand" />
            </Field>
          )}
          {(config.keys?.length ?? 0) > 1 && (
            <Field label="Key" hint="Rotate through them; a movement learnt in one key is a position.">
              <SegmentedControl
                value={String(keyIndex)}
                options={(config.keys ?? []).map((entry, index) => ({
                  value: String(index),
                  label: `${entry.root}${entry.scale === 'natural-minor' ? 'm' : ''}`,
                }))}
                onChange={(value) => setKeyIndex(Number(value))}
                block
                ariaLabel="Key"
              />
            </Field>
          )}
          {(config.subdivisions?.length ?? 0) > 1 && (
            <Field label="Notes per click" hint="Two and four only once one is solid.">
              <SegmentedControl
                value={String(subdivision)}
                options={(config.subdivisions ?? []).map((count) => ({
                  value: String(count),
                  label: `${count}`,
                }))}
                onChange={(value) => setSubdivision(Number(value))}
                block
                ariaLabel="Notes per click"
              />
            </Field>
          )}
          {directions.length > 1 && (
          <Field label="Direction">
            <SegmentedControl
              value={direction}
              options={directions}
              onChange={setDirection}
              block
              ariaLabel="Direction"
            />
          </Field>
          )}
          {(config.metronome || guiding) && (
            <Field
              label="Tempo"
              hint={guiding ? 'The cue moves at this speed.' : 'One note per click.'}
            >
              <SegmentedControl
                value={String(tempo)}
                options={config.tempos.map((bpm) => ({ value: String(bpm), label: `${bpm}` }))}
                onChange={(value) => setTempo(Number(value))}
                block
                ariaLabel="Tempo"
              />
            </Field>
          )}

          {guiding ? (
            <>
              {/* One transport: the click and the cue are the same run here. */}
              <Button
                variant={guided.running ? 'danger' : 'primary'}
                icon={guided.running ? 'stop' : 'play'}
                onClick={guided.toggle}
                block
              >
                {guided.running ? 'Stop' : `Start — ${LEAD_IN_BEATS} beat count-in`}
              </Button>
              <GuidedSound />
              <Toggle
                checked={guideNotes}
                onChange={setGuideNotes}
                label="Play the notes too"
                description="Hear each note as it falls due, to check yourself against. Off is the drill."
              />
              <GuidedNote />
              {/*
                * The ladder is the one thing worth keeping away from the screen,
                * since parking at the fastest tempo you can actually play is the
                * whole method. Nothing can judge the pass but you, so you say.
                */}
              <CounterRow>
                <Counter label="Passes" value={String(guided.cycles)} hint="times round the scale" />
                <Counter
                  label="Clean runs"
                  value={`${clean}/${target}`}
                  hint={config.ladder ? 'a full set moves the tempo up' : 'in a row, by your own ear'}
                />
              </CounterRow>
              <Button variant="success" icon="check" size="sm" onClick={() => settleRun(true)} block>
                That pass was clean
              </Button>
              <Button variant="ghost" icon="x" size="sm" onClick={() => settleRun(false)} block>
                I stumbled
              </Button>
            </>
          ) : (
            <>
              {config.metronome && (
                <Button
                  variant={metronome.running ? 'danger' : 'primary'}
                  icon={metronome.running ? 'stop' : 'play'}
                  onClick={() => (metronome.running ? metronome.stop() : metronome.start())}
                  block
                >
                  {metronome.running ? 'Stop the click' : 'Start the click'}
                </Button>
              )}
              <Button variant="secondary" icon="reset" onClick={dealNow} block>
                New run
              </Button>
              <RunCounters stats={stats} runsLabel="Scales" />
          <CounterRow>
            <Counter
              label="Evenness"
              value={percent(lastEven)}
              hint={config.focus === 'evenness' ? 'the measure for this one' : 'between the notes'}
            />
            <Counter
              label={config.focus === 'crossing' ? 'Thumb bump' : 'Crossing'}
              value={
                config.focus === 'crossing'
                  ? bump === null
                    ? '—'
                    : `${bump.toFixed(2)}×`
                  : formatMs(meanCross)
              }
              hint={
                config.focus === 'crossing'
                  ? bump === null
                    ? 'play a run through'
                    : bump <= 1.15
                      ? 'no bump worth hearing'
                      : 'the thumb note is arriving late'
                  : 'the thumb turning under'
              }
            />
            <Counter
              label="Clean runs"
              value={`${clean}/${target}`}
              hint={config.ladder ? 'a full set moves the tempo up' : 'in a row, no wrong notes'}
            />
            {config.together && (
              <Counter
                label="Together"
                value={formatMs(meanHands)}
                hint={meanHands !== null && meanHands <= TOGETHER_MS ? 'tight' : 'aim under 100ms'}
              />
            )}
            {config.metronome && (
              <Counter
                label="On the beat"
                value={rate === null ? '—' : `${Math.round(rate * 100)}%`}
                hint={timingBias(timing)}
              />
            )}
              </CounterRow>
              <WeakSpots
                spots={spots}
                emptyNote="Nothing weak yet — play it through."
                onClear={clear}
              />
            </>
          )}

          <Toggle checked={showNames} onChange={setShowNames} label="Names on the keys" />
        </>
      }
    >
      <DrillPrompt
        label={[
          `${shape?.label ?? inKey.root} · ${config.together ? 'both hands' : handShort(hand)}`,
          config.segment === 'crossing'
            ? 'the crossing alone'
            : config.segment === 'groups'
              ? `group ${groupAt + 1} of 3`
              : null,
          config.randomStart ? `from degree ${degreeAt(offset)}` : null,
          config.metronome || guiding
            ? `${tempo} BPM${subdivision > 1 ? ` · ${subdivision} per click` : ''}`
            : null,
          guiding ? 'on your keyboard' : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          guiding ? (
            <>
              {guided.phase === 'idle' && <Chip>Hands ready, then press start</Chip>}
              {guided.phase === 'counting' && (
                <Chip tone="next">Count in — {guided.countIn}</Chip>
              )}
              {guided.phase === 'playing' && (
                <Chip tone={crossings[cue] ? 'accent' : 'neutral'}>
                  {crossings[cue] ? 'Crossing here' : `Note ${cue + 1} of ${order.length}`}
                </Chip>
              )}
            </>
          ) : (
            <>
              {complete && (
                <Chip tone="accent">
                  Scale complete
                  {lastEven === null ? '' : ` — ${percent(lastEven)} even`}
                </Chip>
              )}
              {!complete && wrong !== null && (
                <Chip tone="danger">Not that one — check the finger</Chip>
              )}
              {!complete && wrong === null && (
                <Chip tone={crossings[index] ? 'accent' : 'neutral'}>
                  {crossings[index] ? 'Crossing here' : `Note ${index + 1} of ${order.length}`}
                </Chip>
              )}
            </>
          )
        }
      >
        {/*
          * The count-in takes the prompt over: it is the one moment the screen
          * has to be read from the bench, with hands already on the keys.
          */}
        {guiding && guided.phase === 'counting'
          ? guided.countIn
          : guiding && guided.phase === 'idle'
            ? '·'
            : complete
              ? '✓'
              : (fingers[positionAt(cue)] ?? '·')}
      </DrillPrompt>

      {guiding && <BeatLamps beat={guided.beatInBar} />}

      <StageRow>
        {hands.map((entry) => (
          <HandDiagram
            key={entry}
            hand={entry}
            highlight={complete ? null : ((fingering.get(entry)?.[positionAt(cue)] ?? null) as FingerNumber | null)}
            showNumbers
            size={config.together ? 160 : 190}
          />
        ))}
      </StageRow>

      <StepStrip
        items={strip}
        index={complete ? -1 : cue}
        showProgress={!guiding || guided.phase !== 'idle'}
        wrong={wrong !== null}
        label="The scale"
      />

      <div className={styles.board}>
        {/*
          * Guided mode is the one place this board shows the note that is due.
          * Everywhere else that would be giving the answer away, but away from
          * the screen there is nothing else to read: no press to mark, so the
          * board stops being an input and becomes the part you play from.
          */}
        <ScaleKeyboard
          layoutId={LAYOUT_ID}
          lit={guiding && guided.phase === 'playing' ? cueMidis : undefined}
          done={guiding ? passDone : played}
          secondary={wrong === null ? undefined : [wrong]}
          showNames={showNames}
          onKeyPress={guiding ? undefined : press}
          footerNote={
            guiding
              ? 'Play this on your own keyboard — the cue moves on the beat'
              : 'Play the scale with the fingering shown'
          }
        />
      </div>

      <p className={styles.note}>
        The notes are the easy part. The thumb turning under quietly, in time, is the scale.
      </p>
    </DrillShell>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';

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
import type { ChordForm, ChordQuality, Inversion } from '../chords.types';
import { chordForm, formulaLine, toneName } from '../data/triads';
import { inversionName, inversionShort, patternOf, playable, voicingOf } from '../data/inversions';
import type { TriadBuildConfig } from '../data/buildDrills';
import { allowanceAt } from '../data/buildDrills';
import { ChordKeyboard } from '../components/ChordKeyboard';
import styles from '../components/chords.module.css';

const LAYOUT_ID = '25';
/** A chord tone found this slowly was worked out rather than known. */
const TARGET_MS = 1200;

/**
 * Which chord comes next.
 *
 * A free draw lets the same chord repeat and lets a practice that is supposed
 * to be about *changing* shape spend half its rounds not changing it. So a
 * practice can ask to alternate instead: `'roots'` swaps to a different root
 * every round, and `'quality'` keeps the root and flips the third, which is the
 * one-note comparison 5.3.9 is built on.
 */
function nextTriad(
  config: TriadBuildConfig,
  current: ChordForm | null,
  qualities: readonly ChordQuality[],
): ChordForm | null {
  if (config.alternate === 'quality' && current?.quality === 'major') {
    // Pairs: a root's major, then the same root's minor, then a new root.
    return chordForm(current.root, 'minor') ?? current;
  }

  const roots =
    config.alternate && current
      ? config.roots.filter((root) => root !== current.root)
      : config.roots;
  const from = roots.length > 0 ? roots : config.roots;
  const wanted: readonly ChordQuality[] = config.alternate === 'quality' ? ['major'] : qualities;

  const options = from.flatMap((root) =>
    wanted.flatMap((quality) => {
      const form = chordForm(root, quality);
      return form && form.id !== current?.id ? [form] : [];
    }),
  );
  return options[Math.floor(Math.random() * options.length)] ?? current;
}

/**
 * The chord put under the hand — most of 5.1 through 5.5.
 *
 * One chain per chord: press its notes from the bottom up, in whatever position
 * was asked for. Everything that varies between the practices is configuration
 * — how many notes, which qualities, which inversions, whether the degree is
 * cued, whether a clock is running — which is why fifteen practices across five
 * buckets share this engine rather than forking it.
 *
 * **The time to each tone is banked by degree, not by position**, and that is
 * the point. A chord has one interesting note in it: the fifth is identical
 * across qualities and the root is given to you, so a slow chord is almost
 * always slow at the third. Keying by degree means that stays true in an
 * inversion, where the third is no longer the second note pressed.
 */
export function TriadBuildDrill({ config }: { config: TriadBuildConfig }) {
  const [quality, setQuality] = useState<string>(
    config.qualities.length > 1 ? 'both' : (config.qualities[0] ?? 'major'),
  );
  const [showNames, setShowNames] = useState(config.cues);
  const { settings } = useSettings();

  const { book, record, clear } = useScoreBook();

  const [form, setForm] = useState<ChordForm | null>(
    () => chordForm(config.roots[0] ?? 'C', config.qualities[0] ?? 'major'),
  );
  const [inversion, setInversion] = useState<Inversion>(config.inversions?.[0] ?? 0);
  const [size, setSize] = useState(config.sizes[0] ?? 3);
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState<readonly number[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [rounds, setRounds] = useState(0);
  /** Time spent reaching each degree, kept apart so the third can be read. */
  const [degreeMs, setDegreeMs] = useState<Readonly<Record<string, number>>>({});
  const [degreeHits, setDegreeHits] = useState<Readonly<Record<string, number>>>({});

  const stepAt = useRef<number | null>(null);
  const closing = useRef(false);

  /** The chord in the position being asked for, lowest note first. */
  const voicing = useMemo(
    () => (form ? voicingOf(form, inversion) : null),
    [form, inversion],
  );
  const voiced = voicing?.midis ?? [];
  /** The degrees in the order this position sounds them. */
  const degrees = voicing?.degrees ?? [];

  const deal = useCallback(() => {
    const qualities: readonly ChordQuality[] =
      quality === 'both' ? config.qualities : ([quality] as readonly ChordQuality[]);

    const next = nextTriad(config, form, qualities);
    setForm(next);
    // Only positions the chord really has: a triad has no third inversion.
    const wanted = playable(next ?? undefined as never, config.inversions ?? [0]);
    const options = wanted.length > 0 ? wanted : [0 as Inversion];
    setInversion(
      config.alternate === 'inversion'
        ? (options[(options.indexOf(inversion) + 1) % options.length] ?? 0)
        : (options[Math.floor(Math.random() * options.length)] ?? 0),
    );
    setSize(config.sizes[Math.floor(Math.random() * config.sizes.length)] ?? next?.tones ?? 3);
    setIndex(0);
    setPlayed([]);
    setWrong(null);
    stepAt.current = null;
    closing.current = false;
  }, [config, form, inversion, quality]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  useEffect(() => {
    dealNow();
  }, [dealNow, quality]);

  const complete = index >= size;
  /**
   * What a round is filed under.
   *
   * The chord and its position together, because "G major first inversion" is a
   * different thing to have learnt than "G major", and a practice that drills
   * positions needs the ledger to tell them apart.
   */
  const scoreKey =
    form === null
      ? ''
      : (config.inversions?.length ?? 0) > 1
        ? `${form.symbol} ${inversionShort(inversion)}`
        : form.label;

  const close = useCallback(
    (expired: boolean) => {
      if (closing.current) return;
      closing.current = true;
      setRounds((current) => current + 1);
      if (expired) {
        stumble();
        if (form) record(scoreKey, false, null);
      } else if (config.sound && settings.soundEnabled) {
        // Sounding the finished chord is the result of the build, and in the
        // stacking practice it is the whole lesson.
        instrument.playMidis(voiced.slice(0, size));
      }
      finish();
    },
    [config.sound, finish, form, record, scoreKey, settings.soundEnabled, size, stumble, voiced],
  );

  const allowance = allowanceAt(config, rounds);
  const deadline = useAnswerDeadline({
    ms: allowance,
    active: !complete,
    resetKey: `${form?.id ?? ''}:${inversion}:${rounds}`,
    onExpire: () => close(true),
  });

  const press = (key: PianoKey) => {
    if (complete || !form) return;

    const wanted = voiced[index];
    if (wanted === undefined || key.midi !== wanted) {
      stumble();
      record(scoreKey, false, null);
      setWrong(key.sharpName);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }

    const now = performance.now();
    begin();
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    const took = stepAt.current === null ? null : now - stepAt.current;
    stepAt.current = now;

    // Banked per degree, so the third's cost survives being inverted.
    const degree = degrees[index] ?? String(index + 1);
    if (took !== null) {
      setDegreeMs((current) => ({ ...current, [degree]: (current[degree] ?? 0) + took }));
      setDegreeHits((current) => ({ ...current, [degree]: (current[degree] ?? 0) + 1 }));
    }
    record(scoreKey, true, took);

    setPlayed((current) => [...current, key.midi]);
    const next = index + 1;
    setIndex(next);
    if (next >= size) close(false);
  };

  const spots = weakSpots(book, { targetMs: TARGET_MS });
  const meanOf = (degree: string) =>
    degreeHits[degree] ? (degreeMs[degree] ?? 0) / (degreeHits[degree] ?? 1) : null;
  // Whichever third this chord has — a minor one is written differently.
  const thirdMs = meanOf('3') ?? meanOf('♭3');
  const fifthMs = meanOf('5');
  /**
   * The third measured against the fifth.
   *
   * The fifth is the same note in both qualities, so it is the fair baseline:
   * anything much above 1.0 says the formula is still being worked out rather
   * than known.
   */
  const thirdCost = thirdMs !== null && fifthMs !== null && fifthMs > 0 ? thirdMs / fifthMs : null;

  const tones = voicing?.notes.slice(0, size) ?? [];
  const strip = tones.map((note, at) =>
    at < index || complete ? note.name : config.cues ? (degrees[at] ?? '·') : '·',
  );
  /** Which pressed note is the third, wherever the inversion has put it. */
  const thirdAt = degrees.findIndex((degree) => degree === '3' || degree === '♭3');

  return (
    <DrillShell
      goal={config.goal}
      steps={config.guidance}
      watchFor={config.watchFor}
      aside={
        <>
          {config.qualities.length > 1 && (
            <Field label="Quality" hint="Both is the drill; one at a time is the practice.">
              <SegmentedControl
                value={quality}
                options={[
                  ...config.qualities.map((entry) => ({ value: entry, label: entry })),
                  { value: 'both', label: 'Both' },
                ]}
                onChange={setQuality}
                block
                ariaLabel="Chord quality"
              />
            </Field>
          )}
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill — the formula has to place the notes."
          />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New chord
          </Button>
          <RunCounters stats={stats} runsLabel="Chords" />
          <CounterRow>
            <Counter
              label="The third"
              value={thirdMs === null ? '—' : `${(thirdMs / 1000).toFixed(2)}s`}
              hint="the note that decides the chord"
            />
            <Counter
              label="Its cost"
              value={thirdCost === null ? '—' : `${thirdCost.toFixed(2)}×`}
              hint={
                thirdCost === null
                  ? 'against the fifth'
                  : thirdCost <= 1.2
                    ? 'no slower than the fifth'
                    : 'the formula is still being worked out'
              }
            />
          </CounterRow>
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — build a few chords." onClear={clear} />
        </>
      }
    >
      <DrillPrompt
        label={[
          form?.label ?? '—',
          size < (form?.tones ?? 3)
            ? `${size} note${size === 1 ? '' : 's'}`
            : (config.inversions?.length ?? 0) > 1
              ? `${inversionName(inversion)} · ${patternOf(form ?? undefined as never, inversion)}`
              : formulaLine(form?.quality ?? 'major'),
          config.cues && !complete ? toneName(index) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        footer={
          <>
            {complete && (
              <Chip tone="accent">
                {size < (form?.tones ?? 3) ? `${size} notes` : (form?.symbol ?? '✓')}
                {stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            )}
            {!complete && wrong !== null && (
              <Chip tone="danger">
                {wrong} is not {degrees[index] ?? 'next'}
              </Chip>
            )}
            {!complete && wrong === null && (
              <Chip tone={index === thirdAt ? 'accent' : 'neutral'}>
                {index === thirdAt
                  ? 'The third — this is the one that matters'
                  : `${degrees[index] ?? '?'} of the chord`}
              </Chip>
            )}
          </>
        }
      >
        {complete ? (form?.symbol ?? '✓') : (degrees[index] ?? '?')}
      </DrillPrompt>

      <div className={styles.tones}>
        {tones.map((note, at) => (
          <span key={`${note.name}-${at}`} className={cn(styles.tone, at === thirdAt && styles.toneThird)}>
            {at < index || complete ? note.name : '·'}
            <span className={styles.toneDegree}>{degrees[at]}</span>
          </span>
        ))}
      </div>

      {allowance > 0 && !complete && (
        <TimerBar progress={deadline.progress} remainingMs={deadline.remainingMs} label="This chord" />
      )}

      <StepStrip items={strip} index={complete ? -1 : index} wrong={wrong !== null} label="The chord" />

      <div className={styles.board}>
        <ChordKeyboard
          layoutId={LAYOUT_ID}
          done={played}
          secondary={complete ? voiced.slice(0, size) : undefined}
          showNames={showNames}
          onKeyPress={press}
          footerNote="Play the chord one note at a time, lowest first"
        />
      </div>

      <p className={styles.note}>
        {(config.inversions?.length ?? 0) > 1
          ? 'Root position is 1 - 3 - 5, first inversion 3 - 5 - 1, second 5 - 1 - 3. Same chord, different order.'
          : 'Major is 1 - 3 - 5 and minor is 1 - ♭3 - 5. The root and the fifth never move.'}
      </p>
    </DrillShell>
  );
}

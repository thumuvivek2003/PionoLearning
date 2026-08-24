import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  WeakSpots,
  useQuizDrill,
  useSprint,
  weakSpots,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LANDMARK_RULES, groupLabel } from '../data/blackKeys';
import { LAYOUT_OPTIONS, WIDE_LAYOUT_ID } from '../data/layouts';
import { boardRegions, keyLabel, keysOfLetter, regionOf, regionSpan } from '../data/octaves';
import type { BoardRegion } from '../data/octaves';
import type { SprintDrillConfig } from '../data/landmarkDrills';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import styles from '../components/geography.module.css';

/** Sprint lengths, in seconds — the reference asks for two minutes. */
const LENGTHS = [
  { value: '60', label: '1 min' },
  { value: '120', label: '2 min' },
];

/** A landmark to find, and where on the board it has to be found. */
interface Prompt {
  id: string;
  letter: Letter;
  /** Null when any octave counts. */
  region: BoardRegion | null;
}

const ANY_REGION = 'any';

/** Answers carry the region, so "right note, wrong end of the board" is a miss. */
function answerFor(letter: string, regionId: string): string {
  return `${letter}:${regionId}`;
}

function buildPool(
  layout: KeyboardLayout,
  letters: readonly Letter[],
  byRegion: boolean,
): readonly Prompt[] {
  if (!byRegion) {
    return letters.map<Prompt>((letter) => ({ id: `any-${letter}`, letter, region: null }));
  }

  // A short board's top third may hold no F at all — an unanswerable prompt.
  return boardRegions(layout).flatMap((region) =>
    letters
      .filter((letter) =>
        keysOfLetter(layout, letter).some((key) => region.octaves.includes(key.octave)),
      )
      .map<Prompt>((letter) => ({ id: `${region.id}-${letter}`, letter, region })),
  );
}

/**
 * 1.4.1, 1.4.2 and 1.4.7 — the landmark hunt, against the clock.
 *
 * Recognition is a speed skill, so this drill is scored the way a speed skill
 * has to be: a fixed window, a count at the end, and a per-landmark ledger that
 * says which of C and F — and which end of the board — is holding you up. By
 * region exists to stop the easy version of this drill, where you answer twenty
 * times in the octave already under your eyes.
 */
export function LandmarkSprintDrill({ config }: { config: SprintDrillConfig }) {
  const [layoutId, setLayoutId] = useState(WIDE_LAYOUT_ID);
  const [byRegion, setByRegion] = useState(config.byRegion);
  const [length, setLength] = useState(LENGTHS[1]?.value ?? '120');
  const [focusWeak, setFocusWeak] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const regions = useMemo(() => boardRegions(layout), [layout]);
  const pool = useMemo(() => buildPool(layout, config.letters, byRegion), [byRegion, config.letters, layout]);

  const answerOf = useMemo(
    () => (prompt: Prompt) => answerFor(prompt.letter, prompt.region?.id ?? ANY_REGION),
    [],
  );
  const scoreKeyOf = useMemo(
    () => (prompt: Prompt) =>
      prompt.region ? `${prompt.letter} · ${prompt.region.label}` : prompt.letter,
    [],
  );

  const drill = useQuizDrill<Prompt, string>({
    pool,
    answerOf,
    scoreKeyOf,
    strategyId: focusWeak ? 'weak-focus' : 'spread',
  });
  const { question, verdict, stats } = drill;
  const settled = verdict !== 'waiting';

  const seconds = Number(length);
  const sprint = useSprint({ seconds, onStart: drill.reset });
  const finished = sprint.status === 'done';

  const [lastPressed, setLastPressed] = useState<number | null>(null);

  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  const press = useCallback(
    (key: PianoKey) => {
      if (finished || key.isBlack) return;
      setLastPressed(key.midi);
      if (settings.soundEnabled) instrument.playMidis([key.midi]);
      const region = byRegion ? regionOf(regions, key.octave) : undefined;
      drill.answer(answerFor(key.sharpName, byRegion ? (region?.id ?? 'none') : ANY_REGION));
    },
    [byRegion, drill, finished, regions, settings.soundEnabled],
  );

  const rule = LANDMARK_RULES[question.letter];
  const spots = weakSpots(drill.scores);
  const perMinute = stats.correct > 0 ? Math.round((stats.correct / seconds) * 60) : 0;
  const pressedKey = layout.keys.find((key) => key.midi === lastPressed);
  const rightLetter = pressedKey?.sharpName === question.letter;

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Sprint" hint="A fixed window is what makes the count mean anything.">
            <SegmentedControl
              value={length}
              options={LENGTHS}
              onChange={setLength}
              block
              ariaLabel="Sprint length"
            />
          </Field>
          <Button
            variant={sprint.status === 'running' ? 'secondary' : 'primary'}
            icon={sprint.status === 'running' ? 'reset' : 'play'}
            onClick={sprint.status === 'running' ? sprint.stop : sprint.start}
            block
          >
            {sprint.status === 'running' ? `${sprint.remainingSeconds}s left — stop` : 'Start sprint'}
          </Button>
          <Field label="Target" hint="By region moves you around instead of letting you camp.">
            <SegmentedControl
              value={byRegion ? 'region' : 'anywhere'}
              options={[
                { value: 'anywhere', label: 'Anywhere' },
                { value: 'region', label: 'By region' },
              ]}
              onChange={(value) => setByRegion(value === 'region')}
              block
              ariaLabel="Target area"
            />
          </Field>
          <Field label="Keyboard">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={focusWeak}
            onChange={setFocusWeak}
            label="Focus my weak spots"
            description="Asks more often for whatever you are slowest or least sure on."
          />
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill — the black-key group is the only clue you need."
          />
          {finished && (
            <CounterRow>
              <Counter label="Finds" value={String(stats.correct)} hint={`in ${seconds}s`} />
              <Counter label="Per minute" value={String(perMinute)} hint="20+ is the pass mark" />
            </CounterRow>
          )}
          <ScoreBoard stats={stats} onReset={drill.reset} />
          <WeakSpots spots={spots} emptyNote="Nothing weak yet — keep hunting." />
        </>
      }
    >
      <DrillPrompt
        label={question.region ? `${question.region.label} third of the board` : 'Find any'}
        footer={
          <>
            {finished && <Chip tone="accent">Sprint over — {stats.correct} finds</Chip>}
            {!finished && verdict === 'correct' && (
              <Chip tone="accent">{pressedKey ? keyLabel(pressedKey) : 'Found it'}</Chip>
            )}
            {!finished && verdict === 'wrong' && (
              <Chip tone="danger">
                {rightLetter && question.region
                  ? `Right note, ${question.region.label.toLowerCase()} third`
                  : `That was ${pressedKey ? pressedKey.sharpName : 'a black key'}`}
              </Chip>
            )}
            {!finished && !settled && (
              <Chip>
                {question.region
                  ? regionSpan(question.region)
                  : `${groupLabel(rule.group)} → ${rule.where.toLowerCase()}`}
              </Chip>
            )}
          </>
        }
      >
        {question.letter}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={
            verdict === 'correct' && lastPressed !== null ? [lastPressed] : undefined
          }
          secondaryMidis={verdict === 'wrong' && lastPressed !== null ? [lastPressed] : undefined}
          // The region is the prompt's other half, so the board shows where it is.
          doneMidis={
            question.region
              ? layout.keys
                  .filter((key) => question.region?.octaves.includes(key.octave))
                  .map((key) => key.midi)
              : undefined
          }
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote={
            finished ? 'Sprint over — start another' : `Press any ${question.letter} you can find`
          }
        />
      </div>

      <p className={styles.landmark}>{rule.detail}</p>
    </DrillShell>
  );
}

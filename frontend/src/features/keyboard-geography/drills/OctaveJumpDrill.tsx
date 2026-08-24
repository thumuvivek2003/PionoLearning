import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import { DrillPrompt, DrillShell, ScoreBoard, useQuizDrill } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LAYOUT_OPTIONS, WIDE_LAYOUT_ID } from '../data/layouts';
import { jumpLabel, keyLabel, keysOfLetter, octaveKey } from '../data/octaves';
import type { JumpDirection, JumpDrillConfig } from '../data/octaveDrills';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import styles from '../components/geography.module.css';

/** One lit key and the octave to land on. */
interface Prompt {
  id: string;
  anchor: PianoKey;
  target: PianoKey;
  /** Signed: +1 an octave up, -1 an octave down. */
  octaves: number;
}

const DIRECTIONS = [
  { value: 'up' as JumpDirection, label: 'Up' },
  { value: 'down' as JumpDirection, label: 'Down' },
  { value: 'mixed' as JumpDirection, label: 'Mixed' },
];

/** Value of the "any of the offered sizes" option in the distance control. */
const MIXED_DISTANCE = 'mixed';

function distanceOptions(distances: readonly number[]) {
  return [
    ...distances.map((size) => ({
      value: String(size),
      label: size === 1 ? '1 octave' : `${size} octaves`,
    })),
    { value: MIXED_DISTANCE, label: 'Mixed' },
  ];
}

/**
 * Every jump the board can actually offer.
 *
 * A key near either end has no partner an octave away, so it is left out — the
 * pool only ever holds jumps that can be landed.
 */
function buildPool(
  layout: KeyboardLayout,
  letters: readonly Letter[],
  direction: JumpDirection,
  sizes: readonly number[],
): readonly Prompt[] {
  const signs = direction === 'mixed' ? [1, -1] : direction === 'up' ? [1] : [-1];

  const prompts = letters.flatMap((letter) =>
    keysOfLetter(layout, letter).flatMap((anchor) =>
      sizes.flatMap((size) =>
        signs.flatMap((sign) => {
          const octaves = size * sign;
          const target = octaveKey(layout, anchor.midi, octaves);
          return target ? [{ id: `${anchor.midi}:${octaves}`, anchor, target, octaves }] : [];
        }),
      ),
    ),
  );

  // A short board may have no room for the wider jumps at all. One octave
  // always fits, so fall back to it rather than leaving nothing to ask.
  const oneOctave = sizes.length === 1 && sizes[0] === 1;
  return prompts.length > 0 || oneOctave ? prompts : buildPool(layout, letters, direction, [1]);
}

/**
 * 1.3.3 and 1.3.6 — land the same letter one octave away.
 *
 * The answer is a key, not a name: the skill is a hand that travels the right
 * distance, so the only way to give it is to hit the key. The lit anchor stays
 * pressable and never counts as an answer, because playing it first and then
 * jumping is exactly what the drill asks for.
 */
export function OctaveJumpDrill({ config }: { config: JumpDrillConfig }) {
  const [layoutId, setLayoutId] = useState(WIDE_LAYOUT_ID);
  const [direction, setDirection] = useState<JumpDirection>(config.initialDirection);
  const [distance, setDistance] = useState<string>(String(config.distances[0] ?? 1));
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const sizes = useMemo(
    () => (distance === MIXED_DISTANCE ? config.distances : [Number(distance)]),
    [config.distances, distance],
  );
  const pool = useMemo(
    () => buildPool(layout, config.letters, direction, sizes),
    [config.letters, direction, layout, sizes],
  );
  const answerOf = useMemo(() => (prompt: Prompt) => prompt.target.midi, []);

  const drill = useQuizDrill<Prompt, number>({ pool, answerOf });
  const { question, verdict, given, stats } = drill;
  const settled = verdict !== 'waiting';

  const [lastPressed, setLastPressed] = useState<number | null>(null);

  // A new prompt clears the last press so the board starts clean.
  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  const press = (key: PianoKey) => {
    if (key.isBlack) return;
    if (settings.soundEnabled) instrument.playMidis([key.midi]);
    // Playing the anchor before jumping is the drill, so it is never an answer.
    if (key.midi === question.anchor.midi) return;
    setLastPressed(key.midi);
    drill.answer(key.midi);
  };

  const givenKey = layout.keys.find((key) => key.midi === given);

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Direction">
            <SegmentedControl
              value={direction}
              options={DIRECTIONS}
              onChange={setDirection}
              block
              ariaLabel="Jump direction"
            />
          </Field>
          {config.distances.length > 1 && (
            <Field label="Distance" hint="Two octaves is where the hand stops stepping there.">
              <SegmentedControl
                value={distance}
                options={distanceOptions(config.distances)}
                onChange={setDistance}
                block
                ariaLabel="Jump distance"
              />
            </Field>
          )}
          <Field label="Keyboard" hint="More octaves means the jump can start anywhere.">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill: the landing key is found by its landmark."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={`${jumpLabel(question.octaves)} from the lit key`}
        footer={
          <>
            {verdict === 'correct' && (
              <Chip tone="accent">
                {keyLabel(question.anchor)} → {keyLabel(question.target)}
              </Chip>
            )}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                {givenKey ? `${keyLabel(givenKey)} — same letter, other height` : 'Not that one'}
              </Chip>
            )}
            {!settled && <Chip>Play the lit key, then jump</Chip>}
          </>
        }
      >
        {question.anchor.sharpName}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={[question.anchor.midi]}
          // On a hit the target lights up; a miss shows where the hand landed.
          secondaryMidis={
            verdict === 'correct'
              ? [question.target.midi]
              : verdict === 'wrong' && lastPressed !== null
                ? [lastPressed]
                : undefined
          }
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote="Press the key an octave away"
        />
      </div>

      <p className={styles.landmark}>
        {`${keyLabel(question.anchor)} · the landing key sits against the same landmark, ${jumpLabel(question.octaves).toLowerCase()}.`}
      </p>
    </DrillShell>
  );
}

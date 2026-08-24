import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  useQuizDrill,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LANDMARK_RULES } from '../data/blackKeys';
import type { LandmarkDrillConfig } from '../data/blackKeyDrills';
import { LAYOUT_OPTIONS } from '../data/layouts';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { NoteButtons } from '../components/NoteButtons';
import styles from '../components/geography.module.css';

/** Asked by its name, or by the landmark alone. */
type Direction = 'byName' | 'byLandmark' | 'mixed';

interface Prompt {
  id: string;
  letter: Letter;
  byLandmark: boolean;
}

const DIRECTIONS = [
  { value: 'byName' as Direction, label: 'By name' },
  { value: 'byLandmark' as Direction, label: 'By landmark' },
  { value: 'mixed' as Direction, label: 'Mixed' },
];

function buildPool(letters: readonly Letter[], direction: Direction): readonly Prompt[] {
  const named = letters.map<Prompt>((letter) => ({ id: `n-${letter}`, letter, byLandmark: false }));
  const landmarked = letters.map<Prompt>((letter) => ({
    id: `l-${letter}`,
    letter,
    byLandmark: true,
  }));

  if (direction === 'byName') return named;
  if (direction === 'byLandmark') return landmarked;
  return [...named, ...landmarked];
}

/**
 * 1.2.3 – 1.2.9 — find a white key from the black-key group beside it.
 *
 * Two ways round, both answered by pressing the key: "here is C, find it" and
 * the harder "here is the rule, which key is it?" — where the letter is never
 * shown, so the only route to the answer is through the landmark.
 */
export function LandmarkNoteDrill({ config }: { config: LandmarkDrillConfig }) {
  const [direction, setDirection] = useState<Direction>('byName');
  const [layoutId, setLayoutId] = useState('25');
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const pool = useMemo(() => buildPool(config.letters, direction), [config.letters, direction]);
  const answerOf = useMemo(() => (prompt: Prompt) => prompt.letter, []);

  const drill = useQuizDrill<Prompt, Letter>({ pool, answerOf });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';
  const rule = LANDMARK_RULES[question.letter];

  const [lastPressed, setLastPressed] = useState<number | null>(null);
  /** Octaves the answer has been found in, to push the cross-octave work. */
  const [octaves, setOctaves] = useState<readonly number[]>([]);

  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  useEffect(() => {
    setOctaves([]);
  }, [layoutId, direction]);

  const press = (key: PianoKey) => {
    if (key.isBlack) return;
    setLastPressed(key.midi);
    if (settings.soundEnabled) instrument.play([key.pitchClass]);
    if (key.sharpName === expected) {
      setOctaves((current) =>
        current.includes(key.octave) ? current : [...current, key.octave],
      );
    }
    drill.answer(key.sharpName as Letter);
  };

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          <Field label="Prompt">
            <SegmentedControl
              value={direction}
              options={DIRECTIONS}
              onChange={setDirection}
              block
              ariaLabel="Prompt style"
            />
          </Field>
          <Field label="Keyboard" hint="A wider board means more of the same landmark to find.">
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
            description="Off is the drill: the landmark has to do the work."
          />
          <CounterRow>
            <Counter
              label="Octaves found"
              value={String(octaves.length)}
              hint="press it in more than one place"
            />
          </CounterRow>
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={question.byLandmark ? 'Which white key is this?' : rule.where}
        wide={question.byLandmark}
        footer={
          <>
            {verdict === 'correct' && (
              <Chip tone="accent">
                {expected} — {rule.where.toLowerCase()}
              </Chip>
            )}
            {verdict === 'wrong' && <Chip tone="danger">That was {given} — look again</Chip>}
            {!settled && <Chip>Find it and press it</Chip>}
          </>
        }
      >
        {question.byLandmark ? rule.where : question.letter}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={
            settled && verdict === 'correct' && lastPressed !== null ? [lastPressed] : undefined
          }
          secondaryMidis={verdict === 'wrong' && lastPressed !== null ? [lastPressed] : undefined}
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote="Press the white key you were asked for"
        />
      </div>

      {question.byLandmark && settled && (
        <NoteButtons onAnswer={drill.answer} correct={expected} wrong={given} disabled />
      )}

      <p className={styles.landmark}>{rule.detail}</p>
    </DrillShell>
  );
}

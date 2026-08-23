import { useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { PitchClass } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
import { DrillPrompt, DrillShell, ScoreBoard, useQuizDrill } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { BLACK_KEYS, blackKeySpec } from '../data/blackKeys';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LabelButtons } from '../components/LabelButtons';
import styles from '../components/geography.module.css';

type Direction = 'sharpToFlat' | 'flatToSharp' | 'mixed';

interface Prompt {
  id: string;
  pitchClass: PitchClass;
  /** True when the sharp is shown and the flat is wanted. */
  fromSharp: boolean;
}

const DIRECTIONS = [
  { value: 'sharpToFlat' as Direction, label: '♯ → ♭' },
  { value: 'flatToSharp' as Direction, label: '♭ → ♯' },
  { value: 'mixed' as Direction, label: 'Mixed' },
];

function buildPool(direction: Direction): readonly Prompt[] {
  const sharps = BLACK_KEYS.map<Prompt>((spec) => ({
    id: `s-${spec.pitchClass}`,
    pitchClass: spec.pitchClass,
    fromSharp: true,
  }));
  const flats = BLACK_KEYS.map<Prompt>((spec) => ({
    id: `f-${spec.pitchClass}`,
    pitchClass: spec.pitchClass,
    fromSharp: false,
  }));

  if (direction === 'sharpToFlat') return sharps;
  if (direction === 'flatToSharp') return flats;
  return [...sharps, ...flats];
}

/**
 * 1.2.13 — sharp ↔ flat, on one physical key.
 *
 * The answer is the key itself rather than a string, which is the whole lesson:
 * C# and Db are two names for one thing, so answering with the other name and
 * answering by pressing the key are the same act.
 */
export function EnharmonicDrill() {
  const [direction, setDirection] = useState<Direction>('mixed');
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const pool = useMemo(() => buildPool(direction), [direction]);
  const answerOf = useMemo(() => (prompt: Prompt) => prompt.pitchClass, []);

  const drill = useQuizDrill<Prompt, PitchClass>({ pool, answerOf });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';
  const spec = blackKeySpec(question.pitchClass);

  // Answers are the names of the kind that was *not* shown.
  const options = useMemo(
    () =>
      BLACK_KEYS.map((entry) => ({
        value: entry.pitchClass,
        label: question.fromSharp ? entry.flatName : entry.sharpName,
      })),
    [question.fromSharp],
  );

  const press = (key: PianoKey) => {
    if (!key.isBlack) return;
    if (settings.soundEnabled) instrument.play([key.pitchClass]);
    drill.answer(key.pitchClass);
  };

  return (
    <DrillShell
      goal="One black key, two names — swap between them without thinking."
      steps={[
        'Read the name you are given and say its other name.',
        'Answer with a name below, or by pressing the key itself.',
        'Say both out loud as you play it: "C sharp, D flat, one key".',
      ]}
      watchFor="Treating the flat as a different key. There are only five black keys — each one answers to two names."
      aside={
        <>
          <Field label="Direction">
            <SegmentedControl
              value={direction}
              options={DIRECTIONS}
              onChange={setDirection}
              block
              ariaLabel="Direction"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="The keys print both names, so this is the answer sheet."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={question.fromSharp ? 'Also called…' : 'Also called…'}
        footer={
          <>
            {verdict === 'correct' && spec && (
              <Chip tone="accent">
                {spec.sharpName} = {spec.flatName} · {spec.positionLabel}
              </Chip>
            )}
            {verdict === 'wrong' && (
              <Chip tone="danger">
                That key is {blackKeySpec(given ?? -1)?.sharpName ?? '—'} — try again
              </Chip>
            )}
            {!settled && <Chip>Answer, or press the key</Chip>}
          </>
        }
      >
        {question.fromSharp ? spec?.sharpName : spec?.flatName}
      </DrillPrompt>

      <LabelButtons
        options={options}
        onAnswer={drill.answer}
        correct={settled ? expected : null}
        wrong={verdict === 'wrong' ? given : null}
      />

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId="25"
          // Settling lights every instance: the same key, everywhere, either name.
          litPitchClasses={settled ? [question.pitchClass] : undefined}
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote="One key, two names"
        />
      </div>
    </DrillShell>
  );
}

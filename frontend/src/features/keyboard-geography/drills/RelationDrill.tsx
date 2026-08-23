import { useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
import { DrillPrompt, DrillShell, ScoreBoard, useQuizDrill } from '@/features/practice-kit';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LANDMARK_HINT, NATURALS, stepLetter } from '../data/naturals';
import type { Relation, RelationDrillConfig } from '../geography.types';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { NoteButtons } from '../components/NoteButtons';
import styles from '../components/geography.module.css';

/** One note asked in one direction. */
interface Prompt {
  id: string;
  letter: Letter;
  relation: Relation;
}

const MIXED = 'mixed';

function buildPool(config: RelationDrillConfig, relationId: string): readonly Prompt[] {
  const relations =
    relationId === MIXED
      ? config.relations
      : config.relations.filter((relation) => relation.id === relationId);

  return relations.flatMap((relation) =>
    NATURALS.map<Prompt>((letter) => ({
      id: `${relation.id}-${letter}`,
      letter,
      relation,
    })),
  );
}

/**
 * 1.1.2 – 1.1.5 — "which letter is N white keys from this one".
 *
 * One screen, four configurations: ascending, descending, both neighbours and
 * skip-one. The answer is a letter, so it can be given three ways — a letter
 * button, the matching key on the keyboard, or the C–B keys on a computer
 * keyboard — and all three land in the same place.
 */
export function RelationDrill({ config }: { config: RelationDrillConfig }) {
  const hasChoice = config.relations.length > 1;
  const [relationId, setRelationId] = useState<string>(
    hasChoice ? MIXED : (config.relations[0]?.id ?? MIXED),
  );
  const [showNames, setShowNames] = useState(true);

  const pool = useMemo(() => buildPool(config, relationId), [config, relationId]);
  const answerOf = useMemo(
    () => (prompt: Prompt) => stepLetter(prompt.letter, prompt.relation.steps),
    [],
  );

  const drill = useQuizDrill<Prompt, Letter>({ pool, answerOf });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';

  const answerLetters = useMemo(
    () =>
      Object.fromEntries(
        NATURALS.map((letter) => [letter.toLowerCase(), () => drill.answer(letter)]),
      ),
    [drill],
  );
  useKeyboardShortcuts(answerLetters);

  const relationOptions = [
    ...config.relations.map((relation) => ({ value: relation.id, label: relation.label })),
    { value: MIXED, label: 'Mixed' },
  ];

  return (
    <DrillShell
      goal={config.goal}
      steps={config.steps}
      watchFor={config.watchFor}
      aside={
        <>
          {hasChoice && (
            <Field label="Direction">
              <SegmentedControl
                value={relationId}
                options={relationOptions}
                onChange={setRelationId}
                block
                ariaLabel="Direction"
              />
            </Field>
          )}
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is closer to a real keyboard — the letters are not printed on one."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={question.relation.question}
        footer={
          <>
            {verdict === 'correct' && (
              <Chip tone="accent">
                {question.letter} → {expected}
              </Chip>
            )}
            {verdict === 'wrong' && (
              <Chip tone="danger">{given} is not it — try again</Chip>
            )}
            {!settled && <Chip>Answer, then play it</Chip>}
          </>
        }
      >
        {question.letter}
      </DrillPrompt>

      <NoteButtons
        onAnswer={drill.answer}
        correct={settled ? expected : null}
        wrong={verdict === 'wrong' ? given : null}
      />

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId="25"
          showNames={showNames}
          onKeyPress={(key: PianoKey) => {
            // Black keys are not answers here — the map is white keys only.
            if (!key.isBlack) drill.answer(key.sharpName as Letter);
          }}
          footerNote="Tap the answer, or answer above"
        />
      </div>

      <p className={styles.landmark}>{LANDMARK_HINT}</p>
    </DrillShell>
  );
}

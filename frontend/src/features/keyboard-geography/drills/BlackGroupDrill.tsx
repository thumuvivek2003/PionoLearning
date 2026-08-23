import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  ScoreBoard,
  useQuizDrill,
} from '@/features/practice-kit';
import { blackGroups, groupIdOf, groupSize } from '../data/blackKeys';
import type { GroupDirection, GroupDrillConfig } from '../data/blackKeyDrills';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LabelButtons } from '../components/LabelButtons';
import styles from '../components/geography.module.css';

type GroupSize = 2 | 3;

/** Either "how many are lit" or "go and tap a group this big". */
interface Prompt {
  id: string;
  kind: GroupDirection;
  size: GroupSize;
  /** The lit group, for count prompts. */
  midis?: readonly number[];
}

const MIXED = 'mixed';

const SIZE_OPTIONS = [
  { value: 2 as GroupSize, label: '2', sub: 'black keys' },
  { value: 3 as GroupSize, label: '3', sub: 'black keys' },
];

function buildPool(
  config: GroupDrillConfig,
  direction: string,
  layoutId: string,
): readonly Prompt[] {
  const wanted =
    direction === MIXED ? config.directions : config.directions.filter((entry) => entry === direction);
  const prompts: Prompt[] = [];

  if (wanted.includes('count')) {
    for (const group of blackGroups(getKeyboardLayout(layoutId))) {
      const size = groupSize(group.group);
      if (!config.sizes.includes(size)) continue;
      prompts.push({
        id: `c-${group.id}`,
        kind: 'count',
        size,
        midis: group.keys.map((key) => key.midi),
      });
    }
  }

  if (wanted.includes('find')) {
    for (const size of config.sizes) {
      prompts.push({ id: `f-${size}`, kind: 'find', size });
    }
  }

  return prompts;
}

/**
 * 1.2.1 and 1.2.2 — the 2-black and 3-black landmarks.
 *
 * Both directions answer the same question — how big is this shape — so one
 * prompt loop covers them: in count mode a group lights up and you name its
 * size, in find mode you are given a size and go and put your finger on one.
 */
export function BlackGroupDrill({ config }: { config: GroupDrillConfig }) {
  const hasChoice = config.directions.length > 1;
  const [direction, setDirection] = useState<string>(
    hasChoice ? (config.directions[0] as string) : (config.directions[0] as string),
  );
  const [layoutId, setLayoutId] = useState('25');
  const [showNames, setShowNames] = useState(false);
  /** Distinct groups touched, so "move around the board" is visible. */
  const [visited, setVisited] = useState<readonly string[]>([]);

  const pool = useMemo(
    () => buildPool(config, direction, layoutId),
    [config, direction, layoutId],
  );
  const answerOf = useMemo(() => (prompt: Prompt) => prompt.size, []);

  const drill = useQuizDrill<Prompt, GroupSize>({ pool, answerOf });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';

  useEffect(() => {
    setVisited([]);
  }, [direction, layoutId]);

  const press = (key: PianoKey) => {
    // Only black keys carry a group; a white press is not an answer here.
    const id = groupIdOf(key);
    if (!id) return;
    setVisited((current) => (current.includes(id) ? current : [...current, id]));
    const group = blackGroups(getKeyboardLayout(layoutId)).find((entry) => entry.id === id);
    if (group) drill.answer(groupSize(group.group));
  };

  const counting = question.kind === 'count';

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
                value={direction}
                options={[
                  ...config.directions.map((entry) => ({
                    value: entry,
                    label: entry === 'count' ? 'Count it' : 'Find one',
                  })),
                  { value: MIXED, label: 'Mixed' },
                ]}
                onChange={setDirection}
                block
                ariaLabel="Direction"
              />
            </Field>
          )}
          <Field label="Keyboard">
            <SegmentedControl
              value={layoutId}
              options={[
                { value: '25', label: '25 keys' },
                { value: '49', label: '49 keys' },
                { value: '61', label: '61 keys' },
              ]}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Leave off — this drill is about shapes, not names."
          />
          <CounterRow>
            <Counter label="Groups visited" value={String(visited.length)} />
          </CounterRow>
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={counting ? 'How many in the lit group?' : 'Tap a group of'}
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">{expected} black keys</Chip>}
            {verdict === 'wrong' && <Chip tone="danger">That group has {given}</Chip>}
            {!settled && <Chip>{counting ? 'Answer below' : 'Any group on the board'}</Chip>}
          </>
        }
      >
        {counting ? '?' : question.size}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={counting ? question.midis : undefined}
          showNames={showNames}
          onKeyPress={press}
          footerNote={counting ? 'Count the lit black keys' : 'Tap a black key in the right group'}
        />
      </div>

      {counting && (
        <LabelButtons
          options={SIZE_OPTIONS}
          onAnswer={drill.answer}
          correct={settled ? expected : null}
          wrong={verdict === 'wrong' ? given : null}
        />
      )}
    </DrillShell>
  );
}

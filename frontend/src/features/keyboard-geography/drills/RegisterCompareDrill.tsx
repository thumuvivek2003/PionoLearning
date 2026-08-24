import { useCallback, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { getKeyboardLayout } from '@/features/piano';
import type { KeyboardLayout, PianoKey } from '@/features/piano';
import { DrillPrompt, DrillShell, ScoreBoard, useQuizDrill } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { instrument } from '@/lib/audio';
import { LAYOUT_OPTIONS, WIDE_LAYOUT_ID } from '../data/layouts';
import { OCTAVE_HINT, keyLabel } from '../data/octaves';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LabelButtons } from '../components/LabelButtons';
import styles from '../components/geography.module.css';

/** Where the lit key sits against the named one. */
type Register = 'lower' | 'higher';

/** A named reference, and the lit key to place against it. */
interface Prompt {
  id: string;
  reference: PianoKey;
  subject: PianoKey;
}

/** Same letter is the octave test; any note is plain left/right orientation. */
type Mode = 'sameLetter' | 'any';

const MODES = [
  { value: 'sameLetter' as Mode, label: 'Same letter' },
  { value: 'any' as Mode, label: 'Any note' },
];

const ANSWERS = [
  { value: 'lower' as Register, label: 'Lower', sub: 'further left' },
  { value: 'higher' as Register, label: 'Higher', sub: 'further right' },
];

/** Keys close together are an interval question, not a register one. */
const MIN_GAP = 3;

function buildPool(layout: KeyboardLayout, mode: Mode): readonly Prompt[] {
  const whites = layout.keys.filter((key) => !key.isBlack);

  return whites.flatMap((reference) =>
    whites
      .filter((subject) =>
        mode === 'sameLetter'
          ? subject.sharpName === reference.sharpName && subject.midi !== reference.midi
          : Math.abs(subject.midi - reference.midi) >= MIN_GAP,
      )
      .map<Prompt>((subject) => ({
        id: `${reference.midi}>${subject.midi}`,
        reference,
        subject,
      })),
  );
}

/**
 * 1.3.5 — low or high, read off the board.
 *
 * The reference is named but not lit, so placing the lit key means knowing
 * where its named octave lives; Same letter keeps both notes on the same
 * landmark so nothing but height tells them apart. Answering plays the pair,
 * because "higher" should end up meaning something the ear agrees with.
 */
export function RegisterCompareDrill() {
  const [layoutId, setLayoutId] = useState(WIDE_LAYOUT_ID);
  const [mode, setMode] = useState<Mode>('sameLetter');
  const [showReference, setShowReference] = useState(true);
  const { settings } = useSettings();

  const layout = useMemo(() => getKeyboardLayout(layoutId), [layoutId]);
  const pool = useMemo(() => buildPool(layout, mode), [layout, mode]);
  const answerOf = useMemo(
    () => (prompt: Prompt) => (prompt.subject.midi < prompt.reference.midi ? 'lower' : 'higher'),
    [],
  );

  const drill = useQuizDrill<Prompt, Register>({ pool, answerOf });
  const { question, verdict, given, stats, expected } = drill;
  const settled = verdict !== 'waiting';

  const answer = useCallback(
    (choice: Register) => {
      // Both notes at once: the interval is the answer made audible.
      if (settings.soundEnabled) {
        instrument.playMidis([question.reference.midi, question.subject.midi]);
      }
      drill.answer(choice);
    },
    [drill, question.reference.midi, question.subject.midi, settings.soundEnabled],
  );

  const shortcuts = useMemo(
    () => ({ ArrowLeft: () => answer('lower'), ArrowRight: () => answer('higher') }),
    [answer],
  );
  useKeyboardShortcuts(shortcuts);

  return (
    <DrillShell
      goal="Place any key against a named one — low is left, high is right, whatever the letter."
      steps={[
        'Read the named note, then look at the lit key.',
        'Answer Lower or Higher — the arrow keys work too.',
        'Turn the reference marker off once you can find the named octave yourself.',
      ]}
      watchFor="Answering from the letter instead of the position. C5 is higher than G4 even though G comes later in the alphabet."
      aside={
        <>
          <Field
            label="Pairs"
            hint="Same letter is the octave test — only the height is different."
          >
            <SegmentedControl
              value={mode}
              options={MODES}
              onChange={setMode}
              block
              ariaLabel="Pair type"
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
            checked={showReference}
            onChange={setShowReference}
            label="Mark the reference key"
            description="Off is the real drill: find the named octave in your head."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label="Is the lit key lower or higher than"
        footer={
          <>
            {verdict === 'correct' && (
              <Chip tone="accent">
                {keyLabel(question.subject)} is {expected}
              </Chip>
            )}
            {verdict === 'wrong' && (
              <Chip tone="danger">Not {given} — look at the position, not the letter</Chip>
            )}
            {!settled && <Chip>Left is low · right is high</Chip>}
          </>
        }
      >
        {keyLabel(question.reference)}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          litMidis={[question.subject.midi]}
          // The reference is a scaffold, so it is cooler than the key in question.
          secondaryMidis={showReference || settled ? [question.reference.midi] : undefined}
          showNames={settled}
          footerNote={`Lit key against ${keyLabel(question.reference)}`}
        />
      </div>

      <LabelButtons
        options={ANSWERS}
        onAnswer={answer}
        correct={settled ? expected : null}
        wrong={verdict === 'wrong' ? given : null}
      />

      <p className={styles.landmark}>{OCTAVE_HINT}</p>
    </DrillShell>
  );
}

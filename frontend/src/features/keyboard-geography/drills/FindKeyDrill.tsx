import { useEffect, useMemo, useState } from 'react';
import { Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import type { Letter } from '@/features/music-theory';
import { getKeyboardLayout } from '@/features/piano';
import type { PianoKey } from '@/features/piano';
import { DrillPrompt, DrillShell, ScoreBoard, useQuizDrill } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { instrument } from '@/lib/audio';
import { LANDMARK_HINT } from '../data/naturals';
import { LAYOUT_OPTIONS } from '../data/layouts';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import styles from '../components/geography.module.css';

/**
 * A key to find. `answer` is a string so one pool can serve both modes: the
 * letter alone when any octave counts, letter+octave when it must be exact.
 */
interface Prompt {
  id: string;
  letter: Letter;
  octave: number | null;
  midi: number | null;
  answer: string;
}

const MODES = [
  { value: 'any', label: 'Any octave' },
  { value: 'exact', label: 'Named octave' },
] as const;

type Mode = (typeof MODES)[number]['value'];

function buildPool(layoutId: string, mode: Mode): readonly Prompt[] {
  const whites = getKeyboardLayout(layoutId).keys.filter((key) => !key.isBlack);

  if (mode === 'exact') {
    return whites.map<Prompt>((key) => ({
      id: `x-${key.midi}`,
      letter: key.sharpName as Letter,
      octave: key.octave,
      midi: key.midi,
      answer: `${key.sharpName}${key.octave}`,
    }));
  }

  // Any octave: one prompt per letter, whichever key you reach for.
  const letters = Array.from(new Set(whites.map((key) => key.sharpName)));
  return letters.map<Prompt>((letter) => ({
    id: `a-${letter}`,
    letter: letter as Letter,
    octave: null,
    midi: null,
    answer: letter,
  }));
}

/**
 * 1.1.7 — name → key, the reverse of everything before it.
 *
 * This is the drill that builds brain → keyboard rather than keyboard → brain,
 * so the only way to answer is to actually find the key and press it. Names are
 * off by default: a real keyboard has none printed on it.
 */
export function FindKeyDrill() {
  const [layoutId, setLayoutId] = useState<string>('25');
  const [mode, setMode] = useState<Mode>('any');
  const [showNames, setShowNames] = useState(false);
  const { settings } = useSettings();

  const pool = useMemo(() => buildPool(layoutId, mode), [layoutId, mode]);
  const answerOf = useMemo(() => (prompt: Prompt) => prompt.answer, []);

  const drill = useQuizDrill<Prompt, string>({ pool, answerOf });
  const { question, verdict, given, stats } = drill;
  const settled = verdict !== 'waiting';

  const [lastPressed, setLastPressed] = useState<number | null>(null);

  const press = (key: PianoKey) => {
    setLastPressed(key.midi);
    if (settings.soundEnabled) instrument.play([key.pitchClass]);
    drill.answer(mode === 'exact' ? `${key.sharpName}${key.octave}` : key.sharpName);
  };

  // A new prompt clears the last press so the board starts clean.
  useEffect(() => {
    setLastPressed(null);
  }, [question.id]);

  return (
    <DrillShell
      goal="Hear or read a name, and the hand goes straight to the key."
      steps={[
        'Read the note name and find it on the keyboard below.',
        'Press it. Any octave counts unless the mode says otherwise.',
        'Do the same on your real keyboard — locate first, play second.',
      ]}
      watchFor="Scanning left to right for the letter. Jump to the black-key group first, then step off it."
      aside={
        <>
          <Field label="Keyboard">
            <SegmentedControl
              value={layoutId}
              options={LAYOUT_OPTIONS}
              onChange={setLayoutId}
              block
              ariaLabel="Keyboard size"
            />
          </Field>
          <Field label="Mode" hint="Named octave asks for C4 rather than any C.">
            <SegmentedControl value={mode} options={MODES} onChange={setMode} block ariaLabel="Mode" />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Off is the drill. On is a map."
          />
          <ScoreBoard stats={stats} onReset={drill.reset} />
        </>
      }
    >
      <DrillPrompt
        label={mode === 'exact' ? 'Find this exact key' : 'Find this note'}
        footer={
          <>
            {verdict === 'correct' && <Chip tone="accent">Found it</Chip>}
            {verdict === 'wrong' && <Chip tone="danger">That was {given} — try again</Chip>}
            {!settled && <Chip>Target ≤ 1s</Chip>}
          </>
        }
      >
        {mode === 'exact' ? `${question.letter}${question.octave}` : question.letter}
      </DrillPrompt>

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId={layoutId}
          // On a right answer the board shows where it was; a wrong press stays cool-coloured.
          litMidis={
            settled && verdict === 'correct' && lastPressed !== null ? [lastPressed] : undefined
          }
          secondaryMidis={verdict === 'wrong' && lastPressed !== null ? [lastPressed] : undefined}
          showNames={showNames || settled}
          onKeyPress={press}
          footerNote="Press the key you were asked for"
        />
      </div>

      <p className={styles.landmark}>{LANDMARK_HINT}</p>
    </DrillShell>
  );
}

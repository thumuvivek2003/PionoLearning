import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { LETTER_PITCH_CLASS } from '@/features/music-theory';
import type { Letter } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
import { DrillPrompt, DrillShell, RunCounters, StepStrip, useTimedRun } from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { instrument } from '@/lib/audio';
import { LANDMARK_HINT, NATURALS, randomLetter, runFrom } from '../data/naturals';
import type { SequenceDirection } from '../geography.types';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { LetterPicker } from '../components/LetterPicker';
import { NoteButtons } from '../components/NoteButtons';
import styles from '../components/geography.module.css';

/** A run is the seven naturals plus the return to where it started. */
const RUN_LENGTH = NATURALS.length + 1;

const DIRECTIONS = [
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
] as const;

const STARTS = [
  { value: 'chosen', label: 'From key' },
  { value: 'random', label: 'Random start' },
] as const;

type StartMode = (typeof STARTS)[number]['value'];

/**
 * 1.1.1 — recite C D E F G A B, from anywhere, in either direction.
 *
 * This one is a chain rather than a quiz: nothing on screen tells you the next
 * letter, so the run has to come out of your head. Upcoming slots stay blank
 * and only fill in behind you, which is what makes "start at A" harder than
 * "start at C" — exactly the drill the bucket asks for.
 *
 * The starting note is yours to choose: pick any of the seven and drill it
 * until it is as automatic as C, or hand it to Random once they all are.
 */
export function NaturalSequenceDrill() {
  const [direction, setDirection] = useState<SequenceDirection>('ascending');
  const [startMode, setStartMode] = useState<StartMode>('chosen');
  const [startLetter, setStartLetter] = useState<Letter>('C');
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();

  const [start, setStart] = useState<Letter>('C');
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<Letter | null>(null);

  const run = useMemo(
    () => runFrom(start, direction === 'ascending'),
    [direction, start],
  );
  // The run closes by landing back on the note it began on.
  const expected = index < RUN_LENGTH ? (run[index % NATURALS.length] as Letter) : null;
  const complete = index >= RUN_LENGTH;

  /** Sets up the next run: a starting note, and an empty strip to fill. */
  const deal = useCallback(() => {
    setStart((current) => (startMode === 'random' ? randomLetter(current) : startLetter));
    setIndex(0);
    setWrong(null);
  }, [startLetter, startMode]);

  const { stats, begin, stumble, finish, dealNow } = useTimedRun({ onDeal: deal });

  // Changing how a run is set up — direction, mode, chosen note — deals a
  // fresh one rather than half-rewriting the run in flight.
  useEffect(() => {
    dealNow();
  }, [dealNow, direction, startLetter, startMode]);

  const answer = useCallback(
    (letter: Letter) => {
      if (complete) return;

      if (letter !== expected) {
        setWrong(letter);
        stumble();
        window.setTimeout(() => setWrong(null), 500);
        return;
      }

      begin();
      if (settings.soundEnabled) instrument.play([LETTER_PITCH_CLASS[letter]]);
      setWrong(null);

      const next = index + 1;
      setIndex(next);
      // The eighth note lands back on the start — that closes the run.
      if (next >= RUN_LENGTH) finish();
    },
    [begin, complete, expected, finish, index, settings.soundEnabled, stumble],
  );

  const answerLetters = useMemo(
    () => Object.fromEntries(NATURALS.map((letter) => [letter.toLowerCase(), () => answer(letter)])),
    [answer],
  );
  useKeyboardShortcuts(answerLetters);

  /** Entered letters stay visible; the rest are blanks you have to fill. */
  const slots = run
    .concat(run[0] as Letter)
    .map((letter, position) => (position < index ? letter : '·'));

  const played = index > 0 ? (run[(index - 1) % NATURALS.length] as Letter) : null;

  return (
    <DrillShell
      goal="Say and play C D E F G A B from any starting note, both directions, without hunting."
      steps={[
        'Read the starting note, then enter the whole run from memory — eight notes back to the start.',
        'Say each name out loud as you enter it, and play it on your real keyboard.',
        'Pick a different starting note once the current one is automatic — then switch to Random start. That is the actual test.',
      ]}
      watchFor='Restarting from C to work out where you are. If "start at A" is much slower than "start at C", stay here a while longer.'
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
          <Field
            label="Starting note"
            hint={
              startMode === 'random'
                ? 'A different note every run.'
                : 'Every run starts on the note you picked.'
            }
          >
            <SegmentedControl
              value={startMode}
              options={STARTS}
              onChange={setStartMode}
              block
              ariaLabel="Starting note"
            />
            <LetterPicker
              value={startLetter}
              onChange={setStartLetter}
              disabled={startMode === 'random'}
              ariaLabel="Start the run from"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Turn them off to make the run come from memory alone."
          />
          <Button variant="secondary" icon="reset" onClick={dealNow} block>
            New run
          </Button>
          <RunCounters stats={stats} />
        </>
      }
    >
      <DrillPrompt
        label={`${direction === 'ascending' ? 'Ascending' : 'Descending'} from`}
        footer={
          <>
            {complete ? (
              <Chip tone="accent">
                Run complete{stats.lastSeconds === null ? '' : ` — ${stats.lastSeconds.toFixed(1)}s`}
              </Chip>
            ) : (
              <Chip>
                Note {index + 1} of {RUN_LENGTH}
              </Chip>
            )}
            {wrong && <Chip tone="danger">{wrong} is not next</Chip>}
          </>
        }
      >
        {start}
      </DrillPrompt>

      <StepStrip items={slots} index={complete ? -1 : index} wrong={wrong !== null} label="The run" />

      <NoteButtons onAnswer={answer} wrong={wrong} disabled={complete} />

      <div className={styles.keyboard}>
        <GeographyKeyboard
          layoutId="25"
          litPitchClasses={played === null ? undefined : [LETTER_PITCH_CLASS[played]]}
          showNames={showNames}
          onKeyPress={(key: PianoKey) => {
            if (!key.isBlack) answer(key.sharpName as Letter);
          }}
          footerNote="Play the run here or on your keyboard"
        />
      </div>

      <p className={styles.landmark}>{LANDMARK_HINT}</p>
    </DrillShell>
  );
}

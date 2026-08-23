import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Chip, Field, SegmentedControl, Toggle } from '@/components/ui';
import { LETTER_PITCH_CLASS } from '@/features/music-theory';
import type { Letter } from '@/features/music-theory';
import type { PianoKey } from '@/features/piano';
import {
  Counter,
  CounterRow,
  DrillPrompt,
  DrillShell,
  StepStrip,
} from '@/features/practice-kit';
import { useSettings } from '@/features/settings';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { instrument } from '@/lib/audio';
import { LANDMARK_HINT, NATURALS, randomLetter, runFrom } from '../data/naturals';
import type { SequenceDirection } from '../geography.types';
import { GeographyKeyboard } from '../components/GeographyKeyboard';
import { NoteButtons } from '../components/NoteButtons';
import styles from '../components/geography.module.css';

/** A run is the seven naturals plus the return to where it started. */
const RUN_LENGTH = NATURALS.length + 1;

const DIRECTIONS = [
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
] as const;

const STARTS = [
  { value: 'c', label: 'From C' },
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
 */
export function NaturalSequenceDrill() {
  const [direction, setDirection] = useState<SequenceDirection>('ascending');
  const [startMode, setStartMode] = useState<StartMode>('c');
  const [showNames, setShowNames] = useState(true);
  const { settings } = useSettings();

  const [start, setStart] = useState<Letter>('C');
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<Letter | null>(null);
  const [runs, setRuns] = useState(0);
  const [stumbles, setStumbles] = useState(0);
  const [lastSeconds, setLastSeconds] = useState<number | null>(null);
  const [bestSeconds, setBestSeconds] = useState<number | null>(null);

  const startedAt = useRef<number | null>(null);
  const restartTimer = useRef<number | null>(null);

  const run = useMemo(
    () => runFrom(start, direction === 'ascending'),
    [direction, start],
  );
  // The run closes by landing back on the note it began on.
  const expected = index < RUN_LENGTH ? (run[index % NATURALS.length] as Letter) : null;
  const complete = index >= RUN_LENGTH;

  const newRun = useCallback(() => {
    if (restartTimer.current !== null) window.clearTimeout(restartTimer.current);
    restartTimer.current = null;
    setStart((current) => (startMode === 'random' ? randomLetter(current) : 'C'));
    setIndex(0);
    setWrong(null);
    startedAt.current = null;
  }, [startMode]);

  // Changing how a run is set up starts a fresh one rather than half-rewriting it.
  useEffect(() => {
    newRun();
  }, [direction, startMode, newRun]);

  useEffect(
    () => () => {
      if (restartTimer.current !== null) window.clearTimeout(restartTimer.current);
    },
    [],
  );

  const answer = useCallback(
    (letter: Letter) => {
      if (complete) return;

      if (letter !== expected) {
        setWrong(letter);
        setStumbles((count) => count + 1);
        window.setTimeout(() => setWrong(null), 500);
        return;
      }

      if (settings.soundEnabled) instrument.play([LETTER_PITCH_CLASS[letter]]);
      if (index === 0) startedAt.current = performance.now();
      setWrong(null);

      const next = index + 1;
      setIndex(next);
      if (next < RUN_LENGTH) return;

      // Run finished — bank the time and set up the next one.
      const seconds = startedAt.current ? (performance.now() - startedAt.current) / 1000 : null;
      setRuns((count) => count + 1);
      setLastSeconds(seconds);
      if (seconds !== null) setBestSeconds((best) => (best === null ? seconds : Math.min(best, seconds)));
      restartTimer.current = window.setTimeout(newRun, 1100);
    },
    [complete, expected, index, newRun, settings.soundEnabled],
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
        'Switch to Random start once From C is automatic. That is the actual test.',
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
          <Field label="Starting note">
            <SegmentedControl
              value={startMode}
              options={STARTS}
              onChange={setStartMode}
              block
              ariaLabel="Starting note"
            />
          </Field>
          <Toggle
            checked={showNames}
            onChange={setShowNames}
            label="Names on the keys"
            description="Turn them off to make the run come from memory alone."
          />
          <Button variant="secondary" icon="reset" onClick={newRun} block>
            New run
          </Button>
          <CounterRow>
            <Counter label="Runs" value={String(runs)} />
            <Counter label="Stumbles" value={String(stumbles)} />
            <Counter
              label="Last run"
              value={lastSeconds === null ? '—' : `${lastSeconds.toFixed(1)}s`}
              hint={bestSeconds === null ? undefined : `best ${bestSeconds.toFixed(1)}s`}
            />
          </CounterRow>
        </>
      }
    >
      <DrillPrompt
        label={`${direction === 'ascending' ? 'Ascending' : 'Descending'} from`}
        footer={
          <>
            {complete ? (
              <Chip tone="accent">
                Run complete{lastSeconds === null ? '' : ` — ${lastSeconds.toFixed(1)}s`}
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
          pitchClass={played === null ? null : LETTER_PITCH_CLASS[played]}
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

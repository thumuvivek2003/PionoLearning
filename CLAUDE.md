# Piono — piano practice trainer

React 18 + TypeScript + Vite SPA, no backend. All code lives in `frontend/`.

```bash
cd frontend
npm run dev         # localhost:5173
npm run typecheck   # tsc -b --noEmit
npm run build       # the other gate — there is no ESLint or test runner
```

## Layout

`src/features/<domain>/` — each owns `data/` (pure logic), `components/`, `drills/`, and an
`index.ts` that is its only public surface. Nothing imports across a feature's internals.

| Path | What it holds |
| --- | --- |
| `features/curriculum/` | The 8-level → bucket → practice tree. Pure data; ids derived by `defineLevel`. |
| `features/keyboard-geography/` | Level 1 drills (`L1` = find any key by sight). |
| `features/finger-training/` | Level 2 drills — position, independence, intervals, shifting, crossing, black keys, random decisions, rhythm, validation. |
| `features/rhythm-timing/` | Level 3 drills — pulse, note values, counting, the metronome, patterns, accuracy, phrases and contest timing. |
| `features/scales-patterns/` | Level 4 drills — scale formulas (major and natural minor), key signatures, relative keys, and scales under the hands. |
| `features/chords-harmony/` | Level 5 drills — triads built from `music-theory`'s chord service, and recognised back. |
| `features/practice-kit/` | Shared drill engines and panels — see below. |
| `features/piano/`, `music-theory/`, `randomizer/` | Shared domain: keyboard layouts and the white-key ruler, notes/chords/scales/intervals, draw policies. Drill features depend on these, never on each other. |
| `src/drills/registry.tsx` | Maps a drill id to the component that renders it. |
| `frontend/references/L<n>/` | Hand-written spec for each bucket's practices, one folder per level. |

## Adding a practice

1. Add a config (copy, difficulty axes) to that bucket's `data/*Drills.ts`.
2. Register an id in `src/drills/registry.tsx`.
3. Point the practice at it in `features/curriculum/data/level*.ts`:
   `{ title: '…', activity: { kind: 'drill', drillId: 'geo.…' } }`.

A practice with no `activity` renders "Coming soon" on its own. Curriculum data never imports a
component, and pages never switch on drill kind — prefer a new **config** over a new component.

**Read `frontend/references/L<level>/L<level>.<bucket>.md` before building a bucket.** It specifies the
rounds, targets and pass conditions, and no code links to it. If a bucket has no reference file,
design from the practice titles plus the level's principle and say so.

## practice-kit

- `useQuizDrill` — prompt → answer → verdict. Keeps a per-item score book and feeds draw weights
  to the randomizer. `scoreKeyOf` groups scores under a short label (`F#`), so a weakness is
  tracked per note, not per key. `timeout()` grades running out of time as a miss.
- `useTimedRun` — chain drills: one long answer, timed end to end, scored in stumbles.
- `useScoreBook` / `scoring.ts` — the ledger, `weaknessWeight`, `weakSpots`.
- `useAnswerDeadline`, `useSprint`, `useMetronome` — per-answer allowance, fixed-window sprint, a beat
  to play against. `timing.ts` holds the beat maths and the early/late tally.
- `DrillShell` / `DrillPrompt` / `StepStrip` / `ScoreBoard` / `RunCounters` / `WeakSpots` / `TimerBar`.

Weakness-aware drills pass `strategyId: 'weak-focus'` and show `<WeakSpots>`; that strategy is
registered but kept out of Settings, since a plain trainer session has no ledger to give it.

## Conventions

- Drills are data-driven: board and music logic in `data/`, never in a screen.
- Comments say *why* — the trade-off or the teaching point, not what the line does. Match the
  surrounding density; short doc comment on every exported symbol.
- Prose in UI copy and comments is plain, lower-case-technical, no emoji.
- Extend shared engines additively (optional fields) so existing callers keep working.
- Verify logic-heavy work by bundling a check script with
  `npx esbuild <file> --bundle --platform=node --format=cjs --alias:@=./src --loader:.css=empty`
  and running it with node — used for pool-emptiness, board geometry and scoring maths.

## State

Levels 1–5 complete — 400 practices across 49 buckets. Level 6 (music reading,
`level6.musicReading.ts`) is next; its reference files live in `references/L6/`.

Each minor key's six practices (4.7–4.9) are generated from one entry in `MINOR_KEYS`
(`scales-patterns/data/scaleDrills.ts`) — add a key there, not six configs.
`ScaleReadDrill` is the mirror of `ScaleQuizDrill`: it prints a run and asks what it is,
on a per-answer deadline. `ScalePlayDrill` takes optional `keys`/`segment`/`ladder`/
`subdivisions`/`cleanTarget`/`focus` for the technique bucket; omit them for the old behaviour.
`ScaleRecallDrill` (4.12) chains a key through `phases` — locate, name, find, play, reverse —
and is the level's daily measurement: a per-key card, a per-phase time split, and a tally of
*why* mistakes happen. All ten of 4.12's practices are configs of it.
L5 has two engines: `TriadBuildDrill` (press root/third/fifth, timing each tone apart) and
`TriadQuizDrill` (chord in, degree/quality/root/name out). Chords come from
`music-theory`'s `buildChordFrom` — tertian types spell by letter, so Cm is C Eb G.
5.2 and 5.3's fourteen per-chord practices are generated by `chordSession()` from
`SESSION_ORDER` (`chords-harmony/data/buildDrills.ts`); their copy — the black-key
landmark, the all-white note — is derived from the triad, not written per chord.
`data/inversions.ts` rotates a `ChordForm` into a `Voicing` (works for triads and
sevenths alike) and holds the voice-leading maths: `movesFrom`/`nearestMove` rank the
positions of a chord by how far the hand must travel.
`data/diatonic.ts` derives a key's seven chords and their numerals through
`music-theory`'s `diatonicChords`/`romanNumeral`, for major and natural-minor keys.
`ProgressionDrill` plays a progression written as numerals in any key — 5.4.9, all of
5.6, all of 5.7 and two of 5.9, including listen-to-identify and predict-the-ending.
`ChordRhythmDrill` (5.8, 5.10) plays a progression against a click: `slotsOf()` turns
a config into a beat schedule — even subdivisions or a `StrumPattern`'s eighths — and
timing on a chord *change* is tallied apart from timing on a repeat. `ChordEarDrill`
(5.9) asks quality/root/bass/position/function with nothing on screen.
`ChordContestDrill` (5.10.10) runs ten timed rounds of mixed kinds onto one card.

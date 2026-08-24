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
| `features/finger-training/` | Level 2 drills. |
| `features/practice-kit/` | Shared drill engines and panels — see below. |
| `features/piano/`, `music-theory/`, `randomizer/` | Keyboard layouts, notes/chords/scales, draw policies. |
| `src/drills/registry.tsx` | Maps a drill id to the component that renders it. |
| `frontend/references/L*.md` | Hand-written spec for each bucket's practices. |

## Adding a practice

1. Add a config (copy, difficulty axes) to that bucket's `data/*Drills.ts`.
2. Register an id in `src/drills/registry.tsx`.
3. Point the practice at it in `features/curriculum/data/level*.ts`:
   `{ title: '…', activity: { kind: 'drill', drillId: 'geo.…' } }`.

A practice with no `activity` renders "Coming soon" on its own. Curriculum data never imports a
component, and pages never switch on drill kind — prefer a new **config** over a new component.

**Read `frontend/references/L<level>.<bucket>.md` before building a bucket.** It specifies the
rounds, targets and pass conditions, and no code links to it. If a bucket has no reference file,
design from the practice titles plus the level's principle and say so.

## practice-kit

- `useQuizDrill` — prompt → answer → verdict. Keeps a per-item score book and feeds draw weights
  to the randomizer. `scoreKeyOf` groups scores under a short label (`F#`), so a weakness is
  tracked per note, not per key. `timeout()` grades running out of time as a miss.
- `useTimedRun` — chain drills: one long answer, timed end to end, scored in stumbles.
- `useScoreBook` / `scoring.ts` — the ledger, `weaknessWeight`, `weakSpots`.
- `useAnswerDeadline`, `useSprint` — per-answer allowance, fixed-window sprint.
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

Level 1 complete — all 7 buckets, 56 practices. Level 2 bucket 1 partly built (6 drills);
buckets 2.2+ are next. Levels 3–8 are mapped out as data only.

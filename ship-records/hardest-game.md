# Ship record — The World's Hardest Game (remake)

Original reference: The World's Hardest Game — precision dodge-and-collect
mazes. Player-facing title is currently the ORIGINAL NAME
(`hardest/game.js:276`, `hardest/index.html:6`) — must become an original
evocation before ship (rights posture).

Status: **NOT SHIPPED** — validator gate is GREEN (114/114); the two HIGH
menu defects and the blur defect are FIXED. Remaining ship blockers: title
rename to an original evocation (separate wave), broader real-input browser
verification beyond the sr1 smoke, root entry-point integration.
Last updated: 2026-09-22 (ship-run 2026-09-22, sr1 fix wave).

## Survey — implementations found

1. `hardest/` — the only implementation (no monorepo app; doc-orphaned:
   no design doc — truth is code + `LEVEL-FORMAT.md` + the validator).
   Zero-dependency, runs from file:// (classic scripts; index.html injects
   level scripts in manifest order). `engine.js` (pure logic, 240Hz fixed
   step, Node+browser), `game.js` (render/input/menu/save/WebAudio blips),
   `autopilot.js` (deterministic seeded solver), `validate.mjs` (corpus
   gate: schema + BFS reachability + autopilot clear), `levels/` = **114
   level files**, `manifest.js` 114 entries (matches), `pars.js` generated
   pars, `DIFFICULTY.md`, `difficulty.mjs`, `gen-manifest.mjs`,
   `gen-pars.mjs`. Mechanics in corpus: coins, keys/doors, telepads,
   checkpoints, movers/crush, speed override; tiers through APEX.
   Keyboard + touch joystick, localStorage save, `__hardest` probe hook
   (`game.js:367`).

## Decision: ADOPT + EXTEND `hardest/`

Sound dependency-free architecture with the strongest verification story in
the repo (deterministic autopilot gate). Replacing it would be absurd.
Architecture binding: this title is zero-dep file:// — the first
architecture decision of this run, recorded per the mission rule.

## Gate state (2026-09-22, sr1 fix wave measured)

- `node hardest/validate.mjs` → **PASS: 114/114, exit 0** (node v24.19.0,
  ~2 min full corpus). Levels 109 + 111 now clear the autopilot
  (109: t=37.8s deaths=0; 111: t=30.6s deaths=0).
  - `levels/109-vault-door.js` — the degenerate stationary mover on the
    vault door (11,6) was given a real threshold sweep:
    `path [[11,6],[13,6]]`, w/h/speed/mode/phase unchanged (1×1, 30px/s
    pingpong). It now shuttles across the doorway; slip in behind it, loot,
    exit via the (19,8) door. Header comment corrected to match.
  - `levels/111-portal-press.js` — the stationary mover on the arrival pad
    (14,6) was given its intended lane sweep: `path [[14,6],[20,6]]`
    (1×1, 30px/s pingpong, unchanged). Trace showed a second defect: the
    goal-corner beeline crossed the second pad pair's tile (24,12),
    deterministically bouncing the autopilot back to (16,10) forever
    (deaths=0 sim-budget). That pad moved (24,12)→(24,14), landing two
    steps from the goal off the natural approach diagonal; pair 2 stays a
    one-way shortcut into the goal corner.
  - r05 observed 96/96 exit 0; post-r05 commit `f24ba11` (R3: movers +
    levels 99–114 + APEX) regressed the gate. Fixed by sr1; 99–114 now
    rest on a green gate.

## Known defects

- **FIXED HIGH: D-47** — `MEDAL_COL` was used at the menu medal render,
  defined nowhere → ReferenceError for any player who cleared a level.
  Now defined at `game.js:57` as
  `{ gold: '#ffd23f', silver: '#c8d2dc', bronze: '#b07830' }`, consistent
  with the palette (coin gold / gray silver / door-family bronze).
- **FIXED HIGH: D-45** — `loadSave` (`game.js:15`) now sanitizes on load:
  non-object/garbage JSON falls back to defaults; `unlocked` must be an
  integer ≥ 1; `deaths` a finite ≥ 0 number; `best` entries are dropped
  unless `time` is finite ≥ 0, `deaths` an integer ≥ 0, and `medal` absent
  or gold/silver/bronze. Never throws on arbitrary localStorage content;
  valid saves pass through byte-for-byte (verified in browser, see sr1
  evidence). The old `b.time.toFixed` throw path (now game.js:336) is dead.
- **FIXED MED: D-65** — `addEventListener('blur', () => keys.clear())` at
  `game.js:82`; held keys no longer stick on focus loss. No
  visibilitychange handler existed to mirror. Verified in browser: held
  key moved the player 43.8px, after a blur event 0.0px.
- OPEN MED: D-49 (autopilot fidelity/unreachable notes). OPEN LOW: D-50
  (`levels/30-hardest.js:30` patrol renders through wall row 12 — legal per
  LEVEL-FORMAT, visually odd). INFO: D-62 (autopilot.js not loaded by
  index.html — by design).
- FIXED: D-48 (manifest was stale at 96 vs 98 files; now 114/114 match).
- Data hygiene: FIXED — `gen-pars.mjs` regenerated `pars.js` (114 pars;
  `109:48`, `111:39` added, all other values identical) and
  `difficulty.mjs` regenerated `DIFFICULTY.md` (now 114 rows, was 98).
  Duplicate level names cosmetic (64/114, 75/87, 77/110).

## Traps for later runs

- `gen-manifest.mjs --check` no longer exists — the script REWRITES
  `manifest.js` regardless of argv (r05 recorded `--check`; do not trust).
- Regenerate `pars.js` + `DIFFICULTY.md` only after the corpus is final;
  both are derived artifacts.

## Verification

Recorded commands (last observed results):
- `node hardest/validate.mjs` — r05: 96/96 exit 0 (36.8s);
  sr1 2026-09-22: **114/114 exit 0** (109: clear t=37.8s d=0;
  111: clear t=30.6s d=0). Scoped iteration used
  `node hardest/validate.mjs --only hardest/levels/NN-slug.js`.
- `node hardest/gen-pars.mjs` → `pars.js: 114 pars`;
  `node hardest/difficulty.mjs` → `DIFFICULTY.md: 114 levels`
  (run after the corpus was final; `gen-manifest.mjs` intentionally NOT
  run — manifest already matches, and the script rewrites regardless).
- sr1 browser smoke (headless chromium 151.0.7922.137 via raw CDP,
  `file://…/hardest/index.html`, zero-dep Node 24 driver, real
  `Input.dispatchKeyEvent` keyboard): boot to menu 114 levels with
  **0 console errors / 0 exceptions**; Enter started level 1; held KeyD
  700ms moved the player 38.0→160.5px while sim time advanced
  0.47→1.17s (`__hardest` probe); Esc paused and resumed. Diagnosis-only
  (not PASS basis): seeded localStorage save with valid+corrupt `best`
  entries rendered the menu with valid entries intact and corrupt ones
  dropped; fully-corrupt and unparseable saves booted clean; a synthetic
  `blur` event froze a held key (43.8px before, 0.0px after). Evidence:
  `verification/evidence/sr1-hardest-run.log`, `sr1-hardest-level1.png`
  (in-play, PAR 5s HUD from regenerated pars), `sr1-hardest-seeded-save.png`
  (menu with medals/stats, diagnosis only). Not exercised: levels beyond 1
  in-browser, touch joystick, audio, the fixed 109/111 movers in-browser.
- r05 browser matrix (boot/control/save/touch, lanes HardestBoot/Engine/
  LvA-D/Adversarial, evidence `verification/evidence/r05-*`) — PASS for
  levels 1–98 state.
- Contract: validator MUST pass before and after any `hardest/` change.

Ship-gate checklist (pending): ~~gate 114/114~~ DONE sr1; ~~D-45/47/65
fixed + re-proven~~ DONE sr1; ~~pars + DIFFICULTY regenerated~~ DONE sr1;
rename to original evocation; menus/HUD/pause/settings/touch verified with
real input in browser (sr1 covered menu/level-1/pause/resume; settings does
not exist); integrated into the root entry point.

## Deferrals

None declared yet.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`hardest/` docs and code, plus my own knowledge of the original game.
Network use: none. No web/GitHub searches about this project, no
forks/copies, no third-party remakes of the original were consulted.

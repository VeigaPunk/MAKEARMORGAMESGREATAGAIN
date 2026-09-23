# Ship record — The World's Hardest Game (remake)

Original reference: The World's Hardest Game — precision dodge-and-collect
mazes. Player-facing title is currently the ORIGINAL NAME
(`hardest/game.js:276`, `hardest/index.html:6`) — must become an original
evocation before ship (rights posture).

Status: **NOT SHIPPED** — closest to ship in the checkpoint, but the
validator gate is currently RED and two HIGH defects are open.
Last updated: 2026-09-22 (ship-run 2026-09-22).

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

## Gate state (2026-09-22, this run measured)

- `node hardest/validate.mjs` → **FAIL: 112/114, exit 1** (node v24.19.0,
  ~2 min full corpus).
  - `levels/109-vault-door.js` and `levels/111-portal-press.js` fail
    autopilot (`sim-budget, deaths=0, simT=120.0s`); both PASS schema+BFS.
    Both contain a degenerate **stationary mover** (`path: [[x,y],[x,y]]`,
    speed 30) parked on a door tile (109) / teleport pad (111) — likely an
    R3 authoring error; if intentional, redesign so the autopilot can
    verify it (LEVEL-FORMAT contract).
  - r05 observed 96/96 exit 0; post-r05 commit `f24ba11` (R3: movers +
    levels 99–114 + APEX) regressed the gate. Levels 99–114 rest only on
    R3's self-claim until the gate is green.

## Known defects

- **OPEN HIGH: D-47** — `MEDAL_COL` used at `game.js:316`, defined nowhere
  → menu throws ReferenceError for every player who cleared a level.
- **OPEN HIGH: D-45** — `loadSave` (`game.js:15-18`) merges corrupt `best`
  entries unsanitized; `b.time.toFixed` at `game.js:318` can brick the menu.
- **OPEN MED: D-65** — no `blur` handler → stuck keys when window loses
  focus (registered only as a one-liner in r05 fix-wave; backfill register
  entry; D-64/D-66 also missing from register).
- OPEN MED: D-49 (autopilot fidelity/unreachable notes). OPEN LOW: D-50
  (`levels/30-hardest.js:30` patrol renders through wall row 12 — legal per
  LEVEL-FORMAT, visually odd). INFO: D-62 (autopilot.js not loaded by
  index.html — by design).
- FIXED: D-48 (manifest was stale at 96 vs 98 files; now 114/114 match).
- Data hygiene: `pars.js` has `109:15` though autopilot fails 109 (stale —
  regen after fix); `111` missing from pars; `DIFFICULTY.md` stale at 98
  rows (missing 99–114); duplicate level names cosmetic (64/114, 75/87,
  77/110).

## Traps for later runs

- `gen-manifest.mjs --check` no longer exists — the script REWRITES
  `manifest.js` regardless of argv (r05 recorded `--check`; do not trust).
- Regenerate `pars.js` + `DIFFICULTY.md` only after the corpus is final;
  both are derived artifacts.

## Verification

Recorded commands (last observed results):
- `node hardest/validate.mjs` — r05: 96/96 exit 0 (36.8s);
  this run 2026-09-22: **112/114 exit 1** (109, 111 autopilot budget fail).
- r05 browser matrix (boot/control/save/touch, lanes HardestBoot/Engine/
  LvA-D/Adversarial, evidence `verification/evidence/r05-*`) — PASS for
  levels 1–98 state.
- Contract: validator MUST pass before and after any `hardest/` change.

Ship-gate checklist (pending): gate 114/114; D-45/47/65 fixed + re-proven;
pars + DIFFICULTY regenerated; rename to original evocation; menus/HUD/
pause/settings/touch verified with real input in browser; integrated into
the root entry point.

## Deferrals

None declared yet.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`hardest/` docs and code, plus my own knowledge of the original game.
Network use: none. No web/GitHub searches about this project, no
forks/copies, no third-party remakes of the original were consulted.

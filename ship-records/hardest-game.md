# Ship record — The Cruel Maze (remake; original: The World's Hardest Game)

Original reference: The World's Hardest Game — precision dodge-and-collect
mazes. Player-facing title renamed to the original evocation **The Cruel
Maze** (ship-run sr1, 2026-09-23): `hardest/game.js` menu title,
`hardest/index.html` `<title>`, `hardest/README.md` heading. Internal
file/dir names and `HARDEST_*` globals unchanged.

Status: **SHIP-CANDIDATE** (ship-run sr2, 2026-09-23) — validator gate GREEN
(114/114 exit 0 re-run at end of sr2); rights sweep done (level 96 renamed,
cosmetic duplicate names de-duplicated); settings (SFX volume + mute,
persisted) and a synthesized music bed added; level-114 victory screen added;
full state-machine exit audit clean; real-input browser matrix sr2 **12/12
PASS** (file:// + hub http). Root entry-point integration DONE (reachable
from `/index.html` as `hardest/`).
Last updated: 2026-09-23 (ship-run sr2, ship-candidate wave).

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
   (`game.js:458`).

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
  Now defined at `game.js:76` as
  `{ gold: '#ffd23f', silver: '#c8d2dc', bronze: '#b07830' }`, consistent
  with the palette (coin gold / gray silver / door-family bronze).
  Re-proven with real input in sr2 (menu medal dot after a real L1 clear;
  seeded gold/silver save rendered, 0 exceptions).
- **FIXED HIGH: D-45** — `loadSave` (`game.js:15`) now sanitizes on load:
  non-object/garbage JSON falls back to defaults; `unlocked` must be an
  integer ≥ 1; `deaths` a finite ≥ 0 number; `volume` a finite number in
  0–1 (added sr2, defaults to 1 for pre-sr2 saves); `best` entries are dropped
  unless `time` is finite ≥ 0, `deaths` an integer ≥ 0, and `medal` absent
  or gold/silver/bronze. Never throws on arbitrary localStorage content;
  valid saves pass through byte-for-byte (verified in browser, see sr1/sr2
  evidence). The old `b.time.toFixed` throw path (now game.js:400) is dead.
- **FIXED MED: D-65** — `addEventListener('blur', () => keys.clear())` at
  `game.js:102`; held keys no longer stick on focus loss. No
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
- Rights sweep (sr2, FIXED): level 96 HUD name was the original's name —
  now **The Crucible** (`levels/96-worlds-hardest.js` name + header;
  DIFFICULTY.md regenerated). Cosmetic duplicate names de-duplicated:
  64 **Chained Chambers** (was = 114 'Gauntlet III'; header mentions the
  chained chambers), 87 **Vault Raid** (was = 75 'Portal Vault'; header
  says "raid the locked vault"), 110 **Switchback IV** (was = 77
  'Switchback III'; series 11/41/77/110 now I→IV). Player-facing string
  sweep clean: no other original-mark residue in game/boot surfaces
  (menu title, HUD names, `<title>`, hub card are original evocations;
  originals referenced by name only in internal docs/comments, which the
  mission allows).

## sr2 changes (2026-09-23, ship-candidate wave)

All in `hardest/`, validator re-run after (see Verification):

- **Settings (mission floor)**: `game.js` — save v1 gains `volume`
  (0–1, default 1, sanitized in `loadSave`; pre-sr2 saves upgrade
  silently). `beep()` gain scales by `save.volume` and honors `mute`.
  `-`/`=` (and numpad) adjust volume in 10% steps on EVERY screen, with
  an ack blip; `M` toggles mute globally (was per-screen, consolidated).
  Menu renders a settings row: SFX bar + % + mute hint + total deaths.
  Pause overlay lists the volume keys. Verified: adjust → localStorage
  write → reload → persisted (sr2 matrix).
- **Music (implemented, not deferred)**: sparse A-minor tension bed per
  the repo audio doctrine (zero binary assets, WebAudio recipes only):
  8-step arpeggio with rests (triangle, gain 0.02) + sub-root sine each
  bar, 420 ms steps, started on first user gesture (autoplay-safe),
  skipped while muted/zero-volume. Same volume control as SFX. Chosen
  over silence deliberately: the mission's floor asks for music where it
  fits; a quiet bed raises production value without fighting the
  concentration genre. Audibility not asserted headless (see sr2 honest
  limits).
- **Victory screen**: clearing level 114 now routes to a new `win` screen
  (THE CRUEL MAZE CONQUERED + medal tally + total deaths) instead of the
  misleading "Enter for next" clear card. Exits: Enter/Space/Esc/tap →
  menu. Clear-handling factored into `recordClear()`.
- **Polish (bounded)**: clear-overlay medal word now renders in
  `MEDAL_COL`; pause overlay typography unchanged; no redesign.
- Flow audit (see below) drove only the victory-screen gap; no other
  state gaps found.

## Flow audit (sr2)

States and exits, verified by code pass + sr2 real-input matrix:
`menu` (→ play via Enter/tap on unlocked cell; arrows move selection) ·
`play` (→ pause Esc, → restart R, → menu via pause-Q, → clear/win on
goal) · `pause` (→ play Esc/tap, → restart R, → menu Q) · `clear` (→
next level Enter/Space/tap, → menu Esc) · `win` (→ menu Enter/Space/Esc/
tap; sr2-added). Death → auto-respawn at last S/K checkpoint (verified
real-input: died in L1, respawned on the S row). Blur clears held keys
(D-65). Touch joystick only in `play`. Every state has an exit.

## Traps for later runs

- `gen-manifest.mjs --check` no longer exists — the script REWRITES
  `manifest.js` regardless of argv (r05 recorded `--check`; do not trust).
- Regenerate `pars.js` + `DIFFICULTY.md` only after the corpus is final;
  both are derived artifacts.

## Verification

Recorded commands (last observed results):
- `node hardest/validate.mjs` — r05: 96/96 exit 0 (36.8s);
  sr1 2026-09-22: **114/114 exit 0** (109: clear t=37.8s d=0;
  111: clear t=30.6s d=0); sr1 2026-09-23 (after the title rename):
  **114/114 exit 0** (~2 min full corpus); sr2 2026-09-23 baseline:
  **114/114 exit 0**; sr2 after all hardest/ changes (renames + settings +
  victory + README): **114/114 exit 0**; sr2 final (end of run, quoted):
  **114/114 exit 0** (~2 min full corpus). Scoped iteration used
  `node hardest/validate.mjs --only hardest/levels/NN-slug.js`.
- `node hardest/difficulty.mjs` → `DIFFICULTY.md: 114 levels`
  (re-run in sr2 after the renames — names embedded in the report;
  autopilot stats unchanged; `gen-manifest.mjs` intentionally NOT
  run — manifest already matches, and the script rewrites regardless).
- sr2 browser matrix (headless chromium via raw CDP, zero-dep Node 24
  driver `verification/evidence/sr2-hardest-driver.mjs`, real
  `Input.dispatchKeyEvent` / `Input.dispatchTouchEvent` / mouse events,
  fresh user-data-dirs, `__hardest` read-only assertions):
  `node verification/evidence/sr2-hardest-driver.mjs` → **SR2 MATRIX:
  12/12 PASS**, 0 console errors/exceptions across both sessions.
  Items: boot (menu, 114 levels, 0 errors) · settings (5×`-` → 50%, M →
  muted, localStorage write, **reload → persisted**, clamp at 100%) ·
  start/move/pause/resume (L1, KeyD 700ms = 122.5px) · death→respawn
  (walked into patrol 1, deaths=1, auto-respawned on S-row checkpoint,
  back in play) · clear→medal→next (real-input L1 clear, SILVER card
  rendered, best[1] saved, Enter → L2, Esc/Q → menu) · menu medal dot
  (D-47 render path) · touch (emulated touch drag = joystick, player
  moved 38.0→163.4px in L2) · music scheduler ticks (27; WebAudio
  recipes) · mid-corpus via LEVEL SELECT (seeded profile, 46×ArrowRight +
  Enter as real keys → L47 Pad Chain, moved 157.5px) · console-clean ·
  hub (`python3 -m http.server 8126 --bind 127.0.0.1 -d <root>`, real
  click on the hub card → `/hardest/` menu, 114 levels, 0 errors).
  Evidence: `verification/evidence/sr2-hardest-run.log`,
  `sr2-hardest-settings.png` (volume bar 50% + MUTED),
  `sr2-hardest-clear.png` (silver medal card),
  `sr2-hardest-medals.png` (menu, unlocks, settings row),
  `sr2-hardest-touch.png` (joystick drag in L2),
  `sr2-hardest-midcorpus.png` (L47 in play). Honest limits: full clears
  of long levels remain with the autopilot validator (deterministic);
  audio audibility not asserted under `--mute-audio` (persistence,
  scheduler liveness, and gain math verified; recipes by inspection);
  the level-114 `win` screen's real-input reach is impractical (114
  clears) — logic shares the `clear` transition, exit keys verified by
  inspection.
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
  in-browser, touch joystick, audio, the fixed 109/111 movers in-browser
  (all since covered by sr2).
- r05 browser matrix (boot/control/save/touch, lanes HardestBoot/Engine/
  LvA-D/Adversarial, evidence `verification/evidence/r05-*`) — PASS for
  levels 1–98 state.
- Contract: validator MUST pass before and after any `hardest/` change —
  sr2 ran it 4× (baseline, post-change, final, plus difficulty regen
  lane), all 114/114 exit 0.

Ship-gate checklist: ~~gate 114/114~~ DONE sr1, re-proven sr2 (4 runs);
~~D-45/47/65 fixed + re-proven~~ DONE sr1, D-47 re-proven with real input
sr2; ~~pars + DIFFICULTY regenerated~~ DONE sr1, DIFFICULTY re-generated
sr2 after renames; ~~rename to original evocation~~ DONE sr1 (The Cruel
Maze) + sr2 rights sweep (L96 The Crucible; duplicates 64/87/110);
~~integrated into the root entry point~~ DONE sr1, re-proven sr2 with a
real hub click over http; ~~menus/HUD/pause/settings/touch verified with
real input~~ DONE sr2 (12/12 matrix incl. settings persistence, touch
joystick, medal dots, level select, hub); ~~victory screen for L114~~
DONE sr2 (state + exits audited); ~~audio volume/mute~~ DONE sr2
(+ synthesized music bed, no binary assets). Remaining open: D-49/D-50/
D-62 (pre-existing, recorded above); audio audibility in a headed
browser (deferral, below).

## Deferrals

- **Audio audibility in a headed browser** — sr2 verified volume/mute
  persistence, the music scheduler (tick liveness), and gain math under
  `--mute-audio`; nobody listened. Recipes are oscillator-only per the
  repo audio doctrine; a quick headed-browser listen is the remaining
  human check.
- **Real-input clear of level 114 → victory screen** — impractical by
  hand; completability is proven by the deterministic autopilot gate
  (114/114). The `win` screen transition/exit keys verified by
  inspection; shares the proven `clear` path.
- **D-49 / D-50 / D-62** — pre-existing low/med items carried from sr1
  (autopilot fidelity notes; one cosmetic patrol-over-wall render;
  autopilot not loaded in the player shell, by design).
- Music was considered for deferral as "minimalism" but implemented
  instead (sparse synthesized bed, same volume control) — it fits the
  WebAudio recipe style cheaply and meets the mission floor.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`hardest/` docs and code, plus my own knowledge of the original game.
Network use: none. No web/GitHub searches about this project, no
forks/copies, no third-party remakes of the original were consulted.

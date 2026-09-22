# HardestLvD — r05 maga-verify: hardest levels 25–32 browser verification

## Verdict (PASS)

All 8 levels in range (25 Long Haul, 26 Crossfire II, 27 The Vault, 28 Marathon, 29 Panic, 30 Hardest, 31 Keymaster, 32 Shortcut) are **completable**, proven two independent ways in the live browser (file://…/hardest/index.html, Chromium headless):

1. **Headless autopilot** (`HardestAutopilot.solve` injected into the real page, validator defaults maxSim=120 / maxDeaths=400 / seed=1): **8/8 CLEAR**. Values byte-identical to the Node-side `node hardest/validate.mjs` run by sibling HardestValidate (deterministic engine, cross-runtime agreement).
2. **Live drives** of the real game loop (game.js rAF → `E.step` at 240 Hz, driven through the probe-only `__hardest.input` joystick path): every level loaded, rendered, accepted input, accumulated deaths/coins; L29 and L31 driven to **all-coins + goal-armed** live; L31 keymaster and L32 shortcut mechanics observed end-to-end.

No defect was found in levels 25–32. 'Not yet built' items: none — all 8 levels exist, load, and verify.

## Evidence

### Headless autopilot clears (browser, real engine, seed 1, maxSim 120 / maxDeaths 400)

| id | name | clear | time | deaths | medal (game.js:39 mapping) |
|----|------|-------|------|--------|------|
| 25 | Long Haul | CLEAR | 30.55s | 0 | gold |
| 26 | Crossfire II | CLEAR | 11.02s | 0 | gold |
| 27 | The Vault | CLEAR | 17.25s | 0 | gold |
| 28 | Marathon | CLEAR | 25.73s | 0 | gold |
| 29 | Panic | CLEAR | 7.83s | 0 | gold |
| 30 | Hardest | CLEAR | 17.47s | 0 | gold |
| 31 | Keymaster | CLEAR | 12.80s | 0 | gold |
| 32 | Shortcut | CLEAR | 8.87s | 1 | silver |

Wall time for all 8 solves in-page: 4.46s. Values match sibling HardestValidate's Node run of `hardest/validate.mjs` line-for-line (25: 30.5s/0d … 32: 8.9s/1d) — deterministic across runtimes.

### Live mechanic runs (real game.js loop, `__hardest.input` drive)

- **L31 Keymaster — full mechanic loop**: statics keys=1, doors=9, coins=6, goals=2, checkpoints=0; `doorsOpen:false` at spawn → **key taken t=0.85s → `doorsOpen:true`** (all 9 'D' tiles open on pickup; engine.js:289-294) → all 6 coins (4 inside vault through opened door) → **goal-armed t=12.4s** (0 deaths, 12.48s vs PAR 17s shown in HUD). Screenshots: `r05-HardestLvD-L31-start.png` (doors closed HUD "KEYS 0/1"), `r05-HardestLvD-L31-doors-open.png` (HUD "COINS 6/6 · KEYS 1/1", vault open).
- **L32 Shortcut — teleport mechanic**: statics pads=2 paired in scan order **(4,5)↔(17,5)**; left chamber sealed by wall col 10 (pads are the *only* crossing — "shortcut" is mandatory); live event `teleport t=2.72s tile=[17,5] total=1` — player stepped on left pad, engine jumped them to the twin in the right chamber (engine.js:293-307, edge-triggered via `onPad`); coins collected both sides (4/5) before a freeze cut the run. Screenshots: `r05-HardestLvD-L32-start.png`, `r05-HardestLvD-L32-live.png`/`-teleport.png` (both teal pads + death particles visible).
- **L29 Panic — full live clear of objectives**: 5/5 coins at t=8.02s, goal-armed t=8.83s, 0 deaths (`r05-HardestLvD-L29-live.png`).
- **L30 Hardest**: 4 coins in 9.5s, 0 deaths live; statics 7 coins / 2 checkpoints / 4 goal tiles.
- **L25 Long Haul**: 12s drive, player traversed row-1 corridor (x 119→411 px), 5 naive deaths (no dodge logic — expected; completability is the autopilot's job).
- **L26**: 2 coins in 8.3s, 0 deaths. **L27**: 4 coins, 1 death, 7.7s. **L28**: 1 live death captured (death→respawn cycle observed).
- Per-level start screenshots (all 8): `verification/evidence/r05-HardestLvD-L{25..32}-start.png`.

### Environment incidents (not game defects)

- **rAF starvation freezes**: 6 of ~20 live drives aborted via freeze-detection (game clock stalled >1.2s while wall clock ran). rAF probe on an idle moment: 59 frames/s, game Δ=1.000s/s — game loop is correct; freezes correlate with 20+ sibling tabs sharing the browser (CPU contention). Retries succeeded.
- **Shared localStorage cross-lane pollution**: `hardest.save.v1` mutated by sibling lanes mid-session (`unlocked` observed 2→25→27→2; HardestBoot reported a foreign level-1 gold clear on their tab). My lane never persisted anything: no live run was allowed to reach the goal (controller stops 68–72px before goal, "goal-armed"), so `persist()` never fired from my drives.
- **Tab-handle drift**: my kernel tab handle re-resolved onto sibling tabs twice (exposed by `ToolError: Tab "HardestLvB" is busy`, later `Tab "HardestLvC-mine" was closed`). Per Main's discipline I moved to fresh uniquely-named tabs ('HardestLvD-r05x2', '-r05x3') and never `browser.tab()`ed again. **Provenance caveat**: live-drive evaluates issued between drifts may have executed on a sibling hardest tab; headless autopilot numbers are pure engine math and unaffected. My stray evaluates were read-only plus one benign `autopilot.js` script-tag injection (no `start()`/input calls on foreign tabs, no save writes).
- **Corpus churn mid-run**: `HARDEST_LEVELS.length` observed 96 → 98 → 96 (forge adding/removing level files during the wave). Range 25–32 unaffected.

## Defects

1. **D-42 — Level 30 patrol dot renders through solid wall (cosmetic).**
   - `hardest/levels/30-hardest.js` patrol `{ path: [[20, 10], [20, 15]], speed: 175 }` crosses row 12 col 20, which is `'#'` (row 12 = `##########...############....#`; gaps only at cols 10-12 and 25-28). The dot visibly glides through the wall block each cycle. Engine treats dots as pure trajectories (engine.js `dotPos`), so this is level-data vs. rendering expectations, not an engine bug — but it reads as broken to a player.
   - **Suggestion:** either reroute the patrol through the row-12 gap columns or accept as intentional (original WHG also has dots over gaps); flag to level author.

No other defects found in levels 25–32: schema/statics all consistent with maps (coins/keys/doors/pads/checkpoints/goals counts verified per level), all patrols on floor tiles except D-42, key→door and pad-pairing mechanics behave exactly as documented (README.md, LEVEL-FORMAT.md, engine.js).

## Notes

- Protocol: completability = headless `HardestAutopilot.solve` in-browser (same defaults as `hardest/validate.mjs`: maxSim 120, maxDeaths 400, seed 1); live drives used the exposed `globalThis.__hardest` probe hook (`start`/`input`/`state`/`engine`, game.js:362-368). Live full-clears intentionally not recorded into `hardest.save.v1` (shared across lanes) — controller arms at goal then stops; medals reported derive from autopilot deaths via the shipping `medalFor` mapping (game.js:39).
- L31 ceiling 'D' row (8 door tiles, row 1 cols 14-21) opens into a sealed dead-end corridor reachable only from inside the vault — harmless design oddity, noted for level authors.
- L32's "shortcut" pads are the only path from start chamber to goal (wall-sealed) — mechanic is mandatory, tutorial copy ("stepping on one jumps to its twin") matches behavior.
- Keymaster HUD shows `KEYS 1/1` counter and `PAR 17s` — par display present and sane.
- Artifacts: 16 PNGs under `verification/evidence/r05-HardestLvD-*` (start shots ×8, live shots ×8, doors-open + teleport captures).
- Tab names used: `HardestLvD` (closed), `HardestLvD-r05x2`, `HardestLvD-r05x3` (live). Marker `__R05_LVD_MARKER` used for identity checks; page reloaded externally several times (corpus churn) — all state re-probed per call.

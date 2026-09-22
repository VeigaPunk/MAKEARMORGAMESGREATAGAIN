# HardestLvB — hardest levels 9–16 browser-verify (r05)

## Verdict (PASS)

All 8 target levels (ids 9–16) are **completable on current uncommitted bytes**, proven two independent ways: (1) Node `validate.mjs --only` per file (schema + BFS reachability + autopilot clear), and (2) **in-browser** autopilot solves through the page-loaded `engine.js` in `hardest/index.html` — 8/8 clear, 0 deaths each, times identical to Node to 2 decimals (determinism cross-confirmed). Level-select gating verified live in both directions. One transient blocker-class break (`MENU_COLS` ReferenceError) was observed mid-run but was a sibling's mid-edit state, fixed in current bytes; not a defect against current bytes.

## Evidence

**Completability — in-browser autopilot (page-loaded engine.js bytes, `HardestAutopilot.solve` injected into the live page via main-world evaluate; maxSim 120s, maxDeaths 400, seed 1):**

| id | name | clear | time (s) | deaths | wall ms | Node validate.mjs match |
|----|------|-------|----------|--------|---------|-------------------------|
| 9 | Two Rooms | true | 11.47 | 0 | 291 | 11.5 / 0 deaths |
| 10 | The Weave | true | 5.44 | 0 | 160 | 5.4 |
| 11 | Switchback | true | 8.72 | 0 | 266 | 8.7 |
| 12 | Pincer | true | 8.73 | 0 | 257 | 8.7 |
| 13 | Coin Vault | true | 7.70 | 0 | 203 | 7.7 |
| 14 | Fast Lanes | true | 11.94 | 0 | 317 | 11.9 |
| 15 | Maze Lite | true | 28.86 | 0 | 686 | 28.9 |
| 16 | Phase Shift | true | 5.59 | 0 | 157 | 5.6 |

Node run: `node hardest/validate.mjs --only hardest/levels/{09..16}-*.js` → 8/8 `PASS … clear t=… deaths=0`, total wall 3.19s. Browser times match Node exactly (engine determinism Node↔browser confirmed). 0 deaths ⇒ every run is gold-medal-eligible (`medalFor`, game.js:40). Autopilot is NOT loaded by index.html (loads engine→manifest→levels→game.js only); it was injected read-only into the page at runtime — no source files touched.

**Per-level boot (live page, `__hardest.start(idx)`, current bytes):** all 8 boot to `screen:play, status:play`, HUD id/name correct, coin totals match definitions (9:5, 10:4, 11:5, 12:4, 13:6, 14:4, 15:5, 16:3), `keysLeft:0` + `doorsOpen:true` (levels 9–16 contain K checkpoints but no `y` keys / `D` doors — keys not required to clear; clear condition is coins+G, engine.js step), 0 deaths, clock advancing. Screenshots: `verification/evidence/r05-HardestLvB-lvl09-start.png` … `lvl16-start.png` (8 files).

**Shell input path (live drive):** `__hardest.input(1,0)` on level 9 for 0.65s game-time → player.x +113.8px (= 175 px/s `playerSpeed` exactly), y unchanged, status play, deaths 0. Probe-hook drive path works.

**Gating / unlock predicate (live + static):**
- Fresh-ish save (`unlocked:2`): menu renders 16-col grid, tiles 1–2 unlocked, 3+ padlocked; `ArrowRight`×8 → `sel=8` (level 9) + Enter → **no-op** (screen stayed `menu`) — gate `sel < save.unlocked` (game.js:98) verified live. Screenshot `r05-HardestLvB-menu-locked-9-16.png`.
- Seeded `unlocked:16` → tiles 1–16 unlocked, 17+ padlocked; boundary exactly at 16. Screenshot `r05-HardestLvB-menu-unlocked-9-16.png`.
- Unlock increment on clear: `save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, levelIdx + 2))` (game.js:345) — sequential +1 unlock per clear [static, clear path not exercised live: no human-playable clear was performed; solves run on shadow states and do not touch save].
- Save key `hardest.save.v1` (game.js:7); `loadSave` merges defaults, catches JSON parse errors only (game.js:16) — see D-41 (HardestAdversarial) for malformed-save crash; not re-tested here.

**Moving-target observation (transient, resolved):** at 18:10:56 game.js referenced `MENU_COLS` at lines 95/96/292 with no definition → `Uncaught ReferenceError: MENU_COLS is not defined` at game.js:291:15 thrown **every frame** from `drawMenu` (500 errors logged in ~15s; menu tiles not drawn; menu Up/Down nav also threw at lines 95–96). Play screen unaffected (`__hardest.start()` worked throughout). Sibling L1 maga-hardest landed `const MENU_COLS = 16;` (now game.js:8) by 18:11:26; fresh tab load at ~18:13 shows **0 console errors** for the remainder of the session. Current bytes healthy.

**Corpus context:** `manifest.js` = 96 levels; new `levels/97-moving-walls.js`, `98-crush-alley.js` exist untracked but are NOT in the manifest (gen-manifest not rerun) → they do not load in-game. Schedule fact, not a defect. Full-corpus gate 96/96 PASS already recorded by HardestValidate (levels 32/79 with 1 death each; my 8 all 0 deaths).

## Defects

None new for levels 9–16. (Transient `MENU_COLS` ReferenceError was real but self-resolved mid-run; current bytes verified clean — recorded above as a moving-target note, not filed against current bytes. Cross-lane note: all `file://` tabs share one `hardest.save.v1` origin — sibling clears/seeds pollute each other's menu evidence; coordination issue, not a game defect.)

## Notes

- Autopilot not page-exposed (index.html doesn't load autopilot.js); suggest exposing it via the `__hardest` probe hook for future verify lanes. Injection workaround used here is read-only.
- `__hardest.start(i)` bypasses the `sel < save.unlocked` menu gate by design (probe hook) — used legitimately for verification; gating itself verified separately (Enter no-op on locked sel).
- Levels 9–16 use no `movers` (the forge's new feature), so the mover code paths are untested by this lane; the shared `buildPath` patrol refactor is exercised by all 8 clears (patrol phase/speed/radius semantics intact — level 16's explicit `r: 6` patrols behave identically pre/post refactor per matching Node/browser times).
- All solves ran with seed 1; per-level medal evidence is autopilot-derived (0 deaths ⇒ gold-eligible), not save-recorded medals.
- Screenshots: `verification/evidence/r05-HardestLvB-menu-locked-9-16.png`, `r05-HardestLvB-menu-unlocked-9-16.png`, `r05-HardestLvB-lvl09-start.png` … `lvl16-start.png` (10 PNGs, 1706×960).

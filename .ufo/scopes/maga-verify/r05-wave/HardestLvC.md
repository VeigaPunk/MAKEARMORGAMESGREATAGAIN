# HardestLvC — r05 browser verification: hardest levels 17–24 completability

Lane: HardestLvC (leaf, no subagents). Tab names used: `HardestLvC` → `HardestLvC-mine` → `HardestLvC-r05c-run2/3` → `HardestLvC-final-run` (renamed per wave discipline after crosswire incidents).

## Verdict

**PASS** — all 8 target levels (17–24) are completable in the browser on current bytes, via two independent in-page mechanisms, with 0 deaths each (gold medal pace). One new cross-cutting defect found in the uncommitted menu code (D-41, MEDAL_COL); it does not affect gameplay/completability.

## Evidence

Byte provenance (moving target — other lane landed mover/pars/difficulty work mid-window; hashes pinned at verification time):
- `hardest/engine.js` md5 `60ade22a89ce407991cbb243d73b8586` — **stable across the entire verification window** (mtime 18:07:04, unchanged at 18:28+). All game logic verified against these bytes.
- `hardest/game.js` md5 `39b2f9f94565fefd3a7b539834c68a70` (final pass; changed at 18:27 mid-verification — menu cosmetics, par display, mover rendering, tier legend; `axis()`/stepping/clear-bookkeeping unchanged per diff).
- Level files 17–24 pinned: `d85866d2…`(17) `c9dccea0…`(18) `aa42c923…`(19) `89cc7d5c…`(20) `84656f33…`(21) `3ab61e9a…`(22) `de67ca93…`(23) `380dbd87…`(24) — never modified during the window.
- `pars.js`/`manifest.js` churned (levels count went 96 → 98 → 114 mid-verification); level files 17–24 unaffected.

### 1. Headless deterministic prover (repo's own validate.mjs, real engine)
Ran 3× across the churn window — identical results every time:
```
PASS 17-gauntlet-ii.js  clear t=11.2s deaths=0     PASS 21-dot-storm.js  clear t=7.8s  deaths=0
PASS 18-diagonal.js     clear t=7.3s  deaths=0     PASS 22-labyrinth.js  clear t=12.8s deaths=0
PASS 19-the-squeeze.js  clear t=23.7s deaths=0     PASS 23-tempo.js      clear t=5.9s  deaths=0
PASS 20-halfway.js      clear t=19.1s deaths=0     PASS 24-no-room.js    clear t=23.3s deaths=0
```

### 2. In-browser live-engine solve (real page, real engine instance, policy stepping `HardestEngine.step` on the live state; game loop paused during solve to avoid double-stepping, then unpaused so the game's own clear bookkeeping ran)
| Level | Result | Deaths | Time | Medal | Screenshot |
|---|---|---|---|---|---|
| 17 Gauntlet II | clear | 0 | 10.28s | gold | r05-HardestLvC-L17-clear.png |
| 18 Diagonal | clear | 0 | 6.36s | gold | r05-HardestLvC-L18-clear.png |
| 19 The Squeeze | clear | 0 | 22.80s | gold | r05-HardestLvC-L19-clear.png |
| 20 Halfway | clear | 0 | 16.97s | gold | r05-HardestLvC-L20-clear.png |
| 21 Dot Storm | clear | 0 | 6.17s | gold | r05-HardestLvC-L21-clear.png |
| 22 Labyrinth | clear | 0 | 11.50s | gold | r05-HardestLvC-L22-clear.png |
| 23 Tempo | clear | 0 | 5.16s | gold | r05-HardestLvC-L23-clear.png |
| 24 No Room | clear | 0 | 18.70s | gold | r05-HardestLvC-L24-clear.png |

Deterministic: two independent in-page passes produced identical times (±0.1s). Screenshots show the real canvas: `LEVEL CLEAR — GOLD` overlay, HUD `LVL n · COINS x/x · DEATHS 0 · t`.

### 3. Live game-loop playthrough (authenticity check — level 23)
Driven through the shipping input path: game's own rAF loop → `axis()` sampling the probe joystick (`__hardest.input`) → `E.step` at 240 Hz substeps. Result: **clear, 0 deaths, 5.23s** (second run on current bytes; first run on earlier game.js bytes, identical engine.js: 5.18s). Screenshot: `r05-HardestLvC-L23-liveloop-clear.png`.

### 4. Unlock via save predicate
`localStorage['hardest.save.v1'] = {unlocked:25,…}` → menu renders tiles 17–24 unlocked, padlocks from 26 (screenshot `r05-HardestLvC-01-menu-unlocked-17-24.png`, 114-level build, 16-col grid). Clear bookkeeping verified: after clears, save.best holds entries 17–24 all `{deaths:0, medal:"gold"}`; `unlocked` clamp `max(unlocked, idx+2)` behaves (stays 25).

### 5. Console
Zero page errors during all play/clear paths on current bytes. The only errors observed are D-41 (below) under a medaled save.

## Defects

**D-41 (new, current bytes, game.js md5 `39b2f9f9`): `MEDAL_COL is not defined` — menu crashes every frame once any save.best entry exists.**
- game.js:316 (`drawMenu`): `if (b && b.medal) { ctx.fillStyle = MEDAL_COL[b.medal]; … }` — the constant was deleted in the 18:27 cosmetic edit (tier-legend/APEX rework) but this reference remains. Grep: zero definitions remain.
- Repro (deterministic): any `save.best[id] = {deaths, time, medal}` → reload → `Uncaught ReferenceError: MEDAL_COL is not defined` at game.js:316, measured **91 errors / 1.5s (~60/s, every menu frame)** via page error counter.
- Impact: drawMenu aborts at the first medaled tile — all later tiles never render and their `menuRects` are never registered, so pointer navigation to them is dead. Screenshot `r05-HardestLvC-D41-menu-crash-medal-col.png` shows tiles 18–25 missing with unlocked=25 and a best entry for 17. Every player who cleared ≥1 level hits this on returning to the menu. Level start via probe/keyboard still works; play screens unaffected (only drawMenu references MEDAL_COL).
- Fix suggestion: restore `const MEDAL_COL = { gold:'#ffd23f', silver:'#c8c8c8', bronze:'#c87f3f' }` (or derive from medalFor) next to `medalFor`/`TIERS` at game.js:39-42.
- Caveat: tree was churning during verification (other lane landing mover/pars work); defect reproduced on game.js md5 `39b2f9f9` at ~18:35–18:45. If the owning lane edits game.js again, re-check against their newer bytes.

## Notes

- **Moving target**: hardest/ was actively edited by the forge lane throughout (engine.js 18:07, game.js 18:11→18:27, pars.js/manifest.js/index.html 18:22+, new levels 97–114 appearing). engine.js — all game logic — was byte-stable (md5 `60ade22a…`) across every check; level files 17–24 never changed. Final browser pass ran game.js `39b2f9f9`.
- **Transient mid-edit crash (not a defect in final bytes)**: my first tab loaded a mid-edit game.js (~18:11) that threw `b.time.toFixed is not a function` per frame; gone after reload on settled bytes. Class-wise same as D-41 (menu render vs save data) — the final-bytes repro is D-41.
- **Dormant par wiring**: game.js references `globalThis.HARDEST_PARS` for HUD/clear-overlay par display; at ~18:12 it was defined nowhere (0 keys — dead fallback). By the final pass pars.js exists and is loaded; levels 17–24 have no par entries → no par text, graceful. Informational only.
- **`__hardest.start(i)` bypasses the unlock gate** — documented probe hook ("probe-only drive"), not user-facing; not a defect.
- **Death/respawn path not exercised in-browser** (0 deaths across all runs — policy cleared everything first try). Engine death path (respawn at last S/K checkpoint, coins persist) is exercised by the repo autopilot on harder corpus levels; labeled gap, not defect.
- **Environment hazards for the wave** (not game defects): (1) `file://` origin shares one localStorage across ALL lanes' tabs — mutual save clobbering is guaranteed under concurrent clears (observed unlocked jump 25→27→32 from sibling clears; my predicate writes may have wiped sibling best entries and vice versa). (2) Global tab-name registry crosswired my tab twice (found it on level 30 / unlocked=32 with no action of mine — matches BoxheadStress's stray-Space warning). Evidence protocol used state-verified per-level checks (`level` field must match) to detect contamination.
- In-page solve times differ slightly from validate.mjs times (e.g. L17 10.28s vs 11.2s) — different legal routes from minor policy divergence (autopilot.js gained mover-awareness mid-window; my port doesn't simulate movers in evalMove — irrelevant for levels 17–24, which have none). Both are legal 0-death clears through the same engine.
- Screenshots: `tab.screenshot({path})` reported success but did not land on disk (harness artifact); all persisted evidence was written via in-page `canvas.toDataURL()` + direct file write — all 11 files verified on disk with sizes.

## Screenshot index (verification/evidence/)
- `r05-HardestLvC-01-menu-unlocked-17-24.png` — clean menu, current bytes, tiles 17–24 unlocked, padlocks 26+
- `r05-HardestLvC-L17-clear.png` … `r05-HardestLvC-L24-clear.png` — per-level LEVEL CLEAR — GOLD overlays (8 files)
- `r05-HardestLvC-L23-liveloop-clear.png` — level 23 cleared through the game's own rAF loop
- `r05-HardestLvC-D41-menu-crash-medal-col.png` — D-41 repro: menu truncated at first medaled tile

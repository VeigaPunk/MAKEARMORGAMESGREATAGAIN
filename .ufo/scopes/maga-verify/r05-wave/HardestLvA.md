# r05 · HardestLvA — hardest/ levels 1–8 browser verification

## Verdict
**PASS** — levels 1–8 verified completable with hard engine evidence. All 8 clear through the deterministic autopilot running the REAL shipping engine (in-browser, current uncommitted bytes of `hardest/engine.js`), 0 deaths each, plus Node `validate.mjs` cross-check 8/8. L1 additionally cleared through the real UI shell (keyboard), GOLD medal awarded and persisted. One new HIGH-severity robustness defect found (D-41, save corruption bricks the menu — reproducible on demand); one LOW affordance gap (D-42).

## Evidence

### Exposure check (assignment question)
- `window.HardestEngine` ✅ exposed (`engine.js` IIFE → `globalThis`).
- `window.__hardest` ✅ probe hook: `{state, start(i), input(x,y), engine}` — `game.js:341-347`.
- `window.HardestAutopilot` ❌ **NOT exposed** — `index.html` never loads `autopilot.js` (script chain: engine → manifest → levels → game only). Workaround used: injected `autopilot.js` source inline into the live page (no file edits); it bound to the page's real `HardestEngine`. → D-42.

### Autopilot clears — levels 1–8 (in-browser, page engine, seed 1 first try, budget 120s/400d never approached)
| L | Name | Clear | Deaths | Time (sim) | Medal equiv |
|---|------|-------|--------|-----------|-------------|
| 1 | First Steps | ✅ | 0 | 3.58s | gold |
| 2 | Loot Run | ✅ | 0 | 14.92s | gold |
| 3 | Snake Corridor | ✅ | 0 | 11.11s | gold |
| 4 | Coin Detour | ✅ | 0 | 5.31s | gold |
| 5 | Checkpoint Gauntlet | ✅ | 0 | 7.06s | gold |
| 6 | Crossfire | ✅ | 0 | 8.39s | gold |
| 7 | Narrow Doors | ✅ | 0 | 5.93s | gold |
| 8 | Ring Patrol | ✅ | 0 | 6.64s | gold |

Solver wall time 66–339 ms/level. Node cross-check: `node hardest/validate.mjs --only <file>` × 8 → `1/1 levels pass` each (schema + BFS reachability + autopilot). These runs exercise the uncommitted `hardest/engine.js` (+77/−14) — the forge fix surface.

### Real-UI shell
- L1 driven by held arrow keys: cleared 3× (5.32s / 5.52s / 5.6s, 0 deaths). Clear screen: "LEVEL CLEAR — GOLD, deaths 0 · time 5.6s — Enter for next". `localStorage best["1"] = {deaths:0, time:5.55, medal:"gold"}`, `unlocked: 2`. Medal pipeline + persistence verified live.
- L2–L8 booted via `__hardest.start(i)`: all enter `screen:'play', status:'play'`; coin counts match maps exactly (5/2/4/3/4/2/4), keys 0, zero console errors, zero new errors across a 500 ms post-reload window. Renders match map data (L5 K-zones render as doorway tiles between chambers; L8 ring block, 4 corner coins, both G zones, 3 loops).

### Screenshots (`verification/evidence/`, PNG)
- `r05-HardestLvA-menu-corrupt-save.png` — D-41 repro: grid truncated after tile 1 despite unlocked=2
- `r05-HardestLvA-menu-clean.png` — baseline: full 96-tile grid
- `r05-HardestLvA-l01-play.png` / `r05-HardestLvA-l01-clear.png` — real-UI run + GOLD clear screen
- `r05-HardestLvA-l02-boot.png` / `r05-HardestLvA-l05-boot.png` / `r05-HardestLvA-l08-boot.png`

## Defects

**D-41 (HIGH, robustness) — corrupt `best` entry in localStorage permanently bricks level select.**
- `loadSave()` (`game.js:13-16`) `Object.assign`s raw JSON with zero validation; `drawMenu` (`game.js:296-297`) calls `b.time.toFixed(0)` unguarded → `Uncaught TypeError: b.time.toFixed is not a function` **every rAF frame**; draw aborts mid-menu, later tiles never render (screenshot: only tile 1 of unlocked 2).
- Compounding: clear-handler guard `st.deaths < b.deaths` vs string `"x"` → false, so a legitimate 0-death run **cannot overwrite** the corrupt entry; `persist()` re-writes corruption forever. Observed live: my first L1 gold clear silently failed to save a best/medal because a foreign corrupt entry was present.
- Deterministic repro: `localStorage.setItem('hardest.save.v1', '{"unlocked":2,"best":{"1":{"deaths":"x","time":"bad"}}}')` → reload → crash loop.
- Realistic vector demonstrated this wave: all `file://` tabs share ONE localStorage origin — another lane's save writes/adoversarial plants land in the same store (my gold runs appeared in HardestBoot's save; the corrupt entry predates any of my writes, origin [INFERENCE] another lane's plant).
- Suggested fix: validate on load (drop entries where `typeof deaths/time !== 'number' || !isFinite`), and/or optional-chain the `toFixed` in `drawMenu`.

**D-42 (LOW, verification affordance) — solver not reachable from the shipped page.**
- `autopilot.js` missing from `index.html`; README positions autopilot/validate as the proof tooling. Had to inline-inject source. Suggest a dev-only `?autopilot=1` loader branch or a docs note. Not a gameplay bug.

## Notes
- Levels 1–8 contain no `y` keys / `D` door tiles / `T` telepads (L7's "doors" are 1-tile wall gaps) — door/pad/key machinery is exercised only later in the corpus, unverified by this lane (out of scope).
- Static spot-checks, no anomalies: L4 coins sit on the patrol columns themselves (timing pickup, feasible per 0-death clear); L7 guard contract holds (sweep row 4, never the gap tiles); L8 loop paths cross coin-corner lanes (feasible). No dots-through-walls observed in sim or renders.
- Autopilot FAIL would not prove impossibility (greedy policy), but all 8 PASSed, so completability is proven, not inferred.
- Contamination log (per wave discipline): (a) session-start `browser.open('HardestLvA')` kernel handle later resolved to a Burger-lane tab; re-acquired via `browser.tab('HardestLvA')` — my own name — and all evidence re-derived after. (b) shared `file://` save store cross-talk documented under D-41; HardestBoot notified and now owns the store; my save writes are finished.

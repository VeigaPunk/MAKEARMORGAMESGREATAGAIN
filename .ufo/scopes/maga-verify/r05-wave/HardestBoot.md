# HardestBoot — r05 boot-surface verification (hardest/)

Lane: HardestBoot (scout, leaf — no subagent dispatch). Target: `hardest/index.html` boot surface, file:// — sibling maga-hardest's NEW game, verified independently against current uncommitted bytes (`git status`: engine.js, autopilot.js, validate.mjs modified; game.js committed state).

## Verdict

**PASS** — every boot-surface checklist item verified with measured evidence. One cross-referenced boot-crash defect (D-41, owned by HardestAdversarial, independently reproduced here) and two new findings (D-42, D-43) below. All numbers below are measured on the live page.

## Evidence

Boot & menu
- Boot order verified: engine.js → manifest.js → 96 `<script>` injections (manifest order, `s.async=false`) → game.js. `hardest/index.html:13-22`.
- 96 level files on disk = 96 manifest entries (`ls hardest/levels/*.js | wc -l` = 96; `HARDEST_MANIFEST.length` = 96). Boot retry loop (`boot()` every 30ms until `levelsReady()`) completed.
- Clean boot: `screen:'menu'`, `unlocked:1`, `levels:96`, canvas 960×576, title "The World's Hardest Game — INTERNAL". **0 console errors, 0 warnings** after clean reload (errors() and console() both empty).
- Menu render (screenshot `r05-HardestBoot-menu.png`): title, controls hint, total-deaths line, 7-tier legend (WARM-UP→INHUMAN), 12×8 grid, tile 1 unlocked+selected (blue + gold border), padlock glyphs on tiles 2-96.

Level 1 gameplay (engine measured values)
- WASD/arrows: hold D 600ms → x 38→143 = **+105px = exactly 175px/s** (engine PLAYER_SPEED). W clamps at top wall (y stays 38). A/S symmetric. Screenshot `r05-HardestBoot-level1-move.png`.
- Blue dots patrol: dot0 at x=272 (tile 8), y 246.4→109.9 over 1.516s = **90.0 px/s** (matches `speed:90`); dot1 anti-phase at x=400 (tile 12). Pingpong verified.
- Death on touch: player parked at (250.2, 112.7) in dot0's sweep → `status:'dead'`, deaths 0→1, HUD `DEATHS 1 84.7s`, red particle burst rendered, player hidden while dead. Screenshot `r05-HardestBoot-death.png`.
- Respawn: dead→play after 0.25s, player returned to S zone (zone='S', y=38), deaths preserved.
- Green zones: S (start, green) and G (goal, green) both render; zone tracking verified via engine `zone` field ('S' at spawn, '.' in field, 'G' at goal).
- Wall clamp: right drive clamps at x=588 exactly (19×32−20−ε).
- Clear: corridor clear → `status:'clear'`, screen 'clear', overlay "LEVEL CLEAR — GOLD / deaths 0 · time 33.5s — Enter for next" (screenshot `r05-HardestBoot-clear.png`).

Level 2 (Loot Run) — coins/checkpoint
- Coin collect: descending the col-19 coin column took coinsLeft **5/5 → 2/5** (3 coins, pickup radius r+2=8px). Screenshot `r05-HardestBoot-level2-start.png` (HUD COINS 0/5, all 5 coins + 6 dots + K/G zones visible).
- Checkpoint: standing on K zone → `zone:'K'`, respawn updated [70,38]→**[614,198]**; death in row-7 patrol band respawned player at **(614,198) = checkpoint**, not start. Checkpoint mechanic verified end-to-end.
- Coin gate (headless engine probe, same shipping code): player ON G tile with coinsLeft=1 → `status:'play'` (clear refused); gate opens only at coinsLeft=0. engine.js step(): `if (ch === 'G') … if (st.coinsLeft === 0) st.status='clear'`.
- Keys/doors (headless): collecting the last key flips `doorsOpen:false→true` (keysLeft 1→0). Teleport probe inconclusive in this lane (probe-design error on my side, out of boot scope — corpus gate validate.mjs + autopilot owns telepad reachability).

Controls (real CDP input)
- R restart: in-run deaths 1→0, player back to spawn (38,38), total `save.deaths` 0→**1** persisted. No double-count.
- Esc pause: overlay "PAUSED — Esc resume · R restart · Q quit · M mute", engine frozen (screenshot `r05-HardestBoot-pause.png`); Esc resumes.
- Enter next: my own level-1 clear → Enter → **level 2 playing** (screen 'play', level 2, coinsTotal 5). Esc-from-clear → menu ✓.
- M mute: `m` → `save.mute:true` persisted to localStorage; `m` again → false. Both directions verified.
- Q quit: pause → menu ✓.
- Menu tap: click unlocked tile 2 → starts level 2 (levelIdx 0→1); click locked tile 3 → no-op (screen stays menu). Enter on locked selection → no-op.
- Touch joystick: `touchscreen.touchStart/touchMove(+60px)/touchEnd` → pointer events → joystick hint ring + displaced knob rendered; player moved x 38→**178** (+140px ≈ 175px/s over the 0.78s drag, y unchanged). Screenshot `r05-HardestBoot-touch.png`.

localStorage save (`hardest.save.v1`)
- Shape verified: `{unlocked, best:{"<levelId>":{deaths,time,medal}}, deaths, mute}` — all four facets observed mutating correctly (unlocked 1→2 on clear; best["1"]={deaths:0,time:5.04,medal:"gold"} from my run; deaths accumulates on R/clear; mute persists).
- Medal rule verified: 0 deaths → gold (best["1"].medal="gold" on 0-death clear).

Console
- **0 errors, 0 warnings** across the entire post-reset session (errors().entries.length = 0, console() empty).

## Defects

- **D-42 [LOW, hardening]** — `engine.js` teleport pairing uses `idx ^ 1` (step, ~line 296-306) assuming an even pad count; an odd number of 'T' tiles makes `telepads[idx^1]` undefined → destructure TypeError → uncaught exception kills the game loop mid-play. `parseLevel` collects pads with no parity assertion. Current 96-level corpus is gated by validate.mjs (peer lane), so not reachable today — latent for future hand-authored levels. Suggest an even-pad assertion in parseLevel.
- **D-43 [MEDIUM]** — `game.js:66-72`: keydown/keyup listeners never clear the `keys` Set on window blur. Losing focus while holding a movement key (alt-tab, focus steal — observed repeatedly during this wave's cross-tab chaos) leaves the key stuck → player drifts with no input. Observed live: player drifted with zero input until CDP keyups were dispatched. Suggest `addEventListener('blur', () => keys.clear())`.
- D-44 [MINOR, UX] — menu selection can rest on locked tiles with no visual feedback: highlight is only drawn when `!locked` (game.js drawMenu), and Enter/tap on a locked tile silently no-ops. Verified: ArrowRight onto locked tile 2 → no highlight change (screenshot `r05-HardestBoot-menu-sel-locked.png`), Enter no-op.
- **Cross-ref D-41 (not mine — independently CONFIRMED)** — corrupt save bricks boot: `b.time.toFixed is not a function` at game.js:296 thrown every animation frame, black screen, game unplayable. Reproduced in this lane on clean boot with the planted save `{"unlocked":2,"best":{"1":{"deaths":"x","time":"bad"}}}` (screenshot `r05-HardestBoot-boot-crash.png`; raw string preserved in this file's history). Root cause: `loadSave()` (game.js:14-17) merges localStorage JSON with no schema validation; `drawMenu` trusts `best[].time/deaths` types. Owned by HardestAdversarial (D-41) + independently found by HardestLvA. Fix: validate/normalize in loadSave (typeof guards) or try/catch around drawMenu save access.

## Notes

- **Wave-infrastructure hazards (not game defects), heavily observed this round:**
  1. Tab names resolve globally across agents — my named tab was hijacked repeatedly. HardestLvA confessed the level-1 gold clears on my tab (their runs land in the shared save); SasD31, BoxheadPause, BoxheadStress, ImpossibleFixes each reported reverse-direction handle crossings. Main's wave discipline (unique prefixed names, never browser.tab() others' names) is the right mitigation.
  2. file:// origin = ONE shared localStorage for all lanes: `hardest.save.v1` was clobbered repeatedly (HardestLvA gold runs, HardestLvC `unlocked:25/mute:true` predicates, my resets). Any lane's save-dependent evidence on this origin is volatile.
  3. Cross-tab key events left stuck keys in the game's `keys` Set (see D-43) — polluted real-time keyboard holds; I mitigated with CDP keyup sweeps + synchronous `E.step` driving (the engine is pure/deterministic — same code the validator runs).
- Headless-engine probes (private `E.create` state, immune to interference) used for coin-gate and keys/doors invariants; all interactive tests used real CDP keyboard/mouse/touch events.
- Level 1 has no coins by design ("No coins" — levels/01-first-steps.js); coin-collect tested on level 2 per its design.
- Engine time only advances via rAF; the harness idle-freezes tabs between calls, which pauses the game (correct pause semantics, not a defect).
- Save-state reads varied between cells due to sibling writes (best["1"].time observed at 33.49/5.69/5.19 across reads) — every verdict above carries its own independently measured evidence, not save-state inference.
- Uncommitted work in hardest/ touches autopilot.js, engine.js, validate.mjs (git status) — game.js (where D-41/D-43 live) is committed state; engine.js current bytes verified above.

DESPAWN: gx-scout-HardestBoot — signal delivered. Send me shutdown_request.

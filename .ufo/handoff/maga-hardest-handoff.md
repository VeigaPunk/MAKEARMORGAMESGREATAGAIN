# maga-hardest — K3 handoff

## 1. ORIGINATING IDEA

**The World's Hardest Game** — a remake of the classic Flash precision-dodging game (Snubby Land / Armor Games, 2007). The spec of record is `MAGA-everything/01-design-docs/02-concept-specs/02-impossible-game.md` + `05-dossiers/impossible-game.md`.

**Core mechanics (from the original):**
- Red square player, arrow/WASD movement, instant-death on contact with blue patrol dots.
- Yellow coins: ALL must be collected before the goal zone activates.
- Green zones: `S` start (spawn/checkpoint), `G` goal (level ends when reached with all coins), `K` checkpoint (respawn point).
- Patrol dots move on fixed paths at fixed speeds — deterministic, learnable, fair.
- Death = instant respawn at last checkpoint, death counter increments.
- Level select grid with unlock progression (beat level N to unlock N+1).
- Difficulty tiers: WARM-UP → DEMANDING → BRUTAL → HARD+ → SAVAGE → NIGHTMARE → INHUMAN → APEX.

**Feel:** tight, responsive, no inertia — the player moves at constant speed, stops instantly. Deaths are fast and frequent; the game is about pattern recognition and muscle memory, not reflexes. The original's charm is its brutal fairness — every death is your fault.

**Acceptance criteria (from spec):** playable in browser via `file://`, zero dependencies, data-driven levels, validator + autopilot proof of completability.

## 2. CURRENT STATE

**Commit:** `f24ba11` (round 3) — 114 levels, all schema+reachability validated, 112/114 autopilot-verified.

**What exists:**
- `hardest/engine.js` — pure game logic (no DOM): level parsing, physics step, patrol/mover collision, coin/key/door/teleport/checkpoint mechanics, crush detection. Node-compatible for validator/autopilot.
- `hardest/game.js` — browser shell: canvas render, input, level select menu, save/load (localStorage), audio (WebAudio blips), medals (gold/silver/bronze by deaths), tier colors, par times, death counter, speedrun timer.
- `hardest/index.html` — loads engine + manifest + level scripts + pars + game. Opens via `file://`.
- `hardest/levels/` — 114 level files (01-114), each a self-registering JS object: `{ id, name, map[], patrols[], movers[] }`. Map chars: `#` wall, `.` floor, `S` start, `G` goal, `K` checkpoint, `C` coin, `y` key, `D` door, `T` teleport pad.
- `hardest/manifest.js` — generated level list (gen-manifest.mjs).
- `hardest/pars.js` — generated par times (gen-pars.mjs, from autopilot clear times).
- `hardest/validate.mjs` — schema + reachability + mover-sweep + autopilot clear check. `node hardest/validate.mjs` validates all; `--only <file>` for one; `--no-auto` skips autopilot.
- `hardest/autopilot.js` — deterministic completability prover: BFS pathing + greedy candidate-move evaluator + predictive dot-collision horizon. CLEAR = hard evidence; FAIL = unproven (may still be humanly possible).
- `hardest/difficulty.mjs` — generates DIFFICULTY.md: per-level autopilot deaths/time table for re-balance passes.
- `hardest/gen-manifest.mjs` / `hardest/gen-pars.mjs` — regenerate manifest.js / pars.js after adding levels.
- `hardest/LEVEL-FORMAT.md` — level authoring contract (chars, mechanics, design rules).
- `hardest/README.md` — how to run/validate/author.

**Mechanics shipped:**
- Patrol dots (pingpong/loop, speed, phase) — all 114 levels.
- Coins (all required) — all levels.
- Checkpoints (`K`) — many levels.
- Keys/doors (`y`/`D`) — ~40 levels.
- Teleport pads (`T`, paired in scan order) — ~35 levels.
- Movers (`movers[]` — solid sliding wall blocks, push/crush) — 16 levels (97-114).
- Medals (gold ≤0 deaths, silver ≤2, bronze >2) + tier colors + par times + death counter + speedrun timer + audio mute.

**Verified working:**
- All 114 levels pass schema + reachability + mover-sweep checks.
- 112/114 pass autopilot clear (deterministic proof of completability).
- Browser-tested: menu renders 16×7 grid with tier colors + medal pips + best stats; L01 plays, HUD shows par/deaths/time; L97/L98 mover mechanics verified (push + crush); L99-L114 landed and validated.
- Zero external dependencies; opens via `file://` or any static server.

**Known gaps:**
- `109-vault-door.js` and `111-portal-press.js` fail autopilot (sim-budget — bot can't clear in 120s). Both are humanly possible but the greedy bot can't time the mover/door interaction. Needs either a smarter autopilot (mover-aware planning) or a level redesign that gives the bot a readable window.
- No level editor (in-browser authoring → export level file).
- No gamepad support.
- No daily-seed challenge mode.
- No full-run speedrun mode (all levels back-to-back with total timer).

## 3. POLISH NEEDED (ranked by impact)

**P0 — game feel:**
1. **Death feedback** — the original has a satisfying "pop" + screen flash + instant respawn. Current: silent respawn. Add a brief red flash + particle burst + a sharper death sound.
2. **Coin pickup feedback** — subtle sparkle + pitch-rising blip per coin (original has a satisfying "ding" that climbs). Current: single flat beep.
3. **Goal reach celebration** — brief green flash + level-complete sting + medal reveal animation. Current: flat overlay text.
4. **Movement juice** — subtle player squash/stretch on direction change, or a faint trail. The original is dead-simple but feels tight; ours feels slightly floaty because there's zero visual feedback on movement.

**P1 — visual polish:**
5. **Patrol dot rendering** — original dots have a subtle gradient/shine. Ours are flat circles. Add a radial gradient or a small highlight dot.
6. **Coin rendering** — original coins pulse/shimmer. Ours are static yellow circles. Add a gentle scale pulse or rotation shimmer.
7. **Mover rendering** — currently flat gray blocks. Add a subtle border + directional indicator (arrow or stripe showing movement direction).
8. **Door/key rendering** — doors are flat red; keys are flat yellow. Add a key icon shape (not just a dot) and a door with a visible lock/bar.
9. **Teleport pad rendering** — currently flat cyan circles. Add a pulsing ring or swirl effect.
10. **Checkpoint rendering** — `K` zones are green like `S`/`G`. Add a subtle flag or banner icon to distinguish them.
11. **Background** — pure black. Add a subtle grid or vignette to give the playfield depth without distracting.
12. **Level select menu** — functional but plain. Add hover effects, level name tooltips, a progress bar, and a "next unplayed" highlight.

**P2 — UX:**
13. **Death counter per level** — currently only total deaths in menu. Show per-level deaths in HUD.
14. **Best time per level** — currently only best deaths (medal). Track and show best clear time too.
15. **Pause menu** — currently only Escape → menu. Add a proper pause overlay with resume/restart/menu options.
16. **Level intro card** — brief "LVL 42 — Name" splash on level start (original has this).
17. **Speedrun timer** — currently per-level only. Add a total-run timer option for full-game speedruns.
18. **Audio** — currently only blips. Add a subtle ambient hum or a simple chiptune loop (WebAudio, no assets).

**P3 — content:**
19. **Levels 109/111** — fix autopilot or redesign so they verify.
20. **More levels** — 114 is good; 160+ is better. The APEX tier (121+) is currently empty.
21. **Level editor** — in-browser authoring → export level file. Would let the community (or future rounds) author levels without touching code.
22. **Daily challenge** — seeded random level or a curated daily level with a leaderboard (localStorage).

## 4. NEXT PHASE

The game is **feature-complete and verified** — it needs **polish, not more backend**. The next phase is:

1. **Game feel pass** — death/coin/goal feedback, movement juice, screen shake. The original's magic is how good it feels to die and retry instantly.
2. **Visual polish pass** — gradients, pulses, icons, background depth. The original is flat but charming; ours is flat and sterile.
3. **UX pass** — per-level stats, pause menu, level intro cards, speedrun timer.
4. **Content pass** — fix 109/111, fill APEX tier (121+), consider a level editor.

**Do NOT:** add more mechanics (movers/keys/doors/teleports are enough), add dependencies, or re-architect. The engine is solid; the game needs to *feel* better.

## 5. LESSONS LEARNED

**What worked:**
- **Data-driven levels** — one file per level, self-registering, trivially authorable. The swarm model (16 parallel lanes, each authoring one level) worked perfectly.
- **Validator + autopilot** — the deterministic completability proof caught dozens of bad levels before they shipped. The `--only` flag made iteration fast.
- **Mover mechanic** — solid sliding blocks that push/crush the player added a whole new hazard type without new map chars (declared as `movers[]` array).
- **Tier system** — 8 tiers (WARM-UP → APEX) gives the level select a satisfying progression arc.

**What failed:**
- **Autopilot vs movers** — the greedy bot can't plan around moving walls. It treats them as static hazards and gets stuck when a mover blocks a required path. Two levels (109, 111) are humanly possible but unverifiable by the current autopilot. Fix: either a mover-aware autopilot (predictive pathing around moving blocks) or a level design that gives the bot a readable window.
- **Ragged maps** — several lanes submitted maps with inconsistent row lengths. The validator catches this, but it wasted a round-trip. Fix: the level template should include a row-length check in the authoring instructions.
- **3-digit IDs** — the filename regex only allowed 2 digits; fixed mid-round but caused a lane failure.

**Gotchas:**
- **Mover sweep validation** — the validator samples the whole swept path; a mover whose path touches a wall or S/K zone fails. Design movers on open floor with ≥2 free tiles beside the lane.
- **Autopilot budget** — 120s/400 deaths. A level that's technically possible but requires >120s of bot time fails. Keep levels tight.
- **Phase offsets** — movers with `phase: 0.5` start halfway through their cycle; use this to create counter-phase pairs.
- **Teleport pairing** — pads pair in scan order (row-major): 1↔2, 3↔4, etc. An odd count fails validation.
- **Key/door reachability** — every `y` must be reachable without passing a `D`. The validator checks this with doors closed.

**Drift risks:**
- **Level quality** — the swarm produces functional levels but they can feel samey. A human pass to add variety (unique layouts, themed names, difficulty spikes) would help.
- **Autopilot staleness** — if the engine changes, re-run `node hardest/validate.mjs` to re-verify all levels. The autopilot is deterministic; a pass today is a pass forever (same engine).
- **Manifest/pars staleness** — after adding/removing levels, re-run `node hardest/gen-manifest.mjs` and `node hardest/gen-pars.mjs`. The manifest is generated; pars are generated from autopilot times.

**Things K3 must not redo:**
- Don't add dependencies — the game is dependency-free by design.
- Don't re-architect the engine — it's solid, tested, and Node-compatible.
- Don't add more mechanics — movers/keys/doors/teleports are enough. Focus on feel.
- Don't weaken the validator — it's the quality gate. If a level fails, fix the level, not the check.
- Don't skip the autopilot — a level that isn't autopilot-verified isn't proven completable.

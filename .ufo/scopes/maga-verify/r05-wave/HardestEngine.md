# r05 — HardestEngine (static reconstruction + adversarial review of hardest/)

Lane: HardestEngine · revenger · STATIC-ONLY (read-only `node` probes for evidence; no browser, no source edits)

## Verdict

**STATIC-ONLY — PARTIAL.** Core engine contracts (240 Hz fixed step, coin→goal arming, teleport edge-trigger,
door persistence, checkpoint/respawn, medal/save schema) reconstructed and verified against current bytes;
full corpus validator passes **98/98**. One HIGH defect found: **manifest.js is stale — the browser build
silently ships without levels 97/98** (validator reads the directory, the game reads the manifest; the two
views diverge). Plus robustness gaps (unvalidated `playerSpeed` enables wall tunneling ≥7680 px/s; save
poisoning soft-lock) and an autopilot evidence-gap (per-substep inputs the shipping input path cannot reproduce).

Tree state: `git status` shows 6 modified files (engine.js, autopilot.js, validate.mjs, game.js, README.md,
LEVEL-FORMAT.md) + 2 untracked levels (97, 98) — the movers feature landed **during this wave**; engine.js,
autopilot.js and game.js each changed under me mid-read. All findings below cite re-read current bytes.

## Reconstruction (verified in code)

| Contract | Where | Verified model |
|---|---|---|
| Fixed step | `engine.js:16` `STEP = 1/240`; `game.js:326-327` accumulator `while (acc >= E.STEP)` with frame dt clamped to 0.1 s | 240 Hz claim TRUE; per-step player travel = speed/240 ≈ 0.73 px @175 |
| Collision | `solid()` `engine.js:103-107` (OOB = wall; `D` solid until `doorsOpen`); `moveResolve` `engine.js:124-154` axis-separated AABB clamp with `EPS=0.001`; dots/coins circle-vs-rect `engine.js:183-188` (strict `< r²`) | player 20×20 px in 32 px tiles; coins/keys pickup radius `r+2` = 8 px; dots kill radius 6 px default |
| Coin→goal arming | zone check `engine.js:~270-275`: on `G` with `coinsLeft === 0` → `clear` | No off-by-one found. `coinsLeft` decrements once per coin via `taken` flag; zone check runs before coin pickup in the same step, so a same-step last-coin+goal only delays clear by one step (player still standing on `G`) |
| Keys/doors | `engine.js:~291-297`: last key → `P.doorsOpen = true`; doors never re-close; state persists across deaths **within a run**; `create()` re-parses per run (`engine.js:192-216`) so no cross-run leak | Verified: no door-state persistence bug |
| Teleports | `engine.js:299-308`: center-tile edge-trigger; `onPad` stores destination index (`idx^1` pairing) so re-entry on the arrival pad does not re-fire; reset on death (`engine.js:~153`) and on leaving pad | No teleport loop exists (see probe P3) |
| Checkpoints | `engine.js:~265-271`: center on `S`/`K` re-arms respawn to that tile; death = 0.25 s (`DEAD_TIME`, `engine.js:21`); global clock `t` keeps advancing while dead (dots keep patrolling — deliberate) | No spawn-protection; see D-47 |
| Medals | `game.js:40`: 0 deaths gold, ≤2 silver, else bronze; `game.js:42` tiers by id ≤10 WARM-UP … >60 INHUMAN | level field `tier:` (e.g. 92-keymaster-iii) is decorative — `tierOf()` uses id only |
| Save schema | `game.js:15-18`: `hardest.save.v1` = `{unlocked:1, best:{}, deaths:0, mute:false}`; unlock by **menu index** `min(LEVELS.length, levelIdx+2)` (`game.js:345`); best per id `{deaths,time,medal}`, ties break on time (`game.js:346-347`) | works for contiguous ids 1..98; no type validation — see D-45 |
| Movers (new) | `engine.js:84-90` `level.movers[]` w×h∈1-4 tiles on waypoint paths; `engine.js:241-265` push/eject, `rectHitsWall` after eject = crush; rendered `game.js:194-203`; validated sweep ≠ `#`/`S`/`K` `validate.mjs:94-122`; autopilot treats as solid hazards `autopilot.js:126-130` | feature complete in logic + render + docs (LEVEL-FORMAT.md/README updated mid-wave); NOT in manifest — see D-41 |

## Evidence

1. **Corpus validator (read-only run):** `node hardest/validate.mjs` → `98/98 levels pass` (35.1 s), every level
   cleared by autopilot with **0 deaths** including `97-moving-walls.js` and `98-crush-alley.js`.
2. **Manifest divergence (probe3):** manifest entries = **96**, level files = **98**;
   `97-moving-walls.js` / `98-crush-alley.js` absent from both `manifest.js` and `index.html`;
   `index.html:14-19` injects level scripts **only** from `HARDEST_MANIFEST` → browser loads exactly 96 levels;
   `levelsReady()` (`game.js:48-51`) passes at 96/96, so the game boots silently without them.
3. **Player tunneling (probe P1):** level `#S#G#` with `playerSpeed: 8000` → after 240 steps `status = 'clear'`,
   `x = 108.0` — player embedded in and through the col-2 wall (threshold: per-step displacement > TILE ⇒
   speed > 32 px × 240 Hz = 7680 px/s; corpus max override is 185, corpus max patrol speed 280 — latent only).
4. **Dot tunneling — NOT reproduced (probe4):** dot speeds 8000/24000/50000/100000 px/s × 4 phases each:
   deaths = 4/4/4/4. The pingpong fold `d = period - d` (`engine.js:166-168`) keeps discrete samples landing
   in the hit window; discrete dot tunneling is not reachable in practice.
5. **Teleport loop — NOT reproduced (probe P3):** adjacent pads (`#STTG..#`) walked for 5 s → `teleports = 1`,
   no ping-pong; edge-trigger sound. Corpus has adjacent pairs in `94-warp-hell.js` `(15,9)~(15,10)`,
   `(15,13)~(15,14)` — handled by the same `onPad` logic.
6. **Pad-on-dot-waypoint hazards (probe5):** `80-eighty.js` pad(18,15) = patrol11 waypoint;
   `94-warp-hell.js` pad(12,2) = patrol0 waypoint — a dot turns around/parks on the arrival pad; arrival can
   coincide with the dot. Both levels autopilot-clear with 0 deaths, so timing windows exist; flagged as
   design hazard, not a defect.

## Defects

- **D-41 (HIGH) — manifest.js stale: browser build silently drops levels 97/98.** `gen-manifest.mjs` was not
  run after the two new level files landed (`?? hardest/levels/97-moving-walls.js`, `98-crush-alley.js` untracked;
  manifest.js untouched in git). The validator enumerates `levels/` directly (98 files, all pass) while the game
  boots from the 96-entry manifest — the corpus view and the shipped view diverge with no error. Fix: run
  `node hardest/gen-manifest.mjs`; add a CI/validator check `manifest count == directory count`.
- **D-42 (LOW-MED, latent) — unvalidated `playerSpeed` enables wall tunneling.** `validate.mjs` checks patrol
  `speed > 0` and `r ≤ 20` but never bounds `level.playerSpeed`; `moveResolve` checks only the single leading
  tile column per axis (`engine.js:126-134`), so per-step displacement > 32 px tunnels through walls
  (reproduced at 8000 px/s, evidence #3). No corpus level is near the threshold; bound it in the validator
  (e.g. ≤ 600) or make `moveResolve` sweep intermediate columns.
- **D-43 (MED, verify-gap) — autopilot "hard evidence" overstates input realism.** The autopilot re-decides
  direction every 1/240 s substep (`autopilot.js:143-176`), but the shipping loop samples input **once per
  frame** and applies it to every substep in that frame (`game.js:326-327`). Any clear that relies on input
  changes inside a 16.7 ms frame is unreproducible by a human or by the browser input path. Clears remain
  engine-legal, but "hard evidence the level is beatable" should be qualified, or the autopilot restricted to
  per-frame input changes.
- **D-44 (LOW) — autopilot candidate-sim diverges from engine semantics.** `evalMove` (`autopilot.js:113-135`)
  samples dot/mover collision every 4th substep (`CHECK_EVERY = 4`, `autopilot.js:15`) vs the engine's every-step
  check, calls `moveResolve` directly without mover rects (`autopilot.js:118`) and without teleport/zone/pickup
  semantics, and `los()` (`autopilot.js:74-81`) omits mover rects. All divergences only inflate deaths / cause
  false `no-path`/`death-budget` FAILs (conservative direction — a `clear` still goes through the real
  `E.step`), but they waste validation budget and can reject beatable levels.
- **D-45 (LOW, robustness) — save poisoning soft-lock / crash.** `loadSave` (`game.js:15-18`) merges parsed JSON
  over defaults with no type checks: `unlocked: "abc"` or `null` makes `sel < save.unlocked` always false
  (menu permanently locked, no reset key); `unlocked > LEVELS.length` allows `startLevel` out of bounds →
  `E.create(undefined)` throws uncaught; a non-object `best` throws on `save.best[L.id] = …` under `'use strict'`.
  Only reachable via crafted localStorage, but there is no recovery path.
- **D-46 (INFO) — comment/constant mismatch.** `engine.js:21` says "≤200ms feel @60fps"; `DEAD_TIME = 0.25` (250 ms).
- **D-47 (INFO, design) — no spawn-protection and no validator check for dots sweeping `S`/`K` tiles.** The mover
  sweep check guards `S`/`K` (`validate.mjs:108-109`) but the equivalent patrol-dot spawn-camp check is only the
  prose design contract; a death at respawn is instant if a dot phase crosses the checkpoint (0.25 s dead time
  then immediate re-check, `engine.js:314-318`). Corpus is clean today (all autopilot clears with 0 deaths).

## Notes

- Adversarial hunts that came back **clean** (worth recording so later lanes don't re-litigate): goal-arming
  off-by-one; teleport loops (incl. adjacent pads, `94-warp-hell.js`); discrete dot tunneling to 100 k px/s;
  cross-run door/coin/key state leaks (`create()` re-parses); crush-ejection wall embedding (eject then
  `rectHitsWall` catches, `engine.js:257-262`).
- Concurrent-edit hazard: this tree is hot (6 modified + 2 untracked files; engine/autopilot/game.js each
  changed mid-read within this lane's window — the mover feature was completed by other lanes during the wave).
  Line numbers above are from final re-reads; any sibling editing after ~this lane's close should re-verify.
- IRC: acknowledged wave discipline from Main/HardestBoot (unique browser tab names). This lane used no browser;
  all evidence is command output quoted inline. No contamination risk from or to this lane.
- Not browser-verified by design (assignment: static). D-41's user-visible impact (menu shows 96 tiles) is
  statically certain from index.html's manifest-driven loader + levelsReady gate, but a live :5179-ish check
  was out of scope (hardest has no dev server in the listed set — file:// only).

# Prototype card — The Impossible Game (mechanics proof)

**File:** `prototypes/impossible-game.html` — single file, zero deps, opens via `file://`.
**Spec:** `01-design-docs/02-concept-specs/02-impossible-game.md` · **Dossier:** `05-dossiers/impossible-game.md`
**Status:** verified in headless Chromium 2026-09-22 — **full level cleared end-to-end via real keyboard input events** (no state injection). R6: title screen + practice checkpoints + input-offset calibration added and verified.

## What the spec demands (cited)

- Core loop: "Cube auto-runs; single input = jump… die → full restart" (spec §Core loop 2–3).
- Controls: "Jump: Space / Up / Z / Left click… Restart: R… Pause: Esc" (spec §Controls).
- Feel: "Jump timing must feel *exact* — no mushy variable height" (spec §Feel targets).
- Acceptance: "Death → respawn at start in ≤200ms feel"; "no random tunneling"; "no softlock if holding jump at spawn" (spec §Acceptance 2,3,7).
- Renderer lock: Canvas2D (spec §Meta; `03-stack-and-tickets/001-native-stack-and-plan.md` §1).

## What the prototype proves (all via dispatched `KeyboardEvent`s through the game's own listener)

| Mechanic | Evidence |
|---|---|
| Auto-run + single-input jump | Cube advances at fixed 360px/s; Space/Up/Z/click/tap all trigger one fixed-impulse jump (no variable height). |
| **End-to-end clear** | Autoplayer dispatched 32 timed `Space` keydowns across a 27.4s run → `state:'clear'` at x=9900/9900. All 17 hazards (5 gaps, 9 spikes, 4 blocks incl. land-on-top sequences) traversed by real jumps. R6 re-proven: in-page driver dispatching real `keydown` at computed press points → `state:'clear'` at x=9902, attempt 2, 17 presses. |
| Gap death | No-jump run → `dead` at x=1410 (inside gap 1400–1530). |
| Spike death | Gap-only run → `dead` at x=1890 (front edge entered spike@1900 kill band). |
| Block-side death | Gap+spikes run → `dead` at x=2967 (front edge hit block@3000 side). |
| Death → instant restart | Respawn latency **161ms** ≤ 200ms spec; attempt counter increments, deaths tracked. |
| Fail-fast loop | 6 attempts observed across verification without intervention — "one more try" loop self-sustains. |
| No spawn softlock | Jump pressed at spawn: cube jumps, lands, keeps running (spec #7). |
| Fixed timestep | 120Hz accumulator; consistent collision (no tunneling at 360px/s). |
| Practice checkpoints | spec §Core loop 4 "include if cheap": 4 flags (x=2600/4800/6600/8400); practice ON → death past flag respawns at flag (verified: died past 2600 → respawn x=2603, `lastCp` tracked); practice OFF → respawn at start. |
| Input-offset calibration | spec §Mobile mitigation: `inputOffsetMs` (0–200, persisted `ig_proto_offset`) delays effective jump press; title −/+ buttons + Minus/Equal keys. Verified: offset 30ms applied, persisted across reload. |
| Title screen | START / PRACTICE toggle / offset −/+ canvas buttons; Enter/Space/P/−/+ keys. |

## Bug found by verification (fixed)

- **Gap lethality:** initial build let the cube fall into a 130px gap, cross it while still falling, and snap back onto ground past it — gaps were not lethal. Fixed: death when cube bottom passes `GROUND_Y + 8` while over a gap. Re-verified: no-jump run now dies at x=1410.
- **Block-side hitbox:** side check used cube's *left* edge, allowing ~34px visible penetration before death. Fixed to front edge (`cube.x + CUBE`).

## What it deliberately omits (spec-deferred or out of core loop)

- **Music-locked timing** — spec's highest audio priority; needs `AudioSyncClock` + a licensed/original track. Prototype has no audio.
- **Practice-mode checkpoints** — spec: "include if cheap; else defer" → **implemented R6** (4 flags, respawn-at-flag).
- **Medals, level select, 5-level campaign, level editor** — spec §Deferred.
- **Lite-faithful geometry** — dossier gap: exact Lite level layout unknown; prototype uses an original obstacle sequence exercising the same vocabulary.
- **Mobile calibration / input-offset UI** — spec flags touch latency as high risk → **implemented R6** (tap→jump on press + persisted input-offset calibration 0–200ms). Remaining: no audio to sync against.
- **Death frame-count parity** — dossier gap (frames to respawn unknown); 160ms chosen as declared guess.

## Recommended monorepo carry-forward (for `apps/impossible`, Canvas2D + arcade-core)

1. **Fixed timestep 120Hz accumulator** — keep; timing fidelity is the product.
2. **Level-as-data array** `[type, x, w, h]` — keep; lets ARCADE encode measured Lite geometry without touching engine code.
3. **Jump model:** fixed impulse + `JUMP_BUFFER` (0.10s) + `COYOTE` (0.06s) — keep the *mechanism*, retune constants against ARCADE playtest (dossier marks both TBD).
4. **Collision lessons (verified here):** test the cube's **front** edge for side hits, and kill on `floor === -Infinity && bottom > ground + margin` — a width-only gap test lets the cube survive narrow gaps.
5. **Entities to build:** `Runner`, `Spike`, `Block`, `Gap`, `LevelTrack`, `AudioSyncClock` (spec §Notes for FORGE) — prototype covers first four; `AudioSyncClock` is the real remaining risk.
6. **Respawn:** keep ≤160ms internal target to land ≤200ms perceived.
7. **Do not** add variable jump height, double jump, or coyote beyond measured original — spec demands exact feel.
8. **Verification pattern:** a `window.__proto` read-only state hook + an input-event autoplayer proves end-to-end clears without touching game state — worth keeping in the monorepo test harness.
9. **Practice checkpoints = respawn-address table** — `CHECKPOINTS[]` + `lastCp` + `reset(spawnX)`; the mechanism is trivial once respawn takes an x parameter. Spec's "if cheap" is cheap.
10. **Input-offset calibration = press timestamp + delayed consume** — `jumpAt` recorded on press, consumed when `now - jumpAt >= offset` inside the buffer window. Persist the offset; expose it on a settings row, not a hidden flag.

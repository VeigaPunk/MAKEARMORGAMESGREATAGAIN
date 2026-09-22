# Prototype card — The Impossible Game (mechanics proof)

**File:** `prototypes/impossible-game.html` — single file, zero deps, opens via `file://`.
**Spec:** `01-design-docs/02-concept-specs/02-impossible-game.md` · **Dossier:** `05-dossiers/impossible-game.md`
**Status:** verified in headless Chromium 2026-09-22 (rendered, jumped, died, respawned, cleared).

## What the spec demands (cited)

- Core loop: "Cube auto-runs; single input = jump… die → full restart" (spec §Core loop 2–3).
- Controls: "Jump: Space / Up / Z / Left click… Restart: R… Pause: Esc" (spec §Controls).
- Feel: "Jump timing must feel *exact* — no mushy variable height" (spec §Feel targets).
- Acceptance: "Death → respawn at start in ≤200ms feel"; "no random tunneling"; "no softlock if holding jump at spawn" (spec §Acceptance 2,3,7).
- Renderer lock: Canvas2D (spec §Meta; `03-stack-and-tickets/001-native-stack-and-plan.md` §1).

## What the prototype proves

| Mechanic | Evidence |
|---|---|
| Auto-run + single-input jump | Cube advances at fixed 360px/s; Space/Up/Z/click/tap all trigger one fixed-impulse jump (no variable height). |
| Death → instant restart | Measured respawn latency **161ms** ≤ 200ms spec; attempt counter increments, deaths tracked. |
| Fail-fast loop | 10 unattended deaths→respawns observed without intervention — the "one more try" loop is self-sustaining. |
| Hazard vocabulary | Spikes (triangle kill), blocks (land-on-top / side-hit kills), gaps (fall kills) — the three spec obstacle types. |
| Level clear | Reaching `LEVEL_END` → `clear` state + banner; R restarts. |
| No spawn softlock | Jump pressed at spawn: cube jumps, lands, keeps running (spec #7). |
| Fixed timestep | 120Hz accumulator; consistent collision (no tunneling observed at 360px/s). |

## What it deliberately omits (spec-deferred or out of core loop)

- **Music-locked timing** — spec's highest audio priority; needs `AudioSyncClock` + a licensed/original track. Prototype has no audio.
- **Practice-mode checkpoints** — spec: "include if cheap; else defer" → deferred.
- **Medals, level select, 5-level campaign, level editor** — spec §Deferred.
- **Lite-faithful geometry** — dossier gap: exact Lite level layout unknown; prototype uses an original obstacle sequence exercising the same vocabulary.
- **Mobile calibration / input-offset UI** — spec flags touch latency as high risk; prototype maps tap→jump but does not calibrate.
- **Death frame-count parity** — dossier gap (frames to respawn unknown); 160ms chosen as declared guess.

## Recommended monorepo carry-forward (for `apps/impossible`, Canvas2D + arcade-core)

1. **Fixed timestep 120Hz accumulator** — keep; timing fidelity is the product.
2. **Level-as-data array** `[type, x, w, h]` — keep; lets ARCADE encode measured Lite geometry without touching engine code.
3. **Jump model:** fixed impulse + `JUMP_BUFFER` (0.10s) + `COYOTE` (0.06s) — keep the *mechanism*, retune constants against ARCADE playtest (dossier marks both TBD).
4. **Collision:** point-sample floor + spike band + block-side tests — adequate at this speed; if SPEED rises, add swept sub-stepping (spec: no tunneling).
5. **Entities to build:** `Runner`, `Spike`, `Block`, `Gap`, `LevelTrack`, `AudioSyncClock` (spec §Notes for FORGE) — prototype covers first four; `AudioSyncClock` is the real remaining risk.
6. **Respawn:** keep ≤160ms internal target to land ≤200ms perceived.
7. **Do not** add variable jump height, double jump, or coyote beyond measured original — spec demands exact feel.

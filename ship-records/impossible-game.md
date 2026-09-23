# Ship record — The Impossible Game (remake)

Original reference: The Impossible Game — one-button rhythm autorunner,
instant respawn, fixed-impulse jump. Feel reference: 2010 Lite release;
content target: the full game, not the Lite slice. Player-facing branding
must be an original evocation.

Status: **NOT SHIPPED** — survey complete, rendition EXTEND in progress.
Last updated: 2026-09-23 (verification wave sr1, verification-only lane).

## Survey — implementations found

1. `prototypes/impossible-game.html` (637 lines, zero-dep, file://) —
   verified mechanics proof: 360px/s auto-run, fixed-impulse jump, 120Hz
   accumulator, jump buffer 0.10s + coyote 0.06s, level-as-data
   `[type,x,w,h]`, 4 practice checkpoints, input-offset calibration 0–200ms
   persisted (`ig_proto_offset`), title screen, r1 art (parallax, particles,
   death marks, abyss pits). Full clear x=9900 proven in the proto; respawn
   161ms. Read-only `__proto` getter hook.
2. `MAGA-everything/02-code/armor-games/apps/impossible` (295 LOC, Canvas2D)
   — one-level slice ported from the proto: LEVEL data, LEVEL_END 9900, jump
   buffer/coyote, particles, death/retry. No README; no checkpoints,
   calibration, or practice mode.

Docs: concept spec `02-impossible-game.md` (Lite-faithful slice floor: 1–2
levels, single-input jump, full-restart deaths; music↔obstacle sync is the
load-bearing requirement — `AudioSyncClock` entity), dossier skeleton,
build card `09-build-cards/`.

## Decision: EXTEND `apps/impossible`; proto is the mechanics contract

Stack lock assigns this title to the monorepo (Canvas2D). The app was ported
from the proto; the proto is verified and the app is not yet proven
end-to-end. Plan: port the proto's practice checkpoints, input-offset
calibration, and `__proto` hook discipline into the app; then grow content
toward full-game scope (more than the Lite slice) and land AudioSyncClock.

## Known defects / unproven fronts

- FIXED, re-confirmed at sr1 (D-33/D-34): floor-absence gap kill at **x=1410**
  and block front-edge side-kill at **x=2967**, both with real key events,
  coordinates read from `__maga` — PASS (`verification/evidence/sr1-impossible-run.log`).
- **PROVEN at sr1 (was the r05 gap): full clear x=9900 on the app** with real
  input. Closed-loop CDP driver replayed a 17-jump schedule (derived offline
  from the LEVEL array + constants, `sr1-impossible-thresholds.json`) as real
  `Input.dispatchKeyEvent` Space presses; state=clear, 0 deaths in the clear
  attempt, best=100%. Reproduced 2/2 independent runs.
- PROVEN at sr1: best-progress persistence — `maga:impossible:best-progress`
  survives an in-session reload (14.24% after a death, reloaded, value intact).
- OPEN: D-35 (NOTE, sub-frame taps dropped — not re-examined at sr1),
  D-60/D-61 (INFO).
- UNPROVEN (presentation/content, not mechanics): title screen & menus (app
  boots straight into the run), practice mode + checkpoints + input-offset
  calibration (proto has them, app does not), touch-tap jump (Input pointer
  path exists in code; not explicitly re-driven at sr1).
- UNPROVEN RISK (flagship): `AudioSyncClock` — music-synchronized obstacle
  timing; app has only jump/death/clear `Sfx` blips + a mute toggle, no music
  track exists anywhere in the repo yet.
- OBSERVATION (not a defect, proto-faithful): the spike at x=5650 sits on
  block 5600 but is drawn at ground level (partially inside the block front)
  and its hitbox (`cy > GROUND_Y-26`, `main.ts:139-146`) only triggers at
  ground level, so it is harmless when standing on the block. Identical LEVEL
  data + `spikeAt` in the verified proto (`prototypes/impossible-game.html:41,124-132`);
  1:1 port, no regression.

## Placeholders to resolve before ship

`apps/impossible/src/main.ts:12-30` — hitbox, buffer, geometry constants all
"TBD". Proto constants are declared guesses (`prototypes/impossible-game.html:
19,24`). Tune and record rationale; verify by full-clear autopilot-style run
with real input events.

## Verification

Recorded commands (last observed results):
- Proto: headless chromium on `file://prototypes/impossible-game.html`, real
  key events, `tab.evaluate` reading `__proto` — PASS (2026-09-22, r1 art
  commit `2d30570`, zero console errors).
- App: `npm run dev:impossible` (port 5174) + CDP probes — deaths at
  x=1410/x=2967 re-confirmed r05; full clear NOT proven (r05).
- **sr1 (2026-09-23), zero-dep Node CDP driver `verification/evidence/sr1-cdp.mjs`
  + `sr1-impossible-run.mjs`** (`npm run dev:impossible` on 5174,
  `/usr/bin/chromium --headless=new`, fresh `--user-data-dir`, real
  `Input.dispatchKeyEvent`; `__maga` read-only):
  - `node verification/evidence/sr1-impossible-run.mjs --sentinels` —
    SENTINEL A gap death **x=1410.0** PASS, SENTINEL B block front-edge death
    **x=2967.0** PASS; screenshots `sr1-impossible-sentinel-{gap,block}.png`.
  - `node verification/evidence/sr1-impossible-run.mjs --clear` — **FULL CLEAR
    PASS**, state=clear at x=9900, 0 deaths in the attempt, best=100%,
    17 real Space presses on a closed-loop schedule; screenshot
    `sr1-impossible-clear.png`; log `sr1-impossible-run.log`. Reproduced 2/2.
  - Persistence probe (same driver, in-session `Page.reload`) —
    `maga:impossible:best-progress` retained after reload; PASS.
  - Console errors: 0 app-originated (only the browser's automatic
    `/favicon.ico` 404). Evidence: `sr1-impossible-*.{log,png,json,mjs}`.

Ship-gate checklist: pending (per-game acceptance to be assembled from spec
02 + mission bar: menus/HUD/pause/settings/touch/persistence/audio/content).

## Deferrals

None declared yet.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/`, `prototypes/`, plus my own knowledge of
the original game. Network use: none beyond a single `npm ping` probe. No
web/GitHub searches about this project, no forks/copies, no third-party
remakes of the original were consulted.

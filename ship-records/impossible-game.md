# Ship record — The Impossible Game (remake)

Original reference: The Impossible Game — one-button rhythm autorunner,
instant respawn, fixed-impulse jump. Feel reference: 2010 Lite release;
content target: the full game, not the Lite slice. Player-facing branding
must be an original evocation.

Status: **NOT SHIPPED** — survey complete, rendition EXTEND in progress.
Last updated: 2026-09-22 (ship-run 2026-09-22).

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

- FIXED, must stay fixed (D-33/34): front-edge side-kill and
  floor-absence+depth-margin gap kill — death coordinates x=1410 and x=2967
  are the regression sentinels (27/27 deaths reproduced at r05).
- OPEN: D-35 (NOTE), D-60/D-61 (INFO; D-60: `__proto` hook readability).
- UNPROVEN: full clear x=9900 **on the app** (segment-verified only).
- UNPROVEN RISK (flagship): `AudioSyncClock` — music-synchronized obstacle
  timing; zero audio exists anywhere in the repo yet.

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
  x=1410/x=2967 re-confirmed r05; full clear NOT proven.

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

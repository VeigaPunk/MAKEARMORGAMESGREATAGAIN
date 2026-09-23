# Ship record — The Impossible Game (remake)

Original reference: The Impossible Game — one-button rhythm autorunner,
instant respawn, fixed-impulse jump. Feel reference: 2010 Lite release;
content target: the full game, not the Lite slice. Player-facing branding
is an original evocation: **Impossible Run** (hub card name; in-game title;
page title).

Status: **SHIP-CANDIDATE** — sr2 wave complete (features home, audio+sync,
flow, r1 art, real-input verification on the final build).
Last updated: 2026-09-23 (verification wave sr2).

## Survey — implementations found

1. `prototypes/impossible-game.html` (637 lines, zero-dep, file://) —
   verified mechanics proof: 360px/s auto-run, fixed-impulse jump, 120Hz
   accumulator, jump buffer 0.10s + coyote 0.06s, level-as-data
   `[type,x,w,h]`, 4 practice checkpoints, input-offset calibration 0–200ms
   persisted (`ig_proto_offset`), title screen, r1 art (parallax, particles,
   death marks, abyss pits). Full clear x=9900 proven in the proto; respawn
   161ms. Read-only `__proto` getter hook. **Mechanics contract — unchanged.**
2. `MAGA-everything/02-code/armor-games/apps/impossible` (**the shipped
   rendition**, Canvas2D, ~940 LOC dense `main.ts`) — grew from the sr1
   one-level slice to the full ship candidate: title screen with
   play/practice/calibration/settings, practice checkpoints, calibration,
   settings (music/SFX volume + mute, persisted), pause menu, clear screen,
   135 BPM music bed + full SFX, r1 art layer, touch tap-to-jump.

Docs: concept spec `02-impossible-game.md` (Lite-faithful slice floor;
music↔obstacle sync is the load-bearing requirement — `AudioSyncClock`),
dossier skeleton, build card `09-build-cards/`.

## Decision: EXTEND `apps/impossible`; proto is the mechanics contract

Stack lock assigns this title to the monorepo (Canvas2D). The app was ported
from the proto; sr1 proved its mechanics end-to-end with real input; sr2
(this wave) ported the remaining presentation/flow fronts and re-proved
everything against the final build. Architecture unchanged: single dense
`main.ts`, `?debug` → `__maga` (+ `__proto` getter object).

## Rights sweep (sr2)

- Page `<title>`: ~~"The Impossible Game — MAGA native replica"~~ →
  **"Impossible Run — MAGA native replica"** (`apps/impossible/index.html`).
- In-game title screen: **IMPOSSIBLE RUN** (heavy stencil, orange/ink) —
  original evocation, no original logo/characters/art.
- HUD footer: "… — IMPOSSIBLE RUN".
- Code comments/records reference the original by name (allowed per mission).
- INTERNAL-NO-PUBLIC badge retained (fleet convention; documents the Fluke
  Games clearance posture, same pattern as boxhead/burger badges).
- Grep over app + built copy: no original-mark residue player-facing.

## Features ported home (sr2)

- **Title screen** (proto parity + evocation name): attract strip (clock-driven
  cube hopping spikes), parallax backdrop, BEST %, chips: PLAY / PRACTICE /
  CALIBRATION / SETTINGS. ENTER/Space = play; every screen has Esc/◀ BACK.
- **Practice mode**: proto's 4 checkpoints (2600/4800/6600/8400) as a
  start-from-flag select; death respawns at last passed flag; flags drawn
  in-run (claimed = green aura); **best-progress never recorded in practice**
  (verified). R restarts the practice segment (start-of-segment, declared
  deviation from proto's back-to-0 for chosen-flag starts).
- **Input-offset calibration** (spec §Mobile mitigation): 0–200ms in 10ms
  steps, −/+ chips or ArrowLeft/Right (Minus/Equal mapped too), persisted
  `maga:impossible:input-offset`; delays the effective jump press inside the
  existing 100ms buffer window (proto-verbatim semantics; offset=0 is
  byte-identical to sr1-proven behavior).
- **Settings** (title + pause): music volume, SFX volume (0–100% in 10%
  steps), mute all — persisted `maga:impossible:settings`, applied to the
  frozen `Sfx` buses (musicBus/sfxVolume/musicVolume/muted). Page mute
  button retained and kept in sync.
- **Flow**: pause (Esc/P) freezes sim + music, pause menu (RESUME / RESTART /
  SETTINGS / QUIT); death → instant respawn (measured 166–167ms ≤ 200ms
  budget) with attempts counter; level-clear screen (BEST %, attempts,
  deaths; RUN AGAIN / TITLE); no softlock state (every state has an exit).
- **Touch**: tap-to-jump on press (whole playfield), tap works on all title
  chips. **D-35 FIXED**: pointer presses are now queued from a DOM
  `pointerdown` listener instead of frame-edge polling — sub-frame taps
  (synthetic or real) are no longer dropped.
- **Art (r1 home)**: proto render layer ported 1:1 — paper gradient + grain +
  vignette, 3-layer parallax (drifting strata + silhouette skyline), stippled
  ground with 2px highlight, true abyss pits (depth gradient + hazard-stripe
  walls + pit lips), shaded spikes, hatched/beveled blocks, finish glow +
  waving checkered pennant, checkpoint flags, squash/stretch cube with
  gradient + motion-ghost trail, landing dust, death burst fragments, fading
  X death mark at the kill spot, screen shake + red edge flash, banner band.
  All hand-authored Canvas2D, zero external assets.

## Audio + sync design (sr2)

Frozen `packages/arcade-core/src/sfx.ts` consumed as-is (music/sfx buses,
`startMusic` step sequencer, presets). Original synth recipes only (audio
doctrine: zero binary assets).

- **Music bed**: 16-step square-wave loop (A-minor bass stabs + offbeat
  accents), `Sfx.startMusic(steps, 111.11ms, {wave:'square', volume:0.3})`.
- **SFX**: jump blip (square 520→700Hz, 50ms), death zap (`preset('death')`
  saw 320→40Hz) + respawn tick (square 980→880Hz, 30ms), clear fanfare
  (4 rising triangle notes C5→C6), UI chip click (`preset('ui')`).
- **The sync math** (documented per mission): scroll is 360 px/s. The
  obstacle vocabulary's atomic spacing is 40 px (double/triple spikes).
  Setting a 16th note = 40 px gives beat = 160 px = 160/360 s = 444.4ms →
  **135 BPM**, step 111.11ms. Every attempt starts at x=0 with the track at
  step 0, so attempt-time ↔ scroll-position ↔ step share one origin; spike
  clusters land on consecutive 16ths.
- **What "sync" means here (honest assessment)**: no licensed track exists
  (and none may be ripped), so the bed is an original rhythmic timing
  reference, not a hit-mapped rendition. The load-bearing property for this
  genre — *identical obstacle↔beat relationship on every attempt* — holds
  because the track restarts at beat 0 on every attempt/respawn (the
  original's own behavior). Drift: `startMusic` schedules via setInterval
  (frozen API), so step timing can jitter a few ms against the 120Hz sim
  clock; over the 27.5s level this stays far under one 16th (111ms) and no
  mid-attempt realignment is attempted. Pause stops the music and resume
  restarts at beat 0 (spec hook 5's permitted "documented reset"); tab
  hide/show likewise (stop / restart at beat 0). Music never starts before
  the first user gesture (autoplay-safe; no oscillator pile-up on a
  suspended AudioContext).
- Verification-readable: `__maga.sfx` exposes `voices`/`running`/volumes;
  sr2 asserts the bed schedules (voices>3, ctx running) after a real click.

## Constants — CONFIRMED (sr1 evidence; values untouched at sr2)

All physics/level constants are the sr1-proven set, re-annotated in
`main.ts:15-30` as confirmed (were "TBD" markers). No value changed at sr2;
the full-clear driver re-ran clean against the final build.

| Constant | Value | Evidence |
|---|---|---|
| DT (fixed step) | 1/120 s | sr1 full clear 2/2 + sr2 re-run PASS |
| SPEED | 360 px/s | full clear x=9900 (27.2s) |
| GRAV | 2600 px/s² | jump apex y 250.8 measured (sr2) |
| JUMP_V | 880 px/s | fixed impulse — no variable height |
| CUBE hitbox | 34 px | sentinel deaths exact (1410.0/2967.0) |
| JUMP_BUFFER | 0.10 s | full-clear threshold schedule hits ±few px |
| COYOTE | 0.06 s | idem |
| RESPAWN_MS | 160 s→ms | measured respawn 166–167ms (≤200 budget) |
| GROUND_Y / stage | 430 / 960×540 | proto parity |
| LEVEL data + LEVEL_END | 22 obstacles, x=9900 | 1:1 with proto; clear proven 3/3 total runs |

## Verification (all on this run, 2026-09-23, against the FINAL built copy)

Build: `npm run typecheck` (app) + `npm run build -w @maga/impossible`
(clean), staged to `games/impossible-game/` as a clean copy
(`build:fleet`-equivalent). Zero-dep Node CDP drivers,
`/usr/bin/chromium --headless=new`, fresh `--user-data-dir`, real
`Input.dispatchKeyEvent` / `Input.dispatchMouseEvent` /
`Input.dispatchTouchEvent`; hooks read-only.

- `python3 -m http.server 5174 --directory games/impossible-game`, then:
- `node verification/evidence/sr2-impossible-run.mjs` — **29/29 PASS**
  (log `sr2-impossible-run.log`): title boot, title→play by real chip click,
  music scheduling (voices 11, running), real-Space jump (y 396→250.8),
  pause freezes x exactly / resume advances, settings reachable from pause
  (open → back → pause menu → resume), death x=1410.0 + respawn
  166.5ms + attempt increment, pause→QUIT, practice select + FLAG 3 start
  (x≈6654, lastCp 6600) + death at 6888 + respawn at flag + best untouched,
  calibration 20ms set/persisted/reloaded/reset, settings 0.6/0.8/muted
  applied+persisted across reload+unmute, CDP touch on PLAY chip + tap jump
  (y→250.8), 0 console errors. PNGs: `sr2-impossible-{title,practice,
  calibration,settings}.png` (4 ≤ 5).
- `node verification/evidence/sr1-impossible-run.mjs --sentinels` —
  SENTINEL A **x=1410.0** PASS, SENTINEL B **x=2967.0** PASS, 0 console errors
  (log appended: `sr1-impossible-run.log`; PNGs regenerated).
- `node verification/evidence/sr1-impossible-run.mjs --clear` — **FULL CLEAR
  PASS**: state=clear at x=9900, 17 real Space presses closed-loop,
  attempt=2 deaths=0 best=100%, 0 console errors. (Third independent clear
  of the same constants; first two at sr1.)
- Hub: `python3 -m http.server 8123` from repo root +
  `node verification/evidence/sr2-hub-impossible-run.mjs` — **7/7 PASS**
  (log `sr2-hub-impossible-run.log`): hub card real click →
  `/games/impossible-game/` → boots to title → real-click PLAY + real-Space
  jump (y→250.8), 0 console errors, 0 non-local requests
  (PNG `sr2-hub-impossible-game.png`).
- Persistence (re-confirmed sr2): `maga:impossible:best-progress`,
  `:input-offset`, `:settings` all survive reload (checks inside the sr2
  driver).

## Ship-gate acceptance checklist

- [x] Faithful mechanics — constants 1:1 with verified proto; sentinels exact
- [x] Complete content for the Lite-faithful slice (spec's v1 promise; floor
      per dossier when memory uncertain) — full level x=9900, clearable
- [x] No placeholder constants — all confirmed (table above)
- [x] Authored art, coherent direction (r1 graded minimalism, Canvas2D only)
- [x] Audio: music + all cue families, self-contained, zero binary assets
- [x] Title, menus, HUD, pause, settings (volume/mute), game-over(clear),
      restart flows — every state has an exit
- [x] Keyboard/mouse + touch input (tap-on-press; D-35 fixed)
- [x] Persistence: best progress, calibration, settings
- [x] Instant respawn ≤200ms (measured 166–167ms)
- [x] Performance: trivial surface, pre-rendered static layers, integer scale
- [x] Real-input verification with in-repo evidence, zero new dependencies
- [x] Single rendition reachable from the root hub; 0 console errors;
      0 non-local requests

## Deferrals

- Medal criteria + level-unlock chain remain undeclared (spec §9 TBD
  ARCADE) — the clear screen reports BEST/ATTEMPTS/DEATHS instead of medals.
- Full five-level scope (Fire Aura, Original, Chaoz Fantasy, Heaven, Phazd)
  — spec explicitly defers; Lite-faithful slice is the v1 product promise.
- Sample-accurate track↔obstacle hit-map — impossible without the licensed
  track (rights); delivered the per-attempt-restart lock + 40px/16th grid
  instead (see sync honesty above).
- Physical-device mobile pass — touch is verified via CDP synthesized
  touchStart (desktop headless); per spec, mobile remains "playable
  best-effort", desktop canonical.
- D-60/D-61 (INFO, from prior audit) — not re-examined this wave; no
  observed impact.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/`, `prototypes/`, sibling ship records
(boxhead/burger sr2 patterns for drivers/settings conventions), plus my own
knowledge of the original game. No web/GitHub searches about this project,
no forks/copies, no third-party remakes of the original were consulted. No
network use beyond localhost verification servers. No git commit made
(run constraint); all changes are in the working tree.

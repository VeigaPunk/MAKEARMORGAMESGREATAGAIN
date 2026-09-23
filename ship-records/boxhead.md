# Ship record — Boxhead: 2Play Rooms (remake)

Original reference: Boxhead: 2Play Rooms (2007), top-down arena survival,
solo + local 2P co-op + deathmatch. Player-facing branding must be an original
evocation.

Status: **NOT SHIPPED** — survey complete, rendition EXTEND in progress.
Last updated: 2026-09-23 (sr1 verification wave: debug hook landed + B-N1/B-N2
re-probe with real input).

## Survey — implementations found

1. `MAGA-everything/02-code/armor-games/apps/boxhead` — Pixi 8 (external via
   vendored importmap), TS, 6 files / ~1,416 LOC. Most complete app: title /
   mode select / room select / playing / dead / victory states; solo + co-op +
   deathmatch; 2 rooms; waves 1–3; ammo crates + barrels with chain blasts;
   score/streak/weapon ladder; touch layout C; high-score persist
   (`maga:boxhead:highscore`); `?debug` hook. Signed acceptance B-N1 PASS and
   B-N2 8/8 PASS (r05). Two post-signoff fixes verified (player-death
   reachability, letterbox double-count ~130px).
2. `boxhead-2play-spike/` — referenced in README/.gitignore but deleted from
   the tree; retired by prior runs.
3. No `prototypes/` entry for boxhead (protos cover the other four titles).

Docs: concept spec `01-boxhead.md`, visual direction + native placeholder
recipes, sound bible + `boxhead-2play-recipes.json` (25 cues, provisional),
acceptance checklist `boxhead-playability-checklist.md` (gates B-N0…G3),
tickets BH-0…BH-3.5 (xref file authoritative; ticket header stale per DD-05).

## Decision: EXTEND

`apps/boxhead` is the deepest implementation with signed acceptance history
and the stack-locked architecture. Rationale for keeping: verification
register shows a working verify→forge loop on this app; replacement would
discard B-N1/B-N2 proof. Nothing shipped yet, but prior verified work
outranks taste. Recorded comparison baseline: B-N1/B-N2 verdicts in
`verification/runtime-verdicts/` + app docs.

## Known defects (from `verification/divergence.md`, r05 board)

- OPEN MED: D-16→D-58 — throttle-resume burst. NOT reproduced this run
  (headless BeginFrame does not throttle rAF like a backgrounded tab); code
  re-read: dt clamp 0.05 in place — remains OPEN per r05.
- OPEN LOW: D-55 **re-confirmed live** (pause banner says "M / ENTER — menu";
  Enter is bound to `fire`, does nothing in pause; M works). D-56 **re-confirmed
  live** (frozen world renders behind SELECT MODE after pause→M).
  D-57 **partial data**: pickup with 2 crates on field gave 2→1 after 400ms
  (timer still positive); the unclamped-negative instant-respawn branch needs
  13s+ parked at cap-2 — not reproduced live. D-18 **not reproduced** on
  current tree (showModeSelect clears banner — R04 fix 7e110e7 postdates the
  r05 regress screenshots).
- OPEN: D-05 (doc stage-size contradiction 640×400 vs 480), D-06 (stale
  ticket header), D-08 (F3 isolated-fps scenario; enabler landed, ~52fps
  lower bound @ ~100 movers), D-19 (resolved in code, ruling owed).
- FIXED (keep fixed): D-01–04, 09, 10, 12–15 (touch end-chips re-verified
  this run), 17, 20, 25 (DM crates re-verified, first crate 8.3s), 26 (ESC/P
  pause/resume re-verified in solo + co-op + DM).

## Placeholders to resolve before ship (51 marker lines; key ones)

`src/world.ts:56,73,104,113,118` (all combat tables placeholder; grenade
stub); `src/entities.ts:29,87`; `src/game.ts:23` (`DM_TARGET_KILLS` stub),
`game.ts:567,626` (`hp -= 10 // TBD`), `game.ts:738` (AoE no kill credit),
`game.ts:260` (placeholder music bed); `assets/MANIFEST.md` — all slots
PLACEHOLDER. Per design-pack rule these numbers were "TBD from ARCADE
playtest" with zero playthroughs recorded → this run must tune them itself
and record the tuning rationale.

## Verification

Recorded commands (last observed results):
- `cd MAGA-everything/02-code/armor-games && npm run dev:boxhead` (port 5173) — UP, 200 OK.
- `npm run typecheck -w @maga/boxhead` — PASS (clean).
- `npm run build -w @maga/boxhead` — PASS (dist JS 27.6 kB, pixi external via
  importmap, unchanged).
- **sr1 re-probe (2026-09-23):** zero-dep node-24 CDP driver
  (`Input.dispatchKeyEvent/MouseEvent/TouchEvent`; `/tmp/sr1-boxhead-run.mjs`,
  recreatable from `verification/evidence/sr1-boxhead-run.log` — not shipped in
  repo) against `/usr/bin/chromium --headless=new` on CDP 127.0.0.1:9777.
  Reads via `window.__maga.state` (the new hook). Canonical full-suite run
  37/39 green, 0 console errors/exceptions:
  - Solo: boot→title→mode→room→waves 1–3 victory 49s (score 15300);
    victory→Space retry; idle death→"OVERRUN"→Space retry; pause ESC/P +
    world-frozen + D-55 Enter-noop; localStorage `maga:boxhead:highscore`
    survives reload (15300).
  - Co-op: P1 WASD+Space / P2 arrows+KeyL simultaneous move+fire; P1 bullets
    inert vs P2 (hp 100→100).
  - Deathmatch: crates at 8.3s (D-25), P2 damages P1 (100→70), barrel AoE
    25 dmg with NO kill credit (stub game.ts:737-739 confirmed, unfixed per
    brief), P1 wins 5–0, rematch flow.
  - Touch (emulated): tap through menus, stick drag, FIRE hold, dead-screen
    tap retry + MENU chip (D-14 stays fixed), portrait letterbox.
  - Grenade AoE multi-kill: **UNPROVEN** — tier reached (mult x14, grenades
    equipped) in 5/13 solo runs; lob fired twice (one long-range miss, one
    point-blank stale-aim miss — both driver-side, fixed after); post-fix x14
    windows (1–4s) closed before a valid target formed. AoE kill-credit path
    (`detonate` → `scoreSys.kill()`, same code grenades use) verified via
    barrels (+500/+900 credited blast kills). Needs a human-grade streak run.
- Acceptance: B-N1 PASS; B-N2 8/8 PASS (`apps/boxhead/docs/`) — **re-proved
  on this run** (rows filled in `docs/PROOF-CHECKLIST.md`).
- Evidence: `verification/evidence/sr1-boxhead-run.log`,
  `sr1-boxhead-solo-wave3.png`, `sr1-boxhead-victory.png`,
  `sr1-boxhead-coop.png`, `sr1-boxhead-dm-end.png`, `sr1-boxhead-touch.png`.
- `scripts/bh2-2p-smoke.js` is referenced but **missing from the tree** —
  recreate or drop the reference.

Ship-gate checklist (acceptance A–G per design pack + mission bar): pending;
will be filled as items are proven on this run.

## Deferrals

- Grenade AoE multi-kill capture (mechanic reachable — tier hit 5×; needs a
  human-grade 13-streak run, see Verification).
- C1 ≥60s human phone run (touch smoke passed via CDP emulation; auto-aim
  path needs a real coarse-pointer device).
- D-58 live reproduction (needs a throttling browser environment).
- G suite matrix (Firefox / phone / tablet).

## Provenance declaration

Consulted: this working copy only — git history, `verification/` (divergence
register, runtime verdicts, evidence), `MAGA-everything/01-design-docs/`,
`MAGA-everything/02-code/`, plus my own knowledge of the original game.
Network use: none beyond a single `npm ping` registry-reachability probe.
No web/GitHub searches about this project, no forks/copies, no third-party
remakes of the original were consulted.

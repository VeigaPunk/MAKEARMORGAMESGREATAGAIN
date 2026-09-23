# Ship record — Boxhead: 2Play Rooms (remake)

Original reference: Boxhead: 2Play Rooms (2007), top-down arena survival,
solo + local 2P co-op + deathmatch. Player-facing branding must be an original
evocation.

Status: **NOT SHIPPED** — survey complete, rendition EXTEND in progress.
Last updated: 2026-09-22 (ship-run 2026-09-22).

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

- OPEN MED: D-16→D-58 — throttle-resume burst (visibilitychange
  catch-up spike).
- OPEN LOW: D-18 (banner bleed, re-confirmed), D-55/56/57 (minor).
- OPEN: D-05 (doc stage-size contradiction 640×400 vs 480), D-06 (stale
  ticket header), D-08 (F3 isolated-fps scenario; enabler landed, ~52fps
  lower bound @ ~100 movers), D-19 (resolved in code, ruling owed).
- FIXED (keep fixed): D-01–04, 09, 10, 12–15, 17, 20, 25 (DM crates),
  26 (pause ESC/P).

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
- `cd MAGA-everything/02-code/armor-games && npm install` then
  `npm run dev:boxhead` (port 5173) — last run r05, PASS.
- Headless chromium CDP probes against `http://localhost:5173/?debug`
  (boxhead lacks `window.__maga` — HUD-pixel reads only; closing that hook
  gap is a task).
- Acceptance: B-N1 PASS; B-N2 8/8 PASS (`apps/boxhead/docs/`).
- `scripts/bh2-2p-smoke.js` is referenced but **missing from the tree** —
  recreate or drop the reference.

Ship-gate checklist (acceptance A–G per design pack + mission bar): pending;
will be filled as items are proven on this run.

## Deferrals

None declared yet.

## Provenance declaration

Consulted: this working copy only — git history, `verification/` (divergence
register, runtime verdicts, evidence), `MAGA-everything/01-design-docs/`,
`MAGA-everything/02-code/`, plus my own knowledge of the original game.
Network use: none beyond a single `npm ping` registry-reachability probe.
No web/GitHub searches about this project, no forks/copies, no third-party
remakes of the original were consulted.

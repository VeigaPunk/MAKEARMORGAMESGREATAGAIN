# Ship record — Burger Tycoon (remake of Molleindustria's McDonald's Videogame)

Original reference: Burger Tycoon (Molleindustria's McDonald's Videogame,
~2006) — four-pane supply-chain management sim with a dirty-action economy.
Branding precedent: ship as "Burger Tycoon" twin, no McDonald's marks.

Status: **NOT SHIPPED** — survey complete, rendition EXTEND in progress.
Last updated: 2026-09-23 (verification wave sr1, verification-only lane).

## Survey — implementations found

1. `prototypes/burger-tycoon.html` (463 lines, zero-dep, file://) — verified
   PASS: single economy `S` + per-pane action tables, rates/sec tick with
   0.25s dt clamp, 3 dirty toggles, disease accumulator→outbreak,
   backlash→rep-drain→REPUTATION COLLAPSE, two fail conditions,
   board-pressure stall detector, sim runs idle. DOM tabs/HUD/log + canvas
   pane scenes (r1). Read-only `__proto` getter hook. Caveat: 72s rep-collapse
   end-state marked [INFERENCE from proto card] — mechanism verified, exact
   end-state timing not independently reproduced.
2. `MAGA-everything/02-code/armor-games/apps/burger-tycoon` (582 LOC,
   Canvas2D+DOM) — `sim.ts` ported 1:1 from the proto; 4 panes, dirty
   toggles, disease/backlash, game-over on cash/rep ≤ 0, best-time persist,
   `?debug` hook. Strongest app in verification: all 5 acceptance items live,
   full collapse chain (rep→0 at t=135s), r05 grid refactor 10/10 actions.

Docs: concept spec `03-burger-tycoon.md` (four panes farm/feedlot/restaurant/
HQ, dirty-options→backlash coupling, "no clean win", forced-failure path),
dossier skeleton (CC deed variant unverified), build card.

## Decision: EXTEND `apps/burger-tycoon`

App sim is a verified 1:1 port of the verified proto; strongest proof story
of the six. Remaining work is presentation (simultaneous desktop panes +
portrait pass per proto card), audio, art, tuned numbers, and menus/settings.

## Known defects

- No open D-IDs (only title with a clean register; r05 PASS; sr1 re-proof PASS).
- Proto card exact timings unverified (carry as tuning task, not defect).
- sr1 note: collapse timing is strategy-dependent. r05 recorded rep→0 at
  t=135s; sr1 stacked all three dirty toggles at t=0 and collapsed at **t=42s**
  (backlash 100, rep 0, one DISEASE OUTBREAK at t=33s). Same mechanism, same
  end-state (`REPUTATION COLLAPSE — activists shut you down`); not a defect.

## Placeholders to resolve before ship

`apps/burger-tycoon/src/sim.ts:12` — all economy numbers declared guesses;
`src/main.ts:90` — placeholder Muzak. Proto `DECLARED GUESSES` block
(`prototypes/burger-tycoon.html:30,41`). Tune against the design intent
(no clean win; pressure without instant collapse) and record rationale.

## Verification

Recorded commands (last observed results):
- Proto: headless chromium `file://prototypes/burger-tycoon.html`, real
  clicks via CDP — PASS (`verification/proto-verdicts/burger-tycoon.md`).
- App: `npm run dev:burger` (port 5175) + CDP — 5/5 acceptance items live,
  collapse chain proven to rep=0 at t=135s (r05).
- **sr1 (2026-09-23), zero-dep Node CDP driver `verification/evidence/sr1-cdp.mjs`
  + `sr1-burger-run.mjs`** (`npm run dev:burger` on 5175, `/usr/bin/chromium
  --headless=new`, fresh `--user-data-dir` per run, real
  `Input.dispatchMouseEvent` clicks; `__maga` read-only) — **all 7 acceptance
  items PASS** (`verification/evidence/sr1-burger-run.log`):
  - AC1 four-panes-affect-economy: crops 20→35, patties 10→14, demand 1.0→1.9,
    cash 500→342 — one real click per pane — PASS.
  - AC2 dirty=cutCorners: profit 0→$12/s (1.6x margin), backlash 0→1.6 — PASS.
  - AC3 forced-failure: real clicks flip deforest+cheapFeed+cutCorners →
    **GAME OVER `REPUTATION COLLAPSE` at t=42s**, rep 0, backlash 100 — PASS;
    screenshots `sr1-burger-dirty-on.png`, `sr1-burger-collapse.png`.
  - AC4 mobile tabs (best-effort, 500px viewport, single-pane): 4 DOM tabs,
    pane 4 reachable — PASS; `sr1-burger-mobile-tabs.png`.
  - AC5 no-McD-marks: rendered body text scanned, none — PASS (only internal
    policy comments mention McDonald's; wordmark is original "BURGER TYCOON").
  - AC6 English-only: 0 non-Latin/accented chars (only —/· punctuation) — PASS.
  - AC7 sim-idles: t 0→2.5s, cash 500→503 with no input — PASS.
  - Restart after game-over (real click): over=false, t=0, cash 500, rep 70 —
    PASS. Best-time persistence: `maga:burger-tycoon:best-time` (41.96s)
    survives in-session reload, HUD shows BEST — PASS.
  - Console errors: 0 app-originated (only `/favicon.ico` 404).

Ship-gate checklist: pending.

## Deferrals

None declared yet.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/`, `prototypes/`, plus my own knowledge of
the original game. Network use: none beyond a single `npm ping` probe. No
web/GitHub searches about this project, no forks/copies, no third-party
remakes of the original were consulted.

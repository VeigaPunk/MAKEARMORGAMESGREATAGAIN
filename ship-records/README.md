# Ship records — index and status board

Living records for the MAKEARMORGAMESGREATAGAIN mission (contract: `MISSION.md`).
One record per roster game; update in place, never a parallel file. Records
begin with the survey + adopt/extend/replace decision and end as ship records
(acceptance checklist, exact verification commands + last observed results,
deferrals, provenance declaration).

Run log: **ship-run 2026-09-22** (goal-mode run) — reconnaissance complete,
records seeded. Prior runs' status lives in git history, `verification/`,
`MAGA-everything/01-design-docs/` (DISSECTION/OPEN-ITEMS/divergence-log), and
`.ufo/handoff/` — mined as status records, never as instructions.

## Status board (as of 2026-09-22, ship-run start)

| Game | Rendition | Decision | Gate / proof state | Blocking defects | Ship status |
|---|---|---|---|---|---|
| Boxhead: 2Play Rooms | `MAGA-everything/02-code/armor-games/apps/boxhead` (Pixi 8) | EXTEND | B-N1 PASS, B-N2 8/8 PASS (r05); needs re-probe after install | none HIGH; D-16→D-58 MED, D-18, D-55/56/57 LOW; 51 placeholder markers | NOT SHIPPED |
| The Impossible Game | `apps/impossible` (Canvas2D) + proto contract | EXTEND | proto fully verified; app slice unproven end-to-end | full clear x=9900 unproven on app; AudioSyncClock unproven | NOT SHIPPED |
| Burger Tycoon | `apps/burger-tycoon` (Canvas2D+DOM) | EXTEND | strongest app: 5/5 acceptance live, collapse chain proven | none open; all economy numbers are guesses | NOT SHIPPED |
| Chicken Invaders 2 (+ Cluck Horizon) | `packages/shmup-core` + `apps/chicken-invaders{,-original}` | EXTEND (keep dual-pack architecture) | cluck full clear proven; replica ch1+boss proven | D-38 replica enemy types no-op; D-37 boss names; replica game-over + ch2 boss unproven | NOT SHIPPED |
| Swords & Sandals 2 | `apps/swords-and-sandals` (Canvas2D+DOM) | EXTEND | loop proven; save validator proven | **D-51/52/53 stored XSS (HIGH)**; **D-54 ladder unwinnable (MED)** | NOT SHIPPED |
| The World's Hardest Game | `hardest/` (zero-dep, file://) | ADOPT + EXTEND | **validator RED: 112/114** (109, 111 autopilot fail) | D-47 HIGH (MEDAL_COL crash), D-45 HIGH (save brick), D-65 MED | NOT SHIPPED |

Global gaps: no root entry point; no audio anywhere beyond synth blips; all
combat/economy constants are declared guesses ("TBD ARCADE"); art is
placeholder/first-pass in the monorepo.

## Environment facts (probed 2026-09-22)

- node v24.19.0, npm 11.17.0, python3 3.14.7, npx present.
- **npm registry reachable** (`npm ping` PONG 216ms) → stack-locked TS/Vite
  monorepo path is viable; the zero-dependency fallback is NOT triggered.
  Lockfile present; `node_modules` absent → first build step is `npm install`
  in `MAGA-everything/02-code/armor-games/`.
- Browser: `/usr/bin/chromium` only. Playwright 1.63.0 resolvable via npx;
  no downloaded browsers → drive system chromium (executablePath).
- Prior verification method: headless chromium CDP against dev servers
  (ports 5173 boxhead / 5174 impossible / 5175 burger / 5176 replica /
  5177 cluck / 5178 sas) with `?debug` hooks; prototypes via file://;
  `node hardest/validate.mjs` for the hardest corpus.

## Run plan (ship-run 2026-09-22)

1. **Fix-forward wave A (gates first):** hardest — repair 109/111 (degenerate
   stationary movers), D-47, D-45, D-65; regen `pars.js` + `DIFFICULTY.md`;
   gate must read 114/114. S&S — D-51/52/53 XSS, D-54 ladder economy.
2. **Baseline re-probe:** `npm install`; boot all six apps headless; re-run
   recorded verifications (B-N1/B-N2 boxhead, shmup clears, burger collapse,
   impossible deaths at x=1410/2967, sas save matrix).
3. **Root entry point:** single `index.html` at repo root linking exactly one
   rendition per title (hardest via `hardest/`, five via built monorepo apps —
   committed static build output so the player needs no build step).
4. **Ship-readiness per game:** resolve/tune placeholder constants, audio
   (WebAudio doctrine), authored art, menus/HUD/pause/settings/touch/
   persistence, rights renames (hardest title still original).
5. **Final verification + records:** real-input proofs with evidence; finish
   each record's checklist/commands/deferrals/provenance.

## Standing directives (from the design pack; bind all records)

Stack lock (TS+Vite, Pixi 8 external via vendored importmap; Canvas2D for
impossible/burger/sas); zero binary assets — WebAudio recipes only; art
hand-authored, no external generators; English only; integer letterbox scale;
every state machine state has an exit; read-only verification hooks must be
readable in every mode ("a probe that throws is a probe that lies"); real
input events only for verification claims.

# PROOF checklist — Crateheads native (BH-3.3 template)

Pass/fail template from concept spec §Acceptance hooks +
`07-acceptance/boxhead-playability-checklist.md`. PROOF fills Verdict +
Evidence per row; FAIL rows use the repro template in the master checklist.

Filled 2026-09-23 (sr2 wave): real-input CDP chromium 151 headless=new,
`verification/evidence/sr2-boxhead-run.log` (canonical suite 53/55 on the
final build) + focused probes (`sr2-boxhead-aoe-probe.log`,
`sr2-boxhead-dm-probe.log` / grenade attempts recorded in the run log).
The two canonical reds are covered: SOLO-blast-kill re-proven PASS by the
focused AoE probe (+300 blast-credit, `sr2-boxhead-aoe-probe.log`);
GRENADE-aoe-multikill honestly deferred (below).

| # | Hook (concept §Acceptance) | Gate | Verdict | Evidence |
|---|----------------------------|------|---------|----------|
| 1 | Solo waves 1–3 completable, no softlock; death ends run + shows score | B-N1+ | ☑ PASS | run.log: `SOLO-victory end=victory score=39600 t=76s`; `sr2-boxhead-victory.png`; death→OVERRUN→retry rows |
| 2 | Desktop co-op: P1+P2 move & shoot simultaneously, one keyboard, no focus steal | B-N2+ | ☑ PASS | run.log `COOP-simul-*` (P1 dy=75 / P2 dx=75; ammo both −2); `sr2-boxhead-coop.png` |
| 3 | Mid-run swarm density feels chaotic arcade (not sparse) | B-N1+ | ☑ PASS | peak concurrent 10–12 on tuned tables (runs 12–15); `sr2-boxhead-solo-wave3.png` |
| 4 | Ammo crate restores shooting when dry; barrel clears nearby zombies, readable radius | B-N1+ | ☑ PASS | crate pickups re-proven across runs (economy tune 24/crate); barrel blast +300 credited — focused probe `A) SOLO-BLAST PASS`, `sr2-boxhead-aoe-solo.png` |
| 5 | Kill streak visibly affects score / unlock cadence | B-N1+ | ☑ PASS | `SOLO-ladder PISTOL,SHOTGUN,UZI,GRENADES`; mult x20 observed (victory HUD) |
| 6 | Deathmatch: both players damage each other; match ends on agreed rule (TBD) without crash | B-N2+ | ☑ PASS | run.log: `DM-aoe-kill-credit P2 kills 0->1 (barrel blast)`, `DM-match-end P1 WINS 5–1`, `DM-target-5`; `sr2-boxhead-dm-end.png` |
| 7 | Mobile layout A: two thumbs control two players ≥60s, no UI blocking shots | B-N2+ / WAIVE | ☐ WAIVED | no tablet in lab (BH-2.2 waiver stands); touch layout C smoke passed |
| 8 | Stage letterboxed; no non-uniform stretch warping movement | all | ☑ PASS | integer scale desktop; sub-1x uniform fit portrait (`TOUCH-portrait-letterbox` scale=0.781) |
| 9 | Cold restart menu → combat < ~3s on localhost mid-tier laptop | all | ☑ PASS | boot 0.1s; instrumented hub boot playing+wave 1 (`sr2-hub-boxhead.log`) |
| 10 | English-only strings; no leftover placeholder locales | all | ☑ PASS | `RIGHTS-title/string/logo` rows; grep bundle 0 "BOXHEAD" refs |

## Grenade AoE multi-kill — honest status (DEFERRED)

Attempted across 15 canonical suite runs + 3 focused probes on the final
build family. The tier is reached reliably (`GRENADES` in the ladder in
11+ runs) and grenades are fired at clusters/barrels in real play, but the
specific "one lob kills ≥3 simultaneously" window never aligned under
automation: the player-bot that builds mult ≥10 clears the field fast
(nothing left to cluster), and the bot that waits to be surrounded stalls
below the tier. The shared AoE kill-credit path (`detonate` →
`scoreSys.kill()`) is proven by barrel blasts (+300 sr2 focused probe;
+500/+900 sr1 probes) and the DM barrel-credit row. Recorded as a
mechanic-reached, single-capture-unproven deferral per the brief.

## New sr2 checks (beyond the template rows)

| Check | Verdict | Evidence |
|-------|---------|----------|
| Rights: title/string/logo Crateheads, no original marks | ☑ PASS | `RIGHTS-*` rows |
| Settings music/SFX/mute live + persist across reload | ☑ PASS | `SETTINGS-live/mute/persist-reload/restored` |
| Audio scheduled (ctx running, voices>0) after real fire | ☑ PASS | `AUDIO-scheduled voices=13` |
| Pause ×3 modes (solo/co-op/DM) ESC/P + world-frozen + M-exit | ☑ PASS | `PAUSE-*/COOP-pause/DM-*` rows |
| D-55 Enter-noop in pause · D-56 world hidden at menu · D-18 banner clear | ☑ PASS | `D-55/D-56/D-18` rows |
| D-57 crate timer clamped ≥0 | ☑ PASS | `D-57-crate-timer` |
| D-58 throttle-resume grace | FIXED (not live-reproducible headless — r05 same) | code: `resumeGraceUntil` in `game.ts` |
| High score survives reload | ☑ PASS | `PERSIST-highscore` |
| Hygiene: 0 console errors, 0 non-local requests | ☑ PASS | `HYGIENE-*` rows + `sr2-hub-boxhead.log` |
| DM crates enabled (D-25 stays fixed) | ☑ PASS | `DM-crates-enabled` first crate ≤15s |

## Environment record

| Field | Value |
|-------|-------|
| Build / commit | final sr2 dist (`npm run build -w @maga/boxhead`, JS 41.08 kB, pixi external via importmap) |
| URL (dev-verify) | http://127.0.0.1:8281/?debug (built `apps/boxhead/dist` on python http.server) |
| URL (hub proof) | http://127.0.0.1:8283/ → real card click → `games/boxhead/` |
| OS / browser | Linux · Chromium 151.0.7922.137 headless=new (CDP 9401) |
| Input | desktop keys/mouse (real CDP events) + emulated touch |
| Date | 2026-09-23 |

## Section gates (master checklist)

- A smoke / boot: A1–A5 ☑ (boot 0.1s, menus, cold start <3s, English-only)
- B solo e2e: B1–B10 ☑ (waves 1–3 victory on tuned tables, swarm, crates,
  barrels via focused probe, streak/ladder, death→restart, highscore) ·
  modes: B11–B13 ☑ (mode select, co-op simultaneous, DM end-rule + AoE
  credit) · B14 ☑ (runners = special enemy type, horned visual + alarm cue)
- C touch: C1 ☑ smoke (menus/stick/fire/end-chips; ≥60s human phone run
  still pending) · C2 ☑ · C3 ☑ · C4 ☐ WAIVED · C5 ☑ · C6 ☑
- D display: D1 ☑ · D2 ☑ (640×400 provisional; D-05 doc contradiction open,
  doc-scope) · D3 ☑ · D4 n/a
- E desktop controls: E1 ☑ · E2 ☑ · E3 ☐ (rebind = load/save stub, no UI —
  documented limitation) · E4 ☑ · E5 ☑
- F perf: F1 ☑ · F2 ☑ (built JS 41 kB gzip 13.6 kB + vendored pixi ~1.6 MB
  local) · F3–F6 ☐ (not re-measured this run; r05 ?stress ~52fps @100 movers
  stands) · F7 ☑ (Pixi 8 external + arcade-core only)
- G suite matrix: ☐ (needs Firefox + real phone/tablet — deferred)

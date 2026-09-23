# PROOF checklist — Boxhead native (BH-3.3 template)

Pass/fail template from concept spec §Acceptance hooks +
`07-acceptance/boxhead-playability-checklist.md`. PROOF fills Verdict +
Evidence per row; FAIL rows use the repro template in the master checklist.

Filled 2026-09-23 (sr1 re-probe; canonical full-suite run + focused probes,
real-input CDP chromium 151, `verification/evidence/sr1-boxhead-run.log`).

| # | Hook (concept §Acceptance) | Gate | Verdict | Evidence |
|---|----------------------------|------|---------|----------|
| 1 | Solo waves 1–3 completable, no softlock; death ends run + shows score | B-N1+ | ☑ PASS | run.log "Solo e2e"; `sr1-boxhead-victory.png` |
| 2 | Desktop co-op: P1+P2 move & shoot simultaneously, one keyboard, no focus steal | B-N2+ | ☑ PASS | run.log "Co-op"; `sr1-boxhead-coop.png` |
| 3 | Mid-run swarm density feels chaotic arcade (not sparse) | B-N1+ | ☑ PASS | peak 8–10 concurrent under aimbot fire; wave 3 = 14 @0.85s cadence + 4 runners; `sr1-boxhead-solo-wave3.png` |
| 4 | Ammo crate restores shooting when dry; barrel clears nearby zombies, readable radius | B-N1+ | ☑ PASS | run.log: 16× +16 pickups on dry (probe C); barrel exploded, +500/+900 blast kills with chain credit (probes H/I/M) |
| 5 | Kill streak visibly affects score / unlock cadence | B-N1+ | ☑ PASS | mult x1..x14; tiers pistol→shotgun→uzi→grenades observed live |
| 6 | Deathmatch: both players damage each other; match ends on agreed rule (TBD) without crash | B-N2+ | ☑ PASS | run.log "Deathmatch": P2→P1 100→70; P1 wins 5–0; `sr1-boxhead-dm-end.png` |
| 7 | Mobile layout A: two thumbs control two players ≥60s, no UI blocking shots | B-N2+ / WAIVE | ☐ WAIVED | no tablet in lab (BH-2.2 waiver stands); touch layout C smoke passed (run.log "Touch") |
| 8 | Stage letterboxed; no non-uniform stretch warping movement | all | ☑ PASS | integer scale uniform at desktop; sub-1x uniform fit by design (D-04) on portrait |
| 9 | Cold restart menu → combat < ~3s on localhost mid-tier laptop | all | ☑ PASS | title→playing 0.2s; reload boot 0.1s |
| 10 | English-only strings; no leftover placeholder locales | all | ☑ PASS | grep src/+index.html — UI strings ASCII-only |

## Environment record

| Field | Value |
|-------|-------|
| Build / commit | 5d996c3 + sr1 `?debug` snapshot hook (uncommitted) |
| URL | http://localhost:5173/?debug |
| OS / browser | Linux · Chromium 151.0.7922.137 headless=new (CDP 9777) |
| Input | desktop keys/mouse (real CDP events) + emulated touch |
| Date | 2026-09-23 |

## Section gates (master checklist)

- A smoke / boot: A1–A5 ☑ (boot 0.1s, menus, no audio gate, cold start 0.2s, English-only)
- B solo e2e: B1–B10 ☑ (room pick, spawn/move/shoot, waves 1–3, swarm, crates, barrels, streak, weapon curve, death→restart, highscore persist) · modes: B11–B14 ☑ (mode select, co-op simultaneous, DM end-rule, runners = special enemy)
- C touch: C1 ☑ smoke (menus/stick/fire/end-chips via CDP touch; ≥60s human phone run still pending) · C2 ☑ smoke · C3 ☑ (HUD top-left, controls bottom, no permanent overlap — `sr1-boxhead-touch.png`) · C4 ☐ WAIVED (no tablet) · C5 ☑ (desktop B12 re-green after touch code) · C6 ☑ (portrait letterbox intact)
- D display: D1 ☑ · D2 ☑ (640×400 provisional; D-05 doc contradiction still open) · D3 ☑ (resize/rotate re-letterboxes) · D4 n/a (no fullscreen offered)
- E desktop controls: E1 ☑ (WASD+Space no mouse needed) · E2 ☑ (P2 arrows+IJKL simultaneous) · E3 ☐ (rebind = load/save stub, no UI — documented limitation) · E4 ☑ (mouse aim optional sugar, works) · E5 ☑ (window-level key handlers, no steal observed)
- F perf: F1 ☑ (menu instant) · F2 ☑ (~984KB dev transfer incl. 829KB vendored pixi; prod JS 27.6KB) · F3–F6 ☐ (not re-measured this run; r05 ?stress ~52fps @100 movers stands) · F7 ☑ (Pixi 8 external + arcade-core only)
- G suite matrix: ☐ (needs Firefox + real phone/tablet)

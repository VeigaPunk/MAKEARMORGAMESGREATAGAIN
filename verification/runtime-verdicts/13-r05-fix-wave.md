# Runtime verdicts — round 5 fix-verification wave (2026-09-22)

**Wave:** `r05-fixes` — 29 lanes. Full lane reports: `.ufo/scopes/maga-verify/r05-wave/*.md`. Evidence: `verification/evidence/r05-*` (90 files). Canonical defect register: `../divergence.md` (round-5 section).

## Fix verdicts (live)

| Defect | Result | Lane |
|--------|--------|------|
| D-22 proto `__proto` title throw | FIXED | ProtoChickenD22 |
| D-23 sas defeated persist | FIXED (×2 runs + 8-payload corrupt matrix) | SasD23 |
| D-25 DM ammo starvation | FIXED (crates 9.3s/12s/cap2, match concluded) | BoxheadDMCrates |
| D-26 pause inert | FIXED (12-scenario matrix) | BoxheadPause |
| D-27/28 sas shop | FIXED | SasD2728 |
| D-29/30 sas gate/replay | FIXED | SasD2930 |
| D-31 sas name XSS | PARTIAL → D-51/52/53 | SasD31 |
| D-32 shmup touch release | FIXED live both apps | ShmupD32Live |
| D-33/34 impossible collision | RE-CONFIRMED (x=1410 ×27, x=2967 ×2) | ImpossibleFixes |
| D-36 wave clamp | PARTIAL (snapshot leak → D-41) | ShmupSimChurn |
| D-37 boss names | NOT FIXED | ShmupSimChurn |
| D-38 type visuals | FIXED cluck (measured); replica placeholder | ShmupTypes |
| D-16 invuln | PARTIAL → D-58 burst hole | BoxheadD16/Stress |
| D-08 F3 unreachable | ENABLER LANDED (~100 movers, 52fps lower bound) | BoxheadStress |
| D-18 banner bleed | OPEN | BoxheadRegress |
| D-19 grenade | RESOLVED in code (owner exempt) | BoxheadRegress |
| D-40 docs | 7/8 reconciled | DocsXref2 |

## New surface: hardest/

96/96 shipped levels completable — dual-proven (in-browser autopilot on page engine + `node hardest/validate.mjs` exit 0). Boot/control/save/touch matrix PASS. HIGH defects: D-45 corrupt-save menu crash, D-47 MEDAL_COL crash. MED: D-48 manifest stale (97/98 unshipped), D-49 autopilot fidelity, D-65 stuck-keys-on-blur.

## New defects filed: D-41–D-66 (see divergence.md round-5 table)

## Unverified frontier (carried, mission stopped by L0 order)

impossible full clear (segments passable) · replica gameover/ch2-boss · sas proto card full claims · F3 isolated fps · Firefox/real-device cells.

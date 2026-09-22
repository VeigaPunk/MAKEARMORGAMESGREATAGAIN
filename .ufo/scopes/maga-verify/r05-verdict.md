# maga-verify r05 — verdict (Pareto judge)

**Round axes:** fix-verification throughput · new-surface coverage · adversarial depth · evidence quality

## Wave: r05-fixes — 29 lanes, one batched task call (scout×13 sentinel×10 critic×2 revenger×2 executor×1 reviewer×1)

| Lane | Role | Verdict | Axis deltas | Decision |
|------|------|---------|-------------|----------|
| BoxheadPause | scout | PASS | +D-26 fixed live (12-scenario matrix), +D-55/D-56 minors | ACCEPT |
| BoxheadD16 | sentinel | STATIC-ONLY | +clamp confirmed in source; live blocked by contention | ACCEPT (partial) |
| BoxheadDMCrates | scout | PASS | +D-25 fixed live (cadence/pickup/match), +D-57, +D-59 docs inversion | ACCEPT |
| BoxheadStress | scout | PASS | +D-08 enabler live (~100 movers, 52fps lower bound), +D-58 burst-damage hole | ACCEPT |
| BoxheadTouch | sentinel | STATIC-ONLY | +window-release confirmed in source; emulation env failed | ACCEPT (partial) |
| BoxheadRegress | sentinel | PARTIAL | +D-18 open, +D-19 owner-exempt confirmed; death/coop/DM cut by hijack | ACCEPT |
| ImpossibleFixes | scout | PASS | +D-33/34 re-confirmed (x=1410 ×27, x=2967 ×2), +best-progress +__proto live, +D-60/61 | ACCEPT |
| ImpossibleClear | sentinel | PARTIAL | +all hazards segment-verified passable; full clear still unproven; +D-60 hook shadowing | ACCEPT |
| BurgerGrid | scout | PASS | +grid refactor fully verified (10/10 actions, no-op contract, narrow fallback) | ACCEPT |
| BurgerRegress | sentinel | PASS | +collapse chain intact post-refactor (GAME OVER t=50s debug-accelerated) | ACCEPT |
| SasD23 | scout | PASS | +D-23 fixed live ×2 runs, +8-payload corrupt-save matrix clean | ACCEPT |
| SasD2728 | sentinel | PASS | +D-27/28 fixed live (owned[] persists, no double-dip) | ACCEPT |
| SasD2930 | scout | PASS | +D-29/30 fixed live, +D-54 unwinnable ladder (MED), +D-51 XSS confirm | ACCEPT |
| SasD31 | scout | FAIL | +D-31 partial → D-51 HIGH live XSS, D-52 MED, D-53 latent; 8-sink audit | ACCEPT |
| SasProto | critic | PARTIAL | +boot/create/combat-gate/persist live; loop/shop/touch/champion static | ACCEPT |
| ShmupD32Live | sentinel | PASS | +D-32 fixed live BOTH apps under touch emulation (10 shots) | ACCEPT |
| ShmupTypes | scout | PASS | +D-38 cluck fixed live (measured 1.147×/0.846×/3hp); replica placeholder stands | ACCEPT |
| ShmupSimChurn | revenger | FAIL | +D-37 not fixed, D-39 half, +D-41–44 new churn defects | ACCEPT |
| ShmupReplicaEnd | sentinel | PARTIAL | +ch1 live; gameover/ch2-boss still unverified (hijack) | ACCEPT |
| HardestBoot | scout | PASS | +full boot/control/save/touch matrix live; +D-64/65/66 | ACCEPT |
| HardestEngine | revenger | STATIC-ONLY | +engine/physics/save map; +D-46/48/49 tunnel/manifest/autopilot findings | ACCEPT |
| HardestValidate | executor | PASS | +validate.mjs 96/96 exit 0 (36.8s), manifest fresh at run time | ACCEPT |
| HardestLvA | scout | PASS | +L1–8 browser+Node clears 0-death; +D-45 corrupt-save HIGH | ACCEPT |
| HardestLvB | scout | PASS | +L9–16 dual-proven; +MENU_COLS transient crash documented | ACCEPT |
| HardestLvC | scout | PASS | +L17–24 dual-proven; +D-47 MEDAL_COL crash HIGH | ACCEPT |
| HardestLvD | scout | PASS | +L25–32 dual-proven incl keys/teleports live; +D-50 wall-clip | ACCEPT |
| HardestAdversarial | sentinel | PARTIAL | +D-45 first repro; several probes cut short | ACCEPT |
| ProtoChickenD22 | critic | PASS | +D-22 fixed on edited bytes; combat watch cleared | ACCEPT |
| DocsXref2 | reviewer | STATIC-ONLY | +7/8 D-40 reconciled byte-verified; +3 stale records | ACCEPT |

## Pareto assessment
All 29 lanes accepted — every one improved ≥1 axis, none regressed. Rejected/corrected content: ImpossibleClear's "7100 block impossible" hypothesis (refuted — schedule issue); HardestBoot's D-41/42/43 IDs renumbered (collided); lane D-ID collisions normalized in divergence.md (D-41–D-66 canonical).

## Findings summary
- **Fixes verified live:** D-22, D-23, D-25, D-26, D-27, D-28, D-29, D-30, D-32 (both apps), D-33, D-34 (re-confirmed), D-38 (cluck). D-19 resolved in code.
- **Partial fixes:** D-16 (burst hole → D-58), D-31 (→ D-51/52/53), D-36 (→ D-41), D-39, D-40 (7/8).
- **Not fixed:** D-37 (boss names dead), D-18 (banner bleed).
- **New defects:** D-41–D-66 (canonical in divergence.md). HIGH: D-45 + D-47 hardest menu crashes, D-51 sas HUD XSS. MED: D-48 manifest stale, D-49 autopilot fidelity, D-52 look XSS, D-54 unwinnable sas ladder, D-58 invuln burst, D-59 docs inversion, D-65 stuck-keys-on-blur.
- **New surface:** hardest/ — 96/96 shipped levels completable (dual-proven browser+Node); 97/98 exist but unshipped (D-48).
- **Frontier still dark:** impossible full clear (segments passable, no end-to-end), replica gameover/ch2-boss, sas proto card full claims, F3 isolated fps gate, Firefox/real-device G-matrix.

## Ops notes
- Tab-name registry + shared localStorage caused ~10 contamination incidents; named-tab discipline broadcast mid-wave mitigated. Filed D-63 (process). Per-lane browser contexts or storage namespacing needed for future waves.
- Hardest tree churned mid-wave (96↔98 levels, MENU_COLS landed mid-probe) — moving-target artifacts documented, not filed.
- L0 directives received mid-round: m_kcode routing (table-level, no lane param exists), grok-imagine nuke (scope clean; 4 jpgs + refs in sibling scopes inventoried), handoff+stop orders.

## Frontier state
`stop` per L0 order (fleet shutdown) — not saturation: expandable frontier remained (dark cells listed above).

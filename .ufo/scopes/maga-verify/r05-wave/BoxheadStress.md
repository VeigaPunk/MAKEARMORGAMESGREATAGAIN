# r05 · BoxheadStress — D-08 enabler verification (`?stress` mode)

Lane: maga-verify r05, leaf member (no subagents). Surface: `apps/boxhead/src/game.ts` (read-only) + live `http://localhost:5173/?stress`.

## Verdict

**PASS** — the D-08 enabler works as coded. `?stress` tops the field to ~100 movers including runner variants; the F3 50–100-mover scenario is now reachable and measurable. Sustained fps at ~100 movers is ~52 fps median (pixi self-report ~60) under adversarial multi-tab contention — a lower bound, not a mid-laptop solo number. No sustained sub-30. One ~1.0 s hitch observed in one of two 10 s windows (environment-attributed, unconfirmed).

## Evidence

**Source (current uncommitted bytes, verified before probing):**
- `apps/boxhead/src/game.ts:64-66` — `stress = new URLSearchParams(location.search).has('stress')`, comment names D-08/F3.
- `game.ts:508-509` — `if (this.stress && this.zombies.length < 100) this.spawnZombie(Math.random() < 0.35, 60 + Math.random() * 40)` — 1 spawn/frame while <100, 35% runner probability, speed 60–100 (runners ×1.8 per `entities.ts:86`).
- Served module confirmed current: `curl :5173/src/game.ts` shows `< 100` (the 60→100 burn is what :5173 serves).
- `main.ts:59-61` — `?debug` exposes `window.__maga = { game, input, touch }`; used for counts/hp-top only, no source edits.

**Live probe 1 — field fill (solo, room 1):**
- `?stress&debug` → Space ×3 through title/mode/room → `state:'playing'`, wave 1.
- Field reached **100 zombies in 1403 ms** of gameplay (stress top-up is 1/frame while `< 100`).
- **Runners: 36/100 (36%)** — matches the coded 0.35 probability; visually confirmed red (`0xd43a3a`) vs green (`0x6a8f3a`) in `verification/evidence/r05-BoxheadStress-field-fill.png`.
- Wave-table spawns stack on top of the stress cap: field drifted 100 → 103–104 during sampling (wave 1 table spawns 5 at `spawnEvery` 1.4 s). Spec says "~100" — within tolerance, noted below.

**Live probe 2 — 10 s fps/frame-time at 97–104 movers (388 rAF frames, in-page `performance.now` deltas):**
- **median frame 19.2 ms (~52 fps)** · p95 31.9 ms · p99 37.0 ms · max **1026.1 ms** (single hitch)
- frames >33.3 ms: 9/388 (2.3%); longest consecutive sub-30 run: **1 frame** (no sustained sub-30)
- worst rolling 1 s window: 1 fps (the single 1026 ms hitch dominates it)
- Pixi ticker self-report: 59.9–60.6 fps in 7/10 per-second samples, 29.9–30 in t=7–9 s (same window as the hitch)
- post-state: 104 zombies / 36 runners / `playing` / hp 100 (hook-topped) / wave 1

**Live probe 0 (first window, partial aggregates lost to an eval error, per-second samples intact):** 100→103 movers over 10 s, runners constant 36, pixiFps 59.9–60.2 in 7/9 samples with two 29.9–30 blips, raw deltas 4.2–31.6 ms, **zero frames >33.3 ms** in the visible set. Repeatability: two independent windows both show ~100 movers held and ~60 fps nominal.

**Artifacts:**
- `verification/evidence/r05-BoxheadStress-field-fill.png` — dispersed field at 100 movers, red runners clearly visible, HUD `WAVE 1/3 · HP 90 · AMMO 24`
- `verification/evidence/r05-BoxheadStress-field-10s.png` — post-10 s swarm converged on player (heavy sprite overlap; count from hook, not pixels)
- `verification/evidence/r05-BoxheadStress-field-10s-rep2.png` — repeat run post-sample (104 movers)
- Counting method: `__maga.game.zombies.length` / `.filter(z => z.runner).length` via `?debug` hook (exact, not visual estimate); screenshots corroborate density.

## Defects

- **D-45 (LOW, edge) — throttle-resume burst still stacks lethal contact damage despite the D-16 dt cap.** Between probe windows the harness idled the tab (rAF suspended for seconds). On resume, the player died (`state:'dead'`) despite a 200 ms wall-time hp/alive top-up running the whole time. Mechanism [INFERENCE]: on visibility restore, rAF fires a catch-up burst; each frame is dt-capped at 0.05 (`game.ts:341-343`) so invuln (0.8 s game-time) expires after 16 burst-frames delivered in milliseconds of wall time, letting the swarm land 10+ hits in one burst — the cap bounds per-frame dt, not burst-accumulated damage. Suggest wall-clock-based invuln (the original D-16 note) or burst detection. Reproducible on demand by idling a stress tab ~30–60 s mid-swarm. Distinct from D-16's filed scope (invuln wall-time drain); this is damage stacking on resume.
- **D-45a (trivia, no action owed) — stress cap is soft against wave-table spawns:** `updateSpawning` tops up only while `zombies.length < 100`, but wave-table spawns are unconditioned, so the field settles at ~103–104, not ≤100. Spec says "~100 movers"; no budget breach. Flagging so nobody re-files it.

## Notes

- **F3 budget status:** D-08's blocker ("scenario unreachable, wave tables cap at 14") is now addressed in-tree by the debug-only `?stress` flag — the 50–100-mover scenario is reachable on demand without touching `WAVE_TABLES`/`MAX_WAVE`. Recommend the register move D-08 from OPEN to **ENABLER-LANDED (partial)**: the scenario is now testable; the F3 gate itself still needs an isolated-machine run for a clean ~60 fps claim.
- **Measured fps is a lower bound:** the shared headless browser ran ~30 tabs (≥8 active Pixi tickers) during sampling. Median 52 fps / pixi ~60 fps under that contention supports (does not prove) the F3 budget on quiet hardware. The single 1026 ms hitch appeared in one of two windows and coincided with a multi-tab contention spike [INFERENCE] — F5 ("no ≥500 ms hitch") is **unproven either way**; re-pro on an idle browser before judging F5.
- **Contamination log (wave infrastructure, not boxhead):** my tab `BoxheadStress` was navigated to `hardest/index.html` by another lane's `browser.open`; reopened as `BoxheadStressR5`, whose handle then crosswired with `SasD2930-ss5178` ("Tab busy" on my URL) — one probe's 3 Space presses landed on an unknown sibling tab (ShmupTypes claimed a matching stray Space on a :5173 tab; I accept their attribution). All evidence above comes from the final tab `BoxheadStress-r05d`, URL-asserted inside every probe step. HardestBoot's save pollution was not mine (acked on hub). Parent's naming discipline followed from the reopen onward.
- Runner speed ×1.8 / hp 1 behavior is source-verified only (`entities.ts:85-88`); I did not measure per-zombie velocity live — count/presence/color are the live-verified claims.
- Probe hook: `?stress` alone is sufficient for the stress behavior; `&debug` was added solely for `__maga` instrumentation. No source files touched; no servers started; no npm commands.

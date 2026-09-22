# maga-verify r05 — plan (WWKD inline)

**Axes (this round):** fix-verification throughput · new-surface coverage · adversarial depth · evidence quality

## Data walk (done 2026-09-22)

- Dev servers: all six apps live — :5173 boxhead, :5174 impossible, :5175 burger, :5176 replica shmup, :5177 cluck, :5178 sas. `/hardest/` on :5173 is SPA fallback — hardest is `file://`-only.
- **Uncommitted forge WIP (moving target, verify current bytes):**
  - boxhead `game.ts`: D-26 pause implemented (`paused` state, ESC/P resume, M/ENTER/tap→menu); D-16 `gameplayDt` clamp 0.05; D-08 `?stress` → ~100 movers incl runners; D-25 crates now spawn in deathmatch (DD-77/DD-18 deadlock fix, spec divergence pending ARCADE ruling). `touch.ts`: window-level pointerup (D-14-class).
  - impossible `main.ts`: D-33/34 fixes (r4-verified) + NEW `best-progress` persistence + `window.__proto` debug hook under `?debug`.
  - sas `main.ts`: D-23 `defeated` restored + `validSave()` schema gate; D-28 `owned[]` persisted + disabled; D-29 Buckler gate 3→2; D-31 name via `textContent`; D-30 Start button gated `defeated<length`.
  - burger `main.ts`/`sim.ts`: `drawPane` grid refactor (4-pane layout), `act()` no-op→null, `renderedEvents` type change.
  - shmup-core: D-38 per-type enemy colors (`drawBird` variant param), D-32 window-release (r4 source-verified, live re-probe owed); `sim.ts` churn unreviewed.
- **New surfaces:** `hardest/` (World's Hardest Game replica — engine.js 240Hz, game.js, 32 levels, autopilot.js solver, validate.mjs corpus gate, LEVEL-FORMAT.md); `prototypes/swords-and-sandals.{html,md}` (claim card: 5 opponents, champion, touch-only fight, persist, defeat path); `prototypes/chicken-invaders.html` edited post-D-22.
- **Out of scope:** `tcg/` (sibling tcg-arena), `config/`/`scripts/`/`ssot/` (dispatcher machinery, not game surface).
- Frontier carry-over: impossible full clear unproven; replica gameover/ch2-boss unverified; sas D-27/28/30 were static-only until now.

## Milestones

### M1 — Wave r05-fixes (29 lanes, one batched dispatch)
**Does:** verify every in-tree fix live + cover hardest/ + sas proto + frontier items.
**Gate:** every lane returns verdict markdown; ≥90% lanes produce artifact evidence.
**Shape:** one wave, 29 lanes ∈ [16,100]. Named-tab discipline baked into context (r4 lesson: tab hijacking cost ~3 lanes).

| Lane | Role | Item |
|---|---|---|
| BoxheadPause | scout | D-26 live: ESC→PAUSED, resume, M/ENTER→menu, touch tap-quit |
| BoxheadD16 | sentinel | D-16 dt clamp: blur/throttle mid-run, invuln no longer wall-time, stacked hits |
| BoxheadDMCrates | scout | D-25: DM crates spawn + ammo starvation resolved; flag spec divergence (spec: no DM pickups) |
| BoxheadStress | scout | D-08: ?stress ~100 movers, F3 50–100-mover budget measurable, fps sample |
| BoxheadTouch | sentinel | touch.ts window-release live under emulation; pause via touch |
| BoxheadRegress | sentinel | post-churn loop sweep; D-18 banner bleed + D-19 grenade recheck |
| ImpossibleFixes | scout | D-33/34 re-verify on current bytes; __proto hook; best-progress save/reload |
| ImpossibleClear | sentinel | frontier: full clear via __proto teleport segments + legit attempt |
| BurgerGrid | scout | drawPane grid: all panes visible, hit regions correct, act() no-op path |
| BurgerRegress | sentinel | collapse chain post-refactor (acc #2/#3) |
| SasD23 | scout | D-23 live: win→reload→Next Opponent; validSave rejects corrupt save |
| SasD2728 | sentinel | D-27 reload double-dip + D-28 duplicate purchase — live verify |
| SasD2930 | scout | D-29 Buckler reachable at gate 2; D-30 replay exploit status |
| SasD31 | scout | D-31: `<img onerror>` name → inert textContent |
| SasProto | critic | prototypes/swords-and-sandals card claims vs html (file://) |
| ShmupD32Live | sentinel | window-release fix live, both apps, touch emulation |
| ShmupTypes | scout | D-38: per-type enemy colors live, both packs |
| ShmupSimChurn | revenger | static: sim.ts/packs.ts diff — boss names (D-37)? wave clamp (D-36)? |
| ShmupReplicaEnd | sentinel | frontier: replica gameover + ch2 boss |
| HardestBoot | scout | file:// boot, menu/select, save keys, controls incl touch drag, console errors |
| HardestEngine | revenger | static: engine.js/game.js vs LEVEL-FORMAT.md; 240Hz; collision; save schema |
| HardestValidate | executor | `node hardest/validate.mjs` — corpus gate 32/32 claim (read-only run) |
| HardestLvA | scout | levels 1–8 browser-clear via autopilot/scripted input |
| HardestLvB | scout | levels 9–16 |
| HardestLvC | scout | levels 17–24 |
| HardestLvD | scout | levels 25–32 |
| HardestAdversarial | sentinel | softlocks: pause-in-death, restart-in-pause, teleport/door edges, corrupt save, medal edges |
| ProtoChickenD22 | critic | D-22 re-verify on edited bytes + combat watch |
| DocsXref2 | reviewer | D-40 reconciliation status post-docs-r8; DM-crate divergence flag |

### M2 — Judge + integrate
**Does:** score lanes vs axes; live spot-check any FAIL claim before accepting; update divergence.md status board; write r05-verdict.md.
**Gate:** every accepted defect has artifact; every fix-verdict cites evidence.

### M3 — Ship + report + receipt
**Does:** path-scoped commit `verification/` + `.ufo/scopes/maga-verify/`; report → `.ufo/results/maga-verify-r5.md`; receipt with `iteration.decision: continue`; `ufo-sighting complete`.

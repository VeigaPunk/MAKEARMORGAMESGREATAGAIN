# RUNTIME VERDICT — burger-tycoon deep probe (round 4)
**Build:** uncommitted `apps/burger-tycoon` (forge `f8449eb` tree) · **URL:** http://localhost:5175 · **Env:** Linux · headless Chromium · 2026-09-22
**Spec:** `01-design-docs/02-concept-specs/03-mcdonalds-game.md` acceptance #1/#2/#3/#5/#7

## Verdict: PASS — all five probed acceptance items green

| Acceptance | Result | Evidence |
|------------|--------|----------|
| #1 four panes reachable, shared economy <2min | **PASS** (lane BurgerBoot) — keys 1-4 AND DOM tabs switch all panes; Sow soy +15 crops and Buy cattle −$80/+5 mutated shared `SimState` at t≤25s | `r04-BurgerBoot-pane*.png`, `r04-BurgerBoot-action-*.png` |
| #2 dirty action ↑profit +↑backlash | **PASS** — `DIRTY: Cheap feed` click → `dirty.cheapFeed=1`, event logged; backlash climbed 0→74 | `r04-burger-dirty-click.webp`, state dumps |
| #3 forced failure demonstrable | **PASS** — full causal chain live: dirty toggles → DISEASE OUTBREAK ×2 (t=71s,104s, herd culled rep −12) → backlash>60 rep drain → rep 0 → `GAME OVER: REPUTATION COLLAPSE` at **t=135s**; `over=true`, overlay + restart prompt rendered | `r04-burger-collapse.webp`, event log |
| #5 no McDonald's marks | **PASS** — all UI strings Burger Tycoon-safe; only compliance comments mention the mark | lane grep + screenshots |
| #7 sim runs while idle | **PASS** — unattended: cash 500→551, board 0→20 over ~51s (lane BurgerCollapse baseline + my t-samples) | state dumps |

## Refuted lane claim
- BurgerCollapse reported "dirty buttons unclickable via real input" — **REFUTED**: L1 re-probe clicked `DIRTY: Cheap feed` at canvas hit region (logical 24,144,560×48 → screen 502,366) and `dirty.cheapFeed` flipped to 1 with event log entry. Lane's click coordinates missed the hit region; hit-test itself is correct (`main.ts:107-117`, `hits` rebuilt per frame at `:149-157`).

## Observed timeline (all-dirty run, L1 direct)
```
t=50s  cash 470  rep 70  backlash 6   disease 7.7
t=68s  cash 488  rep 70  backlash 14  disease 18.1
t=88s  cash 508  rep 58  backlash 38  DISEASE OUTBREAK (71s) rep -12
t=108s cash 489  rep 41  backlash 62  OUTBREAK (104s) rep -12, profit 2.2
t=128s cash 466  rep 11  backlash 71
t=135s rep 0 → GAME OVER: REPUTATION COLLAPSE — activists shut you down
```
`BEST 135s` persisted (localStorage best-survival). Restart path: overlay invites click/tap/SPACE — `main.ts:109-119`.

## Notes
- `?debug` exposes `window.__maga = {sim, setPane, input, sfx}` — good verification hook; boxhead lacks an equivalent.
- Digit4→'action' remap (`main.ts:35-36`) makes all 4 panes keyboard-reachable; marked TBD ARCADE — consistent with spec.
- Proto card `prototypes/burger-tycoon.md` claims hold for the APP too: same causal chain, different constants (app collapse 135s vs proto 72s — pacing differs, mechanism identical).

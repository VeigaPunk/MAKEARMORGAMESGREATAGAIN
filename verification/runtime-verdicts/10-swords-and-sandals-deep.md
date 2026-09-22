# RUNTIME VERDICT — swords-and-sandals deep probe (round 4)
**Build:** uncommitted `apps/swords-and-sandals` · **URL:** http://localhost:5178 · **Env:** Linux · headless Chromium · 2026-09-22
**Spec:** `01-design-docs/02-concept-specs/05-swords-and-sandals.md` · Lanes: SasDeep (runtime) + SasStatic (reconstruction)

## Verdict: PARTIAL — loop works; persistence layer has multiple defects

## D-23 root cause CORRECTED (was: "defeated not persisted")
`persist()` at `main.ts:13` DOES save `{gladiator, defeated}` — r3's filing was wrong on that point. The real defect is the **load path**: `let defeated = 0` at `main.ts:11` never restores `saveData.defeated`, and `mode` always initializes `'create'` (`main.ts:12`, `render()` at `:29`).
**Observed (live, SasDeep):** after victory + reload, app opens CREATE (not hub) with persisted Gold 36/XP 44/Lv 2; `Enter the Arena` disabled until 6 points re-allocated. Saved ladder progress is on disk but unreachable.

## New findings (SasStatic reconstruction + SasDeep runtime)

### D-27 · DEFECT — Reload double-dip: +6 free stat points per reload
`mode='create'` on every boot + points reset to 6 (`main.ts:11-12`) → each reload grants a fresh 6-point allocation on top of the persisted gladiator. Infinite stat inflation via refresh. Compounds D-23.

### D-28 · DEFECT — Duplicate shop purchases charge full price for a no-op
Bought items never disabled (`main.ts:20`); second buy of the same item charges full gold for `Math.max` no-op. Spec copy says "buy one item" — unlimited rebuy is both a copy mismatch and an economy hole.

### D-29 · NOTE — Imperial Buckler gate unreachable until ladder complete
Buckler requires L3 (`main.ts:9,14,24`) but L3 is only reachable post-ladder-completion — the item is effectively dead content in the current build.

### D-30 · DEFECT — Endless complete-screen replay, unbounded reward
Complete screen can be replayed indefinitely; reward `18 + defeated*8` gold each time (`main.ts:21,24`) — unbounded gold exploit.

### D-31 · NOTE — Unescaped `g.name` into innerHTML (XSS surface)
Gladiator name interpolates raw into `innerHTML` (`main.ts:17-18`). Local-only save, so self-XSS — but any future shared/imported save becomes an injection vector. [INFERENCE on exploitability beyond self]

### D-24 · WATCH — opponent HP freeze NOT reproduced
SasDeep ran a full bout: `Tin Can Tim 34/34` decremented correctly (−16/hit) to victory. Original single observation stays an unreproduced watch item.

### Minor
- Potions finite, never restocked (`main.ts:22`); `'shoot'` SFX plays on sword hit; no miss SFX; dead code: turn counter, unused scale/off (`main.ts:21-22,25`); no save-reset UI; no keyboard controls (mouse-only — spec divergence if keyboard expected).

## Spec compliance (SasStatic)
All 7 acceptance hooks have code paths; divergences: no keyboard input, Buckler gate timing (D-29), "buy one item" copy vs unlimited buys (D-28), D-23/D-27 violating acceptance #7 (local persistence) spirit.

## Evidence
- Screenshots: `r04-SasDeep-arena-start.png`, `r04-SasDeep-hits.png`, `r04-SasDeep-reload-after-win.png` (lane-reported paths; browser tool surfaced scratch paths — see tooling note in r04 verdict).
- Runtime: bout victory → reload → CREATE screen with persisted stats, arena gated behind re-allocation.
- Static: full state machine + persistence map, `main.ts` line-cited above.

# r05 — BurgerGrid: burger-tycoon drawPane grid refactor verification

Lane: BurgerGrid (leaf, no subagents) · Server :5175 · Verified 2026-09-22 18:00–18:25 (-03)
Source bytes: `main.ts` md5 fb374d4d…, `sim.ts` md5 57ba55e6… — both mtime 17:42, **before** verification began; bytes read = bytes tested = bytes on disk.

## Verdict

**PASS**

Grid refactor works as specified: at canvas width ≥ 900px all four panes (FARMLAND / FEEDLOT / RESTAURANT / HQ) render simultaneously in a 2×2 grid, every drawn button's hit region aligns with its drawn rect (10/10 actions fire with exact expected state deltas on real pointer clicks), and `sim.act()` correctly returns null on unmet preconditions — no log entry, no state consumption. Single-pane fallback below 900px still works with DOM tab switching. Zero console errors.

## Evidence

### 1. Grid layout (default 1365×768 viewport, `cv.clientWidth` = 960 ≥ 900 → grid)
- All 4 panes visible at once in 2×2 grid: FARMLAND top-left (active highlight, 3px blue border), FEEDLOT top-right, RESTAURANT bottom-left, HQ bottom-right. Footer: "Grid view · keys 1-4 highlight panes · click actions · sim runs while idle".
- Drawn geometry matches code (`main.ts` `draw()`/`drawPane`): pw=480, ph=190; buttons 270×34 at (paneX+14, paneY+38+i·41); meters at paneX+284.
- Tab DOM chrome still present; grid is additive, not a replacement of the tab bar.
- Artifact: `verification/evidence/r05-BurgerGrid-01-layout-grid.png`

### 2. Hit-region alignment — real pointer events (mouse move/down/up, release-tap), per action

All clicks at drawn-button centers (logical coords; CSS = logical × scale, scale=1 in grid mode). State read via `?debug` `__maga.sim.s` before/after each click (~1 tick apart; tick drift visible as small non-action deltas).

| Pane.Action | Click (logical) | Measured delta | Logged |
|---|---|---|---|
| farm.Sow soy | (149, 55) | crops +15.08 | ✓ `[124s] Sow soy field (+15 crops)` |
| farm.Buy cattle | (149, 96) | cash −80.23, cattle +4.99 | ✓ |
| farm.Bulldoze | (149, 137) | dirty.deforest 0→1, backlash starts rising | ✓ |
| feed.Slaughter | (629, 55) | cattle −2.03, patties +3.98 | ✓ |
| feed.Cheap feed | (629, 96) | dirty.cheapFeed 0→1, disease 0→0.06 | ✓ |
| rest.Promo | (149, 245) | cash −39.55, demand 1→1.3 | ✓ |
| rest.Cut corners | (149, 286) | dirty.cutCorners 0→1 | ✓ |
| hq.Marketing | (629, 245) | cash −116.33, demand 1.3→1.9 | ✓ |
| hq.PR spin | (629, 286) | cash −96.24, backlash 2.01→0.31 | ✓ |
| hq.Bribe (cash 500) | (629, 327) | cash −199.8, rep 70→66 | ✓ |

Every action's delta matches its `sim.ts` contract exactly; hit regions align with drawn buttons in all four grid panes.

### 3. Edge/boundary probes on farm.Sow button (drawn rect x 14..284, y 38..72)

- Fires: (16, 55) left+2 · (282, 55) right−2 · (149, 40) top+2 · (149, 70) bottom−2 — all +15 crops, all inside hit region.
- Silent (no log, no state delta beyond tick drift): (149, 36) 2px above · (12, 55) 2px left · (149, 75.5) in the 7px gap between rows · (400, 51) meter area · (7, 55) pane margin.
- Hit regions are exactly the drawn rects; nothing over-fires into gaps/meters/margins.

### 4. No-op contract (`act()` returns null when state unchanged)

Two independent precondition-fail cases, both via real pointer clicks:

1. **Bribe officials (−$200) at cash $120.80**: click at (629, 327) → cash delta +4.7 (pure tick earnings drift), rep unchanged, **no log entry** (`log0` unchanged). `act()` returned null.
2. **Emergency slaughter at cattle 1.27 (< 2)**: click at (629, 55) → cattle 1.27→1.26, patties 12.83→12.74 (tick drift only), **no log entry**.
3. Negative-zone controls (gap/meter/margin/above-button): zero log, zero action deltas — confirms the click battery's attribution.

Per `main.ts`, the hit fn gates `sfx.preset('ui')` on `act() !== null` — code-verified; audio itself not audible in headless [inference].

- Artifacts: `r05-BurgerGrid-02-after-clicks.png`, `r05-BurgerGrid-03-noop-and-log.png`

### 5. Keyboard pane highlight (grid mode)

Real `Digit2` keypress → tab[1] FEEDLOT className `'on'`; `Digit4` → tab[3] HQ `'on'`. Digit4→`action` remap works; all four panes keyboard-reachable.

### 6. Fallback single-pane mode (viewport emulated 700×900 → `cv.clientWidth` = 700 < 900)

- Single pane drawn; real click on DOM tab "3 RESTAURANT" moved `'on'` 0→2; real pointer click on Promo (scale-aware CSS point for logical (294, 62)) fired: demand 1.0→1.3, logged ✓.
- Artifacts: `r05-BurgerGrid-04-narrow-singlepane.png`, `r05-BurgerGrid-05-narrow-after-clicks.png`

### 7. Sim dynamics observed incidentally (correct per sim.ts, not defects)

- BOARD INTERVENTION at boardPressure > 100: −$60, pressure reset 40 (log `[120s] BOARD INTERVENTION…`).
- All 3 dirty toggles ON → backlash → 100 → rep decay → `GAME OVER: REPUTATION COLLAPSE` at 168s; any tap then restarts (fresh run cash 500, rep 70, dirty cleared) — matches on-canvas restart instructions.

### 8. Console

- 0 errors, 0 warnings across the full session (both tabs); only `[vite] connecting/connected` debug lines; 0 dropped entries. Page errors: none.

## Defects

**None new.** The drawPane grid refactor (grid layout, per-pane hit rects, `act()` null contract) is correct at both tested widths.

Non-defect observations (no action requested):
- Hit rects are polled against the previous frame's `hits[]` (pollInput runs before draw rebuilds `hits`); layout is static so this is benign [inference].
- Hit test uses strict inequalities — the exact boundary pixel of each button is dead; cosmetic only.

## Notes

- Tab discipline: initially used my own tab `BurgerGrid` (no cross-lane contamination observed — all state deltas trace to my own clicks); migrated to `BurgerGrid-mine` after the parent's naming directive. I never touched `hardest/` or any sibling's tab.
- Page HMR-reloaded once mid-session (Vite); burger sources unchanged since 17:42 (pre-verification), so no evidence contamination.
- One narrow-mode promo click initially missed because I aimed with grid-scale (1.0) offsets on a 0.729-scaled canvas — instrumentation error, corrected and re-verified with measured trusted pointer coords; not a game defect.
- `sim.act()` snapshot compare uses `JSON.stringify(this.s)` including `t` — safe because `act()` runs synchronously between ticks.

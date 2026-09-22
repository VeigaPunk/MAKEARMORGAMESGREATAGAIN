# PROTO VERDICT — burger-tycoon.html
**maga-verify · 2026-09-22 · probe: headless Chromium, file://**

**Claimed loop:** four-pane tycoon sim (FARMLAND / FEEDLOT / RESTAURANT / HQ), click actions, sim runs while idle, dirty actions trade backlash for output. Spec: `02-concept-specs/03-mcdonalds-game.md`.

## Verdict: **PASS** (core loop runs as claimed)

| Check | Result | Evidence |
|-------|--------|----------|
| Boots, no console errors | PASS | `tab.errors()` empty |
| Sim runs while idle | PASS | CASH $502 → $515 across ~15s idle (`burger-01.png` → `burger-02-actions.png`); BOARD 1→6 |
| Click actions | PASS | "Sow soy field" clicked twice → log shows `[14s] Sow soy field (+15 crops)` ×2; CROPS 20→52 |
| Resource flow | PASS | CATTLE 10→8 while idle (feedlot consumes); PATTY STOCK 8 on restaurant pane |
| Pane switching | PASS | keys 1–4 / tab bar: FARMLAND → RESTAURANT screenshot (`burger-03-restaurant.png`) shows distinct pane content |
| Dirty actions | **PASS** (r02 build `3a8fa4f`) | "DIRTY: Bulldoze rainforest" clicked → `deforest=1`, backlash 0→10.6 over ~12s, crops boosted (21→43.7), "rainforest burning…" rendered (`r01-bt-backlash.webp`). Rep-collapse-at-72s claim from proto card not independently reproduced — backlash accumulates but rep held at 70 in my 12s window; mechanic verified, end-state claim [INFERENCE from proto card] |

**Re-probe note (r02 `3a8fa4f`):** new build exposes `window.__proto.S` read-only state hook — used for state reads only; all actions driven through real canvas clicks. No console errors.

# RT-05 — impossible + burger-tycoon app smoke (forge `f8449eb`)

**Build:** `f8449eb` (maga-forge R03). **Method:** `?debug` hooks, real key/click events, state reads.
**Date:** 2026-09-22 (round 2)

## Impossible Game (:5174) — PASS (smoke)

| Probe | Result |
|-------|--------|
| Boot, no console errors | PASS — `__maga` hook live, 0 pageerrors |
| Auto-run + death/respawn | PASS — deaths 2→3, attempt 3→4, x reset to 48 |
| `jump()` | PASS — y 396→253 mid-jump |
| HUD | PASS — ATTEMPT/DEATHS/progress%/BEST render (`r02-impossible.png`) |

## Burger Tycoon (:5175) — PASS (smoke)

| Probe | Result |
|-------|--------|
| Boot, no console errors | PASS — `__maga.sim` live, 0 pageerrors |
| Sim ticks while idle | PASS — t advances, cash/crops/cattle/patties flow |
| `act('farm',0)` sow | PASS — crops +15 instantly |
| `act('farm',2)` dirty bulldoze | PASS — `dirty.deforest=1`, backlash 0→6.8 over 4s (matches proto-verified dirty→backlash loop) |
| 4-pane DOM chrome | PASS — FARMLAND/FEEDLOT/RESTAURANT/HQ tabs render (`r02-burger.png`) |

## Notes
- `sim.actions` keyed by pane; `act(pane, idx)` — index-based, not id-based.
- `rates.crop` field stays 1.2 after deforest while observed accrual ≈3.2/s —
  the 2.2x applies to effective rate, not the display field. Cosmetic note.
- Neither app has a checklist yet (boxhead-only acceptance doc); verdicts are
  boot/loop smoke, not acceptance.

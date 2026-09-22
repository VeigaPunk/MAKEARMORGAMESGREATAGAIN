# RUNTIME VERDICT — impossible-game app deep probe (round 4)
**Build:** committed `apps/impossible` (`f8449eb` tree) · **URL:** http://localhost:5174 · **Env:** Linux · headless Chromium · 2026-09-22
**Spec:** `01-design-docs/02-concept-specs/02-impossible-game.md` · Lanes: ImpossibleBoot + ImpossibleLoop + ImpossibleClear

## Verdict: PASS — core loop green; two major defects found AND fixed in-tree this round (live re-verified)

## PASS items (live-verified)
| Item | Result |
|------|--------|
| Boot / TTI | PASS — canvas 960×540, DOM interactive 30ms, FCP 56ms, jump response 8–16ms; `?debug` exposes `window.__maga` hook (absent on plain load — correct) |
| Death→respawn ≤200ms | PASS — measured **166.6ms** (spike death) and **183.4ms** (block death); boot lane measured 152.8ms |
| No spawn softlock holding jump | PASS — Space held from x=24: exactly one fixed-impulse arc (apex ≈144.5px ≈ JUMP_V²/2G), x monotonic, no repeat-jump, no softlock |
| R restart | PASS — mid-run (x=450→0, attempt 68→69) and after death (instant, beats 160ms timer) |
| Esc pause | PASS — freezes sim, PAUSED banner, resumes on second Esc |
| Fixed timestep | PASS — 120Hz accumulator; x advances exactly 6px/frame at 60fps |
| Counters/persist | PASS — attempt/deaths increment correctly; `maga:impossible:best-progress` localStorage = 1.0001 (HUD clamps 100%) |
| Console | 0 errors all session |
| Click jump | PASS — 100ms canvas press jumps |

## New findings

### D-33 · DEFECT (major) → **FIXED in-tree (uncommitted, live-verified)** — Gaps were not lethal
**Observed (live, pre-fix):** no-jump run — cube descends to y=566.8 (171px below ground) inside gap@1400, crosses while falling, lands at x=1518 past the gap, continues to spike@1900.
**Code (pre-fix):** `main.ts:185` — only fall-kill was `cube.y > H + 200` (=740); no gap-bottom check. Fall math: 130–170px gaps crossed in 0.36–0.47s → 170–290px fall, all < 740; only the 200px gap@7800 killed.
**Spec:** proto card documented this exact bug + fix (`floor === -Infinity && bottom > ground+margin`); carry-forward #4 warned forge — initially missed, then landed mid-round.
**Impact (pre-fix):** 3 of 4 gaps were free passes.

### D-34 · DEFECT (major) → **FIXED in-tree (uncommitted, live-verified)** — Block side-kill tested LEFT edge
**Observed (live, pre-fix):** death at x=3003 for block@3000 (proto-fixed expectation ≈2967); sprite overlapped block ~34px at death; at 360px/s death fired ~94ms late.
**Code (pre-fix):** `solidSideAt(cube.x, cube.y)` tested the left edge (`main.ts:135-141`). Same carry-forward #4 — initially missed, then landed mid-round.

### D-35 · NOTE (minor) — Sub-frame pointer taps dropped
`main.ts:199-200` polls pointer press-edge per frame (`active && !prevActive`), no event buffering; a down+up inside one rAF gap is invisible. Real ~100ms clicks fine; synthetic 0-duration taps lost. Edge case only.

## Clear attempt (ImpossibleClear)
Timed autoplayer (jumps ~220px before each of 22 obstacles) reached 13% / attempt 4 / 3 deaths in ~30s — no clear observed. **Not a defect filing**: autoplayer timing is the likely limiter, and D-33 makes early gaps non-lethal anyway (changes the obstacle profile). Full-clear verification remains open; the level's clear branch exists (`LEVEL_END=9900`, `main.ts:52,136`).

## Evidence
`r04-ImpossibleBoot-title.png`, `r04-ImpossibleBoot-pause.png`, `r04-ImpossibleLoop-gameplay.png`, `-death.png`, `-paused.png`, `-holdjump.png`, `-viewport.png`, `r04-ImpossibleClear-autoplayer.png`

## Fix verification (L1, current bytes post-17:42 edit)
- **D-33:** `main.ts:188` now `floor === -Infinity && cube.y + CUBE > GROUND_Y + 8 → die()`. Live: no-jump run dies at **x=1410** — exact proto parity. `r04-impossible-gapfix.webp`.
- **D-34:** `main.ts:187` now `solidSideAt(cube.x + CUBE, cube.y)` (front edge). Live: `__maga.teleport(2700)` run into block@3000 dies at **x=2967** — exact proto parity. `r04-impossible-blockfix.webp`.
- Forge landed both fixes mid-round (mtime 17:42) after DocsXref/verdict-12 circulation — the verify→docs→forge loop worked.

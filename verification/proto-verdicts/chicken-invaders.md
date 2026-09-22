# PROTO verdict — chicken-invaders.html

**Verdict: FAIL — does not run.** **Date:** 2026-09-22 (round 2)
**File:** `prototypes/chicken-invaders.html` (497 lines, replica + cluck packs)

## Evidence
- `pageerror`: `ReferenceError: ox is not defined` at `spawnWave` (line 91),
  thrown from `startGame` (line 85) and again from `step` (line 265).
- `spawnWave` uses `ox`, `oy`, `cw`, `ch2` — **none are defined anywhere** in the file.
- Consequence: `chickens` stays `[]` → wave-clear check auto-advances `waveIdx` →
  `spawnBoss` is reached but the FIRST throw already killed the rAF loop
  (`requestAnimationFrame(frame)` at frame end never re-arms after an exception).
- Observed state after Enter: `mode='play'`, `wave=2`, `chickens=0`, `bossHp=null`,
  `score=0`, `lives=3` — canvas frozen on last title paint. Ship input dead
  (loop gone). `__proto` hook itself works (all getters live).
- Screenshots: `r02-ci-title.png` (title renders correctly), `r02-ci-play.png`
  (identical pixels — frozen).

## What this means
The claimed core loop (formation waves → eggs → gifts/food → boss → chapter clear)
**cannot execute**: no chicken ever spawns. Title screen, pack toggle, and the
`__proto` verification hook are the only working parts. This is a build defect,
not a tuning gap — one missing declaration block (formation origin/spacing
constants) blocks everything downstream.

## Spec cross-check (unverifiable until fixed)
- `RESPAWN_S=1.2`, `INVULN_S=2.0`, `LIVES_START=3`, deterministic 1st-kill gift /
  2nd-kill food, boss HP 60/100, chapter unlock via localStorage — all present in
  code but unreachable at runtime.
- Recommendation to proto lane: define `ox/oy/cw/ch2` (formation grid origin +
  cell size), re-submit; the rest of the skeleton reads coherent.

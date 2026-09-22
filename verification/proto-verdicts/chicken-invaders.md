# PROTO VERDICT — chicken-invaders.html (re-verdict, round 3)

**File:** `prototypes/chicken-invaders.html` (uncommitted, 22 547 bytes, mtime 16:48)
**Prior verdict:** FAIL — D-21 BLOCKER (`ReferenceError: ox is not defined` in `spawnWave`)
**This verdict:** **PASS** — D-21 fixed; core loop verified end-to-end.
**Method:** file:// load, headless Chromium, `__proto` state hook + pointer input.
**Evidence:** `evidence/r03-chick-play.png` (wave 1 in progress, score 500, chickens + bullets + ship visible)

## Checks

| Check | Result | Evidence |
|-------|--------|----------|
| Boot, no fatal error | PASS | `tab.errors()` empty across full session |
| `spawnWave` runs | PASS | `ox/oy/cw/ch2` now declared at line 90; 12 chickens spawned (2 rows × 6 cols, `straight` pattern) |
| Title → play transition | PASS | click on START (logical 480,352) → `mode='play'`, `chapter=1`, `wave=1`, `wavesTotal=2` |
| Fire → kills → score | PASS | pointerdown hold 4 s → `kills=3`, `score=300`; later `score=500` |
| Eggs drop | PASS | `eggs=1` observed mid-wave |
| Death → respawn | PASS | ship died to egg/contact (`shipAlive=false`, `lives` 3→2), respawned alive |
| Pack swap UI | present | `BTN.pack` + `setPack` toggles replica/cluck (not exercised to completion) |

## Notes (non-blocking)

- `__proto.wavesTotal` getter throws `TypeError` when read before `startGame`
  (`CHAPTERS[chapter-1]` with `chapter` undefined). Verification-hook hazard
  only — gameplay unaffected; proto lane may want a `?? 0` guard.
- Ship is fragile on wave-1 entry (died within ~4 s of spawn while idle).
  Consistent with "chickens dive + eggs" pressure; not a defect per se.

## Verdict: **PASS** — claimed core loop (spawn → fire → kill → score → die → respawn) runs.

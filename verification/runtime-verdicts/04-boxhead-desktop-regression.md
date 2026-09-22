# RT-04 — boxhead desktop regression (keyboard, post touch-fix diff)

**Build:** same working tree as RT-03. **Method:** 900×640 viewport, real key events, `__maga` reads.
**Date:** 2026-09-22 (round 2)

| # | Probe | Verdict | Evidence |
|---|-------|---------|----------|
| RT-4a | Space advances title → mode | PASS | `title→mode` |
| RT-4b | Digit1 selects solo | PASS w/ quirk | `mode→playing` directly — see D-20 |
| RT-4c | WASD/arrows move | PASS | `p1.down=['right']`, axis {1,0}, pos +12.5px in 0.3s |
| RT-4d | Space fires | PASS | (verified via `isDown('fire')` path; earlier negative was dead-player artifact) |
| RT-4e | SPACE retries from dead | PASS | `dead→playing` |
| RT-4f | M (action) exits dead → mode | PASS | `dead→mode`; exposed D-18 banner bleed |
| RT-4g | **D-20** held key bleeds across mode→room | **DEFECT (minor)** | one Digit1 press → solo AND room1; room select never shown. `pressed` set persists across the state transition within the same key hold |

## Notes
- D-20 severity: minor — solo players lose room-2 access via keyboard unless they
  tap Digit1 quickly vs hold; tap-to-pick still works. Recommend consuming
  `pressed` on state transitions or requiring fresh press per screen.

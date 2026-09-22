## Verdict (STATIC-ONLY)

D-16 clamp is present and structurally protects invulnerability from a single large wall-time frame, but live hit-count/HP behavior could not be exercised reliably in this lane because the shared browser repeatedly navigated the named tab to sibling game surfaces; the expected `?debug` hook was also absent at runtime.

## Evidence

- `MAGA-everything/02-code/armor-games/apps/boxhead/src/game.ts:355-365` assigns `const gameplayDt = Math.min(dt, 0.05)` and passes the clamped value to player, spawning, zombie, bullet, prop, and score updates.
- `MAGA-everything/02-code/armor-games/apps/boxhead/src/entities.ts:66-72` decrements `Player.invuln` only through `tickFlash(dt)`. Therefore a resumed/background frame with `dt=5` can decrement invulnerability by at most 0.05 seconds per tick; it cannot expire a 0.8s hit window in one callback. (Static inference.)
- `game.ts:524-549` checks `s.p.invuln > 0` before every zombie/player collision and sets `s.p.invuln = 0.8` after the first accepted hit. Thus stacked zombies in one `updateZombies` pass should produce at most one damage event while invulnerability remains positive. (Static inference.)
- `game.ts:595-612` applies the same guard for projectile hits, with a 0.35s post-hit window.
- Bootstrap uses `game.tick(ticker.deltaMS / 1000)` at `MAGA-everything/02-code/armor-games/apps/boxhead/src/main.ts:82-84`; the clamp is therefore on the common runtime path.
- Screenshot artifact: `verification/evidence/r05-BoxheadD16-current.png` (boxhead room-select surface captured while verifying navigation).
- Runtime attempt: `http://localhost:5173/?debug` loaded title `Boxhead — MAGA native replica`, but `window.__maga` was not present and no console/error output exposed a usable hook. Browser screenshots then showed sibling game surfaces after keyboard interaction despite unique tab names, so no honest live HP/hit timestamp claim is made.

## Defects

None newly demonstrated. No D-41+ finding: the source-level D-16 fix addresses the specified large-`dt` expiration and same-frame stacked-zombie multi-hit paths.

## Notes

The clamp intentionally freezes gameplay-time progression during throttling rather than advancing wall time; this is consistent with the requested protection, but a live acceptance run should still verify resume behavior in an uncontended browser session with the debug hook actually exposed.

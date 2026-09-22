# PROTO VERDICT — claim-card cross-verification (round 4)
**Scope:** independently re-verify proto lane's own claim cards against the prototype bytes. Real input events only; `window.__proto` read hook; no state injection.

## impossible-game.md vs impossible-game.html — MOSTLY VERIFIED (1 claim unproven)
| Card claim | Result |
|---|---|
| Auto-run 360px/s | CONFIRMED (`:26` constant + observed motion) |
| Fixed-impulse jump, Space/Up/Z/click | CONFIRMED (`:28`, `:68-74`) |
| Death→respawn ≤200ms (card: 161ms) | CONFIRMED at **168ms** measured; impl declares 160ms — card's exact 161 not reproduced, within tolerance |
| No-jump dies at x=1410 (gap) | CONFIRMED |
| Spike death ~x=1890 | CONFIRMED |
| Block-side death ~x=2967 | CONFIRMED |
| 120Hz fixed timestep | CONFIRMED (`DT=1/120`, accumulator `:147-150`) |
| Full clear x=9900 via 32 timed jumps | **NOT VERIFIED** — critic autoplayer accumulated deaths, no clear. Clear branch exists (`:52,:136`); claim stands unrefuted but unproven this round |
| No spawn softlock holding jump | NOT VERIFIED conclusively — code ignores keydown repeats (`:69`), finite buffer (`:127-130`); suggestive, not observed |

## burger-tycoon.md vs burger-tycoon.html — PARTIAL (mechanism confirmed, exact figures unverified)
| Card claim | Result |
|---|---|
| 4 panes via tabs/keys 1-4, shared economy | CONFIRMED — DOM tabs `1 FARMLAND…4 HQ`; `__proto.S` single state |
| Idle drift (cash $500→$515/~15s, board 0→6) | CONFIRMED — t=13.9s: cash 513.91, boardPressure 5.57, profit 5.0/s |
| All-dirty → profit $15.6/s, backlash→100 in ~40s | UNVERIFIED this round — shared-browser tab collision contaminated the lane's causal-chain run |
| Disease outbreak at disease>20 | SOURCE-CONFIRMED (`:71-72`), not runtime-reproduced |
| Rep collapse GAME OVER ~72s | SOURCE-CONFIRMED (`:91-96`), not runtime-reproduced |
| `S.over` halts sim | SOURCE-CONFIRMED (`:52-53`) |
| No McDonald's marks | CONFIRMED — branding clean |

**Note:** the APP (`apps/burger-tycoon`) independently demonstrated the same causal chain live this round (disease outbreaks → backlash → rep collapse at t=135s) — mechanism verified end-to-end on the monorepo side; proto's exact timings remain card-claims.

## chicken-invaders.html — D-22 STILL OPEN + regression note
- **D-22 re-confirmed:** title-screen `window.__proto` wholesale read still throws `TypeError: Cannot read properties of undefined (reading 'length')` via `get wavesTotal` (`prototypes/chicken-invaders.html:479-482` — `CHAPTERS[chapter-1]` with `chapter` undefined). Mid-game the hook reads fine (`mode:play, chapter:1, wave:1, wavesTotal:2, chickens:12`).
- **Regression watch:** critic lane could not score a kill via held Space/Z (score 0, chickens 12 after input; one egg observed) before the frame detached. r3 verified the full loop on these same bytes — likely a focus/input artifact of shared-browser contention, not a code change (file mtime predates r3 commit). Flagged UNRESOLVED, not a defect filing.
- No `chicken-invaders.md` claim card exists.

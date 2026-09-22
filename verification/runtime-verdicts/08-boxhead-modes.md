# RUNTIME VERDICT — boxhead modes + boot budget (round 4)
**Build:** working tree post-`f8449eb` (unchanged since r3) · **URL:** http://localhost:5173 · **Env:** Linux · headless Chromium 1280×800 · desktop keys · 2026-09-22

## Verdict: PASS with new findings (D-25 DEFECT, D-26 NOTE)

| Item | Result | Evidence |
|------|--------|----------|
| A4 cold restart ≤3s | **PASS** — reload→canvas+menu interactive in **109ms** | `r04-boxhead-title.webp` |
| B11 mode select | PASS — solo/co-op/deathmatch all reachable | `r04-boxhead-title.webp` |
| B12 co-op simultaneous | **PASS** — P1 (white) moved right + fired (Space) while P2 (blue) moved left + fired (KeyL); HUD `P2 HP 100 AMMO 24→22` | `r04-boxhead-coop-start.webp`, `r04-boxhead-coop-simul.webp` |
| B13 deathmatch | **PARTIAL** — mutual damage verified (P1 20HP/P2 20HP after exchange), kill counter works (P1 1·P2 0), loser respawns 1.4s at 100HP/24AMMO. Match-end rule (first to 5) verified in code `game.ts:584` but NOT exercised live — see D-25 for why | `r04-boxhead-dm-start.webp`, `-dm-exchange.webp`, `-dm-kill.webp`, `-dm-respawn.webp`, `-dm-end.webp` |
| E5 focus | **PASS** — canvas click then KeyD still moved P1 | `r04-boxhead-e5-focus.webp` |

## New findings

### D-25 · DEFECT — Deathmatch ammo starvation: match can become unfinishable
**Observed (live):** P1 exhausted all 24 ammo reaching 1 kill (`r04-boxhead-dm-end.webp`: `P1 HP 20 AMMO 0`).
**Code:** bullets deal 10 HP (`game.ts:575`); kill = 10 hits; `DM_TARGET_KILLS=5` needs 50 hits; a life carries 24 rounds → max 2.4 kills/life. Ammo refills ONLY on respawn (`game.ts:407`); the crate spawner is gated `mode !== 'deathmatch'` (`game.ts:606-610`); grenade AoE kills grant no credit (`game.ts:684` stub).
**Consequence:** a match is only finishable while at least one player still has ammo. If both players empty their magazines without dying (easy: 24 misses), the match can never end — no crates, no melee, no timer, no exit (Esc/P inert, see D-26). B13's "match ends on agreed rule" fails in the mutual-exhaustion state.
**Classification:** built wrong — ammo economy never balanced for DM. Options for forge: DM crates, ammo regen, or a round timer.

### D-26 · NOTE — Pause bound but never consumed (Esc/P inert)
**Observed:** `input.ts:30` binds `Escape`/`KeyP` → `'pause'`; zero references to `'pause'` anywhere in `apps/boxhead/src/` (grep count 0). Impossible (`main.ts:202`) and shmup-core (`boot.ts:135`) DO consume it — boxhead is the outlier. No pause state exists; Esc does nothing mid-run and there is no mid-run exit to menu.
**Classification:** dead binding / missing feature. Checklist has no explicit pause item (concept §Controls TBD) — NOTE not FAIL, but combined with D-25 a stuck DM has no escape hatch short of reload.

## Method notes
- No `window.__maga` hook in boxhead (unlike burger/shmup `?debug` hooks) — all state read from HUD pixels.
- Shared-browser contention: lane tabs briefly hijacked this tab mid-probe; all evidence above re-captured on a re-verified `boxhead-r4` tab.

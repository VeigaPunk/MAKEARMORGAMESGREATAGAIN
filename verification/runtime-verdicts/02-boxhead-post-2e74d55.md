# RUNTIME VERDICT 02 — boxhead live probes vs committed `2e74d55`
**maga-verify · 2026-09-22 · probe 3**
**Build:** `2e74d55` (committed) · **Env:** headless Chromium via CDP · `http://localhost:5173/?debug` · Linux x64
**Evidence dir:** `verification/evidence/` (r01-*.webp/png)

## Re-verification of forge fixes claimed in `2e74d55`

| Fix | Claim | Live result | Evidence |
|-----|-------|-------------|----------|
| D-04 fractional downscale | portrait phone no longer crops stage | **CONFIRMED** — 390×844 portrait: canvas 390×244 uniform fit, full stage + FIRE zone on-screen; landscape 844×390: 589×368 centered | `r01-portrait.webp`, `r01-landscape.webp` |
| D-12 letterbox double-centering | canvas centered, not offset twice | **CONFIRMED** — canvas x=320 at 1280×800 (correct); fixed `left/top` positioning | `r01-title.png` |
| D-13 stale banner | `banner.text=''` restored in `startRun` | **CONFIRMED** — dead → Space → `state:'playing'`, `banner.text:''`; no OVERRUN overlay during play | `r01-banner-clear.webp` |

## Checklist items newly exercised live (this probe)

| ID | Item | Verdict | Evidence |
|----|------|---------|----------|
| B3 | waves 1–3 completable | **PASS** | wave 1→2→3→`victory` driven end-to-end; banner `WAVE 3 CLEARED (SOLO) / SCORE 300 · BEST 300` (`r01-victory.webp`). Kill path real: held Space → score 0→300, streak ×3, zombies culled by bullets (`r01-kill.webp`) |
| B5 | ammo crate pickup | **PASS** | crate spawned (12s cadence), contact → ammo 2→18, crate consumed (`r01-crate.webp`) |
| B6 | barrel detonation | **PASS** | bullet→fuse→blast killed adjacent zombie, score +100 (`r01-barrel.webp`) |
| B9 | death→score→restart | **PASS (re-confirmed)** | hp 0 → `dead`, banner `OVERRUN ON WAVE 1 (OPEN YARD) / SCORE 0 · BEST 300` (`r01-dead.webp`); Space → `playing` |
| B10 | high score persist | **PASS** | `localStorage['maga:boxhead:highscore']="300"` after victory; `BEST 300` on next run |
| B13 | deathmatch full match | **PASS** | driven to `P1 WINS THE DEATHMATCH 5–0`, stub-rule banner shown, no crash (`r01-dm-end.webp`) |
| F3 | ~60fps | **PASS (partial)** | 60.3 fps over 3s live wave. Caveat D-08 stands: 50–100-mover scenario unreachable (wave tables cap 14) |
| F6 | heap across 3 restarts | **PASS** | usedJSHeapSize 8→9→9 MB, flat |
| F2 | transfer size | **PASS** | ~4KB transferred on reload (cached); vendored pixi ~1.7MB uncompressed — within "sub-few-MB" |

## Defects confirmed STILL OPEN at `2e74d55`

| # | Defect | Severity | Evidence |
|---|--------|----------|----------|
| D-14 | **Touch cannot restart/exit after run ends** — `dead`/`victory` states read only `wasPressed('fire'/'action')` (`game.ts:309-310`); `pointer.tapped` consulted on title/mode/room but NOT end screens. Live: canvas tap on dead screen → state stays `dead`; Space → `playing`. Phone player is trapped on the death screen. | **DEFECT (C1-adjacent, loop-blocking on mobile)** | tap probe + `game.ts:309-310` |
| RT-3 | Badge wraps to ~55px at 390px wide; layout reserves `BADGE_H=22` → canvas pushed down, dead space; on landscape the wrapped badge overlaps the HUD top line | NOTE (cosmetic) | measured badge 55px vs reserved 22; `r01-landscape.webp` shows badge over `WAVE 1/3 SCORE…` line |
| RT-4 | `.mute` fixed at top:26px sits inside the 55px wrapped badge on narrow screens | NOTE (cosmetic) | `r01-portrait.webp` |
| RT-5 | `wantsFire` includes `p.active && coarse` (`game.ts:366`) — on real coarse-pointer devices ANY canvas touch (incl. movement stick) also fires. Unconfirmed under emulation (CDP reports `pointer:fine`); flagged for real-device check | SUSPECT | `game.ts:366` |
| D-15 | same as RT-5 (dedup) | — | — |

## Still queued (next round)
- Firefox matrix cell (G); real-device touch check (RT-5/D-15, C1 end-to-end on hardware)
- B4 swarm-density record (UNMEASURABLE — no threshold; screenshot evidence only)
- `apps/impossible` on :5173? No — impossible serves on :5174 (separate `dev:impossible`); boxhead checklist unaffected

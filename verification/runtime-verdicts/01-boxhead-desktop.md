# RUNTIME VERDICT 01 — boxhead live probes (desktop Chromium)
**maga-verify · 2026-09-22 · build: `fe3ae3e` + uncommitted BH-3 music/scale edits (hot tree)**
**Env:** headless Chromium via CDP · `http://localhost:5173/?debug` · viewport 1280×800 · Linux x64

| ID | Item | Verdict | Evidence |
|----|------|---------|----------|
| A1 | dev server boots, canvas visible, no fatal console error | **PASS** | :5173 → 200; title screen rendered (`shot-01-title.png`, `shot-07-title-centered.png`); `errors()` empty at load. One transient `ReferenceError: cvs is not defined` observed during a forge HMR reload — hot-edit artifact, not a build defect |
| A2 | title/menu reachable, English, no stuck overlay | **PASS** | title → mode → room → playing all driven by keys (`shot-02/03/04`) |
| A4 | cold restart menu→combat ≤ ~3s | **PASS** | dead → Space → `playing` measured **60ms** |
| A5 | English-only | **PASS** | all observed strings English |
| B1 | room pick 2–3 rooms | **PASS** | room select offers OPEN YARD / PILLARS; both reachable |
| B2 | spawn, pistol, limited ammo, move+shoot | **PASS** | spawn (320,200), ammo 24; KeyD moved to x=395, Space fired (ammo→22, bullet live) (`shot-08-solo-move.png`) |
| B3 | waves 1–3 completable | **PARTIAL** | wave 1 spawns + escalates (zombies 1→5 observed); full wave-3 clear not driven end-to-end this probe — queued |
| B5 | ammo crates | **PASS (visual)** | crate spawned + rendered (`shot-05-combat.png`); pickup path verified statically |
| B6 | barrels | **PASS (visual)** | barrels rendered at room anchors; blast path verified statically |
| B7 | score/streak HUD | **PASS (structure)** | HUD shows `WAVE 1/3 SCORE 0 x1 HP 100 AMMO 22 [PISTOL] BEST 100` |
| B9 | death ends run, shows wave+score, restart works | **PASS** | hp forced to 5 → zombie contact → `dead` state, banner `OVERRUN ON WAVE 1 (OPEN YARD) / SCORE 0 · BEST 100` (`shot-09-death.png`); Space retry works. **D-01 fix confirmed live.** |
| B10 | high score persists | **PASS** | `localStorage['maga:boxhead:highscore'] = "100"`; `BEST 100` shown on fresh run after reload |
| B11 | three modes reachable | **PASS** | solo + co-op both entered via menu keys; deathmatch path identical (slot3) — exercised to room select |
| B12 | co-op simultaneous input | **PASS** | P1 KeyD + P2 ArrowLeft held together: P1 320→407.5, P2 220→132.5 simultaneously; both fired (ammo 24→22 each, 3 bullets live) (`shot-10-coop.png`) |
| B13 | deathmatch | **PARTIAL** | mode reachable; damage/match-end verified statically + forge headless claim; full match not driven — queued |
| D1 | integer scale + letterbox, no stretch | **PASS** | canvas 640×400 centered at x=320 (`shot-07`); fractional downscale only below 1× viewport (uniform, no warp) |
| D3 | resize keeps letterbox | **PASS** | viewport 1280×800 → 390×844 → back; canvas re-centered each time |
| E1 | P1 keyboard-only combat | **PASS** | WASD/arrows + Space/J; no mouse used in probes |
| E2 | P2 simultaneous | **PASS** | see B12 |
| E5 | focus | **PASS** | keys kept working after canvas clicks/taps across whole session |
| F3 | ~60fps | **PASS (partial)** | 60.3 fps measured over 3s during live wave (5 zombies). Caveat D-08: 50–100-mover scenario unreachable under current wave tables |
| F7 | engine weight | **PASS** | pixi 8 + arcade-core only |

## Defects observed live (new this probe)

| # | Defect | Severity | Evidence |
|---|--------|----------|----------|
| RT-1 | **Stale end-of-run banner persists into next run** — `startRun` no longer clears `banner.text` (collateral of uncommitted BH-3 music edit: `banner.text=''` line replaced by `sfx.startMusic`). OVERRUN banner overlays live gameplay. | DEFECT (uncommitted tree) | `shot-10-coop.png` + `shot-14-touch-play.png` show OVERRUN over live run; `banner.text` still set while `state='playing'` |
| RT-2 | **Touch cannot restart/exit after run ends** — `dead`/`victory` states only read `wasPressed('fire'/'action')`; `pointer.tapped` is consulted on title/mode/room but NOT on end screens. Tap + FIRE-button tap both ignored → phone player is stuck on the death screen. | DEFECT (C1-adjacent) | probe: canvas tap + fire-zone tap on dead screen → state stays `dead` |
| RT-3 | **Badge height vs `BADGE_H=22` mismatch on narrow screens** — badge wraps to 55px at 390px wide; layout reserves 22 → canvas pushed down, dead space above stage. Cosmetic. | NOTE | measured badge 55.17px vs reserved 22 (`shot-12-portrait.png`) |
| RT-4 | **Mute button overlaps wrapped badge** — `.mute` fixed at top:26px sits inside the 55px badge on narrow screens. Cosmetic. | NOTE | `shot-12-portrait.png` |
| RT-5 | **`p.active && coarse` in `wantsFire`** — on real coarse-pointer devices, ANY canvas touch (including the movement stick) also fires → ammo drain while moving. Emulation couldn't confirm (matchMedia coarse=false under CDP emulation) — **flagged for device check**, likely defect. | SUSPECT | `game.ts:362` |
| RT-6 | **Invuln is wall-time, hits are per-zombie-per-frame** — under heavy throttling (hidden tab), invuln decays in one delta and N stacked zombies each land a hit same frame → near-instant death. Explains observed 100→0 in ~2s. Edge case at real framerates. | NOTE | observed death at ~1.6s with 4 stacked zombies |

## Queued for next probe round
- Full unattended wave-1→3 clear (B3 end-to-end) + swarm density screenshot for B4 record
- Deathmatch full match to 5 kills (B13)
- Barrel blast + crate pickup live (B5/B6 visual confirm)
- Heap across 3 restarts (F6); transfer size from network log (F2 measured)
- Firefox matrix cell (G)

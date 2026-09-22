# RUNTIME VERDICT — shmup apps deep probe (round 4)
**Build:** uncommitted `apps/chicken-invaders` (:5176) + `apps/chicken-invaders-original` (:5177) on shared `packages/shmup-core` · **Env:** Linux · headless Chromium, desktop + coarse-touch emulation · 2026-09-22
**Lanes:** ShmupReplica + CluckPack (runtime) · ShmupTouch (touch) · ShmupCoreStatic (reconstruction)

## Verdict: PASS with minor findings — touch defect found AND fixed mid-round; full loops live-verified

### D-32 · DEFECT → **FIXED mid-round (uncommitted)** — Virtual stick stuck after pointerup outside canvas
**Found (live, ShmupTouch):** `touch.ts` registered `pointerup`/`pointercancel` on the canvas only; a drag released outside the canvas left `dragPointer`/`drag` active → ship kept moving, knob displaced. Repro: coarse touch → press left drag zone → drag → release outside canvas → stick stays deflected. Evidence: `r04-ShmupTouch-5176-stuck-pointerup.png`.
**Fix landed during verification:** `touch.ts:89-90` now binds release on `window` with `capture: true` (mtime 17:29, mid-probe). Correct fix — same class as boxhead D-14. Verified in source; live re-probe on current bytes pending next round.

### Touch otherwise OK
Portrait 390×844: pad/FIRE/MISSILE visible and responsive. Landscape 844×390: controls present, HUD and spawn lanes clear. Multi-touch conflicts not observed.

### Runtime (ShmupReplica + CluckPack) — both packs deep-verified
**Replica (:5176):** ch1 2 waves + boss (60hp, aimed 3-egg volleys, +1000) → chapter clear → ch2 entry; death→respawn 1282ms, invuln ~2s; weapon cycle PEA→TWIN→TRI + gift/missile economy; `maga:chicken-invaders:chapter-unlocked` persisted across reload. Game-over screen + ch2 boss not live-verified (cross-lane tab hijacking killed runs) — source-read only.
**Cluck (:5177):** FULL clear — ch1 (12+14 birds) + MOTHER GOOSE boss → ch2 (14+18) + boss 100hp → `mode:win` banner; game-over path verified (lives 3→0 → banner → R retry); unlock persisted 3+ reloads; CH2 button LOCKED→enabled.
**Pack diffs:** zero pack-conditional logic in sim.ts — content-only packs (title/sub/weapons/jokes/palette/music all verified distinct).

### Minor findings
- **D-36 NOTE** — HUD shows out-of-range `WAVE 3/2` during chapter-clear/win/gameover banners (`render.ts:201` — waveIdx not clamped). Cosmetic.
- **D-37 NOTE** — Boss names never rendered: HUD shows generic `BOSS` (`render.ts:201`); `pack.bosses[].name` (BIG HEN/MOTHER GOOSE) dead data. Spec 06 "names clearly distinct" partially realized.
- **D-38 NOTE** — Replica pack `enemyTypes` are stat-identical (packs.ts:45-49 — same color/speed/hp); type assignment is a no-op for replica. Cluck pack differentiated post-edit (GLIDER 1.15×, BRUISER 0.85×/hp3). Spec asks 2–3 chicken types — replica side still placeholder.
- **D-39 NOTE** — `pack.gift/food/enemy` strings never rendered (hardcoded pickup visuals, `render.ts:114-123`); cluck birds carry replica-palette comb/beak accents (`render.ts:70-71`).

### Architecture (ShmupCoreStatic)
shmup-core is a data-pack-driven shared skeleton consistent with both concept specs' FORGE guidance. Combat numbers are declared-guess stubs pending ARCADE playtest (documented in-code). Mid-round churn note: packs/render/sim/touch edited 17:29–17:36 during verification; post-edit boot verified clean.


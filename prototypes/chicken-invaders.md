# Prototype card — Chicken Invaders / Cluck Horizon (mechanics proof)

**File:** `prototypes/chicken-invaders.html` — single file, zero deps, opens via `file://`.
**Specs:** `01-design-docs/02-concept-specs/04-chicken-invaders.md` (CI2-era replica) + `06-chicken-invaders-original.md` (Cluck Horizon) · **Dossier:** `05-dossiers/chicken-invaders.md`
**Status:** verified in headless Chromium 2026-09-22 — full loop exercised via real keyboard/canvas-click input AND touch-only (`touchscreen.tap`/drag + CDP multi-touch) input; read-only `window.__proto` for observation. Zero console errors, zero external requests. R5: mobile layout B (one-thumb) added + verified; `__proto` title-screen throw (verify D-22) fixed. R6: mobile layout A (twin-thumb) added + verified; `touch-action:none` fix for multi-touch pointercancel.

## What the spec demands (cited)

- Core loop: "chapter select → wave clear (pilot ship along bottom, shoot upward, dodge egg projectiles) → collect (gift parcels cycle/upgrade weapons; drumsticks feed missile stock) → clear N waves → boss → chapter clear → unlock next" (spec 04 §Core loop 1–6; spec 06 §Core loop mirrors it with crates/rations/sectors).
- Feel: "readable eggs… Galaxian-ish patterns, not pure bullet-hell"; "ship float/inertia — arcade-smooth, not sluggish"; "boss as chapter punctuation — telegraphed patterns" (spec 04 §Feel targets).
- Controls: "Arrow keys and/or WASD move; Space/Z/LMB fire; X/Shift/RMB missile; Esc/P pause" (spec 04 §Controls; spec 06 §Controls "identical skeleton"). Mobile: "B — One-thumb: drag ship under finger (relative or absolute); auto-fire toggle ON by default; Missile as edge button" (spec 04 §Mobile B; spec 06 §Mobile "same layouts A/B").
- Acceptance: ch1 waves→boss→clear no softlock (#1); gift visibly changes weapon ≤1s (#2); readable eggs (#3); death→fight ≤2s (#6); missile stock depletes + refill via pickup (#7); English UI (#10) (spec 04 §Acceptance). Spec 06: "shared shmup skeleton + content packs", label builds `replica` vs `original` (§FORGE).
- Scope: 2 chapters × wave sets + 1 boss each; ≥3 weapon flavors; lives/continue (spec 04 §Content scope IN; spec 06 §Content scope IN).

## What the prototype proves (all via real input events — `keydown`/`keyup`/`pointer` + canvas hit-regions)

| Mechanic | Evidence |
|---|---|
| Shared skeleton + content packs | One engine; title toggle (T key + canvas button) swaps `replica`↔`cluck`: title, palette, weapon names (PEA SHOOTER→SOUP LASER), pickup/enemy/boss labels — spec 06 §FORGE "shared skeleton + content packs" proven as architecture, not just advice. |
| Wave→boss→chapter clear→unlock | Ch1: 2 formation waves cleared → boss (hp bar, aimed volleys + telegraphed radial burst — `bossWarn` seen, 8+ egg radial seen) → CHAPTER CLEAR → ch2 auto-starts; `localStorage ci_proto_unlock_replica=2` persisted. |
| Formation patterns | `straight` drift, `swoop` sine, `dive` peel-off-at-ship all observed; dive flag confirmed in ch2 wave 1. |
| Gift→weapon cycle | Deterministic 1st-kill gift drop → pickup → weapon PEA SHOOTER→TWIN BOLT same-tick (spec #2; the ≤1s is satisfied by the pickup→change code path — measured 3.5s was drop-travel time). |
| Food→missile economy | 2nd-kill food drop → missiles 2→3; X press → missiles 2→1, missile projectile fired (spec #7). |
| Death→respawn ≤2s | Egg hit → ship destroyed → respawn measured 1142–1210ms + 2s invuln blink (spec #6). |
| Lives/gameover/retry | 3 egg deaths → GAME OVER → R/click → title (spec: lose life/restart rule). |
| Forced-failure path | Full run ended `gameover` in ch2 — lose condition demonstrable end-to-end. |
| Pause | Esc freezes sim (score/positions static), resume works. |
| Mobile layout B (one-thumb) | `pointerType==='touch'` → `touchMode`: relative drag moves ship (finger delta → ship delta, velocity zeroed), auto-fire always on, 64×64 MISSILE edge button bottom-right. Verified: tap START → drag ship under formation → wave 1 cleared touch-only (score 1300, wave→2); missile tap 3→2; ship tracked finger delta. Spec 04 §Mobile B + spec 06 acceptance #4 "mobile one-thumb layout clears one wave" — PROVEN. |
| Mobile layout A (twin-thumb) | `pointerType==='touch'` + layout A: left-half pointer → virtual stick (velocity vector, 48px radius, 4px deadzone), right-half pointer → hold-fire, MISSILE button above FIRE. Verified via CDP `Input.dispatchTouchEvent` multi-touch: stick engaged + ship tracked stick vector (shipX 480→543→259→691), firePtrs held → kills, **wave 1 cleared two-thumb touch-only** (score 1200, wave→2, 3 lives intact); missile tap 2→1. Spec 04 §Mobile A + acceptance #5 "complete one wave using only touch" — PROVEN. Layout toggle A/B on title (L key + button, persisted `ci_proto_layout`). |
| Zero-dep | `file://` load; 14 recorded requests = the file itself across reloads; zero console errors on final build. |

## Bugs found by empirical verification (fixed in-file)

1. **Unbounded formation descent** — `waveT*4` descent let chickens sink below the ship lane → unkillable (bullets only travel up) → wave softlock + unavoidable body-slam deaths. Fixed: descent clamped (straight 300 / swoop 320 / dive 280). *Monorepo note: formation descent must be bounded or waves must time-out.*
2. **`wdef` undefined during boss phase** — `waveIdx` advances past the wave list when boss spawns; dive scheduler + egg-timer dereferenced it → rAF loop died on boss spawn (frozen sim, boss stuck at y=-78). Fixed: null-guard. *Monorepo note: wave-script lookup must tolerate boss/intermission phases.*
3. **`__proto.wavesTotal` title-screen throw** (verify D-22) — `CHAPTERS[chapter-1]` with `chapter` undefined → TypeError for any probe reading the hook pre-game. Fixed: `wave`/`wavesTotal` return `null` until `startGame`. *Monorepo note: verification hooks must be readable in every mode — a probe that throws is a probe that lies.*
4. **Multi-touch pointercancel without `touch-action:none`** — second simultaneous touch triggered Chrome's gesture handling → `pointercancel` on both pointers (stick + fire dropped mid-run). Fixed: `touch-action:none` on canvas. *Monorepo note: any multi-pointer game surface needs `touch-action:none` or the browser steals the second finger.*

## What it deliberately omits (spec-deferred or out of core loop)

- **Numeric parity** — every constant is a declared guess; dossier marks wave scripts, damage, fire rates, missile economy, boss patterns all TBD from ARCADE playtest.
- **Mobile layout A (twin-thumb)** — **implemented R6** (left-half virtual stick + right-half hold-fire + missile-above-fire); verified wave-1 clear touch-only. Both spec'd mobile layouts now proven.
- **Chapter select beyond unlocked** — ch2 selectable only after unlock (correct); no chapter >2 (spec: 2 chapters v1).
- **Audio, VO, joke interstitials beyond one line** — spec 06 wants 1–2 line courier beats; one interstitial line per chapter implemented, no audio.
- **CI3+ features** — overheat gun, modifiers, 4P co-op (spec §Deferred).
- **Exact CI2 wave scripts / boss sheets** — dossier evidence gap; patterns are genre-typical, not parity data.
- **InterAction assets/marks** — INTERNAL-NO-PUBLIC; all art is canvas primitives.

## Recommended monorepo carry-forward (for `apps/chicken-invaders` + `apps/chicken-invaders-original`, PixiJS 8 + arcade-core)

1. **One shmup skeleton + content-pack table** — proven: `PACKS[id]` swaps title/palette/weapon names/pickup labels with zero engine changes. Build `replica` and `original` as two packs over shared `Ship/FlockEnemy/Boss/Projectile/Pickup/WaveSpawner/ChapterDirector`.
2. **Formation-as-data wave defs** — `{pattern, rows, cols, hp, eggEvery}` per wave per chapter made waves trivially authorable; extend pattern enum, keep data-driven.
3. **Bound all descent** — any downward drift must clamp above the ship lane or waves softlock (found empirically).
4. **Null-safe phase lookups** — wave-script/boss-phase transitions must tolerate "no current wave" (found empirically).
5. **Deterministic early drops** — first-kill gift + second-kill food made the economy verifiable; keep scripted early drops, randomize later (also good for onboarding).
6. **Telegraph-then-burst boss pattern** — warn ring 0.7s → radial volley reads well and matches "telegraphed patterns" feel target.
7. **Inertial ship (accel + damp + maxV)** — float feel confirmed; keep constants exposed for ARCADE tuning.
8. **Respawn = reposition + timed invuln** — 1.2s respawn + 2s invuln hit the ≤2s spec with margin; blink render communicates invuln.
9. **Verification pattern:** read-only `window.__proto` (positions incl. `eggList`, `bossHp`, `lastDeath`) + real input events proves the loop without state injection — same standard as prior prototypes. Driver needs velocity-lead aiming for the oscillating boss and egg-proximity dodging.
10. **Chapter unlock via localStorage** — per-pack key (`ci_proto_unlock_<pack>`) keeps replica/original progress separate.
11. **One-thumb layout = relative drag + auto-fire + edge missile button** — proven pattern: `pointerType` gates `touchMode`; drag stores `{grabPoint, shipPosAtGrab}` and applies delta (no velocity integration while dragging — direct position control reads better on glass); auto-fire replaces fireHeld; missile as ≥48px edge button checked BEFORE drag starts.
12. **Twin-thumb layout = left-half stick + right-half fire zone** — proven pattern: pointerId-tracked virtual stick sets velocity directly (`dx/mag * maxV * min(1,mag/48)`, 4px deadzone — preserves inertial feel); any right-half touch = hold-fire (generous zone, no dead zones); missile button above fire; per-pointer tracking via `pointerId` in `firePtrs` Set + `stick.id`. **`touch-action:none` is load-bearing** — without it the second finger gets pointercancel'd.

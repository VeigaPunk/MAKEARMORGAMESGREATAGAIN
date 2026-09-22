# Prototype card — Chicken Invaders / Cluck Horizon (mechanics proof)

**File:** `prototypes/chicken-invaders.html` — single file, zero deps, opens via `file://`.
**Specs:** `01-design-docs/02-concept-specs/04-chicken-invaders.md` (CI2-era replica) + `06-chicken-invaders-original.md` (Cluck Horizon) · **Dossier:** `05-dossiers/chicken-invaders.md`
**Status:** verified in headless Chromium 2026-09-22 — full loop exercised via real keyboard/canvas-click input only; read-only `window.__proto` for observation. Zero console errors, zero external requests.

## What the spec demands (cited)

- Core loop: "chapter select → wave clear (pilot ship along bottom, shoot upward, dodge egg projectiles) → collect (gift parcels cycle/upgrade weapons; drumsticks feed missile stock) → clear N waves → boss → chapter clear → unlock next" (spec 04 §Core loop 1–6; spec 06 §Core loop mirrors it with crates/rations/sectors).
- Feel: "readable eggs… Galaxian-ish patterns, not pure bullet-hell"; "ship float/inertia — arcade-smooth, not sluggish"; "boss as chapter punctuation — telegraphed patterns" (spec 04 §Feel targets).
- Controls: "Arrow keys and/or WASD move; Space/Z/LMB fire; X/Shift/RMB missile; Esc/P pause" (spec 04 §Controls; spec 06 §Controls "identical skeleton").
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
| Zero-dep | `file://` load; 14 recorded requests = the file itself across reloads; zero console errors on final build. |

## Bugs found by empirical verification (fixed in-file)

1. **Unbounded formation descent** — `waveT*4` descent let chickens sink below the ship lane → unkillable (bullets only travel up) → wave softlock + unavoidable body-slam deaths. Fixed: descent clamped (straight 300 / swoop 320 / dive 280). *Monorepo note: formation descent must be bounded or waves must time-out.*
2. **`wdef` undefined during boss phase** — `waveIdx` advances past the wave list when boss spawns; dive scheduler + egg-timer dereferenced it → rAF loop died on boss spawn (frozen sim, boss stuck at y=-78). Fixed: null-guard. *Monorepo note: wave-script lookup must tolerate boss/intermission phases.*

## What it deliberately omits (spec-deferred or out of core loop)

- **Numeric parity** — every constant is a declared guess; dossier marks wave scripts, damage, fire rates, missile economy, boss patterns all TBD from ARCADE playtest.
- **Mobile touch layouts A/B** — spec §Controls defines twin-thumb/one-thumb mappings; prototype is keyboard/mouse only (desktop is the fidelity reference per spec).
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

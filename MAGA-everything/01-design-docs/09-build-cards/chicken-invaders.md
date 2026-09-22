# BUILD CARD — Chicken Invaders (CI2-era recreate)
**Slug:** `chicken-invaders` · **Priority:** 4 (FORGE STACK-LOCKED) · **Renderer:** PixiJS 8 · **App:** `02-code/armor-games/apps/chicken-invaders` (not yet scaffolded)
**Card sources:** `02-concept-specs/04-chicken-invaders.md` (SPEC), `05-dossiers/chicken-invaders.md` (DOSSIER), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK), `04-research/deep-dive.md` §5 (RESEARCH)
**Build state:** not started. No tickets exist yet.
**Critical:** official CI series = native desktop (UveDX), **not Flash** — no SWF exists; fan Flash clones (hopslop Kongregate) are NOT acceptable originals (DOSSIER §Target versions). Recreate the CI2 *formula* via playtest notes, never asset extraction (SPEC §Ship path).

## 1. Core loop (SPEC §Core loop — vertical shmup chapters slice)
1. Chapter select/continue — v1: **1–2 chapter slices** (not full Pluto→Sun arc).
2. Pilot ship along bottom; shoot upward; dodge **egg** projectiles from chicken formations.
3. Collect **gift parcels** → cycle/upgrade weapons; **drumsticks/roasts** → missile stock (economy **TBD ARCADE**).
4. Clear N waves per chapter → **boss** → chapter-clear fanfare.
5. Hit → lose life / restart wave-or-chapter per original feel (**TBD ARCADE**).
6. Unlock next chapter; localhost persist.

Session: arcade campaign pacing ~20–40 min for v1 slice (SPEC §Core loop).

## 2. Controls
### Desktop (SPEC §Controls)
- Move: arrows and/or WASD (both; default arrows + WASD mirrored).
- Fire: Space / Z / LMB held or tap (**default TBD ARCADE**).
- Missile/special: X / Shift / RMB (**TBD**). Pause: Esc / P.
- Optional mouse-follow ship = accessibility only; keyboard is fidelity reference.
### Mobile (SPEC §Controls)
- **A twin thumbs (recommended):** left virtual stick/drag-pad XY; right hold-Fire + Missile above.
- **B one-thumb:** drag ship under finger; auto-fire ON default; Missile edge button.
- C tilt: deferred. Fire/Missile hit targets ≥44px; don't cover lower ship lane.

## 3. Entities (SPEC §Notes for FORGE)
`Ship`, `Chicken`, `Boss`, `EggProjectile`, `PlayerBullet`, `Missile`, `GiftParcel`, `FoodPickup`, `WaveSpawner`, `ChapterDirector`, `Starfield`.

## 4. Progression
- Gift parcel weapon cycle: **≥3 weapon flavors** for feel; damage numbers **TBD ARCADE**.
- Chicken formations: straight, swoop, dive + egg projectiles.
- Lives/continue UX matching era feel (rules TBD).
- Chapter unlock persist via localStorage (arcade-core pattern).
- v1: **2 chapters**, each short wave set + **1 boss**.

## 5. Win/lose
- Win: clear chapter waves → boss → chapter clear → next unlock.
- Lose: egg/enemy hit → lose life; lives/continue rules **TBD ARCADE** (restart wave vs chapter per original feel).
- Death/restart returns to fight ≤2s (SPEC hook 6).

## 6. Art direction (SPEC §Art needs)
- Bright 2D shmup sprites **echoing** early-2000s 3D-rendered-to-sprite look — **without** copying InterAction models; original silhouette language.
- Palette: high-contrast space blacks/purples + vivid chicken yellows/reds; readable eggs (white/cream w/ outline).
- v1 assets: player ship (idle+bank), 2–3 chicken types, 1 boss chicken, egg projectile, player bullets, missile, gift parcel, drumstick/roast, 2 starfield/planet backdrops, UI (lives/weapon icon/missile count/chapter banners), explosion/feather VFX.
- **NOT:** photoreal chickens, post-process muddying bullets, cinematic lighting.

## 7. Audio recipes (SPEC §Audio needs)
- v1 priorities: primary fire loop/peck · egg impact/player hit · explosion/feather burst · gift collect + weapon-change sting · missile launch · boss intro sting + chapter-clear jingle · 2 campy loopable beds (original-inspired, **not** ripped InterAction OST).
- VO jokes optional, English only, short.
- No MAESTRO bible yet — author per `06-audio/README.md` schema (synths load-bearing here per bible §Next).

## 8. Acceptance criteria (SPEC §Acceptance hooks)
1. Chapter 1 waves → boss → clear without softlock.
2. Gift pickup visibly changes weapon ≤1s.
3. Egg patterns readable at intended resolution.
4. Desktop: move + hold-fire 30s without input drop.
5. Mobile layout A: one wave touch-only.
6. Death/restart ≤2s.
7. Missile stock depletes + refills via pickup without negative-inventory softlock.
8. Cold load → gameplay <5s localhost (suggested).
9. No InterAction trademarked title screens; INTERNAL watermark if needed.
10. English-only.

## 9. Open TBDs (SPEC §Open questions; DOSSIER §Evidence gaps)
Exact wave scripts/formation data · weapon damage/fire rates/missile economy · boss pattern sheets · default binds · lives/continue/checkpoint rules · scroll speed/bullet density references · humor/VO beat list · which episode is revive target (CI2 chosen by SPEC; DOSSIER notes awaiting João).

## 10. Out of scope (SPEC §Deferred)
Full CI2 Pluto→Sun campaign · CI3 4P co-op/overheat/full modifiers · holiday reskins · Universe MMO · any InterAction ripped art/audio · online multiplayer.

# BUILD CARD — Chicken Invaders (CI2-era recreate)
**Slug:** `chicken-invaders` · **Priority:** 4 (FORGE STACK-LOCKED) · **Renderer:** PixiJS 8 · **App:** `02-code/armor-games/apps/chicken-invaders` (scaffolded — forge R04 `50665ba`, `packages/shmup-core` replica pack) · SPEC scope/rights: §Meta, §Content scope—Playable v1 (IN)
**Card sources:** `02-concept-specs/04-chicken-invaders.md` (SPEC), `05-dossiers/chicken-invaders.md` (DOSSIER), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK), `04-research/deep-dive.md` §5 (RESEARCH)
**Build state:** scaffolded `50665ba` — `shmup-core` skeleton + `replica` content pack shipped (`main.ts` 9-ln boot; sim/render/touch in `packages/shmup-core/`); INTERNAL badge ships. Chicken tickets still to mint.
**Critical:** official CI series = native desktop (UveDX), **not Flash** — no *official* SWF exists; fan Flash clones (hopslop Kongregate) are NOT acceptable originals (DOSSIER §Target versions). Recreate the CI2 *formula* via playtest notes, never asset extraction (SPEC §Ship path; §Notes for FORGE — Parity source). Governing bar: **formula replica** per SPEC; dossier's exact-parity checklist applies only if "exact-as-original" is claimed (DD-57).
**Stack:** PixiJS 8 + TS + Vite; reuse Boxhead + `arcade-core` patterns; slot #4, sets bar for #6 Cluck Horizon (SPEC §Notes for FORGE; STACK §3). ⚠ inherit the Pixi-external + importmap + `public/vendor/` build workaround (STACK §build note) — Rollup-bundled Pixi hangs.
**Rights:** INTERNAL-NO-PUBLIC — localhost internal OK; public ship needs InterAction studios / Prouskas clearance (SPEC §Meta). Owner actively commercial; extraction blocked (DOSSIER §Asset/audio).

## 1. Core loop (SPEC §Core loop — vertical shmup chapters slice)
1. Chapter select/continue — v1: **1–2 chapter slices** (not full Pluto→Sun arc).
2. Pilot ship along bottom; shoot upward; dodge **egg (and other)** projectiles from chicken formations.
3. Collect **gift parcels** → cycle/upgrade weapons; **drumsticks/roasts** → missile stock (economy **TBD ARCADE**).
4. Clear **10 waves per chapter** (RESEARCH §5 — default until ARCADE) → **boss** → chapter-clear fanfare.
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
- C tilt: deferred. Fire/Missile hit targets ≥44px (CSS px — DD-40); don't cover lower ship lane with **opaque** UI.

## 3. Entities (SPEC §Notes for FORGE)
`Ship`, `Chicken`, `Boss`, `EggProjectile`, `PlayerBullet`, `Missile`, `GiftParcel`, `FoodPickup`, `WaveSpawner`, `ChapterDirector`, `Starfield`.


### Feel targets (SPEC §Feel targets — build-critical)
- **Ship float / inertia:** arcade-smooth, not sluggish tank controls.
- **Formation dance:** readable Galaxian-ish patterns, not pure bullet-hell walls (CI2-era, not modern danmaku).
- Gift power-fantasy; boss telegraphs readable.

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
- No MAESTRO bible yet — author per `06-audio/README.md` schema (synths load-bearing here per bible §Next). **Zero binary audio assets** — cue→recipe via `arcade-core` WebAudio helpers; shipped contract = 5 `Sfx.preset` names + note-array music slot (DD-09).

## 8. Acceptance criteria (SPEC §Acceptance hooks)
1. Chapter 1 waves → boss → clear without softlock.
2. Gift pickup visibly changes weapon ≤1s.
3. Egg patterns readable at intended resolution (no invisible hits from UI chrome).
4. Desktop: move + hold-fire 30s without input drop.
5. Mobile layout A: one wave touch-only.
6. Death/restart ≤2s.
7. Missile stock depletes + refills via pickup without negative-inventory softlock.
8. Cold load → gameplay <5s localhost (suggested). **Perf:** dozens of bullets + enemies @60fps desktop; 30–60 mobile; tight atlases (SPEC §Notes for FORGE).
9. No InterAction trademarked title screens; INTERNAL watermark if needed.
10. English-only.

## 9. Open TBDs (SPEC §Open questions; DOSSIER §Evidence gaps)
Exact wave scripts/formation data (10 waves/chapter default — RESEARCH §5) · weapon damage/fire rates/missile economy · boss pattern sheets · default binds · lives/continue/checkpoint rules · scroll speed/bullet density references · humor/VO beat list · which episode is revive target (CI2 chosen by SPEC; DOSSIER notes awaiting João — DD-56) · licensed redistributable build for wrap (gap) · asset-extraction legality (treat as blocked) · publisher partnership interest (note only — DOSSIER §Evidence gaps).

## 10. Out of scope (SPEC §Deferred)
Full CI2 Pluto→Sun campaign · CI3 4P co-op/overheat/full modifiers · holiday reskins · Universe MMO · any InterAction ripped art/audio · online multiplayer.

**Posture:** INTERNAL-NO-PUBLIC (above). **Skeleton:** `packages/shmup-core` shared with #6 Cluck Horizon (shipped `50665ba`, proto's normalized vocabulary — DD-34 resolved-in-code; spec docs still need the vocabulary decision). **Gates:** G0–G5 per STACK §3.

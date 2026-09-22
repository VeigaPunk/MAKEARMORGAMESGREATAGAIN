# Chicken Invaders 2-Era — Native Replica Concept Spec

## Meta

| Field | Value |
|-------|-------|
| **Slug** | `chicken-invaders` |
| **Working title** | Chicken Invaders: The Next Wave — native formula replica |
| **Target version for feel** | **Chicken Invaders 2: The Next Wave (2002)** era formula (not fan Flash clones; not hopslop Kongregate) |
| **Status** | concept |
| **Rights** | **INTERNAL-NO-PUBLIC** — localhost internal OK; public ship needs InterAction studios / Prouskas clearance (actively commercial remasters/Universe). Fan Flash is not an acceptable original. |
| **Ship path** | Native recreate (**PixiJS 8** vertical shmup). **Not** Ruffle as ship vehicle. **Not** asset extraction from InterAction binaries. |
| **Renderer (locked)** | **PixiJS 8** (bullet / enemy density) |
| **Stack lock** | `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` |
| **Language** | English only |
| **Priority** | **4** (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`) |
| **Idea** | 001 — Make Armor Games Great Again (post-pivot) |

## Core loop

v1 = **vertical shmup chapters slice** of the CI2-era formula:

1. **Chapter select / continue** — Start at first available chapter (v1: 1–2 chapter slices, not full Pluto→Sun arc).
2. **Wave clear** — Pilot ship along bottom (classic fixed/vertical shmup plane); shoot upward; dodge **egg** (and other) projectiles from chicken formations.
3. **Collect** — Gift parcels cycle/upgrade weapons; drumsticks/roasts feed missile stock — **exact economy TBD from ARCADE playtest**.
4. **Wave cadence** — Clear N waves per chapter stretch → **boss** encounter → chapter clear fanfare.
5. **Risk of death** — Hit by eggs/enemies → lose life / restart wave or chapter rule per original feel — **TBD from ARCADE playtest**.
6. **Progress** — Unlock next chapter slice; localhost persist chapter unlock.

Session feel: arcade campaign pacing (~20–40 min for v1 slice stretch), not endless CI1.

## Feel targets

- **Bright, readable bullets** — eggs and shots must be legible; comedy density without unfair invisible spam.
- **Campy chicken shmup identity** — humorous invaders-with-poultry vibe without copying InterAction proprietary art/VO.
- **Gift → weapon cycle satisfaction** — picking up parcels feels like power fantasy escalation.
- **Formation dance** — chickens move in readable Galaxian-ish patterns, not pure bullet-hell walls (CI2-era, not modern danmaku).
- **Boss as chapter punctuation** — bigger silhouette, telegraphed patterns, payoff after waves.
- **Ship float / inertia** — movement should feel arcade-smooth, not sluggish tank controls.

## Controls

### Desktop (keyboard/mouse)

- **Move:** Arrow keys and/or WASD (both acceptable; default arrows + WASD mirrored).
- **Fire primary:** Space / Z / Left mouse held or tap-fire — **default bind TBD from ARCADE playtest** (CI historically keyboard/mouse/gamepad).
- **Missile / special:** X / Shift / Right mouse — **TBD**.
- **Pause:** Esc / P.
- Optional mouse-follow ship mode as accessibility (label as optional; keyboard remains fidelity reference).

### Mobile (touch mapping)

Playable **one- or two-handed**:

| Layout | Hands | Mapping |
|--------|-------|---------|
| **A — Twin thumbs (recommended)** | Two-handed landscape | Left: virtual stick or drag-pad for ship XY; Right: hold Fire + Missile button above fire. |
| **B — One-thumb** | One-handed portrait | Drag ship under finger (relative or absolute); auto-fire toggle ON by default; Missile as edge button. |
| **C — Tilt optional** | — | Defer; not required for v1. |

Document chrome: Fire and Missile hit targets ≥44px; do not cover the lower ship lane with opaque UI.

## Content scope — Playable v1 (IN)

- Vertical shmup **chapters slice**: **2 chapters**, each with a short wave set + **1 boss**.
- Ship with primary fire + missiles.
- Gift parcel weapon cycle (≥3 weapon flavors for feel; damage numbers **TBD from ARCADE playtest**).
- Chicken formations (straight, swoop, dive) + egg projectiles.
- Lives / continue UX matching era feel (exact rules TBD).
- English menus, pause, game over, chapter clear.
- Desktop + mobile touch layouts A/B.

## Content scope — Deferred

- Full CI2 Pluto→Sun campaign length.
- CI3 4P local co-op / overheat gun / full modifier set.
- Holiday edition reskins as “exact” remasters.
- Universe MMO features.
- Any InterAction ripped art/audio.
- Online multiplayer.

## Art needs (for PIXEL)

- **Style:** Bright 2D shmup sprites that **echo** early-2000s 3D-rendered-to-sprite look **without** copying InterAction models — original silhouette language inspired by the genre, not asset clones.
- **Palette:** High-contrast space blacks/purples + vivid chicken yellows/reds; readable eggs (white/cream with outline).
- **v1 asset list:**
  - Player ship (idle + bank frames)
  - 2–3 chicken types; 1 boss chicken
  - Egg projectile; player bullets; missile
  - Gift parcel; drumstick/roast pickup
  - Starfield / planet chapter backdrops (2)
  - UI: lives, weapon icon, missile count, chapter banners
  - Explosion / feather burst VFX
- **What NOT to modernize:** No photoreal chickens; no post-process that muddies bullets; keep arcade readability over cinematic lighting.

## Audio needs (for MAESTRO)

**v1 priorities:**

1. Primary fire loop / peck.
2. Egg impact / player hit.
3. Explosion / feather burst.
4. Gift collect + weapon change sting.
5. Missile launch.
6. Boss intro sting + chapter clear jingle.
7. Short campy loopable music beds (2 chapters) — original-inspired, not ripped InterAction OST.

VO jokes: optional; if present, English only; keep short.

## Acceptance hooks (for PROOF)

1. Clear chapter 1 waves → boss → chapter clear without softlock.
2. Gift pickup visibly changes weapon behavior within 1 second.
3. Egg patterns remain readable at intended resolution (no invisible hits from UI chrome).
4. Desktop: continuous move + hold-fire sustained for 30s without input drop.
5. Mobile layout A: complete one wave using only touch.
6. Death/restart returns player to fight in ≤2s.
7. Missile stock depletes and refill via pickup (rules TBD) without negative inventory softlock.
8. Payload remains “lightweight” — cold load to gameplay under FORGE target (suggest <5s localhost).
9. No InterAction trademarked title screens shipping as “official”; mark INTERNAL build watermark if needed.
10. English-only UI.

## Open questions / ARCADE gaps

- Exact wave scripts / formation data for CI2.
- Weapon damage, fire rates, missile economy.
- Boss pattern sheets.
- Default binds per episode.
- Lives / continue / checkpoint rules.
- Scroll speed / bullet density reference captures.
- Humor/VO beat list (if any in v1).

All numeric combat values: **TBD from ARCADE playtest**.

## Notes for FORGE

**Stack (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`):**
- App: `armor-games/apps/chicken-invaders` — **PixiJS 8** + TypeScript + Vite; reuse patterns from Boxhead + `arcade-core`.
- Slot #4: Pixi reuse from Boxhead; sets bar for #6 Cluck Horizon.
- Fan Flash / hopslop ≠ original; Ruffle path N/A (no official SWF).


- **Performance / payload:** Lightweight vertical shmup; dozens of bullets + enemies at 60fps desktop; mobile 30–60. Keep art atlases tight.
- **Suggested entity types:** `Ship`, `Chicken`, `Boss`, `EggProjectile`, `PlayerBullet`, `Missile`, `GiftParcel`, `FoodPickup`, `WaveSpawner`, `ChapterDirector`, `Starfield`.
- **Parity source:** CI2: The Next Wave *formula* via playtest notes — not fan SWF, not asset dump.
- **No stack prescription.**

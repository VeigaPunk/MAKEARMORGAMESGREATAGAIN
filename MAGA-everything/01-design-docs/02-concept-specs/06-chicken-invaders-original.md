# Cluck Horizon — New Original (Chicken Invaders–Style) Concept Spec

## Meta

| Field | Value |
|-------|-------|
| **Slug** | `chicken-invaders-original` |
| **Working title** | **Cluck Horizon** |
| **Alt titles considered** | Featherforce, Yolk Rift (reject if too close to InterAction episode names) |
| **Target** | New IP — same control/loop skeleton as CI-era vertical shmup; **not** a replica claim |
| **Status** | concept |
| **Rights** | **INTERNAL-NO-PUBLIC** until João decides public brand; as new IP, still avoid InterAction marks/assets. Public ship: own clearance for music/fonts only. |
| **Ship path** | Native browser original (**PixiJS 8**). **Not** SWF/Ruffle ship. **Not** InterAction assets. |
| **Renderer (locked)** | **PixiJS 8** (same kit as CI recreate) |
| **Stack lock** | `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` |
| **Language** | English only |
| **Priority** | **6** (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`) |
| **Idea** | 001 — Make Armor Games Great Again (post-pivot) |

### One-paragraph pitch

**Cluck Horizon** is a bright, campy vertical shoot-’em-up where a scrappy courier pilot defends the solar suburbs from an invading flock of space poultry and their egg artillery. You weave under starfields, snatch supply crates that remix your gun into absurd kitchen-tech weapons, and break chapter bosses that are gloriously overgrown birds with telegraphable patterns. It echoes the *feel* of early-2000s chicken shmups — readable eggs, gift-crate power fantasy, short chapter arcs — while using original characters, jokes, and systems so nothing is copied from InterAction’s Chicken Invaders art, audio, or level scripts.

## Core loop

Same skeleton as the CI replica, with original content:

1. Choose chapter sector (v1: 2 sectors).
2. Fly bottom-lane ship; auto-scroll or fixed-lane vertical shmup space.
3. Destroy flock formations; dodge eggs / yolk globs.
4. Grab **Supply Crates** → cycle weapon kits; grab **Rations** → specials/missiles.
5. Clear wave sets → sector boss → unlock next sector.
6. Die → retry; chase clean clears / score.

## Feel targets

- Same player verbs as CI replica: move, shoot, collect, boss punctuation.
- Tone: kitchen-space comedy, not grimdark.
- Differentiator vs replica: original enemy roster names, weapon gags (e.g. “Soup Laser,” “Spatula Spread”), and a courier framing story beat between chapters (1–2 lines, English).
- Must **not** reuse InterAction silhouettes, logos, character names, or OST.

## Controls

### Desktop (keyboard/mouse)

Identical skeleton to `02-chicken-invaders.md`: arrows/WASD move; Space/Z/LMB fire; X/Shift/RMB special; Esc pause.

### Mobile (touch mapping)

Same layouts A/B as CI replica (twin-thumb landscape; one-thumb drag + auto-fire). Shared control code encouraged; content packs differ.

## Content scope — Playable v1 (IN)

- 2 sectors × short wave lists + 1 boss each.
- ≥3 original weapon kits via crates.
- 3 enemy flock types + 2 bosses (original designs).
- Score, lives, English interstitial jokes (short).
- Desktop + mobile.

## Content scope — Deferred

- Long campaign (8+ sectors).
- Local multiplayer.
- Roguelike meta unlock tree.
- Seasonal holiday packs.
- Narrative cutscenes longer than 15s.

## Art needs (for PIXEL)

- **Style:** Arcade-bright sprites; original bird invaders (different proportions/hats/props from CI); courier ship with distinct profile.
- **Palette:** Teal/orange courier accents vs flock yellows — unique from CI replica palette if both ship side-by-side.
- **v1 assets:** ship, 3 enemies, 2 bosses, eggs, bullets, crates, rations, 2 backgrounds, UI, VFX.
- **What NOT to modernize:** Keep 2D arcade clarity; no photoreal; no “almost CI” chicken clones.

## Audio needs (for MAESTRO)

Original SFX set (fire, egg splat, crate jingle, boom, boss sting) + 2 upbeat comedy loops. **No** InterAction tracks. English VO optional one-liners.

## Acceptance hooks (for PROOF)

1. Player can finish sector 1 boss on desktop.
2. Weapon kit change is obvious within 1s of crate pickup.
3. Side-by-side with CI replica: art/audio/names clearly distinct (no asset reuse).
4. Mobile one-thumb layout clears one wave.
5. Cold boot to combat <5s localhost.
6. English-only; working title **Cluck Horizon** on title screen.
7. Joke interstitial appears once per sector without blocking input >3s.
8. Score increments on kills; game over screen offers retry.

## Open questions / ARCADE gaps

- How closely João wants comedy tone vs “serious shmup.”
- Whether Cluck Horizon shares codebase with CI replica (recommended) or forks.
- Difficulty curve relative to replica slice — tune after replica playtests.
- Trademark search on “Cluck Horizon” before public — **open**.

Combat numbers for shared systems: align with replica TBD tables from ARCADE, then retune for original identity.

## Notes for FORGE

**Stack (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`):**
- App: `armor-games/apps/chicken-invaders-original` — **PixiJS 8** + TypeScript + Vite; share kit with CI recreate + `arcade-core`.
- Slot #6: after CI recreate lessons; PIXEL/MAESTRO lead novelty.
- Label builds `replica` vs `original` clearly.


- Prefer **shared shmup skeleton** with CI replica (`Ship`, `FlockEnemy`, `Boss`, `Projectile`, `Crate`, `WaveSpawner`, `SectorDirector`) + content packs.
- Lightweight same as replica.
- **No stack prescription.**
- Label builds clearly: `replica` vs `original` to avoid legal confusion in demos.

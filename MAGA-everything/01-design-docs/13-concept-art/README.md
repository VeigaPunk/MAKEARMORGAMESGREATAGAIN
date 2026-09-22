# 13-concept-art — hand-authored key art (maga-docs additive layer, r10)

**Source:** hand-authored SVG written directly by maga-docs — no external image generator (L0 order 2026-09-22: all art authored directly — SVG, canvas, pixel data).
**Files:** one `<title>-keyart.svg` per title; flat-color vector scenes tuned to each game's palette and mood.
**Purpose:** visual reference for `maga-forge`/`maga-proto` art direction — palette, silhouette, composition. SVGs are resolution-free: rasterize at target size (`rsvg-convert`/`inkscape`/`ffmpeg`) or trace the shapes into sprite/pixel work.
**L0 art directive (2026-09-22):** real art for every game *unless deliberately simple/minimal* — **Impossible Game** and **World's Hardest Game** (`hardest/`) are exempt by style (flat-color minimalism is the aesthetic).
**INTERNAL-NO-PUBLIC:** reference material; do not ship raw outputs publicly.

## Inventory

| Title | File | Scene |
|---|---|---|
| Boxhead | `boxhead/boxhead-keyart.svg` | Top-down night street: lone shotgun hero + muzzle flash vs zombie horde ring; crates, barrels, blood, purple-black sky |
| Burger Tycoon | `burger-tycoon/burger-tycoon-keyart.svg` | Satirical tycoon: golden-arches restaurant fronting feedlot, cleared soy field, protest sign, smog stack |
| Chicken Invaders | `chicken-invaders/chicken-keyart.svg` | Vertical shmup: starfighter firing up at giant helmeted chicken boss, formation chickens, egg projectiles, starfield |
| Swords & Sandals 2 | `swords-and-sandals/sas-keyart.svg` | Arena: scarred champion with mismatched armor raising battered sword, crowd tiers, defeated opponent + coins, desert palette |
| Cluck Horizon | `cluck-horizon/cluck-keyart.svg` | Original-IP shmup: chicken pilot in egg-shaped fighter, pastel sky, corn-kernel bullets, fox interceptors, HEN-ZEPPELIN boss |

## Extend

Author new SVGs directly in this tree (one per title/scene) and record them in the inventory. No external generators.

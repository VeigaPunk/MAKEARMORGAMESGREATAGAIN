# 13-concept-art — generated key art (maga-docs additive layer, r10)

**Source:** Grok Imagine via `scripts/grok-imagine.sh` (SuperGrok web entitlement, no API credits). ~4 images per title, 1408×1408 JPEG, basename `<title>-keyart-<n>.jpg`.
**Purpose:** visual reference for `maga-forge`/`maga-proto` art direction — palette, silhouette, mood. Not final assets; post-process (crop/downscale/palette-reduce) before any in-game use.
**L0 art directive (2026-09-22):** real generated art for every game *unless deliberately simple/minimal* — **Impossible Game** and **World's Hardest Game** (`hardest/`) are exempt by style (flat-color minimalism is the aesthetic).
**INTERNAL-NO-PUBLIC:** generated art is reference material; do not ship raw outputs publicly.

## Prompts used (verbatim)

| Title | Dir | Prompt |
|---|---|---|
| Boxhead | `boxhead/` | "Top-down pixel-art zombie survival game scene: a lone blocky hero with a shotgun stands in a dark city street at night, surrounded by a horde of green pixel zombies closing in from all sides, muzzle flash, crates and barrels, blood splatters on asphalt, retro Flash-game aesthetic, moody purple-black sky, dramatic rim light" |
| Burger Tycoon | `burger-tycoon/` | "Satirical isometric fast-food empire management game scene: a cheerful but sinister burger restaurant with golden arches, behind it a feedlot with cows, a soy field being cleared, and an angry protest sign, bright saturated colors hiding dark satire, retro Flash tycoon game style" |
| Chicken Invaders | `chicken-invaders/` | "Retro vertical shoot-em-up game scene: a small starfighter at the bottom firing upward at an enormous cartoon chicken boss in a space helmet, waves of smaller chickens in formation dropping egg projectiles, starfield background, vibrant arcade colors, Chicken Invaders style" |
| Swords & Sandals 2 | `swords-and-sandals/` | "Cartoon gladiator arena game scene: a scarred champion gladiator with mismatched armor raising a battered sword in victory, roaring crowd in a sandy colosseum pit, a defeated opponent dropping coins, warm desert palette, exaggerated proportions, Swords and Sandals Flash-game style" |
| Cluck Horizon | `cluck-horizon/` | "Colorful vertical shmup game scene: a heroic chicken pilot in a tiny egg-shaped starfighter soaring through a pastel sky, dodging corn-kernel bullets from fox-piloted interceptor ships, a giant zeppelin hen-house boss looming above, bright original-IP cartoon style" |

## Regenerate / extend

```bash
scripts/grok-imagine.sh "<prompt>" MAGA-everything/01-design-docs/13-concept-art/<title>/ <basename> 420 image
```

Record any new prompt in this table. Sibling lanes generating their own art (e.g. `tcg/design/art-direction.md` HS-legendary map) keep assets inside their own scope.

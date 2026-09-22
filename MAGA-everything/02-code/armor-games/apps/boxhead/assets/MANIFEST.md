# PIXEL drop zone — Boxhead asset manifest (BH-3.1)

**Rule:** chunky low-fi boxes, flat mid-2000s portal palette, top-down readable
silhouettes. No realistic humans, no bloom/HDR, no smoothing that softens hit
readability. Replace placeholder `Graphics` boxes in `src/entities.ts` —
filenames below are the contract; keep stage logical units (stage 640×400).

| File | Replaces | Notes |
|------|----------|-------|
| `player-p1.png` | `Player` box (P1 tint 0xe8e8f0) | ~12×15 px logical, facing up baseline |
| `player-p2.png` | `Player` box (P2 tint 0x7ab8ff) | same silhouette, blue tint |
| `zombie.png` | `Zombie` walker (0x6a8f3a) | same box silhouette, green |
| `zombie-runner.png` | `Zombie` runner (0xd43a3a) | red variant |
| `muzzle-flash.png` | in-code muzzle VFX | optional; current build has none |
| `shotgun-pellets.png` | projectile sprite | optional; bullets are 5×2 rects today |
| `ammo-crate.png` | `AmmoCrate` (0xf5c542 + band) | 14×10 logical, readable at a glance |
| `barrel.png` | `Barrel` idle (0xb03030) | 12×16 logical |
| `barrel-explode.png` | `BlastRing` ring VFX | optional sprite alternative |
| `room-open-yard.png` | `ROOMS[0]` floor/props | 620×380 inner field |
| `room-pillars.png` | `ROOMS[1]` floor/props | 620×380 inner field |
| `ui-stick-base.png` / `ui-stick-knob.png` / `ui-fire.png` | `touch.ts` chrome | optional; vector chrome acceptable |
| `ui-death-screen.png` | banner text backdrop | optional |

**Status:** all slots PLACEHOLDER — code draws `Graphics` primitives today.
Drop files here; wiring lands behind a loader that falls back to primitives
when a file is absent (no code thrash for partial drops).

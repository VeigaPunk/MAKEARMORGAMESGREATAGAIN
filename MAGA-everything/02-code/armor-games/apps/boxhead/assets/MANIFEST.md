# PIXEL/MAESTRO resolution — Crateheads asset manifest (BH-3.1, sr2)

**Rule:** chunky low-fi boxes, flat mid-2000s portal palette, top-down readable
silhouettes. No realistic humans, no bloom/HDR, no smoothing that softens hit
readability. Stage logical units stay 640×400.

**Status (2026-09-23, sr2): every slot RESOLVED procedurally** — the build
ships zero binary gameplay assets. All in-game art is Pixi `Graphics` drawn
from the authored recipes in
`01-design-docs/02-concept-specs/001-boxhead-native-placeholder-recipes.md`
(palette module `src/art/palette.ts`, entities `src/entities.ts`, arena/HUD in
`src/game.ts`, touch chrome `src/touch.ts`). Audio is 100% WebAudio recipes
(`src/audio.ts`) per `06-audio/boxhead-2play-sound-bible.md` — zero binary
audio, per stack-locked doctrine.

| File | Resolution |
|------|------------|
| `player-p1.png` / `player-p2.png` | procedural — recipes §4.1/§4.2 (body + head + eyes + p1/p2 stripe, 2-frame walk bob) |
| `zombie.png` / `zombie-runner.png` | procedural — §4.3 two green skins + §4.4 horned red runner (special) |
| `muzzle-flash.png` | procedural — §4.6 two-frame cross flash at weapon tip |
| `shotgun-pellets.png` | procedural — §4.5 pellet + §4.17 5-pellet spread logic |
| `ammo-crate.png` | procedural — §4.7 wood crate, bands, ammo mark |
| `barrel.png` / `barrel-explode.png` | procedural — §4.8 barrel + idle fuse blink; §4.16 ring + hot core + debris specks |
| `room-open-yard.png` / `room-pillars.png` | procedural — §4.9/§4.20 checker floor + walled border + obstacle blocks (warehouse / lab tile sets) |
| `ui-stick-base.png` / `ui-stick-knob.png` / `ui-fire.png` | procedural — §4.13 panel-backed stick, accent knob, labeled FIRE button |
| `ui-death-screen.png` | procedural — §4.15 banner bar with panel backdrop |
| `boxhead-logo.svg` | replaced — `public/art/crateheads-logo.svg` (direct-authored block wordmark, original letterforms) |
| `floor-tile.svg` | removed — superseded by procedural floor tiles |

No PNG drops are planned; if a future drop wants binary art it must land
behind the same fallback rule (code-drawn primitives when a file is absent).

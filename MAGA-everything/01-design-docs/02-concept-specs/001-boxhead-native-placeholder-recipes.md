# Native placeholder-art recipes — Boxhead: 2Play Rooms (PixiJS 8)

| Field | Value |
|-------|-------|
| **Slug** | `boxhead` |
| **Idea** | 001 — Make Armor Games Great Again |
| **Owner** | PIXEL |
| **Consumers** | Kimi (`apps/boxhead` Pixi) · FORGE · ARCADE · PROOF |
| **Date** | 2026-09-22 America/Sao_Paulo |
| **Status** | draft v1.1 — native placeholders (aligned to concept pack) |
| **Renderer** | PixiJS 8 |
| **Stage** | provisional **640×480** (letterbox via `arcade-core`) |
| **Mandate** | Feel-faithful **native replica** — chunky boxes, not HD remaster |
| **Concept source** | `01-boxhead.md` §Art needs (IDEATOR HANDOFF) |
| **Supersedes (in-game art)** | `001-boxhead-2play-visual-direction.md` chrome draft — that file remains chrome/wrapper only |

English only. Written specs only — no binary art in this package.

---

## 1. Hard rules

1. **Feel-faithful chunky boxes.** Readable silhouettes at 1x–3x. No glossy shading, no soft gradients, no remaster polish.
2. **All placeholders are procedural.** Implement via Pixi `Graphics` or tiny generated textures (code recipes below). Do not ship hand-painted PNGs for MVP.
3. **Texture `scaleMode = NEAREST`** (pixelated). Integer stage scale only via `arcade-core` letterbox — never fractional stretch on the playfield.
4. **Palette tokens** shared with MAGA chrome where sensible (`void`, `panel`, `ink`, `accent`, `p1`, `p2`, `warn`, `ok`).
5. **Hitboxes may be slightly smaller than drawn boxes** (note for FORGE). Art must **not** imply precise SWF pixel metrics until ARCADE measures reference captures.
6. **No bilinear filters** on gameplay sprites. `roundPixels: true` on the application / renderer where supported.
7. Ruffle / SWF is **reference-only** for feel. This package is the **native** art path for `apps/boxhead`.

---

## 2. Full palette (game + chrome)

Reuse chrome tokens; add gameplay tokens. All hex required.

### Shared / chrome

| Token | Hex | Use |
|-------|-----|-----|
| `void` | `#0B0B0C` | Page / letterbox / clear color |
| `panel` | `#161618` | Chrome panels, cards, HUD chip fill |
| `panel-edge` | `#2A2A2E` | 1px borders |
| `ink` | `#E8E4DC` | Primary text / HUD labels |
| `muted` | `#9A958A` | Secondary text |
| `accent` | `#C4F04D` | CTA / focus / lime arcade pop |
| `accent-dim` | `#6B8A2A` | Pressed / dim accent |
| `warn` | `#E85D3A` | Danger, death banner, barrel fuse hot |
| `p1` | `#4DA3FF` | Player 1 accent |
| `p2` | `#FF7A4D` | Player 2 accent |
| `ok` | `#5DDC8A` | Ready / healthy chip |

### Gameplay (ADD)

| Token | Hex | Use |
|-------|-----|-----|
| `floor` | `#2C2A26` | Room floor tile base |
| `floor-alt` | `#26241F` | Checker / seam variant |
| `wall` | `#3E3A34` | Wall / obstacle block |
| `wall-edge` | `#1A1814` | Wall top/side edge line |
| `zombie` | `#6B8F4E` | Basic zombie body |
| `zombie-dark` | `#4A6B38` | Darker zombie variant |
| `zombie-eye` | `#C4F04D` | Zombie eye dots (sick lime) |
| `devil` | `#8B2E2E` | Special / devil body |
| `devil-horn` | `#5A1A1A` | Horn nubs |
| `blood` | `#A61E2E` | Hit / death speck |
| `blood-dark` | `#6E121C` | Speck shadow |
| `crate` | `#8B6914` | Ammo crate wood |
| `crate-band` | `#C4A035` | Crate band / lid stripe |
| `crate-mark` | `#E8E4DC` | “A” / ammo mark |
| `barrel` | `#5A5E62` | Explosive barrel body |
| `barrel-band` | `#3A3E42` | Barrel hoop |
| `barrel-fuse` | `#E85D3A` | Fuse tip (blink with `warn`) |
| `barrel-fuse-off` | `#6B3A2A` | Fuse dim frame |
| `muzzle` | `#FFF2A8` | Muzzle flash core |
| `muzzle-edge` | `#E85D3A` | Muzzle flash rim |
| `bullet` | `#E8E4DC` | Pellet / bullet fill |
| `bullet-core` | `#C4F04D` | Optional hot center |
| `hud-score` | `#C4F04D` | Score digits |
| `shadow` | `#00000066` | Soft square shadow under entities (optional; keep opaque enough to read) |
| `player-body` | `#D8D2C8` | Box body fill (shared P1/P2) |
| `player-head` | `#E8E4DC` | Head square |
| `player-eye` | `#0B0B0C` | Eye dots |
| `floor-lab` | `#243028` | Room B floor |
| `floor-lab-alt` | `#1C2620` | Room B seam |
| `wall-lab` | `#355044` | Room B wall |
| `floor-yard` | `#2E2A20` | Room C floor |
| `floor-yard-alt` | `#262218` | Room C seam |
| `wall-yard` | `#4A4030` | Room C wall |

**Suggested TS const module** (`apps/boxhead/src/art/palette.ts`): export every token above as `as const` string hex; B-N0 exit = this module + letterbox clear = `void`.

---

## 3. Atlas / sheet layout (logical — do not generate PNG)

When packing textures later, use this conceptual grid. **Do not** create `boxhead-placeholders.png` in this task — document only.

### Logical cell sizes

| Category | Cell | Notes |
|----------|------|-------|
| Characters (player, zombie, devil) | **16×16** or **24×24** | Prefer **16×16** for MVP density; 24×24 if readability fails at 1x |
| Bullets | **4×4** | |
| Props (crate, barrel) | **16×16** | |
| Tiles (floor, wall) | **16×16** | |
| FX (muzzle, blood speck) | **8×8** or **4×4** | |
| UI chips / digits | **8×8** or **8×12** | Mono block digits |

### Proposed conceptual sheet: `boxhead-placeholders.png`

Assume a 256×256 atlas (or 128×128 if tiny), 16×16 cells = 16 columns × 16 rows. Row assignment:

| Row | Y cells | Content |
|-----|---------|---------|
| 0 | players | `bh_player_p1_idle`, `bh_player_p1_walk0`, `bh_player_p1_walk1`, `bh_player_p1_shoot`, same for p2 |
| 1 | zombies | `bh_zombie_basic_idle`, `bh_zombie_basic_walk0/1`, `bh_zombie_dark_*` |
| 2 | specials | `bh_special_devil_idle`, walk frames, attack stub |
| 3 | props | `bh_prop_crate`, `bh_prop_barrel`, `bh_prop_barrel_fuse_on/off` |
| 4 | fx | `bh_fx_bullet`, `bh_fx_muzzle0/1`, `bh_fx_blood0/1/2` |
| 5 | tiles | `bh_tile_floor`, `bh_tile_floor_alt`, `bh_tile_wall` |
| 6 | ui | `bh_ui_digit_0`…`9`, `bh_ui_chip_health`, `bh_ui_chip_ammo` |
| 7 | chrome-touch | `bh_touch_stick_base`, `bh_touch_stick_knob`, `bh_touch_btn_fire` |

### Naming convention

```
bh_<category>_<name>_<frame>
```

Examples: `bh_player_p1_walk_0`, `bh_zombie_dark_idle`, `bh_fx_muzzle_1`, `bh_prop_barrel_fuse_on`.

Categories: `player` | `zombie` | `special` | `prop` | `fx` | `tile` | `ui` | `touch` | `banner`.

---

## 4. Procedural recipes (PixiJS 8)

Each recipe: size, colors, numbered draw steps (Graphics API or pixel ops), animation notes. Coordinates are local to the graphics object; origin top-left of the cell unless noted.

**Common setup (every recipe):**

```ts
import { Graphics, TextureStyle } from 'pixi.js';
// Prefer Graphics for MVP. If baking:
// const rt = RenderTexture.create({ width, height, scaleMode: 'nearest' });
```

Set application / sprite texture style to nearest. Prefer `graphics.rect(...).fill(...)` (Pixi 8) over deprecated beginFill chains.

---

### 4.1 Player P1 / P2 — box body + head + eyes + accent stripe

| | |
|--|--|
| **Size** | 16×16 logical |
| **Colors** | `player-body`, `player-head`, `player-eye`, stripe `p1` or `p2`, optional `shadow` |

**Draw steps (idle):**

1. Optional: fill rect `(2,14)–(14,16)` with `shadow` (2px tall foot shadow).
2. Body: fill rect `(3,6)–(13,14)` with `player-body` → 10×8 box.
3. Accent stripe: fill rect `(3,6)–(5,14)` with `p1` (P1) or `p2` (P2) → 2px left stripe.
4. Head: fill rect `(4,2)–(12,7)` with `player-head` → 8×5 square (sits on body).
5. Eyes: fill `(5,3)–(7,5)` and `(9,3)–(11,5)` with `player-eye` → two 2×2 dots.
6. No outline required; optional 1px `panel-edge` bottom edge on body for separation from floor.

**P2:** identical geometry; stripe uses `p2`.

**Naming:** `bh_player_p1_idle`, `bh_player_p2_idle`.

---

### 4.2 Idle / walk (2-frame bob) / shoot flash

**Idle:** frame from §4.1; hold or 1px vertical bob every 400ms optional.

**Walk (2 frames):**

| Frame | Change vs idle |
|-------|----------------|
| `walk_0` | Body/head Y −0 (base); left “leg” hint: 2×2 `player-body` at `(4,13)`; right at `(10,14)` inset 1px |
| `walk_1` | Swap leg Y; whole sprite Y +1 (bob down) |

Animation: 120–160ms per frame while moving; snap to idle when velocity ≈ 0.

**Shoot flash (`shoot`):**

1. Start from idle pose.
2. Add muzzle stub: fill `(13,7)–(16,10)` with `muzzle` (3×3) for P1 facing right; mirror if facing left.
3. Hold 40–60ms then return to idle/walk.

Facing: mirror Graphics scale.x = −1 around center for left; keep stripe on “back” side visually by redrawing stripe on the facing-back edge OR accept stripe flips (MVP OK).

---

### 4.3 Zombie basic + darker variant

| | |
|--|--|
| **Size** | 16×16 |
| **Colors** | `zombie` / `zombie-dark`, `zombie-eye`, `shadow` |

**Basic (`bh_zombie_basic_idle`):**

1. Shadow: `(2,14)–(14,16)` `shadow`.
2. Body: `(3,5)–(13,14)` fill `zombie` (10×9).
3. Head: `(4,2)–(12,7)` fill `zombie` (same family, no separate skin).
4. Eyes: `(5,3)–(7,5)` and `(9,3)–(11,5)` fill `zombie-eye`.
5. Optional mouth slit: `(6,6)–(10,7)` fill `void`.

**Dark variant:** same steps; body/head use `zombie-dark`. Name: `bh_zombie_dark_idle`.

**Walk:** same 2-frame bob as player (§4.2), legs in body color. No shoot flash.

---

### 4.4 Special / devil (taller or horn nubs)

| | |
|--|--|
| **Size** | 16×18 drawn in 16×16 cell with overflow OR use **16×16** with horns in top 2px |
| **Colors** | `devil`, `devil-horn`, `zombie-eye` or `warn` eyes |

**Draw steps (`bh_special_devil_idle`):**

1. Shadow `(2,14)–(14,16)`.
2. Body `(3,6)–(13,14)` fill `devil`.
3. Head `(4,3)–(12,8)` fill `devil`.
4. Horns: rect `(4,1)–(6,3)` and `(10,1)–(12,3)` fill `devil-horn` (2×2 nubs).
5. Eyes: `(5,4)–(7,6)` and `(9,4)–(11,6)` fill `warn` (angry).
6. Optional taller read: shift body up 1px vs zombie so silhouette reads taller in swarm.

Walk: 2-frame bob; slightly faster cycle (100–120ms) to feel more aggressive.

---

### 4.5 Bullet / pellet

| | |
|--|--|
| **Size** | 4×4 |
| **Colors** | `bullet`, optional `bullet-core` |

**Steps (`bh_fx_bullet`):**

1. Fill `(0,0)–(4,4)` with `bullet`.
2. Fill `(1,1)–(3,3)` with `bullet-core` (hot center).

No animation. Rotate sprite to match velocity if desired (optional; axis-aligned OK for MVP).

---

### 4.6 Muzzle flash (1–2 frames)

| | |
|--|--|
| **Size** | 8×8 |
| **Colors** | `muzzle`, `muzzle-edge` |

**Frame 0 (`bh_fx_muzzle_0`):**

1. Fill center `(2,2)–(6,6)` `muzzle`.
2. Cross arms: `(0,3)–(8,5)` and `(3,0)–(5,8)` `muzzle-edge` (plus shape).

**Frame 1 (`bh_fx_muzzle_1`):**

1. Smaller core `(3,3)–(5,5)` `muzzle`.
2. Thin cross `(1,3)–(7,5)` / `(3,1)–(5,7)` `muzzle-edge`.

Animation: show 0 then 1 at ~30–40ms each; destroy. Attach at weapon tip in front of player facing.

---

### 4.7 Ammo crate

| | |
|--|--|
| **Size** | 16×16 |
| **Colors** | `crate`, `crate-band`, `crate-mark`, `wall-edge` |

**Steps (`bh_prop_crate`):**

1. Fill `(2,4)–(14,14)` `crate` (12×10 box).
2. Lid band `(2,4)–(14,7)` `crate-band`.
3. Vertical center band `(7,4)–(9,14)` `crate-band`.
4. Ammo mark: two rects forming rough “A” or “+” in `crate-mark` — e.g. `(6,8)–(10,9)` and `(7,9)–(9,12)`.
5. Bottom edge line `(2,13)–(14,14)` `wall-edge`.

No frames. Pickup can flash fill to `accent` for 100ms.

---

### 4.8 Explosive barrel (+ fuse blink)

| | |
|--|--|
| **Size** | 16×16 |
| **Colors** | `barrel`, `barrel-band`, `barrel-fuse`, `barrel-fuse-off`, `warn` |

**Steps (`bh_prop_barrel`):**

1. Body `(4,3)–(12,14)` fill `barrel` (8×11 cylinder-as-box).
2. Hoops: `(4,6)–(12,7)` and `(4,10)–(12,11)` `barrel-band`.
3. Top cap `(5,2)–(11,4)` `barrel-band`.
4. Fuse: `(7,0)–(9,3)` `barrel-fuse` (2×3 stub).

**Fuse blink:** alternate fuse color `barrel-fuse` ↔ `barrel-fuse-off` every 200ms (`bh_prop_barrel_fuse_on` / `_off`). When ignited (FORGE hook), blink 100ms and tint body toward `warn`.

---

### 4.9 Floor tile + wall block

**Floor (`bh_tile_floor`, 16×16):**

1. Fill full cell `floor`.
2. Top edge 1px `floor-alt`; left edge 1px `floor-alt` (cheap seam).
3. Optional checker: if `(tileX + tileY) % 2`, use `floor-alt` as base instead.

**Wall (`bh_tile_wall`, 16×16):**

1. Fill full `wall`.
2. Top 2px `panel-edge` highlight.
3. Bottom 2px `wall-edge` shadow.
4. Optional brick cut: horizontal line at y=8 with `wall-edge`.

Room geometry: tilemap of floor; walls as solid colliders (FORGE). Art does not encode collision — keep drawn wall ≥ hitbox.

---

### 4.10 Blood / hit speck particles

| | |
|--|--|
| **Size** | 4×4 (or 2×2 drawn in 4×4 cell) |
| **Colors** | `blood`, `blood-dark` |

**Variants:**

- `bh_fx_blood_0`: fill `(1,1)–(3,3)` `blood`
- `bh_fx_blood_1`: fill `(0,1)–(2,3)` `blood` + `(2,0)–(3,2)` `blood-dark`
- `bh_fx_blood_2`: single pixel cluster `(1,0)`, `(0,2)`, `(2,2)`, `(3,1)` `blood`

Spawn 2–4 on hit; velocity outward; life 200–400ms; fade by destroying (no alpha gradient required — hard pop-out OK).

---

### 4.11 Score popup digits (mono blocks)

| | |
|--|--|
| **Digit cell** | 8×12 (or 6×10) |
| **Color** | `hud-score` on transparent; outline optional `void` |

**Style:** 3×5 pixel-font digits scaled ×2 into 8×12, blocky only (no antialias).

Digit recipes (3×5 grid, `#` = on):

```
0: ###  1: #    2: ###  3: ###  4: # #  5: ###  6: ###  7: ###  8: ###  9: ###
   # #     #      #      #    # #    #    #      #    # #    # #
   # #     #    ###    ###    ###    ###  ###    #    ###    ###
   # #     #    #        #      #      #  # #    #    # #      #
   ###     #    ###    ###      #    ###  ###    #    ###    ###
```

Popup: spawn above kill, rise −20px over 400ms, destroy. Prefix `+` as 3×5 pattern if needed.

---

### 4.12 HUD bar chips (health / ammo — provisional)

| | |
|--|--|
| **Size** | Health chip 48×8; ammo chip 48×8 (abstract) |
| **Colors** | `panel`, `panel-edge`, fill `ok` (health) / `accent` (ammo), empty `void` |

**Steps:**

1. Outer rect full size stroke/fill `panel`; 1px border `panel-edge`.
2. Inner track inset 2px; fill `void`.
3. Fill width = `pct * innerWidth` with `ok` (health) or `accent` (ammo).
4. Left 4px stripe: `p1`/`p2` if per-player HUD.

**Provisional until ARCADE HUD capture** — layout positions are placeholders (top-left cluster suggested). Do not claim SWF-parity.

---

### 4.13 Touch virtual stick + fire button (mobile chrome)

Must be **opaque enough**, not overlapping playfield center. Sit in lower corners over letterbox/chrome when possible; if over stage, stay in corners with ≥40% opacity panel backing.

**Stick base (`bh_touch_stick_base`)** — 72×72 CSS px logical (draw at stage or screen space per Kimi input layer):

1. Fill circle-approx as square `(0,0)–(72,72)` `panel` at alpha 0.7.
2. Inner ring inset 8px border `panel-edge`.
3. Dead-zone square center 16×16 `void`.

**Knob (`bh_touch_stick_knob`)** — 28×28:

1. Fill `ink` alpha 0.85; center 4×4 `accent`.

**Fire button (`bh_touch_btn_fire`)** — 64×64:

1. Fill rounded-none square `warn` alpha 0.85.
2. Border `panel-edge`.
3. Center label block “FIRE” in mono `ink` 5×5 caps or simple filled triangle.

Placement (B-N2): stick bottom-left; fire bottom-right; both outside center 50% of stage. Desktop hides these.

---

### 4.14 Room select card stub

| | |
|--|--|
| **Size** | 120×80 card |
| **Colors** | `panel`, `panel-edge`, `accent`, `ink`, `muted` |

**Steps:**

1. Fill card `panel`; 1px `panel-edge`.
2. Top 24px bar `void`; mono title “ROOM” in `accent`.
3. Center 32×32 placeholder: nested squares (outer `wall`, inner `floor`, tiny `zombie` 8×8) — procedural mini-map stub, not a screenshot.
4. Bottom label `ink` “Arena N”; sub `muted` “solo / 2P”.

Selected: border becomes `accent` 2px.

---

### 4.15 Death / wave banner text blocks

**Death banner:**

1. Full-width bar height 32 at stage center Y; fill `void` alpha 0.9.
2. Block text “YOU DIED” in `warn` mono caps (build from §4.11 letter blocks or Graphics rects spelling approximate word as 5×7).
3. Hold 1.2s; optional flash border `warn`.

**Wave banner:**

1. Same bar; text “WAVE N” in `hud-score` / `accent`.
2. Hold 0.8s at wave start.

Keep letters as rectangle clusters — no system fonts on the Pixi stage for banners if possible (chrome may use CSS fonts).


### 4.16 Barrel explode frames

| | |
|--|--|
| **Size** | 24×24 (centered on barrel) |
| **Colors** | `muzzle`, `muzzle-edge`, `warn`, `blood`, `void` |

**Frame A (`bh_fx_barrel_explode_0`) — 0–50ms:**

1. Fill center 8×8 with `muzzle`.
2. Four 4×4 `warn` blocks at cardinals offset 6px from center.
3. Hide barrel sprite.

**Frame B (`bh_fx_barrel_explode_1`) — 50–120ms:**

1. Larger ring: 12×12 hollow (outer `muzzle-edge`, inner transparent/`void`).
2. 6–8 `blood` / `muzzle` 2×2 specks on a circle radius ~10.

**Frame C (`bh_fx_barrel_explode_2`) — 120–200ms:**

1. Specks only (reuse §4.10 blood variants); fade by destroy.
2. Optional scorched floor decal: 16×16 `floor-alt` with 4×4 `void` center (persist until room reset).

Readable blast radius cue for PROOF: ring diameter should read ~2–3 player widths (exact damage radius = FORGE/ARCADE TBD).

---

### 4.17 Shotgun pellet spread (weapon VFX)

Concept pack requires shotgun *feel* — not one pellet pretending to be a cone.

| | |
|--|--|
| **Pellet** | Same 4×4 as §4.5 `bh_fx_bullet` |
| **Spread** | Spawn **5 pellets** at muzzle; angles −20°, −10°, 0°, +10°, +20° from facing (degrees) |
| **Speed** | Center pellet 100%; outer pellets 85–90% |
| **Life** | Slightly shorter than pistol bullet (e.g. 70% range) |

**Uzi:** rapid single pellets (reuse §4.5) with tighter muzzle flash (§4.6).
**Grenade (later):** reuse barrel explode frames scaled 0.75 at impact — stub until ARCADE confirms grenade presence.

Naming: logic-only; no unique atlas cells beyond `bh_fx_bullet` + muzzle.

---

### 4.18 Streak multiplier UI chip

| | |
|--|--|
| **Size** | 72×16 (grows with digits) |
| **Colors** | `panel`, `panel-edge`, `hud-score`, `accent`, `warn` |

**Steps (`bh_ui_streak`):**

1. Fill chip `panel`; 1px `panel-edge`.
2. Left label block “x” in `accent` (3×5 mono).
3. Multiplier digits from §4.11 in `hud-score`.
4. At streak ≥ threshold (FORGE TBD): border flashes `warn` 100ms on each increment.

Placement provisional: top-center under wave banner zone. Exact parity TBD ARCADE.

---

### 4.19 Mode select menu stubs

Boot flow from `01-boxhead.md`: Title → Mode select → Room pick.

**Title panel (220×100):**

1. Fill `panel`; border `panel-edge`.
2. Word “BOXHEAD” in `accent` mono caps (rect clusters).
3. Sub “2Play Rooms · native” in `muted`.
4. CTA hint “PRESS PLAY” blinking `ink` ↔ `muted` 400ms.

**Mode cards (three × 100×56):**

| Mode | Accent | Label |
|------|--------|-------|
| Solo Survival | `ok` | SOLO |
| Local Co-op | `p1`+`p2` dual 4px stripes | CO-OP |
| Local Deathmatch | `warn` | DM |

Selected: 2px `accent` border. English only.

---

### 4.20 Room tile-set variants (2–3 arenas)

v1 needs **2–3 rooms** with readable difference at a glance — not one floor forever.

| Set | Floor base | Floor alt | Wall | Prop accent |
|-----|------------|-----------|------|-------------|
| **A — Warehouse** | `floor` `#2C2A26` | `floor-alt` `#26241F` | `wall` `#3E3A34` | crates common |
| **B — Lab** | `#243028` (`floor-lab`) | `#1C2620` | `#355044` (`wall-lab`) | fewer crates; cooler read |
| **C — Yard** | `#2E2A20` (`floor-yard`) | `#262218` | `#4A4030` (`wall-yard`) | barrels common |

Add palette tokens:

| Token | Hex |
|-------|-----|
| `floor-lab` | `#243028` |
| `floor-lab-alt` | `#1C2620` |
| `wall-lab` | `#355044` |
| `floor-yard` | `#2E2A20` |
| `floor-yard-alt` | `#262218` |
| `wall-yard` | `#4A4030` |

Recipe: same draw steps as §4.9 with set tokens swapped. Mini-map on room card (§4.14) should tint to match set.

---

### 4.21 Mobile dual virtual pads — Layout A (2P)

From `01-boxhead.md` controls Layout A (landscape tablet / large phone):

| Side | Controls | Colors |
|------|----------|--------|
| **Left half** | Stick + fire fan for **P1** | stick ring `p1`; fire `warn` |
| **Right half** | Stick + fire fan for **P2** | stick ring `p2`; fire `warn` |

**Per side:**

1. Reuse §4.13 stick base/knob sized ~56–64px (slightly smaller than solo).
2. Fire: one large button **or** 4-dir fire fan (4×36px buttons in a diamond) — MVP: **one fire button** per side.
3. Tiny chrome label “P1” / “P2” above stick in `p1`/`p2`.
4. Keep center 40% of stage clear of chrome.

Layout B/C (solo): hide P2 pad; use single §4.13 stick+fire. Label non-original AI buddy in CSS chrome if enabled — not a Pixi recipe.

---

---

## 5. PixiJS 8 implementation notes

| Topic | Guidance |
|-------|----------|
| Primary API | Prefer **`Graphics`** for MVP placeholders — fast to iterate, no asset pipeline. |
| Baking | Optional later: draw once to `RenderTexture` with `scaleMode: 'nearest'`, then sprites for batching. |
| Pixels | `roundPixels: true` on Application / container where available; keep entity x/y integers after movement integration. |
| Resolution | DevicePixelRatio OK for canvas sharpness, but **stage logical size** stays 640×480 provisional; **integer CSS/scale** via `arcade-core` letterbox. |
| Swarms | Use `ParticleContainer` (or Pixi 8 particle API) / simple sprites for zombies; avoid per-zombie filters. |
| Filters | **Do not** use bilinear / blur filters on gameplay. |
| Tint | P2 can be body-tint toward `p2` **or** stripe-only (§4.1). Prefer stripe-only for silhouette parity with P1. |
| Z-order | floor → shadows → props → actors → bullets → FX → HUD → touch chrome. |
| Clear color | Renderer background / letterbox = `void` `#0B0B0C`. |

---

## 6. Milestone mapping

| ID | Art exit |
|----|----------|
| **B-N0** | `palette.ts` (all tokens) + letterbox / clear color = `void` |
| **B-N1** | Solo wave 3 art: P1, zombie (+ dark), devil stub, bullet + shotgun spread logic, crate, barrel (fuse + explode), room set A tiles, blood, score digits, streak chip, death/wave banners, mode select stubs |
| **B-N2** | Dual-pad Layout A (P1/P2); solo stick fallback; P2 stripe; HUD chips; room sets B/C |
| **B-N3** | Polish walk/shoot/muzzle; room cards tinted per set; realign proportions/HUD when **ARCADE** captures land |

---

## 7. Open locks (ARCADE)

Placeholders are **intentionally approximate**. Do not hard-code “SWF-accurate” sizes until measured:

1. Exact **stage size** (replace 640×480 if wrong).
2. Exact **HUD layout** (chip positions, fonts).
3. Exact **enemy / player proportions** and animation timing from reference clips.
4. Weapon muzzle offsets per weapon tier (MVP: single tip offset).

PIXEL revises recipes after ARCADE dossier updates — not before.

---

## 8. Handoff

| | |
|--|--|
| **This file** | `/workspace/armor-games-research/concept-specs/001-boxhead-native-placeholder-recipes.md` |
| **Chrome companion** | `/workspace/armor-games-research/concept-specs/001-boxhead-2play-visual-direction.md` (wrapper only; superseded for in-game art) |
| **Stack lock** | `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` |
| **Concept pack** | `/workspace/armor-games-research/concept-specs/01-boxhead.md` |
| **Feel dossier** | `/workspace/armor-games-dossiers/boxhead.md` |
| **Language** | **English only** (crew standing rule) |
| **Next** | Kimi implements B-N0/B-N1 Graphics recipes in `apps/boxhead`; FORGE wires hitboxes slightly inside drawn bounds; ARCADE measures reference when SWF/captures available |

---

## Recipe index (count checklist)

| # | Recipe |
|---|--------|
| 1 | Player P1 / P2 body |
| 2 | Idle / walk bob / shoot flash |
| 3 | Zombie basic + dark |
| 4 | Special / devil |
| 5 | Bullet / pellet |
| 6 | Muzzle flash |
| 7 | Ammo crate |
| 8 | Explosive barrel + fuse |
| 9 | Floor tile + wall block |
| 10 | Blood / hit specks |
| 11 | Score popup digits |
| 12 | HUD bar chips |
| 13 | Touch stick + fire |
| 14 | Room select card |
| 15 | Death / wave banners |
| 16 | Barrel explode frames |
| 17 | Shotgun pellet spread |
| 18 | Streak multiplier UI chip |
| 19 | Mode select menu stubs |
| 20 | Room tile-set variants A/B/C |
| 21 | Mobile dual virtual pads (Layout A) |

**Total: 21 recipes** (+ shared palette module as B-N0 deliverable).

Aligned to `/workspace/armor-games-research/concept-specs/01-boxhead.md` §Art needs.

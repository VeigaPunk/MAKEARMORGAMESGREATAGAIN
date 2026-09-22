# Visual direction — Boxhead: 2Play Rooms (chrome / wrapper only)

| Field | Value |
|-------|-------|
| **Slug** | `boxhead` / `boxhead-2play` |
| **Idea** | 001 — Make Armor Games Great Again |
| **Owner** | PIXEL (visual direction) |
| **Consumers** | Kimi Work (shell CSS/HTML + Pixi canvas host) · FORGE (layout tickets) · ARCADE (fidelity gate — art integrity) |
| **Date** | 2026-09-22 America/Sao_Paulo |
| **Status** | draft v0.1 — **chrome + display only**; **superseded for in-game art** by native recipes |
| **In-game art** | → **`001-boxhead-native-placeholder-recipes.md`** (PixiJS 8 procedural placeholders) |
| **Primary path** | Native Pixi replica (Ruffle = reference-only) |

> **Supersession notice:** All **in-game** placeholder art (players, zombies, props, FX, HUD chips on stage, touch controls drawn in Pixi) lives in  
> `/workspace/armor-games-research/concept-specs/001-boxhead-native-placeholder-recipes.md`.  
> This file keeps **wrapper chrome**, **letterbox/display**, and **shared palette tokens** that still apply around the Pixi canvas.

## Scope split (hard rule)

| Layer | PIXEL owns? | Rule |
|-------|-------------|------|
| In-game stage art (characters, zombies, HUD-on-stage, VFX) | **Yes — native path** | Feel-faithful procedural placeholders per **native recipes** doc. Not HD remaster. |
| Viewport presentation (scale, letterbox, nearest-neighbor) | **Yes** | Integer scale + letterbox; crisp nearest-neighbor of the **Pixi canvas**, not asset replacement. |
| Wrapper chrome (page frame, click-to-start, mute, control legend, credits, MAGA card) | **Yes** | Brand language **around** the game only. |
| Portal landing card for this title | **Yes** | Thumbnail treatment + type; must not imply remaster. |
| Ruffle / SWF pixels | **Reference only** | Do not ship Ruffle as product path; use for ARCADE feel checks only. |

ARCADE fidelity checklist items that PIXEL must not break: “Chunky boxy / low-fi art not replaced with glossy remaster”; “Letterbox + integer scale”; “No hitbox stretch.”

## Stage & display (provisional until ARCADE lock)

| Spec | Value | Notes |
|------|-------|-------|
| Stage size | **640×480** provisional | FORGE / `arcade-core` default; re-lock when ARCADE measures reference. |
| Scale modes | `1x` / `2x` / `3x` only | Prefer largest integer that fits viewport; never fractional. |
| Scale algorithm | CSS `image-rendering: pixelated` (or `crisp-edges`) on the **Pixi canvas**; textures `scaleMode: 'nearest'` | No bilinear blur. |
| Letterbox / pillarbox | Solid fill `#0B0B0C` (`void`) | Bars are chrome; stage content centered, never stretched non-uniformly. |
| Fullscreen | Wrapper-owned | Stage rules unchanged inside fullscreen. |
| Safe margins | Chrome ≥ 12px from canvas edge on desktop | Control legend may float below or as overlay that dismisses on first key. |

**Forbidden:** CSS stretch that warps aspect; `transform: scale` with non-integer factors on the stage; filters/blur on the canvas.

## MAGA chrome palette (around the game) — still applies

Inspired by mid-2000s portal chrome + Boxhead’s chunky squares — readable, slightly grimy, not “modern SaaS.” Shared with native gameplay tokens where sensible (see native recipes for full game palette).

| Token | Hex | Use |
|-------|-----|-----|
| `void` | `#0B0B0C` | Page / letterbox |
| `panel` | `#161618` | Chrome panels, click-to-start card |
| `panel-edge` | `#2A2A2E` | 1px borders |
| `ink` | `#E8E4DC` | Primary text |
| `muted` | `#9A958A` | Secondary text, credits |
| `accent` | `#C4F04D` | Focus / primary CTA (toxic arcade lime) |
| `accent-dim` | `#6B8A2A` | Hover/pressed accent |
| `warn` | `#E85D3A` | Danger / deathmatch hint (chrome only) |
| `p1` | `#4DA3FF` | Player 1 legend chip |
| `p2` | `#FF7A4D` | Player 2 legend chip |
| `ok` | `#5DDC8A` | Mute-off / ready state |

**Type:** system UI stack with a monospace fallback for scores/labels in chrome — e.g. `"IBM Plex Mono", ui-monospace, monospace` for legend keys; `"IBM Plex Sans", system-ui, sans-serif` for body. Do not load decorative display fonts that fight the stage look.

**Corners:** 0–2px radius max on chrome cards. Prefer hard rectangles (Boxhead language).

**Borders:** 1px `panel-edge`; optional inset highlight `#FFFFFF14` on top edge of panels only.

## Click-to-start overlay (recipe for Kimi)

Purpose: satisfy browser autoplay policy; must **release focus** after start so dual-keyboard / Pixi input works.

```
┌─────────────────────────────────────────────┐
│  void full-bleed                            │
│     ┌───────────────────────────────┐       │
│     │ panel  max-width 420px        │       │
│     │  MAGA wordmark (small)        │       │
│     │  Title: Boxhead: 2Play Rooms  │       │
│     │  Sub: Local co-op · one keyboard│     │
│     │  [ PLAY ]  accent fill        │       │
│     │  muted: click once, then keys │       │
│     └───────────────────────────────┘       │
└─────────────────────────────────────────────┘
```

- Overlay `pointer-events: auto` until click; then remove or `display:none` and focus the **Pixi canvas** / game container.
- Do **not** keep a transparent full-page catcher after start.
- Button min hit: 44×44 CSS px; label `PLAY` in uppercase tracking +1.

## Control legend chrome (M3 / B-N2)

Shown after start, dismissible (Esc or click ×), or pinned below canvas.

| Chip | Color | Default keys (placeholder until ARCADE capture) |
|------|-------|-----------------------------------------------|
| P1 | `p1` | WASD + shoot TBD |
| P2 | `p2` | Arrows + shoot TBD |

Legend is **chrome documentation**, not rebinding UI. Copy must say keys are provisional until ARCADE captures defaults.

## Mute / chrome controls

- Mute toggle lives in chrome only (ARCADE: no forced mute without user action).
- Icon: simple speaker glyph in `ink`; muted state uses `muted` + slash.
- Placement: top-right of chrome bar, never overlapping stage hit area at 1x–3x.

## Credits / legal strip

Bottom chrome, `muted` 12px:

`Boxhead © Sean Cooper · Hosted for MAGA revival (clearance pending) · Native Pixi build (reference: original Flash)`

Exact legal string TBD after M0 clearance — do not invent rights claims. Do **not** claim “Played via Ruffle” on the native product shell.

## Portal card (stub)

| Element | Spec |
|---------|------|
| Thumb | Until capture: solid `panel` + lime `accent` “BOXHEAD” word in mono — **or** procedural mini room stub from native recipes §4.14. Not an HD redrawn hero. |
| Title | Boxhead: 2Play Rooms |
| Tag | Local 2P · native Pixi · feel-faithful |
| Badge | `NATIVE` small chip (`panel-edge` border; was `EMULATE` on Ruffle spike) |

## Placeholder-art recipes (procedural — **shell chrome only**)

Kimi may generate these in code for **wrapper** UI. **In-game** entities use the **native recipes** file, not this section.

### Recipe A — MAGA wordmark mark (16×16 logical, draw at 2x/3x)

- Canvas 16×16, 4 colors: `void`, `ink`, `accent`, `panel-edge`.
- Draw a 2px-thick square frame inset 1px; fill center with `accent` 6×6 block offset (2,2); punch 2×2 `void` “eye” at (4,4).
- Export as inline SVG or canvas PNG; nearest-neighbor scale only.

### Recipe B — Letterbox / loading bars

- Full-bleed `void`; centered 8×8 spinner as rotating `accent` blocks (4 squares on a ring; 250ms step, no easing).
- No CSS blur; no GIF.

### Recipe C — Control chip

- Height 24px; horizontal padding 8px; fill `panel`; left 4px stripe `p1` or `p2`; mono label `P1` / `P2`.

## Out of scope for this doc

- Full in-game sprite / Graphics recipes → **`001-boxhead-native-placeholder-recipes.md`**
- Audio direction (MAESTRO when present).
- Mechanics / spawn tables (ARCADE / FORGE).
- HD remaster track (explicitly out of mandate).

## Open locks (PIXEL waits on)

1. Native stage size from ARCADE measurement (replace 640×480 if wrong).
2. Default P1/P2 key labels for legend (ARCADE capture).
3. Reference menu frame for portal thumb (optional; procedural stub OK).
4. Final credit string (M0 legal).

## Handoff

- Chrome path: `/workspace/armor-games-research/concept-specs/001-boxhead-2play-visual-direction.md`
- **In-game native art:** `/workspace/armor-games-research/concept-specs/001-boxhead-native-placeholder-recipes.md`
- Stack: `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`
- Next PIXEL: polish B-N3 frames after ARCADE captures; then next-title chrome kits as scheduled.

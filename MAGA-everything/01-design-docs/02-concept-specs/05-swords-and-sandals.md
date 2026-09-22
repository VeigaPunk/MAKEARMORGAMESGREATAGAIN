# Swords and Sandals 2: Emperor's Reign — Native Replica Slice Concept Spec

## Meta

| Field | Value |
|-------|-------|
| **Slug** | `swords-and-sandals` |
| **Working title** | Swords and Sandals 2: Emperor's Reign (native replica — v1 loop slice) |
| **Target version for feel** | **S&S 2: Emperor's Reign (2007 Flash)** |
| **Status** | concept |
| **Rights** | **INTERNAL-NO-PUBLIC** — localhost OK; public needs eGames.com LLC + Whiskeybarrel clearance (active Redux/Steam line). AG was host only. |
| **Ship path** | Native from-scratch turn-based arena RPG slice (**Canvas2D** + DOM chrome). **Not** Ruffle as ship vehicle; **not** shipping Redux as stand-in. |
| **Renderer (locked)** | **Canvas2D** (+ DOM chrome for shop/menus) |
| **Stack lock** | `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` |
| **Language** | English only |
| **Priority** | **5** (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`) |
| **Idea** | 001 — Make Armor Games Great Again (post-pivot) |

## Core loop

**v1 = create gladiator + few fights + shop** — not full campaign:

1. **Create gladiator** — look presets + skill-point spread mapped to combat styles.
2. **Enter arena** — turn-based duel via radial / icon actions (attack / special / potion / etc.).
3. **Resolve fight** — snappy but turn-gated; slapstick hit reactions.
4. **Reward** — gold + XP on win.
5. **Shop** — smithy/armory purchases; unlock-by-level gates as feel allows.
6. **Repeat** for a handful of fights (v1: ~3–5 scripted opponents), then stop — no full tournament tree.

## Feel targets

- Cartoon vector gladiators; tongue-in-cheek Roman fantasy.
- Deliberate menu-driven combat (not action fighter).
- Short fights (~1–3 min) interleaved with shop downtime.
- “One more fight” within a 10–30 min session.

## Controls

### Desktop (keyboard/mouse)

- **Mouse-primary:** click combat icons, shop buttons, character create.
- Keyboard: minimal hotkeys if original had them — **TBD from ARCADE playtest**.

### Mobile (touch mapping)

| Layout | Mapping |
|--------|---------|
| **Large radial / action bar** | Bottom action icons ≥48px; tap target enemy if needed; shop as full-screen panels. |
| **One-handed** | Actions along thumb arc bottom-right; end-turn / confirm prominent. |
| **Two-handed** | Left = gladiator status, right = actions (tablet). |

No twin-stick; this is UI combat.

## Content scope — Playable v1 (IN)

- Gladiator create (limited presets + stat spread).
- 3–5 opponent fights.
- Basic attack / 1–2 specials / potion use (exact kit **TBD from ARCADE playtest**).
- Gold/XP + small shop inventory (few weapons/armor pieces).
- English UI.
- Local persist of one gladiator slot.

## Content scope — Deferred

- Full Emperor's Reign tournament tree / champions / Antares arc.
- Dual ranged weapon ammo + full magic list.
- Ten save slots marketing feature.
- Crusader / S&S3 content.
- Multiplae Ultratus.

## Art needs (for PIXEL)

- Cartoon vector-like gladiators (clean shapes); arena BG; shop keepers; radial icons; hit particles.
- **Do not** make realistic Roman fighters; keep slapstick proportions.

## Audio needs (for MAESTRO)

- Hit / miss / critical slapstick SFX.
- Crowd cheer loop (short).
- Shop buy chime; victory / defeat stingers.
- Light menu music.

Combat formula SFX timing: **TBD from ARCADE playtest**.

## Acceptance hooks (for PROOF)

1. Create gladiator → win at least one fight → buy one item → win another fight.
2. Turn flow never softlocks (always a legal action or end turn).
3. Mobile: complete one fight using only touch.
4. Stats from create visibly affect combat feel (even if numbers TBD — directionally correct).
5. English-only; INTERNAL watermark OK.
6. Session can finish in ≤30 min for v1 content.
7. Death/loss returns to hub without corrupted save.

## Open questions / ARCADE gaps

- Exact skill/stat formulas, damage tables, rage/magic costs.
- Shop price curves / unlock gates.
- Full champion roster (deferred anyway).
- Save schema.
- Hit reaction / SFX frame timing.

**TBD from ARCADE playtest** — do not invent combat tables.

## Notes for FORGE

**Stack (FORGE STACK-LOCKED — cite `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`):**
- App: `armor-games/apps/swords-and-sandals` — **Canvas2D** (+ DOM chrome for shop/menus) + TypeScript + Vite + `arcade-core`.
- Slot #5: deepest systems + highest legal friction — parallel license track from day 1 (eGames / Whiskeybarrel).
- Prior EMULATE/Ruffle ship path superseded; Ruffle AG listing = feel reference only if used.


- Entities: `Gladiator`, `Opponent`, `CombatAction`, `StatusEffect`, `ShopItem`, `ArenaBout`, `SaveSlot`.
- UI-heavy; low entity count; still keep payload light.
- **No stack prescription.**
- Lowest priority — expect formula work to wait on ARCADE captures.

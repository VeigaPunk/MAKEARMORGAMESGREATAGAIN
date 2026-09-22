# Fidelity dossier — Swords and Sandals

| Field | Value |
|-------|-------|
| **Slug** | `swords-and-sandals` |
| **Idea** | 001 — Make Armor Games Great Again |
| **Status** | skeleton |
| **Last update** | 2026-09-22 |

## Target version(s)

| Role | Version | Year | Notes |
|------|---------|------|-------|
| **PRIMARY (working)** | Swords and Sandals 2: Emperor's Reign | 2007-01-07 | Peak AG nostalgia; Ruffle-listed on Armor Games; AS2 |
| Authenticity alt | S&S I: Gladiator | 2006 | Simpler entry loop |
| Out of scope (genre shift) | S&S Crusader | 2007 | Strategy, not arena RPG |
| Not “original Flash” | S&S 2 Redux / Steam Classic Collection | 2017+ / 2019 | Remakes/packages — different artifact |

**Evidence:** IDEATOR research pack `/workspace/armor-games-research/deep-dive.md` + `summary.json` (2026-09-22). Secondary web sources cited there — not primary playthroughs.

## Original mechanics

Documented from secondary research (not yet verified by ARCADE playthrough):

1. Create gladiator (look + skill-point spread → combat styles).
2. Arena duel: turn-based via radial action icons (attack / special / potion / etc.).
3. Win → gold + XP → smithy/armory gear treadmill; unlock by level.
4. Tournaments / champions; optional saves (historically paywalled on some full builds).
5. S&S 2 adds: ranged second weapon (finite ammo), spells, potions, richer tournaments.

### Evidence gaps
- Exact skill/stat formulas, damage tables, rage/magic costs — **not captured**.
- Full tournament tree / champion roster for Emperor's Reign — **not captured**.
- Shop price curves and unlock gates — **not captured**.
- SharedObject / save schema fields — **not captured**.

## Controls

- **Primary:** mouse (click combat icons, shop UI).
- **Keyboard:** minimal (research claim; **unverified keybinds**).
- **Session length (reported):** ~10–30 min typical; campaigns hours with saves.

### Evidence gaps
- Exact hotkeys (if any), focus traps, right-click behavior — **gap**.
- Save slots UI (“up to ten gladiators” marketed on AG listing) — **confirm against live SWF/Ruffle**.

## Feel / pacing

- Cartoon vector gladiators; snappy but **turn-gated** combat; slapstick hit reactions.
- Short fights (reported 1–3 min) interleaved with shop/level-up downtime.
- Tone: tongue-in-cheek Roman fantasy; “one more tournament” loop.
- Distinct from action fighters: deliberate, menu-driven RPG drip.

### Evidence gaps
- Frame timing of hit reactions, sound cue timing, camera shake — **needs playthrough/recording**.
- Music/SFX identity checklist — **gap**.

## Asset / audio situation

- **Art:** predominantly vector Flash cartoon characters/UI; particle combat flourishes (research).
- **Runtime original:** AVM1 SWF, ActionScript **2** (Joyce on Redux: original was AS2).
- **Audio:** not inventoried.

### Evidence gaps
- SWF hash / trusted binary path — **gap**.
- Font, locale, embedded audio list — **gap**.
- Asset ownership vs host (AG was host, not IP owner) — legal note only; see research.

## “Played exactly as original” requirements (no Flash plugin)

Working definition for this title (EMULATE-first per research):

1. **Binary fidelity path:** Emperor's Reign SWF runs without Adobe Flash plugin (e.g. Ruffle or equivalent AVM1 host) with combat outcomes matching original formulas.
2. **Input:** mouse-driven radial combat + shop must remain click-primary; no forced gamepad remapping that changes turn timing.
3. **Progression:** gladiator create → fight → gold/XP → gear → tournaments must be completable end-to-end.
4. **Saves:** multi-slot gladiator persistence must work on modern browsers (SharedObject equivalent or documented HYBRID shell) without breaking economy.
5. **Display:** readable UI at modern resolutions without breaking hit-target sizes (scale policy TBD).
6. **Not acceptable as “exact”:** shipping Redux/AIR as stand-in for 2007 Flash.

### Evidence gaps
- Compatible Ruffle build pin + known broken APIs for this SWF — **gap**.
- Side-by-side parity checklist (damage, XP, shop) — **gap**.
- IP clearance (eGames.com LLC + Whiskeybarrel) — **required before public ship**; out of ARCADE ownership but blocks “exact” public distribution.

## Sources / provenance

- Seeded from: IDEATOR research pack `/workspace/armor-games-research/deep-dive.md` + `summary.json` (2026-09-22). Secondary web sources cited there — not primary playthroughs.
- ARCADE playthrough: **none yet**
- Primary SWF in hand: **no**

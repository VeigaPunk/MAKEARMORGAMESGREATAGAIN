# BUILD CARD — Swords and Sandals 2: Emperor's Reign (v1 loop slice)
**Slug:** `swords-and-sandals` · **Priority:** 5 (FORGE STACK-LOCKED) · **Renderer:** Canvas2D (+ DOM chrome for shop/menus) · **App:** `02-code/armor-games/apps/swords-and-sandals` (not yet scaffolded)
**Card sources:** `02-concept-specs/05-swords-and-sandals.md` (SPEC), `05-dossiers/swords-and-sandals.md` (DOSSIER), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK), `04-research/deep-dive.md` §1 (RESEARCH)
**Build state:** not started. No tickets exist yet. Highest legal friction — parallel license track from day 1 (eGames.com LLC + Whiskeybarrel; STACK §3).

## 1. Core loop (SPEC §Core loop — v1 = create + few fights + shop, NOT full campaign)
1. **Create gladiator** — look presets + skill-point spread mapped to combat styles.
2. **Enter arena** — turn-based duel via radial/icon actions (attack / special / potion / etc.).
3. **Resolve fight** — snappy but turn-gated; slapstick hit reactions.
4. **Reward** — gold + XP on win.
5. **Shop** — smithy/armory purchases; unlock-by-level gates as feel allows.
6. Repeat ~3–5 scripted opponents → stop (no full tournament tree).

Session: fights ~1–3 min interleaved with shop downtime; "one more fight" in 10–30 min (SPEC §Feel targets; DOSSIER §Feel).

## 2. Controls
### Desktop (SPEC §Controls)
- **Mouse-primary:** click combat icons, shop buttons, character create.
- Keyboard: minimal hotkeys if original had them (**TBD ARCADE**; DOSSIER marks unverified).
### Mobile (SPEC §Controls)
- Large radial/action bar: bottom icons ≥48px; tap target enemy if needed; shop full-screen panels.
- One-handed: actions along thumb arc bottom-right; end-turn/confirm prominent.
- Two-handed tablet: left status, right actions.
- No twin-stick — UI combat.

## 3. Entities (SPEC §Notes for FORGE)
`Gladiator`, `Opponent`, `CombatAction`, `StatusEffect`, `ShopItem`, `ArenaBout`, `SaveSlot`.
UI-heavy; low entity count; keep payload light.

## 4. Progression
- Gladiator create: limited presets + stat spread (v1).
- Gold/XP economy + small shop inventory (few weapons/armor).
- Local persist of **one** gladiator slot (v1; original marketed up to ten — DOSSIER §Controls, deferred).
- Stats from create must visibly affect combat feel — directionally correct even with TBD numbers (SPEC hook 4).
- Exact formulas/prices/gates: **TBD ARCADE — do not invent combat tables** (SPEC §Open questions).

## 5. Win/lose
- Win fight → gold + XP → shop → next opponent.
- Lose → return to hub without corrupted save (SPEC hook 7).
- v1 ends after ~3–5 scripted opponents; no tournament completion.

## 6. Art direction (SPEC §Art needs)
- Cartoon vector-like gladiators (clean shapes); arena BG; shop keepers; radial icons; hit particles.
- **Do not** make realistic Roman fighters; keep slapstick proportions.

## 7. Audio recipes (SPEC §Audio needs)
- Hit/miss/critical slapstick SFX; crowd cheer loop (short); shop buy chime; victory/defeat stingers; light menu music.
- Combat formula SFX timing: **TBD ARCADE**.
- No MAESTRO bible yet — author per `06-audio/README.md` schema.

## 8. Acceptance criteria (SPEC §Acceptance hooks)
1. Create gladiator → win ≥1 fight → buy 1 item → win another fight.
2. Turn flow never softlocks (always a legal action or end turn).
3. Mobile: complete one fight touch-only.
4. Create stats visibly affect combat feel (directionally).
5. English-only; INTERNAL watermark OK.
6. v1 session finishes ≤30 min.
7. Death/loss returns to hub without corrupted save.

## 9. Open TBDs (SPEC §Open questions; DOSSIER §Evidence gaps)
Skill/stat formulas, damage tables, rage/magic costs · shop price curves/unlock gates · champion roster (deferred) · save schema · hit-reaction/SFX frame timing · hotkeys · SharedObject fields · IP clearance (eGames + Whiskeybarrel — blocks public ship).

## 10. Out of scope (SPEC §Deferred)
Full Emperor's Reign tournament tree/champions/Antares arc · dual ranged ammo + full magic list · ten save slots · Crusader/S&S3 content · Multiplae Ultratus · shipping Redux/AIR as stand-in (DOSSIER §Exact requirements — not acceptable).

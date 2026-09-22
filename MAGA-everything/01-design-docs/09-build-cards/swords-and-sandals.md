# BUILD CARD — Swords and Sandals 2: Emperor's Reign (v1 loop slice)
**Slug:** `swords-and-sandals` · **Priority:** 5 (FORGE STACK-LOCKED) · **Renderer:** Canvas2D (+ DOM chrome for shop/menus) · **App:** `02-code/armor-games/apps/swords-and-sandals` (scaffolded — forge R04 `50665ba`) · SPEC scope/rights: §Meta, §Content scope—Playable v1 (IN)
**Card sources:** `02-concept-specs/05-swords-and-sandals.md` (SPEC), `05-dossiers/swords-and-sandals.md` (DOSSIER), `03-stack-and-tickets/001-native-stack-and-plan.md` (STACK), `04-research/deep-dive.md` §1 (RESEARCH)
**Build state:** scaffolded `50665ba` (`src/main.ts` 29 ln + DOM chrome + INTERNAL badge). Highest legal friction — parallel license track from day 1 (eGames.com LLC + Whiskeybarrel **+ verify 3RD Sense residual rights** — original 2007 SWF publisher dropped from the chain, DD-27; STACK §3).

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
- Keyboard: minimal hotkeys if original had them (**TBD ARCADE**; DOSSIER marks unverified). ⚠ `Input.attach` preventDefaults bound keys at window level — DOM panels/text entry get hijacked (DD-37).
### Mobile (SPEC §Controls)
- Large radial/action bar: bottom icons ≥48px (CSS px — DD-40); tap target enemy if needed; shop full-screen panels.
- One-handed: actions along thumb arc bottom-right; end-turn/confirm prominent.
- Two-handed tablet: left status, right actions.
- No twin-stick — UI combat.

## 3. Entities (SPEC §Notes for FORGE)
`Gladiator`, `Opponent`, `CombatAction`, `StatusEffect`, `ShopItem`, `ArenaBout`, `SaveSlot`.
UI-heavy; low entity count; keep payload light.

## 4. Progression
- Gladiator create: limited presets + stat spread (v1).
- Gold/XP economy + small shop inventory (few weapons/armor).
- Local persist of **one** gladiator slot (v1; original marketed up to ten — DOSSIER §Controls, deferred). Dossier exact-play bar (tournaments completable + multi-slot) exceeds v1 slice — post-v1 fidelity bar, DD-66.
- Stats from create must visibly affect combat feel — directionally correct even with TBD numbers (SPEC hook 4).
- Exact formulas/prices/gates: **TBD ARCADE — do not invent combat tables** (SPEC §Open questions).

## 5. Win/lose
- Win fight → gold + XP → shop → next opponent.
- Lose → return to hub without corrupted save (SPEC hook 7).
- v1 ends after ~3–5 scripted opponents; no tournament completion.
- **Shipped facts (r04 live probe, `src/main.ts`):** `persist()` saves `{gladiator, defeated}` but load path drops `defeated` and always boots `mode='create'` — saved ladder unreachable (DD-78); each reload grants +6 free stat points (DD-79); duplicate shop buys charge full price for a no-op (DD-80); Imperial Buckler L3-gate unreachable pre-ladder-complete (DD-81); complete screen replayable for unbounded gold (DD-90); `g.name` raw into innerHTML (DD-84); opponent HP freeze unreproduced — watch item (DD-85); mouse-only, no keyboard controls; `'shoot'` SFX on sword hit; potions finite, never restocked.
- **r06 WIP (uncommitted `git diff`, DD-94):** save-aware boot — `mode='hub'` + `defeated` restored + `points=0` when a save exists (DD-78/DD-79 fixes); `owned[]` persisted, owned items disabled + "Owned" (DD-80 fix); Buckler re-gated L3→L2 (DD-81 fix). Still open in-tree: DD-90 complete-screen replay (`win()` still `18+defeated*8`), DD-84 innerHTML, no keyboard controls.

## 6. Art direction (SPEC §Art needs)
- Cartoon vector-like gladiators (clean shapes); arena BG; shop keepers; radial icons; hit particles.
- **Do not** make realistic Roman fighters; keep slapstick proportions.

## 7. Audio recipes (SPEC §Audio needs)
- Hit/miss/critical slapstick SFX; crowd cheer loop (short); shop buy chime; victory/defeat stingers; light menu music.
- Combat formula SFX timing: **TBD ARCADE**.
- No MAESTRO bible yet — author per `06-audio/README.md` schema. Shipped audio contract today = 5 `Sfx.preset` names + note-array music slot (DD-09).

## 8. Acceptance criteria (SPEC §Acceptance hooks)
1. Create gladiator → win ≥1 fight → buy 1 item → win another fight.
2. Turn flow never softlocks (always a legal action or end turn).
3. Mobile: complete one fight touch-only.
4. Create stats visibly affect combat feel (directionally).
5. English-only; INTERNAL watermark OK.
6. v1 session finishes ≤30 min.
7. Death/loss returns to hub without corrupted save.

## 9. Open TBDs (SPEC §Open questions; DOSSIER §Evidence gaps)
Skill/stat formulas, damage tables, rage/magic costs · shop price curves/unlock gates · champion roster (deferred) · save schema · hit-reaction/SFX frame timing · hotkeys · SharedObject fields · IP clearance (eGames + Whiskeybarrel + 3RD Sense residual — DD-27; blocks public ship) · S&S2 date day-precision unverified (DD-55).

## 10. Out of scope (SPEC §Deferred)
Full Emperor's Reign tournament tree/champions/Antares arc · dual ranged ammo + full magic list · ten save slots · Crusader/S&S3 content · Multiplae Ultratus · shipping Redux/AIR as stand-in (DOSSIER §Exact requirements — not acceptable).

**Posture:** INTERNAL-NO-PUBLIC — localhost/internal OK; public ship blocked on the clearance chain above (SPEC §Meta). **DOM-chrome seam:** DOM owns shop/panels/buttons; canvas owns combat view. **Gates:** G0–G5 per STACK §3.

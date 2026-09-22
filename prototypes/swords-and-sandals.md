# Prototype card — Swords & Sandals 2: Emperor's Reign (mechanics proof)

**File:** `prototypes/swords-and-sandals.html` — single file, zero deps, opens via `file://`.
**Spec:** `01-design-docs/02-concept-specs/05-swords-and-sandals.md` · **Dossier:** `05-dossiers/swords-and-sandals.md`
**Status:** verified in headless Chromium 2026-09-22 — full loop exercised via real pointer + touch input only; read-only `window.__proto` for observation. Zero console errors, zero external requests.

## What the spec demands (cited)

- Core loop: "create gladiator + few fights + shop — not full campaign": create → turn-based duel via icon actions → gold + XP → smithy/armory → repeat ~3–5 scripted opponents (spec §Core loop 1–6).
- Feel: "deliberate menu-driven combat (not action fighter)"; "short fights (~1–3 min) interleaved with shop downtime" (spec §Feel targets).
- Controls: "mouse-primary: click combat icons, shop buttons"; mobile "bottom action icons ≥48px" (spec §Controls).
- Content IN: gladiator create (presets + stat spread), 3–5 opponents, basic attack / 1–2 specials / potion, gold/XP + small shop, English UI, "local persist of one gladiator slot" (spec §Content scope IN).
- Acceptance: create→win→buy→win (#1); "turn flow never softlocks (always a legal action or end turn)" (#2); "complete one fight using only touch" (#3); "stats from create visibly affect combat feel" (#4); "death/loss returns to hub without corrupted save" (#7).
- **"TBD from ARCADE playtest — do not invent combat tables"** (spec §Open questions): every numeric constant below is a declared guess, not parity data.

## What the prototype proves (all via real input — `pointerdown`/`touchscreen.tap` + canvas hit-regions)

| Mechanic | Evidence |
|---|---|
| Full v1 loop | create (name + look + 15-pt stat spread) → 5 scripted opponents → champion screen. Acceptance #1 verbatim: created → won fight 1 (+60g/+40xp) → bought Legionnaire Sword (140→20g, auto-equip) → won fight 2. |
| Turn-gated combat | player phase → action → enemy phase (650ms telegraph) → player phase; actions disabled during enemy phase. ATTACK + TAUNT always legal → no softlock path exists (hook #2). |
| Action kit | ATTACK (always), HEAVY (×1.7 dmg, −10% hit, 30 stamina — refused when <30), POTION (+35hp, stock 1→0 observed), TAUNT (+18 stamina), HOLD. Log lines observed: "quaffs a potion (+35)", "lands a HEAVY BLOW", "heavy swing misses!". |
| Stats affect combat (hook #4) | STR 13 gladiator dealt 40–64 dmg hits vs STR-4 opponent dealing ~10–20 through armor; AGI 9 produced observed misses both directions; VIT 8 → 88 HP vs base 40. Directionally correct, numbers declared guesses. |
| Shop + level gates | weapons/armor rows with price + level lock; buy→auto-equip; insufficient gold and level-locked items refused via disabled buttons (observed: War Cleaver lvl3 refused at lvl2; Leather Hide refused at 20g). Potion stock capped at 3. |
| Defeat → hub, save intact (hook #7) | taunt-only fight vs GAIUS → DEFEAT screen → −10% gold (110→99) → LIMP HOME → hub, gladiator/level/progress preserved, save rewritten. |
| Touch-only fight (hook #3) | entire champion fight (EMPEROR ANTAEUS) completed using `page.touchscreen.tap` only — real touch events on ≥48px canvas hit-regions; CHAMPION screen reached. |
| Persistence | `localStorage sas_proto_save` written on create/victory/defeat/shop-exit; reload → CONTINUE restored gold/level/nextOpp/gladiator exactly. |
| Champion + completion | 5th opponent flagged champion → CHAMPION screen "v1 slice complete"; hub shows "all opponents defeated". |
| Zero-dep | `file://` load; 2 recorded requests = the file itself across reloads; zero console errors. |

## Bugs found by empirical verification (fixed in-file)

1. **Victory/defeat softlock** — `onBtn` handled `confirm` only for `combat`/`champion` screens; RETURN TO HUB on victory/defeat was dead → run could not continue past first win. Violated spec hook #2 directly. Fixed: result screens share the confirm→hub branch. *Monorepo note: every terminal combat state needs an explicit exit action — audit state machine transitions, not just combat internals.*

## What it deliberately omits (spec-deferred or out of core loop)

- **Numeric parity** — all constants declared guesses (dmg = weapon+STR×2 ±25% −def; hit = .75+.03·ΔAGI clamped .5–.97; crit 10% ×1.5; XP curve; prices; opponent stats). Dossier marks every formula an evidence gap; spec forbids inventing tables — these exist only to make the loop runnable.
- **Rage/magic/ranged second weapon** — spec §Deferred ("dual ranged weapon ammo + full magic list"); dossier evidence gap on costs.
- **Full tournament tree / champions / Antares arc** — spec §Deferred; champion opponent included only as v1 punctuation.
- **DOM chrome** — spec locks Canvas2D + DOM chrome for shop/menus; prototype renders shop in-canvas for zero-dep consistency with prior prototypes. DOM-vs-canvas chrome is a monorepo decision, not a mechanics risk.
- **Audio, real art, hit-reaction frame timing** — dossier evidence gaps; slapstick reduced to lunge/flash/shake/floating-text primitives.
- **Ten save slots, character-creation cosmetics beyond 3 looks** — spec §Deferred / marketing feature.
- **Mobile layout variants** (one-handed thumb arc, two-handed tablet) — spec §Controls defines them; prototype proves only the ≥48px touch-target requirement.
- **eGames/Whiskeybarrel IP** — INTERNAL-NO-PUBLIC; all art is canvas primitives.

## Recommended monorepo carry-forward (for `apps/swords-and-sandals`, Canvas2D + DOM chrome + arcade-core)

1. **Explicit combat state machine** — `player_phase → resolve → enemy_phase → resolve → result → hub`; the softlock found here was a missing transition on result screens. Encode transitions as data; unit-test that every state has an exit (spec hook #2 is a state-machine property).
2. **Guaranteed-legal fallback action** — TAUNT/HOLD always available regardless of resources; keeps hook #2 true even when stamina/potions are empty.
3. **Stats-as-data opponent roster** — `{name,hp,str,agi,def,gold,xp}` rows made the 5-opponent ladder trivially authorable; extend to full roster without engine changes.
4. **Shop gate evaluation at render time** — disabled buttons computed from `{level, gold, owned}` each frame; no separate "can buy" logic to drift. DOM chrome version: same rule, bind `disabled` to the same predicate.
5. **Save-on-transition, not on-interval** — writes on create/victory/defeat/shop-exit kept the single slot always coherent; defeat path proved no corruption (hook #7). Keep the schema flat and versioned.
6. **Enemy AI as priority list** — potion-if-hurt-once > heavy-if-able > attack; readable, tunable, and produced visible variety without scripting.
7. **Stamina as the pacing dial** — regen 12/turn vs heavy cost 30 forced attack/heavy alternation; the single knob that made fights feel deliberate rather than spammy. Expose for ARCADE tuning.
8. **Verification pattern:** read-only `window.__proto` (screen, combat phase, hp/stamina, inventory, save presence) + real pointer/touch events proves the loop without state injection — same standard as the other three prototypes. Driver note: `tab.run` can't see page globals — use `tab.evaluate`; `page.touchscreen.tap` produces real touch→pointer events for hook #3.
9. **Declared-guess banner** — constants live in one labeled block at file top; when ARCADE playtest lands real tables, swap the block, keep the loop. The card's "declared guess" framing should survive into the monorepo constants file.

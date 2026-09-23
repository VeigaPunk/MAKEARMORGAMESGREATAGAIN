# Ship record — Swords & Sandals 2: Emperor's Reign (remake)

Original reference: Swords & Sandals 2: Emperor's Reign (2007) — gladiator
RPG: character creation, shops, turn-based arena ladder, persistence.
Highest legal-friction title in the roster (DD-27) — player-facing names,
characters, and art MUST be original evocations.

Status: **NOT SHIPPED** — survey complete, rendition EXTENDED; the two
blocker-class defects (D-51/52/53 stored XSS, D-54 unwinnable ladder) are
**FIXED and re-proven with real input** (ship-run 2026-09-22, round 2).
Remaining before ship: IP written clearance (INTERNAL-NO-PUBLIC badge),
D-24 (WATCH), D-31 (PARTIAL), full tournament tree (content decision).
Last updated: 2026-09-22 (ship-run 2026-09-22 round 2).

## Survey — implementations found

1. `prototypes/swords-and-sandals.html` (822 lines, zero-dep, file://) —
   full v1 loop proven: create → 5 scripted opponents → champion; turn-gated
   combat (650ms enemy telegraph) with ATTACK/HEAVY/POTION/TAUNT/HOLD;
   render-time shop gates from `{level,gold,owned}`; save-on-transition
   `sas_proto_save` (defeat-safe); enemy AI priority list; stamina pacing
   dial; r1 colosseum art. NOTE: `__proto` here is a **function**
   (`window.__proto=()=>({...})`, line 802) — drivers must call it, not
   read it. Deferred marker at line 742: full tournament tree.
2. `MAGA-everything/02-code/armor-games/apps/swords-and-sandals` (1 file,
   56 dense lines / ~12KB, Canvas2D+DOM) — create (3 looks/4 stats) →
   hub → turn-based arena vs 4 scripted opponents → 3-item shop; save
   validator (`validSave()` corrupt-rejection matrix re-proven 8/8);
   mouse-primary; keyboard verified (no custom bindings — native DOM
   Tab/Enter/Space + typed input; see Verification).

Docs: concept spec `05-swords-and-sandals.md` (slice: create gladiator +
3–5 scripted fights + small shop, one save slot), dossier skeleton, build
card.

## Decision: EXTEND `apps/swords-and-sandals`

Loop and save validator are proven on the app; proto is the mechanics
contract. Blockers fixed forward 2026-09-22 (round 2); no content work
started beyond the D-54 tuning.

## Known defects (blockers first)

- **FIXED (2026-09-22): D-51 / D-52 / D-53 — stored XSS** via gladiator
  name (was live-proven `window.p===1`). Fixes in
  `apps/swords-and-sandals/src/main.ts`:
  - `esc()` HTML-escapes `g.name` at the HUD innerHTML sink (the
    live-proven vector); log pane rebuilt textContent-safe (createElement
    + `textContent` per line, same `<div>` structure);
  - `g.look` (also save-controlled, used in portrait `src`/`alt`
    attributes) clamped to the known `['Scarlet','Azure','Gold']` set at
    load — a tampered `look` string can no longer break out of an
    attribute;
  - name constrained at creation: length ≤ 24, charset
    `[A-Za-z0-9 '&"._-]` with strip+trim, fallback "Unnamed Gladiator";
  - `validSave()` untouched — save format compatible, corrupt-rejection
    matrix re-proven (8/8 corrupt → create mode, valid mid-ladder save →
    hub).
  Injection matrix re-run with real input: `<img src=x
  onerror=window.p=1>`, `<script>window.p=1</script>`, quote/attribute
  breaker `" autofocus onfocus=window.p=1 x="`, benign `Max "The Hammer"
  & Co.` (verbatim preserved) — zero execution across create → hub →
  shop → arena → combat turn → reload → shop again; plus a fully
  tampered attacker-save (payload name + attribute-breaking look):
  clamped, escaped, zero execution. Evidence:
  `verification/evidence/sr1-sas-run.log` (61 checks ALL PASS).
- **FIXED (2026-09-22): D-54 — ladder unwinnable from Snorter onward.**
  Diagnosis (app math, pure play): player effective HP pool is
  `24+4*vit` (32–56) + 2 potions; enemy damage is
  `str+0..2−def−⌊armor/2⌋−3(guard)` with **no enemy miss chance**, so a
  fight's incoming damage ≈ `turns × (str−def−⌊armor/2⌋−2)`. Old curve:
  Snorter (62hp/10str/5def) needed ~11 turns while dealing ~49 incoming
  vs ~56 pool — coin-flip at best; Champion (78hp/12str/7def) needed ~14
  turns at ~96–105 incoming vs ~56 pool — mathematically dead
  (~170–190% of pool), and total old winnings (120g) were less than the
  combined shop cost (125g), so the full kit was unaffordable anyway.
  Minimal tuning (constants only, formulas/mechanics unchanged):
  - Snorter: hp 62→56, str 10→9, def 5→4; Champion: hp 78→66,
    str 12→10, def 7→6 (keeps them the hardest bouts, removes the wall);
  - rewards: win gold `18+8d` → `25+10d` (25/35/45/55; first three = 105g
    so the kit is purchasable before the Champion);
  - shop: Bent Bronze Sword 22g→20g bonus +2→+3; Lucky Sandals 38g→32g;
    Imperial Buckler 65g→48g (kit total 125g→100g, gates unchanged);
  - potion heal 12→16 (starting belt of 2 now meaningfully covers one
    bad fight).
  Result (verified): a middle build (str4/agi3/vit4/def3) clears all 4
  bouts buying sword→sandals→buckler across the ladder and reaches the
  V1 COMPLETE screen with 0 defeats; expected incoming per fight is now
  ~6/~22/~34/~37 vs a 40+32 pool (was ~9/~30/~49/~96).
- OPEN: D-24 (WATCH), D-31 (PARTIAL).
- FIXED (keep fixed): D-23, D-27, D-28, D-29, D-30, D-51/52/53, D-54.

## Placeholders to resolve before ship

Proto `DECLARED GUESSES` (`prototypes/swords-and-sandals.html:17-22`) —
combat numbers, stamina pacing. App shop/economy gates were tuned as part
of the D-54 fix (see above) but remain declared guesses pending ARCADE
playtest against the original's tables. Thumb-arc mobile layout unproven
(proto used bottom strip; `MECHANICS-DIGEST.md` known-unproven list).

## Verification

Recorded commands (last observed results, 2026-09-22 round 2):
- `cd MAGA-everything/02-code/armor-games && npm install` — 35 packages,
  0 vulnerabilities (lockfile unchanged; esbuild postinstall warn is
  benign, binary present).
- `npm run typecheck -w @maga/swords-and-sandals` — clean.
- `npm run build -w @maga/swords-and-sandals` — clean (11KB bundle).
- `npm run dev:sands` (port 5178) + Playwright-core 1.63.0 driver with
  system `/usr/bin/chromium` (no downloaded browsers), real
  clicks/keyboard via CDP, reads via `window.__maga` only —
  `verification/evidence/sr1-sas-run.log`: **52 checks, 0 failures
  (ALL PASS)**:
  - XSS injection matrix (4 payload names incl. benign control, stored
    via real typing, traversed create→hub→shop→arena→combat→reload):
    zero execution (`window.p` never set), zero console errors. The only
    console noise is a pre-existing `/favicon.ico` 404, identical on the
    benign control (unrelated to payloads; left as-is, minimal diff).
  - Tampered attacker-save (payload name + attribute-breaking `look`):
    look clamped to Scarlet, name escaped, zero execution through
    shop+arena.
  - `validSave()` corrupt-rejection matrix: 8/8 corrupt saves → fresh
    create mode, no errors; valid mid-ladder save → hub.
  - Full ladder clear with real input (driver strategy: Special every
    turn — it strictly dominates Attack — potion when HP ≤ 18; build
    str4/agi3/vit4/def3, gladiator "Maximus QA"):
    fight1 Tin Can Tim 5 turns; fight2 Baron Bonk 6 turns; save/load
    round-trip mid-ladder (state + raw save bytes identical after
    reload, run continued); fight3 The Sand Snorter 14 turns, 2 potions;
    fight4 Emperor's Champion 38 turns across 4 attempts (3 honest
    defeats, retry loop works) → **V1 COMPLETE**, `defeated=4`,
    Return-to-Hub after complete works. The previous run cleared the
    same ladder 0-defeat in 14 turns, so the Champion now reads
    "hard but fair" instead of a wall.
  - Keyboard map: no custom bindings (documented in app README) — real
    key events verified: Tab traverses all controls (11 distinct stops),
    Enter/Space activate focused stat buttons, name field takes typed
    text + backspace/digit editing; no errors.
- Evidence files: `verification/evidence/sr1-sas-run.log`,
  `sr1-sas-create.png`, `sr1-sas-shop.png`, `sr1-sas-arena.png`
  (Champion bout, 42/66 HP), `sr1-sas-complete.png` (V1 COMPLETE,
  +55 gold victory line).

- **sr1 root entry point (2026-09-23):** built via `npm run build:fleet`
  (staged to `games/swords-and-sandals/`), served by `python3 -m
  http.server 8123` from the repo root; hub card real-mouse-click ->
  create screen -> real typed name "KIMI" + 6x strength+ clicks ->
  "Enter the Arena" -> hub -> "Start First Bout" -> arena (opponent HP
  34) — 0 console errors, 0 non-local requests. Evidence:
  `verification/evidence/sr1-hub-run.log`, `sr1-hub-swords-and-sandals.png`.

Ship-gate checklist: full ladder clear to champion/complete screen with
real input — PASS; XSS injection matrix clean — PASS; keyboard map
verified — PASS (no custom bindings by design, native DOM behavior
proven); save/load round-trip — PASS.

## Deferrals

Full tournament tree (proto line 742) was deferred by the proto run —
reassess at content time; the mission bar is the original's scope as
documented in the concept spec (3–5 scripted fights slice floor). The
4-bout v1 ladder is now winnable end-to-end, so the deferral no longer
blocks the completion claim.

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/`, `prototypes/`, plus my own knowledge of
the original game. Network use: none beyond a single `npm ping` probe. No
web/GitHub searches about this project, no forks/copies, no third-party
remakes of the original were consulted.

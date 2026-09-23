# Ship record — Swords & Sandals 2: Emperor's Reign (remake)

Original reference: Swords & Sandals 2: Emperor's Reign (2007) — gladiator
RPG: character creation, shops, turn-based arena ladder, persistence.
Highest legal-friction title in the roster (DD-27) — player-facing names,
characters, and art MUST be original evocations.

Status: **NOT SHIPPED** — survey complete, rendition EXTEND in progress;
**two blocker-class defects open (D-51/52/53 XSS, D-54 unwinnable ladder)**.
Last updated: 2026-09-22 (ship-run 2026-09-22).

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
   53 dense lines / ~11.5KB, Canvas2D+DOM) — create (3 looks/4 stats) →
   hub → turn-based arena vs 4 scripted opponents → 3-item shop; save
   validator (`validSave()` corrupt-rejection matrix proven). Mouse-primary;
   keyboard unverified (README).

Docs: concept spec `05-swords-and-sandals.md` (slice: create gladiator +
3–5 scripted fights + small shop, one save slot), dossier skeleton, build
card.

## Decision: EXTEND `apps/swords-and-sandals`

Loop and save validator are proven on the app; proto is the mechanics
contract. Fix-forward the blockers before any content work.

## Known defects (blockers first)

- **OPEN HIGH: D-51 / D-52 / D-53 — stored XSS** via gladiator name
  (live-proven `window.p===1` at r05). Must be fixed and re-proven before
  any ship claim; sanitization + re-run the injection matrix.
- **OPEN MED: D-54 — ladder unwinnable from Snorter onward** (economy/stat
  wall); the complete screen is unreachable by pure play → blocks the
  completion claim. Rebalance and prove a full ladder clear with real input.
- OPEN: D-24 (WATCH), D-31 (PARTIAL).
- FIXED (keep fixed): D-23, D-27, D-28, D-29, D-30.

## Placeholders to resolve before ship

Proto `DECLARED GUESSES` (`prototypes/swords-and-sandals.html:17-22`) —
combat numbers, stamina pacing. App shop/economy gates need tuning as part
of the D-54 fix. Thumb-arc mobile layout unproven (proto used bottom strip;
`MECHANICS-DIGEST.md` known-unproven list).

## Verification

Recorded commands (last observed results):
- Proto: headless chromium `file://prototypes/swords-and-sandals.html`,
  real input, `__proto()` called as function — loop PASS (claim-cards r04).
- App: `npm run dev:sas` (port 5178) + CDP — loop proven; `validSave()`
  corrupt-rejection matrix proven; XSS live-proven OPEN (D-51/52/53);
  ladder clear UNPROVEN (D-54).

Ship-gate checklist: pending — must include full ladder clear to champion
screen with real input, XSS injection matrix clean, keyboard map verified,
save/load round-trip.

## Deferrals

Full tournament tree (proto line 742) was deferred by the proto run —
reassess at content time; the mission bar is the original's scope as
documented in the concept spec (3–5 scripted fights slice floor).

## Provenance declaration

Consulted: this working copy only — git history, `verification/`,
`MAGA-everything/01-design-docs/`, `prototypes/`, plus my own knowledge of
the original game. Network use: none beyond a single `npm ping` probe. No
web/GitHub searches about this project, no forks/copies, no third-party
remakes of the original were consulted.

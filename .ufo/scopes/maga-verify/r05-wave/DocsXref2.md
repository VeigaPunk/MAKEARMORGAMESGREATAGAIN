# DocsXref2 — r05 reconciliation check: D-40 docs-vs-runtime after maga-docs r8/r9

**Scope:** static docs-vs-code cross-check of DD-99/DD-102/DD-103 against current bytes. No browser probing (docs lane). READ-ONLY honored — zero source edits.

**Baseline note (moving target):** `63d688d` (maga-docs r9) landed mid-verification, between my snapshots. All reads below reflect post-r9 bytes. HEAD at write time: `63d688d` → `7e829dd` → `b8ce8b6` → `9336a53` → `a312ff0` → `cd73e49`. The 11-file forge burn (DD-94) remains uncommitted; `verification/` working tree has only sibling lanes' new r05 evidence PNGs.

## Verdict

**STATIC-ONLY** — reconciliation itself: **PARTIAL (7/8 bullets reconciled and byte-verified; 1 acknowledged-not-actioned; 3 stale downstream records found)**.

cd73e49's claims check out: DD-99 (D-25..D-40 crosswalk), DD-102 (D-40 bullet-by-bullet reconciliation), DD-103 (DM-crate inversion) all exist in `MAGA-everything/01-design-docs/11-divergence/divergence-log.md` and match the code I read.

## Evidence — bullet-by-bullet D-40 reconciliation (verified against current bytes)

| # | D-40 bullet | DD-102 resolution claim | Byte-level check | Status |
|---|---|---|---|---|
| 1 | storage keys `boxhead/highscore`+`boxhead/keymaps` vs `maga:` prefix | already resolved r02 (DD-74) | `packages/arcade-core/src/storage.ts:6` `PREFIX = 'maga:'`; card `09-build-cards/boxhead.md:22` (`maga:boxhead:keymaps`) + `:38` (`maga:boxhead:highscore`, DD-74); xref `10-ticket-xref/boxhead-tickets.md:38,39` (BH-2.5/2.6) carry `maga:boxhead:*` | **RECONCILED** |
| 2 | integer-scale claim vs fractional downscale | already logged (DD-15; card §6 both sides) | card `boxhead.md:51` carries both sides verbatim: "integer scale 1x/2x/3x + letterbox per docs; code ships uniform **fractional downscale <1x** + maxFactor 4 (DD-15); stage 640×480 provisional in docs — code uses 640×400 (DD-01)" | **RECONCILED** (documented divergence, ARCADE owed — OPEN-ITEMS §1 rows 1-2) |
| 3 | BN1 BH-1.7 PASS signed while death unreachable | real gap — fixed r08 via provenance flag | xref `boxhead-tickets.md:26`: "⚠ **Provenance:** signed while player death was unreachable (verify D-01, fixed `fe3ae3e`) … re-verified live post-fix (verify r01 B9 PASS). Flag per verify D-40 / DD-102" | **RECONCILED** |
| 4 | BH-2.1 PASS-structure signed while touch loop blocked | real gap — fixed r08 same way | xref `boxhead-tickets.md:34`: "⚠ **Provenance:** signed while the touch loop was blocked (verify D-14, fixed `f8449eb`) … Flag per verify D-40 / DD-102" | **RECONCILED** |
| 5 | BH-3.2 "no mute button" now false | already resolved — card §7 + xref record shipped mute | card `boxhead.md:58` "chrome mute (BH-3.2 DONE)"; xref `:46` BH-3.2 **DONE** "(`Sfx.startMusic/stopMusic` + chrome mute, verified live…)"; code `game.ts:233` `startMusic(...)` + mute in chrome | **RECONCILED** |
| 6 | "5 build cards say not yet scaffolded" | already resolved — all 6 cards carry build-state lines | grep `not yet scaffolded` across `09-build-cards/` = **0 hits**; all 6 cards (boxhead, impossible, mcdonalds, chicken-invaders, cluck-horizon, swords-and-sandals) carry `**Build state**` lines with commit hashes | **RECONCILED** |
| 7 | D-NN/DD-NN ID-space collision | already resolved r02 (DD-75 rename + crosswalk note) | DD-75 entry present ("RESOLVED r02 — this register renamed to `DD-NN`"); card `boxhead.md:4` carries the consumer rule: "ids `DD-NN`; code comments citing `D-NN` mean `verification/divergence.md`" | **RECONCILED** |
| 8 | verify misses imported docs-D-06/D-09 | "noted — DD-06 and DD-09 stand as filed" | DD-06 (`divergence-log.md:26-29`, stale concatenated spec-pack) and DD-09 (`:32-36`, recipe ids vs presets) exist with assessments; but verify register `verification/divergence.md:339` still carries the raw "Verify misses imported" bullet — no import action, and OPEN-ITEMS §4 (verify lane) doesn't list it | **PARTIAL** — acknowledged, not imported |

DD-102's own summary ("6 of 8 stale at filing; 2 real gaps fixed via xref provenance flags") is **accurate** — I independently re-derived the same 6-stale/2-real split from current bytes.

## Evidence — DD-99 crosswalk spot-checks

- D-25↔DD-77 (DM ammo deadlock): xref BH-2.4 cites DD-77 for the deadlock ✓
- D-26↔DD-83 (pause inert): card r08 line + OPEN-ITEMS §3 "boxhead `'paused'` consumes Esc/P" ✓
- D-31↔DD-84 (`g.name`→`textContent`): consistent with DD-84 r08 note and OPEN-ITEMS §3 ✓
- D-32 "FIXED mid-round (uncommitted)" in verify status board consistent with DD-94 ✓; D-33/D-34 "FIXED in-tree, live-verified x=1410/x=2967" consistent with DD-96/r8b ✓
- D-40↔DD-102 present ✓

## Evidence — DM-crate inversion (new divergence, DD-103)

**Code truth (uncommitted `apps/boxhead/src/game.ts:628-654`):** `updateProps()` has **no mode gate** — `crateTimer` decrements every tick in every mode; crates spawn at 8s initial / 12s respawn, max 2 on field, `+CRATE_AMMO` on pickup. Comment at `game.ts:629-632` (duplicated twice — see Notes): "DD-77 / DD-18: spec has no DM pickups; crates are enabled here as the deadlock fix pending ARCADE ruling."

**Docs recording of the inversion — 4 surfaces, all consistent:**
1. DD-103 (`divergence-log.md:574-580`): "the divergence didn't close — it inverted"; owner ARCADE; crates provisional ✓
2. Build card `boxhead.md:74` (r08): "**DM crates enabled** as the D-25 deadlock fix — this *inverts* DD-18 … → DD-103" ✓
3. OPEN-ITEMS §1 ARCADE row: "DM pickups | Spec says none; code now ships crates … spec update or code revert; crates provisional" (DD-18 → DD-103, DD-77) ✓
4. OPEN-ITEMS §3 fixed-in-table: "DM ammo deadlock → crates enabled (inverts DD-18 → DD-103)" ✓

**So yes — DD-103 exists and matches the code.** But two downstream records were NOT updated (defects below).

## Defects (new findings)

- **D-41 (medium):** DD-18 body is stale against the very diff it describes — `divergence-log.md:55-58` still asserts "crate spawner gated `mode !== 'deathmatch'`" and Owner still says "FORGE enable crates in DM", both now false in-tree; no status line points to DD-103. Every neighboring entry (DD-94/96/98/99) carries r08/r09 status lines; DD-18 is the only entry whose Source B assertion is currently wrong with no in-entry correction. Suggestion: add `Status (r09): inverted in-tree — see DD-103` to DD-18.
- **D-42 (medium):** xref acceptance row `boxhead-tickets.md:37` (BH-2.4) still records "Ships no pickups vs spec (DD-18)" and "DM ammo economy can deadlock a match (DD-77)" as current behavior — both superseded by the in-tree crate fix. The acceptance surface (what BN2/B13 readers cite) contradicts the tree; only the build card's r08 prose records the inversion. Suggestion: append r08/r09 note to the BH-2.4 row.
- **D-43 (low-medium, verify-side — my lane's own register):** `verification/divergence.md` status board is stale post-reconciliation: D-40 row still "OPEN — reconciliation owed (maga-docs scope)" although DD-102 landed (`cd73e49`) and its Owner line explicitly tasks maga-verify to "mark D-40 partially-resolved"; D-25 row still "OPEN — new DEFECT" though the fix is in-tree (D-33/D-34 precedent would label it "fix in-tree (uncommitted)"); D-40 bullet 8's DD-06/D-09 import is unactioned. OPEN-ITEMS §4 also omits the import task. I did not edit the register (lane write-bounds: screenshots only).
- **D-44 (low, cosmetic):** build-card line counts drifted vs the uncommitted burn: impossible card says `main.ts` 274 ln (actual 289), burger card says 219 ln (actual 243); sas card "29 ln" still accurate (30). Self-heals at commit + card refresh; noted so nobody cites the counts as current.
- **Code cosmetic (not filed as D):** `game.ts:629-632` duplicates the DD-77/DD-18 comment twice verbatim, and `game.ts:633` carries 6-space indentation left over from the removed `if` gate. Harmless; fold into the burn's commit cleanup.

## Notes

- D-40's own framing was partially stale at filing (6/8 bullets described r01-era docs), which DD-102 states plainly — the reconciliation is honest, not self-serving: it flags the 2 real provenance gaps as real.
- Residual contradiction count after r8/r9: **1 partial bullet (verify-side import) + 2 stale downstream records (DD-18 body, xref BH-2.4) + 3 stale verify status-board rows**. None of these are new runtime defects; all are docs-lane bookkeeping except the verify-register rows, which are my lane's to re-file.
- The DM-crate inversion is deliberately recorded in 4 doc surfaces; the gap is only that DD-18 and xref BH-2.4 (the two surfaces a reader hits first) still describe the pre-inversion world.
- Sibling r05 evidence PNGs appeared under `verification/evidence/` during this check (BurgerGrid/HardestBoot/ShmupTypes) — untouched, not mine.

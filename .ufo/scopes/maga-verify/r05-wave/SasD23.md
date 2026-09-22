# SasD23 — r05 maga-verify — D-23 sas defeated persistence (live)

## Verdict

**PASS** — D-23 fix verified live on http://localhost:5178 (isolated origin http://127.0.0.1:5178), two independent end-to-end passes. Defeated progress survives reload; corrupt saves are schema-gated to a fresh create with zero crashes.

## Evidence

### Source (read-only confirmation of fix shape)
- `MAGA-everything/02-code/armor-games/apps/swords-and-sandals/src/main.ts:12` — `validSave(s)`: requires `Number.isInteger(s.defeated) && s.defeated>=0 && s.defeated<=opponents.length` (4), typed gladiator (`name`/`look` strings, 4 stats numbers, `hp/maxHp/gold/xp/level/weapon/armor/potions` numbers), `owned` undefined-or-string[].
- `main.ts:13` — `rawSave=load(...); saveData=validSave(rawSave)?rawSave:null; defeated=saveData?.defeated ?? 0; mode = saveData ? (defeated>=4?'complete':'hub') : 'create'` — restore path gates on validSave.
- `packages/arcade-core/src/storage.ts:14-21` — `load()` wraps `JSON.parse` in try/catch → returns fallback on malformed JSON → cannot crash.
- Storage key: `maga:swords-and-sandals:slot` (PREFIX `maga:`, storage.ts:6).

### Live run 1 — persistence (gladiator `SasD23Verify`, vit 8, HP 56)
1. Fresh create (savePresent:false) → spent 6 pts, named, Enter the Arena → hub, save `defeated:0` persisted. [r05-SasD23-01, -02]
2. Win bout 1 vs Tin Can Tim: 10 Attack clicks, log "Victory! Earned 18 gold and XP." → hub button now **'Next Opponent'**, save `defeated:1, gold:18, xp:22`. [r05-SasD23-03]
3. **Reload → mode:hub, h1 'Hub — Scarlet', button 'Next Opponent' (NOT 'Start First Bout'), hud `HUB · SasD23Verify HP 56/56 · Gold 18 · XP 22 · Lv 1`, save `defeated:1`.** D-23 core fix confirmed. [r05-SasD23-04]

### Corrupt-save matrix (each: setItem → reload; zero page errors, zero blank states in all 8)
| payload | result |
|---|---|
| `{"gladiator":` (malformed JSON) | fresh Create Gladiator, no crash [r05-…-05] |
| `""` (empty string) | fresh create |
| `{"gladiator":{"name":"X"}}` (missing fields) | fresh create |
| valid gladiator + `defeated:99` | fresh create (out of range rejected) [r05-…-06] |
| valid gladiator + `defeated:"1"` (string) | fresh create (type gate) |
| valid gladiator, `defeated` missing | fresh create |
| `{"gladiator":null,"defeated":1}` | fresh create |
| valid gladiator + `defeated:4` (edge, ≤4 valid) | **'V1 COMPLETE'** screen + 'Return to Hub' — correct per validSave (ladder conquered), not a defect [r05-…-07] |

Page errors across all reloads: **0** (per-tab error stream filtered to :5178 origin).

### Recovery
From corrupt-rejected create mode: created fresh gladiator → `persist()` overwrote corrupt payload with valid JSON (`savedName:'RecoveryTest2', defeated:0, str:8`), hub renders normally. [r05-…-08]

### Live run 2 — independent replay (gladiator `RecoveryTest`, str 8, HP 32)
Win bout 1 in 5 clicks → 'Next Opponent' + `defeated:1, gold:18` → reload → hub restored, `defeated:1`, hud `HUB · RecoveryTest HP 32/32 · Gold 18 · XP 22 · Lv 1`. [r05-…-03/-04]

### Screenshots (all in `verification/evidence/`)
- `r05-SasD23-01-create-fresh.png` — fresh create screen
- `r05-SasD23-02-hub-start-first-bout.png` — hub pre-bout, 'Start First Bout'
- `r05-SasD23-03-hub-after-win-next-opponent.png` — hub after win, 'Next Opponent'
- `r05-SasD23-04-hub-after-reload-next-opponent.png` — **D-23 core: hub after reload, 'Next Opponent'**
- `r05-SasD23-05-corrupt-malformed-fresh-create.png` — malformed JSON → create
- `r05-SasD23-06-corrupt-defeated99-fresh-create.png` — defeated=99 → create
- `r05-SasD23-07-corrupt-defeated4-complete-screen.png` — defeated=4 edge → V1 COMPLETE
- `r05-SasD23-08-recovery-fresh-save-overwrites-corrupt.png` — recovery create overwrites corrupt payload

## Defects

None new. D-23 behaves exactly as specified.

## Notes

- **Harness contamination (2 hits, no evidence impact):** (1) my tab `SasD23` was navigated to `hardest/index.html` by another lane early in the wave (errors stream showed `hardest/game.js` pageerrors; I abandoned it). (2) later a handle resolved to `BoxheadStress-r05c` ("Tab busy" — call rejected before executing; verified my tab state unchanged). Mitigated with unique names (`SasD23v2`, `SasD23v3-iso`) + URL guard before every action batch. All final evidence from `SasD23v3-iso` on isolated origin `http://127.0.0.1:5178` (separate localStorage bucket from shared `localhost:5178` — zero interference with sibling lanes).
- **Harness quirk (reported via report_issue):** tab-helper `screenshot({path})` returns inline preview but does not write the file to disk; raw Puppeteer `page.screenshot({path})` inside `tab.run` does. Early screenshots 03/04 were re-captured via the raw path.
- Shared `localhost:5178` storage: I cleared the pre-existing 'Probe' save once at start (before SasProto confirmed they were isolated); the Probe save reappeared (owner re-persisted it). My final verification never touched shared-origin storage.
- `defeated=4` → V1 COMPLETE screen is per-design (`defeated<=opponents.length` passes validSave; complete screen offers 'Return to Hub', hub then shows only Smithy — no fight button at 4/4). Behavior note, not a defect.
- Clicks were DOM-level (`.click()`/Puppeteer click on real buttons); arena combat used the real Attack button loop (miss/crit RNG observed in log lines).

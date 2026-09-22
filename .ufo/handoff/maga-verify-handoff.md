# maga-verify → K3 handoff (final, 2026-09-22)

**Author:** maga-verify L1 (independent evidence arm), rounds 1–5. **Scope of this document:** the whole fleet's game surfaces as verified by evidence — every claim below cites a verdict file, screenshot, or command output. Defect IDs (D-NN) are canonical in `verification/divergence.md`.

---

## 1. ORIGINATING IDEA

Recreate six Armor Games-era Flash titles as native web apps in one npm-workspaces monorepo (`MAGA-everything/02-code/armor-games/`), plus standalone mechanics proofs (`prototypes/`) and a seventh sibling-built game (`hardest/`). Locked stack: TypeScript + Vite; PixiJS 8 for boxhead + both shmups; Canvas 2D for impossible/burger/sas; shared `packages/arcade-core` (input/scale/storage/sfx) and `packages/shmup-core` (pack-driven shmup skeleton). INTERNAL-NO-PUBLIC: no original assets/IP; all art is primitives.

| App | Port | Original | Core acceptance (spec §) |
|-----|------|----------|--------------------------|
| boxhead | :5173 | Boxhead 2Play | waves/rooms/weapons, solo+coop+DM, crates/barrels, score×mult |
| impossible | :5174 | The Impossible Game | auto-run 360px/s, one-button jump, death→respawn ≤200ms, full clear |
| burger-tycoon | :5175 | McDonald's Game | 4 panes one economy, dirty actions ↑profit+↑backlash, forced collapse, idle sim |
| chicken-invaders | :5176 | Chicken Invaders | chapter/wave/boss shmup, gifts/food pickups, persist |
| chicken-invaders-original | :5177 | (original "Cluck Horizon") | same skeleton, differentiated pack |
| swords-and-sandals | :5178 | S&S2 Emperor's Reign | create→turn-duel→gold/XP→shop→ladder, persist, no softlock |
| hardest | file:// | World's Hardest Game | red square, patrol dots, coins arm goal, keys/doors/teleports, medals, 96+ levels |

Specs: `MAGA-everything/01-design-docs/02-concept-specs/0N-*.md`. Acceptance checklist: `01-design-docs/07-acceptance/boxhead-playability-checklist.md` (audited in `verification/doc-audit.md`).

## 2. CURRENT STATE (verified, commit refs)

All six monorepo apps boot and pass smoke; all dev servers live. Forge's last committed burn: `7e110e7` + **uncommitted WIP** (verified as-found on served bytes). Hardest: `62ed5a7`/`fe83d90` + uncommitted churn.

**Verified working (live evidence):**
- **boxhead** — full loop title→mode→room→playing→dead→menu; pause (ESC/P freeze+resume, M→menu) D-26 FIXED; DM crates spawn+refill+match concludes (D-25 FIXED); ?stress ~100 movers @ ~52fps lower bound (D-08 enabler landed); grenade owner-exempt (D-19 resolved); mute button live.
- **impossible** — gap-kill x=1410 + block front-edge x=2967 at proto parity (D-33/34, 27/27 + ×2 re-confirmed); best-progress persists; `?debug` hooks (`__maga` actions + `__proto` getters) live.
- **burger-tycoon** — 4-pane grid refactor verified: 10/10 actions fire with exact deltas, no-op contract holds, narrow fallback works; collapse chain intact (dirty→backlash→disease→rep collapse→GAME OVER→restart); idle sim advances.
- **chicken-invaders (replica)** — ch1 waves/boss loop live; D-32 touch release FIXED both apps; per-type visuals plumbed (replica types still identical — placeholder).
- **cluck** — full 2-chapter win verified (r4); D-38 FIXED live: GLIDER 1.147× faster, BRUISER 0.846×/3hp, 3 distinct color variants.
- **sas** — D-23/27/28/29/30 ALL FIXED live: defeated persists + validSave schema-gates 8 corrupt payloads; owned[] persists, no double-dip; Buckler reachable at Lv2; complete-screen replay dead.
- **hardest** — 96/96 shipped levels completable, dual-proven (in-browser autopilot on page engine + `node hardest/validate.mjs` exit 0, 36.8s); boot/controls/save/medals/touch-joystick matrix PASS; keys→doors and teleports live-verified.
- **prototypes** — impossible/burger/chicken cards verified (D-22 FIXED); sas card PARTIAL (boot/create/combat-gate/persist live; rest static).

**Open defects (canonical register `verification/divergence.md`, D-01–D-66):**
- HIGH: D-45 + D-47 hardest menu crashes (corrupt save → `b.time.toFixed` TypeError every frame; `MEDAL_COL` undefined → menu dies at first medaled tile — every player who clears a level hits this). D-51 sas stored XSS (name→`hud.innerHTML`, live `window.p===1`).
- MED: D-48 manifest stale (97/98 levels unshipped), D-49 autopilot sub-frame fidelity, D-52 sas look-XSS via crafted save, D-54 sas ladder unwinnable from Snorter (measured ~26dmg/life vs 62hp), D-58 invuln burst hole (D-16 partial), D-59 docs spec-direction inversion, D-65 hardest stuck-keys-on-blur.
- LOW/INFO: D-41–44 shmup churn (snapshot wave leak, speed-gate, flat scoring, phantom replica types), D-46 speed tunneling latent, D-50 L30 wall-clip, D-53 log sink latent, D-55/56/57 boxhead minors, D-60/61 impossible debug-hook quirks, D-62 autopilot not shipped, D-63 cross-lane storage/tab process defect, D-64 odd-pad teleport latent, D-66 locked-tile no-feedback.
- Still open from earlier: D-05 (stage 640×400 vs docs 480), D-06, D-18 (banner bleed), D-24 (watch), D-26→done, D-35, D-37 (boss names never render), D-39 partial.

## 3. POLISH NEEDED (ranked by impact)

1. **Hardest menu crashes (D-45/D-47)** — the game is unplayable-from-menu for anyone with a corrupt or any medaled save; validate loadSave + define MEDAL_COL. Highest impact: blocks the newest surface's primary path.
2. **Sas stored XSS (D-51/52)** — `textContent` the HUD name + hub h1; one-line-each fixes, real injection live.
3. **Sas unwinnable ladder (D-54)** — economy/stat rebalance or refarm path; complete screen currently unreachable by play.
4. **D-58 invuln burst** — wall-clock invulnerability, not dt-clamped; players die through throttle-resume.
5. **D-37 boss names + D-39 comb/beak mismatch** — shmup HUD polish; `BossType.name` is dead data, comb color now clashes with new headColors.
6. **D-18 banner bleed + D-56 world-behind-menu** — boxhead menu readability; one-line `world.visible=false`.
7. **D-48 manifest regen** — ship levels 97/98 or drop them; `gen-manifest.mjs` + count check in validate.
8. **D-65 blur key-clear** — `blur → keys.clear()`; observed live drift.
9. **Art direction** — L0 killed grok-imagine; all art must be authored (SVG/canvas/pixel). Every game currently renders primitives; the polish phase owns real art per game (hardest/impossible exempted as deliberately minimal).
10. **Feel gaps** — impossible full-clear never proven end-to-end (segments passable); replica gameover/ch2-boss never seen; sas proto card claims partially static; F3 fps gate needs isolated-machine run; no Firefox/real-device coverage ever.

## 4. NEXT PHASE

Backend is done enough — the mission now is polish/refine/iterate, not features. For K3:

- **Verify-before-polish:** re-run the open-defect list first; several "fixes" landed uncommitted mid-wave and bytes drift (forge commits mid-round repeatedly — always verify served bytes via `curl :PORT/src/...` before trusting a source read).
- **Evidence standard:** every fix needs a live artifact; `?debug` hooks exist on boxhead (`__maga`), impossible (`__maga`+`__proto`), shmup (`__maga.sim`), hardest (`__hardest`). `window.__proto` on impossible is shadowed by Window.prototype — use `__maga` or rename the hook (D-60).
- **Gotchas:** shared-origin localStorage (`file://` = one origin; `localhost:PORT` shared across lanes) and the global tab-name registry corrupt parallel verification — use unique tab names + `127.0.0.1` vs `localhost` origin split (D-63). `tab.run` can't see page globals — use `tab.evaluate`. Screenshot helper doesn't write files; raw `page.screenshot({path})` does.
- **Don't redo:** docs↔code reconciliation is current through maga-docs r9 (DD-99/102/103); D-40 is 7/8 reconciled — only DD-18 body, xref BH-2.4, DD-06/09 imports remain stale. Spec direction on DM pickups: spec says WITH pickups (D-59 — DD-103 got it backwards).
- **Drift risks:** uncommitted forge WIP is the verified state — commit it before polishing or re-verify after; hardest corpus churned 96↔98 mid-wave; proto cards get edited after verdicts (chicken D-22 was fixed post-verdict).
- **Verification assets to reuse:** `verification/divergence.md` (canonical register), `verification/runtime-verdicts/` (13 verdict files), `verification/doc-audit.md` (checklist→spec map), `.ufo/scopes/maga-verify/r05-wave/` (29 lane reports), `verification/evidence/` (~150 artifacts).

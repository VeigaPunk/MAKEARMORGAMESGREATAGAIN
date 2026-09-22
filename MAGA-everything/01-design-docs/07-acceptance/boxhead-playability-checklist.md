# PLAYABILITY ACCEPTANCE — Boxhead: 2Play Rooms (native)
## Idea 001 · PROOF · STACK-LOCKED PixiJS 8 + arcade-core

| Meta | Value |
|------|-------|
| **Slug** | `boxhead` |
| **Owner** | **PROOF** (playability) — not ARCADE fidelity |
| **Stack** | TypeScript + Vite · **PixiJS 8** · `packages/arcade-core` |
| **App path** | `armor-games/apps/boxhead` (AMDPORRADA monorepo) |
| **Status** | **ACCEPTANCE-TEMPLATE** — use for B-N0…B-N3 and G3 |
| **Rights** | **INTERNAL-NO-PUBLIC** until clearance |
| **Language** | English only |
| **Date** | 2026-09-22 America/Sao_Paulo |
| **Sources** | `specs/001-native-stack-and-plan.md` · `concept-specs/01-boxhead.md` · ARCADE `dossiers/boxhead.md` (feel reference only) |

### Verdict rules
- **PASS** — every required item for the gate under test is green; no open blockers.
- **FAIL** — any required item red; file with **repro steps**, expected vs actual, input method (desktop/touch), browser/OS, localhost URL or path, screenshot/clip if available.
- **WAIVE** — only with João or FORGE sign-off; note reason on the item.
- Combat numbers, exact keymaps, spawn tables: **TBD from ARCADE playtest** — judge playability (“works, fun, no softlock”) until ARCADE fills values; do not invent thresholds.

### Out of scope (not a FAIL)
- Networked LAN / online multiplayer
- Ruffle / SWF ship path (INTERNAL feel reference only)
- Pixel-perfect fidelity vs Flash (ARCADE owns that)
- Full room roster / Zombie Wars base-build
- Public deploy

---

## Gate map

| Gate | Milestone | Required sections |
|------|-----------|-------------------|
| **B-N0** | Scaffold boots | A (smoke), F (load baseline) |
| **B-N1** | Solo wave 3 desktop | A + B (solo e2e) + E (desktop) + F |
| **B-N2** | Phone solo + letterbox | A + B + C (touch) + D (display) + F |
| **B-N3 / G3** | Acceptance complete | All sections A–G green (or waived) for scoped v1 |

---

## A. Smoke / boot (required every gate)

| ID | Check | Pass when |
|----|-------|-----------|
| A1 | `npm run dev` (or documented serve) boots `apps/boxhead` | Game canvas visible; no fatal console error on load |
| A2 | Title / menu reachable | English UI; can enter play without stuck overlay |
| A3 | Click/tap-to-start audio gate (if present) | After start, keyboard/touch focus is not stolen by overlay |
| A4 | Cold restart | Menu → in-combat in **≤ ~3s** on mid-tier laptop localhost |
| A5 | No Portuguese / leftover locale strings | English-only strings in menus, HUD, death screen |

---

## B. End-to-end core loop (solo first, then modes)

### B-Solo (B-N1+)

| ID | Check | Pass when |
|----|-------|-----------|
| B1 | Room pick | Can select from v1 set (**2–3 rooms**); shared top-down camera |
| B2 | Spawn | Player appears; starting pistol + limited ammo; can move and shoot |
| B3 | Waves 1–3 | Complete waves **1–3** without softlock, stuck collision, or unkillable spawn wall |
| B4 | Swarm pressure | Mid-run density feels chaotic arcade (not sparse empty arena) — side-by-side ARCADE clip when available |
| B5 | Ammo crates | Pickup restores shooting when dry; crates readable at a glance |
| B6 | Explosive barrels | Detonation clears nearby zombies with readable radius; no crash |
| B7 | Score / streak | Score updates on kills; streak multiplier visible; unlock cadence *feels* progressive (exact thresholds TBD ARCADE) |
| B8 | Weapon curve feel | Progression toward shotgun / uzi / grenades *feel* order present or stubbed behind clear UI — no dead upgrade that bricks the run |
| B9 | Death → end run | Death ends run; shows wave reached + score; restart / menu works |
| B10 | High score persist | Best score survives refresh via **localStorage** (arcade-core); no cloud account |

### B-Modes (B-N3 / G3 — after solo solid)

| ID | Check | Pass when |
|----|-------|-----------|
| B11 | Mode select | Solo Survival · Local Co-op · Local Deathmatch all reachable from menu |
| B12 | Local co-op desktop | P1 and P2 move and shoot **simultaneously** on one keyboard; no focus steal |
| B13 | Local deathmatch desktop | Both players can damage each other; match ends on agreed rule without crash (scoring TBD ARCADE) |
| B14 | Special enemy | At least one special type if ARCADE confirms; else stub labeled / deferred without blocking solo PASS |

---

## C. Touch controls (B-N2+)

Desktop must remain intact; touch must not break keyboard.

| ID | Check | Pass when |
|----|-------|-----------|
| C1 | Solo phone (layout C or B) | Left stick (or swipe-relative) + fire; playable one- or two-handed ≥ **60s** without softlock |
| C2 | Fire / aim | Can kill zombies at wave 1–2 pace; optional auto-aim OK if labeled; no stuck virtual stick |
| C3 | HUD clearance | Virtual sticks / fire buttons do not permanently cover score, ammo, or lethal spawn lanes |
| C4 | Dual pads (layout A) — stretch | On landscape tablet, two thumbs control two players ≥ **60s** without UI blocking shots (required for G3 if 2P mobile claimed; else WAIVE with note) |
| C5 | Desktop regression | After touch code lands, B12 still green; touch chrome hidden or inert on desktop |
| C6 | Orientation | Landscape preferred for 2P; solo portrait acceptable if C1 green; no broken letterbox on rotate |

**PROOF bar on mobile:** “playable and fun,” not keyboard-chord fidelity. Desktop remains control reference.

---

## D. Display / scaling (arcade-core)

| ID | Check | Pass when |
|----|-------|-----------|
| D1 | Integer scale + letterbox | No non-uniform stretch; hitboxes / movement feel unwarped |
| D2 | Stage aspect | Provisional **640×480** until ARCADE measures (UNVERIFIED); letterbox/pillarbox OK |
| D3 | Resize | Browser resize keeps letterbox; no clipped mandatory HUD |
| D4 | Fullscreen (if offered) | Optional; stage rules unchanged |

---

## E. Desktop controls

| ID | Check | Pass when |
|----|-------|-----------|
| E1 | P1 map | Move + shoot without mouse required for core combat |
| E2 | P2 map (co-op/DM) | Simultaneous with P1; defaults TBD ARCADE — until then, documented defaults in README |
| E3 | Rebinds | User-definable maps for v1 (concept requirement); persisted or documented limitation if deferred (WAIVE) |
| E4 | Mouse | Optional aim/menus only; not required for fidelity combat path |
| E5 | Focus | Click canvas once → both players keep receiving keys; no browser chrome steal mid-run |

---

## F. Load / performance budgets

Targets from concept notes + STACK-LOCKED “lightweight” mandate. Measure on localhost; record device in FAIL notes.

| ID | Check | Budget | Pass when |
|----|-------|--------|-----------|
| F1 | First paint / interactive | Comfortable on mid laptop | Menu interactive without multi-second blank white |
| F2 | Transfer size (v1 rooms) | Prefer **sub-few MB** compressed art+audio | Document measured transfer; flag if grossly over |
| F3 | Desktop framerate | **~60 fps** with ~**50–100** on-screen movers | No sustained sub-30 during wave 3 solo on mid laptop |
| F4 | Mobile framerate | **30–60 fps** acceptable | Solo wave 2 playable without multi-second hitches |
| F5 | GC / hitch | No ≥500 ms freeze during wave escalate | Continuous control response |
| F6 | Memory | No unbounded leak over 3 restart cycles | Heap roughly stable across restarts (DevTools spot check) |
| F7 | Engine weight | Pixi 8 + arcade-core only for this title | No Phaser / Unity / accidental second renderer |

---

## G. Suite matrix (G3)

Run and tick before filing G3 PASS:

| Suite | Desktop Chrome | Desktop Firefox | Phone Chrome (Android or iOS) | Tablet landscape (if 2P touch claimed) |
|-------|----------------|-----------------|-------------------------------|----------------------------------------|
| Smoke A | ☐ | ☐ | ☐ | ☐ |
| Solo e2e B1–B10 | ☐ | ☐ | ☐ (touch) | — |
| Co-op B12 | ☐ | ☐ | — / dual pads | ☐ |
| Deathmatch B13 | ☐ | ☐ | WAIVE OK if no dual pads | ☐ if dual pads |
| Display D | ☐ | ☐ | ☐ | ☐ |
| Perf F3/F4 | ☐ | spot | ☐ | spot |

Minimum for **G3 PASS:** Desktop Chrome + one other desktop browser green on A+B-solo+E+D+F; touch solo (C1–C3, C5) green on one phone; co-op B12 green on desktop. Deathmatch and dual-pad tablet may WAIVE with note until claimed in build notes.

---

## Repro template (FAIL filings)

```
TITLE: Boxhead — <gate> FAIL — <short symptom>
GATE: B-N0 | B-N1 | B-N2 | B-N3/G3
BUILD: <commit / localhost URL / date>
ENV: <OS> · <browser> · desktop|touch
STEPS:
1. …
2. …
EXPECTED: …
ACTUAL: …
EVIDENCE: <screenshot/clip path or “none”>
BLOCKER?: yes/no
```

---

## Handoff

| To | When |
|----|------|
| **KIMI** | Implement against B-N0…B-N3; ping PROOF with localhost URL + gate claimed |
| **ARCADE** | Fidelity dossier / captures fill TBD numbers; PROOF does not block solo on missing thresholds |
| **FORGE** | Spec compliance review after G3 |
| **PIXEL / MAESTRO** | Art/audio polish is G4 — playability can PASS with placeholder art if loop/controls/perf are green |

**One-line DoD (native Boxhead G3):**  
> Localhost Pixi boxhead: solo waves 1–3, death→score→restart, integer letterbox, localStorage best score, desktop dual-keyboard co-op, phone solo touch playable ≥60s, perf within §F — English only — INTERNAL.

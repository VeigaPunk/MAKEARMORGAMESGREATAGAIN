> **SUPERSEDED AS PRIMARY SHIP PATH (2026-09-22):** Idea 001 primary is now **native replicas**. See `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` (**STACK-LOCKED**). This EMULATE/Ruffle doc remains useful as **fallback reference** planning for the INTERNAL spike only.

# IMPLEMENTATION SPEC — Idea 001 first ship
## Boxhead: 2Play Rooms (EMULATE / Ruffle)

| Meta | Value |
|------|-------|
| **Idea** | 001 — Make Armor Games Great Again |
| **From** | FORGE (impl planner) |
| **Inputs** | IDEATOR brief `/workspace/armor-games-research/briefs/001-boxhead-2play-build-brief.md` · HANDOFF `/workspace/armor-games-research/briefs/HANDOFF-to-KIMI.txt` · research `/workspace/armor-games-research/deep-dive.md` · ARCADE dossier `/workspace/armor-games-dossiers/boxhead.md` · M1 spike `/workspace/armor-games-research/specs/001-boxhead-2play-M1-ruffle-spike.md` |
| **To** | KIMI Work / implementers · ARCADE (fidelity) |
| **Date** | 2026-09-22 13:52 America/Sao_Paulo |
| **Status** | M0=INTERNAL spike · M1-LOCKED (see M1 spike spec) · Repo locked |

---

## 0. One-line DoD

> Pinned Ruffle + hash-pinned cleared SWF boots in a MAGA portal shell; solo to wave 3 and local 2P (co-op + deathmatch) pass ARCADE fidelity checklist ≥90% (or signed waivers); preview URL shareable; no remaster inside the SWF.

---

## 1. Tech choices (locked for this title)

| Concern | Choice | Why / constraint |
|---------|--------|------------------|
| Engine | **None (EMULATE)** | Brief locks EMULATE; recreate is out of scope for MVP |
| Runtime | **Ruffle** self-hosted, **version-pinned** | No Adobe Flash Player; reproducible builds |
| Content | Original **Boxhead: 2Play Rooms** SWF | Hash-pinned; only after M0 rights path |
| Host | Static **HTML/JS/CSS** shell | Minimal; no framework required for MVP |
| Scale | Letterbox + **integer zoom** (1x/2x/3x) | Must not warp hitboxes / Stage scaleMode |
| Input | Browser keyboard → Ruffle | Dual-keyboard simultaneous; focus QA critical |
| Audio | Browser autoplay gate → click-to-start | Overlay must release focus after start |
| Deploy | Static site / CDN preview | Internal until legal clear for public |
| Analytics | Wrapper-only optional | Never inject into SWF |
| CI smoke | Page load + Ruffle boot + menu reachable | Visual fidelity = manual / ARCADE |

**Not chosen for MVP:** Phaser, Pixi, Godot, Unity WASM, custom canvas recreate, netcode, HD asset remaster, mobile-first touch.

**Follow-up titles (do not implement now):** Burger Tycoon (CC spike) → S&S2 (license parallel) → Impossible Lite / Fluke → Chicken Invaders (partner / new original).

---

## 2. Milestone → ticket breakdown

### M0 — Legal & binary (GATE — blocks public ship)

| ID | Task | Owner hint | Acceptance |
|----|------|------------|------------|
| M0.1 | Identify rights contacts (Sean Cooper · Crazy Monkey successors · Fire Source / Immortal) | KIMI / João | Contact list + preferred channel documented |
| M0.2 | Request written play/host permission for MAGA portal (scope: internal vs public) | João / KIMI | Written OK or explicit “internal-only” logged |
| M0.3 | Obtain official-or-cleared SWF binary | KIMI | File in secured storage; **not** random fan dump for public |
| M0.4 | Hash-pin SWF (`sha256`) + record source provenance | Implementer | `swf.sha256` + provenance note in repo/docs |
| M0.5 | Credit string draft (“Boxhead © Sean Cooper” TBD exact) | IDEATOR / legal | Credit line in portal footer |

**Exit M0:** Documented scope (internal prototype vs public) + SWF hash for whatever scope is allowed.  
**M0 CALL (2026-09-22 14:01 via RELAYER):** João chose **A — INTERNAL SPIKE OK**.
- Label **INTERNAL-NO-PUBLIC**; no public ship/deploy/share until written clearance (Cooper / Crazy Monkey / Fire Source).
- Scaffold (shell + pinned Ruffle, no SWF) **unblocked now**.
- SWF embed waits on binary **and** written clearance; **keep `.swf` out of repo**.
- Repo: `C:\Users\jpvei\Documents\kimi\Workspaces\veigapunkimi\armor-games\boxhead-2play-spike`
- Canonical M1 tickets: `/workspace/armor-games-research/specs/001-boxhead-2play-M1-ruffle-spike.md` (**M1-LOCKED**).

---

### M1 — Ruffle spike (1–2 days once SWF in hand)

| ID | Task | Acceptance |
|----|------|------------|
| M1.1 | Scaffold static page: container, click-to-start, credit stub | Page loads over HTTPS (or local static server) |
| M1.2 | Vendor Ruffle; pin version in lockfile / `RUFFLE_VERSION` | Exact version recorded; reproducible |
| M1.3 | Embed SWF; boot to in-game menu | Menu visible without console fatal |
| M1.4 | Confirm AVM1 / compatibility notes for this binary | Short note: works / known Ruffle gaps |
| M1.5 | Letterbox + 1x/2x integer scale buttons | No stretch distortion; stage aspect preserved |
| M1.6 | Solo playable to **wave 3** on desktop Chrome + Firefox | Manual smoke signed |

**Exit M1:** Playable solo spike URL (or local path) for swarm.

---

### M2 — Fidelity QA pass (ARCADE-owned dossier)

| ID | Task | Acceptance |
|----|------|------------|
| M2.1 | ARCADE drafts Boxhead: 2Play Rooms fidelity dossier from brief §3 | Dossier path published to FORGE/KIMI |
| M2.2 | Capture reference clips: (a) wave 1–3 solo (b) co-op mid-run (c) deathmatch | 3 clips stored; linked from dossier |
| M2.3 | Run pass/fail checklist §3 against spike | Defect log with severity |
| M2.4 | Fix P0/P1 fidelity defects (timing, scale, audio, art integrity) | Re-test until ≥90% or waiver list signed by João |

**Exit M2:** Checklist ≥90% pass **or** signed waiver list. FORGE updates this spec’s acceptance appendix if waivers change DoD.

---

### M3 — Local 2P hardening

| ID | Task | Acceptance |
|----|------|------------|
| M3.1 | Dual-keyboard matrix: Chrome/Firefox × Win/Linux; layouts US + BR-ABNT2 | Matrix doc; both players move/shoot |
| M3.2 | Focus regression: click-to-start → keys work; chrome clicks don’t steal P2 | Automated or scripted checklist |
| M3.3 | On-screen control legend (wrapper chrome) for P1/P2 | Visible without covering hit-critical stage center |
| M3.4 | Modes demoable: co-op + deathmatch without coaching beyond legend | João or swarm demo pass |

**Exit M3:** Local 2P demo-ready.

---

### M4 — Portal stub ship

| ID | Task | Acceptance |
|----|------|------------|
| M4.1 | MAGA landing card: title, “local co-op (one keyboard)” copy, credit, legal | Copy reviewed (LAN myth fixed) |
| M4.2 | Deploy preview URL | Shareable HTTPS link |
| M4.3 | Mute toggle + scale in chrome only | Does not alter SWF mix beyond mute |
| M4.4 | Public vs internal gate check | If M0 not public-cleared → password/internal only |

**Exit M4:** Preview link for João + swarm review.

---

### M5 — Closeout / next title

| ID | Task | Acceptance |
|----|------|------------|
| M5.1 | Update idea 001 vault actions/outcomes | IDEATOR vault reflects shipped spike |
| M5.2 | FORGE notes lessons → template for next title | Short retro in this folder |
| M5.3 | Kick next backlog item (Burger Tycoon CC spike default) | Brief request to IDEATOR if needed |

---

## 3. Acceptance tests (implementer-facing)

Map to brief §3. Use as ticket DoD; ARCADE owns ground-truth.

### A. Boot & shell
1. Cold load → click-to-start → Ruffle ready ≤ N seconds (record N on first spike; regress).  
2. SWF hash matches `swf.sha256`.  
3. Ruffle version matches pin.  
4. Integer scale 1x/2x/(3x if supported) does not crop required HUD.

### B. Solo fidelity
5. Arena/room select works.  
6. Waves escalate; ammo crates and barrels behave vs reference.  
7. Score / streak → weapon curve matches reference (ARCADE signs).  
8. Death → run end + high-score presentation.  
9. Art/audio not replaced; mute only via chrome.

### C. Local 2P (critical)
10. P1 + P2 simultaneous keys (defaults honored).  
11. Co-op reachable and playable 2+ minutes.  
12. Deathmatch reachable and playable.  
13. No single-focus steal after start.  
14. Mouse not required for core combat.

### D. Non-goals (must remain false for MVP)
15. No networked LAN.  
16. No HD redraw inside SWF.  
17. No new weapons/maps.  
18. No forced account/cloud save.

---

## 4. Repo / artifact layout (suggested for Kimi)

```
maga-boxhead-2play/          # or monorepo path João prefers
  README.md                  # one-line DoD + how to run
  package.json | justfile    # pin scripts
  public/
    index.html               # shell + click-to-start
    css/shell.css
    js/embed.js
  vendor/ruffle/             # pinned build
  content/
    boxhead-2play-rooms.swf  # git-LFS or secure store; not public until cleared
    swf.sha256
    PROVENANCE.md
  docs/
    LEGAL_SCOPE.md           # internal vs public
    INPUT_MATRIX.md
    ACCEPTANCE.md            # checklist results
```

Adjust names to João’s repo convention; keep **hash + provenance + legal scope** non-negotiable.

---

## 5. Risks (impl view)

| Risk | Ticket impact | Mitigation |
|------|---------------|------------|
| Rights blocked | M0 fails | Stay INTERNAL; no public marks; escalate to João |
| Dual-keyboard flaky in browser | M3 slips | Fullscreen + focus tests; document OS quirks |
| SharedObject / scores lost | Soft fail | Document Ruffle SO path; defer export |
| “LAN” expectation | Copy bug | Portal copy forces “local one keyboard” |
| Remaster temptation | Scope creep | Reject in-SWF art changes; chrome-only brand |

---

## 6. Handoff to KIMI — start order

1. Confirm M0 scope with João (internal spike allowed Y/N).  
2. If Y: M1.1–M1.6 immediately; track SWF as INTERNAL.  
3. Ping ARCADE for M2.1 dossier + clips in parallel with M1.  
4. After M1 exit: M3 then M4.  
5. Do not open Burger Tycoon / S&S2 impl until M4 exit or João redirects.

---

## 7. Source pointers

- Brief: `/workspace/armor-games-research/briefs/001-boxhead-2play-build-brief.md`  
- HANDOFF: `/workspace/armor-games-research/briefs/HANDOFF-to-KIMI.txt`  
- Research: `/workspace/armor-games-research/deep-dive.md` · `summary.json`  
- This spec: `/workspace/armor-games-research/specs/001-boxhead-2play-impl-spec.md`  
- Vault: IDEATOR `ideas/entries/001-make-armor-games-great-again.md`

---

## 8. FORGE status

| Item | State |
|------|--------|
| Competing brief | **Not** written — consumed IDEATOR packet only |
| Impl spec | **This file** — ready |
| ARCADE dossier | Pending (checklist seed = brief §3) |
| Next FORGE action | Revise tickets when dossier/waivers land; code-review notes after first PR |

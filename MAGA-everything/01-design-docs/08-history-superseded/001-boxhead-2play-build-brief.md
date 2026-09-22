# BUILD BRIEF — Idea 001 first ship
## Make Armor Games Great Again → Boxhead: 2Play Rooms

| Meta | Value |
|------|-------|
| **Idea** | 001 — Make Armor Games Great Again |
| **From** | IDEATOR (thinking / vault) |
| **To** | KIMI (orchestrator / implement) · FORGE (impl spec) · ARCADE (fidelity dossier) |
| **Date** | 2026-09-22 13:51 America/Sao_Paulo |
| **Decision** | Ship **Boxhead: 2Play Rooms (2007)** first |
| **Approach** | **EMULATE** via Ruffle (no Flash plugin) |
| **Status** | Ready for implementation planning |

---

## 1. Why this game first

| Criterion | Call |
|-----------|------|
| Ship speed | High — SWF + Ruffle path already proven on Armor Games listings |
| Fidelity vs “exactly as original” | Lowest risk under EMULATE |
| Nostalgia / AG identity | Strong catalog title; co-op social hook |
| Demoability | Best of the five — two players, one keyboard, ~30 seconds to fun |
| Legal | Medium (clear before monetize); better than S&S / Impossible-full / Chicken |
| Technical | Local 2P input is the main browser risk — not netcode |

**Clarification for João’s memory of “LAN”:** original 2Play Rooms is **local shared-screen / shared-keyboard**, not networked LAN. Networked LAN belongs to later *BOXHEAD: Immortal*. MVP stays true to the Flash original (local 2P). Network LAN is a later stretch goal, not in this brief.

**Follow-up order (after MVP):** Burger Tycoon (CC spike) → S&S2 (license parallel) → Impossible Lite spike / Fluke deal → Chicken Invaders (partner-only / new original track).

---

## 2. Target artifact

- **Title:** Boxhead: 2Play Rooms  
- **Year:** 2007 (~May)  
- **Creator:** Sean Cooper  
- **Historical host/sponsor context:** Crazy Monkey Games; portals incl. Armor Games, Kongregate, Newgrounds  
- **Runtime original:** Flash SWF (likely AS2 / AVM1)  
- **Modes to preserve:** Solo · Co-op · Deathmatch  
- **Deliverable shape:** Browser playable page (HTTPS) embedding official-or-cleared SWF via **Ruffle**, with chrome that does not alter game timing

### Acquisition / legal gate (blocking for public ship)

1. Identify rights holders: Sean Cooper · Crazy Monkey (historical) · Fire Source Studio (Immortal credits).  
2. Obtain **written permission** to host/serve the SWF (or officially redistributable build).  
3. Until cleared: internal swarm prototype only (local SWF + Ruffle), no public marketing under Armor/Boxhead marks without clearance.  
4. Credit line: “Boxhead © Sean Cooper” (exact legal credit string TBD after clearance).

---

## 3. Fidelity checklist — what “exactly as original” means

Pass/fail against the 2007 2Play Rooms experience. Anything “modern convenience” must be **outside** the SWF (wrapper chrome only) and must not change frame timing, hit detection, spawn rates, or weapon curves.

### 3.1 Core loop
- [ ] Room/arena select works as original  
- [ ] Modes: solo / co-op / deathmatch all reachable  
- [ ] Wave escalation feel matches reference (density, spawn cadence)  
- [ ] Ammo crates drop/pickup behave as original  
- [ ] Explosive barrels detonate with original radius/damage feel  
- [ ] Score + kill-streak multiplier → weapon unlock/upgrade curve matches reference  
- [ ] Death → run end; high-score presentation matches  
- [ ] Special enemies (“devils” / equivalents) present if in target SWF  

### 3.2 Feel & pacing
- [ ] Chunky boxy characters / low-fi art not replaced or upscaled in-engine  
- [ ] Audio (SFX/music) present at original mix; no forced mute without user action  
- [ ] Session rhythm: short arcade runs (target feel ~5–20 min)  

### 3.3 Controls (critical for 2P)
- [ ] Player 1 and Player 2 keyboard maps work simultaneously  
- [ ] Original key defaults honored; user-definable rebinds work if present in SWF  
- [ ] No single-focus steal that breaks P2 input in browser  
- [ ] Mouse not required for core combat (keyboard authentic)  

### 3.4 Display
- [ ] Native stage size preserved (letterbox/pillarbox OK; no stretch that warps hitboxes)  
- [ ] Integer scale preferred (1x/2x/3x) over blurry CSS stretch  
- [ ] Fullscreen optional via wrapper; game stage rules unchanged  

### 3.5 Persistence
- [ ] High scores / unlocks persist equivalently (Ruffle SharedObject or documented stub)  
- [ ] No cloud account forced for MVP  

### 3.6 Non-goals for MVP
- Networked LAN / online multiplayer  
- Remastered HD art inside the SWF  
- New weapons/maps  
- Mobile touch controls (optional stretch; must not break desktop fidelity)  

**Reference capture (ARCADE):** record 3 reference clips from Armor Games Ruffle listing or cleared SWF — (a) wave 1–3 solo, (b) co-op mid-run, (c) deathmatch — for side-by-side QA.

---

## 4. Tech approach

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | **Ruffle** (self-hosted, pinned version) | No Adobe Flash Player |
| Content | Original **Boxhead: 2Play Rooms** SWF | Only after rights path; hash-pin the binary |
| Host page | Static HTML/JS shell | Canvas/container + Ruffle embed |
| Scale | CSS letterbox + integer zoom | Do not alter Stage scaleMode incorrectly |
| Input | Browser keyboard → Ruffle | QA dual-keyboard; document focus requirements |
| Audio | Browser autoplay policy handling | Click-to-start overlay if needed (overlay must not steal keys after start) |
| Deploy | CDN/static site under project brand | “Make Armor Games Great Again” portal stub OK |
| Analytics | Optional wrapper-only | Never inject into SWF |
| CI | Smoke: page loads, Ruffle boots, SWF reaches menu | Visual QA manual for fidelity checklist |

### Architecture sketch

```
[Portal page]
  └─ click-to-start (autoplay gate)
       └─ Ruffle player (pinned)
            └─ boxhead-2play-rooms.swf (hash-pinned)
  └─ chrome: controls legend, credit, legal, scale buttons
```

### Risks & mitigations
| Risk | Mitigation |
|------|------------|
| Dual-keyboard focus bugs | Dedicated QA matrix; fullscreen + document.activeElement tests |
| SharedObject / scores lost | Document Ruffle SO path; export/import later |
| SWF unavailable / rights blocked | Fallback: request binary from rights holder; do not use random fan dumps for public ship |
| “LAN” expectation mismatch | Copy in portal: “Local co-op on one keyboard (original 2007 behavior)” |

---

## 5. Art / audio notes

- **Do not redraw** characters, zombies, UI, or VFX for MVP — authenticity is the product.  
- Wrapper chrome may use project brand (MAGA/Armor revival visual language) **around** the game, not inside it.  
- Optional: crisp nearest-neighbor upscale of the **viewport**, not asset replacement.  
- Audio: keep original; provide mute toggle in chrome only.  
- Loading/menu splash: original SWF splash; portal may show project logo before click-to-start.

---

## 6. Milestone plan (swarm-executable)

### M0 — Legal & binary (gate)
- Owner: KIMI / João  
- Locate rights contact (Cooper / Fire Source / Crazy Monkey successors)  
- Request play/host license for MAGA portal  
- Obtain hash-pinned SWF  
- **Exit:** written OK for internal or public scope documented  

### M1 — Ruffle spike (1–2 days once SWF in hand)
- Owner: FORGE plans · implementers execute  
- Static page + pinned Ruffle + SWF boots to menu  
- Confirm AVM1 compatibility for this binary  
- **Exit:** playable solo to wave 3 on desktop Chrome/Firefox  

### M2 — Fidelity QA pass
- Owner: ARCADE dossier + QA  
- Run fidelity checklist §3 against reference clips  
- Log defects (input, timing, audio, scale)  
- **Exit:** checklist ≥90% pass or waiver list signed  

### M3 — Local 2P hardening
- Dual-keyboard matrix (layouts, OS, browsers)  
- Click-to-start + post-start key focus  
- On-screen control legend (chrome) for both players  
- **Exit:** co-op + deathmatch demoable without coaching beyond legend  

### M4 — Portal stub ship
- MAGA landing page: game card, credit, “local co-op” copy, legal  
- Deploy preview URL  
- **Exit:** shareable link for João + swarm review  

### M5 — Handoff complete / next title
- Update idea 001 actions/outcomes  
- Kick Burger Tycoon or S&S2 license track per backlog  

---

## 7. Swarm role hints

| Role | Focus |
|------|--------|
| **KIMI** | Orchestrate M0–M5; assign bots; blockers to João only when legal/human needed |
| **FORGE** | Turn this brief into implementation spec / tickets |
| **ARCADE** | Fidelity dossier, reference captures, pass/fail against §3 |
| **IDEATOR** | Vault evolution; revise brief on new facts; subsequent titles |

---

## 8. Source pack

- Research: `/workspace/armor-games-research/deep-dive.md`  
- Machine summary: `/workspace/armor-games-research/summary.json`  
- Vault idea: `ideas/entries/001-make-armor-games-great-again.md`  
- This brief: `/workspace/armor-games-research/briefs/001-boxhead-2play-build-brief.md`

---

## 9. One-line command to implementers

> Pin Ruffle, embed cleared Boxhead: 2Play Rooms SWF, letterbox integer-scale, prove solo + local 2P against the fidelity checklist, wrap in a MAGA portal card — ship preview before any remaster temptation.

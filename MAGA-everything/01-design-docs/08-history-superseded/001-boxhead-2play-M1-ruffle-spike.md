# M1 SPIKE SPEC — Boxhead: 2Play Rooms (Ruffle)
## Idea 001 · FORGE · **M1-LOCKED** 2026-09-22 14:01 America/Sao_Paulo

| Meta | Value |
|------|-------|
| **Status** | **M1-LOCKED** · Phase A **REVIEW PASS** (2026-09-22 14:16) · Phase B still blocked |
| **Milestone** | **M1** — scaffold now; menu + solo wave 3 only after SWF+clearance |
| **Repo (Windows / AMDPORRADA)** | `C:\Users\jpvei\Documents\kimi\Workspaces\veigapunkimi\armor-games\boxhead-2play-spike` |
| **Label** | **INTERNAL-NO-PUBLIC** (mandatory on UI, README, every build) |
| **Parent spec** | `/workspace/armor-games-research/specs/001-boxhead-2play-impl-spec.md` |
| **Brief** | `/workspace/armor-games-research/briefs/001-boxhead-2play-build-brief.md` |
| **Fidelity** | `/workspace/armor-games-dossiers/boxhead.md` |
| **Roles** | KIMI = build on box · FORGE = planner/reviewer only |

---

## M0 decision (João via RELAYER) — LOCKED

| Decision | **A — INTERNAL SPIKE OK** |
|----------|---------------------------|
| Public ship / deploy / sharing | **Forbidden** until written clearance from Cooper / Crazy Monkey / Fire Source |
| Scaffold (shell + pinned Ruffle, no SWF) | **Unblocked NOW** |
| SWF embed | **Blocked** until (a) binary in hand **and** (b) written clearance |
| SWF in git repo | **Keep out** until clearance — do not commit `.swf` |

Everything in this spike must show **INTERNAL-NO-PUBLIC** (README banner + on-page badge).

---

## Goal (phased)

### Phase A — NOW (no SWF)
Static shell + version-pinned self-hosted Ruffle + click-to-start + integer scale chrome + INTERNAL badge. Placeholder path for future SWF. No game binary.

### Phase B — after binary + written clearance
Hash-pin SWF **outside** repo (or secured local path documented, not committed) → boot to menu → solo to wave 3 on Chrome + Firefox. Then M1.6 handoff to ARCADE.

Chrome outside SWF only — no remaster inside the binary. Local 2P not required for M1 exit.

---

## Tech lock

```
[index.html]
  └─ INTERNAL-NO-PUBLIC badge (always visible)
  └─ click-to-start overlay
       └─ Ruffle (pinned) → [SWF path only in Phase B; never committed]
  └─ chrome: scale 1x/2x/3x · mute · credit stub
```

| Layer | Choice |
|-------|--------|
| Runtime | Self-hosted Ruffle, version-pinned under `vendor/ruffle/` |
| Host | Static HTML/JS/CSS — no app framework required |
| Scale | Letterbox + integer zoom; no CSS stretch that warps stage |
| Input | Keyboard → Ruffle; focus after click-to-start |
| Deploy | **Local only** — no public host, no CDN ship |
| SWF | Not in repo; local absolute path or ignored content dir until clearance |

---

## Tickets

### Phase A — execute NOW

#### M1.1 — Shell scaffold
- Create repo tree at locked Windows path
- `public/index.html`, `public/css/shell.css`, `public/js/embed.js`
- Click-to-start overlay; after click, focus Ruffle container
- Visible **INTERNAL-NO-PUBLIC** badge
- **Accept:** cold load shows overlay + badge; click dismisses overlay

#### M1.2 — Pin Ruffle
- Vendor under `vendor/ruffle/`
- Record exact `RUFFLE_VERSION` in README
- Wire embed.js to local Ruffle (no CDN lottery)
- **Accept:** offline/local reload uses same Ruffle bits

#### M1.2b — SWF stub (no binary)
- Document expected path e.g. `content/boxhead-2play-rooms.swf` in README
- Add `content/.gitkeep` + `content/.gitignore` ignoring `*.swf`
- Embed.js: if SWF missing, show calm “SWF not loaded — INTERNAL stub” state (no fake game)
- **Accept:** no `.swf` in git status; missing-SWF UI is clear

#### M1.4 — Display chrome (can run without SWF)
- Letterbox container; 1x/2x/(3x) integer scale controls
- Mute stub; credit stub (“Boxhead © Sean Cooper” TBD)
- **Accept:** scale buttons resize container without non-integer stretch default

**Phase A exit:** KIMI reports path + `RUFFLE_VERSION` + screenshot/note of INTERNAL shell. FORGE reviews; RELAYER/KIMIKO notified.

---

### Phase B — blocked until binary + written clearance

#### M1.3 — Embed SWF
- Load hash-pinned SWF from **non-committed** path
- Boot to in-game menu; write `docs/COMPAT.md`
- **Accept:** menu on Chrome + Firefox; `swf.sha256` + `PROVENANCE.md` present (local/docs, SWF still not committed unless João reverses)

#### M1.5 — Solo smoke to wave 3
- Solo → wave 3; glance ammo/barrels/room select
- Sign `docs/ACCEPTANCE.md` (tester + date + browsers)

#### M1.6 — ARCADE handoff
- Default P1 keys noted; optional clip (a) if policy allows
- Ping ARCADE: hash + Ruffle pin + local spike path
- Unblocks M2 reference captures

---

## Repo layout (locked path)

```
C:\Users\jpvei\Documents\kimi\Workspaces\veigapunkimi\armor-games\boxhead-2play-spike\
  README.md                 # INTERNAL-NO-PUBLIC banner + RUFFLE_VERSION + how to run local
  public\index.html
  public\css\shell.css
  public\js\embed.js
  vendor\ruffle\            # pinned
  content\
    .gitkeep
    .gitignore              # *.swf
    # boxhead-2play-rooms.swf  ← local only, Phase B, NOT committed
  docs\
    LEGAL_SCOPE.md          # INTERNAL-NO-PUBLIC; clearance pending
    COMPAT.md               # Phase B
    ACCEPTANCE.md           # Phase B
    PROVENANCE.md           # Phase B
    swf.sha256              # Phase B
```

---

## M1 acceptance (full exit = Phase A + B)

**Phase A**
- [ ] Repo at locked path
- [ ] Ruffle pinned + documented
- [ ] INTERNAL-NO-PUBLIC on page + README
- [ ] Click-to-start + scale chrome
- [ ] No `.swf` in git
- [ ] Missing-SWF stub state works
- [ ] Local-only run instructions (no public deploy)

**Phase B** (after clearance + binary)
- [ ] Menu reachable; solo wave 3 on Chrome + Firefox
- [ ] sha256 + provenance; SWF still not public-shipped
- [ ] ARCADE notified (M1.6)

**Non-goals:** dual-keyboard matrix, co-op polish, portal marketing, networked LAN, public URL.

---

## Report back

**After Phase A:** RELAYER + KIMIKO — path, `RUFFLE_VERSION`, INTERNAL confirmed, FORGE review request.  
**After Phase B:** + `swf.sha256`, smoke results, COMPAT one-liner, ARCADE ping.

---

## Pointers

- This file (canonical on shared box): `/workspace/armor-games-research/specs/001-boxhead-2play-M1-ruffle-spike.md`
- Parent: `/workspace/armor-games-research/specs/001-boxhead-2play-impl-spec.md`
- Dossier: `/workspace/armor-games-dossiers/boxhead.md`

---

## Phase A review (FORGE) — 2026-09-22 14:16 America/Sao_Paulo

**Verdict: REVIEW PASS** against six locked steps. Commit reported: `48ec5ac` (KIMIKO). Repo path unchanged.

| Step | Result |
|------|--------|
| 1 Shell | PASS — `public/index.html` + `style.css` + `embed.js` (flat under `public/`) |
| 2 Ruffle pin | PASS — `vendor/ruffle/` 12 assets · `RUFFLE_VERSION` = **0.6.0** + zip/wasm SHA-256 |
| 3 INTERNAL | PASS — banner every load + README M0 conditions + credits stub |
| 4 Chrome | PASS — click-to-start · integer 1x/2x/3x · mute · credits panel |
| 5 No SWF | PASS — `content/.gitignore` `*.swf` · missing-SWF stub · binary absent |
| 6 Local-only | PASS — `python -m http.server` · no deploy config |

**Non-blocking notes (do not reopen Phase A):**
1. Stage size **640×480** is provisional — ARCADE dossier has no measured stage yet; lock when reference SWF/clip exists.
2. Ruffle pin policy: keep **stable releases** (current 0.6.0) unless a specific SWF bug forces a documented nightly.
3. Locked SWF filename for Phase B: `content/boxhead-2play.swf` (as implemented).
4. Optional later: `docs/LEGAL_SCOPE.md` — README already carries M0 text adequately for Phase A.

**Phase B still blocked** until binary in hand + written clearance.


# Make Armor Games Great Again

| Field | Value |
|-------|-------|
| **ID** | `001` |
| **Slug** | `make-armor-games-great-again` |
| **Title** | Make Armor Games Great Again |
| **Date** | 2026-09-22 13:32 America/Sao_Paulo (seeded); updated 13:34 |
| **Context** | Idea #1 in IDEATOR vault; refined wording from machine cbe5f3e9 |
| **Category** | Product / Games |
| **Tags** | `armor-games`, `native-replica`, `nostalgia`, `web-games`, `swarm-build`, `retro`, `original-ip`, `mobile-desktop` |
| **Status** | `concept-handed-off` |
| **Related ideas** | Concept pack `/workspace/armor-games-research/concept-specs/INDEX.md` · FORGE stack lock `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` ·  Brief `ideas/briefs/001-boxhead-2play-build-brief.md` · FORGE spec `/workspace/armor-games-research/specs/001-boxhead-2play-impl-spec.md` · ARCADE dossier `/workspace/armor-games-dossiers/boxhead.md` |
| **Next action** | KIMI/FORGE implement Boxhead native first; PIXEL/MAESTRO/PROOF/ARCADE pull from concept-specs |
| **Open questions** | Per-title public rights still required for named ships; FORGE stack choice; Chicken original theme/tone; Boxhead networked LAN as later stretch vs local-only v1 fidelity |

## Problem / opportunity

Flash-era browser games (many associated with Armor Games and that era) are gone from modern browsers. Opportunity: revive the best nostalgic titles so they play exactly as in their original form — no Flash — recreated and revamped with João's swarm, plus room for new originals in those styles.

## Brand / working title

**MAKE ARMOR GAMES GREAT AGAIN** (canonical as of 2026-09-22 13:34).

Earlier misread of “MAKEA RMORGAMES” as “Make Flash Games…” is retained only in history (`history/001-2026-09-22-1333-seed-flash-misread.md`).


## CURRENT REQUIREMENT (2026-09-22 14:31) — major evolution

**Pivot:** from “revive via emulation (Ruffle/SWF)” to **working native replicas for every title**.

**João (via KIMI), verbatim intent:** working native replicas for each game on the menu — Swords and Sandals, The McDonald's Game, The Impossible Game, Boxhead, Chicken Invaders — plus a **new original** in the Chicken Invaders style. Each must:

1. Run **end-to-end on localhost** and be **playable now** (v1 slice)
2. Be **lightweight** (fast load, small payload)
3. Play perfectly in the browser on **mobile (touch)** and **desktop (keyboard/mouse)**
4. **Feel exactly like the originals** — fidelity constraint stands

**Standing crew rule (effective now):** always reply in **English**. Never reply in Portuguese — not in chat, not on the bridge, not in any filed document.

**Division of labor:**
| Role | Owns |
|------|------|
| FORGE | Stack + architecture |
| ARCADE | Fidelity reference |
| PIXEL | Art specs (minting) |
| MAESTRO | Audio specs (minting) |
| PROOF | Acceptance test plans (minting) |
| IDEATOR | Concept specs + vault evolution |
| KIMI | Orchestration / implementation |

**Rights distinction (logged):** native replicas are **from-scratch reimplementations**, not ROM/SWF distribution. Internal **localhost** development proceeds under **INTERNAL-NO-PUBLIC** posture. Any **public** ship still needs **per-title rights clearance**. Emulation/Ruffle path is superseded for the product goal but prior research remains historical in the evolution log and `history/`.


## FORGE implementation order (STACK-LOCKED 2026-09-22 14:34)

1. Boxhead: 2Play Rooms (native) — start now  
2. The Impossible Game (Lite-faithful)  
3. Burger Tycoon  
4. Chicken Invaders recreate  
5. Swords and Sandals 2  
6. New Chicken Invaders–style original  

Stack: PixiJS 8 + arcade-core (see FORGE lock). Prior EMULATE/Ruffle ship vehicle superseded; Ruffle = reference-only.

## Seed game list

1. **Swords and Sandals**
2. **The McDonald's Game**
3. **The Impossible Game**
4. **Boxhead** — LAN game; fight hordes of zombies with many weapons
5. **Chicken Invaders** — native replica of classic series feel (target CI2-era vertical shmup)
6. **Chicken Invaders Original** (working title TBD) — new swarm-made title in that style

## Constraints / design intent

- **Native replicas** (from-scratch), not Flash/SWF/Ruffle as the ship vehicle
- Feel **exactly like the originals** (fidelity)
- Localhost playable, lightweight, browser **mobile touch + desktop**
- Swarm-built; English-only crew communications
- Menu: five nostalgia replicas + one new Chicken Invaders–style original
- Public release gated by per-title rights; internal localhost = INTERNAL-NO-PUBLIC

## Evolution log

| When | What |
|------|------|
| 2026-09-22 13:32 | Seeded from first message; title ambiguous (“MAKEA RMORGAMES”); vault tentatively titled Make Flash Games Great Again |
| 2026-09-22 13:34 | Canonical title set: **Make Armor Games Great Again**; polished project concept; Chicken Invaders = revive + create new in-style original; explicit ask to track evolution and actions |
| 2026-09-22 13:48 | MODE: autonomous thinking by IDEATOR; hand results to KIMI for implementation. Scope: deep-dive 5 titles, revival approach, pick first ship, draft build brief, HANDOFF to KIMI |
| 2026-09-22 13:51 | Deep-dive complete; first ship = Boxhead: 2Play Rooms (EMULATE/Ruffle); build brief drafted; HANDOFF to KIMI |
| 2026-09-22 13:52 | RELAYER ACK: M0=KIMI+João; M1=FORGE; M2=ARCADE (dossier now); brief filed for Kimi Work |
| 2026-09-22 13:55 | FORGE impl spec + M1 spike docs; ARCADE Boxhead fidelity draft; clips blocked on cleared SWF; Kimi Work awaiting João M0 call |
| 2026-09-22 14:31 | MAJOR: pivot EMULATE→native replicas for all 6 titles; localhost+light+mobile/desktop; EN-only rule; roles FORGE/ARCADE/PIXEL/MAESTRO/PROOF; rights = reimpl not ROM/SWF |
| 2026-09-22 14:34 | FORGE STACK-LOCKED: native primary; order Boxhead→Impossible Lite→Burger Tycoon→CI recreate→S&S2→CI original; PixiJS 8 + arcade-core; Ruffle reference-only |
| 2026-09-22 14:35 | Concept specs pack complete (6 titles + INDEX) in FORGE order; HANDOFF to KIMI |

## Original notes (verbatim)

### Capture 1 — 2026-09-22 13:32

> ok i want you to interact with the ideator grok bot using the cdp. his raison d'etre is to hold ideas, help me store them and also keep notes opf them, how they evolve, how they get acted upon; first idea is that i want to create a MAKEA RMORGAMES GREAT AGAIN and serve some of the best nostalgic flash games, revamped and recreated using my swarms capabilities, to be served without using flash, and making them be played exactly as they were played on their original form. some of the games i remember fondly are "Swords and Sandals" "the mcdonalds game" "the impossible game" and also boxhead (a lan game where you fought hordes of zombies with a bunch of weapons. Also, i loved "chicken invaders" i would like to create one of that

### Capture 2 — 2026-09-22 13:34

> IDEA #1 — MAKE ARMOR GAMES GREAT AGAIN
>
> Project concept: revive the best nostalgic Flash-era games and serve them exactly as they were played in their original form — no Flash required — recreated and revamped using our swarm capabilities.
>
> Games I remember fondly and want on the menu:
> 1. Swords and Sandals
> 2. The McDonald's Game
> 3. The Impossible Game
> 4. Boxhead (the LAN game where you fought hordes of zombies with a bunch of weapons)
> 5. Chicken Invaders — and beyond reviving it, I'd love for us to create a new one of our own in that style.
>
> Please log this as idea #1 in the vault, track how it evolves, and keep notes on how it gets acted on.


### Capture 3 — 2026-09-22 14:31 (via KIMI)

> IDEA 001 EXPANSION: pivot from "revive via emulation" to "working native replicas for every title". Working native replicas for each game — Swords and Sandals, The McDonald's Game, The Impossible Game, Boxhead, Chicken Invaders — plus a new original in the Chicken Invaders style. Each must run end-to-end on localhost and be playable now; be lightweight; play perfectly in browser on mobile (touch) and desktop (keyboard/mouse); feel exactly like the originals. Standing rule: always reply in English. Division: FORGE stack; ARCADE fidelity; PIXEL art; MAESTRO audio; PROOF acceptance. Rights: native replicas are from-scratch reimplementations, not ROM/SWF distribution — INTERNAL-NO-PUBLIC for localhost; public ship still needs per-title rights.

## Actions / outcomes

| When | Action | Result |
|------|--------|--------|
| 2026-09-22 13:33 | Vault SAVE as 001 (provisional Flash title) | Entry + INDEX created |
| 2026-09-22 13:34 | UPDATE: canonical Armor title; dual Chicken Invaders track | This revision; prior file snapshotted in history |
| 2026-09-22 13:48 | MODE-ACK; start unsupervised research on menu titles | In progress |
| 2026-09-22 13:51 | Deep-dive + summary.json; build brief for Boxhead 2Play; HANDOFF to KIMI; notified FORGE | Done |
| 2026-09-22 13:52 | HANDOFF to KIMI via RELAYER; brief to FORGE; research pack to ARCADE | Sent |
| 2026-09-22 13:52 | RELAYER ACK + milestone assignments filed | Accepted — swarm executing |
| 2026-09-22 13:55 | ARCADE fidelity draft + INDEX; refs blocked until hash-pinned SWF / permitted AG capture | `/workspace/armor-games-dossiers/boxhead.md` |
| 2026-09-22 14:31 | Vault UPDATE native-replica expansion; start per-game concept specs; HANDOFF to KIMI when ready | In progress |
| 2026-09-22 14:34 | Adopt FORGE order for concept specs; reframe Boxhead native | In progress |
| 2026-09-22 14:35 | Deliver concept-specs pack; HANDOFF to KIMI via RELAYER | Sent |
| 2026-09-22 13:54 | KIMIKO routed paths to Kimi Work; awaiting João M0 (spike vs wait for rights) | Pending João |
| 2026-09-22 13:54 | FORGE M1 Ruffle spike plan | `/workspace/armor-games-research/specs/001-boxhead-2play-M1-ruffle-spike.md` |
| 2026-09-22 13:53 | FORGE impl spec from HANDOFF | `/workspace/armor-games-research/specs/001-boxhead-2play-impl-spec.md` |


## First-ship decision (2026-09-22) — SUPERSEDED for product approach (kept for history)

> Emulation-first Boxhead Ruffle plan superseded 14:31 by native-replica mandate. Prior FORGE Ruffle specs remain reference only until rewritten for native stack.

**Winner:** Boxhead: 2Play Rooms (2007) — approach **EMULATE** (Ruffle).

Per-game approaches: S&S2 EMULATE · McDonald's/Burger Tycoon EMULATE · Impossible Lite EMULATE (full = RECREATE+license) · Boxhead EMULATE · Chicken Invaders RECREATE/partner (not Flash-native).

Brief: `ideas/briefs/001-boxhead-2play-build-brief.md`

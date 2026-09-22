# Fidelity dossier — The Impossible Game

| Field | Value |
|-------|-------|
| **Slug** | `impossible-game` |
| **Idea** | 001 — Make Armor Games Great Again |
| **Status** | skeleton |
| **Last update** | 2026-09-22 |

## Target version(s)

| Role | Version | Platform | Notes |
|------|---------|----------|-------|
| **PRIMARY for SWF-exact** | Impossible Game Lite | Newgrounds Flash, 2010-05-01 | Demo slice (~Fire Aura); only genuine Flash SWF under constraint |
| Audience memory / full product | The Impossible Game | XBLIG 2009; mobile; Steam 2014 | **Not Flash**; five classic levels + practice/editor on PC |
| Out of scope as “original Flash” | Fan Geometry Dash–adjacent clones | — | Separate IP |

**Evidence:** IDEATOR research pack `/workspace/armor-games-research/deep-dive.md` + `summary.json` (2026-09-22). Secondary web sources cited there — not primary playthroughs.

## Original mechanics

1. Auto-run cube; single input = jump.
2. Memorize spike/gap/rhythm; die → restart (normal: full level).
3. Practice mode: checkpoint flags (full game).
4. Beat level → medals; five classic levels on full game (Fire Aura, Original, Chaoz Fantasy, Heaven, Phazd).
5. Optional level editor (PC full).

### Evidence gaps
- Lite exact level geometry / length vs Fire Aura full — **gap**.
- Hitbox sizes, coyote/jump buffer (if any) — **gap**.
- Medal criteria — **gap**.

## Controls

- One button / click / tap.
- Sessions (reported): 2–15 min bursts.

### Evidence gaps
- Input latency expectations vs music beat — **critical for feel; unverified**.
- Exact key/mouse bindings on Lite SWF — **gap**.

## Feel / pacing

- Minimalist geometry; fail-fast; music-locked timing.
- “One more try” micro-sessions; muscle memory + pattern recall.
- Aesthetic: flat colored cube, stark obstacles — readability over spectacle.

### Evidence gaps
- Track-to-obstacle sync map — **gap**.
- Death/restart timing (frames to respawn) — **gap**.

## Asset / audio situation

- Lite: browser Flash SWF (AVM1-era likely).
- Full: native — not Flash.
- Music sync is load-bearing for feel.
- Owner: Fluke Games (FlukeDude); sequel active (2022).

### Evidence gaps
- Trusted Lite SWF hash — **gap**.
- Music licenses / track list for full five — **gap**.
- Whether AG ever hosted Lite — **not established in seed research**.

## “Played exactly as original” requirements (no Flash plugin)

**Split targets — do not conflate:**

### A) Flash-exact (Lite)
1. Lite SWF plays without Flash plugin with identical jump timing and level geometry.
2. Upsell/end behavior of Lite documented; do not silently expand into full game and call it Lite.

### B) “As remembered” full game
1. Requires licensed RECREATE or official port wrap — **not** a Flash binary.
2. Timing/audio sync must match canonical full levels; practice checkpoints + medals.
3. Fan SWFs / unrelated precision platformers are **not** acceptable stand-ins.

### Evidence gaps
- João preference: Lite spike vs full-game promise — **awaiting product call** (FORGE/IDEATOR; ARCADE will dossier both tracks).
- Fluke license status — **gap**.

## Sources / provenance

- Seeded from: IDEATOR research pack `/workspace/armor-games-research/deep-dive.md` + `summary.json` (2026-09-22). Secondary web sources cited there — not primary playthroughs.
- ARCADE playthrough: **none yet**
- Primary SWF in hand: **no**

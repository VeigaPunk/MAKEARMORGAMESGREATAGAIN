# MAGA audio — MAESTRO standing infrastructure

**Owner:** MAESTRO (audio). Not PIXEL (visuals). Not ARCADE (gameplay fidelity).  
**Idea:** 001 — Make Armor Games Great Again  
**Constraint:** Zero binary audio assets. Everything is WebAudio / oscillator synth recipes so Kimi Work synthesizes in code.  
**Language:** English only (chat, bridge, documents).

## When this pack applies

| Ship path | Audio source |
|-----------|--------------|
| **Native replica (STACK-LOCKED primary)** | **This pack is authoritative.** Map cue → recipe; no WAV/MP3/OGG. Implement via `packages/arcade-core` WebAudio helpers. |
| **Ruffle / EMULATE** | INTERNAL feel reference only — not the product mix. |
| **Portal chrome** | Optional thin UI beeps; must not fight in-game mix. |

**Stack lock:** `/workspace/armor-games-research/specs/001-native-stack-and-plan.md`  
**Roles:** MAESTRO audio · PIXEL art · ARCADE fidelity · PROOF acceptance · FORGE plan/review · KIMI implement

## Per-title deliverables

For each slug under `/workspace/armor-games-audio/<slug>/` or `*-sound-bible.md`:

1. **Cue inventory** — id, trigger, original reference note, status (`verified` | `provisional` | `gap`).
2. **Music beds** — loop structure, tempo feel, when to start/stop.
3. **Recipe table** — each cue → WebAudio recipe (see schema below).
4. **Mix notes** — relative levels, ducking, browser autoplay gate.
5. **Handoff block** — copy-pasteable for Kimi Work.

## Recipe schema (Kimi-ready)

Each cue is a JSON-like object Kimi can implement with `AudioContext` only (OscillatorNode, GainNode, BiquadFilterNode, Noise via ScriptProcessor/AudioWorklet buffer of random samples — no fetch).

```js
{
  id: "sfx.pistol_fire",          // stable kebab id
  kind: "sfx" | "music" | "ui",
  trigger: "player fires pistol",
  polyphony: 4,                     // max overlapping voices
  recipe: {
    type: "noise_burst" | "square_blip" | "saw_thud" | "fm_chirp" | "arpeggio" | "drone",
    durationMs: 80,
    // frequency in Hz, or note names for music helpers
    freq: 220,
    freqEnd: 110,                   // optional glide
    wave: "square" | "sawtooth" | "triangle" | "sine",
    duty: 0.5,                      // square only, optional
    filter: { type: "lowpass", freq: 1800, Q: 0.7 },
    envelope: { a: 0.001, d: 0.05, s: 0.0, r: 0.02 }, // seconds
    gain: 0.25,                     // peak linear 0..1
    noise: { amount: 0.6, color: "white" | "pink" }, // optional mix
    vibrato: { hz: 0, depth: 0 },
    // music only:
    pattern: ["C3","E3","G3","C4"], // optional
    bpm: 120,
    loop: false
  },
  originalNote: "short dry Flash gun click; mid-2000s AG feel",
  status: "provisional"
}
```

### Synth primitives (implement once, reuse)

| `type` | Intent |
|--------|--------|
| `noise_burst` | Hits, scrapes, static, death |
| `square_blip` | UI, pickups, coin-ish |
| `saw_thud` | Explosions, body hits, bass stomp |
| `fm_chirp` | Sci-fi / special enemy / powerup |
| `arpeggio` | Stingers, unlock fanfares |
| `drone` | Tension beds, low loops |

**Style target:** 8-bit / early Flash chiptune — harsh squares, short decays, little reverb. Prefer dry mono; stereo only if a title dossier demands it.

## Directory layout

```
/workspace/armor-games-audio/
  README.md                          # this file
  boxhead-2play-sound-bible.md       # first ship (recreate/fallback)
  <slug>-sound-bible.md              # later titles
```

## Status legend

- **verified** — matched against playthrough / SWF capture (ARCADE clip or hash-pinned SWF).
- **provisional** — designed from mechanics + era feel; replace when capture lands.
- **gap** — cue likely exists in original; not designed yet.

## Standing rule for swarm

Do not invent nostalgia claims as verified. Mark gaps. When ARCADE posts reference clips, MAESTRO revises recipes to cue timing, not the other way around.

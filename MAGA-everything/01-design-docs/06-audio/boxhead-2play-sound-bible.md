# Sound bible — Boxhead: 2Play Rooms

| Field | Value |
|-------|-------|
| **Slug** | `boxhead-2play` |
| **Title** | Boxhead: 2Play Rooms (2007 Flash) |
| **Idea** | 001 — MAGA |
| **Owner** | MAESTRO |
| **Status** | draft v1 — STACK-LOCKED native-primary (provisional cues until ARCADE clips) |
| **Last update** | 2026-09-22 America/Sao_Paulo |
| **Stack lock** | `/workspace/armor-games-research/specs/001-native-stack-and-plan.md` |
| **Fidelity dossier** | `/workspace/armor-games-dossiers/boxhead.md` |
| **Build brief** | `/workspace/armor-games-research/briefs/001-boxhead-2play-build-brief.md` (EMULATE sections superseded as primary) |
| **Machine list** | `/workspace/armor-games-audio/boxhead-2play-recipes.json` |

## Path split (STACK-LOCKED)

| Path | What to ship |
|------|----------------|
| **Native Boxhead (PRIMARY)** — PixiJS 8 + `arcade-core` | **This bible is authoritative.** All SFX + music = WebAudio / oscillator recipes. Zero binary assets. |
| **Ruffle spike** | INTERNAL feel reference only — do not treat SWF audio as the product mix. |
| **QA** | ARCADE: feel-faithful vs original. PROOF: cues fire on events, mute works, no decode/fetch of audio files. |

ARCADE owns pass/fail on “sounds like original.” MAESTRO owns recipe design. Implement in `packages/arcade-core` WebAudio helpers, then wire from `apps/boxhead`.

## Mix targets (provisional)

| Bus | Peak gain | Notes |
|-----|-----------|-------|
| SFX weapons | 0.22–0.35 | Short, dry, readable in swarm |
| SFX enemies / hits | 0.18–0.28 | Slightly quieter than player guns |
| SFX world (crate, barrel) | 0.25–0.40 | Barrel boom can duck music briefly |
| UI | 0.12–0.18 | Soft; never mask gunfire |
| Music bed | 0.08–0.14 | Loop under chaos; duck −6 dB on explosion |
| Master | clamp 0.9 | Soft clip avoid; mono OK |

**Autoplay:** portal click-to-start resumes `AudioContext` once; do not steal keyboard focus after start (see build brief §4).

## Cue inventory

Status: all **provisional** until ARCADE reference clips or SWF extract. Triggers from Rooms / 2Play mechanics in the dossier.

### UI / session

| id | Trigger | Recipe type | status |
|----|---------|-------------|--------|
| `ui.menu_move` | Room/mode highlight changes | square_blip | provisional |
| `ui.menu_confirm` | Start / confirm | square_blip | provisional |
| `ui.player_join` | Co-op / DM mode select flavor | arpeggio | provisional |
| `ui.game_over` | Death → run end | saw_thud + arpeggio down | provisional |
| `ui.high_score` | New high score present | arpeggio | provisional |
| `ui.wave_clear` | Wave cleared sting (if original has one) | arpeggio | gap |

### Player weapons

| id | Trigger | Recipe type | status |
|----|---------|-------------|--------|
| `sfx.pistol_fire` | Pistol shot | noise_burst + square | provisional |
| `sfx.shotgun_fire` | Shotgun blast | noise_burst wide | provisional |
| `sfx.uzi_fire` | Uzi auto (per shot) | square_blip short | provisional |
| `sfx.grenade_throw` | Grenade leave hand | square_blip low | provisional |
| `sfx.grenade_explode` | Grenade detonate | saw_thud | provisional |
| `sfx.empty_click` | Fire with no ammo | square_blip tiny | gap |
| `sfx.weapon_unlock` | Streak unlock / upgrade | fm_chirp + arpeggio | provisional |

### World / pickups

| id | Trigger | Recipe type | status |
|----|---------|-------------|--------|
| `sfx.ammo_pickup` | Ammo crate | square_blip bright | provisional |
| `sfx.barrel_explode` | Explosive barrel | saw_thud + noise | provisional |
| `sfx.player_hurt` | Player takes damage | noise_burst mid | provisional |
| `sfx.player_death` | Player dies | saw_thud long | provisional |

### Enemies

| id | Trigger | Recipe type | status |
|----|---------|-------------|--------|
| `sfx.zombie_hit` | Zombie damaged | noise_burst dull | provisional |
| `sfx.zombie_death` | Zombie killed | noise_burst + pitch drop | provisional |
| `sfx.zombie_attack` | Melee / contact hit on player | saw_thud short | gap |
| `sfx.special_spawn` | Devil / special appears | fm_chirp | provisional |
| `sfx.special_death` | Special killed | fm_chirp down | gap |

### Music

| id | Trigger | Recipe type | status |
|----|---------|-------------|--------|
| `music.menu` | Title / room select | drone + sparse arpeggio | provisional |
| `music.combat` | In-run bed | drone pulse 8-bit | provisional |
| `music.deathmatch` | DM mode bed (if distinct) | drone faster | gap |

## WebAudio recipes (implementable)

Copy into Kimi Work. All times in seconds unless `durationMs`. `ctx` = resumed `AudioContext`.

### Shared helpers (sketch)

```js
function envGain(ctx, t0, { a, d, s, r }, peak, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + a);
  g.gain.linearRampToValueAtTime(peak * s, t0 + a + d);
  const relAt = t0 + Math.max(dur, a + d);
  g.gain.setValueAtTime(peak * s, relAt);
  g.gain.linearRampToValueAtTime(0, relAt + r);
  return g;
}

function noiseBuffer(ctx, seconds) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
```

### `sfx.pistol_fire`

```js
{
  id: "sfx.pistol_fire",
  kind: "sfx",
  trigger: "player fires pistol",
  polyphony: 6,
  recipe: {
    type: "noise_burst",
    durationMs: 70,
    wave: "square",
    freq: 420,
    freqEnd: 180,
    filter: { type: "bandpass", freq: 1200, Q: 0.9 },
    envelope: { a: 0.001, d: 0.04, s: 0.0, r: 0.03 },
    gain: 0.28,
    noise: { amount: 0.75, color: "white" }
  },
  originalNote: "Dry mid Flash pistol; click + short noise body",
  status: "provisional"
}
```

**Play sketch:** 15 ms square glide 420→180 Hz + parallel noise burst through bandpass; both into ADSR gain.

### `sfx.shotgun_fire`

```js
{
  id: "sfx.shotgun_fire",
  kind: "sfx",
  trigger: "player fires shotgun",
  polyphony: 3,
  recipe: {
    type: "noise_burst",
    durationMs: 140,
    filter: { type: "lowpass", freq: 2400, Q: 0.5 },
    envelope: { a: 0.001, d: 0.08, s: 0.05, r: 0.06 },
    gain: 0.34,
    noise: { amount: 1.0, color: "white" },
    // layer: sub thud
    freq: 90,
    wave: "sawtooth",
    freqEnd: 50
  },
  originalNote: "Wider noise slap than pistol; more body",
  status: "provisional"
}
```

### `sfx.uzi_fire`

```js
{
  id: "sfx.uzi_fire",
  kind: "sfx",
  trigger: "uzi auto pulse (one per shot)",
  polyphony: 8,
  recipe: {
    type: "square_blip",
    durationMs: 35,
    wave: "square",
    freq: 880,
    freqEnd: 440,
    duty: 0.25,
    envelope: { a: 0.0005, d: 0.02, s: 0.0, r: 0.015 },
    gain: 0.2,
    noise: { amount: 0.25, color: "white" }
  },
  originalNote: "Thin rapid ticks; must stack cleanly at high RoF",
  status: "provisional"
}
```

### `sfx.grenade_explode` / `sfx.barrel_explode`

```js
{
  id: "sfx.barrel_explode",
  kind: "sfx",
  trigger: "explosive barrel or grenade detonation",
  polyphony: 2,
  recipe: {
    type: "saw_thud",
    durationMs: 420,
    wave: "sawtooth",
    freq: 110,
    freqEnd: 38,
    filter: { type: "lowpass", freq: 800, Q: 0.8 },
    envelope: { a: 0.002, d: 0.18, s: 0.15, r: 0.22 },
    gain: 0.38,
    noise: { amount: 0.85, color: "pink" }
  },
  originalNote: "Boomy Flash boom; duck music ~200ms",
  status: "provisional"
}
```

### `sfx.ammo_pickup`

```js
{
  id: "sfx.ammo_pickup",
  kind: "sfx",
  trigger: "ammo crate pickup",
  polyphony: 4,
  recipe: {
    type: "square_blip",
    durationMs: 90,
    wave: "square",
    freq: 660,
    freqEnd: 990,
    envelope: { a: 0.001, d: 0.05, s: 0.0, r: 0.04 },
    gain: 0.16
  },
  originalNote: "Bright upward chip; readable over combat bed",
  status: "provisional"
}
```

### `sfx.zombie_death`

```js
{
  id: "sfx.zombie_death",
  kind: "sfx",
  trigger: "zombie killed",
  polyphony: 10,
  recipe: {
    type: "noise_burst",
    durationMs: 110,
    wave: "sawtooth",
    freq: 160,
    freqEnd: 70,
    filter: { type: "lowpass", freq: 900, Q: 0.6 },
    envelope: { a: 0.001, d: 0.07, s: 0.0, r: 0.05 },
    gain: 0.22,
    noise: { amount: 0.7, color: "pink" }
  },
  originalNote: "Dull meaty pop; must not fatigue at swarm density",
  status: "provisional"
}
```

### `sfx.weapon_unlock`

```js
{
  id: "sfx.weapon_unlock",
  kind: "sfx",
  trigger: "kill-streak unlock / weapon upgrade",
  polyphony: 1,
  recipe: {
    type: "arpeggio",
    durationMs: 320,
    wave: "square",
    pattern: ["C4", "E4", "G4", "C5"],
    bpm: 180,
    envelope: { a: 0.002, d: 0.06, s: 0.2, r: 0.08 },
    gain: 0.2,
    vibrato: { hz: 5, depth: 4 }
  },
  originalNote: "Short victory chip; celebrate unlock without pausing combat",
  status: "provisional"
}
```

### `sfx.special_spawn`

```js
{
  id: "sfx.special_spawn",
  kind: "sfx",
  trigger: "devil / special enemy appears",
  polyphony: 2,
  recipe: {
    type: "fm_chirp",
    durationMs: 280,
    wave: "square",
    freq: 200,
    freqEnd: 600,
    envelope: { a: 0.01, d: 0.1, s: 0.3, r: 0.1 },
    gain: 0.24,
    vibrato: { hz: 12, depth: 30 }
  },
  originalNote: "Alarm-ish chirp so specials read in chaos",
  status: "provisional"
}
```

### `music.combat`

```js
{
  id: "music.combat",
  kind: "music",
  trigger: "in-run background",
  polyphony: 1,
  recipe: {
    type: "drone",
    durationMs: 0,
    loop: true,
    bpm: 128,
    wave: "square",
    // bass pulse on beats 1+3; sparse high arpeggio every 2 bars
    pattern: ["C2", "C2", "G1", "C2"],
    filter: { type: "lowpass", freq: 1400, Q: 0.5 },
    envelope: { a: 0.01, d: 0.05, s: 0.7, r: 0.05 },
    gain: 0.1
  },
  originalNote: "Looping low-fi tension; not melodic earworm — leave headroom for SFX",
  status: "provisional"
}
```

### `music.menu`

```js
{
  id: "music.menu",
  kind: "music",
  trigger: "title / room select",
  polyphony: 1,
  recipe: {
    type: "drone",
    loop: true,
    bpm: 100,
    wave: "triangle",
    pattern: ["C3", "Eb3", "G3", "Bb3"],
    filter: { type: "lowpass", freq: 1800, Q: 0.4 },
    envelope: { a: 0.05, d: 0.1, s: 0.6, r: 0.2 },
    gain: 0.09
  },
  originalNote: "Quieter, spookier than combat; Halloween-adjacent without claiming verified melody",
  status: "provisional"
}
```

### `ui.game_over`

```js
{
  id: "ui.game_over",
  kind: "ui",
  trigger: "player death / run end",
  polyphony: 1,
  recipe: {
    type: "arpeggio",
    durationMs: 600,
    wave: "sawtooth",
    pattern: ["G3", "Eb3", "C3", "G2"],
    bpm: 90,
    filter: { type: "lowpass", freq: 1200, Q: 0.7 },
    envelope: { a: 0.01, d: 0.15, s: 0.2, r: 0.25 },
    gain: 0.22
  },
  originalNote: "Descending sting; stop combat bed on trigger",
  status: "provisional"
}
```

## Kimi handoff block

```
TITLE: boxhead (apps/boxhead)
AUDIO_OWNER: MAESTRO
STACK: PixiJS 8 + packages/arcade-core (STACK-LOCKED)
ASSET_POLICY: zero binary — WebAudio/oscillator only
MACHINE_LIST: /workspace/armor-games-audio/boxhead-2play-recipes.json
BIBLE: /workspace/armor-games-audio/boxhead-2play-sound-bible.md
IMPLEMENT:
  1. arcade-core: AudioBus (master, sfx, music, ui) + primitives (noise_burst, square_blip, saw_thud, fm_chirp, arpeggio, drone)
  2. Load recipe ids from boxhead-2play-recipes.json (or inline TS const mirrored from it)
  3. Wire cues to B-N1 events: shoot, hit, death, pickup, barrel, unlock, menu, game_over, combat bed
  4. Resume AudioContext on first user gesture; do not steal focus after
  5. Duck music ~200ms on barrel/grenade explode
PRIORITY_FOR_B-N1_SLICE: sfx.pistol_fire, sfx.zombie_death, sfx.ammo_pickup, sfx.player_hurt, sfx.player_death, ui.menu_confirm, ui.game_over, music.combat
DO_NOT:
  - Fetch/decode WAV/MP3/OGG
  - Depend on Ruffle/SWF audio for the native app
VERIFY_WITH: ARCADE (feel) · PROOF (acceptance) when clips/plans land
```

## Open gaps (need ARCADE / SWF)

1. Exact original cue list and whether music loops per mode.
2. Empty-gun click, zombie attack, wave-clear sting, distinct DM bed.
3. Timing offsets vs muzzle flash / death frames.
4. Whether 2Play embeds unique co-op/DM stingers.

## Next for MAESTRO

- Revise recipes after first ARCADE clip (a) waves 1–3 solo.
- Add `chicken-invaders` bible when recreate track is scheduled (synths load-bearing there).
- Optional portal chrome UI set (shared across MAGA titles).
- Keep recipes.json in sync when bible cues change.

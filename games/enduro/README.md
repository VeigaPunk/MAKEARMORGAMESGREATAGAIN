# Enduro — Classic & Remastered

The 1983 endurance race in two cabinets that share one race engine:

- `classic/` — cartridge-exact: a 160×192 frame in the NTSC 2600 palette,
  banded skies, single-pixel road edges, stepped car sprites, tail lights at
  night, the fog wall, the red instrument panel with the rolling odometer
  digit, and a TIA-style stepped engine tone.
- `remastered/` — the same race with modern graphics, weather, lighting,
  HUD and synthesized audio.
- `index.html` — the chooser. Styled with the MAGGA catalog system; it pulls
  the catalog's self-hosted font only when served under `/magga/`.

Published at `https://ds4cc.com/magga/enduro/`.

## Rules (from the 1983 manual)

- Pass 200 cars on day one and 300 on every later day. Each car you pass
  counts the panel down; each car that passes you counts it back up.
- Meet the quota and green flags replace the counter. Keep driving: the next
  day starts at daybreak. Miss the quota by daybreak and the race is over;
  the odometer and day are your score.
- The day runs morning → snow (icy, sluggish steering) → afternoon → dusk →
  night (tail lights only) → fog → night → dawn.
- Rivals get faster and spread wider every day. Finish five days for the
  trophy.

## Controls

| Key | Action |
| --- | --- |
| ← → | steer |
| ↑ or Space (also Z, X, Ctrl) | the red button: accelerate; releasing it holds your speed |
| ↓ | brake |
| Enter | start / race again (game reset) |
| P or Esc | pause |
| M | sound on/off |

Touch devices get on-screen pads; gamepads work too (stick/d-pad, A to
accelerate, Start to pause).

## Layout

| File | Role |
| --- | --- |
| `core.js` | the race simulation shared by both versions (fixed 60 Hz) |
| `shell.js` | input, loop, pause/mute, best record (`localStorage`) |
| `classic/` | 2600 renderer + TIA-style audio |
| `remastered/` | HD renderer + synthesized audio |
| `covers/` | real gameplay captures used by the chooser |

Everything is plain scripts: no build step, no dependencies, no network
requests. Serve the repository root (`python3 -m http.server 8123`) and open
`http://localhost:8123/games/enduro/`; the game pages also run from `file://`.

`window.__enduro.game` exposes the live simulation for automated checks.

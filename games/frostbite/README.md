# Frostbite — Classic & Remastered

The 1983 arctic igloo builder in two versions on one shared simulation.
Live at <https://ds4cc.com/magga/frostbite/>.

| Path | What it is |
| --- | --- |
| `core.js` | The simulation: floes, igloo, temperature, critters, bear, scoring, games 1–4. Fixed 60 Hz, seeded, no DOM. |
| `shell.js` | Keyboard, touch pads, swipes, gamepad, pause/mute, game select, best score, the loop. |
| `classic/` | Cartridge-exact: 160×192 frame in the NTSC 2600 palette, line-coloured sprites, HMOVE comb, TIA-style sound. |
| `remastered/` | Modern graphics: aurora nights, living ice, animated builder and critters, flying igloo blocks, frost, snow, synth audio. |
| `index.html` | The landing page that picks a cabinet. |
| `covers/` | Landing-page screenshots, captured from the shipped builds. |
| `tools/` | Verification only (not deployed). |

## Rules (from the 1983 handbook)

- Jump onto a white floe: it turns blue, adds an igloo block and scores 10 × level. When all four rows are blue they turn white again.
- Sixteen jumps finish the igloo (fifteen blocks and the door). Return to shore, stand under it and press ↑ to go in: 160 × level, plus 10 × level for every degree left.
- The temperature starts at 45° and falls; at 0° the builder freezes.
- Geese, king crabs and clams push you into the sea; fish are 200 points. From level 4 the polar grizzly prowls the shore and chases you off on contact (the far-left corner is out of his reach).
- The red button (Space / ⟲) reverses your floe for one block; free once the igloo is done.
- One builder plus three in reserve, a bonus builder every 5,000 points (nine at most). Four igloos per shift: day, then night. Games 1/2 start at level 1, games 3/4 (advanced) at level 5; 2 and 4 are two players taking turns.

## Controls

Arrows or WASD walk and jump (steer in mid-air too), Space / Z / X reverses the floe, Enter starts, G or 1–4 selects the game, P or Esc pauses, M mutes. On phones: ◀ ▶ walk, ▲ ▼ jump (or swipe the picture), ⟲ reverses. Gamepads work as well.

## Verify

```sh
node games/frostbite/tools/bot.mjs 12            # headless: a greedy bot builds and enters igloos on every level type
python3 -m http.server 8765 &                     # from the repository root
node games/frostbite/tools/verify.mjs http://127.0.0.1:8765/games/frostbite/ /tmp/frostbite-evidence
```

`verify.mjs` drives both versions in Chromium with real input: arrow keys and a key-event bot on desktop (it must build and enter an igloo), and touch pads and swipes on iPhone and Android profiles in portrait and landscape. Every page must show zero console errors and make zero off-site requests. Add `--covers games/frostbite/covers` to re-shoot the landing-page covers.

Last run: 90/90 checks passed (desktop, iPhone 13 and Pixel 7 portrait, iPhone 13 and Galaxy S9+ landscape, landing page).

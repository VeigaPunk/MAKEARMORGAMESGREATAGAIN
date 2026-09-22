# Clashbound — card art direction (L0 directive, 2026-09-22)

All card art is **authored directly** — SVG, canvas, or pixel data written into `tcg/prototype/art/`. No external image generator (L0 order 2026-09-22: grok-imagine and any remote generator are banned). Base each card's art on the **most iconic legendary cards from Hearthstone** — theme-matched, never copied.

## Method

1. Match each Clashbound card's theme to a fitting legendary's visual identity:
   - fire elemental / demon → **Ragnaros the Firelord**, **Lord Jaraxxus**
   - dragon → **Deathwing**, **Ysera**, **Alexstrasza**
   - undead / banshee → **Sylvanas Windrunner**
   - lich / death knight → **The Lich King**
   - old god / void → **C'Thun**
   - charge / rush attacker → **Leeroy Jenkins**
   - paladin / righteous champion → **Tirion Fordring**
   - spell-slinger / combo → **Archmage Antonidas**, **Edwin VanCleef**
2. In the asset, **evoke the legendary's iconic look** (silhouette, palette, pose, aura) — do NOT name the card or copy card text/stats.
3. Art is original: the legendary is a visual reference, not an IP source. No card text, stats, names, or Blizzard assets.

## Clashbound theme → legendary map (starter)

| Card | Theme | Legendary reference |
|---|---|---|
| The Main Event | arena champion, big finisher | Tirion Fordring (radiant champion) |
| Arena Champion | fast striker | Leeroy Jenkins (reckless charge) |
| Bone Colossus | giant undead wall | The Lich King (frozen throne mass) |
| Void Bookie | shadowy fixer | C'Thun (void tentacles, whispering) |
| Iron Barker | armored herald | Tirion Fordring (hammer + plate) |
| Wall of Teeth | gnashing wall | Deathwing (jagged maw) |
| Last Bell | doom bell | Ysera (dreamlike tolling) |
| Glass Lancer | fragile spear | Edwin VanCleef (hooded blade) |
| The Oddsmaker | fixer hero | Edwin VanCleef (shadowed dealer) |
| Mother Thorn | nature matriarch | Ysera (verdant dragon aspect) |
| Vex the Pitwright | pit engineer | Archmage Antonidas (arcane tinkerer) |

Extend the map as the pool grows. Every generated asset lands in `tcg/prototype/art/` (or the round's chosen path) with its prompt recorded alongside.

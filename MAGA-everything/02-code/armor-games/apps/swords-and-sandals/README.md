# Arena of Bonks — internal v1 slice (evocation of Swords & Sandals 2)

Canvas2D arena RPG with DOM chrome. Create a gladiator, spread skill points across Strength, Agility, Vitality, and Defense, defeat five scripted opponents, buy smithy/armory gear, and finish the arena ladder. Original-evocation naming throughout — no source marks (rights posture: ship-records/swords-and-sandals.md).

## Flow
Title → create → hub ⇄ arena/shop → defeat screen (Rise Again) / complete screen → hub → Save & Title. Esc backs out of shop/create/hub or opens settings from the arena; every state has an exit. Settings (music/SFX volume + mute) persist under the app-prefixed `audio` key and are reachable from the fixed SETTINGS button on title/hub and via Esc.

## Controls
Mouse-primary; touch buttons are at least 48px and anchored along the bottom. Attack, Special, Potion, and Taunt (pass turn) are always available as legal actions. No custom key bindings: controls are native DOM buttons/input — Tab moves focus, Enter/Space activates the focused button, and the name field takes normal typed input (verified 2026-09-23 with real key events, `verification/evidence/sr2-sas-run.log`).

## Constants — status after sr1/sr2
| System | Status |
|---|---|
| Damage / hit / crit formulas | App's simple stat-weighted roll, unchanged since the slice; sr2 only added telegraph art/audio |
| Ladder difficulty | **sr1-tuned baseline (D-54), PROVEN winnable** — full 5-bout clear with real input 2026-09-23 (sr2) |
| Rewards (25+10d gold, 22 XP) | sr1-tuned; unchanged in sr2 |
| Shop prices/gates (20/32/48, kit 100g) | sr1-tuned; unchanged in sr2 |
| Potion heal (16) | sr1-tuned; unchanged in sr2 |
| 5-opponent ladder | sr2: added "Praetor Pommel" (slot 4) for proto parity — spec floor is 3–5 scripted fights |
| Audio roster | sr2: arena march bed + full combat/UI cues via arcade-core Sfx |

Exact original tables, costs, save schema, and IP clearance remain unverified. INTERNAL-NO-PUBLIC; no public ship until written clearance.

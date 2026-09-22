# RT-03 — boxhead touch-mode probes (coarse pointer, 390×844 portrait)

**Build:** working tree post-`2e74d55` + uncommitted forge fixes (D-14/D-15/D-03/D-10/D-17)
**Method:** Chromium headless, `matchMedia('(pointer: coarse)')` patched via init script,
real CDP touch events (`page.touchscreen`), `?debug` → `window.__maga` state reads.
**Date:** 2026-09-22 (round 2)

## Results

| # | Probe | Verdict | Evidence |
|---|-------|---------|----------|
| RT-3a | Title → mode → room → playing via taps | PASS | state transitions `title→mode→room→playing` |
| RT-3b | Touch zones visible only during gameplay | PASS | `touch.view.visible=true` in play, false on menus/dead |
| RT-3c | **D-14** dead screen: field tap retries | PASS | `dead→playing` on tap at (320,150); `r02-touch-dead.png` |
| RT-3d | **D-14** dead screen: MENU chip tap exits | PASS | `dead→mode` on tap at chip (320,356); chip renders `r02-touch-dead.png` |
| RT-3e | **D-14** victory screen: chip + tap | PASS | forced wave-3 clear → `victory`, chip visible, chip tap → `mode`; `r02-victory.png` |
| RT-3f | **D-15** field tap does NOT fire | PASS | ammo 24→24, bullets 0 after field tap |
| RT-3g | **D-15** field tap does NOT move player | PASS | pos (320,200) unchanged after tap |
| RT-3h | FIRE zone hold fires | PASS | ammo 24→21, bullet spawned |
| RT-3i | Stick drag moves player | PASS | stick vec {1,0}, pos 320→399 (+79px in 0.6s ≈ 125px/s) |
| RT-3j | **D-10** retry resets crate timer | PASS | crateTimer 0.42→8.0 on retry (6.5 after 1.5s), 0 crates |
| RT-3k | **D-17** mute button clears wrapped badge | PASS | badgeH 55.2px, mute top 59px, gap 3.8px, no overlap |
| RT-3l | **D-03** grenade = lobbed AoE | PASS | mult=14 → `[GRENADES]` HUD, one shell killed 3 zombies, blast ring; `r02-grenade.png` |
| RT-3m | Grenade self-damage | **DEFECT (D-19)** | `detonate` at 30px → HP 100→75; shooter takes own AoE inside 48px |
| RT-3n | Banner cleared on menu transitions | **DEFECT (D-18)** | dead banner "OVERRUN ON WAVE 1…" overlaps SELECT MODE; `r02-desktop-dead.png` |

## Notes
- `pointerup` sets `tapped` on ANY release → desktop click on dead/victory screen
  retries (was SPACE-only). Harmless, arguably an improvement; noted not flagged.
- HUD shows `WAVE 4/3` during victory (wave counter incremented past MAX_WAVE) —
  cosmetic, folded into D-18's cosmetic family.
- Emulation caveat: `pointer: coarse` was patched via init script (CDP media
  emulation doesn't cover it); touch events were real CDP `Input.dispatchTouchEvent`.
  Physical-device confirmation still open for feel (stick size, reach).

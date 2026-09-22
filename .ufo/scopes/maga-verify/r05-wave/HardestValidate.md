## Verdict (PASS)

The hardest corpus validator completed successfully: 96/96 levels passed schema validation and autopilot clearability. The assignment claim of 32/32 is superseded by the observed corpus size: this checkout contains 96 levels. Manifest check also passed (`manifest.js: 96 levels`). No files were written by either command.

## Evidence

- Command: `node hardest/validate.mjs`
- Exit code: `0`
- Wall time: `36.784s` (measured with nanosecond timestamps; shell-reported elapsed was 36.87s)
- Every level reported `PASS ... clear`; levels 32 and 79 each had one death but still cleared.
- Manifest command: `node hardest/gen-manifest.mjs --check`
- Manifest output: `manifest.js: 96 levels`
- Manifest is not stale.

## Defects

None found by this gate. The two nonzero death counts are successful autopilot clears, not failures.

## Notes

Raw validator output verbatim:

```text
PASS 01-first-steps.js  clear t=3.6s deaths=0
PASS 02-loot-run.js  clear t=14.9s deaths=0
PASS 03-snake-corridor.js  clear t=11.1s deaths=0
PASS 04-coin-detour.js  clear t=5.3s deaths=0
PASS 05-checkpoint-gauntlet.js  clear t=7.1s deaths=0
PASS 06-crossfire.js  clear t=8.4s deaths=0
PASS 07-narrow-doors.js  clear t=5.9s deaths=0
PASS 08-ring-patrol.js  clear t=6.6s deaths=0
PASS 09-two-rooms.js  clear t=11.5s deaths=0
PASS 10-the-weave.js  clear t=5.4s deaths=0
PASS 11-switchback.js  clear t=8.7s deaths=0
PASS 12-pincer.js  clear t=8.7s deaths=0
PASS 13-coin-vault.js  clear t=7.7s deaths=0
PASS 14-fast-lanes.js  clear t=11.9s deaths=0
PASS 15-maze-lite.js  clear t=28.9s deaths=0
PASS 16-phase-shift.js  clear t=5.6s deaths=0
PASS 17-gauntlet-ii.js  clear t=11.2s deaths=0
PASS 18-diagonal.js  clear t=7.3s deaths=0
PASS 19-the-squeeze.js  clear t=23.7s deaths=0
PASS 20-halfway.js  clear t=19.1s deaths=0
PASS 21-dot-storm.js  clear t=7.8s deaths=0
PASS 22-labyrinth.js  clear t=12.8s deaths=0
PASS 23-tempo.js  clear t=5.9s deaths=0
PASS 24-no-room.js  clear t=23.3s deaths=0
PASS 25-long-haul.js  clear t=30.5s deaths=0
PASS 26-crossfire-ii.js  clear t=11.0s deaths=0
PASS 27-the-vault.js  clear t=17.2s deaths=0
PASS 28-marathon.js  clear t=25.7s deaths=0
PASS 29-panic.js  clear t=7.8s deaths=0
PASS 30-hardest.js  clear t=17.5s deaths=0
PASS 31-keymaster.js  clear t=12.8s deaths=0
PASS 32-shortcut.js  clear t=8.9s deaths=1
PASS 33-phase-portal.js  clear t=7.8s deaths=0
PASS 34-key-run.js  clear t=8.9s deaths=0
PASS 35-double-door.js  clear t=12.0s deaths=0
PASS 36-portal-maze.js  clear t=8.9s deaths=0
PASS 37-locked-vault.js  clear t=6.5s deaths=0
PASS 38-warp-lanes.js  clear t=6.5s deaths=0
PASS 39-key-gambit.js  clear t=8.5s deaths=0
PASS 40-halfway-ii.js  clear t=12.8s deaths=0
PASS 41-switchback-ii.js  clear t=6.2s deaths=0
PASS 42-door-cycle.js  clear t=12.1s deaths=0
PASS 43-portal-cross.js  clear t=7.9s deaths=0
PASS 44-key-hunt.js  clear t=10.1s deaths=0
PASS 45-twin-vaults.js  clear t=9.0s deaths=0
PASS 46-fast-lanes-ii.js  clear t=8.8s deaths=0
PASS 47-pad-chain.js  clear t=10.5s deaths=0
PASS 48-lockstep.js  clear t=9.7s deaths=0
PASS 49-squeeze-ii.js  clear t=9.9s deaths=0
PASS 50-exam-day.js  clear t=15.9s deaths=0
PASS 51-dot-storm-ii.js  clear t=8.5s deaths=0
PASS 52-portal-hell.js  clear t=6.0s deaths=0
PASS 53-keymaster-ii.js  clear t=14.9s deaths=0
PASS 54-warp-weave.js  clear t=6.3s deaths=0
PASS 55-vault-iii.js  clear t=21.6s deaths=0
PASS 56-no-room-ii.js  clear t=10.3s deaths=0
PASS 57-tempo-ii.js  clear t=10.4s deaths=0
PASS 58-panic-ii.js  clear t=7.8s deaths=0
PASS 59-labyrinth-ii.js  clear t=17.7s deaths=0
PASS 60-hardest-ii.js  clear t=16.5s deaths=0
PASS 61-inhuman.js  clear t=11.1s deaths=0
PASS 62-pad-roulette.js  clear t=11.5s deaths=0
PASS 63-key-largo.js  clear t=14.1s deaths=0
PASS 64-gauntlet-iii.js  clear t=14.0s deaths=0
PASS 65-portal-prison.js  clear t=7.2s deaths=0
PASS 66-lockdown.js  clear t=21.1s deaths=0
PASS 67-warp-storm.js  clear t=11.0s deaths=0
PASS 68-skeleton-key.js  clear t=11.5s deaths=0
PASS 69-crossfire-iii.js  clear t=8.0s deaths=0
PASS 70-seventy.js  clear t=12.0s deaths=0
PASS 71-dot-rain.js  clear t=11.8s deaths=0
PASS 72-teleport-trap.js  clear t=7.1s deaths=0
PASS 73-keyhole.js  clear t=13.3s deaths=0
PASS 74-phase-prison.js  clear t=10.1s deaths=0
PASS 75-portal-vault.js  clear t=17.7s deaths=0
PASS 76-marathon-ii.js  clear t=12.6s deaths=0
PASS 77-switchback-iii.js  clear t=9.1s deaths=0
PASS 78-door-slam.js  clear t=15.6s deaths=0
PASS 79-portal-panic.js  clear t=10.0s deaths=1
PASS 80-eighty.js  clear t=13.5s deaths=0
PASS 81-inhuman-ii.js  clear t=12.7s deaths=0
PASS 82-pad-maze.js  clear t=8.8s deaths=0
PASS 83-key-storm.js  clear t=12.1s deaths=0
PASS 84-warp-labyrinth.js  clear t=21.9s deaths=0
PASS 85-lockpick.js  clear t=12.8s deaths=0
PASS 86-crossfire-iv.js  clear t=9.7s deaths=0
PASS 87-portal-vault.js  clear t=11.9s deaths=0
PASS 88-squeeze-iii.js  clear t=13.5s deaths=0
PASS 89-dot-hell.js  clear t=8.3s deaths=0
PASS 90-ninety.js  clear t=15.8s deaths=0
PASS 91-tempo-iii.js  clear t=13.2s deaths=0
PASS 92-keymaster-iii.js  clear t=14.2s deaths=0
PASS 93-panic-iii.js  clear t=13.5s deaths=0
PASS 94-warp-hell.js  clear t=12.2s deaths=0
PASS 95-penultimate.js  clear t=14.4s deaths=0
PASS 96-worlds-hardest.js  clear t=18.1s deaths=0

96/96 levels pass
```

Manifest raw output:

```text
manifest.js: 96 levels
```

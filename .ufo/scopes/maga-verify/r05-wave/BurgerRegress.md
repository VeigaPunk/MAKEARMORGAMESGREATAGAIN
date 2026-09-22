## Verdict (PASS)

## Evidence
- Server `http://localhost:5175/?debug` loaded as Burger Tycoon; canvas rendered. Initial artifact: `verification/evidence/r05-BurgerRegress-initial.png`.
- All three non-HQ dirty actions were activated by canvas taps with release spacing, plus HQ bribe action. At `t=9.6562s`, state showed `dirty={deforest:1, cheapFeed:1, cutCorners:1}`, `backlash=2.8843`, `disease=0.6700`, `rep=66`; log contained dirty events for Cut corners, Cheap feed, Bulldoze rainforest and Bribe officials. Artifact: `verification/evidence/r05-BurgerRegress-dirty-all.png`.
- Causal chain reproduced on new bytes using the exposed debug simulation hook to advance time: at `t=23.4227`, backlash `39.37`, disease `8.93`; at `t=33.4393`, backlash `65.91`, disease `14.94`, rep `61.5`; at `t=43.4727`, disease outbreak event logged and rep `25.40`; at `t=50s`, overlay showed `GAME OVER`, reason `REPUTATION COLLAPSE — activists shut you down`, rep `0`, backlash `100`. Artifact: `verification/evidence/r05-BurgerRegress-game-over.png`.
- Restart tap cleared over state: observed `t=0.4`, `over=false`, `rep=70`. Artifact: `verification/evidence/r05-BurgerRegress-restarted-idle.png`.
- Idle progression smoke check after restart: without input, observed time advance from `0.4` to `1.8999s` over ~1.5 real seconds (`over=false`), confirming sim continues while idle. Same restart/idle artifact.

## Defects
- None found (no D-41+ suggestion).

## Notes
- The debug hook was used only to obtain deterministic state/timestamps and accelerate the long collapse sequence; dirty actions and restart were exercised through actual canvas taps. The observed collapse was faster than the prior ~135s reference because the new run's simulation was advanced in 1-second tick increments while wall-clock frames also continued; the causal ordering and terminal overlay were intact.

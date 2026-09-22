# Make Armor Games Great Again — EVERYTHING pack
**Idea 001 · 2026-09-22 America/Sao_Paulo · English only · INTERNAL-NO-PUBLIC**

## Contents

| Folder | What |
|--------|------|
| `01-design-docs/` | Full design pack: vault, concept specs (6 titles), FORGE stack lock + Boxhead tickets, research, ARCADE dossiers, MAESTRO audio, PROOF acceptance, superseded Ruffle history |
| `02-code/armor-games/` | Monorepo from AMDPORRADA (no node_modules): `apps/boxhead`, `packages/arcade-core`, `boxhead-2play-spike` (Ruffle reference), docs, proofs |

## Run on Omarchy (plazir27)

```bash
cd 02-code/armor-games
npm install
npm run dev:boxhead   # http://localhost:5173
```

Phone: open the same URL via your LAN IP.

Read first:
1. `01-design-docs/00-start-here/README.md`
2. `02-code/armor-games/README.md`
3. `01-design-docs/02-concept-specs/01-boxhead.md`
4. `01-design-docs/03-stack-and-tickets/001-boxhead-native-tickets.md`

Build order: Boxhead → Impossible → Burger Tycoon → CI recreate → S&S2 → Cluck Horizon.

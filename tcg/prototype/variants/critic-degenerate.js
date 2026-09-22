// Probe: collapse all minion attack values to zero, testing whether non-attacking
// boards can still win contests through the engine's contest resolution.
for (const c of globalThis.CB.cards.POOL) {
  if (c.type === "minion") c.atk = 0;
}

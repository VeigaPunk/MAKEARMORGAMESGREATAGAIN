/**
 * Palette tokens — native placeholder recipes §2 (B-N0 deliverable).
 * Shared chrome tokens + gameplay tokens; single source for entity/arena/HUD art.
 */

export const PAL = {
  // shared / chrome
  void: 0x0b0b0c,
  panel: 0x161618,
  panelEdge: 0x2a2a2e,
  ink: 0xe8e4dc,
  muted: 0x9a958a,
  accent: 0xc4f04d,
  accentDim: 0x6b8a2a,
  warn: 0xe85d3a,
  p1: 0x4da3ff,
  p2: 0xff7a4d,
  ok: 0x5ddc8a,
  // gameplay
  floor: 0x2c2a26,
  floorAlt: 0x26241f,
  wall: 0x3e3a34,
  wallEdge: 0x1a1814,
  zombie: 0x6b8f4e,
  zombieDark: 0x4a6b38,
  zombieEye: 0xc4f04d,
  devil: 0x8b2e2e,
  devilHorn: 0x5a1a1a,
  blood: 0xa61e2e,
  bloodDark: 0x6e121c,
  crate: 0x8b6914,
  crateBand: 0xc4a035,
  crateMark: 0xe8e4dc,
  barrel: 0x5a5e62,
  barrelBand: 0x3a3e42,
  barrelFuse: 0xe85d3a,
  barrelFuseOff: 0x6b3a2a,
  muzzle: 0xfff2a8,
  muzzleEdge: 0xe85d3a,
  bullet: 0xe8e4dc,
  bulletCore: 0xc4f04d,
  hudScore: 0xc4f04d,
  playerBody: 0xd8d2c8,
  playerHead: 0xe8e4dc,
  playerEye: 0x0b0b0c,
  // room tile-set variants (§4.20): A warehouse, B lab
  floorLab: 0x243028,
  floorLabAlt: 0x1c2620,
  wallLab: 0x355044,
} as const;

/** per-room tile set (§4.20) */
export interface TileSet {
  floor: number;
  floorAlt: number;
  wall: number;
}

export const TILESETS: Record<string, TileSet> = {
  'open-yard': { floor: PAL.floor, floorAlt: PAL.floorAlt, wall: PAL.wall },
  pillars: { floor: PAL.floorLab, floorAlt: PAL.floorLabAlt, wall: PAL.wallLab },
};

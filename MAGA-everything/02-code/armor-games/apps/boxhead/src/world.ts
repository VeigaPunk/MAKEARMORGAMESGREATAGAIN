import type { Rect } from './entities';

/**
 * ArenaRoom — room layouts (BH-1.2: two rooms minimum).
 * Obstacles are AABBs; bullets and bodies collide with them.
 * Layouts are placeholders until ARCADE verifies the original room roster.
 */

export interface ArenaRoom {
  id: string;
  name: string;
  obstacles: Rect[];
  /** barrel anchor points (subset used per run is fine) */
  barrels: { x: number; y: number }[];
  /** player 1 spawn */
  spawn: { x: number; y: number };
  /** player 2 spawn (BH-2 co-op/deathmatch) */
  spawn2: { x: number; y: number };
}

export const ROOMS: ArenaRoom[] = [
  {
    id: 'open-yard',
    name: 'OPEN YARD',
    obstacles: [
      { x: 200, y: 140, w: 60, h: 40 },
      { x: 380, y: 220, w: 60, h: 40 },
    ],
    barrels: [
      { x: 150, y: 300 },
      { x: 500, y: 110 },
    ],
    spawn: { x: 320, y: 200 },
    spawn2: { x: 220, y: 200 },
  },
  {
    id: 'pillars',
    name: 'PILLARS',
    obstacles: [
      { x: 140, y: 110, w: 36, h: 36 },
      { x: 464, y: 110, w: 36, h: 36 },
      { x: 140, y: 254, w: 36, h: 36 },
      { x: 464, y: 254, w: 36, h: 36 },
    ],
    barrels: [
      { x: 320, y: 110 },
      { x: 320, y: 300 },
    ],
    spawn: { x: 320, y: 200 },
    spawn2: { x: 320, y: 300 },
  },
];

/**
 * WaveDirector — escalating spawn tables.
 * Tuned 2026-09-23 (sr2): the original's exact spawn compositions are a
 * documented evidence gap (dossier §Evidence gaps), so these are declared
 * tuning targets, not captures. Iterated twice against a real-input CDP
 * player-bot (probe: 12/22/36 bankrupted the ammo economy and swarmed wave 2;
 * 5/9/14 from the placeholder build was trivially sparse — a ~1.75× step per
 * wave with runners from wave 2 lands the "chaotic but killable" arcade feel).
 * A 3-wave v1 slice sized for a ~3–6 minute run (concept: 5–20 min session).
 */
export interface WaveTable {
  count: number;
  speed: number;
  runners: number;
  spawnEvery: number;
}

export const WAVE_TABLES: WaveTable[] = [
  { count: 8, speed: 30, runners: 0, spawnEvery: 1.3 },
  { count: 14, speed: 36, runners: 2, spawnEvery: 1.1 },
  { count: 22, speed: 42, runners: 4, spawnEvery: 0.9 },
];

/**
 * ScoreSystem — streak multiplier + weapon ladder.
 * Tuned 2026-09-23 (sr2): thresholds 3/6/10 declare the dossier's
 * pistol → shotgun → uzi → grenades order (concept §Core loop step 5).
 * A 3-kill streak lands shotgun inside wave 1, uzi by wave 2, grenades by
 * wave 3; mult decays after 3.5 s without a kill so the ladder breathes.
 */
export type WeaponTier = 'pistol' | 'shotgun' | 'uzi' | 'grenades';

export class ScoreSystem {
  score = 0;
  mult = 1;
  private multTimer = 0;

  kill(): number {
    const gained = 100 * this.mult;
    this.score += gained;
    this.mult = Math.min(20, this.mult + 1);
    this.multTimer = 3.5;
    return gained;
  }

  playerHit(): void {
    this.mult = 1;
  }

  tick(dt: number): void {
    if (this.mult > 1) {
      this.multTimer -= dt;
      if (this.multTimer <= 0) {
        this.mult = Math.max(1, this.mult - 1);
        this.multTimer = 1.2;
      }
    }
  }

  /** weapon ladder — mult thresholds tuned sr2 (rationale above) */
  weaponForMult(): WeaponTier {
    if (this.mult >= 10) return 'grenades';
    if (this.mult >= 6) return 'uzi';
    if (this.mult >= 3) return 'shotgun';
    return 'pistol';
  }
}

/** per-weapon fire behavior; delays tuned sr2 to the original's feel:
 *  pistol = reliable mid-rate workhorse, shotgun = slow punchy cone,
 *  uzi = rapid ticks, grenades = slow lobbed AoE ordnance. */
export function fireDelay(w: WeaponTier): number {
  switch (w) {
    case 'uzi': return 0.14;
    case 'shotgun': return 0.5;
    case 'grenades': return 0.8;
    default: return 0.34;
  }
}

export function ammoPerShot(w: WeaponTier): number {
  return w === 'grenades' ? 2 : 1; // AoE ordnance costs 2 rounds per lob
}

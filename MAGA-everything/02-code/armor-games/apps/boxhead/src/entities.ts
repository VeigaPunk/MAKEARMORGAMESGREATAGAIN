import { Graphics } from 'pixi.js';
import { PAL } from './art/palette';

/**
 * Crateheads entities — procedural art per the native placeholder recipes
 * (001-boxhead-native-placeholder-recipes.md §4). Chunky boxes, no gloss.
 * All combat hit-rects and movement semantics are unchanged from the
 * mechanics-verified build (sr1); only the drawn shapes were replaced.
 */

export type Vec = { x: number; y: number };

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const OUTLINE = { width: 1, color: 0x000000 };

// --- Player ------------------------------------------------------------------
export class Player {
  g = new Graphics();
  pos: Vec;
  /** facing = last move direction; shots fire this way (keyboard-only combat) */
  facing: Vec = { x: 1, y: 0 };
  hp = 100;
  ammo = 24;
  invuln = 0;
  /** tuned sr2: outruns every walker, kites runners (1.8× base) — the
   *  original's "faster than the shamblers, slower than panic" feel. */
  speed = 125;

  private animT = 0;
  private frame = 0;

  constructor(x: number, y: number, private stripe: number = PAL.p1) {
    this.pos = { x, y };
    this.draw();
    this.g.x = x;
    this.g.y = y;
  }

  private draw(): void {
    const bob = this.frame; // walk frame: legs swap + 1px bob (§4.2)
    this.g.clear()
      // foot shadow (§4.1 step 1)
      .rect(-6, 6, 12, 2).fill({ color: 0x000000, alpha: 0.4 })
      // body 10×8
      .rect(-5, -2, 10, 8).fill(PAL.playerBody).stroke(OUTLINE)
      // accent stripe 2px left edge
      .rect(-5, -2, 2, 8).fill(this.stripe)
      // head 8×5
      .rect(-4, -6 - bob, 8, 5).fill(PAL.playerHead).stroke(OUTLINE)
      // eyes 2×2
      .rect(-3, -5 - bob, 2, 2).fill(PAL.playerEye)
      .rect(1, -5 - bob, 2, 2).fill(PAL.playerEye)
      // leg hints (§4.2 walk frames)
      .rect(-4, 5 + (this.frame === 0 ? 1 : 0), 2, 2).fill(PAL.playerBody).stroke(OUTLINE)
      .rect(2, 5 + (this.frame === 1 ? 1 : 0), 2, 2).fill(PAL.playerBody).stroke(OUTLINE);
  }

  move(axis: Vec, dt: number, bounds: { w: number; h: number }, solids: Rect[]): void {
    if (axis.x !== 0 || axis.y !== 0) {
      const d = Math.hypot(axis.x, axis.y) || 1;
      this.facing = { x: axis.x / d, y: axis.y / d };
      this.animT += dt;
      if (this.animT > 0.14) {
        this.animT = 0;
        this.frame = this.frame === 0 ? 1 : 0;
        this.draw();
      }
    } else if (this.frame !== 0) {
      this.frame = 0;
      this.draw();
    }
    // axis-separated moves so we slide along walls/obstacles
    this.tryMove(this.pos.x + axis.x * this.speed * dt, this.pos.y, bounds, solids);
    this.tryMove(this.pos.x, this.pos.y + axis.y * this.speed * dt, bounds, solids);
    this.g.x = this.pos.x;
    this.g.y = this.pos.y;
    this.g.rotation = Math.atan2(this.facing.y, this.facing.x) + Math.PI / 2;
  }

  private tryMove(nx: number, ny: number, bounds: { w: number; h: number }, solids: Rect[]): void {
    const r = { x: nx - 6, y: ny - 4, w: 12, h: 12 };
    if (nx < 16 || nx > bounds.w - 16 || ny < 16 || ny > bounds.h - 16) return;
    for (const s of solids) if (rectsOverlap(r, s)) return;
    this.pos.x = nx;
    this.pos.y = ny;
  }

  tickFlash(dt: number): void {
    if (this.invuln > 0) {
      this.invuln -= dt;
      this.g.alpha = Math.sin(this.invuln * 30) > 0 ? 1 : 0.4;
    } else {
      this.g.alpha = 1;
    }
  }
}

// --- Zombie ------------------------------------------------------------------
export class Zombie {
  g = new Graphics();
  hp: number;
  speed: number;
  runner: boolean;
  hitFlash = 0;
  dead = false;

  private animT = 0;
  private frame = 0;
  private skin: number;
  private stuckT = 0; // unstick wander after a fully blocked step
  private wanderDir = 1;

  constructor(public pos: Vec, speed: number, runner: boolean) {
    this.speed = runner ? speed * 1.8 : speed;
    // tuned sr2: every zombie pops in one hit (basic = one pistol round, the
    // original's feel — pressure comes from numbers and runner speed, not
    // bullet sponges; the weapon ladder differs by rate/spread/AoE instead).
    this.hp = 1;
    this.runner = runner;
    // identity per recipes: walkers alternate two green skins, runners read as
    // the horned special (§4.3 dark variant / §4.4 devil).
    this.skin = runner ? PAL.devil : (Math.random() < 0.5 ? PAL.zombie : PAL.zombieDark);
    this.draw();
    this.g.x = pos.x;
    this.g.y = pos.y;
  }

  private draw(): void {
    const bob = this.frame;
    const g = this.g.clear();
    g.rect(-6, 6, 12, 2).fill({ color: 0x000000, alpha: 0.4 })
      .rect(-5, -3 + bob, 10, 9).fill(this.skin).stroke(OUTLINE)
      .rect(-4, -6 + bob, 8, 5).fill(this.skin).stroke(OUTLINE)
      .rect(-3, -5 + bob, 2, 2).fill(this.runner ? PAL.warn : PAL.zombieEye)
      .rect(1, -5 + bob, 2, 2).fill(this.runner ? PAL.warn : PAL.zombieEye)
      .rect(-4, 5 + (this.frame === 0 ? 1 : 0), 2, 2).fill(this.skin).stroke(OUTLINE)
      .rect(2, 5 + (this.frame === 1 ? 1 : 0), 2, 2).fill(this.skin).stroke(OUTLINE);
    if (this.runner) {
      // horn nubs (§4.4)
      g.rect(-4, -8 + bob, 2, 2).fill(PAL.devilHorn)
        .rect(2, -8 + bob, 2, 2).fill(PAL.devilHorn);
    } else {
      // mouth slit (§4.3 step 5)
      g.rect(-2, -1 + bob, 4, 1).fill(PAL.void);
    }
  }

  chase(target: Vec, dt: number, bounds: { w: number; h: number }, solids: Rect[], crowd: Zombie[]): void {
    const d = dist(this.pos, target) || 1;
    const vx = ((target.x - this.pos.x) / d) * this.speed * dt;
    const vy = ((target.y - this.pos.y) / d) * this.speed * dt;
    const px = this.pos.x, py = this.pos.y;
    this.step(vx, 0, bounds, solids);
    this.step(0, vy, bounds, solids);

    // unstick: a zombie wedged straight against an obstacle (both axes
    // blocked, no crowd push) slides laterally for a beat instead of
    // freezing the wave
    if (Math.abs(this.pos.x - px) + Math.abs(this.pos.y - py) < 0.01 && d > 16) {
      if (this.stuckT <= 0) this.wanderDir = Math.random() < 0.5 ? -1 : 1;
      this.stuckT = 0.45;
    }
    if (this.stuckT > 0) {
      this.stuckT -= dt;
      this.step(this.wanderDir * this.speed * 0.8 * dt, 0, bounds, solids);
    }

    // gentle separation so the swarm doesn't collapse into one blob
    for (const o of crowd) {
      if (o === this || o.dead) continue;
      const sd = dist(this.pos, o.pos);
      if (sd > 0 && sd < 14) {
        this.pos.x += ((this.pos.x - o.pos.x) / sd) * 20 * dt;
        this.pos.y += ((this.pos.y - o.pos.y) / sd) * 20 * dt;
      }
    }

    this.animT += dt;
    const cycle = this.runner ? 0.11 : 0.16;
    if (this.animT > cycle) {
      this.animT = 0;
      this.frame = this.frame === 0 ? 1 : 0;
      this.draw(); // clear() keeps g.alpha — hit flash survives the redraw
    }
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      this.g.alpha = this.hitFlash > 0 ? 0.5 : 1;
    }
    this.g.x = this.pos.x;
    this.g.y = this.pos.y;
  }

  private step(dx: number, dy: number, bounds: { w: number; h: number }, solids: Rect[]): void {
    const nx = this.pos.x + dx;
    const ny = this.pos.y + dy;
    const r = { x: nx - 6, y: ny - 4, w: 12, h: 12 };
    if (nx < 16 || nx > bounds.w - 16 || ny < 16 || ny > bounds.h - 16) return;
    for (const s of solids) if (rectsOverlap(r, s)) return;
    this.pos.x = nx;
    this.pos.y = ny;
  }

  destroy(): void {
    this.dead = true;
    this.g.destroy();
  }
}

// --- Projectile ----------------------------------------------------------------
export class Projectile {
  g = new Graphics();
  life = 1.4;

  constructor(public pos: Vec, public vel: Vec, kind: 'bullet' | 'grenade' = 'bullet') {
    if (kind === 'grenade') {
      // lobbed shell — dark ordnance with a hot tip, reads as AoE not a tracer
      this.g.circle(0, 0, 4).fill(0x3a5f2a).stroke({ width: 1, color: 0x000000 })
        .rect(-1, -6, 2, 3).fill(PAL.barrelFuse);
    } else {
      // pellet with hot lime core (§4.5)
      this.g.rect(-2, -2, 4, 4).fill(PAL.bullet)
        .rect(-1, -1, 2, 2).fill(PAL.bulletCore);
    }
    this.g.x = pos.x;
    this.g.y = pos.y;
  }

  tick(dt: number): boolean {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life -= dt;
    this.g.x = this.pos.x;
    this.g.y = this.pos.y;
    this.g.rotation = Math.atan2(this.vel.y, this.vel.x);
    return this.life > 0;
  }

  hitSolid(solids: Rect[], bounds: { w: number; h: number }): boolean {
    if (this.pos.x < 12 || this.pos.x > bounds.w - 12 || this.pos.y < 12 || this.pos.y > bounds.h - 12) return true;
    const r = { x: this.pos.x - 2, y: this.pos.y - 1, w: 4, h: 2 };
    return solids.some((s) => rectsOverlap(r, s));
  }

  destroy(): void {
    this.g.destroy();
  }
}

// --- AmmoCrate -----------------------------------------------------------------
export class AmmoCrate {
  g = new Graphics();
  taken = false;

  constructor(public pos: Vec) {
    // wood crate, lid + center bands, ammo mark (§4.7)
    this.g.rect(-6, -5, 12, 10).fill(PAL.crate).stroke(OUTLINE)
      .rect(-6, -5, 12, 3).fill(PAL.crateBand)
      .rect(-1, -5, 2, 10).fill(PAL.crateBand)
      .rect(-3, -1, 6, 1).fill(PAL.crateMark)
      .rect(-1, 0, 2, 3).fill(PAL.crateMark)
      .rect(-6, 4, 12, 1).fill(PAL.wallEdge);
    this.g.x = pos.x;
    this.g.y = pos.y;
  }

  take(): void {
    this.taken = true;
    this.g.destroy();
  }
}

// --- Barrel --------------------------------------------------------------------
export class Barrel {
  g = new Graphics();
  exploded = false;
  fuse = -1; // chain-lighting delay
  /** who lit this barrel — DM AoE kill credit follows the lighter (sr2) */
  litBy = -1;

  constructor(public pos: Vec) {
    this.draw(0);
    this.g.x = pos.x;
    this.g.y = pos.y;
  }

  /** fuse stub blinks ~5×/s while idle; lit barrels flash hot (§4.8) */
  draw(t: number): void {
    const lit = this.fuse >= 0;
    const body = lit && Math.floor(t * 12) % 2 === 0 ? PAL.warn : PAL.barrel;
    const fuseCol = lit || Math.floor(t * 5) % 2 === 0 ? PAL.barrelFuse : PAL.barrelFuseOff;
    this.g.clear()
      .rect(-4, -5, 8, 11).fill(body).stroke(OUTLINE)
      .rect(-4, -2, 8, 1).fill(PAL.barrelBand)
      .rect(-4, 2, 8, 1).fill(PAL.barrelBand)
      .rect(-3, -6, 6, 2).fill(PAL.barrelBand).stroke(OUTLINE)
      .rect(-1, -8, 2, 2).fill(fuseCol);
  }

  explode(): void {
    this.exploded = true;
    this.g.destroy();
  }
}

/** expanding ring VFX for explosions */
export class BlastRing {
  g = new Graphics();
  t = 0;
  readonly dur = 0.35;

  constructor(pos: Vec, readonly radius: number) {
    this.g.x = pos.x;
    this.g.y = pos.y;
  }

  tick(dt: number): boolean {
    this.t += dt;
    const k = this.t / this.dur;
    this.g.clear()
      .circle(0, 0, Math.max(1, this.radius * 0.45 * (1 - k))).fill({ color: PAL.muzzle, alpha: Math.max(0, 1 - k * 1.6) })
      .circle(0, 0, Math.max(1, this.radius * k)).stroke({ width: 3, color: PAL.muzzleEdge, alpha: 1 - k });
    return k < 1;
  }

  destroy(): void {
    this.g.destroy();
  }
}

// --- Muzzle flash (§4.6) -------------------------------------------------------
export class MuzzleFlash {
  g = new Graphics();
  t = 0;
  readonly dur = 0.07;

  constructor(pos: Vec, angle: number) {
    this.g.x = pos.x;
    this.g.y = pos.y;
    this.g.rotation = angle;
  }

  tick(dt: number): boolean {
    this.t += dt;
    const small = this.t > this.dur / 2;
    this.g.clear();
    if (small) {
      this.g.rect(-1, -1, 2, 2).fill(PAL.muzzle)
        .rect(-3, -1, 6, 2).fill({ color: PAL.muzzleEdge, alpha: 0.8 })
        .rect(-1, -3, 2, 6).fill({ color: PAL.muzzleEdge, alpha: 0.8 });
    } else {
      this.g.rect(-2, -2, 4, 4).fill(PAL.muzzle)
        .rect(-4, -1, 8, 2).fill(PAL.muzzleEdge)
        .rect(-1, -4, 2, 8).fill(PAL.muzzleEdge);
    }
    return this.t < this.dur;
  }

  destroy(): void {
    this.g.destroy();
  }
}

// --- Hit / explosion specks (§4.10) ---------------------------------------------
export class Speck {
  g = new Graphics();

  constructor(
    public pos: Vec,
    public vel: Vec,
    private color: number,
    private size: number,
    public life: number,
  ) {
    this.g.rect(-size / 2, -size / 2, size, size).fill(color);
    this.g.x = pos.x;
    this.g.y = pos.y;
  }

  tick(dt: number): boolean {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.vel.x *= 1 - 5 * dt;
    this.vel.y *= 1 - 5 * dt;
    this.life -= dt;
    this.g.x = this.pos.x;
    this.g.y = this.pos.y;
    return this.life > 0;
  }

  destroy(): void {
    this.g.destroy();
  }
}

// --- shared ---------------------------------------------------------------------
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

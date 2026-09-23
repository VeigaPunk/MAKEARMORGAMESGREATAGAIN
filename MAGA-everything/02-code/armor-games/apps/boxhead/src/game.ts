import { Application, Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { Input, Sfx, load, save } from '@maga/arcade-core';
import {
  AmmoCrate, Barrel, BlastRing, MuzzleFlash, Player, Projectile, Speck, Zombie,
  clamp, dist, type Vec,
} from './entities';
import { ROOMS, WAVE_TABLES, ScoreSystem, ammoPerShot, fireDelay, type ArenaRoom } from './world';
import { PAL, TILESETS } from './art/palette';
import { playCue, startCombatMusic, startDmMusic, startMenuMusic } from './audio';
import { TouchControls } from './touch';

/**
 * Crateheads — local 2P arena survival (co-op + deathmatch) + touch layout C.
 * Combat tables tuned 2026-09-23 (sr2; rationale in ship-records/boxhead.md
 * and src/world.ts). Keyboard-only combat per concept spec: shots fire in
 * facing direction; mouse aim is optional sugar on desktop.
 */

const STAGE_W = 640;
const STAGE_H = 400; // provisional, UNVERIFIED until ARCADE measures the original
const MAX_WAVE = 3;
const CRATE_AMMO = 24; // sr2-tuned: a 3-wave slice shouldn't starve the economy
// (the original's pressure came from later content, not wave 1-3 ammo)
const CRATE_FIRST = 8; // seconds to first crate of a run (sr1: measured 8.3s)
const CRATE_EVERY = 10; // seconds between crate spawns once under the cap
const CRATE_CAP = 2;
const BARREL_RADIUS = 55;
const BARREL_PLAYER_DAMAGE = 25;
/** DM win rule, tuned sr2: first to 5 with the crate economy (16 rounds per
 *  crate, respawn refill 24) lands a ~2–4 minute match — short arcade run. */
const DM_TARGET_KILLS = 5;
const DM_RESPAWN = 1.4;
/** contact/bullet damage, tuned sr2: 100 hp / 10 per hit = ten hits per life;
 *  0.8 s contact invuln caps swarm DPS at ~12.5 hp/s — frantic but escapable. */
const HIT_DAMAGE = 10;

type GameState = 'title' | 'mode' | 'room' | 'playing' | 'paused' | 'dead' | 'victory';
type Mode = 'solo' | 'coop' | 'deathmatch';

/** per-player runtime state */
interface PlayerSlot {
  p: Player;
  cooldown: number;
  lastPointerAim: Vec | null;
  pointerAimAge: number;
  kills: number; // deathmatch scoring
  respawnTimer: number; // deathmatch
  alive: boolean;
}

export class Game {
  private world = new Container();
  private menu = new Container();
  private hud = new Container();

  private state: GameState = 'title';
  private mode: Mode = 'solo';
  private room: ArenaRoom = ROOMS[0];

  private slots: PlayerSlot[] = [];
  private zombies: Zombie[] = [];
  private bullets: Projectile[] = [];
  private crates: AmmoCrate[] = [];
  private barrels: Barrel[] = [];
  private blasts: BlastRing[] = [];

  private spawnQueue = 0;
  private spawnTimer = 0;
  private wave = 0;
  private waveBreak = 0;
  private crateTimer = 8;
  /** D-08 enabler: ?stress tops the field up to ~100 movers so the F3
   *  50–100-mover budget is measurable (wave tables cap at 14). Debug-only. */
  private stress = new URLSearchParams(location.search).has('stress');
  private high = 0;
  private scoreSys = new ScoreSystem();

  private hudText!: Text;
  private banner!: Text;
  private bannerBg!: Graphics;
  private hudG = new Graphics();
  private streakText!: Text;
  private streakFlash = 0;
  private bannerT = 0; // wave-banner auto-clear timer
  private lastWeapon = 'pistol';
  private lastMult = 1;
  private runnerCueDone = false;
  private animClock = 0;
  private flashes: MuzzleFlash[] = [];
  private specks: Speck[] = [];
  /** D-58: wall-clock grace after a hidden-tab resume — the first frames get
   *  a clamped dt and brief invulnerability so stacked movers cannot burst. */
  private resumeGraceUntil = 0;
  private menuChip = new Container();
  /** direct-authored art (public/art/*.svg); menus fall back to text-only. */
  private logoTex: Texture | null = null;

  constructor(
    private app: Application,
    private input: Input,
    private sfx: Sfx,
    private touch: TouchControls,
  ) {
    this.high = load('boxhead', 'highscore', 0);
    // BH-2.5 rebind stub: load saved keymap JSON (merged over mode defaults).
    // We deliberately do NOT persist the resolved defaults — saving mode-mixed
    // maps would pollute the other mode on the next boot (solo keeps arrows on
    // P1, versus gives them to P2). Save only genuine user rebinds here.
    const savedKeys = load<{ p1?: Record<string, never>; p2?: Record<string, never> } | null>('boxhead', 'keymaps', null);
    if (savedKeys) input.setKeymaps(savedKeys);
    app.stage.addChild(this.world);
    app.stage.addChild(this.menu);
    app.stage.addChild(this.hud);
    app.stage.addChild(touch.view);

    this.hudText = new Text({ text: '', style: { fill: 0xf5c542, fontSize: 12, fontFamily: 'monospace', lineHeight: 16 } });
    this.hudText.x = 14;
    this.hudText.y = 10;
    this.hud.addChild(this.hudG);
    this.hud.addChild(this.hudText);

    this.streakText = new Text({
      text: '',
      style: { fill: PAL.hudScore, fontSize: 13, fontFamily: 'monospace' },
    });
    this.streakText.anchor.set(0.5);
    this.streakText.x = STAGE_W - 40;
    this.streakText.y = 18;
    this.hud.addChild(this.streakText);

    this.banner = new Text({
      text: '',
      style: { fill: 0xffffff, fontSize: 17, fontFamily: 'monospace', align: 'center', lineHeight: 25 },
    });
    this.banner.anchor = 0.5;
    this.banner.x = STAGE_W / 2;
    this.banner.y = STAGE_H / 2 - 30;
    this.bannerBg = new Graphics();
    this.bannerBg.visible = false;
    this.hud.addChild(this.bannerBg);
    this.hud.addChild(this.banner);

    // touch MENU chip for end screens (D-14): phones have no M key.
    const chipBg = new Graphics()
      .roundRect(-64, -18, 128, 36, 6)
      .fill({ color: 0x1a1a24, alpha: 0.92 })
      .stroke({ width: 1, color: 0xf5c542 });
    const chipText = new Text({ text: 'MENU', style: { fill: 0xf5c542, fontSize: 14, fontFamily: 'monospace' } });
    chipText.anchor = 0.5;
    this.menuChip.addChild(chipBg, chipText);
    this.menuChip.x = STAGE_W / 2;
    this.menuChip.y = STAGE_H - 44;
    this.menuChip.visible = false;
    this.hud.addChild(this.menuChip);
    // authored art preload — decorative only; failures leave procedural look.
    Assets.load<Texture>('/art/crateheads-logo.svg')
      .then((t) => { this.logoTex = t; if (this.state === 'title') this.showTitle(); })
      .catch(() => { /* keep text-only title */ });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.resumeGraceUntil = performance.now() + 350;
    });
    this.showTitle();
  }

  get player(): Player { return this.slots[0].p; }

  // --- menus -----------------------------------------------------------------
  private clearMenu(): void {
    this.menu.removeChildren().forEach((c) => c.destroy());
  }

  private menuText(lines: string[], yStart = 120): void {
    lines.forEach((line, i) => {
      const t = new Text({
        text: line,
        style: {
          fill: i === 0 ? 0xf5c542 : 0xe8e8f0,
          fontSize: i === 0 ? 26 : 15,
          fontFamily: 'monospace',
          align: 'center',
        },
      });
      t.anchor = 0.5;
      t.x = STAGE_W / 2;
      t.y = yStart + i * 30;
      this.menu.addChild(t);
    });
  }

  /** banner text + backdrop bar (§4.15); bg hides when text is empty */
  private setBanner(text: string, accent = false): void {
    this.banner.text = text;
    this.bannerBg.visible = text.length > 0;
    if (text.length > 0) {
      const lines = text.split('\n').length;
      const w = Math.max(...text.split('\n').map((l) => l.length)) * 10.2 + 28;
      const h = lines * 25 + 18;
      this.bannerBg.clear()
        .rect(this.banner.x - w / 2, this.banner.y - h / 2, w, h)
        .fill({ color: PAL.void, alpha: 0.9 })
        .stroke({ width: 1, color: accent ? PAL.warn : PAL.panelEdge });
    }
  }

  private showTitle(): void {
    this.state = 'title';
    this.setBanner('');
    startMenuMusic(this.sfx);
    this.clearMenu();
    this.world.visible = false;
    this.hud.visible = false;
    if (this.logoTex) {
      const logo = new Sprite(this.logoTex);
      logo.anchor.set(0.5);
      logo.x = STAGE_W / 2;
      logo.y = 72;
      logo.scale.set(0.62);
      this.menu.addChild(logo);
    }
    this.menuText([
      'CRATEHEADS',
      'INTERNAL-NO-PUBLIC build · localhost only',
      '',
      'PRESS SPACE / ENTER / TAP TO CONTINUE',
    ], 150);
    playCue(this.sfx, 'uiConfirm');
  }

  private showModeSelect(): void {
    this.state = 'mode';
    // D-18/D-56: end-of-run banner + stale HUD + frozen world must not bleed
    // onto menus
    this.setBanner('');
    this.hud.visible = false;
    this.world.visible = false;
    this.clearMenu();
    this.menuText([
      'SELECT MODE',
      '1 — SOLO SURVIVAL (WASD or arrows + Space/J)',
      '2 — LOCAL CO-OP (P1 WASD+Space · P2 arrows+IJKL/numpad)',
      `3 — LOCAL DEATHMATCH (first to ${DM_TARGET_KILLS} kills)`,
      '',
      'Press 1 / 2 / 3 (or tap to pick Solo)',
    ], 96);
  }

  private showRoomSelect(): void {
    this.state = 'room';
    this.clearMenu();
    this.menuText([
      'SELECT ROOM',
      `1 — ${ROOMS[0].name}`,
      `2 — ${ROOMS[1].name}`,
      '',
      'Press 1 / 2 (or tap to pick room 1)',
    ], 120);
  }

  // --- run lifecycle ------------------------------------------------------------
  private startRun(roomIdx: number): void {
    this.room = ROOMS[clamp(roomIdx, 0, ROOMS.length - 1)];
    this.clearMenu();
    this.clearField();
    this.world.visible = true;
    this.hud.visible = true;

    // room geometry — procedural tile set (§4.9/§4.20): checker floor, walled
    // border with top highlight / bottom shadow, obstacle blocks
    this.world.removeChildren().forEach((c) => c.destroy());
    const tiles = TILESETS[this.room.id] ?? TILESETS['open-yard'];
    const arena = new Graphics();
    for (let ty = 10; ty < STAGE_H - 10; ty += 16) {
      for (let tx = 10; tx < STAGE_W - 10; tx += 16) {
        const alt = ((tx - 10) / 16 + (ty - 10) / 16) % 2 === 1;
        arena.rect(tx, ty, 16, 16).fill(alt ? tiles.floorAlt : tiles.floor);
      }
    }
    // border walls: 10px frame, highlight on top, shadow at bottom
    arena.rect(0, 0, STAGE_W, 10).fill(tiles.wall)
      .rect(0, STAGE_H - 10, STAGE_W, 10).fill(tiles.wall)
      .rect(0, 0, 10, STAGE_H).fill(tiles.wall)
      .rect(STAGE_W - 10, 0, 10, STAGE_H).fill(tiles.wall)
      .rect(0, 0, STAGE_W, 2).fill(PAL.panelEdge)
      .rect(0, STAGE_H - 2, STAGE_W, 2).fill(PAL.wallEdge)
      .rect(0, 0, 2, STAGE_H).fill(PAL.panelEdge)
      .rect(STAGE_W - 2, 0, 2, STAGE_H).fill(PAL.wallEdge);
    for (const o of this.room.obstacles) {
      arena.rect(o.x, o.y, o.w, o.h).fill(tiles.wall).stroke({ width: 1, color: PAL.wallEdge })
        .rect(o.x, o.y, o.w, 2).fill(PAL.panelEdge);
    }
    this.world.addChild(arena);

    const twoPlayer = this.mode !== 'solo';
    this.input.setMode(twoPlayer ? 'versus' : 'solo');

    this.slots = [{
      p: new Player(this.room.spawn.x, this.room.spawn.y, PAL.p1),
      cooldown: 0, lastPointerAim: null, pointerAimAge: 99, kills: 0, respawnTimer: 0, alive: true,
    }];
    this.world.addChild(this.slots[0].p.g);
    if (twoPlayer) {
      this.slots.push({
        p: new Player(this.room.spawn2.x, this.room.spawn2.y, PAL.p2),
        cooldown: 0, lastPointerAim: null, pointerAimAge: 99, kills: 0, respawnTimer: 0, alive: true,
      });
      this.world.addChild(this.slots[1].p.g);
    }

    for (const b of this.room.barrels) {
      const barrel = new Barrel({ ...b });
      this.barrels.push(barrel);
      this.world.addChild(barrel.g);
    }

    this.scoreSys = new ScoreSystem();
    this.wave = 0;
    this.crateTimer = CRATE_FIRST; // D-10: stale timer carried an instant crate into retries
    this.lastWeapon = 'pistol';
    this.runnerCueDone = false;
    this.state = 'playing';
    this.setBanner('');
    if (this.mode === 'deathmatch') startDmMusic(this.sfx);
    else startCombatMusic(this.sfx);
    if (this.mode === 'deathmatch') {
      this.spawnQueue = 0;
    } else {
      this.nextWave();
    }
  }

  private nextWave(): void {
    this.wave += 1;
    if (this.wave > MAX_WAVE) {
      this.state = 'victory';
      const newBest = this.persistHigh();
      this.sfx.stopMusic();
      this.setBanner(
        `WAVE ${MAX_WAVE} CLEARED (${this.mode === 'coop' ? 'CO-OP' : 'SOLO'})\n` +
        `SCORE ${this.scoreSys.score} · BEST ${this.high}\n` +
        `SPACE / tap — run it again · M — menu`,
      );
      playCue(this.sfx, newBest ? 'highScore' : 'victory');
      return;
    }
    const def = WAVE_TABLES[this.wave - 1];
    this.spawnQueue = def.count;
    this.spawnTimer = 0.5;
    this.waveBreak = 0;
    this.runnerCueDone = false;
    this.setBanner(`— WAVE ${this.wave} —`);
    this.bannerT = 1.6;
    playCue(this.sfx, 'waveStart');
  }

  private gameOver(): void {
    this.state = 'dead';
    const newBest = this.persistHigh();
    this.sfx.stopMusic();
    this.setBanner(
      `OVERRUN ON WAVE ${this.wave} (${this.room.name})\n` +
      `SCORE ${this.scoreSys.score} · BEST ${this.high}\n` +
      `SPACE / tap — retry · M — menu`,
      true,
    );
    playCue(this.sfx, 'gameOver');
    if (newBest) playCue(this.sfx, 'highScore');
  }

  private dmEnd(winner: number): void {
    this.state = 'victory';
    this.sfx.stopMusic();
    this.setBanner(
      `P${winner + 1} WINS THE DEATHMATCH ${this.slots[winner].kills}–${this.slots[1 - winner].kills}\n` +
      `SPACE / tap — rematch · M — menu`,
    );
    playCue(this.sfx, 'victory');
  }

  /** returns true when the run set a new best */
  private persistHigh(): boolean {
    if (this.scoreSys.score > this.high) {
      this.high = this.scoreSys.score;
      save('boxhead', 'highscore', this.high);
      return true;
    }
    return false;
  }

  private clearField(): void {
    for (const z of this.zombies) z.destroy();
    for (const b of this.bullets) b.destroy();
    for (const c of this.crates) c.g.destroy();
    for (const bl of this.blasts) bl.destroy();
    for (const f of this.flashes) f.destroy();
    for (const sp of this.specks) sp.destroy();
    for (const s of this.slots) s.p.g.destroy();
    this.zombies = [];
    this.bullets = [];
    this.crates = [];
    this.barrels = [];
    this.blasts = [];
    this.flashes = [];
    this.specks = [];
    this.slots = [];
    this.spawnQueue = 0;
  }

  // --- main tick -----------------------------------------------------------------
  tick(dt: number): void {
    // touch zones exist only during gameplay — menus/end screens get raw taps
    this.touch.setActive(this.state === 'playing');
    this.menuChip.visible = this.state === 'dead' || this.state === 'victory';
    if (this.state === 'playing' && this.input.wasPressed('pause')) {
      this.state = 'paused';
      // D-55: only M (action) exits pause — Enter is bound to 'fire'
      this.setBanner('PAUSED\nESC / P — resume · M — menu');
    } else if (this.state === 'paused') {
      if (this.input.wasPressed('pause')) {
        this.state = 'playing';
        this.setBanner(this.bannerT > 0 ? `— WAVE ${this.wave} —` : '');
      } else if (this.input.wasPressed('action') || this.input.pointer.tapped) {
        // Pause remains keyboard- and touch-accessible; tapping the banner quits.
        this.showModeSelect();
      }
    } else switch (this.state) {
      case 'title':
        if (this.input.wasPressed('fire') || this.input.wasPressed('action') || this.input.pointer.tapped) {
          playCue(this.sfx, 'uiConfirm');
          this.showModeSelect();
        }
        break;
      case 'mode':
        if (this.input.wasPressed('slot1') || this.input.wasPressed('fire') || this.input.pointer.tapped) {
          this.mode = 'solo';
          playCue(this.sfx, 'uiConfirm');
          this.showRoomSelect();
        } else if (this.input.wasPressed('slot2')) {
          this.mode = 'coop';
          playCue(this.sfx, 'playerJoin');
          this.showRoomSelect();
        } else if (this.input.wasPressed('slot3')) {
          this.mode = 'deathmatch';
          playCue(this.sfx, 'playerJoin');
          this.showRoomSelect();
        }
        break;
      case 'room':
        if (this.input.wasPressed('slot2')) {
          playCue(this.sfx, 'uiConfirm');
          this.startRun(1);
        } else if (this.input.wasPressed('slot1') || this.input.wasPressed('fire') || this.input.pointer.tapped) {
          playCue(this.sfx, 'uiConfirm');
          this.startRun(0);
        }
        break;
      case 'playing':
        this.tickPlaying(dt);
        break;
      case 'dead':
      case 'victory': {
        // D-14: touch has no keys — tap retries, MENU chip tap exits
        const p = this.input.pointer;
        const chipTap = p.tapped && Math.abs(p.x - STAGE_W / 2) < 64 && Math.abs(p.y - (STAGE_H - 44)) < 20;
        if (this.input.wasPressed('action') || chipTap) this.showModeSelect();
        else if (this.input.wasPressed('fire') || p.tapped) this.startRun(ROOMS.indexOf(this.room));
        break;
      }
    }
    this.touch.tick();
    this.input.endFrame();
  }

  private tickPlaying(dt: number): void {
    // D-16: cap gameplay time so tab-throttled frames cannot consume invulnerability
    // in one jump and let stacked movers deliver several hits at once.
    dt = Math.min(dt, 0.05);
    // D-58: after a hidden-tab resume, run the first 350 ms wall-clock on a
    // single fresh frame with contact grace — no catch-up burst.
    if (performance.now() < this.resumeGraceUntil) {
      dt = Math.min(dt, 1 / 60);
      for (const s of this.slots) if (s.alive) s.p.invuln = Math.max(s.p.invuln, 0.12);
    }
    this.updatePlayers(dt);
    if (this.mode !== 'deathmatch') {
      this.updateSpawning(dt);
      this.updateZombies(dt);
    }
    this.updateBullets(dt);
    this.updateProps(dt);
    this.scoreSys.tick(dt);

    // weapon-ladder unlock sting on tier upgrade
    const w = this.scoreSys.weaponForMult();
    if (w !== this.lastWeapon) {
      const order: Record<string, number> = { pistol: 0, shotgun: 1, uzi: 2, grenades: 3 };
      if (order[w] > order[this.lastWeapon]) playCue(this.sfx, 'unlock');
      this.lastWeapon = w;
    }
    // wave banner auto-clear
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      if (this.bannerT <= 0) this.setBanner('');
    }
    this.streakFlash = Math.max(0, this.streakFlash - dt);
    this.updateHud();

    if (this.mode === 'deathmatch') {
      // handled in bullet/player collisions (dmEnd)
    } else if (this.state === 'playing' && this.slots.every((s) => !s.alive)) {
      this.gameOver();
    }
  }


  // --- players -------------------------------------------------------------------
  private updatePlayers(dt: number): void {
    this.slots.forEach((slot, idx) => {
      if (!slot.alive) {
        if (this.mode === 'deathmatch') {
          slot.respawnTimer -= dt;
          if (slot.respawnTimer <= 0) this.respawn(idx);
        }
        return;
      }
      slot.p.tickFlash(dt);

      const coarse = matchMedia('(pointer: coarse)').matches;
      let axis: Vec;
      if (idx === 0) {
        // keyboard or virtual stick; on touch the stick owns movement — field
        // taps must not drag the player (D-15)
        axis = this.touch.stick ?? this.input.moveAxis(slot.p.pos.x, slot.p.pos.y, 30, !coarse);
      } else {
        axis = this.input.moveAxis2();
      }
      slot.p.move(axis, dt, { w: STAGE_W, h: STAGE_H }, this.room.obstacles);

      slot.cooldown -= dt;

      if (idx === 0) {
        // optional mouse aim on desktop (last pointer position wins for 2s)
        const p = this.input.pointer;
        slot.pointerAimAge += dt;
        if (!coarse && p.seen && (p.active || dist(p, slot.p.pos) > 24)) {
          slot.lastPointerAim = { x: p.x, y: p.y };
          slot.pointerAimAge = 0;
        }
        // D-15: on touch only the FIRE button shoots — any-canvas-touch firing
        // made the movement stick drain ammo
        const wantsFire = this.input.isDown('fire') || this.touch.fire;
        if (wantsFire && slot.cooldown <= 0) this.tryFire(slot, idx);
      } else {
        const fa = this.input.fireAxis2();
        if (fa) slot.p.facing = fa; // P2 aims with the shoot cluster itself
        if (fa && slot.cooldown <= 0) this.tryFire(slot, idx);
      }
    });
  }

  private respawn(idx: number): void {
    const slot = this.slots[idx];
    const s = idx === 0 ? this.room.spawn : this.room.spawn2;
    slot.p.pos = { ...s };
    slot.p.hp = 100;
    slot.p.invuln = 2;
    slot.p.ammo = 24;
    slot.alive = true;
    slot.p.g.visible = true;
    slot.p.g.x = s.x;
    slot.p.g.y = s.y;
  }

  private aimDir(slot: PlayerSlot): Vec {
    const coarse = matchMedia('(pointer: coarse)').matches;
    if (coarse) {
      // auto-aim nearest zombie; in deathmatch aim at the opponent
      const target = this.mode === 'deathmatch'
        ? (this.slots.find((s) => s !== slot && s.alive)?.p.pos ?? null)
        : this.nearestZombie(slot.p.pos)?.pos ?? null;
      if (target) {
        const d = dist(target, slot.p.pos) || 1;
        return { x: (target.x - slot.p.pos.x) / d, y: (target.y - slot.p.pos.y) / d };
      }
    }
    if (slot.lastPointerAim && slot.pointerAimAge < 2 && !coarse) {
      const d = dist(slot.lastPointerAim, slot.p.pos);
      if (d > 4) {
        return { x: (slot.lastPointerAim.x - slot.p.pos.x) / d, y: (slot.lastPointerAim.y - slot.p.pos.y) / d };
      }
    }
    return slot.p.facing;
  }

  private tryFire(slot: PlayerSlot, owner: number): void {
    const weapon = this.scoreSys.weaponForMult();
    const cost = ammoPerShot(weapon);
    if (slot.p.ammo < cost) {
      slot.cooldown = 0.25;
      playCue(this.sfx, 'empty');
      return;
    }
    slot.p.ammo -= cost;
    slot.cooldown = fireDelay(weapon);

    const dir = this.aimDir(slot);
    const from = { x: slot.p.pos.x + dir.x * 14, y: slot.p.pos.y + dir.y * 14 };
    const speed = 340;
    const shoot = (d: Vec, kind: 'bullet' | 'grenade' = 'bullet') => {
      const b = new Projectile({ ...from }, { x: d.x * speed, y: d.y * speed }, kind);
      (b as Projectile & { owner?: number }).owner = owner;
      if (kind === 'grenade') (b as Projectile & { grenade?: boolean }).grenade = true;
      this.bullets.push(b);
      this.world.addChild(b.g);
    };
    if (weapon === 'grenades') {
      shoot(dir, 'grenade'); // lobbed AoE shell — detonates on hit/wall/expiry (D-03)
    } else {
      shoot(dir);
      if (weapon === 'shotgun') {
        const a = Math.atan2(dir.y, dir.x);
        for (const off of [-0.24, 0.24]) {
          shoot({ x: Math.cos(a + off), y: Math.sin(a + off) });
        }
      }
    }
    // muzzle flash at the weapon tip (§4.6)
    const flash = new MuzzleFlash({ x: slot.p.pos.x + dir.x * 13, y: slot.p.pos.y + dir.y * 13 }, Math.atan2(dir.y, dir.x));
    this.flashes.push(flash);
    this.world.addChild(flash.g);
    playCue(this.sfx, weapon === 'shotgun' ? 'shotgun' : weapon === 'uzi' ? 'uzi' : weapon === 'grenades' ? 'grenadeThrow' : 'pistol');
  }

  // --- zombies -------------------------------------------------------------------
  private updateSpawning(dt: number): void {
    if (this.spawnQueue > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const def = WAVE_TABLES[this.wave - 1];
        const runner = def.runners > 0 && this.spawnQueue <= def.runners;
        if (runner && !this.runnerCueDone) {
          this.runnerCueDone = true; // one alarm per wave, not one per runner
          playCue(this.sfx, 'specialSpawn');
        }
        this.spawnZombie(runner, def.speed);
        this.spawnQueue -= 1;
        this.spawnTimer = def.spawnEvery;
      }
    } else if (this.zombies.length === 0) {
      this.waveBreak += dt;
      if (this.waveBreak > 2.5) this.nextWave();
    }
    // D-08: ?stress keeps ~100 movers on the field, including runner variants.
    if (this.stress && this.zombies.length < 100) this.spawnZombie(Math.random() < 0.35, 60 + Math.random() * 40);
  }

  private spawnZombie(runner: boolean, speed: number): void {
    const edge = Math.floor(Math.random() * 4);
    const pos: Vec =
      edge === 0 ? { x: 22, y: 22 + Math.random() * (STAGE_H - 44) } :
      edge === 1 ? { x: STAGE_W - 22, y: 22 + Math.random() * (STAGE_H - 44) } :
      edge === 2 ? { x: 22 + Math.random() * (STAGE_W - 44), y: 22 } :
                   { x: 22 + Math.random() * (STAGE_W - 44), y: STAGE_H - 22 };
    const z = new Zombie(pos, speed, runner);
    this.zombies.push(z);
    this.world.addChild(z.g);
  }

  private updateZombies(dt: number): void {
    for (const z of this.zombies) {
      // chase the nearest living player
      let target: Player | null = null;
      let bd = Infinity;
      for (const s of this.slots) {
        if (!s.alive) continue;
        const d = dist(z.pos, s.p.pos);
        if (d < bd) { bd = d; target = s.p; }
      }
      if (!target) continue;
      z.chase(target.pos, dt, { w: STAGE_W, h: STAGE_H }, this.room.obstacles, this.zombies);
      for (const s of this.slots) {
        if (!s.alive || s.p.invuln > 0) continue;
        if (dist(z.pos, s.p.pos) < 14) {
          s.p.hp -= HIT_DAMAGE;
          s.p.invuln = 0.8;
          this.scoreSys.playerHit();
          this.bloodAt(s.p.pos, 3);
          playCue(this.sfx, 'playerHurt');
          if (s.p.hp <= 0) {
            s.alive = false;
            s.p.g.visible = false;
            playCue(this.sfx, 'playerDeath');
          }
        }
      }
    }
  }

  // --- bullets -------------------------------------------------------------------
  private updateBullets(dt: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const owner = (b as Projectile & { owner?: number }).owner ?? 0;
      const alive = b.tick(dt) && !b.hitSolid(this.room.obstacles, { w: STAGE_W, h: STAGE_H });
      let dead = !alive;

      if (!dead) {
        for (const barrel of this.barrels) {
          if (!barrel.exploded && barrel.fuse < 0 && dist(barrel.pos, b.pos) < 10) {
            barrel.fuse = 0;
            barrel.litBy = owner;
            dead = true;
            break;
          }
        }
      }

      if (!dead) {
        for (let j = this.zombies.length - 1; j >= 0; j--) {
          const z = this.zombies[j];
          if (dist(z.pos, b.pos) < 11) {
            z.hp -= 1;
            dead = true;
            this.bloodAt(z.pos, 2);
            if (z.hp <= 0) {
              this.scoreSys.kill();
              playCue(this.sfx, 'zombieDeath');
              z.destroy();
              this.zombies.splice(j, 1);
            } else {
              z.hitFlash = 0.1;
              playCue(this.sfx, 'zombieHit');
            }
            break;
          }
        }
      }

      if (!dead) {
        // players hit by bullets only in deathmatch; a bullet never hits its
        // owner (it spawns 14px out, inside the 11px hitbox radius)
        if (this.mode === 'deathmatch') {
          for (let k = 0; k < this.slots.length; k++) {
            if (k === owner) continue;
            const slot = this.slots[k];
            if (!slot.alive || slot.p.invuln > 0) continue;
            if (dist(slot.p.pos, b.pos) < 11) {
              slot.p.hp -= HIT_DAMAGE;
              dead = true;
              this.bloodAt(slot.p.pos, 3);
              if (slot.p.hp <= 0) {
                slot.alive = false;
                slot.p.g.visible = false;
                slot.respawnTimer = DM_RESPAWN;
                const killer = this.slots[1 - k];
                killer.kills += 1;
                playCue(this.sfx, 'playerDeath');
                if (killer.kills >= DM_TARGET_KILLS) this.dmEnd(1 - k);
              } else {
                slot.p.invuln = 0.35;
                playCue(this.sfx, 'playerHurt');
              }
              break;
            }
          }
        }
      }

      if (dead) {
        // grenades detonate on ANY termination — hit, wall, or expiry (D-03)
        if ((b as Projectile & { grenade?: boolean }).grenade) this.detonate(b.pos, 60, (b as Projectile & { owner?: number }).owner);
        b.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }

  // --- props ---------------------------------------------------------------------
  private updateProps(dt: number): void {
    this.animClock += dt;
    // DD-77 / DD-18: spec has no DM pickups; crates are enabled in all modes
    // as the deadlock fix pending ARCADE ruling on the no-pickup divergence.
    // D-57: the timer only runs while under the cap, so a full field never
    // banks negative time into an instant post-pickup respawn.
    if (this.crates.length < CRATE_CAP) {
      this.crateTimer -= dt;
      if (this.crateTimer <= 0) {
        this.crateTimer = CRATE_EVERY;
        const pos = this.freeSpot();
        if (pos) {
          const c = new AmmoCrate(pos);
          this.crates.push(c);
          this.world.addChild(c.g);
        }
      }
    }
      for (let i = this.crates.length - 1; i >= 0; i--) {
        const c = this.crates[i];
        for (const s of this.slots) {
          if (!s.alive) continue;
          if (dist(c.pos, s.p.pos) < 15) {
            s.p.ammo += CRATE_AMMO;
            playCue(this.sfx, 'pickup');
            c.take();
            this.crates.splice(i, 1);
            break;
          }
        }
      }

    // barrels: idle fuse blink + lit fuses and chain reactions
    for (const barrel of this.barrels) {
      if (barrel.exploded) continue;
      if (barrel.fuse >= 0) {
        barrel.fuse += dt;
        barrel.draw(this.animClock);
        if (barrel.fuse > 0.12) this.explodeBarrel(barrel);
      } else if (Math.floor(this.animClock * 5) !== Math.floor((this.animClock - dt) * 5)) {
        barrel.draw(this.animClock);
      }
    }

    // blast / muzzle / speck VFX
    for (let i = this.blasts.length - 1; i >= 0; i--) {
      if (!this.blasts[i].tick(dt)) {
        this.blasts[i].destroy();
        this.blasts.splice(i, 1);
      }
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      if (!this.flashes[i].tick(dt)) {
        this.flashes[i].destroy();
        this.flashes.splice(i, 1);
      }
    }
    for (let i = this.specks.length - 1; i >= 0; i--) {
      if (!this.specks[i].tick(dt)) {
        this.specks[i].destroy();
        this.specks.splice(i, 1);
      }
    }
  }

  private explodeBarrel(barrel: Barrel): void {
    barrel.explode();
    this.detonate(barrel.pos, BARREL_RADIUS, barrel.litBy >= 0 ? barrel.litBy : undefined);
  }

  /** shared AoE: barrels and grenade shells (D-03). Kills zombies in radius,
   *  damages players in 0.8×radius, chains unlit barrels.
   *  D-19 ruling: a grenade's OWNER is exempt from its blast (fired weapon,
   *  not environmental hazard like barrels); partners still take friendly
   *  fire — era-consistent co-op chaos, recorded for ARCADE review.
   *  sr2: `credit` (grenade owner / barrel lighter) claims DM blast kills —
   *  chained barrels inherit the lighter's credit. */
  private detonate(pos: Vec, radius: number, credit?: number): void {
    const ring = new BlastRing(pos, radius);
    this.blasts.push(ring);
    this.world.addChild(ring.g);
    this.explosionAt(pos, radius);
    playCue(this.sfx, 'explode');

    let blastKills = 0;
    for (let j = this.zombies.length - 1; j >= 0; j--) {
      const z = this.zombies[j];
      if (dist(z.pos, pos) < radius) {
        this.scoreSys.kill();
        this.bloodAt(z.pos, 3);
        z.destroy();
        this.zombies.splice(j, 1);
        blastKills += 1;
      }
    }
    if (blastKills > 0) playCue(this.sfx, 'zombieDeath');
    for (const s of this.slots) {
      if (!s.alive || s.p.invuln > 0) continue;
      if (credit !== undefined && this.slots.indexOf(s) === credit) continue; // D-19: shooter exempt from own grenade
      if (dist(s.p.pos, pos) < radius * 0.8) {
        s.p.hp -= BARREL_PLAYER_DAMAGE;
        s.p.invuln = 0.8;
        if (this.mode !== 'deathmatch') this.scoreSys.playerHit();
        this.bloodAt(s.p.pos, 3);
        playCue(this.sfx, 'playerHurt');
        if (s.p.hp <= 0) {
          s.alive = false;
          s.p.g.visible = false;
          playCue(this.sfx, 'playerDeath');
          if (this.mode === 'deathmatch') {
            s.respawnTimer = DM_RESPAWN;
            if (credit !== undefined && credit !== this.slots.indexOf(s)) {
              const killer = this.slots[credit];
              killer.kills += 1;
              if (killer.kills >= DM_TARGET_KILLS) this.dmEnd(credit);
            }
          } else if (this.slots.every((slot) => !slot.alive)) {
            this.gameOver();
          }
        }
      }
    }
    // chain other barrels — credit propagates down the chain
    for (const other of this.barrels) {
      if (!other.exploded && other.fuse < 0 && dist(other.pos, pos) < radius) {
        other.fuse = 0;
        other.litBy = credit ?? -1;
      }
    }
  }

  /** blood / debris specks (§4.10) */
  private bloodAt(pos: Vec, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 60;
      const color = Math.random() < 0.7 ? PAL.blood : PAL.bloodDark;
      const s = new Speck(
        { x: pos.x, y: pos.y },
        { x: Math.cos(a) * sp, y: Math.sin(a) * sp },
        color, 2, 0.2 + Math.random() * 0.2,
      );
      this.specks.push(s);
      this.world.addChild(s.g);
    }
  }

  /** explosion debris — hot shrapnel ring (§4.16 frame B) */
  private explosionAt(pos: Vec, radius: number): void {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
      const sp = 60 + Math.random() * 70;
      const color = i % 3 === 0 ? PAL.muzzle : i % 3 === 1 ? PAL.warn : PAL.blood;
      const s = new Speck(
        { x: pos.x, y: pos.y },
        { x: Math.cos(a) * sp, y: Math.sin(a) * sp },
        color, 2, 0.25 + Math.random() * 0.2,
      );
      this.specks.push(s);
      this.world.addChild(s.g);
    }
  }

  private freeSpot(): Vec | null {
    for (let tries = 0; tries < 20; tries++) {
      const pos = { x: 40 + Math.random() * (STAGE_W - 80), y: 40 + Math.random() * (STAGE_H - 80) };
      if (this.slots.some((s) => dist(pos, s.p.pos) < 60)) continue;
      const r = { x: pos.x - 8, y: pos.y - 6, w: 16, h: 12 };
      if (this.room.obstacles.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y)) continue;
      return pos;
    }
    return null;
  }

  private nearestZombie(from: Vec): Zombie | null {
    let best: Zombie | null = null;
    let bd = Infinity;
    for (const z of this.zombies) {
      const d = dist(z.pos, from);
      if (d < bd) { bd = d; best = z; }
    }
    return best;
  }

  private updateHud(): void {
    const w = this.scoreSys.weaponForMult();
    if (this.mode === 'deathmatch') {
      this.hudText.text =
        `DEATHMATCH — P1 ${this.slots[0].kills} · P2 ${this.slots[1]?.kills ?? 0}  (target ${DM_TARGET_KILLS})\n` +
        `P1 HP ${Math.max(0, this.slots[0].p.hp)} AMMO ${this.slots[0].p.ammo}` +
        (this.slots[1] ? `   P2 HP ${Math.max(0, this.slots[1].p.hp)} AMMO ${this.slots[1].p.ammo}` : '');
      this.hudG.clear();
      this.streakText.text = '';
      return;
    }
    const second = this.slots[1];
    this.hudText.text =
      `WAVE ${this.wave}/${MAX_WAVE}  SCORE ${this.scoreSys.score}  x${this.scoreSys.mult}  ` +
      `HP ${Math.max(0, this.player.hp)}  AMMO ${this.player.ammo}  [${w.toUpperCase()}]  BEST ${this.high}` +
      (second ? `\nP2 HP ${Math.max(0, second.p.hp)}  AMMO ${second.p.ammo}` : '') +
      (this.spawnQueue === 0 && this.zombies.length === 0 ? '  — wave clear…' : '');

    // HP / ammo bar chips (§4.12)
    const hpPct = Math.max(0, this.player.hp) / 100;
    const hpCol = hpPct < 0.3 ? PAL.warn : PAL.ok;
    this.hudG.clear()
      .rect(14, 25, 64, 5).fill(PAL.panel).stroke({ width: 1, color: PAL.panelEdge })
      .rect(15, 26, 62 * hpPct, 3).fill(hpCol)
      .rect(14, 32, 64, 5).fill(PAL.panel).stroke({ width: 1, color: PAL.panelEdge })
      .rect(15, 33, 62 * Math.min(1, this.player.ammo / 48), 3).fill(PAL.accent);
    if (second) {
      const hp2 = Math.max(0, second.p.hp) / 100;
      this.hudG
        .rect(14, 39, 64, 5).fill(PAL.panel).stroke({ width: 1, color: PAL.panelEdge })
        .rect(15, 40, 62 * hp2, 3).fill(hp2 < 0.3 ? PAL.warn : PAL.p2);
    }

    // streak multiplier chip (§4.18) — flashes on increment
    if (this.scoreSys.mult > this.lastMult) this.streakFlash = 0.1;
    this.lastMult = this.scoreSys.mult;
    const label = `x${this.scoreSys.mult}`;
    this.streakText.text = label;
    const flash = this.streakFlash > 0 && Math.floor(this.streakFlash * 20) % 2 === 0;
    this.hudG
      .rect(this.streakText.x - 26, 8, 52, 20).fill(PAL.panel)
      .stroke({ width: 1, color: flash ? PAL.warn : PAL.panelEdge });
  }

  /** PROOF/debug snapshot — read-only state for automated acceptance (?debug) */
  snapshot(): Record<string, unknown> {
    return {
      state: this.state,
      mode: this.mode,
      room: this.room.id,
      wave: this.wave,
      maxWave: MAX_WAVE,
      score: this.scoreSys.score,
      mult: this.scoreSys.mult,
      weapon: this.scoreSys.weaponForMult(),
      high: this.high,
      players: this.slots.map((s) => ({
        hp: s.p.hp, ammo: s.p.ammo, alive: s.alive, kills: s.kills,
        x: s.p.pos.x, y: s.p.pos.y, invuln: s.p.invuln,
      })),
      zombies: this.zombies.length,
      zombieList: this.zombies.map((z) => ({ x: z.pos.x, y: z.pos.y, hp: z.hp, runner: z.runner })),
      bullets: this.bullets.length,
      crates: this.crates.map((c) => ({ x: c.pos.x, y: c.pos.y })),
      barrels: this.barrels.map((b) => ({ x: b.pos.x, y: b.pos.y, exploded: b.exploded, fuse: b.fuse })),
      spawnQueue: this.spawnQueue,
      obstacles: this.room.obstacles,
      banner: this.banner.text,
      hud: this.hudText.text,
      crateTimer: Math.round(this.crateTimer * 100) / 100,
      weaponTier: this.lastWeapon,
      dmTarget: DM_TARGET_KILLS,
      audio: { running: this.sfx.running, voices: this.sfx.voices, muted: this.sfx.muted },
    };
  }
}

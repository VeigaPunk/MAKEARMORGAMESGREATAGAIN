import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { BTN, STAGE_H, STAGE_W, type ShmupSim } from './sim';
import type { ShmupArt } from './art';

/**
 * PixiJS 8 renderer for the shared shmup skeleton — draws `ShmupSim` state
 * each frame. Port of the proto's canvas presentation (r1 sanctioned look):
 * baked sprite art + layered space backdrop (nebula gradient, drifting
 * planet, twinkling parallax stars), per-type enemy silhouettes, boss scale,
 * ship banking + engine flame, missile smoke, death shockwave. Palette and
 * sprites come from the content pack so replica and cluck read distinctly.
 * Hit-boxes and sim semantics are untouched — this layer is draw-only.
 */

const MAX_CHICKEN = 20, MAX_EGG = 48, MAX_BULLET = 48, MAX_MISSILE = 8, MAX_SMOKE = 160;

function pool<T>(n: number, make: () => T): T[] {
  return Array.from({ length: n }, make);
}

export class ShmupRenderer {
  readonly view = new Container();
  private field = new Graphics(); // stars, rings, bars, lines, particles
  private hud = new Container();
  private menuLayer = new Container();
  private btnLabels!: { ch1: Text; ch2: Text; start: Text };
  private bannerBg = new Sprite();
  private bannerText: Text;
  private hudText: Text;
  private hudRight: Text;
  private jokeText: Text;
  private hintText: Text;
  private bossNameText: Text;
  private titleTexts: Text[] = [];
  private lastHud = '';
  private lastRight = '';
  private lastJoke = '';
  private lastBanner = '';

  private bg: Sprite;
  private planet: Sprite;
  private chickens: Sprite[];
  private eggs: Sprite[];
  private bullets: Sprite[];
  private missiles: Sprite[];
  private smoke: Sprite[] = [];
  private shipSpr: Sprite[];
  private flameSpr: Sprite;
  private bossSpr: Sprite;
  private pickups: Sprite[];
  private titleBirdL: Sprite;
  private titleBirdR: Sprite;
  private titleShip: Sprite;
  private titleFlame: Sprite;
  private flash = new Graphics();
  private barrels = new Graphics();
  private drawT = 0;
  private titleT0 = -1;
  private lastBossKey = '';
  private smokeAcc = 0;
  private smokeIdx = 0;

  constructor(private sim: ShmupSim, private art: ShmupArt) {
    const pack = sim.pack;
    this.bg = new Sprite(art.bg);
    this.planet = new Sprite(art.planet);
    this.planet.alpha = 0.9;
    this.chickens = pool(MAX_CHICKEN, () => new Sprite(Texture.EMPTY));
    this.eggs = pool(MAX_EGG, () => new Sprite(art.egg));
    this.bullets = pool(MAX_BULLET, () => new Sprite(art.bullet));
    this.missiles = pool(MAX_MISSILE, () => new Sprite(art.missile));
    this.smoke = pool(MAX_SMOKE, () => { const s = new Sprite(art.puff); s.visible = false; return s; });
    this.shipSpr = art.ship.map((t) => new Sprite(t));
    this.flameSpr = new Sprite(art.hasFlame ? art.flame[0] : Texture.EMPTY);
    this.bossSpr = new Sprite(Texture.EMPTY);
    this.bossSpr.anchor.set(0.5, 0.55);
    this.pickups = pool(8, () => { const s = new Sprite(art.gift); s.anchor.set(0.5); s.visible = false; return s; });
    this.titleBirdL = new Sprite(art.bird[0][1]);
    this.titleBirdL.anchor.set(0.5);
    this.titleBirdR = new Sprite(art.bird[0][0]);
    this.titleBirdR.anchor.set(0.5);
    this.titleShip = new Sprite(art.ship[0]);
    this.titleShip.anchor.set(0.5);
    this.titleFlame = new Sprite(art.hasFlame ? art.flame[0] : Texture.EMPTY);
    this.titleFlame.anchor.set(0.5, 0);
    this.bannerBg = new Sprite(art.banner);

    for (const s of [...this.chickens, ...this.eggs, ...this.bullets, ...this.missiles, ...this.smoke, ...this.pickups]) {
      s.visible = false;
    }

    this.hudText = new Text({ text: '', style: { fill: 0xffffff, fontSize: 14, fontFamily: 'monospace', lineHeight: 20 } });
    this.hudText.x = 14; this.hudText.y = 8;
    this.hudRight = new Text({ text: '', style: { fill: 0xffffff, fontSize: 14, fontFamily: 'monospace', align: 'right', lineHeight: 20 } });
    this.hudRight.anchor.set(1, 0);
    this.hudRight.x = STAGE_W - 14; this.hudRight.y = 8;
    this.jokeText = new Text({ text: '', style: { fill: 0x8ce99a, fontSize: 14, fontFamily: 'monospace', align: 'center' } });
    this.jokeText.anchor.set(0.5, 0);
    this.jokeText.x = STAGE_W / 2; this.jokeText.y = STAGE_H - 120;
    this.hintText = new Text({
      text: 'ARROWS/WASD move · SPACE/Z/LMB fire · X/SHIFT/RMB missile · ESC pause',
      style: { fill: 0x888899, fontSize: 11, fontFamily: 'monospace' },
    });
    this.hintText.x = 14; this.hintText.y = STAGE_H - 18;
    this.bossNameText = new Text({ text: '', style: { fill: 0xffffff, fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold', align: 'center' } });
    this.bossNameText.anchor.set(0.5, 0);
    this.bossNameText.x = STAGE_W / 2; this.bossNameText.y = 30;
    this.hud.addChild(this.hudText, this.hudRight, this.jokeText, this.hintText, this.bossNameText);

    this.bannerText = new Text({
      text: '', style: { fill: 0xffffff, fontSize: 26, fontFamily: 'monospace', fontWeight: 'bold', align: 'center' },
    });
    this.bannerText.anchor.set(0.5, 0.5);
    this.bannerText.x = STAGE_W / 2; this.bannerText.y = STAGE_H / 2 + 9;

    this.view.addChild(
      this.bg, this.planet, this.field, ...this.smoke, ...this.pickups,
      ...this.chickens, this.bossSpr, ...this.eggs, ...this.bullets, ...this.missiles,
      this.flameSpr, ...this.shipSpr, this.barrels,
      this.flash, this.hud, this.menuLayer, this.bannerBg, this.bannerText,
    );
    this.buildTitle();
  }

  // ---------------- title ----------------
  private buildTitle(): void {
    const pack = this.sim.pack;
    const mk = (text: string, y: number, size: number, fill: number, bold = false): Text => {
      const t = new Text({
        text, style: { fill, fontSize: size, fontFamily: 'monospace', align: 'center', fontWeight: bold ? 'bold' : 'normal' },
      });
      t.anchor.set(0.5, 0.5); t.x = STAGE_W / 2; t.y = y;
      this.titleTexts.push(t); this.menuLayer.addChild(t);
      return t;
    };
    const titleText = mk(pack.title, 120, 44, pack.accent, true);
    // cluck pack: authored wordmark replaces the text title when the asset
    // resolves (served from the app's public/art/; replica keeps text).
    if (pack.id === 'cluck') {
      Assets.load<Texture>('/art/title-cluck-horizon.svg')
        .then((tex) => {
          const s = new Sprite(tex);
          s.anchor.set(0.5); s.x = STAGE_W / 2; s.y = 120;
          s.scale.set(Math.min(1, (STAGE_W - 80) / tex.width));
          this.menuLayer.addChild(s);
          titleText.visible = false;
        })
        .catch(() => { /* asset absent — text title stays */ });
    }
    mk(pack.sub, 152, 15, 0xaaaabb);
    mk('— INTERNAL build · not for public ship —', 178, 12, 0x666677);
    mk(`${pack.gift} cycles weapons · ${pack.food} feeds missiles`, 205, 12, 0x888899);
    mk(`hostiles: ${pack.enemyTypes.map((e) => e.name).join(' · ')}`, 224, 12, 0x888899);
    mk('ENTER start · 1/2 chapter · click works too', 460, 13, 0x888899);
    mk(this.sim.pack.id === 'replica'
      ? 'Chicken Storm = CI2-era formula evocation · INTERNAL-NO-PUBLIC'
      : 'original = Cluck Horizon IP · INTERNAL-NO-PUBLIC', 482, 12, 0x666677);
    // flanking pack birds
    this.titleBirdL.position.set(STAGE_W * 0.14, 116);
    this.titleBirdR.position.set(STAGE_W * 0.86, 116);
    this.titleBirdR.scale.x = -1;
    this.menuLayer.addChild(this.titleBirdL, this.titleBirdR, this.titleShip, this.titleFlame);
    // persistent button labels — drawTitleButtons only restyles them
    const mkBtn = (r: { x: number; y: number; w: number; h: number }): Text => {
      const t = new Text({ text: '', style: { fontSize: 15, fontFamily: 'monospace', fontWeight: 'bold' } });
      t.anchor.set(0.5, 0.5); t.x = r.x + r.w / 2; t.y = r.y + r.h / 2 + 1;
      this.menuLayer.addChild(t);
      return t;
    };
    this.btnLabels = { ch1: mkBtn(BTN.ch1), ch2: mkBtn(BTN.ch2), start: mkBtn(BTN.start) };
    this.menuLayer.visible = false;
  }

  private drawTitleButtons(): void {
    const g = this.field, sim = this.sim;
    const btn = (r: { x: number; y: number; w: number; h: number }, label: Text, text: string, on: boolean) => {
      g.roundRect(r.x, r.y, r.w, r.h, 4)
        .fill({ color: on ? sim.pack.accent : 0x222233 })
        .stroke({ width: 1, color: 0xffffff });
      label.text = text;
      label.style.fill = on ? 0x111111 : 0xddddee;
    };
    btn(BTN.ch1, this.btnLabels.ch1, 'CH 1', sim.titleSel === 1);
    btn(BTN.ch2, this.btnLabels.ch2, sim.unlocked >= 2 ? 'CH 2' : 'CH 2 LOCKED', sim.titleSel === 2 && sim.unlocked >= 2);
    btn(BTN.start, this.btnLabels.start, 'START', true);
  }

  // ---------------- frame ----------------
  /** full redraw — call once per rendered frame */
  draw(): void {
    const sim = this.sim, g = this.field, art = this.art, pack = sim.pack;
    const now = performance.now() / 1000;
    const dt = Math.min(0.1, now - (this.drawT || now));
    this.drawT = now;
    g.clear();
    this.barrels.clear();
    this.flash.clear();

    // backdrop: drifting planet low in frame (layered over the nebula bg)
    this.planet.position.set(
      STAGE_W * 0.82 - 120 + Math.sin(now * 0.045) * 12,
      STAGE_H - 178 + Math.sin(now * 0.03) * 4,
    );
    // stars: twinkle (sim owns scroll; the velocity spread layers parallax)
    for (const s of sim.stars) {
      g.rect(s.x, s.y, s.s, s.s).fill({ color: 0xffffff, alpha: (0.35 + s.s / 4) * (0.62 + 0.38 * Math.sin(now * 2.4 + s.x * 0.7)) });
    }

    if (sim.mode === 'title') {
      this.titleT0 = this.titleT0 < 0 ? now : this.titleT0;
      this.menuLayer.visible = true;
      this.drawTitleShip(now);
      this.drawTitleButtons();
      this.setBanner('');
      this.hudText.text = ''; this.hudRight.text = ''; this.jokeText.text = '';
      this.lastHud = this.lastRight = this.lastJoke = '';
      this.hideGameplay();
      return;
    }
    this.titleT0 = -1;
    this.menuLayer.visible = false;

    // pickups: icon + bob + glow ring
    for (let i = 0; i < this.pickups.length; i++) {
      const spr = this.pickups[i];
      if (i >= sim.pickups.length) { spr.visible = false; continue; }
      const p = sim.pickups[i];
      spr.visible = true;
      spr.texture = p.kind === 'gift' ? art.gift : art.food;
      const y = p.y + Math.sin(now * 4 + p.x * 0.05) * 3;
      spr.position.set(p.x, y);
      g.circle(p.x, y, 15 + Math.sin(now * 5 + p.x) * 2.5)
        .stroke({ width: 2, color: pack.accent, alpha: 0.45 + 0.3 * Math.sin(now * 6 + p.x) });
    }

    // chickens
    for (let i = 0; i < MAX_CHICKEN; i++) {
      const spr = this.chickens[i];
      if (i >= sim.chickens.length) { spr.visible = false; continue; }
      const c = sim.chickens[i];
      const variant = pack.enemyTypes[c.type];
      const flap = ((now * (c.enter ? 11 : 7)) | 0) % 2;
      spr.texture = art.bird[c.type][flap];
      spr.visible = true;
      spr.anchor.set(0.5, 0.54);
      if (art.bird[c.type][0] === art.bird[c.type][1]) {
        // authored SVG (no flap frames): gentle bob instead
        spr.rotation = Math.sin(now * 9 + i * 1.7) * 0.09;
        spr.scale.y = c.dive ? 1.12 : 1;
      } else {
        spr.rotation = 0;
        spr.scale.set(1);
      }
      const k = variant.build === 'heavy' ? 1.12 : variant.build === 'swept' ? 0.94 : 1;
      spr.scale.set(k, c.dive ? k * 1.12 : k);
      if (c.dive) {
        spr.rotation = Math.max(-0.45, Math.min(0.45, (c.dvx || 0) * 0.0012));
        for (const l of [-12, -6.5, 6.5, 12]) {
          g.moveTo(c.x + l, c.y - 22).lineTo(c.x + l, c.y - 33);
        }
        g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.45 });
      }
      spr.position.set(c.x, c.y);
    }

    // boss
    if (sim.boss) {
      const b = sim.boss;
      const mad = b.hp < b.max * 0.35;
      const key = `${b.type}:${mad}`;
      if (key !== this.lastBossKey) {
        this.lastBossKey = key;
        this.bossSpr.texture = mad ? art.bossMad[b.type] : art.boss[b.type];
        this.bossNameText.text = pack.bosses[b.type].name;
        this.bossNameText.style.fill = pack.accent;
      }
      // authored SVGs are smaller than the baked boss canvases — normalize
      const baseW = this.bossSpr.texture.width;
      const scl = baseW <= 130 ? 1.6 : 1;
      this.bossSpr.scale.set(scl);
      this.bossSpr.tint = mad && baseW <= 130 ? 0xff7a5c : 0xffffff;
      this.bossSpr.visible = true;
      this.bossSpr.position.set(b.x, b.y + Math.sin(b.t * 2.2) * 5);
      if (b.warn > 0) {
        g.circle(b.x, b.y, 74 + Math.sin(b.t * 30) * 6).stroke({ width: 3, color: pack.accent, alpha: 0.85 });
        g.circle(b.x, b.y, 64 + Math.sin(b.t * 30) * 6).stroke({ width: 1.5, color: 0xffffff, alpha: 0.35 });
      }
      // framed segmented hp gauge
      const bx = STAGE_W / 2 - 160, frac = Math.max(0, b.hp) / b.max;
      g.roundRect(bx - 4, 10, 328, 18, 5).fill({ color: 0x000000, alpha: 0.6 });
      const seg = 20, sw = 320 / seg;
      for (let i = 0; i < seg; i++) {
        g.rect(bx + i * sw + 1, 14, sw - 2, 10).fill({
          color: frac * seg > i ? (mad ? pack.accent : pack.accent) : 0xffffff,
          alpha: frac * seg > i ? (mad ? 0.7 + 0.3 * Math.sin(now * 10) : 1) : 0.09,
        });
      }
      g.roundRect(bx - 4, 10, 328, 18, 5).stroke({ width: 1.5, color: 0xffffff });
    } else {
      this.bossSpr.visible = false;
      this.lastBossKey = '';
      if (this.bossNameText.text) this.bossNameText.text = '';
    }

    // eggs: specular ovals with wobble
    for (let i = 0; i < MAX_EGG; i++) {
      const spr = this.eggs[i];
      if (i >= sim.eggs.length) { spr.visible = false; continue; }
      const e = sim.eggs[i];
      spr.visible = true;
      spr.anchor.set(0.5);
      spr.position.set(e.x, e.y);
      spr.rotation = Math.sin(now * 7 + e.x * 0.13 + e.y * 0.02) * 0.18;
    }

    // bullets: glowing capsules tilted along velocity
    for (let i = 0; i < MAX_BULLET; i++) {
      const spr = this.bullets[i];
      if (i >= sim.bullets.length) { spr.visible = false; continue; }
      const b = sim.bullets[i];
      spr.visible = true;
      spr.anchor.set(0.5);
      spr.position.set(b.x, b.y);
      spr.rotation = Math.atan2(b.vy, b.vx || 0) + Math.PI / 2;
    }

    // missile smoke trail (draw-only pool)
    this.smokeAcc += dt * 55 * sim.missiles.length;
    while (this.smokeAcc >= 1) {
      this.smokeAcc -= 1;
      if (sim.missiles.length) {
        const m = sim.missiles[this.smokeIdx++ % sim.missiles.length];
        const slot = this.smoke.find((s) => !s.visible);
        if (slot) {
          slot.visible = true;
          slot.alpha = 0.4;
          slot.position.set(m.x + (Math.random() - 0.5) * 5, m.y + 18);
          slot.scale.set(0.25);
          slot.rotation = Math.random() * Math.PI;
        }
      }
    }
    for (const s of this.smoke) {
      if (!s.visible) continue;
      s.position.y += 34 * dt;
      s.scale.set(Math.min(2.4, s.scale.x + 1.6 * dt));
      s.alpha -= 0.8 * dt;
      if (s.alpha <= 0) s.visible = false;
    }

    // missiles: finned rockets
    for (let i = 0; i < MAX_MISSILE; i++) {
      const spr = this.missiles[i];
      if (i >= sim.missiles.length) { spr.visible = false; continue; }
      const m = sim.missiles[i];
      spr.visible = true;
      spr.anchor.set(0.5);
      spr.position.set(m.x, m.y - 4);
      spr.rotation = 0;
    }

    // ship: bank into motion + engine flame (invuln blink gating)
    if (sim.ship.alive && (sim.ship.invuln <= 0 || ((sim.waveT * 16) | 0) % 2 === 0)) {
      const s = sim.ship;
      const bank = Math.max(-0.16, Math.min(0.16, s.vx / 400 * 0.16));
      const lv = Math.min(sim.weaponLv, this.shipSpr.length - 1);
      const spr = this.shipSpr[lv];
      for (const other of this.shipSpr) other.visible = other === spr;
      spr.visible = true;
      spr.anchor.set(0.5, 0.54);
      const scl = art.ship[0].width <= 40 ? 1.25 : 1; // authored SVG ships normalized
      spr.scale.set(scl);
      spr.rotation = bank;
      spr.position.set(s.x, s.y);
      if (art.hasFlame) {
        this.flameSpr.visible = true;
        this.flameSpr.texture = art.flame[(now * 24 | 0) % 3];
        this.flameSpr.anchor.set(0.5, 0);
        this.flameSpr.scale.set(scl, scl * (1 + Math.sin(now * 31) * 0.15));
        this.flameSpr.rotation = bank;
        this.flameSpr.position.set(s.x - Math.sin(bank) * 12, s.y + 13 * scl);
      } else this.flameSpr.visible = false;
      // authored-SVG ship: weapon-level muzzle barrels over the sprite
      if (this.shipSpr.length === 1) {
        const barrel = (dx: number, dy: number, l: number) => {
          this.barrels
            .rect(s.x + dx - 1.7 - Math.sin(bank) * dy, s.y + dy - l, 3.4, l + 3.5)
            .fill(0x21262b)
            .rect(s.x + dx - 1.7 - Math.sin(bank) * dy, s.y + dy - l, 3.4, 1.7)
            .fill(pack.accent);
        };
        if (sim.weaponLv === 0) barrel(0, -20, 5);
        else if (sim.weaponLv === 1) { barrel(-10, -2, 6); barrel(10, -2, 6); }
        else { barrel(0, -20, 5); barrel(-12, 1, 6); barrel(12, 1, 6); }
      }
    } else {
      for (const other of this.shipSpr) other.visible = false;
      this.flameSpr.visible = false;
      // ship-death shockwave ring + white flash (draw-only, keyed to deadT)
      if (sim.mode === 'play' && !sim.ship.alive) {
        const rt = sim.deadT / 0.45;
        if (rt < 1) {
          g.circle(sim.ship.x, sim.ship.y, 12 + rt * 95).stroke({ width: 5 * (1 - rt) + 1, color: 0xffffff, alpha: (1 - rt) * 0.9 });
          g.circle(sim.ship.x, sim.ship.y, 8 + rt * 70).stroke({ width: 2, color: pack.accent, alpha: (1 - rt) * 0.5 });
        }
        if (sim.deadT < 0.035) this.flash.rect(0, 0, STAGE_W, STAGE_H).fill({ color: 0xffffff, alpha: 0.55 * (1 - sim.deadT / 0.035) });
      }
    }

    // particles: tagged shapes (feather slivers / ship debris / sparks)
    for (const p of sim.parts) {
      const a = Math.max(0, p.life * 2);
      if (p.sh === 'feather') {
        g.ellipse(p.x, p.y, p.s * 1.15, p.s * 0.38).fill({ color: p.col, alpha: a });
      } else if (p.sh === 'debris') {
        g.rect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s).fill({ color: p.col, alpha: a });
        g.rect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s * 0.35).fill({ color: 0xffffff, alpha: a * 0.45 });
      } else {
        g.rect(p.x, p.y, p.s, p.s).fill({ color: p.col, alpha: a });
      }
    }

    // HUD (Text objects update only on change)
    const hud = `SCORE ${sim.score}\nLIVES ${'♥'.repeat(Math.max(0, sim.lives))}\n${pack.weapons[sim.weaponLv]}\nMISSILES ${sim.missileN}`;
    if (hud !== this.lastHud) { this.hudText.text = hud; this.lastHud = hud; }
    const right = `CH ${sim.chapter} · ${sim.boss ? `BOSS ${pack.bosses[sim.boss.type].name}` : `WAVE ${sim.waveShown}/${sim.wavesTotal}`}\n[${pack.id.toUpperCase()}]`;
    if (right !== this.lastRight) { this.hudRight.text = right; this.lastRight = right; }
    const joke = sim.jokeT > 0 && pack.jokes ? (pack.jokes[sim.chapter - 1] ?? '') : '';
    if (joke !== this.lastJoke) { this.jokeText.text = joke; this.lastJoke = joke; }

    // banners
    let banner = '';
    if (sim.paused) banner = 'PAUSED — ESC resume · R quit to title';
    else if (sim.mode === 'clear') banner = `CHAPTER ${sim.chapter} CLEAR — next: chapter ${sim.chapter + 1}`;
    else if (sim.mode === 'gameover') banner = 'GAME OVER — R / click for title';
    else if (sim.mode === 'win') banner = 'ALL CHAPTERS CLEAR — R / click for title';
    this.setBanner(banner);
  }

  private drawTitleShip(now: number): void {
    const t = now - this.titleT0;
    const fp = Math.min(1, t / 1.5), ease = 1 - Math.pow(1 - fp, 3);
    const sx = -70 + (STAGE_W / 2 + 70) * ease, sy = 300 - 68 * ease + Math.sin(now * 2.2) * 6 * fp;
    this.titleShip.visible = true;
    this.titleShip.position.set(sx, sy);
    this.titleShip.rotation = (1 - ease) * 0.55 + Math.sin(now * 1.8) * 0.06 * fp;
    if (this.art.hasFlame) {
      this.titleFlame.visible = true;
      this.titleFlame.texture = this.art.flame[(now * 24 | 0) % 3];
      this.titleFlame.scale.set(1, 1 + Math.sin(now * 31) * 0.15);
      this.titleFlame.position.set(sx - 10, sy + 13);
    } else this.titleFlame.visible = false;
  }

  private hideGameplay(): void {
    for (const s of [...this.chickens, ...this.eggs, ...this.bullets, ...this.missiles, ...this.smoke, ...this.pickups]) s.visible = false;
    for (const s of this.shipSpr) s.visible = false;
    this.flameSpr.visible = false;
    this.bossSpr.visible = false;
    this.titleShip.visible = false;
    this.titleFlame.visible = false;
  }

  private setBanner(t: string): void {
    if (t === this.lastBanner) return;
    this.lastBanner = t;
    if (t) {
      this.bannerBg.visible = true;
      this.bannerBg.texture = this.art.banner;
      this.bannerBg.position.set(0, STAGE_H / 2 - 48);
    } else this.bannerBg.visible = false;
    this.bannerText.text = t;
  }
}

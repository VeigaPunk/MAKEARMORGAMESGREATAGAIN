import { Assets, Texture } from 'pixi.js';
import type { ContentPack, EnemyType } from './packs';
import { STAGE_H, STAGE_W } from './sim';

/**
 * Baked art for the shmup skeleton — hand-authored canvas sprites, ported
 * from the proto's presentation layer (prototypes/chicken-invaders.html,
 * the sanctioned look: layered space backdrop, per-type bird silhouettes,
 * ship/boss scale reads). The cluck pack prefers its authored SVGs
 * (public/art/, loaded through Pixi Assets like the title wordmark) and
 * falls back to the same baked recipes if an asset is absent.
 * Zero binary assets are introduced: everything is drawn here in code.
 */

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const shade = (n: number, amt: number): string => { // amt in [-1,1]: toward black / toward white
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  const r = Math.round(((n >> 16) & 255) + (t - ((n >> 16) & 255)) * p);
  const g = Math.round(((n >> 8) & 255) + (t - ((n >> 8) & 255)) * p);
  const b = Math.round((n & 255) + (t - (n & 255)) * p);
  return `rgb(${r},${g},${b})`;
};
const rgba = (n: number, a: number): string => {
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

type Ctx = CanvasRenderingContext2D;
function mkTex(w: number, h: number, fn: (g: Ctx, w: number, h: number) => void): Texture {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  fn(cv.getContext('2d')!, w, h);
  return Texture.from(cv);
}

function rrectG(g: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------------- backdrop ----------------
function bgArt(pack: ContentPack): (g: Ctx, w: number, h: number) => void {
  return (g, w, h) => {
    const lg = g.createLinearGradient(0, 0, 0, h);
    lg.addColorStop(0, hex(pack.bg1)); lg.addColorStop(1, hex(pack.bg0));
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    const blob = (x: number, y: number, r: number, col: number, a: number) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rgba(col, a)); rg.addColorStop(1, rgba(col, 0));
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    blob(w * 0.2, h * 0.24, 290, pack.neb1, 0.5);
    blob(w * 0.82, h * 0.16, 230, pack.neb2, 0.42);
    blob(w * 0.58, h * 0.78, 330, pack.neb1, 0.28);
    blob(w * 0.06, h * 0.86, 210, pack.neb2, 0.24);
    g.save(); g.translate(w / 2, h * 0.38); g.rotate(-0.28);
    const gb = g.createLinearGradient(0, -60, 0, 60);
    gb.addColorStop(0, 'rgba(255,255,255,0)'); gb.addColorStop(0.5, 'rgba(255,255,255,.045)'); gb.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gb; g.fillRect(-w, -60, w * 2, 120);
    g.restore();
    const vg = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
  };
}

function planetArt(pack: ContentPack): (g: Ctx) => void {
  return (g) => {
    const cx = 120, cy = 120, R = 78;
    const pg = g.createRadialGradient(cx - 26, cy - 30, 8, cx, cy, R + 4);
    pg.addColorStop(0, shade(pack.planet, 0.3)); pg.addColorStop(0.65, hex(pack.planet)); pg.addColorStop(1, shade(pack.planet, -0.45));
    g.fillStyle = pg; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
    if (pack.id === 'replica') {
      g.strokeStyle = rgba(pack.ring, 0.22); g.lineWidth = 9;
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(cx, cy + i * 24, R, 13, 0, 0, 7); g.stroke(); }
    } else {
      g.fillStyle = 'rgba(0,0,0,.28)';
      for (const c of [[-28, -18, 12], [14, 8, 9], [-6, 34, 7], [30, -30, 6], [-38, 22, 5]]) {
        g.beginPath(); g.arc(cx + c[0], cy + c[1], c[2], 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(255,255,255,.07)';
      for (const c of [[-28, -18, 12], [14, 8, 9]]) {
        g.beginPath(); g.arc(cx + c[0] - 2, cy + c[1] - 2, c[2] * 0.6, 0, 7); g.fill();
      }
    }
    g.restore();
    if (pack.id === 'replica') {
      g.strokeStyle = rgba(pack.ring, 0.28); g.lineWidth = 13;
      g.beginPath(); g.ellipse(cx, cy + 8, 112, 28, -0.16, 0, 7); g.stroke();
      g.strokeStyle = rgba(pack.ring, 0.55); g.lineWidth = 5;
      g.beginPath(); g.ellipse(cx, cy + 8, 108, 26, -0.16, 0, 7); g.stroke();
    }
    g.strokeStyle = rgba(pack.ring, 0.55); g.lineWidth = 2.5;
    g.beginPath(); g.arc(cx, cy, R - 1, -2.5, -0.55); g.stroke();
  };
}

function bannerArt(pack: ContentPack): (g: Ctx, w: number) => void {
  return (g, w) => {
    const lg = g.createLinearGradient(0, 0, 0, 96);
    lg.addColorStop(0, 'rgba(0,0,0,.88)'); lg.addColorStop(0.5, 'rgba(6,8,16,.62)'); lg.addColorStop(1, 'rgba(0,0,0,.88)');
    g.fillStyle = lg; g.fillRect(0, 0, w, 96);
    g.strokeStyle = rgba(pack.accent, 0.4); g.lineWidth = 6;
    g.beginPath(); g.moveTo(0, 4); g.lineTo(w, 4); g.moveTo(0, 92); g.lineTo(w, 92); g.stroke();
    g.strokeStyle = hex(pack.accent); g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 1.5); g.lineTo(w, 1.5); g.moveTo(0, 94.5); g.lineTo(w, 94.5); g.stroke();
  };
}

// ---------------- birds ----------------
type Pose = 'up' | 'down' | 'dive' | 'mid';

function birdArt(g: Ctx, pack: ContentPack, variant: EnemyType, k: number, pose: Pose, mad: boolean): void {
  const cluck = pack.id === 'cluck';
  const body = variant.color, dk = shade(body, -0.3), dk2 = shade(body, -0.52);
  const BUILD = {
    round: { rx: cluck ? 13.5 : 15, ry: cluck ? 14.5 : 13.5, wing: 10.5, combN: 3, combS: 1 },
    swept: { rx: 12.5, ry: 11.5, wing: 12.5, combN: 2, combS: 0.75 },
    heavy: { rx: 17.5, ry: 15, wing: 9, combN: 3, combS: 1.35 },
  }[variant.build];
  const { rx, ry, wing, combN, combS } = BUILD;
  g.lineJoin = 'round';
  if (mad) { // ruffled-angry silhouette (boss <35% hp)
    g.fillStyle = dk2;
    g.beginPath();
    for (let i = 0; i < 18; i++) {
      const th = i / 18 * Math.PI * 2, rr = (i % 2 ? 21 : 16.5) * k;
      const px = Math.cos(th) * rr, py = Math.sin(th) * rr * 0.9;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath(); g.fill();
  }
  // tail fan (rear, upper-left)
  g.fillStyle = dk;
  for (let i = -1; i <= 1; i++) {
    g.save(); g.translate(-10 * k, -6 * k); g.rotate(-0.75 + i * 0.3);
    g.beginPath(); g.ellipse(0, -8 * k, (cluck ? 2.8 : 3.4) * k, (cluck ? 10 : 9) * k, 0, 0, 7); g.fill();
    g.restore();
  }
  // wings — mirrored via scale(sx,1); phi = wing angle
  const phi = pose === 'up' ? -0.95 : pose === 'down' ? 0.7 : pose === 'mid' ? -0.2 : 1.15;
  for (const sx of [-1, 1]) {
    g.save(); g.translate(sx * 11 * k, -1 * k); g.scale(sx, 1); g.rotate(phi);
    g.fillStyle = dk;
    g.beginPath();
    g.ellipse(6.5 * k, 0, (pose === 'dive' ? 7 : wing) * k, (pose === 'dive' ? 3.4 : 5) * k, 0, 0, 7);
    g.fill();
    g.strokeStyle = dk2; g.lineWidth = 1 * k;
    g.beginPath(); g.moveTo(2.5 * k, 0); g.lineTo((pose === 'dive' ? 10 : 14.5) * k, 0); g.stroke();
    g.restore();
  }
  // body
  const bgr = g.createRadialGradient(-4 * k, -6 * k, 2 * k, 0, 0, 18 * k);
  bgr.addColorStop(0, shade(body, 0.2)); bgr.addColorStop(1, hex(body));
  g.fillStyle = bgr;
  g.beginPath(); g.ellipse(0, 0, rx * k, (pose === 'dive' ? ry * 1.12 : ry) * k, 0, 0, 7); g.fill();
  g.strokeStyle = dk2; g.lineWidth = 1.2 * k; g.stroke();
  // belly patch
  g.fillStyle = hex(pack.belly);
  g.beginPath(); g.ellipse(0, 5 * k, rx * 0.62 * k, ry * 0.55 * k, 0, 0, 7); g.fill();
  // head
  g.fillStyle = hex(body);
  g.beginPath(); g.arc(0, -14 * k, 7.6 * k, 0, 7); g.fill();
  g.strokeStyle = dk2; g.lineWidth = 1 * k; g.stroke();
  // beak + wattle
  g.fillStyle = hex(pack.beak);
  g.beginPath(); g.moveTo(-3.4 * k, -11.5 * k); g.lineTo(3.4 * k, -11.5 * k); g.lineTo(0, -6.5 * k); g.closePath(); g.fill();
  g.strokeStyle = shade(pack.beak, -0.4); g.lineWidth = 0.8 * k; g.stroke();
  g.fillStyle = hex(pack.comb);
  g.beginPath(); g.ellipse(2.8 * k, -6.2 * k, 1.5 * k, (cluck ? 1.8 : 2.6) * k, 0.3, 0, 7); g.fill();
  // angry eyes
  const ey = -16 * k;
  for (const sx of [-1, 1]) {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(sx * 3.2 * k, ey, 2.2 * k, 0, 7); g.fill();
    g.fillStyle = mad ? '#ff2b2b' : '#141414'; g.beginPath(); g.arc(sx * 3.2 * k, ey + 0.7 * k, 1.2 * k, 0, 7); g.fill();
    g.strokeStyle = dk2; g.lineWidth = (mad ? 1.8 : 1.3) * k;
    g.beginPath(); g.moveTo(sx * 6.2 * k, ey - 3.6 * k); g.lineTo(sx * 1.4 * k, ey - 1.7 * k); g.stroke();
  }
  // comb (replica) / crest tuft (cluck)
  if (!cluck) {
    g.fillStyle = hex(pack.comb);
    const mid = (combN - 1) / 2;
    for (let i = 0; i < combN; i++) {
      const o = i - mid;
      g.beginPath(); g.ellipse(o * 3.4 * k, -21.3 * k - (o === 0 ? 1.6 * k : 0), 2.4 * k * combS, 3 * k * combS, 0, 0, 7); g.fill();
    }
  } else {
    g.strokeStyle = hex(pack.foe2); g.lineWidth = 2 * k; g.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      g.beginPath(); g.moveTo(i * 2 * k, -20.5 * k);
      g.quadraticCurveTo(i * 4.5 * k, -25 * k, i * 6.5 * k, -27.5 * k); g.stroke();
    }
    g.lineCap = 'butt';
  }
  // dive speed lines (trail above)
  if (pose === 'dive') {
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5 * k; g.lineCap = 'round';
    for (const l of [[-12, -22, -33], [-6.5, -26, -35], [6.5, -26, -35], [12, -22, -33]]) {
      g.beginPath(); g.moveTo(l[0] * k, l[1] * k); g.lineTo(l[0] * k, l[2] * k); g.stroke();
    }
    g.lineCap = 'butt';
  }
}

function crownArt(g: Ctx, pack: ContentPack, k: number, mad: boolean): void {
  if (pack.id === 'replica') { // golden comb-crown
    const y = -24.2 * k;
    g.fillStyle = '#f6c453'; g.strokeStyle = '#a8741a'; g.lineWidth = 1 * k;
    for (let i = -1; i <= 1; i++) {
      g.beginPath(); g.ellipse(i * 5.6 * k, y - 2.2 * k - (i === 0 ? 1.6 * k : 0), 2.8 * k, 3.6 * k, 0, 0, 7); g.fill(); g.stroke();
    }
    rrectG(g, -8.6 * k, y, 17.2 * k, 4 * k, 1.8 * k); g.fill(); g.stroke();
    g.fillStyle = mad ? '#ff5252' : '#e8590c';
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(i * 5.6 * k, y + 2 * k, 1 * k, 0, 7); g.fill(); }
  } else { // feathered bonnet
    const y = -22.5 * k;
    g.lineCap = 'round';
    for (let i = -2; i <= 2; i++) {
      g.strokeStyle = i % 2 ? hex(pack.ship) : '#f1f3f5'; g.lineWidth = 2.6 * k;
      g.beginPath(); g.moveTo(i * 3 * k, y);
      g.quadraticCurveTo(i * 5 * k, y - 6 * k, i * 7.6 * k, y - 9.6 * k); g.stroke();
    }
    g.lineCap = 'butt';
    g.fillStyle = hex(pack.ship);
    rrectG(g, -9.4 * k, y - 1.2 * k, 18.8 * k, 3.6 * k, 1.8 * k); g.fill();
    g.strokeStyle = shade(pack.ship, -0.4); g.lineWidth = 0.9 * k; g.stroke();
  }
}

// ---------------- ship + shots ----------------
function shipArt(g: Ctx, pack: ContentPack, lv: number): void {
  const base = pack.ship, hi = pack.shipHi, dk = shade(base, -0.35), dk2 = shade(base, -0.55);
  g.lineJoin = 'round';
  g.fillStyle = dk2; rrectG(g, -5, 12, 10, 5, 2); g.fill(); // engine block
  g.beginPath();
  g.moveTo(0, -21);
  g.quadraticCurveTo(5, -8, 19, 9);
  g.lineTo(15, 13); g.lineTo(7, 11); g.lineTo(4, 15);
  g.lineTo(-4, 15); g.lineTo(-7, 11); g.lineTo(-15, 13); g.lineTo(-19, 9);
  g.quadraticCurveTo(-5, -8, 0, -21);
  g.closePath();
  const hg = g.createLinearGradient(0, -21, 0, 16);
  hg.addColorStop(0, shade(base, 0.3)); hg.addColorStop(0.55, hex(base)); hg.addColorStop(1, dk);
  g.fillStyle = hg; g.fill();
  g.strokeStyle = dk2; g.lineWidth = 1.2; g.stroke();
  // two-tone starboard shading
  g.beginPath();
  g.moveTo(0, -21); g.quadraticCurveTo(5, -8, 19, 9); g.lineTo(15, 13); g.lineTo(7, 11); g.lineTo(4, 15); g.lineTo(0, 15);
  g.closePath(); g.fillStyle = 'rgba(0,0,0,.17)'; g.fill();
  // canopy
  const cg = g.createRadialGradient(-1, -8, 0.5, 0, -5, 6.5);
  cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.45, hex(hi)); cg.addColorStop(1, rgba(hi, 0.2));
  g.fillStyle = cg;
  g.beginPath(); g.ellipse(0, -5, 3.4, 6.8, 0, 0, 7); g.fill();
  g.strokeStyle = dk2; g.lineWidth = 0.8; g.stroke();
  // spine + wing accents
  g.strokeStyle = rgba(hi, 0.8); g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, -19); g.lineTo(0, 5); g.stroke();
  g.strokeStyle = hex(pack.accent); g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-13.5, 8.5); g.lineTo(-6, 2.5); g.moveTo(13.5, 8.5); g.lineTo(6, 2.5); g.stroke();
  // muzzle barrels by weapon level (1/2/3)
  const barrel = (x: number, y: number, l: number) => {
    g.fillStyle = '#21262b'; rrectG(g, x - 1.7, y - l, 3.4, l + 3.5, 1.5); g.fill();
    g.fillStyle = hex(pack.accent); g.fillRect(x - 1.7, y - l, 3.4, 1.7);
  };
  if (lv === 0) barrel(0, -19.5, 5);
  else if (lv === 1) { barrel(-8.5, -5, 6); barrel(8.5, -5, 6); }
  else { barrel(0, -19.5, 5); barrel(-11.5, -1.5, 6); barrel(11.5, -1.5, 6); }
}

function flameArt(g: Ctx, i: number): void {
  const l = [19, 25, 22][i], w = [7.5, 5.5, 6.5][i];
  const fg = g.createRadialGradient(10, 5, 1, 10, 9, l);
  fg.addColorStop(0, '#fff7ae'); fg.addColorStop(0.35, '#ffd43b');
  fg.addColorStop(0.7, 'rgba(255,107,53,.65)'); fg.addColorStop(1, 'rgba(255,107,53,0)');
  g.fillStyle = fg;
  g.beginPath();
  g.moveTo(10 - w / 2, 3);
  g.quadraticCurveTo(10 - w / 2 - 1.5, 13, 10, 3 + l);
  g.quadraticCurveTo(10 + w / 2 + 1.5, 13, 10 + w / 2, 3);
  g.closePath(); g.fill();
}

function bulletArt(pack: ContentPack): (g: Ctx) => void {
  return (g) => {
    const hg = g.createRadialGradient(10, 15, 1, 10, 15, 14);
    hg.addColorStop(0, rgba(pack.bullet, 0.5)); hg.addColorStop(1, rgba(pack.bullet, 0));
    g.fillStyle = hg; g.fillRect(0, 0, 20, 30);
    g.fillStyle = hex(pack.bullet); rrectG(g, 7.3, 8, 5.4, 14, 2.7); g.fill();
    g.fillStyle = '#fff'; rrectG(g, 8.6, 9.6, 2.8, 9.5, 1.4); g.fill();
  };
}

function missileArt(pack: ContentPack): (g: Ctx) => void {
  return (g) => {
    g.fillStyle = hex(pack.accent);
    g.beginPath(); g.moveTo(8, 25); g.lineTo(2.5, 34); g.lineTo(8, 31.5); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(16, 25); g.lineTo(21.5, 34); g.lineTo(16, 31.5); g.closePath(); g.fill();
    const fg = g.createLinearGradient(0, 30, 0, 43);
    fg.addColorStop(0, '#fff7ae'); fg.addColorStop(0.5, '#ffa94d'); fg.addColorStop(1, 'rgba(255,80,0,0)');
    g.fillStyle = fg;
    g.beginPath(); g.moveTo(9, 30); g.quadraticCurveTo(9.5, 39, 12, 43); g.quadraticCurveTo(14.5, 39, 15, 30); g.closePath(); g.fill();
    const mg = g.createLinearGradient(8, 0, 16, 0);
    mg.addColorStop(0, '#868e96'); mg.addColorStop(0.45, '#e9ecef'); mg.addColorStop(1, '#adb5bd');
    g.fillStyle = mg; rrectG(g, 8, 10, 8, 22, 3.5); g.fill();
    g.strokeStyle = '#495057'; g.lineWidth = 0.8; g.stroke();
    g.fillStyle = hex(pack.accent);
    g.beginPath(); g.moveTo(8, 12); g.quadraticCurveTo(12, 0.5, 16, 12); g.closePath(); g.fill();
    g.fillStyle = '#212529'; g.beginPath(); g.arc(12, 17, 1.8, 0, 7); g.fill();
    g.fillStyle = '#a5d8ff'; g.beginPath(); g.arc(11.4, 16.4, 0.8, 0, 7); g.fill();
    g.fillStyle = hex(pack.accent); g.fillRect(8, 24, 8, 2.2);
  };
}

function eggArt(pack: ContentPack): (g: Ctx) => void {
  return (g) => {
    const eg = g.createRadialGradient(6.5, 7, 1, 9, 11, 10);
    eg.addColorStop(0, '#fffdf5'); eg.addColorStop(0.55, hex(pack.egg)); eg.addColorStop(1, shade(pack.egg, -0.28));
    g.fillStyle = eg;
    g.beginPath(); g.ellipse(9, 11, 6.4, 8.2, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(120,110,80,.7)'; g.lineWidth = 0.9; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.beginPath(); g.ellipse(6.8, 7.4, 1.5, 2.3, -0.5, 0, 7); g.fill();
  };
}

function puffArt(g: Ctx): void {
  const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, 'rgba(215,220,235,.5)'); r.addColorStop(0.6, 'rgba(200,205,220,.22)'); r.addColorStop(1, 'rgba(200,205,220,0)');
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
}

function giftArt(pack: ContentPack): (g: Ctx) => void {
  return (g) => {
    g.fillStyle = shade(pack.giftCol, -0.18); rrectG(g, 8, 15, 20, 14, 2.5); g.fill();
    g.fillStyle = hex(pack.giftCol); rrectG(g, 8, 15, 20, 11, 2.5); g.fill();
    g.strokeStyle = shade(pack.giftCol, -0.5); g.lineWidth = 1; rrectG(g, 8, 15, 20, 14, 2.5); g.stroke();
    g.fillStyle = shade(pack.giftCol, 0.15); rrectG(g, 6.5, 11.5, 23, 4.5, 2); g.fill(); g.stroke();
    g.fillStyle = hex(pack.accent);
    g.fillRect(16.4, 11.5, 3.2, 17.5); g.fillRect(8, 19.5, 20, 3);
    g.strokeStyle = hex(pack.accent); g.lineWidth = 1.8;
    g.beginPath(); g.ellipse(14.8, 9.3, 3.4, 2.2, -0.5, 0, 7); g.stroke();
    g.beginPath(); g.ellipse(21.2, 9.3, 3.4, 2.2, 0.5, 0, 7); g.stroke();
    g.fillStyle = hex(pack.accent); g.beginPath(); g.arc(18, 9.8, 1.7, 0, 7); g.fill();
  };
}

function foodArt(pack: ContentPack): (g: Ctx) => void {
  return (g) => {
    if (pack.id === 'replica') { // drumstick
      g.save(); g.translate(18, 19); g.rotate(-0.5);
      g.fillStyle = '#f1f3f5';
      rrectG(g, 2, -2.2, 12, 4.4, 2.2); g.fill();
      g.beginPath(); g.arc(14.5, -3.4, 3, 0, 7); g.arc(15.5, 1.6, 3, 0, 7); g.fill();
      const mg = g.createRadialGradient(-4, -4, 1, 0, 0, 12);
      mg.addColorStop(0, '#d98e4a'); mg.addColorStop(1, '#8c4a1f');
      g.fillStyle = mg;
      g.beginPath(); g.ellipse(-2, 1, 10, 8.4, 0, 0, 7); g.fill();
      g.strokeStyle = '#5f310f'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)';
      g.beginPath(); g.ellipse(-5, -2.5, 3.2, 2, -0.4, 0, 7); g.fill();
      g.restore();
    } else { // ration crate
      g.fillStyle = '#868e96'; rrectG(g, 8, 12, 20, 17, 2); g.fill();
      g.fillStyle = '#adb5bd'; rrectG(g, 8, 12, 20, 13.5, 2); g.fill();
      g.strokeStyle = '#495057'; g.lineWidth = 1; rrectG(g, 8, 12, 20, 17, 2); g.stroke();
      g.fillStyle = hex(pack.ship); g.fillRect(8, 18.5, 20, 3); g.fillRect(16.5, 12, 3, 17);
      g.fillStyle = '#343a40'; g.font = 'bold 7px monospace'; g.textAlign = 'center';
      g.fillText('R', 18, 16.8); g.textAlign = 'left';
    }
  };
}

// ---------------- assembled set ----------------
export interface ShmupArt {
  bg: Texture;
  planet: Texture;
  banner: Texture;
  star: Texture[]; // 3 brightness tiers
  /** [enemyType][pose] — pose 0 wing-up, 1 wing-down (dive is drawn via transform + speed lines) */
  bird: Texture[][];
  /** [bossType] — normal variant; enraged is a tint/alt texture */
  boss: Texture[];
  bossMad: Texture[];
  /** [weaponLv] ship sprite (cluck: single base, barrels drawn separately) */
  ship: Texture[];
  hasFlame: boolean;
  flame: Texture[];
  bullet: Texture;
  missile: Texture;
  egg: Texture;
  puff: Texture;
  gift: Texture;
  food: Texture;
}

async function loadSvg(path: string): Promise<Texture | null> {
  try {
    return await Assets.load<Texture>(path);
  } catch {
    return null;
  }
}

export async function buildArt(pack: ContentPack): Promise<ShmupArt> {
  const bg = mkTex(STAGE_W, STAGE_H, bgArt(pack));
  const planet = mkTex(240, 240, (g) => planetArt(pack)(g));
  const banner = mkTex(STAGE_W, 96, (g, w) => bannerArt(pack)(g, w));
  const star = [
    mkTex(6, 6, (g) => { g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(3, 3, 1.3, 0, 7); g.fill(); }),
    mkTex(9, 9, (g) => {
      const r = g.createRadialGradient(4.5, 4.5, 0, 4.5, 4.5, 4.5);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.75)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, 9, 9);
    }),
    mkTex(15, 15, (g) => {
      const r = g.createRadialGradient(7.5, 7.5, 0, 7.5, 7.5, 7.5);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(230,240,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, 15, 15);
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(7.5, 1); g.lineTo(7.5, 14); g.moveTo(1, 7.5); g.lineTo(14, 7.5); g.stroke();
    }),
  ];

  // cluck pack: authored SVGs win over the baked recipe; fallback = baked
  const svgBird = await Promise.all(pack.enemyTypes.map((v) => (v.svg ? loadSvg(v.svg) : Promise.resolve(null))));
  const svgBoss = await Promise.all(pack.bosses.map((b) => (b.svg ? loadSvg(b.svg) : Promise.resolve(null))));
  const svgShip = pack.id === 'cluck' ? await loadSvg('/art/ship-courier.svg') : null;

  const bird = pack.enemyTypes.map((v, i) => {
    if (svgBird[i]) {
      // up/down poses share the authored sprite; flap is a transform in the renderer
      return [svgBird[i]!, svgBird[i]!];
    }
    return [
      mkTex(56, 56, (g) => { g.translate(28, 30); birdArt(g, pack, v, 1, 'up', false); }),
      mkTex(56, 56, (g) => { g.translate(28, 30); birdArt(g, pack, v, 1, 'down', false); }),
    ];
  });
  const boss = pack.bosses.map((b, i) => {
    if (svgBoss[i]) return svgBoss[i]!;
    return mkTex(200, 190, (g) => {
      g.translate(100, 104);
      birdArt(g, pack, { ...pack.enemyTypes[0], color: b.color, headColor: b.headColor }, 3.2, 'mid', false);
      crownArt(g, pack, 3.2, false);
    });
  });
  const bossMad = pack.bosses.map((b, i) => {
    if (svgBoss[i]) return svgBoss[i]!; // enraged read via tint in the renderer
    return mkTex(200, 190, (g) => {
      g.translate(100, 104);
      birdArt(g, pack, { ...pack.enemyTypes[0], color: b.color, headColor: b.headColor }, 3.2, 'mid', true);
      crownArt(g, pack, 3.2, true);
    });
  });

  const ship = svgShip
    ? [svgShip]
    : [0, 1, 2].map((lv) => mkTex(48, 56, (g) => { g.translate(24, 30); shipArt(g, pack, lv); }));
  const flame = [0, 1, 2].map((i) => mkTex(20, 30, (g) => flameArt(g, i)));

  return {
    bg, planet, banner, star, bird, boss, bossMad,
    ship, hasFlame: !svgShip, flame,
    bullet: mkTex(20, 30, bulletArt(pack)),
    missile: mkTex(24, 44, missileArt(pack)),
    egg: mkTex(18, 22, eggArt(pack)),
    puff: mkTex(32, 32, puffArt),
    gift: mkTex(36, 36, giftArt(pack)),
    food: mkTex(36, 36, foodArt(pack)),
  };
}

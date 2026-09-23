/**
 * Arena of Bonks — colosseum art layer. Hand-authored Canvas2D ported from the
 * mechanics proof's r1 presentation (prototypes/swords-and-sandals.html); no
 * external assets. Sim-free: main.ts pushes events in, this paints them.
 */

export type WeaponKind = 'club' | 'sword' | 'axe' | 'dagger' | 'shield';
export interface FighterView {
  name: string; skin: string; tint: string;
  armorTier: 0 | 1 | 2 | 3; weapon: WeaponKind; gold?: boolean;
}
export interface SceneView {
  screen: string;
  player: FighterView;
  php: number; pmax: number;
  opponent: (FighterView & { hp: number; maxHp: number }) | null;
}
interface Anim { kind: 'lunge' | 'hit'; who: 'p' | 'e'; t0: number }
interface Float { txt: string; x: number; y: number; c: string; t0: number }

const W = 800, H = 420;
const PX = 240, PY = 372, EX = 560, EY = 372;
let ctx: CanvasRenderingContext2D;
let bg: HTMLCanvasElement | null = null;
const crowd: { x: number; y: number; ph: number; c: string }[] = [];
const motes: { x: number; y: number; r: number; ph: number; sp: number }[] = [];
const confetti: { x: number; y: number; ph: number; c: string }[] = [];
const anims: Anim[] = [];
const floats: Float[] = [];
let shakeAmp = 0;

export function initArena(stage: HTMLCanvasElement): void {
  ctx = stage.getContext('2d')!;
  buildArena();
}

export function spawnLunge(who: 'p' | 'e'): void { anims.push({ kind: 'lunge', who, t0: performance.now() }); }
export function spawnHit(who: 'p' | 'e', txt: string, c: string): void {
  anims.push({ kind: 'hit', who, t0: performance.now() });
  floats.push({ txt, x: who === 'p' ? PX : EX, y: 286, c, t0: performance.now() });
  shakeAmp = 7;
}
export function spawnFloat(txt: string, x: number, y: number, c: string): void { floats.push({ txt, x, y, c, t0: performance.now() }); }
export function shake(): void { shakeAmp = 7; }

function rrect(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f)), g = Math.min(255, Math.round(((n >> 8) & 255) * f)), b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}
function bar(x: number, y: number, w: number, h: number, frac: number, col: string): void {
  ctx.fillStyle = '#241708'; rrect(x - 3, y - 3, w + 6, h + 6, 4); ctx.fill();
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5; rrect(x - 3, y - 3, w + 6, h + 6, 4); ctx.stroke();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#180f06'); g.addColorStop(1, '#34200e');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0) {
    const fg = ctx.createLinearGradient(x, y, x, y + h);
    fg.addColorStop(0, shade(col, 1.4)); fg.addColorStop(0.5, col); fg.addColorStop(1, shade(col, 0.55));
    ctx.fillStyle = fg; ctx.fillRect(x, y, w * f, h);
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x, y, w * f, Math.max(2, h * 0.38));
  }
}
function plaque(x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#c8a068'); g.addColorStop(0.5, '#a87f4c'); g.addColorStop(1, '#8a6238');
  ctx.fillStyle = g; rrect(x, y, w, h, 6); ctx.fill();
  ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 2; rrect(x, y, w, h, 6); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,235,190,.4)'; ctx.lineWidth = 1; rrect(x + 3, y + 3, w - 6, h - 6, 4); ctx.stroke();
}
function laurel(x: number, y: number, s: number, col = '#3a6a2a'): void {
  ctx.strokeStyle = col; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, s, Math.PI * 0.55, Math.PI * 1.45); ctx.stroke();
  ctx.fillStyle = col;
  for (let i = 0; i < 5; i++) {
    const an = Math.PI * 0.6 + i * Math.PI * 0.2;
    const lx = x + Math.cos(an) * s, ly = y + Math.sin(an) * s;
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(an + Math.PI / 2);
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 3, 0, 0, 7); ctx.fill(); ctx.restore();
  }
}
function crossedSwords(x: number, y: number, s: number): void {
  ctx.save(); ctx.translate(x, y);
  for (const d of [-1, 1]) {
    ctx.save(); ctx.rotate(d * 0.7);
    ctx.fillStyle = '#b8bec8'; ctx.fillRect(-2.5, -s, 5, s);
    ctx.fillStyle = '#8a8f98'; ctx.beginPath(); ctx.moveTo(-2.5, -s); ctx.lineTo(2.5, -s); ctx.lineTo(0, -s - 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9a86a'; ctx.fillRect(-7, -1, 14, 4); ctx.fillRect(-2, 3, 4, 9);
    ctx.restore();
  }
  ctx.restore();
}
function pedestal(x: number, y: number, w: number): void {
  const g = ctx.createLinearGradient(x, y - 12, x, y + 14);
  g.addColorStop(0, '#c8a068'); g.addColorStop(1, '#7a5836');
  ctx.fillStyle = g; rrect(x - w / 2, y - 12, w, 24, 4); ctx.fill();
  ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 2; rrect(x - w / 2, y - 12, w, 24, 4); ctx.stroke();
}

/* ---------- static backdrop (precomputed once) ---------- */
function buildArena(): void {
  bg = document.createElement('canvas'); bg.width = W; bg.height = H;
  const a = bg.getContext('2d')!;
  let g = a.createLinearGradient(0, 0, 0, 190);
  g.addColorStop(0, '#4a2033'); g.addColorStop(0.4, '#6e2f33'); g.addColorStop(0.75, '#a8542f'); g.addColorStop(1, '#d98e4a');
  a.fillStyle = g; a.fillRect(0, 0, W, 190);
  g = a.createRadialGradient(660, 118, 10, 660, 118, 200);
  g.addColorStop(0, 'rgba(255,220,150,.55)'); g.addColorStop(1, 'rgba(255,220,150,0)');
  a.fillStyle = g; a.fillRect(0, 0, W, 190);
  a.fillStyle = '#ffcf6e'; a.beginPath(); a.arc(660, 118, 24, 0, 7); a.fill();
  a.fillStyle = '#ffe3a1'; a.beginPath(); a.arc(660, 118, 16, 0, 7); a.fill();
  // colosseum: three tiers of arched stands
  const tiers = [{ y: 34, h: 46, c1: '#c8a068', c2: '#a87f4c' }, { y: 80, h: 46, c1: '#b89058', c2: '#96703f' }, { y: 126, h: 46, c1: '#a87f4c', c2: '#84603a' }];
  const bannerCols = ['#8a2a22', '#3a5a8a', '#7a5a20', '#5a3a6a'];
  tiers.forEach((t, ti) => {
    g = a.createLinearGradient(0, t.y, 0, t.y + t.h);
    g.addColorStop(0, t.c1); g.addColorStop(1, t.c2);
    a.fillStyle = g; a.fillRect(0, t.y, W, t.h);
    a.fillStyle = 'rgba(255,240,200,.3)'; a.fillRect(0, t.y, W, 3);
    a.fillStyle = 'rgba(60,35,15,.4)'; a.fillRect(0, t.y + t.h - 4, W, 4);
    for (let x = 8; x < W - 30; x += 46) {
      a.fillStyle = 'rgba(52,32,16,.85)';
      a.beginPath(); a.moveTo(x, t.y + t.h - 6); a.lineTo(x, t.y + 22); a.arc(x + 16, t.y + 22, 16, Math.PI, 0); a.lineTo(x + 32, t.y + t.h - 6); a.closePath(); a.fill();
      a.strokeStyle = 'rgba(255,230,180,.22)'; a.lineWidth = 1.5;
      a.beginPath(); a.moveTo(x, t.y + t.h - 6); a.lineTo(x, t.y + 22); a.arc(x + 16, t.y + 22, 16, Math.PI, 0); a.lineTo(x + 32, t.y + t.h - 6); a.stroke();
      for (let k = 0; k < 7; k++) {
        const px = x + 5 + Math.random() * 22, py = t.y + 20 + Math.random() * (t.h - 30);
        crowd.push({ x: px, y: py, ph: Math.random() * 6.28, c: Math.random() < 0.5 ? '#e8c890' : '#5a3a20' });
      }
    }
    for (let x = 46 + ti * 22; x < W - 40; x += 184) {
      a.fillStyle = bannerCols[((x / 46 + ti) | 0) % 4];
      a.beginPath(); a.moveTo(x, t.y + t.h - 4); a.lineTo(x + 20, t.y + t.h - 4); a.lineTo(x + 20, t.y + t.h + 18); a.lineTo(x + 10, t.y + t.h + 11); a.lineTo(x, t.y + t.h + 18); a.closePath(); a.fill();
      a.fillStyle = 'rgba(255,220,140,.5)'; a.fillRect(x, t.y + t.h - 4, 20, 3);
    }
  });
  // wall above the sand
  g = a.createLinearGradient(0, 172, 0, 206);
  g.addColorStop(0, '#9a7448'); g.addColorStop(1, '#7a5836');
  a.fillStyle = g; a.fillRect(0, 172, W, 34);
  a.fillStyle = '#c8a068'; a.fillRect(0, 172, W, 4);
  a.strokeStyle = 'rgba(60,35,15,.35)'; a.lineWidth = 2;
  for (let x = 34; x < W; x += 66) { a.beginPath(); a.moveTo(x, 178); a.lineTo(x, 206); a.stroke(); }
  // sun-baked sand
  g = a.createRadialGradient(400, 330, 40, 400, 330, 480);
  g.addColorStop(0, '#e8c078'); g.addColorStop(0.6, '#d8a860'); g.addColorStop(1, '#b8863f');
  a.fillStyle = g; a.fillRect(0, 206, W, H - 206);
  a.strokeStyle = 'rgba(120,80,35,.2)'; a.lineWidth = 2;
  for (let r = 50; r < 520; r += 36) { a.beginPath(); a.arc(400, 430, r, Math.PI * 1.12, Math.PI * 1.88); a.stroke(); }
  for (const s of [[250, 340, 34], [590, 368, 44], [400, 300, 24]]) {
    g = a.createRadialGradient(s[0], s[1], 3, s[0], s[1], s[2]);
    g.addColorStop(0, 'rgba(110,60,25,.18)'); g.addColorStop(1, 'rgba(110,60,25,0)');
    a.fillStyle = g; a.fillRect(s[0] - s[2], s[1] - s[2], s[2] * 2, s[2] * 2);
  }
  // decals: broken sword + lost shield
  a.save(); a.translate(310, 352); a.rotate(0.5);
  a.fillStyle = '#7a7f88'; a.fillRect(-2, -24, 4, 20);
  a.fillStyle = '#5a5f68'; a.beginPath(); a.moveTo(-2, -24); a.lineTo(2, -24); a.lineTo(0, -30); a.closePath(); a.fill();
  a.fillStyle = '#6a4a20'; a.fillRect(-6, -5, 12, 4); a.fillRect(-2, -2, 4, 9); a.restore();
  a.save(); a.translate(648, 344); a.rotate(-0.35);
  a.fillStyle = '#8a5a28'; a.beginPath(); a.arc(0, 0, 14, 0, 7); a.fill();
  a.strokeStyle = '#5a3a18'; a.lineWidth = 3; a.beginPath(); a.arc(0, 0, 14, 0, 7); a.stroke();
  a.fillStyle = '#c9a86a'; a.beginPath(); a.arc(0, 0, 4, 0, 7); a.fill(); a.restore();
  // torch braziers (flames per-frame)
  for (const bx of [56, 744]) {
    a.fillStyle = '#3a2a18'; a.fillRect(bx - 3, 172, 6, 30);
    a.fillStyle = '#54340f'; a.beginPath(); a.moveTo(bx - 12, 172); a.lineTo(bx + 12, 172); a.lineTo(bx + 7, 158); a.lineTo(bx - 7, 158); a.closePath(); a.fill();
    a.strokeStyle = '#c9a86a'; a.lineWidth = 1.5; a.beginPath(); a.moveTo(bx - 11, 170); a.lineTo(bx + 11, 170); a.stroke();
  }
  for (let i = 0; i < 22; i++) motes.push({ x: Math.random() * W, y: 230 + Math.random() * 170, r: 0.8 + Math.random() * 1.5, ph: Math.random() * 6.28, sp: 0.12 + Math.random() * 0.3 });
  for (let i = 0; i < 70; i++) confetti.push({ x: Math.random() * W, y: Math.random() * H * 0.7, ph: Math.random() * 6.28, c: ['#ffd23a', '#e8c37a', '#fff2c8', '#c9a86a'][i % 4] });
}

/* ---------- weapons (origin at grip) ---------- */
function drawWeapon(wk: WeaponKind, gold: boolean): void {
  const steel = gold ? '#e8c37a' : '#b8bec8', dark = gold ? '#a87f2c' : '#7a7f88';
  ctx.lineCap = 'round';
  if (wk === 'club') {
    ctx.strokeStyle = '#6a4a20'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, -20); ctx.stroke();
    ctx.fillStyle = '#7a5a30'; ctx.beginPath(); ctx.arc(13, -27, 8, 0, 7); ctx.fill();
    ctx.fillStyle = '#54340f'; ctx.beginPath(); ctx.arc(11, -29, 2.5, 0, 7); ctx.fill();
  } else if (wk === 'shield') {
    ctx.fillStyle = '#8a2a22'; rrect(2, -40, 22, 44, 6); ctx.fill();
    ctx.strokeStyle = '#c9a86a'; ctx.lineWidth = 2.5; rrect(2, -40, 22, 44, 6); ctx.stroke();
    ctx.fillStyle = '#c9a86a'; ctx.beginPath(); ctx.arc(13, -18, 4, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,150,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(13, -36); ctx.lineTo(13, 0); ctx.stroke();
  } else if (wk === 'dagger') {
    ctx.strokeStyle = steel; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(13, -17); ctx.stroke();
    ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-2, 3); ctx.lineTo(3, -3); ctx.stroke();
  } else if (wk === 'axe') {
    ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(14, -32); ctx.stroke();
    ctx.fillStyle = steel;
    ctx.beginPath(); ctx.moveTo(14, -32); ctx.quadraticCurveTo(32, -36, 28, -19); ctx.quadraticCurveTo(20, -22, 10, -21); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(14, -32, 3, 0, 7); ctx.fill();
  } else {
    ctx.strokeStyle = steel; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, -27); ctx.stroke();
    ctx.strokeStyle = dark; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(2, -3); ctx.lineTo(16, -30); ctx.stroke();
    ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(4, -4); ctx.stroke();
    ctx.fillStyle = '#c9a86a'; ctx.beginPath(); ctx.arc(-1, 2, 2.5, 0, 7); ctx.fill();
  }
}

/* ---------- articulated gladiator (origin at feet) ---------- */
function drawGlad(x: number, y: number, f: FighterView, flip: boolean, hurt: boolean, lunge: boolean): void {
  const bob = Math.sin(performance.now() / 450 + x) * 1.2;
  ctx.fillStyle = 'rgba(60,30,10,.3)';
  ctx.beginPath(); ctx.ellipse(x, y + 3, 26, 6, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x + (lunge ? (flip ? -30 : 30) : 0), y); if (flip) ctx.scale(-1, 1);
  if (hurt) ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 40) * 0.3;
  ctx.lineCap = 'round';
  // back arm (+ tower shield)
  ctx.strokeStyle = f.skin; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-7, -52 + bob); ctx.lineTo(-13, -35 + bob); ctx.stroke();
  if (f.weapon === 'shield') { ctx.save(); ctx.translate(-16, -34 + bob); ctx.scale(0.8, 0.8); drawWeapon('shield', !!f.gold); ctx.restore(); }
  // legs
  ctx.strokeStyle = f.skin; ctx.lineWidth = 7.5;
  ctx.beginPath(); ctx.moveTo(-5, -25); ctx.lineTo(-8, -2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -25); ctx.lineTo(9, -2); ctx.stroke();
  ctx.fillStyle = '#4a3a20';
  ctx.beginPath(); ctx.ellipse(-9, -2, 6, 3.5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -2, 6, 3.5, 0, 0, 7); ctx.fill();
  // torso by armor tier
  if (f.armorTier === 0) {
    ctx.fillStyle = '#b8a888'; rrect(-12, -59 + bob, 24, 36, 5); ctx.fill();
    ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-12, -47 + bob); ctx.lineTo(12, -51 + bob); ctx.moveTo(-10, -37 + bob); ctx.lineTo(9, -34 + bob); ctx.stroke();
  } else if (f.armorTier === 1) {
    ctx.fillStyle = '#7a5a30'; rrect(-12, -59 + bob, 24, 36, 5); ctx.fill();
    ctx.strokeStyle = '#54340f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-12, -49 + bob); ctx.lineTo(12, -49 + bob); ctx.moveTo(-12, -39 + bob); ctx.lineTo(12, -39 + bob); ctx.stroke();
    ctx.fillStyle = '#c9a86a'; ctx.beginPath(); ctx.arc(-7, -44 + bob, 1.8, 0, 7); ctx.arc(7, -44 + bob, 1.8, 0, 7); ctx.fill();
  } else {
    const plate = f.armorTier === 3 ? '#d8b36a' : '#9aa0a8', trim = f.armorTier === 3 ? '#8a5a10' : '#6a7078';
    ctx.fillStyle = '#8a2a22'; rrect(-11, -59 + bob, 22, 36, 5); ctx.fill();
    ctx.fillStyle = plate; rrect(-13, -60 + bob, 26, 29, 6); ctx.fill();
    ctx.strokeStyle = trim; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-13, -52 + bob + i * 8); ctx.lineTo(13, -52 + bob + i * 8); ctx.stroke(); }
    ctx.fillStyle = plate;
    for (let i = -1; i <= 1; i++) ctx.fillRect(i * 9 - 3, -32 + bob, 7, 12);
    if (f.armorTier === 3) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -47 + bob, 3.5, 0, 7); ctx.fill(); }
  }
  // team tint sash
  ctx.fillStyle = f.tint; ctx.fillRect(-13, -28 + bob, 26, 5);
  // belt
  ctx.fillStyle = '#3a2a14'; ctx.fillRect(-13, -24 + bob, 26, 6);
  ctx.fillStyle = '#c9a86a'; ctx.fillRect(-3, -24 + bob, 6, 6);
  // front arm + weapon
  ctx.strokeStyle = f.skin; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(7, -52 + bob); ctx.lineTo(15, -38 + bob); ctx.stroke();
  ctx.save(); ctx.translate(16, -38 + bob); drawWeapon(f.weapon === 'shield' ? 'sword' : f.weapon, !!f.gold); ctx.restore();
  if (f.weapon === 'dagger') { ctx.save(); ctx.translate(-14, -35 + bob); ctx.scale(-1, 1); drawWeapon('dagger', !!f.gold); ctx.restore(); }
  // head
  ctx.fillStyle = f.skin; ctx.beginPath(); ctx.arc(0, -71 + bob, 11, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a1a0e'; ctx.fillRect(4, -74 + bob, 2.5, 2.5);
  // helm by silhouette
  if (f.weapon === 'club') {
    ctx.fillStyle = '#7a6a50'; ctx.beginPath(); ctx.arc(0, -74 + bob, 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(-12, -75 + bob, 24, 6);
    ctx.strokeStyle = '#4a3f28'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -74 + bob, 12, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#4a3f28'; ctx.fillRect(-2, -86 + bob, 4, 4);
  } else if (f.weapon === 'dagger') {
    ctx.fillStyle = '#6a5a3a'; ctx.beginPath(); ctx.arc(0, -75 + bob, 11, Math.PI * 1.05, -0.05); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-9, -70 + bob, 4, 7);
  } else {
    const helm = f.gold || f.weapon === 'axe' ? '#d8b36a' : '#9aa0a8';
    ctx.fillStyle = helm; ctx.beginPath(); ctx.arc(0, -73 + bob, 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(-12, -74 + bob, 24, 4);
    ctx.fillRect(-12, -71 + bob, 4, 8); ctx.fillRect(8, -71 + bob, 4, 8); ctx.fillRect(-2, -71 + bob, 4, 8);
    ctx.strokeStyle = f.gold || f.weapon === 'axe' ? '#8a5a10' : '#5a6068'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, -73 + bob, 12, Math.PI, 0); ctx.stroke();
    if (f.weapon === 'axe') {
      ctx.fillStyle = '#8a2a22';
      ctx.beginPath(); ctx.moveTo(-11, -81 + bob); ctx.quadraticCurveTo(0, -98 + bob, 11, -81 + bob); ctx.lineTo(8, -78 + bob); ctx.quadraticCurveTo(0, -90 + bob, -8, -78 + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(0, -83 + bob, 2.5, 0, 7); ctx.fill();
    } else {
      ctx.fillStyle = '#8a2a22'; ctx.fillRect(-3, -92 + bob, 6, 12);
      ctx.fillStyle = '#a03a30'; ctx.fillRect(-5, -92 + bob, 10, 3);
    }
  }
  ctx.restore();
}

/* ---------- per-frame paint ---------- */
export function paintArena(t: number, view: SceneView): void {
  if (!bg) return;
  ctx.save();
  if (shakeAmp > 0.5) { ctx.translate((Math.random() - 0.5) * shakeAmp, (Math.random() - 0.5) * shakeAmp); shakeAmp *= 0.88; } else shakeAmp = 0;
  ctx.drawImage(bg, -10, -10, W + 20, H + 20);
  // crowd twinkle
  for (const p of crowd) {
    ctx.globalAlpha = 0.5 + 0.35 * Math.sin(t / 700 + p.ph);
    ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2.5, 2.5);
  }
  ctx.globalAlpha = 1;
  // torch flames
  const fr = Math.floor(t / 140) % 2;
  for (const bx of [56, 744]) {
    const g = ctx.createRadialGradient(bx, 156, 4, bx, 156, 46);
    g.addColorStop(0, 'rgba(255,190,80,.35)'); g.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = g; ctx.fillRect(bx - 46, 110, 92, 92);
    ctx.fillStyle = '#ff9a2a';
    ctx.beginPath(); ctx.moveTo(bx - 7, 159); ctx.quadraticCurveTo(bx - 9, 146, bx + (fr ? 3 : -3), 138); ctx.quadraticCurveTo(bx + 9, 146, bx + 7, 159); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath(); ctx.moveTo(bx - 3.5, 159); ctx.quadraticCurveTo(bx - 4, 150, bx + (fr ? -2 : 2), 144); ctx.quadraticCurveTo(bx + 4, 150, bx + 3.5, 159); ctx.closePath(); ctx.fill();
  }
  // dust motes
  for (const m of motes) {
    const my = m.y - ((t * m.sp / 40) % 170);
    ctx.globalAlpha = 0.12 + 0.12 * Math.sin(t / 900 + m.ph);
    ctx.fillStyle = '#ffe9b8'; ctx.beginPath(); ctx.arc(m.x, my < 225 ? my + 170 : my, m.r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const now = performance.now();
  anims.forEach(a => { if (now - a.t0 > 420) anims.splice(anims.indexOf(a), 1); });
  const lunge = (who: 'p' | 'e') => anims.some(a => a.kind === 'lunge' && a.who === who && now - a.t0 < 300);
  const hurt = (who: 'p' | 'e') => anims.some(a => a.kind === 'hit' && a.who === who && now - a.t0 < 420);
  const sc = view.screen;
  if (sc === 'title') {
    plaque(W / 2 - 210, 228, 420, 58);
    crossedSwords(W / 2, 224, 20);
    ctx.font = 'bold 30px Georgia'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(60,30,8,.85)'; ctx.fillText('ARENA OF BONKS', W / 2, 266);
    ctx.fillStyle = '#ffd23a'; ctx.fillText('ARENA OF BONKS', W / 2, 264);
    pedestal(330, 348, 92); pedestal(470, 348, 92);
    drawGlad(330, 346, view.player, false, false, false);
    drawGlad(470, 346, view.opponent ?? { name: '', skin: '#8a5a3a', tint: '#3f8ce0', armorTier: 0, weapon: 'club' }, true, false, false);
  } else if (sc === 'create') {
    pedestal(PX, 348, 110);
    ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#f3d9c0';
    ctx.fillText('preview: ' + view.player.name, PX, 392);
    drawGlad(PX, 346, view.player, false, false, false);
  } else if (sc === 'hub' || sc === 'shop') {
    pedestal(120, 352, 100);
    drawGlad(120, 350, view.player, false, false, false);
    if (sc === 'shop') { ctx.save(); ctx.translate(690, 330); ctx.scale(1.6, 1.6); drawWeapon('sword', false); ctx.restore(); ctx.save(); ctx.translate(720, 332); ctx.scale(1.6, 1.6); drawWeapon('axe', true); ctx.restore(); }
  } else if (sc === 'arena' || sc === 'defeat') {
    drawGlad(PX, PY, view.player, false, hurt('p'), lunge('p'));
    if (view.opponent) drawGlad(EX, EY, view.opponent, true, hurt('e'), lunge('e'));
    if (view.opponent && sc === 'arena') {
      plaque(PX - 90, 238, 180, 24); plaque(EX - 90, 238, 180, 24);
      ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd23a'; ctx.fillText(view.player.name.slice(0, 18), PX, 255);
      ctx.fillStyle = '#ff9a8a'; ctx.fillText(view.opponent.name.slice(0, 18), EX, 255);
      bar(PX - 80, 266, 160, 10, view.php / view.pmax, '#d84a3a');
      bar(EX - 80, 266, 160, 10, view.opponent.hp / view.opponent.maxHp, '#d84a3a');
    }
    if (sc === 'defeat') {
      ctx.strokeStyle = 'rgba(70,40,20,.45)'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(PX + 40, 366); ctx.quadraticCurveTo(PX - 30, 382, PX - 80, 396); ctx.stroke();
    }
  } else if (sc === 'complete') {
    for (const p of confetti) {
      const cy = (p.y + t * 0.06) % 300, cx = p.x + Math.sin(t / 600 + p.ph) * 14;
      ctx.globalAlpha = 0.8; ctx.fillStyle = p.c; ctx.fillRect(cx, 40 + cy, 4, 7);
    }
    ctx.globalAlpha = 1;
    laurel(W / 2 - 120, 250, 28, '#c9a020'); laurel(W / 2 + 120, 250, 28, '#c9a020');
    pedestal(W / 2, 348, 110);
    drawGlad(W / 2, 346, view.player, false, false, false);
  }
  // floating combat text
  for (const f of floats) {
    const age = now - f.t0;
    if (age > 900) { floats.splice(floats.indexOf(f), 1); continue; }
    ctx.globalAlpha = Math.max(0, 1 - age / 900);
    ctx.font = 'bold 19px Georgia'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(60,20,0,.8)'; ctx.fillText(f.txt, f.x + 1, f.y - age * 0.05 + 1);
    ctx.fillStyle = f.c; ctx.fillText(f.txt, f.x, f.y - age * 0.05);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

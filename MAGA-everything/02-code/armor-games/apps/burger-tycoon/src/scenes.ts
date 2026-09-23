/**
 * Burger Tycoon — pane scenes + gauges (hand-authored Canvas2D, zero assets).
 * Ported from the proto's r1 presentation layer (prototypes/burger-tycoon.html)
 * into the app render — same drawing approach, same satire-deadpan look.
 */

import type { SimState, PaneKey } from './sim';

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---- small hand-drawn icon set (paths only) ---- */
export function icon(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, s: number, col: string): void {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col;
  ctx.lineWidth = Math.max(1.4, s * 0.14); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const u = s / 10;
  switch (name) {
    case 'wheat':
      ctx.beginPath(); ctx.moveTo(0, 5 * u); ctx.lineTo(0, -5 * u); ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const yy = -4 * u + k * 2.6 * u;
        ctx.beginPath(); ctx.ellipse(-1.6 * u, yy, 1.7 * u, 0.9 * u, -0.7, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(1.6 * u, yy, 1.7 * u, 0.9 * u, 0.7, 0, 7); ctx.fill();
      }
      break;
    case 'cow':
      ctx.beginPath(); ctx.ellipse(0, 0.5 * u, 4.6 * u, 2.8 * u, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.arc(4.4 * u, -1.6 * u, 1.7 * u, 0, 7); ctx.fill();
      ctx.fillRect(-3.4 * u, 2.6 * u, 1.1 * u, 2.6 * u); ctx.fillRect(2.2 * u, 2.6 * u, 1.1 * u, 2.6 * u);
      ctx.beginPath(); ctx.moveTo(3.4 * u, -3 * u); ctx.lineTo(2.6 * u, -4 * u);
      ctx.moveTo(5.4 * u, -3 * u); ctx.lineTo(6.2 * u, -4 * u); ctx.stroke();
      break;
    case 'dozer':
      ctx.fillRect(-4.6 * u, 1.6 * u, 6.4 * u, 2.6 * u);
      ctx.fillRect(-3.4 * u, -1.8 * u, 3.4 * u, 3.4 * u);
      ctx.beginPath(); ctx.moveTo(1.8 * u, 0.6 * u); ctx.lineTo(5 * u, -1.6 * u);
      ctx.lineTo(5 * u, 3 * u); ctx.lineTo(1.8 * u, 3 * u); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(-2.8 * u, 4.4 * u, 1 * u, 0, 7); ctx.arc(0.2 * u, 4.4 * u, 1 * u, 0, 7); ctx.fill();
      break;
    case 'cleaver':
      ctx.beginPath(); ctx.moveTo(-4.4 * u, -3.4 * u); ctx.lineTo(2.4 * u, -3.4 * u);
      ctx.lineTo(3.6 * u, 1.4 * u); ctx.lineTo(-4.4 * u, 1.4 * u); ctx.closePath(); ctx.fill();
      ctx.fillRect(2.6 * u, 1 * u, 1.6 * u, 4.4 * u);
      break;
    case 'feedbag':
      ctx.beginPath(); ctx.moveTo(-3.4 * u, 4.6 * u); ctx.lineTo(-2.4 * u, -2.6 * u);
      ctx.lineTo(2.4 * u, -2.6 * u); ctx.lineTo(3.4 * u, 4.6 * u); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2.6 * u, -2.6 * u); ctx.lineTo(2.6 * u, -2.6 * u); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 1 * u, 1.2 * u, 0, 7); ctx.stroke();
      break;
    case 'mega':
      ctx.beginPath(); ctx.moveTo(-4.4 * u, 1.4 * u); ctx.lineTo(3.4 * u, -2.8 * u);
      ctx.lineTo(3.4 * u, 3.4 * u); ctx.lineTo(-4.4 * u, 2.6 * u); ctx.closePath(); ctx.fill();
      ctx.fillRect(-4.8 * u, 0.6 * u, 1.6 * u, 3.2 * u);
      ctx.beginPath(); ctx.moveTo(4.6 * u, -2.4 * u); ctx.lineTo(5.8 * u, -3.4 * u);
      ctx.moveTo(4.8 * u, 0.4 * u); ctx.lineTo(6.2 * u, 0.4 * u); ctx.stroke();
      break;
    case 'megabadge':
      ctx.beginPath(); ctx.moveTo(-4.4 * u, 1.4 * u); ctx.lineTo(2.2 * u, -2.2 * u);
      ctx.lineTo(2.2 * u, 3 * u); ctx.lineTo(-4.4 * u, 2.6 * u); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(3.8 * u, -2.6 * u, 2 * u, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.font = `bold ${Math.round(4 * u)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('*', 3.8 * u, -2.6 * u);
      break;
    case 'burger':
      ctx.beginPath(); ctx.ellipse(0, -1.8 * u, 4.6 * u, 2.4 * u, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(-4.6 * u, -0.6 * u, 9.2 * u, 1.4 * u);
      ctx.beginPath(); ctx.moveTo(-4.4 * u, 1.4 * u);
      for (let k = 0; k < 5; k++) ctx.lineTo(-4.4 * u + (k + 0.5) * 1.76 * u, (k % 2 ? 2.4 : 1.2) * u);
      ctx.lineTo(4.4 * u, 1.4 * u); ctx.stroke();
      ctx.fillRect(-4.2 * u, 3 * u, 8.4 * u, 1.6 * u);
      break;
    case 'cash':
      rr(ctx, -4.6 * u, -3 * u, 9.2 * u, 6 * u, 1 * u); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.font = `bold ${Math.round(5 * u)}px monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0.2 * u);
      break;
    case 'spin':
      ctx.beginPath(); ctx.arc(0, 0, 3.6 * u, 0.6, 4.4); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(3.6 * u * Math.cos(4.4), 3.6 * u * Math.sin(4.4));
      ctx.lineTo(3.6 * u * Math.cos(4.4) - 2.4 * u, 3.6 * u * Math.sin(4.4) - 0.6 * u);
      ctx.lineTo(3.6 * u * Math.cos(4.4) + 0.4 * u, 3.6 * u * Math.sin(4.4) - 2.2 * u);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 3.6 * u, 3.8, 7.0); ctx.stroke();
      break;
    case 'tower':
      ctx.fillRect(-3.4 * u, -4.6 * u, 6.8 * u, 9.2 * u);
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 2; c2++) ctx.fillRect(-2.4 * u + c2 * 3 * u, -3.4 * u + r2 * 2.8 * u, 1.4 * u, 1.4 * u);
      break;
    case 'warn':
      ctx.beginPath(); ctx.moveTo(0, -4.6 * u); ctx.lineTo(4.6 * u, 3.6 * u); ctx.lineTo(-4.6 * u, 3.6 * u); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(-0.6 * u, -2.2 * u, 1.2 * u, 3 * u); ctx.fillRect(-0.6 * u, 1.6 * u, 1.2 * u, 1.2 * u);
      break;
  }
  ctx.restore();
}

/* ---- scene props ---- */
function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, col: string): void {
  ctx.fillStyle = col; ctx.beginPath();
  ctx.arc(x, y, 7 * s, 0, 7); ctx.arc(x + 9 * s, y - 3 * s, 8 * s, 0, 7); ctx.arc(x + 18 * s, y, 6.5 * s, 0, 7);
  ctx.fill();
}
function barn(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#7a2e22'; ctx.fillRect(x, y, w, h);
  ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + w / 2, y - h * 0.55); ctx.lineTo(x + w + 3, y); ctx.closePath();
  ctx.fillStyle = '#5a1f16'; ctx.fill();
  ctx.fillStyle = '#3a140e'; ctx.fillRect(x + w * 0.36, y + h * 0.4, w * 0.28, h * 0.6);
}
function silo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x, y, w, h);
  ctx.beginPath(); ctx.arc(x + w / 2, y, w / 2, Math.PI, 0); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + w * 0.6, y, w * 0.4, h);
}
function cowS(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = '#241a12'; ctx.beginPath(); ctx.ellipse(x, y, 10 * s, 5.5 * s, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 9 * s, y - 3 * s, 3.4 * s, 0, 7); ctx.fill();
  ctx.fillRect(x - 6 * s, y + 4 * s, 2 * s, 4.5 * s); ctx.fillRect(x + 4 * s, y + 4 * s, 2 * s, 4.5 * s);
}
function person(ctx: CanvasRenderingContext2D, x: number, py: number, s: number, col: string): void {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, py - 13 * s, 2.6 * s, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, py - 10 * s); ctx.lineTo(x - 3 * s, py); ctx.lineTo(x + 3 * s, py); ctx.closePath(); ctx.fill();
}
function smokePuff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number): void {
  ctx.fillStyle = `rgba(70,64,60,${a})`;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.arc(x + r * 0.7, y - r * 0.4, r * 0.7, 0, 7); ctx.fill();
}

/* ---- pane scenes (clip before calling; d = dirty engaged) ---- */
export function scFarm(ctx: CanvasRenderingContext2D, st: SimState, x: number, y: number, w: number, h: number, d: boolean): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (d) { g.addColorStop(0, '#e07840'); g.addColorStop(0.55, '#a84828'); g.addColorStop(1, '#5a2a1a'); }
  else { g.addColorStop(0, '#8fd0e8'); g.addColorStop(0.6, '#cfe8c8'); g.addColorStop(1, '#e8e0b0'); }
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  if (!d) { ctx.fillStyle = '#f4e2a0'; ctx.beginPath(); ctx.arc(x + w - 52, y + 30, 16, 0, 7); ctx.fill(); }
  else {
    ctx.fillStyle = '#ff9a50'; ctx.beginPath(); ctx.arc(x + w - 52, y + 30, 14, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,40,.25)'; ctx.beginPath(); ctx.arc(x + w - 52, y + 30, 22, 0, 7); ctx.fill();
  }
  const ct = st.t * (d ? 4 : 9);
  cloud(ctx, x + ((ct * 1.3) % (w + 80)) - 40, y + 26, 1.1, d ? 'rgba(90,60,50,.5)' : 'rgba(255,255,255,.85)');
  cloud(ctx, x + ((ct * 0.8 + 140) % (w + 80)) - 40, y + 48, 0.8, d ? 'rgba(90,60,50,.4)' : 'rgba(255,255,255,.7)');
  ctx.fillStyle = d ? '#2a1a12' : '#4a7a3a';
  ctx.beginPath(); ctx.moveTo(x, y + h * 0.55);
  for (let i = 0; i <= 16; i++) ctx.lineTo(x + i * w / 16, y + h * 0.55 - ((i * 37) % 13));
  ctx.lineTo(x + w, y + h * 0.55); ctx.lineTo(x + w, y + h * 0.62); ctx.lineTo(x, y + h * 0.62); ctx.closePath(); ctx.fill();
  barn(ctx, x + 18, y + h * 0.42, 52, 34); silo(ctx, x + 76, y + h * 0.34, 16, 52);
  ctx.fillStyle = d ? '#6a4a28' : '#7a9a4a'; ctx.fillRect(x, y + h * 0.62, w, h * 0.38);
  for (let r = 0; r < 4; r++) {
    const ry = y + h * 0.68 + r * h * 0.085;
    for (let i = 0; i < 14; i++) {
      const px = x + 14 + i * (w - 28) / 13, sway = Math.sin(st.t * 1.6 + i * 0.7 + r) * 2;
      ctx.strokeStyle = d ? '#5a4a20' : '#3f7a2e'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px, ry + 8); ctx.quadraticCurveTo(px + sway, ry + 2, px + sway * 1.4, ry - 4); ctx.stroke();
      ctx.fillStyle = d ? '#8a7a30' : '#5a9a3a';
      ctx.beginPath(); ctx.ellipse(px + sway * 1.4, ry - 5, 2.6, 1.6, sway * 0.1, 0, 7); ctx.fill();
    }
  }
  if (d) {
    for (let i = 0; i < 3; i++) {
      const bx = x + 40 + i * 90;
      for (let k = 0; k < 4; k++) {
        const ph = (st.t * 0.5 + k * 0.25 + i * 0.13) % 1;
        smokePuff(ctx, bx + Math.sin(ph * 6 + i) * 8, y + h * 0.5 - ph * 70, 6 + ph * 14, 0.5 * (1 - ph));
      }
    }
    for (let i = 0; i < 10; i++) {
      const ph = (st.t * 0.9 + i * 0.31) % 1;
      ctx.fillStyle = `rgba(255,${140 + ((i * 53) % 80)},40,${0.8 * (1 - ph)})`;
      ctx.fillRect(x + ((i * 67) % w) + Math.sin(ph * 9) * 6, y + h * 0.6 - ph * h * 0.5, 2.4, 2.4);
    }
    ctx.fillStyle = 'rgba(60,20,10,.25)'; ctx.fillRect(x, y, w, h);
  }
}

export function scFeed(ctx: CanvasRenderingContext2D, st: SimState, x: number, y: number, w: number, h: number, d: boolean): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (d) { g.addColorStop(0, '#9aa0a0'); g.addColorStop(1, '#787c74'); }
  else { g.addColorStop(0, '#c8d8d0'); g.addColorStop(1, '#a8b8a0'); }
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#8a7a58'; ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
  if (d) {
    for (let i = 0; i < 2; i++) {
      const sx = x + w - 70 + i * 44;
      ctx.fillStyle = '#4a4440'; ctx.fillRect(sx, y + h * 0.18, 16, h * 0.42);
      ctx.fillStyle = '#5a5450'; ctx.fillRect(sx - 3, y + h * 0.18, 22, 6);
      for (let k = 0; k < 3; k++) {
        const ph = (st.t * 0.4 + k * 0.33 + i * 0.2) % 1;
        smokePuff(ctx, sx + 8 + Math.sin(ph * 5 + i) * 10, y + h * 0.16 - ph * 56, 5 + ph * 12, 0.45 * (1 - ph));
      }
    }
    ctx.fillStyle = 'rgba(120,120,110,.22)'; ctx.fillRect(x, y, w, h * 0.6);
  }
  ctx.strokeStyle = '#6a5238'; ctx.lineWidth = 3;
  for (let r = 0; r < 3; r++) {
    const ry = y + h * 0.52 + r * 9;
    ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x + w, ry); ctx.stroke();
  }
  for (let i = 0; i <= 8; i++) {
    const px = x + i * w / 8;
    ctx.beginPath(); ctx.moveTo(px, y + h * 0.5); ctx.lineTo(px, y + h * 0.5 + 26); ctx.stroke();
  }
  const n = Math.min(7, 3 + Math.floor(st.cattle / 8));
  for (let i = 0; i < n; i++) {
    const px = x + 30 + ((i * 97) % (w - 70)), py = y + h * 0.72 + ((i * 31) % (h * 0.2));
    const bob = Math.sin(st.t * 2 + i * 1.7) * 1.5;
    cowS(ctx, px, py + bob, 0.9 + (i % 3) * 0.15);
  }
  ctx.fillStyle = '#5a4630'; ctx.fillRect(x + 14, y + h * 0.86, 70, 10);
  ctx.fillStyle = '#c8a860'; ctx.fillRect(x + 16, y + h * 0.86 + 2, 66, 4);
  if (st.disease > 8) {
    for (let i = 0; i < 4; i++) {
      const ph = (st.t * 0.6 + i * 0.27) % 1;
      ctx.strokeStyle = `rgba(120,180,60,${0.5 * (1 - ph)})`; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x + 40 + i * 60, y + h * 0.7);
      ctx.quadraticCurveTo(x + 40 + i * 60 + Math.sin(ph * 8) * 8, y + h * 0.7 - ph * 30, x + 40 + i * 60 + Math.sin(ph * 8 + 1) * 10, y + h * 0.7 - ph * 44);
      ctx.stroke();
    }
  }
}

const floats: { x: number; y: number; t0: number }[] = [];
let lastFloatT = -9;

export function scRest(ctx: CanvasRenderingContext2D, st: SimState, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#f0c890'); g.addColorStop(1, '#d8a060');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#7a6a58'; ctx.fillRect(x, y + h * 0.80, w, h * 0.20);
  const bx = x + 34, bw = w - 68, by = y + h * 0.30, bh = h * 0.50;
  ctx.fillStyle = '#8a2f26'; ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = 'rgba(0,0,0,.15)';
  for (let i = 1; i < 5; i++) ctx.fillRect(bx, by + i * bh / 5, bw, 1.5);
  ctx.fillStyle = '#3a2a20'; ctx.fillRect(bx - 6, by - 16, bw + 12, 18);
  ctx.fillStyle = '#ffb224'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
  ctx.fillText('BURGER BAR', bx + bw / 2, by - 3); ctx.textAlign = 'left';
  const ax = bx - 8, aw = bw + 16, ay = by + 18;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#e8dcc0' : '#c8352a';
    ctx.fillRect(ax + i * aw / 8, ay, aw / 8, 16);
    ctx.beginPath(); ctx.arc(ax + (i + 0.5) * aw / 8, ay + 16, aw / 16, 0, Math.PI); ctx.fill();
  }
  const wx = bx + 14, wy = ay + 26, ww = bw - 88, wh = by + bh - wy - 8;
  const winG = ctx.createLinearGradient(0, wy, 0, wy + wh);
  winG.addColorStop(0, '#ffd890'); winG.addColorStop(1, '#c89040');
  ctx.fillStyle = 'rgba(255,220,140,.3)'; ctx.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
  ctx.fillStyle = winG; ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = '#5a3a20'; ctx.fillRect(wx + 6, wy + wh - 14, ww - 12, 8);
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(bx + bw - 58, wy, 44, wh);
  for (let i = 0; i < 3; i++) {
    const ph = (st.t * 0.5 + i * 0.33) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * (1 - ph)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(wx + 14 + i * 16, wy - 2);
    ctx.quadraticCurveTo(wx + 14 + i * 16 + Math.sin(ph * 7) * 6, wy - 10 - ph * 14, wx + 14 + i * 16 + Math.sin(ph * 7 + 1) * 8, wy - 18 - ph * 18);
    ctx.stroke();
  }
  const q = Math.min(7, 1 + Math.round(st.demand * 2));
  for (let i = 0; i < q; i++) {
    const px = bx + bw - 46 - i * 22, py = y + h * 0.86 + ((i * 11) % 5);
    person(ctx, px, py + Math.sin(st.t * 2.2 + i) * 1.2, 1.15,
      ['#2a3450', '#5a2a2a', '#2a4a2a', '#4a3a1a', '#3a2a4a', '#1a3a4a', '#503030'][i % 7]);
  }
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(bx + bw - 24, by + bh - 30, 20, 30);
  if (st.lastProfit > st.overheadNow && floats.length < 9 && st.t - lastFloatT > 0.5) {
    lastFloatT = st.t;
    floats.push({ x: x + 70 + Math.random() * (w - 140), y: y + 40, t0: st.t });
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i], age = st.t - f.t0;
    if (age > 1.6) { floats.splice(i, 1); continue; }
    ctx.fillStyle = `rgba(30,140,60,${0.9 * (1 - age / 1.6)})`; ctx.font = 'bold 13px monospace';
    ctx.fillText('+$', f.x, f.y - age * 26);
  }
}

export function scHQ(ctx: CanvasRenderingContext2D, st: SimState, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#0c1226'); g.addColorStop(1, '#1c2a4a');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#e8e8f0';
  for (let i = 0; i < 26; i++) {
    const sx = x + ((i * 67) % w), sy = y + ((i * 41) % Math.floor(h * 0.5));
    ctx.globalAlpha = 0.3 + ((i * 29) % 50) / 100;
    ctx.fillRect(sx, sy, 1.6, 1.6);
  }
  ctx.globalAlpha = 1;
  const tx = x + w * 0.30, tw = w * 0.40, ty = y + 14, th = h * 0.62;
  ctx.fillStyle = '#141c30'; ctx.fillRect(tx, ty, tw, th);
  ctx.fillStyle = '#1c2740'; ctx.fillRect(tx + tw * 0.55, ty, tw * 0.45, th);
  for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) {
    const lit = (((r * 7 + c * 13) % 5) < 2 ? 1 : 0) ^ ((Math.floor(st.t * 0.5) + r + c) % 11 === 0 ? 1 : 0);
    ctx.fillStyle = lit ? '#ffd27a' : '#232c44';
    ctx.fillRect(tx + 8 + c * (tw - 16) / 4, ty + 10 + r * (th - 20) / 7, (tw - 16) / 4 - 6, (th - 20) / 7 - 5);
  }
  ctx.fillStyle = Math.sin(st.t * 3) > 0 ? '#ff5050' : '#5a1a1a';
  ctx.beginPath(); ctx.arc(tx + tw / 2, ty - 4, 3, 0, 7); ctx.fill();
  ctx.fillStyle = '#0a0e18'; ctx.fillRect(x, y + h * 0.76, w, h * 0.24);
  ctx.fillStyle = '#101828'; ctx.fillRect(x, y + h * 0.68, w, h * 0.08 + 8);
  const msg = st.lastProfit > st.overheadNow ? '^ PROFIT BEATS OVERHEAD — BOARD PLEASED' : 'v PROFIT BELOW OVERHEAD — BOARD UNEASY';
  const tcol = st.lastProfit > st.overheadNow ? '#51cf66' : '#ff6b6b';
  const ty2 = y + h * 0.68;
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(x, ty2, w, 16);
  ctx.save(); ctx.beginPath(); ctx.rect(x, ty2, w, 16); ctx.clip();
  ctx.font = 'bold 11px monospace';
  const tw2 = ctx.measureText(msg).width + 60, off = (st.t * 46) % tw2;
  ctx.fillStyle = tcol;
  for (let k = 0; k < 3; k++) ctx.fillText(msg, x + w - off + k * tw2, ty2 + 12);
  ctx.restore();
  if (st.boardPressure > 0) {
    ctx.fillStyle = `rgba(200,30,30,${0.22 * (st.boardPressure / 100) * (0.6 + 0.4 * Math.sin(st.t * 4))})`;
    ctx.fillRect(x, y, w, h);
  }
}

export const SCENES: Record<PaneKey, (ctx: CanvasRenderingContext2D, st: SimState, x: number, y: number, w: number, h: number, d?: boolean) => void> = {
  farm: (c, s, x, y, w, h, d) => scFarm(c, s, x, y, w, h, !!d),
  feed: (c, s, x, y, w, h, d) => scFeed(c, s, x, y, w, h, !!d),
  rest: (c, s, x, y, w, h) => scRest(c, s, x, y, w, h),
  hq: (c, s, x, y, w, h) => scHQ(c, s, x, y, w, h),
};

/* ---- gauges ---- */
const meterPrev: Record<string, number> = {};
const meterAnim: Record<string, number> = {};
const meterFill: Record<string, CanvasGradient> = {};
const meterSheen: Record<string, CanvasGradient> = {};

function meterGrad(ctx: CanvasRenderingContext2D, col: string, w: number): CanvasGradient {
  const k = col + w;
  return meterFill[k] || (meterFill[k] = (() => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, col); g.addColorStop(1, '#ffd27a');
    return g;
  })());
}

export function meter(ctx: CanvasRenderingContext2D, st: SimState, x: number, y: number, w: number, v: number, max: number, col: string, label: string): void {
  const pv = meterPrev[label];
  if (pv !== undefined && Math.floor(pv) !== Math.floor(v)) meterAnim[label] = st.t;
  meterPrev[label] = v;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, x + 1, y + 2, w, 16, 4); ctx.fill();
  ctx.fillStyle = '#1a1d22'; rr(ctx, x, y, w, 16, 4); ctx.fill();
  ctx.strokeStyle = '#3a3f48'; ctx.lineWidth = 1; rr(ctx, x, y, w, 16, 4); ctx.stroke();
  const f = Math.min(1, Math.max(0, v / max));
  if (f > 0.005) {
    ctx.save(); rr(ctx, x, y, w, 16, 4); ctx.clip();
    ctx.fillStyle = meterGrad(ctx, col, w); ctx.fillRect(x, y, w * f, 16);
    const sk = 'sh' + y;
    if (!meterSheen[sk]) {
      const g = ctx.createLinearGradient(0, y, 0, y + 16);
      g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(0.5, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
      meterSheen[sk] = g;
    }
    ctx.fillStyle = meterSheen[sk]; ctx.fillRect(x, y, w * f, 16);
    const a = st.t - (meterAnim[label] ?? -9);
    if (a < 0.7) {
      const sx = x + w * f - 30 + a * 90;
      ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - a / 0.7)})`; ctx.fillRect(sx, y, 10, 16);
    }
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  for (let i = 1; i < 4; i++) ctx.fillRect(x + w * i / 4, y + 2, 1, 12);
  ctx.fillStyle = 'rgba(255,80,80,.7)'; ctx.fillRect(x + w - 2, y + 1, 2, 14);
  ctx.font = 'bold 11px monospace';
  ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineWidth = 3;
  ctx.strokeText(`${label} ${v.toFixed(0)}`, x + 6, y + 12);
  ctx.fillStyle = '#f2eee0'; ctx.fillText(`${label} ${v.toFixed(0)}`, x + 6, y + 12);
}

/* ---- action cards ---- */
let hazPat: CanvasPattern | null = null;

export function cardStyle(ctx: CanvasRenderingContext2D): { clean: CanvasGradient; dirty: CanvasGradient } {
  const cardGC = ctx.createLinearGradient(0, 0, 0, 48);
  cardGC.addColorStop(0, '#5d7ea8'); cardGC.addColorStop(1, '#3c5a80');
  const cardGD = ctx.createLinearGradient(0, 0, 0, 48);
  cardGD.addColorStop(0, '#4a3a20'); cardGD.addColorStop(1, '#33270f');
  return { clean: cardGC, dirty: cardGD };
}

export function hazardPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (hazPat) return hazPat;
  const hazCv = document.createElement('canvas');
  hazCv.width = hazCv.height = 16;
  const h = hazCv.getContext('2d')!;
  h.fillStyle = '#241d12'; h.fillRect(0, 0, 16, 16);
  h.strokeStyle = '#8a6a1a'; h.lineWidth = 4;
  h.beginPath(); h.moveTo(-4, 20); h.lineTo(20, -4); h.moveTo(4, 28); h.lineTo(28, 4); h.stroke();
  hazPat = ctx.createPattern(hazCv, 'repeat');
  return hazPat;
}

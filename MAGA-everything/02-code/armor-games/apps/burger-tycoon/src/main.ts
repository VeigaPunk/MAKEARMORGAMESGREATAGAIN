import { Input, Sfx, fitIntegerScale, letterboxOffset, viewport, load, save } from '@maga/arcade-core';
import { Sim, PANES, type PaneKey } from './sim';

/**
 * Burger Tycoon — native replica (Canvas2D + DOM chrome).
 * Sim is ported 1:1 from maga-proto's verified mechanics proof; all numbers
 * are DECLARED GUESSES (TBD ARCADE). Burger Tycoon branding only — no
 * McDonald's marks anywhere in this build (spec §Acceptance hook 5).
 */

const W = 960;
const H = 420;

// ---- DOM chrome (spec: DOM chrome OK for panels) ----
const wrap = document.getElementById('wrap')!;
const hudEl = document.getElementById('hud')!;
const tabsEl = document.getElementById('tabs')!;
const logEl = document.getElementById('log')!;
const badgeEl = document.querySelector<HTMLElement>('.badge');
const muteBtn = document.getElementById('mute');

const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
wrap.insertBefore(cv, logEl);
const ctx = cv.getContext('2d')!;

// ---- arcade-core services ----
let cachedScale = 1;
const toLogical = (cx: number, cy: number) => ({ x: cx / cachedScale, y: cy / cachedScale });
const input = new Input();
input.attach(cv, toLogical);
const sfx = new Sfx();
// pane hotkeys 1–4 (TBD ARCADE): Digit1-3 are slot1-3 in defaults; bind Digit4
// to 'action' so all four panes are keyboard-reachable.
input.setKeymaps({ p1: { Digit4: 'action' } });

if (muteBtn) {
  const paint = () => { muteBtn.textContent = sfx.muted ? 'SOUND OFF' : 'SOUND ON'; };
  muteBtn.addEventListener('click', () => { sfx.muted = !sfx.muted; paint(); });
  paint();
}

// ---- layout: integer letterbox inside the DOM chrome ----
function layout(): void {
  const vp = viewport();
  const badgeH = badgeEl?.offsetHeight ?? 0;
  if (muteBtn) muteBtn.style.top = `${badgeH + 4}px`;
  const chromeH = hudEl.offsetHeight + tabsEl.offsetHeight + logEl.offsetHeight;
  const avail = { width: vp.width, height: vp.height - badgeH - chromeH };
  const s = fitIntegerScale(W, H, avail, 4);
  const off = letterboxOffset(W, H, s, avail);
  cachedScale = s;
  wrap.style.width = `${W * s}px`;
  wrap.style.left = `${off.x}px`;
  wrap.style.top = `${off.y + badgeH}px`;
  cv.style.width = `${W * s}px`;
  cv.style.height = `${H * s}px`;
}
window.addEventListener('resize', layout);

// ---- game state ----
const sim = new Sim();
sim.reset();
let pane = 0;
let best = load('burger-tycoon', 'best-time', 0);
let musicStarted = false;
let prevPointerActive = false;
let prevBacklash = 0;
let renderedEvents = -1;

interface Hit { x: number; y: number; w: number; h: number; fn: () => void }
let hits: Hit[] = [];

PANES.forEach((p, i) => {
  const b = document.createElement('button');
  b.textContent = `${i + 1} ${p.title}`;
  b.addEventListener('click', () => { pane = i; sfx.preset('ui'); });
  tabsEl.appendChild(b);
});

function setPane(i: number): void {
  pane = Math.max(0, Math.min(PANES.length - 1, i));
}

function startMusicOnce(): void {
  if (musicStarted) return;
  musicStarted = true;
  // placeholder Muzak bed — MAESTRO owns the real recipe (spec §Audio needs)
  sfx.startMusic([196, 0, 0, 147, 0, 0, 165, 0, 196, 0, 0, 131, 0, 0, 0, 0], 320);
}

function restart(): void {
  sim.reset();
  prevBacklash = 0;
  sfx.preset('ui');
}

// ---- input ----
function pollInput(): void {
  const p = input.pointer;
  if (input.wasPressed('slot1')) setPane(0);
  else if (input.wasPressed('slot2')) setPane(1);
  else if (input.wasPressed('slot3')) setPane(2);
  else if (input.wasPressed('action')) setPane(3);

  // release-tap semantics (proto used click): fires once at the tap position
  if (p.tapped) {
    startMusicOnce();
    if (sim.s.over) {
      restart();
    } else {
      for (const h of hits) {
        if (p.x > h.x && p.x < h.x + h.w && p.y > h.y && p.y < h.y + h.h) { h.fn(); break; }
      }
    }
  }

  if (sim.s.over && (input.wasPressed('fire') || input.wasPressed('action'))) restart();
}

// ---- render ----
function meter(x: number, y: number, w: number, v: number, max: number, col: string, label: string): void {
  ctx.fillStyle = '#999'; ctx.fillRect(x, y, w, 14);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.min(1, v / max), 14);
  ctx.fillStyle = '#222'; ctx.font = '12px monospace';
  ctx.fillText(`${label} ${v.toFixed(0)}`, x + 4, y + 11);
}

function draw(): void {
  const s = sim.s;
  [...tabsEl.children].forEach((b, i) => (b as HTMLElement).className = i === pane ? 'on' : '');
  hudEl.innerHTML =
    `<span>CASH <b>$${s.cash.toFixed(0)}</b></span><span>REP <b>${s.rep.toFixed(0)}</b></span>` +
    `<span>BACKLASH <b>${s.backlash.toFixed(0)}</b></span><span>BOARD <b>${s.boardPressure.toFixed(0)}</b></span>` +
    `<span>DEMAND <b>${s.demand.toFixed(1)}x</b></span><span>PROFIT <b>$${s.lastProfit.toFixed(1)}/s</b></span>` +
    `<span>OVERHEAD <b>-$${s.rates.overhead}/s</b></span><span>TIME <b>${s.t.toFixed(0)}s</b></span>` +
    `<span>BEST <b>${best.toFixed(0)}s</b></span>`;

  if (renderedEvents !== sim.events.length) {
    renderedEvents = sim.events.length;
    logEl.innerHTML = sim.events.map((e) => `<div>${e}</div>`).join('');
  }

  ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#222'; ctx.font = 'bold 22px monospace';
  ctx.fillText(PANES[pane].title, 24, 40);

  hits = [];
  const paneKey = PANES[pane].key;
  sim.actions[paneKey].forEach((a, i) => {
    const y = 80 + i * 64;
    ctx.fillStyle = a.dirty ? '#8b2c2c' : '#4a6fa5';
    ctx.fillRect(24, y, 560, 48);
    ctx.fillStyle = '#fff'; ctx.font = '15px monospace';
    ctx.fillText(a.label, 40, y + 30);
    hits.push({ x: 24, y, w: 560, h: 48, fn: () => { if (sim.act(paneKey, i) !== null) sfx.preset('ui'); } });
  });

  ctx.font = '14px monospace'; ctx.fillStyle = '#222';
  if (paneKey === 'farm') {
    meter(620, 80, 300, s.crops, 100, '#2b8a3e', 'CROPS');
    meter(620, 110, 300, s.cattle, 50, '#a0522d', 'CATTLE');
    if (s.dirty.deforest) ctx.fillText('rainforest burning…', 620, 160);
  }
  if (paneKey === 'feed') {
    meter(620, 80, 300, s.patties, 60, '#d6336c', 'PATTIES');
    meter(620, 110, 300, s.cattle, 50, '#a0522d', 'CATTLE');
    meter(620, 140, 300, s.disease, 20, '#e8590c', 'DISEASE RISK');
  }
  if (paneKey === 'rest') {
    meter(620, 80, 300, s.patties, 60, '#d6336c', 'PATTY STOCK');
    meter(620, 110, 300, s.demand, 3, '#1971c2', 'DEMAND');
  }
  if (paneKey === 'hq') {
    meter(620, 80, 300, s.backlash, 100, '#e8590c', 'BACKLASH');
    meter(620, 110, 300, s.boardPressure, 100, '#c2255c', 'BOARD PRESSURE');
  }

  ctx.fillStyle = '#666'; ctx.font = '12px monospace';
  ctx.fillText('Click actions · keys 1-4 switch panes · sim runs while idle — INTERNAL replica', 24, H - 14);

  if (s.over) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 140, W, 140);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 26px monospace'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, 190);
    ctx.font = '15px monospace';
    ctx.fillText(s.overReason, W / 2, 220);
    ctx.fillText(`survived ${s.t.toFixed(0)}s · best ${best.toFixed(0)}s — click / tap / SPACE to restart`, W / 2, 250);
    ctx.textAlign = 'left';
  }
}

// ---- main loop ----
let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  pollInput();
  input.endFrame();
  sim.tick(dt);
  // backlash alarm on upward crossings (spec: alarm when backlash rises)
  if (sim.s.backlash > 60 && prevBacklash <= 60) sfx.preset('hit');
  prevBacklash = sim.s.backlash;
  if (sim.s.over && sim.s.t > best) {
    best = sim.s.t;
    save('burger-tycoon', 'best-time', best);
  }
  draw();
  requestAnimationFrame(frame);
}

layout();
requestAnimationFrame(frame);

// PROOF/debug hook (not gameplay)
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __maga: unknown }).__maga = { sim, setPane, input, sfx };
}

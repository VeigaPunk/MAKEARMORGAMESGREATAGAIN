import { Input, Sfx, fitIntegerScale, letterboxOffset, viewport, load, save } from '@maga/arcade-core';
import { Sim, PANES, type PaneKey } from './sim';
import { drawWordmark } from './icons';
import { rr, icon, meter, cardStyle, hazardPattern, SCENES } from './scenes';
import { startMuzak, playCue, ACTION_CUES, type Cue } from './audio';

/**
 * Burger Tycoon — native replica (Canvas2D + DOM chrome).
 * Sim ported 1:1 from maga-proto's verified mechanics proof; constants tuned
 * 2026-09-23 (rationale: ship-records/burger-tycoon.md). Art ported from the
 * proto's r1 presentation layer. Burger Tycoon branding only — no McDonald's
 * marks anywhere in this build (spec §Acceptance hook 5).
 *
 * States: title -> play <-> pause -> over -> (retry | title). Every state
 * has an exit. Settings (music/SFX volume + mute) persist in localStorage.
 */

const W = 960;
const H = 420;

// ---- DOM chrome (spec: DOM chrome OK for panels) ----
const wrap = document.getElementById('wrap')!;
const hudEl = document.getElementById('hud')!;
const statsEl = document.getElementById('stats')!;
const tabsEl = document.getElementById('tabs')!;
const logEl = document.getElementById('log')!;
const badgeEl = document.querySelector<HTMLElement>('.badge');
const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const settingsEl = document.getElementById('settings')!;
const volMusicEl = document.getElementById('vol-music') as HTMLInputElement;
const volSfxEl = document.getElementById('vol-sfx') as HTMLInputElement;
const muteBoxEl = document.getElementById('mute-box') as HTMLInputElement;
const settingsCloseEl = document.getElementById('settings-close') as HTMLButtonElement;

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
// pane hotkeys 1–4: Digit1-3 are slot1-3 in defaults; bind Digit4 to 'action'
// so all four panes are keyboard-reachable.
input.setKeymaps({ p1: { Digit4: 'action' } });

// ---- audio settings (persisted, app-prefixed key) ----
interface AudioSettings { master: number; music: number; sfx: number; muted: boolean }
let audioSettings = load<AudioSettings>('burger-tycoon', 'audio', { master: 0.9, music: 0.7, sfx: 0.85, muted: false });
function applyAudio(): void {
  sfx.volume = audioSettings.master;
  sfx.musicVolume = audioSettings.music;
  sfx.sfxVolume = audioSettings.sfx;
  sfx.muted = audioSettings.muted;
  volMusicEl.value = String(Math.round(audioSettings.music * 100));
  volSfxEl.value = String(Math.round(audioSettings.sfx * 100));
  muteBoxEl.checked = audioSettings.muted;
  save('burger-tycoon', 'audio', audioSettings);
}
volMusicEl.addEventListener('input', () => { audioSettings.music = Number(volMusicEl.value) / 100; applyAudio(); });
volSfxEl.addEventListener('input', () => { audioSettings.sfx = Number(volSfxEl.value) / 100; applyAudio(); playCue(sfx, 'click'); });
muteBoxEl.addEventListener('change', () => { audioSettings.muted = muteBoxEl.checked; applyAudio(); });
settingsCloseEl.addEventListener('click', () => { settingsEl.classList.add('hidden'); playCue(sfx, 'click'); });
function openSettings(): void { settingsEl.classList.remove('hidden'); playCue(sfx, 'click'); }
settingsBtn.addEventListener('click', openSettings);

// ---- layout: integer letterbox inside the DOM chrome ----
function layout(): void {
  const vp = viewport();
  const badgeH = badgeEl?.offsetHeight ?? 0;
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
type Mode = 'title' | 'play' | 'pause';
let mode: Mode = 'title';
const sim = new Sim();
sim.reset();
let pane = 0;
let best = load('burger-tycoon', 'best-time', 0);
let musicStarted = false;
let overHandled = false;
let prevEff = 0;
let renderedEvents = '';

const PANE_ICON: PaneKey[] = ['farm', 'feed', 'rest', 'hq'];
const ACT_ICON: Record<PaneKey, string[]> = {
  farm: ['wheat', 'cow', 'dozer'], feed: ['cleaver', 'feedbag'],
  rest: ['mega', 'burger'], hq: ['megabadge', 'spin', 'cash'],
};
const DIRTY_FLAG: Record<PaneKey, 'deforest' | 'cheapFeed' | 'cutCorners' | null> = {
  farm: 'deforest', feed: 'cheapFeed', rest: 'cutCorners', hq: null,
};

interface Hit { x: number; y: number; w: number; h: number; fn: () => void }
let hits: Hit[] = [];

PANES.forEach((p, i) => {
  const b = document.createElement('button');
  b.textContent = `${i + 1} ${p.title}`;
  b.addEventListener('click', () => { setPane(i); if (mode === 'play') playCue(sfx, 'click'); });
  tabsEl.appendChild(b);
});

function setPane(i: number): void {
  pane = Math.max(0, Math.min(PANES.length - 1, i));
}

function startMusicOnce(): void {
  if (musicStarted) return;
  musicStarted = true;
  startMuzak(sfx);
}

function startRun(): void {
  sim.reset();
  overHandled = false;
  prevEff = 0;
  mode = 'play';
  startMuzak(sfx);
  playCue(sfx, 'start');
}

function quitToTitle(): void {
  mode = 'title';
  settingsEl.classList.add('hidden');
  playCue(sfx, 'click');
}

pauseBtn.addEventListener('click', () => {
  if (mode === 'play' && !sim.s.over) { mode = 'pause'; playCue(sfx, 'click'); }
  else if (mode === 'pause') { mode = 'play'; playCue(sfx, 'click'); }
});

// ---- input ----
function pressAction(key: PaneKey, idx: number): void {
  const label = sim.act(key, idx);
  if (label === null) return;
  let cue = ACTION_CUES[key][idx];
  if (cue === null) cue = simIsDirtyOn(key, idx) ? 'dirtyOn' : 'dirtyOff';
  playCue(sfx, cue);
}

function simIsDirtyOn(key: PaneKey, idx: number): boolean {
  const flag = DIRTY_FLAG[key];
  return flag !== null && sim.s.dirty[flag] === 1;
}

function pollInput(): void {
  if (input.wasPressed('slot1')) setPane(0);
  else if (input.wasPressed('slot2')) setPane(1);
  else if (input.wasPressed('slot3')) setPane(2);
  else if (input.wasPressed('action') && mode !== 'title') setPane(3);

  if (input.wasPressed('pause') && (mode === 'play' || mode === 'pause') && !sim.s.over) {
    mode = mode === 'play' ? 'pause' : 'play';
    playCue(sfx, 'click');
  }

  const p = input.pointer;
  if (p.tapped) {
    startMusicOnce();
    for (const h of hits) {
      if (p.x > h.x && p.x < h.x + h.w && p.y > h.y && p.y < h.y + h.h) { h.fn(); break; }
    }
  }
  if (mode === 'title' && (input.wasPressed('fire'))) startRun();
}

// ---- render helpers ----
function effBacklash(): number {
  return Math.min(100, sim.s.backlash + sim.s.blStain);
}

function button(x: number, y: number, w: number, h: number, label: string, fn: () => void, accent = false): void {
  ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(ctx, x + 2, y + 3, w, h, 8); ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (accent) { g.addColorStop(0, '#7a5a18'); g.addColorStop(1, '#5a3f10'); }
  else { g.addColorStop(0, '#3c5a80'); g.addColorStop(1, '#2c4260'); }
  ctx.fillStyle = g; rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = accent ? '#ffb224' : '#5d7ea8'; ctx.lineWidth = 2; rr(ctx, x, y, w, h, 8); ctx.stroke();
  ctx.fillStyle = '#f4f8ff'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 6); ctx.textAlign = 'left';
  hits.push({ x, y, w, h, fn });
}

function actionTitle(key: PaneKey, idx: number): string {
  const a = sim.actions[key][idx];
  if (key === 'hq' && idx === 1) return `PR spin (-$${sim.prCost()})`;
  if (key === 'hq' && idx === 2) return `Bribe (-$${sim.bribeCost()})`;
  return a.short;
}

// ---- pane render ----
function drawCard(key: PaneKey, idx: number, x: number, y: number, w: number, h: number, grid: boolean): void {
  const a = sim.actions[key][idx];
  const flag = DIRTY_FLAG[key];
  const active = a.dirty && flag !== null && sim.s.dirty[flag] === 1;
  const style = cardStyle(ctx);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, x + 3, y + 4, w, h, 8); ctx.fill();
  if (a.dirty) {
    ctx.save(); rr(ctx, x, y, w, h, 8); ctx.clip();
    ctx.fillStyle = hazardPattern(ctx) ?? '#33270f'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = style.dirty; ctx.globalAlpha = 0.82; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
    ctx.restore();
  } else {
    ctx.fillStyle = style.clean; rr(ctx, x, y, w, h, 8); ctx.fill();
  }
  ctx.strokeStyle = a.dirty ? '#7a5a18' : '#2c4a70'; ctx.lineWidth = 2; rr(ctx, x, y, w, h, 8); ctx.stroke();
  const chip = grid ? 24 : 34, ch = grid ? h - 12 : 32;
  ctx.fillStyle = a.dirty ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.12)';
  rr(ctx, x + 10, y + (h - ch) / 2, chip, ch, 6); ctx.fill();
  icon(ctx, ACT_ICON[key][idx], x + 10 + chip / 2, y + h / 2, grid ? 8 : 10, a.dirty ? '#ffb224' : '#eaf2ff');
  ctx.fillStyle = a.dirty ? '#ffd9a0' : '#f4f8ff';
  if (grid) {
    ctx.font = 'bold 10px monospace';
    ctx.fillText(actionTitle(key, idx), x + 10 + chip + 8, y + h / 2 + 4);
  } else {
    ctx.font = 'bold 14px monospace';
    ctx.fillText(actionTitle(key, idx), x + 10 + chip + 8, y + 20);
    ctx.fillStyle = a.dirty ? '#e8c890' : '#c8d8e8'; ctx.font = '10px monospace';
    ctx.fillText(a.detail, x + 10 + chip + 8, y + 36);
  }
  if (a.dirty) {
    icon(ctx, 'warn', x + w - 18, y + h / 2, grid ? 7 : 9, active ? '#ffb224' : '#8a7040');
    if (active) {
      const pl = 0.5 + 0.5 * Math.sin(sim.s.t * 5);
      ctx.strokeStyle = `rgba(255,178,36,${0.4 + 0.5 * pl})`; ctx.lineWidth = 2.5; rr(ctx, x, y, w, h, 8); ctx.stroke();
      ctx.fillStyle = `rgba(255,178,36,${0.7 + 0.3 * pl})`; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'right';
      ctx.fillText('ENGAGED', x + w - (grid ? 26 : 30), y + (grid ? 11 : 13)); ctx.textAlign = 'left';
    }
  }
  hits.push({
    x, y, w, h,
    fn: () => { if (mode === 'play' && !sim.s.over) pressAction(key, idx); },
  });
}

function drawMeters(key: PaneKey, x: number, y: number, w: number): number {
  const s = sim.s;
  let n = 0;
  const my = (i: number) => y + i * 21;
  if (key === 'farm') {
    meter(ctx, s, x, my(0), w, s.crops, 100, '#2b8a3e', 'CROPS');
    meter(ctx, s, x, my(1), w, s.cattle, 50, '#a0522d', 'CATTLE');
    n = 2;
  } else if (key === 'feed') {
    meter(ctx, s, x, my(0), w, s.patties, 60, '#d6336c', 'PATTIES');
    meter(ctx, s, x, my(1), w, s.cattle, 50, '#a0522d', 'CATTLE');
    meter(ctx, s, x, my(2), w, s.disease, 20, '#e8590c', 'DISEASE RISK');
    n = 3;
  } else if (key === 'rest') {
    meter(ctx, s, x, my(0), w, s.patties, 60, '#d6336c', 'PATTY STOCK');
    meter(ctx, s, x, my(1), w, s.demand, 3, '#1971c2', 'DEMAND');
    n = 2;
  } else {
    meter(ctx, s, x, my(0), w, effBacklash(), 100, '#e8590c', 'BACKLASH');
    meter(ctx, s, x, my(1), w, s.boardPressure, 100, '#c2255c', 'BOARD PRESSURE');
    n = 2;
  }
  return n;
}

function drawScene(key: PaneKey, x: number, y: number, w: number, h: number): void {
  const flag = DIRTY_FLAG[key];
  ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(ctx, x - 3, y - 3, w + 6, h + 6, 8); ctx.fill();
  ctx.save(); rr(ctx, x, y, w, h, 6); ctx.clip();
  SCENES[key](ctx, sim.s, x, y, w, h, flag !== null && sim.s.dirty[flag] === 1);
  ctx.restore();
  ctx.strokeStyle = '#5a4a30'; ctx.lineWidth = 2; rr(ctx, x, y, w, h, 6); ctx.stroke();
}

function drawPaneGrid(index: number, x: number, y: number, w: number, h: number): void {
  const key = PANES[index].key;
  const s = sim.s;
  const active = index === pane;
  ctx.fillStyle = active ? '#efe6cf' : '#e4d9c2';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = active ? '#b8860b' : '#9a8f7d';
  ctx.lineWidth = active ? 3 : 1;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  icon(ctx, PANE_ICON[index], x + 20, y + 18, 12, active ? '#8a6a1a' : '#6a6154');
  ctx.fillStyle = '#2a2418'; ctx.font = 'bold 13px monospace';
  ctx.fillText(`${index + 1} ${PANES[index].title}`, x + 36, y + 22);
  const flag = DIRTY_FLAG[key];
  if (flag && s.dirty[flag]) {
    ctx.fillStyle = '#a03428'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'right';
    ctx.fillText('DIRTY', x + w - 10, y + 14); ctx.textAlign = 'left';
  }
  const cardW = 246;
  sim.actions[key].forEach((_, i) => drawCard(key, i, x + 10, y + 32 + i * 36, cardW, 30, true));
  const mx = x + 266, mw = w - 276;
  const nM = drawMeters(key, mx, y + 34, mw);
  drawScene(key, mx, y + 34 + nM * 21 + 6, mw, y + h - 12 - (y + 34 + nM * 21 + 6));
}

function drawPaneSingle(index: number): void {
  const key = PANES[index].key;
  const s = sim.s;
  const plateG = ctx.createLinearGradient(0, 14, 0, 50);
  plateG.addColorStop(0, '#2e3440'); plateG.addColorStop(1, '#1c2028');
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, 18, 16, 262, 36, 6); ctx.fill();
  ctx.fillStyle = plateG; rr(ctx, 16, 14, 262, 36, 6); ctx.fill();
  ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1.5; rr(ctx, 16, 14, 262, 36, 6); ctx.stroke();
  icon(ctx, PANE_ICON[index], 40, 32, 11, '#ffb224');
  ctx.fillStyle = '#f0e6cc'; ctx.font = 'bold 20px monospace';
  ctx.fillText(PANES[index].title, 58, 39);
  const clockG = ctx.createLinearGradient(0, 20, 0, 44);
  clockG.addColorStop(0, '#232830'); clockG.addColorStop(1, '#14171c');
  ctx.fillStyle = clockG; rr(ctx, 782, 20, 160, 24, 5); ctx.fill();
  ctx.strokeStyle = '#3a3f48'; rr(ctx, 782, 20, 160, 24, 5); ctx.stroke();
  ctx.fillStyle = '#ffb224'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
  ctx.fillText(`T+${s.t.toFixed(0)}s${s.over ? ' - HALT' : ''}`, 862, 36); ctx.textAlign = 'left';
  sim.actions[key].forEach((_, i) => drawCard(key, i, 24, 80 + i * 64, 560, 48, false));
  ctx.strokeStyle = 'rgba(90,70,40,.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(596, 70); ctx.lineTo(596, 398); ctx.stroke();
  const nM = drawMeters(key, 620, 80, 300);
  if (key === 'farm' && s.dirty.deforest) {
    ctx.fillStyle = 'rgba(60,20,10,.8)'; ctx.fillRect(614, 80 + nM * 21 + 4, 196, 18);
    icon(ctx, 'warn', 626, 80 + nM * 21 + 13, 7, '#ffb224');
    ctx.fillStyle = '#ffb224'; ctx.font = 'bold 12px monospace';
    ctx.fillText('rainforest burning...', 640, 80 + nM * 21 + 17);
  }
  drawScene(key, 608, 170, 328, 226);
  icon(ctx, PANE_ICON[index], 300, 330, 90, 'rgba(90,70,40,.10)');
  ctx.fillStyle = '#666'; ctx.font = '12px monospace';
  ctx.fillText('Click actions - keys 1-4 switch panes - sim runs while idle', 24, H - 14);
}

// ---- full-canvas screens ----
function drawBackdrop(): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f2e9d4'); g.addColorStop(0.55, '#e9dec4'); g.addColorStop(1, '#dcc9a4');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(120,90,40,${(i % 7) * 0.006 + 0.008})`;
    ctx.fillRect((i * 97) % W, (i * 57) % H, 1.4, 1.4);
  }
  const v = ctx.createRadialGradient(480, 190, 140, 480, 210, 560);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(60,40,10,.28)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

function drawTitle(uiT: number): void {
  const anim = { ...sim.s, t: uiT };
  ctx.save();
  ctx.globalAlpha = 0.35;
  SCENES.farm(ctx, anim, 30, 60, 300, 130, false);
  SCENES.feed(ctx, anim, 630, 60, 300, 130, false);
  SCENES.rest(ctx, anim, 30, 240, 300, 130);
  SCENES.hq(ctx, anim, 630, 240, 300, 130);
  ctx.restore();
  ctx.fillStyle = 'rgba(242,233,212,.55)'; ctx.fillRect(0, 0, W, H);
  drawWordmark(ctx, W / 2 - 220, 66, 56);
  ctx.fillStyle = '#4a3a20'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
  ctx.fillText('FOUR PANES · ONE ECONOMY · NO CLEAN WIN', W / 2, 160);
  ctx.font = '13px monospace'; ctx.fillStyle = '#6a5a40';
  ctx.fillText('Grow it, slaughter it, sell it — and keep the board off your back.', W / 2, 186);
  if (best > 0) {
    ctx.fillStyle = '#8a6a1a'; ctx.font = 'bold 13px monospace';
    ctx.fillText(`BEST RUN ${best.toFixed(0)}s`, W / 2, 216);
  }
  ctx.textAlign = 'left';
  button(W / 2 - 170, 250, 340, 46, 'START RUN', () => startRun(), true);
  button(W / 2 - 170, 308, 340, 40, 'SETTINGS', () => openSettings());
  ctx.fillStyle = '#666'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
  ctx.fillText('English only · hand-authored art + WebAudio synth · no external assets', W / 2, 388);
  ctx.textAlign = 'left';
}

function drawPause(): void {
  ctx.fillStyle = 'rgba(20,16,10,.6)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f0e6cc'; ctx.font = 'bold 34px monospace'; ctx.textAlign = 'center';
  ctx.fillText('PAUSED', W / 2, 140);
  ctx.font = '13px monospace'; ctx.fillStyle = '#c8b890';
  ctx.fillText('the sim is frozen — the muzak is not', W / 2, 166);
  ctx.textAlign = 'left';
  button(W / 2 - 120, 200, 240, 44, 'RESUME', () => { mode = 'play'; playCue(sfx, 'click'); }, true);
  button(W / 2 - 120, 254, 240, 38, 'RESTART', () => startRun());
  button(W / 2 - 120, 302, 240, 38, 'QUIT TO TITLE', () => quitToTitle());
}

function drawOver(): void {
  const s = sim.s;
  ctx.fillStyle = 'rgba(20,16,10,.55)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, 175); ctx.rotate(-0.12);
  ctx.strokeStyle = '#a02020'; ctx.lineWidth = 5; rr(ctx, -250, -64, 500, 128, 10); ctx.stroke();
  ctx.strokeStyle = '#a02020'; ctx.lineWidth = 2; rr(ctx, -242, -56, 484, 112, 8); ctx.stroke();
  ctx.fillStyle = '#a02020'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center';
  ctx.fillText(s.cash <= 0 ? 'BANKRUPT' : 'SHUT DOWN', 0, -12);
  ctx.font = 'bold 12px monospace';
  ctx.fillText(s.overReason.replace(' — ', ' - '), 0, 18);
  ctx.font = '12px monospace';
  ctx.fillText(`survived ${s.t.toFixed(0)}s · best ${best.toFixed(0)}s`, 0, 40);
  ctx.restore(); ctx.textAlign = 'left';
  button(W / 2 - 250, 290, 240, 44, 'RETRY', () => startRun(), true);
  button(W / 2 + 10, 290, 240, 44, 'TITLE', () => quitToTitle());
}

function draw(): void {
  const s = sim.s;
  [...tabsEl.children].forEach((b, i) => (b as HTMLElement).className = i === pane ? 'on' : '');
  pauseBtn.textContent = mode === 'pause' ? 'RESUME' : 'PAUSE';
  pauseBtn.disabled = mode === 'title';
  const eff = effBacklash();
  statsEl.innerHTML =
    `<span>CASH <b>$${s.cash.toFixed(0)}</b></span><span>REP <b>${s.rep.toFixed(0)}</b></span>` +
    `<span>BACKLASH <b>${eff.toFixed(0)}${s.blStain > 0 ? ` (+${s.blStain.toFixed(0)})` : ''}</b></span>` +
    `<span>BOARD <b>${s.boardPressure.toFixed(0)}</b></span>` +
    `<span>DEMAND <b>${s.demand.toFixed(1)}x</b></span><span>PROFIT <b>$${s.lastProfit.toFixed(1)}/s</b></span>` +
    `<span>OVERHEAD <b>-$${s.overheadNow.toFixed(1)}/s</b></span><span>TIME <b>${s.t.toFixed(0)}s</b></span>` +
    `<span>BEST <b>${best.toFixed(0)}s</b></span>`;
  const newestEvent = sim.events[0] ?? '';
  if (renderedEvents !== newestEvent) {
    renderedEvents = newestEvent;
    logEl.innerHTML = sim.events.map((e) => `<div>${e}</div>`).join('');
  }
  drawBackdrop();
  hits = [];
  if (mode === 'title') {
    drawTitle(uiT);
    return;
  }
  const grid = cv.clientWidth >= 900;
  if (grid) {
    const pw = W / 2, ph = 190;
    PANES.forEach((p, i) => drawPaneGrid(i, (i % 2) * pw, Math.floor(i / 2) * ph, pw, ph));
    ctx.fillStyle = '#666'; ctx.font = '11px monospace';
    ctx.fillText('All four panes run at once · keys 1-4 highlight · click action cards', 14, H - 12);
    drawWordmark(ctx, W - 236, H - 32, 18);
  } else {
    drawPaneSingle(pane);
  }
  if (sim.s.over) drawOver();
  else if (mode === 'pause') drawPause();
}

// ---- main loop ----
let last = performance.now();
let uiT = 0;
function frame(now: number): void {
  const dt = Math.min(0.25, (now - last) / 1000);
  last = now;
  uiT += dt;
  pollInput();
  input.endFrame();
  if (mode === 'play' && !sim.s.over) {
    sim.tick(dt);
    const eff = effBacklash();
    if (eff > 60 && prevEff <= 60) playCue(sfx, 'board');
    prevEff = eff;
    if (renderedEvents !== (sim.events[0] ?? '')) {
      const ev = sim.events[0];
      if (ev.startsWith('DISEASE')) playCue(sfx, 'outbreak');
      else if (ev.startsWith('BOARD')) playCue(sfx, 'board');
    }
  }
  if (sim.s.over && !overHandled) {
    overHandled = true;
    if (sim.s.t > best) {
      best = sim.s.t;
      save('burger-tycoon', 'best-time', best);
    }
    sfx.stopMusic();
    playCue(sfx, 'collapse');
  }
  draw();
  requestAnimationFrame(frame);
}

applyAudio();
layout();
requestAnimationFrame(frame);

// PROOF/debug hook (not gameplay)
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __maga: unknown }).__maga = {
    sim, setPane, input, sfx, openSettings,
    getMode: () => mode,
    setMode: (m: Mode) => { mode = m; },
  };
}

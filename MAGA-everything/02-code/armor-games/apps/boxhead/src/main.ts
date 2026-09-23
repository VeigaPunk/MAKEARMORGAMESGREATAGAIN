import { Application } from 'pixi.js';
import { Input, Sfx, fitIntegerScale, letterboxOffset, viewport, load, save } from '@maga/arcade-core';
import { Game } from './game';
import { TouchControls } from './touch';

/**
 * Crateheads — bootstrap.
 * Fixed logical stage, integer letterboxed scaling, unified input, synth SFX.
 */

const STAGE_W = 640;
const STAGE_H = 400;
// badge height is measured live (it wraps on narrow screens — RT-3)
const badgeEl = document.querySelector<HTMLElement>('.badge');

const app = new Application();
await app.init({
  width: STAGE_W,
  height: STAGE_H,
  background: 0x0a0a0f,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  // retro 2D: WebGL everywhere, never hang on WebGPU/Dawn edge cases
  preference: 'webgl',
});
document.body.appendChild(app.canvas);

const input = new Input();
const sfx = new Sfx();
// mute toggle lives in page chrome, not the stage, so it stays reachable on
// every screen including menus (BH-3.2).
const muteBtn = document.getElementById('mute');
// ---- audio settings (persisted, app-prefixed key) — sibling-app pattern ----
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const settingsEl = document.getElementById('settings')!;
const volMusicEl = document.getElementById('vol-music') as HTMLInputElement;
const volSfxEl = document.getElementById('vol-sfx') as HTMLInputElement;
const muteBoxEl = document.getElementById('mute-box') as HTMLInputElement;
const settingsCloseEl = document.getElementById('settings-close') as HTMLButtonElement;

interface AudioSettings { music: number; sfx: number; muted: boolean }
let audioSettings = load<AudioSettings>('boxhead', 'audio', { music: 0.7, sfx: 0.85, muted: false });
function paintMute(): void {
  if (muteBtn) muteBtn.textContent = audioSettings.muted ? 'SOUND OFF' : 'SOUND ON';
}
function applyAudio(): void {
  sfx.musicVolume = audioSettings.music;
  sfx.sfxVolume = audioSettings.sfx;
  sfx.muted = audioSettings.muted;
  volMusicEl.value = String(Math.round(audioSettings.music * 100));
  volSfxEl.value = String(Math.round(audioSettings.sfx * 100));
  muteBoxEl.checked = audioSettings.muted;
  paintMute();
  save('boxhead', 'audio', audioSettings);
}
volMusicEl.addEventListener('input', () => { audioSettings.music = Number(volMusicEl.value) / 100; applyAudio(); });
volSfxEl.addEventListener('input', () => {
  audioSettings.sfx = Number(volSfxEl.value) / 100;
  applyAudio();
  sfx.blip({ wave: 'square', freq: 520, duration: 0.05, volume: 0.5 }); // audition tick
});
muteBoxEl.addEventListener('change', () => { audioSettings.muted = muteBoxEl.checked; applyAudio(); });
settingsCloseEl.addEventListener('click', () => settingsEl.classList.add('hidden'));
settingsBtn.addEventListener('click', () => settingsEl.classList.toggle('hidden'));
applyAudio();
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    audioSettings.muted = !audioSettings.muted;
    applyAudio();
  });
}

let cachedScale = 1;
// getBoundingClientRect() already includes the CSS translate() letterbox
// offset — divide by scale only. Subtracting cachedOffset here would
// double-count it and shift every pointer/touch position off-target.
const toLogical = (cx: number, cy: number) => ({
  x: cx / cachedScale,
  y: cy / cachedScale,
});

// TouchControls registers its canvas pointer handlers BEFORE Input.attach:
// zone-claimed touches call stopImmediatePropagation so Input never sees
// them as aim/tap/drag (D-15).
const touch = new TouchControls(STAGE_W, STAGE_H, app.canvas, toLogical);
input.attach(app.canvas, toLogical);

const game = new Game(app, input, sfx, touch);


// PROOF/debug hook: open with ?debug to expose state for automated acceptance
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __maga: unknown }).__maga = {
    game, input, touch, sfx,
    get state() { return game.snapshot(); },
  };
}

function layout(): void {
  const vp = viewport();
  const badgeH = badgeEl?.offsetHeight ?? 0;
  const chromeEl = document.querySelector<HTMLElement>('.chrome-btns');
  if (chromeEl) chromeEl.style.top = `${badgeH + 4}px`;
  if (settingsEl) settingsEl.style.top = `${badgeH + 30}px`;
  const avail = { width: vp.width, height: vp.height - badgeH };
  const s = fitIntegerScale(STAGE_W, STAGE_H, avail, 4);
  const off = letterboxOffset(STAGE_W, STAGE_H, s, avail);
  cachedScale = s;
  const cvs = app.canvas as HTMLCanvasElement;
  cvs.style.width = `${STAGE_W * s}px`;
  cvs.style.height = `${STAGE_H * s}px`;
  // single positioning mechanism: fixed canvas + explicit left/top.
  // (flex-centering + translate double-counted the offset — D1/D3 defect)
  cvs.style.left = `${off.x}px`;
  cvs.style.top = `${off.y + badgeH}px`;
}
window.addEventListener('resize', layout);
layout();

app.ticker.add((ticker) => {
  game.tick(ticker.deltaMS / 1000);
});

import { Application } from 'pixi.js';
import { Input, Sfx, fitIntegerScale, letterboxOffset, viewport } from '@maga/arcade-core';
import { Game } from './game';
import { TouchControls } from './touch';

/**
 * Boxhead native replica — bootstrap.
 * Fixed logical stage, integer letterboxed scaling, unified input, synth SFX.
 */

const STAGE_W = 640;
const STAGE_H = 400;
const BADGE_H = 22;

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

let cachedScale = 1;
let cachedOffset = { x: 0, y: 0 };
const toLogical = (cx: number, cy: number) => ({
  x: (cx - cachedOffset.x) / cachedScale,
  y: (cy - cachedOffset.y) / cachedScale,
});
input.attach(app.canvas, toLogical);

const touch = new TouchControls(STAGE_W, STAGE_H, app.canvas, toLogical);

const game = new Game(app, input, sfx, touch);

// PROOF/debug hook: open with ?debug to expose state for automated acceptance
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __maga: unknown }).__maga = { game, input, touch };
}

function layout(): void {
  const vp = viewport();
  const avail = { width: vp.width, height: vp.height - BADGE_H };
  const s = fitIntegerScale(STAGE_W, STAGE_H, avail, 4);
  const off = letterboxOffset(STAGE_W, STAGE_H, s, avail);
  cachedScale = s;
  cachedOffset = { x: off.x, y: off.y + BADGE_H };
  const cvs = app.canvas as HTMLCanvasElement;
  cvs.style.width = `${STAGE_W * s}px`;
  cvs.style.height = `${STAGE_H * s}px`;
  cvs.style.transform = `translate(${cachedOffset.x}px, ${cachedOffset.y}px)`;
  document.body.style.flexDirection = 'column';
}
window.addEventListener('resize', layout);
layout();

app.ticker.add((ticker) => {
  game.tick(ticker.deltaMS / 1000);
});

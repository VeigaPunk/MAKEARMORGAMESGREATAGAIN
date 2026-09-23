import { Application } from 'pixi.js';
import { Input, Sfx, fitIntegerScale, letterboxOffset, viewport, load, save } from '@maga/arcade-core';
import type { ContentPack } from './packs';
import { DT, STAGE_H, STAGE_W, ShmupSim, type SimEvent } from './sim';
import { buildArt } from './art';
import { ShmupRenderer } from './render';
import { ShmupTouch } from './touch';

/**
 * Shared app bootstrap for the shmup skeleton — everything a pack app needs:
 * Pixi Application (webgl, fixed stage), integer letterbox, unified input,
 * touch zones, synth SFX + composed music beds, 120Hz fixed-step loop,
 * persisted audio settings, ?debug hook. Apps call
 * `bootShmup(PACKS.x, '<storage-ns>')` and are done.
 */

// Composed campy loopable beds (zero binary assets, WebAudio step sequencer).
// Replica: jaunty major-key root+fifth march, square wave, brisk 140ms step.
// Cluck: original minor-pentatonic courier groove, triangle, spacious 160ms.
const MUSIC_BEDS: Record<ContentPack['id'], { notes: (number | number[])[]; stepMs: number; wave: 'square' | 'triangle' }> = {
  replica: {
    notes: [
      [262, 392], 0, [330, 494], [262, 392],
      [294, 440], 0, [349, 523], [330, 494],
      [262, 392], 0, [330, 494], [392, 523],
      [440, 659], 0, [392, 523], [349, 523],
    ],
    stepMs: 140, wave: 'square',
  },
  cluck: {
    notes: [
      [220, 330], 0, 0, [262, 392],
      [196, 294], 0, [220, 330], 0,
      [175, 262], 0, 0, [196, 330],
      [165, 247], 0, [147, 262], 0,
    ],
    stepMs: 160, wave: 'triangle',
  },
};

/** per-pack shot flavors so every weapon kit sounds like its name */
function playShoot(sfx: Sfx, pack: ContentPack, weaponLv: number): void {
  if (pack.id === 'replica') {
    if (weaponLv === 0) sfx.blip({ wave: 'square', freq: 920, freqEnd: 240, duration: 0.06, volume: 0.5 });
    else if (weaponLv === 1) sfx.blip({ wave: 'square', freq: 760, freqEnd: 300, duration: 0.07, volume: 0.5 });
    else sfx.blip({ wave: 'sawtooth', freq: 640, freqEnd: 180, duration: 0.08, volume: 0.5, noise: 0.15 });
  } else {
    if (weaponLv === 0) sfx.blip({ wave: 'sine', freq: 700, freqEnd: 1050, duration: 0.07, volume: 0.55 });
    else if (weaponLv === 1) sfx.blip({ wave: 'triangle', freq: 520, freqEnd: 260, duration: 0.07, volume: 0.55 });
    else sfx.blip({ wave: 'square', freq: 480, freqEnd: 140, duration: 0.09, volume: 0.55, noise: 0.2 });
  }
}

function playEvent(sfx: Sfx, pack: ContentPack, sim: ShmupSim, e: SimEvent): void {
  switch (e) {
    case 'shoot': playShoot(sfx, pack, sim.weaponLv); break;
    case 'missile': sfx.blip({ wave: 'sawtooth', freq: 180, freqEnd: 900, duration: 0.25, noise: 0.2 }); break;
    case 'missileBoom': sfx.blip({ wave: 'sawtooth', freq: 140, freqEnd: 40, duration: 0.3, volume: 0.8, noise: 0.5 }); break;
    case 'hit': sfx.blip({ wave: 'sawtooth', freq: 200, freqEnd: 60, duration: 0.1, volume: 0.6, noise: 0.2 }); break;
    case 'pop': sfx.blip({ wave: 'triangle', freq: 600, freqEnd: 1200, duration: 0.06, noise: 0.3 }); break;
    case 'eggSplat': sfx.blip({ wave: 'sine', freq: 300, freqEnd: 80, duration: 0.12, noise: 0.6, filter: { type: 'lowpass', freq: 900 } }); break;
    case 'death': sfx.preset('death'); sfx.blip({ wave: 'sawtooth', freq: 200, freqEnd: 40, duration: 0.4, volume: 0.7, noise: 0.4 }); break;
    case 'pickup': sfx.preset('pickup'); break; // gift: bright chirp
    case 'food': sfx.blip({ wave: 'square', freq: 520, freqEnd: 780, duration: 0.06, volume: 0.55 }); break;
    case 'ui': sfx.preset('ui'); break;
    case 'bossSpawn': sfx.blip({ wave: 'sawtooth', freq: 90, freqEnd: 220, duration: 0.6, volume: 0.8, noise: 0.3 }); break;
    case 'bossTelegraph': sfx.blip({ wave: 'sine', freq: 300, freqEnd: 900, duration: 0.7, volume: 0.7 }); break;
    case 'bossRadial': sfx.blip({ wave: 'sawtooth', freq: 400, freqEnd: 100, duration: 0.25, volume: 0.7, noise: 0.4 }); break;
    case 'bossDown': sfx.blip({ wave: 'triangle', freq: 220, freqEnd: 880, duration: 0.5, noise: 0.3 }); break;
    case 'chapterClear':
      for (const f of [523, 659, 784, 1047]) sfx.blip({ wave: 'triangle', freq: f, duration: 0.35, volume: 0.5 });
      break;
    case 'gameOver': sfx.blip({ wave: 'sawtooth', freq: 320, freqEnd: 40, duration: 0.7, volume: 0.8, noise: 0.2 }); break;
    case 'win':
      for (const f of [392, 523, 659, 784, 1047]) sfx.blip({ wave: 'triangle', freq: f, duration: 0.6, volume: 0.5 });
      break;
  }
}

export interface ShmupHandles {
  app: Application;
  sim: ShmupSim;
  input: Input;
  touch: ShmupTouch;
  renderer: ShmupRenderer;
  sfx: Sfx;
}

interface AudioSettings { master: number; music: number; sfx: number; muted: boolean }

export async function bootShmup(pack: ContentPack, game: string): Promise<ShmupHandles> {
  const badgeEl = document.querySelector<HTMLElement>('.badge');
  const muteBtn = document.getElementById('mute');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsEl = document.getElementById('settings');
  const volMusicEl = document.getElementById('vol-music') as HTMLInputElement | null;
  const volSfxEl = document.getElementById('vol-sfx') as HTMLInputElement | null;
  const muteBoxEl = document.getElementById('mute-box') as HTMLInputElement | null;
  const settingsCloseEl = document.getElementById('settings-close');

  const app = new Application();
  await app.init({
    width: STAGE_W,
    height: STAGE_H,
    background: pack.bg0,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    // retro 2D: WebGL everywhere, never hang on WebGPU/Dawn edge cases
    preference: 'webgl',
  });
  document.body.appendChild(app.canvas);

  const input = new Input();
  const sfx = new Sfx();

  // ---- audio settings (persisted under the app's own namespace) ----
  let audioSettings = load<AudioSettings>(game, 'audio', { master: 0.9, music: 0.7, sfx: 0.85, muted: false });
  function applyAudio(): void {
    sfx.volume = audioSettings.master;
    sfx.musicVolume = audioSettings.music;
    sfx.sfxVolume = audioSettings.sfx;
    sfx.muted = audioSettings.muted;
    if (volMusicEl) volMusicEl.value = String(Math.round(audioSettings.music * 100));
    if (volSfxEl) volSfxEl.value = String(Math.round(audioSettings.sfx * 100));
    if (muteBoxEl) muteBoxEl.checked = audioSettings.muted;
    if (muteBtn) muteBtn.textContent = audioSettings.muted ? 'SOUND OFF' : 'SOUND ON';
    save(game, 'audio', audioSettings);
  }
  volMusicEl?.addEventListener('input', () => { audioSettings.music = Number(volMusicEl.value) / 100; applyAudio(); });
  volSfxEl?.addEventListener('input', () => { audioSettings.sfx = Number(volSfxEl.value) / 100; applyAudio(); sfx.preset('ui'); });
  muteBoxEl?.addEventListener('change', () => { audioSettings.muted = muteBoxEl.checked; applyAudio(); });
  settingsCloseEl?.addEventListener('click', () => { settingsEl?.classList.add('hidden'); sfx.preset('ui'); });
  settingsBtn?.addEventListener('click', () => {
    settingsEl?.classList.toggle('hidden');
    sfx.preset('ui');
  });
  if (muteBtn) {
    muteBtn.addEventListener('click', () => { audioSettings.muted = !audioSettings.muted; applyAudio(); });
  }
  applyAudio();

  let cachedScale = 1;
  // getBoundingClientRect() already includes the CSS letterbox offset —
  // divide by scale only (D-09: subtracting it double-counts the offset).
  const toLogical = (cx: number, cy: number) => ({ x: cx / cachedScale, y: cy / cachedScale });

  // ShmupTouch registers canvas pointer handlers BEFORE Input.attach:
  // zone-claimed touches call stopImmediatePropagation so Input never sees
  // them as taps (D-15).
  const touch = new ShmupTouch(STAGE_W, STAGE_H, app.canvas, toLogical);
  input.attach(app.canvas, toLogical);

  const sim = new ShmupSim(pack, game);
  const art = await buildArt(pack);
  const renderer = new ShmupRenderer(sim, art);
  app.stage.addChild(renderer.view, touch.view);

  // keybinds beyond arcade-core defaults (proto: Z fire, X/Shift missile,
  // R/Enter end-screen confirm, 1/2 chapter select)
  input.setKeymaps({
    p1: {
      KeyZ: 'fire',
      KeyX: 'action', ShiftLeft: 'action', ShiftRight: 'action',
      KeyR: 'action',
      Digit1: 'slot1', Digit2: 'slot2',
    },
  });

  // PROOF/debug hook: open with ?debug to expose state for automated acceptance
  if (new URLSearchParams(location.search).has('debug')) {
    (window as unknown as { __maga: unknown }).__maga = {
      sim, input, touch, sfx,
      get state() { return sim.snapshot(); },
    };
  }

  function layout(): void {
    const vp = viewport();
    const badgeH = badgeEl?.offsetHeight ?? 0;
    if (muteBtn) muteBtn.style.top = `${badgeH + 4}px`;
    if (settingsBtn) settingsBtn.style.top = `${badgeH + 4}px`;
    const avail = { width: vp.width, height: vp.height - badgeH };
    const s = fitIntegerScale(STAGE_W, STAGE_H, avail, 4);
    const off = letterboxOffset(STAGE_W, STAGE_H, s, avail);
    cachedScale = s;
    const cvs = app.canvas as HTMLCanvasElement;
    cvs.style.width = `${STAGE_W * s}px`;
    cvs.style.height = `${STAGE_H * s}px`;
    // single positioning mechanism: fixed canvas + explicit left/top (D-12)
    cvs.style.left = `${off.x}px`;
    cvs.style.top = `${off.y + badgeH}px`;
  }
  window.addEventListener('resize', layout);
  layout();

  let musicOn = false;
  let acc = 0;
  app.ticker.add((ticker) => {
    // ---- flow input (per render frame; edge-triggered) ----
    if (sim.mode === 'title') {
      if (input.wasPressed('slot1')) sim.selectChapter(1);
      if (input.wasPressed('slot2')) sim.selectChapter(2);
      if (input.wasPressed('fire') || input.wasPressed('action')) sim.startGame(sim.titleSel);
      if (input.pointer.tapped) sim.titleClick(input.pointer.x, input.pointer.y);
    } else if (sim.mode === 'gameover' || sim.mode === 'win') {
      if (input.wasPressed('fire') || input.wasPressed('action') || input.pointer.tapped) sim.confirmEnd();
    } else if (sim.mode === 'play') {
      if (input.wasPressed('pause')) sim.togglePause();
      // paused exit: every state has a way back to title
      if (sim.paused && (input.wasPressed('action') || input.pointer.tapped)) sim.quitToTitle();
    }
    touch.setActive(sim.mode === 'play' && !sim.paused);

    // ---- combat input ----
    const axis = input.moveAxis(sim.ship.x, sim.ship.y, 40, false); // touch handled by zones (D-15)
    if (touch.drag) { axis.x = touch.drag.x; axis.y = touch.drag.y; }
    sim.moveAxis.x = axis.x; sim.moveAxis.y = axis.y;
    // LMB fires (fine pointer); touch fire comes from the FIRE zone or drag autofire
    const pointerFire = input.pointer.active && input.pointer.seen && !matchMedia('(pointer: coarse)').matches;
    sim.setFire(input.isDown('fire') || touch.fire || pointerFire || touch.drag !== null);
    if ((input.wasPressed('action') || touch.takeMissile()) && !sim.paused) sim.fireMissile();

    // ---- fixed-step sim ----
    acc += Math.min(0.1, ticker.deltaMS / 1000);
    while (acc >= DT) { sim.step(DT); acc -= DT; }

    // ---- music bed follows mode ----
    const wantMusic = sim.mode === 'play' && !sim.paused;
    if (wantMusic && !musicOn) {
      const bed = MUSIC_BEDS[pack.id];
      sfx.startMusic(bed.notes, bed.stepMs, { wave: bed.wave, volume: 0.3 });
      musicOn = true;
    }
    if (!wantMusic && musicOn) { sfx.stopMusic(); musicOn = false; }

    // ---- drain events → SFX ----
    for (const e of sim.events) playEvent(sfx, pack, sim, e);
    sim.events.length = 0;

    touch.tick();
    renderer.draw();
    input.endFrame();
  });

  return { app, sim, input, touch, renderer, sfx };
}

import { Input, Sfx, fitIntegerScale, letterboxOffset, viewport, load, save } from '@maga/arcade-core';


/**
 * Impossible Run — original-evocation one-button rhythm autorunner (Canvas2D).
 * Physics ported 1:1 from maga-proto's verified mechanics proof
 * (prototypes/impossible-game.html); constants confirmed, not guesses —
 * full clear x=9900 proven with real input (verification/evidence/sr1-impossible-run.log,
 * reproduced 2/2). Music↔scroll sync: 135 BPM bed, 16th = 40 px at 360 px/s.
 */

// ---- tunables (CONFIRMED vs proto + sr1 full-clear proof — do not retune) ----
const DT = 1 / 120;            // fixed timestep (spec: fixed timestep suggested)
const SPEED = 360;             // px/s auto-run
const GRAV = 2600;             // px/s^2
const JUMP_V = 880;            // fixed impulse — no variable height (spec)
const CUBE = 34;               // hitbox edge
const JUMP_BUFFER = 0.10;      // s — press slightly early still jumps
const COYOTE = 0.06;           // s — leave edge, still jump
const RESPAWN_MS = 160;        // spec: death -> respawn <=200ms feel
const GROUND_Y = 430;
const W = 960;
const H = 540;
const BADGE_H = 22;
// measured live — the badge wraps on narrow screens (RT-3/RT-4)
const badgeEl = document.querySelector<HTMLElement>('.badge');
const muteBtn = document.getElementById('mute');

// ---- level as data: [type, x, w, h?] — spike kills, block lands-on-top/side-kills, gap = no floor ----
type Obstacle = [type: 'gap' | 'spike' | 'block', x: number, w: number, h?: number];
const LEVEL: Obstacle[] = [
  ['gap',   1400, 130],
  ['spike', 1900, 40],
  ['spike', 2400, 40], ['spike', 2440, 40],          // double spike
  ['block', 3000, 120, 70],
  ['spike', 3400, 40],
  ['gap',   3900, 170],
  ['block', 4400, 90, 110],
  ['spike', 5000, 40], ['spike', 5040, 40], ['spike', 5080, 40], // triple
  ['block', 5600, 200, 50], ['spike', 5650, 40],
  ['gap',   6300, 150],
  ['spike', 6900, 40], ['block', 7100, 100, 90], ['spike', 7300, 40],
  ['gap',   7800, 200],
  ['spike', 8500, 40], ['spike', 8540, 40],
  ['block', 9100, 140, 60], ['spike', 9400, 40],
];
const LEVEL_END = 9900;
// practice-mode checkpoint flags (proto) — respawn at last passed flag
const CHECKPOINTS = [2600, 4800, 6600, 8400];

// ---- canvas + integer letterbox (arcade-core) ----
const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
document.body.appendChild(cv);
const ctx = cv.getContext('2d')!;

let cachedScale = 1;
const toLogical = (cx: number, cy: number) => ({ x: cx / cachedScale, y: cy / cachedScale });

function layout(): void {
  const vp = viewport();
  // badge wraps on narrow screens — measure, don't hardcode (RT-3/RT-4)
  const badgeH = badgeEl?.offsetHeight ?? BADGE_H;
  if (muteBtn) muteBtn.style.top = `${badgeH + 4}px`;
  const avail = { width: vp.width, height: vp.height - badgeH };
  const s = fitIntegerScale(W, H, avail, 4);
  const off = letterboxOffset(W, H, s, avail);
  cachedScale = s;
  cv.style.width = `${W * s}px`;
  cv.style.height = `${H * s}px`;
  // fixed canvas + explicit left/top — no flex-centering + translate double-count
  cv.style.left = `${off.x}px`;
  cv.style.top = `${off.y + badgeH}px`;
}
window.addEventListener('resize', layout);
layout();

// ---- arcade-core services ----
const input = new Input();
input.attach(cv, toLogical);
const sfx = new Sfx();

interface Settings { music: number; sfx: number; muted: boolean }
const settings = load<Settings>('impossible', 'settings', { music: 0.7, sfx: 0.9, muted: false });
function applySettings(): void {
  sfx.musicVolume = settings.music;
  sfx.sfxVolume = settings.sfx;
  sfx.muted = settings.muted;
  save('impossible', 'settings', settings);
  paintMute();
}
function paintMute(): void { if (muteBtn) muteBtn.textContent = sfx.muted ? 'SOUND OFF' : 'SOUND ON'; }
if (muteBtn) {
  muteBtn.addEventListener('click', () => { settings.muted = !settings.muted; applySettings(); });
}
applySettings();

// ---- game state ----
type State = 'running' | 'dead' | 'clear';
type Screen = 'title' | 'practice' | 'calibration' | 'settings' | null;
interface Cube { x: number; y: number; vy: number; grounded: boolean; rot: number }
interface Particle { x: number; y: number; vx: number; vy: number; s: number; life: number; kind?: 'dust' }

let mode: 'title' | 'run' = 'title';
let screen: Screen = 'title';
let settingsReturn: Screen = 'title';
let state: State;
let cube: Cube;
let particles: Particle[];
let camX: number;
let attempt: number;
let deaths: number;
let pressAt: number;             // wall-clock ms of last jump press (offset-calibrated)
let coyoteT: number;
let deadT: number;
let clearT: number;
let paused: boolean;
let practice = false;
let startCp = 0;
let lastCp = 0;
let deathPerf = 0;
let respawnMs = 0;
let inputOffsetMs = load<number>('impossible', 'input-offset', 0);
let best = load<number>('impossible', 'best-progress', 0);
// pointer presses queue here via DOM event (frame-edge polling drops sub-frame taps, D-35)
let pointerPress: { x: number; y: number } | null = null;
cv.addEventListener('pointerdown', (e) => {
  const r = cv.getBoundingClientRect();
  pointerPress = { x: (e.clientX - r.left) / cachedScale, y: (e.clientY - r.top) / cachedScale };
});

function reset(full: boolean): void {
  if (full) { attempt = 0; deaths = 0; lastCp = startCp; }
  attempt++;
  const sx = practice ? lastCp : 0;
  if (state === 'dead') respawnMs = performance.now() - deathPerf;
  state = 'running';
  cube = { x: sx, y: GROUND_Y - CUBE, vy: 0, grounded: true, rot: 0 };
  particles = [];
  camX = sx - 220; pressAt = 0; coyoteT = 0; deadT = 0; clearT = 0; paused = false;
  startAttemptMusic();
}

function pressJump(): void { pressAt = performance.now(); }

function toTitle(): void {
  mode = 'title'; screen = 'title'; paused = false;
  sfx.stopMusic();
}

function startRun(fromPractice: boolean, fromX: number): void {
  practice = fromPractice; startCp = fromX; lastCp = fromX;
  mode = 'run'; screen = null; paused = false;
  reset(true);
}

// ---- collision (proto-verbatim) ----
function floorAt(x: number): number {
  let top = -Infinity, inGap = false;
  for (const [t, ox, ow, oh] of LEVEL) {
    if (x < ox || x > ox + ow) continue;
    if (t === 'gap') inGap = true;
    if (t === 'block') top = Math.max(top, GROUND_Y - (oh ?? 0));
  }
  if (top > -Infinity) return top;
  return inGap ? -Infinity : GROUND_Y;
}
function solidSideAt(x: number, y: number): boolean {
  for (const [t, ox, ow, oh] of LEVEL) {
    if (t !== 'block') continue;
    const top = GROUND_Y - (oh ?? 0);
    if (x > ox && x < ox + ow && y + CUBE > top + 2 && y < GROUND_Y) return true;
  }
  return false;
}
function spikeAt(x: number, y: number): boolean {
  for (const [t, ox, ow] of LEVEL) {
    if (t !== 'spike') continue;
    const cx = x + CUBE / 2, cy = y + CUBE;
    if (cx > ox + 4 && cx < ox + ow - 4 && cy > GROUND_Y - 26) return true;
  }
  return false;
}

function die(): void {
  if (!practice) {
    const prog = cube.x / LEVEL_END;
    if (prog > best) best = prog;
    save('impossible', 'best-progress', best);
  }
  state = 'dead'; deadT = 0; deaths++;
  deathPerf = performance.now();
  sfx.preset('death');
  for (let i = 0; i < 26; i++) particles.push({
    x: cube.x + CUBE / 2, y: cube.y + CUBE / 2,
    vx: (Math.random() - .5) * 700, vy: -Math.random() * 600 - 100,
    s: 4 + Math.random() * 8, life: .5 + Math.random() * .4,
  });
}

function step(dt: number): void {
  if (mode !== 'run') return;
  if (state === 'dead') { deadT += dt * 1000; if (deadT >= RESPAWN_MS) reset(false); return; }
  if (state === 'clear') { clearT += dt; return; }
  if (paused) return;

  cube.x += SPEED * dt;
  const footX = cube.x + CUBE / 2;

  const floor = floorAt(footX);
  if (cube.grounded) {
    if (floor === -Infinity || cube.y + CUBE < floor - 1) { cube.grounded = false; coyoteT = COYOTE; }
  } else {
    coyoteT = Math.max(0, coyoteT - dt);
    cube.vy += GRAV * dt;
    cube.y += cube.vy * dt;
    if (floor > -Infinity && cube.vy >= 0 && cube.y + CUBE >= floor) {
      cube.y = floor - CUBE; cube.vy = 0; cube.grounded = true; cube.rot = Math.round(cube.rot / (Math.PI / 2)) * (Math.PI / 2);
    }
  }
  if (!cube.grounded) cube.rot += dt * 4.2;

  // jump consume — input-offset calibration delays the effective press (proto §Mobile mitigation)
  const now = performance.now();
  if (pressAt > 0 && now - pressAt >= inputOffsetMs && now - pressAt <= inputOffsetMs + JUMP_BUFFER * 1000
      && (cube.grounded || coyoteT > 0)) {
    cube.vy = -JUMP_V; cube.grounded = false; coyoteT = 0; pressAt = 0;
    sfx.blip({ wave: 'square', freq: 520, freqEnd: 700, duration: 0.05, volume: 0.4 }); // jump tick
  }
  if (pressAt > 0 && now - pressAt > inputOffsetMs + JUMP_BUFFER * 1000) pressAt = 0; // stale press expires

  // checkpoint flags (practice mode)
  if (practice) for (const cx of CHECKPOINTS) if (cube.x >= cx && lastCp < cx) lastCp = cx;

  if (spikeAt(cube.x, cube.y) || solidSideAt(cube.x + CUBE, cube.y)) return die();
  if (floor === -Infinity && cube.y + CUBE > GROUND_Y + 8) return die(); // fell into gap
  if (cube.x >= LEVEL_END) {
    state = 'clear'; clearT = 0;
    sfx.stopMusic();
    fanfare();
    if (!practice && 1 > best) { best = 1; save('impossible', 'best-progress', best); }
  }
  if (!practice) {
    const prog = cube.x / LEVEL_END;
    if (prog > best) best = prog;
  }
}

// ---- audio: 135 BPM bed, 16th = 40 px at 360 px/s (beat = 160 px) ----
const STEP_MS = 60000 / 135 / 4; // 111.11 ms per 16th
const MUSIC_STEPS: (number | number[])[] = [
  [110, 440], 0, [220], 0,
  [110, 220], 0, [261.63], [220],
  [110, 440], 0, [220], 0,
  [110, 220], 0, [523.25], [493.88],
];
let audioArmed = false; // real-browser autoplay: never schedule notes on a suspended context
window.addEventListener('pointerdown', () => { audioArmed = true; }, { capture: true });
window.addEventListener('keydown', () => { audioArmed = true; }, { capture: true });
function startAttemptMusic(): void {
  // the original restarts the track on every attempt — beat 0 locks to attempt start
  if (!audioArmed) return;
  sfx.startMusic(MUSIC_STEPS, STEP_MS, { wave: 'square', volume: 0.3 });
}
function fanfare(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => setTimeout(() => sfx.blip({ wave: 'triangle', freq: f, duration: 0.12, volume: 0.5 }), i * 90));
}
function respawnTick(): void { sfx.blip({ wave: 'square', freq: 980, freqEnd: 880, duration: 0.03, volume: 0.25 }); }
reset(true);

// ---- menus (canvas chips; hit-tested on pointer press-edge) ----
interface Chip { id: string; x: number; y: number; w: number; h: number }
let chips: Chip[] = [];
function setOffset(ms: number): void {
  inputOffsetMs = Math.max(0, Math.min(200, ms));
  save('impossible', 'input-offset', inputOffsetMs);
}
function clickChip(id: string): void {
  sfx.preset('ui');
  switch (id) {
    case 'play': startRun(false, 0); break;
    case 'practice-menu': screen = 'practice'; break;
    case 'calibration': screen = 'calibration'; break;
    case 'settings': settingsReturn = screen; screen = 'settings'; break;
    case 'back-title': screen = 'title'; break;
    case 'back-settings': screen = settingsReturn; break;
    case 'mute-toggle': settings.muted = !settings.muted; applySettings(); break;
    case 'music-minus': settings.music = Math.max(0, +(settings.music - 0.1).toFixed(1)); applySettings(); break;
    case 'music-plus': settings.music = Math.min(1, +(settings.music + 0.1).toFixed(1)); applySettings(); break;
    case 'sfx-minus': settings.sfx = Math.max(0, +(settings.sfx - 0.1).toFixed(1)); applySettings(); break;
    case 'sfx-plus': settings.sfx = Math.min(1, +(settings.sfx + 0.1).toFixed(1)); applySettings(); break;
    case 'offset-minus': setOffset(inputOffsetMs - 10); break;
    case 'offset-plus': setOffset(inputOffsetMs + 10); break;
    case 'offset-reset': setOffset(0); break;
    case 'resume': paused = false; startAttemptMusic(); break;
    case 'restart': reset(true); break;
    case 'quit': toTitle(); break;
    case 'retry': reset(true); break;
    case 'clear-title': toTitle(); break;
    default:
      if (id.startsWith('cp-')) startRun(true, +id.slice(3));
  }
}
function menuBack(): void {
  if (screen === 'settings') screen = settingsReturn;
  else if (screen !== 'title' && screen !== null) screen = 'title';
}

// ---- input → actions (press-edge, spec: tap-on-press) ----
function pollInput(): void {
  const fire = input.wasPressed('fire') || input.wasPressed('up');
  const action = input.wasPressed('action');
  const pause = input.wasPressed('pause');
  const pp = pointerPress; pointerPress = null;
  const chipAt = () => pp ? chips.find((c) => pp.x > c.x && pp.x < c.x + c.w && pp.y > c.y && pp.y < c.y + c.h) : undefined;

  if (mode === 'title') {
    const hit = chipAt();
    if (hit) clickChip(hit.id);
    if (fire && screen === 'title') clickChip('play');
    else if (action && screen === 'title') screen = 'practice';
    if (pause) menuBack();
    if (screen === 'calibration') {
      if (input.wasPressed('left')) setOffset(inputOffsetMs - 10);
      if (input.wasPressed('right')) setOffset(inputOffsetMs + 10);
    }
    input.endFrame();
    return;
  }

  // mode === 'run'
  if (screen === 'settings') {
    const hit = chipAt();
    if (hit) clickChip(hit.id);
    if (pause || action) menuBack();
    input.endFrame();
    return;
  }

  if (state === 'clear') {
    const hit = chipAt();
    if (hit) clickChip(hit.id);
    if (fire || action) reset(true);
    if (pause) toTitle();
    input.endFrame();
    return;
  }

  if (pause) {
    paused = !paused;
    if (paused) sfx.stopMusic(); else startAttemptMusic();
  }
  if (paused) {
    const hit = chipAt();
    if (hit) clickChip(hit.id);
    if (action) reset(true);
    input.endFrame();
    return;
  }

  if (fire || pp) pressJump();
  if (action) reset(true);
  input.endFrame();
}

// KeyZ is unbound in arcade-core defaults; add it as a jump alias, Minus/Equal as offset keys.
input.setKeymaps({ p1: { KeyZ: 'fire', KeyR: 'action', Minus: 'left', Equal: 'right' } });

// tab backgrounding: stop the step timer; resume restarts the bed at beat 0 (documented reset)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { sfx.stopMusic(); return; }
  if (mode === 'run' && !paused && state === 'running' && screen === null) startAttemptMusic();
});

/* ================= render layer =================
 * All art is inline canvas path/gradient work. Static layers are pre-rendered
 * to offscreen canvases once at load; the per-frame path only blits + strokes.
 * Draw-only state (clock, trail, shake, dust) never feeds back into step().
 */
const INK = '#28241e', INK_SOFT = '#3a352b', PAPER = '#f2efe9', ORANGE = '#f08c00', BLOCK_INK = '#363026';
const GAPS = LEVEL.filter((l) => l[0] === 'gap');

// ---- draw-only juice state ----
let drawT = 0, drawLast = performance.now();
interface Ghost { x: number; y: number; rot: number; a: number }
let trail: Ghost[] = [], squashT = 0, shakeT = 0, flashT = 0, deathX = -1e9, deathY = 0, deathMarkT = 0;
let prevGrounded = true, prevState: State = 'running';

// ---- cached layers ----
function mkCv(w: number, h: number): HTMLCanvasElement { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const bgCv = (() => {                       // paper gradient + grain + vignette
  const c = mkCv(W, H), g = c.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, 0, H);
  lg.addColorStop(0, '#f7f4ed'); lg.addColorStop(.6, '#f2efe9'); lg.addColorStop(1, '#e9e3d6');
  g.fillStyle = lg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) {            // film grain
    g.fillStyle = `rgba(40,36,30,${(Math.random() * .05).toFixed(3)})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }
  for (let y = 0; y < H; y += 3) { g.fillStyle = 'rgba(40,36,30,.016)'; g.fillRect(0, y, W, 1); } // scanlines
  const rg = g.createRadialGradient(W / 2, H * .42, H * .42, W / 2, H * .55, H * .95);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(40,32,20,.20)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  return c;
})();
function bandTile(seed: number, yBase: number, amp: number, n: number, tone: string): HTMLCanvasElement { // soft drifting strata, 1600px tile
  const c = mkCv(1600, H), g = c.getContext('2d')!;
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.fillStyle = tone;
  for (let i = 0; i < n; i++) {
    const w = 140 + rnd() * 320, x = rnd() * 1600, y = yBase + (rnd() - .5) * amp, h = 6 + rnd() * 14;
    g.beginPath(); g.roundRect(x, y, w, h, h / 2); g.fill();
    if (x + w > 1600) { g.beginPath(); g.roundRect(x - 1600, y, w, h, h / 2); g.fill(); } // wrap seam
  }
  return c;
}
const bandFarCv = bandTile(11, 130, 60, 9, 'rgba(60,52,40,.05)');
const bandNearCv = bandTile(29, 240, 80, 7, 'rgba(60,52,40,.075)');
const skylineCv = (() => {                   // distant silhouette skyline, 2400px tile
  const c = mkCv(2400, H), g = c.getContext('2d')!;
  g.fillStyle = 'rgba(70,60,45,.10)';
  let x = 60;
  while (x < 2360) {
    const kind = (x * 7919) % 3;
    if (kind === 0) {                        // spike cluster
      for (let k = 0; k < 2 + (x % 2); k++) {
        const sx = x + k * 46;
        g.beginPath(); g.moveTo(sx, GROUND_Y); g.lineTo(sx + 20, GROUND_Y - 52); g.lineTo(sx + 40, GROUND_Y); g.fill();
      }
      x += 150;
    } else {                                 // block
      const bw = 60 + (x % 90), bh = 40 + (x % 70);
      g.fillRect(x, GROUND_Y - bh, bw, bh); x += bw + 60;
    }
  }
  const hz = g.createLinearGradient(0, GROUND_Y - 120, 0, GROUND_Y);
  hz.addColorStop(0, 'rgba(242,239,233,0)'); hz.addColorStop(1, 'rgba(242,239,233,.55)');
  g.fillStyle = hz; g.fillRect(0, GROUND_Y - 120, 2400, 120); // haze into horizon
  return c;
})();
const groundPatCv = (() => {                 // stipple + cross-hatch tile
  const c = mkCv(12, 12), g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(-2, 14); g.lineTo(14, -2); g.moveTo(-2, -2); g.lineTo(14, 14); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.07)';
  g.fillRect(3, 4, 1, 1); g.fillRect(8, 9, 1, 1); g.fillRect(10, 2, 1, 1);
  return c;
})();
const hatchPatCv = (() => {                  // block face diagonal hatch
  const c = mkCv(7, 7), g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(-1, 8); g.lineTo(8, -1); g.stroke();
  return c;
})();
const abyssCv = (() => {                     // gap pit: black depth + warm under-glow
  const c = mkCv(4, H - GROUND_Y), g = c.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, 0, c.height);
  lg.addColorStop(0, '#060504'); lg.addColorStop(.55, '#0b0806'); lg.addColorStop(1, '#2a1608');
  g.fillStyle = lg; g.fillRect(0, 0, 4, c.height);
  return c;
})();
const hazardCv = (() => {                    // hazard stripes for pit walls
  const c = mkCv(16, 16), g = c.getContext('2d')!;
  g.fillStyle = '#151009'; g.fillRect(0, 0, 16, 16);
  g.strokeStyle = 'rgba(240,140,0,.5)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(-4, 12); g.lineTo(12, -4); g.moveTo(-4, 28); g.lineTo(28, -4); g.stroke();
  return c;
})();
const finishGlowCv = (() => {                // green glow column at LEVEL_END
  const c = mkCv(140, 300), g = c.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, 140, 0);
  lg.addColorStop(0, 'rgba(43,138,62,0)'); lg.addColorStop(.5, 'rgba(43,138,62,.30)'); lg.addColorStop(1, 'rgba(43,138,62,0)');
  g.fillStyle = lg; g.fillRect(0, 0, 140, 300);
  const vg = g.createLinearGradient(0, 0, 0, 300);
  vg.addColorStop(0, 'rgba(43,138,62,0)'); vg.addColorStop(1, 'rgba(43,138,62,.25)');
  g.fillStyle = vg; g.fillRect(0, 0, 140, 300);
  return c;
})();
const redVinCv = (() => {                    // death edge flash
  const c = mkCv(W, H), g = c.getContext('2d')!;
  const rg = g.createRadialGradient(W / 2, H / 2, H * .32, W / 2, H / 2, H * .78);
  rg.addColorStop(0, 'rgba(200,30,20,0)'); rg.addColorStop(1, 'rgba(200,30,20,.55)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  return c;
})();
const bannerBandCv = (() => {                // letterboxed graded stripe
  const c = mkCv(W, 96), g = c.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0, 'rgba(20,17,12,0)'); lg.addColorStop(.12, 'rgba(20,17,12,.85)');
  lg.addColorStop(.88, 'rgba(20,17,12,.85)'); lg.addColorStop(1, 'rgba(20,17,12,0)');
  g.fillStyle = lg; g.fillRect(0, 0, W, 96);
  const vg = g.createLinearGradient(0, 0, 0, 96);
  vg.addColorStop(0, 'rgba(20,17,12,0)'); vg.addColorStop(.5, 'rgba(20,17,12,.35)'); vg.addColorStop(1, 'rgba(20,17,12,0)');
  g.fillStyle = vg; g.fillRect(0, 0, W, 96);
  return c;
})();
const bannerRuleCv = (() => {
  const c = mkCv(W, 2), g = c.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0, 'rgba(240,140,0,0)'); lg.addColorStop(.5, 'rgba(240,140,0,.8)'); lg.addColorStop(1, 'rgba(240,140,0,0)');
  g.fillStyle = lg; g.fillRect(0, 0, W, 2);
  return c;
})();
const progFillCv = (() => {                  // HUD progress fill
  const c = mkCv(300, 8), g = c.getContext('2d')!;
  const lg = g.createLinearGradient(0, 0, 300, 0);
  lg.addColorStop(0, '#c96a00'); lg.addColorStop(1, '#ffb03a');
  g.fillStyle = lg; g.fillRect(0, 0, 300, 8);
  return c;
})();
let groundPat: CanvasPattern | null = null, hatchPat: CanvasPattern | null = null, hazardPat: CanvasPattern | null = null;

// ---- small draw helpers ----
function drawParallax(): void {
  const px = mode === 'run' ? camX : drawT * 40;
  const tile = (cv2: HTMLCanvasElement, f: number) => {
    const off = -(((px * f) % cv2.width) + cv2.width) % cv2.width;
    ctx.drawImage(cv2, off, 0); ctx.drawImage(cv2, off + cv2.width, 0);
  };
  tile(bandFarCv, .22); tile(skylineCv, .32); tile(bandNearCv, .42);
}
function drawGround(): void {
  ctx.fillStyle = INK;
  ctx.fillRect(camX - 60, GROUND_Y, W + 120, H - GROUND_Y);
  ctx.fillStyle = groundPat!;
  ctx.fillRect(camX - 60, GROUND_Y, W + 120, H - GROUND_Y);
  for (const [, gx, gw] of GAPS) {           // true abyss, not a cutout
    ctx.drawImage(abyssCv, 0, 0, 4, H - GROUND_Y, gx, GROUND_Y, gw, H - GROUND_Y);
    ctx.save(); ctx.translate(gx, GROUND_Y);
    ctx.fillStyle = hazardPat!;
    ctx.fillRect(0, 0, 7, H - GROUND_Y); ctx.fillRect(gw - 7, 0, 7, H - GROUND_Y);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(7, 0, 2, H - GROUND_Y); ctx.fillRect(gw - 9, 0, 2, H - GROUND_Y);
    ctx.restore();
  }
  ctx.fillStyle = '#f8f4ea';                 // crisp 2px top highlight, broken at gaps
  let hx = camX - 60;
  for (const [, gx, gw] of GAPS) { ctx.fillRect(hx, GROUND_Y, gx - hx, 2); hx = gx + gw; }
  ctx.fillRect(hx, GROUND_Y, camX + W + 60 - hx, 2);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  for (const [, gx, gw] of GAPS) {           // pit lips
    ctx.fillRect(gx - 2, GROUND_Y, 2, 5); ctx.fillRect(gx + gw, GROUND_Y, 2, 5);
  }
}
function drawSpike(ox: number, ow: number): void {
  const mid = ox + ow / 2, top = GROUND_Y - 34;
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.moveTo(ox, GROUND_Y); ctx.lineTo(mid, top); ctx.lineTo(ox + ow, GROUND_Y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.30)';         // inner shade facet (right half)
  ctx.beginPath(); ctx.moveTo(mid, top); ctx.lineTo(ox + ow, GROUND_Y); ctx.lineTo(mid, GROUND_Y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(248,244,234,.55)'; ctx.lineWidth = 1.5; // lit edge
  ctx.beginPath(); ctx.moveTo(ox + 1, GROUND_Y - 1); ctx.lineTo(mid, top); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.35)';         // contact shadow
  ctx.fillRect(ox - 2, GROUND_Y - 2, ow + 4, 2);
}
function drawBlock(ox: number, ow: number, oh: number): void {
  const top = GROUND_Y - oh;
  ctx.fillStyle = BLOCK_INK; ctx.fillRect(ox, top, ow, oh);
  ctx.save(); ctx.beginPath(); ctx.rect(ox, top, ow, oh); ctx.clip();
  ctx.fillStyle = hatchPat!; ctx.fillRect(ox, top, ow, oh);
  ctx.restore();
  ctx.fillStyle = 'rgba(248,244,234,.5)'; ctx.fillRect(ox, top, ow, 3);          // top bevel
  ctx.fillStyle = 'rgba(248,244,234,.18)'; ctx.fillRect(ox, top, 3, oh);         // left bevel
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(ox, GROUND_Y - 4, ow, 4);      // base shade
  ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 2; ctx.strokeRect(ox + 1, top + 1, ow - 2, oh - 2);
}
function drawFinish(): void {
  ctx.globalAlpha = .8 + Math.sin(drawT * 2.4) * .2;
  ctx.drawImage(finishGlowCv, LEVEL_END - 66, GROUND_Y - 300);
  ctx.globalAlpha = 1;
  ctx.fillStyle = INK; ctx.fillRect(LEVEL_END - 2, GROUND_Y - 170, 5, 170);      // pole
  ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(LEVEL_END + .5, GROUND_Y - 174, 5, 0, 7); ctx.fill();
  const fw = 72, fh = 40, cs = 8;            // waving checkered pennant
  for (let r = 0; r < fh / cs; r++) for (let c2 = 0; c2 < fw / cs; c2++) {
    const wy = Math.sin(drawT * 6 + c2 * .8) * (c2 / (fw / cs)) * 5;
    ctx.fillStyle = (r + c2) % 2 ? INK : PAPER;
    ctx.fillRect(LEVEL_END + 3 + c2 * cs, GROUND_Y - 170 + r * cs + wy, cs, cs);
  }
  ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 1.5;
  ctx.strokeRect(LEVEL_END + 3, GROUND_Y - 170, fw, fh);
}
function drawFlags(): void {
  for (const cx of CHECKPOINTS) {
    const on = lastCp >= cx;
    if (on) {                                // claimed: soft green aura
      const rg = ctx.createRadialGradient(cx + 2, GROUND_Y - 44, 4, cx + 2, GROUND_Y - 44, 46);
      rg.addColorStop(0, 'rgba(43,138,62,.4)'); rg.addColorStop(1, 'rgba(43,138,62,0)');
      ctx.fillStyle = rg; ctx.fillRect(cx - 44, GROUND_Y - 90, 92, 92);
    }
    ctx.fillStyle = on ? '#2b8a3e' : '#868e96';
    ctx.fillRect(cx, GROUND_Y - 56, 4, 56);  // pole
    const wob = Math.sin(drawT * 5 + cx) * 2;
    ctx.beginPath();                         // pennant banner
    ctx.moveTo(cx + 4, GROUND_Y - 56);
    ctx.lineTo(cx + 26, GROUND_Y - 49 + wob);
    ctx.lineTo(cx + 4, GROUND_Y - 41);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = on ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.2)';
    ctx.fillRect(cx + 4, GROUND_Y - 54, 3, 12);
  }
}
function drawParticles(): void {
  for (const p of particles) {
    if (p.kind === 'dust') {
      ctx.globalAlpha = Math.max(0, p.life * 2.2);
      ctx.fillStyle = '#b9b0a0';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .8, 0, 7); ctx.fill();
    } else {                                 // death burst: ink/orange chromatic fragments
      ctx.globalAlpha = Math.min(1, p.life * 2);
      ctx.fillStyle = (p.s % 2 < 1) ? ORANGE : INK;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.x * .1 + p.life * 6);
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}
function drawDeathMarks(): void {
  if (drawT < deathMarkT) {                  // fading X at last death spot (decor only)
    const a = Math.max(0, (deathMarkT - drawT) / 1.6);
    ctx.save(); ctx.globalAlpha = a * .8; ctx.translate(deathX, deathY);
    ctx.strokeStyle = '#c0341d'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const r = 14 + (1 - a) * 10;
    ctx.beginPath();
    ctx.moveTo(-r, -r); ctx.lineTo(r, r); ctx.moveTo(r, -r); ctx.lineTo(-r, r);
    ctx.stroke(); ctx.restore();
  }
}
function drawCube(): void {
  for (const t of trail) {                   // fading motion ghosts
    ctx.save(); ctx.globalAlpha = t.a * .22;
    ctx.translate(t.x + CUBE / 2, t.y + CUBE / 2); ctx.rotate(t.rot);
    ctx.fillStyle = ORANGE; ctx.fillRect(-CUBE / 2, -CUBE / 2, CUBE, CUBE);
    ctx.restore();
  }
  const sq = squashT > 0 ? Math.sin(Math.min(1, squashT / .12) * Math.PI) * .18 : 0;
  const st = cube.grounded ? 0 : Math.max(0, 1 - Math.abs(cube.vy) / 700) * .12; // stretch at apex
  const sx = 1 + sq - st * .5, sy = 1 - sq + st;
  ctx.save();
  ctx.translate(cube.x + CUBE / 2, cube.y + CUBE / 2);
  ctx.rotate(cube.rot); ctx.scale(sx, sy);
  const rg = ctx.createRadialGradient(-6, -8, 2, 0, 0, CUBE * .75);
  rg.addColorStop(0, '#ffc25e'); rg.addColorStop(.55, ORANGE); rg.addColorStop(1, '#c96a00');
  ctx.fillStyle = rg; ctx.fillRect(-CUBE / 2, -CUBE / 2, CUBE, CUBE);
  ctx.strokeStyle = '#7a4500'; ctx.lineWidth = 3; ctx.strokeRect(-CUBE / 2, -CUBE / 2, CUBE, CUBE);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-CUBE / 2 + 4, -CUBE / 2 + 4, 7, 7);
  ctx.restore();
}
function drawHUD(): void {
  ctx.fillStyle = INK; ctx.font = '16px monospace';
  const prog = Math.min(100, Math.max(0, cube.x / LEVEL_END * 100));
  ctx.fillText(`ATTEMPT ${attempt}   DEATHS ${deaths}   ${prog.toFixed(0)}%   BEST ${(best * 100).toFixed(0)}%`, 16, 26);
  ctx.fillStyle = 'rgba(40,36,30,.28)';      // slim track
  ctx.fillRect(16, 36, 300, 8);
  ctx.strokeStyle = 'rgba(40,36,30,.5)'; ctx.lineWidth = 1; ctx.strokeRect(15.5, 35.5, 301, 9);
  ctx.fillStyle = 'rgba(40,36,30,.55)';      // tick marks at checkpoint xs
  for (const cx of CHECKPOINTS) ctx.fillRect(16 + 300 * cx / LEVEL_END - .5, 34, 1, 12);
  const pw = 300 * prog / 100;
  if (pw > 0) {
    ctx.save(); ctx.shadowColor = 'rgba(240,140,0,.8)'; ctx.shadowBlur = 7;
    ctx.drawImage(progFillCv, 0, 0, pw, 8, 16, 36, pw, 8);
    ctx.restore();
    ctx.fillStyle = '#ffd9a0'; ctx.fillRect(16 + pw - 2, 36, 2, 8);
  }
  if (practice) {
    ctx.fillStyle = '#2b8a3e'; ctx.font = 'bold 13px monospace';
    ctx.fillText('PRACTICE', 330, 44);
  }
  ctx.fillStyle = '#6f675a'; ctx.font = '13px monospace';
  ctx.fillText('SPACE/UP/Z/CLICK jump · R restart · ESC pause — IMPOSSIBLE RUN', 16, H - 14);
}
function banner(t: string): void {
  ctx.drawImage(bannerBandCv, 0, H / 2 - 48);
  ctx.drawImage(bannerRuleCv, 0, H / 2 - 46);
  ctx.drawImage(bannerRuleCv, 0, H / 2 + 44);
  ctx.save();
  ctx.shadowColor = 'rgba(240,140,0,.65)'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#fff'; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center';
  ctx.fillText(t, W / 2, H / 2 + 10);
  ctx.restore();
  ctx.textAlign = 'left';
}
function chip(r: Chip, t: string, on: boolean): void {  // beveled ink/orange button — rect = hit area
  chips.push(r);
  ctx.fillStyle = 'rgba(40,36,30,.35)'; ctx.fillRect(r.x + 3, r.y + 4, r.w, r.h); // drop shade
  ctx.fillStyle = on ? ORANGE : INK; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = on ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.14)';
  ctx.fillRect(r.x, r.y, r.w, 3); ctx.fillRect(r.x, r.y, 3, r.h);
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.fillRect(r.x, r.y + r.h - 3, r.w, 3); ctx.fillRect(r.x + r.w - 3, r.y, 3, r.h);
  ctx.strokeStyle = '#1a1712'; ctx.lineWidth = 2; ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  ctx.fillStyle = on ? '#241a08' : '#f2efe9'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
  ctx.fillText(t, r.x + r.w / 2, r.y + r.h / 2 + 6);
  ctx.textAlign = 'left';
}
function attractStrip(): void {              // attract mode: cube forever hopping spikes (clock-driven)
  const y0 = 284, S = 150, x0 = 90, span = 780;
  ctx.fillStyle = INK; ctx.fillRect(x0 - 30, y0, span + 60, 5);
  ctx.fillStyle = '#f8f4ea'; ctx.fillRect(x0 - 30, y0, span + 60, 2);
  for (let k = 0; k < 5; k++) {              // spike row
    const sx = x0 + k * S;
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.moveTo(sx - 16, y0); ctx.lineTo(sx, y0 - 26); ctx.lineTo(sx + 16, y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.moveTo(sx, y0 - 26); ctx.lineTo(sx + 16, y0); ctx.lineTo(sx, y0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(248,244,234,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx - 15, y0 - 1); ctx.lineTo(sx, y0 - 26); ctx.stroke();
  }
  const d = (drawT * 150) % (S * 5);         // cube travels the row, wraps
  const ph = ((d + S / 2) % S) / S;          // hop phase: apex over each spike
  const h = Math.sin(ph * Math.PI) * 58;
  const bx = x0 + d - 13, by = y0 - 26 - h;
  for (let i = 1; i <= 3; i++) {             // mini ghost trail
    const dd = d - i * 16; if (dd < 0) continue;
    const php = ((dd + S / 2) % S) / S;
    ctx.globalAlpha = .1;
    ctx.fillStyle = ORANGE;
    ctx.fillRect(x0 + dd - 13, y0 - 26 - Math.sin(php * Math.PI) * 58, 26, 26);
  }
  ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(bx + 13, by + 13);
  ctx.rotate(h > 1 ? ph * Math.PI / 2 : 0);  // quarter-turn per hop, flat on land
  const rg = ctx.createRadialGradient(-4, -5, 2, 0, 0, 20);
  rg.addColorStop(0, '#ffc25e'); rg.addColorStop(1, '#d97a00');
  ctx.fillStyle = rg; ctx.fillRect(-13, -13, 26, 26);
  ctx.strokeStyle = '#7a4500'; ctx.lineWidth = 2.5; ctx.strokeRect(-13, -13, 26, 26);
  ctx.restore();
}
function drawMenuBackdrop(): void {
  ctx.drawImage(bgCv, 0, 0);
  drawParallax();
}
function drawTitle(): void {
  drawMenuBackdrop();
  attractStrip();
  ctx.textAlign = 'center';
  ctx.font = 'bold 44px monospace';          // heavy stencil title, ink + hard shadow
  ctx.fillStyle = 'rgba(240,140,0,.9)'; ctx.fillText('IMPOSSIBLE RUN', W / 2 + 3, 140 + 3);
  ctx.fillStyle = 'rgba(40,36,30,.35)'; ctx.fillText('IMPOSSIBLE RUN', W / 2 + 1.5, 140 + 1.5);
  ctx.fillStyle = INK; ctx.fillText('IMPOSSIBLE RUN', W / 2, 140);
  ctx.fillStyle = ORANGE; ctx.fillRect(W / 2 - 250, 154, 500, 3);
  ctx.fillStyle = INK; ctx.fillRect(W / 2 - 250, 157, 500, 1);
  ctx.font = '15px monospace'; ctx.fillStyle = '#6f675a';
  ctx.fillText('— one-button rhythm runner · original evocation —', W / 2, 172);
  ctx.font = '16px monospace'; ctx.fillStyle = INK;
  ctx.fillText(`BEST ${(best * 100).toFixed(0)}%`, W / 2, 208);
  chip({ id: 'play', x: W / 2 - 110, y: 300, w: 220, h: 46 }, '▶ PLAY', true);
  chip({ id: 'practice-menu', x: W / 2 - 160, y: 360, w: 320, h: 34 }, 'PRACTICE — CHECKPOINTS', false);
  chip({ id: 'calibration', x: W / 2 - 160, y: 404, w: 320, h: 34 }, `CALIBRATION — INPUT OFFSET ${inputOffsetMs}ms`, false);
  chip({ id: 'settings', x: W / 2 - 160, y: 448, w: 320, h: 34 }, 'SETTINGS — SOUND', false);
  ctx.textAlign = 'center';
  ctx.font = '12px monospace'; ctx.fillStyle = '#8a8172';
  ctx.fillText('ENTER play · R practice · click/tap chips — ESC backs out of any screen', W / 2, 508);
  ctx.fillText('death respawns instantly · practice respawns at the last flag passed', W / 2, 524);
  ctx.textAlign = 'left';
}
function drawPracticeMenu(): void {
  drawMenuBackdrop();
  banner('PRACTICE — START FROM');
  const ids: [string, string, number][] = [
    ['cp-0', 'FULL RUN', 0],
    ['cp-2600', `FLAG 1 — ${(2600 / LEVEL_END * 100).toFixed(0)}%`, 2600],
    ['cp-4800', `FLAG 2 — ${(4800 / LEVEL_END * 100).toFixed(0)}%`, 4800],
    ['cp-6600', `FLAG 3 — ${(6600 / LEVEL_END * 100).toFixed(0)}%`, 6600],
    ['cp-8400', `FLAG 4 — ${(8400 / LEVEL_END * 100).toFixed(0)}%`, 8400],
  ];
  ids.forEach(([id, t], i) => chip({ id, x: W / 2 - 170, y: 322 + i * 38, w: 340, h: 32 }, t, i === 0));
  chip({ id: 'back-title', x: W / 2 - 60, y: 512, w: 120, h: 26 }, '◀ BACK', false);
}
function drawCalibration(): void {
  drawMenuBackdrop();
  banner('INPUT-OFFSET CALIBRATION');
  ctx.textAlign = 'center';
  ctx.font = '15px monospace'; ctx.fillStyle = INK;
  ctx.fillText('Touch screens report taps late; offset delays the effective jump press.', W / 2, H / 2 - 76);
  ctx.fillText('Tap − / + until jumps land on your beat. Persisted for this device.', W / 2, H / 2 - 54);
  ctx.font = 'bold 34px monospace'; ctx.fillStyle = ORANGE;
  ctx.fillText(`${inputOffsetMs} ms`, W / 2, H / 2 + 52);
  chip({ id: 'offset-minus', x: W / 2 - 170, y: H / 2 + 76, w: 60, h: 36 }, '−', false);
  chip({ id: 'offset-plus', x: W / 2 + 110, y: H / 2 + 76, w: 60, h: 36 }, '+', false);
  chip({ id: 'offset-reset', x: W / 2 - 50, y: H / 2 + 126, w: 100, h: 30 }, 'RESET', false);
  chip({ id: 'back-title', x: W / 2 - 60, y: H / 2 + 214, w: 120, h: 32 }, '◀ BACK', false);
  ctx.textAlign = 'center';
  ctx.font = '12px monospace'; ctx.fillStyle = '#8a8172';
  ctx.fillText('range 0–200ms in 10ms steps · −/+ keys also work · ESC back', W / 2, H / 2 + 176);
  ctx.textAlign = 'left';
}
function drawSettings(): void {
  drawMenuBackdrop();
  banner('SETTINGS — SOUND');
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  chip({ id: 'music-minus', x: W / 2 - 170, y: 324, w: 44, h: 30 }, '−', false);
  chip({ id: 'music-plus', x: W / 2 + 126, y: 324, w: 44, h: 30 }, '+', false);
  chip({ id: 'sfx-minus', x: W / 2 - 170, y: 362, w: 44, h: 30 }, '−', false);
  chip({ id: 'sfx-plus', x: W / 2 + 126, y: 362, w: 44, h: 30 }, '+', false);
  ctx.textAlign = 'center';
  ctx.font = '16px monospace'; ctx.fillStyle = INK;
  ctx.fillText(`MUSIC VOLUME   ${pct(settings.music)}`, W / 2 - 2, 344);
  ctx.fillText(`SFX VOLUME     ${pct(settings.sfx)}`, W / 2 - 2, 382);
  chip({ id: 'mute-toggle', x: W / 2 - 90, y: 404, w: 180, h: 32 }, settings.muted ? 'MUTED — TAP TO UNMUTE' : 'SOUND ON — TAP TO MUTE', settings.muted);
  chip({ id: 'back-settings', x: W / 2 - 60, y: 504, w: 120, h: 30 }, '◀ BACK', false);
  ctx.textAlign = 'center';
  ctx.font = '12px monospace'; ctx.fillStyle = '#8a8172';
  ctx.fillText('persisted on this device · also reachable from pause', W / 2, 458);
  ctx.textAlign = 'left';
}
function drawPauseMenu(): void {
  chip({ id: 'resume', x: W / 2 - 110, y: H / 2 + 62, w: 220, h: 38 }, '▶ RESUME', true);
  chip({ id: 'restart', x: W / 2 - 110, y: H / 2 + 108, w: 220, h: 34 }, 'RESTART ATTEMPT', false);
  chip({ id: 'settings', x: W / 2 - 110, y: H / 2 + 150, w: 220, h: 34 }, 'SETTINGS', false);
  chip({ id: 'quit', x: W / 2 - 110, y: H / 2 + 192, w: 220, h: 34 }, 'QUIT TO TITLE', false);
}
function drawClear(): void {
  banner('LEVEL CLEAR');
  ctx.textAlign = 'center';
  ctx.font = '16px monospace'; ctx.fillStyle = '#fff';
  ctx.fillText(`BEST ${(best * 100).toFixed(0)}%   ATTEMPTS ${attempt}   DEATHS ${deaths}`, W / 2, H / 2 + 42);
  chip({ id: 'retry', x: W / 2 - 230, y: H / 2 + 66, w: 220, h: 38 }, '▶ RUN AGAIN', true);
  chip({ id: 'clear-title', x: W / 2 + 10, y: H / 2 + 66, w: 220, h: 38 }, 'TITLE SCREEN', false);
  ctx.textAlign = 'left';
}

function draw(): void {
  const now = performance.now();
  const fdt = Math.min(.05, (now - drawLast) / 1000); drawLast = now; drawT += fdt;
  if (!groundPat) {                          // one-time pattern bind to live ctx
    groundPat = ctx.createPattern(groundPatCv, 'repeat');
    hatchPat = ctx.createPattern(hatchPatCv, 'repeat');
    hazardPat = ctx.createPattern(hazardCv, 'repeat');
  }
  chips = [];
  if (mode === 'title') {
    if (screen === 'title') return drawTitle();
    if (screen === 'practice') return drawPracticeMenu();
    if (screen === 'calibration') return drawCalibration();
    return drawSettings();
  }

  // ---- draw-only transition detection (never feeds back into sim) ----
  if (state === 'dead' && prevState !== 'dead') {
    shakeT = .3; flashT = .3; deathX = cube.x + CUBE / 2; deathY = Math.min(cube.y + CUBE / 2, GROUND_Y - 10);
    deathMarkT = drawT + 1.6; trail = [];
  }
  if (state === 'running' && prevState === 'dead') { trail = []; respawnTick(); }
  if (state === 'running' && !paused && screen === null) {
    if (!prevGrounded && cube.grounded) {    // landing: squash + dust poof via shared particles array
      squashT = .12;
      for (let i = 0; i < 6; i++) particles.push({
        kind: 'dust', x: cube.x + CUBE / 2 + (Math.random() - .5) * CUBE, y: cube.y + CUBE - 2,
        vx: (Math.random() - .5) * 130, vy: -Math.random() * 70 - 15, s: 2 + Math.random() * 3, life: .3 + Math.random() * .15
      });
    }
    trail.unshift({ x: cube.x, y: cube.y, rot: cube.rot, a: 1 });
    if (trail.length > 6) trail.pop();
  }
  for (const t of trail) t.a -= fdt * 6;
  while (trail.length && trail[trail.length - 1].a <= 0) trail.pop();
  prevGrounded = cube.grounded; prevState = state;
  squashT = Math.max(0, squashT - fdt); shakeT = Math.max(0, shakeT - fdt); flashT = Math.max(0, flashT - fdt);

  const shx = shakeT > 0 ? (Math.random() - .5) * 7 * (shakeT / .3) : 0;
  const shy = shakeT > 0 ? (Math.random() - .5) * 5 * (shakeT / .3) : 0;

  ctx.drawImage(bgCv, 0, 0);
  drawParallax();
  ctx.save(); ctx.translate(-camX + shx, shy);
  drawGround();
  for (const [t, ox, ow, oh] of LEVEL) {
    if (t === 'spike') drawSpike(ox, ow);
    else if (t === 'block') drawBlock(ox, ow, oh ?? 0);
  }
  drawFinish();
  if (practice) drawFlags();
  drawParticles();
  drawDeathMarks();
  if (state !== 'dead') drawCube();
  ctx.restore();
  drawHUD();
  if (flashT > 0) { ctx.globalAlpha = flashT / .3; ctx.drawImage(redVinCv, 0, 0); ctx.globalAlpha = 1; }
  if (state === 'clear') return drawClear();
  if (screen === 'settings') {
    ctx.fillStyle = 'rgba(20,17,12,.55)'; ctx.fillRect(0, 0, W, H);
    return drawSettings();
  }
  if (paused) { banner('PAUSED'); drawPauseMenu(); }
  if (state === 'dead') banner('DEAD — respawning…');
}

// ---- main loop: 120Hz accumulator ----
let acc = 0, last = performance.now();
function frame(now: number): void {
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  pollInput();
  while (acc >= DT) { step(DT); acc -= DT; }
  for (const p of particles) { p.x += p.vx * DT; p.y += p.vy * DT; p.vy += GRAV * DT * .6; p.life -= DT; }
  particles = particles.filter(p => p.life > 0);
  if (mode === 'run' && state !== 'dead') camX = cube.x - 220;
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// PROOF/debug hook (not gameplay)
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __maga: unknown }).__maga = {
    get state() { return state; }, get x() { return cube.x; }, get y() { return cube.y; },
    get attempt() { return attempt; }, get deaths() { return deaths; },
    get progress() { return cube.x / LEVEL_END; },
    get mode() { return mode; }, get screen() { return screen; },
    get practice() { return practice; }, get lastCp() { return lastCp; },
    get inputOffset() { return inputOffsetMs; }, get respawnMs() { return respawnMs; },
    get paused() { return paused; },
    get chips() { return chips; },
    sfx,
    jump: pressJump, reset: () => { mode = 'run'; screen = null; reset(false); },
    teleport(x: number) { cube.x = x; }, die,
    LEVEL_END,
  };
  Object.defineProperty(window, '__proto', {
    value: {
      get state() { return state; }, get x() { return cube.x; }, get y() { return cube.y; },
      get attempt() { return attempt; }, get deaths() { return deaths; },
      get grounded() { return cube.grounded; },
      get progress() { return cube.x / LEVEL_END; },
      get camX() { return camX; }, get paused() { return paused; },
      get best() { return best; },
      get mode() { return mode; }, get practice() { return practice; },
      get lastCp() { return lastCp; }, get inputOffset() { return inputOffsetMs; },
      get respawnMs() { return respawnMs; },
      get LEVEL() { return LEVEL; }, get LEVEL_END() { return LEVEL_END; },
      get CHECKPOINTS() { return CHECKPOINTS; },
    },
    configurable: true, enumerable: true, writable: false,
  });
}

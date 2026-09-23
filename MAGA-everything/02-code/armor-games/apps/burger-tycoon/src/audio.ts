/**
 * Burger Tycoon — audio cues (MAESTRO doctrine: WebAudio recipes only,
 * zero binary assets). Soft corporate Muzak bed + UI/economy cues composed
 * from arcade-core Sfx primitives (square_blip / saw_thud / noise_burst).
 */

import type { Sfx } from '@maga/arcade-core';

/** Elevator Muzak: I-vi-IV-V in C, pads with a light lead, triangle wash. */
const MUZAK: (number | number[])[] = [
  [130.8, 196.0], 0, [164.8, 261.6], 0,
  [110.0, 261.6], 0, [196.0, 329.6], 0,
  [87.31, 174.6], 0, [130.8, 261.6], 0,
  [98.0, 196.0], 0, [146.8, 293.7], [164.8, 329.6],
];

export function startMuzak(sfx: Sfx): void {
  sfx.startMusic(MUZAK, 300, { wave: 'triangle', volume: 0.3 });
}

export type Cue =
  | 'click' | 'cash' | 'sow' | 'cattle' | 'slaughter'
  | 'dirtyOn' | 'dirtyOff' | 'promo' | 'pr' | 'bribe'
  | 'outbreak' | 'board' | 'collapse' | 'start';

export function playCue(sfx: Sfx, cue: Cue): void {
  switch (cue) {
    case 'click': sfx.preset('ui'); break;
    case 'cash':
      sfx.blip({ wave: 'square', freq: 988, duration: 0.06, volume: 0.5 });
      setTimeout(() => sfx.blip({ wave: 'square', freq: 1319, duration: 0.09, volume: 0.5 }), 55);
      sfx.blip({ wave: 'square', freq: 2400, freqEnd: 3200, duration: 0.04, volume: 0.12, noise: 0.5, filter: { type: 'highpass', freq: 2400 } });
      break;
    case 'sow':
      sfx.blip({ wave: 'triangle', freq: 240, freqEnd: 520, duration: 0.12, volume: 0.6, noise: 0.4, filter: { type: 'lowpass', freq: 1200 } });
      break;
    case 'cattle': sfx.blip({ wave: 'sawtooth', freq: 95, freqEnd: 48, duration: 0.16, volume: 0.7 }); break;
    case 'slaughter':
      sfx.blip({ wave: 'sawtooth', freq: 140, freqEnd: 42, duration: 0.18, volume: 0.8, noise: 0.5, filter: { type: 'lowpass', freq: 700 } });
      break;
    case 'dirtyOn':
      sfx.blip({ wave: 'sawtooth', freq: 66, freqEnd: 52, duration: 0.55, volume: 0.65, noise: 0.25, filter: { type: 'lowpass', freq: 320 } });
      break;
    case 'dirtyOff': sfx.blip({ wave: 'square', freq: 220, freqEnd: 130, duration: 0.09, volume: 0.5 }); break;
    case 'promo':
      sfx.blip({ wave: 'square', freq: 784, duration: 0.05, volume: 0.45 });
      setTimeout(() => sfx.blip({ wave: 'square', freq: 1047, duration: 0.07, volume: 0.45 }), 50);
      break;
    case 'pr': sfx.blip({ wave: 'sine', freq: 900, freqEnd: 300, duration: 0.28, volume: 0.4, noise: 0.7, filter: { type: 'bandpass', freq: 1400, Q: 0.8 } }); break;
    case 'bribe':
      sfx.blip({ wave: 'sine', freq: 190, freqEnd: 85, duration: 0.3, volume: 0.7 });
      sfx.blip({ wave: 'square', freq: 2600, duration: 0.03, volume: 0.15 });
      break;
    case 'outbreak':
      sfx.blip({ wave: 'sawtooth', freq: 620, freqEnd: 880, duration: 0.14, volume: 0.7 });
      sfx.blip({ wave: 'sawtooth', freq: 880, freqEnd: 620, duration: 0.16, volume: 0.7 });
      break;
    case 'board': sfx.blip({ wave: 'sawtooth', freq: 160, freqEnd: 55, duration: 0.2, volume: 0.75 }); break;
    case 'collapse':
      sfx.blip({ wave: 'sawtooth', freq: 330, freqEnd: 38, duration: 0.85, volume: 0.85, noise: 0.3, filter: { type: 'lowpass', freq: 900 } });
      sfx.preset('death');
      break;
    case 'start':
      [262, 330, 392, 523].forEach((f, i) => setTimeout(() => sfx.blip({ wave: 'square', freq: f, duration: 0.08, volume: 0.5 }), i * 70));
      break;
  }
}

/** per-pane action index -> cue (dirty toggles pick their own on/off cue) */
export const ACTION_CUES: Record<string, (Cue | null)[]> = {
  farm: ['sow', 'cattle', null],
  feed: ['slaughter', null],
  rest: ['promo', null],
  hq: ['cash', 'pr', 'bribe'],
};

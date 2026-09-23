/**
 * Arena of Bonks — audio cues (MAESTRO doctrine: WebAudio recipes only,
 * zero binary assets). Arena march bed + combat/UI cues composed from
 * arcade-core Sfx primitives (square_blip / saw_thud / noise_burst).
 */

import type { Sfx } from '@maga/arcade-core';

/** Arena march: i–VI–VII–i in D dorian, war-drum rests, triangle low wash. */
const MARCH: (number | number[])[] = [
  [146.83, 220, 293.66], 0, [220, 293.66], 0,
  [116.54, 174.61, 293.66], 0, [174.61, 293.66], 0,
  [130.81, 196, 329.63], 0, [196, 329.63], 0,
  [146.83, 220, 293.66], 0, [196, 246.94, 392], [220, 293.66, 440],
];

export function startArenaMusic(sfx: Sfx): void {
  sfx.startMusic(MARCH, 170, { wave: 'triangle', volume: 0.32 });
}

export type Cue =
  | 'click' | 'start' | 'swing' | 'swingHeavy' | 'thud' | 'clink'
  | 'glug' | 'taunt' | 'crowd' | 'fanfare' | 'sting' | 'buy' | 'coin';

export function playCue(sfx: Sfx, cue: Cue): void {
  switch (cue) {
    case 'click': sfx.preset('ui'); break;
    case 'start':
      [262, 330, 392, 523].forEach((f, i) => setTimeout(() => sfx.blip({ wave: 'square', freq: f, duration: 0.08, volume: 0.5 }), i * 70));
      break;
    case 'swing': sfx.blip({ wave: 'sawtooth', freq: 950, freqEnd: 320, duration: 0.08, volume: 0.55, noise: 0.6, filter: { type: 'bandpass', freq: 1400, Q: 0.7 } }); break;
    case 'swingHeavy': sfx.blip({ wave: 'sawtooth', freq: 520, freqEnd: 140, duration: 0.14, volume: 0.7, noise: 0.7, filter: { type: 'lowpass', freq: 900 } }); break;
    case 'thud':
      sfx.preset('hit');
      sfx.blip({ wave: 'sine', freq: 160, freqEnd: 55, duration: 0.12, volume: 0.7, noise: 0.5, filter: { type: 'lowpass', freq: 500 } });
      break;
    case 'clink':
      sfx.blip({ wave: 'square', freq: 1830, duration: 0.04, volume: 0.4 });
      sfx.blip({ wave: 'square', freq: 2440, duration: 0.06, volume: 0.3 });
      break;
    case 'glug':
      sfx.blip({ wave: 'sine', freq: 320, freqEnd: 90, duration: 0.22, volume: 0.6, noise: 0.4, filter: { type: 'lowpass', freq: 700 } });
      setTimeout(() => sfx.blip({ wave: 'triangle', freq: 520, freqEnd: 780, duration: 0.1, volume: 0.4 }), 150);
      break;
    case 'taunt':
      [392, 523, 392, 330].forEach((f, i) => setTimeout(() => sfx.blip({ wave: 'square', freq: f, duration: 0.06, volume: 0.4 }), i * 60));
      break;
    case 'crowd':
      sfx.blip({ wave: 'sawtooth', freq: 220, freqEnd: 660, duration: 0.5, volume: 0.35, noise: 0.8, filter: { type: 'bandpass', freq: 900, Q: 0.5 } });
      [523, 659, 784].forEach((f, i) => setTimeout(() => sfx.blip({ wave: 'triangle', freq: f, duration: 0.12, volume: 0.3 }), 120 + i * 80));
      break;
    case 'fanfare':
      [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => sfx.blip({ wave: 'square', freq: f, duration: 0.12, volume: 0.5 }), i * 110));
      setTimeout(() => sfx.blip({ wave: 'square', freq: 1319, duration: 0.4, volume: 0.45 }), 5 * 110);
      break;
    case 'sting':
      [392, 311, 262, 196].forEach((f, i) => setTimeout(() => sfx.blip({ wave: 'sawtooth', freq: f, duration: 0.16, volume: 0.5 }), i * 130));
      break;
    case 'buy':
      sfx.blip({ wave: 'square', freq: 988, duration: 0.06, volume: 0.5 });
      setTimeout(() => sfx.blip({ wave: 'square', freq: 1319, duration: 0.09, volume: 0.5 }), 60);
      break;
    case 'coin': sfx.preset('pickup'); break;
  }
}

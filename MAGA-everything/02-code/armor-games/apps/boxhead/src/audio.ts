import type { Sfx } from '@maga/arcade-core';

/**
 * Crateheads audio — the boxhead-2play sound bible (06-audio/) rendered with
 * arcade-core's WebAudio engine. Zero binary assets; every cue is a recipe
 * from `boxhead-2play-recipes.json` / the bible's recipe sections, adapted to
 * the `blip()` primitive (osc + noise + filter + exponential envelope).
 */

const NOTE: Record<string, number> = {
  G1: 49.0, C2: 65.41, G2: 98.0,
  C3: 130.81, Eb3: 155.56, G3: 196.0, Bb3: 233.08,
  Eb4: 311.13,
  C4: 261.63, E4: 329.63, G4: 392.0, Bb4: 466.16, C5: 523.25, E5: 659.26,
};

/** arpeggio helper — sequential square chips at `bpm` */
function arp(sfx: Sfx, notes: string[], bpm: number, volume: number, wave: 'square' | 'sawtooth' | 'triangle' = 'square'): void {
  const step = 60000 / bpm;
  notes.forEach((n, i) => {
    setTimeout(() => sfx.blip({ wave, freq: NOTE[n], duration: 0.09, volume }), i * step);
  });
}

export type Cue =
  | 'pistol' | 'shotgun' | 'uzi' | 'grenadeThrow' | 'empty'
  | 'zombieHit' | 'zombieDeath' | 'playerHurt' | 'playerDeath' | 'specialSpawn'
  | 'pickup' | 'explode' | 'unlock' | 'waveStart'
  | 'uiMove' | 'uiConfirm' | 'playerJoin' | 'gameOver' | 'highScore' | 'victory';

export function playCue(sfx: Sfx, cue: Cue): void {
  switch (cue) {
    // --- weapons (bible §Player weapons) ---
    case 'pistol':
      // noise_burst + square through bandpass (recipes: sfx.pistol_fire)
      sfx.blip({ wave: 'square', freq: 420, freqEnd: 180, duration: 0.07, volume: 0.28, noise: 0.75, filter: { type: 'bandpass', freq: 1200, Q: 0.9 } });
      break;
    case 'shotgun':
      // wide noise slap + sub thud (recipes: sfx.shotgun_fire)
      sfx.blip({ wave: 'sawtooth', freq: 90, freqEnd: 50, duration: 0.14, volume: 0.34, noise: 1.0, filter: { type: 'lowpass', freq: 2400, Q: 0.5 } });
      break;
    case 'uzi':
      // thin rapid tick (recipes: sfx.uzi_fire) — must stack at high RoF
      sfx.blip({ wave: 'square', freq: 880, freqEnd: 440, duration: 0.035, volume: 0.2, noise: 0.25 });
      break;
    case 'grenadeThrow':
      sfx.blip({ wave: 'square', freq: 220, freqEnd: 140, duration: 0.08, volume: 0.3 });
      break;
    case 'empty':
      sfx.blip({ wave: 'square', freq: 140, freqEnd: 90, duration: 0.05, volume: 0.5 });
      break;
    // --- enemies (bible §Enemies) ---
    case 'zombieHit':
      sfx.blip({ wave: 'sawtooth', freq: 200, freqEnd: 90, duration: 0.06, volume: 0.28, noise: 0.5, filter: { type: 'lowpass', freq: 900, Q: 0.6 } });
      break;
    case 'zombieDeath':
      // dull meaty pop (recipes: sfx.zombie_death)
      sfx.blip({ wave: 'sawtooth', freq: 160, freqEnd: 70, duration: 0.11, volume: 0.22, noise: 0.7, filter: { type: 'lowpass', freq: 900, Q: 0.6 } });
      break;
    case 'specialSpawn':
      // alarm-ish chirp so the horned runner reads in chaos (sfx.special_spawn)
      sfx.blip({ wave: 'square', freq: 200, freqEnd: 600, duration: 0.28, volume: 0.24 });
      break;
    // --- players / world ---
    case 'playerHurt':
      sfx.blip({ wave: 'sawtooth', freq: 200, freqEnd: 60, duration: 0.12, volume: 0.55, noise: 0.6 });
      break;
    case 'playerDeath':
      sfx.blip({ wave: 'sawtooth', freq: 320, freqEnd: 40, duration: 0.4, volume: 0.8, noise: 0.3, filter: { type: 'lowpass', freq: 900 } });
      break;
    case 'pickup':
      // bright upward chip (recipes: sfx.ammo_pickup)
      sfx.blip({ wave: 'square', freq: 660, freqEnd: 990, duration: 0.09, volume: 0.16 });
      break;
    case 'explode': {
      // saw_thud + pink-ish noise (recipes: sfx.barrel_explode, shared by grenades)
      sfx.blip({ wave: 'sawtooth', freq: 110, freqEnd: 38, duration: 0.42, volume: 0.38, noise: 0.85, filter: { type: 'lowpass', freq: 800, Q: 0.8 } });
      // duck the music bed ~200 ms per the bible's mix targets
      const music = sfx.musicVolume;
      sfx.musicVolume = music * 0.35;
      setTimeout(() => { sfx.musicVolume = music; }, 200);
      break;
    }
    case 'unlock':
      // fm_chirp + arpeggio (recipes: sfx.weapon_unlock)
      arp(sfx, ['C4', 'E4', 'G4', 'C5'], 180, 0.2);
      break;
    case 'waveStart':
      arp(sfx, ['C4', 'E4', 'G4'], 200, 0.16);
      break;
    // --- UI / session (bible §UI) ---
    case 'uiMove':
      sfx.blip({ wave: 'square', freq: 520, freqEnd: 620, duration: 0.04, volume: 0.12 });
      break;
    case 'uiConfirm':
      sfx.blip({ wave: 'square', freq: 440, freqEnd: 880, duration: 0.08, volume: 0.16 });
      break;
    case 'playerJoin':
      arp(sfx, ['C4', 'E4', 'G4'], 160, 0.14);
      break;
    case 'gameOver':
      // descending sting (recipes: ui.game_over)
      arp(sfx, ['G3', 'Eb3', 'C3', 'G2'], 90, 0.22, 'sawtooth');
      break;
    case 'highScore':
      arp(sfx, ['C4', 'E4', 'G4', 'C5', 'E5'], 140, 0.2);
      break;
    case 'victory':
      arp(sfx, ['C4', 'E4', 'G4', 'C5'], 160, 0.2);
      break;
  }
}

/** menu bed — drone + sparse arpeggio (recipes: music.menu, triangle) */
export function startMenuMusic(sfx: Sfx): void {
  sfx.startMusic([NOTE.C3, 0, NOTE.Eb3, 0, NOTE.G3, 0, NOTE.Bb3, 0], 230, { wave: 'triangle', volume: 0.09 });
}

/** combat bed — bass pulse on beats 1+3 (recipes: music.combat, square, bpm 128) */
export function startCombatMusic(sfx: Sfx): void {
  sfx.startMusic([NOTE.C2, 0, NOTE.C2, 0, NOTE.G1, 0, NOTE.C2, NOTE.G2], 140, { wave: 'square', volume: 0.1 });
}

/** deathmatch bed — same engine, faster step (bible gap: distinct DM bed) */
export function startDmMusic(sfx: Sfx): void {
  sfx.startMusic([NOTE.C2, 0, NOTE.C2, 0, NOTE.G1, 0, NOTE.C2, NOTE.G2], 110, { wave: 'square', volume: 0.1 });
}

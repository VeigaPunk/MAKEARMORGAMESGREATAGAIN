/**
 * WebAudio synth SFX — zero binary assets, 8-bit envelope style.
 * MAESTRO owns the per-title recipes; this is the rendering engine.
 *
 * Mix buses: sfxBus -> master -> destination, musicBus -> master -> destination.
 * `volume` is the master level, `sfxVolume`/`musicVolume` per-bus multipliers;
 * all are plain public fields applied per voice, so live assignment
 * (`sfx.muted = true`) keeps working for every existing app.
 */

export type Wave = 'square' | 'triangle' | 'sawtooth' | 'sine';

export interface BlipFilter {
  type: BiquadFilterType;
  freq: number;
  Q?: number;
}

export interface BlipOptions {
  wave?: Wave;
  /** Hz */
  freq?: number;
  freqEnd?: number;
  /** seconds */
  duration?: number;
  volume?: number;
  /** 0..1 white-noise mix ( doctrine: noise_burst primitive ) */
  noise?: number;
  filter?: BlipFilter;
}

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  /** total voices scheduled since boot — verification-readable */
  voices = 0;
  muted = false;
  /** master level */
  volume = 0.5;
  /** per-bus multipliers (1 = unchanged legacy behavior) */
  sfxVolume = 1;
  musicVolume = 1;

  /** true when the AudioContext exists and is running (verification hook) */
  get running(): boolean {
    return this.ctx?.state === 'running';
  }

  private ensure(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
      this.master = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.applyGains();
    return this.ctx;
  }

  private applyGains(): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.setValueAtTime(this.muted ? 0 : this.volume, t);
    this.sfxBus!.gain.setValueAtTime(this.sfxVolume, t);
    this.musicBus!.gain.setValueAtTime(this.musicVolume, t);
  }

  private noiseSource(ctx: AudioContext): AudioBufferSourceNode {
    if (!this.noiseBuf) {
      const len = Math.floor(ctx.sampleRate * 0.3);
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    return src;
  }

  /** short envelope blip — the atomic unit of retro sound */
  blip(opts: BlipOptions = {}): void {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const { wave = 'square', freq = 440, freqEnd = freq, duration = 0.08, volume = 1, noise = 0, filter } = opts;
    const t0 = ctx.currentTime;
    const tail = t0 + duration;
    let dest: AudioNode = this.sfxBus!;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type;
      f.frequency.setValueAtTime(filter.freq, t0);
      if (filter.Q !== undefined) f.Q.value = filter.Q;
      f.connect(this.sfxBus!);
      dest = f;
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(volume * (noise > 0 ? 1 - noise * 0.5 : 1), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, tail);
    g.connect(dest);
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), tail);
    osc.connect(g);
    osc.start(t0);
    osc.stop(tail);
    if (noise > 0) {
      const src = this.noiseSource(ctx);
      const ng = ctx.createGain();
      ng.gain.value = noise;
      src.connect(ng).connect(g);
      src.start(t0);
      src.stop(tail);
    }
    this.voices += 1;
  }

  /** named presets — extend per title with MAESTRO's spec */
  preset(name: 'shoot' | 'hit' | 'pickup' | 'death' | 'ui'): void {
    switch (name) {
      case 'shoot': this.blip({ wave: 'square', freq: 880, freqEnd: 220, duration: 0.07 }); break;
      case 'hit': this.blip({ wave: 'sawtooth', freq: 200, freqEnd: 60, duration: 0.12 }); break;
      case 'pickup': this.blip({ wave: 'triangle', freq: 660, freqEnd: 1320, duration: 0.09 }); break;
      case 'death': this.blip({ wave: 'sawtooth', freq: 320, freqEnd: 40, duration: 0.4, volume: 0.8 }); break;
      case 'ui': this.blip({ wave: 'square', freq: 520, freqEnd: 700, duration: 0.05, volume: 0.6 }); break;
    }
  }

  // --- music slot (BH-3.2 MAESTRO drop zone) ----------------------------------
  private musicTimer: number | null = null;
  private musicStep = 0;

  /**
   * Loop a step sequence of notes (Hz; 0 = rest; array = chord). This is the
   * music SLOT — MAESTRO replaces the pattern per title; games only call
   * start/stop. Honors `muted` live: muting silences the next scheduled step.
   */
  startMusic(notes: (number | number[])[], stepMs = 140, opts: BlipOptions = {}): void {
    this.stopMusic();
    this.musicStep = 0;
    const ctx = this.ensure();
    if (!ctx) return;
    this.musicTimer = setInterval(() => {
      const f = notes[this.musicStep % notes.length];
      this.musicStep += 1;
      if (this.muted || !f) return;
      const chord = Array.isArray(f) ? f : [f];
      const c = this.ensure();
      if (!c) return;
      const dur = stepMs / 1000 * 0.9;
      for (const fq of chord) {
        if (fq <= 0) continue;
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = opts.wave ?? 'triangle';
        osc.frequency.setValueAtTime(fq, c.currentTime);
        g.gain.setValueAtTime((opts.volume ?? 0.35), c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
        osc.connect(g).connect(this.musicBus!);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + dur);
        this.voices += 1;
      }
    }, stepMs);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

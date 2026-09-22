/**
 * Integer scaling, letterboxed — the originals ran at fixed resolutions and
 * we scale them the same way the Flash letterbox did: integer factors only.
 */

export interface Viewport { width: number; height: number }

/** largest integer factor that fits the viewport (>= 1) */
export function fitIntegerScale(stageW: number, stageH: number, vp: Viewport, maxFactor = 4): number {
  const f = Math.floor(Math.min(vp.width / stageW, vp.height / stageH));
  return Math.max(1, Math.min(f, maxFactor));
}

/** centered letterbox offsets for the scaled stage */
export function letterboxOffset(stageW: number, stageH: number, scale: number, vp: Viewport): { x: number; y: number } {
  return {
    x: Math.floor((vp.width - stageW * scale) / 2),
    y: Math.floor((vp.height - stageH * scale) / 2),
  };
}

export function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

// Synthetic flash thermography of a PLA plate with four subsurface cracks.
// Shared by the server-rendered charts and the client canvas.
//
// After a flash, a sound surface cools as 1/√t (1D diffusion into a thick
// body). Above a crack at depth L, heat reflected by the air gap keeps the
// surface warmer from about t ≈ L²/α on, so deeper cracks appear later and
// fainter. Lateral diffusion slowly washes the contrast out.
//
// The phase of each pixel's Fourier transform does not depend on how much
// energy the pixel received, so uneven lamp heating cancels out of it.

export const PLATE = { w: 120, h: 90 }; // mm
export const NX = 160;
export const NY = 120;
export const ALPHA = 1e-7; // m²/s, order of magnitude for PLA
export const T_MIN = 0.3; // s
export const T_MAX = 100; // s
const K = 0.3; // contrast scale
const REFLECT = 0.8;
const HALF_WIDTH = 1.6; // mm
const LATERAL_R = 1e-3; // m
const NOISE = 0.002;
const N_SAMPLES = 200;

export interface Crack {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number; // mm
}

// Plate coordinates in mm, origin top left
export const CRACKS: Crack[] = [
  { x1: 18, y1: 22, x2: 48, y2: 31, depth: 0.4 },
  { x1: 78, y1: 14, x2: 98, y2: 40, depth: 0.8 },
  { x1: 22, y1: 62, x2: 54, y2: 72, depth: 1.2 },
  { x1: 68, y1: 64, x2: 102, y2: 58, depth: 1.8 },
];

export const depthText = (mm: number) => `${mm.toFixed(1)} mm`;

/** Uneven halogen heating: a hot spot left of centre. */
export const lamp = (x: number, y: number) => 1 + 0.35 * Math.exp(-((x - 42) ** 2 + (y - 38) ** 2) / (2 * 30 ** 2));

export const base = (t: number) => 1 / Math.sqrt(t);

/** Relative excess temperature over a crack centre at time t. */
export function contrast(depthMm: number, t: number): number {
  const L = depthMm * 1e-3;
  let s = 0;
  for (let n = 1; n <= 3; n++) s += REFLECT ** n * Math.exp(-((n * L) ** 2) / (ALPHA * t));
  return (K * 2 * s) / (1 + (ALPHA * t) / LATERAL_R ** 2);
}

/** Surface temperature at a crack centre (lamp factor 1, no noise). */
export const crackCurve = (depthMm: number, t: number) => base(t) * (1 + contrast(depthMm, t));

// Slider position 0–100 maps to time on a log scale
export const timeAt = (v: number) => T_MIN * (T_MAX / T_MIN) ** (v / 100);
export const sliderAt = (t: number) => (100 * Math.log(t / T_MIN)) / Math.log(T_MAX / T_MIN);

// ---------- palettes ----------

const IRON: [number, [number, number, number]][] = [
  [0, [12, 6, 34]],
  [0.25, [84, 14, 138]],
  [0.5, [196, 42, 96]],
  [0.75, [248, 138, 24]],
  [1, [255, 246, 196]],
];

export function iron(v: number): [number, number, number] {
  const t = Math.min(1, Math.max(0, v));
  for (let i = 1; i < IRON.length; i++) {
    if (t <= IRON[i][0]) {
      const [t0, c0] = IRON[i - 1];
      const [t1, c1] = IRON[i];
      const k = (t - t0) / (t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
    }
  }
  return IRON[IRON.length - 1][1];
}

export const ironGradient = () =>
  `linear-gradient(to right, ${IRON.map(([t, c]) => `rgb(${c.join(',')}) ${t * 100}%`).join(', ')})`;

// ---------- field ----------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function segDist(px: number, py: number, c: Crack) {
  const dx = c.x2 - c.x1;
  const dy = c.y2 - c.y1;
  const k = Math.max(0, Math.min(1, ((px - c.x1) * dx + (py - c.y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (c.x1 + k * dx), py - (c.y1 + k * dy));
}

export interface Field {
  weights: Float32Array[]; // per crack, per pixel 0..1
  lamp: Float32Array;
  noise: Float32Array; // fixed-pattern noise per pixel
  phase: Float32Array; // 0..1 display value
}

/** Per-pixel crack weights, lamp profile, noise and the phase image. */
export function buildField(seed = 11): Field {
  const rnd = mulberry32(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const n = NX * NY;
  const weights = CRACKS.map(() => new Float32Array(n));
  const lampF = new Float32Array(n);
  const noise = new Float32Array(n);
  const sx = PLATE.w / NX;
  const sy = PLATE.h / NY;

  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const p = j * NX + i;
      const x = (i + 0.5) * sx;
      const y = (j + 0.5) * sy;
      lampF[p] = lamp(x, y);
      noise[p] = gauss();
      CRACKS.forEach((c, ci) => {
        // Deeper cracks look wider and softer at the surface
        const d = Math.max(0, segDist(x, y, c) - HALF_WIDTH);
        const s = 0.6 + 0.9 * c.depth;
        weights[ci][p] = Math.exp(-(d * d) / (2 * s * s));
      });
    }
  }

  // Fourier transform at the first frequency bin. The signal is linear in the
  // weights, so each term's transform is computed once:
  //   X(pixel) = lamp · (B + Σ w_c · F_c) + noise
  const dt = (T_MAX - T_MIN) / N_SAMPLES;
  let bRe = 0;
  let bIm = 0;
  const fRe = CRACKS.map(() => 0);
  const fIm = CRACKS.map(() => 0);
  for (let s = 0; s < N_SAMPLES; s++) {
    const t = T_MIN + s * dt;
    const a = (-2 * Math.PI * s) / N_SAMPLES;
    const b = base(t);
    bRe += b * Math.cos(a);
    bIm += b * Math.sin(a);
    CRACKS.forEach((c, ci) => {
      const v = b * contrast(c.depth, t);
      fRe[ci] += v * Math.cos(a);
      fIm[ci] += v * Math.sin(a);
    });
  }
  const phiSound = Math.atan2(bIm, bRe);
  const sigma = NOISE * Math.sqrt(N_SAMPLES / 2);
  const dphi = new Float32Array(n);
  for (let p = 0; p < n; p++) {
    let re = bRe;
    let im = bIm;
    for (let ci = 0; ci < CRACKS.length; ci++) {
      re += weights[ci][p] * fRe[ci];
      im += weights[ci][p] * fIm[ci];
    }
    re = lampF[p] * re + sigma * gauss();
    im = lampF[p] * im + sigma * gauss();
    dphi[p] = Math.atan2(im, re) - phiSound;
  }
  // The sign of the phase shift can flip with depth at a given frequency, so
  // show its magnitude on a log scale above the noise floor (the median pixel).
  const mag = Array.from(dphi, Math.abs);
  const floor = [...mag].sort((a, b) => a - b)[Math.floor(n / 2)] || 1e-6;
  const centre = (c: Crack) => {
    const i = Math.min(NX - 1, Math.floor(((c.x1 + c.x2) / 2 / PLATE.w) * NX));
    const j = Math.min(NY - 1, Math.floor(((c.y1 + c.y2) / 2 / PLATE.h) * NY));
    return mag[j * NX + i];
  };
  const top = Math.log(1 + Math.max(...CRACKS.map(centre)) / floor);
  const phase = new Float32Array(n);
  for (let p = 0; p < n; p++) phase[p] = Math.max(0, Math.log(1 + mag[p] / floor) - Math.log(3)) / (top - Math.log(3));

  return { weights, lamp: lampF, noise, phase };
}

/** Surface temperature of every pixel at time t (arbitrary units). */
export function frameAt(field: Field, t: number, out: Float32Array) {
  const b = base(t);
  const cs = CRACKS.map((c) => contrast(c.depth, t));
  for (let p = 0; p < out.length; p++) {
    let e = 1;
    for (let ci = 0; ci < cs.length; ci++) e += field.weights[ci][p] * cs[ci];
    out[p] = field.lamp[p] * b * e + NOISE * field.noise[p];
  }
  return out;
}

/** Crack bounding boxes in plate mm, padded for display. */
export const crackBoxes = () =>
  CRACKS.map((c) => {
    const pad = HALF_WIDTH + 1.5 + c.depth;
    return {
      x: Math.min(c.x1, c.x2) - pad,
      y: Math.min(c.y1, c.y2) - pad,
      w: Math.abs(c.x2 - c.x1) + 2 * pad,
      h: Math.abs(c.y2 - c.y1) + 2 * pad,
      depth: c.depth,
    };
  });

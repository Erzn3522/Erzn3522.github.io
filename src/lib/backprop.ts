// One neuron trained on one example, with every gradient written out.
// Shared by the server-rendered figure and the client script.
//
//   z = w·x + b,   ŷ = σ(z),   L = −[y·log ŷ + (1 − y)·log(1 − ŷ)]
//
// Chain rule: ∂L/∂w = ∂L/∂ŷ · ∂ŷ/∂z · ∂z/∂w. For sigmoid + cross-entropy the
// first two factors cancel to ŷ − y, so ∂L/∂w = (ŷ − y)·x.

export const X = 1.5;
export const B = 0.5;
export const ETA = 1;
export const W_MIN = -4;
export const W_MAX = 4;
export const W0 = -1.5;
export const L_MAX = 6;

const EPS = 1e-9;

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

export const loss = (w: number, y: 0 | 1) => {
  const p = sigmoid(w * X + B);
  return -(y * Math.log(p + EPS) + (1 - y) * Math.log(1 - p + EPS));
};

export interface Pass {
  w: number;
  y: 0 | 1;
  z: number;
  p: number; // ŷ
  L: number;
  dL_dp: number; // ∂L/∂ŷ
  dp_dz: number; // ∂ŷ/∂z
  dz_dw: number; // ∂z/∂w
  dL_dz: number; // ∂L/∂z = ŷ − y
  dL_dw: number;
  dL_db: number;
}

export function pass(w: number, y: 0 | 1): Pass {
  const z = w * X + B;
  const p = sigmoid(z);
  const L = loss(w, y);
  const dL_dp = -y / (p + EPS) + (1 - y) / (1 - p + EPS);
  const dp_dz = p * (1 - p);
  const dz_dw = X;
  const dL_dz = p - y;
  return { w, y, z, p, L, dL_dp, dp_dz, dz_dw, dL_dz, dL_dw: dL_dz * X, dL_db: dL_dz };
}

/** One gradient descent step, kept inside the slider range. */
export const step = (w: number, y: 0 | 1) => Math.min(W_MAX, Math.max(W_MIN, w - ETA * pass(w, y).dL_dw));

/** Signed number with a real minus sign, fixed decimals. */
export const fmt = (v: number, d = 2) => {
  const s = Math.abs(v).toFixed(d);
  return (v < 0 && Number(s) !== 0 ? '−' : '') + s;
};

// ---------- loss curve geometry (shared by SSR and client) ----------
export const CURVE = { w: 320, h: 220, x0: 40, x1: 306, y0: 14, y1: 180 };
export const cx = (w: number) => CURVE.x0 + ((w - W_MIN) / (W_MAX - W_MIN)) * (CURVE.x1 - CURVE.x0);
export const cy = (L: number) => CURVE.y1 - (Math.min(L, L_MAX) / L_MAX) * (CURVE.y1 - CURVE.y0);

export const curvePath = (y: 0 | 1) => {
  const n = 120;
  return Array.from({ length: n + 1 }, (_, i) => {
    const w = W_MIN + ((W_MAX - W_MIN) * i) / n;
    return `${i ? 'L' : 'M'}${cx(w).toFixed(1)} ${cy(loss(w, y)).toFixed(1)}`;
  }).join('');
};

/** Tangent segment at w: slope ∂L/∂w, half-width 1 in w. */
export const tangentPath = (w: number, y: 0 | 1) => {
  const { L, dL_dw } = pass(w, y);
  const a = Math.max(W_MIN, w - 1);
  const b = Math.min(W_MAX, w + 1);
  return `M${cx(a).toFixed(1)} ${cy(L + dL_dw * (a - w)).toFixed(1)}L${cx(b).toFixed(1)} ${cy(L + dL_dw * (b - w)).toFixed(1)}`;
};

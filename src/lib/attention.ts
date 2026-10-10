// Scaled dot-product attention on a toy sentence.
// Shared by the server-rendered figure, the home thumbnail and the client.
//
// The query·key scores are hand-set to show patterns trained models tend to
// learn (an adjective attends to its noun, a subword to its root). They are
// not weights from a trained model. Formally Q holds these rows and K is the
// identity, so QKᵀ is the score matrix; d is the vector size used for √d.

export const TOKENS = ['Yemek', 'güzel', 'ama', 'servis', 'berbat', '##tı'];
export const GLOSS = 'Yemek güzel ama servis berbattı: “The food was good but the service was terrible.”';
export const D = 6;
export const DEFAULT_TOKEN = 4;

// rows: query token, columns: key token
const SCORES = [
  [3, 6, 1, 1, 1, 0], // Yemek  → güzel
  [6, 3, 1, 1, 1, 0], // güzel  → Yemek
  [3, 3, 2, 3, 4, 1], // ama    → both clauses
  [1, 1, 2, 3, 6, 2], // servis → berbat
  [1, 1, 2, 6, 3, 4], // berbat → servis, ##tı
  [0, 0, 1, 2, 7, 3], // ##tı   → berbat (its root)
];

export interface Options {
  causal: boolean; // GPT-style mask: a token sees only itself and earlier tokens
  scaled: boolean; // divide scores by √d before the softmax
}

/** n×n attention weights; every row sums to 1. */
export function attend({ causal, scaled }: Options): number[][] {
  const k = scaled ? Math.sqrt(D) : 1;
  return SCORES.map((row, i) => {
    const s = row.map((v, j) => (causal && j > i ? -Infinity : v / k));
    const m = Math.max(...s);
    const e = s.map((v) => (v === -Infinity ? 0 : Math.exp(v - m)));
    const sum = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / sum);
  });
}

// ---------- geometry shared by SSR and client ----------

/** Token-row arcs: columns are equal width in a 600-wide box. */
export const ARC = { w: 600, h: 120, base: 112 };
export const colX = (j: number) => ((j + 0.5) / TOKENS.length) * ARC.w;

export function arcPath(i: number, j: number) {
  const a = colX(i);
  const b = colX(j);
  if (i === j) {
    // small loop above the token for self-attention
    return `M${a - 10} ${ARC.base}C${a - 26} ${ARC.base - 44} ${a + 26} ${ARC.base - 44} ${a + 10} ${ARC.base}`;
  }
  const lift = Math.min(ARC.base - 6, 26 + Math.abs(b - a) * 0.32);
  return `M${a} ${ARC.base}C${a} ${ARC.base - lift} ${b} ${ARC.base - lift} ${b} ${ARC.base}`;
}

/** Matrix layout: labels on the left and top, square cells. */
export const MAT = { cell: 52, left: 74, top: 30 };
export const matSize = () => ({
  w: MAT.left + MAT.cell * TOKENS.length,
  h: MAT.top + MAT.cell * TOKENS.length,
});

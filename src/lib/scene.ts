// Procedural stereo orchard scene. Pure and seeded: the server-rendered SVG
// fallback and the client canvas draw exactly the same composition.
//
// Image space is 1000 x 750 units. A pinhole camera sits 0.9 m above flat
// ground; the right camera is offset by baseline B, so a point at depth Z
// appears shifted left by the disparity d = f·B / Z.

export const W = 1000;
export const H = 750;
export const CAM = { f: 900, cx: 500, cy: 300, B: 0.06, h: 0.9 };
export const Z_NEAR = 0.9;
export const Z_FAR = 7.5;
export const APPLE_R = 0.04;

export interface Disc {
  kind: 'hedge' | 'leaf' | 'apple';
  Z: number;
  u: number;
  v: number;
  r: number;
  color: string;
}

export interface Trunk {
  kind: 'trunk';
  Z: number;
  u: number;
  top: number;
  bottom: number;
  w: number;
  color: string;
}

export interface Apple extends Disc {
  kind: 'apple';
  d: number; // disparity in image units
}

export type Item = Disc | Trunk;

export interface Scene {
  items: Item[]; // painter's order, far to near
  apples: Apple[];
}

// ---------- helpers ----------

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

const project = (X: number, Y: number, Z: number, R = 0) => ({
  u: CAM.cx + (CAM.f * X) / Z,
  v: CAM.cy + (CAM.f * Y) / Z,
  r: (CAM.f * R) / Z,
});

export const disparity = (Z: number) => (CAM.f * CAM.B) / Z;

/** Depth of the ground plane seen at image row v (Infinity at or above the horizon). */
export const groundDepth = (v: number) => (v <= CAM.cy ? Infinity : (CAM.f * CAM.h) / (v - CAM.cy));

// ---------- colormap (blue → green → yellow → red on inverse depth) ----------

const STOPS: [number, [number, number, number]][] = [
  [0, [31, 42, 110]],
  [0.15, [43, 79, 176]],
  [0.3, [42, 156, 192]],
  [0.45, [61, 176, 106]],
  [0.65, [217, 210, 60]],
  [0.82, [238, 138, 42]],
  [1, [212, 42, 42]],
];

export const NO_DEPTH = '#0b1026';

/** Normalised inverse depth: 0 at Z_FAR, 1 at Z_NEAR. */
export const depthT = (Z: number) =>
  Math.min(1, Math.max(0, (1 / Z - 1 / Z_FAR) / (1 / Z_NEAR - 1 / Z_FAR)));

export function depthColor(Z: number): string {
  if (!Number.isFinite(Z)) return NO_DEPTH;
  const t = depthT(Z);
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    if (t <= t1) {
      const [t0, c0] = STOPS[i - 1];
      const k = (t - t0) / (t1 - t0);
      const c = c0.map((x, j) => Math.round(x + (c1[j] - x) * k));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return 'rgb(212,42,42)';
}

/** CSS gradient stops for the legend, near (red) on the left. */
export const legendGradient = () =>
  `linear-gradient(to right, ${[...STOPS]
    .reverse()
    .map(([t, c]) => `rgb(${c.join(',')}) ${Math.round((1 - t) * 100)}%`)
    .join(', ')})`;

// ---------- scene ----------

const LEAF = ['#2f5f38', '#3a6f40', '#46804a', '#2a5233', '#3d7544'];
const LEAF_NEAR = ['#244a2c', '#2f5a34', '#3a6a3e', '#2a5131'];
const HEDGE = ['#7b9a73', '#86a47c', '#6f8f69'];
const APPLE = ['#b5302a', '#c23b2c', '#a8282a', '#cc4a2e', '#b8362b', '#a9b53d'];

export function buildScene(seed = 7): Scene {
  const rnd = mulberry32(seed);
  const range = (a: number, b: number) => a + (b - a) * rnd();
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const items: Item[] = [];
  const apples: Apple[] = [];

  // Distant hedge row along the horizon
  for (let X = -6; X <= 6; X += 0.55) {
    const Z = range(7.1, 7.5);
    for (let k = 0; k < 2; k++) {
      const p = project(X + range(-0.2, 0.2), range(-0.35, 0.35), Z, range(0.45, 0.7));
      items.push({ kind: 'hedge', Z, ...p, color: pick(HEDGE) });
    }
  }

  // Leaf cluster: a blob made of overlapping discs
  const cluster = (X: number, Y: number, Z: number, R: number, colors: string[], n = 7) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2;
      const m = Math.sqrt(rnd()) * R * 0.7;
      const z = Z + range(-0.08, 0.08);
      const p = project(X + Math.cos(a) * m, Y + Math.sin(a) * m * 0.8, z, R * range(0.42, 0.62));
      items.push({ kind: 'leaf', Z: z, ...p, color: pick(colors) });
    }
  };

  const placed: { u: number; v: number; r: number }[] = [];
  const addApple = (X: number, Y: number, Z: number): boolean => {
    const p = project(X, Y, Z, APPLE_R);
    if (p.u - p.r < 8 || p.u + p.r > W - 8 || p.v - p.r < 40 || p.v + p.r > H - 8) return false;
    if (placed.some((q) => Math.hypot(q.u - p.u, q.v - p.v) < (q.r + p.r) * 1.25)) return false;
    placed.push(p);
    const apple: Apple = { kind: 'apple', Z, ...p, color: pick(APPLE), d: disparity(Z) };
    apples.push(apple);
    items.push(apple);
    return true;
  };

  // Main tree row, 2.7–3.1 m
  const trees = [
    { X: -1.25, Z: 3.05 },
    { X: 0.15, Z: 2.75 },
    { X: 1.3, Z: 3.0 },
  ];
  for (const t of trees) {
    const base = project(t.X, CAM.h, t.Z);
    const top = project(t.X, 0.2, t.Z);
    items.push({
      kind: 'trunk',
      Z: t.Z + 0.05,
      u: base.u,
      top: top.v,
      bottom: base.v,
      w: (CAM.f * 0.11) / t.Z,
      color: '#5a4a3d',
    });
    for (let b = 0; b < 6; b++) {
      cluster(t.X + range(-0.6, 0.6), range(-0.42, 0.28), t.Z + range(-0.3, 0.25), range(0.28, 0.42), LEAF);
    }
  }

  // Near branch hanging into the top left, 1.1–1.3 m
  for (let b = 0; b < 3; b++) {
    cluster(range(-0.5, -0.25), range(-0.26, -0.14), range(1.1, 1.3), range(0.08, 0.12), LEAF_NEAR, 6);
  }
  // Smaller branch on the right, 1.5–1.7 m
  for (let b = 0; b < 2; b++) {
    cluster(range(0.5, 0.68), range(-0.4, -0.28), range(1.5, 1.7), range(0.1, 0.14), LEAF_NEAR, 6);
  }

  // Apples, placed in front of their foliage. 16 in total.
  const want = (n: number, gen: () => [number, number, number]) => {
    let got = 0;
    for (let tries = 0; got < n && tries < 400; tries++) if (addApple(...gen())) got++;
  };
  want(3, () => [range(-0.48, -0.22), range(-0.14, 0.0), range(0.98, 1.12)]);
  want(2, () => [range(0.48, 0.68), range(-0.28, -0.16), range(1.38, 1.5)]);
  // One per tree first so every tree carries fruit, then the rest at random
  for (const t of trees) want(1, () => [t.X + range(-0.4, 0.4), range(-0.2, 0.25), t.Z - range(0.42, 0.6)]);
  want(8, () => {
    const t = pick(trees);
    return [t.X + range(-0.55, 0.55), range(-0.3, 0.28), t.Z - range(0.42, 0.7)];
  });

  items.sort((a, b) => b.Z - a.Z);
  apples.sort((a, b) => b.Z - a.Z);
  return { items, apples };
}

export const depthLabel = (Z: number) => `${Z.toFixed(2)} m`;

// ---------- canvas drawing (in image units; caller sets the transform) ----------

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function drawView(ctx: Ctx, scene: Scene, mode: 'rgb' | 'depth') {
  // Sky and ground
  if (mode === 'rgb') {
    const sky = ctx.createLinearGradient(0, 0, 0, CAM.cy);
    sky.addColorStop(0, '#c4d4d0');
    sky.addColorStop(1, '#e2eae2');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, CAM.cy);
    const ground = ctx.createLinearGradient(0, CAM.cy, 0, H);
    ground.addColorStop(0, '#8aa574');
    ground.addColorStop(1, '#4c7140');
    ctx.fillStyle = ground;
    ctx.fillRect(0, CAM.cy, W, H - CAM.cy);
  } else {
    ctx.fillStyle = NO_DEPTH;
    ctx.fillRect(0, 0, W, CAM.cy);
    const band = 6;
    for (let v = CAM.cy; v < H; v += band) {
      ctx.fillStyle = depthColor(groundDepth(v + band / 2));
      ctx.fillRect(0, v, W, band + 0.5);
    }
  }

  for (const it of scene.items) {
    if (it.kind === 'trunk') {
      ctx.fillStyle = mode === 'rgb' ? it.color : depthColor(it.Z);
      ctx.fillRect(it.u - it.w / 2, it.top, it.w, it.bottom - it.top);
      continue;
    }
    if (it.kind === 'apple' && mode === 'depth') {
      const g = ctx.createRadialGradient(it.u, it.v, 0, it.u, it.v, it.r);
      g.addColorStop(0, depthColor(it.Z));
      g.addColorStop(1, depthColor(it.Z + APPLE_R));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = mode === 'rgb' ? it.color : depthColor(it.Z);
    }
    ctx.beginPath();
    ctx.arc(it.u, it.v, it.r, 0, Math.PI * 2);
    ctx.fill();
    if (it.kind === 'apple' && mode === 'rgb') {
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.beginPath();
      ctx.arc(it.u - it.r * 0.35, it.v - it.r * 0.35, it.r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (mode === 'rgb') drawGhosts(ctx, scene);
}

/** Where the right camera sees each apple: outline shifted left by d, joined to the left-camera centre. */
function drawGhosts(ctx: Ctx, scene: Scene) {
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  for (const a of scene.apples) {
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(a.u - a.d, a.v, a.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(a.u, a.v);
    ctx.lineTo(a.u - a.d, a.v);
    ctx.stroke();
  }
}

// ---------- SVG (server-rendered fallback) ----------

const f1 = (n: number) => Math.round(n * 10) / 10;

function svgView(scene: Scene, mode: 'rgb' | 'depth', id: string): string {
  const out: string[] = [];
  if (mode === 'rgb') {
    out.push(
      `<defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4d4d0"/><stop offset="1" stop-color="#e2eae2"/></linearGradient>` +
        `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8aa574"/><stop offset="1" stop-color="#4c7140"/></linearGradient></defs>`,
      `<rect width="${W}" height="${CAM.cy}" fill="url(#${id}s)"/>`,
      `<rect y="${CAM.cy}" width="${W}" height="${H - CAM.cy}" fill="url(#${id}g)"/>`,
    );
  } else {
    out.push(`<rect width="${W}" height="${CAM.cy}" fill="${NO_DEPTH}"/>`);
    const band = 15;
    for (let v = CAM.cy; v < H; v += band) {
      out.push(`<rect y="${v}" width="${W}" height="${band + 0.5}" fill="${depthColor(groundDepth(v + band / 2))}"/>`);
    }
  }
  for (const it of scene.items) {
    if (it.kind === 'trunk') {
      const fill = mode === 'rgb' ? it.color : depthColor(it.Z);
      out.push(`<rect x="${f1(it.u - it.w / 2)}" y="${f1(it.top)}" width="${f1(it.w)}" height="${f1(it.bottom - it.top)}" fill="${fill}"/>`);
      continue;
    }
    const fill = mode === 'rgb' ? it.color : depthColor(it.Z);
    out.push(`<circle cx="${f1(it.u)}" cy="${f1(it.v)}" r="${f1(it.r)}" fill="${fill}"/>`);
    if (it.kind === 'apple' && mode === 'rgb') {
      out.push(`<circle cx="${f1(it.u - it.r * 0.35)}" cy="${f1(it.v - it.r * 0.35)}" r="${f1(it.r * 0.26)}" fill="#fff" fill-opacity=".32"/>`);
    }
  }
  if (mode === 'rgb') {
    out.push('<g fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2">');
    for (const a of scene.apples) {
      out.push(
        `<circle cx="${f1(a.u - a.d)}" cy="${f1(a.v)}" r="${f1(a.r)}" stroke-dasharray="5 4"/>`,
        `<path d="M${f1(a.u)} ${f1(a.v)}H${f1(a.u - a.d)}"/>`,
      );
    }
    out.push('</g>');
  }
  return out.join('');
}

/** Static frame: camera view left, depth map right, divider at 50%, boxes on. */
export function sceneSVG(scene: Scene, label: string): string {
  const half = W / 2;
  const rects = scene.apples.map((a) => ({
    a,
    x: f1(a.u - a.r - 4),
    y: f1(a.v - a.r - 4),
    s: f1(a.r * 2 + 8),
  }));
  let boxes = rects
    .map(
      ({ x, y, s }) =>
        `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="#fff" stroke-width="5" stroke-opacity=".7"/>` +
        `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="none" stroke="var(--detect)" stroke-width="2.5"/>`,
    )
    .join('');
  // Labels nearest first; skip one that would cover a label already placed
  const taken: number[][] = [];
  for (const { a, x, y } of [...rects].reverse()) {
    const text = depthLabel(a.Z);
    const r = [x - 1.25, y - 25, text.length * 11 + 12, 25];
    if (taken.some((t) => r[0] < t[0] + t[2] && t[0] < r[0] + r[2] && r[1] < t[1] + t[3] && t[1] < r[1] + r[3])) continue;
    taken.push(r);
    boxes +=
      `<rect x="${f1(r[0])}" y="${f1(r[1])}" width="${r[2]}" height="25" fill="var(--detect)"/>` +
      `<text x="${f1(x + 5)}" y="${f1(y - 7)}" fill="var(--on-detect)">${text}</text>`;
  }
  return (
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">` +
    `<defs><clipPath id="scL"><rect width="${half}" height="${H}"/></clipPath><clipPath id="scR"><rect x="${half}" width="${half}" height="${H}"/></clipPath></defs>` +
    `<g clip-path="url(#scL)">${svgView(scene, 'rgb', 'scA')}</g>` +
    `<g clip-path="url(#scR)">${svgView(scene, 'depth', 'scB')}</g>` +
    `<path d="M${half} 0V${H}" stroke="#fff" stroke-width="3"/>` +
    `<g font-family="'Archivo Variable', sans-serif" font-size="19" font-weight="600">${boxes}</g>` +
    `</svg>`
  );
}

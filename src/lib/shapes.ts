// Synthetic point clouds, one per chapter of the site. Everything is generated from a seed:
// no employer data, no real scans. Units are metres; the scene sits around the origin, y up.
//
// Every shape has exactly N points so the renderer can morph point i of one shape into
// point i of the next. Points are shuffled so any prefix is a uniform subsample (phones draw fewer).

export const N = 42000;

export type RGB = [number, number, number];
export interface Shape {
  pos: Float32Array; // N * 3
  col: Float32Array; // N * 3, the "camera view" colours
  anchors: { p: [number, number, number]; r: number; label?: string }[]; // things the HTML can track
  part: Float32Array; // N, which rigid part each point belongs to (only the intro robot uses more than 0)
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

class Builder {
  pos: number[] = [];
  col: number[] = [];
  anchors: Shape['anchors'] = [];
  parts: number[] = [];
  part = 0; // points added from now on belong to this part
  constructor(public r: () => number) {}
  add(x: number, y: number, z: number, c: RGB, jitter = 0.08) {
    const k = 1 + (this.r() - 0.5) * jitter;
    this.pos.push(x, y, z);
    this.parts.push(this.part);
    this.col.push(c[0] * k, c[1] * k, c[2] * k);
  }
  gauss() {
    return Math.sqrt(-2 * Math.log(1 - this.r())) * Math.cos(2 * Math.PI * this.r());
  }
  /** Point on a sphere surface (optionally only the side facing +z) */
  sphere(cx: number, cy: number, cz: number, rad: number, n: number, c: RGB, noise = 0, front = false) {
    for (let i = 0; i < n; i++) {
      const u = this.r() * 2 - 1;
      const t = this.r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      let x = s * Math.cos(t);
      const y = u;
      let z = s * Math.sin(t);
      if (front && z < -0.2) z = -z;
      const rr = rad * (1 + noise * this.gauss());
      this.add(cx + x * rr, cy + y * rr, cz + z * rr, c);
    }
  }
  /** Points along a segment, with a little thickness */
  line(a: number[], b: number[], n: number, c: RGB, thick = 0.006) {
    for (let i = 0; i < n; i++) {
      const t = this.r();
      this.add(
        a[0] + (b[0] - a[0]) * t + this.gauss() * thick,
        a[1] + (b[1] - a[1]) * t + this.gauss() * thick,
        a[2] + (b[2] - a[2]) * t + this.gauss() * thick,
        c,
      );
    }
  }
  cylinder(a: number[], b: number[], rad: number, n: number, c: RGB) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const len = Math.hypot(d[0], d[1], d[2]);
    const w = d.map((v) => v / len);
    const tmp = Math.abs(w[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = [w[1] * tmp[2] - w[2] * tmp[1], w[2] * tmp[0] - w[0] * tmp[2], w[0] * tmp[1] - w[1] * tmp[0]];
    const ul = Math.hypot(u[0], u[1], u[2]);
    u[0] /= ul; u[1] /= ul; u[2] /= ul;
    const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
    for (let i = 0; i < n; i++) {
      const t = this.r();
      const ang = this.r() * Math.PI * 2;
      const cs = Math.cos(ang) * rad;
      const sn = Math.sin(ang) * rad;
      this.add(
        a[0] + d[0] * t + u[0] * cs + v[0] * sn,
        a[1] + d[1] * t + u[1] * cs + v[1] * sn,
        a[2] + d[2] * t + u[2] * cs + v[2] * sn,
        c,
      );
    }
  }
  ring(cx: number, cy: number, cz: number, rad: number, n: number, c: RGB, axis: 'y' | 'z' = 'y') {
    for (let i = 0; i < n; i++) {
      const t = this.r() * Math.PI * 2;
      const j = this.gauss() * 0.004;
      if (axis === 'y') this.add(cx + Math.cos(t) * (rad + j), cy + j, cz + Math.sin(t) * (rad + j), c);
      else this.add(cx + Math.cos(t) * (rad + j), cy + Math.sin(t) * (rad + j), cz + j, c);
    }
  }
  box(min: number[], max: number[], n: number, c: RGB) {
    // surface sample of an axis-aligned box
    const sx = max[0] - min[0], sy = max[1] - min[1], sz = max[2] - min[2];
    const areas = [sy * sz, sy * sz, sx * sz, sx * sz, sx * sy, sx * sy];
    const total = areas.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) {
      let f = this.r() * total;
      let face = 0;
      while (f > areas[face] && face < 5) f -= areas[face++];
      const a = this.r(), b = this.r();
      let x = min[0] + a * sx, y = min[1] + b * sy, z = min[2] + this.r() * sz;
      if (face === 0) x = min[0];
      if (face === 1) x = max[0];
      if (face === 2) { y = min[1]; z = min[2] + b * sz; }
      if (face === 3) { y = max[1]; z = min[2] + b * sz; }
      if (face === 4) { z = min[2]; y = min[1] + b * sy; }
      if (face === 5) { z = max[2]; y = min[1] + b * sy; }
      this.add(x, y, z, c);
    }
  }
  /** Pad or trim to exactly N, then shuffle so any prefix is a uniform sample */
  finish(): Shape {
    let count = this.pos.length / 3;
    while (count < N) {
      const i = Math.floor(this.r() * count) * 3;
      this.pos.push(this.pos[i] + this.gauss() * 0.004, this.pos[i + 1] + this.gauss() * 0.004, this.pos[i + 2] + this.gauss() * 0.004);
      this.col.push(this.col[i], this.col[i + 1], this.col[i + 2]);
      this.parts.push(this.parts[i / 3]);
      count++;
    }
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const part = new Float32Array(N);
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(this.r() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let k = 0; k < N; k++) {
      const s = order[k] * 3;
      pos.set([this.pos[s], this.pos[s + 1], this.pos[s + 2]], k * 3);
      col.set([this.col[s], this.col[s + 1], this.col[s + 2]], k * 3);
      part[k] = this.parts[order[k]];
    }
    return { pos, col, anchors: this.anchors, part };
  }
}

// ---------- the chapters ----------

/** An orchard row: three trees, fruit on the camera side, ground. The hero and the picking chapter. */
export function orchard(seed = 7): Shape {
  const b = new Builder(rng(seed));
  const leafs = ['#2f6b3a', '#3c8247', '#25562f', '#4a9152', '#356f3c'].map(hex);
  const trees = [-1.7, 0, 1.75];
  // ground
  for (let i = 0; i < N * 0.2; i++) {
    const x = (b.r() - 0.5) * 6.4;
    const z = (b.r() - 0.5) * 3.6;
    b.add(x, Math.abs(b.gauss()) * 0.01, z, hex(b.r() < 0.5 ? '#5d5a3c' : '#6e6a45'));
  }
  for (const tx of trees) {
    b.cylinder([tx, 0, 0], [tx, 1.05, 0], 0.07, N * 0.02, hex('#5b4330'));
    // canopy: overlapping blobs
    for (let k = 0; k < 6; k++) {
      const cx = tx + (b.r() - 0.5) * 0.9;
      const cy = 1.25 + b.r() * 0.6;
      const cz = (b.r() - 0.5) * 0.5;
      b.sphere(cx, cy, cz, 0.38 + b.r() * 0.2, N * 0.016, leafs[k % leafs.length], 0.12);
    }
  }
  // fruit on the side facing the camera
  const apples: [number, number, number][] = [];
  for (const tx of trees) {
    for (let k = 0; k < 6; k++) {
      const ang = (b.r() - 0.5) * 2.2;
      const ay = 1.0 + b.r() * 0.85;
      const p: [number, number, number] = [tx + Math.sin(ang) * 0.62, ay, Math.cos(ang) * 0.55 + 0.05];
      apples.push(p);
      b.sphere(p[0], p[1], p[2], 0.05, N * 0.0062, hex(b.r() < 0.3 ? '#d9a12c' : '#c0322a'), 0.05);
    }
  }
  b.anchors = apples.map((p) => ({ p, r: 0.05 }));
  return b.finish();
}

/** A robot arm reaching a target, the camera that sees it, and the tolerance rings (10 : 5 : 2). */
export function calibration(seed = 11): Shape {
  const b = new Builder(rng(seed));
  const steel = hex('#c9cdd2');
  const dark = hex('#7d848c');
  const target = [0.7, 0.95, 0.35];
  // base and links
  b.cylinder([0, 0, 0], [0, 0.12, 0], 0.22, N * 0.08, dark);
  const j1 = [0, 0.55, 0];
  const j2 = [0.25, 1.15, 0.12];
  const j3 = [0.62, 1.05, 0.3];
  b.cylinder([0, 0.12, 0], j1, 0.08, N * 0.07, steel);
  b.cylinder(j1, j2, 0.065, N * 0.08, steel);
  b.cylinder(j2, j3, 0.05, N * 0.07, steel);
  b.cylinder(j3, target, 0.03, N * 0.03, steel);
  for (const j of [j1, j2, j3]) b.sphere(j[0], j[1], j[2], 0.095, N * 0.03, dark);
  // camera body and frustum toward the target
  const cam = [-1.1, 1.75, 1.0];
  b.box([cam[0] - 0.12, cam[1] - 0.05, cam[2] - 0.05], [cam[0] + 0.12, cam[1] + 0.05, cam[2] + 0.05], N * 0.04, hex('#e9ece6'));
  const look = [target[0] - cam[0], target[1] - cam[1], target[2] - cam[2]];
  const L = Math.hypot(look[0], look[1], look[2]);
  const f = look.map((v) => v / L);
  const right = [f[2], 0, -f[0]];
  const up = [0, 1, 0];
  const far = 1.25;
  const corners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => [
    cam[0] + f[0] * far + right[0] * sx * 0.45 + up[0] * sy * 0.3,
    cam[1] + f[1] * far + right[1] * sx * 0.45 + up[1] * sy * 0.3,
    cam[2] + f[2] * far + right[2] * sx * 0.45 + up[2] * sy * 0.3,
  ]);
  for (const c of corners) b.line(cam, c, N * 0.02, hex('#e9ece6'), 0.003);
  for (let i = 0; i < 4; i++) b.line(corners[i], corners[(i + 1) % 4], N * 0.015, hex('#e9ece6'), 0.003);
  // tolerance rings around the target, drawn 10x so they read: 10 mm, 5 mm, 2 mm
  b.ring(target[0], target[1] - 0.02, target[2], 0.3, N * 0.06, hex('#e9ece6'));
  b.ring(target[0], target[1] - 0.02, target[2], 0.15, N * 0.05, hex('#ff8a3d'));
  b.ring(target[0], target[1] - 0.02, target[2], 0.06, N * 0.03, hex('#ffd166'));
  // coordinate frames: base and camera
  const axes: [number[], RGB][] = [
    [[0.4, 0, 0], hex('#ff5a4e')],
    [[0, 0.4, 0], hex('#4cc97f')],
    [[0, 0, 0.4], hex('#5b8cff')],
  ];
  for (const [d, c] of axes) {
    b.line([0, 0.01, 0], [d[0], d[1] + 0.01, d[2]], N * 0.012, c);
    b.line(cam, [cam[0] + d[0] * 0.6, cam[1] + d[1] * 0.6, cam[2] + d[2] * 0.6], N * 0.008, c);
  }
  // floor
  for (let i = 0; i < N * 0.12; i++) b.add((b.r() - 0.5) * 3.4, 0, (b.r() - 0.5) * 2.6, hex('#3a3f44'));
  b.anchors = [
    { p: target as [number, number, number], r: 0.3, label: '10 mm' },
    { p: [target[0], target[1], target[2]] as [number, number, number], r: 0.15, label: '5 mm' },
  ];
  return b.finish();
}

/** A fruit cluster in leaves, and next to it the depth histogram of one fruit mask. */
export function detection(seed = 23): Shape {
  const b = new Builder(rng(seed));
  const fruit: [number, number, number][] = [
    [-0.55, 1.05, 0.15],
    [-0.32, 1.2, 0.0],
    [-0.62, 1.32, -0.1],
    [-0.36, 0.86, 0.02],
    [-0.8, 0.95, -0.08],
    [-0.18, 1.02, -0.18],
  ];
  fruit.forEach((p, i) => b.sphere(p[0], p[1], p[2], 0.12, N * 0.06, hex(i === 0 ? '#d1382c' : i % 2 ? '#b8302a' : '#c94a2a'), 0.02));
  // leaves: small flat patches around the cluster, behind it
  for (let k = 0; k < 40; k++) {
    const cx = -0.5 + (b.r() - 0.5) * 1.1;
    const cy = 1.08 + (b.r() - 0.5) * 0.8;
    const cz = -0.2 - b.r() * 0.35;
    const n = N * 0.0035;
    for (let i = 0; i < n; i++) b.add(cx + (b.r() - 0.5) * 0.16, cy + (b.r() - 0.5) * 0.07, cz + (b.r() - 0.5) * 0.03, hex(k % 3 ? '#2f6b3a' : '#3c8247'));
  }
  // histogram: 22 bins of depth inside the front fruit's mask. Two peaks (fruit body, leaves);
  // the front-surface bin, the first strong one, is highlighted.
  const bins = 22;
  const h = (i: number) => 0.9 * Math.exp(-((i - 6) ** 2) / 7) + 0.55 * Math.exp(-((i - 16) ** 2) / 5) + 0.03;
  const front = 3;
  for (let i = 0; i < bins; i++) {
    const x = 0.35 + i * 0.055;
    const height = h(i) * 1.1;
    b.box([x, 0.4, -0.02], [x + 0.04, 0.4 + height, 0.02], N * 0.012, hex(i === front ? '#ffd166' : '#c9cdd2'));
  }
  b.line([0.33, 0.39, 0], [0.35 + bins * 0.055, 0.39, 0], N * 0.02, hex('#7d848c'));
  b.anchors = [{ p: fruit[0], r: 0.12, label: 'front surface' }];
  return b.finish();
}

/** Two rooms and a doorway as an occupancy map, a robot and its planned path. */
export function navigation(seed = 31): Shape {
  const b = new Builder(rng(seed));
  const W = 3.2, D = 2.0, H = 0.32;
  const wall = hex('#c9cdd2');
  // floor grid
  for (let i = 0; i < N * 0.3; i++) {
    const x = (b.r() - 0.5) * W;
    const z = (b.r() - 0.5) * D;
    const onGrid = Math.abs((x * 5) % 1) < 0.06 || Math.abs((z * 5) % 1) < 0.06;
    b.add(x, 0, z, hex(onGrid ? '#4a5157' : '#2a2f33'));
  }
  // outer walls and the dividing wall with a doorway
  const walls: [number, number, number, number][] = [
    [-W / 2, -D / 2, W / 2, -D / 2],
    [-W / 2, D / 2, W / 2, D / 2],
    [-W / 2, -D / 2, -W / 2, D / 2],
    [W / 2, -D / 2, W / 2, D / 2],
    [0.1, -D / 2, 0.1, 0.05],
    [0.1, 0.45, 0.1, D / 2],
  ];
  for (const [x1, z1, x2, z2] of walls) {
    const n = Math.hypot(x2 - x1, z2 - z1) * N * 0.03;
    for (let i = 0; i < n; i++) {
      const t = b.r();
      b.add(x1 + (x2 - x1) * t + b.gauss() * 0.008, b.r() * H, z1 + (z2 - z1) * t + b.gauss() * 0.008, wall);
    }
  }
  // furniture as obstacles
  b.box([-1.3, 0, -0.75], [-0.85, 0.25, -0.35], N * 0.04, hex('#8d949a'));
  b.box([0.6, 0, 0.35], [1.15, 0.3, 0.75], N * 0.04, hex('#8d949a'));
  b.box([1.1, 0, -0.8], [1.45, 0.2, -0.5], N * 0.025, hex('#8d949a'));
  // the path: robot on the left, goal on the right, through the doorway
  const pts = [
    [-1.2, 0.03, 0.45],
    [-0.6, 0.03, 0.4],
    [-0.1, 0.03, 0.25],
    [0.35, 0.03, 0.2],
    [0.55, 0.03, -0.05],
    [0.9, 0.03, -0.25],
    [1.3, 0.03, 0.1],
  ];
  for (let i = 0; i < pts.length - 1; i++) b.line(pts[i], pts[i + 1], N * 0.02, hex('#ff8a3d'), 0.01);
  b.cylinder([-1.2, 0, 0.45], [-1.2, 0.14, 0.45], 0.12, N * 0.04, hex('#e9ece6'));
  b.ring(1.3, 0.03, 0.1, 0.1, N * 0.015, hex('#ffd166'));
  b.anchors = [
    { p: [-1.2, 0.2, 0.45], r: 0.12, label: 'robot' },
    { p: [1.3, 0.12, 0.1], r: 0.1, label: 'goal' },
  ];
  return b.finish();
}

/** A face as a stereo pair measures it (relief), next to a printed photo (flat). Generic, not a person. */
export function face(seed = 41): Shape {
  const b = new Builder(rng(seed));
  const skin = hex('#d9cfc4');
  const relief = (x: number, y: number) => {
    // ellipsoid base + nose + brow + eye sockets + lips + chin; x,y in [-1,1]
    const base = Math.sqrt(Math.max(0, 1 - x * x * 0.9 - y * y * 0.55)) * 0.32;
    const nose = 0.16 * Math.exp(-(x * x) / 0.012 - ((y + 0.02) ** 2) / 0.09) * (y < 0.25 ? 1 : 0.4);
    const tip = 0.06 * Math.exp(-(x * x) / 0.01 - ((y + 0.22) ** 2) / 0.01);
    const brow = 0.05 * Math.exp(-((y - 0.32) ** 2) / 0.01) * Math.exp(-(x * x) / 0.25);
    const eyes = -0.07 * (Math.exp(-((x - 0.3) ** 2) / 0.02 - ((y - 0.18) ** 2) / 0.01) + Math.exp(-((x + 0.3) ** 2) / 0.02 - ((y - 0.18) ** 2) / 0.01));
    const lips = 0.035 * Math.exp(-(x * x) / 0.04 - ((y + 0.48) ** 2) / 0.006);
    const chin = 0.04 * Math.exp(-(x * x) / 0.05 - ((y + 0.8) ** 2) / 0.02);
    return base + nose + tip + brow + eyes + lips + chin;
  };
  const sample = (ox: number, flat: boolean, n: number, c: RGB) => {
    let made = 0;
    while (made < n) {
      const x = b.r() * 2 - 1;
      const y = b.r() * 2 - 1;
      if (x * x / 0.62 + y * y > 1) continue;
      const z = flat ? 0.02 * b.r() : relief(x, y);
      b.add(ox + x * 0.42, 1.2 + y * 0.62, z, c, 0.12);
      made++;
    }
  };
  sample(-0.55, false, N * 0.55, skin);
  sample(0.75, true, N * 0.3, hex('#b9b2aa'));
  // the photo's paper edge
  for (let i = 0; i < N * 0.05; i++) {
    const t = b.r() * Math.PI * 2;
    b.add(0.75 + Math.cos(t) * 0.36, 1.2 + Math.sin(t) * 0.64, 0, hex('#e9ece6'));
  }
  b.anchors = [
    { p: [-0.55, 1.18, 0.5], r: 0.08, label: 'real face' },
    { p: [0.75, 1.18, 0.02], r: 0.08, label: 'photo' },
  ];
  return b.finish();
}

/** A plastic plate after a flash: warm where heat is trapped above four cracks of different depth. */
export function thermal(seed = 53): Shape {
  const b = new Builder(rng(seed));
  const cracks = [
    { a: [-0.6, -0.15], b: [-0.05, -0.3], depth: 0.4 },
    { a: [0.2, 0.3], b: [0.55, -0.05], depth: 0.8 },
    { a: [-0.5, 0.3], b: [-0.15, 0.4], depth: 1.2 },
    { a: [0.15, -0.35], b: [0.65, -0.3], depth: 1.8 },
  ];
  const segDist = (px: number, py: number, a: number[], c: number[]) => {
    const dx = c[0] - a[0], dy = c[1] - a[1];
    const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
  };
  const iron = (v: number): RGB => {
    const stops: [number, RGB][] = [
      [0, hex('#14052b')],
      [0.3, hex('#5a136e')],
      [0.55, hex('#c2364f')],
      [0.78, hex('#f58b2b')],
      [1, hex('#fff3c4')],
    ];
    for (let i = 1; i < stops.length; i++) {
      if (v <= stops[i][0]) {
        const k = (v - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
        return stops[i - 1][1].map((c, j) => c + (stops[i][1][j] - c) * k) as RGB;
      }
    }
    return stops[stops.length - 1][1];
  };
  for (let i = 0; i < N * 0.85; i++) {
    const x = (b.r() - 0.5) * 1.8;
    const y = (b.r() - 0.5) * 1.1;
    let heat = 0.18 + 0.12 * Math.exp(-((x + 0.3) ** 2 + (y - 0.1) ** 2) / 0.5); // uneven lamp
    for (const c of cracks) heat += (0.75 / c.depth) * Math.exp(-(segDist(x, y, c.a, c.b) ** 2) / (0.0015 * (1 + c.depth * 2)));
    heat = Math.min(1, heat);
    // the plate lies tilted toward the viewer; heat lifts the surface slightly so depth shows it too
    b.add(x, 0.9 + y * 0.6, -y * 0.8 + heat * 0.16, iron(heat), 0.04);
  }
  // plate edges
  const corners = [
    [-0.9, -0.55],
    [0.9, -0.55],
    [0.9, 0.55],
    [-0.9, 0.55],
  ].map(([x, y]) => [x, 0.9 + y * 0.6, -y * 0.8]);
  for (let i = 0; i < 4; i++) b.line(corners[i], corners[(i + 1) % 4], N * 0.03, hex('#e9ece6'), 0.004);
  b.anchors = cracks.map((c) => {
    const mx = (c.a[0] + c.b[0]) / 2, my = (c.a[1] + c.b[1]) / 2;
    return { p: [mx, 0.9 + my * 0.6, -my * 0.8 + 0.05] as [number, number, number], r: 0.05, label: `${c.depth} mm` };
  });
  return b.finish();
}

/** Six tokens and their attention: arcs whose thickness is the weight (hand-set toy scores). */
export function attention(seed = 61): Shape {
  const b = new Builder(rng(seed));
  const tokens = ['Great', 'food', 'but', 'service', 'lag', '##ged'];
  const xs = tokens.map((_, i) => -1.4 + i * 0.56);
  tokens.forEach((_, i) => b.box([xs[i] - 0.14, 0.75, -0.08], [xs[i] + 0.14, 0.95, 0.08], N * 0.05, hex('#e9ece6')));
  // a few weighted links: [from, to, weight]
  const links: [number, number, number][] = [
    [0, 1, 0.57], [1, 0, 0.57], [3, 4, 0.51], [4, 3, 0.46], [5, 4, 0.66], [2, 4, 0.27], [2, 3, 0.18], [4, 5, 0.2],
  ];
  for (const [i, j, w] of links) {
    const a = [xs[i], 0.95, 0];
    const c = [xs[j], 0.95, 0];
    const lift = 0.25 + Math.abs(j - i) * 0.22;
    const side = i < j ? 0.12 : -0.12;
    const n = N * 0.07 * w;
    for (let k = 0; k < n; k++) {
      const t = b.r();
      const x = a[0] + (c[0] - a[0]) * t;
      const y = a[1] + Math.sin(Math.PI * t) * lift;
      const z = side * Math.sin(Math.PI * t) + b.gauss() * 0.01 * w * 3;
      b.add(x + b.gauss() * 0.006 * (1 + w * 4), y + b.gauss() * 0.006 * (1 + w * 4), z, hex(w > 0.45 ? '#ff8a3d' : '#ffd166'));
    }
  }
  b.anchors = tokens.map((t, i) => ({ p: [xs[i], 0.85, 0] as [number, number, number], r: 0.16, label: t }));
  return b.finish();
}

/** The intro's surveyor: a small wheeled robot holding a clipboard and a pen. Built facing +z with
 *  its wheels on the floor (y = 0). Every point carries a part id so the rig can move the parts. */
export const PART = { body: 0, head: 1, eyes: 2, mouth: 3, antenna: 4, wheelL: 5, wheelR: 6, armL: 7, board: 8, paper: 9, armR: 10, pen: 11 } as const;
export const RIG = {
  neck: [0, 1.1, 0],
  eyeY: 1.36,
  mouthY: 1.23,
  antenna: [0, 1.5, 0],
  wheelL: [-0.35, 0.18, 0],
  wheelR: [0.35, 0.18, 0],
  wheelRadius: 0.18,
  shoulderL: [-0.31, 0.98, 0],
  shoulderR: [0.31, 0.98, 0],
} as const;

export function robot(seed = 89): Shape {
  const b = new Builder(rng(seed));
  const shell = hex('#d9dcd6');
  const dark = hex('#6d7178');
  const glowW = hex('#ffffff');
  const glowH = hex('#ff6a3d');

  // wheels: a rim, a hub and three spokes, so rolling reads as rolling
  for (const [part, x] of [[PART.wheelL, RIG.wheelL[0]], [PART.wheelR, RIG.wheelR[0]]] as const) {
    b.part = part;
    const [, cy, cz] = RIG.wheelL;
    for (let i = 0; i < 2000; i++) {
      const t = b.r() * Math.PI * 2;
      const rr = 0.18 - b.r() * 0.035;
      b.add(x + (b.r() - 0.5) * 0.07, cy + Math.cos(t) * rr, cz + Math.sin(t) * rr, dark);
    }
    for (let k = 0; k < 3; k++) {
      const t = (k / 3) * Math.PI * 2;
      b.line([x, cy, cz], [x, cy + Math.cos(t) * 0.15, cz + Math.sin(t) * 0.15], 220, shell, 0.008);
    }
    b.sphere(x, cy, cz, 0.04, 200, shell);
  }

  b.part = PART.body;
  b.box([-0.32, 0.22, -0.26], [0.32, 0.42, 0.26], 3600, dark);
  b.box([-0.26, 0.42, -0.2], [0.26, 1.05, 0.2], 7200, shell);
  // chest dial
  for (let i = 0; i < 700; i++) {
    const t = b.r() * Math.PI * 2;
    const rr = 0.07 + b.gauss() * 0.004;
    b.add(Math.cos(t) * rr, 0.8 + Math.sin(t) * rr, 0.205, dark);
  }
  b.cylinder([0, 1.03, 0], [0, 1.16, 0], 0.06, 500, dark);

  b.part = PART.head;
  b.box([-0.25, 1.15, -0.2], [0.25, 1.5, 0.2], 6200, shell);
  // ear bolts
  b.cylinder([-0.25, 1.33, 0], [-0.3, 1.33, 0], 0.05, 300, dark);
  b.cylinder([0.25, 1.33, 0], [0.3, 1.33, 0], 0.05, 300, dark);

  b.part = PART.eyes;
  for (const ex of [-0.1, 0.1]) {
    for (let i = 0; i < 750; i++) {
      const t = b.r() * Math.PI * 2;
      const rr = Math.sqrt(b.r()) * 0.055;
      b.add(ex + Math.cos(t) * rr, RIG.eyeY + Math.sin(t) * rr * 1.15, 0.205, glowW, 0.02);
    }
  }

  b.part = PART.mouth;
  for (let k = 0; k < 6; k++) {
    const x = -0.1 + k * 0.04;
    b.line([x, RIG.mouthY - 0.025, 0.205], [x, RIG.mouthY + 0.025, 0.205], 110, glowH, 0.004);
  }

  b.part = PART.antenna;
  b.line([0, 1.5, 0], [0, 1.66, 0], 260, dark, 0.006);
  b.sphere(0, 1.68, 0, 0.035, 320, glowH);

  // arms: shoulder, elbow, hand. The left holds the clipboard, the right the pen
  const arm = (part: number, s: readonly number[], e: number[], h: number[]) => {
    b.part = part;
    b.sphere(s[0], s[1], s[2], 0.055, 300, dark);
    b.cylinder(s as number[], e, 0.04, 700, shell);
    b.sphere(e[0], e[1], e[2], 0.045, 250, dark);
    b.cylinder(e, h, 0.035, 650, shell);
    b.sphere(h[0], h[1], h[2], 0.05, 280, dark);
  };
  arm(PART.armL, RIG.shoulderL, [-0.42, 0.74, 0.06], [-0.2, 0.7, 0.3]);
  arm(PART.armR, RIG.shoulderR, [0.42, 0.74, 0.06], [0.14, 0.8, 0.38]);

  // clipboard, tilted up toward the robot's face so it can read it and we can see the paper
  const tilt = -0.75;
  const [cx, cy, cz] = [-0.1, 0.8, 0.36];
  const put = (u: number, v: number, w: number, c: RGB) =>
    b.add(cx + u, cy + v * Math.cos(tilt) - w * Math.sin(tilt), cz + v * Math.sin(tilt) + w * Math.cos(tilt), c, 0.04);
  b.part = PART.board;
  for (let i = 0; i < 3000; i++) put((b.r() - 0.5) * 0.32, (b.r() - 0.5) * 0.42, (b.r() - 0.5) * 0.02, dark);
  for (let i = 0; i < 260; i++) put((b.r() - 0.5) * 0.12, 0.2 + b.r() * 0.04, 0.02, shell);
  b.part = PART.paper;
  for (let row = 0; row < 6; row++) {
    const v = 0.13 - row * 0.055;
    for (let i = 0; i < 120; i++) put(-0.06 + b.r() * 0.17, v + b.gauss() * 0.003, 0.016, glowW);
    // a checkbox at the start of each line
    for (let i = 0; i < 40; i++) {
      const t = b.r() * 4;
      const q = (t % 1) * 0.024 - 0.012;
      const [du, dv] = t < 1 ? [q, -0.012] : t < 2 ? [q, 0.012] : t < 3 ? [-0.012, q] : [0.012, q];
      put(-0.1 + du, v + dv, 0.016, glowW);
    }
  }

  b.part = PART.pen;
  b.line([0.14, 0.8, 0.38], [0.05, 0.76, 0.43], 300, glowH, 0.006);

  return b.finish();
}

/** The last reconstruction: his name, rasterised in the browser and lifted into depth. */
export function nameCloud(text: string, seed = 71): Shape {
  const b = new Builder(rng(seed));
  if (typeof document === 'undefined') return b.finish();
  const cv = document.createElement('canvas');
  const W = 1400, H = 300;
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  g.font = '800 170px "Bricolage Grotesque Variable", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H / 2);
  const data = g.getImageData(0, 0, W, H).data;
  const on: [number, number][] = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4] > 128) on.push([x, y]);
  if (!on.length) return b.finish();
  for (let i = 0; i < N; i++) {
    const [px, py] = on[Math.floor(b.r() * on.length)];
    const x = ((px + b.r() * 2) / W - 0.5) * 3.6;
    const y = 1.0 - ((py + b.r() * 2) / H - 0.5) * 0.78;
    b.add(x, y, (b.r() - 0.5) * 0.12, hex('#e9ece6'), 0.1);
  }
  return b.finish();
}

// Hero stereo scene: camera view left of the divider, depth map right of it.
// Rendering is event-driven; a short easing loop runs on the GSAP ticker only while
// the divider catches up with the pointer, and never when the tab is hidden.

import { gsap } from 'gsap';
import { buildScene, drawView, depthLabel, W, H, type Scene } from '../lib/scene';

const MAX_DPR = 2;

export function initHero(root: HTMLElement, signal: AbortSignal) {
  const frame = root.querySelector<HTMLElement>('[data-frame]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]');
  const fallback = root.querySelector<HTMLElement>('[data-fallback]');
  const slider = root.querySelector<HTMLInputElement>('[data-slider]');
  if (!frame || !canvas || !fallback || !slider) return;

  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  if (!ctx) return; // keep the SVG fallback

  const scene: Scene = buildScene();
  const rgb = document.createElement('canvas');
  const depth = document.createElement('canvas');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  let target = 0.5;
  let pos = 0.5;
  let hovering = false;
  let focused = false;
  let running = false;
  let detect = '#d7332a';
  let onDetect = '#ffffff';
  let size = { w: 0, h: 0, px: 1 };

  const readColors = () => {
    const css = getComputedStyle(document.documentElement);
    detect = css.getPropertyValue('--detect').trim() || detect;
    onDetect = css.getPropertyValue('--on-detect').trim() || onDetect;
  };

  // Boxes are always on: the scene reads as a live detector. At rest they jitter by about a
  // pixel a few times a second, like detections from frame to frame (idle input; off under
  // reduced motion and while the scene is off screen).
  const showBoxes = () => true;
  const JITTER_HZ = 6;
  let noise = scene.apples.map(() => ({ dx: 0, dy: 0, ds: 0 }));
  let onScreen = false;
  const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

  function resize() {
    const w = frame!.clientWidth;
    if (!w) return;
    const h = (w * H) / W;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    if (cw === canvas!.width && ch === canvas!.height) return;
    size = { w, h, px: dpr };
    for (const c of [canvas!, rgb, depth]) {
      c.width = cw;
      c.height = ch;
    }
    const scale = cw / W;
    for (const [c, mode] of [
      [rgb, 'rgb'],
      [depth, 'depth'],
    ] as const) {
      const g = c.getContext('2d');
      if (!g) continue;
      g.setTransform(scale, 0, 0, scale, 0, 0);
      drawView(g, scene, mode);
    }
    draw();
  }

  function draw() {
    const g = ctx!;
    const cw = canvas!.width;
    const ch = canvas!.height;
    if (!cw) return;
    const s = cw / W; // image units → device pixels
    const px = size.px;
    const split = Math.round(pos * cw);

    g.setTransform(1, 0, 0, 1, 0, 0);
    if (split > 0) g.drawImage(rgb, 0, 0, split, ch, 0, 0, split, ch);
    if (split < cw) g.drawImage(depth, split, 0, cw - split, ch, split, 0, cw - split, ch);

    // Divider with a grip
    g.fillStyle = '#ffffff';
    g.fillRect(split - 1.5 * px, 0, 3 * px, ch);
    const grip = 22 * px;
    g.fillStyle = '#17262f';
    g.fillRect(split - grip / 2, ch / 2 - grip / 2, grip, grip);
    g.fillStyle = '#ffffff';
    g.fillRect(split - 4 * px, ch / 2 - 6 * px, 2 * px, 12 * px);
    g.fillRect(split + 2 * px, ch / 2 - 6 * px, 2 * px, 12 * px);

    if (!showBoxes()) return;

    g.font = `600 ${12 * px}px "Archivo Variable", system-ui, sans-serif`;
    g.textBaseline = 'alphabetic';
    const pad = 4 * s;
    const boxes = scene.apples.map((a, i) => {
      const n = noise[i];
      return {
        a,
        x: (a.u - a.r + n.dx) * s - pad,
        y: (a.v - a.r + n.dy) * s - pad,
        side: (a.r * 2 + n.ds) * s + pad * 2,
      };
    });
    for (const b of boxes) {
      g.lineWidth = 4 * px;
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      g.strokeRect(b.x, b.y, b.side, b.side);
      g.lineWidth = 2 * px;
      g.strokeStyle = detect;
      g.strokeRect(b.x, b.y, b.side, b.side);
    }
    // Labels nearest first; skip one that would cover a label already placed
    const th = 17 * px;
    const taken: [number, number, number, number][] = [];
    // At rest only the nearest few carry a label (fewer on phones); all of them while the visitor
    // drives the scene
    const maxLabels = hovering || focused ? Infinity : size.w < 600 ? 3 : 8;
    for (const b of [...boxes].reverse()) {
      if (taken.length >= maxLabels) break;
      const text = depthLabel(b.a.Z);
      const tw = g.measureText(text).width + 8 * px;
      const r: [number, number, number, number] = [b.x - px, b.y - th, tw, th];
      if (taken.some((t) => r[0] < t[0] + t[2] && t[0] < r[0] + r[2] && r[1] < t[1] + t[3] && t[1] < r[1] + r[3])) continue;
      taken.push(r);
      g.fillStyle = detect;
      g.fillRect(...r);
      g.fillStyle = onDetect;
      g.fillText(text, b.x + 3 * px, b.y - 4.5 * px);
    }
  }

  const stop = () => {
    if (running) gsap.ticker.remove(tick);
    running = false;
  };

  function tick() {
    if (document.hidden) return stop();
    const diff = target - pos;
    if (reduce.matches || Math.abs(diff) < 0.0008) {
      pos = target;
      stop();
    } else {
      pos += diff * (1 - Math.pow(0.75, gsap.ticker.deltaRatio()));
    }
    draw();
  }

  const request = () => {
    if (running || document.hidden) return;
    running = true;
    gsap.ticker.add(tick);
  };

  const setTarget = (t: number) => {
    target = Math.min(1, Math.max(0, t));
    slider!.value = String(Math.round(target * 100));
    slider!.setAttribute('aria-valuetext', `Divider at ${slider!.value}%`);
    request();
  };

  const fromEvent = (e: PointerEvent) => {
    const rect = frame!.getBoundingClientRect();
    setTarget((e.clientX - rect.left) / rect.width);
  };

  // Mouse and pen: follow the pointer while it is over the scene
  frame.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      if (e.buttons || e.pressure > 0) fromEvent(e);
      return;
    }
    hovering = true;
    fromEvent(e);
  });
  frame.addEventListener('pointerdown', (e) => {
    hovering = true;
    fromEvent(e);
  });
  frame.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return; // keep boxes after a touch drag
    hovering = false;
    request();
  });

  // Keyboard
  slider.addEventListener('input', () => setTarget(Number(slider.value) / 100));
  slider.addEventListener('focus', () => {
    focused = true;
    request();
  });
  slider.addEventListener('blur', () => {
    focused = false;
    request();
  });

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) stop();
      else request();
    },
    { signal },
  );

  reduce.addEventListener(
    'change',
    () => {
      if (reduce.matches) setTarget(0.5);
      draw();
    },
    { signal },
  );

  // Idle: re-sample the detection noise a few times a second while the scene is visible
  let acc = 0;
  const idle = (_t: number, dt: number) => {
    acc += dt / 1000;
    if (acc < 1 / JITTER_HZ) return;
    acc = 0;
    if (!onScreen || document.hidden || reduce.matches || hovering || focused) return;
    noise = scene.apples.map(() => ({ dx: gauss() * 0.9, dy: gauss() * 0.9, ds: gauss() * 0.8 }));
    draw();
  };
  gsap.ticker.add(idle);
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
  });
  io.observe(frame);
  signal.addEventListener('abort', () => {
    gsap.ticker.remove(idle);
    io.disconnect();
  });

  readColors();
  canvas.hidden = false;
  slider.hidden = false;
  fallback.hidden = true;
  const ro = new ResizeObserver(resize);
  ro.observe(frame);
  signal.addEventListener('abort', () => {
    ro.disconnect();
    stop();
  });
  resize();
  document.fonts?.ready.then(() => draw());
}

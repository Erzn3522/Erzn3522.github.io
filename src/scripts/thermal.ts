// Thermal NDT figure: thermal frame left of the divider, Fourier phase image
// right of it. Event-driven like the hero; the easing loop stops on arrival.

import {
  NX,
  NY,
  PLATE,
  CRACKS,
  T_MIN,
  T_MAX,
  base,
  contrast,
  buildField,
  frameAt,
  crackBoxes,
  depthText,
  iron,
  timeAt,
} from '../lib/thermal';

const MAX_DPR = 2;

interface Chart {
  X0: number;
  X1: number;
  Y0: number;
  Y1: number;
  TA0: number;
  TA1: number;
  CB1: number;
}

export function initThermal(root: HTMLElement) {
  const live = root.querySelector<HTMLElement>('[data-live]');
  const fallback = root.querySelector<HTMLElement>('[data-static]');
  const frame = root.querySelector<HTMLElement>('[data-frame]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]');
  const divider = root.querySelector<HTMLInputElement>('[data-divider]');
  const time = root.querySelector<HTMLInputElement>('[data-time]');
  const timeOut = root.querySelector<HTMLOutputElement>('[data-time-out]');
  const pointerA = root.querySelector<SVGPathElement>('[data-pointer-a]');
  const pointerB = root.querySelector<SVGPathElement>('[data-pointer-b]');
  const marks = root.querySelectorAll<SVGPathElement>('[data-tmark]');
  if (!live || !fallback || !frame || !canvas || !divider || !time || !timeOut) return;

  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  if (!ctx) return; // keep the static figure

  const chart: Chart = JSON.parse(root.dataset.chart ?? '{}');
  const field = buildField();
  const temps = new Float32Array(NX * NY);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Low-res source images, scaled up when drawn
  const thermalImg = document.createElement('canvas');
  const phaseImg = document.createElement('canvas');
  for (const c of [thermalImg, phaseImg]) {
    c.width = NX;
    c.height = NY;
  }

  let t = timeAt(Number(time.value));
  let target = 0.5;
  let pos = 0.5;
  let hovering = false;
  let focused = false;
  let probe: number | null = null; // pixel index under the pointer
  let raf = 0;
  let detect = '#d7332a';
  let onDetect = '#ffffff';
  let px = 1;

  const readColors = () => {
    const css = getComputedStyle(document.documentElement);
    detect = css.getPropertyValue('--detect').trim() || detect;
    onDetect = css.getPropertyValue('--on-detect').trim() || onDetect;
  };

  function paintPhase() {
    const g = phaseImg.getContext('2d')!;
    const img = g.createImageData(NX, NY);
    for (let p = 0; p < NX * NY; p++) {
      const v = 18 + field.phase[p] * 237;
      img.data[p * 4] = v;
      img.data[p * 4 + 1] = v;
      img.data[p * 4 + 2] = v;
      img.data[p * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  function paintThermal() {
    frameAt(field, t, temps);
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of temps) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const g = thermalImg.getContext('2d')!;
    const img = g.createImageData(NX, NY);
    const span = hi - lo || 1;
    for (let p = 0; p < temps.length; p++) {
      const [r, gg, b] = iron((temps[p] - lo) / span);
      img.data[p * 4] = r;
      img.data[p * 4 + 1] = gg;
      img.data[p * 4 + 2] = b;
      img.data[p * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  function resize() {
    const w = frame!.clientWidth;
    if (!w) return;
    px = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const cw = Math.round(w * px);
    const ch = Math.round((w * 3 * px) / 4);
    if (cw === canvas!.width && ch === canvas!.height) return;
    canvas!.width = cw;
    canvas!.height = ch;
    draw();
  }

  const showBoxes = () => reduce.matches || hovering || focused;

  function draw() {
    const g = ctx!;
    const cw = canvas!.width;
    const ch = canvas!.height;
    if (!cw) return;
    const split = Math.round(pos * cw);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    if (split > 0) g.drawImage(thermalImg, 0, 0, (split / cw) * NX, NY, 0, 0, split, ch);
    if (split < cw) g.drawImage(phaseImg, (split / cw) * NX, 0, NX - (split / cw) * NX, NY, split, 0, cw - split, ch);

    g.fillStyle = '#ffffff';
    g.fillRect(split - 1.5 * px, 0, 3 * px, ch);
    const grip = 22 * px;
    g.fillStyle = '#17262f';
    g.fillRect(split - grip / 2, ch / 2 - grip / 2, grip, grip);
    g.fillStyle = '#ffffff';
    g.fillRect(split - 4 * px, ch / 2 - 6 * px, 2 * px, 12 * px);
    g.fillRect(split + 2 * px, ch / 2 - 6 * px, 2 * px, 12 * px);

    if (!showBoxes()) return;
    const sx = cw / PLATE.w;
    const sy = ch / PLATE.h;
    g.font = `600 ${12 * px}px "Archivo Variable", system-ui, sans-serif`;
    for (const b of crackBoxes()) {
      const x = b.x * sx;
      const y = b.y * sy;
      g.lineWidth = 4 * px;
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      g.strokeRect(x, y, b.w * sx, b.h * sy);
      g.lineWidth = 2 * px;
      g.strokeStyle = detect;
      g.strokeRect(x, y, b.w * sx, b.h * sy);
      const text = depthText(b.depth);
      const tw = g.measureText(text).width + 8 * px;
      const th = 17 * px;
      g.fillStyle = detect;
      g.fillRect(x - px, y - th, tw, th);
      g.fillStyle = onDetect;
      g.fillText(text, x + 3 * px, y - 4.5 * px);
    }
  }

  // ---------- charts ----------
  const lx = (tt: number) =>
    chart.X0 + ((Math.log10(tt) - Math.log10(T_MIN)) / (Math.log10(T_MAX) - Math.log10(T_MIN))) * (chart.X1 - chart.X0);
  const ya = (v: number) =>
    chart.Y1 -
    ((Math.log10(v) - Math.log10(chart.TA0)) / (Math.log10(chart.TA1) - Math.log10(chart.TA0))) * (chart.Y1 - chart.Y0);
  const yb = (v: number) => chart.Y1 - (v / chart.CB1) * (chart.Y1 - chart.Y0);
  const clampY = (y: number) => Math.min(chart.Y1, Math.max(chart.Y0, y));
  const samples = Array.from({ length: 100 }, (_, i) => T_MIN * (T_MAX / T_MIN) ** (i / 99));

  function drawCharts() {
    const x = lx(t).toFixed(1);
    marks.forEach((m) => m.setAttribute('d', `M${x} ${chart.Y0}V${chart.Y1}`));
    if (!pointerA || !pointerB) return;
    if (probe === null) {
      pointerA.setAttribute('d', '');
      pointerB.setAttribute('d', '');
      return;
    }
    const p = probe;
    const w = field.weights.map((ws) => ws[p]);
    const excess = (tt: number) => CRACKS.reduce((s, c, i) => s + w[i] * contrast(c.depth, tt), 0);
    const a: string[] = [];
    const b: string[] = [];
    samples.forEach((tt, i) => {
      const e = excess(tt);
      const cmd = i ? 'L' : 'M';
      a.push(`${cmd}${lx(tt).toFixed(1)} ${clampY(ya(field.lamp[p] * base(tt) * (1 + e))).toFixed(1)}`);
      b.push(`${cmd}${lx(tt).toFixed(1)} ${clampY(yb(e)).toFixed(1)}`);
    });
    pointerA.setAttribute('d', a.join(''));
    pointerB.setAttribute('d', b.join(''));
  }

  // ---------- loop ----------
  function tick() {
    raf = 0;
    if (document.hidden) return;
    const diff = target - pos;
    if (reduce.matches || Math.abs(diff) < 0.0008) {
      pos = target;
    } else {
      pos += diff * 0.25;
      raf = requestAnimationFrame(tick);
    }
    draw();
  }

  const request = () => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
  };

  const setTarget = (v: number) => {
    target = Math.min(1, Math.max(0, v));
    divider!.value = String(Math.round(target * 100));
    divider!.setAttribute('aria-valuetext', `Divider at ${divider!.value}%`);
    request();
  };

  const fromEvent = (e: PointerEvent) => {
    const rect = frame!.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    setTarget(fx);
    const i = Math.min(NX - 1, Math.max(0, Math.floor(fx * NX)));
    const j = Math.min(NY - 1, Math.max(0, Math.floor(fy * NY)));
    probe = j * NX + i;
    drawCharts();
  };

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
    if (e.pointerType === 'touch') return;
    hovering = false;
    probe = null;
    drawCharts();
    request();
  });

  divider.addEventListener('input', () => setTarget(Number(divider.value) / 100));
  divider.addEventListener('focus', () => {
    focused = true;
    request();
  });
  divider.addEventListener('blur', () => {
    focused = false;
    request();
  });

  time.addEventListener('input', () => {
    t = timeAt(Number(time.value));
    const s = t < 10 ? t.toFixed(1) : t.toFixed(0);
    timeOut.textContent = `${s} s`;
    time.setAttribute('aria-valuetext', `${s} seconds after the flash`);
    paintThermal();
    drawCharts();
    draw();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      request();
    }
  });

  const recolor = () => {
    readColors();
    draw();
  };
  window.addEventListener('themechange', recolor);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', recolor);
  reduce.addEventListener('change', () => {
    if (reduce.matches) setTarget(0.5);
    draw();
  });

  readColors();
  paintPhase();
  paintThermal();
  time.setAttribute('aria-valuetext', `${timeOut.textContent?.replace(' s', '')} seconds after the flash`);
  live.hidden = false;
  fallback.hidden = true;
  root.querySelectorAll<HTMLElement>('.live-only').forEach((el) => (el.hidden = false));
  new ResizeObserver(resize).observe(frame);
  resize();
  drawCharts();
  document.fonts?.ready.then(() => draw());
}

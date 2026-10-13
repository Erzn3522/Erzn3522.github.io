// The depth driver: ONE variable, Z, drives every visual that carries the concept.
// Scroll progress walks the page from the far plane (7.5 m) to within reach (0.40 m) on an
// inverse-depth scale, like the hero's colormap. Z sets the rail marker, the readout and the
// site accent (--c-depth on <html>). Idle input: sensor noise (σ = 2 mm) on the readout.
import { gsap } from 'gsap';
import { onPage, onScroll, prefersReducedMotion } from '../engine';

export const Z_FAR = 7.5;
export const Z_REACH = 0.4;
const IN_REACH = 0.985; // progress at which the readout says "In reach"
const NOISE_SD = 0.002; // metres: the calibration's own standard deviation
const NOISE_HZ = 6;

// Brightened version of the hero colormap: every stop holds ≥ 5:1 on the ground
const STOPS: [number, [number, number, number]][] = [
  [0, [91, 140, 255]],
  [0.22, [54, 181, 216]],
  [0.45, [76, 201, 127]],
  [0.68, [227, 211, 74]],
  [0.84, [245, 154, 69]],
  [1, [255, 90, 78]],
];

export function depthColor(t: number) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    const [t0, c0] = STOPS[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
      return `rgb(${c[0]} ${c[1]} ${c[2]})`;
    }
  }
  return 'rgb(255 90 78)';
}

/** Progress 0..1 → depth in metres, linear in 1/Z (disparity) */
export const depthAt = (p: number) => 1 / (1 / Z_FAR + Math.min(1, Math.max(0, p)) * (1 / Z_REACH - 1 / Z_FAR));

const fmt = (z: number) => `Z ${z.toFixed(3)} m`;

let readouts: HTMLElement[] = [];
let markers: HTMLElement[] = [];
let bars: HTMLElement[] = [];
let current = 0;
let invalid = false;
let shownText = '';

function setText(text: string) {
  if (text === shownText) return;
  shownText = text;
  for (const r of readouts) r.textContent = text;
}

function apply(p: number) {
  const root = document.documentElement;
  if (invalid) {
    root.style.setProperty('--c-depth', '#959d9f');
    setText('No depth');
    for (const m of markers) m.style.translate = '0 0';
    for (const b of bars) b.style.transform = 'scaleX(0)';
    return;
  }
  root.style.setProperty('--c-depth', depthColor(p));
  root.classList.toggle('in-reach', p >= IN_REACH);
  setText(p >= IN_REACH ? 'In reach' : fmt(depthAt(p)));
  for (const m of markers) m.style.translate = `0 calc(${(p * 100).toFixed(2)} * var(--rail-h) / 100)`;
  for (const b of bars) b.style.transform = `scaleX(${p.toFixed(4)})`;
}

// Box-Muller, for honest-looking sensor noise
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

export function startDepth() {
  onScroll(({ progress }) => apply((current = progress)));

  onPage(() => {
    readouts = [...document.querySelectorAll<HTMLElement>('[data-depth-readout]')];
    markers = [...document.querySelectorAll<HTMLElement>('[data-rail-marker]')];
    bars = [...document.querySelectorAll<HTMLElement>('[data-depth-bar]')];
    invalid = !!document.querySelector('[data-depth="invalid"]');
    shownText = '';
    apply(current);
    return () => {
      readouts = [];
      markers = [];
      bars = [];
      invalid = false;
    };
  });

  if (prefersReducedMotion()) return;

  // Idle: the sensor keeps measuring. A few times a second the readout's last digit moves.
  let acc = 0;
  gsap.ticker.add((_t, dt) => {
    acc += dt / 1000;
    if (acc < 1 / NOISE_HZ || invalid || document.hidden) return;
    acc = 0;
    if (current >= IN_REACH || !readouts.length) return;
    setText(fmt(depthAt(current) + gauss() * NOISE_SD));
  });
}

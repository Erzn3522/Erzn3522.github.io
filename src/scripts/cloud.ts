// The home controller. ONE clock (this rAF loop) drives the point cloud, the camera and the
// live labels. Scroll position picks the chapter and the morph; the pointer turns the camera;
// holding anywhere (or Space, or the toggle) swaps the depth map for the camera colours.
import { createCloud, type Camera } from '../lib/cloud-gl';
import * as S from '../lib/shapes';
import type { Chapter, ShapeKey } from '../data/chapters';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

export function initCloud(root: HTMLElement, chapters: Chapter[], name: string) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-cloud-canvas]');
  const labelsEl = root.querySelector<HTMLElement>('[data-cloud-labels]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-view-toggle]');
  const sections = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-chapter-link]')];
  if (!canvas || !labelsEl || !sections.length) return;

  const small = matchMedia('(max-width: 767px)').matches;
  let cloud: ReturnType<typeof createCloud> = null;
  try {
    cloud = createCloud(canvas, { count: small ? Math.round(S.N * 0.75) : S.N, maxDpr: small ? 1.5 : 2 });
  } catch {
    cloud = null;
  }
  if (!cloud) {
    document.documentElement.classList.add('no-gl');
    return;
  }
  document.documentElement.classList.add('gl-on');

  // Build shapes lazily: the hero's first, the rest when the browser is idle
  const cache = new Map<ShapeKey, S.Shape>();
  const make = (k: ShapeKey): S.Shape => {
    let s = cache.get(k);
    if (s) return s;
    s =
      k === 'orchard' ? S.orchard() :
      k === 'calibration' ? S.calibration() :
      k === 'detection' ? S.detection() :
      k === 'navigation' ? S.navigation() :
      k === 'face' ? S.face() :
      k === 'thermal' ? S.thermal() :
      k === 'attention' ? S.attention() :
      S.nameCloud(name);
    cache.set(k, s);
    return s;
  };
  const warm = [...new Set(chapters.map((c) => c.shape))];
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn) : setTimeout(fn, 60));
  const warmNext = () => {
    const k = warm.find((x) => !cache.has(x));
    if (!k) return;
    idle(() => {
      // the name needs the webfont loaded before it is rasterised
      if (k === 'name') document.fonts.ready.then(() => { make(k); warmNext(); });
      else { make(k); warmNext(); }
    });
  };

  let pair = -1;
  const setPair = (i: number) => {
    if (i === pair) return;
    pair = i;
    const a = chapters[i];
    const b = chapters[Math.min(i + 1, chapters.length - 1)];
    cloud!.setPair(make(a.shape), make(b.shape));
  };

  // ---------- inputs ----------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pointer.tx = e.clientX / innerWidth - 0.5;
    pointer.ty = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  let rgb = 0;
  let rgbTarget = 0;
  let pinned = false; // the toggle button keeps the camera view on
  const setView = (on: boolean) => {
    rgbTarget = on ? 1 : 0;
    document.documentElement.classList.toggle('camera-view', on);
  };
  const holdable = (t: EventTarget | null) => !(t as HTMLElement)?.closest?.('a, button, input, label, [data-no-hold]');
  addEventListener('pointerdown', (e) => {
    if (e.button === 0 && holdable(e.target)) setView(true);
  });
  const release = () => { if (!pinned) setView(false); };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('keydown', (e) => {
    if (e.code === 'Space' && holdable(document.activeElement) && !e.repeat) { e.preventDefault(); setView(true); }
  });
  addEventListener('keyup', (e) => { if (e.code === 'Space') release(); });
  toggle?.addEventListener('click', () => {
    pinned = !pinned;
    toggle.setAttribute('aria-pressed', String(pinned));
    setView(pinned);
  });

  // ---------- scroll → chapter ----------
  let tops: number[] = [];
  const measure = () => {
    tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
    cloud!.resize();
  };
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  /** index of the current chapter and how far into the move to the next one (0..1) */
  function where() {
    const pos = scrollY + innerHeight * 0.5;
    let i = 0;
    while (i < tops.length - 1 && pos >= tops[i + 1]) i++;
    const start = tops[i];
    const end = i < tops.length - 1 ? tops[i + 1] : start + innerHeight;
    const local = Math.min(1, Math.max(0, (pos - start) / Math.max(1, end - start)));
    // hold the reconstruction for most of the chapter, then morph in the last 40%
    let move = Math.min(1, Math.max(0, (local - 0.6) / 0.4));
    if (i === tops.length - 1) move = 0;
    if (reduce.matches) move = move > 0.5 ? 1 : 0;
    return { i, move: smooth(move) };
  }

  // ---------- labels ----------
  const labelEls: HTMLElement[] = [];
  const label = (k: number) => {
    while (labelEls.length <= k) {
      const el = document.createElement('div');
      el.className = 'cl-label';
      el.innerHTML = '<span class="cl-box"></span><span class="cl-text"></span>';
      labelsEl!.appendChild(el);
      labelEls.push(el);
    }
    return labelEls[k];
  };

  function drawLabels(ch: Chapter, alpha: number) {
    let used = 0;
    if (ch.labels && alpha > 0.02) {
      const shape = make(ch.shape);
      const items = shape.anchors
        .map((a) => ({ a, s: cloud!.project(a.p, a.r) }))
        .filter((o) => o.s && o.s.x > -50 && o.s.x < innerWidth + 50)
        .sort((p, q) => p.s!.dist - q.s!.dist)
        .slice(0, ch.labels === 'distance' ? (small ? 4 : 8) : 8);
      for (const { a, s } of items) {
        const el = label(used++);
        const r = s!.rpx + 6;
        el.style.translate = `${(s!.x - r).toFixed(1)}px ${(s!.y - r).toFixed(1)}px`;
        el.style.setProperty('--size', `${(r * 2).toFixed(1)}px`);
        el.style.opacity = String(alpha);
        const text = ch.labels === 'distance' ? `${s!.dist.toFixed(2)} m` : a.label ?? '';
        const t = el.querySelector('.cl-text')!;
        if (t.textContent !== text) t.textContent = text;
        el.classList.toggle('is-boxless', ch.labels === 'names' && !!a.label && a.r > 0.2);
        el.hidden = false;
      }
    }
    for (let k = used; k < labelEls.length; k++) labelEls[k].hidden = true;
  }

  // ---------- the loop ----------
  const cam: Camera = { ...chapters[0].cam, target: [...chapters[0].cam.target] };
  let current = -1;
  let running = true;
  let last = performance.now();

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const { i, move } = where();
    setPair(i);
    if (i !== current) {
      current = i;
      navLinks.forEach((a, k) => (k === i ? a.setAttribute('aria-current', 'step') : a.removeAttribute('aria-current')));
      document.documentElement.dataset.chapter = chapters[i].id;
    }
    const a = chapters[i].cam;
    const b = chapters[Math.min(i + 1, chapters.length - 1)].cam;
    const k = reduce.matches ? 1 : 1 - Math.pow(0.0015, dt); // camera eases toward its goal
    const goal = {
      target: [0, 1, 2].map((j) => lerp(a.target[j], b.target[j], move)),
      dist: lerp(a.dist, b.dist, move),
      theta: lerp(a.theta, b.theta, move),
      phi: lerp(a.phi, b.phi, move),
    };
    const still = reduce.matches ? 0 : 1;
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    const t = now / 1000;
    const drift = still * Math.sin(t * 0.12) * 0.07;
    cam.target = cam.target.map((v, j) => v + (goal.target[j] - v) * k) as [number, number, number];
    cam.dist += (goal.dist - cam.dist) * k;
    cam.theta += (goal.theta + still * (pointer.x * 0.55 + drift) - cam.theta) * k;
    cam.phi += (goal.phi + still * pointer.y * -0.22 - cam.phi) * k;
    rgb += (rgbTarget - rgb) * Math.min(1, dt * (reduce.matches ? 60 : 7));

    const portrait = innerWidth / innerHeight < 0.8;
    cloud!.render({ morph: move, rgb, time: t, idle: still, cam: portrait ? { ...cam, dist: cam.dist * 0.8 } : cam });
    // labels only on a settled reconstruction
    drawLabels(chapters[i], Math.max(0, 1 - move * 4));
    requestAnimationFrame(frame);
  }

  // Render only while the tab is visible and the canvas is on screen
  let onScreen = true;
  const wake = () => {
    const should = !document.hidden && onScreen;
    if (should && !running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    } else if (!should) running = false;
  };
  document.addEventListener('visibilitychange', wake);
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    wake();
  }).observe(canvas);

  measure();
  setPair(0);
  requestAnimationFrame((n) => {
    last = n;
    frame(n);
    root.classList.add('is-live');
    warmNext();
  });
}

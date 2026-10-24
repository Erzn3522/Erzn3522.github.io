// The home controller. ONE clock (this rAF loop) drives the point cloud, the camera and the
// live labels. Scroll position picks the chapter and the morph; the pointer turns the camera;
// holding anywhere (or Space, or the toggle) swaps the depth map for the camera colours.
import { createCloud, deviceCloudOpts, type Camera } from '../lib/cloud-gl';
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
    cloud = createCloud(canvas, deviceCloudOpts());
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
  const release = () => { if (!pinned) setView(false); };

  // Mouse and pen: the camera view shows while the button is down.
  // Touch: only a deliberate long press (still finger, ~0.4 s) shows it, so scrolling never flickers.
  let holdTimer = 0;
  let touchHold = false;
  const start = { x: 0, y: 0 };
  const cancelHold = () => {
    clearTimeout(holdTimer);
    holdTimer = 0;
  };
  addEventListener('pointerdown', (e) => {
    if (!holdable(e.target)) return;
    if (e.pointerType === 'touch') {
      start.x = e.clientX;
      start.y = e.clientY;
      cancelHold();
      holdTimer = window.setTimeout(() => {
        holdTimer = 0;
        touchHold = true;
        setView(true);
      }, 420);
      return;
    }
    if (e.button === 0) setView(true);
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && holdTimer && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) cancelHold();
  }, { passive: true });
  addEventListener('scroll', cancelHold, { passive: true });
  const end = () => {
    cancelHold();
    touchHold = false;
    release();
  };
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);
  // a long press must not open the browser's text or link menu
  addEventListener('contextmenu', (e) => {
    if (touchHold) e.preventDefault();
  });
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
  let resizeFrame = 0;
  const measure = () => {
    tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
    cloud!.resize();
  };
  const scheduleMeasure = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(measure);
  };
  // Mobile browser chrome can emit many resize events during one scroll. Coalescing them keeps
  // canvas reallocations out of the middle of the scroll frame, where they cause visible jumps.
  addEventListener('resize', scheduleMeasure, { passive: true });
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
        // Keep the label as a composited layer. Updating the independent `translate` property
        // caused its text to be rerasterised at slightly different subpixels on every frame.
        el.style.transform = `translate3d(${(s!.x - r).toFixed(1)}px, ${(s!.y - r).toFixed(1)}px, 0)`;
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

  // ---------- frame budget: if the device struggles, draw fewer points (twice at most) ----------
  let samples: number[] = [];
  let trims = 0;
  let warmup = 1.2; // seconds: ignore shader compile and first uploads
  function budget(dt: number) {
    if (trims >= 2 || reduce.matches) return;
    if (warmup > 0) {
      warmup -= dt;
      return;
    }
    samples.push(dt);
    if (samples.length < 60) return;
    const sorted = [...samples].sort((p, q) => p - q);
    const median = sorted[sorted.length >> 1];
    samples = [];
    if (median > 1 / 42) {
      trims++;
      cloud!.setCount(Math.round(cloud!.count() * 0.6));
    }
  }

  // ---------- the loop ----------
  const cam: Camera = { ...chapters[0].cam, target: [...chapters[0].cam.target] };
  let current = -1;
  let running = true;
  let started = false;
  let snap = false; // first frame after the intro: land exactly on the goal, no easing
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
    const k = reduce.matches || snap ? 1 : 1 - Math.pow(0.0015, dt); // camera eases toward its goal
    snap = false;
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

    // Portrait screens: bring the camera closer so the subject fills the narrow frame
    const portrait = innerWidth / innerHeight < 0.8;
    const pm = lerp(chapters[i].portrait, chapters[Math.min(i + 1, chapters.length - 1)].portrait, move);
    // and aim a little low, so the subject sits in the upper half, above the copy
    const pd = cam.dist * pm;
    const portraitCam = { ...cam, dist: pd, target: [cam.target[0], cam.target[1] - pd * 0.16, cam.target[2]] as [number, number, number] };
    cloud!.render({ morph: move, rgb, time: t, idle: still, cam: portrait ? portraitCam : cam });
    budget(dt);
    // labels only on a settled reconstruction
    drawLabels(chapters[i], Math.max(0, 1 - move * 4));
    requestAnimationFrame(frame);
  }

  // Render only while the tab is visible and the canvas is on screen
  let onScreen = true;
  const wake = () => {
    if (!started) return;
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
  const begin = () =>
    requestAnimationFrame((n) => {
      started = true;
      last = n;
      frame(n);
      root.classList.add('is-live');
      dispatchEvent(new Event('cloud:live'));
      warmNext();
    });
  // The intro draws the orchard's first frame itself, then hands over the pointer it used so this
  // loop starts from the very same camera; until then the home cloud stays idle
  if (document.documentElement.dataset.intro === 'on') {
    addEventListener('intro:handoff', (e) => {
      const d = (e as CustomEvent<{ x: number; y: number }>).detail;
      pointer.x = pointer.tx = d.x;
      pointer.y = pointer.ty = d.y;
      snap = true;
      root.classList.add('is-instant');
      begin();
    }, { once: true });
  } else begin();
}

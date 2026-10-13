// First-load sequence. Progress follows REAL work (fonts + critical images), eased by GSAP,
// with a floor so it reads as intentional and a ceiling so it never becomes a usability problem.
// Markup (#loader) lives in the layout. It plays once per session: the head script adds
// html.no-loader on later visits, and the loader is skipped.
import { gsap } from 'gsap';
import { ease, prefersReducedMotion } from './env';

let format = (p: number) => String(Math.round(p)).padStart(3, '0');
/** Customize the counter text. p goes 0 → 100. */
export const setLoaderFormat = (fn: (p: number) => string) => {
  format = fn;
};
let exit: ((root: HTMLElement) => gsap.core.Timeline) | null = null;
/** Replace the exit choreography (the loader → hero handoff). Return a timeline. */
export const setLoaderExit = (fn: (root: HTMLElement) => gsap.core.Timeline) => {
  exit = fn;
};

const MIN = 0.6; // seconds: long enough to read as a designed moment
const MAX = 1.2; // seconds: progress cap; the exit adds ~0.6 s

function criticalAssets(): Promise<unknown>[] {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('img[data-critical], [data-intro] img')];
  return [document.fonts.ready, ...imgs.map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => {})))];
}

export async function runLoader(): Promise<void> {
  const root = document.getElementById('loader');
  if (!root || root.hidden) return void document.documentElement.classList.add('is-loaded');
  if (document.documentElement.classList.contains('no-loader')) return finish(root);
  try {
    sessionStorage.setItem('loaded', '1');
  } catch {
    // Storage blocked: the loader plays on every full load. Still short.
  }
  if (prefersReducedMotion()) {
    await Promise.race([Promise.all(criticalAssets()), wait(MAX)]);
    await gsap.to(root, { autoAlpha: 0, duration: 0.3 });
    return finish(root);
  }
  const count = root.querySelector<HTMLElement>('[data-loader-count]');
  const bar = root.querySelector<HTMLElement>('[data-loader-bar]');
  const tasks = criticalAssets();
  let done = 0;
  const shown = { v: 0 };
  const target = { v: 0 };
  tasks.forEach((t) =>
    t.then(() => {
      done++;
      target.v = (done / tasks.length) * 100;
    }),
  );
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const timeCap = Math.min(100, (elapsed / MIN) * 100); // never faster than MIN
      const goal = elapsed > MAX ? 100 : Math.min(target.v, timeCap);
      shown.v += (goal - shown.v) * 0.14;
      if (goal === 100 && shown.v > 99.5) shown.v = 100;
      if (count) count.textContent = format(shown.v);
      if (bar) bar.style.transform = `scaleX(${shown.v / 100})`;
      if (shown.v === 100) {
        gsap.ticker.remove(tick);
        resolve();
      }
    };
    gsap.ticker.add(tick);
  });

  if (exit) {
    await exit(root);
    return finish(root);
  }
  await gsap
    .timeline()
    .to(root.querySelectorAll('[data-loader-out]'), { yPercent: -110, duration: 0.6, ease: ease.inOut, stagger: 0.05 })
    .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: ease.inOut }, '-=0.3');
  finish(root);
}

function finish(root: HTMLElement) {
  root.hidden = true;
  document.documentElement.classList.add('is-loaded');
}

const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

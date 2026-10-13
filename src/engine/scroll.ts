// Smooth scroll on ONE clock: Lenis is driven by gsap.ticker, ScrollTrigger reads Lenis.
// Reduced motion → native scroll, no Lenis.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let native = false;
const listeners = new Set<(s: ScrollState) => void>();

export type ScrollState = { y: number; velocity: number; progress: number };
const state: ScrollState = { y: 0, velocity: 0, progress: 0 };

export function initScroll() {
  if (lenis || native) return;
  if (prefersReducedMotion()) {
    // Still publish native scroll position for the depth driver.
    native = true;
    addEventListener('scroll', nativeTick, { passive: true });
    return;
  }
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.2, anchors: true });
  lenis.on('scroll', (l: Lenis) => {
    state.y = l.scroll;
    state.velocity = l.velocity;
    state.progress = l.limit > 0 ? l.scroll / l.limit : 0; // Lenis reports 1 on pages that cannot scroll
    ScrollTrigger.update();
    listeners.forEach((fn) => fn(state));
  });
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function nativeTick() {
  const max = document.documentElement.scrollHeight - innerHeight;
  state.velocity = scrollY - state.y;
  state.y = scrollY;
  state.progress = max > 0 ? scrollY / max : 0;
  listeners.forEach((fn) => fn(state));
}

/** Re-publish the current position (after a page swap or resize changed the page height). */
export function publishScroll() {
  if (lenis) {
    lenis.resize();
    state.y = lenis.scroll;
    state.progress = lenis.limit > 0 ? lenis.scroll / lenis.limit : 0;
    listeners.forEach((fn) => fn(state));
  } else nativeTick();
}

export const onScroll = (fn: (s: ScrollState) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const scrollState = () => state;
export const stopScroll = () => lenis?.stop();
/** Cancel a programmatic scroll where it is (the visitor took over) */
export const haltScroll = () => lenis?.scrollTo(lenis.animatedScroll, { immediate: true, force: true });
export const startScroll = () => lenis?.start();
export function resetScroll() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else scrollTo(0, 0);
  state.y = 0;
  state.velocity = 0;
}
export function scrollToTarget(
  target: string | HTMLElement | number,
  opts: { duration?: number; easing?: (t: number) => number; onComplete?: () => void } = {},
) {
  if (lenis) {
    lenis.scrollTo(target, {
      duration: opts.duration ?? 1.4,
      easing: opts.easing ?? ((t) => 1 - Math.pow(1 - t, 4)),
      onComplete: opts.onComplete,
    });
    return;
  }
  if (typeof target === 'number') scrollTo({ top: target });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView();
}

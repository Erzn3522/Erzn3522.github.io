// Global motion for "Replay". Runs once on the client, before the first page initializes.
import { gsap } from 'gsap';
import { ease, onPage, setTransition } from '../engine';
import { startPlayButton, startReplay } from './replay';
import { scrollToTarget } from '../engine';

export function setupMotion() {
  // Page change = a seek: the screen drops to black for a moment with the destination on it,
  // while the persistent timeline's playhead glides to the new position.
  let destination = '';
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement).closest('a');
      if (!a) return;
      const t = a.querySelector('[data-title]') ?? a;
      destination = (a.dataset.dest || t.firstChild?.textContent?.trim() || t.textContent?.trim() || '').replace(/\s+/g, ' ');
    },
    true,
  );

  setTransition({
    leave: (c) =>
      gsap
        .timeline()
        .call(() => {
          const out = c.querySelector('[data-curtain-title]');
          if (out) out.textContent = destination;
          destination = '';
        })
        .set(c, { autoAlpha: 1 })
        .fromTo(c.querySelector('.curtain__panel'), { opacity: 0 }, { opacity: 1, duration: 0.3, ease: ease.soft }),
    enter: (c) =>
      gsap
        .timeline()
        .to(c.querySelector('.curtain__panel'), { opacity: 0, duration: 0.45, ease: ease.soft, delay: 0.1 })
        .set(c, { autoAlpha: 0 }),
  });

  startReplay();
  startPlayButton();

  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
      if (!a || a.hasAttribute('data-play-replay')) return;
      const url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      history.pushState(null, '', url.hash);
      scrollToTarget(target);
      target.focus?.({ preventScroll: true });
    },
    true,
  );

  // Local time in Logatec, for scheduling a call (footer)
  onPage(() => {
    const el = document.querySelector<HTMLElement>('[data-local-time]');
    if (!el) return;
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Ljubljana' });
    const tick = () => (el.textContent = fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  });
}

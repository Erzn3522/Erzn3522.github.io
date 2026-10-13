// Global motion for "Approach". Runs once on the client, before the first page initializes.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ease, onPage, setLoaderExit, setLoaderFormat, setTransition } from '../engine';
import { startDepth } from './depth';

const LOADER_FROM = 20; // m: the sensor acquires from beyond the scene…
const LOADER_TO = 7.5; //  …and settles on the hero's far plane

export function setupMotion() {
  // Loader counter: a depth reading closing in on the far plane, linear in 1/Z
  setLoaderFormat((p) => {
    const inv = 1 / LOADER_FROM + (p / 100) * (1 / LOADER_TO - 1 / LOADER_FROM);
    return `${(1 / inv).toFixed(2)} m`;
  });

  // Exit: the readout lifts away, then the frame sweeps off left to right like the hero divider
  setLoaderExit((root) =>
    gsap
      .timeline()
      .to(root.querySelectorAll('[data-loader-out]'), { yPercent: -110, duration: 0.4, ease: ease.inOut, stagger: 0.04 })
      .to(root, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.6, ease: ease.inOut }, '-=0.2'),
  );

  // Page transition: a sensor sweep. A black band with depth-coloured edges crosses the
  // screen left to right, covers it while the next page loads, then leaves to the right.
  // The band carries where you are going: the destination's title, read from the clicked link
  let destination = '';
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement).closest('a');
      if (!a) return;
      const t = a.querySelector('.row__title, .next__title') ?? a;
      // First text node only, so a lock chip inside the title is left out
      destination = (t.firstChild?.textContent?.trim() || t.textContent?.trim() || '').replace(/\s+/g, ' ');
    },
    true,
  );

  setTransition({
    leave: (c) =>
      gsap
        .timeline()
        .call(() => {
          const title = c.querySelector('[data-curtain-title]');
          if (title) title.textContent = destination;
          destination = '';
        })
        .set(c, { autoAlpha: 1 })
        .fromTo(c.querySelector('.curtain__panel'), { xPercent: -101 }, { xPercent: 0, duration: 0.75, ease: ease.inOut }),
    enter: (c) =>
      gsap
        .timeline()
        .to(c.querySelector('.curtain__panel'), { xPercent: 101, duration: 0.8, ease: ease.inOut })
        .set(c, { autoAlpha: 0 }),
  });

  startDepth();

  // Targets that lock on when they arrive in frame (the contact email, the next-project title)
  onPage(() => {
    document.querySelectorAll<HTMLElement>('[data-lock-on-arrive]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        onEnter: () => el.classList.add('is-locked'),
        onLeaveBack: () => el.classList.remove('is-locked'),
      });
    });
  });
}

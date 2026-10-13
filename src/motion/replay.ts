// The replay driver: ONE clock, t (months since Jan 2020), drives the timeline playhead,
// the lit track and, on the home page, the viewer panels. Scrolling the replay section
// rewinds t from the live head to 2020; every other page seeks t to its own position.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ease, haltScroll, onPage, prefersReducedMotion, scrollToTarget } from '../engine';
import { AXIS, LIVE } from '../data/replay';

const state = { t: LIVE };
let label = 'LIVE';
let track = 'pek';

const pct = (m: number) => ((m - AXIS.from) / (AXIS.to - AXIS.from)) * 100;

function render() {
  const head = document.querySelector<HTMLElement>('[data-playhead]');
  if (!head) return;
  const x = pct(state.t);
  head.style.setProperty('--x', x.toFixed(3));
  head.classList.toggle('is-early', x < 45);
  const out = head.querySelector('[data-playhead-label]');
  if (out && out.textContent !== label) out.textContent = label;
  document.querySelectorAll<HTMLElement>('[data-seg]').forEach((s) => s.classList.toggle('is-on', s.dataset.seg === track));
}

/** Glide the playhead to a position (page changes, timeline clicks) */
function seek(to: number, nextLabel: string, nextTrack: string, instant = false) {
  label = nextLabel;
  track = nextTrack;
  gsap.killTweensOf(state);
  if (instant || prefersReducedMotion()) {
    state.t = to;
    render();
    return;
  }
  render();
  // Outside the page's gsap.context: the glide must not be reverted when the page is torn down
  setTimeout(() => gsap.to(state, { t: to, duration: 1.1, ease: ease.inOut, onUpdate: render }), 0);
}

// Viewer on the home page: one stop is "on" at a time; switching drops a frame, then prints the log
function showStop(viewer: HTMLElement, id: string) {
  if (viewer.dataset.on === id) return;
  viewer.dataset.on = id;
  const reduce = prefersReducedMotion();
  viewer.querySelectorAll<HTMLElement>('[data-for]').forEach((el) => {
    el.hidden = el.dataset.for !== id;
  });
  if (reduce) return;
  viewer.classList.add('is-drop');
  gsap.delayedCall(0.09, () => viewer.classList.remove('is-drop'));
  const lines = viewer.querySelectorAll(`[data-for="${id}"] [data-log-line]`);
  gsap.fromTo(lines, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.5, ease: 'none', stagger: 0.12, delay: 0.1 });
}

export function startReplay() {
  onPage(() => {
    const main = document.getElementById('main');
    const replay = document.querySelector<HTMLElement>('[data-replay]');

    if (!replay) {
      // Any other page: seek to the page's own position
      const at = Number(main?.dataset.at ?? LIVE);
      seek(at, main?.dataset.label ?? 'LIVE', main?.dataset.track ?? '');
      return;
    }

    // Home: the hero is the live head; the replay section rewinds stop by stop
    const viewer = replay.querySelector<HTMLElement>('[data-viewer]')!;
    const stops = [...replay.querySelectorAll<HTMLElement>('[data-stop]')];
    seek(LIVE, 'LIVE', 'pek');

    stops.forEach((el, i) => {
      const from = i === 0 ? LIVE : Number(stops[i - 1].dataset.at);
      const to = Number(el.dataset.at);
      const meta = { label: el.dataset.label ?? '', track: el.dataset.track ?? '' };
      // Glide between the previous stop and this one while it scrolls in
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        end: 'top 35%',
        onUpdate: (self) => {
          gsap.killTweensOf(state);
          state.t = from + (to - from) * self.progress;
          render();
        },
      });
      // Which stop plays: the one crossing the middle of the screen
      ScrollTrigger.create({
        trigger: el,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (self) => {
          if (!self.isActive) return;
          label = meta.label;
          track = meta.track;
          showStop(viewer, el.dataset.stop!);
          render();
        },
      });
    });

    // Back above the replay: live again
    ScrollTrigger.create({
      trigger: replay,
      start: 'top 55%',
      onLeaveBack: () => {
        label = 'LIVE';
        track = 'pek';
        state.t = LIVE;
        render();
      },
    });

    // Past the last stop: the recording ends and the playhead returns to live
    const after = document.getElementById('all');
    if (after) {
      ScrollTrigger.create({
        trigger: after,
        start: 'top 70%',
        onEnter: () => seek(LIVE, 'LIVE', 'pek'),
        onLeaveBack: () => {
          const last = stops[stops.length - 1];
          seek(Number(last.dataset.at), last.dataset.label ?? '', last.dataset.track ?? '');
        },
      });
    }

    showStop(viewer, stops[0]?.dataset.stop ?? '');
  });
}

// ---------- "Watch the replay": the recording plays itself ----------
// Scrolls to the replay, then glides stop by stop (a hold on each, a seek between) down to 2020.
// Any wheel, touch, key or pointer input hands control back to the visitor.
const HOLD = 2.4; // seconds on each stop
const SEEK = 1.1; // seconds between stops

let playing = false;
let timer: ReturnType<typeof setTimeout> | null = null;

function stopPlayback() {
  if (!playing) return;
  playing = false;
  if (timer) clearTimeout(timer);
  timer = null;
  haltScroll();
  document.documentElement.classList.remove('is-playing');
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => removeEventListener(t, stopPlayback, true));
}

export function playReplay() {
  const replay = document.getElementById('replay');
  const stops = [...document.querySelectorAll<HTMLElement>('[data-stop]')];
  if (!replay || !stops.length) return;
  if (prefersReducedMotion()) {
    scrollToTarget(replay);
    return;
  }
  stopPlayback();
  playing = true;
  document.documentElement.classList.add('is-playing');
  // Listen after this click has finished, so the click itself does not stop playback
  setTimeout(() => ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => addEventListener(t, stopPlayback, { capture: true, passive: true })), 0);

  // Each stop is shown with its title just under the middle of the screen
  const place = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY - innerHeight * 0.3;
  const next = (i: number) => {
    if (!playing) return;
    if (i >= stops.length) {
      const end = document.getElementById('all');
      if (end) scrollToTarget(end, { duration: SEEK, easing: (t) => t * t * (3 - 2 * t), onComplete: stopPlayback });
      else stopPlayback();
      return;
    }
    scrollToTarget(place(stops[i]), {
      duration: i === 0 ? 1.4 : SEEK,
      easing: (t) => t * t * (3 - 2 * t),
      onComplete: () => {
        if (playing) timer = setTimeout(() => next(i + 1), HOLD * 1000);
      },
    });
  };
  next(0);
}

export function startPlayButton() {
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-play-replay]');
      if (!a) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      playReplay();
    },
    true,
  );
  // Leaving the page ends playback
  document.addEventListener('astro:before-preparation', stopPlayback);
}

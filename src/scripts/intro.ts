// The intro controller. Q7, a wheeled survey robot made of points, rolls in with a clipboard and
// asks four questions. ONE clock (this rAF loop) drives the robot's pose, the typed subtitles, the
// voice and the camera. The conversation itself is a plain async script: say, choose, react.
// It ends on the home page's first frame (the orchard, same points, same camera) and hands over.
import { createCloud, deviceCloudOpts, type Camera } from '../lib/cloud-gl';
import * as S from '../lib/shapes';
import { rig, restPose, robotGlow, type Pose } from '../lib/robot-rig';
import * as snd from '../lib/intro-sound';
import { questions, lines } from '../data/intro';
import { chapters } from '../data/chapters';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const bump = (t: number) => (t <= 0 || t >= 1 ? 0 : Math.sin(t * Math.PI));
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, reduce.matches ? Math.min(ms, 400) : ms));

const ROBOT_CAM: Camera = { target: [0, 0.5, 0], dist: 4.4, theta: 0, phi: 0.1 };
// it stands three-quarter on, so the wheels read as wheels; the head turns back to you
const STANCE = -0.5;
// the home page's opening view, framed exactly as scripts/cloud.ts frames it
const HOME = chapters[0];
const ENTER = 2.6; // seconds to roll in
const WELCOME = 4.8; // let visitors read the engineer's introduction before Q7 arrives
const CHAR = 0.032; // seconds per typed character

type Gesture = 'tick' | 'nod' | 'tilt' | 'boing' | 'wave' | 'hop' | 'shake';
const GESTURE_LEN: Record<Gesture, number> = { tick: 0.7, nod: 0.6, tilt: 1.2, boing: 0.9, wave: 1.8, hop: 0.6, shake: 0.8 };

export function initIntro(root: HTMLElement) {
  const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const canvas = $<HTMLCanvasElement>('[data-intro-canvas]');
  const lineEl = $('[data-line]');
  const whoEl = $('[data-who]');
  const optsEl = $('[data-opts]');
  const soundBtn = $<HTMLButtonElement>('[data-sound]');
  const welcomeEl = $('[data-welcome]');

  let cloud: ReturnType<typeof createCloud> = null;
  try {
    cloud = createCloud(canvas, deviceCloudOpts());
  } catch {
    cloud = null;
  }
  const bot = S.robot();
  let orchard: S.Shape | null = null;
  cloud?.setPair(bot, bot);

  // ---------- sound toggle ----------
  const showSound = () => {
    soundBtn.setAttribute('aria-pressed', String(!snd.isMuted()));
  };
  showSound();
  soundBtn.addEventListener('click', () => {
    snd.unlock();
    snd.setMuted(!snd.isMuted());
    showSound();
  });
  // any tap, click or key is the gesture browsers want before audio; iOS ignores pointerdown,
  // so listen to the events it accepts and keep trying until the audio is really running
  const gestures_ = ['touchend', 'click', 'keydown'] as const;
  const tryUnlock = () => {
    snd.unlock();
    if (snd.unlocked()) gestures_.forEach((ev) => removeEventListener(ev, tryUnlock, true));
  };
  gestures_.forEach((ev) => addEventListener(ev, tryUnlock, true));

  // ---------- the robot's state, advanced by the clock ----------
  const pose: Pose = restPose();
  const startX = innerWidth / innerHeight < 0.8 ? 2.6 : 4.5;
  let clock = 0;
  const enterAt = WELCOME;
  let arrived: (() => void) | null = null;
  const arrival = new Promise<void>((resolve) => { arrived = resolve; });
  let look: 'visitor' | 'clipboard' = 'visitor';
  const gestures: { g: Gesture; t0: number }[] = [];
  const gesture = (g: Gesture) => { if (!reduce.matches) gestures.push({ g, t0: clock }); };
  let talk = 0;
  let nextBlink = 2;
  let antV = 0;
  let prevX = startX;
  let leaving: null | { t0: number; done: () => void } = null;

  // ---------- subtitles: typed by the clock, voiced per letter ----------
  const typing = { text: '', shown: 0, acc: 0, done: null as null | (() => void) };
  const say = (text: string, who = 'Q7') =>
    new Promise<void>((resolve) => {
      whoEl.textContent = who;
      lineEl.textContent = '';
      lineEl.setAttribute('aria-label', text);
      Object.assign(typing, { text, shown: 0, acc: 0, done: resolve });
      if (reduce.matches) {
        typing.shown = text.length;
        lineEl.textContent = text;
        snd.ding();
        typing.done = null;
        resolve();
      }
    });

  const choose = (labels: string[]) =>
    new Promise<number>((resolve) => {
      optsEl.replaceChildren(
        ...labels.map((label, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'intro__opt';
          b.textContent = label;
          b.style.setProperty('--i', String(i));
          b.addEventListener('click', () => {
            snd.unlock();
            optsEl.querySelectorAll('button').forEach((x) => {
              x.disabled = true;
              x.classList.toggle('is-picked', x === b);
            });
            resolve(i);
          });
          return b;
        }),
      );
      root.dataset.phase = 'ask';
      // keyboard visitors land on the first answer, without the page jumping
      if (document.activeElement === document.body || optsEl.contains(document.activeElement) || document.activeElement === null) {
        (optsEl.firstElementChild as HTMLElement | null)?.focus({ preventScroll: true });
      }
    });

  const clearOpts = () => {
    optsEl.replaceChildren();
    root.dataset.phase = 'talk';
  };

  // ---------- handing over to the home page ----------
  let ended = false;
  /** Give the page back. `seamless`: our last frame is the home page's first, so swap in the same frame */
  const finish = (seamless: boolean) => {
    if (ended) return;
    ended = true;
    arrived?.();
    arrived = null;
    const html = document.documentElement;
    const close = () => {
      running = false;
      root.remove();
      cloud?.gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    addEventListener('cloud:live', () => {
      if (seamless) close();
      else {
        root.classList.add('is-gone');
        setTimeout(close, 700);
      }
    }, { once: true });
    delete html.dataset.intro;
    document.querySelectorAll('[data-intro-inert]').forEach((el) => el.removeAttribute('inert'));
    dispatchEvent(new CustomEvent('intro:handoff', { detail: { x: pointer.x, y: pointer.y } }));
    // no WebGL on the home page either: nothing will announce itself, just go
    if (html.classList.contains('no-gl')) close();
  };
  $('[data-skip]').addEventListener('click', () => finish(false));

  const leave = () =>
    new Promise<void>((done) => {
      root.dataset.phase = 'leave';
      if (!cloud || reduce.matches) return done();
      orchard ??= S.orchard();
      cloud.setPair(bot, orchard);
      leaving = { t0: clock, done };
      snd.whir(2);
    }).then(() => finish(!!cloud && !reduce.matches));

  // ---------- the conversation ----------
  async function script() {
    await arrival;
    if (ended) return;
    gesture('hop');
    await say(pick(lines.hello));
    const go = await choose([lines.yes, lines.no]);
    clearOpts();
    if (go === 1) {
      gesture('shake');
      await say(pick(lines.declined));
      await sleep(1400);
      gesture('wave');
      await sleep(GESTURE_LEN.wave * 1000);
      return leave();
    }
    gesture('nod');
    await say(pick(lines.accepted));
    await sleep(500);

    const tags: string[] = [];
    for (let k = 0; k < questions.length; k++) {
      const q = questions[k];
      look = 'clipboard';
      await sleep(900);
      look = 'visitor';
      await sleep(250);
      await say(q.q, `Q7 · ${k + 1} of ${questions.length}`);
      const i = await choose(q.options.map((o) => o.label));
      const o = q.options[i];
      tags.push(o.tag);
      // tick the box first, then react, then talk
      look = 'clipboard';
      gesture('tick');
      setTimeout(() => snd.tick(), reduce.matches ? 0 : 220);
      await sleep(750);
      look = 'visitor';
      clearOpts();
      gesture(pick<Gesture>(['nod', 'tilt', 'boing', 'hop']));
      await say(pick(o.replies), `Q7 · ${k + 1} of ${questions.length}`);
      await sleep(1100 + o.label.length * 10);
    }

    look = 'clipboard';
    await sleep(700);
    look = 'visitor';
    await say(`${lines.profile} ${tags.join(', ')}.`);
    await sleep(1600);
    gesture('wave');
    await say(pick(lines.bye));
    await sleep(900);
    return leave();
  }

  // ---------- pointer: the robot looks at you ----------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return; // as on the home page, so the hand-over matches
    pointer.tx = e.clientX / innerWidth - 0.5;
    pointer.ty = e.clientY / innerHeight - 0.5;
  }, { passive: true });
  addEventListener('resize', () => cloud?.resize());

  // ---------- the clock ----------
  let last = performance.now();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    if (ended) return;
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;
    const still = reduce.matches ? 0 : 1;
    const entry = clock < enterAt ? 0 : reduce.matches || !cloud ? 1 : Math.min(1, (clock - enterAt) / ENTER);
    const push = inOut(Math.max(0, Math.min(1, (entry - 0.5) / 0.45)));
    // The same clock moves the words and the robot, so Q7 visibly shoves the intro aside.
    if (arrived) {
      if (clock >= enterAt) root.dataset.phase = 'enter';
      if (!reduce.matches && cloud) {
        welcomeEl.style.transform = `translate3d(${-push * innerWidth * 1.1}px, ${push * 18}px, 0) rotate(${-push * 5}deg)`;
        welcomeEl.style.opacity = String(1 - Math.max(0, (push - 0.75) / 0.25));
      }
      if (entry >= 1) {
        welcomeEl.hidden = true;
        root.dataset.phase = 'talk';
        arrived();
        arrived = null;
      }
    }

    // typing, one key per character, a voice blip on every other letter
    if (typing.shown < typing.text.length) {
      typing.acc += dt;
      while (typing.acc >= CHAR && typing.shown < typing.text.length) {
        typing.acc -= CHAR;
        const ch = typing.text[typing.shown++];
        if (ch === ' ') snd.key(true);
        else {
          snd.key();
          if (/[a-z0-9]/i.test(ch) && typing.shown % 2 === 0) snd.voice(ch);
          talk = /[aeiou]/i.test(ch) ? 1 : 0.65;
        }
      }
      lineEl.textContent = typing.text.slice(0, typing.shown);
      if (typing.shown === typing.text.length) {
        snd.ding();
        const d = typing.done;
        typing.done = null;
        d?.();
      }
    }
    talk = Math.max(0.12, talk - dt * 6);

    if (cloud && clock >= enterAt) {
      const p = restPose();
      // roll in from the side, turning to face the camera at the end
      const e = reduce.matches ? 1 : entry;
      p.x = lerp(startX, 0, inOut(e));
      p.yaw = lerp(-Math.PI / 2, STANCE, inOut(Math.max(0, (e - 0.62) / 0.38)));
      pose.spin += (prevX - p.x) / S.RIG.wheelRadius;
      const speed = (prevX - p.x) / Math.max(dt, 1e-3);
      prevX = p.x;
      p.spin = pose.spin;
      p.lean = -speed * 0.02;
      p.bob = still * Math.sin(clock * 1.7) * 0.006 + Math.abs(Math.sin(pose.spin * 3)) * Math.min(1, speed) * 0.008;

      pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
      pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
      const k = Math.min(1, dt * 6);
      const face = -p.yaw * 0.85; // head turned back toward the camera
      const wantYaw = look === 'clipboard' ? -0.2 : face + still * pointer.x * 0.6;
      const wantPitch = look === 'clipboard' ? 0.42 : still * pointer.y * 0.45;
      pose.headYaw += (wantYaw - pose.headYaw) * k;
      pose.headPitch += (wantPitch - pose.headPitch) * k;
      pose.armL += ((look === 'clipboard' ? 0.18 : 0) - pose.armL) * k;
      p.headYaw = pose.headYaw;
      p.headPitch = pose.headPitch;
      p.armL = pose.armL;
      const shove = still * Math.sin(push * Math.PI);
      p.armRz += shove * 1.1;
      p.armRx += shove * 0.8;
      p.headYaw *= 1 - shove;

      // blink every few seconds
      if (clock > nextBlink + 0.14) nextBlink = clock + 2.4 + Math.random() * 3;
      p.blink = clock >= nextBlink ? 0.1 : 1;
      p.talk = talk;

      // one-shot gestures layered on top
      for (let i = gestures.length - 1; i >= 0; i--) {
        const { g, t0 } = gestures[i];
        const t = (clock - t0) / GESTURE_LEN[g];
        if (t >= 1) { gestures.splice(i, 1); continue; }
        if (g === 'tick') { p.armRx += bump(t) * 0.35 + Math.sin(t * Math.PI * 4) * bump(t) * 0.12; p.armRz += bump(t) * 0.12; }
        if (g === 'nod') p.headPitch += Math.sin(t * Math.PI * 2) * bump(t) * 0.3;
        if (g === 'shake') p.headYaw += Math.sin(t * Math.PI * 4) * bump(t) * 0.4;
        if (g === 'tilt') p.headRoll += bump(t) * 0.32;
        if (g === 'boing') { antV += t < 0.1 ? 30 * dt : 0; p.headRoll += Math.sin(t * Math.PI * 3) * bump(t) * 0.08; }
        if (g === 'hop') { p.bob += bump(t) * 0.06; antV += t < 0.15 ? 20 * dt : 0; }
        if (g === 'wave') { p.armRz += ease(Math.min(1, t * 3)) * (1 - ease(Math.max(0, t * 3 - 2))) * 2.3; p.armRx += Math.sin(t * Math.PI * 6) * bump(t) * 0.35; }
      }

      // the antenna is a spring: it trails every move
      antV += (-pose.antenna * 90 - antV * 6 + speed * 0.4 * (1 - e)) * dt;
      pose.antenna += antV * dt;
      p.antenna = pose.antenna;

      // leaving: the robot dissolves into the orchard while the camera moves to the home page's view
      let morph = 0;
      if (leaving) {
        const t = Math.min(1, (clock - leaving.t0) / 2.2);
        morph = ease(t);
        if (t >= 1) { const d = leaving.done; leaving = null; d(); }
      }
      const portrait = innerWidth / innerHeight < 0.8;
      // the robot's view: portrait screens step back a little and lift it above the subtitles
      const rv: Camera = {
        target: portrait ? [ROBOT_CAM.target[0], ROBOT_CAM.target[1] - 0.2, ROBOT_CAM.target[2]] : ROBOT_CAM.target,
        dist: ROBOT_CAM.dist * (portrait ? 0.9 : 1),
        theta: ROBOT_CAM.theta + still * Math.sin(clock * 0.2) * 0.05,
        phi: ROBOT_CAM.phi,
      };
      // the home view, the same formula as the home loop's first frame
      const hc = HOME.cam;
      const drift = still * Math.sin((now / 1000) * 0.12) * 0.07;
      const hd = hc.dist * (portrait ? HOME.portrait : 1);
      const hv: Camera = {
        target: portrait ? [hc.target[0], hc.target[1] - hd * 0.16, hc.target[2]] : hc.target,
        dist: hd,
        theta: hc.theta + still * (pointer.x * 0.55 + drift),
        phi: hc.phi + still * pointer.y * -0.22,
      };
      const cam: Camera = {
        target: rv.target.map((v, j) => lerp(v, hv.target[j], morph)) as Camera['target'],
        dist: lerp(rv.dist, hv.dist, morph),
        theta: lerp(rv.theta, hv.theta, morph),
        phi: lerp(rv.phi, hv.phi, morph),
      };
      cloud.render({ morph, rgb: 0, time: now / 1000, idle: still, cam, parts: rig(p), glow: robotGlow });
    }
    requestAnimationFrame(frame);
  }

  root.dataset.phase = 'welcome';
  requestAnimationFrame((t) => { last = t; frame(t); });
  script();
}

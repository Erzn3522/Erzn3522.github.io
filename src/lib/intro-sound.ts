// The robot's voice and the typewriter, synthesised with Web Audio: no files to download.
// Browsers only allow sound after a gesture, so nothing plays until unlock() runs from a click.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let muted = false;

try {
  muted = localStorage.getItem('intro-sound') === 'off';
} catch {
  /* storage blocked: sound stays on */
}

export const isMuted = () => muted;

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem('intro-sound', m ? 'off' : 'on');
  } catch {
    /* fine */
  }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.02);
}

/** Call from a tap, click or key handler. iOS only lets audio start inside touchend/click, and only
 *  once something has actually played there, so this also plays one silent sample. Safe to call often. */
export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    // iOS plays Web Audio as "ambient" by default, which the silent switch mutes; the visitor asked
    // for sound by tapping, so play it like media
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state !== 'running') {
    ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    src.connect(ctx.destination);
    src.start(0);
  }
}

export const unlocked = () => !!ctx && ctx.state === 'running';

const ready = () => !!ctx && !!master && !muted && ctx.state === 'running';

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function burst(t: number, freq: number, q: number, peak: number, dur: number, type: BiquadFilterType = 'bandpass') {
  const src = ctx!.createBufferSource();
  src.buffer = noise;
  const f = ctx!.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx!.createGain();
  env(g, t, peak, 0.002, dur);
  src.connect(f).connect(g).connect(master!);
  src.start(t, Math.random() * 0.4, dur + 0.02);
}

/** One typewriter key: a sharp click and a low body thunk */
export function key(soft = false) {
  if (!ready()) return;
  const t = ctx!.currentTime;
  burst(t, 3200 + Math.random() * 1400, 1.2, soft ? 0.05 : 0.11, 0.025, 'highpass');
  const o = ctx!.createOscillator();
  o.frequency.value = 150 + Math.random() * 40;
  const g = ctx!.createGain();
  env(g, t, soft ? 0.04 : 0.08, 0.001, 0.03);
  o.connect(g).connect(master!);
  o.start(t);
  o.stop(t + 0.05);
}

/** One syllable of robot voice: a square wave with a quick pitch drop, ring-modulated for the metal */
export function voice(ch: string) {
  if (!ready()) return;
  const t = ctx!.currentTime;
  const code = ch.toLowerCase().charCodeAt(0);
  const base = 190 + ((code * 37) % 11) * 22 + (/[aeiou]/i.test(ch) ? 40 : 0);
  const o = ctx!.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(base * 1.15, t);
  o.frequency.exponentialRampToValueAtTime(base, t + 0.05);
  const ring = ctx!.createOscillator();
  ring.frequency.value = 55;
  const rg = ctx!.createGain();
  rg.gain.value = 0;
  ring.connect(rg.gain);
  const f = ctx!.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 1100;
  f.Q.value = 1.4;
  const g = ctx!.createGain();
  env(g, t, 0.16, 0.004, 0.07);
  o.connect(rg).connect(f).connect(g).connect(master!);
  o.start(t);
  ring.start(t);
  o.stop(t + 0.1);
  ring.stop(t + 0.1);
}

/** The carriage bell at the end of a line */
export function ding() {
  if (!ready()) return;
  const t = ctx!.currentTime;
  for (const [fr, pk] of [[1760, 0.05], [2637, 0.025]] as const) {
    const o = ctx!.createOscillator();
    o.type = 'sine';
    o.frequency.value = fr;
    const g = ctx!.createGain();
    env(g, t, pk, 0.003, 0.9);
    o.connect(g).connect(master!);
    o.start(t);
    o.stop(t + 1);
  }
}

/** A pen ticking a box: two quick scratches */
export function tick() {
  if (!ready()) return;
  const t = ctx!.currentTime;
  burst(t, 2600, 3, 0.09, 0.05);
  burst(t + 0.08, 3400, 3, 0.12, 0.09);
}

/** Wheel motor: a low saw that rises and falls over `dur` seconds */
export function whir(dur: number) {
  if (!ready()) return;
  const t = ctx!.currentTime;
  const o = ctx!.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(60, t);
  o.frequency.linearRampToValueAtTime(130, t + dur * 0.5);
  o.frequency.linearRampToValueAtTime(70, t + dur);
  const f = ctx!.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 420;
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.05);
}

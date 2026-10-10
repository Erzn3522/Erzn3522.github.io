// Backprop figure: every value redraws on input. The only motion is the
// gradient step the visitor asks for, and reduced motion makes it a jump.

import { pass, step, fmt, cx, cy, curvePath, tangentPath, type Pass } from '../lib/backprop';

export function initBackprop(root: HTMLElement) {
  const slider = root.querySelector<HTMLInputElement>('[data-w]');
  const labels = root.querySelectorAll<HTMLInputElement>('[data-y]');
  const button = root.querySelector<HTMLButtonElement>('[data-step]');
  const out = root.querySelector<HTMLElement>('[data-step-out]');
  const controls = root.querySelector<HTMLElement>('[data-controls]');
  const curve = root.querySelector<SVGPathElement>('[data-curve]');
  const tangent = root.querySelector<SVGPathElement>('[data-tangent]');
  const point = root.querySelector<SVGCircleElement>('[data-point]');
  const fields = root.querySelectorAll<Element>('[data-v]');
  if (!slider || !button || !out || !controls || !curve || !tangent || !point) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let w = Number(slider.value);
  let y: 0 | 1 = 1;
  let raf = 0;

  function render() {
    const p: Pass = pass(w, y);
    fields.forEach((el) => {
      const key = el.getAttribute('data-v') as keyof Pass;
      const d = Number(el.getAttribute('data-d') ?? 2);
      el.textContent = key === 'y' ? String(p.y) : fmt(p[key] as number, d);
    });
    tangent!.setAttribute('d', tangentPath(w, y));
    point!.setAttribute('cx', cx(w).toFixed(1));
    point!.setAttribute('cy', cy(p.L).toFixed(1));
    slider!.value = String(w);
    slider!.setAttribute('aria-valuetext', `w = ${fmt(w)}, loss ${fmt(p.L, 3)}`);
  }

  slider.addEventListener('input', () => {
    cancelAnimationFrame(raf);
    w = Number(slider.value);
    render();
  });

  labels.forEach((r) =>
    r.addEventListener('change', () => {
      y = r.value === '1' ? 1 : 0;
      curve.setAttribute('d', curvePath(y));
      render();
    }),
  );

  button.addEventListener('click', () => {
    cancelAnimationFrame(raf);
    const from = w;
    const to = step(w, y);
    const before = pass(from, y).L;
    const after = pass(to, y).L;
    out.textContent = `Loss ${fmt(before, 3)} → ${fmt(after, 3)} (gradient ${fmt(pass(from, y).dL_dw, 3)}).`;
    if (reduce.matches || document.hidden) {
      w = to;
      render();
      return;
    }
    const t0 = performance.now();
    const dur = 320;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      w = from + (to - from) * (1 - (1 - k) ** 3);
      render();
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  });

  controls.hidden = false;
  render();
}

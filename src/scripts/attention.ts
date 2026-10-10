// Attention figure: choose a token, switch BERT/GPT masking and √d scaling.
// Everything redraws instantly on input; nothing moves on its own.

import { TOKENS, DEFAULT_TOKEN, MAT, attend, arcPath } from '../lib/attention';

export function initAttention(root: HTMLElement) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-token]')];
  const arcs = [...root.querySelectorAll<SVGPathElement>('[data-arc]')];
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  const rowmark = root.querySelector<SVGRectElement>('[data-rowmark]');
  const controls = root.querySelector<HTMLElement>('[data-controls]');
  const modes = root.querySelectorAll<HTMLInputElement>('[data-mode]');
  const scaledBox = root.querySelector<HTMLInputElement>('[data-scaled]');
  const explain = root.querySelector<HTMLElement>('[data-explain]');
  if (!buttons.length || !readout || !rowmark || !controls || !scaledBox || !explain) return;

  let sel = DEFAULT_TOKEN;
  let causal = false;
  let scaled = true;

  function render() {
    const A = attend({ causal, scaled });
    const row = A[sel];

    arcs.forEach((path, j) => {
      const v = row[j];
      path.setAttribute('d', arcPath(sel, j));
      path.setAttribute('stroke-width', (1 + 10 * v).toFixed(2));
      path.setAttribute('stroke-opacity', v < 0.005 ? '0' : (0.25 + 0.75 * v).toFixed(2));
    });

    A.forEach((r, i) =>
      r.forEach((v, j) => {
        const masked = causal && j > i;
        const cell = root.querySelector<SVGRectElement>(`[data-cell="${i}-${j}"]`);
        const text = root.querySelector<SVGTextElement>(`[data-cell-t="${i}-${j}"]`);
        if (cell) {
          cell.classList.toggle('m-masked', masked);
          cell.setAttribute('fill-opacity', masked ? '0' : String(Math.max(0.05, v)));
        }
        if (text) {
          text.textContent = masked ? '–' : v.toFixed(2);
          text.classList.toggle('m-val-on', !masked && v > 0.45);
        }
      }),
    );
    rowmark!.setAttribute('y', String(MAT.top + sel * MAT.cell - 1));

    buttons.forEach((b, i) => {
      b.setAttribute('aria-pressed', i === sel ? 'true' : 'false');
      b.tabIndex = i === sel ? 0 : -1;
    });

    const j = row.indexOf(Math.max(...row));
    const hidden = causal && sel < TOKENS.length - 1 ? ` It cannot see the ${TOKENS.length - 1 - sel} later token${TOKENS.length - 1 - sel > 1 ? 's' : ''}.` : '';
    readout!.textContent = `“${TOKENS[sel]}” attends most to “${TOKENS[j]}” (${row[j].toFixed(2)}).${hidden}`;
    explain!.textContent = scaled
      ? 'With the scaling, weights stay spread out. Turn it off to see the softmax collapse onto one token.'
      : 'Without the scaling, large dot products push the softmax towards one token, and its gradients towards zero.';
  }

  const choose = (i: number, focus = false) => {
    sel = (i + TOKENS.length) % TOKENS.length;
    render();
    if (focus) buttons[sel].focus();
  };

  buttons.forEach((b, i) => {
    b.addEventListener('click', () => choose(i));
    b.addEventListener('focus', () => choose(i));
    b.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') choose(i);
    });
    b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        choose(sel + 1, true);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        choose(sel - 1, true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        choose(0, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        choose(TOKENS.length - 1, true);
      }
    });
  });

  modes.forEach((m) =>
    m.addEventListener('change', () => {
      causal = m.value === 'gpt';
      render();
    }),
  );
  scaledBox.addEventListener('change', () => {
    scaled = scaledBox.checked;
    render();
  });

  controls.hidden = false;
  render();
}

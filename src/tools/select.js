import { MAXL, G, H } from '../core/constants.js';
import { canvas } from '../core/stage.js';
import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { levelGrid } from '../world/board.js';
import { hideGhost } from '../input/ghost.js';
import { TOOLS } from './registry.js';
import { ITEMS } from '../scenery/index.js';

// Choosing a tool and a build level, and keeping the buttons and the hint in step.

export function setHint() {
  const t = TOOLS[state.tool];
  const camHelp = state.coarse ? ' Two fingers move and zoom the board.' : ' Right-drag to orbit, scroll to zoom, W A S D to move.';
  $('hint').textContent = (t ? t.hint() : '') + (state.tool === 'look' ? '' : camHelp);
  const ramp = state.tool === 'rampup' || state.tool === 'rampdown';
  const size = state.tool === 'scenery' && ITEMS[state.sceneryType].size;
  $('btn-rot').hidden = !(ramp || (size && size[0] * size[1] > 1));
  $('btn-rot').textContent = ramp ? 'Turn ramp' : 'Turn building';
}

export function setTool(t) {
  if (t === 'rampup' && state.level >= MAXL) t = 'track';
  if (t === 'rampdown' && state.level <= 0) t = 'track';
  state.tool = t;
  document.querySelectorAll('.tool').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === t)));
  document.querySelectorAll('.card').forEach(b => {
    const on = (t === 'train' && b.dataset.train === state.trainType) || (t === 'scenery' && b.dataset.scenery === state.sceneryType);
    b.setAttribute('aria-pressed', String(on));
  });
  canvas.classList.toggle('look', t === 'look');
  hideGhost();
  setHint();
}

export function setLevel(l) {
  state.level = Math.max(0, Math.min(MAXL, l));
  document.querySelectorAll('.lvl').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.level === state.level)));
  document.querySelector('[data-tool="rampup"]').disabled = state.level >= MAXL;
  document.querySelector('[data-tool="rampdown"]').disabled = state.level <= 0;
  levelGrid.visible = state.level > 0;
  levelGrid.position.set(G / 2, state.level * H + 0.004, G / 2);
  setTool(state.tool);
}

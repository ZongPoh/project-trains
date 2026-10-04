import { DX, DZ, H, DIR_NAMES, opp, levelName } from '../core/constants.js';
import { state } from '../core/state.js';
import { toast } from '../core/dom.js';
import { findAtPort } from '../tracks/model.js';
import { canRamp, placeRamp } from '../tracks/edit.js';
import { cellAt } from '../input/picking.js';
import { showSlope, hideGhost, AMBER, RED } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';
import { emit } from '../core/events.js';
import { setTool, setLevel } from './select.js';
import { hover } from './strokes.js';

// Ramp tools: one click builds a two-square ramp up (or down) one level, then hands back
// the Track tool on the new level so the line can carry on.

// Where the ramp would be built from this pointer position, and whether it fits.
function plan(x, y) {
  const c = cellAt(x, y, state.level);
  if (!c) return null;
  const down = state.tool === 'rampdown';
  let dir = state.rotDir;
  if (state.manualCell !== c.x + ',' + c.z) {              // point away from the track end that leads into this square
    const cand = [0, 1, 2, 3].filter(d => findAtPort(c.x - DX[d], c.z - DZ[d], d, state.level));
    if (cand.length && !cand.includes(dir)) dir = cand[0];
  }
  const r = down
    ? { x: c.x + DX[dir], z: c.z + DZ[dir], l: state.level - 1, dir: opp(dir) }
    : { x: c.x, z: c.z, l: state.level, dir };
  return { c, dir, down, r, ok: canRamp(r) };
}

function showPlan(x, y) {
  const g = plan(x, y);
  if (!g) { hideGhost(); return; }
  const dx = DX[g.dir], dz = DZ[g.dir], lx = -dz, lz = dx, sx = g.c.x + 0.5 - 0.5 * dx, sz = g.c.z + 0.5 - 0.5 * dz;
  const y0 = state.level * H + 0.075, y1 = (state.level + (g.down ? -1 : 1)) * H + 0.075;
  showSlope([
    [sx + lx * 0.48, y0, sz + lz * 0.48], [sx - lx * 0.48, y0, sz - lz * 0.48],
    [sx + dx * 2 + lx * 0.48, y1, sz + dz * 2 + lz * 0.48], [sx + dx * 2 - lx * 0.48, y1, sz + dz * 2 - lz * 0.48],
  ], g.ok ? AMBER : RED);
}

function build(x, y) {
  const g = plan(x, y);
  if (!g) return;
  if (!g.ok) { toast('No room for a ramp there. Ramps need two free squares in a row.'); return; }
  beginEdit();
  placeRamp(g.r, true);
  const nl = state.level + (g.down ? -1 : 1);
  setLevel(nl); setTool('track'); changed(); emit('build');
  toast('Ramp built. Keep laying track on ' + levelName(nl) + '.');
}

// Turn the ramp a quarter turn (R key or the Turn ramp button).
export function turnRamp() {
  state.rotDir = (state.rotDir + 1) & 3;
  if (state.lastHover) {
    const c = cellAt(state.lastHover.x, state.lastHover.y, state.level);
    state.manualCell = c ? c.x + ',' + c.z : '';
    if (!state.coarse) hover(state.lastHover.x, state.lastHover.y);
  } else state.manualCell = '';
  if (state.coarse) toast('Ramp now points ' + DIR_NAMES[state.rotDir] + ' on empty ground.');
}

const turnHelp = () => state.coarse ? '' : ' Press R to turn it.';

export const rampUp = {
  id: 'rampup',
  hint: () => 'Click a square to build a ramp from ' + levelName(state.level) + ' up to level ' + (state.level + 1) + '.' + turnHelp(),
  hover: showPlan,
  start: build,
};

export const rampDown = {
  id: 'rampdown',
  hint: () => 'Click a square to build a ramp from level ' + state.level + ' down to ' + levelName(state.level - 1) + '.' + turnHelp(),
  hover: showPlan,
  start: build,
};

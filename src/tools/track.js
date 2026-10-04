import { key, opp, dirBetween, levelName } from '../core/constants.js';
import { state } from '../core/state.js';
import { occ } from '../tracks/model.js';
import { canPort, addPort, connect } from '../tracks/edit.js';
import { cellAt } from '../input/picking.js';
import { showSquare, hideGhost, AMBER } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';
import { emit } from '../core/events.js';

// Track tool: drag across squares to lay rail. Straights, curves, junctions and crossings
// form by themselves from the path that is dragged.
let lastCell = null;

export const track = {
  id: 'track',
  hint: () => 'Drag across the board to lay track on ' + levelName(state.level) + '. Cross a line to make a junction.',

  hover(x, y) {
    const c = cellAt(x, y, state.level);
    if (c) showSquare(c.x, c.z, state.level, AMBER); else hideGhost();
  },

  start(x, y) {
    const c = cellAt(x, y, state.level);
    lastCell = c;
    if (!c) return;
    if (!occ.has(key(c.x, c.z, state.level))) { beginEdit(); addPort(c.x, c.z, -1, state.level); changed(); emit('build'); }
  },

  move(x, y) {
    const c = cellAt(x, y, state.level);
    if (!c) return;
    if (!lastCell) { lastCell = c; return; }
    let cx = lastCell.x, cz = lastCell.z, any = false, guard = 0;
    while ((cx !== c.x || cz !== c.z) && guard++ < 64) {          // walk square by square to the pointer
      const ddx = c.x - cx, ddz = c.z - cz;
      let nx = cx, nz = cz;
      if (Math.abs(ddx) >= Math.abs(ddz)) nx += Math.sign(ddx); else nz += Math.sign(ddz);
      const d = dirBetween(cx, cz, nx, nz);
      if (canPort(cx, cz, d, state.level) && canPort(nx, nz, opp(d), state.level)) {
        beginEdit(); connect(cx, cz, nx, nz, state.level); any = true; emit('build');
      }
      cx = nx; cz = nz;
    }
    lastCell = c;
    if (any) changed();
  },

  end() { lastCell = null; },
};

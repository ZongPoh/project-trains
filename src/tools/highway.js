import { toast } from '../core/dom.js';
import { emit } from '../core/events.js';
import { hwLevel, setHighway, highwayRefusal } from '../terrain/highway.js';
import { state } from '../core/state.js';
import { removeUnder } from '../scenery/placed.js';
import { removeSceneryAt } from '../scenery/placed.js';
import { cellAt } from '../input/picking.js';
import { showSquare, hideGhost, GREEN, RED } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';

// Highway tool: paint a road on pillars, on the build level in hand (level 1 if that is the
// ground). It joins up by itself like a road, and passes over whatever is on the levels below.
// Where it runs straight up to the end of a road, or of a highway one level down, its last
// two squares become a ramp; between two road ends it makes a flyover.
let last = null;                                      // the last square painted in this drag
const level = () => Math.max(1, state.level);

function paint(c) {
  if (hwLevel(c.x, c.z) === level() || highwayRefusal(c.x, c.z, level())) return false;
  beginEdit();
  if (hwLevel(c.x, c.z)) removeUnder(c.x, c.z); else removeSceneryAt(c.x, c.z);
  setHighway(c.x, c.z, level());
  changed(); emit('build');
  return true;
}

export const highwayTool = {
  id: 'highway',
  hint: () => 'Drag to build a highway on pillars, on level ' + level() + '. It passes over whatever is below. Run it straight up to the end of a road, or of a highway one level down, and its last two squares become a ramp.',

  hover(x, y) {
    const c = cellAt(x, y, level());
    if (c) showSquare(c.x, c.z, level(), highwayRefusal(c.x, c.z, level()) ? RED : GREEN); else hideGhost();
  },

  start(x, y) {
    const c = cellAt(x, y, level());
    last = c;
    if (!c) return;
    const why = highwayRefusal(c.x, c.z, level());
    if (why) toast(why); else paint(c);
  },

  move(x, y) {
    const c = cellAt(x, y, level());
    if (!c) return;
    if (!last) last = c;
    // a fast drag skips squares, so paint every square on the line from the last one to this one
    const steps = Math.max(Math.abs(c.x - last.x), Math.abs(c.z - last.z));
    for (let i = 1; i <= steps; i++) {
      paint({ x: Math.round(last.x + (c.x - last.x) * i / steps), z: Math.round(last.z + (c.z - last.z) * i / steps) });
    }
    last = c;
  },

  end() { last = null; },
};

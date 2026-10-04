import { trainsOn } from '../trains/store.js';
import { removeTrain } from '../trains/runtime.js';
import { erasePiece } from '../tracks/edit.js';
import { removeSceneryAt, sceneryAt } from '../scenery/placed.js';
import { pickTop, pickScenery } from '../input/picking.js';
import { setHighway } from '../terrain/highway.js';
import { removeUnder } from '../scenery/placed.js';
import { showSquare, showRect, hideGhost, RED } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';
import { emit } from '../core/events.js';
import { terrainAt, setTerrain } from '../terrain/model.js';
import { cellAt } from '../input/picking.js';

// Erase tool: click a train to take it off the track; click or drag over track, highway or scenery to remove it.
// On a square with nothing else on it, Erase removes the water, hill or road.
function ground(x, y) {
  const c = cellAt(x, y, 0);
  return c && terrainAt(c.x, c.z) ? c : null;
}
let erasing = false;
// A walkway that crosses the track: it is on top, so it goes first, and the track stays.
const spared = new Set();        // squares where this drag has taken a walkway off: their track is left alone
const over = h => (h && !h.highway && h.l === 0 ? sceneryAt(h.x, h.z) || spared.has(h.x + ',' + h.z) : null);
const note = s => { for (let i = 0; i < s.w; i++) for (let j = 0; j < s.d; j++) spared.add((s.x + i) + ',' + (s.z + j)); };
const under = c => (terrainAt(c.x, c.z) === 'roadbridge' ? 'water' : null);      // erasing a road bridge leaves the river
const dropHighway = h => { removeUnder(h.x, h.z); setHighway(h.x, h.z, 0); };

export const erase = {
  id: 'erase',
  hint: () => 'Click a train to take it off, or drag over track, highway, scenery, roads, water and hills to remove them.',

  hover(x, y) {
    const h = pickTop(x, y);
    if (h && !over(h)) { showSquare(h.x, h.z, h.l, RED); return; }
    const s = pickScenery(x, y);
    if (s) { showRect(s.x, s.z, s.w, s.d, 0, RED); return; }
    const c = ground(x, y);
    if (c) showSquare(c.x, c.z, 0, RED); else hideGhost();
  },

  start(x, y) {
    const h = pickTop(x, y);
    if (h && h.highway) { beginEdit(); dropHighway(h); erasing = true; changed(); emit('erase'); return; }
    if (h && !over(h)) {
      const ts = trainsOn(h.p);
      beginEdit();
      if (ts.length) { ts.forEach(removeTrain); erasing = false; } else { erasePiece(h.p); erasing = true; }
      changed(); emit('erase');
      return;
    }
    const s = pickScenery(x, y);
    if (s) { beginEdit(); note(s); removeSceneryAt(s.x, s.z); erasing = true; changed(); emit('erase'); return; }
    const c = ground(x, y);
    if (c) { beginEdit(); setTerrain(c.x, c.z, under(c)); erasing = true; changed(); emit('erase'); }
  },

  move(x, y) {
    if (!erasing) return;
    const h = pickTop(x, y);
    if (h && h.highway) { dropHighway(h); changed(); emit('erase'); return; }
    if (h && !over(h)) { erasePiece(h.p); changed(); emit('erase'); return; }
    const s = pickScenery(x, y);
    if (s) { note(s); removeSceneryAt(s.x, s.z); changed(); emit('erase'); return; }
    const c = ground(x, y);
    if (c) { setTerrain(c.x, c.z, under(c)); changed(); emit('erase'); }
  },

  end() { erasing = false; spared.clear(); },
};

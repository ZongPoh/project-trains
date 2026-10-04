import { state } from '../core/state.js';
import { toast } from '../core/dom.js';
import { ITEMS } from '../scenery/index.js';
import { canPlaceItem, placeScenery, footprint, sceneryAt, removeSceneryAt } from '../scenery/placed.js';
import { dirty } from '../tracks/model.js';
import { isStation, stationAcross, stationGroup, stationName } from '../tracks/features/station.js';
import { cellAt, pickPiece } from '../input/picking.js';
import { showRect, showSquare, hideGhost, GREEN, RED } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';
import { emit } from '../core/events.js';

// Scenery tool: picked by clicking an item in the depot's Scenery tab.
//   Small items (one square): click or drag over empty ground; each is turned at random.
//   Large buildings: the highlight shows the ground they need. R turns them; click to build.
//   Items for special places turn themselves:
//     over a road (footbridge, toll gate): click a straight road square
//     under a viaduct (shops under the tracks): click or drag along raised track or highway;
//       clicking a square that already has them takes them away
//     the station building: click a station to build it across the tracks; click again to remove
const item = () => ITEMS[state.sceneryType];
const big = () => { const s = item().size; return !!s && s[0] * s[1] > 1; };
const turn = () => (big() ? state.sceneryRot : Math.floor(Math.random() * 4));
const level = () => (item().under ? 1 : 0);              // shops go under level 1, so point at the track above them
let lifted = false;                                      // this drag began by taking shops away, so it places none
let last = null;                                         // the last square of this drag

function put(c) {
  const rot = turn();
  if (!canPlaceItem(state.sceneryType, c.x, c.z, rot)) return false;
  beginEdit();
  placeScenery(state.sceneryType, c.x, c.z, rot, Math.floor(Math.random() * 100000));
  changed(); emit('plant');
  return true;
}

// The station building is part of the station, not an item on the ground: it is kept as a
// mark on the platform squares it bridges (piece.hall).
function toggleHall(x, y) {
  const h = pickPiece(x, y);
  if (!h || !isStation(h.p)) { toast('Click a station to build the station building across its tracks.'); return; }
  const row = stationAcross(h.p).list, on = !h.p.hall;
  beginEdit();
  for (const q of row) q.hall = on ? 1 : 0;
  for (const q of stationGroup(h.p)) dirty.add(q);
  changed(); emit(on ? 'plant' : 'erase');
  toast(on ? stationName(h.p)[1] + ' has a station building over the tracks. Click it again to remove it.' : 'Station building removed.');
}

export function turnScenery() { state.sceneryRot = (state.sceneryRot + 1) & 3; }

const WHY = {
  road: 'This goes over a straight piece of road, away from junctions, crossings and bridges above.',
  under: 'This goes under straight track on level 1, or under a straight stretch of highway, with clear ground beneath.',
};

export const scenery = {
  id: 'scenery',
  hint: () => {
    const it = item();
    if (it.special === 'hall') return 'Click a station to build a station building across its tracks. Click it again to remove it.';
    if (it.on === 'road') return 'Click a straight piece of road to build: ' + it.name + '.';
    if (it.under) return 'Click or drag along raised track (level 1) or highway to put shops underneath. Click a square again to take them away.';
    if (it.joins) return 'Click or drag to build a raised walkway. It may cross roads and plain track, and joins decks and footbridge ends.';
    return big()
      ? 'Click to build: ' + it.name + '. The highlight shows the ground it needs.' + (state.coarse ? '' : ' Press R to turn it.')
      : 'Click or drag over empty ground to place: ' + it.name + '.';
  },

  hover(x, y) {
    if (item().special === 'hall') {
      const h = pickPiece(x, y);
      if (h) showSquare(h.x, h.z, h.l, isStation(h.p) ? GREEN : RED); else hideGhost();
      return;
    }
    const c = cellAt(x, y, level());
    if (!c) { hideGhost(); return; }
    const rot = big() ? state.sceneryRot : 0, [w, d] = footprint(state.sceneryType, rot);
    const ok = canPlaceItem(state.sceneryType, c.x, c.z, rot) || (item().under && sceneryAt(c.x, c.z) && sceneryAt(c.x, c.z).id === item().id);
    showRect(c.x, c.z, w, d, level(), ok ? GREEN : RED);
  },

  start(x, y) {
    const it = item();
    if (it.special === 'hall') { toggleHall(x, y); return; }
    const c = cellAt(x, y, level());
    last = c;
    if (!c) return;
    if (it.under) {                                      // a second click takes the shops away again
      const s = sceneryAt(c.x, c.z);
      if (s && s.id === it.id) { beginEdit(); removeSceneryAt(c.x, c.z); changed(); emit('erase'); lifted = true; return; }
    }
    if (!put(c)) toast(WHY[it.on] || (it.under && WHY.under) || (it.overTrack && 'A walkway can cross a road or plain track on the ground, but not a station, a signal, a switch, water or raised track.') || (big() ? 'Not enough free ground there for this building.' : 'That square is taken. Scenery needs empty ground with no track above it.'));
  },

  move(x, y) {
    if (lifted || big() || item().special || item().on) return;    // these go down one click at a time
    const c = cellAt(x, y, level());
    if (!c) return;
    if (!last) last = c;
    // a fast drag skips squares, so fill in every square on the line from the last one to this one
    const steps = Math.max(Math.abs(c.x - last.x), Math.abs(c.z - last.z));
    for (let i = 1; i <= steps; i++) put({ x: Math.round(last.x + (c.x - last.x) * i / steps), z: Math.round(last.z + (c.z - last.z) * i / steps) });
    last = c;
  },

  end() { lifted = false; last = null; },
};

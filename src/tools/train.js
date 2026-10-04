import { state } from '../core/state.js';
import { toast } from '../core/dom.js';
import { trainsOn } from '../trains/store.js';
import { spawnTrain, removeTrain, trailLen } from '../trains/runtime.js';
import { TRAINS, trainDef } from '../trains/index.js';
import { emit } from '../core/events.js';
import { pickPiece } from '../input/picking.js';
import { showSquare, hideGhost, BLUE } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';

// Train tool: picked by clicking a train in the depot. Click track to put that train on it.
// The square it is placed on becomes its home, where it returns after a crash.
// Clicking a train that is already on the track couples the chosen train on behind it.
function coupleOnto(there) {
  const add = TRAINS[state.trainType];
  if (there.state !== 'run') return;
  if (there.units || add.units) { toast('Only two single trains can be coupled.'); return; }
  const def = trainDef(there.type + '+' + add.id);
  if (!def) return;
  beginEdit();
  const p = there.segs[0].p, home = there.home;
  removeTrain(there);
  const svc = there.service;
  spawnTrain(def.id, p, home, svc);
  changed();
  emit('couple');
  toast(def.name + ' coupled. Use Operate on the train to split it again.');
}

export const train = {
  id: 'train',
  hint: () => 'Click any piece of track to put the ' + TRAINS[state.trainType].name + ' on it. Click a train already on the track to couple this one behind it.',

  hover(x, y) {
    const h = pickPiece(x, y);
    if (h) showSquare(h.x, h.z, h.l, BLUE); else hideGhost();
  },

  start(x, y) {
    const h = pickPiece(x, y);
    if (!h) { toast('Click a piece of track to put the train on it.'); return; }
    const there = trainsOn(h.p)[0];
    if (there) { coupleOnto(there); return; }
    beginEdit();
    const tr = spawnTrain(state.trainType, h.p);
    changed();
    emit('placed');
    if (tr && tr.total > trailLen(tr) + 0.01) toast('This track is shorter than the train. Lay a longer run and it will set off.');
  },
};

import { dirty } from '../tracks/model.js';
import { kindOf } from '../tracks/pieces/index.js';
import { cycleSwitch } from '../tracks/pieces/junction.js';
import { SIG_STOP, toggleSignal } from '../tracks/features/signal.js';
import { toast } from '../core/dom.js';
import { pickPiece } from '../input/picking.js';
import { showSquare, hideGhost, BLUE } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';
import { emit } from '../core/events.js';
import { trainsOn } from '../trains/store.js';
import { splitTrain } from '../trains/runtime.js';
import { trainDef } from '../trains/index.js';
import { nextService } from '../trains/service.js';
import { isStation, isCoupling, setCoupling, stationGroup, stationName } from '../tracks/features/station.js';

// Operate tool: work the railway while trains run.
//   click a junction: set the switch to its next route (the amber line shows the live route)
//   click a signal:   hold trains at it, or let it work by itself again
//   click a train:    change its service: local, express, or not stopping at all
//   click a coupled train: uncouple it into its two sets
//   click a station:  make it a coupling station, where coupled trains split and join by themselves
const trainOn = p => trainsOn(p).find(t => t.state === 'run');
const usable = p => kindOf(p) === 'junction' || !!p.sig || !!trainOn(p) || isStation(p);

export const operate = {
  id: 'operate',
  hint: () => 'Click a junction to set its route (after its three routes it takes turns by itself), a signal to hold or release it, a train to change its service (local, express, not stopping), a coupled train to split it, or a station to make it a coupling station.',

  hover(x, y) {
    const h = pickPiece(x, y);
    if (h && usable(h.p)) showSquare(h.x, h.z, h.l, BLUE); else hideGhost();
  },

  start(x, y) {
    const h = pickPiece(x, y);
    if (!h || !usable(h.p)) { toast('Click a junction, a signal, a train or a station to operate it.'); return; }
    const tr = trainOn(h.p);
    if (tr && tr.units) {
      beginEdit();
      splitTrain(tr);
      emit('couple');
      toast('Uncoupled. The set behind follows as a train of its own.');
    } else if (tr) {
      beginEdit();
      const s = nextService(tr);
      emit('signal');
      toast(trainDef(tr.type).name + ': ' + s.name + ' (' + s.jp + '). It ' + s.about + '.');
    } else if (isStation(h.p) && !h.p.sig) {
      beginEdit();
      const on = !isCoupling(h.p);
      setCoupling(h.p, on);
      for (const q of stationGroup(h.p)) dirty.add(q);
      emit('switch');
      toast(stationName(h.p)[1] + (on ? ' is now a coupling station: coupled trains split here, and the two sets join again when they next meet at one.' : ' is an ordinary station again.'));
    } else if (h.p.sig) {
      toast(toggleSignal(h.p) === SIG_STOP ? 'Signal held at stop.' : 'Signal released. It is automatic again.');
      emit('signal');
    } else {
      cycleSwitch(h.p);
      dirty.add(h.p);
      emit('switch');
      if (h.p.alt) toast('This switch now takes turns: each train on the through line goes the other way from the one before. Click again for a fixed route.');
    }
    changed();
  },
};

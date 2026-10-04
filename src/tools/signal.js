import { dirty, isStraight } from '../tracks/model.js';
import { SIG_NONE, SIG_AUTO } from '../tracks/features/signal.js';
import { stationGroup } from '../tracks/features/station.js';
import { toast } from '../core/dom.js';
import { pickPiece } from '../input/picking.js';
import { showSquare, hideGhost, GREEN, RED } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';
import { emit } from '../core/events.js';

// Signal tool: click straight track to put up a signal, click the signal again to take it down.
export const signal = {
  id: 'signal',
  hint: () => 'Click straight track to put up a signal. Trains wait at it while the line ahead is busy. Click a signal again to take it down.',

  hover(x, y) {
    const h = pickPiece(x, y);
    if (h) showSquare(h.x, h.z, h.l, isStraight(h.p) ? GREEN : RED); else hideGhost();
  },

  start(x, y) {
    const h = pickPiece(x, y);
    if (!h) { toast('Click a piece of straight track to put a signal there.'); return; }
    if (!isStraight(h.p)) { toast('Signals need straight, level track.'); return; }
    beginEdit();
    const p = h.p;
    if (p.st) { for (const q of stationGroup(p)) dirty.add(q); p.st = 0; }
    p.sig = p.sig ? SIG_NONE : SIG_AUTO;
    dirty.add(p);
    changed(); emit('build');
  },
};

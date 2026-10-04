import { toast } from '../core/dom.js';
import { trainsOn } from '../trains/store.js';
import { startRide } from '../input/ride.js';
import { pickPiece } from '../input/picking.js';
import { showSquare, hideGhost, BLUE } from '../input/ghost.js';

// Ride tool: click a train to climb aboard. The camera itself lives in input/ride.js.
const aboard = p => trainsOn(p).find(t => t.state === 'run');

export const rideTool = {
  id: 'ride',
  hint: () => 'Click a train to ride it. You can change the view once you are aboard.',

  hover(x, y) {
    const h = pickPiece(x, y);
    if (h && aboard(h.p)) showSquare(h.x, h.z, h.l, BLUE); else hideGhost();
  },

  start(x, y) {
    const h = pickPiece(x, y), tr = h && aboard(h.p);
    if (!tr) { toast('Click a train to ride it.'); return; }
    hideGhost();
    startRide(tr);
  },
};

import { key } from '../core/constants.js';
import { occ, dirty, isStraight } from '../tracks/model.js';
import { stationGroup, stationName } from '../tracks/features/station.js';
import { toast } from '../core/dom.js';
import { pickPiece } from '../input/picking.js';
import { showSquare, hideGhost, GREEN, RED } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';
import { emit } from '../core/events.js';

// Station tool: click straight track to build a platform, drag to make it longer.
// Platforms on tracks that lie side by side join into one station: two tracks get a footbridge,
// three a glass roof, four or more a terminal with a train shed and a clock tower.
// Clicking a platform again moves it to the other side of the track; a third click removes it.
let painting = 0;      // the side being painted during a drag, 0 when not painting
let last = null;       // the last square painted in this drag

function setStation(p, st) {
  const before = stationGroup(p);                     // the station it was part of, and the one it joins:
  p.st = st;                                          // both may change their look
  if (st) p.sig = 0;
  const joined = stationGroup(p);                     // a platform added to a coupling station is part of it
  p.cpl = st && joined.some(q => q !== p && q.cpl) ? 1 : 0;
  if (p.cpl) for (const q of joined) q.cpl = 1;
  for (const q of before) dirty.add(q);
  for (const q of stationGroup(p)) dirty.add(q);
}

export const station = {
  id: 'station',
  hint: () => 'Click straight track to build a platform, drag to lengthen it. Platforms side by side join into one bigger station. Click again to swap sides, once more to remove.',

  hover(x, y) {
    const h = pickPiece(x, y);
    if (h) showSquare(h.x, h.z, h.l, isStraight(h.p) ? GREEN : RED); else hideGhost();
  },

  start(x, y) {
    painting = 0;
    const h = pickPiece(x, y);
    if (!h) { toast('Click a piece of straight track to build a station there.'); return; }
    if (!isStraight(h.p)) { toast('Stations need straight, level track.'); return; }
    beginEdit();
    const next = ((h.p.st | 0) + 1) % 3;
    setStation(h.p, next);
    painting = next; last = h;
    changed(); emit('build');
    if (next === 1) toast(stationName(h.p)[1] + ' station. Trains will stop here.');
  },

  move(x, y) {
    if (!painting) return;
    const h = pickPiece(x, y);
    if (!h || !last || h.l !== last.l) return;
    // a fast drag skips squares, so paint every square on the line from the last one to this one
    const steps = Math.max(Math.abs(h.x - last.x), Math.abs(h.z - last.z));
    let any = false;
    for (let i = 1; i <= steps; i++) {
      const p = occ.get(key(Math.round(last.x + (h.x - last.x) * i / steps), Math.round(last.z + (h.z - last.z) * i / steps), h.l));
      if (p && isStraight(p) && p.st !== painting) { setStation(p, painting); any = true; }
    }
    last = h;
    if (any) { changed(); emit('build'); }
  },

  end() { painting = 0; last = null; },
};

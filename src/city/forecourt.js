import { toast } from '../core/dom.js';
import { emit } from '../core/events.js';
import { pieces } from '../tracks/model.js';
import { isStation, stationRun, stationGroup, stationName } from '../tracks/features/station.js';
import { addWaiting } from './passengers.js';

// The station forecourt (a scenery item) is where buses and taxis set people down. Those people
// walk into the nearest station and join the queue on its emptiest platform.
const REACH = 3;               // how far from the forecourt a station may be, in squares
let told = false;

function stationNear(s) {
  let best = null, bd = REACH + 0.01;
  for (const p of pieces) {
    if (p.type !== 'flat' || !isStation(p)) continue;
    const dx = Math.max(s.x - p.x, 0, p.x - (s.x + s.w - 1)), dz = Math.max(s.z - p.z, 0, p.z - (s.z + s.d - 1));
    const d = Math.max(dx, dz);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}

// A bus or taxi has pulled up at forecourt s with `count` passengers.
export function setDown(s, count) {
  const near = stationNear(s);
  if (!near) return false;
  const firsts = [...new Set(stationGroup(near).map(q => stationRun(q).first))];
  firsts.sort((a, b) => (a.pax | 0) - (b.pax | 0));
  addWaiting(firsts[0], count);
  emit('setdown', { x: s.x + s.w / 2, z: s.z + s.d / 2, count });
  if (!told) { told = true; toast('A bus has set passengers down at ' + stationName(near)[1] + '. Forecourts bring people to their station.'); }
  return true;
}

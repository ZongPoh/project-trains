import { emit } from '../core/events.js';
import { isStation, stationId, isCoupling } from '../tracks/features/station.js';
import { trains } from './store.js';
import { trainDef } from './index.js';
import { makeTrain, splitTrain, removeTrain, placeCars, MELODY } from './runtime.js';
import { approaching } from './service.js';

// Coupling stations. The player marks a station as one with the Operate tool. There:
//   a coupled train uncouples: the front set leaves, the set behind follows a moment later;
//   the two sets remember each other, and the next time both come to a coupling station the
//   first to arrive waits, the second runs in behind it on the same platform, and they join.
// This is how the Hayabusa and Komachi work at Morioka. Two sets that belong together carry
// the same `mate` number.
let lastMate = 0;
export const noteMate = n => { lastMate = Math.max(lastMate, n | 0); };

const partner = tr => (tr.mate && !tr.units ? trains.find(o => o !== tr && o.mate === tr.mate && o.state === 'run' && !o.units) : null);

// A coupled train standing at a coupling station uncouples, unless it has only just joined here.
export function wantsSplit(tr) {
  const p = tr.segs[0].p;
  return !!tr.units && isStation(p) && isCoupling(p) && tr.joinedAt !== stationId(p);
}

// The partner of this train, if it is standing at a coupling station ready to be joined.
export function mateWaiting(tr) {
  const o = partner(tr);
  if (!o || !(o.wait > 0) || o.sung || !o.atStation) return null;
  const p = o.segs[0].p;
  return isStation(p) && isCoupling(p) ? o : null;
}

// Is this train's partner on its way in behind it? Then it is worth waiting for.
export function mateComing(tr) {
  const p = tr.segs[0].p;
  if (!isStation(p) || !isCoupling(p)) return false;
  const o = partner(tr);
  return !!o && !o.stuck && (o.joinTo === tr || approaching(o, tr, 48));
}

// Two partners while one runs up to the other: they are meant to touch.
export const coupling = (a, b) => !!a.mate && a.mate === b.mate && (mateWaiting(a) === b || mateWaiting(b) === a || a.joinTo === b || b.joinTo === a);

function split(tr) {
  tr.splitNow = false;
  const sets = splitTrain(tr);
  if (!sets) return;
  const [lead, rear] = sets;
  lead.mate = rear.mate = ++lastMate;
  emit('couple', { x: rear.cars[0].mesh.position.x, z: rear.cars[0].mesh.position.z });
  emit('split', { was: tr, lead, rear });
  emit('depart', { x: lead.cars[0].mesh.position.x, z: lead.cars[0].mesh.position.z, train: lead });
}

// `rear` has stopped nose to tail behind `front`: make one train of the two.
function join(front, rear) {
  // car order in a coupled train is first set then second; a train running "flipped" leads with its last car
  const id = front.flipped ? rear.type + '+' + front.type : front.type + '+' + rear.type;
  if (!trainDef(id)) return false;
  const tr = makeTrain(id, front.home), last = front.segs[front.segs.length - 1];
  tr.segs = front.segs.concat(rear.segs[0].p === last.p ? rear.segs.slice(1) : rear.segs);
  tr.d = front.d; tr.flipped = front.flipped;
  tr.service = front.service; tr.pax = (front.pax | 0) + (rear.pax | 0);
  tr.atStation = front.atStation; tr.wait = MELODY + 0.8; tr.sung = false; tr.held = 0; tr.dwellT = front.dwellT || 0;
  tr.joinedAt = stationId(front.segs[0].p);                  // do not uncouple again before leaving
  const at = trains.indexOf(front);
  removeTrain(front); removeTrain(rear);
  trains.splice(Math.min(at, trains.length), 0, tr);
  placeCars(tr);
  emit('couple', { x: tr.cars[0].mesh.position.x, z: tr.cars[0].mesh.position.z });
  emit('joined', { train: tr, was: [front, rear] });
  return true;
}

// Called once per step, after every train has moved.
export function stepCoupling() {
  for (const tr of trains.slice()) {
    if (tr.splitNow) { split(tr); continue; }
    if (!tr.joinTo) continue;
    const front = tr.joinTo;
    tr.joinTo = null;
    if (trains.includes(front) && front.state === 'run' && front.wait > 0 && !front.units && !tr.units) join(front, tr);
  }
}

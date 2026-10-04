import { toast } from '../core/dom.js';
import { state } from '../core/state.js';
import { settings } from '../core/settings.js';
import { emit } from '../core/events.js';
import { stationPieces, stationName } from '../tracks/features/station.js';
import { canPlaceItem, placeScenery, footprint } from '../scenery/placed.js';
import { isRoad } from '../terrain/model.js';

// The town grows where trains bring people. Every passenger who gets off at a station counts
// towards its next building; when enough have arrived, a building pops up on free ground near
// the platform. Small stations get houses and shops; busy ones get offices and, now and then,
// a large building such as a department store or a stadium. Each new building
// costs more arrivals than the last, so growth starts quickly and then slows down.
//   Kept on the first square of the station: piece.del (arrivals so far), piece.grown (buildings).
const need = grown => 20 + 10 * grown;
const rising = [];             // buildings still popping up: { mesh, t }
let announced = false;

function pick(grown) {
  const r = Math.random();
  if (r < 0.14) return ['sakura', 'maple', 'pine'][Math.floor(Math.random() * 3)];     // a little green in between
  if (grown >= 10) return r < 0.6 ? 'office' : r < 0.85 ? 'house' : 'ramen-shop';
  if (grown >= 4) return r < 0.42 ? 'office' : r < 0.8 ? 'house' : 'ramen-shop';
  return r < 0.8 ? 'house' : 'ramen-shop';
}

// Once a station is busy, now and then it earns something bigger than a single plot.
const BIG = [['department-store', 6], ['apartments', 6], ['ryokan', 8], ['school', 9], ['stadium', 14], ['castle-grounds', 16]];
function pickBig(grown) {
  const can = BIG.filter(b => grown >= b[1]);
  return can.length && Math.random() < 0.22 ? can[Math.floor(Math.random() * can.length)][0] : null;
}

const byRoad = (x, z, w, d) => {
  for (let i = -1; i <= w; i++) for (let j = -1; j <= d; j++) {
    const edge = i < 0 || j < 0 || i === w || j === d, corner = (i < 0 || i === w) && (j < 0 || j === d);
    if (edge && !corner && isRoad(x + i, z + j)) return true;
  }
  return false;
};

function grow(first) {
  const squares = stationPieces(first), grown = first.grown | 0;
  const spread = 2.5 + Math.min(7, grown * 0.4);                  // the town spreads out as it grows
  const large = pickBig(grown);
  for (let tries = 0; tries < 48; tries++) {
    const id = large && tries < 30 ? large : pick(grown), rot = Math.floor(Math.random() * 4), [w, d] = footprint(id, rot);
    const from = squares[Math.floor(Math.random() * squares.length)];
    const a = Math.random() * Math.PI * 2, r = 1.4 + Math.random() * (spread + w);
    const x = Math.round(from.x + Math.cos(a) * r - w / 2), z = Math.round(from.z + Math.sin(a) * r - d / 2);
    if (!canPlaceItem(id, x, z, rot)) continue;
    // the first tries look for a plot beside a road, so towns line their streets
    if (tries < 24 && !byRoad(x, z, w, d)) continue;
    const s = placeScenery(id, x, z, rot, Math.floor(Math.random() * 100000));
    if (!s) continue;
    s.mesh.scale.setScalar(0.01);
    rising.push({ mesh: s.mesh, t: 0 });
    emit('grown', { x, z });
    if (!announced) { announced = true; toast(stationName(first)[1] + ' is growing. Passengers bring new buildings to a station.'); }
    return true;
  }
  return false;                                                   // no free ground nearby
}

// `count` passengers have just got off at the station starting at `first`.
export function delivered(first, count) {
  if (!settings.growth) return;
  first.del = (first.del | 0) + count;
  let guard = 0;
  while (first.del >= need(first.grown | 0) && guard++ < 3) {
    first.del -= need(first.grown | 0);
    if (!grow(first)) { first.del = 0; break; }
    first.grown = (first.grown | 0) + 1;
    state.townChanged = true;
  }
}

// Called every frame: new buildings rise out of the ground with a small bounce.
export function stepGrowth(dt) {
  for (let i = rising.length - 1; i >= 0; i--) {
    const b = rising[i];
    b.t += dt / 0.7;
    const u = Math.min(1, b.t), k = 1 + 2.2 * Math.pow(u - 1, 3) + 1.2 * Math.pow(u - 1, 2);   // overshoot, then settle
    b.mesh.scale.setScalar(Math.max(0.01, k));
    if (u >= 1) { b.mesh.scale.setScalar(1); rising.splice(i, 1); }
  }
}

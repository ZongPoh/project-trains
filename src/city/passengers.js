import { GB } from '../core/builder.js';
import { trackGroup, sceneryMat } from '../core/stage.js';
import { state } from '../core/state.js';
import { on } from '../core/events.js';
import { pieces } from '../tracks/model.js';
import { isStation, stationRun, stationPieces, platformSpot, doorSpots } from '../tracks/features/station.js';
import { placed } from '../scenery/placed.js';
import { delivered } from './growth.js';
import { addWalker, coatOf, skinOf } from './people.js';

// Passengers. People gather on every platform, more quickly where there are homes, shops and
// offices nearby: they walk in along the platform and queue in two neat lines where each train
// door will stop. A train that stops lets some of its passengers off and takes on as many of
// those waiting as it has room for. Each passenger who gets off counts towards the town
// growing round that station (see growth.js).
//   The number waiting is kept on the first square of the station (piece.pax).
const PER_SQUARE = 6;          // how many people fit on one platform square
const PER_CAR = 6;             // how many a train car carries
const REACH = 6;               // buildings this close to a station send it passengers
const DRAW = { 'station-forecourt': 6, 'ticket-hall': 4, 'pedestrian-deck': 3, 'car-park': 5, house: 1, 'ramen-shop': 1.5, office: 3, castle: 2, pagoda: 2, 'department-store': 6, ryokan: 3, school: 4, apartments: 8, 'castle-grounds': 5, stadium: 10 };

const crowds = new Map();      // first piece of a station -> { mesh, key }
let clock = 0;
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const look = (first, i) => hash(first.x * 13 + first.l * 5 + i * 3.7, first.z * 7 + i);

// How strongly the buildings round a station pull passengers to it.
function demand(squares) {
  const mid = squares[Math.floor(squares.length / 2)];
  let d = 0;
  for (const s of placed.values()) {
    if (DRAW[s.id] && Math.abs(s.x + s.w / 2 - mid.x) <= REACH + 1 && Math.abs(s.z + s.d / 2 - mid.z) <= REACH + 1) d += DRAW[s.id];
  }
  return d;
}

// Every door position along a platform: { sq, along }.
export const doorsOf = squares => squares.flatMap(sq => doorSpots(sq).map(along => ({ sq, along })));

// Where the passenger in place i of the queue stands. The queues fill evenly: door by door
// along the platform, two abreast, then the next row back.
function queueSpot(first, doors, i) {
  const door = doors[i % doors.length], place = Math.floor(i / doors.length);
  const along = door.along + (place % 2 ? 0.033 : -0.033) + (hash(i, first.x + first.z) - 0.5) * 0.008;
  return platformSpot(door.sq, along, 0.318 + Math.min(3, Math.floor(place / 2)) * 0.046 + (hash(first.z + i, i) - 0.5) * 0.006);   // behind the yellow line
}

// The way on and off a platform: the end of it nearest a ticket hall, forecourt or pedestrian
// deck, or its first end if there is none near.
const ENTRANCE = { 'ticket-hall': 1, 'station-forecourt': 1, 'pedestrian-deck': 1 };
function wayOut(first, squares) {
  const a = squares[0], b = squares[squares.length - 1];
  let best = a, bd = 5;
  for (const s of placed.values()) {
    if (!ENTRANCE[s.id]) continue;
    for (const q of [a, b]) {
      const d = Math.hypot(s.x + s.w / 2 - q.x - 0.5, s.z + s.d / 2 - q.z - 0.5);
      if (d < bd) { bd = d; best = q; }
    }
  }
  // the outer end of that square: the one further from the other end of the platform
  const other = best === a ? b : a;
  const far = al => { const s = platformSpot(best, al, 0.4); return Math.hypot(s.x - other.x - 0.5, s.z - other.z - 0.5); };
  return { sq: best, along: far(0.44) >= far(-0.44) ? 0.44 : -0.44 };
}
const P3 = s => [s.x, s.y, s.z];
// A point at the back of the platform level with the point p (which is in square sq).
const behind = (sq, along) => P3(platformSpot(sq, along, 0.445));

// Someone walks in from the way out to place i of the queue. Until they get there they are not
// drawn in the queue (first.walking counts those still on their way).
function walkIn(first, squares, i, delay) {
  const doors = doorsOf(squares);
  if (!doors.length) return;
  const out = wayOut(first, squares), door = doors[i % doors.length], n = look(first, i);
  first.walking = (first.walking | 0) + 1;
  addWalker([behind(out.sq, out.along), behind(door.sq, door.along), P3(queueSpot(first, doors, i))], {
    delay, coat: coatOf(n * 97), skin: skinOf(n * 31),
    done: () => { first.walking = Math.max(0, (first.walking | 0) - 1); if (crowds.has(first)) drawCrowd(first, stationPieces(first)); },
  });
}

// Put one small person on the platform for each passenger waiting.
function drawCrowd(first, squares) {
  const n = Math.max(0, (first.pax | 0) - (first.walking | 0)), key = n + '|' + squares.length + '|' + first.st;
  let c = crowds.get(first);
  if (c && c.key === key) return;
  if (c && c.mesh) { trackGroup.remove(c.mesh); c.mesh.geometry.dispose(); }
  c = { key, mesh: null };
  crowds.set(first, c);
  if (!n) return;
  const gb = new GB();
  const doors = doorsOf(squares);
  for (let i = 0; i < n && doors.length; i++) {
    const at = queueSpot(first, doors, i), v = look(first, i);
    gb.cyl(at.x, at.y + 0.046, at.z, 0.025, 0.092, coatOf(v * 97), 'y', 0.017);
    gb.sph(at.x, at.y + 0.115, at.z, 0.024, 0.024, 0.024, skinOf(v * 31));
  }
  c.mesh = gb.mesh(sceneryMat);
  c.mesh.castShadow = true;
  trackGroup.add(c.mesh);
}

function forget(first) {
  const c = crowds.get(first);
  if (c && c.mesh) { trackGroup.remove(c.mesh); c.mesh.geometry.dispose(); }
  crowds.delete(first);
}

// Called every frame while the game runs: people arrive on the platforms.
export function stepPassengers(dt) {
  clock += dt;
  if (clock < 0.5) return;
  const elapsed = clock;
  clock = 0;
  const seen = new Set();
  for (const p of pieces) {
    if (p.type !== 'flat' || !isStation(p)) continue;
    const run = stationRun(p);
    if (run.first !== p) {                              // the count lives on the first square only
      if (p.pax || p.del || p.grown) {
        run.first.pax = (run.first.pax | 0) + (p.pax | 0); run.first.del = (run.first.del | 0) + (p.del | 0);
        run.first.grown = Math.max(run.first.grown | 0, p.grown | 0);
        p.pax = p.del = p.grown = 0;
      }
      continue;
    }
    seen.add(p);
    const squares = stationPieces(p), room = squares.length * PER_SQUARE;
    p.pax = Math.min(p.pax | 0, room);
    p.coming = (p.coming || 0) + elapsed * Math.min(1.2, 0.18 + 0.045 * demand(squares));
    while (p.coming >= 1) { p.coming -= 1; if (p.pax < room) { p.pax++; walkIn(p, squares, p.pax - 1, 0); } }
    drawCrowd(p, squares);
  }
  for (const first of [...crowds.keys()]) if (!seen.has(first)) forget(first);
}

// A train has stopped at a station: passengers get off, then others get on. Up to a dozen of
// each are seen walking: off through the doors and away along the platform, and out of the
// queues into the train.
const SHOWN = 12;
function board(e) {
  const tr = e.train, first = e.first;
  if (!tr || !first) return;
  const squares = stationPieces(first), was = first.pax | 0;
  const off = Math.round((tr.pax | 0) * 0.6);
  tr.pax = (tr.pax | 0) - off;
  const on = Math.min(was, tr.cars.length * PER_CAR - tr.pax);
  first.pax = was - on;
  tr.pax += on;
  if (off) { state.carried += off; delivered(first, off); }
  drawCrowd(first, squares);
  // the doors the train is standing at: those within half its length of the middle of the platform
  const all = doorsOf(squares), mid = (squares.length - 1) / 2;
  const reach = d => Math.abs(squares.indexOf(d.sq) - mid + d.along);
  const doors = all.filter(d => reach(d) <= tr.total / 2 + 0.05);
  if (!doors.length) return;
  const out = wayOut(first, squares);
  for (let i = 0; i < Math.min(off, SHOWN); i++) {
    const d = doors[Math.floor(Math.random() * doors.length)], j = (Math.random() - 0.5) * 0.08;
    addWalker([P3(platformSpot(d.sq, d.along + j, 0.19)), behind(d.sq, d.along + j * 2), behind(out.sq, out.along)], { delay: 0.2 + Math.random() * 1.1 });
  }
  const far = (d, q) => Math.abs((squares.indexOf(d.sq) + d.along) - (squares.indexOf(q.sq) + q.along));
  for (let i = 0; i < Math.min(on, SHOWN); i++) {
    const slot = was - 1 - i, q = all[slot % all.length], n = look(first, slot);
    const d = doors.reduce((a, b) => (far(b, q) < far(a, q) ? b : a));
    addWalker([P3(queueSpot(first, all, slot)), P3(platformSpot(d.sq, d.along + (Math.random() - 0.5) * 0.06, 0.26)), P3(platformSpot(d.sq, d.along, 0.17))], { delay: 0.9 + Math.random() * 0.9, coat: coatOf(n * 97), skin: skinOf(n * 31) });
  }
}

// People brought to the station by bus or taxi: they walk in and join the queue.
export function addWaiting(first, count) {
  const squares = stationPieces(first), room = squares.length * PER_SQUARE;
  for (let i = 0; i < count && (first.pax | 0) < room; i++) { first.pax = (first.pax | 0) + 1; walkIn(first, squares, first.pax - 1, i * 0.3); }
  drawCrowd(first, squares);
}

export function initPassengers() { on('arrive', board); }

export function clearPassengers() {
  for (const first of [...crowds.keys()]) forget(first);
}

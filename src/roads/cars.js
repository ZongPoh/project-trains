import * as THREE from 'three';
import { H, DX, DZ, opp, inBoard } from '../core/constants.js';
import { GB } from '../core/builder.js';
import { rng } from '../core/random.js';
import { sceneryGroup, sceneryMat } from '../core/stage.js';
import { state } from '../core/state.js';
import { settings } from '../core/settings.js';
import { emit } from '../core/events.js';
import { isRoad, squaresOf } from '../terrain/model.js';
import { highway, isHighway, hwLevel, hwLinks, rampFoot, rampOf, hwY } from '../terrain/highway.js';
import { roadLinks, roadPoint } from '../terrain/roads.js';
import { trains } from '../trains/store.js';
import { burst } from '../trains/crash.js';
import { crossingClosed, hasGates } from './crossings.js';
import sedan from './vehicles/sedan.js';
import keiTruck from './vehicles/kei-truck.js';
import taxi from './vehicles/taxi.js';
import bus from './vehicles/bus.js';
import truck from './vehicles/truck.js';
import { sceneryAt } from '../scenery/placed.js';
import { setDown } from '../city/forecourt.js';

// Traffic. Cars appear by themselves on any road, about one for every six squares. They keep
// to the left, follow the curve of the road, turn at random at junctions, turn round at dead
// ends, queue behind each other and wait at a closed level crossing.
//   A car crosses one road square at a time, from the side it came in by (a) to the side it
//   leaves by (b). While it does, it holds the slot "square + a", so two cars never share a lane.
//   The highway is a second layer of road (car.lv 1). A car on a road that leads to the foot
//   of a ramp may turn up it; on the deck cars drive faster, and come down again by a ramp.
//   A bus or taxi passing a station forecourt on its kerb side pulls up for a moment and sets
//   passengers down (city/forecourt.js).
//   Where a road or the highway reaches the edge of the board, cars drive off along it into
//   the countryside, and others drive in from out there.
//   Some drivers turn into a multi-storey car park on their kerb side, stay a while, and come out,
//   and some park in a bay at a service area.
//   With reckless drivers switched on, some cars jump the gates, and a train can hit them.
const KINDS = [sedan, sedan, sedan, keiTruck, keiTruck, taxi, bus, truck];
const LANE = 0.13, SPEED = 1.5, FAST = 1.7, MAX_CARS = 44, REACH = 16;
const cars = [], slots = new Map();
const slot = (x, z, a, lv) => x + ',' + z + ',' + a + (lv ? '^' : '');
const slotOf = car => slot(car.x, car.z, car.a, car.lv);
const _p = new THREE.Vector3(), _q = new THREE.Vector3();
let census = 0;

const lengthOf = (a, b) => (a === b ? 0.6 : b === opp(a) ? 1 : Math.PI / 4);

// Where the car is on its way across the square (the middle of the road, before keeping left).
function along(car, t, out) {
  if (car.a !== car.b) return roadPoint(car.x, car.z, car.a, car.b, t, out);
  const u = t < 0.5 ? t * 2 : (1 - t) * 2;                       // a dead end: in a little way, then back out
  return out.set(car.x + 0.5 + DX[car.a] * (0.5 - 0.3 * u), 0, car.z + 0.5 + DZ[car.a] * (0.5 - 0.3 * u));
}

// The sides a car can leave this square by: on the ground, or (lv 1) on the highway, where the
// foot of a ramp also leads down to the road. At the edge of the board the way out counts too.
function linksAt(x, z, lv) {
  const out = lv ? hwLinks(x, z) : roadLinks(x, z);
  if (lv && hwLevel(x, z) === 1 && rampFoot(x, z) >= 0) out.push(rampFoot(x, z));
  for (let d = 0; d < 4; d++) if (!inBoard(x + DX[d], z + DZ[d])) out.push(d);
  return out;
}

// Pick the side to leave a square by, having come in by side a.
function wayOut(x, z, a, lv) {
  const links = linksAt(x, z, lv).filter(d => d !== a);
  return links.length ? links[Math.floor(Math.random() * links.length)] : a;     // nowhere else to go: turn round
}

function build() {
  const kind = KINDS[Math.floor(Math.random() * KINDS.length)], gb = new GB();
  kind.build(gb, rng(Math.floor(Math.random() * 1e6)));
  const mesh = gb.mesh(sceneryMat);
  mesh.castShadow = true;
  mesh.rotation.order = 'YXZ';                                   // turn first, then tip up or down a ramp
  sceneryGroup.add(mesh);
  return { mesh, kind: kind.id, lv: 0, t: 0, heading: null, pitch: 0, side: 0, speed: SPEED * (0.85 + Math.random() * 0.3) * (kind === bus || kind === truck ? 0.8 : 1) };
}

function make(x, z) {
  const links = roadLinks(x, z);
  if (!links.length) return null;
  const a = links[Math.floor(Math.random() * links.length)];
  if (slots.has(slot(x, z, a, 0))) return null;
  const car = Object.assign(build(), { x, z, a, b: wayOut(x, z, a, 0), t: Math.random() * 0.6 });
  slots.set(slotOf(car), car);
  cars.push(car);
  return car;
}

// A car out in the countryside, on its way in to the edge square x,z by side d.
function makeInbound(x, z, d, lv) {
  if (cars.some(c => c.out && c.x === x && c.z === z && c.out.d === d && c.out.inbound)) return null;
  const car = Object.assign(build(), { x, z, lv, a: d, b: opp(d), out: { d, s: REACH, inbound: true } });
  car.mesh.position.set(-999, 0, -999);
  cars.push(car);
  return car;
}

function scrap(car) {
  if (car.park && car.park.bay != null) car.park.s.bays[car.park.bay] = null;
  sceneryGroup.remove(car.mesh); car.mesh.geometry.dispose();
  if (slots.get(slotOf(car)) === car) slots.delete(slotOf(car));
  const i = cars.indexOf(car);
  if (i >= 0) cars.splice(i, 1);
}

// At the far side of a square: move into the next one, if the way is clear.
function moveOn(car) {
  const nx = car.x + DX[car.b], nz = car.z + DZ[car.b], na = opp(car.b);
  if (!inBoard(nx, nz)) {                                        // off the edge of the board: carry on out
    slots.delete(slotOf(car));
    car.out = { d: car.b, s: 0, inbound: false };
    return;
  }
  let lv = -1;                                                   // the layer the next square is on
  if (!car.lv) lv = isRoad(nx, nz) ? 0 : hwLevel(nx, nz) === 1 && rampFoot(nx, nz) === na ? 1 : -1;
  else lv = hwLinks(car.x, car.z).includes(car.b) ? 1 : hwLevel(car.x, car.z) === 1 && rampFoot(car.x, car.z) === car.b && isRoad(nx, nz) ? 0 : -1;
  if (lv < 0) {                                                  // the road ahead has gone: turn round here
    slots.delete(slotOf(car));
    car.a = car.b; car.t = 0;
    slots.set(slotOf(car), car);
    return;
  }
  if (slots.has(slot(nx, nz, na, lv))) return;                   // wait behind the car in front
  if (!lv && crossingClosed(nx, nz)) {                           // wait at the gates...
    if (settings.careful) return;
    if (car.dare == null) car.dare = Math.random() < 0.5;       // ...unless this driver is reckless too
    if (!car.dare) return;
  }
  slots.delete(slotOf(car));
  car.x = nx; car.z = nz; car.lv = lv; car.a = na; car.b = wayOut(nx, nz, na, lv); car.t = 0; car.dare = null; car.paid = false;
  slots.set(slotOf(car), car);
}

// Beyond the edge of the board: straight along the road until out of sight, or in from out
// there to the edge, waiting at the edge if the first square is taken.
function beyond(car, dt) {
  const o = car.out, base = car.lv ? hwLevel(car.x, car.z) * H + 0.012 : -0.006;
  o.s += (o.inbound ? -1 : 1) * car.speed * (car.lv ? FAST : 1) * dt;
  if (!o.inbound && o.s > REACH) { scrap(car); return; }
  if (o.inbound && o.s <= 0) {
    o.s = 0;
    if (!(car.lv ? isHighway(car.x, car.z) : isRoad(car.x, car.z))) { scrap(car); return; }
    if (!slots.has(slot(car.x, car.z, o.d, car.lv))) {
      car.a = o.d; car.b = wayOut(car.x, car.z, o.d, car.lv); car.t = 0; car.out = null;
      slots.set(slotOf(car), car);
      return;
    }
  }
  const dir = o.inbound ? opp(o.d) : o.d;                        // the way it is facing
  car.heading = Math.atan2(DX[dir], DZ[dir]);
  const lane = car.lv ? LANE + 0.03 : LANE, y = car.mesh.position.y < -100 ? base : car.mesh.position.y + (base - car.mesh.position.y) * Math.min(1, dt * 6);
  car.mesh.position.set(car.x + 0.5 + DX[o.d] * (0.5 + o.s) + Math.cos(car.heading) * lane, o.s < 0.3 && !car.lv ? Math.max(y, 0.006) : y, car.z + 0.5 + DZ[o.d] * (0.5 + o.s) - Math.sin(car.heading) * lane);
  car.mesh.rotation.set(0, car.heading, 0);
}

// Parking. A car that has turned into a car park drives in under the first deck, is out of
// sight for a while, then backs out when its lane is clear. At a service area it turns into
// one of the two bays kept free for visitors, stands there in view, and backs out the same way.
const BAYS = [-1.62, -0.58];                                     // where those bays are along the front of a service area
function bayPoint(s, i, out) {                                   // the same point on the board, for the way the service area is turned
  const lx = BAYS[i], lz = 0.46, c = Math.cos(s.rot * Math.PI / 2), n = Math.sin(s.rot * Math.PI / 2);
  return out.set(s.x + s.w / 2 + lx * c + lz * n, 0, s.z + s.d / 2 - lx * n + lz * c);
}
function parking(car, dt) {
  const k = car.park, go = Math.atan2(DX[car.b], DZ[car.b]), bay = k.bay != null;
  if (k.phase === 'in') {
    k.u = Math.min(1, k.u + dt / (bay ? 1.3 : 0.9));
    if (k.u >= 1) { k.phase = 'parked'; k.wait = bay ? 4 + Math.random() * 6 : 6 + Math.random() * 9; car.mesh.visible = bay; slots.delete(slotOf(car)); }
  } else if (k.phase === 'parked') {
    k.wait -= dt;
    if (k.wait <= 0 && !slots.has(slotOf(car))) { slots.set(slotOf(car), car); car.mesh.visible = true; k.phase = 'out'; }
  } else {
    k.u = Math.max(0, k.u - dt / (bay ? 1.5 : 1.1));
    if (k.u <= 0) { if (bay) k.s.bays[k.bay] = null; car.park = null; car.called = k.s; return; }
  }
  const e = k.u * k.u * (3 - 2 * k.u);
  along(car, car.t, _p);
  _p.x += Math.cos(go) * LANE; _p.z -= Math.sin(go) * LANE;      // where it left the road
  if (bay) bayPoint(k.s, k.bay, _q); else _q.set(_p.x + Math.cos(go) * 0.95, 0, _p.z - Math.sin(go) * 0.95);
  car.heading = go + e * Math.PI / 2;                            // swing left, towards the building
  car.mesh.position.set(_p.x + (_q.x - _p.x) * e, bay ? 0.018 + e * 0.012 : 0.018, _p.z + (_q.z - _p.z) * e);
  car.mesh.rotation.set(0, car.heading, 0);
}

// Half way along a straight square: if a station forecourt is on the kerb side, a bus or taxi stops.
// The same goes for a service area, where any driver may pull in for a rest, and every car
// stops for a moment at a toll gate.
//   A bus stops at the first square of a forecourt (the bus bay), a taxi at the last (the rank).
//   If the kerb faces the road, the vehicle pulls off the road into the bay while it waits.
const FRONT = [[0, 1], [1, 0], [0, -1], [-1, 0]];               // the way a forecourt's kerb faces, by its turn
const PULL = 0.62;
const facesRoad = (s, car) => FRONT[s.rot][0] === -DZ[car.b] && FRONT[s.rot][1] === DX[car.b];

function callAtKerb(car) {
  if (car.lv || car.b !== opp(car.a)) return;
  const here = sceneryAt(car.x, car.z);
  if (here && here.id === 'toll-gate' && !car.paid) { car.paid = true; car.pause = 0.7; car.pull = 0; return; }
  const lx = DZ[car.b], lz = -DX[car.b];                                 // traffic keeps left, so the kerb is on the left
  const s = sceneryAt(car.x + lx, car.z + lz);
  if (!s || (s.id !== 'station-forecourt' && s.id !== 'service-area' && s.id !== 'car-park')) { car.called = null; return; }
  if (car.called === s) return;                                          // one stop per forecourt
  if (s.id === 'car-park') {
    car.called = s;
    if ((car.kind === 'sedan' || car.kind === 'kei-truck') && Math.random() < 0.45) car.park = { s, phase: 'in', u: 0 };
    return;
  }
  if (s.id === 'service-area') {
    if (facesRoad(s, car) && (car.kind === 'sedan' || car.kind === 'kei-truck' || car.kind === 'taxi')) {
      // a car: is one of the visitors' bays just here, and free? then, sometimes, turn in to it
      along(car, 0.5, _p);
      s.bays = s.bays || [null, null];
      for (let i = 0; i < BAYS.length; i++) {
        bayPoint(s, i, _q);
        if (!s.bays[i] && Math.abs((_q.x - _p.x) * DX[car.b] + (_q.z - _p.z) * DZ[car.b]) < 0.3 && Math.random() < 0.5) { s.bays[i] = car; car.park = { s, phase: 'in', u: 0, bay: i }; return; }
      }
      return;
    }
    car.called = s;                                                      // a bus or lorry stops in the lane along the front
    if (Math.random() < 0.4) { car.pause = 2.5 + Math.random() * 2.5; car.pull = facesRoad(s, car) ? PULL : 0; }
    return;
  }
  if (car.kind !== 'bus' && car.kind !== 'taxi') return;
  if (car.kind === 'taxi' && sceneryAt(car.x + DX[car.b] + lx, car.z + DZ[car.b] + lz) === s) return;   // the rank is further along
  car.called = s;
  if (setDown(s, car.kind === 'bus' ? 8 : 2)) { car.pause = car.kind === 'bus' ? 3.4 : 2.2; car.pull = facesRoad(s, car) ? PULL : 0; }
}

// Reckless drivers only: a train on a crossing knocks any car there off the road.
function trainHits(car) {
  if (settings.careful || car.lv || !hasGates(car.x, car.z)) return false;
  const p = car.mesh.position;
  for (const t of trains) {
    if (t.state !== 'run' || t.v < 0.3) continue;
    for (const c of t.cars) for (const s of c.s) {
      const dx = s.x - p.x, dz = s.z - p.z;
      if (dx * dx + dz * dz > 0.045) continue;
      const push = new THREE.Vector3().subVectors(c.s[0], c.s[2]).setY(0).normalize();
      car.hit = { t: 0, vel: push.multiplyScalar(t.v * 0.8).add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 2.6 + Math.random() * 1.5, (Math.random() - 0.5) * 1.5)), spin: new THREE.Vector3(Math.random() * 8 - 4, Math.random() * 6 - 3, Math.random() * 8 - 4) };
      if (slots.get(slotOf(car)) === car) slots.delete(slotOf(car));
      state.crashes++;
      burst(p); emit('crash', { x: p.x, z: p.z });
      return true;
    }
  }
  return false;
}

function tumble(car, dt) {
  const h = car.hit, m = car.mesh;
  h.t += dt; h.vel.y -= 13 * dt;
  m.position.addScaledVector(h.vel, dt);
  m.rotation.x += h.spin.x * dt; m.rotation.y += h.spin.y * dt; m.rotation.z += h.spin.z * dt;
  if (m.position.y < 0.05) { m.position.y = 0.05; h.vel.y = Math.abs(h.vel.y) > 1 ? -h.vel.y * 0.3 : 0; h.vel.x *= 0.5; h.vel.z *= 0.5; h.spin.multiplyScalar(0.4); }
  if (h.t > 1.8) m.scale.setScalar(Math.max(0.01, 1 - (h.t - 1.8) / 0.4));
  if (h.t > 2.2) scrap(car);
}

export function stepCars(dt) {
  census -= dt;
  if (census <= 0) {                                             // keep the number of cars in step with the roads
    census = 1;
    const roads = squaresOf('road'), want = roads.length < 4 ? 0 : Math.min(MAX_CARS, Math.ceil((roads.length + highway.size) / 6));
    for (const c of [...cars]) if (!c.hit && !c.out && !(c.lv ? isHighway(c.x, c.z) : isRoad(c.x, c.z))) scrap(c);
    for (let i = cars.length - 1; i >= 0 && cars.length > want; i--) if (!cars[i].hit) scrap(cars[i]);
    // new cars: some appear on a road, some drive in from beyond the edge of the board
    const gates = [];
    for (const [x, z] of roads) for (let d = 0; d < 4; d++) if (!inBoard(x + DX[d], z + DZ[d])) gates.push([x, z, d, 0]);
    for (const s of highway.keys()) { const [x, z] = s.split(',').map(Number); for (let d = 0; d < 4; d++) if (!inBoard(x + DX[d], z + DZ[d])) gates.push([x, z, d, 1]); }
    for (let tries = 0; cars.length < want && tries < 6; tries++) {
      if (gates.length && Math.random() < 0.5) makeInbound(...gates[Math.floor(Math.random() * gates.length)]);
      else { const [x, z] = roads[Math.floor(Math.random() * roads.length)]; make(x, z); }
    }
  }
  for (const car of [...cars]) {
    if (car.hit) { tumble(car, dt); continue; }
    if (car.out) { beyond(car, dt); continue; }
    if (car.park) { parking(car, dt); if (car.park) continue; }
    if (car.t >= 1) moveOn(car);
    if (car.pause > 0) car.pause -= dt;                            // standing at a bus stop
    else if (car.t < 1) {
      const was = car.t;
      car.t = Math.min(1, car.t + car.speed * (car.lv && !rampOf(car.x, car.z) ? FAST : 1) * dt / lengthOf(car.a, car.b));
      if (was < 0.5 && car.t >= 0.5) callAtKerb(car);
    }
    along(car, car.t, _p);
    along(car, Math.min(1, car.t + 0.04), _q);
    if (car.t > 0.96) { along(car, car.t - 0.04, _q); _q.subVectors(_p, _q); } else _q.sub(_p);
    const want = _q.lengthSq() > 1e-9 ? Math.atan2(_q.x, _q.z) : car.heading || 0;
    if (car.heading == null) car.heading = want;
    let turn = want - car.heading;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    car.heading += turn * Math.min(1, dt * 12);
    // height: on the ground (over the rails on the crossing boards), or on the highway deck or ramp
    const up = car.lv ? hwY(car.x, car.z, _p.x, _p.z) + 0.012 : hasGates(car.x, car.z) ? 0.062 : 0.018;
    car.side += ((car.pause > 0.55 ? car.pull || 0 : 0) - car.side) * Math.min(1, dt * 5);   // into a bus bay and out again
    const lane = (car.lv ? LANE + 0.03 : LANE) + car.side, climb = car.lv && rampOf(car.x, car.z);
    const tip = climb ? (climb.d === car.b ? 1 : -1) * 0.27 : 0;   // nose down going downhill, up going uphill
    car.pitch += (tip - car.pitch) * Math.min(1, dt * 8);
    // keep left: the lane is to the left of the way the car is facing
    car.mesh.position.set(_p.x + Math.cos(car.heading) * lane, car.lv ? up : car.mesh.position.y + (up - car.mesh.position.y) * Math.min(1, dt * 10), _p.z - Math.sin(car.heading) * lane);
    car.mesh.rotation.set(car.pitch, car.heading, 0);
    trainHits(car);
  }
}

export function clearCars() { for (const c of [...cars]) scrap(c); slots.clear(); }
export const carCount = () => cars.length;
export const carsOnHighway = () => cars.filter(c => c.lv).length;
export const carList = () => cars;

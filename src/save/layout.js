import { G, key, inBoard } from '../core/constants.js';
import { occ, pieces, dirty } from '../tracks/model.js';
import { canRamp, placeRamp, clearTracks } from '../tracks/edit.js';
import { flush } from '../tracks/render.js';
import { trains } from '../trains/store.js';
import { spawnTrain } from '../trains/runtime.js';
import { clearEffects } from '../trains/crash.js';
import { placed, placeScenery, clearScenery } from '../scenery/placed.js';
import { clearPassengers } from '../city/passengers.js';
import { clearPeople } from '../city/people.js';
import { state } from '../core/state.js';
import { terrain, setTerrain, clearTerrain } from '../terrain/model.js';
import { highway, setHighway, clearHighway } from '../terrain/highway.js';
import { clearCars } from '../roads/cars.js';
import { clearCrossings } from '../roads/crossings.js';
import { clearStaff } from '../city/staff.js';
import { SERVICES } from '../trains/service.js';
import { noteMate } from '../trains/autocouple.js';
import { forgetStationNames } from '../tracks/features/station.js';

// Turning the board into plain data and back, for saving, undo and sharing.
//   flat piece  [0, x, z, level, ports, switch, station, signal, waiting, arrivals, buildings grown, coupling station, station building, station name, switch takes turns]
//               (trailing zeros left off; waiting, arrivals and grown are kept on a station's first square)
//   ramp        [1, x, z, level, dir]
//   train       [type, x, z, level, homeX, homeZ, homeLevel, service, mate]
//   scenery     [id, x, z, rot, seed]
//   ground      { water: [x, z, x, z, ...], hill: [...], road: [...], roadbridge: [...], highway: [...], highway2: [...], highway3: [...] }
export function serialize() {
  return {
    v: 2,
    g: G,                                               // board size the coordinates belong to
    carried: state.carried,
    pieces: [...pieces].map(p => {
      if (p.type === 'ramp') return [1, p.x, p.z, p.l, p.dir];
      const a = [0, p.x, p.z, p.l, p.ports, p.sw | 0, p.st | 0, p.sig | 0, p.pax | 0, p.del | 0, p.grown | 0, p.cpl | 0, p.hall | 0, p.nm | 0, p.alt | 0];
      while (a.length > 5 && a[a.length - 1] === 0) a.pop();
      return a;
    }),
    trains: trains.map(t => { const p = t.segs[0].p; return [t.type, p.x, p.z, p.l, t.home.x, t.home.z, t.home.l, t.service, t.mate | 0]; }),
    scenery: [...placed.values()].map(s => [s.id, s.x, s.z, s.rot, s.seed]),
    ground: groundData(),
  };
}

function groundData() {
  const out = {};
  for (const [s, kind] of terrain) (out[kind] || (out[kind] = [])).push(...s.split(',').map(Number));
  for (const [s, L] of highway) (out[L === 1 ? 'highway' : 'highway' + L] || (out[L === 1 ? 'highway' : 'highway' + L] = [])).push(...s.split(',').map(Number));
  return out;
}

export function clearWorld() {
  clearCars(); clearCrossings();
  clearTracks();
  forgetStationNames();
  clearHighway();
  clearTerrain();
  clearScenery();
  clearEffects();
  clearPassengers(); clearPeople();
  clearStaff();
}

export function load(data) {
  clearWorld();
  state.carried = data.carried | 0;
  // A layout made on a smaller board is placed in the middle of this one.
  const from = data.g || 24, o = Math.max(0, Math.floor((G - from) / 2));
  for (const kind in data.ground || {}) {
    const a = data.ground[kind];
    for (let i = 0; i + 1 < a.length; i += 2) { if (kind.startsWith('highway')) setHighway(a[i] + o, a[i + 1] + o, +kind.slice(7) || 1); else setTerrain(a[i] + o, a[i + 1] + o, kind); }
  }
  for (const a of data.pieces || []) {
    const x = a[1] + o, z = a[2] + o;
    if (a[0] === 0) {
      if (!inBoard(x, z) || occ.has(key(x, z, a[3]))) continue;
      const p = { type: 'flat', x, z, l: a[3], ports: a[4] & 15, sw: (a[5] | 0) % 3, st: (a[6] | 0) % 3, sig: (a[7] | 0) % 3, pax: a[8] | 0, del: a[9] | 0, grown: a[10] | 0, cpl: a[11] ? 1 : 0, hall: a[12] ? 1 : 0, nm: a[13] | 0, alt: a[14] ? 1 : 0 };
      if (data.v !== 2) p.sw = 0;                       // the first prototype stored a counter here
      occ.set(key(p.x, p.z, p.l), p); pieces.add(p); dirty.add(p);
    } else {
      const r = { x, z, l: a[3], dir: a[4] & 3 };
      if (canRamp(r)) placeRamp(r, false);
    }
  }
  flush();
  for (const s of data.scenery || []) placeScenery(s[0], s[1] + o, s[2] + o, s[3] | 0, s[4] | 0);
  for (const t of data.trains || []) {
    const p = occ.get(key(t[1] + o, t[2] + o, t[3]));
    const tr = p && spawnTrain(t[0], p, t.length >= 7 ? { x: t[4] + o, z: t[5] + o, l: t[6] } : null, SERVICES[t[7]] ? t[7] : null);
    if (tr && t[8]) { tr.mate = t[8] | 0; noteMate(tr.mate); }
  }
}

export { starter } from './starter.js';

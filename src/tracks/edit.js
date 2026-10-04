import { DX, DZ, opp, key, bits, dirs, inBoard, dirBetween } from '../core/constants.js';
import { occ, pieces, dirty, eff, findAtPort, notifyTrack } from './model.js';
import { rampPort, rampKeys, rampFits } from './pieces/ramp.js';
import { throughRoute } from './pieces/junction.js';
import { disposePiece } from './render.js';
import { stationGroup } from './features/station.js';
import { trains, trainsOn } from '../trains/store.js';
import { removeTrain } from '../trains/runtime.js';
import { removeSceneryAt, staysOverTrack } from '../scenery/placed.js';
import { isHill, markTerrain } from '../terrain/model.js';
import { blocksTrack } from '../terrain/highway.js';
import { isRoadBridge } from '../terrain/model.js';
import { removeUnder } from '../scenery/placed.js';

// Changing the layout: laying track, building ramps, lifting pieces.

// Scenery cannot share a square with track, on any level. The one exception is a raised
// walkway, which may cross plain track on the ground.
function clearGround(x, z, l) { if (!(l === 0 && staysOverTrack(x, z))) removeSceneryAt(x, z); }

// A piece changed shape: its platform neighbours may need a new name sign.
function touch(p) {
  if (p.st) for (const q of stationGroup(p)) dirty.add(q);      // the whole station may change its look
  dirty.add(p);
}

export function canPort(x, z, d, l) {
  if (!inBoard(x, z)) return false;
  if (l >= 1 && isHill(x, z)) return false;              // raised track cannot cross a hill; go through it at ground level
  if (blocksTrack(x, z, l)) return false;                // the highway is on this level here, or a ramp of it comes down through it
  if (l === 0 && isRoadBridge(x, z)) return false;       // a road bridge has the river crossing here
  const p = occ.get(key(x, z, l));
  if (!p || p.type === 'flat') return true;
  return !!findAtPort(x, z, d, l);
}

export function addPort(x, z, d, l) {
  let p = occ.get(key(x, z, l));
  if (!p) {
    p = { type: 'flat', x, z, l, ports: 0, sw: 0, st: 0, sig: 0, pax: 0, del: 0, grown: 0 };
    occ.set(key(x, z, l), p); pieces.add(p);
    clearGround(x, z, l);
  }
  if (p.type === 'flat') {
    const was = bits(p.ports);
    if (d >= 0) p.ports |= 1 << d;
    if (was < 3 && bits(p.ports) === 3) p.sw = throughRoute(p.ports);     // a new junction starts set for the through line
    touch(p);
  }
  return p;
}

// Join two neighbouring squares with rail.
export function connect(ax, az, bx, bz, l) {
  const d = dirBetween(ax, az, bx, bz);
  if (d < 0) return false;
  if (!canPort(ax, az, d, l) || !canPort(bx, bz, opp(d), l)) return false;
  addPort(ax, az, d, l); addPort(bx, bz, opp(d), l);
  return true;
}

// Ramps cannot be cut into a hill.
export const canRamp = r => rampFits(r, occ) && !(isHill(r.x, r.z) || isHill(r.x + DX[r.dir], r.z + DZ[r.dir]))
  && ![[r.x, r.z], [r.x + DX[r.dir], r.z + DZ[r.dir]]].some(([x, z]) => blocksTrack(x, z, r.l) || blocksTrack(x, z, r.l + 1));

export function placeRamp(r, join) {
  const p = { type: 'ramp', x: r.x, z: r.z, l: r.l, dir: r.dir };
  for (const k of rampKeys(p)) occ.set(k, p);
  pieces.add(p); dirty.add(p);
  clearGround(p.x, p.z, -1); clearGround(p.x + DX[p.dir], p.z + DZ[p.dir], -1);
  if (join) for (let e = 0; e < 2; e++) {               // reach out to flat track at either end
    const q = rampPort(p, e), n = occ.get(key(q.x + DX[q.d], q.z + DZ[q.d], q.l));
    if (n && n.type === 'flat') {
      const was = bits(n.ports);
      n.ports |= 1 << opp(q.d);
      if (was < 3 && bits(n.ports) === 3) n.sw = throughRoute(n.ports);
      touch(n);
    }
  }
  return p;
}

export function erasePiece(p) {
  trainsOn(p).forEach(removeTrain);
  const ends = p.type === 'flat'
    ? dirs(eff(p.ports)).map(d => ({ x: p.x, z: p.z, d, l: p.l }))
    : [rampPort(p, 0), rampPort(p, 1)];
  const platforms = p.st ? stationGroup(p).filter(q => q !== p) : [];
  if (p.type === 'flat') occ.delete(key(p.x, p.z, p.l)); else for (const k of rampKeys(p)) occ.delete(k);
  pieces.delete(p); dirty.delete(p);
  disposePiece(p);
  notifyTrack(p);
  if (p.type === 'flat' && p.l === 1) removeUnder(p.x, p.z);              // the shops under this piece go with it
  if (p.type === 'flat' && p.l === 0 && isHill(p.x, p.z)) markTerrain();   // the hill closes over the old tunnel
  for (const q of platforms) dirty.add(q);
  for (const q of ends) {                                // tidy a neighbouring junction back to plain track
    const n = occ.get(key(q.x + DX[q.d], q.z + DZ[q.d], q.l));
    if (n && n.type === 'flat' && (n.ports >> opp(q.d) & 1) && bits(n.ports) >= 3) { n.ports &= ~(1 << opp(q.d)); touch(n); }
  }
}

export function clearTracks() {
  trains.slice().forEach(removeTrain);
  for (const p of pieces) disposePiece(p);
  pieces.clear(); occ.clear(); dirty.clear();
}

// Lay track through a list of corner squares, for the starter layout.
export function lay(pts, l) {
  for (let i = 0; i < pts.length - 1; i++) {
    let x = pts[i][0], z = pts[i][1];
    const tx = pts[i + 1][0], tz = pts[i + 1][1];
    while (x !== tx || z !== tz) {
      const nx = x + Math.sign(tx - x), nz = nx === x ? z + Math.sign(tz - z) : z;
      connect(x, z, nx, nz, l);
      x = nx; z = nz;
    }
  }
}

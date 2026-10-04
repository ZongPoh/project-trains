import * as THREE from 'three';
import { DX, DZ, opp, dirs, RAMP_LEN } from '../core/constants.js';
import { eff, findAtPort, dirty } from './model.js';
import { STRAIGHT_LEN, straightAt } from './pieces/straight.js';
import { CURVE_LEN, curveAt } from './pieces/curve.js';
import { rampAt, rampPort } from './pieces/ramp.js';
import { chooseRoute, junctionRoutes, passedAlternating } from './pieces/junction.js';
import { isStation, stationRun, stationPieces, stationId } from './features/station.js';
import { pieceBusy } from '../trains/store.js';
import { crossingExit } from './pieces/crossing.js';
import { stopsAt } from '../trains/service.js';
import { mateWaiting } from '../trains/autocouple.js';

// A path segment is one run of rail through a piece, from end a to end b: { p, a, b, len }.
// Trains are a list of the segments they are standing on.

export function makeSeg(p, a, b) {
  if (p.type === 'ramp') return { p, a, b, len: RAMP_LEN };
  return { p, a, b, len: b === opp(a) ? STRAIGHT_LEN : CURVE_LEN };
}

export function segAt(s, t, out) {
  const p = s.p;
  if (p.type === 'ramp') return rampAt(p, s.a, t, out);
  return s.b === opp(s.a) ? straightAt(p, s.a, t, out) : curveAt(p, s.a, s.b, t, out);
}

const _ta = new THREE.Vector3(), _tb = new THREE.Vector3();
export function segTan(s, t, out) {
  segAt(s, Math.max(0, t - 0.002), _ta);
  segAt(s, Math.min(1, t + 0.002), _tb);
  return out.subVectors(_tb, _ta).normalize();
}

export const segExit = s => s.p.type === 'flat' ? { x: s.p.x, z: s.p.z, d: s.b, l: s.p.l } : rampPort(s.p, s.b);
export const segEntry = s => s.p.type === 'flat' ? { x: s.p.x, z: s.p.z, d: s.a, l: s.p.l } : rampPort(s.p, s.a);

// Finding a platform. Following the line on from this segment, what is the first platform like?
// Returns null if there is none near, or { busy, station, p, mate }:
//   busy     a train is standing at that platform
//   station  identifies the whole station, so two platforms can be told to be side by side
//   p        a square of the platform
//   mate     the train this one couples to is waiting there (see trains/autocouple.js)
function platformAhead(seg, depth, tr) {
  let s = seg;
  for (let n = 0; n < 16; n++) {
    if (isStation(s.p)) {
      const run = stationRun(s.p), m = tr && tr.mate ? mateWaiting(tr) : null;
      return {
        busy: stationPieces(run.first).some(q => pieceBusy(q, tr || null)), station: stationId(s.p), p: s.p,
        mate: !!m && stationRun(m.segs[0].p).id === run.id,
      };
    }
    s = nextSeg(s, false, depth + 1);
    if (!s) return null;
  }
  return null;
}

// The segment a train takes through piece p when it comes in at end a.
// With commit, a junction that gets pushed over by the train keeps its new setting.
//   A train running straight up to a junction normally follows the switch. Where both ways lead
//   to platforms of the same station, the train chooses for itself:
//     a train that is being coupled goes to the platform where its partner waits;
//     a local that stops here takes the loop platform, leaving the through line clear;
//     any other train keeps to the through line;
//     and every train avoids a platform that has a train standing at it, if the other is free.
//   This is what lets several trains share a station, and fast trains overtake slow ones.
export function enter(p, a, commit, depth = 0, heading = null) {
  if (p.type === 'ramp') return makeSeg(p, a, 1 - a);
  const m = eff(p.ports), outs = dirs(m & ~(1 << a));
  if (outs.length === 1) return makeSeg(p, a, outs[0]);
  if (outs.length === 3) return makeSeg(p, a, crossingExit(a));
  let r = chooseRoute(p, m, a, heading);
  // an alternating switch whose turn it is for the branch: if a train is already down there, go straight on this time
  if (p.alt && heading && (m >> opp(a) & 1) && r.b !== opp(a) && branchBusy(p, a, r.b, heading)) r = { b: opp(a), index: junctionRoutes(m).findIndex(q => q.includes(a) && q.includes(opp(a))) };
  if (depth < 2 && (m >> opp(a) & 1)) {                 // on the through line, so there is a real choice
    const straight = opp(a), side = outs.find(d => d !== straight);
    const S = platformAhead(makeSeg(p, a, straight), depth, heading), D = platformAhead(makeSeg(p, a, side), depth, heading);
    // only two platforms of the same station count: never a branch that leads somewhere else
    if (S && D && S.station === D.station) {
      let b = null;
      if (D.mate) b = side;
      else if (S.mate) b = straight;
      else if (heading && heading.service) {
        const loop = heading.service === 'local' && stopsAt(heading, S.p);
        const first = loop ? D : S, second = loop ? S : D;
        b = !first.busy ? (loop ? side : straight) : !second.busy ? (loop ? straight : side) : null;
      } else {
        const mine = r.b === straight ? S : D, alt = r.b === straight ? D : S;
        if (mine.busy && !alt.busy) b = r.b === straight ? side : straight;
      }
      if (b != null && b !== r.b) r = { b, index: junctionRoutes(m).findIndex(q => q.includes(a) && q.includes(b)) };
    }
  }
  if (commit && r.index !== (p.sw | 0) % 3) { p.sw = r.index; dirty.add(p); }
  if (commit) passedAlternating(p, m, a, r.b, heading);
  return makeSeg(p, a, r.b);
}

// Is another train somewhere along the line that leaves junction p by side d?
function branchBusy(p, a, d, train) {
  let s = makeSeg(p, a, d);
  for (let n = 0; n < 48; n++) {
    s = nextSeg(s, false, 2, null);
    if (!s || s.p === p) return false;
    if (pieceBusy(s.p, train)) return true;
  }
  return false;
}

// `heading` is the train that is asking, when one is (it carries the way it has been going).
export function nextSeg(s, commit, depth = 0, heading = null) {
  const e = segExit(s), f = findAtPort(e.x + DX[e.d], e.z + DZ[e.d], opp(e.d), e.l);
  return f ? enter(f.p, f.end, commit, depth, heading) : null;
}

// The segment behind this one, used to lay a train's cars out along the track behind its head.
export function prevSeg(s) {
  const e = segEntry(s), f = findAtPort(e.x + DX[e.d], e.z + DZ[e.d], opp(e.d), e.l);
  if (!f) return null;
  if (f.p.type === 'ramp') return makeSeg(f.p, 1 - f.end, f.end);
  const ds = dirs(eff(f.p.ports) & ~(1 << f.end));
  if (!ds.length) return null;
  return makeSeg(f.p, ds.includes(opp(f.end)) ? opp(f.end) : ds[0], f.end);
}

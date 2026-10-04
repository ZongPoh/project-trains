import * as THREE from 'three';
import { GAP, RAIL_TOP, CAR_PITCH, dirs } from '../core/constants.js';
import { trainGroup } from '../core/stage.js';
import { emit } from '../core/events.js';
import { settings } from '../core/settings.js';
import { eff } from '../tracks/model.js';
import { makeSeg, segAt, enter, nextSeg, prevSeg } from '../tracks/paths.js';
import { isRed } from '../tracks/features/signal.js';
import { isStation, stationRun, stationAcross, stationName } from '../tracks/features/station.js';
import { trainDef } from './index.js';
import { trains } from './store.js';
import { release, claim, blocker, headOn } from './driving.js';
import { stopsAt, overtaker, defaultService } from './service.js';
import { mateWaiting, mateComing, wantsSplit } from './autocouple.js';

// How trains sit on the track and move along it.
//   train: { type, segs, d, v, speed, cars, total, home, state, ... }
//   segs  = the path segments the train is standing on, head first
//   d     = how far the head is along segs[0]
const ACCEL = 2.4;      // squares per second, per second
const BRAKE = 5;
const DWELL = 3.4;      // seconds stopped at a station
const DWELL_TERMINAL = 7;   // at a terminal of four tracks or more, while the cleaning crew goes through
export const MELODY = 2.3;  // the conductor checks the doors this long before the train leaves (a melody used to play here)
const HOLD_PASS = 12;   // the longest a train waits at a platform to be overtaken
const HOLD_MATE = 22;   // the longest it waits for the train it couples to
const LOOK = 6;         // how far ahead a driver looks for stations, signals and other trains
const STANDOFF = 2.5;   // seconds two trains wait nose to nose before one turns back
const SIGNAL_PATIENCE = 14;   // seconds a train waits at an automatic signal before turning back

const V3 = THREE.Vector3;
const _pf = new V3(), _pr = new V3();

// Put a train on a piece of track, with its cars laid out behind the head.
export function seat(tr, p) {
  const seg = p.type === 'ramp' ? makeSeg(p, 0, 1) : enter(p, dirs(eff(p.ports))[0], false);
  tr.segs = [seg]; tr.d = seg.len * 0.5; tr.flipped = false; tr.stuck = false;
  tr.v = 0; tr.wait = 0; tr.lastStation = null;
  let avail = tr.d, guard = 0;
  while (avail < tr.total + 0.3 && guard++ < 80) {
    const s = prevSeg(tr.segs[tr.segs.length - 1]);
    if (!s) break;
    tr.segs.push(s); avail += s.len;
  }
  if (avail < tr.total) {                             // not enough track behind: nudge the train forward
    let need = tr.total - avail; guard = 0;
    while (need > 0 && guard++ < 80) {
      const cur = tr.segs[0], room = cur.len - tr.d;
      if (need <= room) { tr.d += need; break; }
      need -= room;
      const n = nextSeg(cur, false);
      if (!n) { tr.d = cur.len; break; }
      tr.segs.unshift(n); tr.d = 0;
    }
  }
  placeCars(tr);
}

// Build a train and its cars, not yet on the track.
export function makeTrain(type, home) {
  const def = trainDef(type);
  if (!def) return null;
  const tr = {
    type: def.id,
    units: def.units ? def.units.map(u => u.id) : null,   // set when two trains are coupled
    segs: [], d: 0, v: 0, speed: def.speed, flipped: false, stuck: false,
    cars: [], total: 0,
    state: 'run',            // 'run' or 'crashed'
    ghost: 0,                // seconds of blinking protection after a respawn
    wait: 0, lastStation: null, atStation: null,
    service: defaultService(def.id),   // local, express or through: see service.js
    mate: 0,                 // shared by two trains that a coupling station split, so they join again
    pax: 0,                  // passengers on board
    blockT: 0, claims: [],
    home,
  };
  let off = 0;
  for (const c of def.cars) {
    const mesh = c.make();
    trainGroup.add(mesh);
    tr.cars.push({ mesh, len: c.len, top: c.top || 0.25, c: off + c.len / 2, s: [new V3(), new V3(), new V3()] });
    off += c.len + GAP;
  }
  tr.total = off - GAP;
  return tr;
}

export function spawnTrain(type, p, home, service) {
  if (!p) return null;
  const tr = makeTrain(type, home || { x: p.x, z: p.z, l: p.l });
  if (!tr) return null;
  if (service) tr.service = service;
  seat(tr, p);
  trains.push(tr);
  return tr;
}

// Uncouple a coupled train where it stands. The set at the front keeps going; the one behind
// waits a moment, then follows as a train of its own.
export function splitTrain(tr) {
  if (!tr.units || tr.state !== 'run') return null;
  const [first, second] = tr.flipped ? [tr.units[1], tr.units[0]] : tr.units;
  const lead = makeTrain(first, tr.home), rear = makeTrain(second, null);
  lead.segs = tr.segs.slice(); lead.d = tr.d; lead.flipped = tr.flipped; lead.lastStation = tr.lastStation;
  let i = 0, avail = tr.d, rem = lead.total + GAP;            // find where the second set's nose is
  while (rem > avail && i < tr.segs.length - 1) { rem -= avail; i++; avail = tr.segs[i].len; }
  rear.segs = tr.segs.slice(i); rear.d = Math.max(0, avail - rem); rear.flipped = tr.flipped;
  rear.lastStation = rear.atStation = tr.lastStation; rear.wait = 1.8; rear.sung = true;
  lead.service = rear.service = tr.service; lead.pax = Math.ceil((tr.pax | 0) / 2); rear.pax = (tr.pax | 0) - lead.pax;
  const hp = rear.segs[0].p;
  rear.home = { x: hp.x, z: hp.z, l: hp.l };
  const at = trains.indexOf(tr);
  removeTrain(tr);
  trains.splice(at, 0, lead, rear);
  placeCars(lead); placeCars(rear);
  return [lead, rear];
}

export function removeTrain(tr) {
  release(tr);
  for (const c of tr.cars) { trainGroup.remove(c.mesh); c.mesh.geometry.dispose(); }
  const i = trains.indexOf(tr);
  if (i >= 0) trains.splice(i, 1);
}

// Length of track the train currently has under and behind it.
export function trailLen(tr) {
  let a = tr.d;
  for (let i = 1; i < tr.segs.length; i++) a += tr.segs[i].len;
  return a;
}

// The point this far behind the front of the train.
function pointBack(tr, back, out) {
  const segs = tr.segs;
  let i = 0, avail = tr.d, rem = Math.max(0, back);
  while (rem > avail) {
    if (i >= segs.length - 1) { rem = avail; break; }
    rem -= avail; i++; avail = segs[i].len;
  }
  return segAt(segs[i], (avail - rem) / segs[i].len, out);
}

export function placeCars(tr) {
  for (const c of tr.cars) {
    const off = tr.flipped ? tr.total - c.c : c.c, bog = c.len * 0.3;
    pointBack(tr, off - bog, _pf); pointBack(tr, off + bog, _pr);
    c.mesh.position.set((_pf.x + _pr.x) / 2, (_pf.y + _pr.y) / 2 + RAIL_TOP, (_pf.z + _pr.z) / 2);
    const t = tr.flipped ? _pr : _pf;
    if (_pf.distanceToSquared(_pr) > 1e-8) c.mesh.lookAt(t.x, t.y + RAIL_TOP, t.z);
    c.s[0].copy(_pf); c.s[1].copy(c.mesh.position); c.s[2].copy(_pr);     // used to detect collisions
    c.s[0].y += RAIL_TOP; c.s[2].y += RAIL_TOP;
  }
  // the way the train as a whole is heading, from its last car to its first: used at junctions
  const n = tr.cars.length, lead = tr.cars[tr.flipped ? n - 1 : 0].mesh.position, tail = tr.cars[tr.flipped ? 0 : n - 1].mesh.position;
  const hx = lead.x - tail.x, hz = lead.z - tail.z, hl = Math.hypot(hx, hz) || 1;
  tr.hx = hx / hl; tr.hz = hz / hl;
}

// Run back the other way: at the end of the line, or where the train stands (atEnd false).
export function reverseTrain(tr, atEnd) {
  const segs = tr.segs;
  tr.d = atEnd ? segs[0].len : Math.min(tr.d, segs[0].len);
  let i = 0, avail = tr.d, rem = tr.total, short = false;
  while (rem > avail) {
    if (i >= segs.length - 1) { rem = avail; short = true; break; }
    rem -= avail; i++; avail = segs[i].len;
  }
  const u = avail - rem, ns = [];
  for (let k = i; k >= 0; k--) ns.push(makeSeg(segs[k].p, segs[k].b, segs[k].a));
  tr.segs = ns; tr.d = ns[0].len - u; tr.flipped = !tr.flipped; tr.v = 0;
  if (short && atEnd) tr.stuck = true;
}

// Coming up behind train `o` along segment `seg`: how far is it from the start of that segment
// to a coupling gap behind o's last car? null if o is not standing on that piece.
function tailRoom(o, seg) {
  let acc = o.d;
  for (let k = 0; k < o.segs.length; k++) {
    if (k > 0) acc += o.segs[k].len;
    if (o.segs[k].p === seg.p) return o.segs[k].a === seg.a ? acc - o.total - GAP : null;
  }
  return null;
}

// Trains waiting on each other in a circle, starting with this one: [tr, the one it waits for,
// the one that one waits for, ...]. null if the chain does not come back round.
function ringOf(tr, by) {
  const ring = [tr];
  for (let cur = by, n = 0; n < 12; n++) {
    if (cur === tr) return ring;
    if (!cur || cur.state !== 'run' || cur.v >= 0.05 || ring.includes(cur)) return null;
    ring.push(cur);
    cur = cur.blockedBy;
  }
  return null;
}
const FOLLOW_GAP = 0.3;   // how close one train in a convoy runs behind the next

// How far short of the end of a platform a train stops. A single set stops with its middle at
// the middle of the platform, which puts its doors on the marks (see doorSpots in station.js).
// A coupled pair is moved a little so that the doors of its front set are on the marks.
function stopShort(tr, len) {
  const centred = Math.max(0, (len - tr.total) / 2);
  if (!tr.units || !centred) return centred;
  const n = tr.cars.length / 2, front = tr.flipped ? tr.cars.slice(n) : tr.cars.slice(0, n);
  const set = front.reduce((a, c) => a + c.len, 0) + (n - 1) * GAP, off = (tr.total - set) / 2;   // front set's middle, ahead of the train's middle
  const nudge = Math.round(off / CAR_PITCH) * CAR_PITCH - off;                                      // forward to the nearest set of marks
  return Math.max(0, centred - nudge);
}

// Look along the line for the nearest place this train has to stop: a station it has not served
// yet, a signal at red, or (with careful driving) another train. Returns { kind, dist } or null.
// On the way it claims the pieces it needs to stop in, so other drivers keep out of them.
function scanAhead(tr) {
  let seg = tr.segs[0], dist = seg.len - tr.d;
  const reach = tr.v * tr.v / (2 * BRAKE) + 0.9;
  // the train this one is about to couple to, standing at a platform ahead: run up to its tail
  const mate = mateWaiting(tr);
  let room = mate ? tailRoom(mate, seg) : null;
  if (room != null) return { kind: 'mate', dist: room - tr.d, by: mate };
  // in a convoy: follow the train ahead at a set distance from its tail, wherever that is,
  // instead of waiting for it to clear a whole piece (see ringOf above)
  const lead = tr.convoy && tr.convoy.state === 'run' && trains.includes(tr.convoy) ? tr.convoy : (tr.convoy = null);
  let follow = null, seen = false;
  if (lead && (room = tailRoom(lead, seg)) != null) { follow = { kind: 'train', dist: room - tr.d - FOLLOW_GAP, by: lead, follow: true }; seen = true; }
  for (let n = 0; n < 16 && dist < LOOK; n++) {
    const nx = nextSeg(seg, false, 0, tr);
    let stop = null;
    if (isStation(seg.p) && (!nx || !isStation(nx.p))) {            // the far end of a platform
      const run = stationRun(seg.p);
      if (run.id !== tr.lastStation && stopsAt(tr, seg.p)) stop = { kind: 'station', run, p: seg.p, dist: dist - stopShort(tr, run.len) };
    }
    if (!nx) return stop && !(follow && follow.dist < stop.dist) ? stop : follow || stop;
    if (mate && (room = tailRoom(mate, nx)) != null) return { kind: 'mate', dist: dist + room, by: mate };
    if (lead && !follow && (room = tailRoom(lead, nx)) != null) { follow = { kind: 'train', dist: dist + room - FOLLOW_GAP, by: lead, follow: true }; seen = true; }
    if (follow && dist > follow.dist + FOLLOW_GAP) return stop && stop.dist < follow.dist ? stop : follow;   // nothing beyond its tail matters
    let b = blocker(nx, tr);
    if (b && follow && b.tr === lead) b = null;                    // the piece is taken by the train being followed: the gap rule covers it
    if (b && (!stop || dist - 0.15 < stop.dist)) stop = { kind: 'train', dist: dist - 0.15, by: b.tr, headOn: headOn(nx, b), follow: b.seg.a === nx.a && b.seg.b === nx.b && b.tr.segs.includes(b.seg) };
    if (!stop && nx.p.sig && isRed(nx, tr)) stop = { kind: 'signal', dist: dist - 0.04, auto: nx.p.sig === 1 };
    if (stop) return follow && follow.dist < stop.dist ? follow : stop;
    if (settings.careful && dist < reach) claim(nx, tr);
    seg = nx; dist += nx.len;
  }
  if (lead && !seen) tr.convoy = null;                             // the train ahead has got away: back to normal driving
  return follow;
}

const headAt = tr => { const m = tr.cars[tr.flipped ? tr.cars.length - 1 : 0].mesh.position; return { x: m.x, z: m.z }; };

// Why a train that is ready to leave should stay a little longer, if it should:
//   'pass'  a faster service is coming up behind and will overtake here
//   'mate'  the train it couples to is on its way in
function holdReason(tr) {
  if (mateComing(tr)) return tr.held < HOLD_MATE ? 'mate' : null;
  return tr.held < HOLD_PASS && overtaker(tr) ? 'pass' : null;
}

export function stepTrain(tr, dt) {
  release(tr);
  if (tr.state !== 'run' || tr.stuck || tr.splitNow || tr.joinTo) return;
  if (tr.wait > 0) {                                  // standing at a platform
    tr.wait -= dt; tr.dwellT = (tr.dwellT || 0) + dt;
    if (tr.atStation && !tr.sung && tr.wait <= MELODY) {
      tr.holding = isStation(tr.segs[0].p) ? holdReason(tr) : null;
      if (tr.holding) { tr.held += 0.4; tr.wait = MELODY + 0.4; return; }     // look again in a moment
      tr.sung = true;
      if (isStation(tr.segs[0].p)) emit('melody', { ...headAt(tr), name: stationName(tr.segs[0].p)[1], train: tr });
    }
    if (tr.wait > 0) return;
    tr.wait = 0; tr.lastStation = tr.atStation;
    if (tr.atStation && wantsSplit(tr)) { tr.splitNow = true; return; }       // a coupling station: uncouple here (autocouple.js)
    if (tr.atStation) emit('depart', { ...headAt(tr), train: tr });
  }
  const stop = scanAhead(tr);
  tr.why = stop ? stop.kind + (stop.by ? ' ' + stop.by.type + (stop.headOn ? ' head-on' : '') : '') : '';   // for looking at in the console
  let vmax = tr.speed;
  if (stop) vmax = Math.min(vmax, Math.max(0.3, Math.sqrt(2 * BRAKE * Math.max(0, stop.dist))));
  tr.v = tr.v < vmax ? Math.min(vmax, tr.v + ACCEL * dt) : vmax;
  let move = tr.v * dt;
  if (stop) {
    if (stop.dist <= 0.012) {
      tr.v = 0; move = 0;
      if (stop.kind === 'station') {
        tr.wait = stationAcross(stop.p).list.length >= 4 ? DWELL_TERMINAL : DWELL;
        tr.atStation = stop.run.id; tr.sung = false; tr.held = 0; tr.dwellT = 0; tr.holding = null;
        emit('arrive', { ...headAt(tr), station: stop.run.id, train: tr, first: stop.run.first });
      } else if (stop.kind === 'mate') {
        tr.joinTo = stop.by;                           // nose to tail with its partner: autocouple.js joins them
      } else if (stop.kind === 'train' && stop.by.v < 0.05 && !tr.convoy) {
        // nose to nose, or part of a circle of trains each waiting for the next
        const ring = stop.headOn ? null : ringOf(tr, stop.by);
        if (stop.headOn || ring) tr.blockT += dt;
        if (ring && stop.follow && ring.every(m => m === tr || m.blockFollow)) {
          // all running the same way, nose to tail: nobody can move until somebody does. Let them
          // all move off together, each keeping a set distance behind the next.
          if (tr.blockT > 2) for (const m of ring) { m.convoy = m === tr ? stop.by : m.blockedBy; m.blockT = 0; }
        } else if (tr.blockT > (stop.headOn ? STANDOFF : STANDOFF * 3)) {
          // otherwise somebody has to back away: with two trains both do, in a bigger circle just the first
          if (stop.headOn || ring.length === 2 || ring.every(m => trains.indexOf(tr) <= trains.indexOf(m))) { tr.blockT = 0; reverseTrain(tr, false); placeCars(tr); }
        }
      }
      else if (stop.kind === 'signal' && stop.auto) {
        tr.blockT += dt;                               // an automatic signal that never clears: give up and go back
        if (tr.blockT > SIGNAL_PATIENCE) { tr.blockT = 0; reverseTrain(tr, false); placeCars(tr); }
      }
      tr.blockedBy = stop.kind === 'train' ? stop.by : null; tr.blockFollow = !!stop.follow;
    } else move = Math.min(move, stop.dist);
  }
  if (move <= 0) return;
  tr.blockT = 0; tr.blockedBy = null;

  tr.d += move;
  let guard = 0;
  while (tr.d > tr.segs[0].len && guard++ < 12) {
    const cur = tr.segs[0], n = nextSeg(cur, true, 0, tr);
    if (!n) { reverseTrain(tr, true); break; }
    tr.d -= cur.len; tr.segs.unshift(n);
  }
  let acc = tr.d, i = 0;
  while (i < tr.segs.length - 1 && acc < tr.total + 0.6) { i++; acc += tr.segs[i].len; }
  tr.segs.length = i + 1;
  if (!isStation(tr.segs[0].p)) { tr.lastStation = null; tr.joinedAt = null; }
  placeCars(tr);
}

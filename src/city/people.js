import * as THREE from 'three';
import { C } from '../core/colors.js';
import { DX, DZ, WALK, key } from '../core/constants.js';
import { sceneryGroup } from '../core/stage.js';
import { placed, sceneryAt, walkLinks, sceneryVersion } from '../scenery/placed.js';
import { isRoad } from '../terrain/model.js';
import { occ } from '../tracks/model.js';

// People who walk. Every walker is one small figure that goes from point to point at walking
// pace; all of them are drawn in two batches (bodies and heads), so hundreds cost very little.
//   Passengers: passengers.js sends people along the platform to their place in the queue,
//   from the queue into the train, and from the train to the way out (addWalker).
//   Pedestrians: people appear by themselves on raised walkways, pedestrian decks and
//   footbridges, climb the stairs, walk from square to square, and go down again.
const MAX = 480, PACE = 0.5;
const COATS = ['#d94f3d', '#2f6fb0', '#e0b02c', '#3f8f6b', '#7a4fa3', '#e07a2c', '#2b3a4a', '#d96c9a', '#f0efe9'].map(C);
const SKIN = ['#f1c9a5', '#e0ac7e', '#c98d62'].map(C);
export const coatOf = n => COATS[Math.floor(Math.abs(n)) % COATS.length];
export const skinOf = n => SKIN[Math.floor(Math.abs(n)) % SKIN.length];

const bodyGeo = new THREE.CylinderGeometry(0.017, 0.025, 0.092, 7).translate(0, 0.046, 0);
const headGeo = new THREE.SphereGeometry(0.024, 7, 5).translate(0, 0.115, 0);
const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 }), MAX);
const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 }), MAX);
for (const m of [bodies, heads]) {
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.setColorAt(0, COATS[0]);                         // makes the colour buffer (it must be made while count is still MAX)
  m.frustumCulled = false; m.count = 0;
  sceneryGroup.add(m);
}
bodies.castShadow = true;

const walkers = [];
const _m = new THREE.Matrix4();

// Send someone along a list of points [x, y, z]. opts: delay (seconds before setting off, out of
// sight), coat and skin (colours), pace, done (called on arrival), wait (stay visible while waiting).
export function addWalker(pts, opts = {}) {
  if (walkers.length >= MAX || pts.length < 1) { if (opts.done) opts.done(); return null; }
  const n = Math.random() * 1000;
  const w = {
    pts, i: 0, x: pts[0][0], y: pts[0][1], z: pts[0][2], delay: opts.delay || 0, pace: (opts.pace || PACE) * (0.85 + Math.random() * 0.3),
    coat: opts.coat || coatOf(n), skin: opts.skin || skinOf(n * 7), done: opts.done || null, next: opts.next || null,
    grow: 0, leaving: false, step: Math.random() * 6,
  };
  walkers.push(w);
  return w;
}

function finish(w) {
  if (w.done) { const fn = w.done; w.done = null; fn(); }
  w.leaving = true;
}

function stepWalker(w, dt) {
  if (w.delay > 0) { w.delay -= dt; return; }
  if (w.leaving) { w.grow -= dt * 5; return; }
  w.grow = Math.min(1, w.grow + dt * 5);
  let move = w.pace * dt;
  while (move > 0) {
    const t = w.pts[w.i + 1];
    if (!t) {
      if (w.next && w.next(w) && w.pts[w.i + 1]) continue;       // a pedestrian chooses where to go next
      finish(w);
      return;
    }
    const dx = t[0] - w.x, dy = t[1] - w.y, dz = t[2] - w.z, d = Math.hypot(dx, dz) || 1e-6;
    if (d <= move) { w.x = t[0]; w.y = t[1]; w.z = t[2]; w.i++; move -= d; }
    else { const f = move / d; w.x += dx * f; w.y += dy * f; w.z += dz * f; move = 0; }
  }
  w.step += dt * 11;
}

/* ----- pedestrians on the walkways, decks and footbridges ----- */
let seen = -1, squares = [], entries = [], spawnT = 0;
const isWalk = s => !!s && (s.id === 'walkway' || s.id === 'pedestrian-deck' || s.id === 'footbridge');

// The squares a walker can go on to from this one.
function ways(x, z) {
  const s = sceneryAt(x, z);
  if (!isWalk(s)) return [];
  const links = walkLinks(x, z);
  return [0, 1, 2, 3].filter(d => links[d] || (s.id === 'pedestrian-deck' && sceneryAt(x + DX[d], z + DZ[d]) === s));
}

// Look over the board for places to walk, and for the stairs people come up and go down by:
// [the foot of the stairs, the top], as points.
function survey() {
  seen = sceneryVersion; squares = []; entries = [];
  for (const s of placed.values()) {
    if (!isWalk(s)) continue;
    for (let i = 0; i < s.w; i++) for (let j = 0; j < s.d; j++) squares.push([s.x + i, s.z + j]);
    const cx = s.x + 0.5, cz = s.z + 0.5;
    if (s.id === 'walkway') {
      const links = walkLinks(s.x, s.z), on = [0, 1, 2, 3].filter(d => links[d]);
      if (on.length === 1 && !isRoad(s.x, s.z) && !occ.has(key(s.x, s.z, 0))) {          // a dead end: stairs lead away from the one link
        const e = (on[0] + 2) & 3;
        entries.push({ x: s.x, z: s.z, pts: [[cx + DX[e] * 0.47, 0.03, cz + DZ[e] * 0.47], [cx - DX[e] * 0.06, WALK, cz - DZ[e] * 0.06]] });
      }
    } else if (s.id === 'footbridge') {
      const links = walkLinks(s.x, s.z);
      for (const sd of [1, -1]) {                                                         // its two ends: stairs run back alongside the road
        const d = s.rot ? (sd > 0 ? 0 : 2) : (sd > 0 ? 1 : 3);
        if (links[d]) continue;
        const at = (lx, lz) => (s.rot ? [cx + lz, cz - lx] : [cx + lx, cz + lz]);
        const [bx, bz] = at(sd * 0.43, sd * 0.5), [tx, tz] = at(sd * 0.43, sd * 0.08), [mx, mz] = at(sd * 0.36, 0);
        entries.push({ x: s.x, z: s.z, pts: [[bx, 0.03, bz], [tx, WALK, tz], [mx, WALK, mz]] });
      }
    }
  }
}

// A point to walk to in a square: its middle, a little to the left of the way the walker is going.
function spotIn(x, z, d, loose) {
  const s = sceneryAt(x, z), keep = s && s.id === 'footbridge' ? 0.035 : 0.06;
  const j = loose ? 0.12 : 0.02;
  return [x + 0.5 + (d >= 0 ? DZ[d] * keep : 0) + (Math.random() - 0.5) * j, WALK, z + 0.5 - (d >= 0 ? DX[d] * keep : 0) + (Math.random() - 0.5) * j];
}

// Called when a pedestrian reaches the end of its list of points: add the next one. Returns
// false when the walk is over.
function stroll(w) {
  if (!isWalk(sceneryAt(w.cx, w.cz))) return false;                 // the walkway has gone from under them
  if (w.hops-- <= 0) {
    const out = entries.filter(e => e.x === w.cx && e.z === w.cz);
    if (out.length) { w.pts.push(...out[Math.floor(Math.random() * out.length)].pts.slice().reverse()); w.next = null; return true; }
    if (w.hops < -14) return false;                                 // no stairs anywhere near: just go
  }
  const all = ways(w.cx, w.cz), on = all.filter(d => d !== w.from), pick = on.length ? on : all;
  const s = sceneryAt(w.cx, w.cz);
  if (!pick.length) {                                               // nowhere to go: a footbridge on its own is crossed from end to end
    if (s.id === 'footbridge') { w.side = -(w.side || 1); const lx = w.side * 0.36; w.pts.push(s.rot ? [w.cx + 0.5, WALK, w.cz + 0.5 - lx] : [w.cx + 0.5 + lx, WALK, w.cz + 0.5]); w.hops -= 2; return true; }
    w.pts.push(spotIn(w.cx, w.cz, -1, true));
    return true;
  }
  const d = pick[Math.floor(Math.random() * pick.length)];
  w.cx += DX[d]; w.cz += DZ[d]; w.from = (d + 2) & 3;
  const t = sceneryAt(w.cx, w.cz);
  w.pts.push(spotIn(w.cx, w.cz, d, !!t && t.id === 'pedestrian-deck'));
  return true;
}

function spawn() {
  if (!squares.length) return;
  let pts, cx, cz;
  if (entries.length && Math.random() < 0.7) { const e = entries[Math.floor(Math.random() * entries.length)]; pts = e.pts.slice(); cx = e.x; cz = e.z; }
  else { [cx, cz] = squares[Math.floor(Math.random() * squares.length)]; pts = [spotIn(cx, cz, -1, true)]; }
  const w = addWalker(pts, { next: stroll, pace: 0.34 });
  if (w) { w.cx = cx; w.cz = cz; w.from = -1; w.hops = 6 + Math.floor(Math.random() * 14); w.stroller = true; }
}

export function stepPeople(dt) {
  if (seen !== sceneryVersion) survey();
  spawnT -= dt;
  if (spawnT <= 0) {
    spawnT = 0.35;
    const want = Math.min(90, Math.ceil(squares.length * 0.5));
    let have = 0;
    for (const w of walkers) if (w.stroller) have++;
    if (have < want) spawn();
  }
  let n = 0;
  for (let i = walkers.length - 1; i >= 0; i--) {
    const w = walkers[i];
    stepWalker(w, dt);
    if (w.leaving && w.grow <= 0) walkers.splice(i, 1);
  }
  for (const w of walkers) {
    if (w.delay > 0 || w.grow <= 0) continue;
    const g = w.grow;
    _m.makeScale(g, g, g).setPosition(w.x, w.y + Math.abs(Math.sin(w.step)) * 0.006, w.z);
    bodies.setMatrixAt(n, _m); heads.setMatrixAt(n, _m);
    bodies.setColorAt(n, w.coat); heads.setColorAt(n, w.skin);
    n++;
  }
  bodies.count = heads.count = n;
  for (const m of [bodies, heads]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
}

export function clearPeople() {
  walkers.length = 0; bodies.count = heads.count = 0; seen = -1;
}
export const peopleCount = () => walkers.length;
export const strollers = () => walkers.filter(w => w.stroller).length;
export const walkerList = () => walkers;

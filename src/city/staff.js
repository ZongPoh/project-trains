import * as THREE from 'three';
import { C } from '../core/colors.js';
import { GB } from '../core/builder.js';
import { trackGroup, sceneryMat } from '../core/stage.js';
import { pieces } from '../tracks/model.js';
import { isStation, stationRun, stationPieces, stationAcross, platformSpot, platformYaw } from '../tracks/features/station.js';
import { trains } from '../trains/store.js';

// Station staff.
//   Every platform has a conductor in a dark uniform and white gloves. When the departure melody
//   starts, the conductor points at the train to check the doors; as it pulls out, the arm goes
//   straight up.
//   A terminal (four tracks or more) also has a cleaning crew of three on each platform. They bow
//   to the train as it comes in, go aboard to clean while it stands, and bow again as it leaves.
const NAVY = C('#1c2740'), WHITE = C('#f5f5f0'), SKIN = C('#e8b98f'), GOLD = C('#d6b24a'), PINK = C('#e56b8a'), CREAM = C('#f3ead2');
const staff = new Map();       // first square of a platform -> { key, group, arm, crew, run }
let clock = 1;

function person(gb, coat, cap, band) {
  gb.cyl(0, 0.05, 0, 0.024, 0.1, coat, 'y', 0.019);
  gb.sph(0, 0.122, 0, 0.023, 0.023, 0.023, SKIN);
  gb.cyl(0, 0.143, 0, 0.026, 0.014, cap, 'y');
  gb.box(0, 0.137, 0.022, 0.036, 0.004, 0.02, cap);                 // peak of the cap
  if (band) gb.cyl(0, 0.138, 0, 0.0265, 0.005, band, 'y');
}

function makeConductor() {
  const g = new THREE.Group(), body = new GB(), arm = new GB();
  person(body, NAVY, NAVY, GOLD);
  body.box(-0.03, 0.068, 0, 0.012, 0.062, 0.014, NAVY);               // left arm, at the side
  body.sph(-0.03, 0.034, 0, 0.009, 0.009, 0.009, WHITE);
  arm.box(0, -0.031, 0, 0.012, 0.062, 0.014, NAVY);                   // right arm, hanging from the shoulder
  arm.sph(0, -0.066, 0, 0.0095, 0.0095, 0.0095, WHITE);               // white glove
  const bm = body.mesh(sceneryMat), am = arm.mesh(sceneryMat);
  bm.castShadow = true;
  am.position.set(0.03, 0.098, 0);
  g.add(bm, am);
  return { group: g, arm: am };
}

function makeCleaner() {
  const gb = new GB();
  person(gb, PINK, CREAM, null);
  gb.box(0.03, 0.068, 0, 0.012, 0.062, 0.014, PINK); gb.box(-0.03, 0.068, 0, 0.012, 0.062, 0.014, PINK);
  const m = gb.mesh(sceneryMat);
  m.castShadow = true;
  m.rotation.order = 'YXZ';
  return m;
}

function build(first) {
  const squares = stationPieces(first), n = squares.length;
  const sq = squares[Math.min(n - 1, Math.floor(n / 2) + 1)], yaw = platformYaw(sq);
  const c = makeConductor(), at = platformSpot(sq, 0, 0.318);
  c.group.position.set(at.x, at.y, at.z);
  c.group.rotation.y = yaw;
  trackGroup.add(c.group);
  const s = { group: c.group, arm: c.arm, crew: [], run: stationRun(first).id, lift: 0, bow: 0 };
  if (stationAcross(first).list.length >= 4) {
    const cs = squares[Math.max(0, Math.floor(n / 2) - 1)];
    for (const along of [-0.11, 0, 0.11]) {
      const m = makeCleaner(), p = platformSpot(cs, along, 0.335);
      m.position.set(p.x, p.y, p.z); m.rotation.y = yaw;
      trackGroup.add(m);
      s.crew.push(m);
    }
  }
  return s;
}

function scrap(s) {
  trackGroup.remove(s.group);
  s.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  for (const m of s.crew) { trackGroup.remove(m); m.geometry.dispose(); }
}

// Keep one set of staff for every platform on the board.
function sync() {
  const seen = new Set();
  for (const p of pieces) {
    if (p.type !== 'flat' || !isStation(p) || stationRun(p).first !== p) continue;
    seen.add(p);
    const key = stationPieces(p).length + '|' + p.st + '|' + stationAcross(p).list.length + '|' + p.x + ',' + p.z + ',' + p.l;
    const s = staff.get(p);
    if (s && s.key === key) continue;
    if (s) scrap(s);
    const made = build(p);
    made.key = key;
    staff.set(p, made);
  }
  for (const [first, s] of staff) if (!seen.has(first)) { scrap(s); staff.delete(first); }
}

const ease = (now, want, dt, rate) => now + (want - now) * Math.min(1, dt * rate);

export function stepStaff(dt) {
  clock += dt;
  if (clock >= 0.5) { clock = 0; sync(); }
  if (!staff.size) return;
  const at = new Map();                                            // platform -> the train standing there
  for (const t of trains) {
    if (t.state !== 'run' || !t.atStation) continue;
    if (t.wait > 0) at.set(t.atStation, t);
    else if (t.lastStation === t.atStation && !at.has(t.atStation)) at.set(t.atStation, t);    // just pulling out
  }
  for (const s of staff.values()) {
    const t = at.get(s.run), standing = t && t.wait > 0;
    // the conductor: point along the train during the melody, arm up as it leaves
    const want = !t ? 0 : standing ? (t.sung ? 1.5 : 0) : 2.9;
    s.lift = ease(s.lift, want, dt, 7);
    s.arm.rotation.x = -s.lift;
    if (!s.crew.length) continue;
    // the cleaning crew: bow as it arrives, aboard while it stands, bow as it goes
    let bow = 0, aboard = false;
    if (standing) {
      const since = t.dwellT || 0;
      if (since < 1.5) bow = Math.sin(Math.PI * since / 1.5);
      else if (t.wait > 2.4) aboard = true;
      else if (t.wait < 1.9 && t.wait > 0.5) bow = Math.sin(Math.PI * (1.9 - t.wait) / 1.4);
    }
    s.bow = ease(s.bow, bow, dt, 12);
    for (const m of s.crew) { m.visible = !aboard; m.rotation.x = s.bow * 0.85; }
  }
}

export function clearStaff() {
  for (const s of staff.values()) scrap(s);
  staff.clear();
}

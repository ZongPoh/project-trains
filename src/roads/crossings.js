import * as THREE from 'three';
import { key } from '../core/constants.js';
import { C } from '../core/colors.js';
import { GB } from '../core/builder.js';
import { trackGroup, sceneryMat } from '../core/stage.js';
import { occ, eff } from '../tracks/model.js';
import { nextSeg } from '../tracks/paths.js';
import { isCrossing } from '../tracks/features/crossing.js';
import { squaresOf } from '../terrain/model.js';
import { trains } from '../trains/store.js';

// Level crossing gates. A crossing closes when a train is on it or within WARN squares of it
// along the line: the arms come down, the red lamps flash in turn and the bell rings
// (audio/sounds/crossing.js). It opens again once the train has gone.
const WARN = 4.5;
const POST = C('#2a2f33'), YELLOW = C('#f2c230'), BLACK = C('#1d2023'), WHITE = C('#f3f4f1');
const gates = new Map();          // track piece -> { group, arms, lamps, angle, closed }
const lampGeo = new THREE.SphereGeometry(0.022, 10, 8);
let clock = 0, sync = 0;

function armMesh() {              // a striped arm, built with its hinge at the origin, pointing along +x
  const gb = new GB();
  for (let i = 0; i < 6; i++) gb.box(0.06 + i * 0.11, 0, 0, 0.11, 0.022, 0.022, i % 2 ? BLACK : YELLOW);
  gb.box(-0.03, 0, 0, 0.07, 0.05, 0.04, WHITE);
  const m = gb.mesh(sceneryMat);
  m.castShadow = true;
  return m;
}

function postMesh() {
  const gb = new GB();
  gb.box(0, 0.17, 0, 0.035, 0.34, 0.035, POST);
  gb.box(0, 0.37, 0, 0.13, 0.05, 0.03, POST);                 // lamp bar
  gb.box(0, 0.44, 0, 0.09, 0.07, 0.012, YELLOW);              // warning board
  const m = gb.mesh(sceneryMat);
  m.castShadow = true;
  return m;
}

// Cars keep left, so each gate stands on the left of the road as a driver comes up to the rails.
function build(p) {
  const ew = eff(p.ports) === 0b1010, cx = p.x + 0.5, cz = p.z + 0.5;      // ew: rails run east-west, road north-south
  const group = new THREE.Group(), arms = [], lamps = [];
  for (const s of [1, -1]) {
    const unit = new THREE.Group();
    if (ew) { unit.position.set(cx - s * 0.4, 0, cz + s * 0.34); unit.rotation.y = s > 0 ? 0 : Math.PI; }
    else { unit.position.set(cx + s * 0.34, 0, cz + s * 0.4); unit.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; }
    unit.add(postMesh());
    const arm = armMesh();
    arm.position.y = 0.2;
    unit.add(arm); arms.push(arm);
    for (const side of [-1, 1]) {
      const lamp = new THREE.Mesh(lampGeo, new THREE.MeshBasicMaterial({ color: 0x3a1210 }));
      lamp.position.set(side * 0.045, 0.37, 0.02);
      const back = lamp.clone(); back.material = lamp.material; back.position.z = -0.02;
      unit.add(lamp, back); lamps.push({ mat: lamp.material, phase: side });
    }
    group.add(unit);
  }
  trackGroup.add(group);
  return { group, arms, lamps, angle: 1.45, closed: false };
}

function remove(p) {
  const g = gates.get(p);
  if (!g) return;
  trackGroup.remove(g.group);
  g.group.traverse(o => { if (o.geometry && o.geometry !== lampGeo) o.geometry.dispose(); });
  for (const l of g.lamps) l.mat.dispose();
  gates.delete(p);
}

// Find every square where a road meets straight ground-level track, and give it gates.
function syncGates() {
  const want = new Set();
  for (const [x, z] of squaresOf('road')) {
    const p = occ.get(key(x, z, 0));
    if (p && isCrossing(p)) want.add(p);
  }
  for (const p of [...gates.keys()]) if (!want.has(p) || gates.get(p).ports !== p.ports) remove(p);
  for (const p of want) if (!gates.has(p)) { const g = build(p); g.ports = p.ports; gates.set(p, g); }
}

// Every piece of track that has a train on it or coming.
function busyPieces() {
  const busy = new Set();
  for (const t of trains) {
    if (t.state !== 'run') continue;
    for (const s of t.segs) busy.add(s.p);
    let seg = t.segs[0], dist = seg.len - t.d;
    for (let n = 0; n < 10 && dist < WARN; n++) {
      const nx = nextSeg(seg, false, 0, t);
      if (!nx) break;
      busy.add(nx.p); seg = nx; dist += nx.len;
    }
  }
  return busy;
}

export function stepCrossings(dt) {
  sync -= dt;
  if (sync <= 0) { sync = 0.3; syncGates(); }
  if (!gates.size) return;
  clock += dt;
  const busy = busyPieces();
  for (const [p, g] of gates) {
    g.closed = busy.has(p);
    const want = g.closed ? 0 : 1.45;
    g.angle += Math.max(-dt * 2.6, Math.min(dt * 2.2, want - g.angle));
    for (const a of g.arms) a.rotation.z = g.angle;
    const beat = Math.floor(clock * 2.4) % 2 ? 1 : -1;
    for (const l of g.lamps) l.mat.color.setHex(g.closed && l.phase === beat ? 0xff3b30 : 0x3a1210);
  }
}

export const hasGates = (x, z) => { const p = occ.get(key(x, z, 0)); return !!p && gates.has(p); };

export function crossingClosed(x, z) {
  const p = occ.get(key(x, z, 0)), g = p && gates.get(p);
  return !!g && (g.closed || g.angle < 1.2);                    // closed, or the arms are still on their way up
}

// Where the bell should be ringing.
export function ringingCrossings() {
  const out = [];
  for (const [p, g] of gates) if (g.closed) out.push(p);
  return out;
}

export function clearCrossings() { for (const p of [...gates.keys()]) remove(p); }

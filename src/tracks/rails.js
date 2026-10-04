import * as THREE from 'three';
import { opp } from '../core/constants.js';
import { COL } from '../core/colors.js';
import { segAt, segTan } from './paths.js';

// Draws one run of rail: the bed (ballast on the ground, a deck when raised), two rails and sleepers.
const V3 = THREE.Vector3;
const _d = new V3(), _t = new V3(), _pp = new V3(), _a = new V3(), _b = new V3();

export function addRails(gb, s, raised) {
  const straight = s.p.type === 'flat' && s.b === opp(s.a);
  const n = straight ? 1 : Math.max(6, Math.round(s.len * 9)), ext = straight ? 0.002 : 0.05;
  const P = [], R = [];
  for (let k = 0; k <= n; k++) {
    P.push(segAt(s, k / n, new V3()));
    segTan(s, k / n, _t);
    R.push(new V3(_t.z, 0, -_t.x).normalize());
  }
  for (let k = 0; k < n; k++) {
    const a = P[k], b = P[k + 1];
    _d.subVectors(b, a);
    const L = _d.length(), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, mz = (a.z + b.z) / 2;
    if (raised) gb.obox(mx, my - 0.005, mz, _d, 0.44, 0.06, L + ext, COL.deck);
    else gb.obox(mx, my + 0.0125, mz, _d, 0.42, 0.025, L + ext, COL.ballast);
    for (const side of [-1, 1]) {
      const ax = a.x + R[k].x * side * 0.09, az = a.z + R[k].z * side * 0.09;
      const bx = b.x + R[k + 1].x * side * 0.09, bz = b.z + R[k + 1].z * side * 0.09;
      _d.set(bx - ax, b.y - a.y, bz - az);
      gb.obox((ax + bx) / 2, my + 0.051, (az + bz) / 2, _d, 0.02, 0.022, _d.length() + 0.004, COL.rail);
    }
  }
  const cnt = Math.max(2, Math.round(s.len / 0.125));
  for (let j = 0; j < cnt; j++) {
    const t = (j + 0.5) / cnt;
    segAt(s, t, _pp); segTan(s, t, _t);
    gb.obox(_pp.x, _pp.y + 0.033, _pp.z, _t, 0.32, 0.016, 0.045, COL.sleeper);
  }
}

// A painted line between the rails, used to show which way a junction is set.
export function addGuide(gb, s) {
  const n = s.b === opp(s.a) ? 1 : 7;
  for (let k = 0; k < n; k++) {
    segAt(s, 0.06 + 0.88 * k / n, _a); segAt(s, 0.06 + 0.88 * (k + 1) / n, _b);
    _d.subVectors(_b, _a);
    gb.obox((_a.x + _b.x) / 2, _a.y + 0.049, (_a.z + _b.z) / 2, _d, 0.07, 0.012, _d.length() + 0.004, COL.guide);
  }
}

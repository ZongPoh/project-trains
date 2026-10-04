import * as THREE from 'three';
import { C } from '../../core/colors.js';
import { segAt, segTan } from '../paths.js';

// Bridges. Track laid over water is carried on a deck with red railings and lamp posts,
// like the vermilion bridges of Japanese gardens. This happens by itself; there is no bridge tool.
const RED = C('#c8402c'), CAP = C('#2a2f33'), LAMP = C('#ffe9a8'), PIER = C('#9c988d');
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _t = new THREE.Vector3(), _d = new THREE.Vector3();

export function drawBridge(gb, seg) {
  const n = 6;
  for (const side of [-1, 1]) {
    for (let k = 0; k < n; k++) {
      segAt(seg, k / n, _a); segTan(seg, k / n, _t);
      const ax = _a.x + _t.z * side * 0.24, az = _a.z - _t.x * side * 0.24;
      segAt(seg, (k + 1) / n, _b); segTan(seg, (k + 1) / n, _t);
      const bx = _b.x + _t.z * side * 0.24, bz = _b.z - _t.x * side * 0.24;
      _d.set(bx - ax, _b.y - _a.y, bz - az);
      const len = _d.length(), y = (_a.y + _b.y) / 2;
      gb.obox((ax + bx) / 2, y + 0.12, (az + bz) / 2, _d, 0.022, 0.022, len + 0.01, RED);      // top rail
      gb.obox((ax + bx) / 2, y + 0.07, (az + bz) / 2, _d, 0.014, 0.014, len + 0.01, RED);      // lower rail
      gb.box(ax, _a.y + 0.07, az, 0.026, 0.14, 0.026, RED);                                    // post
      if (k === 0) gb.box(ax, _a.y + 0.148, az, 0.04, 0.016, 0.04, CAP);
    }
  }
  segAt(seg, 0.5, _a); segTan(seg, 0.5, _t);
  const base = _a.y;
  gb.box(_a.x, base / 2 - 0.02, _a.z, 0.3, Math.max(0.02, base), 0.3, PIER);                    // a pier in the water under raised track
  const lx = _a.x + _t.z * 0.24, lz = _a.z - _t.x * 0.24;
  gb.box(lx, base + 0.2, lz, 0.018, 0.14, 0.018, CAP);                                         // a lamp half way across
  gb.lit(1.4, () => gb.box(lx, base + 0.285, lz, 0.045, 0.04, 0.045, LAMP));
}

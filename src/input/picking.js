import * as THREE from 'three';
import { H, MAXL, key, inBoard } from '../core/constants.js';
import { canvas, camera } from '../core/stage.js';
import { occ } from '../tracks/model.js';
import { sceneryAt } from '../scenery/placed.js';
import { hwLevel } from '../terrain/highway.js';

// Turning a point on the screen into a square on the board.
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

// The square under the pointer at build level l.
export function cellAt(cx, cy, l) {
  const r = canvas.getBoundingClientRect();
  ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const o = ray.ray.origin, d = ray.ray.direction;
  if (Math.abs(d.y) < 1e-6) return null;
  const t = (l * H - o.y) / d.y;
  if (t <= 0) return null;
  const x = Math.floor(o.x + d.x * t), z = Math.floor(o.z + d.z * t);
  return inBoard(x, z) ? { x, z } : null;
}

// The piece of track under the pointer, highest level first.
export function pickPiece(cx, cy) {
  for (let l = MAXL; l >= 0; l--) {
    const c = cellAt(cx, cy, l);
    if (!c) continue;
    const p = occ.get(key(c.x, c.z, l));
    if (p) return { p, x: c.x, z: c.z, l };
  }
  return null;
}

// The piece of track or square of highway under the pointer, highest first.
export function pickTop(cx, cy) {
  for (let l = MAXL; l >= 0; l--) {
    const c = cellAt(cx, cy, l);
    if (!c) continue;
    const p = occ.get(key(c.x, c.z, l));
    if (p) return { p, x: c.x, z: c.z, l };
    if (l >= 1 && hwLevel(c.x, c.z) === l) return { highway: true, x: c.x, z: c.z, l };
  }
  return null;
}

// The scenery item under the pointer.
export function pickScenery(cx, cy) {
  const c = cellAt(cx, cy, 0);
  return c ? sceneryAt(c.x, c.z) : null;
}

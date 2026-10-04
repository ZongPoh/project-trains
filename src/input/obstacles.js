import { H, MAXL, key, inBoard } from '../core/constants.js';
import { occ } from '../tracks/model.js';
import { isHill } from '../terrain/model.js';
import { heightAt } from '../terrain/hills.js';
import { hwLevel } from '../terrain/highway.js';
import { sceneryAt } from '../scenery/placed.js';
import { stationAcross } from '../tracks/features/station.js';
import { setClearance } from './camera.js';

// Keeping the camera out of solid things. Every square has a height: the top of the hill,
// building, station, track or highway on it. The camera has to be above the squares it is over,
// and the height it needs falls away smoothly over the squares beside them, so as it is moved
// towards a hill or a tower it rises over the top instead of going inside.
const HEAD = 0.35;             // how far above the top the camera stays
const NEAR = 1.3;              // how far out from a square the rise begins, in squares

function topOf(x, z) {
  if (!inBoard(x, z)) return 0;
  let h = 0;
  if (isHill(x, z)) h = heightAt(x + 0.5, z + 0.5) + 0.25;
  const s = sceneryAt(x, z);
  if (s && s.top > h) h = s.top;
  for (let l = MAXL; l >= 0; l--) {
    const p = occ.get(key(x, z, l));
    if (p) { h = Math.max(h, (p.type === 'ramp' ? l + 1 : l) * H + (p.st ? (stationAcross(p).list.length >= 3 ? 1.25 : 0.7) : 0.45)); break; }
  }
  const L = hwLevel(x, z);
  if (L) h = Math.max(h, L * H + 0.25);
  return h;
}

function clearance(cx, cz) {
  const x0 = Math.floor(cx), z0 = Math.floor(cz);
  let need = 0;
  for (let x = x0 - 2; x <= x0 + 2; x++) for (let z = z0 - 2; z <= z0 + 2; z++) {
    const h = topOf(x, z);
    if (!h) continue;
    const d = Math.hypot(Math.max(x - cx, 0, cx - x - 1), Math.max(z - cz, 0, cz - z - 1));   // distance to the square
    if (d >= NEAR) continue;
    const w = 1 - d / NEAR;
    need = Math.max(need, (h + HEAD) * w * w * (3 - 2 * w));
  }
  return need;
}

export function initObstacles() { setClearance(clearance); }

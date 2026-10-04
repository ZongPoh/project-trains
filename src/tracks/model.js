import { key, bits, dirs, opp } from '../core/constants.js';
import { rampPort } from './pieces/ramp.js';

// The layout itself.
//   flat piece: { type:'flat', x, z, l, ports, sw, st, sig }
//       ports = bitmask of the four sides the rails reach
//       sw    = which route a junction is set to (0, 1 or 2)
//       st    = station platform: 0 none, 1 on one side, 2 on the other
//       sig   = signal: 0 none, 1 automatic, 2 held at stop
//   ramp piece: { type:'ramp', x, z, l, dir }
//       low end in square x,z at level l, rising one level along dir over two squares
export const occ = new Map();      // "x,z,level" -> piece
export const pieces = new Set();
export const dirty = new Set();    // pieces whose model needs rebuilding

// A lone or one-ended piece still draws, and behaves, as a straight.
export function eff(m) {
  const n = bits(m);
  if (n === 0) return 0b0101;
  if (n === 1) { const d = dirs(m)[0]; return m | (1 << opp(d)); }
  return m;
}

export const isStraight = p => p.type === 'flat' && (eff(p.ports) === 0b0101 || eff(p.ports) === 0b1010);

// Which piece offers a rail end on side d of this square at height l.
export function findAtPort(x, z, d, l) {
  const p = occ.get(key(x, z, l));
  if (!p) return null;
  if (p.type === 'flat') return (eff(p.ports) >> d & 1) ? { p, end: d } : null;
  for (let e = 0; e < 2; e++) {
    const q = rampPort(p, e);
    if (q.x === x && q.z === z && q.d === d && q.l === l) return { p, end: e };
  }
  return null;
}

// Anything that depends on the track on a square signs up to hear when a piece there is redrawn or removed.
const watchers = [];
export function onTrack(fn) { watchers.push(fn); }
export function notifyTrack(p) { for (const fn of watchers) fn(p); }

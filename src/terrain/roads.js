import * as THREE from 'three';
import { DX, DZ, opp } from '../core/constants.js';
import { C } from '../core/colors.js';
import { curveAt } from '../tracks/pieces/curve.js';
import { isRoad, isRoadBridge } from './model.js';

// Roads. A road square joins every road square beside it, so streets, corners and junctions
// form by themselves from what is painted. A square with just two neighbours at right angles
// is drawn as a curve, like curved track.
export const ROAD_W = 0.62;
const TAR = C('#474b50'), LINE = C('#e9e7dc'), KERB = C('#9a9b98'), STONE = C('#b3aea0'), CAP = C('#8f8a7c');
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();

// Other things a road can join besides the next road square (a highway ramp) sign up here.
const joins = [];
export function addRoadJoin(fn) { joins.push(fn); }
export const roadLinks = (x, z) => [0, 1, 2, 3].filter(d => isRoad(x + DX[d], z + DZ[d]) || joins.some(fn => fn(x, z, d)));
// The centre line of a road square from side a to side b, at t from 0 to 1.
export function roadPoint(x, z, a, b, t, out) {
  if (b === opp(a)) return out.set(x + 0.5 + DX[a] * (0.5 - t), 0, z + 0.5 + DZ[a] * (0.5 - t));
  return curveAt({ x, z, l: 0 }, a, b, t, out);
}

function strip(gb, x, z, a, b, n, plain) {
  for (let k = 0; k < n; k++) {
    roadPoint(x, z, a, b, k / n, _a); roadPoint(x, z, a, b, (k + 1) / n, _b);
    _d.subVectors(_b, _a);
    const len = _d.length(), mx = (_a.x + _b.x) / 2, mz = (_a.z + _b.z) / 2;
    gb.obox(mx, 0.006, mz, _d, ROAD_W + 0.06, 0.008, len + 0.03, KERB);
    gb.obox(mx, 0.010, mz, _d, ROAD_W, 0.012, len + 0.04, TAR);
    if (!plain && k % 3 === 1) gb.obox(mx, 0.0165, mz, _d, 0.03, 0.002, len * 0.9, LINE);          // centre line dashes
  }
}

// A road over water: stone piers, a parapet down each side and a lamp.
function bridgeSides(gb, x, z, d) {
  const cx = x + 0.5, cz = z + 0.5, ns = DX[d] === 0;
  gb.slab(cx, -0.004, cz, ns ? ROAD_W + 0.16 : 1, 0.012, ns ? 1 : ROAD_W + 0.16, STONE);
  for (const s of [-1, 1]) {
    const ox = ns ? s * (ROAD_W / 2 + 0.06) : 0, oz = ns ? 0 : s * (ROAD_W / 2 + 0.06);
    gb.slab(cx + ox, 0.008, cz + oz, ns ? 0.035 : 1, 0.07, ns ? 1 : 0.035, STONE);
    gb.slab(cx + ox, 0.078, cz + oz, ns ? 0.05 : 1, 0.012, ns ? 1 : 0.05, CAP);
    gb.slab(cx + ox, -0.03, cz + oz, 0.1, 0.03, 0.1, STONE);                    // pier foot in the water
  }
}

export function drawRoad(gb, x, z) {
  const cx = x + 0.5, cz = z + 0.5, links = roadLinks(x, z);
  if (links.length === 2 && links[1] !== opp(links[0])) { strip(gb, x, z, links[0], links[1], 9); return; }   // a corner
  if (links.length >= 3) {
    // a junction: every way through it is laid as its own strip, straight or curved, so the
    // corners between the arms are rounded and cars turning follow the tarmac
    for (let i = 0; i < links.length; i++) for (let j = i + 1; j < links.length; j++) {
      const a = links[i], b = links[j];
      strip(gb, x, z, a, b, b === opp(a) ? 1 : 9, true);
    }
    for (const d of links) {                                    // a stop line across each arm
      const ns = DX[d] === 0;
      gb.slab(cx + DX[d] * 0.44, 0.0165, cz + DZ[d] * 0.44, ns ? ROAD_W * 0.42 : 0.03, 0.002, ns ? 0.03 : ROAD_W * 0.42, LINE);
    }
    return;
  }
  gb.slab(cx, 0.002, cz, ROAD_W + 0.06, 0.008, ROAD_W + 0.06, KERB);
  gb.slab(cx, 0.004, cz, ROAD_W, 0.012, ROAD_W, TAR);
  for (const d of links) {                                    // an arm out to each neighbour
    const ns = DX[d] === 0, len = 0.5 - ROAD_W / 2, ox = DX[d] * (ROAD_W / 2 + len / 2), oz = DZ[d] * (ROAD_W / 2 + len / 2);
    gb.slab(cx + ox, 0.002, cz + oz, ns ? ROAD_W + 0.06 : len, 0.008, ns ? len : ROAD_W + 0.06, KERB);
    gb.slab(cx + ox, 0.004, cz + oz, ns ? ROAD_W : len, 0.012, ns ? len : ROAD_W, TAR);
    gb.slab(cx + DX[d] * 0.36, 0.0165, cz + DZ[d] * 0.36, ns ? 0.03 : 0.16, 0.002, ns ? 0.16 : 0.03, LINE);
  }
  if (links.length === 2) {                                   // straight through: one more dash in the middle
    const ns = links[0] === 0;
    gb.slab(cx, 0.0165, cz, ns ? 0.03 : 0.16, 0.002, ns ? 0.16 : 0.03, LINE);
    if (isRoadBridge(x, z)) bridgeSides(gb, x, z, links[0]);
  }
}

// A road or river carried on past the edge of the board, out into the countryside.
export function drawRoadBeyond(gb, x, z, d, far) {
  const ns = DX[d] === 0, mx = x + 0.5 + DX[d] * (0.5 + far / 2), mz = z + 0.5 + DZ[d] * (0.5 + far / 2);
  gb.slab(mx, -0.024, mz, ns ? ROAD_W + 0.06 : far, 0.012, ns ? far : ROAD_W + 0.06, KERB);
  gb.slab(mx, -0.02, mz, ns ? ROAD_W : far, 0.014, ns ? far : ROAD_W, TAR);
  for (let k = 1; k < far; k += 1) {
    gb.slab(x + 0.5 + DX[d] * (0.5 + k), -0.005, z + 0.5 + DZ[d] * (0.5 + k), ns ? 0.03 : 0.3, 0.002, ns ? 0.3 : 0.03, LINE);
  }
}

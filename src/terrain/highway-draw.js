import * as THREE from 'three';
import { H, DX, DZ, opp, inBoard } from '../core/constants.js';
import { C } from '../core/colors.js';
import { roadPoint } from './roads.js';
import { hwArms, hwLevel, rampOf, hwY } from './highway.js';

// Drawing the highway: a concrete deck with a tarmac surface and low walls, carried on pairs
// of columns. The columns stand at the edges of each square, never in the middle, so a road,
// a railway or a river can pass underneath in any direction.
const W = 0.86, TAR_W = 0.78, THICK = 0.05, WALL = 0.07;
const CONC = C('#c2c0b6'), SHADE = C('#a3a197'), TAR = C('#41454a'), LINE = C('#eeece2'), RAIL = C('#3f8a63');
const STEEL = C('#5d6b76'), LAMP = C('#ffe9a8'), BOARD = C('#1f7a4d'), WHITE = C('#f4f2ea');
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3();

const pointAt = (x, z, a, b, t, out) => { roadPoint(x, z, a, b, t, out); out.y = hwY(x, z, out.x, out.z); return out; };

// One length of deck from _a to _b, with a wall on each side that has one (left, right).
function span(gb, left, right, dash) {
  _d.subVectors(_b, _a);
  const len = _d.length(), mx = (_a.x + _b.x) / 2, my = (_a.y + _b.y) / 2, mz = (_a.z + _b.z) / 2;
  gb.obox(mx, my - THICK / 2, mz, _d, W, THICK, len + 0.012, CONC);
  gb.obox(mx, my + 0.003, mz, _d, TAR_W, 0.008, len + 0.014, TAR);
  if (dash) gb.obox(mx, my + 0.008, mz, _d, 0.028, 0.002, len * 0.6, LINE);
  _n.set(_d.z, 0, -_d.x).normalize();
  for (const [side, on] of [[1, right], [-1, left]]) {
    if (!on) continue;
    const ox = _n.x * side * (W / 2 - 0.02), oz = _n.z * side * (W / 2 - 0.02);
    gb.obox(mx + ox, my + WALL / 2, mz + oz, _d, 0.034, WALL, len + 0.012, CONC);
    gb.obox(mx + ox, my + WALL + 0.006, mz + oz, _d, 0.038, 0.012, len + 0.012, RAIL);
  }
}

// A pair of columns and a beam under the deck, across the road at this point.
function bent(gb, x, y, z, ns) {                      // ns: the road runs north-south here
  const top = y - THICK;
  if (top < 0.1) return;
  for (const s of [-1, 1]) gb.box(x + (ns ? s * 0.4 : 0), top / 2, z + (ns ? 0 : s * 0.4), 0.075, top, 0.075, SHADE);
  gb.box(x, top - 0.035, z, ns ? 0.875 : 0.09, 0.07, ns ? 0.09 : 0.875, SHADE);
}

function lamp(gb, x, z, ns, side, y) {
  const lx = x + 0.5 + (ns ? side * 0.4 : 0), lz = z + 0.5 + (ns ? 0 : side * 0.4);
  gb.box(lx, y + 0.2, lz, 0.014, 0.4, 0.014, STEEL);
  gb.box(lx - (ns ? side * 0.06 : 0), y + 0.4, lz - (ns ? 0 : side * 0.06), ns ? 0.13 : 0.014, 0.012, ns ? 0.014 : 0.13, STEEL);
  gb.lit(1.5, () => gb.box(lx - (ns ? side * 0.11 : 0), y + 0.39, lz - (ns ? 0 : side * 0.11), ns ? 0.05 : 0.03, 0.012, ns ? 0.03 : 0.05, LAMP));
}

// A green direction sign on a frame across the road.
function gantry(gb, x, z, ns, y) {
  const cx = x + 0.5, cz = z + 0.5;
  for (const s of [-1, 1]) gb.box(cx + (ns ? s * 0.42 : 0), y + 0.24, cz + (ns ? 0 : s * 0.42), 0.02, 0.48, 0.02, STEEL);
  gb.box(cx, y + 0.47, cz, ns ? 0.86 : 0.02, 0.02, ns ? 0.02 : 0.86, STEEL);
  gb.lit(0.45, () => {
    gb.box(cx, y + 0.4, cz, ns ? 0.62 : 0.024, 0.15, ns ? 0.024 : 0.62, BOARD);
    gb.box(cx, y + 0.365, cz, ns ? 0.5 : 0.028, 0.012, ns ? 0.028 : 0.5, WHITE);
    gb.box(cx - (ns ? 0.12 : 0), y + 0.425, cz - (ns ? 0 : 0.12), ns ? 0.26 : 0.028, 0.03, ns ? 0.028 : 0.26, WHITE);
  });
}

// One length of deck with a wall only on the side nearer the point (cx, cz): the inside of a bend at a junction.
function bendSpan(gb, cx, cz) {
  _n.set(_b.z - _a.z, 0, -(_b.x - _a.x)).normalize();
  const mx = (_a.x + _b.x) / 2, mz = (_a.z + _b.z) / 2;
  const right = Math.hypot(mx + _n.x * 0.4 - cx, mz + _n.z * 0.4 - cz) < Math.hypot(mx - _n.x * 0.4 - cx, mz - _n.z * 0.4 - cz);
  span(gb, !right, right, false);
}

export function drawHighway(gb, x, z) {
  const arms = hwArms(x, z), ramp = rampOf(x, z), cx = x + 0.5, cz = z + 0.5, DECK = hwLevel(x, z) * H;
  // which way a lone end or the foot of a ramp points
  const through = ramp ? [opp(ramp.d), ramp.d] : arms.length === 1 ? [arms[0], opp(arms[0])] : arms.length === 2 ? arms : null;
  if (through) {
    const [a, b] = through, straight = b === opp(a), n = straight ? 3 : 9, deadEnd = arms.length === 1 && !ramp;
    for (let i = 0; i < n; i++) {
      pointAt(x, z, a, b, i / n, _a); pointAt(x, z, a, b, (i + 1) / n, _b);
      span(gb, true, true, straight ? i === 1 : i % 3 === 1);
    }
    if (deadEnd) {                                    // a wall across the end
      const ns = DX[a] === 0, e = opp(a);
      gb.box(cx + DX[e] * 0.48, DECK + WALL / 2, cz + DZ[e] * 0.48, ns ? W : 0.034, WALL, ns ? 0.034 : W, CONC);
      bent(gb, cx + DX[e] * 0.42, DECK, cz + DZ[e] * 0.42, ns);
    }
    if (straight && !ramp && arms.length === 2) {
      const ns = DX[a] === 0;
      if ((x + z) % 3 === 0) lamp(gb, x, z, ns, (x + z) % 2 ? 1 : -1, DECK);
      if ((x * 7 + z * 3) % 11 === 5) gantry(gb, x, z, ns, DECK);
    }
  } else if (arms.length >= 3) {
    // a junction: every way through is its own length of deck, straight or curved, so the
    // corners between the arms are rounded slip roads. Walls go on the closed side and round
    // the inside of each bend.
    for (let i = 0; i < arms.length; i++) for (let j = i + 1; j < arms.length; j++) {
      const a = arms[i], b = arms[j];
      if (b === opp(a)) { pointAt(x, z, a, b, 0, _a); pointAt(x, z, a, b, 1, _b); span(gb, false, false, false); continue; }
      const kx = cx + (DX[a] + DX[b]) * 0.5, kz = cz + (DZ[a] + DZ[b]) * 0.5;       // the corner this bend goes round
      for (let k = 0; k < 9; k++) { pointAt(x, z, a, b, k / 9, _a); pointAt(x, z, a, b, (k + 1) / 9, _b); bendSpan(gb, kx, kz); }
    }
    for (let d = 0; d < 4; d++) {
      const ns = DX[d] === 0;
      if (arms.includes(d)) gb.box(cx + DX[d] * 0.42, DECK + 0.008, cz + DZ[d] * 0.42, ns ? TAR_W * 0.42 : 0.028, 0.002, ns ? 0.028 : TAR_W * 0.42, LINE);
      else {
        gb.box(cx + DX[d] * (W / 2 - 0.02), DECK + WALL / 2, cz + DZ[d] * (W / 2 - 0.02), ns ? 1 : 0.034, WALL, ns ? 0.034 : 1, CONC);
        gb.box(cx + DX[d] * (W / 2 - 0.02), DECK + WALL + 0.006, cz + DZ[d] * (W / 2 - 0.02), ns ? 1 : 0.038, 0.012, ns ? 0.038 : 1, RAIL);
      }
    }
  } else {                                            // a square on its own
    gb.box(cx, DECK - THICK / 2, cz, W, THICK, W, CONC);
    gb.box(cx, DECK + 0.003, cz, TAR_W, 0.008, TAR_W, TAR);
    for (let d = 0; d < 4; d++) {
      const ns = DX[d] === 0;
      gb.box(cx + DX[d] * (W / 2 - 0.02), DECK + WALL / 2, cz + DZ[d] * (W / 2 - 0.02), ns ? W : 0.034, WALL, ns ? 0.034 : W, CONC);
    }
    bent(gb, cx, DECK, cz - 0.38, true); bent(gb, cx, DECK, cz + 0.38, true);
  }
  // columns on each edge where the deck carries on. An edge shared by two squares is drawn by
  // the square to its south or east, so it is only drawn once.
  for (const d of arms) {
    const nx = x + DX[d], nz = z + DZ[d];
    if (d === 1 || d === 2) { if (inBoard(nx, nz)) continue; }
    const bx = cx + DX[d] * 0.5, bz = cz + DZ[d] * 0.5;
    bent(gb, bx, hwY(x, z, bx, bz), bz, DX[d] === 0);
  }
}

// A highway that reaches the edge of the board carries on across the countryside.
export function drawHighwayBeyond(gb, x, z, d, far) {
  const DECK = hwLevel(x, z) * H, ns = DX[d] === 0, cx = x + 0.5, cz = z + 0.5, mx = cx + DX[d] * (0.5 + far / 2), mz = cz + DZ[d] * (0.5 + far / 2);
  gb.box(mx, DECK - THICK / 2, mz, ns ? W : far, THICK, ns ? far : W, CONC);
  gb.box(mx, DECK + 0.003, mz, ns ? TAR_W : far, 0.008, ns ? far : TAR_W, TAR);
  for (const s of [-1, 1]) {
    gb.box(mx + (ns ? s * (W / 2 - 0.02) : 0), DECK + WALL / 2, mz + (ns ? 0 : s * (W / 2 - 0.02)), ns ? 0.034 : far, WALL, ns ? far : 0.034, CONC);
    gb.box(mx + (ns ? s * (W / 2 - 0.02) : 0), DECK + WALL + 0.006, mz + (ns ? 0 : s * (W / 2 - 0.02)), ns ? 0.038 : far, 0.012, ns ? far : 0.038, RAIL);
  }
  for (let j = 1; j < far; j += j < 40 ? 1 : 4) {
    const px = cx + DX[d] * (0.5 + j), pz = cz + DZ[d] * (0.5 + j);
    bent(gb, px, DECK, pz, ns);
    if (j < 60) gb.box(px - DX[d] * 0.5, DECK + 0.008, pz - DZ[d] * 0.5, ns ? 0.028 : 0.3, 0.002, ns ? 0.3 : 0.028, LINE);
  }
}

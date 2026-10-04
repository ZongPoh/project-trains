import { H, DX, DZ, opp, key, inBoard } from '../core/constants.js';
import { occ } from '../tracks/model.js';
import { isRoad, isHill, terrainAt, markTerrain, notifyTerrain } from './model.js';
import { addRoadJoin } from './roads.js';

// The highway: a road on pillars, on level 1, 2 or 3. It is painted square by square like a
// road, and joins up by itself with the highway squares beside it on the same level. It can
// pass over roads, track, stations and water on the levels below it, and track on the levels
// above can pass over it. It cannot share a square with track on its own level, or with a hill.
//   Ramps make themselves. Where a highway runs straight up to the end of something one level
//   down (a road, for a highway on level 1; a lower highway otherwise), its last two squares
//   slope down to meet it, as long as nothing is in the way under those two squares.
//   A short highway between two road ends is therefore a flyover.
export const highway = new Map();            // "x,z" -> level
export const DECK = H;                       // height of the road surface on level 1
const k = (x, z) => x + ',' + z;

export const hwLevel = (x, z) => highway.get(k(x, z)) || 0;
export const isHighway = (x, z) => highway.has(k(x, z));

// Sides on which the deck carries on at the same height (counting the edge of the board,
// where a highway runs on across the countryside).
const level = (x, z, L) => [0, 1, 2, 3].filter(d => hwLevel(x + DX[d], z + DZ[d]) === L || !inBoard(x + DX[d], z + DZ[d]));
const groundClear = (x, z) => !terrainAt(x, z) && !occ.has(key(x, z, 0));

// Is x,z the bottom square of a ramp? Returns the side it comes down to, or -1.
export function rampFoot(x, z) {
  const L = hwLevel(x, z);
  if (!L) return -1;
  const same = level(x, z, L);
  if (same.length !== 1) return -1;
  const back = same[0], d = opp(back), tx = x + DX[d], tz = z + DZ[d], px = x + DX[back], pz = z + DZ[back];
  if (!inBoard(tx, tz) || hwLevel(px, pz) !== L) return -1;
  if (L === 1 ? !isRoad(tx, tz) || hwLevel(tx, tz) === 1 : hwLevel(tx, tz) !== L - 1) return -1;
  const above = level(px, pz, L);
  if (above.length !== 2 || !above.includes(back)) return -1;      // the square above must run straight on
  if (L === 1) return groundClear(x, z) && groundClear(px, pz) ? d : -1;
  return !occ.has(key(x, z, L - 1)) && !occ.has(key(px, pz, L - 1)) ? d : -1;   // track one level down would be in the way
}

// The ramp this square is part of: { d: the side that faces downhill, part: 0 bottom square, 1 top square }, or null.
export function rampOf(x, z) {
  const L = hwLevel(x, z);
  if (!L) return null;
  const d = rampFoot(x, z);
  if (d >= 0) return { d, part: 0 };
  for (const e of level(x, z, L)) if (inBoard(x + DX[e], z + DZ[e]) && rampFoot(x + DX[e], z + DZ[e]) === e) return { d: e, part: 1 };
  return null;
}

// Sides on which a car can drive on to another highway square: the same level, or by a ramp.
export function hwLinks(x, z) {
  const L = hwLevel(x, z), foot = rampFoot(x, z);
  return [0, 1, 2, 3].filter(d => {
    const n = hwLevel(x + DX[d], z + DZ[d]);
    return n > 0 && (n === L || (n === L - 1 && foot === d) || (n === L + 1 && rampFoot(x + DX[d], z + DZ[d]) === opp(d)));
  });
}
// The same, counting the edge of the board, for drawing.
export const hwArms = (x, z) => [0, 1, 2, 3].filter(d => !inBoard(x + DX[d], z + DZ[d]) || hwLinks(x, z).includes(d));

// Height of the road surface at a point in square x,z.
export function hwY(x, z, px, pz) {
  const L = hwLevel(x, z), r = rampOf(x, z);
  if (!r) return L * H;
  const u = 0.5 - ((px - x - 0.5) * DX[r.d] + (pz - z - 0.5) * DZ[r.d]);   // 0 at the downhill edge, 1 at the uphill edge
  return (L - 1) * H + H * 0.5 * (r.part + Math.max(0, Math.min(1, u)));
}

// Would the highway here be in the way of track on level l? (Its own level, and under a ramp, the one below.)
export function blocksTrack(x, z, l) {
  const L = hwLevel(x, z);
  return !!L && (L === l || (l === L - 1 && !!rampOf(x, z)));
}

// Why a highway cannot go on this square on this level, or '' if it can.
export function highwayRefusal(x, z, L = 1) {
  if (!inBoard(x, z)) return 'off the board';
  if (isHill(x, z)) return 'A hill is in the way. The highway cannot cross a hill.';
  if (occ.has(key(x, z, L))) return 'Track on level ' + L + ' is in the way. The highway can pass over track on a lower level, or under track on a higher one.';
  return '';
}

function touched(x, z) {
  markTerrain();
  for (let i = -2; i <= 2; i++) { notifyTerrain(x + i, z); if (i) notifyTerrain(x, z + i); }   // ramps reach two squares
}

// Put the highway on this square at level L (1 to 3), or take it away (0).
export function setHighway(x, z, L) {
  L = L === true ? 1 : L | 0;
  if (!inBoard(x, z) || hwLevel(x, z) === L) return false;
  if (L) highway.set(k(x, z), L); else highway.delete(k(x, z));
  touched(x, z);
  return true;
}

export function clearHighway() {
  const all = [...highway.keys()].map(s => s.split(',').map(Number));
  highway.clear();
  for (const [x, z] of all) touched(x, z);
}

export const highwaySquares = () => [...highway.keys()].map(s => s.split(',').map(Number));

// A road square draws an arm towards the foot of a ramp, and cars may drive that way.
addRoadJoin((x, z, d) => hwLevel(x + DX[d], z + DZ[d]) === 1 && rampFoot(x + DX[d], z + DZ[d]) === opp(d));

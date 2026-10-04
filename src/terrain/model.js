import { inBoard } from '../core/constants.js';

// The ground itself. Each square of the board is plain ground, or one of:
//   water  a river or pond; track laid across it becomes a bridge
//   hill   a mound; ground-level track through it becomes a tunnel
//   road   a street for cars; where it meets ground-level track there is a level crossing
//   roadbridge  a road carried over water on a bridge: it counts as both road and water
export const terrain = new Map();            // "x,z" -> 'water' | 'hill' | 'road' | 'roadbridge'
const k = (x, z) => x + ',' + z;

export const terrainAt = (x, z) => terrain.get(k(x, z)) || null;
export const isWater = (x, z) => { const t = terrain.get(k(x, z)); return t === 'water' || t === 'roadbridge'; };
export const isHill = (x, z) => terrain.get(k(x, z)) === 'hill';
export const isRoad = (x, z) => { const t = terrain.get(k(x, z)); return t === 'road' || t === 'roadbridge'; };
export const isRoadBridge = (x, z) => terrain.get(k(x, z)) === 'roadbridge';

// Anything that draws the ground or depends on it signs up to hear about changes.
const watchers = [];
export function onTerrain(fn) { watchers.push(fn); }

// Tell the watchers that square x,z has changed (also used by the highway, which sits above the ground).
export function notifyTerrain(x, z) { for (const fn of watchers) fn(x, z); }

let stale = true;                            // the ground mesh needs rebuilding
export const terrainStale = () => stale;
export function markTerrain(v = true) { stale = v; }

export function setTerrain(x, z, kind) {
  if (!inBoard(x, z) || terrainAt(x, z) === (kind || null)) return false;
  if (kind) terrain.set(k(x, z), kind); else terrain.delete(k(x, z));
  stale = true;
  for (const fn of watchers) fn(x, z);
  return true;
}

export function clearTerrain() {
  const all = [...terrain.keys()].map(s => s.split(',').map(Number));
  terrain.clear();
  stale = true;
  for (const [x, z] of all) for (const fn of watchers) fn(x, z);
}

export function squaresOf(kind) {
  const out = [];
  for (const [s, v] of terrain) if (v === kind || (kind === 'road' && v === 'roadbridge')) out.push(s.split(',').map(Number));
  return out;
}

import { MAXL, DX, DZ, key, bits, dirs, inBoard } from '../core/constants.js';
import { GB } from '../core/builder.js';
import { rng } from '../core/random.js';
import { sceneryGroup, sceneryMat } from '../core/stage.js';
import { occ, pieces, isStraight, eff, onTrack } from '../tracks/model.js';
import { ITEMS } from './index.js';
import { onSeason } from './seasons.js';
import { terrainAt, isRoad, onTerrain } from '../terrain/model.js';
import { roadLinks } from '../terrain/roads.js';
import { isHighway, hwLevel, hwArms, rampOf } from '../terrain/highway.js';

// Scenery the player has put on the board. Most items take one square of empty ground; large
// buildings take several (an item's `size` is [squares wide, squares deep]). A few items go in
// special places, said by a field in the item's file:
//   on: 'road'       stands over a straight road square (a footbridge, a toll gate)
//   under: true      goes under straight level-1 track or a straight stretch of highway
//   overRoad: true   may cover road squares as well as empty ground (a deck on pillars)
//   overTrack: true  may cross plain track on the ground (the raised walkway)
//   joins: true      joins up with the same item on the squares beside it (the raised walkway)
//   linked: true     is told about the walkways beside it, and redrawn when they change (the footbridge)
// Items of the first two kinds turn themselves to suit the road or track.
//   placed: one entry per item, keyed by its corner square
//   cells:  every square an item covers, so any of them finds the item
export const placed = new Map();          // "x,z" of the corner -> { id, x, z, rot, seed, w, d, mesh }
const cells = new Map();
const k2 = (x, z) => x + ',' + z;

// The squares an item covers once turned: a quarter turn swaps width and depth.
export function footprint(id, rot) {
  const [w, d] = (ITEMS[id] && ITEMS[id].size) || [1, 1];
  return rot & 1 ? [d, w] : [w, d];
}

// What an item that joins up with its neighbours needs to know about where it stands: which
// sides have another piece of walkway (or a pedestrian deck), and which have road underneath.
// A footbridge has an end on each side of its road: with the road running north-south (turn 0)
// the ends face east and west.
const bridgeEnd = (s, d) => s.id === 'footbridge' && (s.rot ? DX[d] === 0 : DZ[d] === 0);
function surroundings(x, z) {
  const me = cells.get(k2(x, z)), bridge = !!me && me.id === 'footbridge';
  const walk = d => {
    const s = cells.get(k2(x + DX[d], z + DZ[d]));
    if (!s) return false;
    if (bridge) return !!ITEMS[s.id].joins && bridgeEnd(me, d);
    return !!ITEMS[s.id].joins || s.id === 'pedestrian-deck' || bridgeEnd(s, d);
  };
  const p = occ.get(key(x, z, 0));
  return { links: [0, 1, 2, 3].map(walk), road: isRoad(x, z) ? roadLinks(x, z) : null, rail: p && p.type === 'flat' ? dirs(eff(p.ports)) : null, rot: me ? me.rot : 0 };
}
const aware = id => !!ITEMS[id].joins || !!ITEMS[id].linked;

// Which sides of this square a walker on the pedestrian level can leave by (see city/people.js).
export const walkLinks = (x, z) => surroundings(x, z).links;
// Goes up by one every time scenery is put down or taken away.
export let sceneryVersion = 0;

export function buildItem(id, seed, where) {
  const gb = new GB();
  ITEMS[id].build(gb, rng(seed), where);
  const m = gb.mesh(sceneryMat);
  m.castShadow = true; m.receiveShadow = true;
  m.geometry.computeBoundingBox();
  return m;
}

// Is this one square free for scenery? Not on track (any level), water, hills, roads or under the highway.
export function canPlace(x, z, roadToo, trackToo) {
  if (!inBoard(x, z) || cells.has(k2(x, z)) || isHighway(x, z)) return false;
  const t = terrainAt(x, z);
  if (t && !(roadToo && t === 'road')) return false;
  return noTrack(x, z, 0) || (!!trackToo && plainTrack(x, z));
}

const noTrack = (x, z, from) => { for (let l = from; l <= MAXL; l++) if (occ.has(key(x, z, l))) return false; return true; };

// Track on the ground that a walkway may cross: no station, signal or switch, and nothing above it.
function plainTrack(x, z) {
  const p = occ.get(key(x, z, 0));
  return !!p && p.type === 'flat' && !p.st && !p.sig && bits(eff(p.ports)) <= 2 && noTrack(x, z, 1);
}

// For an item that stands over a road: does the road run north-south (0) or east-west (1) here? -1 if it will not fit.
function roadAxis(x, z) {
  if (!inBoard(x, z) || cells.has(k2(x, z)) || !isRoad(x, z) || isHighway(x, z) || !noTrack(x, z, 0)) return -1;
  const links = roadLinks(x, z);
  if (links.length !== 2 || links[1] !== links[0] + 2) return -1;
  return links[0] === 0 ? 0 : 1;
}

// For an item that goes under a viaduct: which way the track or highway above runs, or -1.
function underAxis(x, z) {
  if (!inBoard(x, z) || cells.has(k2(x, z)) || terrainAt(x, z) || occ.has(key(x, z, 0))) return -1;
  const p = occ.get(key(x, z, 1));
  if (p) return p.type === 'flat' && isStraight(p) ? (eff(p.ports) === 0b0101 ? 0 : 1) : -1;
  if (hwLevel(x, z) !== 1 || rampOf(x, z)) return -1;
  const arms = hwArms(x, z);
  return arms.length === 2 && arms[1] === arms[0] + 2 ? (arms[0] === 0 ? 0 : 1) : -1;
}

// The way an item will face once placed: the turn asked for, or the one its place gives it.
export function turnFor(id, x, z, rot) {
  const it = ITEMS[id];
  if (it && it.on === 'road') return Math.max(0, roadAxis(x, z));
  if (it && it.under) return Math.max(0, underAxis(x, z));
  if (it && it.joins) return 0;
  return rot & 3;
}

// Can this item go with its corner on x,z?
export function canPlaceItem(id, x, z, rot) {
  const it = ITEMS[id];
  if (!it || it.special) return false;                 // (the station building is built by its own tool)
  if (it.on === 'road') return roadAxis(x, z) >= 0;
  if (it.under) return underAxis(x, z) >= 0;
  const [w, d] = footprint(id, rot);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (!canPlace(x + i, z + j, !!it.overRoad, !!it.overTrack)) return false;
  return true;
}

export function placeScenery(id, x, z, rot, seed) {
  if (!ITEMS[id] || !canPlaceItem(id, x, z, rot)) return null;
  rot = turnFor(id, x, z, rot);
  const [w, d] = footprint(id, rot);
  const s = { id, x, z, rot: rot & 3, seed: seed | 0, w, d };
  placed.set(k2(x, z), s);
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) cells.set(k2(x + i, z + j), s);
  s.mesh = buildItem(id, s.seed, aware(id) ? surroundings(x, z) : null);
  s.top = s.mesh.geometry.boundingBox.max.y;
  sceneryVersion++;
  s.mesh.position.set(x + w / 2, 0, z + d / 2);
  s.mesh.rotation.y = s.rot * Math.PI / 2;
  sceneryGroup.add(s.mesh);
  rejoin(s);
  return s;
}

// Give an item a fresh model in the same place (a new season, or its neighbours have changed).
function refresh(s) {
  const old = s.mesh;
  s.mesh = buildItem(s.id, s.seed, aware(s.id) ? surroundings(s.x, s.z) : null);
  s.top = s.mesh.geometry.boundingBox.max.y;
  s.mesh.position.copy(old.position); s.mesh.rotation.y = old.rotation.y;
  sceneryGroup.remove(old); old.geometry.dispose();
  sceneryGroup.add(s.mesh);
}

// Something was put down or taken away here: walkways on the squares all round it join up again.
function rejoin(s) {
  const seen = new Set();
  for (let i = -1; i <= s.w; i++) for (let j = -1; j <= s.d; j++) {
    const n = cells.get(k2(s.x + i, s.z + j));
    if (n && n !== s && aware(n.id) && !seen.has(n)) { seen.add(n); refresh(n); }
  }
}

export const sceneryAt = (x, z) => cells.get(k2(x, z)) || null;

// Remove whatever item covers this square (all of it).
export function removeSceneryAt(x, z) {
  const s = cells.get(k2(x, z));
  if (!s) return false;
  sceneryGroup.remove(s.mesh); s.mesh.geometry.dispose();
  placed.delete(k2(s.x, s.z));
  for (let i = 0; i < s.w; i++) for (let j = 0; j < s.d; j++) cells.delete(k2(s.x + i, s.z + j));
  sceneryVersion++;
  rejoin(s);
  return true;
}

// Take away the shops under a piece of raised track or highway that is being removed.
export function removeUnder(x, z) {
  const s = cells.get(k2(x, z));
  return !!s && !!ITEMS[s.id].under && removeSceneryAt(x, z);
}

// An item that stands over a road goes when its road does.
onTerrain((x, z) => {
  const s = cells.get(k2(x, z));
  if (s && ITEMS[s.id].on === 'road' && !isRoad(x, z)) removeSceneryAt(x, z);
  else if (s && ITEMS[s.id].joins) refresh(s);                 // a road came or went underneath: move the pillars
});

// A walkway may stay where it is when plain track is laid under it.
export const staysOverTrack = (x, z) => { const s = cells.get(k2(x, z)); return !!s && !!ITEMS[s.id].overTrack && noTrack(x, z, 1); };

// The track under a walkway has changed: move its pillars, or take the walkway away if a
// station, signal or switch has gone in under it.
onTrack(p => {
  if (p.type !== 'flat' || p.l !== 0) return;
  const s = cells.get(k2(p.x, p.z));
  if (!s || !ITEMS[s.id].overTrack) return;
  if (pieces.has(p) && !plainTrack(p.x, p.z)) removeSceneryAt(p.x, p.z); else refresh(s);
});

export function clearScenery() {
  for (const s of placed.values()) { sceneryGroup.remove(s.mesh); s.mesh.geometry.dispose(); }
  placed.clear(); cells.clear(); sceneryVersion++;
}

// A new season: give every item on the board its new look, in the same place.
onSeason(() => {
  for (const s of placed.values()) refresh(s);
});

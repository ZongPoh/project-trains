import * as THREE from 'three';
import { H, key, CAR_PITCH } from '../../core/constants.js';
import { COL } from '../../core/colors.js';
import { occ, pieces, eff, isStraight } from '../model.js';
import { addPost } from '../supports.js';
import { snowy, SNOW } from '../../scenery/seasons.js';
import { hwLevel } from '../../terrain/highway.js';
import { drawHallSlice } from './hall.js';

// Stations are platforms beside straight track. Squares in a row form one station, and trains
// stop at it for a moment before moving on.
export const isStation = p => !!p.st && isStraight(p);

// 0: the track runs north-south, 1: east-west.
const axisOf = p => eff(p.ports) === 0b0101 ? 0 : 1;

function neighbour(p, step) {
  const ax = axisOf(p);
  const q = occ.get(key(p.x + (ax ? step : 0), p.z + (ax ? 0 : step), p.l));
  return q && q.type === 'flat' && isStation(q) && axisOf(q) === ax ? q : null;
}
export const stationNeighbours = p => [neighbour(p, -1), neighbour(p, 1)].filter(Boolean);

// The whole row of platform squares this piece belongs to.
export function stationRun(p) {
  let first = p, len = 1, q;
  while ((q = neighbour(first, -1))) { first = q; len++; }
  let last = p;
  while ((q = neighbour(last, 1))) { last = q; len++; }
  return { id: key(first.x, first.z, first.l), len, first };
}

// Every platform square of the station that starts at `first`, in order.
export function stationPieces(first) {
  const list = [first];
  let q = first;
  while ((q = neighbour(q, 1))) list.push(q);
  return list;
}

// Platform tracks that lie side by side belong to one station. The more tracks, the grander
// the station is drawn: 1 a halt, 2 a station with a footbridge, 3 a large station under a
// glass roof, 4 or more a terminal with a great train shed and a clock tower.
function beside(p, step) {
  const ax = axisOf(p);
  const q = occ.get(key(p.x + (ax ? 0 : step), p.z + (ax ? step : 0), p.l));
  return q && q.type === 'flat' && isStation(q) && axisOf(q) === ax ? q : null;
}
// The row of platform squares across the station at this point, and where p is in it.
export function stationAcross(p) {
  let first = p, q;
  while ((q = beside(first, -1))) first = q;
  const list = [first];
  q = first;
  while ((q = beside(q, 1))) list.push(q);
  return { list, index: list.indexOf(p) };
}
// Every square of the whole station, however many tracks it has.
export function stationGroup(p) {
  const seen = new Set([p]), todo = [p];
  while (todo.length) {
    const q = todo.pop();
    for (const n of [neighbour(q, -1), neighbour(q, 1), beside(q, -1), beside(q, 1)]) {
      if (n && !seen.has(n)) { seen.add(n); todo.push(n); }
    }
  }
  return [...seen];
}

// One name for the whole station, however many platforms it has.
export function stationId(p) {
  const f = stationRun(stationAcross(p).list[0]).first;
  return key(f.x, f.z, f.l);
}

// A coupling station: coupled trains split here and their two sets join again (trains/autocouple.js).
// Every square of the station carries the mark (piece.cpl).
export const isCoupling = p => !!p.cpl;
export function setCoupling(p, on) {
  for (const q of stationGroup(p)) q.cpl = on ? 1 : 0;
}

// Platform doors: stations of two tracks or more have a waist-high fence along the platform
// edge, with gates that slide open while a train is standing there (see gates.js).
export const hasDoors = p => isStation(p) && stationAcross(p).list.length >= 2;

// Where the train doors come. A train stops with its middle at the middle of the platform, and
// its doors are at the joints between cars, so the door positions are fixed: half a car
// either side of the middle of the platform, and every car length out from there.
//   doorSpots(p)  the doors that fall in this square, as distances along the track from its middle
//   doorGaps(p)   the same, plus any just over the edge in the squares beside it (for the fence)
function doorsNear(p, reach) {
  const run = stationRun(p), n = run.len, k = stationPieces(run.first).indexOf(p);
  const c = n / 2 - (k + 0.5), out = [];                        // the middle of the platform, seen from this square
  for (let j = 0; j < n; j++) {
    for (const s of [-1, 1]) {
      const off = s * (CAR_PITCH / 2 + j * CAR_PITCH);
      if (Math.abs(off) > n / 2 - 0.12) continue;               // not right at the end of the platform
      if (Math.abs(c + off) <= reach) out.push(c + off);
    }
  }
  return out;
}
export const doorSpots = p => doorsNear(p, 0.5);
export const doorGaps = p => doorsNear(p, 0.62);

const NAMES = [
  ['東京', 'Tokyo'], ['新大阪', 'Shin-Osaka'], ['京都', 'Kyoto'], ['名古屋', 'Nagoya'], ['博多', 'Hakata'],
  ['仙台', 'Sendai'], ['金沢', 'Kanazawa'], ['広島', 'Hiroshima'], ['新横浜', 'Shin-Yokohama'], ['長野', 'Nagano'],
  ['盛岡', 'Morioka'], ['新青森', 'Shin-Aomori'], ['岡山', 'Okayama'], ['熊本', 'Kumamoto'], ['新潟', 'Niigata'],
  ['静岡', 'Shizuoka'], ['上野', 'Ueno'], ['大宮', 'Omiya'], ['新函館', 'Shin-Hakodate'], ['鹿児島', 'Kagoshima'],
  ['新神戸', 'Shin-Kobe'], ['姫路', 'Himeji'], ['小田原', 'Odawara'], ['熱海', 'Atami'], ['浜松', 'Hamamatsu'],
  ['豊橋', 'Toyohashi'], ['米原', 'Maibara'], ['福島', 'Fukushima'], ['郡山', 'Koriyama'], ['宇都宮', 'Utsunomiya'],
  ['高崎', 'Takasaki'], ['軽井沢', 'Karuizawa'], ['富山', 'Toyama'], ['八戸', 'Hachinohe'], ['秋田', 'Akita'],
  ['山形', 'Yamagata'], ['新山口', 'Shin-Yamaguchi'], ['小倉', 'Kokura'], ['長崎', 'Nagasaki'], ['新富士', 'Shin-Fuji'],
];
export const nameIndex = english => NAMES.findIndex(n => n[1] === english);

// All the platforms of one station share its name. A station takes a name from where it
// stands, and keeps it; no two stations on the board share one (until the list runs out).
// The starter layout names its main stations itself (piece.nm on the station's first square).
const given = new Map();           // station id -> place in NAMES
export function stationName(p) {
  const q = isStation(p) ? stationRun(stationAcross(p).list[0]).first : p, id = key(q.x, q.z, q.l);
  if (q.nm) return NAMES[(q.nm - 1) % NAMES.length];
  let i = given.get(id);
  if (i == null) {
    const used = new Set(given.values());
    for (const o of pieces) if (o.nm) used.add(o.nm - 1);
    i = (q.x * 7 + q.z * 13 + q.l * 5) % NAMES.length;
    for (let n = 0; n < NAMES.length && used.has(i); n++) i = (i + 1) % NAMES.length;
    given.set(id, i);
  }
  return NAMES[i];
}
export function forgetStationNames() { given.clear(); }

/* ----- drawing ----- */
// Platform geometry in "along the track" and "away from the track" terms, turned for the piece.
export function frame(p) {
  const ax = axisOf(p), side = p.st === 2 ? -1 : 1;
  return {
    cx: p.x + 0.5, cz: p.z + 0.5, y: p.l * H,
    at(along, out) { return ax ? [this.cx + along, this.cz + out * side] : [this.cx + out * side, this.cz + along]; },
    size(along, across) { return ax ? [along, across] : [across, along]; },
  };
}

// A point on the platform: `along` the track (-0.5 to 0.5) and `out` from the rails.
export function platformSpot(p, along, out) {
  const f = frame(p), [x, z] = f.at(along, out);
  return { x, y: f.y + 0.11, z };
}

// The way someone standing on the platform faces to look at the track, as a turn about the y axis.
export function platformYaw(p) {
  const side = p.st === 2 ? -1 : 1;
  return axisOf(p) ? (side === 1 ? Math.PI : 0) : -side * Math.PI / 2;
}

// Where this square sits in its station: how many tracks wide the station is here (W), which
// of them this is (i), how far along the platform (k of len), and whether track passes overhead.
function placeIn(p) {
  const ac = stationAcross(p), run = stationRun(p), ax = axisOf(p);
  return {
    W: ac.list.length, i: ac.index, len: run.len, k: stationPieces(run.first).indexOf(p), ax,
    c0: ax ? ac.list[0].z : ac.list[0].x,                       // where the station starts, across the tracks
    covered: occ.has(key(p.x, p.z, p.l + 1)) || hwLevel(p.x, p.z) === p.l + 1,
    lead: ac.index === 0 && run.first === p,                    // the one square that carries the name sign
  };
}
// A point given as (along the track from the middle of this square, across the station from its
// first edge, height): turned into world x, y, z for either direction of track.
const spot = (p, s, along, across, y) => s.ax ? [p.x + 0.5 + along, y, s.c0 + across] : [s.c0 + across, y, p.z + 0.5 + along];
const archY = (s, across) => 0.66 + (0.14 + 0.07 * Math.min(s.W, 5)) * Math.sin(Math.PI * across / s.W);
const SHED = 4;                                                 // roof segments across one track
const _v = new THREE.Vector3();

// The train shed of a large station: steel ribs every half square, purlins along the tracks,
// columns down the two outer sides. The glass between the ribs is a separate see-through mesh.
function drawShed(gb, p, s, y) {
  const rib = (along, thick, col) => {
    for (let j = 0; j < SHED; j++) {
      const a = s.i + j / SHED, b = s.i + (j + 1) / SHED;
      const A = spot(p, s, along, a, y + archY(s, a)), B = spot(p, s, along, b, y + archY(s, b));
      _v.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
      gb.obox((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2, _v, thick, thick, _v.length() + 0.01, col);
    }
  };
  const grand = s.W >= 4;
  rib(-0.5, s.k === 0 && grand ? 0.07 : 0.035, s.k === 0 && grand ? COL.shedAccent : COL.shed);
  rib(0, 0.03, COL.shed);
  if (s.k === s.len - 1) rib(0.5, grand ? 0.07 : 0.035, grand ? COL.shedAccent : COL.shed);
  for (let j = 0; j <= SHED; j += 2) {                           // purlins
    if (j === SHED && s.i < s.W - 1) continue;                   // the next track draws the shared one
    const c = s.i + j / SHED, [x, yy, z] = spot(p, s, 0, c, y + archY(s, c));
    gb.box(x, yy, z, s.ax ? 1 : 0.03, 0.03, s.ax ? 0.03 : 1, COL.shed);
  }
  const column = (along, across) => { const [x, , z] = spot(p, s, along, across, 0); gb.box(x, y + 0.33, z, 0.05, 0.66, 0.05, COL.shed); };
  if (s.i === 0) { column(-0.5, 0.03); if (s.k === s.len - 1) column(0.5, 0.03); }
  if (s.i === s.W - 1) { column(-0.5, s.W - 0.03); if (s.k === s.len - 1) column(0.5, s.W - 0.03); }
  if (grand && (s.k === 0 || s.k === s.len - 1)) {               // the end screen of a terminal: a tie beam and mullions
    const along = s.k === 0 ? -0.5 : 0.5;
    const [tx, ty, tz] = spot(p, s, along, s.i + 0.5, y + 0.66);
    gb.box(tx, ty, tz, s.ax ? 0.04 : 1, 0.04, s.ax ? 1 : 0.04, COL.shedAccent);
    for (const c of [s.i + 0.25, s.i + 0.75]) {
      const top = y + archY(s, c), [mx, , mz] = spot(p, s, along, c, 0);
      gb.box(mx, (y + 0.66 + top) / 2, mz, 0.025, top - y - 0.66, 0.025, COL.shedAccent);
    }
  }
}

// A footbridge over the tracks of a two-track station, with a stair tower at each side.
function drawFootbridge(gb, p, s, y) {
  const [x, , z] = spot(p, s, 0, s.i + 0.5, 0), wide = (along, across) => (s.ax ? [along, across] : [across, along]);
  const [dx, dz] = wide(0.24, 1);
  gb.box(x, y + 0.62, z, dx, 0.03, dz, COL.canopyTrim);                                  // deck
  for (const e of [-0.11, 0.11]) {
    const [rx, , rz] = spot(p, s, e, s.i + 0.5, 0), [sx, sz] = wide(0.02, 1);
    gb.box(rx, y + 0.69, rz, sx, 0.1, sz, COL.canopy);                                   // parapets
  }
  const [rx, , rz] = spot(p, s, 0, s.i + 0.5, 0), [qx, qz] = wide(0.28, 1.02);
  gb.box(rx, y + 0.8, rz, qx, 0.02, qz, COL.canopy);                                     // roof
  const outer = s.i === 0 ? 0.09 : s.W - 0.09, [tx, , tz] = spot(p, s, 0, outer, 0), [ux, uz] = wide(0.26, 0.16);
  gb.box(tx, y + 0.4, tz, ux, 0.8, uz, COL.platform);                                    // stair tower
  gb.lit(0.9, () => { const [wx, wz] = wide(0.27, 0.06); gb.box(tx, y + 0.5, tz, wx, 0.3, wz, COL.glass); });
}

// The clock tower of a terminal, at its first corner.
function drawClockTower(gb, p, s, y) {
  const [x, , z] = spot(p, s, -0.34, 0.12, 0);
  gb.box(x, y + 0.75, z, 0.2, 1.5, 0.2, COL.signBoard);
  gb.box(x, y + 1.52, z, 0.24, 0.04, 0.24, COL.shedAccent);
  gb.lit(1.1, () => {                                             // a lit clock face on each side
    for (const [ox, oz, axis] of [[0.101, 0, 'x'], [-0.101, 0, 'x'], [0, 0.101, 'z'], [0, -0.101, 'z']]) gb.cyl(x + ox, y + 1.3, z + oz, 0.075, 0.006, COL.lamp, axis);
  });
  gb.pyr(x, y + 1.54, z, 0.26, 0.26, COL.shedAccent);
}

export function drawStation(gb, p) {
  const f = frame(p), y = f.y, s = placeIn(p);
  const put = (along, out, yy, la, hh, ac, col) => {
    const [x, z] = f.at(along, out), [sx, sz] = f.size(la, ac);
    gb.box(x, yy, z, sx, hh, sz, col);
  };
  put(0, 0.36, y + 0.055, 1, 0.11, 0.28, COL.platform);            // platform
  put(0, 0.232, y + 0.111, 1, 0.006, 0.02, COL.platformEdge);      // white edge
  put(0, 0.275, y + 0.111, 1, 0.006, 0.035, COL.tactile);          // yellow tactile strip
  put(0, 0.43, y + 0.15, 0.22, 0.03, 0.06, COL.brown);             // bench
  for (const d of doorSpots(p)) {                                  // queue lines painted where the train doors come
    for (const e of [-0.07, 0.07]) put(d + e, 0.345, y + 0.1105, 0.008, 0.005, 0.1, COL.queue);
    put(d, 0.297, y + 0.1105, 0.148, 0.005, 0.008, COL.queue);
  }
  if (p.l > 0) {                                                    // legs under a raised platform
    for (const a of [-0.45, 0.45]) { const [x, z] = f.at(a, 0.46); addPost(gb, x, z, y); }
  }
  const hall = !!p.hall && !s.covered;                              // a station building bridges the tracks here
  const shed = s.W >= 3 && !s.covered && !hall;
  if (shed) {
    drawShed(gb, p, s, y);
    gb.lit(1.3, () => put(0, 0.4, y + 0.3, 0.5, 0.012, 0.03, COL.lamp));          // platform lamp
    put(0, 0.4, y + 0.21, 0.02, 0.18, 0.02, COL.shed);
  } else {
    for (const a of [-0.34, 0.34]) put(a, 0.45, y + 0.28, 0.03, 0.34, 0.03, COL.canopyTrim);   // posts
    put(0, 0.445, y + 0.46, 1, 0.03, 0.19, COL.canopy);            // roof over the back of the platform, so the people waiting at the front can be seen
    if (snowy()) put(0, 0.445, y + 0.482, 1, 0.016, 0.17, SNOW);
    put(0, 0.445, y + 0.44, 1, 0.012, 0.21, COL.canopyTrim);
    gb.lit(1.3, () => put(0, 0.4, y + 0.428, 0.7, 0.012, 0.03, COL.lamp));        // strip light under the roof
    if (s.lead) for (const a of [-0.3, 0.3]) put(a, 0.445, y + 0.52, 0.02, 0.1, 0.02, COL.mast);   // frame for the name sign
  }
  if (hall) drawHallSlice(gb, { x: p.x, z: p.z, y, ax: s.ax, first: s.i === 0, last: s.i === s.W - 1 });
  else if (s.W === 2 && s.k === Math.floor(s.len / 2) && !s.covered) drawFootbridge(gb, p, s, y);
  if (s.W >= 4 && s.lead && !s.covered) drawClockTower(gb, p, s, y);
}

// The glass of a train shed, as its own see-through mesh so the trains show underneath.
const glassMat = new THREE.MeshStandardMaterial({ color: 0xbfe6f5, transparent: true, opacity: 0.3, roughness: 0.08, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
export function makeShedGlass(p, GBClass) {
  if (!isStation(p)) return null;
  const s = placeIn(p);
  if (s.W < 3 || s.covered || p.hall) return null;
  const gb = new GBClass(), y = p.l * H;
  for (let j = 0; j < SHED; j++) {
    const a = s.i + j / SHED, b = s.i + (j + 1) / SHED;
    const A = spot(p, s, 0, a, y + archY(s, a)), B = spot(p, s, 0, b, y + archY(s, b));
    _v.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
    gb.obox((A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 0.012, (A[2] + B[2]) / 2, _v, 1, 0.006, _v.length(), COL.signBoard);
  }
  const m = gb.mesh(glassMat);
  m.renderOrder = 2;
  return m;
}

const boardGeo = new THREE.PlaneGeometry(0.72, 0.26);
const textures = new Map();
function nameTexture(name, coupling) {
  const k = name[1] + (coupling ? '+' : '');
  if (textures.has(k)) return textures.get(k);
  const cv = document.createElement('canvas');
  cv.width = 360; cv.height = 130;
  const c = cv.getContext('2d');
  c.fillStyle = '#f7f7f2'; c.fillRect(0, 0, 360, 130);
  c.fillStyle = '#1f7a4d'; c.fillRect(0, 88, 360, 10);
  c.fillStyle = '#16212a'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '700 60px "Hiragino Sans","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif';
  c.fillText(name[0], 180, 46);
  c.font = '600 24px "Barlow Semi Condensed","Arial Narrow",Arial,sans-serif';
  c.fillText(name[1], 180, 114);
  if (coupling) {                                                // a coupling station says so on its sign
    c.fillStyle = '#c8402c'; c.fillRect(0, 88, 360, 10);
    c.fillRect(284, 8, 68, 30);
    c.fillStyle = '#ffffff'; c.font = '700 20px "Hiragino Sans","Yu Gothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif';
    c.fillText('連結', 318, 24);
  }
  c.strokeStyle = '#16212a'; c.lineWidth = 4; c.strokeRect(2, 2, 356, 126);
  const t = new THREE.CanvasTexture(cv);
  t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  textures.set(k, t);
  return t;
}

// The name sign: one per station. On a halt or small station it stands on the platform roof,
// along the track. On a large station it hangs at the end of the train shed, facing down the line.
export function makeNameboard(p) {
  const s = placeIn(p);
  if (!s.lead) return null;
  const f = frame(p), shed = s.W >= 3 && !s.covered;
  const mat = new THREE.MeshBasicMaterial({ map: nameTexture(stationName(p), isCoupling(p)) });
  const group = new THREE.Group();
  for (const turn of [0, Math.PI]) {
    const m = new THREE.Mesh(boardGeo, mat);
    m.rotation.y = ((s.ax ? 0 : Math.PI / 2) + (shed ? Math.PI / 2 : 0)) + turn;
    group.add(m);
  }
  if (shed) {
    const [x, y, z] = spot(p, s, -0.5, s.W / 2, f.y + archY(s, s.W / 2) + 0.24);
    group.position.set(x, y, z);
    group.scale.setScalar(s.W >= 4 ? 2.3 : 1.8);
  } else {
    const [x, z] = f.at(0, 0.445);
    group.position.set(x, f.y + 0.68, z);
  }
  group.userData.material = mat;
  return group;
}

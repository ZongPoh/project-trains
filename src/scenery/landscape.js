import * as THREE from 'three';
import { G } from '../core/constants.js';
import { GB } from '../core/builder.js';
import { rng } from '../core/random.js';
import { backdropGroup, sceneryMat, renderer } from '../core/stage.js';
import { ITEMS } from './index.js';
import { seasonLook, onSeason } from './seasons.js';
import { terrain, onTerrain } from '../terrain/model.js';
import { highway } from '../terrain/highway.js';

// The countryside around the board: a wide lawn, rice paddies, villages, a shrine, a castle on
// its hill and a small city on the skyline. It is built once from the same scenery items the
// player can place, and it cannot be edited.
const CX = G / 2, CZ = G / 2;

function grassTexture() {
  const s = 256, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const c = cv.getContext('2d');
  c.fillStyle = '#eeeeee'; c.fillRect(0, 0, s, s);
  for (let i = 0; i < 2600; i++) {
    c.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.55)';
    c.fillRect(Math.random() * s, Math.random() * s, 3, 3);
  }
  const t = new THREE.CanvasTexture(cv);
  t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(160, 160);
  if (renderer) t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

let ground = null, countryside = null;

export function buildLandscape() {
  ground = new THREE.Mesh(new THREE.CircleGeometry(780, 64),
    new THREE.MeshStandardMaterial({ map: grassTexture(), roughness: 1, color: seasonLook().lawn }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(CX, -0.03, CZ);
  ground.receiveShadow = true;
  backdropGroup.add(ground);
  buildCountryside();
  onSeason(look => { ground.material.color.copy(look.lawn); buildCountryside(); });
  // a river or road that reaches the edge of the board runs on through the countryside, so
  // the trees and houses have to make way: rebuild a moment after the edge changes
  let timer = 0;
  onTerrain((x, z) => {
    if (x > 0 && z > 0 && x < G - 1 && z < G - 1) return;
    clearTimeout(timer);
    timer = setTimeout(() => { if (exitSignature() !== builtFor) buildCountryside(); }, 700);
  });
}

// The strips of countryside taken up by rivers and roads leaving the board: [x0, z0, x1, z1].
function exits() {
  const out = [];
  for (const [s, kind] of [...terrain, ...[...highway.keys()].map(h => [h, 'highway'])]) {
    if (kind === 'hill') continue;
    const [x, z] = s.split(',').map(Number), w = kind === 'water' || kind === 'roadbridge' ? 1.3 : 1.1;
    if (z === 0) out.push([x + 0.5 - w, -400, x + 0.5 + w, 0]);
    if (z === G - 1) out.push([x + 0.5 - w, G, x + 0.5 + w, 400]);
    if (x === 0) out.push([-400, z + 0.5 - w, 0, z + 0.5 + w]);
    if (x === G - 1) out.push([G, z + 0.5 - w, 400, z + 0.5 + w]);
  }
  return out;
}
const exitSignature = () => exits().map(e => e.join(',')).join(';');
let builtFor = '';

// Everything that stands on the lawn. Built with a fixed seed, so each season puts the same
// trees and houses in the same places, in that season's colours.
function buildCountryside() {
  if (countryside) { backdropGroup.remove(countryside); countryside.geometry.dispose(); }
  const look = seasonLook(), strips = exits();
  builtFor = exitSignature();
  const blocked = (x, z, r) => strips.some(e => x + r > e[0] && x - r < e[2] && z + r > e[1] && z - r < e[3]);
  const gb = new GB(), rnd = rng(2026);
  const base = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const put = (id, x, z, scale = 1, rot = rnd() * Math.PI * 2, y = 0) => {
    if (blocked(x, z, scale * 0.45)) return;                     // a river or road runs through here
    base.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, rot), new THREE.Vector3(scale, scale, scale));
    gb.base = base;
    ITEMS[id].build(gb, rnd);
    gb.base = null;
  };
  const onBoard = (x, z, margin) => x > -margin && z > -margin && x < G + margin && z < G + margin;

  // Everything is placed by its distance outside the board edge, so it still fits if the
  // board size changes. W/E/N/S are the four edges.
  const E = G / 2, W0 = CX - E, E0 = CX + E, N0 = CZ - E, S0 = CZ + E;

  // rice paddies: flat squares of water and young green rows
  const WATER = look.water, BANK = look.bank, ROW = look.crop;
  const paddies = [
    [W0 - 9, CZ - 8, 9, 7], [W0 - 9, CZ + 1, 9, 6], [W0 - 20, CZ - 5, 8, 10],
    [E0 + 7, S0 - 6, 10, 7], [E0 + 19, S0 - 7, 8, 8], [CX - 8, S0 + 9, 8, 6], [CX + 4, S0 + 10, 9, 7], [E0 + 8, CZ - 4, 9, 6],
  ];
  for (const [px, pz, w, d] of paddies) {
    if (strips.some(e => px + w / 2 > e[0] && px - w / 2 < e[2] && pz + d / 2 > e[1] && pz - d / 2 < e[3])) continue;
    gb.slab(px, -0.02, pz, w + 0.5, 0.03, d + 0.5, BANK);
    gb.slab(px, -0.015, pz, w, 0.03, d, WATER);
    for (let r = -w / 2 + 0.5; r < w / 2; r += 0.7) gb.slab(px + r, 0, pz, 0.14, 0.05, d - 0.6, ROW);
  }

  // trees scattered round the board, thicker close in
  const TREES = ['sakura', 'sakura', 'sakura', 'pine', 'maple', 'pine'];
  for (let i = 0; i < 260; i++) {
    const a = rnd() * Math.PI * 2, r = E + 3 + Math.pow(rnd(), 1.6) * 100;
    const x = CX + Math.cos(a) * r, z = CZ + Math.sin(a) * r;
    if (onBoard(x, z, 1.6)) continue;
    put(TREES[Math.floor(rnd() * TREES.length)], x, z, 1.5 + rnd() * 1.6);
  }

  // villages
  const villages = [
    [W0 - 9, N0 - 7, 9], [E0 + 9, N0 + 6, 8], [E0 + 7, S0 + 14, 7], [W0 - 10, S0 + 6, 8],
    [CX - 2, N0 - 16, 7], [W0 - 26, N0 - 18, 9], [E0 + 30, S0 - 4, 10], [CX + 6, S0 + 22, 8],
  ];
  for (const [vx, vz, n] of villages) {
    for (let i = 0; i < n; i++) {
      const x = vx + (rnd() - 0.5) * 11, z = vz + (rnd() - 0.5) * 9;
      if (onBoard(x, z, 2)) continue;
      put(rnd() < 0.8 ? 'house' : 'ramen-shop', x, z, 2 + rnd() * 0.5, Math.floor(rnd() * 4) * Math.PI / 2 + (rnd() - 0.5) * 0.2);
    }
  }

  // a shrine to the west: gates leading to a pagoda
  put('torii', W0 - 9, CZ + 12, 3.2, Math.PI / 2);
  put('torii', W0 - 14, CZ + 12, 3.2, Math.PI / 2);
  put('pagoda', W0 - 21, CZ + 12, 4.2, 0);
  for (const dz of [-4, 4]) for (const dx of [-8, -13, -18]) put('sakura', W0 + dx, CZ + 12 + dz, 2.6);

  // the castle on its hill, to the south-east
  const HILL = look.mound;
  gb.blob(E0 + 22, -1, S0 + 18, 15, 5.5, 13, HILL, 0.4);
  put('castle', E0 + 22, S0 + 18, 7, Math.PI * 0.75, 3.6);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; put('sakura', E0 + 22 + Math.cos(a) * 9.5, S0 + 18 + Math.sin(a) * 8, 2.6, undefined, 1.6); }

  // the city on the skyline, to the north-east towards the mountain
  for (let i = 0; i < 52; i++) {
    const x = E0 + 22 + rnd() * 66, z = N0 - 30 - rnd() * 62;
    put('office', x, z, 4.5 + rnd() * 5.5, Math.floor(rnd() * 4) * Math.PI / 2);
  }

  countryside = gb.mesh(sceneryMat);
  countryside.receiveShadow = true;
  backdropGroup.add(countryside);
}

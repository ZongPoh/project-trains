import * as THREE from 'three';
import { G } from '../core/constants.js';
import { C } from '../core/colors.js';
import { GB } from '../core/builder.js';
import { rng } from '../core/random.js';
import { backdropGroup } from '../core/stage.js';
import { seasonLook, onSeason } from './seasons.js';

// The far view: a snow-capped volcano and a ring of blue-green hills.
const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });

let peak = null, ring = null;

function volcano() {
  const profile = [[150, 0], [112, 9], [84, 20], [62, 33], [44, 47], [30, 60], [19, 71], [11, 79], [7.5, 83], [0, 82]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(profile, 36).toNonIndexed();
  g.computeVertexNormals();
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
  const m = new THREE.Mesh(g, mat);
  m.position.set(G / 2 + 215, -1, G / 2 - 430);
  m.scale.set(1.45, 0.86, 1.45);
  return m;
}

// Colour each facet of the mountain by its height: grass at the foot, rock, then snow above a
// ragged line. The line comes far down the slopes in winter and climbs in summer.
function paintVolcano(look) {
  const pos = peak.geometry.attributes.position, col = peak.geometry.attributes.color;
  const rock = [C('#5f7697'), C('#6b83a3'), C('#566c8c')], snow = [C('#f4f7fa'), C('#e3ebf2')], foot = C(look.foot);
  for (let i = 0; i < pos.count; i += 3) {
    const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    const line = look.snowLine + 7 * Math.sin(a * 7) + 4 * Math.sin(a * 13 + 1);
    const c = y > line ? snow[(i / 3) % 2] : y < 10 ? foot : rock[(i / 3) % 3];
    for (let k = 0; k < 3; k++) col.setXYZ(i + k, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
}

function hills(look) {
  const gb = new GB(), rnd = rng(11), tones = look.hills.map(C);
  for (let i = 0; i < 46; i++) {
    const a = i / 46 * Math.PI * 2 + rnd() * 0.1, r = 230 + rnd() * 150, s = 34 + rnd() * 50;
    gb.blob(G / 2 + Math.cos(a) * r, -3, G / 2 + Math.sin(a) * r, s * (1 + rnd() * 0.6), s * (0.14 + rnd() * 0.2), s, tones[i % 5], rnd() * 3);
  }
  return gb.mesh(mat);
}

function paint(look) {
  paintVolcano(look);
  if (ring) { backdropGroup.remove(ring); ring.geometry.dispose(); }
  ring = hills(look);
  backdropGroup.add(ring);
}

peak = volcano();
backdropGroup.add(peak);
paint(seasonLook());
onSeason(paint);

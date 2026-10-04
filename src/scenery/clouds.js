import * as THREE from 'three';
import { G } from '../core/constants.js';
import { GB } from '../core/builder.js';
import { rng } from '../core/random.js';
import { backdropGroup } from '../core/stage.js';

// Puffy low-poly clouds that drift slowly round the board.
const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
const group = new THREE.Group();
group.position.set(G / 2, 0, G / 2);
backdropGroup.add(group);

const WHITE = new THREE.Color(1, 1, 1);
const rnd = rng(77);
for (let i = 0; i < 22; i++) {
  const gb = new GB(), n = 4 + Math.floor(rnd() * 4);
  for (let k = 0; k < n; k++) {
    const s = 0.6 + rnd() * 0.7;
    gb.blob((k - n / 2) * 0.9 + rnd() * 0.4, rnd() * 0.3, (rnd() - 0.5) * 0.9, s * 1.25, s * 0.62, s, WHITE, rnd() * 3);
  }
  const m = gb.mesh(mat), a = rnd() * Math.PI * 2, r = 230 + rnd() * 420;
  m.position.set(Math.cos(a) * r, 46 + rnd() * 95, Math.sin(a) * r);
  m.scale.setScalar(16 + rnd() * 22);
  m.rotation.y = rnd() * Math.PI;
  group.add(m);
}

export function setCloudTint(color) { mat.emissive.copy(color); }
export function stepClouds(dt) { group.rotation.y += dt * 0.004; }

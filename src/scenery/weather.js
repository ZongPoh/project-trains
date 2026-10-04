import * as THREE from 'three';
import { scene } from '../core/stage.js';
import { cam } from '../input/camera.js';
import { seasonLook, onSeason } from './seasons.js';

// What drifts through the air: cherry petals in spring, leaves in autumn, snow in winter.
// A cloud of small dots falls inside a box that follows the camera, so it is always around
// whatever the player is looking at.
const MAX = 800, BOX = 46, TOP = 16;
const pos = new Float32Array(MAX * 3), sway = new Float32Array(MAX);
for (let i = 0; i < MAX; i++) {
  pos[i * 3] = (Math.random() - 0.5) * BOX; pos[i * 3 + 1] = Math.random() * TOP; pos[i * 3 + 2] = (Math.random() - 0.5) * BOX;
  sway[i] = Math.random() * Math.PI * 2;
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
const mat = new THREE.PointsMaterial({ size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false });
const points = new THREE.Points(geo, mat);
points.frustumCulled = false;
scene.add(points);

let fall = null, clock = 0;
function apply(look) {
  fall = look.fall;
  points.visible = !!fall;
  if (!fall) return;
  mat.color.setHex(fall.color); mat.size = fall.size;
  geo.setDrawRange(0, fall.count);
}
apply(seasonLook());
onSeason(apply);

export function stepWeather(dt) {
  if (!fall) return;
  clock += dt;
  for (let i = 0; i < fall.count; i++) {
    const k = i * 3;
    pos[k + 1] -= fall.speed * dt * (0.7 + (i % 7) * 0.08);
    pos[k] += Math.sin(clock * 0.9 + sway[i]) * fall.drift * dt;
    pos[k + 2] += Math.cos(clock * 0.7 + sway[i]) * fall.drift * dt * 0.6;
    if (pos[k + 1] < 0) { pos[k + 1] = TOP; pos[k] = (Math.random() - 0.5) * BOX; pos[k + 2] = (Math.random() - 0.5) * BOX; }
  }
  geo.attributes.position.needsUpdate = true;
  points.position.set(cam.tx, 0, cam.tz);
}

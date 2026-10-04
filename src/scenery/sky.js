import * as THREE from 'three';
import { G } from '../core/constants.js';
import { backdropGroup } from '../core/stage.js';

// The sky: a huge dome coloured from horizon to zenith, a sun or moon, and stars for the night.
const R = 900;
const dome = new THREE.Mesh(
  new THREE.SphereGeometry(R, 40, 24),
  new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
dome.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(dome.geometry.attributes.position.count * 3), 3));
dome.position.set(G / 2, 0, G / 2);
dome.renderOrder = -10;

function glowTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ fog: false, depthWrite: false }));
const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
disc.renderOrder = -8; glow.renderOrder = -9;

const starPos = [];
for (let i = 0; i < 700; i++) {
  const a = Math.random() * Math.PI * 2, e = Math.asin(0.06 + Math.random() * 0.94), r = R - 20;
  starPos.push(G / 2 + Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, G / 2 + Math.sin(a) * Math.cos(e) * r);
}
const stars = new THREE.Points(
  new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3)),
  new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, depthWrite: false, transparent: true, opacity: 0.9 }));
stars.renderOrder = -9;

backdropGroup.add(dome, glow, disc, stars);

const _a = new THREE.Color(), _b = new THREE.Color();
// look: { top, mid, horizon, sunDir:[x,y,z], disc, discSize, glow, glowSize, stars } with colours as THREE.Color
export function setSky(look) {
  const pos = dome.geometry.attributes.position, col = dome.geometry.attributes.color;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / R;
    if (t <= 0) _a.copy(look.horizon);
    else if (t < 0.22) _a.copy(look.horizon).lerp(look.mid, t / 0.22);
    else _a.copy(look.mid).lerp(look.top, Math.min(1, (t - 0.22) / 0.6));
    col.setXYZ(i, _a.r, _a.g, _a.b);
  }
  col.needsUpdate = true;

  const d = new THREE.Vector3(...look.sunDir).normalize();
  disc.position.set(G / 2 + d.x * (R - 40), d.y * (R - 40), G / 2 + d.z * (R - 40));
  glow.position.copy(disc.position).addScaledVector(d, 4);
  disc.scale.setScalar(look.discSize); glow.scale.setScalar(look.glowSize);
  disc.lookAt(G / 2, 0, G / 2); glow.lookAt(G / 2, 0, G / 2);
  disc.material.color.copy(look.disc);
  glow.material.color.copy(_b.copy(look.glow));
  stars.visible = !!look.stars;
}

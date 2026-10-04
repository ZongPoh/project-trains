import * as THREE from 'three';
import { H } from '../core/constants.js';
import { scene } from '../core/stage.js';

// The coloured highlight that shows where a tool is about to act.
export const AMBER = 0xffd24a, RED = 0xe2513a, BLUE = 0x7fd6ff, GREEN = 0x8fe08a;

const ghostMat = new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide, fog: false });
const square = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), ghostMat);
square.rotation.x = -Math.PI / 2;
square.visible = false;

const rampGeo = new THREE.BufferGeometry();
rampGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3));
rampGeo.setIndex([0, 1, 2, 2, 1, 3]);
const slope = new THREE.Mesh(rampGeo, ghostMat);
slope.frustumCulled = false;
slope.visible = false;

scene.add(square, slope);

export function hideGhost() { square.visible = false; slope.visible = false; }

export function showSquare(x, z, l, hex) {
  ghostMat.color.setHex(hex);
  square.scale.set(1, 1, 1);
  square.position.set(x + 0.5, l * H + 0.075, z + 0.5);
  square.visible = true; slope.visible = false;
}

// Highlight a block of squares, for buildings that take more than one.
export function showRect(x, z, w, d, l, hex) {
  ghostMat.color.setHex(hex);
  square.scale.set(w, d, 1);
  square.position.set(x + w / 2, l * H + 0.075, z + d / 2);
  square.visible = true; slope.visible = false;
}

// A sloping highlight between four corner points, for the ramp tools.
export function showSlope(corners, hex) {
  const a = rampGeo.attributes.position;
  corners.forEach((c, i) => a.setXYZ(i, c[0], c[1], c[2]));
  a.needsUpdate = true;
  ghostMat.color.setHex(hex);
  slope.visible = true; square.visible = false;
}

import { G } from '../core/constants.js';
import { canvas, renderer, camera } from '../core/stage.js';

// The orbit camera: it looks at a point on the board from a distance, turned by yaw and pitch.
export const cam = { tx: G / 2, tz: G / 2, yaw: -0.55, pitch: 0.8, dist: G * 1.4 };

export function resetCam() {
  const a = camera.aspect || 1.5, tv = Math.tan(camera.fov * Math.PI / 360);
  cam.tx = G / 2; cam.tz = G / 2; cam.yaw = -0.55; cam.pitch = 0.8;
  cam.dist = Math.min(G * 2.2, Math.max(G * 0.4 / tv, G * 0.56 / (tv * a)));
}

// The camera is kept out of hills and buildings: clearance(x, z) says how high it has to be
// over a point on the board (see obstacles.js), and the camera rises to that as it comes near.
let clearance = null;
export function setClearance(fn) { clearance = fn; }

export function applyCam() {
  cam.tx = Math.min(G + 3, Math.max(-3, cam.tx)); cam.tz = Math.min(G + 3, Math.max(-3, cam.tz));
  cam.dist = Math.min(G * 3.2, Math.max(5, cam.dist)); cam.pitch = Math.min(1.5, Math.max(0.07, cam.pitch));
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const x = cam.tx + cam.dist * cp * Math.sin(cam.yaw), z = cam.tz + cam.dist * cp * Math.cos(cam.yaw);
  let y = 0.5 + cam.dist * sp;
  if (clearance) y = Math.max(y, clearance(x, z));
  camera.position.set(x, y, z);
  camera.lookAt(cam.tx, 0.5, cam.tz);
}

// Slide the view by a number of screen pixels.
export function panBy(dx, dy) {
  const k = cam.dist * 0.0017, s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
  cam.tx += (-c * dx - s * dy) * k; cam.tz += (s * dx - c * dy) * k;
}

export function orbitBy(dx, dy) { cam.yaw -= dx * 0.006; cam.pitch += dy * 0.005; }
export function zoomBy(factor) { cam.dist *= factor; }

// Normally the view is shifted up a little to leave room for the depot along the bottom.
// While riding a train the depot is hidden, so the shift is turned off.
let viewShift = true;
export function setViewShift(on) { viewShift = on; resize(); }

export function resize() {
  const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  if (viewShift) camera.setViewOffset(w, h, 0, Math.round(h * 0.08), w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}

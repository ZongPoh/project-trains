import * as THREE from 'three';
import { camera } from '../core/stage.js';
import { emit, on } from '../core/events.js';
import { trains } from '../trains/store.js';
import { cam, setViewShift } from './camera.js';

// Riding a train. Instead of looking down at the board, the camera travels with one train:
//   cab     just above the driver, looking down the line over the nose
//   chase   following a little behind and above
//   window  from a passenger window, watching the scenery go by
// Dragging looks around; the wheel moves the chase camera nearer or further.
export const VIEWS = ['cab', 'chase', 'window'];
export const VIEW_NAMES = { cab: 'Driver’s cab', chase: 'Chase', window: 'Passenger window' };
export const ride = { train: null, view: 'cab', yaw: 0, pitch: 0, zoom: 1 };

const V3 = THREE.Vector3, UP = new V3(0, 1, 0);
const fwd = new V3(0, 0, 1), want = new V3(), right = new V3(), eye = new V3(), eyeNow = new V3(), aim = new V3(), dir = new V3();
const FOV = { cab: 64, chase: 50, window: 62 }, ORBIT_FOV = 38;
let fresh = true;

function lens(fov, near) {
  camera.fov = fov; camera.near = near;
  camera.updateProjectionMatrix();
}

export function startRide(tr) {
  ride.train = tr; ride.yaw = 0; ride.pitch = 0; ride.zoom = 1; fresh = true;
  setViewShift(false);
  lens(FOV[ride.view], 0.04);
  emit('ride', { train: tr });
}

export function stopRide() {
  if (!ride.train) return;
  ride.train = null;
  setViewShift(true);
  lens(ORBIT_FOV, 0.1);
  cam.dist = Math.min(cam.dist, 16);                     // come back out close to where the ride ended
  emit('ride', { train: null });
}

export function nextView() {
  ride.view = VIEWS[(VIEWS.indexOf(ride.view) + 1) % VIEWS.length];
  ride.yaw = 0; ride.pitch = 0; fresh = true;
  lens(FOV[ride.view], 0.04);
  emit('ride', { train: ride.train });
}

// Move on to the next train on the board.
export function nextTrain() {
  const live = trains.filter(t => t.state === 'run');
  if (!live.length) return;
  startRide(live[(live.indexOf(ride.train) + 1) % live.length]);
}

export function rideLook(dx, dy) {
  ride.yaw -= dx * 0.005;
  ride.pitch = Math.max(-0.7, Math.min(0.9, ride.pitch - dy * 0.004));
}
export function rideZoom(f) { ride.zoom = Math.max(0.45, Math.min(3, ride.zoom * f)); }

// A coupling station has joined or split the train being ridden: stay aboard.
on('joined', e => { if (e.was.includes(ride.train)) { ride.train = e.train; emit('ride', { train: e.train }); } });
on('split', e => { if (e.was === ride.train) { ride.train = e.lead; emit('ride', { train: e.lead }); } });

// Set the camera for this frame. Returns false when nobody is riding, so the orbit camera runs.
export function applyRide(dt) {
  const tr = ride.train;
  if (!tr) return false;
  if (!trains.includes(tr)) { stopRide(); return false; }      // the train was removed, coupled or split
  if (tr.state !== 'run') return true;                          // crashed: hold the last view until it is back

  const cars = tr.cars, lead = tr.flipped ? cars[cars.length - 1] : cars[0];
  want.subVectors(lead.s[0], lead.s[2]);
  if (want.lengthSq() > 1e-8) want.normalize(); else want.copy(fwd);
  if (fresh) fwd.copy(want); else fwd.lerp(want, 1 - Math.exp(-dt * 7)).normalize();     // ease round curves
  right.crossVectors(fwd, UP).normalize();
  const at = lead.mesh.position;

  if (ride.view === 'cab') {
    eye.copy(at).addScaledVector(fwd, lead.len * 0.08).addScaledVector(UP, lead.top + 0.035);
    dir.copy(fwd).addScaledVector(UP, -0.1);
  } else if (ride.view === 'chase') {
    eye.copy(at).addScaledVector(fwd, -3 * ride.zoom).addScaledVector(UP, 0.4 + 0.5 * ride.zoom);
    dir.copy(at).addScaledVector(fwd, 1.2).sub(eye);
  } else {
    const car = cars[Math.min(cars.length - 1, tr.flipped ? cars.length - 2 : 1)];
    eye.copy(car.mesh.position).addScaledVector(right, 0.13).addScaledVector(UP, 0.2);
    dir.copy(right).addScaledVector(fwd, 0.55);
  }
  dir.normalize().applyAxisAngle(UP, ride.yaw);
  dir.y += ride.pitch; dir.normalize();

  // the chase camera glides after the train; the other two are fixed to it
  if (ride.view === 'chase' && !fresh) eyeNow.lerp(eye, 1 - Math.exp(-dt * 5)); else eyeNow.copy(eye);
  camera.position.copy(eyeNow);
  camera.lookAt(aim.copy(eyeNow).add(dir));
  cam.tx = at.x; cam.tz = at.z;                                  // sound, weather and the way back follow the train
  fresh = false;
  return true;
}

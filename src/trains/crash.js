import * as THREE from 'three';
import { key } from '../core/constants.js';
import { fxGroup } from '../core/stage.js';
import { toast } from '../core/dom.js';
import { occ } from '../tracks/model.js';
import { trains } from './store.js';
import { seat, removeTrain } from './runtime.js';
import { touching } from './proximity.js';
import { release } from './driving.js';

// What happens after two trains touch: the cars are thrown off the rails, tumble, and fade.
// A moment later the train is put back on the track where the player first placed it,
// blinking for a couple of seconds while it cannot be hit.
const TUMBLE = 1.7, FADE = 0.4, RESPAWN = 2.6, RETRY = 0.5, GIVE_UP = 9, GHOST = 2.2;
const GRAVITY = 13, FLOOR = 0.075;
const V3 = THREE.Vector3;
const _fwd = new V3(), _away = new V3();

export function startCrash(tr, hit) {
  const speed = tr.v;
  release(tr);
  tr.state = 'crashed'; tr.t = 0; tr.v = 0;
  tr.nextTry = RESPAWN + Math.random() * 1.5;               // not all at once, or they would only crash again
  tr.wait = 0; tr.ghost = 0;
  for (const c of tr.cars) {
    _fwd.subVectors(c.s[0], c.s[2]).setY(0).normalize();
    _away.subVectors(c.s[1], hit).setY(0);
    const far = _away.length();
    if (far < 1e-4) _away.set(Math.random() - 0.5, 0, Math.random() - 0.5);
    _away.normalize();
    const punch = 2.6 / (1 + far * 1.2);                      // cars nearest the impact fly furthest
    c.vel = new V3().addScaledVector(_fwd, speed * 0.55).addScaledVector(_away, punch * (0.6 + Math.random()));
    c.vel.y = punch * (0.9 + Math.random() * 0.8) + 0.6;
    c.spin = new V3((Math.random() - 0.5) * 9 * punch, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 9 * punch);
    c.mesh.visible = true;
  }
}

function tumble(tr, dt) {
  for (const c of tr.cars) {
    const m = c.mesh;
    c.vel.y -= GRAVITY * dt;
    m.position.addScaledVector(c.vel, dt);
    m.rotation.x += c.spin.x * dt; m.rotation.y += c.spin.y * dt; m.rotation.z += c.spin.z * dt;
    if (m.position.y < FLOOR) {                                // bounce, then slide to a stop
      m.position.y = FLOOR;
      c.vel.y = Math.abs(c.vel.y) > 1.2 ? -c.vel.y * 0.32 : 0;
      c.vel.x *= 0.55; c.vel.z *= 0.55; c.spin.multiplyScalar(0.45);
    }
  }
}

function respawn(tr, force) {
  const p = occ.get(key(tr.home.x, tr.home.z, tr.home.l));
  if (!p) {
    removeTrain(tr);
    toast('A crashed train had no track to go back to, so it returned to the depot.');
    return true;
  }
  seat(tr, p);
  if (!force) for (const o of trains) {                        // wait until its starting place is clear
    if (o !== tr && o.state === 'run' && touching(tr, o)) return false;
  }
  for (const c of tr.cars) { c.mesh.scale.setScalar(1); c.mesh.visible = true; }
  tr.state = 'run'; tr.ghost = GHOST;
  return true;
}

/* ----- sparks, smoke and a flash ----- */
const bits = [];
const sparkGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
const puffGeo = new THREE.IcosahedronGeometry(1, 1);
const SPARKS = [0xffd24a, 0xff9a2e, 0xfff3c4];

export function burst(at) {
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: SPARKS[i % 3] }));
    m.position.copy(at); m.position.y += 0.12;
    const a = Math.random() * Math.PI * 2, s = 1.2 + Math.random() * 2.6;
    bits.push({ m, kind: 'spark', t: 0, life: 0.7 + Math.random() * 0.5, vel: new V3(Math.cos(a) * s, 2 + Math.random() * 3, Math.sin(a) * s) });
    fxGroup.add(m);
  }
  for (let i = 0; i < 7; i++) {
    const m = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0x8b9096 : 0x5c6166, transparent: true, opacity: 0.75, depthWrite: false }));
    m.position.set(at.x + (Math.random() - 0.5) * 0.5, at.y + 0.15, at.z + (Math.random() - 0.5) * 0.5);
    bits.push({ m, kind: 'puff', t: 0, life: 1.5 + Math.random() * 0.7, size: 0.1 + Math.random() * 0.1, vel: new V3((Math.random() - 0.5) * 0.5, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 0.5) });
    fxGroup.add(m);
  }
  const flash = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.9, depthWrite: false }));
  flash.position.copy(at); flash.position.y += 0.15;
  bits.push({ m: flash, kind: 'flash', t: 0, life: 0.28, vel: new V3() });
  fxGroup.add(flash);
}

function stepBits(dt) {
  for (let i = bits.length - 1; i >= 0; i--) {
    const b = bits[i], m = b.m;
    b.t += dt;
    const u = b.t / b.life;
    if (u >= 1) { fxGroup.remove(m); m.material.dispose(); bits.splice(i, 1); continue; }
    m.position.addScaledVector(b.vel, dt);
    if (b.kind === 'spark') { b.vel.y -= GRAVITY * dt; m.scale.setScalar(1 - u * 0.7); if (m.position.y < 0.03) { m.position.y = 0.03; b.vel.set(0, 0, 0); } }
    else if (b.kind === 'puff') { m.scale.setScalar(b.size * (1 + u * 2.4)); m.material.opacity = 0.75 * (1 - u); }
    else { m.scale.setScalar(0.15 + u * 0.9); m.material.opacity = 0.9 * (1 - u); }
  }
}

// Called every frame while the game is running.
export function stepCrashes(dt) {
  for (const tr of trains.slice()) {
    if (tr.state === 'crashed') {
      tr.t += dt;
      if (tr.t < TUMBLE + FADE) {
        tumble(tr, dt);
        if (tr.t > TUMBLE) { const s = Math.max(0.001, 1 - (tr.t - TUMBLE) / FADE); for (const c of tr.cars) c.mesh.scale.setScalar(s); }
      } else {
        for (const c of tr.cars) c.mesh.visible = false;
        if (tr.t >= tr.nextTry) {
          if (!respawn(tr, tr.t > GIVE_UP)) tr.nextTry = tr.t + RETRY;
        }
      }
    } else if (tr.ghost > 0) {                                   // just respawned: blink
      tr.ghost -= dt;
      const on = tr.ghost <= 0 || Math.floor(tr.ghost * 9) % 2 === 0;
      for (const c of tr.cars) c.mesh.visible = on;
    }
  }
  stepBits(dt);
}

// Remove every spark at once, for when the board is cleared.
export function clearEffects() {
  for (const b of bits) { fxGroup.remove(b.m); b.m.material.dispose(); }
  bits.length = 0;
}

import * as THREE from 'three';
import { state } from '../core/state.js';
import { emit } from '../core/events.js';
import { trains } from './store.js';
import { touching } from './proximity.js';
import { startCrash, burst } from './crash.js';
import { coupling } from './autocouple.js';

// If two trains touch, both crash. (Two sets running together to couple are meant to touch.)
const _hit = new THREE.Vector3();
const live = t => t.state === 'run' && !(t.ghost > 0);

export function checkCollisions() {
  for (let i = 0; i < trains.length; i++) {
    const a = trains[i];
    if (!live(a)) continue;
    for (let j = i + 1; j < trains.length; j++) {
      const b = trains[j];
      if (!live(b) || coupling(a, b) || !touching(a, b, _hit)) continue;
      startCrash(a, _hit); startCrash(b, _hit); burst(_hit);
      state.crashes++;
      emit('crash', { x: _hit.x, z: _hit.z });
      break;
    }
  }
}

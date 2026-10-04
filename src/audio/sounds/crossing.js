import { state } from '../../core/state.js';
import { ringingCrossings } from '../../roads/crossings.js';
import { tone, ready } from '../engine.js';
import { heard } from '../hearing.js';

// The level crossing bell: two notes turn and turn about for as long as the gates are down.
let wait = 0, high = false;

export function stepBell(dt) {
  if (!ready() || state.paused) return;
  wait -= dt;
  if (wait > 0) return;
  wait = 0.36;
  let near = 0;
  for (const p of ringingCrossings()) near = Math.max(near, heard(p.x + 0.5, p.z + 0.5));
  if (near < 0.05) return;
  high = !high;
  const g = Math.min(0.13, 0.11 * near), f = high ? 740 : 587;
  tone({ freq: f, dur: 0.3, gain: g, type: 'sine' });
  tone({ freq: f * 2.76, dur: 0.12, gain: g * 0.35, type: 'sine' });      // the metallic ring of a bell
}

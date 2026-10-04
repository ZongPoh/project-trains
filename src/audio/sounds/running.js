import { state } from '../../core/state.js';
import { trains } from '../../trains/store.js';
import { isHill, isWater } from '../../terrain/model.js';
import { context, ready, noise, tone, noiseLoop } from '../engine.js';
import { heard } from '../hearing.js';

// Trains on the move: a low rushing hum that rises with speed, and the clack of wheels over
// rail joints. Only trains within earshot of the camera are heard (see hearing.js). The hum is
// made from the soft noise (see noiseLoop in engine.js), so it does not hiss.
//   In a tunnel the sound closes in: lower, louder, with a deep roar underneath.
//   On a bridge the clacks come with a hollow thump from the deck.
let rush = null, roar = null, phase = 0;

// Where the front of the train is: 'tunnel', 'bridge' or '' for open line.
function placeOf(t) {
  const p = t.segs[0].p;
  if (p.type !== 'flat') return '';
  if (p.l === 0 && isHill(p.x, p.z)) return 'tunnel';
  return isWater(p.x, p.z) ? 'bridge' : '';
}

export function stepRunning(dt) {
  if (!ready()) return;
  if (!rush) { rush = noiseLoop('bandpass', 500, 0.8, true); roar = noiseLoop('lowpass', 150, 1.2); }
  let loud = 0, fastest = 0, near = 0, place = '';
  if (!state.paused) for (const t of trains) {
    if (t.state !== 'run' || t.v < 0.05) continue;
    const p = t.cars[0].mesh.position, n = heard(p.x, p.z, p.y), w = (t.v / 5) * n;
    loud += w;
    if (w > near) { near = w; fastest = t.v; place = placeOf(t); }
  }
  const now = context().currentTime, tunnel = place === 'tunnel';
  rush.gain.gain.setTargetAtTime(Math.min(0.2, loud * 0.085) * (tunnel ? 1.25 : 1), now, 0.12);
  rush.filter.frequency.setTargetAtTime(tunnel ? 130 + fastest * 40 : 200 + fastest * 70, now, 0.15);
  roar.gain.gain.setTargetAtTime(tunnel ? Math.min(0.34, near * 0.3) : 0, now, tunnel ? 0.08 : 0.25);

  phase += fastest * state.simSpeed * dt * 0.9;                 // one rail joint every so many squares
  if (phase >= 1 && near > 0.05) {
    phase = 0;
    const g = Math.min(0.11, near * 0.07);
    noise({ dur: 0.045, gain: g, filter: 'bandpass', freq: tunnel ? 900 : 1500, q: 2 });
    noise({ at: 0.085, dur: 0.045, gain: g * 0.8, filter: 'bandpass', freq: tunnel ? 760 : 1250, q: 2 });
    if (place === 'bridge') {                                   // the deck booms under each axle
      tone({ freq: 96, slide: 62, dur: 0.16, gain: g * 2.4, type: 'sine' });
      tone({ at: 0.085, freq: 84, slide: 56, dur: 0.16, gain: g * 2, type: 'sine' });
    }
  } else if (phase >= 1) phase = 0;
}

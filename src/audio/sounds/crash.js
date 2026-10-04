import { tone, noise } from '../engine.js';
import { heard } from '../hearing.js';

// A collision: a thump, a burst of tearing metal, and a few clangs as the cars land. Like every
// sound with a place, it is only heard when the camera is near.
export function crash(e) {
  const g = heard(e.x, e.z);
  if (g < 0.03) return;
  tone({ freq: 120, slide: 38, dur: 0.55, gain: 0.5 * g, type: 'sine' });
  noise({ dur: 0.9, gain: 0.42 * g, filter: 'lowpass', freq: 5200, slide: 260, q: 0.6 });
  noise({ at: 0.03, dur: 0.3, gain: 0.25 * g, filter: 'bandpass', freq: 2600, q: 3 });
  for (let i = 0; i < 4; i++) {
    const at = 0.25 + i * 0.22 + Math.random() * 0.1;
    tone({ freq: 380 + Math.random() * 500, at, dur: 0.25, gain: 0.07 * g, type: 'square', slide: 200 });
    noise({ at, dur: 0.12, gain: 0.12 * g, filter: 'highpass', freq: 1800 });
  }
}

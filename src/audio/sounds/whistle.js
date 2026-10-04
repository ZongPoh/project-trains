import { tone, noise } from '../engine.js';
import { heard } from '../hearing.js';

// The conductor's whistle as a train pulls out of a station.
export function depart(e) {
  const g = 0.09 * heard(e.x, e.z);
  if (g < 0.01) return;
  tone({ freq: 2250, slide: 2420, at: 0, dur: 0.34, gain: g, type: 'sine', attack: 0.02 });
  tone({ freq: 2262, slide: 2433, at: 0, dur: 0.34, gain: g * 0.6, type: 'sine', attack: 0.02 });
  noise({ at: 0, dur: 0.3, gain: g * 0.5, filter: 'bandpass', freq: 2400, q: 6 });
}

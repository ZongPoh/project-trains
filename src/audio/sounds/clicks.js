import { tone, noise } from '../engine.js';
import { heard } from '../hearing.js';

// Small sounds for building and operating the railway. What the player does with a tool is
// always heard; what the town does by itself is only heard when the camera is near.
let lastBuild = 0;

export function build() {                       // laying track: a wooden knock, not more than 12 a second
  const now = performance.now();
  if (now - lastBuild < 80) return;
  lastBuild = now;
  tone({ freq: 220 + Math.random() * 40, slide: 120, dur: 0.07, gain: 0.12, type: 'triangle' });
  noise({ dur: 0.035, gain: 0.07, filter: 'bandpass', freq: 2200, q: 1.5 });
}

export function plant(e) {                      // placing scenery, or the town growing a building: a soft pop
  const k = e && e.x != null ? heard(e.x + 0.5, e.z + 0.5) : 1;
  if (k < 0.08) return;
  tone({ freq: 520, slide: 780, dur: 0.09, gain: 0.1 * k, type: 'sine' });
}

export function erase() {                       // removing something: a short puff
  noise({ dur: 0.12, gain: 0.1, filter: 'highpass', freq: 1400, slide: 500 });
}

export function switchLever() {                 // points thrown: clunk-clunk
  tone({ freq: 150, slide: 90, dur: 0.09, gain: 0.22, type: 'square' });
  noise({ dur: 0.05, gain: 0.12, filter: 'lowpass', freq: 900 });
  tone({ freq: 190, slide: 110, at: 0.11, dur: 0.08, gain: 0.16, type: 'square' });
}

export function signalClick() {                 // signal relay: a sharp tick and a ping
  noise({ dur: 0.025, gain: 0.12, filter: 'highpass', freq: 3000 });
  tone({ freq: 1320, at: 0.03, dur: 0.18, gain: 0.07, type: 'sine' });
}

export function placed() {                      // a train set on the rails: a two-note horn
  tone({ freq: 370, dur: 0.32, gain: 0.1, type: 'sawtooth', attack: 0.03 });
  tone({ freq: 466, dur: 0.32, gain: 0.08, type: 'sawtooth', attack: 0.03 });
}

export function couple(e) {                     // couplers meeting: metal on metal
  // at a coupling station the sound comes from where it happens; by hand it is always heard
  const k = e && e.x != null ? heard(e.x, e.z) : 1;
  if (k < 0.08) return;
  noise({ dur: 0.07, gain: 0.2 * k, filter: 'bandpass', freq: 1900, q: 4 });
  tone({ freq: 240, slide: 130, dur: 0.14, gain: 0.2 * k, type: 'square' });
  tone({ freq: 620, at: 0.02, dur: 0.2, gain: 0.05 * k, type: 'triangle' });
}

export function busStop(e) {                    // a bus pulling up: the hiss of its doors
  const g = 0.09 * heard(e.x, e.z);
  if (g < 0.01) return;
  noise({ dur: 0.45, gain: g, filter: 'highpass', freq: 3200, slide: 1500, attack: 0.04 });
}

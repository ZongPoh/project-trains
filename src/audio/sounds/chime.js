import { tone, noise, nearness } from '../engine.js';
import { rng } from '../../core/random.js';

// Station sounds.
//   arrive   two soft notes as the train stops
//   melody   the station's own departure melody, played just before the doors close
//   depart   the conductor's whistle
// Every station name gets a different melody. The tunes are not copies of real ones: each is
// composed here from the letters of the name, in a major key, ending on the home note.
const KEYS = [392.0, 440.0, 466.16, 523.25, 587.33, 622.25, 698.46];          // G4 A4 B♭4 C5 D5 E♭5 F5
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];                      // two octaves of a major scale, in semitones
const RHYTHMS = [                                                               // in eighth notes; each adds up to 12
  [1, 1, 2, 1, 1, 2, 1, 1, 2],
  [2, 1, 1, 2, 1, 1, 2, 2],
  [1, 1, 1, 1, 2, 2, 1, 1, 2],
  [3, 1, 2, 2, 1, 1, 2],
  [2, 2, 1, 1, 2, 1, 1, 2],
];
const STEP = 0.14;             // seconds for an eighth note
const tunes = new Map();

function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

// The melody for a station: a list of { at, freq, long }.
export function tuneFor(name) {
  if (tunes.has(name)) return tunes.get(name);
  const h = hash(name), rnd = rng(h), root = KEYS[h % KEYS.length], rhythm = RHYTHMS[(h >>> 3) % RHYTHMS.length];
  const pitch = d => root * Math.pow(2, SCALE[Math.max(0, Math.min(SCALE.length - 1, d))] / 12);
  const notes = [];
  let d = [0, 2, 4][Math.floor(rnd() * 3)], at = 0;
  const half = Math.ceil(rhythm.length / 2), first = [];
  rhythm.forEach((len, i) => {
    if (i === rhythm.length - 1) d = d > 5 ? 8 : 6;                               // lead into the last note
    else if (i >= half && i - half < first.length && rnd() < 0.6) d = Math.min(8, first[i - half] + (rnd() < 0.5 ? 1 : 2));   // the second half answers the first
    else if (i > 0) {
      const move = [-2, -1, -1, 1, 1, 2, 3][Math.floor(rnd() * 7)];
      d = Math.max(0, Math.min(8, d + (d + move > 8 || d + move < 0 ? -move : move)));
    }
    if (i < half) first.push(d);
    notes.push({ at, freq: pitch(d), long: len > 1 });
    at += len * STEP;
  });
  notes.push({ at, freq: pitch(7), long: true, last: true });                    // home, an octave up
  tunes.set(name, notes);
  return notes;
}

function bell(freq, at, gain, dur = 0.5) {
  tone({ freq, at, dur, gain, type: 'sine' });
  tone({ freq: freq * 2, at, dur: dur * 0.45, gain: gain * 0.3, type: 'triangle' });
}

export function arrive(e) {
  const g = Math.min(0.1, 0.08 * nearness(e.x, e.z));
  if (g < 0.01) return;
  bell(659.25, 0, g, 0.45); bell(523.25, 0.24, g, 0.6);
}

export function melody(e) {
  const g = Math.min(0.16, 0.13 * nearness(e.x, e.z));
  if (g < 0.01) return;
  for (const n of tuneFor(e.name || '')) {
    bell(n.freq, n.at, g, n.last ? 0.9 : n.long ? 0.5 : 0.32);
    if (n.last) { bell(n.freq * 0.63, n.at, g * 0.5, 0.9); bell(n.freq * 0.75, n.at, g * 0.5, 0.9); }   // a closing chord
  }
}

export function depart(e) {
  const g = Math.min(0.09, 0.07 * nearness(e.x, e.z));
  if (g < 0.01) return;
  tone({ freq: 2250, slide: 2420, at: 0, dur: 0.34, gain: g, type: 'sine', attack: 0.02 });
  tone({ freq: 2262, slide: 2433, at: 0, dur: 0.34, gain: g * 0.6, type: 'sine', attack: 0.02 });
  noise({ at: 0, dur: 0.3, gain: g * 0.5, filter: 'bandpass', freq: 2400, q: 6 });
}

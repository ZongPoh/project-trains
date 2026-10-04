import { settings } from '../core/settings.js';
import { context, output, ready } from './engine.js';

// Background music: a slow piece for koto and bamboo flute.
//   Nothing here is recorded, sampled or borrowed. The tune was written for this game (the
//   notes are the lists below) and both instruments are built from scratch in the browser, so
//   there is no recording and no published melody in it for anyone to claim.
//   scale   hirajoshi, the old koto tuning: D E F A B flat
//   koto    a plucked string, worked out once for each note (Karplus-Strong: a burst of noise
//           going round a short loop that loses a little of its brightness on every turn)
//   flute   a soft tone that slides up into each note and then wavers, as a shakuhachi does
//   room    a faint echo round both, so they do not sound dry
// The music is not tied to a place on the board: it plays wherever the camera is.

const BPM = 72, BEAT = 60 / BPM, BAR = 4 * BEAT;
const LEVEL = 0.36;                         // how loud the music is against everything else
const HOME = 293.66;                        // note 0 is the D above middle C
const STEPS = [0, 2, 3, 7, 8];              // the five notes of the scale, in semitones above D
const freqOf = n => HOME * Math.pow(2, (STEPS[((n % 5) + 5) % 5] + 12 * Math.floor(n / 5)) / 12);
// Note numbers:  -5 D  -4 E  -3 F  -2 A  -1 B♭  |  0 D  1 E  2 F  3 A  4 B♭  |  5 D  6 E  7 F  8 A  9 B♭  |  10 D

// Koto phrases, two bars each: [beat, note] or [beat, note, 1] for a note doubled an octave lower.
const KOTO = {
  a: [[0, 5], [1.5, 3], [2, 4], [3, 3], [4, 2], [5, 1], [6, 0, 1]],
  b: [[0, 0], [1, 1], [2, 2], [3, 3], [4.5, 4], [5, 3], [6, 2], [7, 3]],
  c: [[0, 3], [1, 2], [2, 1], [3, 2], [4, 1], [5, -1], [6, 0, 1]],
  d: [[0, 3, 1], [2, 4], [3, 5], [4, 3], [6, 2], [7, 1]],
  e: [[0, 0], [0.5, 1], [1, 3], [2, 2], [4, 1], [4.5, 2], [5, 4], [6, 3, 1]],
  f: [[0, 5], [1, 6], [2, 7], [3, 6], [4, 5], [5, 4], [6, 3, 1]],
  g: [[0, 8], [1, 7], [2, 6], [3, 5], [4, 7], [5, 6], [6, 5, 1]],
  h: [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0, 1], [6, -2], [7, 0]],
  i: [[0, 0], [1, 3], [2, 5], [3, 3], [4, -1], [5, 3], [6, 4], [7, 3]],       // broken chords under the flute
  j: [[0, 0], [1, 3], [2, 5], [3, 3], [4, -2], [5, 2], [6, 3], [7, 2]],
};
// Flute phrases, two bars each: [beat, note, length in beats].
const FLUTE = {
  p: [[0, 3, 3.5], [4, 4, 1.5], [6, 3, 2]],
  q: [[0, 2, 3], [3, 1, 1], [4, 0, 4]],
  r: [[0, 5, 3.5], [4, 6, 1], [5, 7, 1], [6, 6, 2]],
  s: [[0, 5, 2], [2, 4, 2], [4, 3, 4]],
  t: [[0, 3, 4], [4, 2, 2], [6, 1, 2]],
  u: [[0, 1, 2], [2, -1, 2], [4, 0, 4]],
};
// The piece: five sections of four phrases. Each phrase names a koto phrase and, where the flute
// plays, a flute phrase. sweep: the section opens with a run down the strings. bass: the low
// string answers on the third beat as well as the first.
const PIECE = [
  { sweep: true, bass: true, phrases: ['a', 'b', 'a', 'c'] },
  { bass: true, phrases: ['d', 'e', 'd', 'cq'] },
  { phrases: ['ip', 'jq', 'ir', 'js'] },
  { sweep: true, bass: true, phrases: ['f', 'g', 'f', 'hu'] },
  { phrases: ['it', 'ju', 'a', 'cq'] },
];

let bus = null, room = null, playing = false, bar = 0, nextBar = 0;
const strings = new Map(), live = new Set();

function setUp(ctx) {
  bus = ctx.createGain(); bus.gain.value = 0;
  const top = ctx.createBiquadFilter();                       // nothing sharp: this is music to build by
  top.type = 'lowpass'; top.frequency.value = 5500; top.Q.value = 0;
  bus.connect(top); top.connect(output());
  // the room: a short burst of noise dying away, which the echo is shaped by
  const sr = ctx.sampleRate, n = Math.floor(sr * 2.2), shape = ctx.createBuffer(1, n, sr), d = shape.getChannelData(0);
  let soft = 0;
  for (let i = 0; i < n; i++) {
    soft += 0.25 * ((Math.random() * 2 - 1) - soft);          // dulled, so the echo is warm
    d[i] = soft * Math.exp(-3.2 * i / sr);
  }
  const echo = ctx.createConvolver(); echo.buffer = shape;
  room = ctx.createGain(); room.gain.value = 0.3;
  room.connect(echo); echo.connect(bus);
}

// One koto string, made the first time its note is needed.
function string(n) {
  if (strings.has(n)) return strings.get(n);
  const ctx = context(), sr = ctx.sampleRate, f = freqOf(n);
  // Each turn round the loop takes a little brightness off. A low string goes round fewer times
  // a second, so it is dulled more on each turn (damp), or it would buzz long after a high one
  // had mellowed. taps is that dulling: damp averagings of neighbouring samples, done in one go.
  const damp = Math.max(1, Math.round(560 / f)), taps = [1];
  for (let k = 0; k < damp; k++) { taps.push(0); for (let j = taps.length - 1; j > 0; j--) taps[j] = 0.5 * (taps[j] + taps[j - 1]); taps[0] *= 0.5; }
  const loop = Math.max(2, Math.round(sr / f - damp / 2)), ring = f < 250 ? 2.8 : f < 600 ? 2.3 : 1.7;
  const len = Math.floor(sr * ring), buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
  for (let i = 0; i < loop; i++) d[i] = Math.random() * 2 - 1;                  // the pluck
  // A raw burst is all edge. Rounding it off leaves each overtone weaker than the one below it,
  // as on a real string. (Twice round: the first turn only settles the rounding in.)
  const round = 1 - Math.exp(-2 * Math.PI * Math.min(2500, 4 * f) / sr);
  let soft = 0;
  for (let turn = 0; turn < 2; turn++) for (let i = 0; i < loop; i++) { soft += round * (d[i] - soft); if (turn) d[i] = soft; }
  let mean = 0;
  for (let i = 0; i < loop; i++) mean += d[i] / loop;
  for (let i = 0; i < loop; i++) d[i] -= mean;
  const loss = Math.pow(10, -3 / (f * ring));                                    // dies away over the ring time
  for (let i = loop; i < len; i++) {
    let v = 0;
    for (let k = 0; k <= damp; k++) v += taps[k] * d[Math.max(0, i - loop - k)];
    d[i] = loss * v;
  }
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
  const fade = Math.floor(sr * 0.2), ease = Math.floor(sr * 0.0015);            // eased in, so the pluck does not click
  for (let i = 0; i < len; i++) d[i] *= (i < ease ? i / ease : i > len - fade ? (len - i) / fade : 1) / peak;
  const made = { buf, rate: f * (loop + damp / 2) / sr };                        // the loop is a whole number of samples: tune it exactly
  strings.set(n, made);
  return made;
}

function keep(node) { live.add(node); node.onended = () => live.delete(node); }

function pluck(n, at, loud) {
  const ctx = context(), s = string(n), src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = s.buf; src.playbackRate.value = s.rate;
  g.gain.value = loud * (0.9 + Math.random() * 0.2);
  src.connect(g); g.connect(bus); g.connect(room);
  src.start(at + Math.random() * 0.012); keep(src);
}

function flute(n, at, beats, loud) {
  const ctx = context(), f = freqOf(n), dur = beats * BEAT * 0.94, end = at + dur;
  const g = ctx.createGain(), wobble = ctx.createOscillator(), depth = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(loud, at + 0.22);
  g.gain.setTargetAtTime(loud * 0.8, at + 0.22, 0.5);
  g.gain.setTargetAtTime(0, end, 0.16);
  g.connect(bus); g.connect(room);
  wobble.frequency.value = 4.6;
  depth.gain.value = 0;
  depth.gain.setValueAtTime(0, at + 0.4);
  depth.gain.linearRampToValueAtTime(14, at + 1.1);                               // cents
  wobble.connect(depth);
  for (const [times, part] of [[1, 1], [2, 0.16], [3, 0.05]]) {                   // the tone and two faint overtones
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * times * 0.95, at);                             // slide up into the note
    o.frequency.exponentialRampToValueAtTime(f * times, at + 0.17);
    og.gain.value = part;
    depth.connect(o.detune);
    o.connect(og); og.connect(g);
    o.start(at); o.stop(end + 1.2); keep(o);
  }
  wobble.start(at); wobble.stop(end + 1.2); keep(wobble);
}

// Write out one bar of the piece, starting at time t.
function writeBar(b, t, now) {
  const section = PIECE[Math.floor(b / 8) % PIECE.length], inSection = b % 8;
  const phrase = section.phrases[Math.floor(inSection / 2)], from = (inSection % 2) * 4;
  if (inSection === 0 && section.sweep) {                                         // a run down the strings into the first beat
    for (let k = 0; k < 7; k++) { const at = t - (7 - k) * 0.075; if (at > now + 0.02) pluck(10 - k, at, 0.1 + k * 0.012); }
  }
  for (const [beat, n, octave] of KOTO[phrase[0]]) {
    if (beat < from || beat >= from + 4) continue;
    const at = t + (beat - from) * BEAT;
    pluck(n, at, beat % 1 ? 0.26 : 0.34);
    if (octave) pluck(n - 5, at + 0.02, 0.2);
  }
  if (phrase[1]) for (const [beat, n, beats] of FLUTE[phrase[1]]) {
    if (beat < from || beat >= from + 4) continue;
    flute(n, t + (beat - from) * BEAT, beats, 0.085);
  }
  pluck(-5, t, 0.3);                                                              // the low string on the first beat
  if (section.bass) pluck(inSection % 2 ? -1 : -2, t + 2 * BEAT, 0.16);
}

function hush(now) {
  playing = false;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setTargetAtTime(0, now, 0.12);
  for (const node of live) { try { node.stop(now + 0.6); } catch (e) { /* already stopped */ } }
}

// Called every frame. The notes are written a bar at a time, a little ahead of where the music
// has got to, so a slow frame never leaves a gap.
export function stepMusic() {
  if (!ready()) return;                                                           // not started yet, or Sound is off
  const ctx = context(), now = ctx.currentTime;
  if (!settings.music) { if (playing) hush(now); return; }
  if (!bus) setUp(ctx);
  if (!playing) {
    playing = true; bar = 0; nextBar = now + 0.8;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setTargetAtTime(LEVEL, now, 0.3);
  }
  if (nextBar < now) nextBar = now + 0.2;                                         // fell behind: carry on from here
  while (nextBar < now + 1.5) { writeBar(bar++, nextBar, now); nextBar += BAR; }
}

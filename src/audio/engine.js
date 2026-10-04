import { settings } from '../core/settings.js';

// The sound engine. Every sound in the game is made here from tones and noise with the
// browser's Web Audio; there are no sound files. Browsers only allow sound after the player
// has clicked or pressed a key, so the engine starts on the first input.
let ctx = null, master = null, noiseBuf = null, softBuf = null;

export function unlock() {
  if (!settings.sound) return;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { return; }
    master = ctx.createGain();
    master.gain.value = 0.9;
    const squash = ctx.createDynamicsCompressor();          // keeps a pile-up from being deafening
    master.connect(squash); squash.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    softBuf = softNoise();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

// A darker noise for sounds that run on and on. Each sample is only a small step from the one
// before, so its power sits low down: it rushes and rumbles where the noise above would hiss.
function softNoise() {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = buf.getChannelData(0), n = d.length;
  let last = 0, sum = 0;
  for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last; }
  const drift = (d[n - 1] - d[0]) / (n - 1);                // the end has to meet the start, or the loop clicks
  for (let i = 0; i < n; i++) { d[i] -= drift * i; sum += d[i]; }
  const mean = sum / n;
  let power = 0;
  for (let i = 0; i < n; i++) { d[i] -= mean; power += d[i] * d[i]; }
  const k = 0.25 / Math.sqrt(power / n);                    // the same loudness every time the game starts
  for (let i = 0; i < n; i++) d[i] *= k;
  return buf;
}

export const ready = () => !!ctx && settings.sound && ctx.state === 'running';
export const context = () => ctx;
export const output = () => master;

export function setMuted(muted) {
  if (!muted) unlock();
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
}

// The game only steps while its tab is showing. With the tab hidden nothing would turn the
// running sound down, so the whole engine is stopped until the player comes back.
export function setAway(away) {
  if (!ctx) return;
  if (away) ctx.suspend();
  else if (settings.sound) ctx.resume();
}

// One note. { freq, type, at (seconds from now), dur, gain, slide (end frequency) }
export function tone(o) {
  if (!ready()) return;
  const t = ctx.currentTime + (o.at || 0), osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + o.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.2), t + (o.attack || 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g); g.connect(master);
  osc.start(t); osc.stop(t + o.dur + 0.05);
}

// A burst of filtered noise. { at, dur, gain, filter ('lowpass' ...), freq, q, slide }
export function noise(o) {
  if (!ready()) return;
  const t = ctx.currentTime + (o.at || 0), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf; src.loop = true;
  f.type = o.filter || 'lowpass'; f.frequency.setValueAtTime(o.freq || 1000, t); f.Q.value = o.q || 0.7;
  if (o.slide) f.frequency.exponentialRampToValueAtTime(o.slide, t + o.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain || 0.2), t + (o.attack || 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t, Math.random()); src.stop(t + o.dur + 0.05);
}

// A noise source that keeps running, for the sound of trains on the move. With soft set it is
// made from the dark noise and everything above 1400 Hz is cut away, because a hiss that never
// stops is tiring to listen to.
export function noiseLoop(filterType, freq, q, soft = false) {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = soft ? softBuf : noiseBuf; src.loop = true;
  f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  g.gain.value = 0;
  src.connect(f);
  if (soft) {
    const top = ctx.createBiquadFilter();
    top.type = 'lowpass'; top.frequency.value = 1400; top.Q.value = 0;
    f.connect(top); top.connect(g);
  } else f.connect(g);
  g.connect(master);
  src.start();
  return { filter: f, gain: g };
}

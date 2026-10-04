import { settings } from '../core/settings.js';
import { cam } from '../input/camera.js';

// The sound engine. Every sound in the game is made here from tones and noise with the
// browser's Web Audio; there are no sound files. Browsers only allow sound after the player
// has clicked or pressed a key, so the engine starts on the first input.
let ctx = null, master = null, noiseBuf = null;

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
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export const ready = () => !!ctx && settings.sound && ctx.state === 'running';
export const context = () => ctx;
export const output = () => master;

export function setMuted(muted) {
  if (!muted) unlock();
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
}

// How loud something at x,z should be: nearer the middle of the view, and closer in, is louder.
export function nearness(x, z) {
  const d = Math.hypot(x - cam.tx, z - cam.tz), reach = Math.max(8, cam.dist * 0.75);
  const zoom = Math.min(1.5, Math.max(0.35, 30 / cam.dist));
  return zoom / (1 + (d / reach) * (d / reach));
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

// A noise source that keeps running, for the sound of trains on the move.
export function noiseLoop(filterType, freq, q) {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf; src.loop = true;
  f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  g.gain.value = 0;
  src.connect(f); f.connect(g); g.connect(master);
  src.start();
  return { filter: f, gain: g };
}

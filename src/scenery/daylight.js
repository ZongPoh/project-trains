import * as THREE from 'three';
import { G } from '../core/constants.js';
import { C } from '../core/colors.js';
import { scene, hemi, sun, nightGlow } from '../core/stage.js';
import { settings, saveSettings } from '../core/settings.js';
import { setSky } from './sky.js';
import { setCloudTint } from './clouds.js';

// Time of day: sets the sky, the haze on the horizon and the light on the board together.
const hex = h => new THREE.Color(h);
export const TIMES = {
  day: {
    label: 'Day',
    top: C('#2f7fd6'), mid: C('#86c0ee'), horizon: C('#dcecf5'),
    sunDir: [0.42, 0.62, -0.66], disc: hex(0xfffbe8), discSize: 30, glow: hex(0xfff2c2), glowSize: 300, stars: false,
    hemi: [0xffffff, 0x8f937f, 0.78], sun: [0xfff3dd, 0.95], cloud: C('#3c3c3c'), lights: 0,
  },
  sunset: {
    label: 'Sunset',
    top: C('#27407f'), mid: C('#e58d62'), horizon: C('#ffd3a0'),
    sunDir: [0.5, 0.2, -0.84], disc: hex(0xffd9a0), discSize: 40, glow: hex(0xff9a4a), glowSize: 520, stars: false,
    hemi: [0xffd8c2, 0x6f6468, 0.62], sun: [0xffa765, 0.95], cloud: C('#5a3326'), lights: 0.5,
  },
  night: {
    label: 'Night',
    top: C('#04060f'), mid: C('#0c1532'), horizon: C('#25365e'),
    sunDir: [-0.5, 0.55, -0.67], disc: hex(0xf4f6ff), discSize: 22, glow: hex(0x8fa6e6), glowSize: 200, stars: true,
    hemi: [0x9db4ff, 0x161b26, 0.42], sun: [0xbccdff, 0.3], cloud: C('#0a0e1a'), lights: 1,
  },
};
export const TIME_ORDER = ['day', 'sunset', 'night'];

let current = 'day';

export function setTime(id, remember) {
  current = TIMES[id] ? id : 'day';
  const t = TIMES[current];
  setSky(t);
  setCloudTint(t.cloud);
  nightGlow.value = t.lights;
  if (scene.fog) scene.fog.color.copy(t.horizon); else scene.fog = new THREE.Fog(t.horizon, 190, 760);
  hemi.color.setHex(t.hemi[0]); hemi.groundColor.setHex(t.hemi[1]); hemi.intensity = t.hemi[2];
  sun.color.setHex(t.sun[0]); sun.intensity = t.sun[1];
  const d = new THREE.Vector3(...t.sunDir).normalize();
  sun.position.set(G / 2 + d.x * 80, d.y * 80, G / 2 + d.z * 80);
  if (remember) { settings.time = current; saveSettings(); }
  return t;
}

export function nextTime() {
  return setTime(TIME_ORDER[(TIME_ORDER.indexOf(current) + 1) % TIME_ORDER.length], true);
}

export const restoreTime = () => setTime(settings.time, false);

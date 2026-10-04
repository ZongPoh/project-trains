import { on } from '../core/events.js';
import { settings, saveSettings } from '../core/settings.js';
import { unlock, setMuted, setAway } from './engine.js';
import { stepRunning } from './sounds/running.js';
import { stepBell } from './sounds/crossing.js';
import { depart } from './sounds/whistle.js';
import { stepMusic } from './music.js';
import { crash } from './sounds/crash.js';
import { build, plant, erase, switchLever, signalClick, placed, couple, busStop } from './sounds/clicks.js';

// Sound. One file per kind of sound in ./sounds, the background music in music.js, and the rule
// for what the camera can hear in hearing.js. This file connects the sounds to what happens in
// the game, through the notice board in core/events.js.
export function initAudio() {
  on('depart', depart); on('crash', crash);
  on('build', build); on('plant', plant); on('erase', erase);
  on('grown', plant); on('switch', switchLever); on('signal', signalClick); on('placed', placed); on('couple', couple); on('setdown', busStop);
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { passive: true });
  document.addEventListener('visibilitychange', () => setAway(document.hidden));
}

export function setSound(onOff) {
  settings.sound = onOff;
  saveSettings();
  setMuted(!onOff);
}

export function setMusic(onOff) {
  settings.music = onOff;
  saveSettings();
}

export function stepAudio(dt) { stepRunning(dt); stepBell(dt); stepMusic(); }

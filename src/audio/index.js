import { on } from '../core/events.js';
import { settings, saveSettings } from '../core/settings.js';
import { unlock, setMuted } from './engine.js';
import { stepRunning } from './sounds/running.js';
import { stepBell } from './sounds/crossing.js';
import { arrive, melody, depart } from './sounds/chime.js';
import { crash } from './sounds/crash.js';
import { build, plant, erase, switchLever, signalClick, placed, couple, busStop } from './sounds/clicks.js';

// Sound. One file per kind of sound in ./sounds; this file connects them to what happens in
// the game, through the notice board in core/events.js.
export function initAudio() {
  on('arrive', arrive); on('melody', melody); on('depart', depart); on('crash', crash);
  on('build', build); on('plant', plant); on('erase', erase);
  on('grown', plant); on('switch', switchLever); on('signal', signalClick); on('placed', placed); on('couple', couple); on('setdown', busStop);
  for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlock, { passive: true });
}

export function setSound(onOff) {
  settings.sound = onOff;
  saveSettings();
  setMuted(!onOff);
}

export function stepAudio(dt) { stepRunning(dt); stepBell(dt); }

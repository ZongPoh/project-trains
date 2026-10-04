import { $, toast } from '../core/dom.js';
import { state } from '../core/state.js';
import { trains } from '../trains/store.js';
import { removeTrain } from '../trains/runtime.js';
import { resetCam } from '../input/camera.js';
import { setTool, setLevel } from '../tools/select.js';
import { turnRamp } from '../tools/ramp.js';
import { turnScenery } from '../tools/scenery.js';
import { clearWorld, starter } from '../save/layout.js';
import { newStroke, beginEdit, changed, undo } from '../save/history.js';
import { shareLink } from '../save/share.js';
import { nextTime } from '../scenery/daylight.js';
import { nextSeason, seasonLook } from '../scenery/seasons.js';
import { settings, saveSettings } from '../core/settings.js';
import { setSound } from '../audio/index.js';

// The buttons round the edge of the board: tools, levels, run controls and the More menu.

export function setPaused(v) {
  state.paused = v;
  $('btn-pause').textContent = v ? 'Play' : 'Pause';
}

const closeMenu = () => { $('menu').open = false; };

export function showSettings() {
  $('btn-sound').textContent = 'Sound: ' + (settings.sound ? 'On' : 'Off');
  $('btn-drive').textContent = 'Drivers: ' + (settings.careful ? 'Careful' : 'Reckless');
  $('btn-season').textContent = 'Season: ' + seasonLook().label;
  $('btn-growth').textContent = 'Town growth: ' + (settings.growth ? 'On' : 'Off');
}

async function share() {
  closeMenu();
  let link = '';
  try { link = await shareLink(); } catch (e) { toast('Could not make a link for this layout.'); return; }
  try {
    await navigator.clipboard.writeText(link);
    toast('Link copied. Anyone who opens it gets a copy of this layout.');
  } catch (e) {                                             // clipboard blocked: leave it in the address bar
    location.hash = link.slice(link.indexOf('#'));
    toast('The link is in the address bar now. Copy it from there.');
  }
}

export function initMenu() {
  document.querySelectorAll('.tool').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
  document.querySelectorAll('.lvl').forEach(b => b.addEventListener('click', () => setLevel(+b.dataset.level)));
  $('btn-rot').addEventListener('click', () => { if (state.tool === 'scenery') turnScenery(); else turnRamp(); });
  $('btn-pause').addEventListener('click', () => setPaused(!state.paused));
  $('btn-undo').addEventListener('click', undo);

  $('btn-view').addEventListener('click', () => { resetCam(); closeMenu(); });
  $('btn-time').addEventListener('click', () => { $('btn-time').textContent = 'Time of day: ' + nextTime().label; });
  $('btn-season').addEventListener('click', () => { nextSeason(); showSettings(); });
  $('btn-growth').addEventListener('click', () => {
    settings.growth = !settings.growth; saveSettings(); showSettings();
    toast(settings.growth ? 'Town growth on: busy stations gain new buildings.' : 'Town growth off: nothing is built for you.');
  });
  $('btn-share').addEventListener('click', share);
  $('btn-sound').addEventListener('click', () => { setSound(!settings.sound); showSettings(); });
  $('btn-drive').addEventListener('click', () => {
    settings.careful = !settings.careful; saveSettings(); showSettings();
    toast(settings.careful ? 'Careful drivers: trains wait for each other.' : 'Reckless drivers: trains ignore each other and can crash.');
  });
  $('btn-trains').addEventListener('click', () => {
    if (trains.length) { newStroke(); beginEdit(); trains.slice().forEach(removeTrain); changed(); }
    closeMenu();
  });
  $('btn-starter').addEventListener('click', () => {
    newStroke(); beginEdit(); clearWorld(); starter(); changed(); closeMenu();
  });

  let armed = 0;                                            // Clear needs a second click within 3 seconds
  $('btn-clear').addEventListener('click', e => {
    const b = e.currentTarget;
    if (!armed) {
      b.textContent = 'Click again to clear';
      armed = setTimeout(() => { armed = 0; b.textContent = 'Clear the board'; }, 3000);
      return;
    }
    clearTimeout(armed); armed = 0; b.textContent = 'Clear the board';
    newStroke(); beginEdit(); clearWorld(); changed(); closeMenu();
    toast('Board cleared. Undo brings it back.');
  });
}

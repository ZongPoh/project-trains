import { canvas } from '../core/stage.js';
import { state } from '../core/state.js';
import { cam, panBy } from './camera.js';
import { ride, stopRide, nextView, nextTrain } from './ride.js';
import { setTool, setLevel } from '../tools/select.js';
import { turnRamp } from '../tools/ramp.js';
import { turnScenery } from '../tools/scenery.js';
import { hover } from '../tools/strokes.js';
import { undo } from '../save/history.js';
import { setPaused } from '../ui/menu.js';

// Keyboard shortcuts.
//   1-9 tools, 0 road, - river, = hill, H highway · R turn ramp · [ ] or PageUp/PageDown change level · Space pause (board focused)
//   W A S D or arrows move the view · Q E turn it · Ctrl+Z undo
//   while riding: V changes the view · N next train · Esc leaves
const TOOL_KEYS = { Digit1: 'track', Digit2: 'rampup', Digit3: 'rampdown', Digit4: 'station', Digit5: 'signal', Digit6: 'operate', Digit7: 'erase', Digit8: 'look', Digit9: 'ride', Digit0: 'road', Minus: 'river', Equal: 'hill', KeyH: 'highway' };
const held = new Set();

function keydown(e) {
  if (e.target && e.target.tagName === 'INPUT' && e.code.startsWith('Arrow')) return;
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); undo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.code;
  if (ride.train) {                                   // riding: only the ride keys and pause work
    if (k === 'Escape') stopRide();
    else if (k === 'KeyV') nextView();
    else if (k === 'KeyN') nextTrain();
    else if (k === 'Space') { e.preventDefault(); setPaused(!state.paused); }
    return;
  }
  if (TOOL_KEYS[k]) setTool(TOOL_KEYS[k]);
  else if (k === 'KeyR') {
    if (state.tool === 'scenery') { turnScenery(); if (state.lastHover) hover(state.lastHover.x, state.lastHover.y); }
    else turnRamp();
  }
  else if (k === 'BracketRight' || k === 'PageUp') { e.preventDefault(); setLevel(state.level + 1); }
  else if (k === 'BracketLeft' || k === 'PageDown') { e.preventDefault(); setLevel(state.level - 1); }
  else if (k === 'Space' && e.target === canvas) { e.preventDefault(); setPaused(!state.paused); }
  else if (/^(Key[WASDQE]|Arrow(Up|Down|Left|Right))$/.test(k)) { held.add(k); if (k.startsWith('Arrow')) e.preventDefault(); }
}

export function initKeyboard() {
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', e => held.delete(e.code));
  window.addEventListener('blur', () => held.clear());
}

// Called every frame: keys that are held down keep moving the camera.
export function stepKeyboard(dt) {
  if (!held.size || ride.train) return;
  const v = cam.dist * 0.7 * dt / (cam.dist * 0.0017);
  if (held.has('KeyW') || held.has('ArrowUp')) panBy(0, v);
  if (held.has('KeyS') || held.has('ArrowDown')) panBy(0, -v);
  if (held.has('KeyA') || held.has('ArrowLeft')) panBy(v, 0);
  if (held.has('KeyD') || held.has('ArrowRight')) panBy(-v, 0);
  if (held.has('KeyQ')) cam.yaw += 1.4 * dt;
  if (held.has('KeyE')) cam.yaw -= 1.4 * dt;
}

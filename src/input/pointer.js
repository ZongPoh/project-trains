import { canvas } from '../core/stage.js';
import { state } from '../core/state.js';
import { $ } from '../core/dom.js';
import { orbitBy, panBy, zoomBy } from './camera.js';
import { ride, rideLook, rideZoom } from './ride.js';
import { hideGhost } from './ghost.js';
import { strokeStart, strokeMove, strokeEnd, hover } from '../tools/strokes.js';

// Mouse, pen and touch on the board.
//   left button / one finger: the tool in hand
//   right button, or the Look tool: orbit
//   middle button or Shift + drag: pan
//   two fingers: pan and pinch to zoom
//   while riding a train: any drag looks around
const ptrs = new Map();
let mode = null, lastPt = { x: 0, y: 0 }, pending = null, gest = null;

function gestureState() {
  const a = [...ptrs.values()];
  return { cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1 };
}

function down(e) {
  e.preventDefault();
  $('menu').open = false;
  try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size >= 2) {
    if (mode === 'tool') strokeEnd();
    pending = null; mode = 'gesture'; gest = gestureState(); hideGhost();
    return;
  }
  lastPt = { x: e.clientX, y: e.clientY };
  if (ride.train) { mode = 'ride'; return; }
  if (e.button === 2 || (e.button === 0 && state.tool === 'look')) mode = 'orbit';
  else if (e.button === 1 || (e.button === 0 && e.shiftKey)) mode = 'pan';
  else if (e.button === 0) {
    mode = 'tool';
    // a finger might be the start of a two-finger gesture, so wait until it moves or lifts
    if (e.pointerType === 'touch') pending = { x: e.clientX, y: e.clientY };
    else strokeStart(e.clientX, e.clientY);
  }
}

function move(e) {
  const p = ptrs.get(e.pointerId);
  if (!p) {
    state.lastHover = { x: e.clientX, y: e.clientY };
    if (e.pointerType === 'mouse' && !ride.train) hover(e.clientX, e.clientY);
    return;
  }
  p.x = e.clientX; p.y = e.clientY;
  if (mode === 'gesture') {
    if (ptrs.size < 2) return;
    const g = gestureState();
    if (ride.train) rideZoom(gest.d / g.d); else { panBy(g.cx - gest.cx, g.cy - gest.cy); zoomBy(gest.d / g.d); }
    gest = g;
    return;
  }
  const dx = e.clientX - lastPt.x, dy = e.clientY - lastPt.y;
  lastPt = { x: e.clientX, y: e.clientY };
  if (mode === 'ride') rideLook(dx, dy);
  else if (mode === 'orbit') orbitBy(dx, dy);
  else if (mode === 'pan') panBy(dx, dy);
  else if (mode === 'tool') {
    if (pending) {
      if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < 8) return;
      strokeStart(pending.x, pending.y); pending = null;
    }
    strokeMove(e.clientX, e.clientY);
    hover(e.clientX, e.clientY);
  }
}

function up(e) {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (mode === 'tool') {
    if (pending && e.type === 'pointerup') strokeStart(pending.x, pending.y);
    pending = null; strokeEnd();
  }
  if (ptrs.size === 0) mode = null;
  if (e.pointerType !== 'mouse') hideGhost();
}

export function initPointer() {
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (!ptrs.size) hideGhost(); });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
}

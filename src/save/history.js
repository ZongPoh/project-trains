import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { pieces } from '../tracks/model.js';
import { trains } from '../trains/store.js';
import { serialize, load } from './layout.js';

// Undo history and autosave. The layout is kept in this browser's local storage.
export const STORE = 'project-trains.layout.v1';
const history = [];
let strokeSaved = false, saveTimer = 0;

export function readSaved() {
  try { const s = localStorage.getItem(STORE); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}

// Each press-drag-release adds at most one undo step.
export function newStroke() { strokeSaved = false; }

export function snapshot(json) {
  history.push(json);
  if (history.length > 50) history.shift();
  $('btn-undo').disabled = false;
}

// Call before changing the board.
export function beginEdit() {
  if (strokeSaved) return;
  strokeSaved = true;
  snapshot(JSON.stringify(serialize()));
}

export function updateStats() {
  $('stat-track').textContent = pieces.size;
  $('stat-trains').textContent = trains.length;
  const pax = $('stat-pax');
  pax.hidden = !state.carried;
  pax.textContent = state.carried ? ' · ' + state.carried + (state.carried === 1 ? ' passenger' : ' passengers') : '';
  const c = $('stat-crashes');
  c.hidden = !state.crashes;
  c.textContent = state.crashes ? ' · ' + state.crashes + (state.crashes === 1 ? ' crash' : ' crashes') : '';
}

// Call after changing the board: wakes stuck trains, refreshes the counts and saves.
export function changed() {
  for (const t of trains) t.stuck = false;
  updateStats();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORE, JSON.stringify(serialize())); } catch (e) { /* storage full or blocked */ }
  }, 400);
}

export function undo() {
  const s = history.pop();
  if (!s) return;
  load(JSON.parse(s));
  $('btn-undo').disabled = !history.length;
  changed();
}

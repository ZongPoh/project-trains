import { $, toast } from '../core/dom.js';
import { settings, saveSettings } from '../core/settings.js';
import { setDepotRoom } from '../input/camera.js';

// Hiding the plates round the board. The depot along the bottom, the tools down the left and
// the level stack on the right each carry a small fold button; a hidden plate shrinks to that
// button, so one click brings it back. P hides or shows all three at once. The choice is
// remembered. Tools, levels and the picked train still work from the keyboard while hidden.
const PANELS = [
  { id: 'depot', key: 'showDepot', label: 'Depot', what: 'the depot' },
  { id: 'tools', key: 'showTools', label: 'Tools', what: 'the tools' },
  { id: 'levels', key: 'showLevels', label: 'Level', what: 'the level buttons' },
];

function show() {
  for (const p of PANELS) {
    const open = settings[p.key] !== false, b = $('fold-' + p.id);
    $('ui').classList.toggle(p.id + '-off', !open);
    b.setAttribute('aria-expanded', String(open));
    b.querySelector('span').textContent = open ? 'Hide' : p.label;
    b.title = (open ? 'Hide ' : 'Show ') + p.what + ' · P hides or shows every panel';
    b.setAttribute('aria-label', (open ? 'Hide ' : 'Show ') + p.what);
  }
  setDepotRoom(settings.showDepot !== false);              // no depot: the board uses the whole height
}

function set(values) {
  Object.assign(settings, values);
  saveSettings();
  show();
}

// The P key: if anything is showing, hide all three; if all are hidden, bring them back.
export function toggleAllPanels() {
  const open = !PANELS.some(p => settings[p.key] !== false);
  set(Object.fromEntries(PANELS.map(p => [p.key, open])));
  if (!open) toast('Panels hidden. Press P to bring them back.');
}

export function initPanels() {
  for (const p of PANELS) $('fold-' + p.id).addEventListener('click', () => set({ [p.key]: settings[p.key] === false }));
  show();
}

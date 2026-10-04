export const $ = id => document.getElementById(id);

let toastTimer = 0;
export function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

// Shown instead of the board when the browser cannot start 3D graphics.
export function fatal(msg) {
  $('ui').hidden = true;
  if (msg) $('fatal-msg').textContent = msg;
  $('fatal').hidden = false;
}

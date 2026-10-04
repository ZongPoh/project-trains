import { $ } from '../core/dom.js';
import { settings, saveSettings } from '../core/settings.js';
import { trains } from '../trains/store.js';
import { trainDef } from '../trains/index.js';
import { serviceOf, stopsAt } from '../trains/service.js';
import { nextSeg } from '../tracks/paths.js';
import { isStation, stationRun, stationAcross, stationName } from '../tracks/features/station.js';
import { cam } from '../input/camera.js';

// The departure board: the next stop of every train, soonest first, like the board in a
// station hall. Each line gives the service, the train, the station and platform it is heading
// for, and how long until it gets there. Clicking a line moves the camera to that train.
const ROWS = 6, FAR = 60;
let clock = 1, shown = [];

// The next platform this train will stop at: { p, dist } or null if it is not going to stop.
function nextStop(tr) {
  let s = tr.segs[0], dist = s.len - tr.d;
  for (let n = 0; n < FAR; n++) {
    const nx = nextSeg(s, false, 1, tr);
    if (isStation(s.p) && (!nx || !isStation(nx.p)) && stopsAt(tr, s.p) && stationRun(s.p).id !== tr.lastStation) return { p: s.p, dist };
    if (!nx) return null;
    s = nx; dist += nx.len;
  }
  return null;
}

function line(tr) {
  const def = trainDef(tr.type), svc = serviceOf(tr), here = tr.segs[0].p;
  const row = { tr, name: def ? def.name : 'Train', svc, to: null, platform: '', when: '', eta: Infinity };
  if (tr.wait > 0 && tr.atStation && isStation(here)) {
    row.to = stationName(here); row.platform = stationAcross(here).index + 1; row.eta = -1;
    row.when = tr.holding === 'pass' ? 'Letting express pass' : tr.holding === 'mate' ? 'Waiting to couple' : 'Boarding';
    return row;
  }
  const stop = svc.id === 'through' ? null : nextStop(tr);
  if (!stop) { row.when = svc.id === 'through' ? 'Not stopping' : 'No station ahead'; return row; }
  row.to = stationName(stop.p); row.platform = stationAcross(stop.p).index + 1;
  row.eta = stop.dist / Math.max(1, tr.speed * 0.8);
  const secs = Math.round(row.eta);
  row.when = secs < 3 ? 'Arriving' : Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
  return row;
}

function refresh() {
  const rows = trains.filter(t => t.state === 'run' && t.segs.length).map(line).sort((a, b) => a.eta - b.eta).slice(0, ROWS);
  shown = rows.map(r => r.tr);
  const list = $('board-rows');
  while (list.children.length > rows.length) list.lastChild.remove();
  rows.forEach((r, i) => {
    let b = list.children[i];
    if (!b) {
      b = document.createElement('button');
      b.type = 'button'; b.className = 'brow'; b.dataset.i = i;
      b.innerHTML = '<span class="svc"></span><span class="bname"></span><span class="bto"></span><span class="bpl"></span><span class="bwhen"></span>';
      list.appendChild(b);
    }
    const [svc, name, to, pl, when] = b.children;
    svc.textContent = r.svc.id === 'through' ? r.svc.jp : r.svc.name; svc.dataset.svc = r.svc.id;
    name.textContent = r.name;
    to.textContent = r.to ? r.to[0] + ' ' + r.to[1] : '—';
    pl.textContent = r.platform ? r.platform : '';
    when.textContent = r.when; when.classList.toggle('now', r.eta < 3);
  });
  $('board-empty').hidden = rows.length > 0;
}

function show() {
  $('board').hidden = !settings.board;
  $('btn-board').textContent = 'Departure board: ' + (settings.board ? 'On' : 'Off');
  if (settings.board) refresh();
}

export function initBoard() {
  if (settings.board == null) settings.board = window.innerWidth >= 900;      // off to start with on a small screen
  $('btn-board').addEventListener('click', () => { settings.board = !settings.board; saveSettings(); show(); });
  $('board-rows').addEventListener('click', e => {
    const b = e.target.closest('.brow'), tr = b && shown[+b.dataset.i];
    if (!tr || !tr.cars.length) return;
    const at = tr.cars[0].mesh.position;
    cam.tx = at.x; cam.tz = at.z; cam.dist = Math.min(cam.dist, 16);
  });
  show();
}

export function stepBoard(dt) {
  clock += dt;
  if (clock < 0.5 || !settings.board) return;
  clock = 0;
  refresh();
}

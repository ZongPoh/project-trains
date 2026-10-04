import * as THREE from 'three';
import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { renderer } from '../core/stage.js';
import { ROSTER } from '../trains/index.js';
import { SCENERY } from '../scenery/index.js';
import { buildItem } from '../scenery/placed.js';
import { setTool } from '../tools/select.js';
import { onSeason } from '../scenery/seasons.js';

// The depot along the bottom: a card for every train and every scenery item, each with a
// small picture rendered from its own model.

function picture(model, view) {
  const W = 360, Hh = 200, rt = new THREE.WebGLRenderTarget(W, Hh);
  rt.texture.encoding = THREE.sRGBEncoding;
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.05));
  const dl = new THREE.DirectionalLight(0xffffff, 0.7);
  dl.position.set(1, 3, 2.5);
  sc.add(dl, model);
  const hw = view.half, hh = hw * Hh / W;
  const oc = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 0.1, 30);
  oc.position.set(...view.eye); oc.lookAt(...view.look);
  renderer.setRenderTarget(rt); renderer.clear(); renderer.render(sc, oc);
  const buf = new Uint8Array(W * Hh * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, W, Hh, buf);
  renderer.setRenderTarget(null);
  rt.dispose();
  model.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const ctx = cv.getContext('2d'), img = ctx.createImageData(W, Hh);
  for (let y = 0; y < Hh; y++) img.data.set(buf.subarray((Hh - 1 - y) * W * 4, (Hh - y) * W * 4), y * W * 4);   // flip upright
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL();
}

function trainPicture(def) {
  if (!def.units) return picture(def.cars[0].make(), { half: 0.5, eye: [1.5, 0.8, 1.35], look: [0, 0.12, 0.02] });
  // a coupled pair: show the two noses meeting
  const [a, b] = def.units, back = a.cars[a.cars.length - 1], front = b.cars[0], pair = new THREE.Group();
  const m1 = back.make(), m2 = front.make();
  m1.position.z = back.len / 2 + 0.02; m2.position.z = -front.len / 2 - 0.02;
  pair.add(m1, m2);
  return picture(pair, { half: 0.82, eye: [2, 1.1, 0.5], look: [0, 0.1, 0] });
}

function sceneryPicture(item) {
  const mesh = buildItem(item.id, 7);
  mesh.geometry.computeBoundingBox();
  const b = mesh.geometry.boundingBox, cy = (b.max.y + b.min.y) / 2;
  const size = Math.max(b.max.x - b.min.x, b.max.z - b.min.z, (b.max.y - b.min.y) * 1.2);
  return picture(mesh, { half: size * 0.86, eye: [3, cy + 2.2, 4], look: [0, cy, 0] });
}

function card(def, kind, pic, onPick) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'card'; b.dataset[kind] = def.id; b.setAttribute('aria-pressed', 'false');
  let img = '<span class="ph"></span>';
  try { img = '<img alt="" src="' + pic(def) + '">'; } catch (e) { /* keep the placeholder */ }
  b.innerHTML = img + '<b></b><small></small>';
  b.querySelector('b').textContent = def.name;
  b.querySelector('small').textContent = def.meta;
  b.addEventListener('click', onPick);
  return b;
}

function showTab(which) {
  for (const id of ['trains', 'scenery']) {
    $('tab-' + id).setAttribute('aria-selected', String(id === which));
    $('cards-' + id).hidden = id !== which;
  }
  $('speed-wrap').hidden = which !== 'trains';
}

export function buildDepot() {
  for (const def of ROSTER) {
    $('cards-trains').appendChild(card(def, 'train', trainPicture, () => { state.trainType = def.id; setTool('train'); }));
  }
  for (const item of SCENERY) {
    $('cards-scenery').appendChild(card(item, 'scenery', sceneryPicture, () => { state.sceneryType = item.id; setTool('scenery'); }));
  }
  onSeason(() => {                                           // the scenery cards show the new season too
    for (const item of SCENERY) {
      const img = document.querySelector('[data-scenery="' + item.id + '"] img');
      if (img) { try { img.src = sceneryPicture(item); } catch (e) { /* keep the old picture */ } }
    }
  });
  $('tab-trains').addEventListener('click', () => showTab('trains'));
  $('tab-scenery').addEventListener('click', () => showTab('scenery'));
  $('speed').addEventListener('input', e => {
    state.simSpeed = +e.target.value;
    $('speed-out').textContent = state.simSpeed + '×';
  });
}

import * as THREE from 'three';
import { G } from '../core/constants.js';
import { C } from '../core/colors.js';
import { scene, renderer } from '../core/stage.js';
import { seasonLook, onSeason } from '../scenery/seasons.js';

// The layout board: a mat with a faint grid, in a wooden frame. The mat's texture is plain
// speckled white; the season gives it its colour (green lawn, autumn straw, winter snow).
function matTexture() {
  const s = 2048, cv = document.createElement('canvas'); cv.width = cv.height = s;
  const c = cv.getContext('2d');
  c.fillStyle = '#eeeeee'; c.fillRect(0, 0, s, s);
  for (let i = 0; i < 52000; i++) {
    c.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.6)';
    c.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  c.strokeStyle = 'rgba(0,0,0,.11)'; c.lineWidth = 2; c.beginPath();
  for (let i = 0; i <= G; i++) { const p = i * s / G; c.moveTo(p, 0); c.lineTo(p, s); c.moveTo(0, p); c.lineTo(s, p); }
  c.stroke();
  const t = new THREE.CanvasTexture(cv);
  t.encoding = THREE.sRGBEncoding;
  if (renderer) t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// A grid shown at the height of the level being built on.
export const levelGrid = new THREE.GridHelper(G, G, 0xffffff, 0xffffff);
levelGrid.material.transparent = true;
levelGrid.material.opacity = 0.3;
levelGrid.material.depthWrite = false;
levelGrid.visible = false;

export function buildBoard() {
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(G, G), new THREE.MeshStandardMaterial({ map: matTexture(), roughness: 1, color: seasonLook().board }));
  onSeason(look => mat.material.color.copy(look.board));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(G / 2, 0, G / 2);
  mat.receiveShadow = true;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(G + 1.2, 0.7, G + 1.2), new THREE.MeshStandardMaterial({ color: C('#c7a46a'), roughness: 0.85 }));
  slab.position.set(G / 2, -0.36, G / 2);
  slab.receiveShadow = true;
  scene.add(mat, slab, levelGrid);
}

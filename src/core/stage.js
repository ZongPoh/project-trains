import * as THREE from 'three';
import { G } from './constants.js';

// The renderer, scene, camera and lights. Everything that draws adds itself to one of the groups.
export const canvas = document.getElementById('view');

let r = null;
try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { r = null; }
export const renderer = r;
export const ok = !!r;

if (renderer) {
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
}

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 1600);

export const hemi = new THREE.HemisphereLight(0xffffff, 0x8f937f, 0.78);
scene.add(hemi);

export const sun = new THREE.DirectionalLight(0xfff3dd, 0.95);
sun.position.set(G / 2 + 10, 24, G / 2 + 7);
sun.target.position.set(G / 2, 0, G / 2);
sun.castShadow = true;
{
  // the shadow map has to cover the whole board; use a sharper one where the device can take it
  const big = renderer && renderer.capabilities.maxTextureSize >= 8192 && !(window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
  sun.shadow.mapSize.set(big ? 4096 : 2048, big ? 4096 : 2048);
  const sc = sun.shadow.camera, half = G * 0.75 + 2;
  sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 1; sc.far = 220;
}
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

export const backdropGroup = new THREE.Group();   // sky, mountains, countryside
export const trackGroup = new THREE.Group();
export const sceneryGroup = new THREE.Group();    // things the player places on the board
export const trainGroup = new THREE.Group();
export const fxGroup = new THREE.Group();         // crash sparks and smoke
scene.add(backdropGroup, trackGroup, sceneryGroup, trainGroup, fxGroup);

export const trackMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.05 });
export const trainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.15 });
export const sceneryMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });

// Windows and lamps glow after dark. Shapes carry a "glow" value per vertex (see GB.lit in
// builder.js); nightGlow.value fades it in: 0 by day, 1 at night.
export const nightGlow = { value: 0 };
function addGlow(mat) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uNight = nightGlow;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;\nuniform float uNight;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += (vColor.rgb * 0.45 + vec3(1.0, 0.66, 0.27) * 0.95) * vGlow * uNight;');
  };
}
addGlow(trackMat); addGlow(trainMat); addGlow(sceneryMat);

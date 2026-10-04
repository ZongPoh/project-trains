import * as THREE from 'three';
import { C } from '../core/colors.js';
import { GB } from '../core/builder.js';
import { scene, sceneryMat } from '../core/stage.js';
import { seasonLook, season, onSeason } from '../scenery/seasons.js';
import { terrain, terrainStale, markTerrain } from './model.js';
import { DX, DZ, inBoard } from '../core/constants.js';
import { drawWater, drawWaterBeyond } from './water.js';
import { hillPainter, drawTunnelLining } from './hills.js';
import { drawRoad, drawRoadBeyond } from './roads.js';
import { highwaySquares } from './highway.js';
import { drawHighway, drawHighwayBeyond } from './highway-draw.js';

// Draws the ground features. There are few enough squares that the whole lot is rebuilt as
// three meshes whenever anything changes: water, land (roads and hills), and tunnel insides.
const RIVER = { spring: '#4f9fd0', summer: '#3f93c9', autumn: '#5a93b8', winter: '#cfe3ee' };
const waterMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.1 });
const liningMat = new THREE.MeshBasicMaterial({ vertexColors: true });
const group = new THREE.Group();
scene.add(group);

function swap(name, gb, material, shadows) {
  const old = group.getObjectByName(name);
  if (old) { group.remove(old); old.geometry.dispose(); }
  if (!gb.v) return;
  const m = gb.mesh(material);
  m.name = name; m.receiveShadow = true; m.castShadow = !!shadows;
  group.add(m);
}

const FAR = 150;                 // how far rivers and roads run on past the edge of the board

export function flushTerrain() {
  if (!terrainStale()) return;
  markTerrain(false);
  const look = { ...seasonLook(), river: C(RIVER[season()]) }, winter = season() === 'winter';
  const water = new GB(), land = new GB(), lining = new GB(), hills = hillPainter(land, look, winter);
  for (const [s, kind] of terrain) {
    const [x, z] = s.split(',').map(Number);
    if (kind === 'hill') { hills.square(x, z); drawTunnelLining(lining, x, z); continue; }
    if (kind !== 'road') drawWater(water, x, z, look, winter);              // a road bridge is drawn as both
    if (kind !== 'water') drawRoad(land, x, z);
    for (let d = 0; d < 4; d++) {                                 // on the edge of the board: carry on into the countryside
      if (inBoard(x + DX[d], z + DZ[d])) continue;
      if (kind !== 'road') drawWaterBeyond(water, x, z, d, FAR, look, winter);
      if (kind !== 'water') drawRoadBeyond(land, x, z, d, FAR);
    }
  }
  for (const [x, z] of highwaySquares()) {
    drawHighway(land, x, z);
    for (let d = 0; d < 4; d++) if (!inBoard(x + DX[d], z + DZ[d])) drawHighwayBeyond(land, x, z, d, FAR);
  }
  hills.finish();
  swap('water', water, waterMat, false);
  swap('land', land, sceneryMat, true);
  swap('lining', lining, liningMat, false);
}

onSeason(() => markTerrain());

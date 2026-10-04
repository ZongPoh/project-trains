import * as THREE from 'three';
import { DX, DZ, H, opp, dirs } from '../../core/constants.js';
import { COL } from '../../core/colors.js';
import { eff } from '../model.js';
import { makeSeg, nextSeg } from '../paths.js';
import { pieceBusy } from '../../trains/store.js';

// Signals stand on straight track and work in both directions.
//   automatic: red while another train is on the line ahead (up to the next signal, or BLOCK squares)
//   stop:      red until the player releases it
// A train stops just before a red signal and sets off again when it clears.
export const SIG_NONE = 0, SIG_AUTO = 1, SIG_STOP = 2;
const BLOCK = 8;

export const signalPieces = new Set();

// Is the line beyond this signal busy? seg is the run of rail through the signal's own square.
function blockBusy(seg, except) {
  let s = seg, len = 0;
  for (let n = 0; n < 24; n++) {
    if (pieceBusy(s.p, except)) return true;
    len += s.len;
    if (len > BLOCK) return false;
    const nx = nextSeg(s, false, 0, except);
    if (!nx || nx.p.sig || nx.p === seg.p) return false;
    s = nx;
  }
  return false;
}

export function isRed(seg, train) {
  return seg.p.sig === SIG_STOP || blockBusy(seg, train);
}

// Next setting when the player clicks a signal with the Operate tool.
export function toggleSignal(p) {
  p.sig = p.sig === SIG_STOP ? SIG_AUTO : SIG_STOP;
  return p.sig;
}

/* ----- drawing ----- */
// One short mast for each direction, on the left of the approaching train (Japan runs on the left).
function headSpot(p, a) {
  const fx = -DX[a], fz = -DZ[a];                  // the way a train entering from side a is heading
  return { x: p.x + 0.5 + DX[a] * 0.36 + fz * 0.36, z: p.z + 0.5 + DZ[a] * 0.36 - fx * 0.36, nx: DX[a], nz: DZ[a] };
}

export function drawSignal(gb, p) {
  const y = p.l * H;
  for (const a of dirs(eff(p.ports))) {
    const h = headSpot(p, a);
    gb.box(h.x, y + 0.02, h.z, 0.09, 0.04, 0.09, COL.post);
    gb.box(h.x, y + 0.2, h.z, 0.028, 0.36, 0.028, COL.mast);
    gb.box(h.x, y + 0.43, h.z, h.nx ? 0.05 : 0.085, 0.15, h.nz ? 0.05 : 0.085, COL.mast);
    gb.box(h.x - h.nx * 0.01, y + 0.43, h.z - h.nz * 0.01, h.nx ? 0.012 : 0.12, 0.185, h.nz ? 0.012 : 0.12, COL.black);
  }
}

const LAMP = new THREE.SphereGeometry(0.024, 10, 8);
const RED_ON = 0xff3b30, RED_OFF = 0x3a1210, GREEN_ON = 0x37e078, GREEN_OFF = 0x0f2e1a;

// The lamps are separate little meshes so their colour can change without rebuilding the track.
export function makeLamps(p) {
  const group = new THREE.Group(), y = p.l * H;
  group.userData.heads = [];
  for (const a of dirs(eff(p.ports))) {
    const h = headSpot(p, a);
    const green = new THREE.Mesh(LAMP, new THREE.MeshBasicMaterial({ color: GREEN_ON }));
    const red = new THREE.Mesh(LAMP, new THREE.MeshBasicMaterial({ color: RED_OFF }));
    green.position.set(h.x + h.nx * 0.03, y + 0.465, h.z + h.nz * 0.03);
    red.position.set(h.x + h.nx * 0.03, y + 0.4, h.z + h.nz * 0.03);
    group.add(green, red);
    group.userData.heads.push({ a, green, red });
  }
  return group;
}

export function disposeLamps(group) {
  for (const h of group.userData.heads || []) { h.green.material.dispose(); h.red.material.dispose(); }
}

// Called every frame: show each head red or green for the direction it faces.
export function updateSignals() {
  for (const p of signalPieces) {
    if (!p.extra || !p.extra.userData.heads) continue;
    for (const h of p.extra.userData.heads) {
      const red = isRed(makeSeg(p, h.a, opp(h.a)), null);
      h.red.material.color.setHex(red ? RED_ON : RED_OFF);
      h.green.material.color.setHex(red ? GREEN_OFF : GREEN_ON);
    }
  }
}

import { H, MAXL, DX, DZ, key } from '../core/constants.js';
import { GB } from '../core/builder.js';
import { trackGroup, trackMat } from '../core/stage.js';
import { occ, pieces, dirty, eff, isStraight, notifyTrack } from './model.js';
import { makeSeg } from './paths.js';
import { kindOf, routesOf } from './pieces/index.js';
import { liveRoute, junctionRoutes } from './pieces/junction.js';
import { drawRampSupports } from './pieces/ramp.js';
import { addRails, addGuide } from './rails.js';
import { addTable } from './supports.js';
import { drawStation, makeNameboard, makeShedGlass } from './features/station.js';
import { drawFence, makeDoors, doorPieces } from './features/gates.js';
import { drawSignal, makeLamps, disposeLamps, signalPieces } from './features/signal.js';
import { drawBridge } from './features/bridge.js';
import { drawPortals } from './features/tunnel.js';
import { drawCrossing } from './features/crossing.js';
import { isWater, isHill, isRoad, onTerrain, markTerrain } from '../terrain/model.js';

// Turns pieces of the layout into meshes. Edits only mark pieces "dirty"; flush() rebuilds
// them once per frame.

export function disposePiece(p) {
  if (p.mesh) { trackGroup.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh = null; }
  if (p.glass) { trackGroup.remove(p.glass); p.glass.geometry.dispose(); p.glass = null; }
  if (p.doors) { trackGroup.remove(p.doors); p.doors.geometry.dispose(); p.doors = null; }
  doorPieces.delete(p);
  if (p.extra) {
    trackGroup.remove(p.extra);
    if (p.extra.userData.heads) disposeLamps(p.extra);
    if (p.extra.userData.material) p.extra.userData.material.dispose();
    p.extra = null;
  }
  signalPieces.delete(p);
}

export function rebuild(p) {
  disposePiece(p);
  if (!pieces.has(p)) return;
  const kind = kindOf(p);
  if (p.type === 'flat' && !isStraight(p)) { p.st = 0; p.sig = 0; }   // only straights carry these
  if (!p.st) { p.cpl = 0; p.hall = 0; p.nm = 0; }
  notifyTrack(p);
  const flat = p.type === 'flat', onWater = flat && isWater(p.x, p.z), inHill = flat && p.l === 0 && isHill(p.x, p.z);
  const gb = new GB(), raised = p.type === 'ramp' || p.l > 0 || onWater;

  const routes = routesOf(p);
  for (const [a, b] of routes) {
    const seg = makeSeg(p, a, b);
    addRails(gb, seg, raised);
    if (onWater && routes.length === 1) drawBridge(gb, seg);        // track over water is a bridge
  }
  if (inHill) { drawPortals(gb, p); markTerrain(); }                // track in a hill is a tunnel
  if (flat && p.l === 0 && isRoad(p.x, p.z)) drawCrossing(gb, p);    // track over a road is a level crossing
  if (kind === 'junction' && p.alt) { for (const r of junctionRoutes(eff(p.ports))) addGuide(gb, makeSeg(p, r[0], r[1])); }   // alternating: every way is marked
  else if (kind === 'junction') { const r = liveRoute(p, eff(p.ports)); addGuide(gb, makeSeg(p, r[0], r[1])); }
  if (kind !== 'junction') p.alt = 0;
  if (kind === 'ramp') drawRampSupports(gb, p);
  else if (p.l > 0) addTable(gb, p.x, p.z, p.l * H);
  if (p.st) { drawStation(gb, p); drawFence(gb, p); }
  if (p.sig) drawSignal(gb, p);

  p.mesh = gb.mesh(trackMat);
  p.mesh.castShadow = true;
  p.mesh.receiveShadow = true;
  trackGroup.add(p.mesh);

  if (p.st) {
    p.extra = makeNameboard(p); p.glass = makeShedGlass(p, GB); p.doors = makeDoors(p);
    if (p.glass) trackGroup.add(p.glass);
    if (p.doors) trackGroup.add(p.doors);
  }
  else if (p.sig) { p.extra = makeLamps(p); signalPieces.add(p); }
  if (p.extra) trackGroup.add(p.extra);
}

// When the ground changes, the track standing on it, and next to it, may need a new look.
onTerrain((x, z) => {
  for (let l = 0; l <= MAXL; l++) { const p = occ.get(key(x, z, l)); if (p) dirty.add(p); }
  for (let d = 0; d < 4; d++) { const p = occ.get(key(x + DX[d], z + DZ[d], 0)); if (p) dirty.add(p); }
});

export function flush() {
  if (!dirty.size) return;
  for (const p of dirty) rebuild(p);
  dirty.clear();
}

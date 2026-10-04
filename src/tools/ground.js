import { MAXL, key, inBoard } from '../core/constants.js';
import { toast } from '../core/dom.js';
import { emit } from '../core/events.js';
import { occ } from '../tracks/model.js';
import { isCrossing } from '../tracks/features/crossing.js';
import { terrainAt, setTerrain } from '../terrain/model.js';
import { isHighway, hwLevel, rampOf } from '../terrain/highway.js';
import { removeSceneryAt } from '../scenery/placed.js';
import { cellAt } from '../input/picking.js';
import { showSquare, hideGhost, GREEN, RED } from '../input/ghost.js';
import { beginEdit, changed } from '../save/history.js';

// Shared by the River, Hill and Road tools: all three paint one kind of ground, square by square.

// What painting this kind of ground on this square turns it into: a road painted on water, or
// water painted on a road, makes a road bridge.
function result(kind, x, z) {
  const now = terrainAt(x, z);
  if ((kind === 'road' && (now === 'water' || now === 'roadbridge')) || (kind === 'water' && (now === 'road' || now === 'roadbridge'))) return 'roadbridge';
  return kind;
}

// Why this kind of ground cannot go on this square, or '' if it can.
function refusal(kind, x, z) {
  if (!inBoard(x, z)) return 'off the board';
  if (kind === 'hill' && isHighway(x, z)) return 'The highway is in the way. A hill cannot rise through it.';
  if (hwLevel(x, z) === 1 && rampOf(x, z)) return 'A highway ramp comes down here.';
  for (let l = 0; l <= MAXL; l++) {
    const p = occ.get(key(x, z, l));
    if (!p) continue;
    if (p.type === 'ramp' && (kind !== 'water' || p.l === 0)) return 'A ramp is in the way there.';
    if (kind === 'hill' && l >= 1) return 'Raised track is in the way. A hill can only have ground-level track, as a tunnel.';
    if (kind === 'road' && l === 0 && (!isCrossing(p) || p.st)) return 'Roads can only cross plain straight track.';
    if (l === 0 && result(kind, x, z) === 'roadbridge') return 'A road bridge and a railway cannot share a square.';
  }
  return '';
}

export function groundTool(id, kind, hint) {
  let last = null;                                    // the last square painted in this drag
  const paint = c => {
    const becomes = result(kind, c.x, c.z);
    if (terrainAt(c.x, c.z) === becomes || refusal(kind, c.x, c.z)) return false;
    beginEdit();
    removeSceneryAt(c.x, c.z);
    setTerrain(c.x, c.z, becomes);
    changed(); emit(kind === 'road' ? 'build' : 'plant');
    return true;
  };
  return {
    id,
    hint: () => hint,
    hover(x, y) {
      const c = cellAt(x, y, 0);
      if (c) showSquare(c.x, c.z, 0, refusal(kind, c.x, c.z) ? RED : GREEN); else hideGhost();
    },
    start(x, y) {
      const c = cellAt(x, y, 0);
      last = c;
      if (!c) return;
      const why = refusal(kind, c.x, c.z);
      if (why) toast(why); else paint(c);
    },
    move(x, y) {
      const c = cellAt(x, y, 0);
      if (!c) return;
      if (!last) last = c;
      // a fast drag skips squares, so paint every square on the line from the last one to this one
      const steps = Math.max(Math.abs(c.x - last.x), Math.abs(c.z - last.z));
      for (let i = 1; i <= steps; i++) {
        paint({ x: Math.round(last.x + (c.x - last.x) * i / steps), z: Math.round(last.z + (c.z - last.z) * i / steps) });
      }
      last = c;
    },
    end() { last = null; },
  };
}

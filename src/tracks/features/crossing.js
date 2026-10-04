import { H } from '../../core/constants.js';
import { C } from '../../core/colors.js';
import { eff, isStraight } from '../model.js';
import { ROAD_W } from '../../terrain/roads.js';

// Level crossings. Where straight ground-level track meets a road, the road surface is carried
// across the rails on boards. The gates, lights and bell are in roads/crossings.js.
const TAR = C('#474b50'), EDGE = C('#e0c23a');

export const isCrossing = p => p.type === 'flat' && p.l === 0 && isStraight(p);

export function drawCrossing(gb, p) {
  if (!isCrossing(p)) return;
  const cx = p.x + 0.5, cz = p.z + 0.5, y = p.l * H, ew = eff(p.ports) === 0b1010;     // ew: the rails run east-west
  const size = (along, across) => ew ? [along, across] : [across, along];
  const [sx, sz] = size(ROAD_W, 0.5);
  gb.box(cx, y + 0.045, cz, sx, 0.03, sz, TAR);                                        // boards up to rail height
  for (const s of [-1, 1]) {                                                           // yellow edge lines
    const [ex, ez] = size(0.03, 0.5);
    gb.box(cx + (ew ? s * (ROAD_W / 2 - 0.03) : 0), y + 0.0605, cz + (ew ? 0 : s * (ROAD_W / 2 - 0.03)), ex, 0.002, ez, EDGE);
  }
}

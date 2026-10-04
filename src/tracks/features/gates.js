import { COL } from '../../core/colors.js';
import { GB } from '../../core/builder.js';
import { trackMat } from '../../core/stage.js';
import { trains } from '../../trains/store.js';
import { frame, hasDoors, stationRun, doorSpots, doorGaps } from './station.js';

// Platform doors. A waist-high fence runs along the platform edge, with a gap where each train
// door comes (see doorSpots in station.js). A gate closes each gap and slides aside, behind the
// fence, while a train is standing at the platform. The fence is part of the platform's own
// model; the gates of a square are one small mesh of their own, so they can move.
const OUT = 0.247, HIGH = 0.075, GAP_W = 0.17, SLIDE = 0.165, QUICK = 5;

export const doorPieces = new Set();

export function drawFence(gb, p) {
  if (!hasDoors(p)) return;
  const f = frame(p), y = f.y + 0.11;
  const put = (along, out, yy, la, hh, ac, col) => {
    const [x, z] = f.at(along, out), [sx, sz] = f.size(la, ac);
    gb.box(x, yy, z, sx, hh, sz, col);
  };
  // the fence is everything along this square's edge that is not a gap
  const gaps = doorGaps(p).map(d => [d - GAP_W / 2, d + GAP_W / 2]).sort((a, b) => a[0] - b[0]);
  let from = -0.5;
  for (const [a, b] of [...gaps, [0.5, 0.5]]) {
    const to = Math.min(0.5, a);
    if (to - from > 0.01) {
      put((from + to) / 2, OUT, y + HIGH / 2, to - from, HIGH, 0.012, COL.fence);
      put((from + to) / 2, OUT, y + HIGH + 0.004, to - from, 0.008, 0.016, COL.fenceRail);
    }
    from = Math.max(from, Math.min(0.5, b));
  }
  for (const d of doorSpots(p)) for (const e of [-1, 1]) put(d + e * (GAP_W / 2 + 0.006), OUT, y + HIGH / 2 + 0.006, 0.012, HIGH + 0.012, 0.02, COL.fenceRail);   // gate posts
}

// The gates of one platform square, closed.
export function makeDoors(p) {
  if (!hasDoors(p)) return null;
  const spots = doorSpots(p);
  if (!spots.length) return null;
  const f = frame(p), y = f.y + 0.11, gb = new GB();
  for (const d of spots) {
    const [x, z] = f.at(d, OUT + 0.011), [sx, sz] = f.size(GAP_W - 0.004, 0.008);
    gb.box(x, y + HIGH / 2 - 0.004, z, sx, HIGH - 0.012, sz, COL.gate);
    const [bx, bz] = f.size(GAP_W - 0.004, 0.0095);
    gb.box(x, y + HIGH * 0.62, z, bx, 0.014, bz, COL.gateBand);
  }
  const m = gb.mesh(trackMat);
  m.castShadow = true;
  const [ax, az] = f.size(1, 0);                      // the way the gates slide: along the track
  m.userData = { run: stationRun(p).id, ax, az, open: 0 };
  doorPieces.add(p);
  return m;
}

// Called every frame: gates open at platforms where a train is standing, and close again
// shortly before it leaves.
export function stepDoors(dt) {
  if (!doorPieces.size) return;
  const open = new Set();
  for (const t of trains) if (t.state === 'run' && t.wait > 0.5 && t.atStation && t.v === 0) open.add(t.atStation);
  for (const p of doorPieces) {
    const m = p.doors;
    if (!m) continue;
    const u = m.userData, want = open.has(u.run) ? 1 : 0;
    if (u.open === want) continue;
    u.open += Math.sign(want - u.open) * Math.min(Math.abs(want - u.open), dt * QUICK);
    const k = u.open * u.open * (3 - 2 * u.open) * SLIDE;
    m.position.set(u.ax * k, 0, u.az * k);
  }
}

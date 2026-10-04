// Are two trains touching? Each car carries three sample points along its length
// (set by placeCars); two trains touch when any two of their points are close enough.
const R2 = 0.19 * 0.19;      // closer than this, measured flat on the board
const DY = 0.3;              // and within this height, so bridges do not count

export function touching(a, b, hit) {
  for (const ca of a.cars) for (const cb of b.cars) {
    const ma = ca.s[1], mb = cb.s[1];
    if (Math.abs(ma.x - mb.x) > 1 || Math.abs(ma.z - mb.z) > 1 || Math.abs(ma.y - mb.y) > 0.7) continue;
    for (const pa of ca.s) for (const pb of cb.s) {
      const dx = pa.x - pb.x, dz = pa.z - pb.z;
      if (dx * dx + dz * dz < R2 && Math.abs(pa.y - pb.y) < DY) {
        if (hit) hit.set((pa.x + pb.x) / 2, (pa.y + pb.y) / 2, (pa.z + pb.z) / 2);
        return true;
      }
    }
  }
  return false;
}

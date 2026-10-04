// Every train on the board. Kept in its own small file so track code can ask
// "is a train here?" without depending on how trains move.
export const trains = [];

export const trainsOn = p => trains.filter(t => t.segs.some(s => s.p === p));

// Is any train (other than `except`) standing on this piece? Crashed trains do not count.
export function pieceBusy(p, except) {
  for (const t of trains) {
    if (t === except || t.state === 'crashed') continue;
    for (const s of t.segs) if (s.p === p) return true;
  }
  return false;
}

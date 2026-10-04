import { settings } from '../core/settings.js';
import { trains } from './store.js';

// Careful driving: drivers watch the line ahead and never enter a piece of track that another
// train is standing on or is about to need. Each train "claims" the pieces within its stopping
// distance; whoever claims a piece first has the right of way, at crossings and junctions too.
// When this is switched off (More menu), drivers see nothing and trains can crash.
const claims = new Map();          // piece -> { tr, seg }

export function release(tr) {
  if (!tr.claims) { tr.claims = []; return; }
  for (const p of tr.claims) { const c = claims.get(p); if (c && c.tr === tr) claims.delete(p); }
  tr.claims.length = 0;
}

export function claim(seg, tr) {
  claims.set(seg.p, { tr, seg });
  tr.claims.push(seg.p);
}

// Who is in the way on the piece this segment runs through? Returns { tr, seg } or null.
export function blocker(seg, tr) {
  if (!settings.careful) return null;
  const p = seg.p;
  for (const o of trains) {
    if (o === tr || o.state !== 'run') continue;
    for (const s of o.segs) if (s.p === p) return { tr: o, seg: s };
  }
  const c = claims.get(p);
  return c && c.tr !== tr && c.tr.state === 'run' ? c : null;
}

// Is the other train coming straight at us through that piece?
export const headOn = (mine, theirs) => theirs.seg.b === mine.a;

export function clearClaims() { claims.clear(); for (const t of trains) if (t.claims) t.claims.length = 0; }

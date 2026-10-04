import { DX, DZ, dirs, opp } from '../../core/constants.js';

// Junction: three sides of the square are joined, so there are three possible routes through it.
// The player sets which route is live (piece.sw). A train arriving on the live route follows it.
// A train arriving from the leg that is not on the live route pushes the points over, like the
// spring points on a toy railway, and the switch stays where the train left it.
//
// A junction can also be set to alternate (piece.alt). Then each train that comes along the
// through line takes the other way from the train before it: straight on, then the branch,
// then straight on again. A train that took the branch remembers which way it was going, and
// when it comes back out of the branch it carries on that way. If another train is still down
// the branch when its turn comes, the train goes straight on and the next one gets the turn.

export function junctionRoutes(m) {
  const d = dirs(m);
  return [[d[0], d[1]], [d[0], d[2]], [d[1], d[2]]];
}

export const liveRoute = (p, m) => junctionRoutes(m)[(p.sw | 0) % 3];

// The route a train entering from side a will take: { index, b } where b is the side it leaves by.
// `heading` is the way the train has been travelling ({ hx, hz }), if a train is asking.
export function chooseRoute(p, m, a, heading) {
  const routes = junctionRoutes(m);
  if (p.alt) {
    const outs = dirs(m).filter(d => d !== a), straight = outs.includes(opp(a));
    const back = heading && heading.cameFrom && heading.cameFrom.p === p ? heading.cameFrom.dir : -1;
    const b = straight ? (p.altNext ? outs.find(d => d !== opp(a)) : opp(a)) : outs.includes(back) ? back : -1;
    if (b >= 0) return { index: routes.findIndex(r => r.includes(a) && r.includes(b)), b };
  }
  let i = (p.sw | 0) % 3;
  if (!routes[i].includes(a)) {
    let j = routes.findIndex(r => r.includes(a) && r.includes(opp(a)));   // prefer going straight on
    if (j < 0) {
      // Joining from the side leg, with the points set for the through line: carry on the way
      // the train was already going, so a train leaving a passing loop rejoins in its own direction.
      const mine = routes.map((r, k) => k).filter(k => routes[k].includes(a));
      const out = k => (routes[k][0] === a ? routes[k][1] : routes[k][0]);
      const along = k => (heading ? DX[out(k)] * heading.hx + DZ[out(k)] * heading.hz : 0);
      j = along(mine[1]) > along(mine[0]) ? mine[1] : mine[0];
    }
    i = j;
  }
  const r = routes[i];
  return { index: i, b: r[0] === a ? r[1] : r[0] };
}

// The setting a new junction starts with: the through line, if it has one.
export function throughRoute(m) {
  const k = junctionRoutes(m).findIndex(r => r[1] === opp(r[0]));
  return k < 0 ? 0 : k;
}

// The player clicked the switch: move on to the next route, and after the third, to alternating.
export function cycleSwitch(p) {
  if (p.alt) { p.alt = 0; p.altNext = 0; p.sw = 0; }
  else if ((p.sw | 0) % 3 === 2) { p.alt = 1; p.altNext = 0; }
  else p.sw = (p.sw | 0) + 1;
  return p.sw;
}

// A train has just gone through an alternating junction from side a to side b.
export function passedAlternating(p, m, a, b, train) {
  if (!p.alt || !(m >> opp(a) & 1)) return;              // only trains on the through line take turns
  p.altNext = b === opp(a) ? 1 : 0;                       // straight on this time means the branch next time (also when the branch was busy and had to be skipped)
  if (train && b !== opp(a)) train.cameFrom = { p, dir: opp(a) };   // took the branch: remember the way it was going
}

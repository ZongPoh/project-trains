import { bits, dirs, opp } from '../../core/constants.js';
import { eff } from '../model.js';
import { straightRoutes } from './straight.js';
import { curveRoutes } from './curve.js';
import { junctionRoutes } from './junction.js';
import { crossingRoutes } from './crossing.js';

// What kind of track a piece is. Flat pieces are not stored by kind: the kind follows from
// which sides the rails reach, so drawing across a straight turns it into a junction by itself.
export function kindOf(p) {
  if (p.type === 'ramp') return 'ramp';
  const m = eff(p.ports), n = bits(m);
  if (n === 4) return 'crossing';
  if (n === 3) return 'junction';
  const d = dirs(m);
  return d[1] === opp(d[0]) ? 'straight' : 'curve';
}

// Every run of rail through a piece, as [end, end] pairs.
export function routesOf(p) {
  const kind = kindOf(p);
  if (kind === 'ramp') return [[0, 1]];
  const m = eff(p.ports);
  if (kind === 'straight') return straightRoutes(m);
  if (kind === 'curve') return curveRoutes(m);
  if (kind === 'junction') return junctionRoutes(m);
  return crossingRoutes();
}

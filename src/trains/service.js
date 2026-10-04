import { stationAcross, stationId } from '../tracks/features/station.js';
import { nextSeg } from '../tracks/paths.js';
import { trains } from './store.js';
import { trainDef } from './index.js';

// The service a train runs: which stations it calls at.
//   local    stops at every station, and pulls into a loop platform to let faster trains past
//   express  stops only at large stations (three tracks or more) and runs through the rest
//   through  stops nowhere: an inspection train, or a train out of service
// The player changes a train's service with the Operate tool.
export const SERVICES = {
  local: { id: 'local', name: 'Local', jp: '各停', rank: 0, about: 'stops at every station' },
  express: { id: 'express', name: 'Express', jp: '特急', rank: 1, about: 'stops only at large stations with three tracks or more' },
  through: { id: 'through', name: 'Not in service', jp: '回送', rank: 2, about: 'runs through every station without stopping' },
};
const ORDER = ['local', 'express', 'through'];
export const EXPRESS_TRACKS = 3;          // an express calls at stations at least this many tracks wide

export const serviceOf = tr => SERVICES[tr.service] || SERVICES.local;
export const defaultService = type => { const d = trainDef(type); return (d && d.service) || 'local'; };

export function nextService(tr) {
  tr.service = ORDER[(ORDER.indexOf(serviceOf(tr).id) + 1) % ORDER.length];
  return serviceOf(tr);
}

// Does this train call at the station that platform square p belongs to?
export function stopsAt(tr, p) {
  const s = serviceOf(tr).id;
  if (s === 'through') return false;
  return s === 'local' || stationAcross(p).list.length >= EXPRESS_TRACKS;
}

// Is train o on its way to the station that `tr` is standing in, travelling the same way?
// Looks along o's route for `reach` pieces.
export function approaching(o, tr, reach = 14) {
  const here = tr.segs[0], home = stationId(here.p);
  let s = o.segs[0];
  for (let n = 0; n < reach && s; n++) {
    if (s.p.st && s.b === here.b && stationId(s.p) === home) return true;
    s = nextSeg(s, false, 1, o);
  }
  return false;
}

// Overtaking. A train standing at a station with more than one track lets a faster service
// past before it sets off: returns the train it should wait for, if one is coming.
export function overtaker(tr) {
  if (stationAcross(tr.segs[0].p).list.length < 2) return null;
  const rank = serviceOf(tr).rank;
  for (const o of trains) {
    if (o === tr || o.state !== 'run' || o.stuck || serviceOf(o).rank <= rank) continue;
    if (o.blockedBy === tr) continue;                      // it cannot get past: leaving is what clears its way
    if (approaching(o, tr)) return o;
  }
  return null;
}

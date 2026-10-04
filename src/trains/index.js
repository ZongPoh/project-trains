// The depot roster. One file per train; add a train here to make it appear in the game.
import n700s from './shinkansen/n700s.js';
import series0 from './shinkansen/series-0.js';
import doctorYellow from './shinkansen/doctor-yellow.js';
import series500 from './shinkansen/series-500.js';
import e5 from './shinkansen/e5-hayabusa.js';
import e6 from './shinkansen/e6-komachi.js';
import hayabusaKomachi from './shinkansen/hayabusa-komachi.js';
import e7 from './shinkansen/e7-kagayaki.js';
import e8 from './shinkansen/e8-tsubasa.js';
import e4 from './shinkansen/e4-max.js';
import series800 from './shinkansen/series-800.js';
import l0 from './shinkansen/l0-maglev.js';
import { couple } from './coupling.js';

export const ROSTER = [n700s, series0, doctorYellow, series500, e5, e6, hayabusaKomachi, e7, e8, e4, series800, l0];

export const TRAINS = Object.fromEntries(ROSTER.map(t => [t.id, t]));

// Trains from the first prototype now live in ./archive. Old saved layouts that still name
// them get a Shinkansen instead.
export const LEGACY_IDS = { bullet: 'n700s', steam: 'series-0', diesel: 'doctor-yellow', metro: 'e5-hayabusa' };

// Look a train up by id. "a+b" is any two trains coupled together.
export function trainDef(id) {
  if (TRAINS[id]) return TRAINS[id];
  if (LEGACY_IDS[id]) return TRAINS[LEGACY_IDS[id]];
  const parts = String(id).split('+');
  if (parts.length !== 2) return null;
  const a = trainDef(parts[0]), b = trainDef(parts[1]);
  return a && b && !a.units && !b.units ? couple(a, b) : null;
}

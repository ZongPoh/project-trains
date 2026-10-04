import { COL } from '../../core/colors.js';
import { COACH } from '../../core/constants.js';
import { car, wheels } from '../parts.js';

// Shared kit for the bullet trains. Each train file gives the kit its numbers (nose shape,
// colours, speed) and a livery function; the kit turns that into a five-car toy train:
// a nose car, three coaches and a second nose car facing backwards.
//
// A body is a "loft": a row of rounded cross-sections from the back of the car to the front.
// The nose is the same body with the sections shrinking towards the tip.

const lerp = (a, b, t) => a + (b - a) * t;

function sectionAt(secs, z) {
  if (z <= secs[0].z) return { ...secs[0], z };
  for (let i = 0; i < secs.length - 1; i++) {
    const a = secs[i], b = secs[i + 1];
    if (z <= b.z) {
      const t = (z - a.z) / (b.z - a.z || 1);
      return { z, w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), y: lerp(a.y, b.y, t), e: lerp(a.e, b.e, t) };
    }
  }
  return { ...secs[secs.length - 1], z };
}
function slice(secs, za, zb) {
  const out = [sectionAt(secs, za)];
  for (const s of secs) if (s.z > za + 1e-5 && s.z < zb - 1e-5) out.push(s);
  out.push(sectionAt(secs, zb));
  return out;
}

// What a livery function paints with. Heights are fractions of the body: 1 roof, 0 middle, -1 floor.
function painter(g, secs, exp, st = { off: 0 }, caps = {}) {
  const next = () => (st.off += 0.0004);
  return {
    hull: col => g.hull(secs, col, { exp, capCol: COL.dark, ...caps }),          // the whole body
    roof: (down, col) => g.roof(secs, down, col, { exp, off: next() }),          // from `down` up and over
    band: (top, bot, col) => g.band(secs, top, bot, col, { exp, off: next() }),  // a stripe on both sides
    between: (za, zb) => painter(g, slice(secs, za, zb), exp, st),               // only part of the length
  };
}

// A row of windows along both sides.
export function windowRow(g, halfWidth, za, zb, n, y, h) {
  const pitch = (zb - za) / n, wz = pitch * 0.66;
  g.lit(1, () => {
    for (let i = 0; i < n; i++) {
      const z = za + pitch * (i + 0.5);
      for (const s of [-1, 1]) g.box(s * (halfWidth + 0.002), y, z, 0.005, h, wz, COL.glass);
    }
  });
}

export function pantograph(g, top, z) {
  g.box(0, top + 0.012, z, 0.07, 0.008, 0.05, COL.grey);
  g.box(0, top + 0.035, z + 0.02, 0.008, 0.045, 0.008, COL.dark);
  g.box(0, top + 0.058, z + 0.035, 0.11, 0.006, 0.012, COL.dark);
}

export function shinkansen(spec) {
  const body = { w: 0.1, yb: 0.05, yt: 0.25, exp: 4.6, ...spec.body };
  const nose = { len: 0.3, drop: 0.3, early: 1, taper: 0.6, widePow: 2, blunt: 8, tipExp: 2.6, lift: 0.02, steps: 16, ...spec.nose };
  const cabLen = spec.cabLen ?? 0.3, L = cabLen + nose.len;
  const coachL = COACH, coaches = 3;                 // fixed, so every train's doors meet the marks on the platform
  const full = { w: body.w, h: (body.yt - body.yb) / 2, y: (body.yt + body.yb) / 2, e: body.exp };
  const z0 = L / 2 - nose.len;                       // where the nose begins
  const yOf = f => full.y + full.h * f;
  const zAt = u => z0 + nose.len * u;

  // Cross-section of the nose at u: 0 where it leaves the body, 1 at the tip.
  function profile(u) {
    if (u <= 0) return { ...full };
    const cap = Math.sqrt(Math.max(0, 1 - Math.pow(u, nose.blunt)));
    const fall = nose.early >= 1 ? Math.pow(u, nose.early) : 1 - Math.pow(1 - u, 1 / nose.early);
    const T = Math.max(0.03, (1 - (1 - nose.drop) * fall) * cap);
    const Wd = Math.max(0.03, (1 - (1 - nose.taper) * Math.pow(u, nose.widePow)) * cap);
    const yb = body.yb + nose.lift * u * u, yt = yb + (body.yt - yb) * T;
    return { w: body.w * Wd, h: (yt - yb) / 2, y: (yt + yb) / 2, e: lerp(body.exp, nose.tipExp, u) };
  }
  const at = u => { const s = profile(u); return { ...s, z: zAt(u), top: s.y + s.h }; };

  function noseSections() {
    const secs = [{ z: -L / 2, ...full }, { z: z0, ...full }];
    for (let k = 1; k <= nose.steps; k++) {
      const u = Math.sin(Math.PI / 2 * k / nose.steps);
      secs.push({ z: zAt(u), ...profile(u) });
    }
    return secs;
  }

  function underframe(g, len, zs) {
    g.box(0, body.yb + 0.004, 0, body.w * 1.5, 0.03, len * 0.9, COL.dark);
    if (spec.wheels !== false) wheels(g, zs, 0.024, COL.dark);
  }

  function buildNose(g) {
    const p = painter(g, noseSections(), body.exp);
    const ctx = { part: 'nose', g, L, z0, zAt, at, yOf, body, full };
    spec.livery(p, ctx);
    const cab = spec.cab === undefined ? { from: 0.1, to: 0.42, down: 0.5 } : spec.cab;
    if (cab) g.lit(0.35, () => p.between(zAt(cab.from), zAt(cab.to)).roof(cab.down, COL.glass));
    const win = { y: yOf(0.35), h: full.h * 0.36, ...spec.windows };
    if (cabLen > 0.16) windowRow(g, body.w, -L / 2 + 0.07, z0 - 0.03, Math.max(2, Math.round((cabLen - 0.1) / 0.05)), win.y, win.h);
    g.box(0, yOf(-0.1), -L / 2 + 0.035, body.w * 2 + 0.006, full.h * 1.25, 0.026, spec.door || COL.silver);   // door
    if (spec.lights !== false) {
      const s = at(spec.lightsAt ?? 0.66);
      g.lit(1.6, () => { for (const side of [-1, 1]) g.sph(side * s.w * 0.62, s.y + s.h * 0.35, s.z, 0.014, 0.01, 0.022, COL.lamp); });
    }
    underframe(g, L - nose.len * 0.5, [-L / 2 + 0.07, -L / 2 + 0.15, z0 - 0.1, z0 - 0.02]);
    if (spec.details) spec.details(g, ctx);
  }

  function buildCoach(g, index) {
    const secs = [{ z: -coachL / 2, ...full }, { z: coachL / 2, ...full }];
    const p = painter(g, secs, body.exp, { off: 0 }, { capFront: COL.dark });
    const ctx = { part: 'coach', index, g, L: coachL, yOf, body, full };
    spec.livery(p, ctx);
    const win = { y: yOf(0.35), h: full.h * 0.36, ...spec.windows };
    windowRow(g, body.w, -coachL / 2 + 0.07, coachL / 2 - 0.07, 8, win.y, win.h);
    if (win.y2) windowRow(g, body.w, -coachL / 2 + 0.07, coachL / 2 - 0.07, 8, win.y2, win.h);
    for (const e of [-1, 1]) g.box(0, yOf(-0.1), e * (coachL / 2 - 0.035), body.w * 2 + 0.006, full.h * 1.25, 0.026, spec.door || COL.silver);
    g.box(0, body.yt + 0.004, 0, body.w * 0.9, 0.012, coachL * 0.5, COL.grey);              // roof equipment
    if (index === 1 && spec.pantograph !== false) pantograph(g, body.yt, 0.14);
    underframe(g, coachL, [-coachL / 2 + 0.08, -coachL / 2 + 0.16, coachL / 2 - 0.16, coachL / 2 - 0.08]);
    if (spec.details) spec.details(g, ctx);
  }

  const top = body.yt;                               // roof height, used by the ride-along camera
  const cars = [{ len: L, top, make: () => car(buildNose) }];
  for (let i = 0; i < coaches; i++) cars.push({ len: coachL, top, make: () => car(g => buildCoach(g, i)) });
  cars.push({ len: L, top, make: () => car(buildNose, true) });

  return { id: spec.id, name: spec.name, line: spec.line, meta: spec.meta, speed: spec.speed, service: spec.service, family: 'shinkansen', cars };
}

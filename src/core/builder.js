import * as THREE from 'three';

// Geometry builder: many coloured shapes merged into one mesh, so each track piece, train car
// or building is a single draw call. Colours are stored per vertex.
const V3 = THREE.Vector3;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const SPH = new THREE.SphereGeometry(1, 16, 12);
const cache = {};
const _v = new V3(), _f1 = new V3(), _r1 = new V3(), _u1 = new V3(), _s = new V3();
const _nm = new THREE.Matrix3(), _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _m3 = new THREE.Matrix4();
const IDENT = new THREE.Matrix4();

export const ROT180 = new THREE.Matrix4().makeRotationY(Math.PI);

function flat(g) {                       // faceted version of a shape
  const n = g.index ? g.toNonIndexed() : g;
  n.computeVertexNormals();
  return n;
}
const blobGeo = () => cache.blob || (cache.blob = flat(new THREE.IcosahedronGeometry(1, 1)));
function pyramidGeo(ratio) {             // square base of side 1, height 1, top side = ratio
  const k = 'pyr' + ratio.toFixed(3);
  if (!cache[k]) {
    const g = new THREE.CylinderGeometry(ratio * Math.SQRT1_2, Math.SQRT1_2, 1, 4, 1);
    g.rotateY(Math.PI / 4);
    cache[k] = flat(g);
  }
  return cache[k];
}
function gableGeo() {                    // roof prism: base 1 x 1, height 1, ridge along z
  if (!cache.gable) {
    const A = [-.5, 0, -.5], B = [-.5, 0, .5], C2 = [0, 1, .5], D = [0, 1, -.5], E = [.5, 0, -.5], F = [.5, 0, .5];
    const tris = [A, B, C2, A, C2, D, E, C2, F, E, D, C2, B, F, C2, E, A, D];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
    g.computeVertexNormals();
    cache.gable = g;
  }
  return cache.gable;
}

// Height fraction (-1 bottom, 1 top) to an angle around a rounded-box cross-section.
const fracAngle = (f, e) => Math.acos(Math.sign(f) * Math.pow(Math.min(1, Math.abs(f)), e / 2));

export class GB {
  constructor() { this.p = []; this.n = []; this.c = []; this.g = []; this.i = []; this.v = 0; this.base = null; this.glow = 0; }

  // Shapes added inside fn light up at night (windows, lamps). amount: 0 dark, 1 fully lit.
  lit(amount, fn) { const was = this.glow; this.glow = amount; fn(); this.glow = was; }

  add(g, m, col) {
    if (this.base) m = _m2.multiplyMatrices(this.base, m);
    _nm.getNormalMatrix(m);
    const pos = g.attributes.position, nor = g.attributes.normal, idx = g.index;
    for (let k = 0; k < pos.count; k++) {
      _v.fromBufferAttribute(pos, k).applyMatrix4(m); this.p.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(nor, k).applyMatrix3(_nm).normalize(); this.n.push(_v.x, _v.y, _v.z);
      this.c.push(col.r, col.g, col.b);
      this.g.push(this.glow);
    }
    if (idx) for (let k = 0; k < idx.count; k++) this.i.push(idx.getX(k) + this.v);
    else for (let k = 0; k < pos.count; k++) this.i.push(k + this.v);
    this.v += pos.count;
  }

  /* ----- simple shapes; x,y,z is the centre ----- */
  box(x, y, z, sx, sy, sz, col) { _m.makeScale(sx, sy, sz).setPosition(x, y, z); this.add(UNIT_BOX, _m, col); }
  obox(x, y, z, f, sx, sy, sz, col) {      // box whose length runs along direction f
    _f1.copy(f).normalize(); _r1.set(_f1.z, 0, -_f1.x).normalize(); _u1.crossVectors(_f1, _r1);
    _m.makeBasis(_r1, _u1, _f1); _m.scale(_s.set(sx, sy, sz)); _m.setPosition(x, y, z); this.add(UNIT_BOX, _m, col);
  }
  cyl(x, y, z, r, len, col, axis, rTop) {
    const rt = rTop == null ? r : rTop, k = rt + '|' + r + '|' + len;
    const g = cache[k] || (cache[k] = new THREE.CylinderGeometry(rt, r, len, 14));
    if (axis === 'x') _m.makeRotationZ(Math.PI / 2); else if (axis === 'z') _m.makeRotationX(Math.PI / 2); else _m.identity();
    _m.setPosition(x, y, z); this.add(g, _m, col);
  }
  sph(x, y, z, sx, sy, sz, col) { _m.makeScale(sx, sy, sz).setPosition(x, y, z); this.add(SPH, _m, col); }

  /* ----- scenery shapes; y is the base, so things stand on the ground ----- */
  slab(x, y, z, sx, sy, sz, col, ry) {
    _m.makeRotationY(ry || 0).scale(_s.set(sx, sy, sz)).setPosition(x, y + sy / 2, z); this.add(UNIT_BOX, _m, col);
  }
  blob(x, y, z, sx, sy, sz, col, ry) {     // low-poly ball, for foliage, clouds and hills
    _m.makeRotationY(ry || 0).scale(_s.set(sx, sy, sz)).setPosition(x, y, z); this.add(blobGeo(), _m, col);
  }
  pyr(x, y, z, side, h, col, topSide, ry) { // pyramid, or a tapered block when topSide is given
    const g = pyramidGeo(topSide ? topSide / side : 0);
    _m.makeRotationY(ry || 0).scale(_s.set(side, h, side)).setPosition(x, y + h / 2, z); this.add(g, _m, col);
  }
  gable(x, y, z, sx, h, sz, col, alongX) {  // pitched roof
    _m.makeRotationY(alongX ? Math.PI / 2 : 0);
    _m3.makeScale(alongX ? sz : sx, h, alongX ? sx : sz);
    _m.multiply(_m3).setPosition(x, y, z); this.add(gableGeo(), _m, col);
  }

  /* ----- lofted bodies, used for the streamlined trains -----
     secs: cross-sections from back to front, each { z, w, h, y, e }
           w and h are half sizes, y the centre height, e how square the section is. */
  _strip(secs, angleOf, m, col, o) {
    const off = o.off || 0, pos = [], idx = [];
    for (const s of secs) {
      const k = 2 / (s.e || o.exp || 4);
      for (let j = 0; j <= m; j++) {
        const th = angleOf(s, j), sn = Math.sin(th), cs = Math.cos(th);
        pos.push((s.w + off) * Math.sign(sn) * Math.pow(Math.abs(sn), k),
                 s.y + (s.h + off) * Math.sign(cs) * Math.pow(Math.abs(cs), k), s.z);
      }
    }
    const row = m + 1;
    for (let i = 0; i < secs.length - 1; i++) for (let j = 0; j < m; j++) {
      const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    this._raw(pos, idx, col);
  }
  _cap(s, n, o, front, col) {
    const k = 2 / (s.e || o.exp || 4), pos = [0, s.y, s.z], idx = [];
    for (let j = 0; j <= n; j++) {
      const th = Math.PI + 2 * Math.PI * j / n, sn = Math.sin(th), cs = Math.cos(th);
      pos.push(s.w * Math.sign(sn) * Math.pow(Math.abs(sn), k), s.y + s.h * Math.sign(cs) * Math.pow(Math.abs(cs), k), s.z);
    }
    for (let j = 0; j < n; j++) front ? idx.push(0, j + 2, j + 1) : idx.push(0, j + 1, j + 2);
    this._raw(pos, idx, col);
  }
  _raw(pos, idx, col) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    this.add(g, IDENT, col);
    g.dispose();
  }
  // Loose triangles, each shaded flat: 9 numbers per triangle. Used for terrain.
  facets(tris, col) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3));
    g.computeVertexNormals();
    this.add(g, IDENT, col);
    g.dispose();
  }
  // Draw a smaller model inside this one: everything fn adds is moved by matrix m first.
  within(m, fn) {
    const was = this.base;
    this.base = was ? new THREE.Matrix4().multiplyMatrices(was, m) : m;
    fn();
    this.base = was;
  }
  hull(secs, col, o = {}) {                 // the whole skin, closed at both ends
    const n = o.n || 22;
    this._strip(secs, (s, j) => Math.PI + 2 * Math.PI * j / n, n, col, o);
    this._cap(secs[0], n, o, false, o.capCol || col);
    this._cap(secs[secs.length - 1], n, o, true, o.capFront || col);
  }
  band(secs, top, bot, col, o = {}) {       // a stripe on both sides, between two height fractions
    const m = o.m || 4, e = s => s.e || o.exp || 4;
    const ang = (s, t) => { const a = fracAngle(top, e(s)), b = fracAngle(bot, e(s)); return a + (b - a) * t; };
    this._strip(secs, (s, j) => ang(s, j / m), m, col, o);
    this._strip(secs, (s, j) => -ang(s, 1 - j / m), m, col, o);
  }
  roof(secs, down, col, o = {}) {           // everything above a height fraction, over the top
    const m = o.m || 10, e = s => s.e || o.exp || 4;
    this._strip(secs, (s, j) => fracAngle(down, e(s)) * (2 * j / m - 1), m, col, o);
  }

  mesh(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('glow', new THREE.Float32BufferAttribute(this.g, 1));
    g.setIndex(this.i);
    return new THREE.Mesh(g, material);
  }
}

// Hình tự nhiên dựng bằng code nhưng gần giống thật: địa hình gồ ghề có màu theo độ cao (cỏ – đá – tuyết),
// tán lá nhiều chùm, ngọn cỏ cong, cánh hoa, mặt nước trong có bờ cát. Tất cả đặt chân ở y = 0.
import * as THREE from 'three';

// ---------- tiện ích ----------
/** số ngẫu nhiên có hạt giống: cùng hạt → cùng hình (lưu bài mở lại không đổi) */
const rng = (seed: number) => { let s = (seed * 9301 + 49297) % 233280 || 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
const hash = (x: number, z: number) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
/** nhiễu mượt 0..1 */
function noise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x: number, z: number) => noise(x, z) * 0.6 + noise(x * 2.1 + 5, z * 2.1 + 3) * 0.28 + noise(x * 4.3 + 9, z * 4.3 + 1) * 0.12;
const smooth = (a: number, b: number, t: number) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
const C = (c: string | THREE.Color) => new THREE.Color(c);

const mat = (c: THREE.ColorRepresentation, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9, ...o });
/** vật liệu lấy màu từng đỉnh */
const vmat = (o: THREE.MeshStandardMaterialParameters = {}) => mat(0xffffff, { vertexColors: true, ...o });
function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function grp(...a: THREE.Object3D[]) { const g = new THREE.Group(); a.forEach((o) => g.add(o)); return g; }
function setColors(g: THREE.BufferGeometry, fn: (x: number, y: number, z: number, i: number) => THREE.Color) {
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = fn(p.getX(i), p.getY(i), p.getZ(i), i); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}

/** địa hình tròn: tâm + các vòng; rad(a) = hệ số bán kính theo góc (bờ không tròn đều); h(x, z, t) với t = 0 ở tâm, 1 ở mép */
function radial(R: number, rings: number, segs: number, rad: (a: number) => number, h: (x: number, z: number, t: number) => number, col: (x: number, y: number, z: number, t: number) => THREE.Color) {
  const pos: number[] = [], ts: number[] = [], idx: number[] = [];
  pos.push(0, h(0, 0, 0), 0); ts.push(0);
  for (let i = 1; i <= rings; i++) for (let j = 0; j < segs; j++) {
    const a = (j / segs) * Math.PI * 2, t = i / rings, r = R * t * rad(a);
    const x = Math.cos(a) * r, z = Math.sin(a) * r; pos.push(x, h(x, z, t), z); ts.push(t);
  }
  const at = (i: number, j: number) => 1 + (i - 1) * segs + (j % segs);
  for (let j = 0; j < segs; j++) idx.push(0, at(1, j + 1), at(1, j));
  for (let i = 1; i < rings; i++) for (let j = 0; j < segs; j++) {
    const a = at(i, j), b = at(i, j + 1), c = at(i + 1, j), d = at(i + 1, j + 1);
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  setColors(g, (x, y, z, i) => col(x, y, z, ts[i]));
  g.computeVertexNormals(); return g;
}

/** khối tròn méo (chùm lá, hòn đá): sáng ở trên, tối ở dưới */
export function blob(r: number, color: string | THREE.Color, o: { amp?: number; seed?: number; detail?: number; light?: number } = {}) {
  const g = new THREE.IcosahedronGeometry(r, o.detail ?? 1), p = g.attributes.position, sd = o.seed ?? 1, amp = o.amp ?? 0.22;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + amp * (noise(x * 2.3 / r + sd * 7.1, z * 2.3 / r + y * 1.7 / r) - 0.5) * 2;
    p.setXYZ(i, x * k, y * k * 0.92, z * k);
  }
  const base = C(color), dark = base.clone().multiplyScalar(0.7), lit = base.clone().lerp(C('#f4ffb8'), o.light ?? 0.22);
  setColors(g, (x, y, z) => dark.clone().lerp(lit, Math.min(1, Math.max(0, (y / r + 1) / 2 + (hash(x * 9 + sd, z * 9) - 0.5) * 0.25))));
  g.computeVertexNormals(); return mesh(g, vmat());
}

/** lá: hình thoi cong, dài theo trục +Y, cong ra phía +Z */
export function leafGeo(len: number, wid: number, curl = 0.2) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(wid * 1.7, len * 0.4, 0, len); s.quadraticCurveTo(-wid * 1.7, len * 0.4, 0, 0);
  const g = new THREE.ShapeGeometry(s, 5), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i) / len; p.setZ(i, curl * len * y * y - Math.abs(x) * 0.2); }
  g.computeVertexNormals(); return g;
}
const leafMat = (c: string) => mat(c, { side: THREE.DoubleSide, roughness: 0.75 });

/** khóm cỏ: nhiều ngọn cong, gốc đậm ngọn nhạt */
export function grassClump(color: string, o: { n?: number; R?: number; H?: number; seed?: number; tip?: string } = {}) {
  const r = rng(o.seed ?? 3), n = o.n ?? 26, R = o.R ?? 0.35, H = o.H ?? 0.6;
  const base = C(color).multiplyScalar(0.55), tip = C(color).lerp(C(o.tip ?? '#eaf7a0'), 0.35);
  const pos: number[] = [], col: number[] = [], idx: number[] = []; const SEG = 3;
  for (let b = 0; b < n; b++) {
    const ang = r() * Math.PI * 2, d = Math.sqrt(r()) * R, x0 = Math.cos(ang) * d, z0 = Math.sin(ang) * d;
    const h = H * (0.55 + 0.6 * r()), w = 0.04 + 0.03 * r(), face = r() * Math.PI, lean = 0.2 + 0.55 * r();
    const px = -Math.sin(face), pz = Math.cos(face), v0 = pos.length / 3;
    for (let s = 0; s <= SEG; s++) {
      const t = s / SEG, wd = w * (1 - t * 0.92), bend = lean * h * t * t;
      const cx = x0 + Math.cos(ang) * bend, cz = z0 + Math.sin(ang) * bend, y = h * t * (1 - 0.25 * lean * t);
      pos.push(cx - px * wd, y, cz - pz * wd, cx + px * wd, y, cz + pz * wd);
      const c = base.clone().lerp(tip, t); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    for (let s = 0; s < SEG; s++) { const a = v0 + s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = mesh(g, vmat({ side: THREE.DoubleSide, roughness: 0.8 })); m.castShadow = false; return m;
}

/** bông hoa: hai lớp cánh hình bầu dục, nhuỵ vàng */
export function flowerHead(color: string, r = 0.22) {
  const g = new THREE.Group(), pm = mat(color, { flatShading: false, roughness: 0.6 }), pm2 = mat(C(color).lerp(C('#ffffff'), 0.25), { flatShading: false, roughness: 0.6 });
  const petal = new THREE.SphereGeometry(1, 12, 8);
  [[10, 0, 0.32, pm], [8, Math.PI / 8, 0.62, pm2]].forEach(([n, off, tilt, m], layer) => {
    for (let i = 0; i < (n as number); i++) {
      const a = (i / (n as number)) * Math.PI * 2 + (off as number), k = layer ? 0.78 : 1;
      const p = new THREE.Mesh(petal, m as THREE.Material); p.scale.set(r * 0.6 * k, r * 0.07, r * 0.24 * k);
      const piv = new THREE.Group(); piv.rotation.y = -a; p.position.x = r * 0.55 * k; p.rotation.z = tilt as number; piv.add(p); piv.position.y = layer * 0.02; g.add(piv);
    }
  });
  const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.32, 12, 8), mat('#f5b301', { flatShading: false })); c.scale.y = 0.55; c.position.y = r * 0.06;
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.17, 10, 6), mat('#a16207')); c2.scale.y = 0.6; c2.position.y = r * 0.15;
  g.add(c, c2); g.traverse((o) => { o.castShadow = true; }); return g;
}

// ---------- cây ----------
function trunk(h: number, r0: number, r1: number, color: string, branches: [number, number, number, number][]) {
  const bark = mat(color, { roughness: 1 });
  const g = grp(mesh(new THREE.CylinderGeometry(r1, r0, h, 8), bark, 0, h / 2), mesh(new THREE.ConeGeometry(r0 * 1.6, 0.35, 8), bark, 0, 0.17));
  branches.forEach(([y, ang, tilt, len]) => {
    const b = mesh(new THREE.CylinderGeometry(r1 * 0.45, r1 * 0.7, len, 6), bark); b.geometry.translate(0, len / 2, 0);
    b.position.y = y; b.rotation.order = 'YXZ'; b.rotation.y = ang; b.rotation.x = tilt; g.add(b);
  });
  return g;
}
const TRUNK = '#6b4630';

export function roundTree(color: string, seed = 2) {
  const g = trunk(2.1, 0.3, 0.17, TRUNK, [[1.3, 0.4, 0.8, 0.9], [1.5, 2.6, 0.75, 0.8], [1.7, 4.4, 0.6, 0.7]]);
  const r = rng(seed);
  [[0, 2.75, 0, 1.0], [0.8, 2.4, 0.3, 0.75], [-0.75, 2.45, -0.2, 0.8], [0.1, 3.35, 0.1, 0.75], [-0.25, 2.35, 0.8, 0.72], [0.35, 2.45, -0.8, 0.72], [-0.6, 3.05, 0.45, 0.6], [0.6, 3.1, -0.35, 0.6]]
    .forEach(([x, y, z, s], i) => { const b = blob(s * (0.92 + r() * 0.16), C(color).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.06), { seed: seed * 10 + i }); b.position.set(x, y, z); g.add(b); });
  return g;
}

export function fruitTree(color: string, fruit = '#f97316', seed = 5) {
  const g = trunk(1.5, 0.26, 0.15, TRUNK, [[1.0, 0.2, 0.9, 0.9], [1.1, 2.3, 0.85, 0.85], [1.2, 4.3, 0.8, 0.8]]);
  const r = rng(seed);
  const spots = [[0, 2.2, 0, 1.05], [1.0, 1.95, 0.2, 0.75], [-0.95, 2.0, -0.25, 0.8], [0.15, 2.85, 0.05, 0.8], [-0.2, 1.85, 0.95, 0.7], [0.3, 1.9, -0.95, 0.72], [-0.7, 2.6, 0.5, 0.6], [0.75, 2.6, -0.45, 0.6]];
  spots.forEach(([x, y, z, s], i) => { const b = blob(s, C(color).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.06), { seed: seed * 10 + i }); b.position.set(x, y, z); g.add(b); });
  const fm = mat(fruit, { flatShading: false, roughness: 0.45 }), stalk = mat('#5b3a1e'), fg = new THREE.SphereGeometry(0.15, 12, 10);
  for (let i = 0; i < 14; i++) {
    const [x, y, z, s] = spots[Math.floor(r() * spots.length)];
    const a = r() * Math.PI * 2, el = -0.35 + r() * 0.9, d = new THREE.Vector3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    const f = mesh(fg, fm, x + d.x * s * 0.92, y + d.y * s * 0.85, z + d.z * s * 0.92); f.scale.y = 0.95;
    f.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 4), stalk, 0, 0.16, 0));
    g.add(f);
  }
  return g;
}

// ---------- cây nhỏ, hoa, cỏ ----------
export function flower(color: string) {
  const stemM = mat('#3f8f3f', { roughness: 0.8 });
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.04, 0.35, 0.02), new THREE.Vector3(-0.02, 0.7, 0), new THREE.Vector3(0.03, 0.95, 0.04)]);
  const g = grp(mesh(new THREE.TubeGeometry(curve, 12, 0.022, 5), stemM));
  [[0.22, 1.5, 0.6], [0.42, -1.6, 0.55], [0.62, 2.3, 0.4]].forEach(([y, a, s]) => {
    const l = mesh(leafGeo(0.5 * (s / 0.55), 0.17, 0.3), leafMat('#2f7d32'), 0, y, 0); l.rotation.order = 'YXZ'; l.rotation.y = a; l.rotation.x = 0.8; g.add(l);
  });
  const h = flowerHead(color, 0.28); h.position.set(0.03, 0.97, 0.04); h.rotation.x = 0.45; g.add(h);
  // nụ nhỏ bên cạnh
  const bud = mesh(new THREE.SphereGeometry(0.05, 8, 6), mat(color, { flatShading: false }), 0.12, 0.78, -0.05); bud.scale.y = 1.4;
  g.add(mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.2, 4), stemM, 0.07, 0.68, -0.03).rotateZ(-0.5), bud);
  return g;
}

export function potPlant(color: string) {
  const prof = [[0, 0.02], [0.27, 0], [0.31, 0.04], [0.4, 0.5], [0.47, 0.52], [0.49, 0.66], [0.44, 0.68], [0.41, 0.6], [0.0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y));
  const pot = mesh(new THREE.LatheGeometry(prof, 22), mat(color, { flatShading: false, roughness: 0.75 }));
  const soil = mesh(new THREE.CylinderGeometry(0.405, 0.405, 0.02, 20), mat('#4a3424', { roughness: 1 }), 0, 0.61);
  const g = grp(pot, soil), r = rng(9);
  const greens = ['#2f7d3a', '#3c9a48', '#4fae55'];
  for (let i = 0; i < 11; i++) {
    const len = 0.55 + r() * 0.35, l = mesh(leafGeo(len, 0.16 + r() * 0.06, 0.45), leafMat(greens[i % 3]), (r() - 0.5) * 0.12, 0.6, (r() - 0.5) * 0.12);
    l.rotation.order = 'YXZ'; l.rotation.y = (i / 11) * Math.PI * 2 + r() * 0.3; l.rotation.x = i < 4 ? 0.15 + r() * 0.2 : 0.45 + r() * 0.45; g.add(l);
  }
  return g;
}

export function grassTuft(color: string) {
  return grp(grassClump(color, { n: 48, R: 0.42, H: 0.65, seed: 4 }), grassClump(color, { n: 18, R: 0.2, H: 0.9, seed: 8 }));
}

// ---------- địa hình ----------
export function mountain(color: string) {
  const H = 4.4, rock = C(color), dark = rock.clone().multiplyScalar(0.7), grass = C('#5d8c45'), snow = C('#f6f8fb');
  const peak = (x: number, z: number, cx: number, cz: number, h: number, r: number) => { const d = Math.hypot(x - cx, z - cz) / r; return d >= 1 ? 0 : h * Math.pow(1 - d, 1.3); };
  const geo = radial(2.8, 18, 40, (a) => 1 + 0.1 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 7), (x, z, t) => {
    const base = Math.max(peak(x, z, 0.1, 0, H, 2.8), peak(x, z, -1.15, 0.75, 2.6, 1.8), peak(x, z, 1.05, -0.95, 2.1, 1.6));
    const ridge = (fbm(x * 1.4 + 2, z * 1.4) - 0.5) * 0.9 * Math.min(1, base / 1.2);
    return Math.max(0, base + ridge) * (1 - smooth(0.82, 1, t));
  }, (x, y, z) => {
    const k = y / H + (noise(x * 3, z * 3) - 0.5) * 0.14;
    if (k > 0.64) return snow;
    if (k < 0.1) return grass.clone().lerp(rock, Math.max(0, k) * 4);
    return rock.clone().lerp(dark, noise(x * 2.5 + 3, z * 2.5 + 8));
  });
  return grp(mesh(geo, vmat()));
}

export function hill(color: string) {
  const c = C(color), light = c.clone().lerp(C('#eef7a8'), 0.3), dark = c.clone().multiplyScalar(0.75);
  const geo = radial(2, 12, 32, (a) => 1 + 0.08 * Math.sin(a * 2 + 0.5) + 0.05 * Math.sin(a * 5), (x, z, t) => 1.05 * Math.pow(Math.max(0, 1 - t * t), 1.5) * (0.85 + 0.3 * fbm(x * 1.2, z * 1.2)),
    (x, y, z) => dark.clone().lerp(light, Math.min(1, y * 0.55 + noise(x * 2.2, z * 2.2) * 0.5)));
  const g = grp(mesh(geo, vmat()));
  const s1 = blob(0.2, '#9ca3af', { seed: 3, amp: 0.3, detail: 0, light: 0.1 }); s1.position.set(1.15, 0.22, 0.55);
  const s2 = blob(0.13, '#94a3b8', { seed: 5, amp: 0.3, detail: 0, light: 0.1 }); s2.position.set(1.35, 0.1, 0.25);
  const t1 = grassClump(color, { n: 14, R: 0.2, H: 0.3, seed: 6 }); t1.position.set(-0.9, 0.62, 0.6);
  const t2 = grassClump(color, { n: 14, R: 0.2, H: 0.3, seed: 7 }); t2.position.set(0.4, 0.85, -0.7);
  g.add(s1, s2, t1, t2); return g;
}

export function plain(color: string) {
  const W = 3.2, D = 2.4, nx = 26, nz = 20, c = C(color), dry = c.clone().lerp(C('#e2d27a'), 0.35), deep = c.clone().multiplyScalar(0.78);
  const geo = new THREE.PlaneGeometry(W, D, nx, nz); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), e = Math.min(smooth(0, 0.25, W / 2 - Math.abs(x)), smooth(0, 0.25, D / 2 - Math.abs(z)));
    p.setY(i, (0.07 + 0.06 * fbm(x * 1.3 + 4, z * 1.3)) * e);
  }
  setColors(geo, (x, y, z) => deep.clone().lerp(c, fbm(x * 1.6, z * 1.6) * 1.3).lerp(dry, Math.max(0, noise(x * 0.9 + 7, z * 0.9 + 2) - 0.55) * 2));
  geo.computeVertexNormals();
  const g = grp(mesh(geo, vmat())), r = rng(11);
  for (let i = 0; i < 12; i++) { const t = grassClump(color, { n: 10, R: 0.14, H: 0.22 + r() * 0.12, seed: 20 + i }); t.position.set((r() - 0.5) * (W - 0.6), 0.08, (r() - 0.5) * (D - 0.6)); g.add(t); }
  const fl = ['#fde047', '#ffffff', '#f472b6'];
  for (let i = 0; i < 14; i++) { const f = mesh(new THREE.SphereGeometry(0.045, 6, 4), mat(fl[i % 3]), (r() - 0.5) * (W - 0.5), 0.15, (r() - 0.5) * (D - 0.5)); f.castShadow = false; g.add(f); }
  return g;
}

export function cloud(color: string) {
  const m = mat(color, { flatShading: false, roughness: 1, emissive: color, emissiveIntensity: 0.18 }), sg = new THREE.SphereGeometry(1, 20, 14);
  const g = new THREE.Group();
  [[-1.35, 0, 0, 0.55], [-0.65, 0.05, 0.15, 0.72], [0.2, 0.08, -0.05, 0.82], [1.0, 0.02, 0.1, 0.66], [1.65, -0.04, -0.05, 0.46], [-0.2, 0, -0.45, 0.62], [0.6, 0, 0.48, 0.58], [-0.9, 0, -0.35, 0.5],
    [-0.45, 0.62, 0, 0.62], [0.4, 0.78, -0.05, 0.72], [0.05, 1.12, 0.05, 0.5], [1.05, 0.5, 0, 0.46]]
    .forEach(([x, y, z, s], i) => { const p = mesh(sg, m, x, y, z); p.scale.set(s, s * (i < 8 ? 0.78 : 0.92), s); g.add(p); });
  const base = mesh(sg, m, 0.15, -0.12, 0); base.scale.set(1.75, 0.3, 0.75); g.add(base);
  return g;
}

/** màu đáy – cát – cỏ cho hồ và sông theo độ cao */
function shoreColor(water: THREE.Color, wl: number) {
  const bed = water.clone().multiplyScalar(0.45).lerp(C('#3d5a40'), 0.35), sand = C('#d8c28c'), wet = C('#a68a5b'), grass = C('#6a9a4c');
  return (x: number, y: number, z: number, t: number) => {
    if (y < wl - 0.03) return bed.clone().lerp(wet, Math.max(0, (y - 0.01) / (wl - 0.04)) * 0.5);
    if (y < wl + 0.01) return wet.clone();
    if (t > 0.9 + (noise(x * 4, z * 4) - 0.5) * 0.06) return grass.clone().lerp(C('#4f7f3a'), noise(x * 3, z * 3));
    return sand.clone().lerp(C('#c7ad74'), noise(x * 5, z * 5));
  };
}
const waterMat = (color: string) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.78, roughness: 0.12, metalness: 0.15 });

export function lake(color: string) {
  const sh = (a: number) => 1 + 0.13 * Math.sin(3 * a + 0.4) + 0.07 * Math.sin(5 * a + 2) + 0.04 * Math.sin(8 * a);
  const WL = 0.12, R = 2.35;
  const bed = radial(R, 16, 48, sh, (x, z, t) => {
    const n = (noise(x * 2, z * 2) - 0.5) * 0.02;
    if (t < 0.66) return 0.015 + 0.06 * (t / 0.66) ** 2 + n;
    if (t < 0.88) return 0.075 + 0.1 * smooth(0.66, 0.88, t) + n;
    return 0.175 * (1 - smooth(0.88, 1, t));
  }, shoreColor(C(color), WL));
  const shape = new THREE.Shape();
  for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, r = R * 0.78 * sh(a); if (i) shape.lineTo(Math.cos(a) * r, -Math.sin(a) * r); else shape.moveTo(Math.cos(a) * r, -Math.sin(a) * r); }
  const wg = new THREE.ShapeGeometry(shape, 8); wg.rotateX(-Math.PI / 2);
  const water = mesh(wg, waterMat(color), 0, WL); water.castShadow = false;
  const g = grp(mesh(bed, vmat()), water), r = rng(13);
  // lá súng
  const lm = mat('#4f9e47', { side: THREE.DoubleSide });
  [[-0.6, 0.5, 0.2], [-0.35, 0.8, 0.15], [0.7, -0.4, 0.18]].forEach(([x, z, s]) => { const l = mesh(new THREE.CircleGeometry(s, 14, 0.35, Math.PI * 2 - 0.35), lm, x, WL + 0.006, z); l.rotation.x = -Math.PI / 2; l.rotation.z = r() * 6; l.castShadow = false; g.add(l); });
  // lau sậy ở mép, đá
  const reed = grassClump('#5f8f3a', { n: 16, R: 0.22, H: 0.75, seed: 15, tip: '#c9b56b' }); reed.position.set(R * 0.83 * sh(0.6) * Math.cos(0.6), 0.1, -R * 0.83 * sh(0.6) * Math.sin(0.6)); g.add(reed);
  const reed2 = grassClump('#5f8f3a', { n: 12, R: 0.18, H: 0.6, seed: 16, tip: '#c9b56b' }); reed2.position.set(-R * 0.82 * sh(3.6) * Math.cos(3.6) * -1, 0.1, R * 0.82 * sh(3.6) * Math.sin(3.6)); g.add(reed2);
  [[2.4, 0.2], [4.6, 0.16]].forEach(([a, s], i) => { const b = blob(s, '#94a3b8', { seed: 30 + i, amp: 0.3, detail: 0, light: 0.1 }); const rr = R * 0.86 * sh(a); b.position.set(Math.cos(a) * rr, 0.14, -Math.sin(a) * rr); g.add(b); });
  return g;
}

export function river(color: string) {
  const WL = 0.11, N = 70, M = 14;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.2, 0, -1), new THREE.Vector3(-1.2, 0, 0.7), new THREE.Vector3(1, 0, -0.45), new THREE.Vector3(3.2, 0, 0.8)]);
  const pts = curve.getSpacedPoints(N), tan = pts.map((_, i) => curve.getTangentAt(i / N));
  const width = (s: number) => 1.0 * (1 + 0.15 * Math.sin(s * 9 + 1));
  const pos: number[] = [], ts: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N, w = width(s), nx = -tan[i].z, nz = tan[i].x, end = smooth(0, 0.05, s) * smooth(0, 0.05, 1 - s);
    for (let j = 0; j <= M; j++) {
      const u = (j / M) * 2 - 1, au = Math.abs(u), x = pts[i].x + nx * u * w, z = pts[i].z + nz * u * w;
      const nn = (noise(x * 3, z * 3) - 0.5) * 0.02;
      let y = au < 0.5 ? 0.015 + 0.05 * (au / 0.5) ** 2 : au < 0.78 ? 0.065 + 0.1 * smooth(0.5, 0.78, au) : 0.165 * (1 - smooth(0.78, 1, au));
      y = Math.max(0, (y + nn) * end);
      pos.push(x, y, z); ts.push(au > 0.92 ? 1 : 0.5);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + 1, c = a + M + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const bed = new THREE.BufferGeometry(); bed.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bed.setIndex(idx);
  const sc = shoreColor(C(color), WL); setColors(bed, (x, y, z, i) => sc(x, y, z, ts[i])); bed.computeVertexNormals();
  // mặt nước: dải giữa, hơi hẹp hơn chỗ bờ cát
  const wp: number[] = [], wi: number[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N, w = width(s) * 0.56, nx = -tan[i].z, nz = tan[i].x;
    wp.push(pts[i].x - nx * w, WL, pts[i].z - nz * w, pts[i].x + nx * w, WL, pts[i].z + nz * w);
    if (i < N) { const a = i * 2; wi.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(wi); wg.computeVertexNormals();
  const wm = waterMat(color); wm.side = THREE.DoubleSide;
  const water = mesh(wg, wm); water.castShadow = false;
  const g = grp(mesh(bed, vmat()), water);
  [[0.25, 1, 0.16], [0.62, -1, 0.2], [0.85, 1, 0.13]].forEach(([s, side, r], i) => {
    const k = Math.round(s * N), w = width(s) * 0.85, b = blob(r, '#94a3b8', { seed: 40 + i, amp: 0.3, detail: 0, light: 0.1 });
    b.position.set(pts[k].x - tan[k].z * w * side, 0.13, pts[k].z + tan[k].x * w * side); g.add(b);
  });
  return g;
}

/** cây tách bộ phận (bài “Các bộ phận của cây”): trả về từng phần để tách rời */
export function plantParts(color: string) {
  const rootM = mat('#c79a5a', { roughness: 1 });
  const root = new THREE.Group(), r = rng(21);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + r() * 0.4, d = 0.35 + r() * 0.35, dep = 0.45 + r() * 0.35;
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * d * 0.4, -dep * 0.45, Math.sin(a) * d * 0.4), new THREE.Vector3(Math.cos(a) * d, -dep, Math.sin(a) * d)]);
    root.add(mesh(new THREE.TubeGeometry(c, 8, 0.045 - i * 0.002, 5), rootM));
  }
  root.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), rootM, 0, -0.45, 0));
  root.position.y = 0.6;
  const stem = mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 8), mat(color, { roughness: 0.8 }), 0, 1.7, 0);
  const leafG = new THREE.Group();
  [[1.3, 1.5, 0.8], [1.7, -1.6, 0.75], [2.1, 1.0, 0.7], [2.4, -1.1, 0.6]].forEach(([y, a, s]) => {
    const l = mesh(leafGeo(1.05 * s, 0.4 * s, 0.3), leafMat('#2e8b3e'), 0, y, 0); l.rotation.order = 'YXZ'; l.rotation.y = a; l.rotation.x = 0.85; leafG.add(l);
  });
  const flower = flowerHead('#ec4899', 0.3); flower.position.y = 2.82;
  const fruit = mesh(new THREE.SphereGeometry(0.22, 14, 12), mat('#ef4444', { flatShading: false, roughness: 0.4 }), 0.45, 2.45, 0.35);
  fruit.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 4), mat('#5b3a1e'), 0, 0.24, 0));
  const soilGeo = radial(1.1, 5, 24, () => 1, (x, z, t) => (0.2 - 0.04 * t * t + (noise(x * 4, z * 4) - 0.5) * 0.03) * (1 - smooth(0.88, 1, t)), (x, y, z) => C('#8a5a3b').lerp(C('#5e3b24'), noise(x * 5, z * 5)));
  const soil = mesh(soilGeo, vmat());
  return { soil, root, stem, leafG, flower, fruit };
}

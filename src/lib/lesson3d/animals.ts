// Con vật dựng bằng code, tả theo hình dáng thật (đầu, mõm, mắt có tròng, tai, chân có khớp, đuôi, cánh…).
// Tất cả quay mặt về +Z (giống mô hình tải từ file), chân chạm y = 0.
// userData.walker: đi / quay quanh tâm thì mặt hướng theo đường đi; userData.flap: hai cánh vỗ (bướm).
import * as THREE from 'three';

const mat = (c: THREE.ColorRepresentation, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...o });
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const SPH = new THREE.SphereGeometry(1, 20, 14);
function m(g: THREE.BufferGeometry, mt: THREE.Material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, mt); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
/** khối bầu dục */
function ell(mt: THREE.Material, rx: number, ry: number, rz: number, x = 0, y = 0, z = 0, rot: [number, number, number] = [0, 0, 0]) {
  const o = m(SPH, mt, x, y, z); o.scale.set(rx, ry, rz); o.rotation.set(...rot); return o;
}
/** đoạn thon nối hai điểm (chân, cổ, râu) */
function seg(mt: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, r0: number, r1 = r0, sides = 10) {
  const d = b.clone().sub(a), o = m(new THREE.CylinderGeometry(r1, r0, d.length(), sides), mt);
  o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return o;
}
/** ống cong qua nhiều điểm (đuôi, cổ, thân sâu) */
function tube(mt: THREE.Material, pts: THREE.Vector3[], r: number, taper = 1) {
  const c = new THREE.CatmullRomCurve3(pts), n = 24, g = new THREE.TubeGeometry(c, n, r, 10);
  if (taper !== 1) { const p = g.attributes.position, tmp = new THREE.Vector3(); for (let i = 0; i <= n; i++) { const k = 1 + (taper - 1) * (i / n), cen = c.getPointAt(i / n); for (let j = 0; j <= 10; j++) { const id = i * 11 + j; tmp.fromBufferAttribute(p, id).sub(cen).multiplyScalar(k).add(cen); p.setXYZ(id, tmp.x, tmp.y, tmp.z); } } g.computeVertexNormals(); }
  return m(g, mt);
}
/** mắt: tròng trắng / màu + con ngươi + đốm sáng, nhìn theo hướng dir */
function eye(r: number, pos: THREE.Vector3, dir: THREE.Vector3, o: { iris?: string; slit?: 'v' | 'h'; white?: boolean } = {}) {
  const g = new THREE.Group(); g.position.copy(pos); g.quaternion.setFromUnitVectors(V(0, 0, 1), dir.clone().normalize());
  g.add(ell(mat(o.iris ?? (o.white === false ? '#111827' : '#ffffff'), { roughness: 0.3 }), r, r, r));
  const pu = o.slit === 'v' ? [r * 0.18, r * 0.62] : o.slit === 'h' ? [r * 0.6, r * 0.25] : [r * 0.55, r * 0.55];
  if (o.white !== false) g.add(ell(mat('#111827', { roughness: 0.2 }), pu[0], pu[1], r * 0.3, 0, 0, r * 0.82));
  const hl = ell(new THREE.MeshBasicMaterial({ color: '#ffffff' }), r * 0.18, r * 0.18, r * 0.1, r * 0.3, r * 0.32, r * 0.95); hl.castShadow = false; g.add(hl);
  return g;
}
/** cặp đối xứng trái – phải qua mặt x = 0 */
function pair<T>(make: (s: 1 | -1) => T): T[] { return [make(1), make(-1)]; }
function done(g: THREE.Group, walker = true) { g.userData.walker = walker; return g; }
const lighter = (c: string, k = 0.45) => new THREE.Color(c).lerp(new THREE.Color('#ffffff'), k);
const darker = (c: string, k = 0.7) => new THREE.Color(c).multiplyScalar(k);
/** lông vũ / cánh dẹt hình giọt nước */
function feather(mt: THREE.Material, len: number, wid: number) {
  const s = new THREE.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(wid, len * 0.45, 0, len); s.quadraticCurveTo(-wid, len * 0.45, 0, 0);
  return m(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1, curveSegments: 8 }), mt);
}

// ---------- gia cầm, chim ----------
function webFoot(c: string, x: number, z: number, s = 1) {
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(-0.09 * s, 0.14 * s); sh.quadraticCurveTo(0, 0.17 * s, 0.09 * s, 0.14 * s); sh.lineTo(0, 0);
  const f = m(new THREE.ShapeGeometry(sh), mat(c, { side: THREE.DoubleSide }), x, 0.012, z); f.rotation.x = -Math.PI / 2; f.scale.y = -1; return f;
}
function toes(mt: THREE.Material, x: number, z: number, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0.015, z);
  [-0.5, 0, 0.5].forEach((a) => g.add(seg(mt, V(0, 0, 0), V(Math.sin(a) * 0.13 * s, 0, Math.cos(a) * 0.13 * s), 0.014 * s)));
  g.add(seg(mt, V(0, 0, 0), V(0, 0, -0.07 * s), 0.012 * s)); return g;
}

export function duck(color: string) {
  const body = mat(color), wing = mat(darker(color, 0.88)), bill = mat('#f97316', { roughness: 0.5 });
  const g = new THREE.Group();
  g.add(ell(body, 0.32, 0.27, 0.5, 0, 0.47, -0.02, [-0.12, 0, 0]));
  g.add(ell(body, 0.2, 0.16, 0.22, 0, 0.6, -0.42, [0.6, 0, 0])); // đuôi vểnh
  g.add(tube(body, [V(0, 0.6, 0.28), V(0, 0.82, 0.33), V(0, 0.98, 0.32)], 0.12, 0.85));
  g.add(ell(body, 0.19, 0.18, 0.2, 0, 1.05, 0.34));
  g.add(ell(bill, 0.1, 0.035, 0.15, 0, 1.0, 0.53), ell(bill, 0.085, 0.025, 0.13, 0, 0.965, 0.51));
  pair((s) => eye(0.035, V(0.14 * s, 1.1, 0.42), V(s, 0.1, 0.55), { white: false })).forEach((e) => g.add(e));
  pair((s) => ell(wing, 0.07, 0.17, 0.36, 0.28 * s, 0.53, -0.06, [-0.15, 0, 0.18 * s])).forEach((w) => g.add(w));
  pair((s) => seg(bill, V(0.12 * s, 0.26, 0), V(0.12 * s, 0.02, 0.04), 0.03, 0.025)).forEach((l) => g.add(l));
  pair((s) => webFoot('#f97316', 0.12 * s, 0.04)).forEach((f) => g.add(f));
  return done(g);
}

export function chicken(color: string) {
  const body = mat(color), red = mat('#dc2626', { roughness: 0.6 }), yel = mat('#f59e0b', { roughness: 0.5 }), tail = mat(darker(color, 0.9));
  const g = new THREE.Group();
  g.add(ell(body, 0.33, 0.35, 0.44, 0, 0.66, -0.04, [-0.25, 0, 0]));
  g.add(ell(body, 0.2, 0.28, 0.2, 0, 0.92, 0.26, [0.4, 0, 0])); // ngực – cổ
  g.add(ell(body, 0.16, 0.17, 0.17, 0, 1.17, 0.33));
  // đuôi xoè
  [-0.5, -0.2, 0.1, 0.4].forEach((a, i) => { const f = feather(tail, 0.48 - i * 0.03, 0.12); f.position.set(0, 0.8, -0.38); f.rotation.set(-0.5 + a * 0.4, 0, 0); f.rotateZ(a * 0.5); f.rotateX(-0.9); g.add(f); });
  // mào, yếm, mỏ
  [[0.02, 1.34, 0.3, 0.06], [0.0, 1.37, 0.37, 0.065], [0.0, 1.33, 0.43, 0.05]].forEach(([x, y, z, r]) => g.add(ell(red, r * 0.55, r, r, x, y, z)));
  pair((s) => ell(red, 0.03, 0.06, 0.04, 0.03 * s, 1.03, 0.46)).forEach((w) => g.add(w));
  const beak = m(new THREE.ConeGeometry(0.045, 0.13, 8), yel, 0, 1.13, 0.52); beak.rotation.x = Math.PI / 2 + 0.25; g.add(beak);
  pair((s) => eye(0.032, V(0.12 * s, 1.21, 0.42), V(s, 0.1, 0.6), { iris: '#f59e0b' })).forEach((e) => g.add(e));
  pair((s) => ell(tail, 0.07, 0.2, 0.3, 0.3 * s, 0.7, -0.05, [-0.3, 0, 0.12 * s])).forEach((w) => g.add(w));
  pair((s) => { const l = new THREE.Group(); l.add(ell(body, 0.09, 0.1, 0.09, 0.13 * s, 0.38, 0), seg(yel, V(0.13 * s, 0.32, 0), V(0.13 * s, 0.02, 0.03), 0.028, 0.022), toes(yel, 0.13 * s, 0.03)); return l; }).forEach((l) => g.add(l));
  return done(g);
}

export function bird(color: string) {
  const body = mat(color), belly = mat(lighter(color, 0.55)), wing = mat(darker(color, 0.7)), beakM = mat('#f59e0b', { roughness: 0.5 }), legM = mat('#a16207');
  const g = new THREE.Group();
  g.add(ell(body, 0.2, 0.19, 0.3, 0, 0.42, 0, [-0.35, 0, 0]));
  g.add(ell(belly, 0.17, 0.15, 0.22, 0, 0.38, 0.06, [-0.35, 0, 0]));
  g.add(ell(body, 0.15, 0.15, 0.15, 0, 0.66, 0.17));
  const beak = m(new THREE.ConeGeometry(0.035, 0.12, 8), beakM, 0, 0.65, 0.35); beak.rotation.x = Math.PI / 2; g.add(beak);
  pair((s) => eye(0.03, V(0.1 * s, 0.7, 0.26), V(s, 0.1, 0.7), { white: false })).forEach((e) => g.add(e));
  pair((s) => ell(wing, 0.05, 0.13, 0.28, 0.18 * s, 0.46, -0.06, [-0.4, 0, 0.1 * s])).forEach((w) => g.add(w));
  const t = feather(wing, 0.36, 0.09); t.position.set(0, 0.36, -0.22); t.rotation.x = -Math.PI / 2 - 0.55; g.add(t);
  pair((s) => seg(legM, V(0.07 * s, 0.26, 0.02), V(0.07 * s, 0.02, 0.04), 0.014)).forEach((l) => g.add(l));
  pair((s) => toes(legM, 0.07 * s, 0.04, 0.6)).forEach((l) => g.add(l));
  return done(g);
}

// ---------- thú bốn chân ----------
/** chân: đùi + cẳng + bàn (gập nhẹ như đang đứng) */
function leg(mt: THREE.Material, hip: THREE.Vector3, len: number, r: number, back = false, paw?: THREE.Material) {
  const g = new THREE.Group(), knee = hip.clone().add(V(0, -len * 0.5, back ? -len * 0.08 : len * 0.04)), foot = V(hip.x, r * 0.8, hip.z + (back ? 0.02 : 0.03));
  g.add(seg(mt, hip, knee, r * 1.25, r), seg(mt, knee, foot, r, r * 0.85), ell(mt, r * 1.15, r * 0.8, r * 1.5, foot.x, foot.y - r * 0.15, foot.z + r * 0.4));
  if (paw) g.add(ell(paw, r * 1.1, r * 0.4, r * 1.4, foot.x, r * 0.3, foot.z + r * 0.45));
  return g;
}

export function cat(color: string) {
  const fur = mat(color, { roughness: 0.9 }), light = mat(lighter(color, 0.7), { roughness: 0.9 }), dark = mat(darker(color, 0.62), { roughness: 0.9 }), pink = mat('#f9a8d4');
  const g = new THREE.Group();
  g.add(ell(fur, 0.24, 0.24, 0.5, 0, 0.56, -0.05));
  g.add(ell(light, 0.19, 0.17, 0.36, 0, 0.47, 0.02)); // bụng
  g.add(ell(fur, 0.21, 0.24, 0.22, 0, 0.66, 0.32, [0.3, 0, 0])); // ngực
  // sọc lưng
  [-0.3, -0.12, 0.06, 0.24].forEach((z) => g.add(ell(dark, 0.2, 0.05, 0.06, 0, 0.77 - Math.abs(z) * 0.08, z)));
  const head = new THREE.Group(); head.position.set(0, 0.94, 0.5); g.add(head);
  head.add(ell(fur, 0.24, 0.21, 0.21));
  head.add(ell(light, 0.12, 0.08, 0.09, 0, -0.07, 0.15)); // mõm
  pair((s) => ell(light, 0.065, 0.06, 0.07, 0.05 * s, -0.07, 0.17)).forEach((x) => head.add(x));
  head.add(ell(pink, 0.03, 0.022, 0.02, 0, -0.025, 0.215));
  pair((s) => { const e = m(new THREE.ConeGeometry(0.09, 0.2, 4), fur, 0.13 * s, 0.2, -0.02); e.rotation.set(-0.15, Math.PI / 4, 0.3 * -s); e.scale.z = 0.45; return e; }).forEach((x) => head.add(x));
  pair((s) => { const e = m(new THREE.ConeGeometry(0.055, 0.13, 4), pink, 0.13 * s, 0.19, 0.0); e.rotation.set(-0.15, Math.PI / 4, 0.3 * -s); e.scale.z = 0.3; return e; }).forEach((x) => head.add(x));
  pair((s) => eye(0.045, V(0.09 * s, 0.04, 0.165), V(0.35 * s, 0.05, 1), { iris: '#84cc16', slit: 'v' })).forEach((x) => head.add(x));
  const wh = mat('#f8fafc');
  pair((s) => [0.02, -0.02].map((dy) => seg(wh, V(0.06 * s, -0.06, 0.18), V(0.3 * s, -0.04 + dy * 2, 0.15), 0.004))).flat().forEach((x) => head.add(x));
  head.rotation.x = 0.08;
  [[0.12, 0.42, 0.33, false], [-0.12, 0.42, 0.33, false], [0.13, 0.5, -0.32, true], [-0.13, 0.5, -0.32, true]].forEach(([x, y, z, b]) => g.add(leg(fur, V(x as number, y as number, z as number), (y as number) - 0.05, 0.055, b as boolean, light)));
  g.add(tube(fur, [V(0, 0.6, -0.5), V(0, 0.55, -0.72), V(0, 0.8, -0.9), V(0, 1.1, -0.86), V(0, 1.2, -0.72)], 0.055, 0.7));
  return done(g);
}

export function rabbit(color: string) {
  const fur = mat(color, { roughness: 0.95 }), belly = mat(lighter(color, 0.6), { roughness: 0.95 }), pink = mat('#f9a8d4'), white = mat('#ffffff', { roughness: 1 });
  const g = new THREE.Group();
  g.add(ell(fur, 0.3, 0.32, 0.38, 0, 0.36, -0.12)); // mông tròn
  g.add(ell(fur, 0.22, 0.26, 0.24, 0, 0.5, 0.14, [0.35, 0, 0])); // ngực
  g.add(ell(belly, 0.16, 0.2, 0.12, 0, 0.42, 0.28));
  pair((s) => ell(fur, 0.1, 0.17, 0.27, 0.22 * s, 0.17, -0.12, [0.15, 0, 0])).forEach((x) => g.add(x)); // đùi sau
  pair((s) => ell(fur, 0.07, 0.04, 0.2, 0.2 * s, 0.035, 0.04)).forEach((x) => g.add(x)); // bàn chân sau dài
  pair((s) => seg(fur, V(0.1 * s, 0.4, 0.25), V(0.1 * s, 0.05, 0.3), 0.045, 0.04)).forEach((x) => g.add(x));
  pair((s) => ell(fur, 0.05, 0.035, 0.07, 0.1 * s, 0.03, 0.34)).forEach((x) => g.add(x));
  g.add(ell(white, 0.1, 0.1, 0.09, 0, 0.42, -0.5)); // đuôi bông
  const head = new THREE.Group(); head.position.set(0, 0.8, 0.32); head.rotation.x = 0.15; g.add(head);
  head.add(ell(fur, 0.19, 0.18, 0.2));
  pair((s) => ell(belly, 0.07, 0.06, 0.06, 0.045 * s, -0.07, 0.15)).forEach((x) => head.add(x));
  head.add(ell(pink, 0.025, 0.018, 0.015, 0, -0.035, 0.195));
  pair((s) => eye(0.05, V(0.12 * s, 0.03, 0.11), V(s, 0.1, 0.55), { white: false })).forEach((x) => head.add(x));
  pair((s) => { const e = new THREE.Group(); e.position.set(0.07 * s, 0.14, -0.04); e.rotation.set(-0.25, 0, -0.18 * s); e.add(ell(fur, 0.07, 0.3, 0.035, 0, 0.28, 0), ell(pink, 0.045, 0.24, 0.02, 0, 0.28, 0.02)); return e; }).forEach((x) => head.add(x));
  return done(g);
}

// ---------- lưỡng cư ----------
export function frog(color: string) {
  const skin = mat(color, { roughness: 0.45 }), belly = mat(lighter(color, 0.55).lerp(new THREE.Color('#fde68a'), 0.3), { roughness: 0.5 }), spot = mat(darker(color, 0.6), { roughness: 0.5 });
  const g = new THREE.Group();
  g.add(ell(skin, 0.36, 0.22, 0.42, 0, 0.3, 0, [-0.35, 0, 0]));
  g.add(ell(belly, 0.3, 0.16, 0.36, 0, 0.24, 0.04, [-0.35, 0, 0]));
  g.add(ell(skin, 0.3, 0.15, 0.24, 0, 0.42, 0.28, [-0.1, 0, 0])); // đầu rộng
  g.add(m(new THREE.TorusGeometry(0.255, 0.008, 6, 30, Math.PI), mat('#14532d'), 0, 0.39, 0.3).rotateX(Math.PI / 2 + 0.1)); // miệng
  [[0.15, 0.48, -0.05, 0.06], [-0.1, 0.5, 0.05, 0.05], [0.02, 0.44, -0.25, 0.045], [-0.2, 0.42, -0.18, 0.04]].forEach(([x, y, z, r]) => g.add(ell(spot, r, r * 0.35, r, x, y, z)));
  pair((s) => { const e = new THREE.Group(); e.add(ell(skin, 0.085, 0.085, 0.085, 0.15 * s, 0.53, 0.3)); e.add(eye(0.07, V(0.155 * s, 0.55, 0.33), V(0.6 * s, 0.4, 0.7), { iris: '#facc15', slit: 'h' })); return e; }).forEach((x) => g.add(x));
  // chân sau gập: đùi – cẳng – bàn chân màng
  pair((s) => {
    const l = new THREE.Group();
    l.add(ell(skin, 0.1, 0.09, 0.24, 0.3 * s, 0.2, -0.12, [0.2, 0.5 * s, 0]));
    l.add(seg(skin, V(0.42 * s, 0.13, 0.04), V(0.3 * s, 0.06, -0.22), 0.055, 0.04));
    l.add(ell(skin, 0.09, 0.02, 0.17, 0.36 * s, 0.02, -0.05, [0, -0.4 * s, 0]));
    return l;
  }).forEach((x) => g.add(x));
  pair((s) => { const l = new THREE.Group(); l.add(seg(skin, V(0.2 * s, 0.25, 0.28), V(0.25 * s, 0.03, 0.4), 0.04, 0.03), ell(skin, 0.06, 0.015, 0.06, 0.26 * s, 0.015, 0.44)); return l; }).forEach((x) => g.add(x));
  return done(g);
}

export function tadpole(color: string) {
  const skin = mat(color, { roughness: 0.4 }), fin = mat(lighter(color, 0.3), { roughness: 0.4, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  const g = new THREE.Group();
  g.add(ell(skin, 0.2, 0.17, 0.25, 0, 0, 0.05));
  // đuôi dẹt uốn sóng
  const s = new THREE.Shape(); s.moveTo(0, 0.1); s.quadraticCurveTo(-0.35, 0.16, -0.75, 0); s.quadraticCurveTo(-0.35, -0.16, 0, -0.1); s.lineTo(0, 0.1);
  const tg = new THREE.ShapeGeometry(s, 12), p = tg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 6) * 0.08 * -x); }
  tg.computeVertexNormals();
  const tail = m(tg, fin, 0, 0, -0.12); tail.rotation.y = -Math.PI / 2; g.add(tail);
  g.add(tube(skin, [V(0, 0, -0.1), V(0.02, 0, -0.3), V(-0.02, 0, -0.5), V(0, 0, -0.75)], 0.035, 0.2));
  pair((k) => eye(0.04, V(0.13 * k, 0.07, 0.2), V(k, 0.3, 0.6), { white: false })).forEach((x) => g.add(x));
  return done(g);
}

// ---------- côn trùng ----------
export function caterpillar(color: string) {
  const skin = mat(color, { roughness: 0.6 }), band = mat(darker(color, 0.55)), dot = mat('#fde047'), head = mat(darker(color, 0.75)), black = mat('#111827');
  const g = new THREE.Group(), N = 9;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), z = -0.75 + t * 1.4, y = 0.13 + Math.max(0, Math.sin(t * Math.PI * 1.1 - 0.2)) * 0.12, r = 0.12 + Math.sin(t * Math.PI) * 0.035;
    g.add(ell(i === N - 1 ? head : skin, r * 1.05, r, r * 0.95, 0, y, z));
    if (i < N - 1) { g.add(ell(band, r * 1.06, r * 1.01, r * 0.25, 0, y, z + r * 0.75)); pair((s) => ell(dot, 0.025, 0.025, 0.025, r * 0.75 * s, y + r * 0.5, z)).forEach((x) => g.add(x)); }
    if (i < N - 1 && i % 2 === 0) pair((s) => ell(head, 0.03, 0.05, 0.03, r * 0.6 * s, 0.03, z)).forEach((x) => g.add(x)); // chân
  }
  const hz = 0.65, hy = 0.13 + Math.max(0, Math.sin(Math.PI * 1.1 - 0.2)) * 0.12;
  pair((s) => eye(0.035, V(0.08 * s, hy + 0.04, hz + 0.1), V(0.6 * s, 0.2, 1), { white: false })).forEach((x) => g.add(x));
  pair((s) => seg(black, V(0.05 * s, hy + 0.1, hz + 0.02), V(0.1 * s, hy + 0.28, hz + 0.1), 0.012, 0.008)).forEach((x) => g.add(x));
  pair((s) => ell(black, 0.025, 0.025, 0.025, 0.1 * s, hy + 0.29, hz + 0.1)).forEach((x) => g.add(x));
  return done(g);
}

/** cánh bướm: cánh trước + cánh sau, viền tối, chấm trắng (nằm trên mặt XZ, hướng ra +X) */
function wingPair(color: string) {
  const base = mat(color, { side: THREE.DoubleSide, roughness: 0.6 }), edge = mat(darker(color, 0.3), { side: THREE.DoubleSide, roughness: 0.6 }), spot = mat('#ffffff', { side: THREE.DoubleSide });
  const shape = (pts: number[][]) => { const s = new THREE.Shape(); s.moveTo(0, 0); for (let i = 0; i < pts.length; i += 2) s.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); return s; };
  const fore = shape([[0.3, 0.45], [0.75, 0.42], [0.85, 0.2], [0.55, -0.02], [0.2, -0.05], [0, 0]]);
  const hind = shape([[0.35, -0.05], [0.55, -0.25], [0.55, -0.5], [0.3, -0.6], [0.1, -0.3], [0, 0]]);
  const g = new THREE.Group();
  [fore, hind].forEach((s, k) => {
    const back = m(new THREE.ShapeGeometry(s, 16), edge); back.scale.setScalar(1.0);
    const front = m(new THREE.ShapeGeometry(s, 16), base, 0.03, 0.004, 0); front.scale.setScalar(0.86); front.position.set(0.025, k ? -0.035 : 0.03, -0.006);
    const w = new THREE.Group(); w.add(back, front); w.rotation.x = Math.PI / 2; g.add(w);
  });
  [[0.62, 0.28, 0.035], [0.72, 0.18, 0.025], [0.45, -0.38, 0.03]].forEach(([x, z, r]) => { const c = m(new THREE.CircleGeometry(r, 10), spot, x, 0.012, z); c.rotation.x = -Math.PI / 2; g.add(c); });
  return g;
}
export function butterfly(color: string) {
  const black = mat('#1f2937', { roughness: 0.6 });
  const g = new THREE.Group();
  g.add(ell(black, 0.045, 0.045, 0.26, 0, 0, 0.0), ell(black, 0.055, 0.055, 0.1, 0, 0, 0.25), ell(black, 0.05, 0.05, 0.05, 0, 0.01, 0.38));
  pair((s) => seg(black, V(0.02 * s, 0.03, 0.4), V(0.15 * s, 0.16, 0.7), 0.007)).forEach((x) => g.add(x));
  pair((s) => ell(black, 0.022, 0.022, 0.035, 0.15 * s, 0.16, 0.71)).forEach((x) => g.add(x));
  const L = new THREE.Group(), R = new THREE.Group();
  const wl = wingPair(color); wl.position.z = 0.14; L.add(wl);
  const wr = wingPair(color); wr.scale.x = -1; wr.position.z = 0.14; R.add(wr);
  g.add(L, R); g.userData.flap = [L, R];
  return done(g);
}

export function grasshopper(color: string) {
  const skin = mat(color, { roughness: 0.5 }), dk = mat(darker(color, 0.65), { roughness: 0.5 }), wing = mat(darker(color, 0.8), { roughness: 0.5 }), eyeM = '#7c2d12';
  const g = new THREE.Group();
  g.add(ell(skin, 0.11, 0.12, 0.42, 0, 0.3, -0.25, [0.12, 0, 0])); // bụng dài
  g.add(ell(skin, 0.13, 0.15, 0.17, 0, 0.34, 0.2)); // ngực
  g.add(ell(skin, 0.1, 0.14, 0.12, 0, 0.36, 0.38, [0.5, 0, 0])); // đầu
  [-0.45, -0.32, -0.19, -0.06].forEach((z) => g.add(ell(dk, 0.112, 0.122, 0.015, 0, 0.3 - z * 0.05, z)));
  pair((s) => ell(wing, 0.06, 0.03, 0.45, 0.06 * s, 0.43, -0.18, [0.1, 0, 0.25 * s])).forEach((x) => g.add(x)); // cánh xếp
  pair((s) => eye(0.05, V(0.09 * s, 0.42, 0.42), V(s, 0.2, 0.4), { iris: eyeM, white: false })).forEach((x) => g.add(x));
  pair((s) => tube(dk, [V(0.04 * s, 0.46, 0.46), V(0.1 * s, 0.62, 0.6), V(0.16 * s, 0.68, 0.85)], 0.008)).forEach((x) => g.add(x));
  // chân sau nhảy: đùi to dựng lên, cẳng dài xuống
  pair((s) => { const l = new THREE.Group(); l.add(ell(skin, 0.05, 0.08, 0.3, 0.14 * s, 0.38, -0.02, [-0.55, 0, 0])); l.add(seg(dk, V(0.15 * s, 0.53, -0.27), V(0.17 * s, 0.03, -0.38), 0.02, 0.015)); return l; }).forEach((x) => g.add(x));
  pair((s) => [[0.3, 0.12], [0.16, 0.06]].map(([z, dz]) => seg(dk, V(0.1 * s, 0.26, z), V(0.2 * s, 0.02, z + dz), 0.015, 0.01))).flat().forEach((x) => g.add(x));
  return done(g);
}

export function egg(color: string) {
  const pts = Array.from({ length: 17 }, (_, i) => { const t = (i / 16) * Math.PI; const r = Math.sin(t) * (1 - 0.18 * Math.cos(t)) * 0.3; return new THREE.Vector2(Math.max(0.0001, r), (1 - Math.cos(t)) * 0.38); });
  const g = new THREE.Group(); g.add(m(new THREE.LatheGeometry(pts, 24), mat(color, { roughness: 0.55 }), 0, 0, 0)); return g;
}

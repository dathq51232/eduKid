// Người và các cơ quan trong cơ thể, dựng bằng code theo tỉ lệ / hình dáng thật (mặt cong mượt, không phải khối vuông):
// người lớn, học sinh (đầu, mặt, tóc, cổ, thân, tay chân có khớp, giày); phổi (2 lá, khí quản có vòng sụn, phế quản);
// tim (tâm thất thon về mỏm, tâm nhĩ, quai động mạch chủ, động mạch phổi, tĩnh mạch chủ); dạ dày + ruột non + ruột già;
// não (2 bán cầu có nếp cuộn, tiểu não, thân não); xương đùi. Mặt quay về +Z, chân / đáy chạm y = 0.
// userData.parts: các bộ phận tách rời được (nút "Tách bộ phận"), userData.walker: người đi theo hướng di chuyển.
import * as THREE from 'three';

type Part = { obj: THREE.Object3D; base: THREE.Vector3; dir: THREE.Vector3 };
const mat = (c: THREE.ColorRepresentation, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const SPH = new THREE.SphereGeometry(1, 24, 16);
function m(g: THREE.BufferGeometry, mt: THREE.Material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, mt); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function ell(mt: THREE.Material, rx: number, ry: number, rz: number, x = 0, y = 0, z = 0, rot: [number, number, number] = [0, 0, 0]) {
  const o = m(SPH, mt, x, y, z); o.scale.set(rx, ry, rz); o.rotation.set(...rot); return o;
}
/** đoạn thon nối hai điểm (tay, chân, cổ) */
function seg(mt: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, r0: number, r1 = r0, sides = 14) {
  const d = b.clone().sub(a), o = m(new THREE.CylinderGeometry(r1, r0, d.length(), sides), mt);
  o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return o;
}
/** ống cong có bán kính thay đổi theo chiều dài: r(t), t = 0..1 (dạ dày, ruột, mạch máu) */
function vtube(mt: THREE.Material, pts: THREE.Vector3[], r: (t: number) => number, seg = 64, radial = 14) {
  const c = new THREE.CatmullRomCurve3(pts), g = new THREE.TubeGeometry(c, seg, 1, radial);
  const p = g.attributes.position, tmp = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg, cen = c.getPointAt(t), k = r(t);
    for (let j = 0; j <= radial; j++) { const id = i * (radial + 1) + j; tmp.fromBufferAttribute(p, id).sub(cen).multiplyScalar(k).add(cen); p.setXYZ(id, tmp.x, tmp.y, tmp.z); }
  }
  g.computeVertexNormals(); return m(g, mt);
}
/** khối cầu nắn hình: f nhận toạ độ trên mặt cầu đơn vị, trả toạ độ mới */
function shaped(mt: THREE.Material, f: (v: THREE.Vector3) => THREE.Vector3, w = 40, h = 28) {
  const g = new THREE.SphereGeometry(1, w, h), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const o = f(v.clone()); p.setXYZ(i, o.x, o.y, o.z); }
  g.computeVertexNormals(); return m(g, mt);
}
function parts(g: THREE.Group, list: [THREE.Object3D, number, number, number][]) {
  g.userData.parts = list.map(([obj, x, y, z]) => ({ obj, base: obj.position.clone(), dir: V(x, y, z) })) as Part[];
  return g;
}
const grp = (...a: THREE.Object3D[]) => { const g = new THREE.Group(); a.forEach((o) => g.add(o)); return g; };

// ============================================================ NGƯỜI
type PersonOpts = { shirt: string; pants: string; skin?: string; hair?: string; shoes?: string; kid?: boolean; longHair?: boolean };

/** Người đứng thẳng, tỉ lệ thật: người lớn cao ~7,5 đầu, trẻ em ~6 đầu (đầu to hơn, chân ngắn hơn, quần đùi). */
export function person(o: PersonOpts) {
  const kid = !!o.kid;
  const skin = mat(o.skin ?? '#f1c27d', { roughness: 0.65 }), shirt = mat(o.shirt), pants = mat(o.pants), hair = mat(o.hair ?? '#2b1d14', { roughness: 0.9 });
  const shoe = mat(o.shoes ?? '#1f2937', { roughness: 0.5 });
  const g = new THREE.Group();
  // chân (trẻ em: quần đùi, lộ cẳng chân + tất trắng)
  for (const s of [1, -1]) {
    const x = 0.1 * s;
    g.add(seg(pants, V(x, 1.12, 0), V(x * 0.95, 0.62, 0.01), 0.088, 0.072)); // đùi
    g.add(ell(kid ? skin : pants, 0.07, 0.07, 0.07, x * 0.95, 0.62, 0.01)); // gối
    if (kid) {
      g.add(seg(pants, V(x, 1.12, 0), V(x * 0.97, 0.82, 0.005), 0.095, 0.09)); // ống quần đùi
      g.add(seg(skin, V(x * 0.95, 0.62, 0.01), V(x * 0.95, 0.16, -0.01), 0.062, 0.045));
      g.add(seg(mat('#f8fafc'), V(x * 0.95, 0.2, -0.01), V(x * 0.95, 0.07, -0.01), 0.05, 0.05)); // tất
    } else g.add(seg(pants, V(x * 0.95, 0.62, 0.01), V(x * 0.95, 0.1, -0.01), 0.07, 0.056));
    g.add(ell(shoe, 0.068, 0.055, 0.14, x * 0.95, 0.055, 0.045)); // giày
  }
  // hông + thân (áo) dạng tiện tròn: hông -> eo -> ngực -> vai, dẹt theo chiều trước-sau
  g.add(ell(pants, 0.205, 0.11, 0.135, 0, 1.13, 0));
  const prof = [[0.0, 1.1], [0.2, 1.13], [0.205, 1.24], [0.185, 1.42], [0.215, 1.62], [0.235, 1.78], [0.21, 1.87], [0.12, 1.93], [0.0, 1.94]].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = m(new THREE.LatheGeometry(prof, 28), shirt); torso.scale.z = 0.62; g.add(torso);
  // cổ áo
  const collar = m(new THREE.TorusGeometry(0.075, 0.018, 8, 20), shirt, 0, 1.93, 0); collar.rotation.x = Math.PI / 2; g.add(collar);
  // tay: vai -> khuỷu -> cổ tay, buông tự nhiên hơi chếch ra ngoài; tay áo ngắn ở trẻ em
  for (const s of [1, -1]) {
    const sh = V(0.235 * s, 1.81, 0), el = V(0.3 * s, 1.47, -0.02), wr = V(0.32 * s, 1.13, 0.03);
    g.add(ell(shirt, 0.07, 0.06, 0.065, sh.x, sh.y, sh.z));
    if (kid) { g.add(seg(shirt, sh, sh.clone().lerp(el, 0.5), 0.07, 0.064)); g.add(seg(skin, sh.clone().lerp(el, 0.45), el, 0.05, 0.045)); }
    else g.add(seg(shirt, sh, el, 0.066, 0.052));
    g.add(ell(kid ? skin : shirt, 0.048, 0.048, 0.048, el.x, el.y, el.z));
    g.add(seg(skin, el, wr, 0.045, 0.036));
    g.add(ell(skin, 0.035, 0.065, 0.028, wr.x + 0.004 * s, wr.y - 0.06, wr.z + 0.005)); // bàn tay
    g.add(ell(skin, 0.014, 0.03, 0.014, wr.x - 0.012 * s, wr.y - 0.03, wr.z + 0.03, [0.4, 0, 0])); // ngón cái
  }
  // cổ
  g.add(seg(skin, V(0, 1.88, 0), V(0, 2.0, 0.005), 0.052, 0.048));
  // đầu: dựng quanh gốc cổ, trẻ em đầu to hơn
  const head = new THREE.Group(); head.position.set(0, 1.98, 0);
  head.add(ell(skin, 0.125, 0.155, 0.14, 0, 0.16, 0.005)); // sọ
  head.add(ell(skin, 0.098, 0.07, 0.105, 0, 0.085, 0.012)); // hàm, cằm
  for (const s of [1, -1]) {
    head.add(ell(skin, 0.022, 0.038, 0.018, 0.126 * s, 0.145, -0.005)); // tai
    head.add(ell(mat('#ffffff', { roughness: 0.3 }), 0.021, 0.015, 0.01, 0.046 * s, 0.168, 0.137)); // lòng trắng
    head.add(ell(mat('#3b2a1a', { roughness: 0.2 }), 0.011, 0.012, 0.005, 0.046 * s, 0.168, 0.146)); // con ngươi
    head.add(ell(hair, 0.024, 0.0055, 0.006, 0.047 * s, 0.198, 0.14, [0, 0, -0.12 * s])); // lông mày
    head.add(ell(mat('#f2a7a0', { transparent: true, opacity: 0.55 }), 0.022, 0.013, 0.005, 0.068 * s, 0.12, 0.128)); // má hồng
  }
  head.add(ell(skin, 0.012, 0.022, 0.014, 0, 0.135, 0.146, [-0.3, 0, 0])); // mũi
  const mouth = m(new THREE.TorusGeometry(0.02, 0.0045, 6, 14, Math.PI), mat('#a3473f'), 0, 0.1, 0.132); mouth.rotation.z = Math.PI; head.add(mouth);
  // tóc: chỏm phủ đỉnh + gáy, chừa trán
  const cap = m(new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hair, 0, 0.17, -0.012); cap.scale.set(0.135, 0.17, 0.152); cap.rotation.x = -0.55; head.add(cap);
  head.add(ell(hair, 0.126, 0.12, 0.08, 0, 0.15, -0.065)); // gáy
  if (o.longHair) { head.add(ell(hair, 0.13, 0.2, 0.08, 0, 0.02, -0.07)); for (const s of [1, -1]) head.add(ell(hair, 0.035, 0.13, 0.05, 0.11 * s, 0.07, -0.01)); }
  if (kid) head.scale.setScalar(1.22);
  g.add(head);
  if (kid) g.scale.setScalar(0.72);
  g.userData.walker = true;
  return g;
}

// ============================================================ PHỔI
/** Hai lá phổi (phải 3 thuỳ to hơn, trái 2 thuỳ có khuyết tim), khí quản có vòng sụn, hai phế quản. Cao ~2,4. */
export function lungs(color: string) {
  const tissue = mat(color, { roughness: 0.55 }), cart = mat('#efe7dc', { roughness: 0.6 }), groove = mat(new THREE.Color(color).multiplyScalar(0.72), { roughness: 0.6 });
  // side: 1 = lá phổi trái của người (bên phải người xem), -1 = lá phải
  const lobe = (side: 1 | -1) => shaped(tissue, (v) => {
    const t = (v.y + 1) / 2; // 0 đáy -> 1 đỉnh
    let x = v.x * (0.45 + 0.55 * Math.sin(Math.min(1, (1 - t) * 1.25 + 0.15) * Math.PI * 0.5)); // đỉnh nhọn, đáy rộng
    if (x * side < 0) x *= 0.3; // mặt trong phẳng (sát tim)
    let y = v.y; if (y < -0.55) y = -0.55 + (y + 0.55) * 0.35; // đáy lõm nhẹ theo cơ hoành
    let z = v.z * (0.75 + 0.25 * (1 - t));
    if (side === 1 && x * side < 0.25 && t < 0.5 && z > 0) z *= 0.45; // khuyết tim ở lá trái
    return V(x * (side === -1 ? 0.5 : 0.45) + 0.2 * side, y * 0.95 + 1.0, z * 0.36);
  });
  const L = lobe(1), R = lobe(-1);
  // rãnh liên thuỳ (vết lõm) trên mặt trước
  const fiss = (side: 1 | -1, y0: number, y1: number) => vtube(groove, [V(0.18 * side, y0, 0.27), V(0.42 * side, (y0 + y1) / 2, 0.28), V(0.66 * side, y1, 0.14)], () => 0.012, 20, 6);
  L.add(fiss(1, 1.35, 0.55)); R.add(fiss(-1, 1.3, 0.62), fiss(-1, 1.05, 1.0));
  // khí quản + vòng sụn + phế quản chia đôi
  const tr = new THREE.Group();
  tr.add(seg(cart, V(0, 1.55, 0), V(0, 2.45, 0), 0.085, 0.085));
  for (let i = 0; i < 9; i++) { const r = m(new THREE.TorusGeometry(0.088, 0.014, 6, 18), cart, 0, 1.62 + i * 0.095, 0); r.rotation.x = Math.PI / 2; tr.add(r); }
  tr.add(vtube(cart, [V(0, 1.58, 0), V(0.14, 1.48, 0), V(0.26, 1.42, -0.02)], (t) => 0.07 - t * 0.015, 20, 10));
  tr.add(vtube(cart, [V(0, 1.58, 0), V(-0.14, 1.5, 0), V(-0.25, 1.44, -0.02)], (t) => 0.075 - t * 0.015, 20, 10));
  const g = grp(L, R, tr);
  return parts(g, [[L, 0.7, 0, 0], [R, -0.7, 0, 0], [tr, 0, 0.7, 0]]);
}

// ============================================================ TIM
/** Tim người: khối tâm thất thon về mỏm (chếch trái), tâm nhĩ, quai động mạch chủ (đỏ), thân động mạch phổi và tĩnh mạch chủ (xanh). Cao ~1,8. */
export function heart(color: string) {
  const muscle = mat(color, { roughness: 0.45 }), art = mat('#d93a3a', { roughness: 0.4 }), vein = mat('#4f6fcf', { roughness: 0.45 });
  const fat = mat('#f3d27a', { roughness: 0.6 }), cor = mat('#8f1d1d', { roughness: 0.5 });
  const body = new THREE.Group(); body.position.set(0, 0.75, 0); body.rotation.z = 0.42; // mỏm tim chĩa xuống - sang trái người (phải người xem)
  body.add(shaped(muscle, (v) => {
    const t = (v.y + 1) / 2; const k = 0.35 + 0.65 * Math.pow(t, 0.55); // thon dần về mỏm
    return V(v.x * 0.46 * k, v.y * 0.6, v.z * 0.38 * k + (v.x > 0 ? 0 : -0.02));
  }));
  body.add(ell(muscle, 0.22, 0.2, 0.2, -0.22, 0.42, 0.02)); // tâm nhĩ phải
  body.add(ell(muscle, 0.16, 0.12, 0.13, 0.25, 0.47, 0.06)); // tiểu nhĩ trái
  // rãnh vành + động mạch vành, mỡ quanh rãnh
  body.add(vtube(fat, [V(-0.36, 0.25, 0.22), V(-0.1, 0.3, 0.34), V(0.2, 0.32, 0.3), V(0.42, 0.22, 0.12)], () => 0.022, 30, 8));
  body.add(vtube(cor, [V(0.02, 0.3, 0.37), V(0.06, 0.0, 0.38), V(0.05, -0.3, 0.3), V(0.0, -0.5, 0.16)], (t) => 0.024 - t * 0.012, 30, 8)); // ĐM liên thất trước
  body.add(vtube(cor, [V(-0.2, 0.25, 0.32), V(-0.3, 0.0, 0.28), V(-0.32, -0.25, 0.15)], (t) => 0.02 - t * 0.01, 20, 8));
  // quai động mạch chủ: đi lên, uốn sang trái người và ra sau, rồi đi xuống
  const aorta = vtube(art, [V(0.0, 1.05, 0.05), V(-0.02, 1.45, 0.06), V(0.08, 1.68, -0.02), V(0.28, 1.62, -0.14), V(0.34, 1.35, -0.2), V(0.33, 0.7, -0.22)], () => 0.11, 60, 16);
  // ba nhánh trên quai
  const br = [V(0.0, 1.66, 0.0), V(0.12, 1.7, -0.06), V(0.24, 1.66, -0.12)].map((p, i) => seg(art, p, p.clone().add(V(-0.04 + i * 0.03, 0.32 - i * 0.04, 0)), 0.045, 0.038));
  // thân động mạch phổi: ra phía trước, đi lên rồi chia đôi
  const pulm = grp(
    vtube(vein, [V(0.12, 1.0, 0.2), V(0.16, 1.25, 0.18), V(0.14, 1.42, 0.05)], () => 0.1, 30, 14),
    vtube(vein, [V(0.14, 1.42, 0.05), V(0.38, 1.46, -0.02), V(0.58, 1.42, -0.06)], () => 0.07, 20, 12),
    vtube(vein, [V(0.14, 1.42, 0.05), V(-0.12, 1.48, -0.08), V(-0.4, 1.42, -0.1)], () => 0.07, 20, 12),
  );
  // tĩnh mạch chủ trên / dưới đổ vào tâm nhĩ phải
  const vc = grp(seg(vein, V(-0.3, 1.2, -0.08), V(-0.29, 1.75, -0.08), 0.085, 0.08), seg(vein, V(-0.2, 0.5, -0.24), V(-0.2, 0.0, -0.24), 0.09, 0.09));
  const g = grp(body, aorta, ...br, pulm, vc);
  return parts(g, [[aorta, 0.3, 0.6, 0], [pulm, 0.4, 0.3, 0.3], [vc, -0.5, 0.2, 0]]);
}

// ============================================================ TIÊU HOÁ
/** Thực quản, dạ dày hình chữ J, tá tràng, ruột non cuộn, khung ruột già có ngấn. Cao ~2,9. */
export function digestive(color: string) {
  const stom = mat(color, { roughness: 0.5 }), small = mat('#f6b3a3', { roughness: 0.55 }), large = mat('#e2a07a', { roughness: 0.6 }), eso = mat('#f3c2c2', { roughness: 0.55 });
  const es = vtube(eso, [V(-0.08, 2.9, -0.05), V(-0.06, 2.5, -0.02), V(0.0, 2.15, 0.02)], () => 0.06, 24, 12);
  // dạ dày: đáy phình phía trên trái người, thân to, hang vị thon về môn vị bên phải người
  const st = vtube(stom, [V(0.0, 2.15, 0.02), V(0.22, 2.22, 0.02), V(0.42, 2.08, 0.03), V(0.46, 1.8, 0.05), V(0.32, 1.56, 0.06), V(0.08, 1.48, 0.06), V(-0.14, 1.55, 0.05)],
    (t) => 0.06 + Math.sin(Math.min(1, t * 1.25) * Math.PI) * 0.2 + (t < 0.2 ? t * 0.3 : 0), 64, 18);
  const duo = vtube(small, [V(-0.14, 1.55, 0.05), V(-0.32, 1.5, 0.02), V(-0.38, 1.3, 0.0), V(-0.24, 1.16, 0.0), V(-0.05, 1.18, 0.0)], () => 0.055, 30, 10);
  // ruột già: manh tràng (dưới phải người) -> đi lên -> ngang -> đi xuống -> xích-ma -> trực tràng; có ngấn
  const colonPts = [V(-0.58, 0.32, 0.02), V(-0.62, 0.7, 0.02), V(-0.6, 1.08, 0.04), V(-0.45, 1.2, 0.1), V(0.0, 1.12, 0.16), V(0.45, 1.2, 0.1), V(0.62, 1.08, 0.04), V(0.62, 0.65, 0.02), V(0.55, 0.32, 0.04), V(0.3, 0.2, 0.1), V(0.1, 0.28, 0.06), V(0.04, 0.1, -0.02), V(0.04, -0.08, -0.04)];
  const colon = vtube(large, colonPts, (t) => (0.125 - t * 0.04) * (1 + 0.13 * Math.max(0, Math.sin(t * Math.PI * 42))), 200, 14);
  const cecum = ell(large, 0.14, 0.12, 0.12, -0.58, 0.28, 0.02);
  const appx = vtube(large, [V(-0.55, 0.2, 0.04), V(-0.5, 0.08, 0.06), V(-0.42, 0.02, 0.05)], (t) => 0.03 - t * 0.01, 12, 8); // ruột thừa
  // ruột non: cuộn ngoằn ngoèo trong khung ruột già (quỹ đạo cố định để mô hình lúc nào cũng giống nhau)
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 70; i++) { const a = i * 0.9, row = Math.floor(i / 10), dir = row % 2 ? -1 : 1; pts.push(V(dir * (-0.36 + (i % 10) * 0.08) + Math.sin(a) * 0.04, 0.98 - row * 0.1 + Math.cos(a * 1.3) * 0.035, 0.12 + Math.sin(a * 0.7) * 0.07)); }
  const gut = vtube(small, pts, () => 0.052, 420, 10);
  const lower = grp(colon, cecum, appx);
  const g = grp(es, st, duo, gut, lower);
  return parts(g, [[es, 0, 0.6, 0], [st, 0.6, 0.3, 0.2], [duo, -0.3, 0.1, 0.4], [gut, 0, -0.1, 0.8], [lower, 0, -0.5, -0.4]]);
}

// ============================================================ NÃO
/** Não: hai bán cầu đại não có nếp cuộn + rãnh giữa, tiểu não phía sau dưới, thân não. Cao ~1,6. */
export function brain(color: string) {
  const cortex = mat(color, { roughness: 0.6 }), cereb = mat(new THREE.Color(color).multiplyScalar(0.88), { roughness: 0.6 }), stem = mat(new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.2));
  const hemi = (s: 1 | -1) => shaped(cortex, (v) => {
    const n = Math.sin(v.x * 11 + v.y * 7) * Math.sin(v.y * 9 - v.z * 8) * Math.sin(v.z * 10 + v.x * 5); // nếp cuộn
    const k = 1 + n * 0.045;
    let x = v.x; if (x * s < 0) x *= 0.25; // mặt trong phẳng (khe liên bán cầu)
    const y = v.y < -0.3 ? -0.3 + (v.y + 0.3) * 0.55 : v.y; // đáy phẳng hơn
    return V((x * 0.36 * k) + 0.025 * s, y * 0.44 * k + 1.0, v.z * 0.62 * k);
  }, 72, 48);
  const L = hemi(1), R = hemi(-1);
  const cb = shaped(cereb, (v) => { const n = Math.sin(v.y * 34) * 0.03; return V(v.x * 0.36 * (1 + n), v.y * 0.17 * (1 + n), v.z * 0.24 * (1 + n)); }, 48, 40);
  cb.position.set(0, 0.62, -0.36);
  const bs = grp(seg(stem, V(0, 0.82, -0.12), V(0, 0.15, -0.2), 0.12, 0.08), ell(stem, 0.13, 0.12, 0.12, 0, 0.72, -0.12));
  const g = grp(L, R, cb, bs);
  return parts(g, [[L, 0.5, 0.1, 0], [R, -0.5, 0.1, 0], [cb, 0, -0.2, -0.5], [bs, 0, -0.5, 0]]);
}

// ============================================================ XƯƠNG
/** Xương đùi nằm ngang: thân xương thon ở giữa, đầu trên có chỏm tròn + cổ xương, đầu dưới có hai lồi cầu. */
export function femur(color: string) {
  const b = mat(color, { roughness: 0.55 });
  const prof = [[0.0, -0.8], [0.13, -0.78], [0.16, -0.7], [0.11, -0.55], [0.085, -0.2], [0.08, 0.2], [0.09, 0.5], [0.12, 0.66], [0.13, 0.72], [0.0, 0.76]].map(([r, y]) => new THREE.Vector2(r, y));
  const shaft = m(new THREE.LatheGeometry(prof, 24), b);
  const neck = seg(b, V(0, 0.62, 0), V(-0.2, 0.82, 0), 0.075, 0.07);
  const head = ell(b, 0.13, 0.13, 0.13, -0.24, 0.86, 0); // chỏm xương
  const troch = ell(b, 0.08, 0.1, 0.08, 0.1, 0.74, 0); // mấu chuyển lớn
  const cond = [1, -1].map((s) => ell(b, 0.1, 0.11, 0.13, 0.08 * s, -0.8, 0.02));
  const g = grp(shaft, neck, head, troch, ...cond);
  g.rotation.z = Math.PI / 2; g.position.y = 0.2;
  return grp(g);
}

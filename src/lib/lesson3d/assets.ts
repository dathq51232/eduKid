// Thư viện đồ vật 3D dựng sẵn bằng khối đơn giản (low-poly, cùng một phong cách, không tải file ngoài).
// Mỗi đồ vật: hàm dựng trả về THREE.Group đặt chân ở y = 0. Phần đặc biệt đánh dấu trong userData:
//  rotor: bộ phận quay khi có hiệu ứng "Tự quay"; lights: đèn giao thông; bulb: bóng đèn bật/tắt;
//  parts: các bộ phận tách rời được; beam: đòn cân; hands: kim đồng hồ.
import * as THREE from 'three';
import { MODEL_ASSETS } from './models';

export type AssetOpts = { color: string; name: string; on?: boolean };
export type Asset = {
  id: string; cat: string; name: string; color: string; kw?: string;
  /** độ cao mặc định khi đặt (Mặt Trời, mây…) */
  y?: number;
  /** chữ trên mặt lấy từ tên đồ vật */
  text?: boolean;
  /** có bộ phận tách rời */
  split?: boolean;
  /** bật/tắt được */
  onoff?: boolean;
  /** không đổi màu */
  fixed?: boolean;
  /** ảnh nhỏ dựng sẵn (mô hình tải từ file .glb) */
  thumb?: string;
  b: (o: AssetOpts) => THREE.Group;
};

export type Part = { obj: THREE.Object3D; base: THREE.Vector3; dir: THREE.Vector3 };

const M = (c: string | number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.85, ...o });
function mesh(g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}
function grp(...a: THREE.Object3D[]) { const g = new THREE.Group(); a.forEach((o) => g.add(o)); return g; }
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r: number, w = 12, h = 10) => new THREE.SphereGeometry(r, w, h);
const cone = (r: number, h: number, s = 8) => new THREE.ConeGeometry(r, h, s);

/** Chữ vẽ lên canvas làm texture (thẻ số, bảng chữ, biển báo) */
export function textTexture(text: string, o: { w?: number; h?: number; bg?: string; fg?: string; size?: number; border?: string } = {}) {
  const w = o.w ?? 512, h = o.h ?? 256;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!;
  g.fillStyle = o.bg ?? '#1f6b45'; g.fillRect(0, 0, w, h);
  if (o.border) { g.strokeStyle = o.border; g.lineWidth = Math.round(w / 28); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth); }
  g.fillStyle = o.fg ?? '#ffffff'; g.font = `700 ${o.size ?? Math.round(h / 5)}px Quicksand, "Segoe UI", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const words = String(text || '').split(/\s+/); const lines: string[] = []; let cur = '';
  words.forEach((wd) => { const t = cur ? `${cur} ${wd}` : wd; if (g.measureText(t).width > w * 0.86 && cur) { lines.push(cur); cur = wd; } else cur = t; });
  if (cur) lines.push(cur);
  const lh = (o.size ?? Math.round(h / 5)) * 1.18;
  lines.slice(0, 4).forEach((l, i, a) => g.fillText(l, w / 2, h / 2 + (i - (a.length - 1) / 2) * lh));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const faceMat = (tex: THREE.Texture | null, fallback = '#ffffff') => (tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }) : M(fallback));
/** Khối hộp có mặt trước in chữ */
function textBox(w: number, h: number, d: number, side: string, tex: THREE.Texture | null) {
  const s = M(side); return new THREE.Mesh(box(w, h, d), [s, s, s, s, faceMat(tex), s]);
}
let glowTexCache: THREE.Texture | null = null;
function glowTex() {
  if (glowTexCache || typeof document === 'undefined') return glowTexCache;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const r = g.createRadialGradient(64, 64, 6, 64, 64, 64); r.addColorStop(0, 'rgba(255,220,120,.95)'); r.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); glowTexCache = new THREE.CanvasTexture(c); return glowTexCache;
}
function glow(size: number) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false })); s.scale.set(size, size, 1); s.raycast = () => {}; return s; }
function withParts(g: THREE.Group, list: [THREE.Object3D, number, number, number][]) {
  g.userData.parts = list.map(([obj, x, y, z]) => ({ obj, base: obj.position.clone(), dir: new THREE.Vector3(x, y, z) })) as Part[];
  return g;
}
const TRUNK = '#7a5232', LEAF = '#2f8f4e', WOOD = '#b07a45', METAL = '#9aa3ad', DARK = '#334155';

function animal(body: string, head: string, o: { ears?: 'up' | 'round'; tail?: boolean; legs?: number; beak?: string; scale?: [number, number, number] } = {}) {
  const b = mesh(sph(0.5, 10, 8), M(body), 0, 0.62, 0); b.scale.set(...(o.scale ?? [1.35, 0.9, 0.9]));
  const h = mesh(sph(0.32, 10, 8), M(head), 0.62, 0.95, 0);
  const g = grp(b, h, mesh(sph(0.05, 6, 5), M('#111827'), 0.88, 1.02, 0.14), mesh(sph(0.05, 6, 5), M('#111827'), 0.88, 1.02, -0.14));
  const n = o.legs ?? 4;
  if (n === 4) [[-0.35, 0.22], [0.35, 0.22], [-0.35, -0.22], [0.35, -0.22]].forEach(([x, z]) => g.add(mesh(cyl(0.08, 0.08, 0.45, 6), M(body), x, 0.22, z)));
  if (n === 2) [0.14, -0.14].forEach((z) => g.add(mesh(cyl(0.04, 0.04, 0.35, 5), M('#f59e0b'), 0, 0.18, z)));
  if (o.ears === 'up') [0.12, -0.12].forEach((z) => g.add(mesh(cone(0.1, 0.32, 5), M(head), 0.58, 1.3, z)));
  if (o.ears === 'round') [0.18, -0.18].forEach((z) => g.add(mesh(sph(0.1, 6, 5), M(head), 0.55, 1.22, z)));
  if (o.beak) { const k = mesh(cone(0.08, 0.25, 6), M(o.beak), 0.98, 0.92, 0); k.rotation.z = -Math.PI / 2; g.add(k); }
  if (o.tail) { const t = mesh(cyl(0.04, 0.06, 0.5, 5), M(body), -0.78, 0.82, 0); t.rotation.z = 0.9; g.add(t); }
  return g;
}

export const ASSETS: Asset[] = [
  // ---------- Tự nhiên ----------
  { id: 'pine', cat: 'Tự nhiên', name: 'Cây thông', color: LEAF, b: ({ color }) => grp(mesh(cyl(0.18, 0.24, 1, 6), M(TRUNK), 0, 0.5), mesh(cone(1.1, 1.8, 7), M(color), 0, 1.7), mesh(cone(0.8, 1.4, 7), M(color), 0, 2.6)) },
  { id: 'tree', cat: 'Tự nhiên', name: 'Cây tán tròn', color: '#43a35a', b: ({ color }) => grp(mesh(cyl(0.2, 0.28, 1.4, 6), M(TRUNK), 0, 0.7), mesh(new THREE.IcosahedronGeometry(1.25, 1), M(color), 0, 2.2)) },
  { id: 'fruit-tree', cat: 'Tự nhiên', name: 'Cây ăn quả', color: '#43a35a', kw: 'qua cam xoai', b: ({ color }) => { const g = grp(mesh(cyl(0.2, 0.28, 1.4, 6), M(TRUNK), 0, 0.7), mesh(new THREE.IcosahedronGeometry(1.25, 1), M(color), 0, 2.2)); [[0.9, 2.2, 0.5], [-0.7, 2.6, 0.7], [0.3, 1.7, 1], [-0.5, 1.9, -0.9], [0.8, 2.7, -0.5]].forEach(([x, y, z]) => g.add(mesh(sph(0.18, 8, 6), M('#f97316'), x, y, z))); return g; } },
  { id: 'plant-parts', cat: 'Tự nhiên', name: 'Cây (tách bộ phận)', color: '#3f9a4f', split: true, kw: 're than la hoa qua bo phan thuc vat', b: ({ color }) => {
    const root = grp(...[[-0.3, -0.5], [0.3, -0.5], [0, -0.7], [-0.15, -0.35], [0.2, -0.3]].map(([x, l]) => { const r = mesh(cyl(0.03, 0.06, Math.abs(l) * 1.6, 5), M('#c79a5a'), x, l * 0.8, 0); r.rotation.z = x * 0.8; return r; }));
    root.position.y = 0.6;
    const stem = mesh(cyl(0.09, 0.12, 2.2, 7), M(color), 0, 1.7, 0);
    const leafG = grp(...[[-0.55, 1.6, 0.6], [0.55, 2.1, -0.6], [-0.5, 2.5, -0.3]].map(([x, y, r]) => { const l = mesh(sph(0.4, 8, 6), M('#4cb35e'), x, y, 0); l.scale.set(1, 0.25, 0.55); l.rotation.z = r; return l; }));
    const flower = grp(mesh(sph(0.16, 8, 6), M('#facc15'), 0, 2.95, 0), ...Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return mesh(sph(0.15, 6, 5), M('#ec4899'), Math.cos(a) * 0.24, 2.95, Math.sin(a) * 0.24); }));
    const fruit = mesh(sph(0.22, 10, 8), M('#ef4444'), 0.45, 2.55, 0.35);
    const soil = mesh(cyl(1.1, 1.1, 0.2, 16), M('#8a5a3b'), 0, 0.1, 0);
    const g = grp(soil, root, stem, leafG, flower, fruit);
    return withParts(g, [[root, 0, -0.9, 0.9], [stem, 0, 0, 0], [leafG, -1.2, 0, 0.4], [flower, 0, 1, 0], [fruit, 1.2, 0, 0.6]]);
  } },
  { id: 'flower', cat: 'Tự nhiên', name: 'Hoa', color: '#ec4899', b: ({ color }) => { const g = grp(mesh(cyl(0.04, 0.05, 0.8, 5), M('#3f9a4f'), 0, 0.4), mesh(sph(0.13, 8, 6), M('#facc15'), 0, 0.85)); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.add(mesh(sph(0.13, 6, 5), M(color), Math.cos(a) * 0.2, 0.85, Math.sin(a) * 0.2)); } return g; } },
  { id: 'pot-plant', cat: 'Tự nhiên', name: 'Chậu cây cảnh', color: '#c2410c', kw: 'chau hoa', b: ({ color }) => grp(mesh(cyl(0.45, 0.32, 0.6, 12), M(color), 0, 0.3), mesh(cyl(0.42, 0.42, 0.05, 12), M('#6b4a2b'), 0, 0.58), mesh(new THREE.IcosahedronGeometry(0.45, 1), M('#3fa45b'), 0, 1.1), mesh(cyl(0.04, 0.05, 0.4, 5), M('#3f9a4f'), 0, 0.75)) },
  { id: 'grass', cat: 'Tự nhiên', name: 'Bụi cỏ', color: '#5fb34f', b: ({ color }) => grp(...[[-0.2, 0], [0.15, 0.1], [0, -0.15], [0.25, -0.1], [-0.1, 0.2]].map(([x, z]) => mesh(cone(0.08, 0.5, 4), M(color), x, 0.25, z))) },
  { id: 'mountain', cat: 'Tự nhiên', name: 'Núi', color: '#7b8a74', b: ({ color }) => grp(mesh(cone(2.6, 4.4, 7), M(color), 0, 2.2), mesh(cone(0.95, 1.4, 7), M('#ffffff'), 0, 3.72)) },
  { id: 'hill', cat: 'Tự nhiên', name: 'Đồi', color: '#79ad55', b: ({ color }) => { const m = mesh(new THREE.SphereGeometry(1.8, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(color)); m.scale.y = 0.55; return grp(m); } },
  { id: 'plain', cat: 'Tự nhiên', name: 'Đồng bằng', color: '#9ccc65', b: ({ color }) => grp(mesh(box(3.2, 0.12, 2.4), M(color), 0, 0.06)) },
  { id: 'rock', cat: 'Tự nhiên', name: 'Tảng đá', color: METAL, b: ({ color }) => grp(mesh(new THREE.DodecahedronGeometry(0.6, 0), M(color), 0, 0.4)) },
  { id: 'cloud', cat: 'Tự nhiên', name: 'Mây', color: '#ffffff', y: 5.5, b: ({ color }) => grp(...[[0, 0, 0, 0.9], [0.9, -0.1, 0.2, 0.7], [-0.9, -0.15, -0.1, 0.68], [0.4, 0.4, -0.2, 0.6], [-0.4, 0.35, 0.3, 0.58]].map(([x, y, z, r]) => mesh(new THREE.IcosahedronGeometry(r, 1), M(color, { roughness: 1 }), x, y, z))) },
  { id: 'lake', cat: 'Tự nhiên', name: 'Hồ nước', color: '#2aa7e0', kw: 'ao', b: ({ color }) => grp(mesh(cyl(2, 2.1, 0.12, 20), M(color, { roughness: 0.3 }), 0, 0.06)) },
  { id: 'river', cat: 'Tự nhiên', name: 'Dòng sông', color: '#34b4ec', kw: 'suoi', b: ({ color }) => { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-3, 0.05, -1), new THREE.Vector3(-1, 0.05, 0.6), new THREE.Vector3(1, 0.05, -0.4), new THREE.Vector3(3, 0.05, 0.8)]); const m = mesh(new THREE.TubeGeometry(c, 40, 0.35, 6), M(color, { roughness: 0.3 })); m.scale.y = 0.3; return grp(m); } },
  { id: 'sea', cat: 'Tự nhiên', name: 'Biển', color: '#1d8fd1', kw: 'nuoc bien dai duong', b: ({ color }) => grp(mesh(box(5, 0.2, 4), M(color, { roughness: 0.25, transparent: true, opacity: 0.92 }), 0, 0.1)) },
  { id: 'ice', cat: 'Tự nhiên', name: 'Nước đá', color: '#cdeefd', kw: 'da bang ran', b: ({ color }) => grp(mesh(box(0.7, 0.7, 0.7), M(color, { transparent: true, opacity: 0.85, roughness: 0.2 }), 0, 0.35), mesh(box(0.55, 0.55, 0.55), M(color, { transparent: true, opacity: 0.85, roughness: 0.2 }), 0.5, 0.28, 0.4)) },
  // ---------- Bầu trời & thời tiết ----------
  { id: 'sun', cat: 'Bầu trời', name: 'Mặt Trời', color: '#ffc533', y: 6.5, kw: 'nang', b: ({ color }) => grp(new THREE.Mesh(sph(1, 18, 12), new THREE.MeshBasicMaterial({ color })), glow(5)) },
  { id: 'earth', cat: 'Bầu trời', name: 'Trái Đất', color: '#2f7fd6', y: 2, fixed: true, kw: 'dia cau', b: ({ color }) => {
    const g = new THREE.IcosahedronGeometry(1.2, 2); const col: number[] = []; const p = g.attributes.position; const cc = new THREE.Color(color), land = new THREE.Color('#3fa45b');
    for (let i = 0; i < p.count; i++) { const v = Math.sin(p.getX(i) * 2.3) + Math.cos(p.getY(i) * 3.1 + p.getZ(i) * 1.7); const k = v > 0.6 ? land : cc; col.push(k.r, k.g, k.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const ball = mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 })); ball.name = 'rotor';
    const axis = mesh(cyl(0.03, 0.03, 3.2, 5), M('#94a3b8')); const tilt = grp(ball, axis); tilt.rotation.z = 0.41; return grp(tilt);
  } },
  { id: 'moon', cat: 'Bầu trời', name: 'Mặt Trăng', color: '#c9ccd3', y: 3, b: ({ color }) => grp(mesh(new THREE.IcosahedronGeometry(0.6, 1), M(color))) },
  { id: 'star', cat: 'Bầu trời', name: 'Ngôi sao', color: '#fde047', y: 5, b: ({ color }) => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.25 : 0.6, a = (i / 10) * Math.PI * 2 + Math.PI / 2; if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r); else s.moveTo(Math.cos(a) * r, Math.sin(a) * r); } return grp(mesh(new THREE.ExtrudeGeometry(s, { depth: 0.15, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color }))); } },
  { id: 'umbrella', cat: 'Bầu trời', name: 'Ô (dù)', color: '#ef4444', kw: 'mua thoi tiet', b: ({ color }) => grp(mesh(new THREE.SphereGeometry(0.9, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), M(color), 0, 1.6), mesh(cyl(0.03, 0.03, 1.7, 5), M(DARK), 0, 0.85)) },
  { id: 'wind-sock', cat: 'Bầu trời', name: 'Cờ đo gió', color: '#f97316', kw: 'gio bao', b: ({ color }) => { const s = mesh(cone(0.25, 1.1, 8, ), M(color), 0.55, 2.2, 0); s.rotation.z = Math.PI / 2; return grp(mesh(cyl(0.04, 0.04, 2.4, 5), M(DARK), 0, 1.2), s); } },
  // ---------- Sinh vật & cơ thể ----------
  { id: 'duck', cat: 'Sinh vật', name: 'Con vịt', color: '#fde047', b: ({ color }) => animal(color, color, { legs: 2, beak: '#f97316', scale: [1.3, 0.9, 1] }) },
  { id: 'chicken', cat: 'Sinh vật', name: 'Con gà', color: '#f8fafc', kw: 'ga mai', b: ({ color }) => { const g = animal(color, color, { legs: 2, beak: '#f59e0b', scale: [1.1, 1, 0.9] }); g.add(mesh(box(0.06, 0.2, 0.18), M('#ef4444'), 0.62, 1.3, 0)); return g; } },
  { id: 'cat', cat: 'Sinh vật', name: 'Con mèo', color: '#f59e0b', b: ({ color }) => animal(color, color, { ears: 'up', tail: true }) },
  { id: 'dog', cat: 'Sinh vật', name: 'Con chó', color: '#a16207', b: ({ color }) => animal(color, color, { ears: 'round', tail: true }) },
  { id: 'cow', cat: 'Sinh vật', name: 'Con bò', color: '#e7e5e4', kw: 'trau', b: ({ color }) => { const g = animal(color, color, { ears: 'round', tail: true, scale: [1.6, 1, 1] }); g.scale.setScalar(1.3); return g; } },
  { id: 'pig', cat: 'Sinh vật', name: 'Con lợn', color: '#f9a8d4', b: ({ color }) => animal(color, color, { ears: 'round' }) },
  { id: 'rabbit', cat: 'Sinh vật', name: 'Con thỏ', color: '#f1f5f9', b: ({ color }) => animal(color, color, { ears: 'up', scale: [1.1, 0.95, 0.9] }) },
  { id: 'fox', cat: 'Sinh vật', name: 'Con cáo', color: '#ea580c', kw: 'ho soi', b: ({ color }) => animal(color, color, { ears: 'up', tail: true }) },
  { id: 'bird', cat: 'Sinh vật', name: 'Con chim', color: '#38bdf8', y: 0, b: ({ color }) => { const g = animal(color, color, { legs: 2, beak: '#f59e0b', scale: [1, 0.8, 0.8] }); g.scale.setScalar(0.6); return g; } },
  { id: 'fish', cat: 'Sinh vật', name: 'Con cá', color: '#fb923c', y: 0.4, b: ({ color }) => { const b = mesh(sph(0.4, 10, 8), M(color)); b.scale.set(1.5, 0.8, 0.5); const t = mesh(cone(0.3, 0.5, 4), M(color), -0.75, 0, 0); t.rotation.z = Math.PI / 2; return grp(b, t); } },
  { id: 'frog', cat: 'Sinh vật', name: 'Con ếch', color: '#22c55e', kw: 'nong noc vong doi', b: ({ color }) => { const b = mesh(sph(0.45, 10, 8), M(color), 0, 0.35, 0); b.scale.set(1.1, 0.7, 1); return grp(b, mesh(sph(0.12, 8, 6), M('#f8fafc'), 0.3, 0.7, 0.18), mesh(sph(0.12, 8, 6), M('#f8fafc'), 0.3, 0.7, -0.18), mesh(sph(0.06, 6, 5), M('#111827'), 0.38, 0.72, 0.18), mesh(sph(0.06, 6, 5), M('#111827'), 0.38, 0.72, -0.18)); } },
  { id: 'tadpole', cat: 'Sinh vật', name: 'Nòng nọc', color: '#334155', y: 0.2, b: ({ color }) => { const t = mesh(cone(0.12, 0.6, 6), M(color), -0.35, 0, 0); t.rotation.z = Math.PI / 2; return grp(mesh(sph(0.22, 8, 6), M(color)), t); } },
  { id: 'egg', cat: 'Sinh vật', name: 'Quả trứng', color: '#fef3c7', b: ({ color }) => { const e = mesh(sph(0.3, 12, 10), M(color, { flatShading: false }), 0, 0.38, 0); e.scale.y = 1.3; return grp(e); } },
  { id: 'caterpillar', cat: 'Sinh vật', name: 'Sâu non', color: '#84cc16', kw: 'buom vong doi', b: ({ color }) => grp(...[0, 1, 2, 3, 4].map((i) => mesh(sph(0.16, 8, 6), M(i === 4 ? '#65a30d' : color), -0.4 + i * 0.22, 0.16, 0))) },
  { id: 'butterfly', cat: 'Sinh vật', name: 'Con bướm', color: '#a855f7', y: 1, b: ({ color }) => { const w1 = mesh(sph(0.4, 8, 6), M(color), 0, 0, 0.35); w1.scale.set(1, 0.1, 0.8); const w2 = w1.clone(); w2.position.z = -0.35; const r = grp(w1, w2); r.name = 'rotor'; return grp(mesh(cyl(0.05, 0.05, 0.7, 6), M(DARK), 0, 0, 0).rotateZ(Math.PI / 2), r); } },
  { id: 'grasshopper', cat: 'Sinh vật', name: 'Châu chấu', color: '#65a30d', b: ({ color }) => { const b = mesh(sph(0.2, 8, 6), M(color), 0, 0.25, 0); b.scale.set(2.2, 0.8, 0.8); return grp(b, mesh(cyl(0.02, 0.02, 0.6, 4), M(color), -0.2, 0.25, 0.15).rotateZ(0.8), mesh(cyl(0.02, 0.02, 0.6, 4), M(color), -0.2, 0.25, -0.15).rotateZ(0.8)); } },
  { id: 'lungs', cat: 'Sinh vật', name: 'Phổi', color: '#f9a8d4', split: true, kw: 'ho hap co the', y: 0.2, b: ({ color }) => { const l = mesh(sph(0.55, 10, 8), M(color), -0.45, 1, 0); l.scale.set(0.8, 1.3, 0.7); const r = l.clone(); r.position.x = 0.45; const tr = mesh(cyl(0.09, 0.09, 1, 8), M('#e2e8f0'), 0, 2.1, 0); return withParts(grp(l, r, tr), [[l, -0.6, 0, 0], [r, 0.6, 0, 0], [tr, 0, 0.6, 0]]); } },
  { id: 'stomach', cat: 'Sinh vật', name: 'Dạ dày & ruột', color: '#fb7185', split: true, kw: 'tieu hoa co the', b: ({ color }) => { const st = mesh(sph(0.45, 10, 8), M(color), 0.2, 2, 0); st.scale.set(1.3, 0.8, 0.7); const c = new THREE.CatmullRomCurve3(Array.from({ length: 18 }, (_, i) => new THREE.Vector3(Math.sin(i * 1.3) * 0.6, 1.3 - i * 0.05, Math.cos(i * 1.3) * 0.25))); const gut = mesh(new THREE.TubeGeometry(c, 60, 0.11, 6), M('#fda4af')); const es = mesh(cyl(0.07, 0.07, 1, 6), M('#fecdd3'), -0.15, 2.8, 0); return withParts(grp(es, st, gut), [[es, 0, 0.6, 0], [st, 0.5, 0.2, 0], [gut, 0, -0.5, 0]]); } },
  { id: 'bone', cat: 'Sinh vật', name: 'Xương', color: '#f5f5f4', kw: 'van dong co the', b: ({ color }) => grp(mesh(cyl(0.12, 0.12, 1.6, 8), M(color), 0, 0.3, 0).rotateZ(Math.PI / 2), mesh(sph(0.2, 8, 6), M(color), -0.85, 0.3, 0.1), mesh(sph(0.2, 8, 6), M(color), -0.85, 0.3, -0.1), mesh(sph(0.2, 8, 6), M(color), 0.85, 0.3, 0.1), mesh(sph(0.2, 8, 6), M(color), 0.85, 0.3, -0.1)) },
  { id: 'kid', cat: 'Sinh vật', name: 'Học sinh', color: '#2457c5', kw: 'nguoi tre em', b: ({ color }) => grp(mesh(new THREE.CapsuleGeometry(0.32, 0.6, 4, 8), M(color), 0, 0.65), mesh(sph(0.3, 12, 10), M('#f5c9a0'), 0, 1.45), mesh(new THREE.SphereGeometry(0.31, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M('#2b1d14'), 0, 1.5)) },
  { id: 'adult', cat: 'Sinh vật', name: 'Người lớn', color: '#0f766e', kw: 'nguoi nghe nghiep bo me co giao', b: ({ color }) => { const g = grp(mesh(new THREE.CapsuleGeometry(0.4, 0.95, 4, 8), M(color), 0, 0.9), mesh(sph(0.34, 12, 10), M('#f5c9a0'), 0, 1.95), mesh(new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M('#1f2937'), 0, 2)); return g; } },
  // ---------- Việt Nam & cộng đồng ----------
  { id: 'stilt', cat: 'Việt Nam', name: 'Nhà sàn', color: WOOD, b: ({ color }) => { const g = new THREE.Group(); [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]].forEach(([x, z]) => g.add(mesh(cyl(0.08, 0.08, 1, 5), M('#6b4a2b'), x, 0.5, z))); g.add(mesh(box(2.1, 0.8, 1.5), M(color), 0, 1.4)); const r = mesh(cone(1.7, 1.2, 4), M('#d9b26a'), 0, 2.4); r.rotation.y = Math.PI / 4; r.scale.z = 0.75; g.add(r); return g; } },
  { id: 'house', cat: 'Việt Nam', name: 'Nhà mái ngói', color: '#f4e4c1', kw: 'nha o', b: ({ color }) => { const r = mesh(cone(1.45, 1, 4), M('#c2410c'), 0, 1.7); r.rotation.y = Math.PI / 4; return grp(mesh(box(1.8, 1.2, 1.4), M(color), 0, 0.6), r, mesh(box(0.4, 0.7, 0.05), M(TRUNK), 0, 0.35, 0.72)); } },
  { id: 'rong', cat: 'Việt Nam', name: 'Nhà rông', color: '#a16207', kw: 'tay nguyen', b: ({ color }) => { const g = new THREE.Group(); [[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5]].forEach(([x, z]) => g.add(mesh(cyl(0.08, 0.08, 0.9, 5), M('#6b4a2b'), x, 0.45, z))); g.add(mesh(box(1.7, 0.6, 1.3), M(color), 0, 1.2)); const s = new THREE.Shape(); s.moveTo(-1.1, 0); s.lineTo(0, 3); s.lineTo(1.1, 0); s.lineTo(-1.1, 0); const roof = mesh(new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: false }), M('#d9b26a'), 0, 1.5, -0.75); g.add(roof); return g; } },
  { id: 'pagoda', cat: 'Việt Nam', name: 'Chùa / đình', color: '#b91c1c', kw: 'di tich lich su van hoa', b: ({ color }) => { const g = new THREE.Group(); g.add(mesh(box(2.2, 0.3, 1.8), M('#d6d3d1'), 0, 0.15)); [0, 1, 2].forEach((i) => { g.add(mesh(box(1.6 - i * 0.4, 0.6, 1.3 - i * 0.3), M('#fde68a'), 0, 0.6 + i * 0.95)); const r = mesh(cone(1.35 - i * 0.32, 0.45, 4), M(color), 0, 1.1 + i * 0.95); r.rotation.y = Math.PI / 4; r.scale.z = 0.8; g.add(r); }); return g; } },
  { id: 'bridge', cat: 'Việt Nam', name: 'Cây cầu', color: '#b45309', b: ({ color }) => { const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-2, 0.2, 0), new THREE.Vector3(0, 0.9, 0), new THREE.Vector3(2, 0.2, 0)]); const deck = mesh(new THREE.TubeGeometry(c, 20, 0.12, 4), M(color)); deck.scale.z = 6; return grp(deck, mesh(cyl(0.06, 0.06, 1, 5), M(color), 0, 0.5, 0.6), mesh(cyl(0.06, 0.06, 1, 5), M(color), 0, 0.5, -0.6)); } },
  { id: 'drum', cat: 'Việt Nam', name: 'Trống đồng', color: '#b4893c', b: ({ color }) => grp(mesh(cyl(0.9, 0.75, 0.5, 16), M(color, { metalness: 0.4, roughness: 0.5 }), 0, 0.9), mesh(cyl(0.7, 0.85, 0.65, 16), M(color, { metalness: 0.4, roughness: 0.5 }), 0, 0.33), mesh(cyl(0.25, 0.25, 0.02, 12), M('#e6c070', { metalness: 0.5 }), 0, 1.16)) },
  { id: 'gong', cat: 'Việt Nam', name: 'Cồng chiêng', color: '#ca8a04', kw: 'tay nguyen am thanh', b: ({ color }) => { const d = mesh(cyl(0.7, 0.7, 0.12, 20), M(color, { metalness: 0.5, roughness: 0.4 }), 0, 1.4, 0); d.rotation.x = Math.PI / 2; return grp(mesh(box(1.8, 0.08, 0.08), M(TRUNK), 0, 2.25, 0), mesh(cyl(0.05, 0.05, 2.3, 5), M(TRUNK), -0.85, 1.15, 0), mesh(cyl(0.05, 0.05, 2.3, 5), M(TRUNK), 0.85, 1.15, 0), d, mesh(sph(0.15, 8, 6), M(color, { metalness: 0.5 }), 0, 1.4, 0.1)); } },
  { id: 'rice', cat: 'Việt Nam', name: 'Ruộng lúa', color: '#9ccc4a', b: ({ color }) => { const g = grp(mesh(box(3, 0.12, 2), M('#6aa0c8', { roughness: 0.4 }), 0, 0.06)); for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) g.add(mesh(cone(0.09, 0.45, 4), M(color), -1.2 + i * 0.4, 0.3, -0.8 + j * 0.4)); return g; } },
  { id: 'coffee', cat: 'Việt Nam', name: 'Cây cà phê', color: '#15803d', kw: 'tay nguyen', b: ({ color }) => { const g = grp(mesh(cyl(0.1, 0.14, 0.8, 6), M(TRUNK), 0, 0.4), mesh(new THREE.IcosahedronGeometry(0.75, 1), M(color), 0, 1.3)); [[0.5, 1.3, 0.4], [-0.4, 1.5, 0.5], [0.2, 1, 0.6]].forEach(([x, y, z]) => g.add(mesh(sph(0.08, 6, 5), M('#b91c1c'), x, y, z))); return g; } },
  // ---------- Giao thông ----------
  { id: 'road', cat: 'Giao thông', name: 'Đoạn đường', color: '#475569', fixed: true, kw: 'duong pho', b: () => { const g = grp(mesh(box(6, 0.06, 2), M('#475569'), 0, 0.03)); for (let i = 0; i < 5; i++) g.add(mesh(box(0.6, 0.07, 0.08), M('#f8fafc'), -2.4 + i * 1.2, 0.04, 0)); return g; } },
  { id: 'crosswalk', cat: 'Giao thông', name: 'Vạch qua đường', color: '#475569', fixed: true, kw: 'di bo', b: () => { const g = grp(mesh(box(2, 0.06, 2), M('#475569'), 0, 0.03)); for (let i = 0; i < 6; i++) g.add(mesh(box(1.8, 0.07, 0.16), M('#f8fafc'), 0, 0.04, -0.8 + i * 0.32)); return g; } },
  { id: 'traffic', cat: 'Giao thông', name: 'Đèn tín hiệu', color: '#1f2937', onoff: true, fixed: true, kw: 'den giao thong xanh do vang', b: () => {
    const mk = (c: string) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.05, roughness: 0.4 });
    const lights = [mk('#ef4444'), mk('#facc15'), mk('#22c55e')];
    const g = grp(mesh(cyl(0.07, 0.07, 2.2, 6), M('#334155'), 0, 1.1), mesh(box(0.5, 1.3, 0.4), M('#1f2937'), 0, 2.6));
    lights.forEach((m, i) => g.add(mesh(sph(0.15, 10, 8), m, 0, 3.0 - i * 0.4, 0.2)));
    g.userData.lights = lights; return g;
  } },
  { id: 'sign-stop', cat: 'Giao thông', name: 'Biển cấm', color: '#dc2626', fixed: true, kw: 'bien bao', b: () => { const d = mesh(cyl(0.45, 0.45, 0.05, 20), [M('#ffffff'), M('#dc2626'), M('#dc2626')], 0, 1.6, 0); d.rotation.x = Math.PI / 2; return grp(mesh(cyl(0.04, 0.04, 1.6, 5), M(METAL), 0, 0.8), d, mesh(box(0.6, 0.12, 0.06), M('#ffffff'), 0, 1.6, 0.04)); } },
  { id: 'sign-warn', cat: 'Giao thông', name: 'Biển nguy hiểm', color: '#facc15', fixed: true, kw: 'bien bao canh bao', b: () => { const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 0.86); s.lineTo(-0.5, 0); const t = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false }), [M('#facc15'), M('#dc2626')], 0, 1.3, 0); return grp(mesh(cyl(0.04, 0.04, 1.4, 5), M(METAL), 0, 0.7), t); } },
  { id: 'sign-info', cat: 'Giao thông', name: 'Biển chỉ dẫn', color: '#2563eb', text: true, kw: 'bien bao', b: ({ color, name }) => grp(mesh(cyl(0.04, 0.04, 1.5, 5), M(METAL), 0, 0.75), (() => { const b = textBox(1.1, 0.8, 0.05, color, textTexture(name, { bg: color, w: 256, h: 192, size: 34 })); b.position.y = 1.6; return b; })()) },
  { id: 'car', cat: 'Giao thông', name: 'Ô tô', color: '#ef4444', kw: 'xe', b: ({ color }) => { const g = grp(mesh(box(1.6, 0.45, 0.8), M(color), 0, 0.42), mesh(box(0.9, 0.4, 0.75), M('#bae6fd'), -0.1, 0.84)); [[-0.5, 0.42], [0.5, 0.42], [-0.5, -0.42], [0.5, -0.42]].forEach(([x, z]) => { const w = mesh(cyl(0.18, 0.18, 0.12, 12), M('#111827'), x, 0.2, z); w.rotation.x = Math.PI / 2; g.add(w); }); return g; } },
  { id: 'bus', cat: 'Giao thông', name: 'Xe buýt', color: '#f59e0b', b: ({ color }) => { const g = grp(mesh(box(2.6, 0.9, 0.9), M(color), 0, 0.7), mesh(box(2.2, 0.3, 0.92), M('#bae6fd'), 0, 0.95)); [[-0.8, 0.46], [0.8, 0.46], [-0.8, -0.46], [0.8, -0.46]].forEach(([x, z]) => { const w = mesh(cyl(0.2, 0.2, 0.12, 12), M('#111827'), x, 0.22, z); w.rotation.x = Math.PI / 2; g.add(w); }); return g; } },
  { id: 'bike', cat: 'Giao thông', name: 'Xe đạp', color: '#16a34a', kw: 'xe may', b: ({ color }) => { const w1 = mesh(new THREE.TorusGeometry(0.3, 0.04, 6, 16), M('#111827'), -0.45, 0.32, 0); const w2 = w1.clone(); w2.position.x = 0.45; return grp(w1, w2, mesh(box(0.9, 0.06, 0.06), M(color), 0, 0.55, 0), mesh(cyl(0.03, 0.03, 0.5, 5), M(color), 0.3, 0.7, 0), mesh(box(0.25, 0.05, 0.12), M('#111827'), -0.2, 0.8, 0)); } },
  { id: 'boat', cat: 'Giao thông', name: 'Thuyền', color: '#b45309', kw: 'ghe', b: ({ color }) => { const h = mesh(cyl(0.5, 0.25, 0.4, 8), M(color), 0, 0.2, 0); h.scale.set(2.2, 1, 0.8); return grp(h); } },
  { id: 'plane', cat: 'Giao thông', name: 'Máy bay', color: '#e2e8f0', y: 4, b: ({ color }) => { const b = mesh(cyl(0.22, 0.18, 2, 10), M(color), 0, 0, 0); b.rotation.z = Math.PI / 2; return grp(b, mesh(box(0.5, 0.05, 2.2), M('#2457c5'), 0, 0, 0), mesh(box(0.3, 0.5, 0.05), M('#2457c5'), -0.9, 0.25, 0)); } },
  { id: 'train', cat: 'Giao thông', name: 'Tàu hỏa', color: '#2563eb', kw: 'tau hoa', b: ({ color }) => grp(mesh(box(2, 0.8, 0.8), M(color), 0, 0.6), mesh(cyl(0.3, 0.3, 0.6, 10), M(DARK), 0.8, 1.2, 0), mesh(box(2.2, 0.1, 0.9), M('#1f2937'), 0, 0.15, 0)) },
  // ---------- Toán ----------
  { id: 'cube', cat: 'Toán', name: 'Khối lập phương', color: '#ef4444', kw: 'hinh khoi', b: ({ color }) => grp(mesh(box(1.2, 1.2, 1.2), M(color), 0, 0.6)) },
  { id: 'cuboid', cat: 'Toán', name: 'Khối hộp chữ nhật', color: '#3b82f6', kw: 'hinh khoi', b: ({ color }) => grp(mesh(box(1.8, 0.9, 1), M(color), 0, 0.45)) },
  { id: 'cyl', cat: 'Toán', name: 'Khối trụ', color: '#22c55e', kw: 'hinh khoi', b: ({ color }) => grp(mesh(cyl(0.6, 0.6, 1.4, 24), M(color, { flatShading: false }), 0, 0.7)) },
  { id: 'ball', cat: 'Toán', name: 'Khối cầu', color: '#f59e0b', kw: 'hinh khoi', b: ({ color }) => grp(mesh(sph(0.7, 24, 16), M(color, { flatShading: false }), 0, 0.7)) },
  { id: 'cone', cat: 'Toán', name: 'Khối nón', color: '#8b5cf6', kw: 'hinh khoi', b: ({ color }) => grp(mesh(cone(0.7, 1.4, 24), M(color, { flatShading: false }), 0, 0.7)) },
  { id: 'tray10', cat: 'Toán', name: 'Khay 10 ô', color: '#2457c5', kw: 'dem so', b: ({ color }) => { const g = grp(mesh(box(2.8, 0.12, 1.2), M(color), 0, 0.06)); for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) g.add(mesh(box(0.48, 0.05, 0.48), M('#f8fafc'), -1.1 + i * 0.55, 0.14, -0.27 + j * 0.55)); return g; } },
  { id: 'counter', cat: 'Toán', name: 'Chấm tròn', color: '#ef4444', kw: 'dem so', b: ({ color }) => grp(mesh(cyl(0.2, 0.2, 0.1, 16), M(color), 0, 0.2)) },
  { id: 'card', cat: 'Toán', name: 'Thẻ số', color: '#fde047', text: true, kw: 'so phep tinh', b: ({ color, name }) => { const c = textBox(0.9, 1.2, 0.06, color, textTexture(name, { bg: '#ffffff', fg: '#1b2a47', w: 192, h: 256, size: 96, border: color })); c.position.y = 0.6; return grp(c); } },
  { id: 'board100', cat: 'Toán', name: 'Bảng số 1–100', color: '#ffffff', fixed: true, kw: 'bang so', b: () => {
    if (typeof document === 'undefined') return grp(mesh(box(2.4, 2.4, 0.08), M('#fff'), 0, 1.4));
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#94a3b8'; g.font = '700 20px Quicksand, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < 100; i++) { const x = (i % 10) * 51.2, y = Math.floor(i / 10) * 51.2; g.fillStyle = (i + 1) % 10 === 0 ? '#dbeafe' : '#ffffff'; g.fillRect(x, y, 51.2, 51.2); g.strokeRect(x, y, 51.2, 51.2); g.fillStyle = '#1b2a47'; g.fillText(String(i + 1), x + 25.6, y + 26); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const b = textBox(2.4, 2.4, 0.08, '#cbd5e1', t); b.position.y = 1.4; return grp(b, mesh(box(0.1, 0.4, 0.6), M('#94a3b8'), 0, 0.2, -0.2));
  } },
  { id: 'numberline', cat: 'Toán', name: 'Tia số', color: '#2457c5', kw: 'thuoc', b: ({ color }) => { const g = grp(mesh(box(4.4, 0.06, 0.06), M(color), 0, 0.15)); for (let i = 0; i <= 10; i++) { g.add(mesh(box(0.04, 0.25, 0.04), M(color), -2 + i * 0.4, 0.2)); const t = textTexture(String(i), { bg: '#ffffff', fg: '#1b2a47', w: 64, h: 64, size: 40 }); if (t) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); s.scale.set(0.3, 0.3, 1); s.position.set(-2 + i * 0.4, 0.55, 0); g.add(s); } } const a = mesh(cone(0.1, 0.25, 6), M(color), 2.3, 0.15, 0); a.rotation.z = -Math.PI / 2; g.add(a); return g; } },
  { id: 'abacus', cat: 'Toán', name: 'Bàn tính', color: '#b45309', kw: 'tram chuc don vi', b: ({ color }) => { const g = grp(mesh(box(2.2, 0.12, 0.2), M(color), 0, 0.1), mesh(box(2.2, 0.12, 0.2), M(color), 0, 1.6), mesh(box(0.12, 1.6, 0.2), M(color), -1.05, 0.85), mesh(box(0.12, 1.6, 0.2), M(color), 1.05, 0.85)); const cols = ['#ef4444', '#3b82f6', '#22c55e']; [-0.6, 0, 0.6].forEach((x, i) => { g.add(mesh(cyl(0.025, 0.025, 1.5, 5), M(METAL), x, 0.85)); for (let k = 0; k < 3 + i; k++) g.add(mesh(sph(0.13, 8, 6), M(cols[i]), x, 0.28 + k * 0.24)); }); return g; } },
  { id: 'clock', cat: 'Toán', name: 'Đồng hồ kim', color: '#2457c5', kw: 'gio xem gio la ma', b: ({ color, name }) => {
    const roman = /la ?m[aã]/i.test(name);
    let face: THREE.Material = M('#ffffff');
    if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#1b2a47'; g.font = `700 ${roman ? 22 : 28}px Quicksand, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; const R = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(roman ? R[i] : String(i || 12), 128 + Math.sin(a) * 96, 128 - Math.cos(a) * 96); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; face = new THREE.MeshStandardMaterial({ map: t }); }
    const disc = mesh(cyl(1, 1, 0.12, 32), [M(color), face, M(color)], 0, 1.3, 0); disc.rotation.x = Math.PI / 2; disc.rotation.y = Math.PI;
    const hh = mesh(box(0.08, 0.5, 0.03), M('#1b2a47'), 0, 0.25, 0); const hm = mesh(box(0.05, 0.75, 0.03), M('#ef4444'), 0, 0.37, 0);
    const ph = grp(hh); ph.position.set(0, 1.3, 0.09); const pm = grp(hm); pm.position.set(0, 1.3, 0.1); pm.rotation.z = -Math.PI * 0.4;
    const g = grp(disc, ph, pm, mesh(box(0.8, 0.12, 0.5), M(color), 0, 0.06, 0), mesh(box(0.1, 0.3, 0.1), M(color), 0, 0.25, 0)); g.userData.hands = { h: ph, m: pm }; return g;
  } },
  { id: 'calendar', cat: 'Toán', name: 'Lịch để bàn', color: '#dc2626', text: true, kw: 'ngay thang', b: ({ color, name }) => { const p = textBox(1.4, 1.1, 0.04, color, textTexture(name, { bg: '#ffffff', fg: '#1b2a47', w: 256, h: 200, size: 56, border: color })); p.position.set(0, 0.62, 0.15); p.rotation.x = -0.25; const b = mesh(box(1.4, 1.1, 0.04), M(color), 0, 0.62, -0.15); b.rotation.x = 0.25; return grp(p, b, mesh(cyl(0.03, 0.03, 1.4, 6), M(METAL), 0, 1.15, 0).rotateZ(Math.PI / 2)); } },
  { id: 'ruler', cat: 'Toán', name: 'Thước kẻ', color: '#fde047', kw: 'do do dai thuoc gap cm', b: ({ color }) => { const g = grp(mesh(box(3, 0.05, 0.4), M(color), 0, 0.03)); for (let i = 0; i <= 20; i++) g.add(mesh(box(0.015, 0.06, i % 5 ? 0.1 : 0.2), M('#1b2a47'), -1.4 + i * 0.14, 0.05, -0.15 + (i % 5 ? 0 : 0.05))); return g; } },
  { id: 'balance', cat: 'Toán', name: 'Cân thăng bằng', color: '#2457c5', kw: 'can nang', b: ({ color }) => {
    const beam = grp(mesh(box(2.6, 0.08, 0.12), M(color)), mesh(cyl(0.45, 0.35, 0.08, 16), M(METAL), -1.2, -0.45, 0), mesh(cyl(0.45, 0.35, 0.08, 16), M(METAL), 1.2, -0.45, 0), mesh(cyl(0.015, 0.015, 0.45, 4), M(DARK), -1.2, -0.22, 0), mesh(cyl(0.015, 0.015, 0.45, 4), M(DARK), 1.2, -0.22, 0));
    beam.position.y = 1.6; const g = grp(mesh(cyl(0.5, 0.6, 0.15, 16), M(color), 0, 0.08), mesh(cyl(0.06, 0.06, 1.5, 6), M(METAL), 0, 0.85), beam); g.userData.beam = beam; return g;
  } },
  { id: 'spinner', cat: 'Toán', name: 'Vòng xoay', color: '#8b5cf6', kw: 'ngau nhien chac chan co the', b: () => { const cols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']; const w = new THREE.Group(); cols.forEach((c, i) => { const m = mesh(new THREE.CylinderGeometry(1, 1, 0.1, 8, 1, false, (i / 6) * Math.PI * 2, Math.PI / 3), M(c)); w.add(m); }); w.rotation.x = Math.PI / 2; const r = grp(w); r.name = 'rotor'; r.position.y = 1.3; const arrow = mesh(cone(0.12, 0.35, 4), M('#1b2a47'), 0, 2.45, 0.1); arrow.rotation.z = Math.PI; return grp(r, arrow, mesh(cyl(0.05, 0.05, 1.3, 5), M(DARK), 0, 0.65, -0.1)); } },
  { id: 'grid', cat: 'Toán', name: 'Lưới ô vuông', color: '#93c5fd', kw: 'dien tich hinh vuong chu nhat cm', b: ({ color }) => { const g = grp(mesh(box(3, 0.04, 2), M('#ffffff'), 0, 0.02)); for (let i = 0; i <= 15; i++) g.add(mesh(box(0.012, 0.05, 2), M(color), -1.5 + i * 0.2, 0.03)); for (let j = 0; j <= 10; j++) g.add(mesh(box(3, 0.05, 0.012), M(color), 0, 0.03, -1 + j * 0.2)); return g; } },
  { id: 'fraction', cat: 'Toán', name: 'Băng giấy phân số', color: '#f97316', kw: 'mot phan may chia phan', b: ({ color }) => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) g.add(mesh(box(0.68, 0.08, 0.5), M(i === 0 ? color : '#fde68a'), -1.05 + i * 0.7, 0.04, 0)); return g; } },
  { id: 'tangram', cat: 'Toán', name: 'Bộ Tangram', color: '#ef4444', fixed: true, kw: 'lap ghep hinh phang', b: () => {
    const tri = (pts: number[][], c: string) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false }), M(c)); m.rotation.x = -Math.PI / 2; return m; };
    return grp(tri([[-1, -1], [1, -1], [0, 0]], '#ef4444'), tri([[-1, -1], [0, 0], [-1, 1]], '#3b82f6'), tri([[1, -1], [1, 0], [0.5, -0.5]], '#22c55e'), tri([[0, 0], [0.5, -0.5], [0.5, 0.5]], '#f59e0b'), tri([[-1, 1], [0, 1], [-0.5, 0.5]], '#8b5cf6'), tri([[0, 0], [0.5, 0.5], [0, 1], [-0.5, 0.5]], '#ec4899'), tri([[1, 0], [1, 1], [0, 1], [0.5, 0.5]], '#14b8a6'));
  } },
  // ---------- Kỹ thuật & công nghệ ----------
  { id: 'battery', cat: 'Kỹ thuật', name: 'Pin', color: '#16a34a', kw: 'mach dien nguon', b: ({ color }) => { const b = mesh(cyl(0.25, 0.25, 1, 16), M(color), 0, 0.25, 0); b.rotation.z = Math.PI / 2; const t = mesh(cyl(0.08, 0.08, 0.12, 10), M(METAL), 0.56, 0.25, 0); t.rotation.z = Math.PI / 2; const n = mesh(cyl(0.26, 0.26, 0.25, 16), M('#111827'), -0.38, 0.25, 0); n.rotation.z = Math.PI / 2; return grp(b, t, n); } },
  { id: 'switch', cat: 'Kỹ thuật', name: 'Công tắc', color: '#f8fafc', onoff: true, kw: 'mach dien', b: ({ color, on }) => { const lever = mesh(box(0.6, 0.06, 0.12), M('#ef4444'), 0, 0.3, 0); lever.rotation.z = on ? 0 : 0.5; lever.position.x = on ? 0 : -0.05; return grp(mesh(box(0.9, 0.2, 0.5), M(color), 0, 0.1), mesh(cyl(0.06, 0.06, 0.2, 8), M(METAL), -0.3, 0.25, 0), mesh(cyl(0.06, 0.06, 0.2, 8), M(METAL), 0.3, 0.25, 0), lever); } },
  { id: 'bulb', cat: 'Kỹ thuật', name: 'Bóng đèn', color: '#fde68a', onoff: true, kw: 'den led mach dien', b: ({ color, on }) => { const m = new THREE.MeshStandardMaterial({ color: on ? '#fff7cc' : color, emissive: on ? '#ffd23f' : '#000000', emissiveIntensity: on ? 1.3 : 0, transparent: true, opacity: 0.92, roughness: 0.3 }); const g = grp(mesh(cyl(0.35, 0.35, 0.2, 12), M('#94a3b8'), 0, 0.1), mesh(cyl(0.18, 0.2, 0.3, 12), M(METAL), 0, 0.35), mesh(sph(0.42, 16, 12), m, 0, 0.85)); if (on) g.add(glow(2.4).translateY(0.85)); g.userData.bulb = m; return g; } },
  { id: 'motor', cat: 'Kỹ thuật', name: 'Động cơ điện', color: '#64748b', kw: 'mo to', b: ({ color }) => { const b = mesh(cyl(0.35, 0.35, 0.8, 16), M(color), 0, 0.4, 0); b.rotation.z = Math.PI / 2; const s = mesh(cyl(0.04, 0.04, 0.5, 6), M(METAL), 0.6, 0.4, 0); s.rotation.z = Math.PI / 2; return grp(b, s); } },
  { id: 'fan', cat: 'Kỹ thuật', name: 'Cánh quạt', color: '#3b82f6', kw: 'quat', y: 0.8, b: ({ color }) => { const r = new THREE.Group(); for (let i = 0; i < 3; i++) { const bl = mesh(box(0.18, 0.75, 0.04), M(color), 0, 0.4, 0); const p = grp(bl); p.rotation.z = (i / 3) * Math.PI * 2; r.add(p); } r.add(mesh(sph(0.1, 8, 6), M(DARK))); r.name = 'rotor'; r.rotation.y = Math.PI / 2; return grp(grp(r)); } },
  { id: 'pinwheel', cat: 'Kỹ thuật', name: 'Chong chóng', color: '#ec4899', kw: 'gio do choi', b: ({ color }) => { const r = new THREE.Group(); const cols = [color, '#3b82f6', '#facc15', '#22c55e']; cols.forEach((c, i) => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0.6, 0.05); s.lineTo(0.05, 0.6); s.lineTo(0, 0); const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }), M(c)); m.rotation.z = (i * Math.PI) / 2; r.add(m); }); r.name = 'rotor'; r.position.set(0, 2, 0.05); return grp(mesh(cyl(0.04, 0.04, 2, 6), M(WOOD), 0, 1, 0), r); } },
  { id: 'turbine', cat: 'Kỹ thuật', name: 'Máy phát điện gió', color: '#f8fafc', split: true, kw: 'nang luong gio', b: ({ color }) => {
    const tower = mesh(cyl(0.1, 0.22, 4, 10), M(color), 0, 2, 0);
    const nacelle = mesh(box(0.7, 0.35, 0.35), M('#e2e8f0'), 0, 4.15, 0);
    const r = new THREE.Group(); for (let i = 0; i < 3; i++) { const p = grp(mesh(box(0.14, 1.6, 0.05), M(color), 0, 0.85, 0)); p.rotation.x = (i / 3) * Math.PI * 2; r.add(p); }
    r.add(mesh(sph(0.16, 10, 8), M('#cbd5e1'))); r.rotation.y = Math.PI / 2; const rotor = grp(r); rotor.name = 'rotor'; rotor.position.set(0.42, 4.15, 0);
    const base = mesh(cyl(0.5, 0.6, 0.2, 12), M('#94a3b8'), 0, 0.1, 0);
    return withParts(grp(base, tower, nacelle, rotor), [[base, 0, -0.4, 0], [tower, 0, 0, 0], [nacelle, 0, 0.8, 0], [rotor, 1.4, 0.8, 0]]);
  } },
  { id: 'sailboat', cat: 'Kỹ thuật', name: 'Thuyền buồm', color: '#f8fafc', split: true, kw: 'gio nang luong', b: ({ color }) => { const h = mesh(cyl(0.5, 0.25, 0.4, 8), M('#b45309'), 0, 0.2, 0); h.scale.set(2.2, 1, 0.8); const mast = mesh(cyl(0.05, 0.05, 2.2, 6), M(TRUNK), 0, 1.3, 0); const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(0, 1.8); s.lineTo(1.1, 0); s.lineTo(0, 0); const sail = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }), M(color), 0.06, 0.45, 0); return withParts(grp(h, mast, sail), [[h, 0, -0.5, 0], [mast, 0, 0.4, -0.8], [sail, 0, 0.6, 0.9]]); } },
  { id: 'fan-car', cat: 'Kỹ thuật', name: 'Xe cánh quạt', color: '#f59e0b', split: true, kw: 'xe o to chay bang pin', b: ({ color }) => {
    const body = mesh(box(1.6, 0.2, 0.8), M(color), 0, 0.35, 0);
    const wheels = grp(...[[-0.55, 0.45], [0.55, 0.45], [-0.55, -0.45], [0.55, -0.45]].map(([x, z]) => { const w = mesh(cyl(0.22, 0.22, 0.1, 14), M('#111827'), x, 0.22, z); w.rotation.x = Math.PI / 2; return w; }));
    const batt = mesh(box(0.5, 0.25, 0.35), M('#16a34a'), -0.3, 0.58, 0); const mot = mesh(cyl(0.15, 0.15, 0.4, 10), M('#64748b'), 0.5, 0.75, 0); mot.rotation.z = Math.PI / 2;
    const r = new THREE.Group(); for (let i = 0; i < 2; i++) { const p = grp(mesh(box(0.1, 0.9, 0.03), M('#3b82f6'), 0, 0, 0)); p.rotation.x = (i * Math.PI) / 2; r.add(p); } const rotor = grp(r); rotor.name = 'rotor'; rotor.position.set(0.78, 0.75, 0);
    return withParts(grp(body, wheels, batt, mot, rotor), [[wheels, 0, -0.4, 0.8], [batt, -0.8, 0.8, 0], [mot, 0.4, 0.8, 0], [rotor, 1.1, 0.8, 0]]);
  } },
  { id: 'mini-house', cat: 'Kỹ thuật', name: 'Ngôi nhà tiện ích', color: '#fef3c7', split: true, kw: 'nang luong mat troi pin den', b: ({ color }) => { const walls = mesh(box(2, 1.3, 1.6), M(color), 0, 0.65, 0); const roof = mesh(cone(1.5, 0.9, 4), M('#2457c5'), 0, 1.75, 0); roof.rotation.y = Math.PI / 4; const panel = mesh(box(0.9, 0.05, 0.6), M('#1e3a8a', { metalness: 0.4, roughness: 0.3 }), 0.4, 1.9, 0.35); panel.rotation.x = -0.5; const door = mesh(box(0.45, 0.8, 0.05), M(TRUNK), 0, 0.4, 0.82); return withParts(grp(walls, roof, panel, door), [[roof, 0, 1, 0], [panel, 0.6, 1.6, 0.6], [door, 0, 0, 0.8]]); } },
  { id: 'computer', cat: 'Kỹ thuật', name: 'Máy tính', color: '#1f2937', kw: 'tin hoc man hinh ban phim', b: ({ color }) => grp(mesh(box(1.6, 1, 0.08), [M(color), M(color), M(color), M(color), M('#60a5fa', { emissive: '#1d4ed8', emissiveIntensity: 0.3 }), M(color)], 0, 1.2, 0), mesh(box(0.15, 0.5, 0.15), M(color), 0, 0.5, -0.05), mesh(box(0.7, 0.05, 0.4), M(color), 0, 0.25, -0.05), mesh(box(1.4, 0.06, 0.45), M('#475569'), 0, 0.03, 0.55)) },
  { id: 'tv', cat: 'Kỹ thuật', name: 'Ti vi', color: '#111827', kw: 'may thu hinh', b: ({ color }) => grp(mesh(box(2.2, 1.3, 0.1), [M(color), M(color), M(color), M(color), M('#38bdf8', { emissive: '#0369a1', emissiveIntensity: 0.3 }), M(color)], 0, 1.2, 0), mesh(box(0.8, 0.06, 0.4), M(color), 0, 0.03, 0), mesh(box(0.1, 0.5, 0.1), M(color), 0, 0.3, 0)) },
  { id: 'calculator', cat: 'Kỹ thuật', name: 'Máy tính cầm tay', color: '#334155', kw: 'may tinh bo tui', b: ({ color }) => { const g = grp(mesh(box(0.9, 0.1, 1.4), M(color), 0, 0.05), mesh(box(0.7, 0.02, 0.3), M('#a7f3d0'), 0, 0.11, -0.45)); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.add(mesh(box(0.13, 0.04, 0.13), M(j === 3 ? '#f97316' : '#e2e8f0'), -0.27 + j * 0.18, 0.12, -0.05 + i * 0.2)); return g; } },
  { id: 'speaker', cat: 'Kỹ thuật', name: 'Loa / nhạc cụ', color: '#7c3aed', kw: 'am thanh tieng on', b: ({ color }) => { const c = mesh(cyl(0.45, 0.45, 0.2, 16), M('#111827'), 0, 0.9, 0.36); c.rotation.x = Math.PI / 2; return grp(mesh(box(1, 1.6, 0.7), M(color), 0, 0.8, 0), c); } },
  { id: 'cup', cat: 'Kỹ thuật', name: 'Cốc nước nóng', color: '#e0f2fe', kw: 'dan nhiet thia nuoc', b: ({ color }) => grp(mesh(cyl(0.45, 0.38, 1, 16, ), M(color, { transparent: true, opacity: 0.55, roughness: 0.1 }), 0, 0.5), mesh(cyl(0.42, 0.36, 0.7, 16), M('#7dd3fc', { transparent: true, opacity: 0.8 }), 0, 0.38)) },
  { id: 'spoon', cat: 'Kỹ thuật', name: 'Thìa', color: '#cbd5e1', kw: 'dan nhiet kim loai go nhua', b: ({ color }) => { const h = mesh(cyl(0.04, 0.05, 1.5, 6), M(color, { metalness: 0.6, roughness: 0.3 }), 0, 0.75, 0); h.rotation.z = 0.25; const b = mesh(sph(0.14, 8, 6), M(color, { metalness: 0.6, roughness: 0.3 }), 0.19, 0.05, 0); b.scale.set(1, 0.4, 0.7); return grp(h, b); } },
  { id: 'pot', cat: 'Kỹ thuật', name: 'Nồi đun', color: '#94a3b8', kw: 'bay hoi tach muoi dun', b: ({ color }) => grp(mesh(cyl(0.7, 0.6, 0.7, 16), M(color, { metalness: 0.5, roughness: 0.4 }), 0, 0.55), mesh(cyl(0.65, 0.65, 0.05, 16), M('#7dd3fc'), 0, 0.8), mesh(box(1.8, 0.06, 0.1), M(DARK), 0, 0.85, 0), mesh(cyl(0.5, 0.6, 0.2, 12), M('#334155'), 0, 0.1)) },
  { id: 'jar', cat: 'Kỹ thuật', name: 'Lọ thủy tinh', color: '#e0f2fe', kw: 'dung dich hon hop sua chua vi khuan', b: ({ color }) => grp(mesh(cyl(0.4, 0.4, 0.9, 16), M(color, { transparent: true, opacity: 0.5, roughness: 0.1 }), 0, 0.45), mesh(cyl(0.38, 0.38, 0.5, 16), M('#fef9c3', { transparent: true, opacity: 0.85 }), 0, 0.26), mesh(cyl(0.42, 0.42, 0.12, 16), M('#ef4444'), 0, 0.96)) },
  { id: 'materials', cat: 'Kỹ thuật', name: 'Vật liệu (bìa, ống hút…)', color: '#f59e0b', kw: 'bia que kem ong hut giay', b: ({ color }) => grp(mesh(box(1.2, 0.04, 0.8), M('#d6b98c'), 0, 0.02), ...[0, 1, 2, 3].map((i) => mesh(cyl(0.04, 0.04, 1, 6), M(['#ef4444', '#22c55e', '#3b82f6', color][i]), -0.3 + i * 0.2, 0.08, 0).rotateZ(Math.PI / 2)), ...[0, 1, 2].map((i) => mesh(box(0.12, 0.02, 0.9), M('#fcd9a8'), 0.45, 0.06 + i * 0.03, 0))) },
  // ---------- Bảng & chữ ----------
  { id: 'sign', cat: 'Bảng & chữ', name: 'Bảng chữ', color: '#1f6b45', text: true, kw: 'tieu de bang', b: ({ color, name }) => { const board = textBox(2.4, 1.2, 0.08, '#c69a5b', textTexture(name, { bg: color, border: '#c69a5b' })); board.position.y = 1.6; return grp(mesh(cyl(0.06, 0.06, 1.2, 5), M(TRUNK), 0, 0.6), board); } },
  { id: 'label', cat: 'Bảng & chữ', name: 'Nhãn chữ nổi', color: '#2457c5', text: true, y: 2, kw: 'chu tieu de', b: ({ color, name }) => { const t = textTexture(name, { bg: color, w: 512, h: 128, size: 56 }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t })); s.scale.set(3, 0.75, 1); return grp(s); } },
];

// Mô hình Kenney (khu phố, giao thông, nhân vật) xếp sau đồ vật tự dựng
ASSETS.push(...MODEL_ASSETS);

export const ASSET_BY_ID: Record<string, Asset> = Object.fromEntries(ASSETS.map((a) => [a.id, a]));
export const ASSET_CATS = [...new Set(ASSETS.map((a) => a.cat))];

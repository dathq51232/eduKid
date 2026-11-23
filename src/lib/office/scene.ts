// Văn phòng ảo — dựng "sa bàn văn phòng" cho sân khấu Stage3D (src/lib/lesson3d/engine.ts, không sửa engine).
// Chỉ tải phía trình duyệt bằng import động (kéo theo three.js). Đồ vật riêng mang mã "office-*", đăng ký vào ASSET_BY_ID
// khi mở trang và gỡ khi rời trang; không nằm trong LIB_ASSETS nên thư viện Xưởng bài giảng 3D không thấy.
// Không import roles.ts ở đây (chỉ kiểu): dữ liệu vị trí do trang máy chủ truyền xuống.
import * as THREE from 'three';
import { ASSET_BY_ID, type Asset } from '@/lib/lesson3d/assets';
import type { Lesson3D, Obj3D } from '@/lib/lesson3d/types';
import type { OfficeDept, OfficeRoleView } from './roles';

export const DEPT_COLOR: Record<OfficeDept, string> = { 'lanh-dao': '#ffc83d', cntt: '#2457c5', marketing: '#f97316' };

const M = (c: string, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.8, ...o });
function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o;
}

const texLoader = typeof window !== 'undefined' ? new THREE.TextureLoader() : null;
const texCache = new Map<string, THREE.Texture>();
function tex(url: string) {
  let t = texCache.get(url);
  if (!t && texLoader) { t = texLoader.load(url); t.colorSpace = THREE.SRGBColorSpace; texCache.set(url, t); }
  return t ?? null;
}

/** Bàn làm việc: mặt gỗ sáng, 4 chân, tấm che trước mang màu của phòng. Cao 1, rộng 2,4, sâu 1,3 */
function buildDesk(color: string) {
  const g = new THREE.Group();
  const wood = M('#e7c99a'), leg = M('#64748b');
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.1, 1.3), wood, 0, 0.95, 0));
  [[-1.1, -0.55], [1.1, -0.55], [-1.1, 0.55], [1.1, 0.55]].forEach(([x, z]) => g.add(mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), leg, x, 0.45, z)));
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.55, 0.05), M(color), 0, 0.6, 0.6));
  return g;
}

/** Bảng biểu tượng nhỏ trên chân đứng (ảnh hình 3D Fluent), mặt quay về phía trước (+z) */
function buildIconBoard(url: string, color: string) {
  const g = new THREE.Group();
  const t = tex(url);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), t ? new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9 }) : M('#e2e8f0'));
  pic.position.set(0, 0.95, 0.035);
  g.add(pic);
  g.add(mesh(new THREE.BoxGeometry(0.96, 0.96, 0.05), M('#ffffff'), 0, 0.95, 0));
  g.add(mesh(new THREE.BoxGeometry(1.02, 1.02, 0.03), M(color), 0, 0.95, -0.03));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), M('#78716c'), 0, 0.25, -0.02));
  return g;
}

const ICON_URL = (icon: string) => `/emoji/f3d/${icon}.webp`;
const iconAssetId = (icon: string) => `office-icon-${icon}`;
let registered: string[] = [];

/** Đăng ký đồ vật riêng của văn phòng (gọi khi mở trang) */
export function registerOfficeAssets(roles: OfficeRoleView[]) {
  const list: Asset[] = [
    { id: 'office-desk', cat: 'Văn phòng', name: 'Bàn làm việc', color: '#2457c5', b: ({ color }) => buildDesk(color) },
    { id: 'office-milo', cat: 'Văn phòng', name: 'Milo', color: '#ffc83d', b: ({ color }) => buildIconBoard('/brand/milo-sm.webp', color) },
    ...[...new Set(roles.map((r) => r.icon))].map((icon): Asset => ({ id: iconAssetId(icon), cat: 'Văn phòng', name: icon, color: '#2457c5', b: ({ color }) => buildIconBoard(ICON_URL(icon), color) })),
  ];
  list.forEach((a) => { ASSET_BY_ID[a.id] = a; });
  registered = list.map((a) => a.id);
}

/** Gỡ đồ vật văn phòng khỏi ASSET_BY_ID (gọi khi rời trang) */
export function unregisterOfficeAssets() {
  registered.forEach((id) => { delete ASSET_BY_ID[id]; });
  registered = [];
}

const NO_SPOT = { on: false, title: '', text: '' };
const NO_FX = { type: '' as const, speed: 1 };
function obj(id: string, type: string, x: number, z: number, more: Partial<Obj3D> = {}): Obj3D {
  return { id, type, x, y: 0, z, ry: 0, s: 1, color: ASSET_BY_ID[type]?.color ?? '#ffffff', name: ASSET_BY_ID[type]?.name ?? '', spot: NO_SPOT, fx: NO_FX, anim: 'none', ...more };
}

/** Mã đồ vật dạng "<vai>:desk|pc|bot|icon" → tên vai */
export const roleOfObject = (objId: string) => objId.split(':')[0];

/** Dựng bài 3D "văn phòng" từ danh sách vị trí: bàn, máy tính, người / rô-bốt, bảng biểu tượng (có ghim) */
export function buildOfficeLesson(roles: OfficeRoleView[]): Lesson3D {
  const objects: Obj3D[] = [];
  roles.forEach((r) => {
    const { x, z } = r.seat;
    const color = DEPT_COLOR[r.dept];
    const boss = !r.agent;
    const s = boss ? 1.25 : 1;
    const top = 0.98 * s; // mặt bàn
    objects.push(obj(`${r.id}:desk`, 'office-desk', x, z, { color, s }));
    // nhân vật đứng sau bàn, quay mặt về phía trước (+z, phía camera); đủ cao để thân lộ trên mặt bàn
    objects.push(boss
      ? obj(`${r.id}:bot`, 'adult', x, z - 1.3, { color: '#1d47a8', s: 0.95 })
      : obj(`${r.id}:bot`, 'k-character', x, z - 1.35, { s: 1.45 }));
    // máy tính nhỏ ở góc trái phía sau, màn hình xoay chéo về nhân vật: không nằm giữa nhân vật và camera
    objects.push(obj(`${r.id}:pc`, 'computer', x - 0.8 * s, z - 0.15 * s, { y: top, s: 0.42, ry: Math.atan2(0.8, -0.85) }));
    // bảng biểu tượng nhỏ ở góc phải phía trước (mang ghim, nhãn ngắn)
    objects.push(obj(`${r.id}:icon`, iconAssetId(r.icon), x + 0.85 * s, z + 0.4 * s, { y: top, color, s: 0.45, spot: { on: true, title: r.short, text: '' } }));
  });
  const boss = roles.find((r) => !r.agent);
  if (boss) {
    const { x, z } = boss.seat;
    objects.push(obj('truong-phong:milo', 'office-milo', x - 1.3, z + 0.45, { y: 1.22, s: 0.5 }));
    objects.push(obj('truong-phong:lich', 'calendar', x + 0.25, z + 0.45, { y: 1.22, s: 0.3, name: 'Duyệt' }));
  }
  objects.push(obj('khu:cntt', 'label', -6, -7.2, { y: 3, color: DEPT_COLOR.cntt, name: 'Phòng CNTT' }));
  objects.push(obj('khu:mkt', 'label', 6, -7.2, { y: 3, color: DEPT_COLOR.marketing, name: 'Phòng Marketing' }));
  [[9.3, -0.6], [-10.2, 7.2], [10.2, 7.2], [-10.2, -7.2], [10.2, -7.2]].forEach(([x, z], i) => objects.push(obj(`cay:${i}`, 'pot-plant', x, z, { s: 0.9 })));
  return { v: 1, title: 'Văn phòng ảo', grade: 1, subject: '', base: 'desk', objects: objects.filter((o) => ASSET_BY_ID[o.type]), links: [], controls: [], scenes: [], quiz: [] };
}

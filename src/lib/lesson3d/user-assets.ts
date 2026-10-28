// Vật thể giáo viên tự tải lên (kho của tôi — migration 0043) dùng như đồ vật trong thư viện 3D.
// Mã đồ vật: "u-<id>". Mô hình .glb đã chuẩn hoá lúc tải lên; khi dựng vẫn đưa lại về 1 ô sa bàn cho chắc.
// Ảnh: dựng thành tấm tranh có khung và chân đứng.
import * as THREE from 'three';
import { ASSET_BY_ID, type Asset } from './assets';
import { MODEL_EVENT, loadModelUrl } from './models';
import { UNIT, normalizeObject } from './user-model';
import type { TeacherAsset } from '@/lib/assets/client';

export const USER_CAT = 'Vật thể của tôi';
export const userAssetId = (id: string) => `u-${id}`;

function placeholder(h = 1.5) {
  const ph = new THREE.Mesh(new THREE.BoxGeometry(UNIT * 0.6, h, UNIT * 0.6), new THREE.MeshStandardMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.35 }));
  ph.position.y = h / 2;
  return ph;
}

function buildModel(a: TeacherAsset): THREE.Group {
  const g = new THREE.Group();
  const ph = placeholder(); g.add(ph);
  if (typeof window === 'undefined' || !a.url) return g;
  void loadModelUrl(`user/${a.id}`, a.url).then((src) => {
    const c = normalizeObject(src.clone(true));
    c.position.y = 0.02;
    const id = g.userData.id as string | undefined; const ghost = !!g.userData.ghost;
    c.traverse((m) => {
      const mm = m as THREE.Mesh;
      if (mm.isMesh) {
        mm.material = Array.isArray(mm.material) ? mm.material.map((x) => x.clone()) : mm.material.clone();
        if (ghost) { (mm.material as THREE.Material).transparent = true; (mm.material as THREE.Material).opacity = 0.5; mm.raycast = () => {}; }
      }
      if (id) m.userData.id = id;
    });
    g.remove(ph); ph.geometry.dispose(); g.add(c);
    window.dispatchEvent(new Event(MODEL_EVENT));
  }).catch(() => { (ph.material as THREE.MeshStandardMaterial).color.set('#fca5a5'); });
  return g;
}

const texLoader = typeof window !== 'undefined' ? new THREE.TextureLoader() : null;
const texCache = new Map<string, THREE.Texture>();

/** Tranh đứng: cạnh dài 2,4 đơn vị, khung gỗ, hai chân */
function buildBoard(a: TeacherAsset, color: string): THREE.Group {
  const g = new THREE.Group();
  const w0 = Number(a.meta.w) || 4, h0 = Number(a.meta.h) || 3;
  const L = 2.4, k = L / Math.max(w0, h0);
  const w = w0 * k, h = h0 * k, lift = 0.5;
  let tex = texCache.get(a.id);
  if (!tex && texLoader && a.url) { tex = texLoader.load(a.url); tex.colorSpace = THREE.SRGBColorSpace; texCache.set(a.id, tex); }
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }) : new THREE.MeshStandardMaterial({ color: '#e2e8f0' }));
  pic.position.set(0, lift + h / 2, 0.035);
  const frameM = new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true });
  const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.06), frameM);
  back.position.set(0, lift + h / 2, 0);
  const legM = new THREE.MeshStandardMaterial({ color: '#78716c', flatShading: true });
  [-1, 1].forEach((sx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, lift + h * 0.55, 0.08), legM);
    leg.position.set(sx * (w * 0.35), (lift + h * 0.55) / 2, -0.12); leg.rotation.x = -0.12; g.add(leg);
  });
  [pic, back].forEach((m) => { m.castShadow = true; m.receiveShadow = true; g.add(m); });
  return g;
}

/** Thêm / làm mới vật thể của tôi vào thư viện (gọi lại khi có file mới hoặc đường dẫn ký mới) */
export function registerUserAssets(list: TeacherAsset[]): Asset[] {
  return list.filter((a) => a.kind === 'model' || a.kind === 'image').map((a) => {
    const asset: Asset = a.kind === 'model'
      ? { id: userAssetId(a.id), cat: USER_CAT, name: a.name || 'Mô hình của tôi', color: '#ffffff', fixed: true, kw: 'cua toi tai len', thumb: a.thumb ?? undefined, b: () => buildModel(a) }
      : { id: userAssetId(a.id), cat: USER_CAT, name: a.name || 'Tranh của tôi', color: '#b45309', kw: 'tranh anh cua toi tai len', thumb: a.thumb ?? undefined, b: (o) => buildBoard(a, o.color) };
    ASSET_BY_ID[asset.id] = asset;
    return asset;
  });
}

export function unregisterUserAsset(id: string) { delete ASSET_BY_ID[userAssetId(id)]; }

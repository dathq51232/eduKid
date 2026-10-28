// Mô hình 3D có sẵn của Kenney (kenney.nl) và Quaternius (quaternius.com), giấy phép CC0: dùng tự do, không bắt buộc ghi tên.
// File .glb đã nén (meshopt + ảnh WebP 256px) nằm ở public/models/<kenney|quaternius>/, mỗi file khoảng 3–40 KB.
// Chỉ tải khi đồ vật xuất hiện trên sa bàn (lần đầu), sau đó dùng lại từ bộ nhớ; lúc đang tải hiện khối mờ giữ chỗ.
import * as THREE from 'three';
import type { Asset } from './assets';
import { EXTRA_MODELS } from './model-list';

export const MODEL_ROOT = '/models/';
/** Sân khấu nghe sự kiện này để vẽ lại đường nối / ghim khi mô hình vừa tải xong */
export const MODEL_EVENT = 'l3d-model-loaded';

type Def = { dir?: string; file: string; name: string; cat: string; s: number; box: [number, number, number]; kw?: string; y?: number };

const CITY = 'Khu phố';
const ROAD = 'Giao thông'; // xếp chung nhóm với đường, đèn, biển báo tự dựng
const GAME = 'Nhân vật & trò chơi';
const ROAD_KW = 'duong pho giao thong an toan di bo xe';

// s: hệ số phóng to (ô đường của Kenney rộng 1 → 3 trên sa bàn); box: kích thước gốc (rộng, cao, sâu)
const DEFS: Def[] = [
  { file: 'road-straight', name: 'Đường thẳng', cat: ROAD, s: 3, box: [1, 0.05, 1], kw: ROAD_KW },
  { file: 'road-corner', name: 'Đường cong', cat: ROAD, s: 3, box: [1, 0.06, 1], kw: `${ROAD_KW} re khuc cua` },
  { file: 'road-split', name: 'Ngã ba', cat: ROAD, s: 3, box: [1, 0.05, 1], kw: ROAD_KW },
  { file: 'road-intersection', name: 'Ngã tư', cat: ROAD, s: 3, box: [1, 0.05, 1], kw: `${ROAD_KW} giao lo` },
  { file: 'road-straight-lightposts', name: 'Đường có cột đèn', cat: ROAD, s: 3, box: [1, 0.55, 1], kw: `${ROAD_KW} den duong` },
  { file: 'pavement', name: 'Vỉa hè', cat: CITY, s: 3, box: [1, 0.06, 1], kw: 'via he di bo san' },
  { file: 'pavement-fountain', name: 'Đài phun nước', cat: CITY, s: 3, box: [1, 0.54, 1], kw: 'cong vien quang truong nuoc' },
  { file: 'grass', name: 'Ô cỏ', cat: CITY, s: 3, box: [1, 0.06, 1], kw: 'co bai co cong vien' },
  { file: 'grass-trees', name: 'Vườn cây', cat: CITY, s: 3, box: [1, 0.64, 1], kw: 'cay xanh cong vien' },
  { file: 'grass-trees-tall', name: 'Vườn cây cao', cat: CITY, s: 3, box: [1.07, 0.76, 1.01], kw: 'cay xanh cong vien' },
  { file: 'building-small-a', name: 'Nhà hai tầng', cat: CITY, s: 3, box: [1, 0.95, 1], kw: 'nha o khu pho' },
  { file: 'building-small-b', name: 'Nhà ba tầng', cat: CITY, s: 3, box: [1, 1.63, 1], kw: 'nha o khu pho' },
  { file: 'building-small-c', name: 'Nhà cao tầng', cat: CITY, s: 3, box: [1, 1.75, 1], kw: 'nha o khu pho chung cu' },
  { file: 'building-small-d', name: 'Cửa hàng', cat: CITY, s: 3, box: [1, 1, 1.05], kw: 'nha cua hang cho khu pho' },
  { file: 'building-garage', name: 'Nhà để xe', cat: CITY, s: 3, box: [1, 0.55, 1], kw: 'gara o to' },
  { file: 'character', name: 'Rô-bốt', cat: GAME, s: 1.4, box: [1.2, 1.1, 0.64], kw: 'robot nhan vat may' },
  { file: 'flag', name: 'Cờ đích', cat: GAME, s: 1.6, box: [0.2, 1.24, 0.69], kw: 'co ve dich' },
  { file: 'coin', name: 'Đồng xu', cat: GAME, s: 1.5, box: [0.42, 0.42, 0.17], kw: 'tien thuong diem' },
  { file: 'brick', name: 'Khối gạch', cat: GAME, s: 1, box: [1, 1, 1], kw: 'gach' },
  { file: 'block-coin', name: 'Hộp đồng xu', cat: GAME, s: 1, box: [1.08, 1, 1.08], kw: 'hop cau hoi qua' },
  { file: 'platform', name: 'Bục nhảy', cat: GAME, s: 1.2, box: [2, 0.55, 2], kw: 'buc dung san' },
];

const cache = new Map<string, Promise<THREE.Group>>();
type GltfLoader = { load: (url: string) => Promise<THREE.Group>; parse: (buf: ArrayBuffer) => Promise<THREE.Group> };
let loader: Promise<GltfLoader> | null = null;

export function getLoader(): Promise<GltfLoader> {
  loader ??= Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js'),
  ]).then(([{ GLTFLoader }, { MeshoptDecoder }]) => {
    const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder);
    return {
      load: async (url: string) => (await l.loadAsync(url)).scene,
      parse: async (buf: ArrayBuffer) => (await l.parseAsync(buf, '')).scene,
    };
  });
  return loader;
}

/** Tải mô hình từ đường dẫn đầy đủ (vật thể giáo viên tự tải lên), nhớ theo khoá riêng vì đường dẫn ký đổi mỗi phiên */
export function loadModelUrl(key: string, url: string): Promise<THREE.Group> {
  let p = cache.get(key);
  if (!p) {
    p = getLoader().then((l) => l.load(url)).then((g) => {
      g.traverse((m) => { const mm = m as THREE.Mesh; if (mm.isMesh) { mm.castShadow = true; mm.receiveShadow = true; } });
      return g;
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

/** Tải (một lần) mô hình gốc; mỗi đồ vật dùng bản sao */
export function loadModel(path: string): Promise<THREE.Group> {
  let p = cache.get(path);
  if (!p) {
    p = getLoader().then((l) => l.load(`${MODEL_ROOT}${path}.glb`)).then((g) => {
      g.traverse((m) => {
        const mm = m as THREE.Mesh; if (!mm.isMesh) return;
        mm.castShadow = true; mm.receiveShadow = true;
        // vật liệu hai mặt của Kenney gây sọc bóng (shadow acne): chỉ vẽ mặt ngoài — trừ lá cây / cánh hoa dạng tấm cắt viền
        (Array.isArray(mm.material) ? mm.material : [mm.material]).forEach((x) => { if (!x.alphaTest && !x.transparent) x.side = THREE.FrontSide; });
      });
      return g;
    });
    p.catch(() => cache.delete(path)); // lỗi mạng: lần sau thử lại
    cache.set(path, p);
  }
  return p;
}

function build(d: Def): THREE.Group {
  const g = new THREE.Group();
  const [w, h, z] = d.box;
  const ph = new THREE.Mesh(new THREE.BoxGeometry(w * d.s, Math.max(h, 0.05) * d.s, z * d.s), new THREE.MeshStandardMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.35 }));
  ph.position.y = (Math.max(h, 0.05) * d.s) / 2; g.add(ph);
  if (typeof window === 'undefined') return g;
  void loadModel(`${d.dir ?? 'kenney'}/${d.file}`).then((src) => {
    const c = src.clone(true); c.scale.setScalar(d.s);
    c.position.y = 0.02; // nhích khỏi mặt sa bàn, tránh nhấp nháy (z-fighting) ở mặt đường
    const id = g.userData.id as string | undefined; const ghost = !!g.userData.ghost;
    c.traverse((m) => {
      const mm = m as THREE.Mesh;
      if (mm.isMesh) {
        // vật liệu riêng cho từng đồ vật (hiệu ứng nóng lên, bóng mờ khi đặt không ảnh hưởng đồ vật khác)
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

const ALL: Def[] = [
  ...DEFS,
  ...EXTRA_MODELS.map(([dir, file, name, cat, s, box, kw, y]) => ({ dir, file, name, cat, s, box, kw, y })),
];

export const MODEL_ASSETS: Asset[] = ALL.map((d) => {
  const dir = d.dir ?? 'kenney';
  return {
    id: `${dir === 'kenney' ? 'k' : 'q'}-${d.file}`, cat: d.cat, name: d.name, color: '#ffffff', fixed: true, kw: `${d.kw ?? ''} ${dir}`,
    y: d.y, thumb: `${MODEL_ROOT}${dir}/thumbs/${d.file}.webp`, b: () => build(d),
  };
});

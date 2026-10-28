// Chuẩn hoá mô hình 3D giáo viên tải lên (.glb) ngay trên trình duyệt trước khi lưu vào kho:
//  - đo kích thước, thu / phóng để cạnh dài nhất = 1 ô sa bàn (3 đơn vị), đáy chạm sàn, căn giữa ô;
//  - ảnh bề mặt thu về tối đa 1024 px; báo trước nếu mô hình quá nặng cho máy ở trường;
//  - dựng ảnh nhỏ (thumbnail) để hiện trong thư viện.
import * as THREE from 'three';
import { getLoader } from './models';

export const MODEL_ACCEPT = '.glb,model/gltf-binary';
export const MAX_MODEL_INPUT = 40 * 1024 * 1024; // file gốc
export const MAX_MODEL_OUTPUT = 20 * 1024 * 1024; // sau khi chuẩn hoá
export const UNIT = 3; // 1 ô sa bàn
export const TRI_WARN = 100_000;
export const TRI_MAX = 400_000;

export type ModelInfo = { tris: number; meshes: number; size: [number, number, number]; textures: number };

/** Đưa mô hình về khung chuẩn: cạnh dài nhất = target, đáy y = 0, tâm x / z = 0. Trả về nhóm bọc ngoài. */
export function normalizeObject(src: THREE.Object3D, target = UNIT): THREE.Group {
  const wrap = new THREE.Group();
  wrap.add(src);
  wrap.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3());
  const k = target / (Math.max(size.x, size.y, size.z) || 1);
  src.scale.multiplyScalar(k);
  src.position.multiplyScalar(k);
  wrap.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(src);
  const c = b.getCenter(new THREE.Vector3());
  src.position.x -= c.x; src.position.z -= c.z; src.position.y -= b.min.y;
  wrap.updateMatrixWorld(true);
  return wrap;
}

function inspect(o: THREE.Object3D): ModelInfo {
  let tris = 0, meshes = 0; const tex = new Set<THREE.Texture>();
  o.traverse((m) => {
    const mm = m as THREE.Mesh;
    if (!mm.isMesh) return;
    meshes++;
    const g = mm.geometry;
    tris += g.index ? g.index.count / 3 : (g.attributes.position?.count ?? 0) / 3;
    (Array.isArray(mm.material) ? mm.material : [mm.material]).forEach((mat) => {
      Object.values(mat as unknown as Record<string, unknown>).forEach((v) => { if (v && (v as THREE.Texture).isTexture) tex.add(v as THREE.Texture); });
    });
  });
  const s = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
  return { tris: Math.round(tris), meshes, size: [s.x, s.y, s.z], textures: tex.size };
}

function thumbnail(o: THREE.Object3D): Promise<Blob | null> {
  return new Promise((res) => {
    let r: THREE.WebGLRenderer;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch { res(null); return; }
    r.setSize(192, 192); r.setClearColor(0, 0); r.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.5));
    const d = new THREE.DirectionalLight(0xffffff, 1.3); d.position.set(3, 5, 4); sc.add(d);
    const cam = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    sc.add(o);
    const box = new THREE.Box3().setFromObject(o); const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3()).length() || 1;
    cam.position.set(c.x + s * 0.95, c.y + s * 0.6, c.z + s * 1.25); cam.lookAt(c);
    r.render(sc, cam);
    r.domElement.toBlob((b) => { sc.remove(o); r.dispose(); res(b); }, 'image/webp', 0.85);
  });
}

/** Đọc file .glb, kiểm tra, chuẩn hoá và xuất lại .glb gọn */
export async function prepareModel(file: File, onStep?: (t: string) => void): Promise<{ blob: Blob; thumb: Blob | null; info: ModelInfo; warn: string }> {
  if (!/\.glb$/i.test(file.name)) throw new Error('Chỉ nhận file mô hình .glb (xuất từ Blender, SketchUp, Tinkercad… chọn định dạng glTF Binary).');
  if (file.size > MAX_MODEL_INPUT) throw new Error('File mô hình quá lớn (tối đa 40 MB).');
  const buf = await file.arrayBuffer();
  if (new TextDecoder().decode(new Uint8Array(buf, 0, 4)) !== 'glTF') throw new Error('File này không phải .glb hợp lệ.');
  // phần JSON đầu file: kiểm tra phần mở rộng chưa hỗ trợ
  try {
    const len = new DataView(buf).getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, len))) as { extensionsRequired?: string[] };
    if (json.extensionsRequired?.includes('KHR_draco_mesh_compression')) throw new Error('draco');
  } catch (e) {
    if (e instanceof Error && e.message === 'draco') throw new Error('Mô hình nén kiểu Draco chưa hỗ trợ — khi xuất file hãy tắt “Draco compression”.');
  }
  onStep?.('Đang đọc mô hình…');
  const L = await getLoader();
  let scene: THREE.Group;
  try { scene = await L.parse(buf); } catch { throw new Error('Không đọc được mô hình (file hỏng hoặc dùng phần mở rộng lạ).'); }
  const info0 = inspect(scene);
  if (!info0.meshes) throw new Error('File không có hình khối nào.');
  if (info0.tris > TRI_MAX) throw new Error(`Mô hình quá nặng (${info0.tris.toLocaleString('vi-VN')} mặt) — máy ở trường sẽ rất giật. Hãy giảm bớt chi tiết (Decimate) rồi xuất lại, dưới ${TRI_MAX.toLocaleString('vi-VN')} mặt.`);
  onStep?.('Đang chuẩn hoá kích thước…');
  const root = normalizeObject(scene);
  onStep?.('Đang nén mô hình…');
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const out = await new GLTFExporter().parseAsync(root, { binary: true, maxTextureSize: 1024, onlyVisible: true }) as ArrayBuffer;
  if (out.byteLength > MAX_MODEL_OUTPUT) throw new Error('Sau khi nén mô hình vẫn quá 20 MB — hãy giảm ảnh bề mặt hoặc bớt chi tiết.');
  const info = inspect(root);
  onStep?.('Đang tạo ảnh nhỏ…');
  const thumb = await thumbnail(root);
  const warn = info.tris > TRI_WARN ? `Mô hình khá nặng (${info.tris.toLocaleString('vi-VN')} mặt): nếu máy chiếu giật, bật “Máy yếu”.` : '';
  return { blob: new Blob([out], { type: 'model/gltf-binary' }), thumb, info, warn };
}

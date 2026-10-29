// Ảnh học sinh trên thư khen: khung ảnh (vị trí, cỡ, kiểu khung) lưu theo từng mẫu thư;
// ảnh từng em lưu trong IndexedDB của trình duyệt trên máy giáo viên (KHÔNG tải lên máy chủ).
import type { PraiseTemplateId } from './templates';
import { LETTER_H, LETTER_W } from './templates';

export type PhotoShape = 'circle' | 'rounded' | 'arch' | 'polaroid';
export type PhotoSlot = {
  on: boolean;
  /** tâm khung (hệ toạ độ thư 1414 × 1000) */
  x: number; y: number;
  /** bề rộng phần ảnh (px của thư) */
  size: number;
  shape: PhotoShape;
  border: string;
  bw: number;
  /** em chưa có ảnh: ẩn khung / vẽ khung trống có hình người */
  empty: 'hide' | 'frame';
  /** chữ tự thu nhỏ / dời sang bên để không bị ảnh che */
  wrap: boolean;
};
export const PHOTO_SHAPES: { id: PhotoShape; label: string }[] = [
  { id: 'circle', label: 'Tròn' }, { id: 'rounded', label: 'Bo góc' }, { id: 'arch', label: 'Vòm' }, { id: 'polaroid', label: 'Ảnh dán' },
];
export const PHOTO_SPOTS: { id: string; label: string; x: number; y: number }[] = [
  { id: 'l', label: 'Giữa trái', x: 250, y: 520 },
  { id: 'r', label: 'Giữa phải', x: 1164, y: 520 },
  { id: 'tl', label: 'Trên trái', x: 230, y: 250 },
  { id: 'tr', label: 'Trên phải', x: 1184, y: 250 },
  { id: 'bl', label: 'Dưới trái', x: 250, y: 790 },
];
export const DEFAULT_SLOT: PhotoSlot = { on: false, x: 250, y: 520, size: 250, shape: 'circle', border: '#ffffff', bw: 10, empty: 'hide', wrap: true };

/** Ảnh của một em (đã thu nhỏ) + cách cắt khung: zoom ≥ 1, ox / oy từ -1 đến 1 (dời ảnh trong khung) */
export type StudentPhoto = { img: HTMLImageElement; url: string; zoom: number; ox: number; oy: number };
export type LetterPhoto = { slot: PhotoSlot; photo: StudentPhoto | null };

/* ------------------------------------------------------------ khung ảnh theo mẫu (localStorage) */
const SLOT_KEY = 'edukid:thu-khen-anh';
const clamp = (v: unknown, lo: number, hi: number, def: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
export function normalizeSlot(v: Partial<PhotoSlot> | undefined): PhotoSlot {
  const d = DEFAULT_SLOT;
  return {
    on: v?.on === true,
    x: clamp(v?.x, 0, LETTER_W, d.x), y: clamp(v?.y, 0, LETTER_H, d.y), size: clamp(v?.size, 120, 460, d.size),
    shape: PHOTO_SHAPES.some((s) => s.id === v?.shape) ? (v!.shape as PhotoShape) : d.shape,
    border: typeof v?.border === 'string' && /^#[0-9a-f]{6}$/i.test(v.border) ? v.border : d.border,
    bw: clamp(v?.bw, 0, 24, d.bw), empty: v?.empty === 'frame' ? 'frame' : 'hide', wrap: v?.wrap !== false,
  };
}
export function readSlots(): Record<string, PhotoSlot> {
  try {
    const raw = localStorage.getItem(SLOT_KEY);
    const v = raw ? (JSON.parse(raw) as Record<string, Partial<PhotoSlot>>) : {};
    return Object.fromEntries(Object.entries(v && typeof v === 'object' ? v : {}).map(([k, s]) => [k, normalizeSlot(s)]));
  } catch { return {}; }
}
export function writeSlot(all: Record<string, PhotoSlot>, tpl: PraiseTemplateId, slot: PhotoSlot) {
  const next = { ...all, [tpl]: slot };
  try { localStorage.setItem(SLOT_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
  return next;
}

/* ------------------------------------------------------------ ảnh từng em (IndexedDB, chỉ trên máy này) */
type Rec = { key: string; blob: Blob; zoom: number; ox: number; oy: number };
const DB = 'edukid-praise', STORE = 'photos';
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no_idb'));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'key' }); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then((d) => new Promise<T>((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => d.close();
  }));
}
const keyOf = (scope: string, id: string) => `${scope}:${id}`;

export async function loadPhotos(scope: string): Promise<Record<string, StudentPhoto>> {
  try {
    const all = await tx<Rec[]>('readonly', (s) => s.getAll() as IDBRequest<Rec[]>);
    const out: Record<string, StudentPhoto> = {};
    await Promise.all(all.filter((r) => r.key.startsWith(`${scope}:`)).map(async (r) => {
      try { out[r.key.slice(scope.length + 1)] = await toPhoto(r.blob, r); } catch { /* ảnh hỏng: bỏ qua */ }
    }));
    return out;
  } catch { return {}; }
}
export async function savePhoto(scope: string, id: string, blob: Blob, crop: { zoom: number; ox: number; oy: number }) {
  try { await tx('readwrite', (s) => s.put({ key: keyOf(scope, id), blob, zoom: crop.zoom, ox: crop.ox, oy: crop.oy } satisfies Rec)); } catch { /* trình duyệt chặn lưu: vẫn dùng được trong phiên này */ }
}
export async function saveCrop(scope: string, id: string, crop: { zoom: number; ox: number; oy: number }) {
  try {
    const r = await tx<Rec | undefined>('readonly', (s) => s.get(keyOf(scope, id)) as IDBRequest<Rec | undefined>);
    if (r) await tx('readwrite', (s) => s.put({ ...r, zoom: crop.zoom, ox: crop.ox, oy: crop.oy }));
  } catch { /* bỏ qua */ }
}
export async function deletePhoto(scope: string, id: string) {
  try { await tx('readwrite', (s) => s.delete(keyOf(scope, id))); } catch { /* bỏ qua */ }
}

async function toPhoto(blob: Blob, crop: { zoom: number; ox: number; oy: number }): Promise<StudentPhoto> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await img.decode();
  return { img, url, zoom: crop.zoom || 1, ox: crop.ox || 0, oy: crop.oy || 0 };
}

/** Thu nhỏ ảnh tải lên (cạnh dài tối đa 720 px, JPEG) để lưu gọn và vẽ nhanh */
export async function prepPhoto(file: File): Promise<{ blob: Blob; photo: StudentPhoto }> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
  if (file.size > 15_000_000) throw new Error('Ảnh quá lớn (tối đa 15 MB).');
  const src = URL.createObjectURL(file);
  try {
    const im = new Image();
    im.src = src;
    await im.decode();
    const k = Math.min(1, 720 / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Không đọc được ảnh.'))), 'image/jpeg', 0.9));
    // ảnh chân dung: mặc định dời khung lên trên một chút để thấy rõ khuôn mặt
    const crop = { zoom: 1, ox: 0, oy: c.height > c.width * 1.1 ? -0.45 : 0 };
    return { blob, photo: await toPhoto(blob, crop) };
  } catch (e) {
    throw e instanceof Error && e.message.startsWith('Không') ? e : new Error('Không đọc được ảnh này (thử ảnh JPG hoặc PNG).');
  } finally { URL.revokeObjectURL(src); }
}

/* ------------------------------------------------------------ ghép tên file với tên học sinh */
export const plainName = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
  .replace(/\.[a-z0-9]{2,5}$/, '').replace(/[^a-z0-9]+/g, ' ').replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim();

/** Ghép mỗi file với một em: trùng cả họ tên → trùng phần cuối tên (duy nhất) → tên file chứa trọn tên gọi (duy nhất) */
export function matchFiles<T extends { id: string; name: string }>(files: File[], students: T[]): { file: File; student: T | null }[] {
  const full = new Map<string, T[]>(), tail2 = new Map<string, T[]>(), first = new Map<string, T[]>();
  const add = (m: Map<string, T[]>, k: string, st: T) => { if (k) m.set(k, [...(m.get(k) ?? []), st]); };
  for (const st of students) {
    const w = plainName(st.name).split(' ');
    add(full, w.join(' '), st); add(tail2, w.slice(-2).join(' '), st); add(first, w.at(-1) ?? '', st);
  }
  const used = new Set<string>();
  const one = (arr?: T[]) => { const a = (arr ?? []).filter((s) => !used.has(s.id)); return a.length === 1 ? a[0] : null; };
  return files.map((file) => {
    const n = plainName(file.name), w = n.split(' ');
    const st = one(full.get(n)) ?? one(tail2.get(w.slice(-2).join(' '))) ?? one(first.get(w.at(-1) ?? '')) ?? (w.length === 1 ? one(first.get(n)) : null);
    if (st) used.add(st.id);
    return { file, student: st };
  });
}

/* ------------------------------------------------------------ vẽ khung ảnh lên thư */
type Ctx = CanvasRenderingContext2D;
export function slotBox(slot: PhotoSlot) {
  const w = slot.size, h = slot.shape === 'arch' ? slot.size * 1.22 : slot.size;
  const pad = slot.shape === 'polaroid' ? Math.max(12, slot.size * 0.07) : slot.bw;
  const bottom = slot.shape === 'polaroid' ? slot.size * 0.22 : slot.bw;
  return { x: slot.x - w / 2 - pad, y: slot.y - h / 2 - pad, w: w + pad * 2, h: h + pad + bottom, iw: w, ih: h };
}

function shapePath(ctx: Ctx, shape: PhotoShape, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  if (shape === 'circle') ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else if (shape === 'arch') { ctx.moveTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath(); }
  else ctx.roundRect(x, y, w, h, shape === 'polaroid' ? 4 : Math.min(w, h) * 0.16);
}

function placeholder(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#eef2f7';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#c3cedd';
  const cx = x + w / 2, s = Math.min(w, h);
  ctx.beginPath(); ctx.arc(cx, y + h * 0.4, s * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, y + h * 0.9, s * 0.34, s * 0.26, 0, Math.PI, 0); ctx.fill();
}

export function drawPhoto(ctx: Ctx, lp: LetterPhoto) {
  const { slot, photo } = lp;
  if (!slot.on || (!photo && slot.empty === 'hide')) return;
  const b = slotBox(slot);
  const ix = slot.x - b.iw / 2, iy = slot.y - b.ih / 2;
  ctx.save();
  if (slot.shape === 'polaroid') {
    ctx.translate(slot.x, slot.y); ctx.rotate((-4 * Math.PI) / 180); ctx.translate(-slot.x, -slot.y);
    ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.shadowColor = 'transparent';
  } else {
    // bóng nhẹ + viền
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    shapePath(ctx, slot.shape, ix - slot.bw, iy - slot.bw, b.iw + slot.bw * 2, b.ih + slot.bw * 2);
    ctx.fillStyle = slot.bw > 0 ? slot.border : '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  shapePath(ctx, slot.shape, ix, iy, b.iw, b.ih);
  ctx.clip();
  if (photo) {
    const im = photo.img, z = Math.max(1, photo.zoom);
    const k = Math.max(b.iw / im.naturalWidth, b.ih / im.naturalHeight) * z;
    const dw = im.naturalWidth * k, dh = im.naturalHeight * k;
    const dx = slot.x - dw / 2 - (photo.ox * (dw - b.iw)) / 2;
    const dy = slot.y - dh / 2 - (photo.oy * (dh - b.ih)) / 2;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, dx, dy, dw, dh);
  } else placeholder(ctx, ix, iy, b.iw, b.ih);
  ctx.restore();
  if (slot.shape === 'polaroid' && slot.bw > 0) {
    ctx.strokeStyle = slot.border === '#ffffff' ? '#e5e7eb' : slot.border; ctx.lineWidth = Math.max(2, slot.bw / 3);
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }
  ctx.restore();
}

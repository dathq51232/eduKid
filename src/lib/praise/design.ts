// Thiết kế tuỳ chỉnh của thư khen (trình chỉnh sửa kiểu Canva): dời / phóng to các khối có sẵn của mẫu
// (tiêu đề, nội dung, chữ ký), đổi màu chữ, thêm chữ, sticker, biểu tượng, hình, ảnh (logo trường…).
// Lưu trên máy giáo viên theo từng mẫu; áp dụng cho mọi thư khi xuất PDF / ảnh / in.

export type BlockKey = 'title' | 'body' | 'sign';
export const BLOCK_LABEL: Record<BlockKey, string> = { title: 'Tiêu đề THƯ KHEN', body: 'Nội dung khen', sign: 'Khối ký tên' };

export type BlockAdj = { dx: number; dy: number; k: number; hide?: boolean };
export type FontKey = 'baloo' | 'oswald' | 'script';
export type ShapeKind = 'rect' | 'circle' | 'star' | 'line' | 'heart';

type Base = { id: string; x: number; y: number; rot: number; opacity?: number };
export type TextItem = Base & { kind: 'text'; text: string; size: number; color: string; font: FontKey; bold: boolean; ring?: string; align: 'left' | 'center' | 'right'; upper?: boolean };
export type ImageItem = Base & { kind: 'image'; src: string; w: number };
export type ShapeItem = Base & { kind: 'shape'; shape: ShapeKind; w: number; h: number; fill: string; stroke: string; sw: number; radius?: number };
export type DesignItem = TextItem | ImageItem | ShapeItem;

export type DesignColors = { title?: string; titleRing?: string; name?: string; ink?: string; wish?: string };
export type PraiseDesign = { v: 1; blocks: Partial<Record<BlockKey, BlockAdj>>; colors: DesignColors; items: DesignItem[]; hideStickers?: boolean };

export const emptyDesign = (): PraiseDesign => ({ v: 1, blocks: {}, colors: {}, items: [] });
export const isCustomized = (d?: PraiseDesign | null) => !!d && (d.items.length > 0 || Object.keys(d.blocks).length > 0 || Object.values(d.colors).some(Boolean) || !!d.hideStickers);
export const adjOf = (d: PraiseDesign | null | undefined, k: BlockKey): BlockAdj => d?.blocks[k] ?? { dx: 0, dy: 0, k: 1 };
export const uid = () => Math.random().toString(36).slice(2, 9);

/** Biến trong ô chữ, thay theo từng em khi xuất */
export const VARS: { key: string; label: string }[] = [
  { key: '{ten}', label: 'Tên học sinh' },
  { key: '{lop}', label: 'Lớp' },
  { key: '{ngay}', label: 'Nơi, ngày' },
  { key: '{truong}', label: 'Tên trường' },
  { key: '{gv}', label: 'Người ký' },
];
export function fillVars(text: string, v: { name: string; className: string; placeDate: string; school: string; teacher: string }) {
  return text.replace(/\{ten\}/g, v.name).replace(/\{lop\}/g, v.className).replace(/\{ngay\}/g, v.placeDate).replace(/\{truong\}/g, v.school).replace(/\{gv\}/g, v.teacher);
}

/** Biểu tượng 3D có sẵn (public/emoji, Fluent Emoji – MIT) hợp với thư khen */
export const EMOJIS = ['glowing-star', 'star', 'sparkles', 'trophy', 'ribbon', 'wrapped-gift', 'rainbow', 'blossom', 'sun-with-face', 'crescent-moon', 'open-book', 'books', 'pencil', 'paintbrush', 'light-bulb', 'gem-stone', 'red-paper-lantern', 'school', 'owl', 'panda', 'unicorn', 'teddy-bear', 'rabbit', 'leaf-fluttering-in-wind'];

export const PALETTE = ['#c0161b', '#e04e2b', '#f59e0b', '#16a34a', '#0ea5e9', '#2457c5', '#1e3a8a', '#7c3aed', '#db2777', '#5a3418', '#111827', '#ffffff'];

/** Mẫu chữ gợi ý khi bấm "Thêm chữ" */
export const TEXT_PRESETS: { label: string; item: Omit<TextItem, 'id' | 'x' | 'y' | 'rot'> }[] = [
  { label: 'Tiêu đề lớn', item: { kind: 'text', text: 'DANH HIỆU', size: 72, color: '#c0161b', font: 'baloo', bold: true, ring: '#ffffff', align: 'center' } },
  { label: 'Danh hiệu', item: { kind: 'text', text: 'Học sinh Xuất sắc', size: 52, color: '#2457c5', font: 'baloo', bold: true, ring: '#ffffff', align: 'center' } },
  { label: 'Chữ viết tay', item: { kind: 'text', text: 'Chúc mừng em!', size: 60, color: '#db2777', font: 'script', bold: false, align: 'center' } },
  { label: 'Dòng chữ thường', item: { kind: 'text', text: 'Thêm nội dung của thầy cô', size: 34, color: '#1e3a8a', font: 'baloo', bold: false, align: 'center' } },
  { label: 'Tên học sinh {ten}', item: { kind: 'text', text: '{ten}', size: 56, color: '#e04e2b', font: 'baloo', bold: true, ring: '#ffffff', align: 'center', upper: true } },
];

const STORE = 'edukid:thu-khen-design';
export function readDesigns(): Record<string, PraiseDesign> {
  try {
    const raw = localStorage.getItem(STORE);
    const v = raw ? (JSON.parse(raw) as Record<string, PraiseDesign>) : {};
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}
export function writeDesigns(all: Record<string, PraiseDesign>): string | null {
  try { localStorage.setItem(STORE, JSON.stringify(all)); return null; } catch { return 'Bộ nhớ trình duyệt đầy: ảnh tải lên quá lớn, thầy cô bớt ảnh rồi lưu lại nhé.'; }
}

/** Thu nhỏ ảnh tải lên (logo, ảnh lớp) để lưu gọn trên máy: cạnh dài tối đa 700px */
export function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 700 / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.88));
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh.')); };
    im.src = url;
  });
}

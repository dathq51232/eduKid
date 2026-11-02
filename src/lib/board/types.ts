// Bảng trắng (11/2026): dữ liệu các vật trên bảng. Mọi vật có khung x, y, w, h (toạ độ bảng) và góc xoay rot (độ, quanh tâm khung).
// 1 cm trên bảng = CM đơn vị (ô vuông của nền kẻ ô = 1 cm) — dùng để hiện số đo cạnh, thước kẻ.
import type { BrushKind, InkPt } from '@/lib/writing/ink';

export const PW = 1600, PH = 1000, CM = 40;

export type Base = { id: string; x: number; y: number; w: number; h: number; rot: number };
export type InkItem = Base & { kind: 'ink'; pts: InkPt[]; ow: number; oh: number; color: string; size: number; brush: BrushKind; taper: [number, number] };
export type ShapeKind = 'line' | 'arrow' | 'rect' | 'square' | 'tri' | 'rtri' | 'circle' | 'ellipse' | 'para' | 'trap' | 'rhombus' | 'poly';
export type ShapeItem = Base & { kind: 'shape'; shape: ShapeKind; stroke: string; fill: string; sw: number; dash?: boolean; measure?: boolean; flip?: boolean; pts?: [number, number][] };
export type SolidKind = 'cube' | 'box' | 'cyl' | 'sphere' | 'cone' | 'pyramid';
export type SolidItem = Base & { kind: 'solid'; solid: SolidKind; color: string; hidden: boolean };
export type TextItem = Base & { kind: 'text'; text: string; size: number; color: string; font: 'print' | 'script'; ow: number; oh: number };
export type StickerItem = Base & { kind: 'sticker'; src: string };
export type MathData =
  | { tool: 'numberline'; from: number; to: number; step: number; marks: number[]; hops: boolean }
  | { tool: 'fraction'; shape: 'circle' | 'rect'; n: number; on: number[]; label: boolean }
  | { tool: 'clock'; hour: number; minute: number; digital: boolean }
  | { tool: 'sticks'; tens: number; ones: number }
  | { tool: 'blocks'; hundreds: number; tens: number; ones: number };
export type MathItem = Base & { kind: 'math' } & MathData;
export type Item = InkItem | ShapeItem | SolidItem | TextItem | StickerItem | MathItem;

export type Bg = 'plain' | 'oli4' | 'oli5' | 'grid' | 'dots' | 'chalk' | 'chalk-grid';
export type Page = { id: string; bg: Bg; items: Item[] };
export type Board = { pages: Page[]; cur: number };

export const BG_LABEL: Record<Bg, string> = {
  plain: 'Trắng trơn', oli4: 'Ô li 4 dòng', oli5: 'Ô li 5 dòng', grid: 'Ô vuông 1 cm', dots: 'Chấm toạ độ', chalk: 'Bảng đen', 'chalk-grid': 'Bảng đen kẻ ô',
};
export const isDark = (bg: Bg) => bg === 'chalk' || bg === 'chalk-grid';

export const SHAPES: { k: ShapeKind; label: string }[] = [
  { k: 'line', label: 'Đoạn thẳng' }, { k: 'arrow', label: 'Mũi tên' }, { k: 'square', label: 'Hình vuông' }, { k: 'rect', label: 'Hình chữ nhật' },
  { k: 'tri', label: 'Tam giác' }, { k: 'rtri', label: 'Tam giác vuông' }, { k: 'circle', label: 'Hình tròn' }, { k: 'ellipse', label: 'Hình bầu dục' },
  { k: 'rhombus', label: 'Hình thoi' }, { k: 'para', label: 'Hình bình hành' }, { k: 'trap', label: 'Hình thang' }, { k: 'poly', label: 'Đa giác (bấm từng đỉnh)' },
];
export const SOLIDS: { k: SolidKind; label: string }[] = [
  { k: 'cube', label: 'Khối lập phương' }, { k: 'box', label: 'Khối hộp chữ nhật' }, { k: 'cyl', label: 'Khối trụ' },
  { k: 'sphere', label: 'Khối cầu' }, { k: 'cone', label: 'Khối nón' }, { k: 'pyramid', label: 'Khối chóp' },
];
export const STICKERS = ['star', 'red-apple', 'banana', 'strawberry', 'carrot', 'cat', 'dog', 'rabbit', 'duck', 'fish', 'lady-beetle', 'butterfly',
  'sunflower', 'deciduous-tree', 'sun', 'balloon', 'pencil', 'house', 'wrapped-gift', 'trophy'].map((n) => `/emoji/sticker/${n}.webp`);

/** khung giữ nguyên tỉ lệ khi kéo đổi cỡ */
export const keepRatio = (it: Item) => it.kind === 'ink' || it.kind === 'text' || it.kind === 'sticker'
  || (it.kind === 'shape' && (it.shape === 'square' || it.shape === 'circle'))
  || (it.kind === 'solid' && (it.solid === 'cube' || it.solid === 'sphere'))
  || (it.kind === 'math' && (it.tool === 'clock' || (it.tool === 'fraction' && it.shape === 'circle')));

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Đổi điểm trên bảng về toạ độ trong khung vật (bỏ xoay) */
export function toLocal(it: Base, x: number, y: number): [number, number] {
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2, a = (-it.rot * Math.PI) / 180;
  const dx = x - cx, dy = y - cy;
  return [dx * Math.cos(a) - dy * Math.sin(a) + it.w / 2, dx * Math.sin(a) + dy * Math.cos(a) + it.h / 2];
}
export function toWorld(it: Base, lx: number, ly: number): [number, number] {
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2, a = (it.rot * Math.PI) / 180;
  const dx = lx - it.w / 2, dy = ly - it.h / 2;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

const segDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy;
  const t = l ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l)) : 0;
  return Math.hypot(px - ax - t * vx, py - ay - t * vy);
};

/** Bấm trúng vật? (nét bút: gần đường nét; đoạn thẳng: gần đoạn; còn lại: trong khung) */
export function hit(it: Item, x: number, y: number, tol = 8): boolean {
  const [lx, ly] = toLocal(it, x, y);
  if (it.kind === 'ink') {
    const sx = it.w / (it.ow || 1), sy = it.h / (it.oh || 1);
    const r = (it.size * Math.max(sx, sy)) / 2 + tol;
    for (let i = 0; i < it.pts.length; i++) {
      const a = it.pts[i], b = it.pts[Math.min(i + 1, it.pts.length - 1)];
      if (segDist(lx, ly, a[0] * sx, a[1] * sy, b[0] * sx, b[1] * sy) < r) return true;
    }
    return false;
  }
  if (it.kind === 'shape' && (it.shape === 'line' || it.shape === 'arrow')) {
    return it.flip ? segDist(lx, ly, 0, it.h, it.w, 0) < tol + it.sw : segDist(lx, ly, 0, 0, it.w, it.h) < tol + it.sw;
  }
  return lx >= -tol && ly >= -tol && lx <= it.w + tol && ly <= it.h + tol;
}

/** Độ dài (cm) hiển thị kiểu Việt Nam: 3,5 cm */
export const cmText = (units: number) => `${(Math.round((units / CM) * 10) / 10).toLocaleString('vi-VN')} cm`;

/** Các đỉnh (toạ độ trong khung) của hình đa giác — null với hình tròn / đường */
export function shapePoints(s: ShapeItem): [number, number][] | null {
  const { w, h } = s;
  switch (s.shape) {
    case 'rect': case 'square': return [[0, 0], [w, 0], [w, h], [0, h]];
    case 'tri': return [[w / 2, 0], [w, h], [0, h]];
    case 'rtri': return [[0, 0], [0, h], [w, h]];
    case 'rhombus': return [[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]];
    case 'para': return [[w * 0.28, 0], [w, 0], [w * 0.72, h], [0, h]];
    case 'trap': return [[w * 0.25, 0], [w * 0.75, 0], [w, h], [0, h]];
    case 'poly': return (s.pts ?? []).map(([a, b]) => [a * w, b * h]);
    default: return null;
  }
}

export function newBoard(): Board { return { pages: [{ id: uid(), bg: 'grid', items: [] }], cur: 0 }; }

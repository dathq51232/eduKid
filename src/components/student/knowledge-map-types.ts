// Kiểu dữ liệu chung của "Bản đồ kiến thức" (mỗi khối một bản đồ Toán).
// Toạ độ x, y theo khung 1000 × 620 (đổi ra % khi vẽ). Bốn vùng đặt cố định, mỗi khối tự đặt tên vùng.

export type MapTip = { name: string; how: string; example: string };
export type RegionId = 'so' | 'ps' | 'hinh' | 'tk';
export type MapNode = {
  id: string;
  name: string;
  icon: string;
  region: RegionId;
  x: number;
  y: number;
  /** mảng kiến thức của bài (toanN-plan.ts; Toán 1 dùng số bài "b1", "b2"…) thuộc trạm này — để tính tiến độ từ bài em đã làm */
  topics: string[];
  know: string;
  tips: MapTip[];
};
/** tiến độ của em ở một trạm */
export type NodeState = {
  /** mức cao nhất em đã đạt: 0 = chưa học, 1–5 = L1…L5 */
  level: number;
  /** lần làm gần nhất còn nhầm nhiều */
  weak?: boolean;
  /** bài em đang học */
  current?: boolean;
};
export type MapState = Record<string, NodeState>;
export type MapRegion = { id: RegionId; name: string; x: number; y: number; w: number; h: number; tone: string };
/** đường nối: from là kiến thức cần biết trước của to; c = điểm uốn (đường cong) nếu cần né trạm khác */
export type MapLink = { from: string; to: string; c?: [number, number] };
export type MapDef = { grade: number; title: string; regions: MapRegion[]; nodes: MapNode[]; links: MapLink[] };

export const MAP_W = 1000;
export const MAP_H = 620;

export const LEVEL_NAMES = ['Chưa học', 'Làm quen', 'Cơ bản', 'Vận dụng', 'Thử thách', 'Mở rộng'];

/** bốn vùng của bản đồ: trên trái, trên phải (cao), dưới trái, dưới phải */
export function regions(so: string, ps: string, hinh: string, tk: string): MapRegion[] {
  return [
    { id: 'so', name: so, x: 16, y: 16, w: 468, h: 288, tone: 'is-blue' },
    { id: 'ps', name: ps, x: 500, y: 16, w: 484, h: 392, tone: 'is-yellow' },
    { id: 'hinh', name: hinh, x: 16, y: 320, w: 468, h: 284, tone: 'is-green' },
    { id: 'tk', name: tk, x: 500, y: 424, w: 484, h: 180, tone: 'is-coral' },
  ];
}

export const F = (n: string) => `/emoji/f3d/${n}.webp`;

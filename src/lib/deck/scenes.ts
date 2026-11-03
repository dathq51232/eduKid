import type { SceneKind } from './types';

/** Cảnh nền minh hoạ: nền chuyển màu + hình dán đặt quanh mép (toạ độ trang 1600×900), không che chỗ đặt chữ ở giữa */
export type ScenePart = { src?: string; x: number; y: number; w: number; h?: number; css?: string; op?: number; flip?: boolean };
export type Scene = { id: SceneKind; label: string; icon: string; bg: string; dark?: boolean; parts: ScenePart[] };

const S = (n: string) => `/emoji/sticker/${n}.webp`;
const E = (n: string) => `/emoji/${n}.png`;
const I = (n: string) => `/edu-icons/${n}.webp`;
const cloud = (x: number, y: number, w: number): ScenePart => ({ x, y, w, h: w * 0.42, css: 'background:#fff;border-radius:999px;box-shadow:inset 0 -6px 0 rgba(148,163,184,.18)' });

export const SCENES: Scene[] = [
  { id: 'garden', label: 'Vườn cây', icon: '🌳', bg: 'linear-gradient(180deg,#bfe3ff 0%,#e8f6ff 60%,#9ad57e 60%,#6fbf57 100%)', parts: [
    { src: S('sun'), x: 1390, y: 30, w: 170 }, cloud(120, 70, 230), cloud(470, 40, 160),
    { src: S('deciduous-tree'), x: 10, y: 300, w: 250 }, { src: S('deciduous-tree'), x: 1360, y: 320, w: 230 },
    { src: S('sunflower'), x: 300, y: 760, w: 100 }, { src: S('sunflower'), x: 1220, y: 770, w: 90 }, { src: S('butterfly'), x: 1180, y: 250, w: 80 } ] },
  { id: 'pond', label: 'Ao cá', icon: '🐟', bg: 'linear-gradient(180deg,#bfe3ff 0%,#e0f2fe 52%,#7dd3fc 52%,#38bdf8 100%)', parts: [
    { src: S('sun'), x: 50, y: 40, w: 150 }, cloud(1200, 60, 220),
    { x: -80, y: 420, w: 1760, h: 90, css: 'background:#86c96a;border-radius:50%' },
    { src: S('duck'), x: 1380, y: 520, w: 170 }, { src: S('fish'), x: 90, y: 770, w: 120, op: 0.75 }, { src: E('tropical-fish'), x: 1250, y: 790, w: 90, op: 0.7, flip: true } ] },
  { id: 'kitchen', label: 'Gian bếp', icon: '🍳', bg: 'linear-gradient(180deg,#fef3c7 0%,#fef3c7 64%,#e7c9a0 64%,#d6a86f 100%)', parts: [
    { x: 80, y: 60, w: 300, h: 240, css: 'border:14px solid #fff;border-radius:22px;background:linear-gradient(180deg,#bae6fd,#e0f2fe)' },
    { x: 0, y: 560, w: 1600, h: 26, css: 'background:#c08a52' },
    { src: E('teapot'), x: 1380, y: 440, w: 130 }, { src: E('pot-of-food'), x: 70, y: 450, w: 130 }, { src: I('orange'), x: 1440, y: 760, w: 100 }, { src: I('carrot'), x: 60, y: 770, w: 100 } ] },
  { id: 'class', label: 'Lớp học', icon: '🏫', bg: 'linear-gradient(180deg,#fde68a 0%,#fde68a 76%,#e2b170 76%,#c99456 100%)', parts: [
    { x: 40, y: 50, w: 120, h: 160, css: 'background:#fff;border:8px solid #92400e;border-radius:12px' },
    { src: E('books'), x: 1420, y: 700, w: 140 }, { src: S('pencil'), x: 60, y: 720, w: 130 }, { src: E('straight-ruler'), x: 1440, y: 60, w: 110 }, { src: E('light-bulb'), x: 70, y: 260, w: 80 } ] },
  { id: 'yard', label: 'Sân nhà', icon: '🏡', bg: 'linear-gradient(180deg,#c7e9ff 0%,#eef8ff 58%,#fcd34d 58%,#f59e0b 100%)', parts: [
    { src: S('house'), x: 20, y: 260, w: 280 }, { src: S('balloon'), x: 1440, y: 50, w: 120 }, cloud(420, 60, 200),
    { src: S('deciduous-tree'), x: 1370, y: 300, w: 220 }, { src: S('dog'), x: 260, y: 740, w: 120 }, { src: S('cat'), x: 1260, y: 760, w: 100 } ] },
  { id: 'farm', label: 'Trang trại', icon: '🐓', bg: 'linear-gradient(180deg,#dbeafe 0%,#f0f9ff 56%,#bbf7d0 56%,#86efac 100%)', parts: [
    { src: E('mountain'), x: 1150, y: 260, w: 300, op: 0.9 }, { src: S('sun'), x: 60, y: 40, w: 140 },
    { x: 0, y: 610, w: 1600, h: 18, css: 'background:repeating-linear-gradient(90deg,#a16207 0 18px,transparent 18px 70px)' },
    { src: E('rooster'), x: 60, y: 700, w: 130 }, { src: I('pig'), x: 1420, y: 720, w: 140 }, { src: E('ear-of-corn'), x: 260, y: 760, w: 80 }, { src: I('chick'), x: 1300, y: 790, w: 80 } ] },
  { id: 'sea', label: 'Biển', icon: '🌊', bg: 'linear-gradient(180deg,#bae6fd 0%,#e0f2fe 46%,#38bdf8 46%,#0284c7 82%,#fde68a 82%,#fcd34d 100%)', parts: [
    { src: S('sun'), x: 1400, y: 30, w: 150 }, cloud(160, 60, 220), { src: E('sailboat'), x: 70, y: 280, w: 160 },
    { src: E('spouting-whale'), x: 1350, y: 430, w: 200, op: 0.9 }, { src: E('crab'), x: 90, y: 780, w: 100 }, { src: E('oyster'), x: 1450, y: 800, w: 80 } ] },
  { id: 'space', label: 'Vũ trụ', icon: '🚀', dark: true, bg: 'radial-gradient(circle at 80% 20%,#3b3f8f 0%,#1e1b4b 40%,#0b1026 100%)', parts: [
    { src: E('crescent-moon'), x: 1380, y: 50, w: 150 }, { src: E('glowing-star'), x: 120, y: 80, w: 70 }, { src: E('glowing-star'), x: 520, y: 40, w: 46 },
    { src: E('glowing-star'), x: 1150, y: 120, w: 50 }, { src: E('sparkles'), x: 60, y: 720, w: 110 }, { src: E('glowing-star'), x: 1480, y: 760, w: 60 },
    { x: -200, y: 800, w: 700, h: 300, css: 'background:radial-gradient(circle at 50% 30%,#a78bfa,#6d28d9);border-radius:50%' } ] },
];
export const SCENE_BY_ID: Record<string, Scene> = Object.fromEntries(SCENES.map((s) => [s.id, s]));
export const sceneDark = (id?: string) => !!(id && SCENE_BY_ID[id]?.dark);

const KEYS: [SceneKind, string][] = [
  ['pond', 'cá|ao|vịt|ếch|nước|sông|hồ|thuyền'],
  ['sea', 'biển|sóng|tàu|đảo|cua|sea|beach|fish'],
  ['space', 'ngôi sao|trăng|vũ trụ|tên lửa|hành tinh|đêm|space|moon|star'],
  ['farm', 'gà|lợn|heo|bò|trâu|ngô|lúa|trang trại|nông|farm|animal|chicken'],
  ['kitchen', 'bếp|nấu|cơm|bánh|đĩa|bát|cam|chuối|kg|lít|ăn|food|fruit|lunch|breakfast|kitchen'],
  ['garden', 'táo|hoa|cây|vườn|lá|bướm|ong|garden|flower|tree'],
  ['class', 'lớp|bút|sách|vở|thước|trường|cô giáo|thầy|school|class|pen|book|ruler'],
  ['yard', 'nhà|sân|chó|mèo|bóng|đồ chơi|gia đình|bố|mẹ|home|family|toy|pet'],
];
/** Chọn cảnh theo nội dung bài (đếm từ khoá), mặc định: Sân nhà */
export function pickScene(text: string, fallback: SceneKind = 'yard'): SceneKind {
  const t = ` ${text.toLowerCase().replace(/cá nhân|cá thể|nước ta|đất nước/g, ' ')} `;
  let best: SceneKind = fallback, n = 0;
  for (const [k, re] of KEYS) {
    const m = t.match(new RegExp(`(?<!\\p{L})(${re})(?!\\p{L})`, 'giu'))?.length ?? 0;
    if (m > n) { n = m; best = k; }
  }
  return best;
}

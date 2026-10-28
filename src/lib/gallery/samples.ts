'use client';
// Phòng mẫu: khi lớp chưa có tác phẩm nào, dựng sẵn vài thư khen, tranh vẽ, bài luyện chữ (vẽ ngay trên trình duyệt)
// để thầy cô / phụ huynh hình dung phòng triển lãm. Không phải dữ liệu thật, không lưu lên máy chủ.
import { loadPraiseFonts, loadTemplateAssets, renderLetterCanvas } from '@/lib/praise/render';
import { PRAISE_REASONS, PRAISE_TEMPLATES, fillReason } from '@/lib/praise/templates';
import type { GalleryItem, GalleryKind } from './types';
import { drawPaper } from '@/lib/writing/paper';

const NAMES = ['Minh An', 'Bảo Ngọc', 'Gia Huy', 'Khánh Linh', 'Đức Anh', 'Thảo Vy', 'Quốc Bảo', 'Hà My'];
const today = new Date().toISOString().slice(0, 10);

function item(kind: GalleryKind, i: number, c: HTMLCanvasElement, title: string, note = ''): GalleryItem {
  return {
    id: `mau-${kind}-${i}`, student_id: null, student_name: NAMES[i % NAMES.length], kind, title, note, path: '', w: c.width, h: c.height,
    audio_path: null, status: 'shown', taken_on: today, created_at: today, hearts: (i * 7) % 11, my_heart: null, url: c.toDataURL('image/jpeg', 0.85), sample: true,
  };
}

/* ------------------------------------------------------------ tranh sáp màu tự vẽ */
type Rnd = () => number;
const rng = (seed: number): Rnd => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function crayon(c: CanvasRenderingContext2D, r: Rnd, color: string, w: number, pts: [number, number][], close = false) {
  c.strokeStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let pass = 0; pass < 3; pass++) {
    c.globalAlpha = 0.55 + pass * 0.15; c.lineWidth = w * (1 - pass * 0.2);
    c.beginPath();
    pts.forEach(([x, y], i) => { const jx = x + (r() - 0.5) * w * 0.5, jy = y + (r() - 0.5) * w * 0.5; if (i) c.lineTo(jx, jy); else c.moveTo(jx, jy); });
    if (close) c.closePath();
    c.stroke();
  }
  c.globalAlpha = 1;
}
function scribble(c: CanvasRenderingContext2D, r: Rnd, color: string, x: number, y: number, w: number, h: number, step = 9) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.strokeStyle = color; c.globalAlpha = 0.75; c.lineWidth = step * 1.1; c.lineCap = 'round';
  c.beginPath();
  for (let k = -h; k < w + h; k += step) { c.moveTo(x + k + r() * 3, y + h + 4); c.lineTo(x + k + h + r() * 3, y - 4); }
  c.stroke(); c.restore(); c.globalAlpha = 1;
}
function blob(c: CanvasRenderingContext2D, r: Rnd, color: string, cx: number, cy: number, rx: number, ry: number) {
  c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
  scribble(c, r, color, cx - rx, cy - ry, rx * 2, ry * 2, 8); c.restore();
  crayon(c, r, shade(color), 5, Array.from({ length: 33 }, (_, i) => [cx + rx * Math.cos(i / 32 * Math.PI * 2), cy + ry * Math.sin(i / 32 * Math.PI * 2)] as [number, number]));
}
const shade = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.7));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
function paper(w: number, h: number) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d')!;
  c.fillStyle = '#fffdf6'; c.fillRect(0, 0, w, h);
  return { cv, c };
}
function sun(c: CanvasRenderingContext2D, r: Rnd, x: number, y: number, s: number) {
  blob(c, r, '#facc15', x, y, s, s);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; crayon(c, r, '#f59e0b', 6, [[x + Math.cos(a) * s * 1.3, y + Math.sin(a) * s * 1.3], [x + Math.cos(a) * s * 1.8, y + Math.sin(a) * s * 1.8]]); }
}
function grass(c: CanvasRenderingContext2D, r: Rnd, w: number, h: number) {
  scribble(c, r, '#4ade80', 0, h * 0.78, w, h * 0.22, 10);
  for (let x = 10; x < w; x += 22) crayon(c, r, '#15803d', 4, [[x, h * 0.8], [x + 5, h * 0.74], [x + 9, h * 0.8]]);
}
function flower(c: CanvasRenderingContext2D, r: Rnd, x: number, y: number, col: string) {
  crayon(c, r, '#16a34a', 5, [[x, y], [x, y + 60]]);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; blob(c, r, col, x + Math.cos(a) * 14, y + Math.sin(a) * 14, 10, 10); }
  blob(c, r, '#facc15', x, y, 9, 9);
}
const DRAWINGS: { title: string; draw: (c: CanvasRenderingContext2D, r: Rnd, w: number, h: number) => void }[] = [
  { title: 'Ngôi nhà của em', draw: (c, r, w, h) => {
    scribble(c, r, '#bae6fd', 0, 0, w, h * 0.78, 12); sun(c, r, w * 0.82, h * 0.18, 42); grass(c, r, w, h);
    scribble(c, r, '#fca5a5', w * 0.3, h * 0.45, w * 0.36, h * 0.35); crayon(c, r, '#b91c1c', 6, [[w * 0.3, h * 0.45], [w * 0.66, h * 0.45], [w * 0.66, h * 0.8], [w * 0.3, h * 0.8]], true);
    c.save(); c.beginPath(); c.moveTo(w * 0.26, h * 0.46); c.lineTo(w * 0.48, h * 0.24); c.lineTo(w * 0.7, h * 0.46); c.closePath(); c.clip(); scribble(c, r, '#ea580c', w * 0.26, h * 0.24, w * 0.44, h * 0.22); c.restore();
    crayon(c, r, '#9a3412', 6, [[w * 0.26, h * 0.46], [w * 0.48, h * 0.24], [w * 0.7, h * 0.46]]);
    scribble(c, r, '#a16207', w * 0.44, h * 0.6, w * 0.08, h * 0.2); scribble(c, r, '#fde047', w * 0.34, h * 0.52, w * 0.07, h * 0.08);
    flower(c, r, w * 0.12, h * 0.66, '#f472b6'); flower(c, r, w * 0.85, h * 0.68, '#a78bfa');
  } },
  { title: 'Biển xanh', draw: (c, r, w, h) => {
    scribble(c, r, '#e0f2fe', 0, 0, w, h * 0.4, 12); scribble(c, r, '#38bdf8', 0, h * 0.4, w, h * 0.6, 10); sun(c, r, w * 0.15, h * 0.18, 34);
    for (let i = 0; i < 4; i++) crayon(c, r, '#0369a1', 5, Array.from({ length: 12 }, (_, k) => [k * w / 11, h * (0.48 + i * 0.13) + Math.sin(k) * 8] as [number, number]));
    const fish = (x: number, y: number, col: string) => { blob(c, r, col, x, y, 46, 26); c.save(); c.beginPath(); c.moveTo(x + 40, y); c.lineTo(x + 76, y - 24); c.lineTo(x + 76, y + 24); c.closePath(); c.fillStyle = col; c.fill(); c.restore(); c.fillStyle = '#111'; c.beginPath(); c.arc(x - 24, y - 6, 5, 0, 7); c.fill(); };
    fish(w * 0.35, h * 0.62, '#fb923c'); fish(w * 0.68, h * 0.8, '#f472b6'); fish(w * 0.72, h * 0.55, '#facc15');
    crayon(c, r, '#7c2d12', 5, [[w * 0.55, h * 0.38], [w * 0.75, h * 0.38], [w * 0.7, h * 0.44], [w * 0.6, h * 0.44]], true); crayon(c, r, '#7c2d12', 4, [[w * 0.65, h * 0.38], [w * 0.65, h * 0.2]]);
    c.save(); c.beginPath(); c.moveTo(w * 0.65, h * 0.2); c.lineTo(w * 0.74, h * 0.34); c.lineTo(w * 0.65, h * 0.34); c.closePath(); c.fillStyle = '#ef4444'; c.fill(); c.restore();
  } },
  { title: 'Cây xanh và cầu vồng', draw: (c, r, w, h) => {
    const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'];
    cols.forEach((col, i) => crayon(c, r, col, 14, Array.from({ length: 30 }, (_, k) => { const a = Math.PI + (k / 29) * Math.PI; return [w * 0.5 + Math.cos(a) * (w * 0.42 - i * 15), h * 0.72 + Math.sin(a) * (h * 0.55 - i * 15)] as [number, number]; })));
    grass(c, r, w, h);
    scribble(c, r, '#92400e', w * 0.2, h * 0.5, w * 0.06, h * 0.3); blob(c, r, '#22c55e', w * 0.23, h * 0.42, 70, 60);
    for (let i = 0; i < 5; i++) blob(c, r, '#ef4444', w * 0.18 + r() * 90, h * 0.36 + r() * 70, 8, 8);
    flower(c, r, w * 0.7, h * 0.7, '#f472b6'); flower(c, r, w * 0.8, h * 0.72, '#fde047');
  } },
  { title: 'Chú mèo của em', draw: (c, r, w, h) => {
    scribble(c, r, '#fef3c7', 0, 0, w, h, 14);
    blob(c, r, '#fb923c', w * 0.5, h * 0.62, 110, 90); blob(c, r, '#fb923c', w * 0.5, h * 0.34, 80, 70);
    for (const s of [-1, 1]) { c.save(); c.beginPath(); c.moveTo(w * 0.5 + s * 30, h * 0.24); c.lineTo(w * 0.5 + s * 70, h * 0.08); c.lineTo(w * 0.5 + s * 78, h * 0.3); c.closePath(); c.fillStyle = '#f97316'; c.fill(); c.restore(); }
    c.fillStyle = '#111'; for (const s of [-1, 1]) { c.beginPath(); c.arc(w * 0.5 + s * 28, h * 0.32, 8, 0, 7); c.fill(); }
    crayon(c, r, '#be185d', 4, [[w * 0.47, h * 0.4], [w * 0.5, h * 0.43], [w * 0.53, h * 0.4]]);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) crayon(c, r, '#111', 2, [[w * 0.5 + s * 20, h * 0.4 + k * 6], [w * 0.5 + s * 80, h * 0.36 + k * 12]]);
    crayon(c, r, '#ea580c', 14, [[w * 0.68, h * 0.7], [w * 0.8, h * 0.6], [w * 0.84, h * 0.4]]);
    blob(c, r, '#60a5fa', w * 0.18, h * 0.82, 40, 20);
  } },
  { title: 'Đêm trăng', draw: (c, r, w, h) => {
    scribble(c, r, '#1e3a8a', 0, 0, w, h, 12);
    blob(c, r, '#fde68a', w * 0.75, h * 0.25, 50, 50); c.fillStyle = '#1e3a8a'; c.beginPath(); c.arc(w * 0.78, h * 0.22, 46, 0, 7); c.fill();
    for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h * 0.6; crayon(c, r, '#fef9c3', 3, [[x - 6, y], [x + 6, y]]); crayon(c, r, '#fef9c3', 3, [[x, y - 6], [x, y + 6]]); }
    scribble(c, r, '#334155', 0, h * 0.75, w, h * 0.25); scribble(c, r, '#ef4444', w * 0.2, h * 0.5, 60, 80);
    crayon(c, r, '#facc15', 5, [[w * 0.2, h * 0.5], [w * 0.2 + 60, h * 0.5], [w * 0.2 + 60, h * 0.5 + 80], [w * 0.2, h * 0.5 + 80]], true);
  } },
  { title: 'Ô tô đi học', draw: (c, r, w, h) => {
    scribble(c, r, '#dbeafe', 0, 0, w, h * 0.7, 12); scribble(c, r, '#9ca3af', 0, h * 0.7, w, h * 0.3, 10);
    for (let x = 20; x < w; x += 90) crayon(c, r, '#ffffff', 8, [[x, h * 0.85], [x + 45, h * 0.85]]);
    scribble(c, r, '#ef4444', w * 0.22, h * 0.45, w * 0.56, h * 0.2); scribble(c, r, '#f87171', w * 0.32, h * 0.3, w * 0.32, h * 0.16);
    scribble(c, r, '#bfdbfe', w * 0.36, h * 0.33, w * 0.1, h * 0.1); scribble(c, r, '#bfdbfe', w * 0.5, h * 0.33, w * 0.1, h * 0.1);
    for (const x of [w * 0.33, w * 0.67]) { blob(c, r, '#1f2937', x, h * 0.67, 34, 34); blob(c, r, '#d1d5db', x, h * 0.67, 12, 12); }
    sun(c, r, w * 0.1, h * 0.15, 30);
  } },
];

const WRITING: { title: string; lines: string[]; grade: number }[] = [
  { title: 'Luyện chữ: a ă â', lines: ['a ă â a ă â', 'ăn ân ăng'], grade: 1 },
  { title: 'Chữ hoa A', lines: ['A A A A', 'Anh em thuận hoà'], grade: 2 },
  { title: 'Luyện chữ: b, h, k', lines: ['b h k b h k', 'bé hà kể'], grade: 1 },
  { title: 'Chữ hoa B', lines: ['B B B B', 'Bầu ơi thương lấy bí cùng'], grade: 2 },
  { title: 'Tập viết câu', lines: ['Uống nước nhớ nguồn', 'Ăn quả nhớ kẻ trồng cây'], grade: 3 },
  { title: 'Chữ hoa C', lines: ['C C C C', 'Có công mài sắt'], grade: 2 },
];

/** Tranh, bài viết, thư khen mẫu */
export async function sampleItems(className: string): Promise<GalleryItem[]> {
  const out: GalleryItem[] = [];
  DRAWINGS.forEach((d, i) => {
    const w = 900, h = 640;
    const { cv, c } = paper(w, h);
    d.draw(c, rng(17 + i * 31), w, h);
    out.push(item('art', i, cv, d.title, 'Màu sắc tươi vui, bố cục cân đối.'));
  });
  await loadPraiseFonts();
  WRITING.forEach((wr, i) => {
    const cv = document.createElement('canvas'); cv.width = 900; cv.height = 620;
    drawPaper(cv.getContext('2d')!, 900, 620, 15, { margin: 40 });
    const c = cv.getContext('2d')!;
    c.fillStyle = '#1e3a8a'; c.font = '600 92px PraiseScript, cursive';
    const rows = [240, 480];
    wr.lines.forEach((t, k) => { c.save(); c.translate(70, rows[k]); const mw = c.measureText(t).width; if (mw > 780) c.scale(780 / mw, 780 / mw); c.rotate(-0.012 + (i % 3) * 0.006); c.fillText(t, 0, 0); c.restore(); });
    out.push(item('writing', i, cv, wr.title, 'Nét chữ đều, viết đúng độ cao.'));
  });
  const tpls = PRAISE_TEMPLATES.filter((t) => t.bg).slice(0, 4);
  for (const [i, t] of tpls.entries()) {
    try {
      const assets = await loadTemplateAssets(t);
      const c = renderLetterCanvas(t, assets, {
        school: 'Trường Tiểu học', lead: 'Cô dành lời khen ngợi và chúc mừng em', name: NAMES[i], className, extra: '',
        reason: fillReason(PRAISE_REASONS[i % PRAISE_REASONS.length], 'tháng 10'), wish: 'Chúc em luôn chăm ngoan, học giỏi!',
        placeDate: 'Ngày 30 tháng 10', role: 'GVCN', teacher: 'Cô giáo chủ nhiệm', closing: 'Yêu thương', signature: null,
      }, 0.6);
      out.push(item('praise', i, c, 'Thư khen tháng 10'));
    } catch { /* thiếu ảnh nền: bỏ qua mẫu này */ }
  }
  return out;
}

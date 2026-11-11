// "Bố cục khác": sắp xếp lại một trang theo các bố cục chuẩn (giống Magic Layout) mà giữ nguyên nội dung và hiệu ứng.
// Cách làm: gom vật thành KHỐI (khung + chữ / hình nằm trong khung, miếng che + đáp án… = một khối, dịch chuyển và co giãn
// cùng nhau), rồi xếp các khối vào vùng chữ / vùng hình của bố cục. Trang kéo thả giữ nguyên (vị trí ô mang nghĩa).
import { fit, fits, quizSizes } from './fit';
import { SH, SW, quizImage, quizText, type El, type SceneVariant, type Slide, type TextEl } from './types';

type Box = { x: number; y: number; w: number; h: number };
export type LayoutId = 'text-left' | 'text-right' | 'text-top' | 'center';
export const LAYOUTS: { id: LayoutId; label: string; variant: SceneVariant }[] = [
  { id: 'text-left', label: 'Chữ trái · Hình phải', variant: 'right' },
  { id: 'text-right', label: 'Hình trái · Chữ phải', variant: 'left' },
  { id: 'text-top', label: 'Chữ trên · Hình dưới', variant: 'bottom' },
  { id: 'center', label: 'Tâm điểm giữa', variant: 'center' },
];

const M = 92, TOP = 40, GAP = 28, MAX_UP = 1.25;
const INTERACTIVE = new Set<El['kind']>(['quiz', 'sort', 'teams', 'scene3d']);
/** vật giữ nguyên chỗ: thẻ nền, băng dính, thanh tiến trình, nhãn bước / huy hiệu ở dải trên cùng
 *  (huy hiệu nằm giữa trang như "Tiết 1" trên bìa thì đi theo bố cục) */
const fixed = (e: El) => e.group === 'tien-trinh' || (!!e.role && ['card', 'cardback', 'tape'].includes(e.role))
  || (!!e.role && ['step', 'badge', 'mode'].includes(e.role) && e.y < 200);
const isMascot = (e: El) => e.kind === 'img' && (e.role === 'mascot' || e.role === 'deco' || (!!e.lock && e.y + e.h > 760 && e.w <= 260));

type Unit = { els: El[]; box: Box; kind: 'text' | 'pic' | 'main' };
const bbox = (els: El[]): Box => {
  const x = Math.min(...els.map((e) => e.x)), y = Math.min(...els.map((e) => e.y));
  return { x, y, w: Math.max(...els.map((e) => e.x + e.w)) - x, h: Math.max(...els.map((e) => e.y + e.h)) - y };
};
const inside = (a: El, b: El) => { const cx = a.x + a.w / 2, cy = a.y + a.h / 2; return cx >= b.x - 4 && cx <= b.x + b.w + 4 && cy >= b.y - 4 && cy <= b.y + b.h + 4; };

/** gom vật thành khối: hai vật cùng khối nếu tâm vật này nằm trong vật kia */
function unitsOf(els: El[]): Unit[] {
  const parent = els.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < els.length; i++) for (let j = 0; j < els.length; j++) {
    if (i !== j && inside(els[i], els[j])) parent[find(i)] = find(j);
  }
  const groups = new Map<number, El[]>();
  els.forEach((e, i) => { const r = find(i); groups.set(r, [...(groups.get(r) ?? []), e]); });
  return [...groups.values()].map((g) => ({
    els: g, box: bbox(g),
    kind: g.some((e) => INTERACTIVE.has(e.kind)) ? 'main' : g.every((e) => e.kind === 'img') ? 'pic' : 'text',
  }));
}

/** lý do không đổi được bố cục (null = đổi được) */
export function relayoutBlocker(s: Slide): string | null {
  if (s.els.some((e) => e.kind === 'drop' || e.drag)) return 'Trang kéo thả: vị trí các ô mang nghĩa nên giữ nguyên.';
  if (s.els.some((e) => e.role === 'divider' && !e.hide)) return 'Trang bìa / trang chia có bố cục riêng (đổi góc máy cảnh ở bảng Nền).';
  const free = s.els.filter((e) => !e.hide && !fixed(e));
  if (free.filter((e) => INTERACTIVE.has(e.kind)).length > 1) return 'Trang có nhiều trò chơi tương tác.';
  if (!free.some((e) => e.kind === 'text' || e.kind === 'img' || INTERACTIVE.has(e.kind) || (e.kind === 'shape' && !!e.text))) return 'Trang chưa có chữ hay hình để sắp xếp.';
  const units = unitsOf(free.filter((e) => !isMascot(e)));
  if (units.length > 9) return 'Trang có quá nhiều khối để tự sắp xếp.';
  return null;
}

/** sắp lại trang theo bố cục thứ k trở đi (xoay vòng), bỏ qua bố cục làm chữ nhỏ đi / tràn / chồng nhau.
 *  Trả về bố cục đã dùng và số thứ tự (để lần bấm sau đi tiếp); null nếu không bố cục nào đạt. */
export function relayout(s: Slide, k: number): { slide: Slide; layout: (typeof LAYOUTS)[number]; used: number } | null {
  if (relayoutBlocker(s)) return null;
  for (let t = 0; t < LAYOUTS.length; t++) {
    const i = (((k + t) % LAYOUTS.length) + LAYOUTS.length) % LAYOUTS.length;
    const next = arrange(s, LAYOUTS[i]);
    if (good(s, next)) return { slide: next, layout: LAYOUTS[i], used: k + t };
  }
  return null;
}

/** bố cục mới đạt chất lượng: chữ không nhỏ đi quá 15% (và ≥ 24 px), không tràn khung, chữ không chồng chữ */
function good(before: Slide, after: Slide): boolean {
  const old = new Map(before.els.map((e) => [e.id, e]));
  const read = after.els.filter((e) => !e.hide && ((e.kind === 'text' && e.text.trim()) || INTERACTIVE.has(e.kind)));
  for (const e of after.els) {
    const o = old.get(e.id);
    if (!o || e.hide) continue;
    if (e.x < -2 || e.y < -2 || e.x + e.w > SW + 2 || e.y + e.h > SH + 2) { if (e.kind !== 'shape' || e.text) return false; }
    if (e.kind === 'text' && o.kind === 'text' && e.text.trim()) {
      if (e.size < Math.min(24, o.size) || e.size < o.size * 0.85) return false;
      const pw = e.bg ? Math.min(52, e.w * 0.3) : 0, ph = e.bg ? Math.min(24, e.h * 0.3) : 0;
      if (!fits(e.text, e.w - pw, (e.h - ph) * 1.15, e.size, 1.15, 0.5)) return false;
    }
    if (e.kind === 'shape' && o.kind === 'shape' && e.text && e.size && o.size && e.size < Math.min(24, o.size)) return false;
    if (e.kind === 'quiz' && o.kind === 'quiz') {
      const z = (q: typeof e) => quizSizes({ w: q.w, h: q.h, q: q.q, opts: q.opts.map(quizText), cols: q.cols, img: q.opts.some((x) => !!quizImage(x)) });
      const now = z(e), was = z(o);
      if (!now.ok || now.qs < Math.min(was.qs, 40) * 0.85) return false; // câu hỏi không được nhỏ đi rõ rệt
    }
  }
  for (let i = 0; i < read.length; i++) for (let j = i + 1; j < read.length; j++) {
    const a = read[i], b = read[j];
    if (a.x < b.x + b.w - 4 && a.x + a.w > b.x + 4 && a.y < b.y + b.h - 4 && a.y + a.h > b.y + 4) return false;
  }
  return true;
}

function arrange(s: Slide, layout: (typeof LAYOUTS)[number]): Slide {
  const free = s.els.filter((e) => !e.hide && !fixed(e));
  // tiêu đề: chữ có vai trò title, nếu không có thì chữ cỡ lớn nhất ở phần ba trên (không nằm trong khung nào)
  const loose = free.filter((e): e is TextEl => e.kind === 'text' && !free.some((b) => b !== e && b.kind === 'shape' && inside(e, b)));
  const title = loose.find((e) => e.role === 'title' || e.role === 'divider') ?? [...loose].filter((e) => e.y < SH / 3).sort((a, b) => b.size - a.size)[0];
  const mascots = free.filter((e) => e !== title && isMascot(e));
  const units = unitsOf(free.filter((e) => e !== title && !mascots.includes(e)));
  const blocks = units.filter((u) => u.kind !== 'pic'), pics = units.filter((u) => u.kind === 'pic');
  const out = new Map<string, Partial<El>>();

  // dải trên: nhãn cố định → tiêu đề
  const top = Math.max(TOP, ...s.els.filter((e) => !e.hide && fixed(e) && e.kind === 'text' && e.y < 200).map((e) => e.y + e.h + 12));
  const titleH = title ? (title.text.length > 40 ? 150 : 112) : 0;
  const y0 = title ? top + titleH + 18 : top + 20, yEnd = SH - 50;
  const full: Box = { x: M, y: y0, w: SW - 2 * M, h: yEnd - y0 };
  const split = pics.length > 0 && blocks.length > 0;
  const cut = Math.round(full.h * 0.58);
  let textZone: Box = full, picZone: Box = full;
  if (split) {
    if (layout.id === 'text-left') { textZone = { ...full, w: 860 }; picZone = { x: M + 860 + GAP, y: y0, w: full.w - 860 - GAP, h: full.h }; }
    else if (layout.id === 'text-right') { textZone = { ...full, x: SW - M - 860, w: 860 }; picZone = { x: M, y: y0, w: full.w - 860 - GAP, h: full.h }; }
    else if (layout.id === 'text-top') { textZone = { ...full, h: cut }; picZone = { x: M, y: y0 + cut + GAP, w: full.w, h: full.h - cut - GAP }; }
    else { textZone = { x: 300, y: y0, w: SW - 600, h: full.h }; picZone = full; }
  } else if (layout.id === 'text-left') textZone = { ...full, w: 900 }; // chừa phía phải cho hình cảnh nền
  else if (layout.id === 'text-right') textZone = { ...full, x: SW - M - 900, w: 900 };
  else if (layout.id === 'text-top') textZone = { ...full, h: cut };
  else textZone = { x: 240, y: y0, w: SW - 480, h: full.h };

  if (title) {
    const tw = layout.id === 'center' ? SW - 400 : SW - 2 * M, tx = layout.id === 'center' ? 200 : M;
    out.set(title.id, { x: tx, y: top, w: tw, h: titleH, size: fit(title.text, tw - (title.bg ? 52 : 0), titleH - (title.bg ? 24 : 0), Math.max(title.size, 56), 30), align: layout.id === 'center' ? 'center' : 'left' } as Partial<TextEl>);
  }
  // khối chữ / khối tương tác: lưới 1 cột (≤ 3 khối) hoặc 2 cột; khối tương tác chiếm phần lớn chiều cao
  const align = layout.id === 'center' ? 'center' : 'left';
  placeGrid(blocks, textZone, out, align, true);
  // hình: lưới đều trong vùng hình; bố cục giữa: hình nhỏ ở hai mép
  if (pics.length) {
    if (layout.id === 'center' && blocks.length) {
      pics.forEach((u, i) => {
        const side = i % 2 === 0 ? 24 : SW - 24 - 170, row = Math.floor(i / 2);
        moveUnit(u, { x: side, y: y0 + row * 200, w: 170, h: 180 }, out);
      });
    } else placeGrid(pics, picZone, out, 'center', false);
  }
  // bạn Milo / hình trang trí: góc dưới phía không có chữ
  mascots.forEach((m, i) => {
    const s0 = Math.min(200, Math.max(m.w, m.h));
    const right = layout.id !== 'text-right';
    out.set(m.id, fitBox(m, { x: right ? SW - 28 - s0 - i * (s0 + 8) : 28 + i * (s0 + 8), y: SH - 24 - s0, w: s0, h: s0 }));
  });

  const els = s.els.map((e) => (out.has(e.id) ? ({ ...e, ...out.get(e.id) } as El) : e));
  return { ...s, els, sceneVariant: s.scene ? layout.variant : s.sceneVariant };
}

/** xếp các khối vào vùng theo lưới; khối tương tác được ưu tiên chiều cao */
function placeGrid(units: Unit[], zone: Box, out: Map<string, Partial<El>>, align: 'left' | 'center', stack: boolean) {
  const n = units.length;
  if (!n) return;
  const cols = n <= 3 && stack ? 1 : n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  // chiều cao từng hàng: hàng có khối tương tác được nhiều hơn
  const weight = Array.from({ length: rows }, (_, r) => (units.slice(r * cols, r * cols + cols).some((u) => u.kind === 'main') ? 2.4 : 1));
  const total = weight.reduce((a, b) => a + b, 0), avail = zone.h - GAP * (rows - 1);
  const cw = (zone.w - GAP * (cols - 1)) / cols;
  let y = zone.y;
  for (let r = 0; r < rows; r++) {
    const rh = (avail * weight[r]) / total;
    units.slice(r * cols, r * cols + cols).forEach((u, c) => moveUnit(u, { x: zone.x + c * (cw + GAP), y, w: cw, h: rh }, out, align));
    y += rh + GAP;
  }
}

/** đặt một khối vào ô: chữ rời thì giãn ra hết ô và chọn lại cỡ chữ; khối nhiều vật thì co giãn đều cả khối */
function moveUnit(u: Unit, cell: Box, out: Map<string, Partial<El>>, align: 'left' | 'center' = 'center') {
  const only = u.els.length === 1 ? u.els[0] : null;
  // nhãn / huy hiệu ngắn có nền: giữ kích thước, chỉ dời chỗ
  if (only?.kind === 'text' && only.bg && only.text.length <= 24 && only.w <= 480) {
    out.set(only.id, { x: Math.round(align === 'left' ? cell.x : cell.x + (cell.w - only.w) / 2), y: Math.round(cell.y), rot: 0 });
    return;
  }
  if (only?.kind === 'text') {
    const h = Math.min(cell.h, Math.max(110, only.h * 1.4));
    out.set(only.id, { x: cell.x, y: cell.y, w: cell.w, h, size: fit(only.text, cell.w - (only.bg ? 52 : 0), h - (only.bg ? 24 : 0), Math.max(only.size, 40), 28), align, rot: 0 } as Partial<TextEl>);
    return;
  }
  if (only && INTERACTIVE.has(only.kind)) { out.set(only.id, { x: cell.x, y: cell.y, w: cell.w, h: cell.h, rot: 0 }); return; }
  const b = u.box;
  const sc = Math.min(MAX_UP, cell.w / b.w, cell.h / b.h);
  const ox = cell.x + (align === 'left' && u.kind !== 'pic' ? 0 : (cell.w - b.w * sc) / 2), oy = cell.y + (cell.h - b.h * sc) / 2;
  for (const e of u.els) {
    const p: Partial<El> = { x: Math.round(ox + (e.x - b.x) * sc), y: Math.round(oy + (e.y - b.y) * sc), w: Math.round(e.w * sc), h: Math.round(e.h * sc) };
    if (e.kind === 'text') (p as Partial<TextEl>).size = Math.round(e.size * sc);
    if (e.kind === 'shape' && e.size) (p as { size?: number }).size = Math.round(e.size * sc);
    out.set(e.id, p);
  }
}

/** đặt vật vừa ô, giữ tỉ lệ, căn giữa ô */
function fitBox(e: El, b: Box): Partial<El> {
  const r = e.w / Math.max(1, e.h);
  let w = b.w, h = w / r;
  if (h > b.h) { h = b.h; w = h * r; }
  return { x: Math.round(b.x + (b.w - w) / 2), y: Math.round(b.y + (b.h - h) / 2), w: Math.round(w), h: Math.round(h), rot: 0 };
}

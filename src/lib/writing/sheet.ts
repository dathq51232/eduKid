// Trang vở luyện chữ khổ A4 để in: giấy ô li 4 hoặc 5 li, chữ mẫu bằng font tập viết tiểu học (HP001...),
// dòng mẫu, dòng tô (mờ / chấm / rỗng), dòng trống để em viết; tiêu đề, họ tên, hoạ tiết ở góc vở.
// Đơn vị đo: milimét (SVG viewBox 210 x 297).

export type FontId = 'hp4n' | 'hp4b' | 'hp4hn' | 'hp4hb' | 'hp5hn' | 'hp5hb' | 'hp30n' | 'hp30b' | 'kieu5' | 'kieu2' | 'to4' | 'in-n' | 'in-b';
export type TapFont = { id: FontId; label: string; group: string; /** phần của 1 em ứng với 1 ô li (chữ thường cao 2 li) */ emPerLi: number; /** nét cao nhất / nét thấp nhất (ô li, cỡ vừa) */ asc?: number; desc?: number };

// Font tập viết của tác giả Nguyễn Hồng Hải (HP Design) — bản rút gọn chỉ còn chữ Latin + tiếng Việt, ở public/fonts/tap-viet.
// Mọi font HP001: 1 ô li = 412/2048 em, chân chữ nằm trên dòng kẻ, chữ thường cao 2 li, b h k l cao 5 li, g y kéo xuống 3 li.
const HP = 412 / 2048;
export const TAP_FONTS: TapFont[] = [
  { id: 'hp4hn', label: 'Chữ đứng nét thường (4H)', group: 'HP001 4H', emPerLi: HP },
  { id: 'hp4hb', label: 'Chữ đứng nét đậm (4H)', group: 'HP001 4H', emPerLi: HP },
  { id: 'hp4n', label: 'Chữ đứng nét thường (bản cũ, thiếu chữ z)', group: 'HP001 4 hàng', emPerLi: HP },
  { id: 'hp4b', label: 'Chữ đứng nét đậm (bản cũ, thiếu chữ z)', group: 'HP001 4 hàng', emPerLi: HP },
  { id: 'hp5hn', label: 'Chữ đứng nét thường (5H)', group: 'HP001 5H', emPerLi: HP },
  { id: 'hp5hb', label: 'Chữ đứng nét đậm (5H)', group: 'HP001 5H', emPerLi: HP },
  { id: 'hp30n', label: 'Chữ đứng mới — nét thường', group: 'HP001 (mẫu mới)', emPerLi: HP },
  { id: 'hp30b', label: 'Chữ đứng mới — nét đậm', group: 'HP001 (mẫu mới)', emPerLi: HP },
  { id: 'kieu5', label: 'Chữ nghiêng nét thanh đậm', group: 'Chữ sáng tạo', emPerLi: HP },
  { id: 'kieu2', label: 'Chữ nghiêng kiểu 2', group: 'Chữ sáng tạo', emPerLi: HP },
  { id: 'to4', label: 'Chữ nét rỗng (để tô)', group: 'Chữ tô', emPerLi: HP },
  { id: 'in-n', label: 'Chữ in thường (số, phép tính)', group: 'Chữ in', emPerLi: 0.28, asc: 2.7, desc: 0.8 },
  { id: 'in-b', label: 'Chữ in đậm', group: 'Chữ in', emPerLi: 0.28, asc: 2.7, desc: 0.8 },
];
// Các font tập viết cũ để một số ký tự ASCII ở ô của chữ Việt (vd. '<' hiện thành 'ớ', '·' thành 'ế', '×' thành 'ẽ').
// Chỉ tin chữ cái, chữ số và vài dấu đã kiểm tra; ký tự khác vẽ bằng font hệ thống.
const VI_LETTERS = 'aàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵ';
const SAFE = new Set([...VI_LETTERS, ...VI_LETTERS.toUpperCase(), ...'fjwzFJWZ0123456789 =+-:.,!?()/%"\';*#&_']);
const MISSING: Partial<Record<FontId, string>> = { hp4n: 'z', hp4b: 'z' }; // bản cũ không có chữ z
export const FALLBACK_FONT = 'Arial, "Helvetica Neue", sans-serif';
/** Cỡ font hệ thống so với cỡ font tập viết để chiều cao chữ thường khớp nhau (x-height Arial ≈ 0,52 em) */
export const fallbackScale = (font: string) => (2 * fontOf(font).emPerLi) / 0.52;
/** Tách chữ thành đoạn vẽ được bằng font tập viết / đoạn phải vẽ bằng font hệ thống */
export function textSegments(t: string, font: FontId): { t: string; safe: boolean }[] {
  const miss = MISSING[font] ?? '';
  const out: { t: string; safe: boolean }[] = [];
  for (const ch of t) {
    const ok = SAFE.has(ch) && !miss.includes(ch);
    const last = out[out.length - 1];
    if (last && last.safe === ok) last.t += ch; else out.push({ t: ch, safe: ok });
  }
  return out;
}

export const fontOf = (id: string) => TAP_FONTS.find((f) => f.id === id) ?? TAP_FONTS[0];
export const fontFamily = (id: string) => `TapViet-${fontOf(id).id}`;

const loaded = new Map<string, Promise<void>>();
/** Nạp font tập viết khi cần (mỗi font ~15 KB) */
export function loadTapFont(id: string): Promise<void> {
  const f = fontOf(id);
  let p = loaded.get(f.id);
  if (!p) {
    p = (async () => {
      const face = new FontFace(fontFamily(f.id), `url(/fonts/tap-viet/${f.id}.woff2) format('woff2')`);
      await face.load();
      document.fonts.add(face);
    })();
    p.catch(() => loaded.delete(f.id));
    loaded.set(f.id, p);
  }
  return p;
}

export type TraceStyle = 'mo' | 'cham' | 'rong';
export type PageSize = 'a4' | 'vo' | 'a5';
export const PAGE_SIZES: { id: PageSize; label: string; w: number; h: number }[] = [
  { id: 'a4', label: 'A4 (21 × 29,7 cm)', w: 210, h: 297 },
  { id: 'vo', label: 'Khổ vở học sinh (17 × 24 cm)', w: 170, h: 240 },
  { id: 'a5', label: 'A5 (14,8 × 21 cm)', w: 148, h: 210 },
];
export const pageDims = (id: PageSize) => PAGE_SIZES.find((p) => p.id === id) ?? PAGE_SIZES[0];
export type Corner = 'tl' | 'tr' | 'bl' | 'br';
export type BorderStyle = 'none' | 'don' | 'doi' | 'cham' | 'song';

export type SheetSettings = {
  title: string;
  header: boolean; // họ tên, lớp, ngày
  headerEvery: boolean; // lặp tiêu đề ở mọi trang
  text: string; // mỗi dòng là một câu / một dòng thơ
  layout: 'cau' | 'lap'; // viết cả câu / lặp kín dòng (chữ cái, vần, từ)
  font: FontId;
  size: 'vua' | 'nho'; // cỡ vừa: chữ thường 2 li — cỡ nhỏ: 1 li
  paper: 4 | 5; // vở 4 ô li / 5 ô li
  oli: number; // cỡ một ô li (mm)
  lineColor: string;
  grid: 'ngang' | 'vuong'; // vở tập viết (dòng li ngang) / ô li vuông như vở Toán
  pageSize: PageSize;
  vertical: boolean; // đường kẻ dọc
  margin: boolean; // lề đỏ
  marginColor: string;
  ink: string; // màu chữ mẫu
  sample: number; // số dòng chữ mẫu
  trace: number; // số dòng tô
  blank: number; // số dòng để trống
  traceStyle: TraceStyle;
  traceColor: string;
  corners: Record<Corner, string>; // 'none' | 'f:<hoa văn bo góc>' | 'm:<hoạ tiết>' | 's:<tranh dán>'
  decoSize: number; // mm
  decoColor: string;
  border: BorderStyle;
  borderColor: string;
};

export const LINE_COLORS: { c: string; label: string }[] = [
  { c: '#8b5cf6', label: 'Tím' }, { c: '#3b82f6', label: 'Xanh dương' }, { c: '#10b981', label: 'Xanh lá' },
  { c: '#ec4899', label: 'Hồng' }, { c: '#f59e0b', label: 'Cam' }, { c: '#6b7280', label: 'Xám' }, { c: '#111827', label: 'Đen' },
];

export const DEFAULT_SHEET: SheetSettings = {
  title: 'Luyện viết chữ đẹp', header: true, headerEvery: false,
  text: 'Ăn quả nhớ kẻ trồng cây\nUống nước nhớ nguồn',
  layout: 'cau', font: 'hp4hn', size: 'vua', paper: 4, oli: 2,
  lineColor: '#8b5cf6', grid: 'ngang', pageSize: 'a4', vertical: true, margin: true, marginColor: '#ef4444',
  ink: '#1e3a8a', sample: 1, trace: 2, blank: 2, traceStyle: 'mo', traceColor: '#94a3b8',
  corners: { tl: 'f:hong', tr: 'none', bl: 'none', br: 'f:hong' }, decoSize: 34, decoColor: '#ec4899',
  border: 'none', borderColor: '#8b5cf6',
};

/** Sửa / bổ sung các khoá thiếu khi đọc cài đặt đã lưu (bản cũ hoặc dữ liệu lạ) */
export function normalizeSheet(raw: unknown): SheetSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<SheetSettings>;
  const d = DEFAULT_SHEET;
  const num = (v: unknown, lo: number, hi: number, def: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def);
  const str = (v: unknown, def: string, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : def);
  const color = (v: unknown, def: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : def);
  const corner = (v: unknown) => (typeof v === 'string' && /^(none|[msf]:[a-z0-9-]{1,20})$/.test(v) ? v : 'none');
  const c = (r.corners ?? {}) as Partial<Record<Corner, string>>;
  return {
    title: str(r.title, d.title, 120), header: r.header ?? d.header, headerEvery: r.headerEvery ?? d.headerEvery,
    text: str(r.text, d.text, 4000), layout: r.layout === 'lap' ? 'lap' : 'cau',
    font: TAP_FONTS.some((f) => f.id === r.font) ? (r.font as FontId) : d.font,
    size: r.size === 'nho' ? 'nho' : 'vua', paper: r.paper === 5 ? 5 : 4, oli: num(r.oli, 1.5, 3.5, d.oli),
    lineColor: color(r.lineColor, d.lineColor), grid: r.grid === 'vuong' ? 'vuong' : 'ngang',
    pageSize: PAGE_SIZES.some((p) => p.id === r.pageSize) ? (r.pageSize as PageSize) : 'a4', vertical: r.vertical ?? d.vertical, margin: r.margin ?? d.margin, marginColor: color(r.marginColor, d.marginColor),
    ink: color(r.ink, d.ink), sample: num(r.sample, 0, 3, d.sample), trace: num(r.trace, 0, 6, d.trace), blank: num(r.blank, 0, 10, d.blank),
    traceStyle: r.traceStyle === 'cham' || r.traceStyle === 'rong' ? r.traceStyle : 'mo', traceColor: color(r.traceColor, d.traceColor),
    corners: { tl: corner(c.tl), tr: corner(c.tr), bl: corner(c.bl), br: corner(c.br) },
    decoSize: num(r.decoSize, 12, 50, d.decoSize), decoColor: color(r.decoColor, d.decoColor),
    border: (['none', 'don', 'doi', 'cham', 'song'] as BorderStyle[]).includes(r.border as BorderStyle) ? (r.border as BorderStyle) : 'none',
    borderColor: color(r.borderColor, d.borderColor),
  };
}

/* ------------------------------------------------------------------ dàn trang */
export const PAGE_W = 210;
export const PAGE_H = 297;

export type RowKind = 'mau' | 'to' | 'trong';
export type SheetRow = { kind: RowKind; base: number; pieces: { text: string; x: number }[] };
export type SheetPage = { header: boolean; grid: { x0: number; x1: number; y0: number; y1: number; textX: number }; rows: SheetRow[] };
export type SheetLayout = { pages: SheetPage[]; li: number; sq: number; fs: number; pitch: number; overflow: string[]; W: number; H: number };

/** Đo chiều rộng chữ (mm) — truyền vào hàm đo bằng canvas sau khi font đã nạp */
export type Measure = (text: string) => number; // trả về độ rộng ứng với cỡ chữ 1 mm

/** Chia nội dung thành các dòng chữ, dàn vào từng trang A4 */
export function layoutSheet(s: SheetSettings, measure: Measure): SheetLayout {
  const { w: PAGE_W, h: PAGE_H } = pageDims(s.pageSize);
  const PAD = PAGE_W < 200 ? 9 : 12; // lề giấy (mm)
  const li = s.oli;
  const sq = li * s.paper; // một ô vuông lớn
  const small = s.size === 'nho';
  const tf = fontOf(s.font);
  const k = small ? 0.5 : 1;
  const fs = (li * k) / tf.emPerLi; // cỡ chữ (mm)
  // chữ viết tay: nét cao 5 li, nét thấp 3 li (cỡ vừa); chân chữ luôn nằm trên dòng kẻ đậm.
  // Khoảng cách dòng = số ô lớn đủ chứa cả nét cao lẫn nét thấp (cỡ vừa vở 4 li: 2 ô lớn; cỡ nhỏ: 1 ô lớn).
  const asc = (tf.asc ?? 5) * k, desc = (tf.desc ?? 3) * k;
  const pitch = Math.max(1, Math.ceil((asc + desc - 0.01) / s.paper)) * sq;
  const firstBase = Math.max(1, Math.ceil((asc - 0.01) / s.paper)) * sq;

  const cols = Math.floor((PAGE_W - PAD * 2) / sq);
  const gw = cols * sq;
  const x0 = (PAGE_W - gw) / 2;
  const x1 = x0 + gw;
  const textX = x0 + (s.margin ? sq : 0) + li;
  const maxW = x1 - textX - li;

  const headH = s.header ? (PAGE_W < 200 ? 26 : 24) : 14; // tiêu đề + dòng họ tên / chỉ tiêu đề
  // chừa chỗ cho hoạ tiết góc để không đè lên dòng kẻ
  const decoH = 5 + s.decoSize * 0.85 + 1;
  const topDeco = s.corners.tl !== 'none' || s.corners.tr !== 'none' ? decoH : 0;
  const bottomDeco = s.corners.bl !== 'none' || s.corners.br !== 'none' ? decoH : 0;
  const gridTop = (header: boolean) => Math.max(PAD + (header ? headH : 2), topDeco);
  const grid = (header: boolean) => {
    const y0 = gridTop(header);
    const avail = PAGE_H - Math.max(PAD, bottomDeco) - y0;
    const y1 = y0 + Math.floor(avail / sq) * sq;
    return { x0, x1, y0, y1, textX };
  };

  // các dòng chữ sau khi xuống dòng theo từ
  const sentences = s.text.split(/\r?\n/).map((t) => t.replace(/\t/g, '    ').trimEnd().replace(/^\s+/, '')).filter(Boolean).slice(0, 60); // giữ khoảng trắng giữa các phép tính
  const overflow: string[] = [];
  const wrap = (t: string): string[] => {
    const out: string[] = [];
    let line = '';
    for (const w of t.split(' ')) {
      const nxt = line ? `${line} ${w}` : w;
      if (measure(nxt) * fs > maxW && line) { out.push(line); line = w; } else line = nxt;
    }
    if (line) out.push(line);
    for (const l of out) if (measure(l) * fs > maxW) overflow.push(l);
    return out;
  };
  const piecesOf = (t: string): { text: string; x: number }[] => {
    if (s.layout !== 'lap') return [{ text: t, x: textX }];
    const w = measure(t) * fs;
    const gap = Math.max(sq, w * 0.35);
    const n = Math.max(1, Math.floor((maxW + gap) / (w + gap)));
    return Array.from({ length: n }, (_, i) => ({ text: t, x: textX + i * (w + gap) }));
  };

  type Want = { kind: RowKind; pieces: { text: string; x: number }[] };
  const wants: Want[] = [];
  for (const sen of sentences) {
    const lines = s.layout === 'lap' ? [sen] : wrap(sen);
    for (const ln of lines) {
      const p = piecesOf(ln);
      for (let i = 0; i < s.sample; i++) wants.push({ kind: 'mau', pieces: p });
      for (let i = 0; i < s.trace; i++) wants.push({ kind: 'to', pieces: p });
    }
    for (let i = 0; i < s.blank; i++) wants.push({ kind: 'trong', pieces: [] });
  }

  const pages: SheetPage[] = [];
  let n = 0;
  while (n < wants.length || pages.length === 0) {
    const header = (pages.length === 0 || s.headerEvery) && Boolean(s.title.trim() || s.header);
    const g = grid(header);
    const rows: SheetRow[] = [];
    for (let base = g.y0 + firstBase; base + desc * li <= g.y1 + 0.01 && n < wants.length; base += pitch) {
      rows.push({ ...wants[n], base });
      n++;
    }
    pages.push({ header, grid: g, rows });
    if (!rows.length) break; // phòng khi trang quá nhỏ
    if (pages.length >= 30) break;
  }
  return { pages, li, sq, fs, pitch, overflow, W: PAGE_W, H: PAGE_H };
}

// Tạo lịch báo giảng từ Thời khoá biểu + Phân phối chương trình (PPCT) — dành cho tổ trưởng chuyên môn.
// Quy tắc: docs/LICH-BAO-GIANG-QUY-TAC.md. Dữ liệu chung của khối (PPCT, lịch tuần, TKB từng lớp) lưu theo trường.
//
//   Lịch tuần: Thứ Hai tuần 1 + các tuần nghỉ  →  ngày của tuần dạy n
//   TKB lớp:   6 thứ × 8 tiết (1–4 sáng, 5–8 chiều), mỗi ô một môn; "tiết thứ mấy của môn trong tuần" app tự đánh
//   PPCT khối: (tuần, môn, thứ tự trong tuần) → (tiết PPCT, tên bài, nội dung tích hợp)
//   Lịch tuần n của lớp = ghép từng ô TKB với dòng PPCT tương ứng + danh sách cảnh báo cho tổ trưởng.
// Lịch tạo ra có dạng `Schedule` như lịch nạp từ Excel → dùng tiếp được bộ soạn giáo án, xuất Word sẵn có.

import type { Sheet } from '../xlsx-read';
import { XS, range, type XCell, type XSheet } from '../xlsx';
import { addDays } from './generate';
import { SUBJECT_ALIASES } from './schedule-rules';
import { canonicalSubjectLabel, dateOf, fold, splitIntegration, subjectOf, type Schedule, type ScheduleRow } from './schedule';

/** Một tiết trong PPCT */
export type PpctItem = { s: string; w: number; n: number; p: number; t: string; i?: string };
/** Lịch tuần của trường */
export type WeekCalendar = {
  /** Thứ Hai của tuần 1 (yyyy-mm-dd) */
  start: string;
  /** Thứ Hai của các tuần nghỉ (Tết, nghỉ dài) — không tính là tuần dạy */
  breaks: string[];
  /** số ngày học trong tuần: 5 (Thứ 2–6) hoặc 6 (đến Thứ 7) */
  days: 5 | 6;
};
/** Thời khoá biểu một lớp: cells[thứ 0–5][tiết 0–7] = tên môn ('' = trống) */
export type Tkb = { cells: string[][] };
/** Dữ liệu chung của một khối (một dòng / trường / khối) */
export type KhoiData = {
  v: 1;
  ppct: PpctItem[];
  /** file PPCT đã nạp (để hiện cho tổ trưởng) */
  ppctSource?: string;
  cal: WeekCalendar;
  /** TKB theo tên lớp ("1A1") */
  tkb: Record<string, Tkb>;
  /** tên trường, cơ quan chủ quản in ở đầu lịch */
  school?: string;
  agency?: string;
};

export const DAY_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const SLOTS = 8;
export const MORNING = 4;

export const emptyTkb = (): Tkb => ({ cells: Array.from({ length: 6 }, () => Array(SLOTS).fill('')) });
export const emptyKhoi = (): KhoiData => ({ v: 1, ppct: [], cal: { start: '', breaks: [], days: 5 }, tkb: {} });

/** Khoá môn để ghép TKB với PPCT: bỏ dấu, quy tên viết tắt về tên chuẩn ("HĐ T.NGHIỆM" = "HĐTN" = "Hoạt động trải nghiệm") */
export function subjectKey(label: string): string {
  const f = fold(label).replace(/\s+/g, ' ').trim();
  if (!f) return '';
  const alias = SUBJECT_ALIASES.find(([re]) => re.test(f))?.[1];
  return alias ? fold(alias) : f;
}

/** Tên môn để hiện (TIẾNG VIỆT → Tiếng Việt, HĐ T.NGHIỆM → HĐTN; TĂNG CƯỜNG + "Ôn toán" → Toán (BS)) */
export function subjectDisplay(label: string, title = ''): string {
  const { subject, extra } = subjectOf(label, title);
  const out = canonicalSubjectLabel(label.trim(), subject, extra);
  // tên môn viết hoa toàn bộ mà app không nhận ra môn (TĂNG CƯỜNG + "Tiết đọc thư viện") → viết hoa chữ đầu
  return out === out.toUpperCase() && out.length > 4 ? out.charAt(0) + out.slice(1).toLowerCase() : out;
}
/** Tên bài gọn: "ac ăc âc -Tiết 1" → "ac ăc âc - Tiết 1", "( Tiết 2)" → "(Tiết 2)" */
const tidy = (t: string) => t.replace(/\s*[-–]\s*(Tiết\s*\d)/g, ' - $1').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s{2,}/g, ' ').trim();

// ───────────── Lịch tuần ─────────────

const isMonday = (iso: string) => !!iso && new Date(`${iso}T12:00:00`).getDay() === 1;

/** Thứ Hai của tuần dạy n (bỏ qua tuần nghỉ); '' nếu chưa đặt ngày tuần 1 */
export function mondayOfWeek(cal: WeekCalendar, n: number): string {
  if (!isMonday(cal.start) || n < 1) return '';
  const off = new Set(cal.breaks);
  let d = cal.start, k = 0;
  for (let guard = 0; guard < 120; guard++) {
    if (!off.has(d)) { k++; if (k === n) return d; }
    d = addDays(d, 7);
  }
  return '';
}

/** Tuần dạy chứa ngày iso (0 nếu trước tuần 1 hoặc rơi vào tuần nghỉ) */
export function weekOfDate(cal: WeekCalendar, iso: string): number {
  if (!isMonday(cal.start) || iso < cal.start) return 0;
  const off = new Set(cal.breaks);
  let d = cal.start, k = 0;
  for (let guard = 0; guard < 120; guard++) {
    const next = addDays(d, 7);
    if (!off.has(d)) k++;
    if (iso < next) return off.has(d) ? 0 : k;
    d = next;
  }
  return 0;
}

// ───────────── TKB ─────────────

/** Đánh "tiết thứ mấy của môn trong tuần" theo thứ tự Thứ 2 tiết 1 → Thứ 7 tiết 8 */
export function numberTkb(tkb: Tkb, days = 6): { day: number; slot: number; label: string; key: string; nth: number }[] {
  const seen = new Map<string, number>();
  const out: { day: number; slot: number; label: string; key: string; nth: number }[] = [];
  for (let d = 0; d < Math.min(days, 6); d++) for (let k = 0; k < SLOTS; k++) {
    const label = (tkb.cells[d]?.[k] ?? '').trim();
    const key = subjectKey(label);
    if (!key) continue;
    const nth = (seen.get(key) ?? 0) + 1;
    seen.set(key, nth);
    out.push({ day: d, slot: k, label, key, nth });
  }
  return out;
}

/** Số tiết mỗi môn trong TKB */
export function tkbCounts(tkb: Tkb, days = 6): Map<string, { label: string; n: number }> {
  const m = new Map<string, { label: string; n: number }>();
  for (const x of numberTkb(tkb, days)) m.set(x.key, { label: m.get(x.key)?.label ?? x.label, n: (m.get(x.key)?.n ?? 0) + 1 });
  return m;
}

// ───────────── PPCT ─────────────

export type PpctIndex = { get: (w: number, key: string, n: number) => PpctItem | undefined; week: (w: number, key: string) => PpctItem[]; subjects: Map<string, { label: string; perWeek: Map<number, number>; total: number; maxWeek: number }> };

export function indexPpct(ppct: PpctItem[]): PpctIndex {
  const map = new Map<string, PpctItem>();
  const byWeek = new Map<string, PpctItem[]>();
  const subjects: PpctIndex['subjects'] = new Map();
  for (const x of ppct) {
    const key = subjectKey(x.s);
    const k = `${x.w}|${key}|${x.n}`;
    if (!map.has(k)) map.set(k, x);
    const wk = `${x.w}|${key}`;
    byWeek.set(wk, [...(byWeek.get(wk) ?? []), x]);
    const s = subjects.get(key) ?? { label: x.s, perWeek: new Map<number, number>(), total: 0, maxWeek: 0 };
    s.perWeek.set(x.w, (s.perWeek.get(x.w) ?? 0) + 1);
    s.total++;
    s.maxWeek = Math.max(s.maxWeek, x.w);
    subjects.set(key, s);
  }
  return { get: (w, key, n) => map.get(`${w}|${key}|${n}`), week: (w, key) => byWeek.get(`${w}|${key}`) ?? [], subjects };
}

/** Kiểm tra PPCT khi nạp: trùng (tuần, môn, thứ tự), thứ tự trong tuần đứt quãng, tiết PPCT không liền mạch */
export function checkPpct(ppct: PpctItem[]): string[] {
  const out: string[] = [];
  const idx = indexPpct(ppct);
  const dup = new Map<string, number>();
  for (const x of ppct) { const k = `${x.w}|${subjectKey(x.s)}|${x.n}`; dup.set(k, (dup.get(k) ?? 0) + 1); }
  const dups = [...dup].filter(([, n]) => n > 1).map(([k]) => k.split('|'));
  if (dups.length) out.push(`${dups.length} chỗ trùng tuần – môn – thứ tự tiết (vd. tuần ${dups[0][0]}, ${idx.subjects.get(dups[0][1])?.label ?? dups[0][1]}, tiết thứ ${dups[0][2]}): chỉ dùng dòng đầu tiên.`);
  for (const [key, s] of idx.subjects) {
    const items = ppct.filter((x) => subjectKey(x.s) === key);
    const ps = items.map((x) => x.p);
    const resets = ps.filter((p, i) => i > 0 && p < ps[i - 1]).length;
    if (resets) out.push(`${s.label}: số tiết PPCT chạy lại từ đầu ${resets} lần — kiểm tra lại cột PPCT.`);
    for (const [w] of s.perWeek) {
      const ns = idx.week(w, key).map((x) => x.n).sort((a, b) => a - b);
      if (ns.some((n, i) => n !== i + 1)) { out.push(`${s.label}, tuần ${w}: thứ tự tiết trong tuần không liền (${ns.join(', ')}).`); break; }
    }
  }
  return out;
}

// ───────────── Ghép thành lịch tuần ─────────────

export type BuiltWeek = { schedule: Schedule; warnings: string[]; monday: string; to: string };

/** Sinh lịch báo giảng tuần n của một lớp */
export function buildWeek(data: KhoiData, grade: number, className: string, n: number, idx: PpctIndex = indexPpct(data.ppct)): BuiltWeek {
  const tkb = data.tkb[className] ?? emptyTkb();
  const days = data.cal.days ?? 5;
  const monday = mondayOfWeek(data.cal, n);
  const warnings: string[] = [];
  if (!monday) warnings.push('Chưa đặt ngày Thứ Hai của tuần 1 trong Lịch tuần: lịch chưa có ngày.');
  const slots = numberTkb(tkb, days);
  if (!slots.length) warnings.push(`Lớp ${className} chưa có thời khoá biểu.`);
  const rows: ScheduleRow[] = [];
  for (const x of slots) {
    const it = idx.get(n, x.key, x.nth);
    const { subject, extra } = subjectOf(x.label, it?.t ?? '');
    const morning = x.slot < MORNING;
    rows.push({
      day: x.day, date: monday ? addDays(monday, x.day) : '', session: morning ? 'Sáng' : 'Chiều', period: morning ? x.slot + 1 : x.slot - MORNING + 1,
      subjectLabel: subjectDisplay(x.label, it?.t ?? ''), subject, extra,
      ppct: it ? String(it.p) : '', title: it ? tidy(it.t) : '(chưa có trong PPCT)', integration: it?.i ?? '', adjust: '',
    });
  }
  // so số tiết TKB với PPCT của tuần; tiết PPCT nối tiếp tuần trước
  const counts = tkbCounts(tkb, days);
  for (const [key, c] of counts) {
    const inPpct = idx.week(n, key).length;
    const name = subjectDisplay(c.label);
    if (!idx.subjects.has(key)) warnings.push(`${name}: không có trong PPCT của khối (kiểm tra tên môn).`);
    else if (inPpct === 0) warnings.push(`${name}: PPCT không có tiết nào ở tuần ${n}.`);
    else if (c.n > inPpct) warnings.push(`${name}: TKB có ${c.n} tiết, PPCT tuần ${n} chỉ có ${inPpct} — ${c.n - inPpct} tiết chưa có bài.`);
    else if (c.n < inPpct) warnings.push(`${name}: TKB có ${c.n} tiết, PPCT tuần ${n} có ${inPpct} — ${inPpct - c.n} tiết PPCT chưa được xếp.`);
    if (n > 1 && idx.subjects.has(key)) {
      const prev = idx.week(n - 1, key).map((x) => x.p), cur = idx.week(n, key).map((x) => x.p);
      if (prev.length && cur.length && Math.min(...cur) !== Math.max(...prev) + 1 && Math.min(...cur) !== 1) warnings.push(`${name}: tiết PPCT tuần ${n} bắt đầu từ ${Math.min(...cur)}, tuần ${n - 1} kết thúc ở ${Math.max(...prev)} (không liền).`);
    }
  }
  for (const [key, s] of idx.subjects) if (!counts.has(key) && idx.week(n, key).length) warnings.push(`${subjectDisplay(s.label)}: PPCT tuần ${n} có ${idx.week(n, key).length} tiết nhưng TKB lớp ${className} không có môn này.`);
  const schedule: Schedule = {
    grade, week: String(n), monday, rows, skipped: [], warnings,
    source: { sheet: `TKB lớp ${className}`, form: 'lịch tạo từ thời khoá biểu + PPCT của khối', notes: [] },
  };
  return { schedule, warnings, monday, to: monday ? addDays(monday, days - 1) : '' };
}

// ───────────── Nạp từ file Excel của tổ (mẫu "LBG tự động") ─────────────

const cell = (r: string[] | undefined, c: number | undefined) => (c === undefined ? '' : (r?.[c] ?? '').trim());
const num = (s: string) => { const v = Number(String(s).replace(',', '.').trim()); return Number.isFinite(v) ? v : NaN; };

/** Trang PPCT: tiêu đề có các cột Môn/Phân môn · Tuần · Tiết thứ/tuần · PPCT · Tên bài */
export function parsePpctSheet(sheet: Sheet): { grade: number | null; items: PpctItem[] } | null {
  for (let h = 0; h < Math.min(12, sheet.rows.length); h++) {
    const head = sheet.rows[h].map((x) => fold(x));
    const find = (ok: (f: string) => boolean) => { const i = head.findIndex((f) => !!f && ok(f)); return i < 0 ? undefined : i; };
    const cS = find((f) => /^(phan mon|mon hoc|mon)$/.test(f));
    const cW = find((f) => /^tuan( hoc| thu)?$/.test(f));
    const cN = find((f) => /(tiet thu|thu tu)/.test(f) && !/mon/.test(f));
    const cP = find((f) => /^(ppct|tiet ppct|tiet theo ppct)$/.test(f));
    const cT = find((f) => /(ten bai|bai day|noi dung|dau bai)/.test(f));
    if (cS === undefined || cW === undefined || cN === undefined || cP === undefined || cT === undefined) continue;
    const items: PpctItem[] = [];
    for (const r of sheet.rows.slice(h + 1)) {
      const s = cell(r, cS), w = num(cell(r, cW)), n = num(cell(r, cN)), p = num(cell(r, cP));
      const raw = cell(r, cT).replace(/\s+/g, ' ');
      if (!s || !(w >= 1 && w <= 60) || !(n >= 1 && n <= 30) || !raw) continue;
      const { title, integration } = splitIntegration(raw);
      items.push({ s, w, n, p: Number.isFinite(p) ? p : 0, t: title, ...(integration ? { i: integration } : {}) });
    }
    const g = /(?:lop|khoi)\s*(\d)/.exec(fold(sheet.name))?.[1];
    return items.length ? { grade: g ? Number(g) : null, items } : null;
  }
  return null;
}

/** Trang TKB: cột Thứ (ô gộp) · Tiết (1–8) · Môn */
export function parseTkbSheet(sheet: Sheet): Tkb | null {
  for (let h = 0; h < Math.min(12, sheet.rows.length); h++) {
    const head = sheet.rows[h].map((x) => fold(x));
    const cD = head.findIndex((f) => /^thu( ngay)?$/.test(f)), cP = head.findIndex((f) => /^tiet$/.test(f)), cS = head.findIndex((f) => /^(mon|mon hoc|phan mon)$/.test(f));
    if (cD < 0 || cP < 0 || cS < 0) continue;
    const tkb = emptyTkb();
    let day = -1, any = false;
    for (const r of sheet.rows.slice(h + 1)) {
      const d = /(hai|2|ba|3|tu|4|nam|5|sau|6|bay|7)\b/.exec(fold(cell(r, cD)).replace(/^thu\s*/, ''))?.[1];
      if (d) day = ({ hai: 0, 2: 0, ba: 1, 3: 1, tu: 2, 4: 2, nam: 3, 5: 3, sau: 4, 6: 4, bay: 5, 7: 5 } as Record<string, number>)[d];
      const p = num(cell(r, cP)), s = cell(r, cS);
      if (day < 0 || !(p >= 1 && p <= SLOTS)) continue;
      if (s) { tkb.cells[day][p - 1] = s; any = true; }
    }
    return any ? tkb : null;
  }
  return null;
}

/** Trang Lịch tuần: cột Tuần + cột ngày; dòng có ngày mà không có số tuần = tuần nghỉ */
export function parseCalendarSheet(sheet: Sheet): WeekCalendar | null {
  for (let h = 0; h < Math.min(8, sheet.rows.length); h++) {
    const head = sheet.rows[h].map((x) => fold(x));
    const cW = head.findIndex((f) => /^tuan$/.test(f));
    const cD = head.findIndex((f) => /ngay/.test(f));
    if (cW < 0 || cD < 0) continue;
    let start = '';
    const breaks: string[] = [];
    // dòng có ngày mà không có số tuần chỉ là tuần nghỉ khi còn tuần dạy phía sau (dòng thừa cuối bảng thì bỏ)
    let pending: string[] = [];
    for (const r of sheet.rows.slice(h + 1)) {
      const date = dateOf(cell(r, cD));
      if (!date) continue;
      const w = num(cell(r, cW));
      if (w === 1 && !start) start = date;
      else if (!(w >= 1)) { if (start) pending.push(date); }
      else { breaks.push(...pending); pending = []; }
    }
    return isMonday(start) ? { start, breaks, days: 5 } : null;
  }
  return null;
}

/** Đọc cả file của tổ: PPCT (mọi trang PPCT), TKB, lịch tuần, tên trường */
export function parseKhoiBook(sheets: Sheet[]): { ppct: { grade: number | null; items: PpctItem[]; sheet: string }[]; tkb: Tkb | null; cal: WeekCalendar | null; school: string; agency: string } {
  const ppct: { grade: number | null; items: PpctItem[]; sheet: string }[] = [];
  let tkb: Tkb | null = null, cal: WeekCalendar | null = null, school = '', agency = '';
  for (const s of sheets) {
    const f = fold(s.name);
    if (/ppct|phan phoi/.test(f)) { const p = parsePpctSheet(s); if (p) ppct.push({ ...p, sheet: s.name }); continue; }
    if (/thoi khoa bieu|tkb/.test(f) && !tkb) {
      tkb = parseTkbSheet(s);
      for (const r of s.rows.slice(0, 5)) for (const v of r) {
        const t = v.trim();
        if (!school && /^trường\s/i.test(t)) school = t;
        if (!agency && /^(ubnd|phòng giáo dục|sở giáo dục)/i.test(t)) agency = t;
      }
      continue;
    }
    if (/lich tuan/.test(f) && !cal) { cal = parseCalendarSheet(s); continue; }
  }
  return { ppct, tkb, cal, school, agency };
}

// ───────────── Xuất Excel (mẫu chuẩn: Thứ/ngày · Buổi · Tiết · Môn · Tiết PPCT · Tên bài · ND tích hợp/ĐDDH · Điều chỉnh) ─────────────

const viDay = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

export function lbgSheet(b: BuiltWeek, opts: { className: string; grade: number; teacher?: string; school?: string; agency?: string; days: number }): XSheet {
  const { schedule: s } = b;
  const H = (v: string) => ({ v, s: XS.header });
  const rows: XCell[][] = [
    [{ v: (opts.agency || '').toUpperCase(), s: XS.bold }, '', '', '', '', { v: 'LỊCH BÁO GIẢNG', s: XS.title }],
    [{ v: (opts.school || '').toUpperCase(), s: XS.bold }, '', '', '', '', { v: `Tuần ${s.week}${b.monday ? ` · Từ ngày ${viDay(b.monday)} đến ngày ${viDay(b.to)}` : ''}`, s: XS.italic }],
    [{ v: `Lớp: ${opts.className}`, s: XS.boldLeft }, '', '', { v: `Khối: ${opts.grade}`, s: XS.boldLeft }, '', { v: opts.teacher ? `Giáo viên: ${opts.teacher}` : '', s: XS.boldLeft }],
    [H('Thứ, ngày'), H('Buổi'), H('Tiết'), H('Môn học'), H('Tiết PPCT'), H('Tên bài dạy'), H('ND tích hợp / ĐDDH'), H('Điều chỉnh')],
  ];
  const merges = ['A1:E1', 'F1:H1', 'A2:E2', 'F2:H2', 'A3:C3', 'D3:E3', 'F3:H3'];
  for (let d = 0; d < opts.days; d++) {
    const list = s.rows.filter((r) => r.day === d);
    const start = rows.length;
    const date = b.monday ? viDay(addDays(b.monday, d)) : '';
    if (!list.length) {
      rows.push([{ v: `${DAY_NAMES[d]}\n${date}`, s: XS.center }, { v: '', s: XS.center }, { v: '', s: XS.center }, { v: '', s: XS.text }, { v: '', s: XS.center }, { v: 'Nghỉ / không có tiết', s: XS.text }, { v: '', s: XS.text }, { v: '', s: XS.text }]);
      continue;
    }
    for (const sess of ['Sáng', 'Chiều']) {
      const part = list.filter((r) => r.session === sess);
      if (!part.length) continue;
      const s0 = rows.length;
      for (const r of part) {
        const missing = !r.ppct;
        rows.push([
          { v: rows.length === start ? `${DAY_NAMES[d]}\n${date}` : '', s: XS.center }, { v: rows.length === s0 ? sess : '', s: XS.center }, { v: r.period, s: XS.center },
          { v: r.subjectLabel, s: XS.text }, { v: r.ppct ? Number(r.ppct) : '', s: XS.center }, { v: r.title, s: missing ? XS.red : XS.text },
          { v: r.integration, s: XS.text }, { v: '', s: XS.text },
        ]);
      }
      if (rows.length - 1 > s0) merges.push(range(s0, 1, rows.length - 1, 1));
    }
    if (rows.length - 1 > start) merges.push(range(start, 0, rows.length - 1, 0));
  }
  rows.push([], [{ v: 'Giáo viên', s: XS.bold }, '', '', '', '', { v: 'Tổ trưởng duyệt', s: XS.bold }]);
  merges.push(range(rows.length - 1, 0, rows.length - 1, 4), range(rows.length - 1, 5, rows.length - 1, 7));
  return { name: `${opts.className} - Tuần ${s.week}`, rows, merges, cols: [12, 7, 5, 14, 7, 48, 28, 12], freeze: { rows: 4, cols: 0 }, margins: [0.4, 0.3, 0.4, 0.3], center: true };
}

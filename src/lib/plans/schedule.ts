// Đọc lịch báo giảng (kế hoạch dạy học tuần) từ file Excel theo mẫu của trường và tự sinh giáo án từng tiết.
// Mẫu: dòng tiêu đề "KẾ HOẠCH DẠY HỌC KHỐI n", "Từ ngày: d / m / yyyy", "Tuần: n"; bảng cột
// Thứ/ngày · Buổi · Tiết TKB · Môn học · Tiết PPCT · Tên bài dạy · ND tích hợp/ĐDDH · Điều chỉnh KH tuần.
// Cột được nhận theo tên tiêu đề nên thứ tự cột có thể khác; ô gộp (thứ, buổi) được điền xuống các dòng.

import type { Sheet } from '../xlsx-read';
import { END_ROW, ERROR_CELL, EXCEL_SERIAL, EXTRA_ONLY, HEADER_RULES, INTEGRATION_EXPAND, INTEGRATION_HEAD, MORNING_SLOTS, SESSION_ROW, SHEET_NAME_HINT, SHEET_NAME_SKIP, SUBJECT_ALIASES } from './schedule-rules';
import { XS, range, type XCell, type XSheet } from '../xlsx';
import { integrationKinds, suggest, applySuggestion } from './assistant';
import { SUBJECT_NAMES, addDays, viDate, generatePlan, genericPlan, isAppSubject, mondayOf, type LessonInfo, type LessonPlan, type PlanSubject } from './generate';
import type { SubjectCode } from '../types';

export type ScheduleRow = {
  /** 0 = Thứ Hai … 5 = Thứ Bảy */
  day: number;
  date: string;
  session: string;
  period: number;
  subjectLabel: string;
  subject: PlanSubject;
  /** tiết bổ sung / tăng cường (BS) */
  extra: boolean;
  ppct: string;
  title: string;
  integration: string;
  adjust: string;
};

export type Schedule = {
  grade: number | null;
  week: string;
  /** Thứ Hai của tuần (yyyy-mm-dd), '' nếu không đọc được */
  monday: string;
  rows: ScheduleRow[];
  /** tiết chữ đỏ trong lịch = tiết trống (giáo viên khác dạy / không soạn): bỏ qua khi soạn giáo án */
  skipped: ScheduleRow[];
  warnings: string[];
  /** đã đọc từ trang nào, nhận ra mẫu gì, đã chuẩn hoá những gì (để báo cho thầy cô) */
  source?: { sheet: string; form: string; notes: string[] };
};

/** chữ đỏ: đỏ rõ (R cao, G và B thấp) — vd FF0000, C00000, E53935 */
export function isRedColor(hex: string | undefined): boolean {
  if (!hex || !/^[0-9A-F]{6}$/i.test(hex)) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return r >= 0xb0 && g <= 0x70 && b <= 0x70;
}

// Thứ tự soạn giáo án trong file tuần theo mẫu nhà trường:
// Tiếng Việt → Toán → Đạo đức → TN&XH → HĐTN → Tiếng Việt (tăng cường) → Toán (tăng cường), sau đó các môn khác.
export const SCHOOL_ORDER: { label: string; subject: PlanSubject[]; extra: boolean }[] = [
  { label: 'TIẾNG VIỆT', subject: ['tieng-viet'], extra: false },
  { label: 'TOÁN', subject: ['toan', 'stem'], extra: false },
  { label: 'ĐẠO ĐỨC', subject: ['dao-duc'], extra: false },
  { label: 'TỰ NHIÊN VÀ XÃ HỘI', subject: ['tnxh'], extra: false },
  { label: 'HOẠT ĐỘNG TRẢI NGHIỆM', subject: ['hdtn'], extra: false },
  { label: 'TIẾNG VIỆT (TĂNG CƯỜNG)', subject: ['tieng-viet'], extra: true },
  { label: 'TOÁN (TĂNG CƯỜNG)', subject: ['toan', 'stem'], extra: true },
];
/** vị trí nhóm môn theo mẫu nhà trường (môn khác xếp sau, theo tên môn) */
export function schoolRank(subject: PlanSubject, extra: boolean): number {
  const i = SCHOOL_ORDER.findIndex((g) => g.subject.includes(subject) && g.extra === extra);
  if (i >= 0) return i;
  // tiết bổ sung của môn khác (vd HĐTN tăng cường) đi liền nhóm chính của môn đó
  const j = SCHOOL_ORDER.findIndex((g) => g.subject.includes(subject));
  return j >= 0 ? j + 0.5 : SCHOOL_ORDER.length;
}
export const schoolGroupLabel = (subject: PlanSubject, extra: boolean) => SCHOOL_ORDER[schoolRank(subject, extra)]?.label ?? null;
const sessionRank = (s?: string) => (/chi/i.test(s ?? '') ? 1 : 0);
/** Xếp theo mẫu nhà trường: nhóm môn, rồi ngày → buổi → tiết (đúng thứ tự dạy trong tuần) */
export function sortSchoolOrder<T>(list: T[], key: (x: T) => { subject: PlanSubject; extra: boolean; label?: string; date?: string; session?: string; period?: number }): T[] {
  return list.map((x, i) => ({ x, i, k: key(x) })).sort((a, b) => {
    const ra = schoolRank(a.k.subject, a.k.extra), rb = schoolRank(b.k.subject, b.k.extra);
    if (ra !== rb) return ra - rb;
    if (ra >= SCHOOL_ORDER.length && a.k.subject !== b.k.subject) return (a.k.label ?? a.k.subject).localeCompare(b.k.label ?? b.k.subject, 'vi');
    return (a.k.date ?? '').localeCompare(b.k.date ?? '') || sessionRank(a.k.session) - sessionRank(b.k.session) || (a.k.period || 99) - (b.k.period || 99) || a.i - b.i;
  }).map((e) => e.x);
}

/** bỏ dấu, chữ thường, gọn khoảng trắng — để so tên cột, tên môn */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
const pad = (n: number) => String(n).padStart(2, '0');

const DAY_LABELS: [RegExp, number][] = [
  [/^(thu )?(hai|2)$/, 0], [/^(thu )?(ba|3)$/, 1], [/^(thu )?(tu|4)$/, 2], [/^(thu )?(nam|5)$/, 3], [/^(thu )?(sau|6)$/, 4], [/^(thu )?(bay|7)$/, 5],
];
function dayOfLabel(s: string): number | null {
  const f = fold(s).replace(/[,.:]/g, ' ').replace(/\s+/g, ' ').trim();
  const first = f.split(' ').slice(0, 2).join(' ');
  for (const [re, d] of DAY_LABELS) if (re.test(f) || re.test(first) || re.test(f.split(' ')[0])) return d;
  return null;
}

/** "5/10/2026", "05-10-2026", "5 / 10 / 2026" → yyyy-mm-dd (ngày/tháng/năm kiểu Việt Nam) */
export function parseViDate(s: string): string {
  const m = /(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})/.exec(s);
  if (!m) return '';
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return '';
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/** Tên môn trong lịch → mã môn; "(BS)", "bổ sung", "tăng cường" → tiết bổ sung */
export function subjectOf(label: string, title = ''): { subject: PlanSubject; extra: boolean } {
  const f0 = fold(label);
  // "TĂNG CƯỜNG" / "Ôn tập" không ghi môn chính: lấy môn từ tên bài ("Ôn toán", "Ôn Tiếng Việt")
  if (EXTRA_ONLY.test(f0) && title) { const t = subjectOf(fold(title).replace(/^on\s+(tap\s+|luyen\s+)?/, '')); return { subject: t.subject, extra: true }; }
  const alias = SUBJECT_ALIASES.find(([re]) => re.test(f0))?.[1];
  const f = alias ? `${fold(alias)}${/\(\s*bs\s*\)|\bbs\b|bo sung|tang cuong/.test(f0) ? ' (bs)' : ''}` : f0;
  const extra = /\(\s*bs\s*\)|\bbs\b|bo sung|tang cuong|on luyen\b/.test(f);
  const g = f.replace(/\(.*?\)/g, ' ').replace(/\bbs\b/g, ' ').trim();
  const has = (...k: string[]) => k.some((x) => g.includes(x));
  let subject: PlanSubject = 'khac';
  if (has('stem')) subject = 'stem';
  else if (has('tieng viet', 'tv')) subject = 'tieng-viet';
  else if (has('tieng anh', 'anh van', 'ngoai ngu')) subject = 'tieng-anh';
  else if (/^toan\b/.test(g) || has(' toan')) subject = 'toan';
  else if (has('dao duc')) subject = 'dao-duc';
  else if (has('tnxh', 'tu nhien')) subject = 'tnxh';
  else if (has('khoa hoc')) subject = 'khoa-hoc';
  else if (has('lich su', 'dia li', 'dia ly', 'ls&dl', 'ls-dl', 'ls - dl')) subject = 'ls-dl';
  else if (has('hdtn', 'trai nghiem', 'sinh hoat', 'shdc', 'shl', 'hdng')) subject = 'hdtn';
  else if (has('am nhac')) subject = 'am-nhac';
  else if (has('mi thuat', 'my thuat')) subject = 'mi-thuat';
  else if (has('the chat', 'gdtc', 'the duc')) subject = 'gdtc';
  else if (has('tin hoc')) subject = 'tin-hoc';
  else if (has('cong nghe')) subject = 'cong-nghe';
  if (/^tv\b/.test(g)) subject = 'tieng-viet';
  return { subject, extra };
}

type Col = 'day' | 'session' | 'period' | 'subject' | 'ppct' | 'title' | 'integration' | 'adjust';
function mapColumns(header: string[]): Partial<Record<Col, number>> {
  const cols: Partial<Record<Col, number>> = {};
  header.forEach((h, i) => {
    const f = fold(h);
    if (!f) return;
    const hit = HEADER_RULES.find(([re]) => re.test(f));
    if (hit && cols[hit[1]] === undefined) cols[hit[1]] = i;
  });
  return cols;
}

/** Điền giá trị (và màu chữ) ô gộp vào mọi ô của vùng gộp */
function fillMerges(sheet: Sheet): { rows: string[][]; colors: string[][] } {
  const rows = sheet.rows.map((r) => [...r]);
  const colors = sheet.rows.map((r, i) => r.map((_, j) => sheet.colors?.[i]?.[j] ?? ''));
  for (const [r1, c1, r2, c2] of sheet.merges) {
    const v = rows[r1]?.[c1] ?? '', col = colors[r1]?.[c1] ?? '';
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (rows[r]) { rows[r][c] = v; colors[r][c] = col; }
  }
  return { rows, colors };
}

/** "16/11/2026" hoặc ngày Excel dạng số seri (46342) → yyyy-mm-dd */
export function dateOf(s: string): string {
  const v = parseViDate(s);
  if (v) return v;
  const t = s.trim();
  if (/^\d{5}(\.\d+)?$/.test(t)) {
    const n = Math.floor(Number(t));
    if (n >= EXCEL_SERIAL.min && n <= EXCEL_SERIAL.max) return new Date(Date.UTC(1899, 11, 30) + n * 86400000).toISOString().slice(0, 10);
  }
  return '';
}
const weekdayOf = (iso: string) => (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;

/** Tách nội dung tích hợp viết ở cuối tên bài: "Bài 46: ac ăc âc -Tiết 1 - Quốc phòng và an ninh" */
export function splitIntegration(title: string): { title: string; integration: string } {
  const parts = title.split(/\s+[-–—]\s+/);
  const tail: string[] = [];
  while (parts.length > 1 && INTEGRATION_HEAD.test(fold(parts[parts.length - 1]))) tail.unshift(parts.pop()!.trim());
  if (!tail.length) return { title, integration: '' };
  const expand = (x: string) => INTEGRATION_EXPAND.find(([re]) => re.test(x.trim()))?.[1] ?? x;
  return { title: parts.join(' - ').trim(), integration: tail.map(expand).join('\n') };
}

/** Tên môn theo mẫu chuẩn (như KHDH của trường): "TIẾNG VIỆT" → "Tiếng Việt", "HĐ T.NGHIỆM" → "HĐTN", "TĂNG CƯỜNG" + "Ôn toán" → "Toán (BS)".
 *  Tên môn đã viết thường / có số thứ tự riêng (vd "HĐTN2", "Toán (BS)") giữ nguyên. */
const SHORT: Partial<Record<PlanSubject, string>> = { tnxh: 'TNXH', hdtn: 'HĐTN', gdtc: 'GDTC', 'ls-dl': 'Lịch sử và Địa lí' };
export function canonicalSubjectLabel(label: string, subject: PlanSubject, extra: boolean): string {
  const f = fold(label);
  const upper = /\p{Lu}/u.test(label) && label === label.toUpperCase();
  if (subject === 'khac' || !(upper || EXTRA_ONLY.test(f) || SUBJECT_ALIASES.some(([re]) => re.test(f)))) return label;
  return `${SHORT[subject] ?? SUBJECT_NAMES[subject]}${extra ? ' (BS)' : ''}`;
}
/** Tên bài gọn theo mẫu chuẩn: "ac ăc âc -Tiết 1" → "ac ăc âc - Tiết 1", "( Tiết 1)" → "(Tiết 1)" */
const tidyTitle = (t: string) => t.replace(/\s*[-–]\s*(Tiết\s*\d)/g, ' - $1').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s{2,}/g, ' ').trim();

/** Một lịch báo giảng đã quy về mẫu chuẩn + thông tin nhận dạng (đọc từ trang nào, mẫu gì, đã chuẩn hoá những gì) */
export type ScheduleSource = { sheet: string; form: string; notes: string[] };

/** Đọc lịch báo giảng từ trang tính, quy về mẫu chuẩn của app */
export function parseSchedule(sheet: Sheet): Schedule {
  const raw = sheet.rows;
  const warnings: string[] = [];
  const notes: string[] = [];
  const hi = raw.findIndex((r) => { const c = mapColumns(r); return c.subject !== undefined && c.title !== undefined; });
  if (hi < 0) throw new Error('Không tìm thấy dòng tiêu đề bảng (cần có cột “Môn học” và “Tên bài dạy”).');
  const cols = mapColumns(raw[hi]);

  // thông tin đầu trang; nhãn và giá trị có thể nằm ở 2 ô liền nhau ("KHỐI :" │ 1, "Từ ngày:" │ 16/11/2026)
  let grade: number | null = null, week = '', from = '';
  for (const r of raw.slice(0, hi)) {
    const next = (i: number) => r.slice(i + 1).find((x) => x.trim()) ?? '';
    r.forEach((cell, i) => {
      const f = fold(cell);
      if (!f) return;
      const g = /\b(khoi|lop)\s*:?\s*(\d)/.exec(f);
      if (g && grade === null) grade = Number(g[2]);
      else if (/\b(khoi|lop)\s*:?$/.test(f) && grade === null && /^\d$/.test(next(i).trim())) grade = Number(next(i));
      if (/^tuan\b/.test(f) && !week) {
        const n = /(\d+)/.exec(f)?.[1] ?? r.slice(i + 1).find((x) => /^\d+$/.test(x.trim()));
        if (n) week = String(Number(n));
      }
      if (f.includes('tu ngay') && !from) from = parseViDate(cell) || dateOf(next(i));
    });
  }
  if (!week) { const t = raw.slice(0, hi).flat().map(fold).find((x) => /tuan\s*\d+/.test(x)); if (t) week = /tuan\s*(\d+)/.exec(t)![1]; }

  const { rows, colors } = fillMerges(sheet);
  const cell = (r: string[], k: Col) => (cols[k] === undefined ? '' : (r[cols[k]!] ?? '').trim());
  /** tiết chữ đỏ: ô Môn học hoặc ô Tên bài dạy tô chữ đỏ */
  const red = (i: number) => (['subject', 'title'] as const).some((k) => cols[k] !== undefined && rows[i][cols[k]!]?.trim() && isRedColor(colors[i]?.[cols[k]!]));
  const sepOf = (r: string[]) => (cell(r, 'subject') ? null : r.map((x) => SESSION_ROW.exec(fold(x))).find(Boolean)?.[1] ?? null);
  const body = rows.slice(hi + 1);
  const endAt = body.findIndex((r) => r.some((x) => END_ROW.test(fold(x))));
  const table = endAt < 0 ? body : body.slice(0, endAt);
  // mẫu không có cột Buổi mà chia buổi bằng dòng "BUỔI SÁNG / BUỔI CHIỀU": mỗi dòng "buổi sáng" mở đầu một ngày
  const sepMode = cols.session === undefined && table.some((r) => sepOf(r));
  const hasLabels = table.some((r) => dayOfLabel(cell(r, 'day')) !== null);

  type Entry = { row: ScheduleRow; red: boolean; block: number; odd: boolean };
  const entries: Entry[] = [];
  const blocks: { lab: number | null; dt: string }[] = [];
  let day = -1, session = '', firstDate = '', lastSessionDay = -1, block = -1, junk = 0, splitN = 0;
  for (let k = 0; k < table.length; k++) {
    const r = table[k], i = hi + 1 + k;
    const sep = sepOf(r);
    if (sep) {
      session = sep === 'chieu' ? 'Chiều' : sep === 'toi' ? 'Tối' : 'Sáng';
      if (sepMode && (sep === 'sang' || block < 0)) { block++; blocks.push({ lab: null, dt: '' }); }
      continue;
    }
    const dcell = cell(r, 'day');
    const lab = dcell ? dayOfLabel(dcell) : null;
    const dt = dcell ? dateOf(dcell) : '';
    if (dt && !firstDate) firstDate = dt;
    if (sepMode) {
      if (block >= 0) { blocks[block].lab ??= lab; if (!blocks[block].dt) blocks[block].dt = dt; }
    } else {
      if (lab !== null) day = lab;
      else if (!hasLabels && dt) { const wd = weekdayOf(dt); if (wd <= 5) day = wd; }
      const s = cell(r, 'session');
      if (s) session = s[0].toUpperCase() + s.slice(1).toLowerCase(); else if (lastSessionDay !== day) session = '';
      lastSessionDay = day;
    }
    const subjectLabel = cell(r, 'subject');
    let title = cell(r, 'title');
    if (!subjectLabel && !title) continue;
    // dòng rác: ô lỗi công thức (#N/A…), ô Môn chỉ có số (vd "Tuần: 11" lọt vào cột Môn)
    if (ERROR_CELL.test(subjectLabel) || ERROR_CELL.test(title) || (/^\d+$/.test(subjectLabel) && (!title || ERROR_CELL.test(title)))) { junk++; continue; }
    if (sepMode && block < 0) continue;
    let integration = cell(r, 'integration');
    if (!integration && title) { const sp = splitIntegration(title); if (sp.integration) { title = sp.title; integration = sp.integration; splitN++; } }
    const { subject, extra } = subjectOf(subjectLabel, title);
    title = tidyTitle(title);
    const period = Number(/\d+/.exec(cell(r, 'period'))?.[0] ?? 0) || 0;
    entries.push({
      red: red(i), block, odd: session === 'Sáng' && period > MORNING_SLOTS,
      row: { day: sepMode ? -1 : Math.max(0, day), date: '', session, period, subjectLabel: canonicalSubjectLabel(subjectLabel, subject, extra), subject, extra, ppct: cell(r, 'ppct'), title: title || subjectLabel, integration, adjust: cell(r, 'adjust') },
    });
  }
  if (junk) notes.push(`bỏ ${junk} dòng không phải tiết dạy (ô lỗi #N/A, số tuần…)`);
  if (sepMode) {
    // ngày của từng khối: theo nhãn "Thứ 2…", không có thì theo ngày ghi trong cột, không có nữa thì nối tiếp khối trước
    let prev = -1;
    const dayOfBlock = blocks.map((b) => { const d = b.lab ?? (b.dt ? weekdayOf(b.dt) : prev + 1); prev = d; return Math.min(5, Math.max(0, d)); });
    for (const e of entries) e.row.day = dayOfBlock[e.block] ?? 0;
    notes.push('buổi lấy theo dòng “Buổi sáng / Buổi chiều” trong bảng');
  }
  // buổi chiều đánh số tiếp 5, 6, 7… → 1, 2, 3…
  let renum = 0;
  for (const d of new Set(entries.map((e) => e.row.day))) {
    const pm = entries.filter((e) => e.row.day === d && /chi/i.test(e.row.session) && e.row.period);
    if (pm.length && pm.every((e) => e.row.period > MORNING_SLOTS)) { pm.forEach((e) => { e.row.period -= MORNING_SLOTS; }); renum++; }
  }
  if (renum) notes.push(`tiết buổi chiều đánh số tiếp (${MORNING_SLOTS + 1}, ${MORNING_SLOTS + 2}…) đổi về 1, 2…`);
  // tiết ghi trùng trong cùng ngày (cùng môn, PPCT, tên bài): giữ tiết hợp lệ, bỏ tiết lạc (vd tiết 5 buổi sáng)
  const seen = new Map<string, Entry>();
  const drop = new Set<Entry>();
  for (const e of entries) {
    const key = `${e.row.day}|${fold(e.row.subjectLabel)}|${e.row.ppct}|${fold(e.row.title)}`;
    const o = seen.get(key);
    if (!o || !e.row.ppct) { seen.set(key, e); continue; }
    const lose = o.odd && !e.odd ? o : e;
    drop.add(lose); if (lose === o) seen.set(key, e);
    warnings.push(`${['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][e.row.day]}: “${e.row.title}” ghi 2 lần — giữ tiết ${lose === o ? e.row.period : o.row.period} buổi ${(lose === o ? e.row.session : o.row.session).toLowerCase()}.`);
  }
  const kept = entries.filter((e) => !drop.has(e));
  if (splitN) notes.push(`tách nội dung tích hợp ở cuối tên bài sang cột ND tích hợp (${splitN} tiết)`);
  const out = kept.filter((e) => !e.red).map((e) => e.row);
  const skipped = kept.filter((e) => e.red).map((e) => e.row);
  if (!out.length) throw new Error(skipped.length ? 'Mọi tiết trong bảng đều tô chữ đỏ (tiết trống) — không có tiết nào cần soạn.' : 'Không có tiết dạy nào trong bảng.');

  // Thứ Hai của tuần: ưu tiên "Từ ngày", rồi ngày ghi trong cột Thứ/ngày
  let monday = from ? mondayOf(from) : '';
  if (!monday && firstDate) monday = mondayOf(firstDate);
  if (!monday) warnings.push('Không đọc được ngày của tuần — giáo án sẽ để trống ngày dạy.');
  if (grade === null) warnings.push('Không thấy khối lớp trong tiêu đề (vd “KHỐI 1”) — dùng khối của lớp đang chọn.');
  for (const r of [...out, ...skipped]) r.date = monday ? addDays(monday, r.day) : '';
  const form = sepMode ? 'mẫu chia buổi bằng dòng “Buổi sáng / Buổi chiều”' : cols.session !== undefined ? 'mẫu có cột Buổi' : 'mẫu không ghi buổi';
  return { grade, week, monday, rows: out, skipped, warnings, source: { sheet: sheet.name, form, notes } };
}

/** File có nhiều trang tính (hướng dẫn, TKB, PPCT, lịch báo giảng…): tự tìm trang lịch báo giảng, quy về mẫu chuẩn */
export function parseScheduleBook(sheets: (Sheet & { hidden?: boolean })[]): Schedule {
  if (sheets.length === 1) return parseSchedule(sheets[0]);
  const ranked = sheets.map((sh, i) => {
    const n = fold(sh.name);
    return { sh, i, prio: (sh.hidden ? -2 : 0) + (SHEET_NAME_HINT.test(n) ? 2 : 0) - (SHEET_NAME_SKIP.test(n) && !SHEET_NAME_HINT.test(n) ? 1 : 0) };
  }).sort((a, b) => b.prio - a.prio || a.i - b.i);
  let best: { s: Schedule; score: number } | null = null;
  let err: Error | null = null;
  for (const { sh, prio } of ranked) {
    try {
      const s = parseSchedule(sh);
      // một tuần chỉ có vài chục tiết: bảng hàng trăm dòng (PPCT cả năm) không phải lịch tuần
      const n = s.rows.length + s.skipped.length;
      const score = prio * 10000 + (n > 80 ? -5000 : 0) + (s.monday ? 200 : 0) + (s.week ? 100 : 0) + n;
      if (!best || score > best.score) best = { s, score };
    } catch (e) { err ??= e as Error; }
  }
  if (!best) throw err ?? new Error('Không tìm thấy lịch báo giảng trong file.');
  return best.s;
}

// ------------------------------------------------------------------ ghép với bài trong app

type LessonRef = Pick<LessonInfo, 'id' | 'ref' | 'title'>;

/** Tìm bài của app ứng với tên bài trong lịch: "Bài 4: …" (Toán), "Bài 16: …" trong "Bài 16–20" (Tiếng Việt), "Unit 3" / "Review 1" (Tiếng Anh) */
export function matchLesson<T extends LessonRef>(subject: SubjectCode, title: string, lessons: T[]): T | null {
  const f = fold(title);
  if (subject === 'tieng-anh') {
    const u = /\bunit\s*(\d+)/.exec(f), rv = /\breview\s*(\d+)/.exec(f);
    if (u) return lessons.find((l) => l.ref === `Unit ${Number(u[1])}`) ?? null;
    if (rv) return lessons.find((l) => l.ref === `Review ${Number(rv[1])}`) ?? null;
    return null;
  }
  const b = /\bbai\s*(\d+)/.exec(f);
  if (b) {
    const n = Number(b[1]);
    if (subject === 'toan') return lessons.find((l) => l.ref === `Bài ${n}`) ?? null;
    for (const l of lessons) {
      const m = /Bài\s*(\d+)\s*[–-]\s*(\d+)/.exec(l.ref);
      if (m && n >= Number(m[1]) && n <= Number(m[2])) return l;
      if (new RegExp(`^Bài ${n}$`).test(l.ref)) return l;
    }
    return null;
  }
  const t = /\btuan\s*(\d+)/.exec(f);
  if (t && !/on (tap|luyen)/.test(f)) return lessons.find((l) => new RegExp(`^Tuần ${Number(t[1])}\\b`).test(l.ref)) ?? null;
  return null;
}

const isReviewTitle = (title: string) => { const f = fold(title); return /^(on tap|on luyen|luyen tap|cung co)/.test(f) || (/on (tap|luyen)/.test(f) && !/\bbai\s*\d/.test(f)); };

export type RowPlan = { row: ScheduleRow; plan: LessonPlan; lessonId: string; lessonTitle: string; kind: 'app' | 'review' | 'khung' | 'kho' };

/** Dùng giáo án trong kho của trường cho một tiết: giữ nội dung giáo án, lấy ngày/tiết/buổi/PPCT/tích hợp từ lịch */
export function withLibraryPlan(rp: RowPlan, lib: LessonPlan, className: string): RowPlan {
  const r = rp.row;
  const integration = [r.integration, lib.integration].filter((x) => x && x.trim()).join('\n') || undefined;
  return {
    ...rp, kind: 'kho', lessonTitle: lib.title,
    plan: {
      ...lib, v: 1, className, lessonId: rp.plan.lessonId || lib.lessonId || '', subject: rp.plan.subject === 'khac' ? lib.subject : rp.plan.subject,
      subjectLabel: r.subjectLabel || lib.subjectLabel, session: r.session, ppct: r.ppct, integration,
      title: r.title || lib.title, week: rp.plan.week || lib.week, date: rp.plan.date, period: rp.plan.period,
      adjust: r.adjust || '', grade: rp.plan.grade,
    },
  };
}

/**
 * Dùng giáo án trong kho cho một tiết và tự thay các ô thông tin: ngày dạy, lớp, tiết (cả trong bản gốc của trường),
 * nội dung tích hợp theo lịch tuần này (chèn thêm dòng vào hoạt động vận dụng nếu giáo án cũ chưa có).
 * changes: những gì đã thay (để báo cho thầy cô).
 */
export function adaptLibraryPlan(rp: RowPlan, lib: LessonPlan, className: string): RowPlan & { changes: string[] } {
  const out = withLibraryPlan(rp, lib, className);
  const changes: string[] = [];
  const p = { ...out.plan };
  if (lib.date && p.date && lib.date !== p.date) changes.push(`Ngày dạy: ${viDate(lib.date)} → ${viDate(p.date)}`);
  else if (p.date) changes.push(`Ngày dạy: ${viDate(p.date)}`);
  if (lib.className && className && lib.className !== className) changes.push(`Lớp: ${lib.className} → ${className}`);
  if (p.period) changes.push(`Tiết: ${lib.period && lib.period !== p.period ? `${lib.period} → ` : ''}${p.period}${p.session ? ` buổi ${p.session.toLowerCase()}` : ''}`);
  // bản gốc của trường: thay tên lớp, ngày cũ trong chữ
  if (p.orig?.html) {
    let html = p.orig.html, n = 0;
    const swap = (from: string, to: string) => { if (!from || !to || from === to) return; const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'g'); html = html.replace(re, () => { n++; return to; }); };
    if (lib.className && lib.className.length >= 2) swap(lib.className, className);
    if (lib.date && p.date) {
      const [y, m, d] = lib.date.split('-'); const [y2, m2, d2] = p.date.split('-');
      swap(`${d}/${m}/${y}`, `${d2}/${m2}/${y2}`); swap(`${Number(d)}/${Number(m)}/${y}`, `${Number(d2)}/${Number(m2)}/${y2}`);
    }
    if (n) { p.orig = { html }; changes.push(`Bản gốc của trường: thay ${n} chỗ (lớp, ngày)`); }
  }
  // tích hợp của tuần này chưa có trong giáo án cũ → chèn vào hoạt động vận dụng
  const ri = rp.row.integration?.trim() ?? '';
  if (ri && !fold(lib.integration ?? '').includes(fold(ri).slice(0, 20))) {
    const kinds = integrationKinds(ri);
    let q: LessonPlan = p;
    if (kinds.length) for (const k of kinds) q = applySuggestion(q, suggest(k, q, { weak: [], active: -1, v: 0 }));
    else if (q.activities.length) { const i = q.activities.length - 1; q = { ...q, activities: q.activities.map((a, k) => (k === i ? { ...a, teacher: `${a.teacher.trim()}\n- Tích hợp ${ri.split('\n')[0]}: liên hệ nội dung bài học.`.trim() } : a)) }; }
    Object.assign(p, q);
    // tích hợp của tuần này thay cho tích hợp cũ của giáo án trong kho
    p.integration = ri;
    changes.push(`Tích hợp: ${lib.integration?.trim() ? `${lib.integration.split('\n')[0].slice(0, 40)} → ` : ''}${ri.split('\n')[0]} (chèn vào hoạt động vận dụng)`);
  }
  return { ...out, plan: p, changes };
}

/** Sinh giáo án cho từng tiết của lịch báo giảng */
export function plansFromSchedule(sch: Schedule, opts: {
  grade: number; className: string;
  lessonsBySubject: Partial<Record<SubjectCode, LessonInfo[]>>;
  weakForms?: Partial<Record<SubjectCode, string[]>>;
}): RowPlan[] {
  const grade = sch.grade ?? opts.grade;
  const useApp = grade === opts.grade;
  const last: Partial<Record<SubjectCode, LessonInfo>> = {};
  // ghép trước để tiết ôn tập biết bài trọng tâm của tuần
  const matched = sch.rows.map((row) => {
    if (!useApp || !isAppSubject(row.subject)) return null;
    const list = opts.lessonsBySubject[row.subject] ?? [];
    const review = row.extra || isReviewTitle(row.title);
    const m = review ? null : matchLesson(row.subject, row.title, list);
    if (m) last[row.subject] = m;
    return m;
  });
  const weekFocus: Partial<Record<SubjectCode, LessonInfo>> = { ...last };
  const seen: Partial<Record<SubjectCode, LessonInfo>> = {};

  return sch.rows.map((row, i) => {
    const extras = {
      subjectLabel: row.subjectLabel, session: row.session, ppct: row.ppct, integration: row.integration,
      week: sch.week, date: row.date, period: row.period, adjust: row.adjust,
    };
    const lesson = matched[i];
    const app = isAppSubject(row.subject) ? row.subject : null;
    if (app && lesson) {
      const list = opts.lessonsBySubject[app] ?? [];
      const idx = list.findIndex((l) => l.id === lesson.id);
      seen[app] = lesson;
      const p = generatePlan({ subject: app, grade, className: opts.className, lesson, prevTitle: idx > 0 ? list[idx - 1].title : '', weakForms: opts.weakForms?.[app], date: row.date, period: row.period, week: sch.week });
      return { row, plan: { ...p, ...extras, title: row.title }, lessonId: lesson.id, lessonTitle: lesson.title, kind: 'app' };
    }
    const review = row.extra || isReviewTitle(row.title);
    const focus = app && useApp ? (seen[app] ?? weekFocus[app] ?? null) : null;
    const p = genericPlan({ subject: row.subject, grade, className: opts.className, title: row.title, review, appLesson: focus });
    return { row, plan: { ...p, ...extras, title: row.title }, lessonId: focus?.id ?? '', lessonTitle: focus?.title ?? '', kind: review ? 'review' : 'khung' };
  });
}

// ------------------------------------------------------------------ file mẫu

/** File mẫu lịch báo giảng (cùng bố cục mẫu của trường): 5 ngày × buổi sáng 4 tiết + buổi chiều 3 tiết */
export function scheduleTemplate(grade: number, monday: string, week: string): XSheet {
  const [y, m, d] = monday.split('-').map(Number);
  const fri = addDays(monday, 4).split('-').map(Number);
  const H = (v: string) => ({ v, s: XS.header });
  const rows: XCell[][] = [
    [{ v: `KẾ HOẠCH DẠY HỌC KHỐI ${grade}`, s: XS.title }],
    ['', '', '', '', '', { v: `Từ ngày: ${d} / ${m} / ${y}`, s: XS.boldLeft }],
    [{ v: 'Tuần:', s: XS.boldLeft }, '', '', { v: Number(week) || week, s: XS.boldLeft }, '', { v: `Đến ngày: ${fri[2]} / ${fri[1]} / ${fri[0]}`, s: XS.boldLeft }],
    [H('Thứ, ngày'), H('Buổi'), H('Tiết TKB'), H('Môn học'), H('Tiết PPCT'), H('Tên bài dạy'), H('ND tích hợp/ ĐDDH'), H('Điều chỉnh KH tuần')],
  ];
  const merges = ['A1:H1', 'F2:H2', 'A3:C3', 'D3:E3', 'F3:H3'];
  const DAYS = ['HAI', 'BA', 'TƯ', 'NĂM', 'SÁU'];
  DAYS.forEach((label, i) => {
    const start = rows.length;
    const date = addDays(monday, i).split('-').map(Number);
    ([['Sáng', 4], ['Chiều', 3]] as const).forEach(([buoi, n]) => {
      const s0 = rows.length;
      for (let t = 1; t <= n; t++) {
        const first = rows.length === start;
        rows.push([{ v: first ? label : rows.length === start + 4 ? `${date[2]}/${date[1]}/${date[0]}` : '', s: XS.center }, { v: t === 1 ? buoi : '', s: XS.center }, { v: t, s: XS.center }, { v: '', s: XS.text }, { v: '', s: XS.center }, { v: '', s: XS.text }, { v: '', s: XS.text }, { v: '', s: XS.text }]);
      }
      merges.push(range(s0, 1, rows.length - 1, 1));
    });
    merges.push(range(start, 0, start + 3, 0), range(start + 4, 0, rows.length - 1, 0));
  });
  rows.push([], ['', '', '', '', '', { v: 'Tổ trưởng', s: XS.bold }]);
  merges.push(range(rows.length - 1, 5, rows.length - 1, 7));
  return { name: `Tuần ${week || ''}`.trim(), rows, merges, cols: [10, 8, 7, 14, 7, 46, 34, 16], freeze: { rows: 4, cols: 0 }, landscape: true };
}

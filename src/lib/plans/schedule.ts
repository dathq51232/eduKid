// Đọc lịch báo giảng (kế hoạch dạy học tuần) từ file Excel theo mẫu của trường và tự sinh giáo án từng tiết.
// Mẫu: dòng tiêu đề "KẾ HOẠCH DẠY HỌC KHỐI n", "Từ ngày: d / m / yyyy", "Tuần: n"; bảng cột
// Thứ/ngày · Buổi · Tiết TKB · Môn học · Tiết PPCT · Tên bài dạy · ND tích hợp/ĐDDH · Điều chỉnh KH tuần.
// Cột được nhận theo tên tiêu đề nên thứ tự cột có thể khác; ô gộp (thứ, buổi) được điền xuống các dòng.

import type { Sheet } from '../xlsx-read';
import { XS, range, type XCell, type XSheet } from '../xlsx';
import { addDays, generatePlan, genericPlan, isAppSubject, mondayOf, type LessonInfo, type LessonPlan, type PlanSubject } from './generate';
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
  warnings: string[];
};

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
export function subjectOf(label: string): { subject: PlanSubject; extra: boolean } {
  const f = fold(label);
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
    const set = (k: Col) => { if (cols[k] === undefined) cols[k] = i; };
    if (f.includes('ppct') || f.includes('phan phoi')) set('ppct');
    else if (f.startsWith('thu') || f.includes('ngay')) set('day');
    else if (f.includes('buoi')) set('session');
    else if (f.includes('ten bai') || f.includes('bai day') || f.includes('noi dung bai')) set('title');
    else if (f.includes('mon')) set('subject');
    else if (f.includes('tich hop') || f.includes('dddh') || f.includes('do dung')) set('integration');
    else if (f.includes('dieu chinh') || f.includes('ghi chu')) set('adjust');
    else if (f.includes('tiet')) set('period');
  });
  return cols;
}

/** Điền giá trị ô gộp vào mọi ô của vùng gộp */
function fillMerges(sheet: Sheet): string[][] {
  const rows = sheet.rows.map((r) => [...r]);
  for (const [r1, c1, r2, c2] of sheet.merges) {
    const v = rows[r1]?.[c1] ?? '';
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (rows[r]) rows[r][c] = v;
  }
  return rows;
}

const END = /^(to truong|hieu truong|pho hieu truong|nguoi lap|giao vien|duyet|ky duyet|xac nhan)/;

/** Đọc lịch báo giảng từ trang tính */
export function parseSchedule(sheet: Sheet): Schedule {
  const raw = sheet.rows;
  const warnings: string[] = [];
  const hi = raw.findIndex((r) => { const f = r.map(fold); return f.some((x) => x.includes('mon')) && f.some((x) => x.includes('bai')); });
  if (hi < 0) throw new Error('Không tìm thấy dòng tiêu đề bảng (cần có cột “Môn học” và “Tên bài dạy”).');
  const cols = mapColumns(raw[hi]);
  if (cols.subject === undefined || cols.title === undefined) throw new Error('Thiếu cột “Môn học” hoặc “Tên bài dạy”.');

  // thông tin đầu trang
  let grade: number | null = null, week = '', from = '';
  for (const r of raw.slice(0, hi)) {
    r.forEach((cell, i) => {
      const f = fold(cell);
      const g = /\b(khoi|lop)\s*(\d)/.exec(f);
      if (g && grade === null) grade = Number(g[2]);
      if (/^tuan\b/.test(f)) {
        const n = /(\d+)/.exec(f)?.[1] ?? r.slice(i + 1).find((x) => /^\d+$/.test(x.trim()));
        if (n) week = String(Number(n));
      }
      if (f.includes('tu ngay') && !from) from = parseViDate(cell);
    });
  }
  if (!week) { const t = raw.slice(0, hi).flat().map(fold).find((x) => /tuan\s*\d+/.test(x)); if (t) week = /tuan\s*(\d+)/.exec(t)![1]; }

  const rows = fillMerges(sheet);
  const cell = (r: string[], k: Col) => (cols[k] === undefined ? '' : (r[cols[k]!] ?? '').trim());
  const hasLabels = rows.slice(hi + 1).some((r) => dayOfLabel(cell(r, 'day')) !== null);

  const out: ScheduleRow[] = [];
  let day = -1, session = '', firstDate = '';
  let lastSessionDay = -1;
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.some((x) => END.test(fold(x)))) break;
    const dcell = cell(r, 'day');
    if (dcell) {
      const lab = dayOfLabel(dcell);
      const dt = parseViDate(dcell);
      if (lab !== null) day = lab;
      else if (!hasLabels && dt) { const wd = (new Date(`${dt}T12:00:00`).getDay() + 6) % 7; if (wd <= 5) day = wd; }
      if (dt && !firstDate) firstDate = dt;
    }
    const s = cell(r, 'session');
    if (s) session = s; else if (lastSessionDay !== day) session = '';
    lastSessionDay = day;
    const subjectLabel = cell(r, 'subject');
    const title = cell(r, 'title');
    if (!subjectLabel && !title) continue;
    if (day < 0) day = 0;
    const { subject, extra } = subjectOf(subjectLabel);
    out.push({
      day, date: '', session: session ? session[0].toUpperCase() + session.slice(1).toLowerCase() : '',
      period: Number(/\d+/.exec(cell(r, 'period'))?.[0] ?? 0) || 0,
      subjectLabel, subject, extra, ppct: cell(r, 'ppct'), title: title || subjectLabel,
      integration: cell(r, 'integration'), adjust: cell(r, 'adjust'),
    });
  }
  if (!out.length) throw new Error('Không có tiết dạy nào trong bảng.');

  // Thứ Hai của tuần: ưu tiên "Từ ngày", rồi ngày ghi trong cột Thứ/ngày
  let monday = from ? mondayOf(from) : '';
  if (!monday && firstDate) monday = mondayOf(firstDate);
  if (!monday) warnings.push('Không đọc được ngày của tuần — giáo án sẽ để trống ngày dạy.');
  if (grade === null) warnings.push('Không thấy khối lớp trong tiêu đề (vd “KHỐI 1”) — dùng khối của lớp đang chọn.');
  for (const r of out) r.date = monday ? addDays(monday, r.day) : '';
  return { grade, week, monday, rows: out, warnings };
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

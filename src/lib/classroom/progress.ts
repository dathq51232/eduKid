// Tổng hợp kết quả học tập cho giáo viên (hàm thuần, dùng được ở máy chủ và trình duyệt).
// Dữ liệu đầu vào đã được RLS lọc: giáo viên chỉ đọc được học sinh của lớp mình.

export type LessonResult = {
  id: string;
  student_id: string;
  lesson_code: string;
  lesson_title: string | null;
  subject_code: string | null;
  grade: number | null;
  muc: number | null;
  score: number;
  total: number;
  points: number;
  duration_ms: number | null;
  created_at: string;
};

export type GameResult = {
  id: string;
  student_id: string;
  game_id: string;
  level: number;
  score: number;
  max_score: number;
  duration_ms: number | null;
  created_at: string;
};

export const SUBJECT_LABEL: Record<string, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
export const subjectLabel = (code: string | null) => (code ? SUBJECT_LABEL[code] ?? code : '—');
export const percent = (score: number, total: number) => (total > 0 ? Math.round((score * 100) / total) : 0);

/** Một dòng "bài" của MỘT học sinh: số lần làm, lần tốt nhất, lần gần nhất */
export type StudentLessonRow = {
  lesson_code: string;
  title: string;
  subject: string | null;
  attempts: number;
  best: LessonResult;
  last: LessonResult;
  bestPoints: number;
};

export function lessonsOfStudent(results: LessonResult[]): StudentLessonRow[] {
  const map = new Map<string, StudentLessonRow>();
  for (const r of results) {
    const row = map.get(r.lesson_code);
    if (!row) {
      map.set(r.lesson_code, { lesson_code: r.lesson_code, title: r.lesson_title ?? r.lesson_code, subject: r.subject_code, attempts: 1, best: r, last: r, bestPoints: r.points });
      continue;
    }
    row.attempts += 1;
    if (percent(r.score, r.total) > percent(row.best.score, row.best.total) || (percent(r.score, r.total) === percent(row.best.score, row.best.total) && r.points > row.best.points)) row.best = r;
    if (r.created_at > row.last.created_at) row.last = r;
    row.bestPoints = Math.max(row.bestPoints, r.points);
    if (r.lesson_title) row.title = r.lesson_title;
  }
  return [...map.values()].sort((a, b) => (a.last.created_at < b.last.created_at ? 1 : -1));
}

/** Một dòng "bài" của CẢ LỚP: bao nhiêu bạn đã làm, % đúng trung bình (theo lần tốt nhất của mỗi bạn) */
export type ClassLessonRow = {
  lesson_code: string;
  title: string;
  subject: string | null;
  students: number;
  attempts: number;
  avgBestPercent: number;
  lowStudents: string[]; // id các bạn có lần tốt nhất < 50%
  last: string;
};

export function lessonsOfClass(results: LessonResult[]): ClassLessonRow[] {
  const byLesson = new Map<string, LessonResult[]>();
  for (const r of results) byLesson.set(r.lesson_code, [...(byLesson.get(r.lesson_code) ?? []), r]);
  const rows: ClassLessonRow[] = [];
  for (const [code, list] of byLesson) {
    const bestByStudent = new Map<string, number>();
    for (const r of list) bestByStudent.set(r.student_id, Math.max(bestByStudent.get(r.student_id) ?? 0, percent(r.score, r.total)));
    const bests = [...bestByStudent.values()];
    const titled = list.find((r) => r.lesson_title);
    rows.push({
      lesson_code: code,
      title: titled?.lesson_title ?? code,
      subject: list[0].subject_code,
      students: bestByStudent.size,
      attempts: list.length,
      avgBestPercent: Math.round(bests.reduce((a, b) => a + b, 0) / bests.length),
      lowStudents: [...bestByStudent.entries()].filter(([, p]) => p < 50).map(([id]) => id),
      last: list.reduce((m, r) => (r.created_at > m ? r.created_at : m), list[0].created_at),
    });
  }
  return rows.sort((a, b) => (a.last < b.last ? 1 : -1));
}

/** Tổng quan một học sinh */
export function studentTotals(results: LessonResult[]) {
  const rows = lessonsOfStudent(results);
  const avg = results.length ? Math.round(results.reduce((a, r) => a + percent(r.score, r.total), 0) / results.length) : 0;
  return {
    lessons: rows.length,
    attempts: results.length,
    avgPercent: avg,
    points: rows.reduce((a, r) => a + r.bestPoints, 0),
    minutes: Math.round(results.reduce((a, r) => a + (r.duration_ms ?? 0), 0) / 60000),
  };
}

const DT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
/** "15/10 12:56" theo giờ Việt Nam (máy chủ và trình duyệt cho cùng một kết quả) */
export const fmtDateTime = (s: string) => {
  const p = Object.fromEntries(DT.formatToParts(new Date(s)).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`;
};
export const fmtDuration = (ms: number | null) => {
  if (!ms) return '—';
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút ${s % 60 ? `${s % 60} giây` : ''}`.trim();
};

/** Bảng CSV (mở được bằng Excel: có BOM UTF-8, phân cách bằng dấu phẩy) */
export function toCsv(header: string[], rows: (string | number | null)[][]): string {
  const cell = (v: string | number | null) => {
    const s = v === null ? '' : String(v);
    // chặn công thức Excel chèn từ dữ liệu (=, +, -, @)
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

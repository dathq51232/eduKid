// Giao bài (migration 0017): kiểu dữ liệu, hạn nộp, chuyển câu đề sang dạng hiển thị, thống kê từng câu.
// Dùng được cả ở trình duyệt và máy chủ (không kéo ngân hàng câu hỏi vào).

import type { Level } from '../levels';
import type { AnswerKey, AnswerValue, Question, QuestionType, SubjectCode } from '../types';

export type AssignKind = 'lesson' | 'exam';
export const SUBJECT_NAME: Record<SubjectCode, string> = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh' };
export const MUC_NAME: Record<1 | 2 | 3, string> = { 1: 'Cơ bản', 2: 'Khá', 3: 'Giỏi' };

/** Một dòng trong danh sách bài đã giao (teacher_list_assignments) */
export type AssignmentRow = {
  id: string; kind: AssignKind; title: string; subject: SubjectCode | null; lesson_code: string | null; muc: 1 | 2 | 3 | null;
  minutes: number | null; n_questions: number; student_ids: string[] | null; due_at: string; status: 'open' | 'closed';
  created_at: string; assigned: number; done: number;
};
/** Tình hình một em (teacher_assignment_detail) */
export type DetailRow = {
  student_id: string; display_name: string; done: boolean; attempts: number; score: number | null; max_score: number | null;
  correct: number | null; total: number | null; finished_at: string | null; answers: { i: number; a?: AnswerValue; ok: boolean }[];
};
/** Bài giao phía học sinh (student_my_assignments) */
export type MyAssignment = {
  id: string; kind: AssignKind; title: string; subject: SubjectCode | null; lesson_code: string | null; muc: 1 | 2 | 3 | null;
  minutes: number | null; n_questions: number; due_at: string; status: 'open' | 'closed'; created_at: string; grade: number;
  done: boolean; score: number | null; max_score: number | null;
};

/** Câu của đề giao làm trên app (bản chụp từ ma trận/phiếu bài tập). Học sinh nhận bản KHÔNG có answer/explanation. */
export type ExamItem = {
  type: QuestionType; prompt: string; options: string[]; left?: string[]; blanks?: string[]; statements?: string[];
  answer?: AnswerKey; explanation?: string; lessonTitle?: string; muc?: 1 | 2 | 3; pts: number;
};

/** Câu đề -> câu hiển thị bằng QuestionRenderer (giống trang làm bài) */
export function toQuestion(q: ExamItem, i: number): Question {
  return {
    id: `de-${i}`, lessonId: '', type: q.type, prompt: q.prompt, options: q.options ?? [], leftItems: q.left,
    level: ((q.muc ?? 1) * 2 - 1) as Level, timeLimit: 0, blanks: q.blanks, statements: q.statements,
  };
}

/** Câu trả lời dạng chữ để thống kê ("đáp án sai hay gặp") */
export function answerLabel(v: AnswerValue | undefined): string {
  if (v === null || v === undefined) return '(bỏ trống)';
  if (typeof v === 'string') return v.trim() || '(bỏ trống)';
  if (Array.isArray(v)) return v.length ? v.join(' · ') : '(bỏ trống)';
  const e = Object.entries(v);
  return e.length ? e.map(([l, r]) => `${l}–${r}`).join('; ') : '(bỏ trống)';
}

export type ItemStat = { i: number; n: number; ok: number; rate: number | null; wrong: [string, number][] };
/** Thống kê từng câu của đề: số em làm, số em đúng, đáp án sai hay gặp */
export function itemStats(nItems: number, rows: Pick<DetailRow, 'done' | 'answers'>[]): ItemStat[] {
  return Array.from({ length: nItems }, (_, i) => {
    let n = 0, ok = 0;
    const wrong = new Map<string, number>();
    for (const r of rows) {
      if (!r.done) continue;
      const a = r.answers.find((x) => x.i === i);
      if (!a) continue;
      n++;
      if (a.ok) ok++;
      else { const k = answerLabel(a.a); wrong.set(k, (wrong.get(k) ?? 0) + 1); }
    }
    return { i, n, ok, rate: n ? ok / n : null, wrong: [...wrong.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3) };
  });
}

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
/** "T3 21/10, 20:00" + trạng thái hạn */
export function dueInfo(due: string, now = Date.now()) {
  const d = new Date(due);
  const two = (n: number) => String(n).padStart(2, '0');
  const label = `${WEEKDAY[d.getDay()]} ${two(d.getDate())}/${two(d.getMonth() + 1)}, ${two(d.getHours())}:${two(d.getMinutes())}`;
  const left = d.getTime() - now;
  return { label, overdue: left < 0, soon: left >= 0 && left < 24 * 3600_000 };
}

/** Giá trị mặc định cho ô hạn nộp (datetime-local): sau `days` ngày, 20:00 giờ máy */
export function defaultDueInput(days = 3, now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 20, 0);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}T${two(d.getHours())}:${two(d.getMinutes())}`;
}

/** Link làm bài luyện tập được giao (mức Cơ bản = bộ câu gốc, Khá/Giỏi = bộ mới theo mức) */
export function lessonHref(lessonId: string, subject: SubjectCode, grade: number, muc: number | null) {
  const base = `/lam-bai?lessonId=${encodeURIComponent(lessonId)}&subject=${subject}&grade=${grade}`;
  return muc && muc > 1 ? `${base}&muc=${muc}` : base;
}

export const ASSIGN_ERRORS: Record<string, string> = {
  not_allowed: 'Thầy cô không có quyền với lớp này.',
  class_inactive: 'Lớp đang lưu trữ — mở lại lớp trước khi giao bài.',
  invalid_due: 'Hạn nộp phải sau thời điểm hiện tại và trong vòng 6 tháng.',
  too_many_assignments: 'Lớp đang có quá nhiều bài mở (tối đa 200). Đóng hoặc xoá bớt bài cũ.',
  student_not_in_class: 'Có em không còn trong lớp. Tải lại trang rồi chọn lại.',
};
export const MIGRATION_HINT_0017 = 'Chưa bật tính năng giao bài: hãy chạy supabase/migrations/0017_assignments.sql trên Supabase.';
export function assignError(message: string): string {
  const code = Object.keys(ASSIGN_ERRORS).find((k) => message.includes(k));
  if (code) return ASSIGN_ERRORS[code];
  if (/function|does not exist|schema cache|relation/i.test(message)) return MIGRATION_HINT_0017;
  return 'Chưa thực hiện được. Thử lại sau.';
}

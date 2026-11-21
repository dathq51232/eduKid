import 'server-only';
import { defaultTimeLimit, type Level } from '@/lib/levels';
import type { createAdminClient } from '@/lib/supabase/admin';
import type { AnswerKey, Question, QuestionType } from '@/lib/types';

// "Câu của cô" (migration 0072) — phần chạy ở máy chủ, dùng chung cho /api/hoc-sinh/cau-cua-co và /api/tien-do.
// Em chỉ gặp câu thầy cô đang dạy lớp em (lớp còn hoạt động) đã bật "cho lớp luyện", đúng khối của lớp.

type Admin = ReturnType<typeof createAdminClient>;
export const TQ_ID = /^tq-([0-9a-f-]{36})$/i;
/** Mức 1–3 của thầy cô → cấp độ L1–L5 của app (L1–L2 → M1, L3 → M2, L4–L5 → M3) */
const MUC_TO_LEVEL: Record<number, Level> = { 1: 2, 2: 3, 3: 4 };

type Row = { id: string; lesson_id: string | null; muc: number; type: QuestionType; prompt: string; options: string[] | null; answer: unknown; explanation: string };
export type TeacherKey = { type: QuestionType; key: AnswerKey; level: Level; limit: number; lessonId: string | null; explanation: string };

/** Các thầy cô đang dạy em và khối của các lớp em đang học */
async function teachersOf(admin: Admin, studentId: string) {
  const { data: mem } = await admin.from('class_memberships').select('class_id').eq('student_id', studentId).eq('status', 'active');
  const classIds = (mem ?? []).map((m) => m.class_id as string);
  if (!classIds.length) return { owners: [] as string[], grades: [] as number[] };
  const [{ data: cls }, { data: ct }] = await Promise.all([
    admin.from('classes').select('id, grade').in('id', classIds).eq('status', 'active'),
    admin.from('class_teachers').select('teacher_id, class_id').in('class_id', classIds),
  ]);
  const live = new Set((cls ?? []).map((c) => c.id as string));
  return {
    owners: [...new Set((ct ?? []).filter((t) => live.has(t.class_id as string)).map((t) => t.teacher_id as string))],
    grades: [...new Set((cls ?? []).map((c) => Number(c.grade)))],
  };
}

const COLS = 'id, lesson_id, muc, type, prompt, options, answer, explanation';
const levelOf = (muc: number) => MUC_TO_LEVEL[muc] ?? 3;

/** Câu của cô cho một bài (KHÔNG kèm đáp án). Lỗi / chưa chạy migration 0072 → danh sách rỗng. */
export async function teacherQuestionsFor(admin: Admin, studentId: string, lessonId: string, max = 30): Promise<Question[]> {
  const { owners, grades } = await teachersOf(admin, studentId);
  if (!owners.length || !grades.length) return [];
  const { data, error } = await admin.from('teacher_questions').select(COLS)
    .in('owner', owners).in('grade', grades).eq('lesson_id', lessonId).eq('for_class', true)
    .order('created_at', { ascending: false }).limit(max);
  if (error) return [];
  return ((data ?? []) as Row[]).map((r) => {
    const level = levelOf(r.muc);
    const options = r.type === 'true_false' && !r.options?.length ? ['Đúng', 'Sai'] : r.options ?? [];
    return { id: `tq-${r.id}`, lessonId, type: r.type, prompt: r.prompt, options, level, timeLimit: defaultTimeLimit(r.type, level, r.prompt), byTeacher: true };
  });
}

/** Đáp án các câu của cô em được phép làm (theo mã "tq-…"); câu không hợp lệ thì không có trong kết quả */
export async function teacherKeysFor(admin: Admin, studentId: string, ids: string[]): Promise<Map<string, TeacherKey>> {
  const out = new Map<string, TeacherKey>();
  const uuids = [...new Set(ids.map((id) => TQ_ID.exec(id)?.[1]).filter(Boolean))] as string[];
  if (!uuids.length) return out;
  const { owners, grades } = await teachersOf(admin, studentId);
  if (!owners.length || !grades.length) return out;
  const { data, error } = await admin.from('teacher_questions').select(COLS)
    .in('id', uuids.slice(0, 30)).in('owner', owners).in('grade', grades).eq('for_class', true);
  if (error) return out;
  for (const r of (data ?? []) as Row[]) {
    const level = levelOf(r.muc);
    out.set(`tq-${r.id}`, { type: r.type, key: r.answer as AnswerKey, level, limit: defaultTimeLimit(r.type, level, r.prompt), lessonId: r.lesson_id, explanation: r.explanation });
  }
  return out;
}

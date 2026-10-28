// "Ngân hàng của tôi" (migration 0044): đọc / lưu / xoá câu hỏi riêng của giáo viên; sinh câu nâng cao bằng AI.
import { createClient } from '@/lib/supabase/client';
import { lessonPool, setCustomQuestions, type ExamQuestion, type Muc } from '@/lib/exams/matrix';
import type { SubjectCode } from '@/lib/types';
import { answerOf, checkMath, draftId, type Draft, type DraftType } from './parse';

export type MyQuestion = {
  id: string; subject: SubjectCode; grade: number; lesson_id: string | null; lesson_title: string; muc: Muc; type: DraftType;
  prompt: string; options: string[]; answer: Record<string, unknown>; explanation: string; source: string; created_at: string;
};

const isMissing = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === 'PGRST205' || e.code === '42P01' || /teacher_questions|does not exist|schema cache/i.test(e.message ?? ''));
export function bankError(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  if (isMissing(err)) return 'Máy chủ chưa có "Ngân hàng của tôi" — cần chạy migration 0044_teacher_questions.sql trên Supabase.';
  const m = err?.message ?? (e instanceof Error ? e.message : '');
  if (/too_many/.test(m)) return 'Ngân hàng tối đa 3000 câu — xoá bớt câu cũ nhé.';
  if (/row-level security/i.test(m)) return 'Chỉ tài khoản giáo viên mới lưu được câu hỏi.';
  return m && m.length < 200 ? m : 'Chưa lưu được, thử lại sau.';
}

export async function listMine(subject: SubjectCode, grade: number): Promise<MyQuestion[]> {
  const { data, error } = await createClient().from('teacher_questions')
    .select('id, subject, grade, lesson_id, lesson_title, muc, type, prompt, options, answer, explanation, source, created_at')
    .eq('subject', subject).eq('grade', grade).order('created_at', { ascending: false }).limit(3000);
  if (error) throw error;
  return (data ?? []) as MyQuestion[];
}

const sig = (q: { prompt: string }) => `tq#${q.prompt.trim().toLowerCase()}`;
export function toExamQuestion(q: MyQuestion): ExamQuestion {
  return { key: sig(q), muc: q.muc, type: q.type, prompt: q.prompt, options: q.options ?? [], answer: q.answer as ExamQuestion['answer'], explanation: q.explanation || undefined, lessonTitle: q.lesson_title };
}
/** Đưa câu của tôi vào kho chọn câu của ma trận đề */
export function registerMine(list: MyQuestion[]) {
  const m = new Map<string, ExamQuestion[]>();
  for (const q of list) if (q.lesson_id) m.set(q.lesson_id, [...(m.get(q.lesson_id) ?? []), toExamQuestion(q)]);
  setCustomQuestions(m);
}

export async function saveDrafts(subject: SubjectCode, grade: number, drafts: Draft[], titleOf: (id: string) => string): Promise<MyQuestion[]> {
  const rows = drafts.map((d) => ({
    subject, grade, lesson_id: d.lessonId || null, lesson_title: titleOf(d.lessonId).slice(0, 200), muc: d.muc, type: d.type,
    prompt: d.prompt.trim().slice(0, 2000), options: d.type === 'single_choice' || d.type === 'multiple_choice' ? d.options.map((o) => o.trim()).filter(Boolean).slice(0, 8) : [],
    answer: answerOf(d), explanation: d.explanation.trim().slice(0, 2000), source: d.source.slice(0, 160),
  }));
  const { data, error } = await createClient().from('teacher_questions').insert(rows)
    .select('id, subject, grade, lesson_id, lesson_title, muc, type, prompt, options, answer, explanation, source, created_at');
  if (error) throw error;
  return (data ?? []) as MyQuestion[];
}

export async function deleteMine(ids: string[]) {
  const { error } = await createClient().from('teacher_questions').delete().in('id', ids);
  if (error) throw error;
}

/** Sinh câu bằng AI (API key của chính thầy cô — /api/ai/questions); trả về bản nháp để cô duyệt */
export async function generateWithAi(p: { subject: SubjectCode; grade: number; lessonId: string; lessonTitle: string; muc: Muc; count: number; kind: 'choice' | 'open' | 'mix'; source: string; note: string }): Promise<Draft[]> {
  const r = await fetch('/api/ai/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
  const j = (await r.json().catch(() => ({}))) as { error?: string; questions?: { type: string; prompt: string; options?: string[]; answer: string | string[]; explanation?: string; muc?: number }[] };
  if (!r.ok || !j.questions) throw new Error(j.error ?? 'AI chưa trả lời được, thử lại sau.');
  return j.questions.map((q) => {
    const type: DraftType = q.type === 'single_choice' && (q.options?.length ?? 0) >= 2 ? 'single_choice' : q.type === 'true_false' ? 'true_false' : 'fill_blank';
    const correct = (Array.isArray(q.answer) ? q.answer : [q.answer]).map((x) => String(x).trim()).filter(Boolean);
    const d: Draft = {
      id: draftId(), type, prompt: q.prompt.trim(), options: type === 'single_choice' ? (q.options ?? []).map((o) => String(o).trim()) : [],
      correct: type === 'single_choice' ? correct.filter((c) => (q.options ?? []).includes(c)).slice(0, 1) : correct,
      muc: ([1, 2, 3].includes(Number(q.muc)) ? Number(q.muc) : p.muc) as Muc, lessonId: p.lessonId, explanation: (q.explanation ?? '').trim(), source: 'AI', include: true,
    };
    if (type === 'single_choice' && !d.correct.length) d.warn = 'AI chưa chỉ rõ đáp án đúng — chọn lại.';
    if (p.subject === 'toan') d.warn = checkMath(d) ?? d.warn;
    return d;
  });
}

/** Sinh câu bằng máy (miễn phí, không cần AI): lấy câu từ bộ sinh câu tự động của app cho bài đã chọn,
 *  đúng mức, bỏ câu đã có trong danh sách — dùng khi AI quá tải / chưa nối key. */
export function machineDrafts(lessonId: string, muc: Muc, count: number, skip: Set<string>): Draft[] {
  const pool = lessonPool(lessonId).filter((q) => !q.key.startsWith('tq#') && q.muc === muc && !skip.has(q.prompt.trim().toLowerCase())
    && ['single_choice', 'multiple_choice', 'true_false', 'fill_blank'].includes(q.type));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, count).map((q) => {
    const k = q.answer as { correct?: string | string[]; accepted?: string[] };
    const correct = Array.isArray(k.accepted) ? k.accepted : Array.isArray(k.correct) ? k.correct : k.correct ? [k.correct] : [];
    return { id: draftId(), type: q.type as DraftType, prompt: q.prompt, options: q.options ?? [], correct, muc, lessonId, explanation: q.explanation ?? '', source: 'Máy sinh', include: true };
  });
}

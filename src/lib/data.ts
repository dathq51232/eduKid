// Lớp truy cập dữ liệu cho các trang học.
// Hiện đọc từ dữ liệu minh họa. Khi nối Supabase, chỉ cần thay phần thân các hàm này:
//   - getLessons      -> select từ lessons (status = 'published') join subjects
//   - getQuestions    -> select từ questions (RLS chỉ trả câu đã xuất bản, không có đáp án),
//                        kèm difficulty -> level, time_limit_sec -> timeLimit
//   - gradeAnswer     -> rpc('submit_quiz_answer', ...) — trả correct, explanation, solution

import { demoLessons, demoQuestions, SUBJECTS } from './demo-data';
import { shuffle } from './shuffle';
import { gradeLocal } from './grading';
import { trapNote } from './practice/advanced/engine';
import { generateOne, generatePractice, isPracticeId, newSeed, practiceLesson, questionById, signature, PER_LEVEL, type GeneratedQuestion } from './practice/core';
import { buildSet, coreSig, eligiblePool, generatorFor, type Avoid, type Muc } from './sets';
import { readSetEntry, saveSetEntry } from './set-history';
import type { AnswerValue, GradeResult, Lesson, Question, Subject, SubjectCode } from './types';

export { GRADES, SUBJECTS } from './demo-data';

export { isSubjectCode, parseGrade } from './basics';

export function getSubject(code: SubjectCode): Subject {
  return SUBJECTS.find((s) => s.code === code) ?? SUBJECTS[0];
}

export function getLessons(subject: SubjectCode, grade: number): Lesson[] {
  return demoLessons().filter((l) => l.subject === subject && l.grade === grade).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLesson(lessonId: string): Lesson | undefined {
  if (isPracticeId(lessonId)) return practiceLesson(lessonId);
  return demoLessons().find((l) => l.id === lessonId);
}

/** Câu hỏi của bài. Bài luyện tập ngẫu nhiên (mã "lt-…") cần seed để sinh đề. */
export function getQuestions(lessonId: string, seed?: number): Question[] {
  if (isPracticeId(lessonId)) {
    if (!seed) return [];
    return generatePractice(lessonId, seed).map((q) => practiceToQuestion(q, lessonId));
  }
  return demoQuestions().filter((q) => q.lessonId === lessonId).map(demoToQuestion);
}

/**
 * Bộ câu của một lượt làm bài.
 *  - Không có seed: bộ câu gốc của bài.
 *  - Có seed: bộ 10 câu mới theo mức độ (Cơ bản / Khá / Giỏi) — xem src/lib/sets.ts.
 *  - prev ("goc" hoặc seed của bộ đang có): bộ mới KHÔNG lặp lại câu nào của bộ đó (và của bộ trước nữa).
 * Bộ đã tạo được ghi nhớ trên trình duyệt (src/lib/set-history.ts), nên tải lại trang vẫn đúng bộ cũ.
 */
export function getQuestionSet(lessonId: string, seed?: number, muc: Muc = 1, prev?: string | null): { questions: Question[]; note?: string } {
  if (!seed) return { questions: isPracticeId(lessonId) ? [] : getQuestions(lessonId) };
  // Bộ đã có: dựng lại đúng các câu đã hiện
  const saved = readSetEntry(lessonId, seed);
  if (saved) {
    const qs = saved.ids.map((id) => questionFromId(id, lessonId));
    if (qs.every(Boolean)) return { questions: qs as Question[] };
  }
  const built = buildSet(lessonId, seed, muc, avoidFrom(lessonId, prev, muc));
  const byId = new Map(demoQuestions().map((q) => [q.id, q]));
  const questions = built.picks.flatMap((p) => {
    if (p.kind === 'gen') return [practiceToQuestion(p.q, lessonId)];
    const d = byId.get(p.id);
    return d ? [demoToQuestion(d)] : [];
  });
  saveSetEntry(lessonId, seed, questions.map((q) => q.id), prev ?? undefined);
  return { questions, note: built.note };
}

/** Câu theo mã: câu soạn sẵn hoặc câu sinh ngẫu nhiên (sinh lại từ seed trong mã) */
function questionFromId(id: string, lessonId: string): Question | null {
  if (isPracticeId(id)) {
    const g = questionById(id);
    return g ? practiceToQuestion(g, lessonId) : null;
  }
  const d = demoQuestions().find((q) => q.id === id);
  return d ? demoToQuestion(d) : null;
}

/** Mã câu của một bộ: "goc" = bộ câu gốc của bài; số = bộ đã tạo với seed đó */
function setIds(lessonId: string, ref: string, muc: Muc): { ids: string[]; prev?: string } {
  if (ref === 'goc') return { ids: demoQuestions().filter((q) => q.lessonId === lessonId).map((q) => q.id) };
  const s = Number(ref);
  if (!Number.isInteger(s) || s <= 0) return { ids: [] };
  const saved = readSetEntry(lessonId, s);
  if (saved) return saved;
  // Không có trên máy này: dựng lại bộ đó theo seed (không tránh câu nào)
  const built = buildSet(lessonId, s, muc);
  return { ids: built.picks.map((p) => (p.kind === 'gen' ? p.q.id : p.id)) };
}

/** Các câu cần tránh: câu của bộ trước và bộ trước nữa */
function avoidFrom(lessonId: string, prev: string | null | undefined, muc: Muc): Avoid {
  const avoid: Avoid = { ids: new Set(), prompts: new Set(), sigs: new Set(), cores: new Set() };
  let ref = prev ?? undefined;
  for (let depth = 0; ref && depth < 2; depth++) {
    const { ids, prev: older } = setIds(lessonId, ref, muc);
    for (const id of ids) {
      avoid.ids.add(id);
      const q = questionFromId(id, lessonId);
      if (!q) continue;
      avoid.prompts.add(q.prompt);
      avoid.sigs.add(signature(q));
      const g = isPracticeId(id) ? questionById(id) : null;
      const d = g ? null : demoQuestions().find((x) => x.id === id);
      avoid.cores.add(coreSig(g ?? { prompt: q.prompt, key: d?.answerKey }));
    }
    ref = older;
  }
  return avoid;
}

function practiceToQuestion(q: GeneratedQuestion, lessonId: string): Question {
  return {
    id: q.id,
    lessonId,
    type: q.type,
    prompt: q.prompt,
    options: q.type === 'true_false' ? ['Đúng', 'Sai'] : q.type === 'ordering' || q.type === 'matching' ? shuffle(q.options, q.id) : q.options,
    leftItems: q.left ? shuffle(q.left, `${q.id}-l`) : undefined,
    skillCode: q.skill,
    level: q.level,
    timeLimit: q.timeLimit,
    figure: q.figure,
    optionFigures: q.optionFigures,
    blanks: q.blanks,
    statements: q.statements,
  };
}

/**
 * Nút "Đổi câu": tìm một câu khác CÙNG CẤP ĐỘ, không trùng các câu đang có trong bài (excludeIds).
 *  - Toán (bài theo sách và bài luyện tập): sinh câu mới bằng bộ sinh ngẫu nhiên của chính bài đó.
 *  - Các bài khác: lấy câu cùng cấp độ trong kho câu được phép của bài (bài này, bài học trước, câu ngân hàng
 *    nằm trong phạm vi kiến thức — xem eligiblePool trong src/lib/sets.ts).
 * Trả về null nếu không còn câu phù hợp.
 */
export function getReplacement(lessonId: string, current: Question, excludeIds: string[], used: Question[]): Question | null {
  const gen = generatorFor(lessonId);
  const fromGenerator = () => {
    if (!gen) return null;
    const avoid = new Set(used.map(signature));
    for (let i = 0; i < 25; i++) {
      const g = generateOne(gen, newSeed(), current.level);
      if (g && !avoid.has(signature(practiceToQuestion(g, lessonId)))) return practiceToQuestion(g, lessonId);
    }
    return null;
  };
  // Toán: sinh mới. Tiếng Việt, Tiếng Anh: ưu tiên câu soạn sẵn (khoảng một nửa số lần), còn lại sinh mới.
  if (isPracticeId(lessonId) || lessonId.startsWith('toan1-kntt-')) return fromGenerator();
  const skip = new Set(excludeIds);
  const prompts = new Set(used.map((x) => x.prompt));
  const pool = eligiblePool(lessonId).filter((e) => e.level === current.level && !skip.has(e.id) && !prompts.has(e.prompt));
  if (pool.length && (!gen || Math.random() < 0.5)) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const d = demoQuestions().find((q) => q.id === pick.id);
    if (d) return demoToQuestion(d);
  }
  return fromGenerator();
}

function demoToQuestion(q: ReturnType<typeof demoQuestions>[number]): Question {
  return {
    id: q.id,
    lessonId: q.lessonId,
    type: q.type,
    prompt: q.prompt,
    options: q.type === 'true_false' ? ['Đúng', 'Sai'] : q.options,
    leftItems: q.leftItems,
    skillCode: q.skillCode,
    level: q.level,
    timeLimit: q.timeLimit,
  };
}

export function countQuestions(lessonId: string): number {
  if (isPracticeId(lessonId)) return PER_LEVEL * 5;
  return demoQuestions().filter((q) => q.lessonId === lessonId).length;
}

/** Tổng thời gian tối đa (giây) của một bài = cộng thời gian từng câu. */
export function lessonTimeLimit(lessonId: string): number {
  if (isPracticeId(lessonId)) return generatePractice(lessonId, 1).reduce((s, q) => s + q.timeLimit, 0); // ước lượng theo một đề mẫu
  return demoQuestions().filter((q) => q.lessonId === lessonId).reduce((s, q) => s + q.timeLimit, 0);
}

// meta: thời gian em đã dùng cho câu và câu có hết giờ hay không. Khi nối Supabase gửi kèm
// rpc('submit_quiz_answer', { p_attempt, p_question, p_answer, p_time_ms: meta.spentMs, p_timed_out: meta.timedOut }).
export async function gradeAnswer(
  questionId: string,
  answer: AnswerValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  meta?: { spentMs: number; timedOut: boolean },
): Promise<GradeResult> {
  if (isTeacherQuestionId(questionId)) return gradeTeacherQuestion(questionId, answer);
  if (isPracticeId(questionId)) {
    // Câu sinh ngẫu nhiên: sinh lại đúng câu từ seed rồi chấm
    const gq = questionById(questionId);
    if (!gq) return { correct: false };
    if (answer === null) return { correct: false, explanation: gq.explanation, solution: gq.solution };
    const ok = gradeLocal(gq.type, answer, gq.key);
    return { correct: ok, explanation: ok ? gq.explanation : trapNote(gq.traps, answer, gq.explanation), solution: gq.solution };
  }
  const q = demoQuestions().find((item) => item.id === questionId);
  if (!q) return { correct: false };
  if (answer === null) return { correct: false, explanation: q.explanation, solution: q.solution }; // hết giờ
  const ok = gradeLocal(q.type, answer, q.answerKey);
  return { correct: ok, explanation: ok ? q.explanation : trapNote(q.traps, answer, q.explanation), solution: q.solution };
}

// ---------------------------------------------------------------------------
// "Câu của cô" (migration 0072): câu thầy cô lớp em bật cho lớp luyện ở Kho câu hỏi.
// Đáp án không gửi về trình duyệt — lấy câu và chấm qua /api/hoc-sinh/cau-cua-co.
export const isTeacherQuestionId = (id: string) => id.startsWith('tq-');

export async function fetchTeacherQuestions(lessonId: string, signal?: AbortSignal): Promise<Question[]> {
  try {
    const res = await fetch(`/api/hoc-sinh/cau-cua-co?lessonId=${encodeURIComponent(lessonId)}`, { signal, cache: 'no-store' });
    if (!res.ok) return [];
    const body = (await res.json()) as { questions?: Question[] };
    return Array.isArray(body.questions) ? body.questions : [];
  } catch {
    return [];
  }
}

async function gradeTeacherQuestion(id: string, answer: AnswerValue): Promise<GradeResult> {
  try {
    const res = await fetch('/api/hoc-sinh/cau-cua-co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, answer }) });
    const body = (await res.json().catch(() => ({}))) as { correct?: boolean; explanation?: string; error?: string };
    if (!res.ok) return { correct: false, explanation: body.error ?? 'Chưa chấm được câu này, em thử lại sau nhé.' };
    return { correct: body.correct === true, explanation: body.explanation };
  } catch {
    return { correct: false, explanation: 'Mất kết nối nên chưa chấm được câu này.' };
  }
}

/**
 * Trộn "Câu của cô" vào bộ câu của bài: thay một phần câu của app bằng câu của cô (cùng cấp độ nếu được).
 * Mức Cơ bản / Khá: tối đa khoảng 30% số câu; mức Giỏi: tối đa một nửa. Cùng seed thì cùng cách trộn.
 */
export function mixTeacherQuestions(base: Question[], extra: Question[], muc: Muc, seed?: number): Question[] {
  if (!extra.length || !base.length) return base;
  const seen = new Set(base.map((q) => q.prompt.trim().toLowerCase()));
  const pool = extra.filter((q) => !seen.has(q.prompt.trim().toLowerCase()));
  if (!pool.length) return base;
  let s = (seed ?? 7) >>> 0 || 7;
  const rand = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const order = pool.map((q) => ({ q, r: rand() })).sort((a, b) => a.r - b.r).map((x) => x.q);
  const take = Math.min(order.length, Math.max(1, Math.round(base.length * (muc >= 3 ? 0.5 : 0.3))));
  const out = [...base];
  const replaced = new Set<number>();
  for (const t of order.slice(0, take)) {
    // ưu tiên thay câu cùng cấp độ, không có thì câu gần cấp độ nhất (chưa bị thay)
    let best = -1;
    for (let i = 0; i < out.length; i++) {
      if (replaced.has(i)) continue;
      if (best < 0 || Math.abs(out[i].level - t.level) < Math.abs(out[best].level - t.level)) best = i;
    }
    if (best < 0) break;
    out[best] = t;
    replaced.add(best);
  }
  return out;
}

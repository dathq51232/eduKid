// Lớp truy cập dữ liệu cho các trang học.
// Hiện đọc từ dữ liệu minh họa. Khi nối Supabase, chỉ cần thay phần thân các hàm này:
//   - getLessons      -> select từ lessons (status = 'published') join subjects
//   - getQuestions    -> select từ questions (RLS chỉ trả câu đã xuất bản, không có đáp án),
//                        kèm difficulty -> level, time_limit_sec -> timeLimit
//   - gradeAnswer     -> rpc('submit_quiz_answer', ...) — trả correct, explanation, solution

import { DEMO_LESSONS, DEMO_QUESTIONS, SUBJECTS } from './demo-data';
import { shuffle } from './shuffle';
import { gradeLocal } from './grading';
import { generateOne, generatePractice, isPracticeId, newSeed, practiceLesson, questionById, signature, PER_LEVEL, type GeneratedQuestion } from './practice';
import { buildSet, coreSig, eligiblePool, generatorFor, type Avoid, type Muc } from './sets';
import { readSetEntry, saveSetEntry } from './set-history';
import type { AnswerValue, GradeResult, Lesson, Question, Subject, SubjectCode } from './types';

export { GRADES, SUBJECTS } from './demo-data';

export { isSubjectCode, parseGrade } from './basics';

export function getSubject(code: SubjectCode): Subject {
  return SUBJECTS.find((s) => s.code === code) ?? SUBJECTS[0];
}

export function getLessons(subject: SubjectCode, grade: number): Lesson[] {
  return DEMO_LESSONS.filter((l) => l.subject === subject && l.grade === grade).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLesson(lessonId: string): Lesson | undefined {
  if (isPracticeId(lessonId)) return practiceLesson(lessonId);
  return DEMO_LESSONS.find((l) => l.id === lessonId);
}

/** Câu hỏi của bài. Bài luyện tập ngẫu nhiên (mã "lt-…") cần seed để sinh đề. */
export function getQuestions(lessonId: string, seed?: number): Question[] {
  if (isPracticeId(lessonId)) {
    if (!seed) return [];
    return generatePractice(lessonId, seed).map((q) => practiceToQuestion(q, lessonId));
  }
  return DEMO_QUESTIONS.filter((q) => q.lessonId === lessonId).map(demoToQuestion);
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
  const byId = new Map(DEMO_QUESTIONS.map((q) => [q.id, q]));
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
  const d = DEMO_QUESTIONS.find((q) => q.id === id);
  return d ? demoToQuestion(d) : null;
}

/** Mã câu của một bộ: "goc" = bộ câu gốc của bài; số = bộ đã tạo với seed đó */
function setIds(lessonId: string, ref: string, muc: Muc): { ids: string[]; prev?: string } {
  if (ref === 'goc') return { ids: DEMO_QUESTIONS.filter((q) => q.lessonId === lessonId).map((q) => q.id) };
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
      const d = g ? null : DEMO_QUESTIONS.find((x) => x.id === id);
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
    const d = DEMO_QUESTIONS.find((q) => q.id === pick.id);
    if (d) return demoToQuestion(d);
  }
  return fromGenerator();
}

function demoToQuestion(q: (typeof DEMO_QUESTIONS)[number]): Question {
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
  return DEMO_QUESTIONS.filter((q) => q.lessonId === lessonId).length;
}

/** Tổng thời gian tối đa (giây) của một bài = cộng thời gian từng câu. */
export function lessonTimeLimit(lessonId: string): number {
  if (isPracticeId(lessonId)) return generatePractice(lessonId, 1).reduce((s, q) => s + q.timeLimit, 0); // ước lượng theo một đề mẫu
  return DEMO_QUESTIONS.filter((q) => q.lessonId === lessonId).reduce((s, q) => s + q.timeLimit, 0);
}

// meta: thời gian em đã dùng cho câu và câu có hết giờ hay không. Khi nối Supabase gửi kèm
// rpc('submit_quiz_answer', { p_attempt, p_question, p_answer, p_time_ms: meta.spentMs, p_timed_out: meta.timedOut }).
export async function gradeAnswer(
  questionId: string,
  answer: AnswerValue,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  meta?: { spentMs: number; timedOut: boolean },
): Promise<GradeResult> {
  if (isPracticeId(questionId)) {
    // Câu sinh ngẫu nhiên: sinh lại đúng câu từ seed rồi chấm
    const gq = questionById(questionId);
    if (!gq) return { correct: false };
    if (answer === null) return { correct: false, explanation: gq.explanation, solution: gq.solution };
    return { correct: gradeLocal(gq.type, answer, gq.key), explanation: gq.explanation, solution: gq.solution };
  }
  const q = DEMO_QUESTIONS.find((item) => item.id === questionId);
  if (!q) return { correct: false };
  if (answer === null) return { correct: false, explanation: q.explanation, solution: q.solution }; // hết giờ
  return { correct: gradeLocal(q.type, answer, q.answerKey), explanation: q.explanation, solution: q.solution };
}

// Sinh đề phòng thi lớp (chạy trên trình duyệt của cô, sau khi đã nạp ngân hàng bài của khối).
// Hai cách (cô chọn trong "Quy tắc sinh đề"):
//  - 'rieng': mỗi em một đề riêng, cùng ma trận (khác câu / thứ tự câu / thứ tự phương án);
//  - 'chung': cả lớp chung một đề cô đã duyệt, mỗi em chỉ đảo thứ tự câu (trong từng mức) và thứ tự phương án.
// Cô xem trước, đổi / sửa / xoá câu rồi mới tạo phòng; đề đã duyệt được lưu nguyên vào từng em.
import { gradeLocal, normalizeAnswer } from '../grading';
import { buildPaper, stageOf, type ExamQuestion, type Matrix, type Paper, type PaperSlot } from '../exams/matrix';
import type { QuestionType } from '../types';
import type { AnswerValue } from '../types';
import type { ExamItem } from './assignments';

export type RoomMode = 'rieng' | 'chung';
/** Lưu vào exam_rooms.matrix: ma trận + cách sinh đề + đề chung (để "Cho làm lại" dùng đúng quy tắc cô đặt) */
export type RoomPlan = Matrix & { mode?: RoomMode; base?: ExamItem[] };
export type BuiltPaper = { items: ExamItem[]; missing: number };

function rng(seed: number) {
  let s = (seed ^ 0x9e3779b9) >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return { shuffle };
}

/** Đảo thứ tự câu nhưng giữ câu dễ ở đầu đề: trộn trong từng mức (đề phòng thi không chia phần trắc nghiệm / tự luận).
 *  layout 'dang': xếp theo dạng thao tác (chọn → điền → nối → xếp nhóm), trong mỗi dạng dễ → khó, chỉ trộn trong cùng (dạng, mức). */
function byMucShuffled<T extends { muc?: number }>(xs: T[], seed: number, layout?: Matrix['layout'], typeOf?: (x: T) => QuestionType): T[] {
  const { shuffle } = rng(seed);
  if (layout === 'dang' && typeOf) {
    return [1, 2, 3, 4].flatMap((st) => [1, 2, 3].flatMap((k) => shuffle(xs.filter((x) => stageOf(typeOf(x)) === st && (x.muc ?? 1) === k))));
  }
  return [1, 2, 3].flatMap((k) => shuffle(xs.filter((x) => (x.muc ?? 1) === k)));
}

/** Câu trong đề (có ô ma trận) → câu lưu cho em; điểm câu = điểm mỗi câu của mức đó trong quy tắc */
export function slotItem(s: PaperSlot, points: Matrix['points']): ExamItem {
  const q = s.q;
  const pts = Number(points?.[s.muc]);
  return {
    type: q.type, prompt: q.prompt, options: q.options, left: q.left, blanks: q.blanks, statements: q.statements,
    answer: q.answer, explanation: q.explanation, lessonTitle: q.lessonTitle, muc: s.muc, pts: Number.isFinite(pts) && pts > 0 ? pts : 1,
  };
}

/** Đề xem trước của một em (đúng thứ tự em sẽ thấy) */
export function previewPaper(m: Matrix, seed: number): Paper {
  const p = buildPaper(m, seed >>> 0, 'P');
  return { ...p, slots: byMucShuffled(p.slots, seed, m.layout, (s) => s.q.type) };
}

/** Một đề riêng cho một em (dùng khi tạo nhanh không xem trước, và khi "Cho làm lại" ở phòng đề riêng) */
export function roomPaper(m: Matrix, seed: number): BuiltPaper {
  const p = previewPaper(m, seed);
  return { items: p.slots.map((s) => slotItem(s, m.points)), missing: p.missing.reduce((a, x) => a + (x.need - x.got), 0) };
}

/** Đề chung → bản của một em: đảo câu trong từng mức và đảo phương án (đáp án giữ theo nội dung nên vẫn chấm đúng) */
export function commonPaperFor(base: ExamItem[], seed: number, layout?: Matrix['layout']): ExamItem[] {
  const { shuffle } = rng(seed ^ 0x5bd1e995);
  return byMucShuffled(base, seed, layout, (q) => q.type).map((q) => {
    if (q.type === 'grouping') return { ...q, left: shuffle([...(q.left ?? [])]) };
    if (['single_choice', 'multiple_choice', 'matching', 'pair_grid'].includes(q.type)) return { ...q, options: shuffle([...q.options]) };
    return q;
  });
}

/** Đề của một em theo quy tắc phòng (cho "Cho làm lại") */
export function paperByPlan(plan: RoomPlan, seed: number): BuiltPaper {
  if (plan.mode === 'chung' && plan.base?.length) return { items: commonPaperFor(plan.base, seed, plan.layout), missing: 0 };
  return roomPaper(plan, seed);
}

/** Đáp án đúng viết dưới dạng câu trả lời của em — để tự chấm thử câu cô vừa sửa */
function rightAnswer(q: Pick<ExamItem, 'type' | 'answer'>): AnswerValue {
  const k = (q.answer ?? {}) as Record<string, unknown>;
  switch (q.type) {
    case 'single_choice': case 'true_false': return (k.correct as string) ?? null;
    case 'multiple_choice': return (k.correct as string[]) ?? null;
    case 'ordering': return (k.order as string[]) ?? null;
    case 'fill_blank': return ((k.accepted as string[]) ?? [])[0] ?? null;
    case 'fill_blanks': return ((k.answers as string[][]) ?? [])[0] ?? null;
    case 'true_false_table': return (k.truth as string[]) ?? null;
    case 'matching': case 'grouping': case 'pair_grid': return (k.pairs as Record<string, string>) ?? null;
    default: return null;
  }
}

/** Lỗi của một câu (sau khi cô sửa): null = dùng được */
export function itemProblem(q: Pick<ExamQuestion, 'type' | 'prompt' | 'options' | 'answer' | 'blanks' | 'statements'>): string | null {
  if (!q.prompt.trim()) return 'Câu hỏi đang trống.';
  const k = (q.answer ?? {}) as Record<string, unknown>;
  const choice = q.type === 'single_choice' || q.type === 'multiple_choice';
  if (choice) {
    if (q.options.length < 2 || q.options.some((o) => !o.trim())) return 'Cần ít nhất 2 phương án, không để phương án trống.';
    if (new Set(q.options.map(normalizeAnswer)).size !== q.options.length) return 'Có hai phương án giống nhau.';
    const c = q.type === 'single_choice' ? [k.correct as string] : ((k.correct as string[]) ?? []);
    if (!c.length || c.some((x) => !q.options.includes(x))) return 'Chưa chọn đáp án đúng.';
    if (q.type === 'multiple_choice' && c.length === q.options.length) return 'Không thể mọi phương án đều đúng.';
  }
  if (q.type === 'fill_blank' && !((k.accepted as string[]) ?? []).some((x) => x.trim())) return 'Chưa có đáp án.';
  if (q.type === 'fill_blanks') {
    const holes = (q.blanks ?? []).join(' ').split('{}').length - 1;
    const a = ((k.answers as string[][]) ?? [])[0] ?? [];
    if (a.length !== holes || a.some((x) => !String(x).trim())) return 'Mỗi chỗ trống cần một đáp án.';
  }
  if (q.type === 'true_false_table' && ((q.statements ?? []).some((s) => !s.trim()) || (q.statements ?? []).length !== ((k.truth as string[]) ?? []).length)) return 'Mỗi ý cần nội dung và chọn Đúng / Sai.';
  const right = rightAnswer(q);
  if (right === null || !gradeLocal(q.type, right, q.answer ?? {})) return 'Đáp án đúng không chấm được — kiểm tra lại đáp án.';
  return null;
}

/** Seed khác nhau cho từng em (theo mã em + thời điểm tạo) */
export function seedFor(studentId: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < studentId.length; i++) { h ^= studentId.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

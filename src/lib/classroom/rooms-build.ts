// Sinh đề riêng cho từng em của phòng thi (chạy trên trình duyệt của cô, sau khi đã nạp ngân hàng bài của khối).
// Mỗi em: cùng ma trận, khác câu / thứ tự câu / thứ tự phương án (buildPaper với seed riêng).
import { buildPaper, type Matrix } from '../exams/matrix';
import type { ExamItem } from './assignments';

export type BuiltPaper = { items: ExamItem[]; missing: number };

/** Một đề cho một em: câu theo ma trận, trộn thứ tự câu (đề phòng thi không chia phần trắc nghiệm / tự luận) */
export function roomPaper(m: Matrix, seed: number): BuiltPaper {
  const p = buildPaper(m, seed >>> 0, 'P');
  const items: ExamItem[] = p.slots.map(({ q, muc }) => ({
    type: q.type, prompt: q.prompt, options: q.options, left: q.left, blanks: q.blanks, statements: q.statements,
    answer: q.answer, explanation: q.explanation, lessonTitle: q.lessonTitle, muc, pts: 1,
  }));
  // đảo thứ tự câu nhưng giữ câu dễ ở đầu đề: trộn trong từng mức
  let s = (seed ^ 0x9e3779b9) >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const byMuc = [1, 2, 3].map((k) => shuffle(items.filter((x) => x.muc === k)));
  const missing = p.missing.reduce((a, x) => a + (x.need - x.got), 0);
  return { items: byMuc.flat(), missing };
}

/** Seed khác nhau cho từng em (theo mã em + thời điểm tạo) */
export function seedFor(studentId: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < studentId.length; i++) { h ^= studentId.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

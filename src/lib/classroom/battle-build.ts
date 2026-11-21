// ĐẤU CẶP — sinh đề cho các cặp của vòng mới (chạy trên máy cô, sau khi đã nạp ngân hàng bài của khối + Câu của tôi).
import type { ExamItem } from './assignments';
import { bookLessons, defaultMatrix, totals, type BookLesson, type Matrix } from '../exams/matrix';
import { roomPaper } from './rooms-build';
import { roundRatio } from './battle';
import type { SubjectCode } from '../types';

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Đề cho `count` cặp: cùng các bài, cùng số câu và điểm như vòng 1 (plan), tỉ lệ mức khó dần theo số em còn lại */
export function battleSets(plan: Partial<Matrix>, subject: SubjectCode, grade: number, alive: number, count: number): ExamItem[][] | null {
  const ids = new Set((plan.rows ?? []).flatMap((r) => r.lessonIds ?? []));
  const lessons: BookLesson[] = bookLessons(subject, grade).filter((l) => ids.has(l.id));
  const n = plan.rows && plan.points ? totals(plan as Matrix).questions : 10;
  if (!lessons.length || !n) return null;
  const m = { ...defaultMatrix(lessons, n, roundRatio(alive)), points: plan.points ?? { 1: 1, 2: 1, 3: 1 } };
  const out: ExamItem[][] = [];
  for (let k = 0; k < count; k++) {
    const p = roomPaper(m, newSeed());
    if (p.items.length < 3) return null;
    out.push(p.items);
  }
  return out;
}

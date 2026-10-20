// Chuẩn bị dữ liệu bài cho trang Kế hoạch bài dạy — CHỈ chạy ở máy chủ (cần ngân hàng câu hỏi).
import { CONTENT } from '../content';
import { knowledgeFor } from '../content/knowledge';
import { findOutcomeAny, formsOf } from '../curriculum';
import type { SubjectCode } from '../types';
import type { LessonInfo } from './generate';

const uniq = <T,>(a: T[]) => [...new Set(a)];

/** Bài theo sách của một môn – khối (không gồm đề ôn), đúng thứ tự trong sách, kèm YCCĐ, dạng bài, kiến thức cần nhớ */
export function lessonInfos(subject: SubjectCode, grade: number): LessonInfo[] {
  const formMap = new Map(formsOf(subject).map((f) => [f.code, f.name]));
  return CONTENT.filter((l) => l.subject === subject && l.grade === grade && l.kind !== 'review').map((l) => {
    const know = knowledgeFor(l.id);
    return {
      id: l.id, title: l.title, description: l.description, ref: l.ref, semester: l.semester,
      outcomes: uniq(l.questions.map((q) => q.outcome)).map((c) => findOutcomeAny(subject, c)?.outcome.text).filter((x): x is string => !!x),
      forms: uniq(l.questions.map((q) => q.form)).map((c) => formMap.get(c)).filter((x): x is string => !!x),
      knowledge: know?.points ?? [],
      example: know?.example ?? '',
    };
  });
}

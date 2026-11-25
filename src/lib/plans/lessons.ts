// Chuẩn bị dữ liệu bài cho trang Kế hoạch bài dạy — CHỈ chạy ở máy chủ (cần ngân hàng câu hỏi).
import { CONTENT, type ContentLesson } from '../content';
import { knowledgeFor } from '../content/knowledge';
import { findOutcomeAny, formsOf } from '../curriculum';
import type { SubjectCode } from '../types';
import type { LessonInfo } from './generate';

const uniq = <T,>(a: T[]) => [...new Set(a)];

/** Số lớn nhất trong một cụm "phạm vi …" của câu yêu cầu cần đạt ("trong phạm vi 10 000 và 100 000" → 100 000; không có → null) */
export function rangeOf(text: string): number | null {
  const m = /phạm vi ([\d\s.]+(?:(?:và|,)\s*[\d\s.]+)*)/i.exec(text);
  if (!m) return null;
  const nums = m[1].split(/và|,/).map((x) => Number(x.replace(/[\s.]/g, ''))).filter((n) => Number.isFinite(n) && n > 0);
  return nums.length ? Math.min(...nums) : null;
}

/** "{}" trong kiến thức cần nhớ là ô trống cần điền (trang làm bài hiện thành ô nhập) → giáo án hiện □ */
const blank = (s: string) => s.replace(/\{\}/g, '□');

/**
 * Yêu cầu cần đạt của một bài, lấy từ mã YCCĐ gắn trên câu hỏi. YCCĐ trong danh mục là của CẢ NĂM / chủ đề,
 * nên lọc cho đúng bài:
 *  - chính: mã của câu cấp độ L1–L3 (trọng tâm), xếp theo số câu, tối đa 3;
 *  - mở rộng: mã chỉ có ở câu L4–L5 (dành cho học sinh hoàn thành tốt), tối đa 2;
 *  - bỏ YCCĐ có "phạm vi" lớn hơn phạm vi số của bài (vd bài học kỳ 1 trong phạm vi 1 000 không ghi "phạm vi 10 000").
 */
export function lessonOutcomes(l: ContentLesson): { core: string[]; extend: string[] } {
  const max = 'maxNumber' in l.scope ? l.scope.maxNumber : null;
  const stat = new Map<string, { n: number; core: boolean; first: number }>();
  l.questions.forEach((q, i) => {
    const e = stat.get(q.outcome) ?? { n: 0, core: false, first: i };
    e.n++; if (q.level <= 3) e.core = true;
    stat.set(q.outcome, e);
  });
  const texts = [...stat.entries()]
    .sort((a, b) => b[1].n - a[1].n || a[1].first - b[1].first)
    .map(([code, e]) => ({ text: findOutcomeAny(l.subject, code)?.outcome.text ?? '', core: e.core }))
    .filter((x) => x.text && !(max !== null && (rangeOf(x.text) ?? 0) > max));
  return {
    core: uniq(texts.filter((x) => x.core).map((x) => x.text)).slice(0, 3),
    extend: uniq(texts.filter((x) => !x.core).map((x) => x.text)).slice(0, 2),
  };
}

/** Bài theo sách của một môn – khối (không gồm đề ôn), đúng thứ tự trong sách, kèm YCCĐ, dạng bài, kiến thức cần nhớ */
export function lessonInfos(subject: SubjectCode, grade: number): LessonInfo[] {
  const formMap = new Map(formsOf(subject).map((f) => [f.code, f.name]));
  return CONTENT.filter((l) => l.subject === subject && l.grade === grade && l.kind !== 'review').map((l) => {
    const know = knowledgeFor(l.id);
    const { core, extend } = lessonOutcomes(l);
    return {
      id: l.id, title: l.title, description: l.description, ref: l.ref, semester: l.semester,
      outcomes: core,
      extend,
      forms: uniq(l.questions.map((q) => q.form)).map((c) => formMap.get(c)).filter((x): x is string => !!x),
      knowledge: (know?.points ?? []).map(blank),
      example: blank(know?.example ?? ''),
    };
  });
}

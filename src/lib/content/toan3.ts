// TOÁN 3 — 81 bài theo mục lục sách Toán 3 (Kết nối tri thức), HK1: Bài 1–44, HK2: Bài 45–81.
// Bộ câu gốc của mỗi bài (8 câu, L1 → L5) được rút từ bộ sinh câu của chính bài với hạt giống cố định
// (src/lib/practice/toan3.ts) — câu tự soạn, không chép bài tập của sách. Chỉ lấy các dạng hiển thị được không cần
// tranh (chọn đáp án, chọn nhiều, sắp xếp, ghép cặp, điền một ô); "Đổi bộ câu hỏi" và "Luyện tập thêm" dùng đủ mọi dạng.

import { makeRng } from '../practice/rng';
import { t3Context, t3Pool } from '../practice/toan3';
import type { PracticeQuestion } from '../practice/kit';
import { T3_CHAPTERS, T3_LESSONS, t3Id, type T3Lesson } from './toan3-plan';
import type { ContentLesson, ContentQuestion, Level } from './types';

const BOOK = 'Kết nối tri thức';
const TARGET: Level[] = [1, 1, 2, 2, 3, 3, 4, 5];

/** Đổi câu sinh tự động sang câu soạn sẵn (bỏ câu cần tranh hoặc nhiều ô) */
function toContent(q: PracticeQuestion): ContentQuestion | null {
  const keep = (x: PracticeQuestion) => {
    const rest: Partial<PracticeQuestion> = { ...x };
    delete rest.figure; delete rest.optionFigures; delete rest.blanks; delete rest.statements;
    return rest as ContentQuestion;
  };
  if (q.type === 'fill_blanks') {
    const lines = q.blanks ?? [];
    const n = lines.join('\n').split('{}').length - 1;
    const sets = (q.key as { answers: string[][] }).answers;
    // Bài toán có lời văn: ô phép tính và ô đáp số cùng một kết quả → chỉ hỏi đáp số
    const sameAll = n > 1 && sets.every((a) => a.every((x) => x === a[0]));
    if (n !== 1 && !sameAll) return null;
    const ans = sets.map((a) => a[0]);
    const line = (sameAll ? lines[lines.length - 1] : lines.join('\n')).replace('{}', '?');
    const prompt = q.prompt.endsWith('.') && !q.prompt.includes(line) ? `${q.prompt}\n${line}` : `${q.prompt}\n${line}`;
    return { ...keep(q), type: 'fill_blank', prompt, options: [], key: { accepted: [...new Set(ans)] } };
  }
  if (q.type === 'true_false_table') return null;
  if (q.figure && q.figure.kind !== 'column' && q.figure.kind !== 'calendar') return null; // đề đã ghi đủ phép tính / ngày, thứ
  return keep(q);
}

function baseQuestions(p: T3Lesson): ContentQuestion[] {
  const pool = t3Pool(p.topics);
  const ctx = t3Context(p);
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  TARGET.forEach((lv, slot) => {
    const r = makeRng(p.no * 7927 + slot * 104723 + 3);
    for (let i = 0; i < 300; i++) {
      const t = r.pick(pool[lv].length ? pool[lv] : pool[3]);
      const q = t(r, ctx, lv);
      if (!q) continue;
      const cq = toContent(q);
      if (!cq || seen.has(cq.prompt)) continue;
      seen.add(cq.prompt);
      out.push(cq);
      return;
    }
  });
  return out;
}

const lesson = (p: T3Lesson): ContentLesson => ({
  id: t3Id(p.no),
  subject: 'toan',
  grade: 3,
  semester: p.no <= 44 ? 1 : 2,
  book: BOOK,
  ref: `Bài ${p.no}`,
  unit: { code: `KNTT.T3.CD${p.chapter}`, title: T3_CHAPTERS[p.chapter] },
  topicCode: p.topicCode,
  title: `Bài ${p.no}. ${p.title}`,
  description: p.description,
  scope: p.scope,
  questions: baseQuestions(p),
});

export const TOAN3_HK1: ContentLesson[] = T3_LESSONS.filter((p) => p.no <= 44).map(lesson);
export const TOAN3_HK2: ContentLesson[] = T3_LESSONS.filter((p) => p.no > 44).map(lesson);

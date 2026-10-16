// TOÁN 5 — 75 bài theo mục lục sách Toán 5 (Kết nối tri thức), HK1: Bài 1–35, HK2: Bài 36–75.
// Bộ câu gốc của mỗi bài (8 câu, L1 → L5) được rút từ bộ sinh câu của chính bài với hạt giống cố định
// (src/lib/practice/toan5.ts) — câu tự soạn, không chép bài tập của sách. Chỉ lấy các dạng hiển thị được không cần
// tranh (chọn đáp án, chọn nhiều, sắp xếp, ghép cặp, điền một ô); "Đổi bộ câu hỏi" và "Luyện tập thêm" dùng đủ mọi dạng.

import { makeRng } from '../practice/rng';
import { t5Context, t5Pool } from '../practice/toan5';
import type { PracticeQuestion } from '../practice/kit';
import { T5_CHAPTERS, T5_LESSONS, t5Id, type T5Lesson } from './toan5-plan';
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
    // Kết quả dạng "… giờ … phút": đổi thành câu chọn đáp án
    if (n === 2 && lines.length === 1 && lines[0].includes('{} giờ {} phút')) {
      const [h, m] = sets[0].map(Number);
      const right = `${h} giờ ${m} phút`;
      const opts = [...new Set([right, `${h} giờ ${(m + 30) % 60} phút`, `${h + 1} giờ ${m} phút`, `${h > 0 ? h - 1 : h + 2} giờ ${m} phút`])];
      const order = opts.map((o, i) => [o, (h * 7 + m + i * 13) % 4] as const).sort((x, y) => x[1] - y[1]).map((x) => x[0]);
      return { ...keep(q), type: 'single_choice', prompt: `${q.prompt}\n${lines[0].replace('{} giờ {} phút', '?')}`, options: order, key: { correct: right } };
    }
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

function baseQuestions(p: T5Lesson): ContentQuestion[] {
  const pool = t5Pool(p.topics);
  const ctx = t5Context(p);
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  TARGET.forEach((lv, slot) => {
    const r = makeRng(p.no * 7933 + slot * 104717 + 5);
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

const lesson = (p: T5Lesson): ContentLesson => ({
  id: t5Id(p.no),
  subject: 'toan',
  grade: 5,
  semester: p.no <= 35 ? 1 : 2,
  book: BOOK,
  ref: `Bài ${p.no}`,
  unit: { code: `KNTT.T5.CD${p.chapter}`, title: T5_CHAPTERS[p.chapter] },
  topicCode: p.topicCode,
  title: `Bài ${p.no}. ${p.title}`,
  description: p.description,
  scope: p.scope,
  questions: baseQuestions(p),
});

export const TOAN5_HK1: ContentLesson[] = T5_LESSONS.filter((p) => p.no <= 35).map(lesson);
export const TOAN5_HK2: ContentLesson[] = T5_LESSONS.filter((p) => p.no > 35).map(lesson);

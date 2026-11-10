// Mục "Chuyên đề nâng cao" (Toán lớp 2–5): mỗi chuyên đề là một bài trên trang Chọn bài (nhóm riêng cuối danh sách Toán),
// có bộ câu gốc 8 câu (rút từ bộ sinh với hạt giống cố định), "Đổi bộ câu hỏi" và "Luyện tập thêm" sinh đề mới không giới hạn.
// Thêm chuyên đề: viết GenPool trong topics-*.ts rồi thêm một dòng vào ADV_TOPICS.

import type { ContentLesson, ContentQuestion, Level, Scope } from '../../content/types';
import { entry, type AnyPool, type Entry } from '../core';
import { makeRng } from '../rng';
import type { PracticeQuestion } from '../kit';
import { toPool, type AdvCtx, type AdvGrade, type GenPool } from './engine';
import { AGES, MIXES, PAGES, TREES } from './topics-a';
import { FRACS, WORKS } from './topics-b';
import { EQUALS, QUICKS, SEQS } from './topics-c';

export type AdvTopic = { slug: string; name: string; description: string; grades: AdvGrade[]; pool: GenPool };

export const ADV_TOPICS: AdvTopic[] = [
  // Lớp 2–3
  { slug: 'them-bot', name: 'Thêm bớt cho bằng nhau', grades: [2, 3], pool: EQUALS,
    description: 'Bạn này cho bạn kia bao nhiêu thì bằng nhau, cho rồi vẫn còn hơn, tìm số lúc đầu, ba bạn chia lại cho đều.' },
  { slug: 'quy-luat-day', name: 'Quy luật dãy số', grades: [2, 3], pool: SEQS,
    description: 'Viết tiếp dãy cách đều, tìm số còn thiếu, số thứ n, đếm số các số; dãy có hiệu tăng dần, hai dãy đan xen, dãy gấp đôi.' },
  { slug: 'tinh-nhanh', name: 'Tính nhanh', grades: [2, 3], pool: QUICKS,
    description: 'Ghép số tròn chục, tròn trăm; cộng trừ 9, 99, 999; ghép cặp dãy số; thừa số chung.' },
  // Lớp 4–5
  { slug: 'trong-cay', name: 'Trồng cây – khoảng cách', grades: [4, 5], pool: TREES,
    description: 'Trồng cây hai đầu, một đầu, không trồng đầu, vòng tròn; cưa gỗ, leo cầu thang, trồng xen kẽ.' },
  { slug: 'tinh-tuoi', name: 'Tính tuổi', grades: [4, 5], pool: AGES,
    description: 'Hiệu số tuổi không đổi; tổng tuổi tăng theo số người; tổng – hiệu, hiệu – tỉ ở hiện tại, quá khứ, tương lai.' },
  { slug: 'gia-thiet-tam', name: 'Giả thiết tạm (gà – chó)', grades: [4, 5], pool: MIXES,
    description: 'Gà – chó, xe ba bánh – xe đạp, vé người lớn – trẻ em, cuộc thi có điểm trừ.' },
  { slug: 'danh-so-trang', name: 'Đánh số trang – đếm chữ số', grades: [4, 5], pool: PAGES,
    description: 'Đếm chữ số khi đánh số trang, bài toán ngược, đếm số lần xuất hiện một chữ số, tìm chữ số thứ k.' },
  { slug: 'day-phan-so', name: 'Dãy phân số khử dần', grades: [5], pool: FRACS,
    description: 'Tổng dãy phân số có quy luật: tách mỗi số hạng thành hiệu hai phân số để các số ở giữa triệt tiêu.' },
  { slug: 'cong-viec-chung', name: 'Công việc chung – vòi nước', grades: [5], pool: WORKS,
    description: 'Nhiều người cùng làm, có người nghỉ giữa chừng; vòi chảy vào – vòi tháo ra.' },
];

// Phạm vi kiến thức (dùng cho kiểm tra "không vượt trước"): lớp 2 bảng nhân 2, 5; lớp 3 nhân chia với số có một chữ số; lớp 4 đủ 4 phép tính với số nhiều chữ số; lớp 5 có phân số.
const SCOPE: Record<AdvGrade, Scope> = {
  2: { kind: 'math2', maxNumber: 1000, ops: ['+', '-', '×', ':'], carry: true, carryMax: 1000, tables: [2, 5] },
  3: { kind: 'math2', maxNumber: 100000, ops: ['+', '-', '×', ':'], carry: true, carryMax: 100000, tables: [2, 3, 4, 5, 6, 7, 8, 9], bigMul: true, remainder: true },
  4: { kind: 'math2', maxNumber: 999999999, ops: ['+', '-', '×', ':'], carry: true, carryMax: 999999999, tables: [2, 3, 4, 5, 6, 7, 8, 9], bigMul: true, remainder: true, mulMax: 99, pow10: true },
  5: { kind: 'math5', maxNumber: 999999999, ops: ['+', '-', '×', ':'], decimal: true },
};
export { advId } from '../../content/knowledge-nc';
import { advId } from '../../content/knowledge-nc';
const TARGET: Level[] = [1, 1, 2, 2, 3, 3, 4, 5];

/** Câu sinh tự động → câu soạn sẵn (ô điền một đáp số → fill_blank) */
function toContent(q: PracticeQuestion): ContentQuestion {
  const rest: PracticeQuestion = { ...q };
  delete rest.blanks; delete rest.figure; delete rest.optionFigures; delete rest.statements;
  if (q.type !== 'fill_blanks') return rest;
  const line = (q.blanks ?? [])[0]?.replace('{}/{}', '?').replace('{}', '?') ?? 'Đáp số: ?';
  const accepted = [...new Set((q.key as { answers: string[][] }).answers.map((a) => a.join('/')))];
  return { ...rest, type: 'fill_blank', prompt: `${q.prompt}\n${line}`, options: [], key: { accepted } };
}

function baseQuestions(t: AdvTopic, grade: AdvGrade): ContentQuestion[] {
  const pool = toPool(t.pool);
  const ctx: AdvCtx = { grade };
  const out: ContentQuestion[] = [];
  const seen = new Set<string>();
  TARGET.forEach((lv, slot) => {
    const r = makeRng(grade * 9173 + slot * 104729 + t.slug.length * 31 + 7);
    for (let i = 0; i < 400; i++) {
      const q = r.pick(pool[lv])(r, ctx, lv);
      if (!q || seen.has(q.prompt)) continue;
      seen.add(q.prompt);
      out.push(toContent(q));
      return;
    }
  });
  return out;
}

const topicsOf = (grade: AdvGrade) => ADV_TOPICS.filter((t) => t.grades.includes(grade));

function lessonOf(t: AdvTopic, grade: AdvGrade, i: number): ContentLesson {
  return {
    id: advId(grade, t.slug),
    subject: 'toan',
    grade,
    semester: 2,
    book: 'Chuyên đề nâng cao',
    ref: `Chuyên đề ${i + 1}`,
    unit: { code: `NC.T${grade}`, title: 'Chuyên đề nâng cao · Tư duy' },
    topicCode: `T${grade}.TD`,
    title: `Chuyên đề ${i + 1}. ${t.name}`,
    description: t.description,
    scope: SCOPE[grade],
    questions: baseQuestions(t, grade),
  };
}

/** Bài chuyên đề nâng cao của lớp (đặt cuối danh sách Toán của khối) */
const CACHE = new Map<number, ContentLesson[]>();
export const advancedLessons = (grade: AdvGrade): ContentLesson[] => {
  let list = CACHE.get(grade);
  if (!list) { list = topicsOf(grade).map((t, i) => lessonOf(t, grade, i)); CACHE.set(grade, list); }
  return list;
};

/** Bộ sinh "Luyện tập thêm" cho các chuyên đề của lớp */
export const advancedEntries = (grade: AdvGrade): Entry[] =>
  topicsOf(grade).map((t, i) => entry(advancedLessons(grade).find((l) => l.id === advId(grade, t.slug)), () => ({ grade }) as AdvCtx, toPool(t.pool) as unknown as AnyPool, grade * 1000 + 900 + i));


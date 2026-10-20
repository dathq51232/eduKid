// Ma trận đề kiểm tra định kỳ cho giáo viên tiểu học + chọn câu tự động từ ngân hàng câu hỏi EduChain Kids.
// Ba mức câu hỏi trong đề kiểm tra định kỳ: Mức 1 (nhận biết, nhắc lại), Mức 2 (kết nối, sắp xếp),
// Mức 3 (vận dụng giải quyết vấn đề). Quy đổi từ cấp độ L1–L5 của app: L1–L2 → M1, L3 → M2, L4–L5 → M3.
// Câu hỏi đều do EduChain Kids tự soạn/tự sinh (không chép SGK/SGV/VBT).

import { CONTENT } from '../content';
import type { ContentLesson, Level } from '../content/types';
import { generateOne, practiceIdFor } from '../practice';
import type { PracticeQuestion } from '../practice/kit';
import { makeRng } from '../practice/rng';
import type { AnswerKey, QuestionType, SubjectCode } from '../types';

export type Muc = 1 | 2 | 3;
export const MUCS: Muc[] = [1, 2, 3];
export const MUC_NAME: Record<Muc, string> = { 1: 'Mức 1 (Nhận biết)', 2: 'Mức 2 (Kết nối)', 3: 'Mức 3 (Vận dụng)' };
/** Mô tả 3 mức câu hỏi trong bài kiểm tra định kỳ (diễn đạt lại theo quy định đánh giá học sinh tiểu học, Thông tư 27/2020/TT-BGDĐT) */
export const MUC_DESC: Record<Muc, string> = {
  1: 'Nhận biết, nhắc lại hoặc mô tả nội dung đã học; áp dụng trực tiếp vào tình huống quen thuộc.',
  2: 'Kết nối, sắp xếp một số nội dung đã học để giải quyết vấn đề có nội dung tương tự.',
  3: 'Vận dụng nội dung đã học để giải quyết vấn đề mới hoặc đưa ra phản hồi hợp lí trong học tập, cuộc sống.',
};
export const mucOf = (l: Level): Muc => (l <= 2 ? 1 : l === 3 ? 2 : 3);

/** Câu trong đề (bản chụp nội dung để lưu và in, không phụ thuộc phiên bản code sau này) */
export type ExamQuestion = {
  key: string; // chữ ký để tránh trùng câu
  muc: Muc;
  type: QuestionType;
  prompt: string;
  options: string[];
  left?: string[];
  blanks?: string[];
  statements?: string[];
  answer: AnswerKey;
  explanation?: string;
  lessonTitle: string;
  /** mã yêu cầu cần đạt của câu (để lọc theo YCCĐ) */
  outcome?: string;
};

/** Một hàng của ma trận = một chủ đề (unit) gồm các bài đã chọn */
export type MatrixRow = { unitCode: string; unitTitle: string; lessonIds: string[]; counts: Record<Muc, number> };
/** exclude: mã yêu cầu cần đạt KHÔNG lấy câu (giáo viên bỏ chọn) */
export type Matrix = { rows: MatrixRow[]; points: Record<Muc, number>; exclude?: string[] };

export type BookLesson = Pick<ContentLesson, 'id' | 'title' | 'ref' | 'semester' | 'unit'>;

/** Bài theo sách (không gồm đề ôn) của một môn, một khối — đúng thứ tự trong sách */
export function bookLessons(subject: SubjectCode, grade: number): BookLesson[] {
  return CONTENT.filter((l) => l.subject === subject && l.grade === grade && l.kind !== 'review')
    .map((l) => ({ id: l.id, title: l.title, ref: l.ref, semester: l.semester, unit: l.unit }));
}

/** Câu in được lên giấy: bỏ câu có tranh vẽ (Word không hiển thị hình vẽ SVG của app) */
const printable = (q: PracticeQuestion) => !q.figure && !q.optionFigures;
const sigOf = (q: { prompt: string; options?: string[]; blanks?: string[]; statements?: string[] }) =>
  [q.prompt, (q.blanks ?? []).join('|'), (q.statements ?? []).join('|')].join('#');

function toExam(q: PracticeQuestion, lessonTitle: string): ExamQuestion {
  return {
    key: sigOf(q), muc: mucOf(q.level), type: q.type, prompt: q.prompt, options: q.options ?? [], left: q.left,
    blanks: q.blanks, statements: q.statements, answer: q.key, explanation: q.explanation, lessonTitle, outcome: q.outcome,
  };
}

const poolCache = new Map<string, ExamQuestion[]>();
/** Kho câu của một bài: câu soạn sẵn + câu sinh tự động (nhiều seed), đã bỏ trùng và câu có hình */
export function lessonPool(lessonId: string): ExamQuestion[] {
  const hit = poolCache.get(lessonId);
  if (hit) return hit;
  const lesson = CONTENT.find((l) => l.id === lessonId);
  if (!lesson) return [];
  const out: ExamQuestion[] = [];
  const seen = new Set<string>();
  const add = (q: PracticeQuestion | null) => {
    if (!q || !printable(q)) return;
    const k = sigOf(q);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(toExam(q, lesson.title));
  };
  for (const q of lesson.questions as PracticeQuestion[]) add(q);
  const gen = practiceIdFor(lessonId);
  if (gen) {
    for (const level of [1, 2, 3, 4, 5] as Level[]) {
      for (let s = 1; s <= 24; s++) add(generateOne(gen, (s * 7919 + level * 104729 + hashStr(lessonId)) >>> 0, level));
    }
  }
  poolCache.set(lessonId, out);
  return out;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Số câu có sẵn theo mức cho một nhóm bài */
export function available(lessonIds: string[], exclude: string[] = []): Record<Muc, number> {
  const c: Record<Muc, number> = { 1: 0, 2: 0, 3: 0 };
  const ex = new Set(exclude);
  for (const id of lessonIds) for (const q of lessonPool(id)) if (!q.outcome || !ex.has(q.outcome)) c[q.muc]++;
  return c;
}

/** Yêu cầu cần đạt có câu trong phạm vi bài đã chọn (mã + số câu) — để giáo viên chọn / bỏ */
export function outcomesIn(lessonIds: string[]): { code: string; n: number }[] {
  const m = new Map<string, number>();
  for (const id of lessonIds) for (const q of lessonPool(id)) if (q.outcome) m.set(q.outcome, (m.get(q.outcome) ?? 0) + 1);
  return [...m.entries()].map(([code, n]) => ({ code, n }));
}

/** Ma trận mặc định: tổng `total` câu, tỉ lệ mức (mặc định 50/30/20), chia theo số bài của từng chủ đề */
export function defaultMatrix(lessons: BookLesson[], total = 10, ratio: [number, number] = [0.5, 0.3]): Matrix {
  const groups = new Map<string, MatrixRow>();
  for (const l of lessons) {
    const g = groups.get(l.unit.code) ?? { unitCode: l.unit.code, unitTitle: l.unit.title, lessonIds: [], counts: { 1: 0, 2: 0, 3: 0 } };
    g.lessonIds.push(l.id);
    groups.set(l.unit.code, g);
  }
  const rows = [...groups.values()];
  const target: Record<Muc, number> = { 1: Math.round(total * ratio[0]), 2: Math.round(total * ratio[1]), 3: 0 };
  target[3] = total - target[1] - target[2];
  const avail = rows.map((r) => available(r.lessonIds));
  const cap = avail.map((a) => a[1] + a[2] + a[3]);
  // 1) Số câu mỗi chủ đề: theo tỉ lệ số bài (phần dư lớn nhất), mỗi chủ đề ít nhất 1 câu nếu đủ câu
  const nLessons = rows.reduce((a, r) => a + r.lessonIds.length, 0) || 1;
  const share = rows.map((r) => (total * r.lessonIds.length) / nLessons);
  const unit = share.map((x, i) => Math.min(Math.floor(x), cap[i]));
  if (total >= rows.length) unit.forEach((n, i) => { if (n === 0 && cap[i] > 0) unit[i] = 1; });
  let diff = total - unit.reduce((a, b) => a + b, 0);
  const byFrac = rows.map((_, i) => i).sort((a, b) => (share[b] - Math.floor(share[b])) - (share[a] - Math.floor(share[a])) || share[b] - share[a]);
  for (let guard = 0; diff !== 0 && guard < 500; guard++) {
    let moved = false;
    if (diff > 0) for (const i of byFrac) { if (diff > 0 && unit[i] < cap[i]) { unit[i]++; diff--; moved = true; } }
    else for (const i of [...byFrac].reverse()) { if (diff < 0 && unit[i] > 1) { unit[i]--; diff++; moved = true; } }
    if (!moved) break;
  }
  // 2) Chia câu của từng chủ đề vào 3 mức sao cho tổng mỗi mức đúng tỉ lệ (lần lượt từng câu, ưu tiên chủ đề còn nhiều chỗ)
  const left = [...unit];
  for (const m of MUCS) {
    let need = target[m];
    for (let guard = 0; need > 0 && guard < 500; guard++) {
      const order = rows.map((_, i) => i).filter((i) => left[i] > 0 && rows[i].counts[m] < avail[i][m]).sort((a, b) => left[b] - left[a] || rows[a].counts[m] - rows[b].counts[m]);
      if (!order.length) break;
      const i = order[0];
      rows[i].counts[m]++; left[i]--; need--;
    }
    // chủ đề còn chỗ không có câu mức này: lấy ở chủ đề khác còn câu mức này
    for (let guard = 0; need > 0 && guard < 500; guard++) {
      const i = rows.map((_, k) => k).filter((k) => rows[k].counts[m] < avail[k][m]).sort((a, b) => rows[a].counts[m] - rows[b].counts[m])[0];
      if (i === undefined) break;
      rows[i].counts[m]++; need--;
    }
  }
  return { rows, points: { 1: 1, 2: 1, 3: 1 } };
}

export function totals(m: Matrix) {
  const byMuc: Record<Muc, number> = { 1: 0, 2: 0, 3: 0 };
  for (const r of m.rows) for (const k of MUCS) byMuc[k] += r.counts[k];
  const questions = byMuc[1] + byMuc[2] + byMuc[3];
  const score = MUCS.reduce((a, k) => a + byMuc[k] * m.points[k], 0);
  return { byMuc, questions, score: Math.round(score * 100) / 100 };
}

export type PaperSlot = { row: number; muc: Muc; q: ExamQuestion };
export type Paper = { code: string; slots: PaperSlot[]; missing: { row: number; muc: Muc; need: number; got: number }[] };

/**
 * Chọn câu theo ma trận. `avoid`: chữ ký câu không được dùng (ví dụ câu của đề A khi tạo đề B).
 * Trắc nghiệm trước, tự luận sau; trong mỗi phần giữ thứ tự mức tăng dần.
 */
export function buildPaper(m: Matrix, seed: number, code: string, avoid: Set<string> = new Set()): Paper {
  const r = makeRng(seed >>> 0);
  const used = new Set(avoid);
  const slots: PaperSlot[] = [];
  const missing: Paper['missing'] = [];
  const partCount = { 1: 0, 2: 0 };
  const ex = new Set(m.exclude ?? []);
  m.rows.forEach((row, ri) => {
    for (const muc of MUCS) {
      const need = row.counts[muc];
      if (!need) continue;
      const pool = row.lessonIds.flatMap((id) => lessonPool(id)).filter((q) => q.muc === muc && !used.has(q.key) && !(q.outcome && ex.has(q.outcome)));
      // ưu tiên trải đều các bài trong chủ đề
      const byLesson = new Map<string, ExamQuestion[]>();
      for (const q of pool) byLesson.set(q.lessonTitle, [...(byLesson.get(q.lessonTitle) ?? []), q]);
      const buckets = r.shuffle([...byLesson.values()].map((b) => r.shuffle([...b])));
      let got = 0;
      for (let round = 0; got < need && buckets.some((b) => b.length); round++) {
        for (const b of buckets) {
          if (got >= need) break;
          // giữ cân bằng trắc nghiệm / tự luận: ưu tiên câu thuộc phần đang ít hơn
          const want = partCount[1] <= partCount[2] ? 1 : 2;
          const idx = b.findIndex((x) => partOf(x.type) === want && !used.has(x.key));
          const q = idx >= 0 ? b.splice(idx, 1)[0] : b.shift();
          if (!q || used.has(q.key)) continue;
          partCount[partOf(q.type) as 1 | 2]++;
          used.add(q.key);
          slots.push({ row: ri, muc, q: prepare(q, r) });
          got++;
        }
      }
      if (got < need) missing.push({ row: ri, muc, need, got });
    }
  });
  slots.sort((a, b) => partOf(a.q.type) - partOf(b.q.type) || a.muc - b.muc);
  return { code, slots, missing };
}

/** Đổi một câu trong đề bằng câu khác cùng chủ đề, cùng mức */
export function replaceSlot(m: Matrix, paper: Paper, index: number, seed: number, avoid: Set<string>): Paper {
  const slot = paper.slots[index];
  const row = m.rows[slot.row];
  if (!row) return paper;
  const used = new Set([...avoid, ...paper.slots.map((s) => s.q.key)]);
  const ex = new Set(m.exclude ?? []);
  const pool = row.lessonIds.flatMap((id) => lessonPool(id)).filter((q) => q.muc === slot.muc && !used.has(q.key) && !(q.outcome && ex.has(q.outcome)));
  if (!pool.length) return paper;
  const rr = makeRng(seed >>> 0);
  const q = prepare(rr.pick(pool), rr);
  const slots = paper.slots.slice();
  slots[index] = { ...slot, q };
  return { ...paper, slots };
}

/**
 * Đề trộn: cùng bộ câu với đề gốc, đảo thứ tự câu trong từng phần (trắc nghiệm / tự luận)
 * và đảo phương án lựa chọn. Đáp án tự đúng vì so theo nội dung phương án.
 */
export function shufflePaper(base: Paper, seed: number, code: string): Paper {
  const r = makeRng(seed >>> 0);
  const p1 = r.shuffle(base.slots.filter((s) => partOf(s.q.type) === 1));
  const p2 = r.shuffle(base.slots.filter((s) => partOf(s.q.type) === 2));
  return { code, missing: [], slots: [...p1, ...p2].map((s) => ({ ...s, q: prepare(s.q, r) })) };
}

/** Đảo thứ tự lựa chọn / vế nối / mục sắp xếp để in (đáp án không đổi vì so theo nội dung) */
function prepare(q: ExamQuestion, r: ReturnType<typeof makeRng>): ExamQuestion {
  if (q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'matching' || q.type === 'ordering') {
    let opts = r.shuffle(q.options);
    // sắp xếp: không để trùng đúng thứ tự đáp án
    if (q.type === 'ordering' && opts.length > 1 && opts.every((o, i) => o === q.options[i])) opts = [...opts.slice(1), opts[0]];
    return { ...q, options: opts };
  }
  return q;
}

/** 1 = phần trắc nghiệm (khoanh/đánh dấu), 2 = phần tự luận (điền, nối, sắp xếp) */
export const partOf = (t: QuestionType) => (t === 'single_choice' || t === 'multiple_choice' || t === 'true_false' || t === 'true_false_table' ? 1 : 2);

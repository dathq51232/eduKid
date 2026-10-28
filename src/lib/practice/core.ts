// Luyện tập ngẫu nhiên: mỗi bài theo sách có một bài "Luyện tập thêm" sinh đề mới theo seed.
//   - Mã bài:   lt-<mã bài sách>               ví dụ lt-toan1-kntt-b07
//   - Mã câu:   lt-<mã bài sách>~<seed>~<thứ tự>  — chấm lại bằng cách sinh lại đúng đề đó từ seed
// Mỗi đề 10 câu: 2 câu mỗi cấp độ L1 → L5, không trùng nhau trong đề.
//
// Lưu ý bảo mật: đề luyện tập sinh và chấm trên trình duyệt (đáp án nằm trong mã nguồn), chỉ dùng để tự luyện.
// Khi cần chấm "thật" (thi, chứng nhận), chạy cùng bộ sinh này ở server (route handler) và chỉ gửi đề, không gửi đáp án.
// Phần lõi: kho bộ sinh câu (nạp theo khối — xem g1.ts…g5.ts, index.ts nạp đủ 5 khối) và các hàm sinh / chấm đề.

import type { ContentLesson, Level, Scope } from '../content/types';
import { defaultTimeLimit } from '../levels';
import type { Lesson } from '../types';
import type { PracticeQuestion } from './kit';
import { makeRng, type Rng } from './rng';

export type { PracticeQuestion } from './kit';
export { newSeed } from './rng';

export const PRACTICE_PREFIX = 'lt-';
export const PER_LEVEL = 2;
const LEVELS: Level[] = [1, 2, 3, 4, 5];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplate = (r: Rng, ctx: any, l: Level) => PracticeQuestion | null;
export type Entry = {
  id: string;
  bookLessonId: string;
  book: ContentLesson;
  makeCtx: () => unknown;
  pool: Record<Level, AnyTemplate[]>;
  lesson: Lesson;
};

export function entry(book: ContentLesson | undefined, makeCtx: () => unknown, pool: Record<Level, AnyTemplate[]>, no: number): Entry {
  if (!book) throw new Error(`Thiếu bài sách cho bộ sinh câu ${no}`);
  const id = PRACTICE_PREFIX + book.id;
  let cached: unknown;
  return {
    id,
    bookLessonId: book.id,
    book,
    makeCtx: () => (cached ??= makeCtx()),
    pool,
    lesson: {
      id,
      subject: book.subject,
      grade: book.grade,
      title: `Luyện tập thêm · ${book.title}`,
      description: 'Đề sinh ngẫu nhiên: mỗi lần làm là một đề mới, 10 câu từ dễ (L1) đến khó (L5).',
      topicCode: book.topicCode,
      unit: book.unit,
      book: book.book,
      kind: 'book',
      sortOrder: 1000 + no,
    },
  };
}

export type AnyPool = Record<Level, AnyTemplate[]>;
/** Gắn sẵn phạm vi cho từng mẫu, để trộn mẫu học kì 1 (phạm vi 10) với mẫu học kì 2 (phạm vi 100) trong một bài */
export const bind = (pool: AnyPool, ctx: unknown): AnyPool =>
  ({ 1: pool[1].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)), 2: pool[2].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)),
    3: pool[3].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)), 4: pool[4].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)),
    5: pool[5].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)) });
export const mergeAny = (...pools: AnyPool[]): AnyPool =>
  ({ 1: pools.flatMap((p) => p[1]), 2: pools.flatMap((p) => p[2]), 3: pools.flatMap((p) => p[3]), 4: pools.flatMap((p) => p[4]), 5: pools.flatMap((p) => p[5]) });

/** Kho bộ sinh câu đang có (index.ts nạp đủ 5 khối; trang học của học sinh nạp từng khối qua src/lib/grade-loader.ts) */
const ENTRIES: Entry[] = [];
const loadedGrades = new Set<number>();
export function registerEntries(grade: number, list: Entry[]) {
  if (loadedGrades.has(grade)) return;
  loadedGrades.add(grade);
  ENTRIES.push(...list);
}

export const isPracticeId = (id: string) => id.startsWith(PRACTICE_PREFIX);
export const practiceIdFor = (bookLessonId: string) => (ENTRIES.some((e) => e.bookLessonId === bookLessonId) ? PRACTICE_PREFIX + bookLessonId : null);
export const practiceLesson = (id: string) => ENTRIES.find((e) => e.id === id)?.lesson;
export const practiceLessons = () => ENTRIES.map((e) => e.lesson);
/** Phạm vi kiến thức của bộ sinh câu (= phạm vi của bài sách tương ứng) */
export const practiceScope = (id: string): Scope | undefined => ENTRIES.find((e) => e.id === id)?.book.scope;
export const practiceSubject = (id: string) => ENTRIES.find((e) => e.id === id)?.book.subject;

export const questionIdOf = (lessonId: string, seed: number, index: number) => `${lessonId}~${seed}~${index}`;
/** Mã câu thay thế (nút "Đổi câu"): một câu cấp độ `level` sinh từ seed riêng */
export const swapIdOf = (lessonId: string, seed: number, level: Level) => `${lessonId}~${seed}~x${level}`;

export type ParsedId = { lessonId: string; seed: number; index: number; swapLevel?: undefined } | { lessonId: string; seed: number; swapLevel: Level; index?: undefined };
export function parseQuestionId(qid: string): ParsedId | null {
  const m = qid.match(/^(lt-[a-z0-9-]+)~(\d+)~(x?)(\d+)$/);
  if (!m) return null;
  return m[3] ? { lessonId: m[1], seed: Number(m[2]), swapLevel: Number(m[4]) as Level } : { lessonId: m[1], seed: Number(m[2]), index: Number(m[4]) };
}

/** Sinh lại đúng câu theo mã (dùng khi chấm) */
export function questionById(qid: string): GeneratedQuestion | null {
  const p = parseQuestionId(qid);
  if (!p) return null;
  if (p.swapLevel) return generateOne(p.lessonId, p.seed, p.swapLevel);
  return generatePractice(p.lessonId, p.seed)[p.index] ?? null;
}

/** Chữ ký để phát hiện câu trùng trong một đề */
type SigInput = Pick<PracticeQuestion, 'type' | 'prompt' | 'blanks' | 'statements' | 'options' | 'figure' | 'optionFigures'>;
export function signature(q: SigInput): string {
  return JSON.stringify([q.type, q.prompt, q.blanks ?? null, q.statements ?? null, [...q.options].sort(), q.figure ?? null, q.optionFigures ?? null]);
}

export type GeneratedQuestion = PracticeQuestion & { id: string; timeLimit: number };

const timeOf = (q: PracticeQuestion) =>
  q.timeLimit ?? defaultTimeLimit(q.type, q.level, q.prompt + (q.blanks ?? []).join(' ') + (q.statements ?? []).join(' '));

/** Một câu ngẫu nhiên cấp độ `level` của bài luyện tập (cùng seed luôn ra cùng câu). */
export function generateOne(lessonId: string, seed: number, level: Level): GeneratedQuestion | null {
  const entry = ENTRIES.find((e) => e.id === lessonId);
  if (!entry) return null;
  const r = makeRng(seed);
  const ctx = entry.makeCtx();
  const templates = entry.pool[level];
  for (let i = 0; i < 60; i++) {
    const q = r.pick(templates)(r, ctx, level);
    if (q) return { ...q, id: swapIdOf(lessonId, seed, level), timeLimit: timeOf(q) };
  }
  return null;
}

/** Sinh đề cho bài luyện tập; cùng (lessonId, seed) luôn ra cùng một đề. */
export function generatePractice(lessonId: string, seed: number): GeneratedQuestion[] {
  const entry = ENTRIES.find((e) => e.id === lessonId);
  if (!entry) return [];
  const r = makeRng(seed);
  const ctx = entry.makeCtx();
  const out: PracticeQuestion[] = [];
  const seen = new Set<string>();
  for (const lv of LEVELS) {
    const templates = entry.pool[lv];
    // Ưu tiên các mẫu khác nhau trong cùng cấp độ, sau đó mới lặp lại mẫu
    const order = [...r.shuffle(templates), ...Array.from({ length: 40 }, () => r.pick(templates))];
    let got = 0;
    for (const t of order) {
      if (got >= PER_LEVEL) break;
      const q = t(r, ctx, lv);
      if (!q) continue;
      const sig = signature(q);
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(q);
      got++;
    }
  }
  return out.map((q, i) => ({
    ...q,
    id: questionIdOf(lessonId, seed, i),
    timeLimit: timeOf(q),
  }));
}

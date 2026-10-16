// Luyện tập ngẫu nhiên: mỗi bài theo sách có một bài "Luyện tập thêm" sinh đề mới theo seed.
//   - Mã bài:   lt-<mã bài sách>               ví dụ lt-toan1-kntt-b07
//   - Mã câu:   lt-<mã bài sách>~<seed>~<thứ tự>  — chấm lại bằng cách sinh lại đúng đề đó từ seed
// Mỗi đề 10 câu: 2 câu mỗi cấp độ L1 → L5, không trùng nhau trong đề.
//
// Lưu ý bảo mật: đề luyện tập sinh và chấm trên trình duyệt (đáp án nằm trong mã nguồn), chỉ dùng để tự luyện.
// Khi cần chấm "thật" (thi, chứng nhận), chạy cùng bộ sinh này ở server (route handler) và chỉ gửi đề, không gửi đáp án.

import type { ContentLesson, Level, Scope } from '../content/types';
import { TOAN1_HK1 } from '../content/toan1-hk1';
import { TOAN1_HK2 } from '../content/toan1-hk2';
import { TV1_HK1 } from '../content/tv1-hk1';
import { TV1_HK2 } from '../content/tv1-hk2';
import { TA1_HK1 } from '../content/ta1-hk1';
import { TA1_HK2 } from '../content/ta1-hk2';
import { defaultTimeLimit } from '../levels';
import type { Lesson } from '../types';
import type { PracticeQuestion } from './kit';
import { makeRng, type Rng } from './rng';
import { TOAN1_PRACTICE } from './toan1';
import { POOLS2, TOAN1_HK2_PRACTICE, type Ctx2, type Pool2 } from './toan1b';
import { TV1_POOL, TV_WEEKS, tvContext } from './tv1';
import { TV2_POOL, tv2Context } from './tv2';
import { TA1_POOL, TA2_POOL, taContext } from './ta1';
import { TOAN2_HK1, TOAN2_HK2 } from '../content/toan2';
import { T2_LESSONS, t2Id } from '../content/toan2-plan';
import { t2Context, t2Pool } from './toan2';
import { TV2_HK1, TV2_HK2, TV2_WEEKS, tv2Ctx } from '../content/tv2';
import { TV2G_POOL } from './tv2g';
import { TA2_HK1, TA2_HK2, TA2_SPECS, ta2SpecCtx } from '../content/ta2';
import { TA2G_POOL } from './ta2g';
import { TOAN3_HK1, TOAN3_HK2 } from '../content/toan3';
import { T3_LESSONS, t3Id } from '../content/toan3-plan';
import { t3Context, t3Pool } from './toan3';
import { TV3_HK1, TV3_HK2, TV3_WEEKS, tv3Ctx, tv3WeekPool } from '../content/tv3';
import { TA3_HK1, TA3_HK2, TA3_SPECS, ta3SpecCtx } from '../content/ta3';
import { TA3G_POOL } from './ta3g';
import { TOAN4_HK1, TOAN4_HK2 } from '../content/toan4';
import { T4_LESSONS, t4Id } from '../content/toan4-plan';
import { t4Context, t4Pool } from './toan4';
import { TV4_HK1, TV4_HK2, TV4_WEEKS, tv4Ctx, tv4WeekPool } from '../content/tv4';
import { TA4_HK1, TA4_HK2, TA4_SPECS, ta4SpecCtx } from '../content/ta4';
import { TA4G_POOL } from './ta4g';
import { TOAN5_HK1, TOAN5_HK2 } from '../content/toan5';
import { T5_LESSONS, t5Id } from '../content/toan5-plan';
import { t5Context, t5Pool } from './toan5';
import { TV5_HK1, TV5_HK2, TV5_WEEKS, tv5Ctx, tv5WeekPool } from '../content/tv5';
import { TA5_HK1, TA5_HK2, TA5_SPECS, ta5SpecCtx } from '../content/ta5';
import { TA5G_POOL } from './ta5g';

export type { PracticeQuestion } from './kit';
export { newSeed } from './rng';

export const PRACTICE_PREFIX = 'lt-';
export const PER_LEVEL = 2;
const LEVELS: Level[] = [1, 2, 3, 4, 5];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTemplate = (r: Rng, ctx: any, l: Level) => PracticeQuestion | null;
type Entry = {
  id: string;
  bookLessonId: string;
  book: ContentLesson;
  makeCtx: () => unknown;
  pool: Record<Level, AnyTemplate[]>;
  lesson: Lesson;
};

function entry(book: ContentLesson | undefined, makeCtx: () => unknown, pool: Record<Level, AnyTemplate[]>, no: number): Entry {
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

type AnyPool = Record<Level, AnyTemplate[]>;
/** Gắn sẵn phạm vi cho từng mẫu, để trộn mẫu học kì 1 (phạm vi 10) với mẫu học kì 2 (phạm vi 100) trong một bài */
const bind = (pool: AnyPool, ctx: unknown): AnyPool =>
  ({ 1: pool[1].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)), 2: pool[2].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)),
    3: pool[3].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)), 4: pool[4].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)),
    5: pool[5].map((t) => (r: Rng, _c: unknown, l: Level) => t(r, ctx, l)) });
const mergeAny = (...pools: AnyPool[]): AnyPool =>
  ({ 1: pools.flatMap((p) => p[1]), 2: pools.flatMap((p) => p[2]), 3: pools.flatMap((p) => p[3]), 4: pools.flatMap((p) => p[4]), 5: pools.flatMap((p) => p[5]) });

const HK1_CTX = { max: 10, focusMin: 1, ops: ['+', '-'] as const, lesson: 20 };
const hk1Pool = (no: number) => TOAN1_PRACTICE.find((x) => x.no === no)!.pool as unknown as AnyPool;
const ctx2 = (lesson: number): Ctx2 => ({ lesson, max: 100, pt2: 'all' });
const p2 = (p: Pool2) => p as unknown as AnyPool;
const bookHk2 = (no: number) => TOAN1_HK2.find((l) => l.id === `toan1-kntt-b${no}`);

const ENTRIES: Entry[] = [
  // Toán 1 — Bài 1–20
  ...TOAN1_PRACTICE.map((spec) =>
    entry(TOAN1_HK1.find((l) => l.id === `toan1-kntt-b${String(spec.no).padStart(2, '0')}`), () => ({ ...spec.ctx, lesson: spec.no }), spec.pool, spec.no),
  ),
  // Toán 1 — Bài 21–41 (học kì 2)
  ...TOAN1_HK2_PRACTICE.map((spec) => entry(bookHk2(spec.no), () => ({ ...spec.ctx, lesson: spec.no }), p2(spec.pool), spec.no)),
  // Bài 38: ôn số và phép tính trong phạm vi 10 → dạng bài học kì 1
  entry(bookHk2(38), () => HK1_CTX, hk1Pool(20), 38),
  // Bài 40: ôn hình học (học kì 1) + đo độ dài, giờ, lịch (học kì 2)
  entry(bookHk2(40), () => ctx2(40), mergeAny(bind(hk1Pool(19), HK1_CTX), bind(p2(POOLS2.length), ctx2(40)), bind(p2(POOLS2.time), ctx2(40))), 40),
  // Bài 41: ôn tập chung cả năm
  entry(bookHk2(41), () => ctx2(41), mergeAny(bind(hk1Pool(20), HK1_CTX), ...[POOLS2.numbers, POOLS2.calc, POOLS2.length, POOLS2.time].map((p) => bind(p2(p), ctx2(41)))), 41),
  // Tiếng Việt 1 — Tuần 1–17
  ...TV_WEEKS.map((_, i) => entry(TV1_HK1.find((l) => l.id === `tv1-kntt-t${String(i + 1).padStart(2, '0')}`), () => tvContext(i + 1), TV1_POOL, 100 + i + 1)),
  // Tiếng Việt 1 — Học kì 2: Chủ đề 1–8 và Ôn tập cuối năm
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => entry(TV1_HK2.find((l) => l.id === `tv1-kntt-c0${n}`), () => tv2Context([n as 1]), TV2_POOL as unknown as AnyPool, 120 + n)),
  entry(TV1_HK2.find((l) => l.id === 'tv1-kntt-c09'), () => tv2Context([1, 2, 3, 4, 5, 6, 7, 8]), TV2_POOL as unknown as AnyPool, 129),
  // Tiếng Anh 1 — Unit 1–8, Review 1–2
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((u) => entry(TA1_HK1.find((l) => l.id === `ta1-gs-u0${u}`), () => taContext(u), TA1_POOL, 200 + u)),
  entry(TA1_HK1.find((l) => l.id === 'ta1-gs-review1'), () => taContext(4), TA1_POOL, 209),
  entry(TA1_HK1.find((l) => l.id === 'ta1-gs-review2'), () => taContext(8), TA1_POOL, 210),
  ...[9, 10, 11, 12].map((u) => entry(TA1_HK2.find((l) => l.id === `ta1-gs-u${String(u).padStart(2, '0')}`), () => taContext(u), TA2_POOL, 202 + u)),
  entry(TA1_HK2.find((l) => l.id === 'ta1-gs-review3'), () => taContext(12), TA2_POOL, 215),
  ...[13, 14, 15, 16].map((u) => entry(TA1_HK2.find((l) => l.id === `ta1-gs-u${u}`), () => taContext(u), TA2_POOL, 203 + u)),
  entry(TA1_HK2.find((l) => l.id === 'ta1-gs-review4'), () => taContext(16), TA2_POOL, 220),
  // ---------------- Lớp 2 ----------------
  // Toán 2 — Bài 1–75
  ...T2_LESSONS.map((p) => entry([...TOAN2_HK1, ...TOAN2_HK2].find((l) => l.id === t2Id(p.no)), () => t2Context(p), t2Pool(p.topics) as unknown as AnyPool, 2000 + p.no)),
  // Tiếng Việt 2 — Tuần 1–35
  ...TV2_WEEKS.map((w) => entry([...TV2_HK1, ...TV2_HK2].find((l) => l.id === `tv2-kntt-t${String(w.week).padStart(2, '0')}`), () => tv2Ctx(w.week), TV2G_POOL as unknown as AnyPool, 2100 + w.week)),
  // Tiếng Anh 2 — Unit 1–16, Fun time 1–4, Review 1–4
  ...TA2_SPECS.map((sp) => entry([...TA2_HK1, ...TA2_HK2].find((l) => l.id === sp.id), () => ta2SpecCtx(sp), TA2G_POOL as unknown as AnyPool, sp.sortNo)),
  // ---------------- Lớp 3 ----------------
  ...T3_LESSONS.map((p) => entry([...TOAN3_HK1, ...TOAN3_HK2].find((l) => l.id === t3Id(p.no)), () => t3Context(p), t3Pool(p.topics) as unknown as AnyPool, 3000 + p.no)),
  ...TV3_WEEKS.map((w) => entry([...TV3_HK1, ...TV3_HK2].find((l) => l.id === `tv3-kntt-t${String(w.week).padStart(2, '0')}`), () => tv3Ctx(w.week), tv3WeekPool(w.week) as unknown as AnyPool, 3100 + w.week)),
  ...TA3_SPECS.map((sp) => entry([...TA3_HK1, ...TA3_HK2].find((l) => l.id === sp.id), () => ta3SpecCtx(sp), TA3G_POOL as unknown as AnyPool, sp.sortNo)),
  // ---------------- Lớp 4 ----------------
  ...T4_LESSONS.map((p) => entry([...TOAN4_HK1, ...TOAN4_HK2].find((l) => l.id === t4Id(p.no)), () => t4Context(p), t4Pool(p.topics) as unknown as AnyPool, 4000 + p.no)),
  ...TV4_WEEKS.map((w) => entry([...TV4_HK1, ...TV4_HK2].find((l) => l.id === `tv4-kntt-t${String(w.week).padStart(2, '0')}`), () => tv4Ctx(w.week), tv4WeekPool(w.week) as unknown as AnyPool, 4100 + w.week)),
  ...TA4_SPECS.map((sp) => entry([...TA4_HK1, ...TA4_HK2].find((l) => l.id === sp.id), () => ta4SpecCtx(sp), TA4G_POOL as unknown as AnyPool, sp.sortNo)),
  // ---------------- Lớp 5 ----------------
  ...T5_LESSONS.map((p) => entry([...TOAN5_HK1, ...TOAN5_HK2].find((l) => l.id === t5Id(p.no)), () => t5Context(p), t5Pool(p.topics) as unknown as AnyPool, 5000 + p.no)),
  ...TV5_WEEKS.map((w) => entry([...TV5_HK1, ...TV5_HK2].find((l) => l.id === `tv5-kntt-t${String(w.week).padStart(2, '0')}`), () => tv5Ctx(w.week), tv5WeekPool(w.week) as unknown as AnyPool, 5100 + w.week)),
  ...TA5_SPECS.map((sp) => entry([...TA5_HK1, ...TA5_HK2].find((l) => l.id === sp.id), () => ta5SpecCtx(sp), TA5G_POOL as unknown as AnyPool, sp.sortNo)),
];

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

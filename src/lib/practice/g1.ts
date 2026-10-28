// Bộ sinh câu luyện tập lớp 1 (tách riêng để trang học chỉ tải đúng khối của em).
import { entry, bind, mergeAny, type AnyPool, type Entry } from './core';
import { TOAN1_HK1 } from '../content/toan1-hk1';
import { TOAN1_HK2 } from '../content/toan1-hk2';
import { TV1_HK1 } from '../content/tv1-hk1';
import { TV1_HK2 } from '../content/tv1-hk2';
import { TA1_HK1 } from '../content/ta1-hk1';
import { TA1_HK2 } from '../content/ta1-hk2';
import { TOAN1_PRACTICE } from './toan1';
import { POOLS2, TOAN1_HK2_PRACTICE, type Ctx2, type Pool2 } from './toan1b';
import { TV1_POOL, TV_WEEKS, tvContext } from './tv1';
import { TV2_POOL, tv2Context } from './tv2';
import { TA1_POOL, TA2_POOL, taContext } from './ta1';

const HK1_CTX = { max: 10, focusMin: 1, ops: ['+', '-'] as const, lesson: 20 };
const hk1Pool = (no: number) => TOAN1_PRACTICE.find((x) => x.no === no)!.pool as unknown as AnyPool;
const ctx2 = (lesson: number): Ctx2 => ({ lesson, max: 100, pt2: 'all' });
const p2 = (p: Pool2) => p as unknown as AnyPool;
const bookHk2 = (no: number) => TOAN1_HK2.find((l) => l.id === `toan1-kntt-b${no}`);

export const ENTRIES_G1: Entry[] = [
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
];

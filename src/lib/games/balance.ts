// Game F — Cân thăng bằng: tìm số còn thiếu để hai đĩa cân bằng nhau (tiền đại số, sát chương trình Toán).
// Logic thuần, đề tự sinh theo seed (không chép SGK):
//  L1: quả cân trong phạm vi 10          L2: phạm vi 20, 2–3 quả mỗi đĩa
//  L3: một hình đã biết cân nặng (×)     L4: hai bước (hình vuông = 2–3 hình tròn, hình tròn = ?)
//  L5: ba bước, có chia (3 tam giác nặng 12 → 1 tam giác nặng ?), phạm vi 100
// Mỗi câu: một chiếc cân chính có đúng một ô "?" + 0–2 chiếc cân "gợi ý" đã cân bằng.

import type { GameLevel } from './catalog';

export type BShape = 'circle' | 'square' | 'triangle';
export const B_SHAPES: BShape[] = ['circle', 'square', 'triangle'];
export const B_SHAPE_COLOR = { circle: 'red', square: 'blue', triangle: 'yellow' } as const;
export const B_SHAPE_NAME: Record<BShape, string> = { circle: 'hình tròn', square: 'hình vuông', triangle: 'hình tam giác' };

export type BItem = { kind: 'w'; v: number } | { kind: 's'; s: BShape } | { kind: 'q' };
export type Scale = { left: BItem[]; right: BItem[] };
export type BalanceQ = {
  id: string;
  level: GameLevel;
  facts: Scale[];
  main: Scale;
  values: Partial<Record<BShape, number>>;
  answer: number;
  options: number[];
  explain: string;
};
export const BALANCE_ROUND = 6;
export const OPTIONS_BY_LEVEL: Record<GameLevel, number> = { 1: 3, 2: 4, 3: 4, 4: 4, 5: 4 };
export const MAX_BY_LEVEL: Record<GameLevel, number> = { 1: 10, 2: 20, 3: 20, 4: 40, 5: 100 };

type Rand = () => number;
function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: Rand, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const W = (v: number): BItem => ({ kind: 'w', v });
const S = (s: BShape): BItem => ({ kind: 's', s });
const Q: BItem = { kind: 'q' };
const rep = <T,>(x: T, k: number): T[] => Array.from({ length: k }, () => x);

/** Cân nặng một đĩa (ô "?" lấy giá trị `q`) */
export function panWeight(items: BItem[], values: Partial<Record<BShape, number>>, q: number): number {
  return items.reduce((t, it) => t + (it.kind === 'w' ? it.v : it.kind === 'q' ? q : values[it.s] ?? NaN), 0);
}
/** -1: đĩa trái nặng hơn (lệch trái), 0: cân bằng, 1: đĩa phải nặng hơn */
export function tilt(sc: Scale, values: Partial<Record<BShape, number>>, q = 0): -1 | 0 | 1 {
  const d = panWeight(sc.left, values, q) - panWeight(sc.right, values, q);
  return d > 0 ? -1 : d < 0 ? 1 : 0;
}
/** Ô "?" nằm ở đĩa nào */
export const qSide = (sc: Scale): 'left' | 'right' => (sc.left.some((i) => i.kind === 'q') ? 'left' : 'right');

/** Ngẫu nhiên đổi hai đĩa cho nhau để "?" không luôn nằm một bên */
const maybeSwap = (r: Rand, sc: Scale): Scale => (r() < 0.5 ? sc : { left: sc.right, right: sc.left });

/** Tách tổng `total` thành `k` quả cân dương */
function split(r: Rand, total: number, k: number): number[] {
  if (k <= 1) return [total];
  const first = int(r, 1, total - (k - 1));
  return [first, ...split(r, total - first, k - 1)];
}
const plus = (xs: number[]) => xs.join(' + ');

type Made = Omit<BalanceQ, 'id' | 'level' | 'options'> & { trap: number[] };

function makeL12(r: Rand, max: number, level: 1 | 2): Made {
  for (;;) {
    const total = int(r, level === 1 ? 4 : 11, max);
    const knownCount = level === 1 ? int(r, 1, 2) : int(r, 2, 3);
    const known = split(r, total, knownCount);
    const otherCount = level === 1 ? 1 : int(r, 1, 2);
    const otherSum = int(r, otherCount, total - 1);
    const other = split(r, otherSum, otherCount);
    const answer = total - otherSum;
    if (answer < 1) continue;
    const main = { left: known.map(W), right: [...other.map(W), Q] };
    const explain = `Đĩa không có dấu ? nặng ${knownCount > 1 ? `${plus(known)} = ` : ''}${total}. Đĩa có dấu ? đã có ${plus(other)}${otherCount > 1 ? ` = ${otherSum}` : ''}, nên cần thêm ${total} − ${otherSum} = ${answer}.`;
    return { facts: [], main: maybeSwap(r, main), values: {}, answer, explain, trap: [total, otherSum] };
  }
}

function makeL3(r: Rand): Made {
  for (;;) {
    const s = B_SHAPES[int(r, 0, 2)];
    const v = int(r, 2, 6);
    const k = int(r, 2, 3);
    const fact: Scale = { left: [S(s)], right: [W(v)] };
    const name = B_SHAPE_NAME[s];
    if (r() < 0.5) {
      const a = int(r, 0, 5);
      const answer = k * v + a;
      if (answer > 20) continue;
      const main = { left: [...rep(S(s), k), ...(a ? [W(a)] : [])], right: [Q] };
      return {
        facts: [fact], main: maybeSwap(r, main), values: { [s]: v }, answer, trap: [k + a, v + a],
        explain: `Mỗi ${name} nặng ${v}. ${k} ${name} nặng ${v} × ${k} = ${k * v}${a ? `, thêm quả cân ${a} là ${k * v + a}` : ''}. Vậy ? = ${answer}.`,
      };
    }
    const b = int(r, 1, 6);
    const answer = k * v - b;
    if (answer < 1 || k * v > 20) continue;
    const main = { left: rep(S(s), k), right: [W(b), Q] };
    return {
      facts: [fact], main: maybeSwap(r, main), values: { [s]: v }, answer, trap: [k * v + b, k * v],
      explain: `Mỗi ${name} nặng ${v}, nên ${k} ${name} nặng ${v} × ${k} = ${k * v}. Đĩa kia đã có ${b}, cần thêm ${k * v} − ${b} = ${answer}.`,
    };
  }
}

function makeL4(r: Rand): Made {
  for (;;) {
    const v = int(r, 2, 6);
    const k = int(r, 2, 3);
    const sq = k * v;
    const facts: Scale[] = [{ left: [S('square')], right: rep(S('circle'), k) }, { left: [S('circle')], right: [W(v)] }];
    const values = { circle: v, square: sq };
    const t = int(r, 0, 2);
    if (t === 0) {
      return {
        facts, main: maybeSwap(r, { left: [S('square')], right: [Q] }), values, answer: sq, trap: [k + v, v],
        explain: `Hình tròn nặng ${v}. Hình vuông nặng bằng ${k} hình tròn: ${v} × ${k} = ${sq}. Vậy ? = ${sq}.`,
      };
    }
    if (t === 1) {
      const answer = sq + v;
      return {
        facts, main: maybeSwap(r, { left: [S('square'), S('circle')], right: [Q] }), values, answer, trap: [sq, k + v + v],
        explain: `Hình tròn nặng ${v}, hình vuông nặng ${v} × ${k} = ${sq}. Đĩa có hai hình nặng ${sq} + ${v} = ${answer}.`,
      };
    }
    const a = int(r, 1, 9);
    const answer = 2 * sq - a;
    if (answer < 1 || 2 * sq > 40) continue;
    return {
      facts, main: maybeSwap(r, { left: [S('square'), S('square')], right: [W(a), Q] }), values, answer, trap: [2 * sq, sq - a],
      explain: `Hình vuông nặng ${v} × ${k} = ${sq}, hai hình vuông nặng ${sq} × 2 = ${2 * sq}. Đĩa kia có ${a}, cần thêm ${2 * sq} − ${a} = ${answer}.`,
    };
  }
}

function makeL5(r: Rand): Made {
  for (;;) {
    if (r() < 0.5) {
      // k tam giác = T  →  tam giác = T : k ;  vuông = 2 tam giác + a ;  hỏi: vuông + tam giác
      const k = int(r, 2, 4), tv = int(r, 3, 9), a = int(r, 1, 9);
      const T = k * tv, sq = 2 * tv + a;
      const answer = sq + tv;
      if (answer > 100) continue;
      return {
        facts: [{ left: rep(S('triangle'), k), right: [W(T)] }, { left: [S('square')], right: [S('triangle'), S('triangle'), W(a)] }],
        main: maybeSwap(r, { left: [S('square'), S('triangle')], right: [Q] }),
        values: { triangle: tv, square: sq }, answer, trap: [sq, T + a],
        explain: `${k} hình tam giác nặng ${T}, nên một hình tam giác nặng ${T} : ${k} = ${tv}. Hình vuông = ${tv} + ${tv} + ${a} = ${sq}. Vậy ? = ${sq} + ${tv} = ${answer}.`,
      };
    }
    // vuông + tròn = T ; tròn = c ; vuông = 2 tam giác  →  hỏi tam giác
    const tv = int(r, 3, 20), c = int(r, 2, 15);
    const sq = 2 * tv, T = sq + c;
    if (T > 100) continue;
    return {
      facts: [{ left: [S('square'), S('circle')], right: [W(T)] }, { left: [S('circle')], right: [W(c)] }, { left: [S('square')], right: [S('triangle'), S('triangle')] }],
      main: maybeSwap(r, { left: [S('triangle')], right: [Q] }),
      values: { circle: c, square: sq, triangle: tv }, answer: tv, trap: [sq, c],
      explain: `Hình tròn nặng ${c}, nên hình vuông nặng ${T} − ${c} = ${sq}. Hình vuông bằng 2 hình tam giác, nên một hình tam giác nặng ${sq} : 2 = ${tv}.`,
    };
  }
}

function optionsFor(r: Rand, answer: number, trap: number[], count: number, max: number): number[] {
  const pool = [answer + 1, answer - 1, answer + 2, answer - 2, ...trap, answer + 10, answer - 10, answer + 3];
  const out = [answer];
  for (const c of [...trap.filter(() => r() < 0.8), ...pool.sort(() => r() - 0.5)]) {
    if (out.length >= count) break;
    if (Number.isInteger(c) && c >= 1 && c <= max + 10 && !out.includes(c)) out.push(c);
  }
  for (let k = 1; out.length < count; k++) if (!out.includes(answer + k)) out.push(answer + k);
  // xáo vị trí đáp án
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function makeBalance(level: GameLevel, r: Rand, id: string): BalanceQ {
  const m = level === 1 ? makeL12(r, 10, 1) : level === 2 ? makeL12(r, 20, 2) : level === 3 ? makeL3(r) : level === 4 ? makeL4(r) : makeL5(r);
  const { trap, ...rest } = m;
  return { ...rest, id, level, options: optionsFor(r, m.answer, trap, OPTIONS_BY_LEVEL[level], MAX_BY_LEVEL[level]) };
}

const sig = (q: BalanceQ) => JSON.stringify([q.main, q.facts]);

/** Một lượt chơi: BALANCE_ROUND câu khác nhau */
export function makeRound(level: GameLevel, seed: number): BalanceQ[] {
  const r = mulberry32(seed);
  const out: BalanceQ[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < BALANCE_ROUND && i < 200; i++) {
    const q = makeBalance(level, r, `cb-${level}-${seed}-${out.length}`);
    if (seen.has(sig(q))) continue;
    seen.add(sig(q));
    out.push(q);
  }
  return out;
}

/** Kiểm tra một câu: chiếc cân gợi ý phải cân bằng, cân chính cân bằng đúng với đáp án và lệch với mọi lựa chọn khác */
export function validateBalance(q: BalanceQ): string[] {
  const e: string[] = [];
  const max = MAX_BY_LEVEL[q.level];
  for (const f of q.facts) if (tilt(f, q.values) !== 0) e.push(`${q.id}: cân gợi ý không cân bằng`);
  const qs = [...q.main.left, ...q.main.right].filter((i) => i.kind === 'q').length;
  if (qs !== 1) e.push(`${q.id}: cân chính phải có đúng một dấu ?`);
  if (tilt(q.main, q.values, q.answer) !== 0) e.push(`${q.id}: đáp án không làm cân thăng bằng`);
  if (!Number.isInteger(q.answer) || q.answer < 1 || q.answer > max) e.push(`${q.id}: đáp án ${q.answer} ngoài phạm vi 1–${max}`);
  for (const sc of [q.main, ...q.facts])
    for (const it of [...sc.left, ...sc.right]) if (it.kind === 'w' && (it.v < 1 || it.v > max)) e.push(`${q.id}: quả cân ${it.v} ngoài phạm vi`);
  if (q.options.length !== OPTIONS_BY_LEVEL[q.level] || new Set(q.options).size !== q.options.length) e.push(`${q.id}: lựa chọn sai số lượng / trùng`);
  if (!q.options.includes(q.answer)) e.push(`${q.id}: thiếu đáp án trong lựa chọn`);
  for (const o of q.options) if (o !== q.answer && tilt(q.main, q.values, o) === 0) e.push(`${q.id}: lựa chọn ${o} cũng làm cân bằng`);
  if (q.explain.length < 20) e.push(`${q.id}: thiếu lời giải thích`);
  // mọi hình trên các cân đều phải tính được cân nặng từ các cân gợi ý
  for (const sc of [q.main, ...q.facts]) for (const it of [...sc.left, ...sc.right]) if (it.kind === 's' && q.values[it.s] === undefined) e.push(`${q.id}: thiếu cân nặng của ${it.s}`);
  return e;
}

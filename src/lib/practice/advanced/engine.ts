// CHUYÊN ĐỀ NÂNG CAO — lõi bộ sinh đề theo mô hình "sinh ngược từ đáp án":
//   1. Khóa dạng toán (mỗi Gen là một dạng của một chuyên đề).
//   2. Chọn trước đáp án / tham số trong miền có kiểm soát (luôn ra số đẹp, không âm, không chia lẻ).
//   3. Thêm lớp nhiễu nhận thức ở mức L4–L5 (dữ kiện thừa, hỏi ngược, nhiều bước).
//   4. Ráp lời giải từng bước (steps) cho khung "Lời giải" của Cú Milo.
//   5. Mỗi đề có hàm `brute` giải lại bằng vét cạn / mô phỏng — scripts/check-advanced.ts đối chiếu với đáp án.
//   6. Đáp án nhiễu lấy từ lỗi sai thường gặp (traps), không chọn ngẫu nhiên.
// Đề tự soạn, không chép sách.

import type { Level } from '../../content/types';
import { Q, type Meta, type PracticeQuestion } from '../kit';
import type { Rng } from '../rng';

const NB = ' ';
/** 12 345 (tách lớp bằng khoảng trắng hẹp như các bộ sinh khác) */
export const f = (n: number) => (n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB) : String(n));
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

// ------------------------------------------------------------------ phân số
export type Frac = { n: number; d: number };
export const frac = (n: number, d: number): Frac => { const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
export const addF = (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
/** "45/31"; mẫu bằng 1 thì viết số tự nhiên */
export const fs = (x: Frac) => (x.d === 1 ? String(x.n) : `${x.n}/${x.d}`);

// ------------------------------------------------------------------ đề
export type Trap = { value: number | string; why: string };
export type Problem = {
  prompt: string;
  /** số tự nhiên, hoặc phân số tối giản dạng "a/b", hoặc một chữ số dạng chuỗi */
  answer: number | string;
  unit?: string;
  steps: string[];
  /** đáp án sai theo lỗi thường gặp (dùng làm lựa chọn nhiễu và lời nhắc "bẫy") */
  traps: Trap[];
  /** giải lại bằng vét cạn / mô phỏng; null = không có hoặc không duy nhất */
  brute: () => number | string | null;
  outcome: string;
  skill: string;
};
export type AdvGrade = 1 | 2 | 3 | 4 | 5;
export type AdvCtx = { grade: AdvGrade };
export type Gen = (r: Rng, c: AdvCtx, l: Level) => Problem | null;
export type GenPool = Record<Level, Gen[]>;

export const show = (v: number | string) => (typeof v === 'number' ? f(v) : v);
const validNum = (v: number | string) => typeof v === 'string' || (Number.isInteger(v) && v > 0);

/** Lựa chọn: đáp án + các bẫy hợp lệ; thiếu thì thêm số lân cận (chỉ với đáp án là số tự nhiên). */
export function choices(p: Problem, r: Rng): string[] | null {
  const ans = show(p.answer);
  const out = [ans];
  for (const t of p.traps) {
    if (!validNum(t.value)) continue;
    const s = show(t.value);
    if (!out.includes(s)) out.push(s);
    if (out.length === 4) break;
  }
  if (typeof p.answer === 'number') {
    for (const d of r.shuffle([1, -1, 2, -2, 10, -10])) {
      if (out.length >= 4) break;
      const v = p.answer + d;
      if (v > 0 && !out.includes(f(v))) out.push(f(v));
    }
  }
  return out.length >= 3 ? r.shuffle(out) : null;
}

/** Đổi đề thành câu hỏi: L1–L3 chọn đáp án (lựa chọn nhiễu = lỗi sai thường gặp), L4–L5 tự điền đáp số. */
export function toQuestion(p: Problem, r: Rng, l: Level): PracticeQuestion | null {
  const ans = show(p.answer);
  const trap = p.traps.find((t) => validNum(t.value) && show(t.value) !== ans);
  const e = `Đáp số: ${ans}${p.unit ? ` ${p.unit}` : ''}.${trap ? ` Bẫy hay gặp: ra ${show(trap.value)} — ${trap.why}.` : ''}`;
  const meta: Meta = { o: p.outcome, f: 'TOAN.LOIVAN', k: p.skill, l, e, s: p.steps.join('\n') };
  // Bẫy gắn vào câu: máy chủ nhận ra em chọn/điền đúng đáp án "bẫy" nào (thống kê ở trang Lỗ hổng kiến thức)
  const traps = [...new Map(p.traps.filter((t) => validNum(t.value) && show(t.value) !== ans).map((t) => [show(t.value), { v: show(t.value), why: t.why }] as const)).values()];
  const withTraps = (q: PracticeQuestion): PracticeQuestion => (traps.length ? { ...q, traps } : q);
  if (l <= 3) {
    const opts = choices(p, r);
    if (!opts) return null;
    return withTraps(Q.sc(p.prompt, opts, ans, meta));
  }
  const unit = p.unit ? ` ${p.unit}` : '';
  // Ô điền chỉ nhận số (bàn phím số): phân số dùng hai ô tử / mẫu như các bộ sinh khác
  const fr = typeof p.answer === 'string' ? /^(\d+)\/(\d+)$/.exec(p.answer) : null;
  if (fr) return withTraps(Q.blanks(`${p.prompt} (viết phân số tối giản)`, [`Đáp số: {}/{}${unit}`], [[fr[1], fr[2]]], meta));
  return withTraps(Q.blanks(p.prompt, [`Đáp số: {}${unit}`], [[String(p.answer)]], meta));
}

/** Câu trả lời sai của em trùng bẫy nào (so sau khi bỏ khoảng trắng; ô phân số ghép "tử/mẫu") → chỉ số bẫy, không trùng → null */
export function matchTrap(traps: { v: string }[] | undefined, answer: unknown): number | null {
  if (!traps?.length || answer === null || answer === undefined) return null;
  const given = Array.isArray(answer) ? answer.map(String).join('/') : typeof answer === 'string' ? answer : null;
  if (given === null) return null;
  const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
  const g = norm(given);
  const i = traps.findIndex((t) => norm(t.v) === g);
  return i >= 0 ? i : null;
}

/** Nhận xét khi em trả lời sai: nếu trùng một bẫy thì nói rõ em vừa mắc bẫy nào (thay cho câu "Bẫy hay gặp" chung chung). */
export function trapNote(traps: { v: string; why: string }[] | undefined, answer: unknown, explanation: string | undefined): string | undefined {
  const i = matchTrap(traps, answer);
  if (i === null || !traps || explanation === undefined) return explanation;
  const head = explanation.split(' Bẫy hay gặp:')[0];
  return `${head} Em ra ${traps[i].v} — đây là bẫy: ${traps[i].why}.`;
}

/** Bọc các Gen thành template của bộ sinh câu luyện tập. */
export const toPool = (pool: GenPool) => {
  const wrap = (g: Gen) => (r: Rng, c: AdvCtx, l: Level) => { const p = g(r, c, l); return p ? toQuestion(p, r, l) : null; };
  return { 1: pool[1].map(wrap), 2: pool[2].map(wrap), 3: pool[3].map(wrap), 4: pool[4].map(wrap), 5: pool[5].map(wrap) };
};

/** Mã YCCĐ "Tư duy, nâng cao" theo lớp: lớp 4 có 02/03/04, lớp 5 gộp vào T5.TD.01 (phân số) / T5.TD.02 */
export const oc = (c: AdvCtx, g4: '02' | '03' | '04', g5: '01' | '02' = '02') => (c.grade === 4 ? `T4.TD.${g4}` : `T5.TD.${g5}`);

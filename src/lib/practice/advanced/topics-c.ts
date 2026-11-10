// Chuyên đề nâng cao lớp 2–3 (phần C): Thêm bớt cho bằng nhau, Quy luật dãy số, Tính nhanh.
// Lớp 2: số đến 1000, chỉ nhân/chia trong bảng 2 và 5 (chia đôi số nhỏ); lớp 3: số đến 100 000, nhân/chia với số có một chữ số.

import type { Rng } from '../rng';
import { KIDS } from '../kit';
import { f, type AdvCtx, type Gen, type GenPool, type Problem } from './engine';

const by = (c: AdvCtx, g2: number, g3: number) => (c.grade === 2 ? g2 : g3);
/** Mã YCCĐ nhóm "Tư duy, nâng cao" của lớp 2–3 */
const ocTD = (c: AdvCtx, code: '01' | '02' | '03' | '04') => `T${c.grade}.TD.${code}`;
/** Nghiệm duy nhất trong [lo, hi] thỏa điều kiện (vét cạn); không có hoặc nhiều nghiệm → null */
function only(lo: number, hi: number, ok: (x: number) => boolean): number | null {
  let found: number | null = null;
  for (let x = lo; x <= hi; x++) if (ok(x)) { if (found !== null) return null; found = x; }
  return found;
}
/** Lớp 2 dùng gen2, lớp 3 dùng gen3 (khi một dạng vượt phạm vi lớp 2) */
const per = (gen2: Gen, gen3: Gen): Gen => (r, c, l) => (c.grade === 2 ? gen2(r, c, l) : gen3(r, c, l));

// =========================================================================================
// 1. THÊM BỚT CHO BẰNG NHAU
// =========================================================================================
const THINGS = [
  { n: 'quyển vở', u: 'quyển' }, { n: 'viên bi', u: 'viên' }, { n: 'cái kẹo', u: 'cái' },
  { n: 'bông hoa giấy', u: 'bông' }, { n: 'cái nhãn vở', u: 'cái' }, { n: 'quả táo', u: 'quả' },
];
const EQ_NOISE = ['Hai bạn học cùng lớp 2A.', 'Hôm nay là thứ Năm.', 'Mỗi bạn có một chiếc cặp màu xanh.'];
const noise = (r: Rng, on: boolean) => (on && r.chance(0.6) ? ` ${r.pick(EQ_NOISE)}` : '');

/** A hơn B h; A cho B bao nhiêu để bằng nhau → h : 2 */
const eqGive = (r: Rng, c: AdvCtx): Problem => {
  const [A, B] = r.sample(KIDS, 2);
  const { n, u } = r.pick(THINGS);
  const h = 2 * r.int(2, by(c, 10, 60));
  const b = r.int(5, by(c, 80, 900));
  const a = b + h;
  return {
    prompt: `${A} có ${f(a)} ${n}, ${B} có ${f(b)} ${n}. Hỏi ${A} phải cho ${B} bao nhiêu ${u} để số ${n} của hai bạn bằng nhau?`,
    answer: h / 2, unit: u,
    steps: [
      `${A} nhiều hơn ${B}: ${f(a)} − ${f(b)} = ${h} (${u}).`,
      `Mỗi lần ${A} cho ${B} 1 ${u} thì ${A} bớt 1 và ${B} thêm 1, nên phần hơn giảm đi 2.`,
      `Số ${u} ${A} phải cho: ${h} : 2 = ${h / 2} (${u}).`,
    ],
    traps: [{ value: h, why: 'lấy cả phần hơn (quên chia đôi)' }, { value: (a + b) / 2, why: 'đó là số đồ vật mỗi bạn có lúc sau' }],
    brute: () => only(0, a, (x) => a - x === b + x),
    outcome: ocTD(c, '03'), skill: 'them_bot_bang_nhau',
  };
};

/** B cần thêm bao nhiêu để bằng A → hiệu (không chia đôi) */
const eqAdd = (r: Rng, c: AdvCtx): Problem => {
  const [A, B] = r.sample(KIDS, 2);
  const { n, u } = r.pick(THINGS);
  const h = 2 * r.int(2, by(c, 10, 60));
  const b = r.int(5, by(c, 80, 900));
  const a = b + h;
  return {
    prompt: `${A} có ${f(a)} ${n}, ${B} có ${f(b)} ${n}. Hỏi ${B} cần có thêm bao nhiêu ${u} nữa thì bằng ${A}? (${A} không cho đi)`,
    answer: h, unit: u,
    steps: [`${A} không bớt đi nên ${B} phải thêm đúng phần ${A} hơn mình.`, `${f(a)} − ${f(b)} = ${h} (${u}).`],
    traps: [{ value: h / 2, why: 'chia đôi phần hơn như khi bạn này cho bạn kia' }, { value: a + b, why: 'cộng số đồ của hai bạn' }],
    brute: () => only(0, a, (x) => b + x === a),
    outcome: ocTD(c, '03'), skill: 'them_cho_bang',
  };
};

/** A cho B k thì bằng nhau → lúc đầu A hơn B 2k */
const eqAfterGive = (r: Rng, c: AdvCtx): Problem => {
  const [A, B] = r.sample(KIDS, 2);
  const { n, u } = r.pick(THINGS);
  const k = r.int(2, by(c, 9, 60));
  return {
    prompt: `Nếu ${A} cho ${B} ${k} ${n} thì số ${n} của hai bạn bằng nhau. Hỏi lúc đầu ${A} có nhiều hơn ${B} bao nhiêu ${u}?`,
    answer: 2 * k, unit: u,
    steps: [`${A} cho đi ${k} ${u} thì ${A} bớt ${k}, đồng thời ${B} thêm ${k}.`, `Vậy lúc đầu ${A} hơn ${B}: ${k} + ${k} = ${2 * k} (${u}).`],
    traps: [{ value: k, why: 'quên rằng bạn kia cũng được thêm' }, { value: k + 1, why: 'cộng thêm 1' }],
    // thử mọi số đồ ban đầu của B: phần hơn d nào làm hai bạn bằng nhau sau khi cho
    brute: () => only(0, 4 * k + 10, (d) => [3, 10, 25].every((b) => b + d - k === b + k)),
    outcome: ocTD(c, '03'), skill: 'them_bot_bang_nhau',
  };
};

/** A cho B k thì mỗi bạn có m → lúc đầu A có m + k */
const eqBefore = (r: Rng, c: AdvCtx, noisy = false): Problem => {
  const [A, B] = r.sample(KIDS, 2);
  const { n, u } = r.pick(THINGS);
  const m = r.int(by(c, 8, 30), by(c, 90, 900));
  const k = r.int(2, Math.min(m - 1, by(c, 30, 200)));
  const askA = r.chance(0.5);
  const ans = askA ? m + k : m - k;
  return {
    prompt: `${A} cho ${B} ${k} ${n} thì mỗi bạn đều có ${f(m)} ${n}.${noise(r, noisy)} Hỏi lúc đầu ${askA ? A : B} có bao nhiêu ${n}?`,
    answer: ans, unit: u,
    steps: askA
      ? [`${A} đã cho đi ${k} ${u} nên lúc đầu ${A} nhiều hơn bây giờ ${k} ${u}.`, `Lúc đầu ${A} có: ${f(m)} + ${k} = ${f(ans)} (${u}).`]
      : [`${B} đã được thêm ${k} ${u} nên lúc đầu ${B} ít hơn bây giờ ${k} ${u}.`, `Lúc đầu ${B} có: ${f(m)} − ${k} = ${f(ans)} (${u}).`],
    traps: askA
      ? [{ value: m - k, why: 'trừ đi trong khi bạn đó là người cho đi' }, { value: m, why: 'lấy số lúc sau' }]
      : [{ value: m + k, why: 'cộng thêm trong khi bạn đó là người được nhận' }, { value: m, why: 'lấy số lúc sau' }],
    brute: () => only(0, m + k + 5, (x) => (askA ? x - k === m : x + k === m)),
    outcome: ocTD(c, '03'), skill: 'them_bot_nguoc',
  };
};

/** Cho rồi vẫn còn hơn: A cho B k, A vẫn hơn B d → lúc đầu hơn d + 2k */
const eqStillMore = (r: Rng, c: AdvCtx): Problem => {
  const [A, B] = r.sample(KIDS, 2);
  const { n, u } = r.pick(THINGS);
  const k = r.int(2, by(c, 9, 40));
  const d = r.int(1, by(c, 20, 90));
  return {
    prompt: `${A} cho ${B} ${k} ${n}. Lúc này ${A} vẫn còn nhiều hơn ${B} ${d} ${n}.${noise(r, true)} Hỏi lúc đầu ${A} nhiều hơn ${B} bao nhiêu ${u}?`,
    answer: d + 2 * k, unit: u,
    steps: [
      `Khi ${A} cho ${B} ${k} ${u}, phần hơn của ${A} giảm đi ${k} + ${k} = ${2 * k} (${u}).`,
      `Lúc đầu ${A} hơn ${B}: ${d} + ${2 * k} = ${d + 2 * k} (${u}).`,
    ],
    traps: [{ value: d + k, why: 'chỉ cộng số đã cho một lần (quên bạn kia cũng được thêm)' }, { value: d, why: 'lấy phần hơn lúc sau' }],
    brute: () => only(0, d + 4 * k + 10, (h) => [4, 17, 50].every((b) => b + h - k - (b + k) === d)),
    outcome: ocTD(c, '03'), skill: 'them_bot_nhieu_buoc',
  };
};

/** Mỗi lần cho 2 đồ vật: phải cho mấy lần → h : 2 : 2 */
const eqTimes = (r: Rng, c: AdvCtx): Problem => {
  const [A, B] = r.sample(KIDS, 2);
  const { n, u } = r.pick(THINGS);
  const t = r.int(2, by(c, 5, 20));
  const h = 4 * t;
  const b = r.int(3, by(c, 60, 800));
  const a = b + h;
  return {
    prompt: `${A} có ${f(a)} ${n}, ${B} có ${f(b)} ${n}. Mỗi lần ${A} đưa cho ${B} 2 ${u}.${noise(r, true)} Hỏi ${A} phải đưa mấy lần thì số ${n} của hai bạn bằng nhau?`,
    answer: t, unit: 'lần',
    steps: [
      `${A} nhiều hơn ${B}: ${f(a)} − ${f(b)} = ${h} (${u}).`,
      `Để bằng nhau ${A} phải cho tất cả: ${h} : 2 = ${2 * t} (${u}).`,
      `Mỗi lần đưa 2 ${u} nên số lần là: ${2 * t} : 2 = ${t} (lần).`,
    ],
    traps: [{ value: 2 * t, why: 'đó là số đồ vật phải cho, chưa chia cho 2 mỗi lần' }, { value: h, why: 'lấy cả phần hơn làm số lần' }],
    brute: () => only(0, a, (x) => a - 2 * x === b + 2 * x),
    outcome: ocTD(c, '03'), skill: 'them_bot_nhieu_buoc',
  };
};

/** A hơn B h, A cho B k (k < h < 2k) → bây giờ B hơn A 2k − h */
const eqSwap = (r: Rng, c: AdvCtx): Problem | null => {
  const [A, B] = r.sample(KIDS, 2);
  const { n, u } = r.pick(THINGS);
  const k = r.int(4, by(c, 10, 60));
  const h = r.int(k + 1, 2 * k - 1);
  const ans = 2 * k - h;
  if (ans === h - k) return null;
  return {
    prompt: `${A} có nhiều hơn ${B} ${h} ${n}. ${A} cho ${B} ${k} ${n}. Hỏi lúc này ${B} có nhiều hơn ${A} bao nhiêu ${u}?`,
    answer: ans, unit: u,
    steps: [
      `${A} cho đi ${k} ${u} thì ${A} bớt ${k}, ${B} thêm ${k}: ${B} được lợi thêm ${k} + ${k} = ${2 * k} (${u}) so với ${A}.`,
      `Lúc đầu ${B} kém ${A} ${h} ${u}, nên bây giờ ${B} hơn ${A}: ${2 * k} − ${h} = ${ans} (${u}).`,
    ],
    traps: [{ value: h - k, why: 'lấy phần hơn trừ số đã cho một lần' }, { value: 2 * k, why: 'quên phần hơn lúc đầu' }, { value: k, why: 'lấy số đã cho' }],
    brute: () => only(0, 4 * k, (x) => [5, 30].every((b) => b + k - (b + h - k) === x)),
    outcome: ocTD(c, '03'), skill: 'them_bot_nhieu_buoc',
  };
};

/** Lớp 3: ba bạn, chỉ bạn nhiều nhất cho → a − trung bình */
const eqThree = (r: Rng, c: AdvCtx): Problem | null => {
  const [A, B, C] = r.sample(KIDS, 3);
  const { n, u } = r.pick(THINGS);
  const m = r.int(20, 300);
  const b = m - r.int(1, 15), d = m - r.int(1, 15);
  const a = 3 * m - b - d;
  if (b === d) return null;
  return {
    prompt: `${A} có ${f(a)} ${n}, ${B} có ${f(b)} ${n}, ${C} có ${f(d)} ${n}. ${A} chia bớt cho hai bạn để cả ba bạn có số ${n} bằng nhau. Hỏi ${A} phải cho đi tất cả bao nhiêu ${u}?`,
    answer: a - m, unit: u,
    steps: [
      `Cả ba bạn có: ${f(a)} + ${f(b)} + ${f(d)} = ${f(3 * m)} (${u}).`,
      `Lúc sau mỗi bạn có: ${f(3 * m)} : 3 = ${f(m)} (${u}).`,
      `${A} phải cho đi: ${f(a)} − ${f(m)} = ${a - m} (${u}).`,
    ],
    traps: [{ value: m - b, why: 'đó chỉ là số cho một bạn' }, { value: a - b, why: 'lấy số của bạn nhiều nhất trừ số của một bạn' }, { value: m, why: 'đó là số mỗi bạn có lúc sau' }],
    brute: () => only(0, a, (x) => (a - x) * 3 === a + b + d && a - x >= b && a - x >= d),
    outcome: ocTD(c, '03'), skill: 'them_bot_ba_ban',
  };
};

export const EQUALS: GenPool = {
  1: [eqGive, eqAdd],
  2: [eqAfterGive, (r, c) => eqBefore(r, c), eqGive],
  3: [(r, c) => eqBefore(r, c), eqAfterGive, eqAdd, eqStillMore],
  4: [eqStillMore, eqTimes, (r, c) => eqBefore(r, c, true)],
  5: [eqSwap, per(eqTimes, eqThree), per(eqStillMore, eqThree)],
};

// =========================================================================================
// 2. QUY LUẬT DÃY SỐ
// =========================================================================================
const list = (xs: number[]) => xs.map(f).join('; ');
/** Vét cạn: từ các số đã cho, nếu hiệu không đổi thì viết tiếp; trả về số ở vị trí `at` (tính từ 0) */
function extend(xs: number[], at: number): number | null {
  const d = xs[1] - xs[0];
  for (let i = 2; i < xs.length; i++) if (xs[i] - xs[i - 1] !== d) return null;
  let v = xs[xs.length - 1];
  for (let i = xs.length; i <= at; i++) v += d;
  return v;
}
const stepsOf = (c: AdvCtx) => (c.grade === 2 ? [2, 3, 4, 5, 10] : [3, 4, 6, 7, 8, 9, 11, 15, 25, 50, 100]);

const seqNext = (r: Rng, c: AdvCtx): Problem => {
  const d = r.pick(stepsOf(c));
  const a = r.int(1, by(c, 200, 5000));
  const xs = [0, 1, 2, 3].map((i) => a + i * d);
  const ans = a + 4 * d;
  return {
    prompt: `Viết số tiếp theo của dãy: ${list(xs)}; …`,
    answer: ans,
    steps: [`Hai số liền nhau hơn kém nhau ${d} (${f(xs[1])} − ${f(xs[0])} = ${d}).`, `Số tiếp theo: ${f(xs[3])} + ${d} = ${f(ans)}.`],
    traps: [{ value: a + 5 * d, why: 'bỏ qua mất một số' }, { value: xs[3] + 1, why: 'chỉ thêm 1 như dãy số liên tiếp' }],
    brute: () => extend(xs, 4),
    outcome: ocTD(c, '02'), skill: 'day_cong',
  };
};

const seqDown = (r: Rng, c: AdvCtx): Problem => {
  const d = r.pick(stepsOf(c));
  const ans = r.int(1, by(c, 300, 5000));
  const xs = [4, 3, 2, 1].map((i) => ans + i * d);
  return {
    prompt: `Viết số tiếp theo của dãy: ${list(xs)}; …`,
    answer: ans,
    steps: [`Dãy giảm dần, hai số liền nhau kém nhau ${d} (${f(xs[0])} − ${f(xs[1])} = ${d}).`, `Số tiếp theo: ${f(xs[3])} − ${d} = ${f(ans)}.`],
    traps: [{ value: xs[3] + d, why: 'cộng thêm trong khi dãy đang giảm' }, { value: xs[3] - 1, why: 'chỉ bớt 1' }],
    brute: () => extend(xs, 4),
    outcome: ocTD(c, '02'), skill: 'day_tru',
  };
};

const seqMissing = (r: Rng, c: AdvCtx): Problem => {
  const d = r.pick(stepsOf(c));
  const a = r.int(1, by(c, 200, 5000));
  const gap = r.int(1, 3);
  const xs = [0, 1, 2, 3, 4].map((i) => a + i * d);
  const ans = xs[gap];
  return {
    prompt: `Tìm số còn thiếu trong dãy: ${xs.map((x, i) => (i === gap ? '…' : f(x))).join('; ')}`,
    answer: ans,
    steps: [`Hai số liền nhau hơn kém nhau ${d}.`, `Số còn thiếu: ${f(xs[gap - 1])} + ${d} = ${f(ans)}.`],
    traps: [{ value: ans + d, why: 'cộng thêm một bước nữa' }, { value: xs[gap - 1] + 1, why: 'chỉ thêm 1' }],
    brute: () => only(Math.max(0, ans - 3 * d), ans + 3 * d, (x) => extend(xs.map((v, i) => (i === gap ? x : v)), 4) !== null),
    outcome: ocTD(c, '02'), skill: 'day_thieu',
  };
};

/** Số thứ n: a + (n − 1) × d */
const seqNth = (r: Rng, c: AdvCtx): Problem => {
  const d = c.grade === 2 ? r.pick([2, 5]) : r.pick([2, 3, 4, 5, 6, 7, 8, 9]);
  const n = r.int(6, by(c, 11, 60));
  const a = r.int(1, by(c, 50, 500));
  const ans = a + (n - 1) * d;
  const mul = c.grade === 2 ? `${d} × ${n - 1}` : `${n - 1} × ${d}`;
  return {
    prompt: `Cho dãy số: ${list([a, a + d, a + 2 * d, a + 3 * d])}; … Hỏi số thứ ${n} của dãy là số nào?`,
    answer: ans,
    steps: [
      `Mỗi số hơn số đứng trước ${d}. Từ số thứ nhất đến số thứ ${n} phải cộng thêm ${n - 1} lần ${d}.`,
      `${mul} = ${(n - 1) * d}.`,
      `Số thứ ${n} là ${f(a)} + ${(n - 1) * d} = ${f(ans)}.`,
    ],
    traps: [{ value: a + n * d, why: `cộng ${n} lần ${d} (quên trừ 1, chỉ có ${n - 1} bước)` }, { value: n * d, why: 'quên cộng số đầu tiên' }],
    brute: () => { let v = a; for (let i = 1; i < n; i++) v += d; return v; },
    outcome: ocTD(c, '02'), skill: 'day_so_thu_n',
  };
};

/** Có bao nhiêu số: (cuối − đầu) : d + 1 */
const seqCount = (r: Rng, c: AdvCtx): Problem => {
  const d = c.grade === 2 ? r.pick([2, 5]) : r.pick([2, 3, 4, 5, 6, 7, 8, 9]);
  const k = r.int(5, by(c, 10, 90));
  const a = r.int(1, by(c, 100, 900));
  const L = a + k * d;
  return {
    prompt: `Dãy số ${list([a, a + d, a + 2 * d])}; …; ${f(L)} có tất cả bao nhiêu số?`,
    answer: k + 1, unit: 'số',
    steps: [`Khoảng cách từ số đầu đến số cuối: ${f(L)} − ${f(a)} = ${f(k * d)}.`, `Số bước: ${f(k * d)} : ${d} = ${k}.`, `Số các số = số bước + 1 = ${k} + 1 = ${k + 1} (số).`],
    traps: [{ value: k, why: 'quên cộng 1 (số các số nhiều hơn số bước 1)' }, { value: k + 2, why: 'cộng thừa' }],
    brute: () => { let n = 0; for (let v = a; v <= L; v += d) n++; return n; },
    outcome: ocTD(c, '02'), skill: 'day_dem_so',
  };
};

/** Khoảng cách tăng dần: s, s+1, s+2, … */
const seqGrow = (r: Rng, c: AdvCtx): Problem => {
  const s = r.int(1, by(c, 5, 12));
  const step = c.grade === 2 ? 1 : r.pick([1, 2]);
  const a = r.int(1, by(c, 50, 300));
  const xs = [a];
  for (let i = 0; i < 4; i++) xs.push(xs[i] + s + i * step);
  const ans = xs[4] + s + 4 * step;
  return {
    prompt: `Tìm quy luật rồi viết số tiếp theo: ${list(xs)}; …`,
    answer: ans,
    steps: [
      `Hiệu hai số liền nhau: ${xs.slice(1).map((x, i) => x - xs[i]).join('; ')} — mỗi lần tăng thêm ${step}.`,
      `Hiệu tiếp theo là ${s + 4 * step}, nên số tiếp theo: ${f(xs[4])} + ${s + 4 * step} = ${f(ans)}.`,
    ],
    traps: [{ value: xs[4] + s + 3 * step, why: 'cộng lại hiệu cũ, chưa tăng thêm' }, { value: xs[4] + s, why: 'chỉ cộng hiệu đầu tiên' }],
    brute: () => {
      const dd = xs.slice(1).map((x, i) => x - xs[i]);
      const st = dd[1] - dd[0];
      if (!dd.every((v, i) => i === 0 || v - dd[i - 1] === st)) return null;
      return xs[4] + dd[3] + st;
    },
    outcome: ocTD(c, '02'), skill: 'day_hieu_tang',
  };
};

/** Hai dãy đan xen: vị trí lẻ một dãy, vị trí chẵn một dãy */
const seqAlt = (r: Rng, c: AdvCtx): Problem | null => {
  const dx = r.pick(c.grade === 2 ? [1, 2, 5] : [2, 3, 5, 7]), dy = r.pick(c.grade === 2 ? [10, 5, 2] : [10, 20, 25, 50]);
  const x0 = r.int(1, by(c, 20, 200)), y0 = r.int(by(c, 10, 100), by(c, 60, 600));
  if (dx === dy) return null;
  const xs: number[] = [];
  for (let i = 0; i < 3; i++) xs.push(x0 + i * dx, y0 + i * dy);
  const ans = x0 + 3 * dx;
  return {
    prompt: `Tìm quy luật rồi viết số tiếp theo: ${list(xs)}; …`,
    answer: ans,
    steps: [
      `Đây là hai dãy đan xen nhau. Các số ở vị trí thứ nhất, thứ ba, thứ năm: ${list([xs[0], xs[2], xs[4]])} — mỗi lần thêm ${dx}.`,
      `Các số ở vị trí thứ hai, thứ tư, thứ sáu: ${list([xs[1], xs[3], xs[5]])} — mỗi lần thêm ${dy}.`,
      `Số tiếp theo ở vị trí thứ bảy, thuộc dãy thứ nhất: ${f(xs[4])} + ${dx} = ${f(ans)}.`,
    ],
    traps: [{ value: y0 + 3 * dy, why: 'viết tiếp theo dãy thứ hai' }, { value: xs[5] + dy, why: 'coi cả dãy chỉ có một quy luật' }],
    brute: () => {
      const odd = [xs[0], xs[2], xs[4]], even = [xs[1], xs[3], xs[5]];
      return extend(even, 2) === null ? null : extend(odd, 3);
    },
    outcome: ocTD(c, '02'), skill: 'day_dan_xen',
  };
};

/** Gấp đôi: a, 2a, 4a, 8a, … (cộng chính nó, không cần bảng nhân lớn) */
const seqDouble = (r: Rng, c: AdvCtx): Problem => {
  const a = r.int(1, by(c, 6, 60));
  const xs = [a, 2 * a, 4 * a, 8 * a];
  const ans = 16 * a;
  return {
    prompt: `Tìm quy luật rồi viết số tiếp theo: ${list(xs)}; …`,
    answer: ans,
    steps: [`Mỗi số gấp đôi số đứng trước (bằng số đó cộng với chính nó).`, `Số tiếp theo: ${f(8 * a)} + ${f(8 * a)} = ${f(ans)}.`],
    traps: [{ value: 12 * a, why: 'cộng thêm hiệu cũ như dãy cách đều' }, { value: 8 * a + a, why: 'chỉ cộng thêm số đầu tiên' }],
    brute: () => (xs.every((v, i) => i === 0 || v === xs[i - 1] * 2) ? xs[3] * 2 : null),
    outcome: ocTD(c, '02'), skill: 'day_gap_doi',
  };
};

export const SEQS: GenPool = {
  1: [seqNext, seqDown],
  2: [seqMissing, seqNext, seqDown],
  3: [seqNth, seqMissing, seqGrow],
  4: [seqCount, seqNth, seqGrow],
  5: [seqAlt, seqDouble, seqCount],
};

// =========================================================================================
// 3. TÍNH NHANH
// =========================================================================================
/** Hai số có tổng tròn chục (lớp 2) / tròn trăm (lớp 3) */
function roundPair(r: Rng, c: AdvCtx): [number, number] {
  const unit = by(c, 10, 100);
  const total = unit * r.int(2, by(c, 9, 9));
  const x = r.int(by(c, 11, 101), total - by(c, 11, 101));
  return [x, total - x];
}

/** x + y + z với x + z tròn */
const qkPair = (r: Rng, c: AdvCtx): Problem | null => {
  const [x, z] = roundPair(r, c);
  const y = r.int(by(c, 12, 120), by(c, 89, 899));
  const ans = x + y + z;
  if (ans + 10 > by(c, 1000, 100000) || x % 10 === 0) return null;
  return {
    prompt: `Tính nhanh: ${f(x)} + ${f(y)} + ${f(z)} = ?`,
    answer: ans,
    steps: [`Ghép hai số có tổng tròn ${c.grade === 2 ? 'chục' : 'trăm'}: ${f(x)} + ${f(z)} = ${f(x + z)}.`, `${f(x + z)} + ${f(y)} = ${f(ans)}.`],
    traps: [{ value: ans - 10, why: 'quên nhớ 1 sang hàng chục' }, { value: ans + 10, why: 'nhớ thừa' }],
    brute: () => x + y + z,
    outcome: ocTD(c, '01'), skill: 'tinh_nhanh_ghep',
  };
};

/** a + b + c + d: hai cặp tròn */
const qkFour = (r: Rng, c: AdvCtx): Problem | null => {
  const [a, b] = roundPair(r, c), [p, q] = roundPair(r, c);
  const ans = a + b + p + q;
  if (ans + 10 > by(c, 1000, 100000) || a === p) return null;
  return {
    prompt: `Tính nhanh: ${f(a)} + ${f(p)} + ${f(b)} + ${f(q)} = ?`,
    answer: ans,
    steps: [`Ghép từng cặp có tổng tròn ${c.grade === 2 ? 'chục' : 'trăm'}: (${f(a)} + ${f(b)}) + (${f(p)} + ${f(q)}).`, `= ${f(a + b)} + ${f(p + q)} = ${f(ans)}.`],
    traps: [{ value: ans - 10, why: 'quên nhớ 1 sang hàng chục' }, { value: ans - by(c, 10, 100), why: 'quên nhớ khi cộng hai tổng' }, { value: ans + 10, why: 'nhớ thừa' }],
    brute: () => a + p + b + q,
    outcome: ocTD(c, '01'), skill: 'tinh_nhanh_ghep',
  };
};

/** n + 9 / 99 / 999 = n + 10… − 1 */
const qkNine = (r: Rng, c: AdvCtx): Problem | null => {
  const near = c.grade === 2 ? r.pick([9, 99]) : r.pick([99, 999, 98]);
  const round = near === 98 ? 100 : near + 1;
  const back = round - near;
  const n = r.int(by(c, 12, 120), by(c, 900, 9000));
  const ans = n + near;
  if (n + round + 10 > by(c, 1000, 100000)) return null; // cả lựa chọn lân cận (+10) cũng trong phạm vi
  return {
    prompt: `Tính nhanh: ${f(n)} + ${near} = ?`,
    answer: ans,
    steps: [`${near} = ${round} − ${back}, nên cộng ${round} rồi bớt ${back}.`, `${f(n)} + ${round} = ${f(n + round)}; ${f(n + round)} − ${back} = ${f(ans)}.`],
    traps: [{ value: n + round, why: `cộng ${round} nhưng quên bớt ${back}` }, { value: n + round + back, why: `cộng thêm ${back} thay vì bớt` }],
    brute: () => n + near,
    outcome: ocTD(c, '01'), skill: 'tinh_nhanh_tron',
  };
};

/** n − 9 / 99 = n − 10… + 1 */
const qkMinusNine = (r: Rng, c: AdvCtx): Problem | null => {
  const near = c.grade === 2 ? r.pick([9, 99]) : r.pick([99, 999, 98]);
  const round = near === 98 ? 100 : near + 1;
  const back = round - near;
  const n = r.int(round + 11, by(c, 999, 50000));
  const ans = n - near;
  return {
    prompt: `Tính nhanh: ${f(n)} − ${near} = ?`,
    answer: ans,
    steps: [`Trừ ${near} giống trừ ${round} rồi trả lại ${back} (vì trừ thừa ${back}).`, `${f(n)} − ${round} = ${f(n - round)}; ${f(n - round)} + ${back} = ${f(ans)}.`],
    traps: [{ value: n - round, why: `trừ ${round} nhưng quên trả lại ${back}` }, { value: n - round - back, why: `trừ thêm ${back} thay vì cộng lại` }],
    brute: () => n - near,
    outcome: ocTD(c, '01'), skill: 'tinh_nhanh_tron',
  };
};

/** (2n) − (2n − 1) + (2n − 2) − … + 2 − 1 = n */
const qkAlt = (r: Rng, c: AdvCtx): Problem => {
  const n = r.int(4, by(c, 10, 50));
  const top = 2 * n;
  const shown = n <= 5
    ? Array.from({ length: top }, (_, i) => top - i).map((v, i) => (i === 0 ? `${v}` : `${i % 2 ? '−' : '+'} ${v}`)).join(' ')
    : `${top} − ${top - 1} + ${top - 2} − ${top - 3} + … + 4 − 3 + 2 − 1`;
  return {
    prompt: `Tính nhanh: ${shown} = ?`,
    answer: n,
    steps: [
      `Ghép từng cặp: (${top} − ${top - 1}) + (${top - 2} − ${top - 3}) + … + (2 − 1), mỗi cặp bằng 1.`,
      `Từ 1 đến ${top} có ${top} số, ghép thành ${n} cặp (${top} : 2 = ${n}).`,
      `Kết quả: có ${n} cặp, mỗi cặp bằng 1 nên bằng ${n}.`,
    ],
    traps: [{ value: top, why: 'đếm số các số thay vì số cặp' }, { value: n - 1, why: 'đếm thiếu một cặp' }, { value: n + 1, why: 'đếm thừa một cặp' }],
    brute: () => { let s = 0; for (let v = top; v >= 1; v--) s += (top - v) % 2 === 0 ? v : -v; return s; },
    outcome: ocTD(c, '01'), skill: 'tinh_nhanh_cap',
  };
};

/** s + (s+1) + … + e (số các số chẵn): ghép đầu – cuối */
const qkGauss = (r: Rng, c: AdvCtx): Problem => {
  const pairs = r.int(2, by(c, 5, 9));
  const s = r.int(1, by(c, 20, 60));
  const e = s + 2 * pairs - 1;
  const ans = (s + e) * pairs;
  const terms = Array.from({ length: 2 * pairs }, (_, i) => s + i);
  const shown = terms.length <= 8 ? terms.join(' + ') : `${s} + ${s + 1} + ${s + 2} + … + ${e - 1} + ${e}`;
  const each = s + e;
  return {
    prompt: `Tính nhanh: ${shown} = ?`,
    answer: ans,
    steps: [
      `Ghép số đầu với số cuối: ${s} + ${e} = ${each}; ${s + 1} + ${e - 1} = ${each}; … mỗi cặp đều bằng ${each}.`,
      `Có ${2 * pairs} số nên có ${pairs} cặp.`,
      c.grade === 2
        ? `Kết quả: ${Array(pairs).fill(each).join(' + ')} = ${ans}.`
        : `Kết quả: ${each} × ${pairs} = ${f(ans)}.`,
    ],
    traps: [{ value: each * 2 * pairs, why: 'nhân với số các số thay vì số cặp' }, { value: ans - each, why: 'đếm thiếu một cặp' }],
    brute: () => terms.reduce((x, y) => x + y, 0),
    outcome: ocTD(c, '01'), skill: 'tinh_nhanh_day',
  };
};

/** Lớp 3: a × k + a × m (k + m = 10) = a × 10 */
const qkDist = (r: Rng, c: AdvCtx): Problem => {
  const a = r.int(12, 999);
  const k = r.int(2, 8), m = 10 - k;
  const ans = a * 10;
  return {
    prompt: `Tính nhanh: ${f(a)} × ${k} + ${f(a)} × ${m} = ?`,
    answer: ans,
    steps: [`Hai tích có chung thừa số ${f(a)}, nên ${f(a)} × ${k} + ${f(a)} × ${m} = ${f(a)} × (${k} + ${m}).`, `= ${f(a)} × 10 = ${f(ans)}.`],
    traps: [{ value: a * k * m, why: `nhân ${k} với ${m} thay vì cộng` }, { value: a * k + m, why: `nhân ${f(a)} với ${k} rồi chỉ cộng thêm ${m}` }],
    brute: () => a * k + a * m,
    outcome: ocTD(c, '01'), skill: 'tinh_nhanh_thua_so_chung',
  };
};

export const QUICKS: GenPool = {
  1: [qkPair, qkNine],
  2: [qkNine, qkMinusNine, qkPair],
  3: [qkFour, qkMinusNine, qkGauss],
  4: [qkAlt, qkGauss, qkFour],
  5: [per(qkFour, qkDist), qkAlt, qkGauss],
};

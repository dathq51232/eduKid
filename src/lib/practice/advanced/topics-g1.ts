// Chuyên đề nâng cao TOÁN LỚP 1: Xếp hàng – vị trí, Tìm số trong ô trống, Quy luật dãy số, Hơn kém – tuổi.
// Chỉ cộng, trừ KHÔNG NHỚ trong phạm vi 100 (phép tính có số lớn hơn 10 luôn không nhớ); lời giải viết rất ngắn.

import type { Rng } from '../rng';
import { KIDS } from '../kit';
import type { GenPool, Problem } from './engine';

/** Cộng / trừ không nhớ (lớp 1): tổng ≤ 10 thì luôn được; lớn hơn thì hàng đơn vị không nhớ */
const addOk = (a: number, b: number) => a + b <= 10 || (a + b <= 100 && (a % 10) + (b % 10) <= 9);
const subOk = (a: number, b: number) => a >= b && (a <= 10 || a % 10 >= b % 10);
function only(lo: number, hi: number, ok: (x: number) => boolean): number | null {
  let found: number | null = null;
  for (let x = lo; x <= hi; x++) if (ok(x)) { if (found !== null) return null; found = x; }
  return found;
}
/** Vét cạn xếp hàng: đặt n bạn vào hàng, trả về vị trí (tính từ trái, bắt đầu 1) của bạn thứ k từ phải */
const fromRight = (n: number, k: number) => { const row = Array.from({ length: n }, (_, i) => i + 1); return row[n - k]; };

// =========================================================================================
// 1. XẾP HÀNG – VỊ TRÍ
// =========================================================================================
/** Biết thứ k từ trái và thứ m từ phải → hàng có k + m − 1 bạn */
const lineBoth = (r: Rng): Problem => {
  const A = r.pick(KIDS);
  const k = r.int(2, 6), m = r.int(2, 10 - k); // k + m ≤ 10: phép cộng không nhớ
  const n = k + m - 1;
  return {
    prompt: `Các bạn xếp thành một hàng. ${A} đứng thứ ${k} tính từ bên trái, thứ ${m} tính từ bên phải. Hỏi hàng có mấy bạn?`,
    answer: n, unit: 'bạn',
    steps: [`Đếm từ trái đến ${A} có ${k} bạn, đếm từ phải đến ${A} có ${m} bạn.`, `${A} được đếm hai lần nên bớt đi 1: ${k} + ${m} − 1 = ${n} (bạn).`],
    traps: [{ value: k + m, why: `đếm ${A} hai lần` }, { value: n - 1, why: 'bớt thừa' }],
    brute: () => only(1, 20, (x) => x >= k && x >= m && fromRight(x, m) === k),
    outcome: 'T1.PT.07', skill: 'xep_hang',
  };
};

/** Trước có a bạn, sau có b bạn → a + b + 1 */
const lineAround = (r: Rng): Problem => {
  const A = r.pick(KIDS);
  const a = r.int(1, 5), b = r.int(1, 9 - a);
  return {
    prompt: `Trong một hàng, đứng trước ${A} có ${a} bạn, đứng sau ${A} có ${b} bạn. Hỏi hàng có tất cả mấy bạn?`,
    answer: a + b + 1, unit: 'bạn',
    steps: [`Số bạn trước và sau ${A}: ${a} + ${b} = ${a + b} (bạn).`, `Thêm cả ${A} nữa: ${a + b} + 1 = ${a + b + 1} (bạn).`],
    traps: [{ value: a + b, why: `quên đếm ${A}` }, { value: a + b + 2, why: 'đếm thừa' }],
    brute: () => only(1, 20, (n) => [...Array(n).keys()].some((i) => i === a && n - 1 - i === b)),
    outcome: 'T1.PT.07', skill: 'xep_hang',
  };
};

/** Hàng n bạn, thứ k từ trái → bên phải có n − k bạn */
const lineRightOf = (r: Rng): Problem => {
  const A = r.pick(KIDS);
  const n = r.int(5, 10), k = r.int(2, n - 1);
  return {
    prompt: `Hàng có ${n} bạn. ${A} đứng thứ ${k} tính từ bên trái. Hỏi bên phải ${A} có mấy bạn?`,
    answer: n - k, unit: 'bạn',
    steps: [`Từ bên trái đến ${A} có ${k} bạn (tính cả ${A}).`, `Bên phải ${A}: ${n} − ${k} = ${n - k} (bạn).`],
    traps: [{ value: n - k + 1, why: `tính cả ${A}` }, { value: k - 1, why: 'đó là số bạn bên trái' }],
    brute: () => n - k,
    outcome: 'T1.PT.07', skill: 'xep_hang',
  };
};

/** Hàng n bạn, thứ k từ trái → thứ n − k + 1 từ phải */
const lineFlip = (r: Rng): Problem => {
  const A = r.pick(KIDS);
  const n = r.int(5, 10), k = r.int(2, n - 1);
  const ans = n - k + 1;
  return {
    prompt: `Hàng có ${n} bạn. ${A} đứng thứ ${k} tính từ bên trái. Hỏi ${A} đứng thứ mấy tính từ bên phải?`,
    answer: ans,
    steps: [`Bên phải ${A} có ${n} − ${k} = ${n - k} (bạn).`, `Đếm từ phải sang thì đến ${A} là bạn thứ ${n - k} + 1 = ${ans}.`],
    traps: [{ value: n - k, why: `quên đếm ${A}` }, { value: k, why: 'lấy vị trí tính từ bên trái' }],
    brute: () => only(1, n, (m) => fromRight(n, m) === k),
    outcome: 'T1.PT.07', skill: 'xep_hang',
  };
};

/** A đứng đầu, B đứng cuối, giữa có c bạn → c + 2 */
const lineEnds = (r: Rng): Problem => {
  const [A, B] = r.sample(KIDS, 2);
  const g = r.int(2, 8);
  return {
    prompt: `${A} đứng đầu hàng, ${B} đứng cuối hàng. Giữa ${A} và ${B} có ${g} bạn. Hỏi hàng có mấy bạn?`,
    answer: g + 2, unit: 'bạn',
    steps: [`Hàng gồm ${A}, ${g} bạn ở giữa và ${B}.`, `${g} + 2 = ${g + 2} (bạn).`],
    traps: [{ value: g + 1, why: 'chỉ thêm một bạn' }, { value: g, why: 'quên đếm hai bạn ở hai đầu' }],
    brute: () => g + 2,
    outcome: 'T1.PT.07', skill: 'xep_hang',
  };
};

/** Hàng n bạn: A thứ k từ trái, B thứ m từ phải → giữa có n − k − m bạn */
const lineBetween = (r: Rng): Problem | null => {
  const [A, B] = r.sample(KIDS, 2);
  const n = r.int(7, 10), k = r.int(1, 4), m = r.int(1, 4);
  const ans = n - k - m;
  if (ans < 1) return null;
  return {
    prompt: `Hàng có ${n} bạn. ${A} đứng thứ ${k} tính từ bên trái, ${B} đứng thứ ${m} tính từ bên phải. Hỏi giữa ${A} và ${B} có mấy bạn?`,
    answer: ans, unit: 'bạn',
    steps: [`Từ bên trái đến ${A} có ${k} bạn, từ bên phải đến ${B} có ${m} bạn.`, `Giữa hai bạn: ${n} − ${k} − ${m} = ${ans} (bạn).`],
    traps: [{ value: ans + 1, why: 'đếm thừa một bạn' }, { value: ans + 2, why: `đếm cả ${A} và ${B}` }],
    brute: () => { const posB = fromRight(n, m); return posB > k ? posB - k - 1 : null; },
    outcome: 'T1.PT.07', skill: 'xep_hang',
  };
};

export const G1_LINES: GenPool = {
  1: [lineAround, lineRightOf],
  2: [lineBoth, lineAround, lineEnds],
  3: [lineFlip, lineBoth, lineRightOf],
  4: [lineBetween, lineFlip, lineEnds],
  5: [lineBetween, lineBoth],
};

// =========================================================================================
// 2. TÌM SỐ TRONG Ô TRỐNG (viết … thay cho ô trống)
// =========================================================================================
/** … + a = b */
const blankAdd = (r: Rng, big = false): Problem | null => {
  const b = big ? r.int(25, 99) : r.int(4, 10);
  const a = big ? r.int(11, b - 10) : r.int(1, b - 1);
  const x = b - a;
  if (!addOk(x, a) || !subOk(b, a)) return null;
  const left = r.chance(0.5);
  return {
    prompt: `Tìm số thích hợp điền vào chỗ chấm: ${left ? `… + ${a}` : `${a} + …`} = ${b}`,
    answer: x,
    steps: [`Số cần tìm cộng với ${a} được ${b}, nên lấy ${b} bớt đi ${a}.`, `${b} − ${a} = ${x}.`],
    traps: [{ value: a + b <= 100 ? a + b : 0, why: 'cộng thay vì trừ' }, { value: x + 1, why: 'tính nhầm' }],
    brute: () => only(0, 100, (v) => v + a === b),
    outcome: big ? 'T1.PT.04' : 'T1.PT.02', skill: 'o_trong_cong',
  };
};

/** a − … = b */
const blankSubRight = (r: Rng, big = false): Problem | null => {
  const a = big ? r.int(30, 99) : r.int(5, 10);
  const x = big ? r.int(11, a - 11) : r.int(1, a - 1);
  const b = a - x;
  if (!subOk(a, x) || !subOk(a, b)) return null;
  return {
    prompt: `Tìm số thích hợp điền vào chỗ chấm: ${a} − … = ${b}`,
    answer: x,
    steps: [`${a} bớt đi một số thì còn ${b}, nên số đó là ${a} − ${b}.`, `${a} − ${b} = ${x}.`],
    traps: [{ value: a + b <= 100 ? a + b : 0, why: 'cộng hai số đã cho' }, { value: b, why: 'chép lại số kết quả' }, { value: x + 10 <= 100 ? x + 10 : 0, why: 'trừ nhầm ở hàng chục' }],
    brute: () => only(0, 100, (v) => a - v === b),
    outcome: big ? 'T1.PT.04' : 'T1.PT.02', skill: 'o_trong_tru',
  };
};

/** … − a = b */
const blankSubLeft = (r: Rng): Problem | null => {
  const a = r.int(1, 5), b = r.int(1, 10 - a);
  const x = a + b;
  return {
    prompt: `Tìm số thích hợp điền vào chỗ chấm: … − ${a} = ${b}`,
    answer: x,
    steps: [`Số cần tìm bớt đi ${a} thì còn ${b}, nên số đó là ${b} thêm ${a}.`, `${b} + ${a} = ${x}.`],
    traps: [{ value: b > a ? b - a : 0, why: 'trừ thay vì cộng' }, { value: x - 1, why: 'tính nhầm' }],
    brute: () => only(0, 100, (v) => v - a === b),
    outcome: 'T1.PT.02', skill: 'o_trong_tru',
  };
};

/** a + … = b + c (hai vế bằng nhau) */
const blankBalance = (r: Rng): Problem | null => {
  const b = r.int(1, 6), cc = r.int(1, 9 - b);
  const s = b + cc;
  const a = r.int(1, s - 1);
  if (a === b || a === cc) return null;
  const x = s - a;
  return {
    prompt: `Tìm số thích hợp điền vào chỗ chấm: ${a} + … = ${b} + ${cc}`,
    answer: x,
    steps: [`Tính vế phải: ${b} + ${cc} = ${s}.`, `${a} cộng với số cần tìm phải bằng ${s}: ${s} − ${a} = ${x}.`],
    traps: [{ value: s, why: `quên bớt ${a}` }, { value: cc, why: 'chép số ở vế phải' }],
    brute: () => only(0, 100, (v) => a + v === b + cc),
    outcome: 'T1.PT.06', skill: 'o_trong_hai_ve',
  };
};

/** … + … = s, số thứ nhất hơn số thứ hai d → tìm số thứ nhất */
const blankTwo = (r: Rng): Problem | null => {
  const small = r.int(1, 4), d = r.int(1, 4);
  const big = small + d, s = big + small;
  if (s > 10) return null;
  return {
    prompt: `Hai số cộng lại bằng ${s}. Số thứ nhất hơn số thứ hai ${d} đơn vị. Hỏi số thứ nhất là bao nhiêu?`,
    answer: big,
    steps: [`Thử lần lượt: hai số có tổng bằng ${s} và hơn kém nhau ${d}.`, `${big} + ${small} = ${s} và ${big} − ${small} = ${d}, vậy số thứ nhất là ${big}.`],
    traps: [{ value: small, why: 'đó là số thứ hai' }, { value: s - d, why: `lấy ${s} bớt ${d}` }],
    brute: () => only(0, s, (x) => x + (x - d) === s && x - d >= 0),
    outcome: 'T1.PT.06', skill: 'o_trong_hai_so',
  };
};

export const G1_BLANKS: GenPool = {
  1: [(r) => blankAdd(r), (r) => blankSubRight(r)],
  2: [blankSubLeft, (r) => blankAdd(r), (r) => blankSubRight(r)],
  3: [blankBalance, blankSubLeft, (r) => blankAdd(r, true)],
  4: [(r) => blankAdd(r, true), (r) => blankSubRight(r, true), blankBalance],
  5: [blankTwo, (r) => blankSubRight(r, true)],
};

// =========================================================================================
// 3. QUY LUẬT DÃY SỐ (lời giải không cần viết phép tính)
// =========================================================================================
const join = (xs: (number | string)[]) => xs.join('; ');
function extend(xs: number[], at: number): number | null {
  const d = xs[1] - xs[0];
  for (let i = 2; i < xs.length; i++) if (xs[i] - xs[i - 1] !== d) return null;
  return xs[xs.length - 1] + d * (at - xs.length + 1);
}
const D_SMALL = [1, 2, 3];
const seqUp = (r: Rng, ds: number[], top: number): Problem => {
  const d = r.pick(ds);
  const a = r.int(0, Math.min(top - 5 * d, 90 - 4 * d)); // cả lựa chọn nhiễu cũng trong phạm vi 100
  const xs = [0, 1, 2, 3].map((i) => a + i * d);
  const ans = a + 4 * d;
  return {
    prompt: `Viết số tiếp theo của dãy: ${join(xs)}; …`,
    answer: ans,
    steps: [`Mỗi số hơn số đứng trước ${d} đơn vị (đếm thêm ${d}).`, `Số tiếp theo là ${ans}.`],
    traps: [{ value: ans + d, why: 'bỏ qua mất một số' }, { value: xs[3] + 1, why: 'chỉ đếm thêm 1' }],
    brute: () => extend(xs, 4),
    outcome: top > 20 ? 'T1.SO.04' : 'T1.SO.03', skill: 'day_dem_them',
  };
};
const seqDown = (r: Rng): Problem => {
  const d = r.pick([1, 2, 10]);
  const ans = d === 10 ? 10 * r.int(1, 5) : r.int(1, 10);
  const xs = [4, 3, 2, 1].map((i) => ans + i * d);
  return {
    prompt: `Viết số tiếp theo của dãy: ${join(xs)}; …`,
    answer: ans,
    steps: [`Dãy giảm dần, mỗi số kém số đứng trước ${d} đơn vị (đếm bớt ${d}).`, `Số tiếp theo là ${ans}.`],
    traps: [{ value: xs[3] + d, why: 'đếm thêm trong khi dãy đang giảm' }, { value: xs[3] - 1, why: 'chỉ đếm bớt 1' }],
    brute: () => extend(xs, 4),
    outcome: 'T1.SO.04', skill: 'day_dem_bot',
  };
};
const seqMissing = (r: Rng): Problem => {
  const d = r.pick([2, 5, 10]);
  const a = d === 10 ? 10 * r.int(0, 5) + r.int(0, 9) : r.int(0, 60);
  const gap = r.int(1, 3);
  const xs = [0, 1, 2, 3, 4].map((i) => a + i * d);
  return {
    prompt: `Tìm số còn thiếu trong dãy: ${join(xs.map((x, i) => (i === gap ? '…' : x)))}`,
    answer: xs[gap],
    steps: [`Mỗi số hơn số đứng trước ${d} đơn vị.`, `Số còn thiếu đứng sau ${xs[gap - 1]} nên là ${xs[gap]}.`],
    traps: [{ value: xs[gap] + d, why: 'đếm thêm một bước nữa' }, { value: xs[gap - 1] + 1, why: 'chỉ đếm thêm 1' }],
    brute: () => only(0, 100, (x) => extend(xs.map((v, i) => (i === gap ? x : v)), 4) !== null),
    outcome: 'T1.SO.04', skill: 'day_thieu',
  };
};
/** Hiệu tăng dần 1, 2, 3, 4… */
const seqGrow = (r: Rng): Problem => {
  const a = r.int(0, 20);
  const xs = [a, a + 1, a + 3, a + 6, a + 10];
  const ans = a + 15;
  return {
    prompt: `Tìm quy luật rồi viết số tiếp theo: ${join(xs)}; …`,
    answer: ans,
    steps: [`Lần lượt đếm thêm 1, rồi 2, rồi 3, rồi 4 đơn vị.`, `Lần tiếp theo đếm thêm 5 đơn vị: số tiếp theo là ${ans}.`],
    traps: [{ value: a + 14, why: 'đếm thêm 4 như lần trước' }, { value: a + 11, why: 'chỉ đếm thêm 1' }],
    brute: () => { const dd = xs.slice(1).map((x, i) => x - xs[i]); return dd.every((v, i) => v === i + 1) ? xs[4] + 5 : null; },
    outcome: 'T1.SO.04', skill: 'day_hieu_tang',
  };
};
/** Hai dãy đan xen */
const seqAlt = (r: Rng): Problem | null => {
  const x0 = r.int(1, 5), y0 = 10 * r.int(1, 4);
  const xs = [x0, y0, x0 + 1, y0 + 10, x0 + 2, y0 + 20];
  const ans = x0 + 3;
  if (y0 + 30 > 100) return null;
  return {
    prompt: `Tìm quy luật rồi viết số tiếp theo: ${join(xs)}; …`,
    answer: ans,
    steps: [`Các số ở vị trí thứ nhất, thứ ba, thứ năm: ${join([xs[0], xs[2], xs[4]])} — đếm thêm 1.`, `Các số ở vị trí thứ hai, thứ tư, thứ sáu: ${join([xs[1], xs[3], xs[5]])} — đếm thêm 10.`, `Số tiếp theo ở vị trí thứ bảy, thuộc dãy đếm thêm 1: ${ans}.`],
    traps: [{ value: y0 + 30, why: 'viết tiếp theo dãy đếm thêm 10' }, { value: xs[5] + 1, why: 'coi cả dãy chỉ đếm thêm 1' }],
    brute: () => extend([xs[0], xs[2], xs[4]], 3),
    outcome: 'T1.SO.04', skill: 'day_dan_xen',
  };
};

export const G1_SEQS: GenPool = {
  1: [(r) => seqUp(r, D_SMALL, 20), (r) => seqUp(r, [10], 100)],
  2: [seqDown, (r) => seqUp(r, [2, 5], 60)],
  3: [seqMissing, (r) => seqUp(r, [5, 10], 100), seqDown],
  4: [seqGrow, seqMissing],
  5: [seqAlt, seqGrow],
};

// =========================================================================================
// 4. HƠN KÉM – TUỔI
// =========================================================================================
const SIB = ['chị', 'anh'];
/** Chị hơn em h tuổi → tuổi chị */
const ageOlder = (r: Rng): Problem => {
  const A = r.pick(KIDS), s = r.pick(SIB);
  const a = r.int(5, 7), h = r.int(1, 10 - a);
  return {
    prompt: `Năm nay ${A} ${a} tuổi, ${s} của ${A} hơn ${A} ${h} tuổi. Hỏi ${s} của ${A} năm nay mấy tuổi?`,
    answer: a + h, unit: 'tuổi',
    steps: [`${s[0].toUpperCase() + s.slice(1)} hơn ${A} ${h} tuổi nên lấy tuổi ${A} thêm ${h}.`, `${a} + ${h} = ${a + h} (tuổi).`],
    traps: [{ value: a > h ? a - h : 0, why: 'trừ thay vì cộng' }, { value: h, why: 'đó là số tuổi hơn' }],
    brute: () => only(0, 20, (x) => x - a === h),
    outcome: 'T1.PT.07', skill: 'hon_kem',
  };
};
/** Hiệu số tuổi không đổi sau n năm */
const ageSameDiff = (r: Rng): Problem => {
  const A = r.pick(KIDS), s = r.pick(SIB);
  const a = r.int(5, 7), h = r.int(2, 10 - a), n = r.int(2, 3);
  return {
    prompt: `Năm nay ${A} ${a} tuổi, ${s} của ${A} ${a + h} tuổi. Hỏi ${n} năm nữa ${s} hơn ${A} mấy tuổi?`,
    answer: h, unit: 'tuổi',
    steps: [`Năm nay ${s} hơn ${A}: ${a + h} − ${a} = ${h} (tuổi).`, `Mỗi năm hai người cùng thêm 1 tuổi, nên ${n} năm nữa ${s} vẫn hơn ${A} ${h} tuổi.`],
    traps: [{ value: h + n, why: 'cộng thêm số năm' }, { value: h > n ? h - n : 0, why: 'trừ đi số năm' }],
    brute: () => (a + h + n) - (a + n),
    outcome: 'T1.PT.07', skill: 'hon_kem_tuoi',
  };
};
/** A có a, B nhiều hơn b → cả hai */
const moreTotal = (r: Rng): Problem | null => {
  const [A, B] = r.sample(KIDS, 2);
  const a = r.int(2, 4), b = r.int(1, 3);
  const tot = a + a + b;
  if (tot > 10) return null;
  return {
    prompt: `${A} có ${a} viên bi. ${B} có nhiều hơn ${A} ${b} viên bi. Hỏi cả hai bạn có bao nhiêu viên bi?`,
    answer: tot, unit: 'viên',
    steps: [`Số bi của ${B}: ${a} + ${b} = ${a + b} (viên).`, `Cả hai bạn: ${a} + ${a + b} = ${tot} (viên).`],
    traps: [{ value: a + b, why: `đó là số bi của ${B}` }, { value: a + b + b, why: 'cộng thừa' }],
    brute: () => only(0, 20, (x) => x === a + (a + b)),
    outcome: 'T1.PT.07', skill: 'hon_kem_hai_buoc',
  };
};
/** Khi em bằng tuổi chị bây giờ thì chị bao nhiêu tuổi */
const ageWhen = (r: Rng): Problem | null => {
  const A = r.pick(KIDS), s = r.pick(SIB);
  const a = r.int(5, 7), h = r.int(2, 10 - a);
  const ans = a + h + h;
  if (!addOk(a + h, h)) return null; // lớp 1: chỉ cộng không nhớ
  return {
    prompt: `Năm nay ${A} ${a} tuổi, ${s} của ${A} ${a + h} tuổi. Hỏi khi ${A} bằng tuổi ${s} bây giờ thì ${s} bao nhiêu tuổi?`,
    answer: ans, unit: 'tuổi',
    steps: [`${s[0].toUpperCase() + s.slice(1)} luôn hơn ${A}: ${a + h} − ${a} = ${h} (tuổi).`, `Khi ${A} ${a + h} tuổi thì ${s}: ${a + h} + ${h} = ${ans} (tuổi).`],
    traps: [{ value: a + h, why: `đó là tuổi ${s} bây giờ` }, { value: a + h + 1, why: 'chỉ thêm 1 tuổi' }],
    brute: () => { for (let n = 0; n < 20; n++) if (a + n === a + h) return a + h + n; return null; },
    outcome: 'T1.PT.07', skill: 'hon_kem_tuoi',
  };
};
/** Ba bạn: A hơn B x, B hơn C y, C có z → A */
const chain = (r: Rng): Problem | null => {
  const [A, B, C] = r.sample(KIDS, 3);
  const z = r.int(1, 4), y = r.int(1, 3), x = r.int(1, 3);
  const ans = z + y + x;
  if (ans > 10) return null;
  return {
    prompt: `${C} có ${z} quyển truyện. ${B} có nhiều hơn ${C} ${y} quyển. ${A} có nhiều hơn ${B} ${x} quyển. Hỏi ${A} có mấy quyển truyện?`,
    answer: ans, unit: 'quyển',
    steps: [`${B} có: ${z} + ${y} = ${z + y} (quyển).`, `${A} có: ${z + y} + ${x} = ${ans} (quyển).`],
    traps: [{ value: z + x, why: `quên tính số truyện của ${B}` }, { value: z + y, why: `đó là số truyện của ${B}` }],
    brute: () => only(0, 20, (v) => v - x === z + y),
    outcome: 'T1.PT.07', skill: 'hon_kem_ba_ban',
  };
};

export const G1_AGES: GenPool = {
  1: [ageOlder, moreTotal],
  2: [ageSameDiff, ageOlder, moreTotal],
  3: [ageSameDiff, moreTotal, chain],
  4: [ageWhen, chain, ageSameDiff],
  5: [ageWhen, chain],
};

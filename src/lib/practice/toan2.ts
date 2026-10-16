// BỘ SINH CÂU — TOÁN 2 (bám trình tự Kết nối tri thức, Toán 2 tập một + tập hai, Bài 1–75).
//
// Mỗi bài chọn dạng câu theo các "mảng kiến thức" của bài (toan2-plan.ts). Mọi số, tình huống và câu chữ sinh ngẫu
// nhiên theo seed — không chép bài tập của sách. Mức L4–L5 có thêm các dạng NÂNG CAO (tìm số chưa biết, quy luật dãy
// số, bài toán hai bước, tuổi, chuyển cho bằng nhau, tổng – hiệu, lập số, đếm đoạn thẳng...), tham khảo các dạng toán
// nâng cao lớp 2 phổ biến, đề do EduChain Kids tự viết.
//
// "Không vượt trước" (npm run check:practice): số không quá phạm vi bài; cộng/trừ có nhớ chỉ khi đã học (carryMax);
// nhân, chia chỉ trong bảng 2 và 5, chỉ từ Bài 37 (nhân) / Bài 41 (chia).

import type { Level } from '../content/types';
import type { T2Lesson, T2Topic } from '../content/toan2-plan';
import type { Figure } from '../figures';
import { KIDS, Q, STUFF, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';

export type T2Ctx = {
  lesson: number;
  max: number;
  carryMax: number; // có nhớ khi tổng / số bị trừ ≤ carryMax (0 = chưa học có nhớ)
  mul: boolean;
  div: boolean;
  topics: T2Topic[];
};
export type T2Template = (r: Rng, c: T2Ctx, l: Level) => PracticeQuestion | null;
export type T2Pool = Record<Level, T2Template[]>;

export function t2Context(p: T2Lesson): T2Ctx {
  const s = p.scope;
  return {
    lesson: p.no,
    max: s.maxNumber,
    carryMax: s.carry ? s.carryMax ?? s.maxNumber : 0,
    mul: s.ops.includes('×'),
    div: s.ops.includes(':'),
    topics: p.topics,
  };
}

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });
const MINUS = '−';
const sym = (op: Op) => (op === '+' ? '+' : op === '-' ? MINUS : op === '*' ? '×' : ':');
type Op = '+' | '-' | '*' | '/';
const calc = (a: number, op: Op, b: number) => (op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
const fmt = (n: number) => String(n);

// ------------------------------------------------------------------- số và cách đọc
const DIGIT = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
function read2(n: number): string {
  if (n < 10) return DIGIT[n];
  const t = Math.floor(n / 10), u = n % 10;
  const head = t === 1 ? 'mười' : `${DIGIT[t]} mươi`;
  if (!u) return head;
  return `${head} ${u === 5 ? 'lăm' : u === 1 && t > 1 ? 'mốt' : u === 4 && t > 1 ? 'tư' : DIGIT[u]}`;
}
/** Cách đọc số 0–1000: 305 → "ba trăm linh năm", 415 → "bốn trăm mười lăm" */
export function readVi3(n: number): string {
  if (n === 1000) return 'một nghìn';
  if (n < 100) return read2(n);
  const h = Math.floor(n / 100), rest = n % 100;
  if (!rest) return `${DIGIT[h]} trăm`;
  if (rest < 10) return `${DIGIT[h]} trăm linh ${DIGIT[rest]}`;
  return `${DIGIT[h]} trăm ${read2(rest)}`;
}

const hasCarry = (a: number, b: number) => {
  for (; a > 0 || b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10)) if ((a % 10) + (b % 10) > 9) return true;
  return false;
};
const hasBorrow = (a: number, b: number) => {
  for (; b > 0; a = Math.floor(a / 10), b = Math.floor(b / 10)) if (a % 10 < b % 10) return true;
  return false;
};
/** Phép tính được phép dùng trong bài (có nhớ đúng lúc) */
function okOp(c: T2Ctx, a: number, op: Op, b: number): boolean {
  if (op === '+') {
    const s = a + b;
    return s <= c.max && (!hasCarry(a, b) || s <= 10 || s <= c.carryMax);
  }
  if (op === '-') return b <= a && (!hasBorrow(a, b) || a <= 10 || a <= c.carryMax);
  if (op === '*') return c.mul && ((a === 2 || a === 5) ? b <= 10 : (b === 2 || b === 5) && a <= 10);
  return c.div && (b === 2 || b === 5) && a % b === 0 && a / b <= 10;
}

/** Lựa chọn số: đáp án + các số nhiễu hợp lệ (không âm, ≤ max), đảo thứ tự */
function numChoices(r: Rng, correct: number, wrong: number[], max: number): string[] | null {
  const opts = [...new Set([correct, ...wrong.filter((x) => Number.isInteger(x) && x >= 0 && x <= max && x !== correct)])].slice(0, 4);
  return opts.length >= 3 ? r.shuffle(opts).map(String) : null;
}
function mixRows(r: Rng, rows: [string, boolean][]): [string, boolean][] | null {
  if (rows.length < 3 || rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return r.shuffle(rows);
}
const seqFig = (cells: string[]): Figure => ({ kind: 'sequence', cells, alt: `Dãy số: ${cells.join(', ')}` });
const colFig = (a: number, op: '+' | '-', b: number, res: number): Figure => ({
  kind: 'column', a: String(a), b: String(b), op: op === '+' ? '+' : '−', result: '?'.repeat(String(res).length), alt: `Phép tính ${a} ${sym(op)} ${b} đặt theo cột`,
});

// ------------------------------------------------------------------- chọn cặp số theo kiểu phép tính
type PairKind = 'nc100' | 'cross20' | 'c21' | 'c22' | 'nc3' | 'c3';
function addPair(r: Rng, c: T2Ctx, kind: PairKind): [number, number] | null {
  for (let i = 0; i < 40; i++) {
    let a = 0, b = 0;
    if (kind === 'nc100') { a = r.int(11, 88); b = r.int(1, 99 - a); }
    if (kind === 'cross20') { a = r.int(2, 9); b = r.int(11 - a, 9); }
    if (kind === 'c21') { a = r.int(12, 89); b = r.int(2, 9); }
    if (kind === 'c22') { a = r.int(11, 79); b = r.int(11, 99 - a); }
    if (kind === 'nc3') { a = r.int(101, 888); b = r.int(10, 999 - a); }
    if (kind === 'c3') { a = r.int(105, 850); b = r.int(15, 999 - a); }
    if (a + b > c.max || b < 1) continue;
    const carry = hasCarry(a, b);
    if (kind === 'nc100' || kind === 'nc3') { if (carry) continue; } else if (!carry) continue;
    if (kind === 'cross20' && a + b <= 10) continue;
    if (okOp(c, a, '+', b)) return r.chance(0.5) || kind === 'c21' ? [a, b] : [b, a];
  }
  return null;
}
function subPair(r: Rng, c: T2Ctx, kind: PairKind): [number, number] | null {
  const p = addPair(r, c, kind);
  if (!p) return null;
  const [x, y] = p;
  const a = x + y;
  const b = kind === 'c21' ? Math.min(x, y) : r.pick([x, y]);
  if (kind === 'c21' && b >= 10) return null;
  return okOp(c, a, '-', b) && (kind === 'nc100' || kind === 'nc3' ? !hasBorrow(a, b) : hasBorrow(a, b) || kind === 'cross20') ? [a, b] : null;
}
/** Kiểu phép cộng/trừ hợp với bài (theo mảng kiến thức) */
function kindsOf(c: T2Ctx): PairKind[] {
  const t = c.topics;
  const out: PairKind[] = [];
  if (t.some((x) => ['add20', 'sub20', 'table20', 'word20', 'more20', 'kg', 'litre'].includes(x))) out.push('cross20');
  if (t.some((x) => ['add21', 'sub21'].includes(x))) out.push('c21');
  if (t.some((x) => ['add22', 'sub22', 'word100', 'time', 'date', 'mulWord'].includes(x))) out.push('c22');
  if (t.some((x) => ['add3nc', 'sub3nc'].includes(x))) out.push('nc3');
  if (t.some((x) => ['add3c', 'sub3c', 'word1000', 'tally', 'picto', 'chance', 'money'].includes(x)) && c.carryMax >= 1000) out.push('c3');
  if (!out.length) out.push(c.max >= 1000 ? 'nc3' : 'nc100');
  return out;
}
const pairOp = (r: Rng, c: T2Ctx, op: '+' | '-', kind = r.pick(kindsOf(c))) => (op === '+' ? addPair(r, c, kind) : subPair(r, c, kind));
const subAllowed = (c: T2Ctx) => !c.topics.every((t) => ['add20', 'table20', 'add21', 'add22', 'add3nc', 'add3c'].includes(t)) || c.lesson >= 11;
const opsFor = (c: T2Ctx): ('+' | '-')[] => {
  const t = c.topics;
  if (t.length && t.every((x) => ['add20', 'add21', 'add22', 'add3nc', 'add3c'].includes(x))) return ['+'];
  if (t.length && t.every((x) => ['sub20', 'sub21', 'sub22', 'sub3nc', 'sub3c'].includes(x))) return ['-'];
  return subAllowed(c) ? ['+', '-'] : ['+'];
};

const columnWhy = (a: number, op: '+' | '-', b: number) => {
  const res = calc(a, op, b);
  const carry = op === '+' ? hasCarry(a, b) : hasBorrow(a, b);
  return `Đặt tính thẳng cột, tính từ hàng đơn vị sang trái${carry ? (op === '+' ? ', nhớ 1 sang hàng bên trái khi tổng một hàng từ 10 trở lên' : ', khi chữ số trên bé hơn thì mượn 1 chục (trả 1 vào hàng bên trái)') : ''}. ${fmt(a)} ${sym(op)} ${fmt(b)} = ${fmt(res)}.`;
};
const opOutcome = (c: T2Ctx) => (c.max >= 1000 ? 'T2.PT.04' : c.carryMax >= 100 ? 'T2.PT.03' : c.carryMax >= 20 ? 'T2.PT.02' : 'T2.PT.01');

// =========================================================================== CỘNG, TRỪ
const calcFill: T2Template = (r, c, l) => {
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  return Q.blanks('Tính.', [`${fmt(a)} ${sym(op)} ${fmt(b)} = {}`], [[res]], M(opOutcome(c), 'TOAN.TINH', op === '+' ? 'cong' : 'tru', l, columnWhy(a, op, b)));
};
const columnFill: T2Template = (r, c, l) => {
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p || p[0] < 10) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  return Q.blanks(`Đặt tính rồi tính: ${fmt(a)} ${sym(op)} ${fmt(b)}`, [`${fmt(a)} ${sym(op)} ${fmt(b)} = {}`], [[res]],
    M(opOutcome(c), 'TOAN.TINH', 'dat_tinh', l, columnWhy(a, op, b)), { figure: colFig(a, op, b, res) });
};
const pickResult: T2Template = (r, c, l) => {
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  // Lỗi hay gặp: quên nhớ / quên trả (lệch 10), lệch 1
  const opts = numChoices(r, res, [op === '+' ? res - 10 : res + 10, res + 1, res - 1, res + 10], c.max);
  if (!opts) return null;
  return Q.sc(`${fmt(a)} ${sym(op)} ${fmt(b)} = ?`, opts, String(res), M(opOutcome(c), 'TOAN.TINH', op === '+' ? 'cong' : 'tru', l, columnWhy(a, op, b)));
};
const makeTen: T2Template = (r, c, l) => {
  if (!c.topics.some((t) => ['add20', 'table20', 'sub20'].includes(t))) return null;
  if (c.topics.includes('sub20') && !c.topics.includes('add20') && !c.topics.includes('table20')) {
    // 13 − 5 = 13 − 3 − 2
    const a = r.int(11, 18), b = r.int(a - 9, 9);
    if (b <= a - 10) return null;
    const first = a - 10, rest = b - first;
    return Q.blanks('Tách số để trừ qua 10.', [`${a} ${MINUS} ${b} = ${a} ${MINUS} ${first} ${MINUS} {}`, `= 10 ${MINUS} {}`, `= {}`], [[rest, rest, a - b]],
      M('T2.PT.02', 'TOAN.TINH', 'tru_qua_10', l, `Tách ${b} = ${first} + ${rest}. Ta có ${a} ${MINUS} ${first} = 10, rồi 10 ${MINUS} ${rest} = ${a - b}.`));
  }
  const a = r.int(6, 9), b = r.int(11 - a, 9);
  const need = 10 - a, rest = b - need;
  return Q.blanks('Tách số để cộng qua 10.', [`${a} + ${b} = ${a} + ${need} + {}`, `= 10 + {}`, `= {}`], [[rest, rest, a + b]],
    M('T2.PT.02', 'TOAN.TINH', 'cong_qua_10', l, `${a} cần thêm ${need} để được 10. Tách ${b} = ${need} + ${rest}, rồi 10 + ${rest} = ${a + b}.`));
};
const tfTable: T2Template = (r, c, l) => {
  const rows: [string, boolean][] = [];
  for (let i = 0; i < 6 && rows.length < 4; i++) {
    const op = r.pick(opsFor(c));
    const p = pairOp(r, c, op);
    if (!p) continue;
    const res = calc(p[0], op, p[1]);
    const ok = r.chance(0.5);
    const shown = ok ? res : res + r.pick([1, -1, 10, -10]);
    if (shown < 0 || shown > c.max) continue;
    rows.push([`${fmt(p[0])} ${sym(op)} ${fmt(p[1])} = ${fmt(shown)}`, ok]);
  }
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M(opOutcome(c), 'TOAN.DUNGSAI', 'kiem_tra', l, 'Tính lại từng phép tính rồi so với kết quả đã ghi.'));
};
const compareExpr: T2Template = (r, c, l) => {
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p) return null;
  const res = calc(p[0], op, p[1]);
  const other = res + r.pick([-2, -1, 0, 1, 2, 10, -10]);
  if (other < 0 || other > c.max) return null;
  const sign = res > other ? '>' : res < other ? '<' : '=';
  return Q.sc(`${fmt(p[0])} ${sym(op)} ${fmt(p[1])} ? ${fmt(other)}`, ['>', '<', '='], sign,
    M(opOutcome(c), 'TOAN.SOSANH', 'so_sanh_phep_tinh', l, `${fmt(p[0])} ${sym(op)} ${fmt(p[1])} = ${fmt(res)}; ${fmt(res)} ${sign} ${fmt(other)}.`));
};
const missingAddend: T2Template = (r, c, l) => {
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  if (op === '+') return Q.blanks('Tìm số thích hợp.', [`${fmt(a)} + {} = ${fmt(res)}`], [[b]],
    M('T2.TD.01', 'TOAN.TIMX', 'tim_so_hang', l, `Số hạng chưa biết = tổng trừ số hạng đã biết: ${fmt(res)} ${MINUS} ${fmt(a)} = ${fmt(b)}.`));
  return r.chance(0.5)
    ? Q.blanks('Tìm số thích hợp.', [`{} ${MINUS} ${fmt(b)} = ${fmt(res)}`], [[a]],
      M('T2.TD.01', 'TOAN.TIMX', 'tim_so_bi_tru', l, `Số bị trừ = hiệu cộng số trừ: ${fmt(res)} + ${fmt(b)} = ${fmt(a)}.`))
    : Q.blanks('Tìm số thích hợp.', [`${fmt(a)} ${MINUS} {} = ${fmt(res)}`], [[b]],
      M('T2.TD.01', 'TOAN.TIMX', 'tim_so_tru', l, `Số trừ = số bị trừ trừ hiệu: ${fmt(a)} ${MINUS} ${fmt(res)} = ${fmt(b)}.`));
};
const chainCalc: T2Template = (r, c, l) => {
  // a + b − d (từng bước đều hợp lệ)
  const p = pairOp(r, c, '+');
  if (!p || !subAllowed(c)) return null;
  const s = p[0] + p[1];
  const d = r.int(1, Math.min(s - 1, c.max >= 1000 ? 300 : 30));
  if (!okOp(c, s, '-', d)) return null;
  return Q.blanks('Tính (từ trái sang phải).', [`${fmt(p[0])} + ${fmt(p[1])} ${MINUS} ${fmt(d)} = {}`], [[s - d]],
    M('T2.PT.06', 'TOAN.TINH', 'hai_dau_tinh', l, `Tính từ trái sang phải: ${fmt(p[0])} + ${fmt(p[1])} = ${fmt(s)}; ${fmt(s)} ${MINUS} ${fmt(d)} = ${fmt(s - d)}.`));
};

// ------------------------------------------------------------------- bài toán có lời văn
const thing = (r: Rng) => r.pick(STUFF).unit;
const kid = (r: Rng, not?: string) => r.pick(KIDS.filter((k) => k !== not));
const wordAddSub: T2Template = (r, c, l) => {
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  const s = thing(r);
  const k1 = kid(r);
  const prompt = op === '+'
    ? r.pick([`${k1} có ${fmt(a)} ${s}. Mẹ cho ${k1} thêm ${fmt(b)} ${s}. Hỏi ${k1} có tất cả bao nhiêu ${s}?`,
      `Buổi sáng cửa hàng bán được ${fmt(a)} ${s}, buổi chiều bán được ${fmt(b)} ${s}. Hỏi cả ngày cửa hàng bán được bao nhiêu ${s}?`])
    : r.pick([`${k1} có ${fmt(a)} ${s}. ${k1} cho bạn ${fmt(b)} ${s}. Hỏi ${k1} còn lại bao nhiêu ${s}?`,
      `Trong kho có ${fmt(a)} ${s}. Người ta lấy đi ${fmt(b)} ${s}. Hỏi trong kho còn lại bao nhiêu ${s}?`]);
  return Q.blanks(prompt, [`Phép tính: ${fmt(a)} ${sym(op)} ${fmt(b)} = {}`, `Đáp số: {} ${s}`], [[res, res]],
    M('T2.PT.05', 'TOAN.LOIVAN', op === '+' ? 'loi_van_them' : 'loi_van_bot', l, `${op === '+' ? 'Thêm vào thì làm phép cộng' : 'Bớt đi thì làm phép trừ'}: ${fmt(a)} ${sym(op)} ${fmt(b)} = ${fmt(res)} (${s}).`));
};
const wordMoreLess: T2Template = (r, c, l) => {
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  const k1 = kid(r), k2 = kid(r, k1);
  const s = thing(r);
  const prompt = op === '+'
    ? `${k1} có ${fmt(a)} ${s}. ${k2} có nhiều hơn ${k1} ${fmt(b)} ${s}. Hỏi ${k2} có bao nhiêu ${s}?`
    : `${k1} có ${fmt(a)} ${s}. ${k2} có ít hơn ${k1} ${fmt(b)} ${s}. Hỏi ${k2} có bao nhiêu ${s}?`;
  return Q.blanks(prompt, [`${fmt(a)} ${sym(op)} ${fmt(b)} = {}`, `Đáp số: {} ${s}`], [[res, res]],
    M('T2.PT.05', 'TOAN.LOIVAN', op === '+' ? 'nhieu_hon' : 'it_hon', l, `"Nhiều hơn" thì cộng, "ít hơn" thì trừ: ${fmt(a)} ${sym(op)} ${fmt(b)} = ${fmt(res)} (${s}).`));
};
const pickOperation: T2Template = (r, c, l) => {
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const s = thing(r);
  const k1 = kid(r);
  const prompt = op === '+' ? `${k1} có ${fmt(a)} ${s}, được tặng thêm ${fmt(b)} ${s}. Muốn biết ${k1} có bao nhiêu ${s}, em làm phép tính nào?`
    : `${k1} có ${fmt(a)} ${s}, đã dùng hết ${fmt(b)} ${s}. Muốn biết ${k1} còn bao nhiêu ${s}, em làm phép tính nào?`;
  const right = `${fmt(a)} ${sym(op)} ${fmt(b)}`;
  const wrong = `${fmt(a)} ${sym(op === '+' ? '-' : '+')} ${fmt(b)}`;
  if (op === '-' && !okOp(c, a, '+', b)) return null;
  if (op === '+' && !okOp(c, a, '-', b)) return null;
  return Q.sc(prompt, r.shuffle([right, wrong]), right, M('T2.PT.05', 'TOAN.LOIVAN', 'chon_phep_tinh', l, op === '+' ? 'Được thêm thì làm phép cộng.' : 'Dùng bớt đi thì làm phép trừ.'));
};

// =========================================================================== SỐ ĐẾN 100, TIA SỐ, THÀNH PHẦN, HƠN KÉM
const readNum: T2Template = (r, c, l) => {
  const n = c.max >= 1000 ? r.int(101, 999) : r.int(21, 99);
  const wrongs = [n + 10, n - 10, n + 1, Number(String(n).split('').reverse().join(''))];
  const opts = [...new Set([n, ...wrongs].filter((x) => x > 0 && x <= c.max && x !== 0))].slice(0, 4);
  if (opts.length < 3) return null;
  return Q.sc(`Số "${readVi3(n)}" viết là:`, r.shuffle(opts).map(String), String(n),
    M(c.max >= 1000 ? 'T2.SO.02' : 'T2.SO.01', 'TOAN.DOCVIET', 'doc_viet_so', l, `"${readVi3(n)}" viết là ${n}.`));
};
const writeReading: T2Template = (r, c, l) => {
  const n = c.max >= 1000 ? r.pick([r.int(101, 999), r.int(1, 9) * 100 + r.int(1, 9)]) : r.int(21, 99);
  const right = readVi3(n);
  const alt = [readVi3(Math.min(c.max, n + 1)), readVi3(Math.max(1, n - 10)), n % 10 === 5 && n % 100 > 10 ? right.replace(/lăm$/, 'năm') : n % 10 === 1 && n % 100 > 20 ? right.replace(/mốt$/, 'một') : readVi3(Math.max(1, n - 1))];
  const opts = [...new Set([right, ...alt])].slice(0, 4);
  if (opts.length < 3) return null;
  return Q.sc(`Số ${n} đọc là:`, r.shuffle(opts), right, M(c.max >= 1000 ? 'T2.SO.02' : 'T2.SO.01', 'TOAN.DOCVIET', 'doc_so', l, `${n} đọc là "${right}".`));
};
const tensUnits: T2Template = (r, c, l) => {
  const t = r.int(1, 9), u = r.int(0, 9);
  const n = t * 10 + u;
  return Q.blanks('Viết số.', [`Số gồm ${t} chục và ${u} đơn vị là {}`], [[n]], M('T2.SO.01', 'TOAN.DOCVIET', 'chuc_don_vi', l, `${t} chục và ${u} đơn vị viết là ${n}.`));
};
const neighbors: T2Template = (r, c, l) => {
  const n = c.max >= 1000 ? r.int(101, 998) : r.int(11, 98);
  return Q.blanks('Viết số liền trước, số liền sau.', [`Số liền trước của ${n} là {}`, `Số liền sau của ${n} là {}`], [[n - 1, n + 1]],
    M('T2.SO.01', 'TOAN.DOCVIET', 'lien_truoc_sau', l, `Số liền trước bé hơn 1 đơn vị: ${n - 1}; số liền sau lớn hơn 1 đơn vị: ${n + 1}.`));
};
const rayFill: T2Template = (r, c, l) => {
  const step = r.pick(c.max >= 1000 ? [1, 10, 100] : [1, 2, 5, 10]);
  const start = step === 100 ? 100 * r.int(1, 3) : step === 10 ? 10 * r.int(1, c.max >= 1000 ? 40 : 3) : r.int(10, c.max >= 1000 ? 900 : 60);
  const cells = Array.from({ length: 6 }, (_, i) => start + i * step);
  if (cells[5] > c.max) return null;
  const hide = r.sample([1, 2, 3, 4, 5], 2).sort((a, b) => a - b);
  const shown = cells.map((x, i) => (hide.includes(i) ? '?' : String(x)));
  return Q.blanks('Viết số thích hợp vào chỗ "?" trên tia số.', hide.map((i) => `Ô thứ ${i + 1}: {}`), [hide.map((i) => cells[i])],
    M('T2.SO.01', 'TOAN.SOTHIEU', 'tia_so', l, `Hai vạch liền nhau trên tia số hơn kém nhau ${step} đơn vị. Dãy đầy đủ là ${cells.join(', ')}.`), { figure: seqFig(shown) });
};
const compareNums: T2Template = (r, c, l) => {
  const a = c.max >= 1000 ? r.int(100, 999) : r.int(10, 99);
  const b = r.chance(0.2) ? a : c.max >= 1000 ? r.pick([a + 10, a - 10, a + 1, a - 1, a + 100, Number(String(a).split('').reverse().join(''))]) : r.pick([a + 1, a - 1, a + 10, a - 10, Number(String(a).split('').reverse().join(''))]);
  if (b < 1 || b > c.max) return null;
  const sign = a > b ? '>' : a < b ? '<' : '=';
  return Q.sc(`${a} ? ${b}`, ['>', '<', '='], sign, M(c.max >= 1000 ? 'T2.SO.04' : 'T2.SO.01', 'TOAN.SOSANH', 'so_sanh', l,
    c.max >= 1000 ? 'So sánh chữ số hàng trăm trước, bằng nhau thì so hàng chục, rồi hàng đơn vị.' : 'So sánh chữ số hàng chục trước, bằng nhau thì so hàng đơn vị.'));
};
const orderNums: T2Template = (r, c, l) => {
  const big = c.max >= 1000;
  const set = new Set<number>();
  while (set.size < 4) set.add(big ? r.int(100, 999) : r.int(10, 99));
  const nums = [...set];
  const asc = r.chance(0.5);
  const sorted = [...nums].sort((a, b) => (asc ? a - b : b - a));
  return Q.ord(`Sắp xếp các số theo thứ tự từ ${asc ? 'bé đến lớn' : 'lớn đến bé'}.`, sorted.map(String),
    M(big ? 'T2.SO.04' : 'T2.SO.01', 'TOAN.SAPXEP', 'sap_xep', l, `Thứ tự đúng: ${sorted.join(', ')}.`));
};
const partsName: T2Template = (r, c, l) => {
  const op = r.pick(subAllowed(c) || c.lesson >= 3 ? ['+', '-'] as const : ['+'] as const);
  const p = op === '+' ? addPair(r, c, 'nc100') : subPair(r, c, 'nc100');
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  const names = op === '+' ? ['số hạng', 'số hạng', 'tổng'] : ['số bị trừ', 'số trừ', 'hiệu'];
  const idx = r.int(0, 2);
  const val = [a, b, res][idx];
  const right = names[idx];
  const opts = ['số hạng', 'tổng', 'số bị trừ', 'số trừ', 'hiệu'];
  return Q.sc(`Trong phép tính ${a} ${sym(op)} ${b} = ${res}, số ${val} gọi là gì?`, r.sample(opts.filter((o) => o !== right), 2).concat(right).sort(), right,
    M('T2.PT.01', 'TOAN.HINH', 'thanh_phan', l, op === '+' ? `${a} và ${b} là các số hạng, ${res} là tổng.` : `${a} là số bị trừ, ${b} là số trừ, ${res} là hiệu.`));
};
const partsCompute: T2Template = (r, c, l) => {
  const p = addPair(r, c, 'nc100');
  if (!p) return null;
  const [a, b] = p;
  return r.chance(0.5)
    ? Q.blanks('Tính tổng.', [`Số hạng ${a}, số hạng ${b}. Tổng là {}`], [[a + b]], M('T2.PT.01', 'TOAN.TINH', 'tinh_tong', l, `Tổng = ${a} + ${b} = ${a + b}.`))
    : Q.blanks('Tính hiệu.', [`Số bị trừ ${a + b}, số trừ ${b}. Hiệu là {}`], [[a]], M('T2.PT.01', 'TOAN.TINH', 'tinh_hieu', l, `Hiệu = ${a + b} ${MINUS} ${b} = ${a}.`));
};
const diffHowMuch: T2Template = (r, c, l) => {
  const p = c.carryMax >= 100 ? subPair(r, c, 'c22') : subPair(r, c, 'nc100');
  if (!p) return null;
  const [a, b] = p;
  const k1 = kid(r), k2 = kid(r, k1);
  return r.chance(0.5)
    ? Q.blanks(`Số ${a} hơn số ${b} bao nhiêu đơn vị?`, [`${a} ${MINUS} ${b} = {}`], [[a - b]], M('T2.PT.05', 'TOAN.LOIVAN', 'hon_kem', l, `Muốn biết hơn bao nhiêu, lấy số lớn trừ số bé: ${a} ${MINUS} ${b} = ${a - b}.`))
    : Q.blanks(`${k1} cao ${a} cm, ${k2} cao ${b} cm. Hỏi ${k2} thấp hơn ${k1} bao nhiêu xăng-ti-mét?`, [`${a} ${MINUS} ${b} = {}`, 'Đáp số: {} cm'], [[a - b, a - b]],
      M('T2.PT.05', 'TOAN.LOIVAN', 'hon_kem', l, `Lấy số đo lớn trừ số đo bé: ${a} ${MINUS} ${b} = ${a - b} (cm).`));
};

// =========================================================================== KHỐI LƯỢNG, DUNG TÍCH, ĐỘ DÀI, TIỀN
const unitPick: T2Template = (r, c, l) => {
  const items: [string, string][] = [];
  if (c.topics.includes('kg') || c.topics.includes('litre')) items.push(['Bao gạo nặng khoảng 10 ...', 'kg'], ['Can nước chứa được 5 ...', 'l'], ['Quả dưa hấu nặng khoảng 3 ...', 'kg'], ['Bình sữa của em chứa khoảng 1 ...', 'l'], ['Con gà nặng khoảng 2 ...', 'kg'], ['Thùng nước sơn chứa 18 ...', 'l']);
  if (c.topics.includes('length')) items.push(['Chiếc bút chì dài khoảng 15 ...', 'cm'], ['Bảng lớp học dài khoảng 3 ...', 'm'], ['Quãng đường từ nhà em đến thành phố dài khoảng 30 ...', 'km'], ['Gang tay của em dài khoảng 1 ...', 'dm'], ['Phòng học dài khoảng 8 ...', 'm']);
  if (!items.length) return null;
  const [p, u] = r.pick(items);
  const units = ['kg', 'l'].includes(u) ? ['kg', 'l', 'cm'] : ['cm', 'dm', 'm', 'km'];
  return Q.sc(`Chọn đơn vị thích hợp: ${p}`, units, u, M(c.topics.includes('length') ? 'T2.DL.04' : 'T2.DL.01', 'TOAN.DOLUONG', 'chon_don_vi', l, `Câu đúng: ${p.replace('...', u)}.`));
};
const measureCalc: T2Template = (r, c, l) => {
  const u = r.pick(([] as string[]).concat(c.topics.includes('kg') ? ['kg'] : [], c.topics.includes('litre') ? ['l'] : [], c.topics.includes('length') ? ['m', 'cm', 'km'] : []));
  if (!u) return null;
  const op = r.pick(opsFor(c));
  const p = pairOp(r, c, op);
  if (!p) return null;
  const res = calc(p[0], op, p[1]);
  return Q.blanks('Tính.', [`${fmt(p[0])} ${u} ${sym(op)} ${fmt(p[1])} ${u} = {} ${u}`], [[res]], M('T2.DL.01', 'TOAN.DOLUONG', 'tinh_don_vi', l, `Tính như với số tự nhiên rồi ghi đơn vị: ${fmt(p[0])} ${sym(op)} ${fmt(p[1])} = ${fmt(res)} (${u}).`));
};
const heavierWord: T2Template = (r, c, l) => {
  const isKg = c.topics.includes('kg') && (!c.topics.includes('litre') || r.chance(0.5));
  if (!isKg && !c.topics.includes('litre')) return null;
  const p = pairOp(r, c, r.pick(opsFor(c)));
  if (!p) return null;
  const [a, b] = p;
  if (isKg) {
    const op = r.pick(opsFor(c));
    if (op === '+' && okOp(c, a, '+', b)) return Q.blanks(`Bao thứ nhất nặng ${a} kg, bao thứ hai nặng ${b} kg. Hỏi cả hai bao nặng bao nhiêu ki-lô-gam?`, [`${a} + ${b} = {}`, 'Đáp số: {} kg'], [[a + b, a + b]],
      M('T2.DL.01', 'TOAN.LOIVAN', 'kg_loi_van', l, `Cả hai bao: ${a} + ${b} = ${a + b} (kg).`));
    const big = Math.max(a, b), small = Math.min(a, b);
    if (!okOp(c, big, '-', small)) return null;
    return Q.blanks(`Quả bí nặng ${big} kg, quả dưa nhẹ hơn quả bí ${small} kg. Hỏi quả dưa nặng bao nhiêu ki-lô-gam?`, [`${big} ${MINUS} ${small} = {}`, 'Đáp số: {} kg'], [[big - small, big - small]],
      M('T2.DL.01', 'TOAN.LOIVAN', 'kg_loi_van', l, `"Nhẹ hơn" thì trừ: ${big} ${MINUS} ${small} = ${big - small} (kg).`));
  }
  if (!okOp(c, a, '+', b)) return null;
  return Q.blanks(`Can thứ nhất có ${a} l nước mắm, can thứ hai có ${b} l. Hỏi cả hai can có bao nhiêu lít?`, [`${a} + ${b} = {}`, 'Đáp số: {} l'], [[a + b, a + b]],
    M('T2.DL.01', 'TOAN.LOIVAN', 'lit_loi_van', l, `Cả hai can: ${a} + ${b} = ${a + b} (l).`));
};
const lengthConvert: T2Template = (r, c, l) => {
  if (!c.topics.includes('length')) return null;
  const facts: [string, number, string][] = [['1 dm = {} cm', 10, '1 đề-xi-mét bằng 10 xăng-ti-mét.'], ['1 m = {} dm', 10, '1 mét bằng 10 đề-xi-mét.'], ['1 m = {} cm', 100, '1 mét bằng 100 xăng-ti-mét.'], ['1 km = {} m', 1000, '1 ki-lô-mét bằng 1000 mét.']];
  const k = r.int(2, 9);
  const mult: [string, number, string][] = [[`${k} dm = {} cm`, k * 10, `${k} dm = ${k} chục cm = ${k * 10} cm.`], [`${k} m = {} dm`, k * 10, `${k} m = ${k * 10} dm.`], [`${k * 10} cm = {} dm`, k, `10 cm = 1 dm nên ${k * 10} cm = ${k} dm.`]];
  const [line, ans, why] = l <= 2 ? r.pick(facts) : r.pick(mult);
  return Q.blanks('Viết số thích hợp.', [line], [[ans]], M('T2.DL.04', 'TOAN.DOLUONG', 'doi_don_vi', l, why));
};
const lengthCompare: T2Template = (r, c, l) => {
  if (!c.topics.includes('length')) return null;
  const m = r.int(1, 9);
  const dm = m * 10 + r.pick([-3, -1, 0, 2, 5]);
  if (dm <= 0) return null;
  const sign = m * 10 > dm ? '>' : m * 10 < dm ? '<' : '=';
  return Q.sc(`${m} m ? ${dm} dm`, ['>', '<', '='], sign, M('T2.DL.04', 'TOAN.DOLUONG', 'so_sanh_do_dai', l, `${m} m = ${m * 10} dm; ${m * 10} dm ${sign} ${dm} dm.`));
};
const NOTES = [100, 200, 500, 1000];
const moneySum: T2Template = (r, c, l) => {
  if (!c.topics.includes('money')) return null;
  const a = r.pick(NOTES.slice(0, 3)), b = r.pick(NOTES.slice(0, 3)), d = r.pick([100, 200]);
  const total = a + b + d;
  if (total > 1000) return null;
  return Q.blanks(`Em có một tờ ${a} đồng, một tờ ${b} đồng và một tờ ${d} đồng. Em có tất cả bao nhiêu tiền?`, ['{} đồng'], [[total]],
    M('T2.DL.05', 'TOAN.DOLUONG', 'cong_tien', l, `${a} + ${b} + ${d} = ${total} (đồng).`));
};
const moneyChange: T2Template = (r, c, l) => {
  if (!c.topics.includes('money')) return null;
  const [big, small] = r.pick([[1000, 500], [1000, 200], [500, 100], [200, 100], [1000, 100]] as [number, number][]);
  const n = big / small;
  return Q.blanks(`Đổi một tờ ${big} đồng được bao nhiêu tờ ${small} đồng?`, ['{} tờ'], [[n]],
    M('T2.DL.05', 'TOAN.DOLUONG', 'doi_tien', l, `${n} tờ ${small} đồng là ${big} đồng${small === 100 ? '' : ` (cộng ${n} lần ${small})`}.`));
};
const moneyShop: T2Template = (r, c, l) => {
  if (!c.topics.includes('money')) return null;
  // Trước Bài 62 (chưa học trừ có nhớ trong phạm vi 1000): tiền đưa và giá đều tròn trăm, không phải mượn
  const pay = c.carryMax >= 1000 ? 1000 : 100 * r.int(5, 9);
  const price = c.carryMax >= 1000 ? r.pick([150, 250, 300, 450, 600, 700, 850]) : 100 * r.int(1, pay / 100 - 1);
  return Q.blanks(`Mai mua một quyển vở giá ${price} đồng và đưa cô bán hàng ${pay} đồng. Cô trả lại Mai bao nhiêu tiền?`, [`${pay} ${MINUS} ${price} = {}`, 'Đáp số: {} đồng'], [[pay - price, pay - price]],
    M('T2.DL.05', 'TOAN.DOLUONG', 'tra_lai_tien', l, `Tiền trả lại = tiền đưa ${MINUS} giá tiền: ${pay} ${MINUS} ${price} = ${pay - price} (đồng).`));
};

// =========================================================================== HÌNH PHẲNG, HÌNH KHỐI
const geoFacts: T2Template = (r, c, l) => {
  const facts: [string, string, string[], string][] = [
    ['Đoạn thẳng AB có mấy đầu mút?', '2', ['1', '3', '4'], 'Đoạn thẳng có hai đầu mút: điểm A và điểm B.'],
    ['Ba điểm cùng nằm trên một đường thẳng gọi là gì?', 'ba điểm thẳng hàng', ['ba đoạn thẳng', 'đường gấp khúc', 'hình tứ giác'], 'Ba điểm cùng nằm trên một đường thẳng là ba điểm thẳng hàng.'],
    ['Đường nào kéo dài mãi về hai phía, không có đầu mút?', 'đường thẳng', ['đoạn thẳng', 'đường gấp khúc', 'đường cong'], 'Đường thẳng kéo dài về hai phía, còn đoạn thẳng có hai đầu mút.'],
    ['Cầu vồng có dạng đường gì?', 'đường cong', ['đường thẳng', 'đoạn thẳng', 'đường gấp khúc'], 'Cầu vồng uốn cong nên có dạng đường cong.'],
    ['Mép thước kẻ thẳng giúp em vẽ được gì?', 'đoạn thẳng', ['đường cong', 'hình tròn', 'khối cầu'], 'Đặt thước, nối hai điểm ta được đoạn thẳng.'],
    ['Qua hai điểm A và B, em vẽ được mấy đoạn thẳng AB?', '1', ['2', '3', 'rất nhiều'], 'Hai điểm chỉ nối được đúng một đoạn thẳng.'],
    ['Đoạn thẳng AB còn được gọi là đoạn thẳng nào?', 'BA', ['AA', 'BB', 'AC'], 'Đoạn thẳng AB và đoạn thẳng BA là một.'],
    ['Vành chiếc nón lá (nhìn từ trên xuống) có dạng đường gì?', 'đường cong', ['đường thẳng', 'đoạn thẳng', 'đường gấp khúc'], 'Vành nón tròn nên là đường cong.'],
    ['Hình gồm nhiều đoạn thẳng nối tiếp nhau, không thẳng hàng, gọi là gì?', 'đường gấp khúc', ['đường thẳng', 'đường cong', 'ba điểm thẳng hàng'], 'Các đoạn thẳng nối tiếp nhau tạo thành đường gấp khúc.'],
  ];
  const [p, a, w, e] = r.pick(facts);
  return Q.sc(p, r.shuffle([a, ...w]), a, M('T2.HH.01', 'TOAN.HINH', 'hinh_co_ban', l, e));
};
const geoTable: T2Template = (r, c, l) => {
  const rows = mixRows(r, r.sample([
    ['Đoạn thẳng có hai đầu mút.', true], ['Đường thẳng có hai đầu mút.', false], ['Ba điểm thẳng hàng cùng nằm trên một đường thẳng.', true],
    ['Đường cong được vẽ bằng thước kẻ thẳng.', false], ['Một đường gấp khúc có thể gồm 3 đoạn thẳng.', true], ['Hai điểm nối được hai đoạn thẳng khác nhau.', false],
  ] as [string, boolean][], 4));
  if (!rows) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', rows, M('T2.HH.01', 'TOAN.HINH', 'hinh_dung_sai', l, 'Đoạn thẳng có 2 đầu mút; đường thẳng kéo dài mãi; ba điểm thẳng hàng nằm trên cùng một đường thẳng.'));
};
const polylineLen: T2Template = (r, c, l) => {
  if (!c.topics.includes('polyline')) return null;
  const n = r.int(2, 4);
  const names = 'ABCDE'.slice(0, n + 1).split('');
  const seg = Array.from({ length: n }, () => r.int(2, 9));
  if (seg.reduce((a, b) => a + b, 0) > c.max) return null;
  const total = seg.reduce((a, b) => a + b, 0);
  const parts = seg.map((x, i) => `${names[i]}${names[i + 1]} = ${x} cm`).join(', ');
  return Q.blanks(`Đường gấp khúc ${names.join('')} có ${parts}. Tính độ dài đường gấp khúc.`, [`${seg.join(' + ')} = {}`, 'Đáp số: {} cm'], [[total, total]],
    M('T2.HH.02', 'TOAN.HINH', 'gap_khuc', l, `Độ dài đường gấp khúc là tổng độ dài các đoạn thẳng: ${seg.join(' + ')} = ${total} (cm).`));
};
const polylineSegs: T2Template = (r, c, l) => {
  if (!c.topics.includes('polyline')) return null;
  const n = r.int(3, 6);
  const name = 'ABCDEFG'.slice(0, n);
  return Q.sc(`Đường gấp khúc ${name} gồm mấy đoạn thẳng?`, r.shuffle([n - 1, n, n + 1].map(String)), String(n - 1),
    M('T2.HH.02', 'TOAN.HINH', 'gap_khuc_doan', l, `Đường gấp khúc ${name} có ${n} điểm, nối liền nhau được ${n - 1} đoạn thẳng.`));
};
const quadFacts: T2Template = (r, c, l) => {
  if (!c.topics.includes('quad')) return null;
  const rows = mixRows(r, [
    ['Hình tứ giác có 4 cạnh.', true], ['Hình tứ giác có 4 đỉnh.', true], ['Hình tam giác cũng là hình tứ giác.', false],
    ['Hình vuông là một hình tứ giác.', true], ['Hình tròn có 4 cạnh.', false], ['Hình chữ nhật có 3 đỉnh.', false],
  ].sort(() => 0).slice(r.int(0, 2), r.int(0, 2) + 4) as [string, boolean][]);
  if (!rows) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', rows, M('T2.HH.02', 'TOAN.HINH', 'tu_giac', l, 'Hình tứ giác có 4 cạnh và 4 đỉnh; hình vuông, hình chữ nhật đều là hình tứ giác.'));
};
const countSegments: T2Template = (r, c, l) => {
  if (!c.topics.some((t) => ['geo', 'polyline', 'quad'].includes(t))) return null;
  const n = r.int(3, 5);
  const name = r.pick(['ABCDE', 'MNPQR', 'EGHIK', 'OPQRS']).slice(0, n).split('');
  const total = (n * (n - 1)) / 2;
  const listing = name.slice(0, -1).map((p, i) => `từ ${p}: ${n - 1 - i}`).join(', ');
  return Q.sc(`Trên một đường thẳng lần lượt có ${n} điểm ${name.join(', ')}. Có tất cả bao nhiêu đoạn thẳng nối hai trong các điểm đó?`, r.shuffle([total, total - 1, n - 1, n].filter((x, i, a) => a.indexOf(x) === i).map(String)), String(total),
    M('T2.TD.04', 'TOAN.HINH', 'dem_doan_thang', l, `Đếm theo từng điểm đầu (chỉ nối sang phải để không trùng): ${listing}. Cộng lại được ${total} đoạn thẳng.`));
};
const SOLIDS: [string, string][] = [['quả bóng', 'khối cầu'], ['viên bi', 'khối cầu'], ['quả địa cầu', 'khối cầu'], ['lon nước ngọt', 'khối trụ'], ['ống nước', 'khối trụ'], ['hộp sữa hình trụ', 'khối trụ'], ['khúc gỗ tròn', 'khối trụ'], ['hộp bánh hình hộp', 'khối hộp chữ nhật'], ['con xúc xắc', 'khối lập phương']];
const solidPick: T2Template = (r, c, l) => {
  if (!c.topics.includes('solid')) return null;
  const [obj, shape] = r.pick(SOLIDS);
  return Q.sc(`${obj.charAt(0).toUpperCase() + obj.slice(1)} có dạng khối gì?`, ['khối cầu', 'khối trụ', 'khối hộp chữ nhật', 'khối lập phương'], shape,
    M('T2.HH.03', 'TOAN.HINH', 'hinh_khoi', l, `${obj.charAt(0).toUpperCase() + obj.slice(1)} có dạng ${shape}.`));
};
const solidGroup: T2Template = (r, c, l) => {
  if (!c.topics.includes('solid')) return null;
  const target = r.pick(['khối cầu', 'khối trụ']);
  const items = r.sample(SOLIDS, 5);
  const right = items.filter((x) => x[1] === target).map((x) => x[0]);
  if (!right.length || right.length === items.length) return null;
  return Q.mc(`Chọn tất cả đồ vật có dạng ${target}.`, items.map((x) => x[0]), right, M('T2.HH.03', 'TOAN.HINH', 'nhom_hinh_khoi', l, `Có dạng ${target}: ${right.join(', ')}.`));
};

// =========================================================================== THỜI GIAN, LỊCH
const clockFig = (h: number, m: number): Figure => ({ kind: 'clock', hour: h, minute: m, alt: `Đồng hồ chỉ ${h} giờ${m ? ` ${m} phút` : ''}` });
const timeText = (h: number, m: number) => `${h} giờ${m === 30 ? ' 30 phút' : m === 15 ? ' 15 phút' : ''}`;
const readClock: T2Template = (r, c, l) => {
  if (!c.topics.includes('time')) return null;
  const h = r.int(1, 12), m = r.pick([0, 15, 30]);
  const right = timeText(h, m);
  const opts = [...new Set([right, timeText(h, m === 30 ? 0 : 30), timeText(h % 12 + 1, m), timeText(h, m === 15 ? 30 : 15)])].slice(0, 4);
  return Q.sc('Đồng hồ chỉ mấy giờ?', r.shuffle(opts), right, M('T2.DL.02', 'TOAN.GIOLICH', 'xem_dong_ho', l,
    `Kim ngắn chỉ giờ, kim dài chỉ phút. Kim dài chỉ số ${m === 0 ? 12 : m === 15 ? 3 : 6} là ${m} phút: ${right}.`), { figure: clockFig(h, m) });
};
const timeFacts: T2Template = (r, c, l) => {
  if (!c.topics.includes('time')) return null;
  const h = r.int(13, 23);
  const facts: [string, number, string][] = [['1 ngày = {} giờ', 24, 'Một ngày có 24 giờ.'], ['1 giờ = {} phút', 60, 'Một giờ có 60 phút.'], ['Nửa giờ = {} phút', 30, 'Nửa giờ là 30 phút.'],
    [`${h} giờ còn gọi là {} giờ chiều (tối)`, h - 12, `Sau 12 giờ trưa, bớt đi 12 giờ. Vậy ${h} giờ là ${h - 12} giờ chiều (tối).`]];
  const [line, ans, why] = r.pick(facts);
  return Q.blanks('Viết số thích hợp.', [line], [[ans]], M('T2.DL.02', 'TOAN.GIOLICH', 'gio_phut', l, why));
};
const timeDuration: T2Template = (r, c, l) => {
  if (!c.topics.includes('time')) return null;
  const h = r.int(6, 9);
  const k1 = kid(r);
  const [start, end, dur] = r.pick([[`${h} giờ`, `${h} giờ 30 phút`, 30], [`${h} giờ 30 phút`, `${h + 1} giờ`, 30], [`${h} giờ`, `${h + 1} giờ`, 60], [`${h} giờ`, `${h} giờ 15 phút`, 15]] as [string, string, number][]);
  return Q.blanks(`${k1} bắt đầu làm bài lúc ${start} và làm xong lúc ${end}. Hỏi ${k1} làm bài trong bao nhiêu phút?`, ['{} phút'], [[dur]],
    M('T2.DL.02', 'TOAN.GIOLICH', 'khoang_thoi_gian', l, `Từ ${start} đến ${end} là ${dur} phút (1 giờ = 60 phút, nửa giờ = 30 phút).`));
};
const DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEK = ['chủ nhật', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy'];
const monthDays: T2Template = (r, c, l) => {
  if (!c.topics.includes('date')) return null;
  const m = r.pick([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  return Q.sc(`Tháng ${m} có bao nhiêu ngày?`, ['28', '29', '30', '31'].filter((x) => x !== '28' && x !== '29' || r.chance(0.4)), String(DAYS_IN[m - 1]),
    M('T2.DL.03', 'TOAN.GIOLICH', 'so_ngay_thang', l, `Tháng ${m} có ${DAYS_IN[m - 1]} ngày (xem tờ lịch hoặc đếm trên nắm tay).`));
};
const weekNext: T2Template = (r, c, l) => {
  if (!c.topics.includes('date')) return null;
  const d = r.int(1, 20), w = r.int(0, 6), add = r.pick([7, 1, 2, 14]);
  if (d + add > 30) return null;
  const nw = (w + add) % 7;
  const m = r.int(1, 12);
  return Q.sc(`Ngày ${d} tháng ${m} là ${WEEK[w]}. Ngày ${d + add} tháng ${m} là thứ mấy?`, r.shuffle([...new Set([WEEK[nw], WEEK[(nw + 1) % 7], WEEK[(nw + 6) % 7], WEEK[w]])]).slice(0, 4).concat().filter((x, i, a) => a.indexOf(x) === i),
    WEEK[nw], M('T2.DL.03', 'TOAN.GIOLICH', 'thu_ngay', l, add % 7 === 0 ? `Sau ${add} ngày (${add / 7} tuần) lại đến ${WEEK[w]}.` : `Đếm thêm ${add} ngày kể từ ${WEEK[w]}: ${WEEK[nw]}.`),
    { figure: { kind: 'calendar', month: m, day: d, weekday: WEEK[w].replace(/^t/, 'T').replace(/^c/, 'C'), alt: `Tờ lịch ngày ${d} tháng ${m}, ${WEEK[w]}` } });
};

// =========================================================================== PHÉP NHÂN, PHÉP CHIA
const table = (r: Rng) => r.pick([2, 5]);
const mulSum: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const a = table(r), n = r.int(2, 5);
  return Q.blanks('Viết phép nhân thích hợp.', [`${Array(n).fill(a).join(' + ')} = ${a} × {}`], [[n]],
    M('T2.NC.01', 'TOAN.NHANCHIA', 'tong_thanh_tich', l, `${a} được lấy ${n} lần nên viết ${a} × ${n} = ${a * n}.`));
};
const mulGroups: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const per = table(r), groups = r.int(2, 5);
  const icon = r.pick(['🍎', '🌸', '⭐', '🍊', '🐟']);
  return Q.blanks(`Mỗi hàng có ${per} đồ vật. Viết phép nhân chỉ số đồ vật.`, ['{} × {} = {}'], [[per, groups, per * groups]],
    M('T2.NC.01', 'TOAN.NHANCHIA', 'nhom_bang_nhau', l, `${groups} hàng, mỗi hàng ${per} đồ vật, nên ${per} × ${groups} = ${per * groups}.`), { figure: { kind: 'objects', groups: Array.from({ length: groups }, () => ({ icon, count: per })), alt: `${groups} hàng, mỗi hàng ${per} đồ vật` } });
};
const mulCalc: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const tables = c.topics.includes('mul5') || c.lesson >= 41 ? [2, 5] : c.topics.includes('mul2') ? [2] : [2, 5];
  const a = r.pick(tables), b = r.int(1, 10);
  return Q.blanks('Tính nhẩm.', [`${a} × ${b} = {}`], [[a * b]], M('T2.NC.02', 'TOAN.NHANCHIA', `bang_nhan_${a}`, l, `Theo bảng nhân ${a}, ${a} × ${b} = ${a * b}.`));
};
const mulParts: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const a = table(r), b = r.int(2, 9);
  const which = r.int(0, 2);
  const val = [a, b, a * b][which];
  const right = which === 2 ? 'tích' : 'thừa số';
  return Q.sc(`Trong phép nhân ${a} × ${b} = ${a * b}, số ${val} gọi là gì?`, ['thừa số', 'tích', 'tổng', 'số hạng'], right,
    M('T2.NC.01', 'TOAN.NHANCHIA', 'thua_so_tich', l, `${a} và ${b} là thừa số, ${a * b} là tích.`));
};
const divCalc: T2Template = (r, c, l) => {
  if (!c.div) return null;
  const tables = c.topics.includes('div5') || c.lesson >= 45 ? [2, 5] : c.topics.includes('div2') ? [2] : [2, 5];
  const b = r.pick(tables), q = r.int(1, 10);
  return Q.blanks('Tính nhẩm.', [`${b * q} : ${b} = {}`], [[q]], M('T2.NC.04', 'TOAN.NHANCHIA', `bang_chia_${b}`, l, `Vì ${b} × ${q} = ${b * q} nên ${b * q} : ${b} = ${q}.`));
};
const divParts: T2Template = (r, c, l) => {
  if (!c.div) return null;
  const b = table(r), q = r.int(2, 9);
  const which = r.int(0, 2);
  const val = [b * q, b, q][which];
  const names = ['số bị chia', 'số chia', 'thương'];
  if (new Set([b * q, b, q]).size < 3) return null;
  return Q.sc(`Trong phép chia ${b * q} : ${b} = ${q}, số ${val} gọi là gì?`, ['số bị chia', 'số chia', 'thương', 'tích'], names[which],
    M('T2.NC.03', 'TOAN.NHANCHIA', 'thanh_phan_chia', l, `${b * q} là số bị chia, ${b} là số chia, ${q} là thương.`));
};
const divShare: T2Template = (r, c, l) => {
  if (!c.div) return null;
  const b = table(r), q = r.int(2, 9);
  const s = thing(r);
  return r.chance(0.5)
    ? Q.blanks(`Có ${b * q} ${s} chia đều cho ${b} bạn. Hỏi mỗi bạn được mấy ${s}?`, [`${b * q} : ${b} = {}`, `Đáp số: {} ${s}`], [[q, q]],
      M('T2.NC.04', 'TOAN.LOIVAN', 'chia_deu', l, `Chia đều thành ${b} phần: ${b * q} : ${b} = ${q} (${s}).`))
    : Q.blanks(`Có ${b * q} ${s}, xếp mỗi hộp ${b} ${s}. Hỏi xếp được mấy hộp?`, [`${b * q} : ${b} = {}`, 'Đáp số: {} hộp'], [[q, q]],
      M('T2.NC.04', 'TOAN.LOIVAN', 'chia_nhom', l, `Mỗi hộp ${b} cái, nên ${b * q} : ${b} = ${q} (hộp).`));
};
const mulWord: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const a = table(r), b = r.int(2, 10);
  const [p, unit] = r.pick([
    [`Mỗi con gà có 2 chân. Hỏi ${b} con gà có bao nhiêu chân?`, 'chân'],
    [`Mỗi bàn tay có 5 ngón. Hỏi ${b} bàn tay có bao nhiêu ngón?`, 'ngón'],
    [`Mỗi hộp có ${a} chiếc bánh. Hỏi ${b} hộp có bao nhiêu chiếc bánh?`, 'chiếc bánh'],
  ] as [string, string][]);
  const k = p.startsWith('Mỗi con gà') ? 2 : p.startsWith('Mỗi bàn tay') ? 5 : a;
  return Q.blanks(p, [`${k} × ${b} = {}`, `Đáp số: {} ${unit}`], [[k * b, k * b]], M('T2.NC.04', 'TOAN.LOIVAN', 'loi_van_nhan', l, `${k} được lấy ${b} lần: ${k} × ${b} = ${k * b} (${unit}).`));
};
const mulCompare: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const a = r.int(1, 10), b = r.int(1, 10);
  const x = 2 * a, y = 5 * b;
  const sign = x > y ? '>' : x < y ? '<' : '=';
  return Q.sc(`2 × ${a} ? 5 × ${b}`, ['>', '<', '='], sign, M('T2.NC.02', 'TOAN.NHANCHIA', 'so_sanh_tich', l, `2 × ${a} = ${x}; 5 × ${b} = ${y}; ${x} ${sign} ${y}.`));
};
const mulDivFamily: T2Template = (r, c, l) => {
  if (!c.div) return null;
  const a = table(r), b = r.int(2, 10);
  return Q.blanks('Từ một phép nhân, viết hai phép chia.', [`${a} × ${b} = ${a * b}`, `${a * b} : ${a} = {}`, `${a * b} : ${b} = {}`].filter((x, i) => i !== 2 || b === 2 || b === 5),
    b === 2 || b === 5 ? [[b, a]] : [[b]], M('T2.NC.03', 'TOAN.NHANCHIA', 'nhan_chia', l, `Lấy tích chia cho thừa số này thì được thừa số kia: ${a * b} : ${a} = ${b}.`));
};

// =========================================================================== SỐ ĐẾN 1000
const placeValue: T2Template = (r, c, l) => {
  const facts: [string, number, string][] = [['10 đơn vị = {} chục', 1, '10 đơn vị gộp thành 1 chục.'], ['10 chục = {} trăm', 1, '10 chục gộp thành 1 trăm.'], ['10 trăm = {} nghìn', 1, '10 trăm gộp thành 1 nghìn.'], ['1 trăm = {} chục', 10, '1 trăm có 10 chục.'], ['1 nghìn = {} trăm', 10, '1 nghìn có 10 trăm.']];
  const [line, ans, why] = r.pick(facts);
  return Q.blanks('Viết số thích hợp.', [line], [[ans]], M('T2.SO.03', 'TOAN.DOCVIET', 'tram_chuc', l, why));
};
const hundredsTensUnits: T2Template = (r, c, l) => {
  const h = r.int(1, 9), t = r.int(0, 9), u = r.int(0, 9);
  const n = h * 100 + t * 10 + u;
  return r.chance(0.5)
    ? Q.blanks('Viết số.', [`Số gồm ${h} trăm, ${t} chục và ${u} đơn vị là {}`], [[n]], M('T2.SO.03', 'TOAN.DOCVIET', 'tram_chuc_dv', l, `${h} trăm, ${t} chục, ${u} đơn vị viết là ${n}.`))
    : Q.blanks(`Số ${n} gồm mấy trăm, mấy chục, mấy đơn vị?`, ['{} trăm, {} chục, {} đơn vị'], [[h, t, u]], M('T2.SO.03', 'TOAN.DOCVIET', 'phan_tich_so', l, `${n} gồm ${h} trăm, ${t} chục, ${u} đơn vị.`));
};
const roundNums: T2Template = (r, c, l) => {
  const round100 = r.chance(0.5);
  const pool = round100 ? [100, 200, 300, 400, 500, 600, 700, 800, 900] : Array.from({ length: 30 }, (_, i) => 110 + i * 30).filter((x) => x % 100 !== 0);
  const rightList = r.sample(pool, 2);
  const wrong = r.sample([105, 250 + 5, 333, 402, 718, 990 + 1, 47, 615].filter((x) => x % 10 !== 0), 3);
  return Q.mc(`Chọn tất cả số tròn ${round100 ? 'trăm' : 'chục'}.`, r.shuffle([...rightList, ...wrong].map(String)), rightList.map(String),
    M('T2.SO.02', 'TOAN.DOCVIET', 'tron_tram', l, round100 ? 'Số tròn trăm có hai chữ số tận cùng là 00.' : 'Số tròn chục có chữ số hàng đơn vị là 0.'));
};
const roundSeq: T2Template = (r, c, l) => {
  const step = r.pick([10, 100]);
  const start = step === 100 ? 100 : 10 * r.int(10, 80);
  const cells = Array.from({ length: 6 }, (_, i) => start + i * step);
  if (cells[5] > 1000) return null;
  const hide = r.sample([2, 3, 4, 5], 2).sort((a, b) => a - b);
  return Q.blanks('Viết tiếp số tròn ' + (step === 100 ? 'trăm' : 'chục') + ' vào chỗ "?".', hide.map((i) => `Ô thứ ${i + 1}: {}`), [hide.map((i) => cells[i])],
    M('T2.SO.02', 'TOAN.SOTHIEU', 'day_tron', l, `Mỗi số hơn số liền trước ${step} đơn vị. Dãy đầy đủ là ${cells.join(', ')}.`), { figure: seqFig(cells.map((x, i) => (hide.includes(i) ? '?' : String(x)))) });
};
const expandNum: T2Template = (r, c, l) => {
  const h = r.int(1, 9), t = r.int(0, 9), u = r.int(0, 9);
  const n = h * 100 + t * 10 + u;
  if (!c.topics.includes('expand') && l < 3) return null;
  const parts = [h * 100, t * 10, u].filter((x) => x > 0);
  if (parts.length < 2) return null;
  return r.chance(0.5)
    ? Q.blanks('Viết số thành tổng các trăm, chục, đơn vị.', [`${n} = ${parts.slice(0, -1).join(' + ')} + {}`], [[parts[parts.length - 1]]], M('T2.SO.03', 'TOAN.DOCVIET', 'viet_thanh_tong', l, `${n} = ${parts.join(' + ')}.`))
    : Q.blanks('Viết số.', [`${parts.join(' + ')} = {}`], [[n]], M('T2.SO.03', 'TOAN.DOCVIET', 'tong_thanh_so', l, `${parts.join(' + ')} = ${n}.`));
};
const maxMin3: T2Template = (r, c, l) => {
  const digits = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
  const sortedDesc = [...digits].sort((a, b) => b - a);
  const biggest = Number(sortedDesc.join(''));
  const asc = [...digits].sort((a, b) => a - b);
  if (asc[0] === 0) [asc[0], asc[1]] = [asc[1], asc[0]];
  const smallest = Number(asc.join(''));
  const wantMax = r.chance(0.5);
  const ans = wantMax ? biggest : smallest;
  return Q.blanks(`Từ ba chữ số ${digits.join(', ')}, lập số có ba chữ số khác nhau ${wantMax ? 'lớn nhất' : 'bé nhất'}.`, ['{}'], [[ans]],
    M('T2.TD.04', 'TOAN.DOCVIET', 'lap_so', l, wantMax ? `Xếp chữ số lớn nhất ở hàng trăm, rồi đến hàng chục: ${biggest}.` : `Chữ số hàng trăm phải khác 0 và nhỏ nhất có thể, các hàng sau tăng dần: ${smallest}.`));
};

// =========================================================================== THỐNG KÊ, KHẢ NĂNG
const FRUITS = [['🍎', 'táo'], ['🍊', 'cam'], ['🍌', 'chuối'], ['🍇', 'nho']] as const;
const pictoGraph: T2Template = (r, c, l) => {
  const kinds = r.sample(FRUITS, 3);
  const counts = kinds.map(() => r.int(2, 8));
  if (new Set(counts).size < 3) return null;
  const fig: Figure = { kind: 'compare', rows: kinds.map((k, i) => ({ icon: k[0], count: counts[i] })), alt: kinds.map((k, i) => `${counts[i]} quả ${k[1]}`).join(', ') };
  const ask = r.int(0, 2);
  if (ask === 0) {
    const mi = counts.indexOf(Math.max(...counts));
    return Q.sc('Biểu đồ tranh cho biết số quả mỗi loại. Loại quả nào nhiều nhất?', kinds.map((k) => `quả ${k[1]}`), `quả ${kinds[mi][1]}`,
      M('T2.TK.01', 'TOAN.THONGKE', 'bieu_do_tranh', l, `Hàng quả ${kinds[mi][1]} có nhiều hình nhất (${counts[mi]}).`), { figure: fig });
  }
  if (ask === 1) {
    const i = r.int(0, 2), j = (i + 1) % 3;
    const [hi, lo] = counts[i] > counts[j] ? [i, j] : [j, i];
    return Q.blanks(`Số quả ${kinds[hi][1]} nhiều hơn số quả ${kinds[lo][1]} bao nhiêu quả?`, ['{} quả'], [[counts[hi] - counts[lo]]],
      M('T2.TK.01', 'TOAN.THONGKE', 'bieu_do_hon_kem', l, `Đếm trên biểu đồ: ${counts[hi]} ${MINUS} ${counts[lo]} = ${counts[hi] - counts[lo]} (quả).`), { figure: fig });
  }
  const total = counts.reduce((a, b) => a + b, 0);
  return Q.blanks('Có tất cả bao nhiêu quả?', ['{} quả'], [[total]], M('T2.TK.01', 'TOAN.THONGKE', 'bieu_do_tong', l, `${counts.join(' + ')} = ${total} (quả).`), { figure: fig });
};
const tally: T2Template = (r, c, l) => {
  const colors = r.sample(['đỏ', 'xanh', 'vàng', 'tím'], 3);
  const counts = colors.map(() => r.int(3, 9));
  const list = colors.flatMap((col, i) => Array(counts[i]).fill(col));
  const order = r.shuffle(list);
  const ask = r.int(0, 2);
  return Q.blanks(`Lớp em bình chọn màu yêu thích, kết quả ghi lần lượt: ${order.join(', ')}. Có bao nhiêu bạn chọn màu ${colors[ask]}?`, ['{} bạn'], [[counts[ask]]],
    M('T2.TK.01', 'TOAN.THONGKE', 'kiem_dem', l, `Đếm (gạch mỗi lần gặp) màu ${colors[ask]}: ${counts[ask]} bạn.`));
};
const CHANCE: [string, string][] = [
  ['Trong hộp chỉ có bi đỏ. Lấy ra một viên bi, viên bi đó ... là bi đỏ.', 'chắc chắn'],
  ['Trong hộp chỉ có bi đỏ. Lấy ra một viên bi, viên bi đó ... là bi xanh.', 'không thể'],
  ['Trong hộp có bi đỏ và bi xanh. Lấy ra một viên bi, viên bi đó ... là bi xanh.', 'có thể'],
  ['Tung một đồng xu, mặt ngửa ... xuất hiện.', 'có thể'],
  ['Ngày mai mặt trời ... mọc ở đằng tây.', 'không thể'],
  ['Sau thứ hai ... là thứ ba.', 'chắc chắn'],
  ['Gieo xúc xắc sáu mặt (1 đến 6 chấm), mặt 7 chấm ... xuất hiện.', 'không thể'],
  ['Rút một thẻ từ các thẻ số 2, 4, 6, 8, thẻ rút được ... là số chẵn.', 'chắc chắn'],
  ['Trong túi có 3 kẹo cam và 1 kẹo dâu. Lấy ra một chiếc kẹo, chiếc kẹo đó ... là kẹo dâu.', 'có thể'],
  ['Trong túi chỉ có kẹo cam. Lấy ra một chiếc kẹo, chiếc kẹo đó ... là kẹo chanh.', 'không thể'],
  ['Một tuần ... có bảy ngày.', 'chắc chắn'],
  ['Hôm nay trời ... mưa.', 'có thể'],
];
const chanceGroup: T2Template = (r, c, l) => {
  if (!c.topics.includes('chance')) return null;
  const kind = r.pick(['chắc chắn', 'có thể', 'không thể']);
  const items = r.sample(CHANCE, 5);
  const right = items.filter((x) => x[1] === kind).map((x) => x[0].replace('...', '___'));
  if (!right.length || right.length === items.length) return null;
  return Q.mc(`Chọn tất cả câu mà chỗ ___ điền được "${kind}".`, items.map((x) => x[0].replace('...', '___')), right,
    M('T2.TK.02', 'TOAN.THONGKE', 'kha_nang_nhom', l, `Các câu điền "${kind}": ${right.length} câu.`));
};
const chanceTable: T2Template = (r, c, l) => {
  if (!c.topics.includes('chance')) return null;
  const items = r.sample(CHANCE, 4);
  const rows = mixRows(r, items.map(([p, a]) => { const claim = r.pick(['chắc chắn', 'có thể', 'không thể']); return [p.replace('...', claim), claim === a] as [string, boolean]; }));
  if (!rows) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', rows, M('T2.TK.02', 'TOAN.THONGKE', 'kha_nang_ds', l, 'Luôn xảy ra: chắc chắn; có lúc xảy ra: có thể; không bao giờ xảy ra: không thể.'));
};
const chancePick: T2Template = (r, c, l) => {
  if (!c.topics.includes('chance')) return null;
  const [p, a] = r.pick(CHANCE);
  return Q.sc(`Chọn từ thích hợp thay cho "...": ${p}`, ['chắc chắn', 'có thể', 'không thể'], a,
    M('T2.TK.02', 'TOAN.THONGKE', 'kha_nang', l, a === 'chắc chắn' ? 'Sự việc luôn xảy ra: chắc chắn.' : a === 'không thể' ? 'Sự việc không bao giờ xảy ra: không thể.' : 'Sự việc có lúc xảy ra, có lúc không: có thể.'));
};

// =========================================================================== NÂNG CAO (L4–L5)
const seqPattern: T2Template = (r, c, l) => {
  const big = c.max >= 1000;
  const step = r.pick(big ? [5, 10, 20, 50, 100] : c.mul ? [2, 3, 5, 10] : [2, 3, 4, 5, 10]);
  const up = r.chance(0.6);
  const start = up ? r.int(1, big ? 300 : 40) : r.int(big ? 500 : 60, big ? 990 : 99);
  const cells = Array.from({ length: 5 }, (_, i) => start + (up ? 1 : -1) * i * step);
  const next = cells[4] + (up ? 1 : -1) * step;
  if (Math.min(...cells, next) < 0 || Math.max(...cells, next) > c.max) return null;
  for (let i = 1; i < 5; i++) if (!okOp(c, Math.max(cells[i - 1], cells[i]), up ? '-' : '-', step)) return null;
  return Q.blanks('Tìm quy luật rồi viết số tiếp theo.', [`${cells.join(', ')}, {}`], [[next]],
    M('T2.TD.02', 'TOAN.QUYLUAT', 'quy_luat', l, `Mỗi số ${up ? 'hơn' : 'kém'} số đứng trước ${step} đơn vị. Số tiếp theo: ${next}.`));
};
const seqTwoRule: T2Template = (r, c, l) => {
  // dãy xen kẽ +a, +b
  const a = r.int(1, 5), b = r.int(1, 5);
  if (a === b) return null;
  const start = r.int(1, 20);
  const cells = [start];
  for (let i = 1; i < 6; i++) cells.push(cells[i - 1] + (i % 2 ? a : b));
  const next = cells[5] + a;
  if (next > c.max || !okOp(c, cells[5], '+', a)) return null;
  return Q.blanks('Tìm quy luật rồi viết số tiếp theo.', [`${cells.join(', ')}, {}`], [[next]],
    M('T2.TD.02', 'TOAN.QUYLUAT', 'quy_luat_xen_ke', l, `Các số tăng lần lượt thêm ${a}, thêm ${b}, rồi lại thêm ${a}... Số tiếp theo: ${cells[5]} + ${a} = ${next}.`));
};
const twoStep: T2Template = (r, c, l) => {
  const p = pairOp(r, c, '+');
  if (!p) return null;
  const [a, b] = p;
  const second = a + b;
  if (!okOp(c, a, '+', second)) return null;
  const k1 = kid(r), k2 = kid(r, k1);
  const s = thing(r);
  return Q.blanks(`${k1} có ${fmt(a)} ${s}. ${k2} có nhiều hơn ${k1} ${fmt(b)} ${s}. Hỏi cả hai bạn có bao nhiêu ${s}?`, [`${k2}: ${fmt(a)} + ${fmt(b)} = {}`, `Cả hai: ${fmt(a)} + {} = {}`], [[second, second, a + second]],
    M('T2.TD.03', 'TOAN.LOIVAN', 'hai_buoc', l, `Bước 1, số ${s} của ${k2}: ${fmt(a)} + ${fmt(b)} = ${fmt(second)}. Bước 2, cả hai bạn: ${fmt(a)} + ${fmt(second)} = ${fmt(a + second)}.`));
};
const ageProblem: T2Template = (r, c, l) => {
  const me = r.int(6, 9), gap = r.int(2, 9), later = r.int(2, 5);
  const brother = me + gap;
  const kind = r.int(0, 2);
  if (kind === 0 && (!okOp(c, me, '+', gap) || !okOp(c, brother, '+', later))) return null;
  if (kind === 0) return Q.blanks(`Năm nay em ${me} tuổi, anh hơn em ${gap} tuổi. Hỏi ${later} năm nữa anh bao nhiêu tuổi?`, ['{} tuổi'], [[brother + later]],
    M('T2.TD.03', 'TOAN.LOIVAN', 'bai_toan_tuoi', l, `Tuổi anh năm nay: ${me} + ${gap} = ${brother}. ${later} năm nữa: ${brother} + ${later} = ${brother + later} (tuổi).`));
  if (kind === 1) return Q.blanks(`Năm nay em ${me} tuổi, anh hơn em ${gap} tuổi. Hỏi ${later} năm nữa anh hơn em mấy tuổi?`, ['{} tuổi'], [[gap]],
    M('T2.TD.03', 'TOAN.LOIVAN', 'hieu_tuoi_khong_doi', l, `Mỗi năm cả hai đều thêm 1 tuổi nên anh luôn hơn em ${gap} tuổi.`));
  const mom = r.int(28, 35);
  if (!okOp(c, mom, '-', later)) return null;
  return Q.blanks(`Năm nay mẹ ${mom} tuổi. Hỏi ${later} năm trước mẹ bao nhiêu tuổi?`, ['{} tuổi'], [[mom - later]],
    M('T2.TD.03', 'TOAN.LOIVAN', 'tuoi_truoc', l, `${later} năm trước mẹ ít hơn bây giờ ${later} tuổi: ${mom} ${MINUS} ${later} = ${mom - later} (tuổi).`));
};
const tallest: T2Template = (r, c, l) => {
  const [a, b, d] = r.sample(KIDS, 3);
  const x = r.int(2, 6), y = r.int(2, 6);
  // a cao hơn b x cm; b cao hơn d y cm -> a cao nhất, d thấp nhất
  const askMax = r.chance(0.5);
  return Q.sc(`${a} cao hơn ${b} ${x} cm. ${b} cao hơn ${d} ${y} cm. Bạn nào ${askMax ? 'cao nhất' : 'thấp nhất'}?`, r.shuffle([a, b, d]), askMax ? a : d,
    M('T2.TD.03', 'TOAN.LOIVAN', 'so_sanh_ba', l, `${a} cao hơn ${b}, ${b} lại cao hơn ${d}, nên ${askMax ? `${a} cao nhất` : `${d} thấp nhất`}.${okOp(c, x, '+', y) ? ` ${a} cao hơn ${d} ${x} + ${y} = ${x + y} cm.` : ''}`));
};
const equalize: T2Template = (r, c, l) => {
  const big = c.max >= 1000;
  const d = 2 * r.int(2, big ? 40 : 9);
  const small = r.int(5, big ? 300 : 30);
  const large = small + d;
  if (!okOp(c, small, '+', d)) return null;
  const s = thing(r);
  return Q.blanks(`Túi thứ nhất có ${large} ${s}, túi thứ hai có ${small} ${s}. Phải chuyển từ túi thứ nhất sang túi thứ hai bao nhiêu ${s} để hai túi bằng nhau?`, [`{} ${s}`], [[d / 2]],
    M('T2.TD.03', 'TOAN.LOIVAN', 'chuyen_bang_nhau', l, `Túi thứ nhất hơn túi thứ hai ${large} ${MINUS} ${small} = ${d}. Chuyển một nửa phần hơn: một nửa của ${d} là ${d / 2} ${s}.`));
};
const sumDiff: T2Template = (r, c, l) => {
  const big = r.int(8, c.max >= 1000 ? 400 : 45), small = r.int(2, big - 2);
  const sum = big + small, diff = big - small;
  if (!okOp(c, big, '+', small) || !okOp(c, big, '-', small) || !okOp(c, sum, '+', diff)) return null;
  return Q.blanks(`Hai số có tổng là ${sum}, số lớn hơn số bé ${diff} đơn vị. Tìm số lớn.`, ['Số lớn: {}'], [[big]],
    M('T2.TD.03', 'TOAN.LOIVAN', 'tong_hieu', l, `Nếu thêm vào số bé ${diff} đơn vị thì hai số bằng nhau và tổng là ${sum} + ${diff} = ${sum + diff}. Một nửa của ${sum + diff} là ${big}, đó là số lớn.`));
};
const findXMul: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const a = table(r), b = r.int(2, 10);
  if (c.div && r.chance(0.5)) return Q.blanks('Tìm số thích hợp.', [`{} : ${a} = ${b}`], [[a * b]], M('T2.TD.01', 'TOAN.TIMX', 'tim_so_bi_chia', l, `Số bị chia = thương × số chia: ${b} × ${a} = ${a * b}.`));
  return Q.blanks('Tìm số thích hợp.', [`${a} × {} = ${a * b}`], [[b]], M('T2.TD.01', 'TOAN.TIMX', 'tim_thua_so', l, `Nhẩm bảng nhân ${a}, ${a} × ${b} = ${a * b}.`));
};
const mulAddMix: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const a = table(r), b = r.int(2, 9), d = r.int(1, 20);
  if (!okOp(c, a * b, '+', d)) return null;
  return Q.blanks('Tính.', [`${a} × ${b} + ${d} = {}`], [[a * b + d]], M('T2.TD.03', 'TOAN.TINH', 'nhan_cong', l, `Làm phép nhân trước: ${a} × ${b} = ${a * b}; rồi ${a * b} + ${d} = ${a * b + d}.`));
};
const legsPuzzle: T2Template = (r, c, l) => {
  if (!c.mul) return null;
  const n = r.int(2, 10);
  const [k, prompt, unit, why] = r.pick([
    [2, `Trong sân có ${n * 2} cái chân gà. Hỏi có mấy con gà?`, 'con', 'Mỗi con gà có 2 chân'],
    [5, `Các bạn giơ tay, đếm được ${n * 5} ngón tay. Hỏi có mấy bàn tay?`, 'bàn tay', 'Mỗi bàn tay có 5 ngón'],
    [2, `Có ${n * 2} chiếc đũa xếp thành từng đôi. Hỏi có mấy đôi đũa?`, 'đôi', 'Mỗi đôi có 2 chiếc'],
  ] as [number, string, string, string][]);
  const total = n * k;
  return Q.blanks(prompt, [`{} ${unit}`], [[n]],
    M('T2.TD.03', 'TOAN.LOIVAN', 'dem_nhom', l, c.div ? `${why}: ${total} : ${k} = ${n} (${unit}).` : `${why}; ${k} × ${n} = ${total} nên có ${n} ${unit}.`));
};
const digitSum: T2Template = (r, c, l) => {
  const big = c.max >= 1000;
  const s = r.int(big ? 5 : 3, big ? 20 : 12);
  // số lớn nhất có hai/ba chữ số có tổng các chữ số bằng s
  let n = 0;
  for (let x = big ? 999 : 99; x >= (big ? 100 : 10); x--) if (String(x).split('').reduce((a, b) => a + Number(b), 0) === s) { n = x; break; }
  if (!n || n > c.max) return null;
  return Q.blanks(`Tìm số lớn nhất có ${big ? 'ba' : 'hai'} chữ số mà tổng các chữ số bằng ${s}.`, ['{}'], [[n]],
    M('T2.TD.04', 'TOAN.DOCVIET', 'tong_chu_so', l, `Muốn số lớn nhất, chữ số hàng cao nhất phải lớn nhất có thể (không quá 9), phần còn lại dồn cho hàng tiếp theo: ${n}.`));
};

// =========================================================================== GHÉP POOL THEO MẢNG KIẾN THỨC
type Lv = Partial<Record<Level, T2Template[]>>;
const T: Record<T2Topic, Lv> = {
  num100: { 1: [readNum, tensUnits], 2: [writeReading, neighbors, compareNums], 3: [orderNums], 4: [digitSum], 5: [seqPattern] },
  ray: { 1: [neighbors], 2: [rayFill], 3: [rayFill, orderNums], 4: [seqPattern], 5: [seqTwoRule] },
  parts: { 1: [partsName], 2: [partsCompute], 3: [missingAddend], 4: [missingAddend], 5: [sumDiff] },
  diff: { 1: [compareNums], 2: [diffHowMuch], 3: [diffHowMuch, wordMoreLess], 4: [tallest], 5: [equalize] },
  add100nc: { 1: [calcFill, pickResult], 2: [columnFill, compareExpr], 3: [wordAddSub, tfTable], 4: [missingAddend, chainCalc], 5: [twoStep] },
  add20: { 1: [calcFill, pickResult], 2: [makeTen, compareExpr], 3: [tfTable, wordAddSub], 4: [missingAddend], 5: [seqPattern, twoStep] },
  sub20: { 1: [calcFill, pickResult], 2: [makeTen, compareExpr], 3: [tfTable, wordAddSub], 4: [missingAddend, chainCalc], 5: [equalize] },
  table20: { 1: [pickResult], 2: [tfTable], 3: [compareExpr], 4: [missingAddend], 5: [seqTwoRule] },
  word20: { 1: [pickOperation], 2: [wordAddSub], 3: [wordAddSub], 4: [twoStep], 5: [ageProblem] },
  more20: { 1: [pickOperation], 2: [wordMoreLess], 3: [wordMoreLess], 4: [twoStep, tallest], 5: [ageProblem] },
  kg: { 1: [unitPick], 2: [measureCalc], 3: [heavierWord], 4: [twoStep], 5: [equalize] },
  litre: { 1: [unitPick], 2: [measureCalc], 3: [heavierWord], 4: [missingAddend], 5: [twoStep] },
  add21: { 1: [calcFill, pickResult], 2: [columnFill], 3: [wordAddSub, tfTable], 4: [missingAddend], 5: [twoStep, seqPattern] },
  add22: { 1: [calcFill, pickResult], 2: [columnFill, compareExpr], 3: [wordAddSub, tfTable], 4: [missingAddend, chainCalc], 5: [twoStep, sumDiff] },
  sub21: { 1: [calcFill, pickResult], 2: [columnFill], 3: [wordAddSub, tfTable], 4: [missingAddend], 5: [equalize] },
  sub22: { 1: [calcFill, pickResult], 2: [columnFill, compareExpr], 3: [wordAddSub, diffHowMuch], 4: [missingAddend, chainCalc], 5: [sumDiff, equalize] },
  word100: { 1: [pickOperation], 2: [wordMoreLess], 3: [wordAddSub, diffHowMuch], 4: [twoStep, tallest], 5: [ageProblem, sumDiff] },
  geo: { 1: [geoFacts], 2: [geoFacts, geoTable], 3: [geoTable, geoFacts], 4: [countSegments], 5: [countSegments, polylineLen] },
  polyline: { 1: [polylineSegs], 2: [polylineLen], 3: [polylineLen], 4: [countSegments], 5: [polylineLen, countSegments] },
  quad: { 1: [geoFacts], 2: [quadFacts], 3: [quadFacts, geoTable], 4: [countSegments], 5: [countSegments] },
  time: { 1: [readClock, timeFacts], 2: [timeFacts, readClock], 3: [timeDuration], 4: [timeDuration], 5: [ageProblem] },
  date: { 1: [monthDays], 2: [weekNext], 3: [weekNext], 4: [weekNext], 5: [twoStep] },
  mulMeaning: { 1: [mulSum, mulGroups], 2: [mulGroups, mulSum], 3: [mulWord], 4: [findXMul, mulCompare], 5: [legsPuzzle, mulAddMix] },
  mulParts: { 1: [mulParts], 2: [mulSum], 3: [mulGroups], 4: [findXMul], 5: [mulAddMix] },
  mul2: { 1: [mulCalc], 2: [mulGroups, mulCompare], 3: [mulWord], 4: [findXMul], 5: [mulAddMix, legsPuzzle] },
  mul5: { 1: [mulCalc], 2: [mulGroups, mulCompare], 3: [mulWord], 4: [findXMul], 5: [mulAddMix, seqPattern] },
  divMeaning: { 1: [divCalc], 2: [divShare], 3: [divShare], 4: [mulDivFamily, findXMul], 5: [legsPuzzle, mulAddMix] },
  divParts: { 1: [divParts], 2: [divCalc], 3: [mulDivFamily], 4: [findXMul], 5: [legsPuzzle, mulAddMix] },
  div2: { 1: [divCalc], 2: [mulDivFamily], 3: [divShare], 4: [findXMul], 5: [legsPuzzle, mulAddMix] },
  div5: { 1: [divCalc], 2: [mulDivFamily], 3: [divShare], 4: [findXMul], 5: [mulAddMix] },
  mulWord: { 1: [mulCalc], 2: [divCalc], 3: [mulWord, divShare], 4: [findXMul], 5: [mulAddMix, legsPuzzle] },
  solid: { 1: [solidPick], 2: [solidPick], 3: [solidGroup], 4: [solidGroup, findXMul], 5: [solidGroup, mulAddMix] },
  place: { 1: [placeValue, readNum, hundredsTensUnits], 2: [hundredsTensUnits], 3: [roundSeq, hundredsTensUnits], 4: [maxMin3], 5: [digitSum] },
  round: { 1: [roundNums], 2: [roundSeq], 3: [compareNums], 4: [maxMin3], 5: [seqPattern] },
  roundCmp: { 1: [roundNums], 2: [compareNums], 3: [orderNums], 4: [maxMin3], 5: [seqPattern] },
  num1000: { 1: [readNum, writeReading], 2: [hundredsTensUnits, neighbors], 3: [rayFill, orderNums], 4: [maxMin3], 5: [digitSum, seqPattern] },
  expand: { 1: [hundredsTensUnits], 2: [expandNum], 3: [expandNum], 4: [maxMin3], 5: [digitSum] },
  cmp1000: { 1: [compareNums], 2: [compareNums, writeReading], 3: [orderNums], 4: [maxMin3], 5: [digitSum, seqPattern] },
  length: { 1: [unitPick, lengthConvert], 2: [lengthConvert, measureCalc], 3: [lengthCompare, lengthConvert], 4: [twoStep], 5: [equalize] },
  money: { 1: [moneyChange], 2: [moneySum], 3: [moneyShop], 4: [moneyShop, moneySum], 5: [equalize] },
  add3nc: { 1: [calcFill, pickResult], 2: [columnFill, compareExpr], 3: [wordAddSub, tfTable], 4: [missingAddend], 5: [twoStep, seqPattern] },
  add3c: { 1: [calcFill, pickResult], 2: [columnFill, compareExpr], 3: [wordAddSub, tfTable], 4: [missingAddend, chainCalc], 5: [twoStep, sumDiff] },
  sub3nc: { 1: [calcFill, pickResult], 2: [columnFill, compareExpr], 3: [wordAddSub, tfTable], 4: [missingAddend], 5: [equalize] },
  sub3c: { 1: [calcFill, pickResult], 2: [columnFill, compareExpr], 3: [wordAddSub, diffHowMuch], 4: [missingAddend, chainCalc], 5: [sumDiff, equalize] },
  word1000: { 1: [pickOperation], 2: [wordMoreLess], 3: [wordAddSub], 4: [twoStep], 5: [sumDiff, equalize] },
  tally: { 1: [tally], 2: [tally], 3: [pictoGraph], 4: [pictoGraph], 5: [twoStep] },
  picto: { 1: [pictoGraph], 2: [pictoGraph], 3: [pictoGraph, tally], 4: [twoStep], 5: [equalize] },
  chance: { 1: [chancePick], 2: [chancePick, chanceGroup], 3: [chanceTable, chancePick], 4: [chanceGroup, chanceTable], 5: [chanceTable, chanceGroup] },
};

/** Pool của một bài: gộp các mảng kiến thức; thiếu mức nào thì lấy dạng chung theo phạm vi bài */
/** Mẫu hay trả null (điều kiện chặt) được thử lại vài lần ngay trong mẫu, để mỗi đề luôn đủ câu ở mọi mức */
const retry = (t: T2Template): T2Template => (r, c, l) => {
  for (let i = 0; i < 12; i++) {
    const q = t(r, c, l);
    if (q) return q;
  }
  return null;
};
const RETRIED = new Map<T2Template, T2Template>();
const wrap = (t: T2Template) => RETRIED.get(t) ?? (RETRIED.set(t, retry(t)), RETRIED.get(t)!);

export function t2Pool(topics: T2Topic[]): T2Pool {
  const pool: T2Pool = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const t of topics) for (const lv of [1, 2, 3, 4, 5] as Level[]) for (const f of T[t][lv] ?? []) if (!pool[lv].includes(wrap(f))) pool[lv].push(wrap(f));
  return pool;
}

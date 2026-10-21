// BỘ SINH CÂU — TOÁN 4 (bám trình tự Kết nối tri thức, Toán 4 tập một + tập hai, Bài 1–73).
//
// Mỗi bài chọn dạng câu theo các "mảng kiến thức" của bài (toan4-plan.ts). Số, tình huống, câu chữ sinh ngẫu nhiên theo
// seed — không chép bài tập của sách. Mức L4–L5 có dạng NÂNG CAO phổ biến ở lớp 4 (tổng – hiệu, trung bình cộng,
// rút về đơn vị, tính thuận tiện, biểu thức chứa chữ, phân số của một số, bài toán ba bước…), đề tự viết.
//
// "Không vượt trước" (npm run check:practice): số trong phạm vi bài (100 000 → 1 000 000 → lớp triệu); nhân/chia với
// số có một chữ số; với 10, 100, 1000 từ Bài 41; với số có hai chữ số từ Bài 43. Số từ 1000 viết tách lớp (U+202F).

import type { Level } from '../content/types';
import type { T4Lesson, T4Topic } from '../content/toan4-plan';
import { KIDS, Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { G4 } from './count-shapes';

export type T4Ctx = { lesson: number; max: number; mulMax: number; pow10: boolean; topics: T4Topic[] };
export type T4Template = (r: Rng, c: T4Ctx, l: Level) => PracticeQuestion | null;
export type T4Pool = Record<Level, T4Template[]>;

export function t4Context(p: T4Lesson): T4Ctx {
  return { lesson: p.no, max: p.scope.maxNumber, mulMax: p.scope.mulMax ?? 10, pow10: !!p.scope.pow10, topics: p.topics };
}

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });
const MINUS = '−';
const NB = ' ';
export const f = (n: number) => (n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB) : String(n));
const kid = (r: Rng, not?: string) => r.pick(KIDS.filter((k) => k !== not));
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const fr = (a: number, b: number) => `${a}/${b}`;

// ------------------------------------------------------------------- đọc số đến lớp triệu
const DIGIT = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
function read2(n: number): string {
  if (n < 10) return DIGIT[n];
  const t = Math.floor(n / 10), u = n % 10;
  const head = t === 1 ? 'mười' : `${DIGIT[t]} mươi`;
  if (!u) return head;
  return `${head} ${u === 5 ? 'lăm' : u === 1 && t > 1 ? 'mốt' : u === 4 && t > 1 ? 'tư' : DIGIT[u]}`;
}
function read3(n: number, full = false): string {
  const h = Math.floor(n / 100), rest = n % 100;
  if (h === 0 && !full) return read2(rest);
  if (!rest) return `${DIGIT[h]} trăm`;
  if (rest < 10) return `${DIGIT[h]} trăm linh ${DIGIT[rest]}`;
  return `${DIGIT[h]} trăm ${read2(rest)}`;
}
export function readVi(n: number): string {
  const groups: number[] = [];
  for (let x = n; x > 0; x = Math.floor(x / 1000)) groups.push(x % 1000);
  if (!groups.length) return 'không';
  const names = ['', 'nghìn', 'triệu', 'tỉ'];
  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    const full = i < groups.length - 1;
    parts.push(`${read3(g, full)}${names[i] ? ' ' + names[i] : ''}`);
  }
  return parts.join(' ');
}

// ------------------------------------------------------------------- phép tính hợp lệ theo bài
type Op = '+' | '-' | '*' | '/';
const P10 = [10, 100, 1000];
function okOp(c: T4Ctx, a: number, op: Op, b: number): boolean {
  if (a < 0 || b < 0 || a > c.max || b > c.max) return false;
  if (op === '+') return a + b <= c.max;
  if (op === '-') return b <= a;
  const small = Math.min(a, b);
  if (op === '*') return a * b <= c.max && (small <= c.mulMax || (c.pow10 && (P10.includes(a) || P10.includes(b))));
  return b >= 2 && (b <= Math.max(9, c.mulMax === 10 ? 9 : c.mulMax) || (c.pow10 && P10.includes(b)));
}
const numChoices = (r: Rng, right: number, wrong: number[], max: number) => {
  const opts = [...new Set([right, ...wrong.filter((x) => Number.isInteger(x) && x >= 0 && x <= max && x !== right)])].slice(0, 4);
  return opts.length >= 3 ? r.shuffle(opts).map(f) : null;
};
const mixRows = (r: Rng, rows: [string, boolean][]) => (rows.length < 3 || rows.every((x) => x[1]) || rows.every((x) => !x[1]) ? null : r.shuffle(rows));

// =========================================================================== SỐ TỰ NHIÊN
const numDigits = (c: T4Ctx) => (c.topics.includes('num100k') ? 5 : c.topics.includes('num1m') || c.topics.includes('placeClass') ? 6 : 9);
const randN = (r: Rng, c: T4Ctx) => {
  const d = Math.min(numDigits(c), String(c.max - 1).length);
  const hi = Math.min(10 ** d - 1, c.max);
  return r.int(10 ** (d - 2), hi);
};
const PLACE = ['đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn', 'trăm nghìn', 'triệu', 'chục triệu', 'trăm triệu'];

const readPick: T4Template = (r, c, l) => {
  const n = randN(r, c);
  const s = String(n);
  const i = r.int(0, s.length - 2);
  const swap = Number(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2));
  const opts = [...new Set([n, swap, n + 10 ** r.int(1, s.length - 2), n - 10 ** r.int(0, s.length - 3)])].filter((x) => x > 0 && String(x).length === s.length).slice(0, 3);
  if (opts.length < 3) return null;
  return Q.sc(`Số "${readVi(n)}" viết là:`, r.shuffle(opts).map(f), f(n), M('T4.SO.02', 'TOAN.DOCVIET', 'doc_viet_so', l, `"${readVi(n)}" viết là ${f(n)}.`));
};
const writeRead: T4Template = (r, c, l) => {
  const n = randN(r, c);
  const s = String(n);
  const i = r.int(0, s.length - 2);
  const wrong = [Number(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2)), n + 10 ** r.int(0, s.length - 2)].filter((x) => x !== n);
  const opts = [...new Set([n, ...wrong])];
  if (opts.length < 3) return null;
  return Q.sc(`Số ${f(n)} đọc là:`, r.shuffle(opts.map(readVi)), readVi(n), M('T4.SO.02', 'TOAN.DOCVIET', 'doc_so', l, `${f(n)} đọc là "${readVi(n)}".`));
};
const placeValue: T4Template = (r, c, l) => {
  const n = randN(r, c);
  const s = String(n);
  const p = r.int(1, s.length - 1);
  const d = Number(s[s.length - 1 - p]);
  if (!d || d * 10 ** p > c.max) return null;
  return Q.blanks(`Trong số ${f(n)}, chữ số ${d} ở hàng ${PLACE[p]} có giá trị là bao nhiêu?`, ['{}'], [[d * 10 ** p]],
    M('T4.SO.02', 'TOAN.DOCVIET', 'gia_tri_chu_so', l, `Chữ số ${d} ở hàng ${PLACE[p]} có giá trị ${f(d * 10 ** p)}.`));
};
const classPick: T4Template = (r, c, l) => {
  const n = randN(r, c);
  const s = String(n);
  if (s.length < 4) return null;
  const p = r.int(0, s.length - 1);
  const cls = p < 3 ? 'lớp đơn vị' : p < 6 ? 'lớp nghìn' : 'lớp triệu';
  return Q.sc(`Trong số ${f(n)}, chữ số ở hàng ${PLACE[p]} thuộc lớp nào?`, ['lớp đơn vị', 'lớp nghìn', 'lớp triệu'].filter((x) => s.length > 6 || x !== 'lớp triệu'), cls,
    M('T4.SO.02', 'TOAN.DOCVIET', 'hang_lop', l, 'Lớp đơn vị gồm hàng đơn vị, chục, trăm; lớp nghìn gồm hàng nghìn, chục nghìn, trăm nghìn; lớp triệu gồm hàng triệu, chục triệu, trăm triệu.'));
};
const compose4: T4Template = (r, c, l) => {
  const n = randN(r, c);
  const s = String(n);
  const terms = s.split('').map((d, i) => Number(d) * 10 ** (s.length - 1 - i)).filter((x) => x > 0);
  if (terms.length < 3) return null;
  const hide = r.int(0, terms.length - 1);
  return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${f(n)} = ${terms.map((t, i) => (i === hide ? '{}' : f(t))).join(' + ')}`], [[terms[hide]]],
    M('T4.SO.02', 'TOAN.DOCVIET', 'viet_thanh_tong', l, `${f(n)} = ${terms.map(f).join(' + ')}.`));
};
const compareBig: T4Template = (r, c, l) => {
  const a = randN(r, c);
  const s = String(a);
  const i = r.int(0, s.length - 1);
  const b = r.chance(0.15) ? a : Number(s.slice(0, i) + r.int(i === 0 ? 1 : 0, 9) + s.slice(i + 1));
  const sign = a > b ? '>' : a < b ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${f(a)} … ${f(b)}`, ['>', '<', '='], sign, M('T4.SO.03', 'TOAN.SOSANH', 'so_sanh', l, a === b ? 'Hai số giống hệt nhau.' : `Cùng số chữ số; so sánh từng hàng từ trái sang phải: ${f(a)} ${sign} ${f(b)}.`));
};
const orderBig: T4Template = (r, c, l) => {
  const base = randN(r, c);
  const s = String(base);
  const set = new Set<number>([base]);
  for (let k = 0; k < 15 && set.size < 4; k++) {
    const i = r.int(0, s.length - 1);
    const x = Number(s.slice(0, i) + r.int(i === 0 ? 1 : 0, 9) + s.slice(i + 1));
    if (x <= c.max) set.add(x);
  }
  if (set.size < 4) return null;
  const order = [...set].sort((x, y) => x - y).map(f);
  return Q.ord('Sắp xếp các số theo thứ tự từ bé đến lớn.', order, M('T4.SO.03', 'TOAN.SAPXEP', 'sap_xep', l, `Thứ tự: ${order.join('; ')}.`));
};
const roundBig: T4Template = (r, c, l) => {
  const big = c.max > 1000000;
  const to = r.pick(big ? [1000, 10000, 100000] : [100, 1000, 10000]);
  const n = r.int(to * 2, Math.min(c.max, to * 900));
  if (n % to === 0) return null;
  const right = Math.round(n / to) * to;
  const opts = numChoices(r, right, [Math.floor(n / to) * to, Math.ceil(n / to) * to, right + to, right - to], c.max);
  if (!opts) return null;
  const name = PLACE[String(to).length - 1];
  return Q.sc(`Làm tròn số ${f(n)} đến hàng ${name} được:`, opts, f(right), M('T4.SO.04', 'TOAN.DOCVIET', 'lam_tron', l, `Xét chữ số ngay sau hàng ${name}: từ 5 trở lên thì làm tròn lên, bé hơn 5 thì làm tròn xuống. Được ${f(right)}.`));
};
const neighbor4: T4Template = (r, c, l) => {
  const n = randN(r, c);
  const before = r.chance(0.5);
  return Q.blanks(`Số liền ${before ? 'trước' : 'sau'} của ${f(n)} là:`, ['{}'], [[before ? n - 1 : n + 1]], M('T4.SO.03', 'TOAN.DOCVIET', 'lien_truoc_sau', l, `Hai số tự nhiên liên tiếp hơn kém nhau 1 đơn vị: ${f(before ? n - 1 : n + 1)}.`));
};
const evenOdd: T4Template = (r, c, l) => {
  const nums = Array.from({ length: 5 }, () => r.int(100, Math.min(c.max, 99999)));
  const even = r.chance(0.5);
  const right = nums.filter((x) => (x % 2 === 0) === even);
  if (!right.length || right.length === 5 || new Set(nums).size < 5) return null;
  return Q.mc(`Chọn tất cả số ${even ? 'chẵn' : 'lẻ'}.`, nums.map(f), right.map(f), M('T4.SO.01', 'TOAN.DOCVIET', 'chan_le', l, `Số chẵn có chữ số tận cùng 0, 2, 4, 6, 8; số lẻ có chữ số tận cùng 1, 3, 5, 7, 9. Số ${even ? 'chẵn' : 'lẻ'}: ${right.map(f).join(', ')}.`));
};
const evenCount: T4Template = (r, c, l) => {
  const a = r.int(10, 80), b = a + r.int(8, 30);
  const evens = Math.floor(b / 2) - Math.floor((a - 1) / 2);
  return Q.blanks(`Từ ${a} đến ${b} có bao nhiêu số chẵn?`, ['{} số'], [[evens]], M('T4.TD.04', 'TOAN.DOCVIET', 'dem_so_chan', l, `Liệt kê hoặc đếm cách 2: các số chẵn từ ${a % 2 ? a + 1 : a} đến ${b % 2 ? b - 1 : b}, có ${evens} số.`));
};
const makeBig: T4Template = (r, c, l) => {
  const d = Math.min(numDigits(c), 6);
  const digits = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], d);
  const big = r.chance(0.5);
  const sorted = [...digits].sort((a, b) => (big ? b - a : a - b));
  if (!big && sorted[0] === 0) { const k = sorted.findIndex((x) => x > 0); [sorted[0], sorted[k]] = [sorted[k], sorted[0]]; }
  const n = Number(sorted.join(''));
  if (n > c.max) return null;
  return Q.blanks(`Dùng cả ${d} chữ số ${digits.join(', ')} (mỗi chữ số một lần), viết số ${big ? 'lớn' : 'bé'} nhất.`, ['{}'], [[n]],
    M('T4.TD.04', 'TOAN.DOCVIET', 'lap_so', l, big ? `Chữ số lớn xếp ở hàng cao: ${f(n)}.` : `Chữ số bé nhất khác 0 đứng đầu, còn lại xếp tăng dần: ${f(n)}.`));
};
const naturalSeq: T4Template = (r, c, l) => {
  const kind = r.int(0, 2);
  if (kind === 0) return Q.sc('Số tự nhiên bé nhất là số nào?', ['0', '1', '10'], '0', M('T4.SO.03', 'TOAN.DOCVIET', 'day_so_tu_nhien', l, 'Dãy số tự nhiên bắt đầu từ 0: 0, 1, 2, 3, …'));
  if (kind === 1) return Q.sc('Có số tự nhiên lớn nhất không?', ['Không có, vì thêm 1 vào số nào cũng được số lớn hơn', 'Có, đó là 1 000 000', 'Có, đó là 999 999 999'], 'Không có, vì thêm 1 vào số nào cũng được số lớn hơn',
    M('T4.SO.03', 'TOAN.DOCVIET', 'khong_co_so_lon_nhat', l, 'Thêm 1 vào bất kì số tự nhiên nào cũng được số tự nhiên liền sau, nên không có số lớn nhất.'));
  const a = r.int(10, 90), n = r.int(5, 12);
  return Q.blanks(`Có bao nhiêu số tự nhiên từ ${a} đến ${a + n}?`, ['{} số'], [[n + 1]], M('T4.TD.04', 'TOAN.DOCVIET', 'dem_so', l, `Số các số = số cuối − số đầu + 1 = ${a + n} ${MINUS} ${a} + 1 = ${n + 1}.`));
};
const seqRule: T4Template = (r, c, l) => {
  const step = r.pick([2, 5, 10, 100, 1000, 5000]);
  const start = r.int(1, 999) * (step >= 100 ? 10 : 1);
  const cells = Array.from({ length: 5 }, (_, i) => start + i * step);
  if (start + 5 * step > c.max) return null;
  return Q.blanks('Tìm quy luật rồi viết số tiếp theo.', [`${cells.map(f).join('; ')}; {}`], [[start + 5 * step]], M('T4.TD.02', 'TOAN.QUYLUAT', 'quy_luat', l, `Mỗi số hơn số trước ${f(step)}: số tiếp theo là ${f(start + 5 * step)}.`));
};

// =========================================================================== CỘNG, TRỪ, TÍNH CHẤT
const addPairBig = (r: Rng, c: T4Ctx): [number, number] => {
  const top = Math.min(c.max, c.max > 1000000 ? 9999999 : c.max);
  const a = r.int(Math.floor(top / 20), Math.floor(top * 0.6)), b = r.int(Math.floor(top / 30), top - a);
  return [a, b];
};
const addCalc4: T4Template = (r, c, l) => {
  const [a, b] = addPairBig(r, c);
  const sub = c.topics.includes('subBig') || (!c.topics.includes('addBig') && r.chance(0.5));
  if (sub) return Q.blanks('Tính.', [`${f(a + b)} ${MINUS} ${f(b)} = {}`], [[a]], M('T4.PT.01', 'TOAN.TINH', 'tru', l, `Đặt tính, trừ từ phải sang trái: ${f(a + b)} ${MINUS} ${f(b)} = ${f(a)}.`));
  return Q.blanks('Tính.', [`${f(a)} + ${f(b)} = {}`], [[a + b]], M('T4.PT.01', 'TOAN.TINH', 'cong', l, `Đặt tính, cộng từ phải sang trái: ${f(a)} + ${f(b)} = ${f(a + b)}.`));
};
const addPick4: T4Template = (r, c, l) => {
  const [a, b] = addPairBig(r, c);
  const opts = numChoices(r, a + b, [a + b + 10, a + b - 100, a + b + 1000, a + b - 1], c.max);
  if (!opts) return null;
  return Q.sc(`${f(a)} + ${f(b)} = ?`, opts, f(a + b), M('T4.PT.01', 'TOAN.TINH', 'chon_tong', l, `${f(a)} + ${f(b)} = ${f(a + b)}.`));
};
const findX4: T4Template = (r, c, l) => {
  const [a, b] = addPairBig(r, c);
  if (r.chance(0.5)) return Q.blanks('Tìm x.', [`x + ${f(b)} = ${f(a + b)}`, 'x = {}'], [[a]], M('T4.PT.01', 'TOAN.TIMX', 'tim_so_hang', l, `x = ${f(a + b)} ${MINUS} ${f(b)} = ${f(a)}.`));
  return Q.blanks('Tìm x.', [`x ${MINUS} ${f(b)} = ${f(a)}`, 'x = {}'], [[a + b]], M('T4.PT.01', 'TOAN.TIMX', 'tim_so_bi_tru', l, `x = ${f(a)} + ${f(b)} = ${f(a + b)}.`));
};
const addWord4: T4Template = (r, c, l) => {
  const [a, b] = addPairBig(r, c);
  const u = r.pick(['lượt khách', 'cuốn sách', 'cây giống', 'chiếc khẩu trang']);
  if (r.chance(0.5)) return Q.blanks(`Tháng Một bán được ${f(a)} ${u}, tháng Hai bán được nhiều hơn tháng Một ${f(b)} ${u}. Tháng Hai bán được bao nhiêu ${u}?`, [`{} ${u}`], [[a + b]],
    M('T4.PT.01', 'TOAN.LOIVAN', 'loi_van_cong', l, `${f(a)} + ${f(b)} = ${f(a + b)} (${u}).`));
  return Q.blanks(`Nhà máy làm được ${f(a + b)} ${u}, đã chuyển đi ${f(b)} ${u}. Còn lại bao nhiêu ${u}?`, [`{} ${u}`], [[a]],
    M('T4.PT.01', 'TOAN.LOIVAN', 'loi_van_tru', l, `${f(a + b)} ${MINUS} ${f(b)} = ${f(a)} (${u}).`));
};
const smartAdd: T4Template = (r, c, l) => {
  const a = r.int(11, 99) * 10 + r.int(1, 9);
  const k = r.pick([100, 1000]);
  const b = k * r.int(2, 9) - a, d = r.int(100, 900);
  if (b <= 0) return null;
  return Q.blanks('Tính bằng cách thuận tiện.', [`${f(a)} + ${f(d)} + ${f(b)} = {}`], [[a + b + d]],
    M('T4.PT.02', 'TOAN.TINH', 'tinh_thuan_tien', l, `Đổi chỗ và nhóm: (${f(a)} + ${f(b)}) + ${f(d)} = ${f(a + b)} + ${f(d)} = ${f(a + b + d)}.`));
};
const addPropPick: T4Template = (r, c, l) => {
  const a = r.int(100, 999), b = r.int(100, 999), d = r.int(10, 99);
  const right = `(${a} + ${b}) + ${d} = ${a} + (${b} + ${d})`;
  return Q.sc('Đẳng thức nào thể hiện tính chất kết hợp của phép cộng?', r.shuffle([right, `${a} + ${b} = ${b} + ${a}`, `${a} + 0 = ${a}`]), right,
    M('T4.PT.02', 'TOAN.TINH', 'tinh_chat_ket_hop', l, 'Kết hợp: (a + b) + c = a + (b + c). Giao hoán: a + b = b + a.'));
};
const sumDiff4: T4Template = (r, c, l) => {
  const small = r.int(20, 900) * (c.max > 100000 ? 10 : 1), diff = r.int(5, 400) * 2;
  const big = small + diff, sum = big + small;
  if (sum > c.max) return null;
  const askBig = r.chance(0.5);
  return Q.blanks(`Tổng của hai số là ${f(sum)}, hiệu của hai số là ${f(diff)}. Tìm số ${askBig ? 'lớn' : 'bé'}.`, ['{}'], [[askBig ? big : small]],
    M('T4.PT.03', 'TOAN.LOIVAN', 'tong_hieu', l, askBig ? `Số lớn = (Tổng + Hiệu) : 2 = (${f(sum)} + ${f(diff)}) : 2 = ${f(big)}.` : `Số bé = (Tổng ${MINUS} Hiệu) : 2 = (${f(sum)} ${MINUS} ${f(diff)}) : 2 = ${f(small)}.`));
};
const sumDiffWord: T4Template = (r, c, l) => {
  const small = r.int(15, 60), diff = r.int(2, 20) * 2;
  const big = small + diff;
  const k1 = kid(r), k2 = kid(r, k1);
  return Q.blanks(`${k1} và ${k2} có tất cả ${big + small} viên bi. ${k1} có nhiều hơn ${k2} ${diff} viên. Hỏi ${k1} có bao nhiêu viên bi?`, ['{} viên'], [[big]],
    M('T4.PT.03', 'TOAN.LOIVAN', 'tong_hieu_loi_van', l, `Số bi của ${k1} (số lớn) = (${big + small} + ${diff}) : 2 = ${big} (viên).`));
};
const sumDiffAge: T4Template = (r, c, l) => {
  const kidAge = r.int(8, 12), gap = r.int(24, 32);
  return Q.blanks(`Tổng số tuổi của mẹ và con là ${2 * kidAge + gap}. Mẹ hơn con ${gap} tuổi. Tính tuổi con.`, ['{} tuổi'], [[kidAge]],
    M('T4.TD.03', 'TOAN.LOIVAN', 'tong_hieu_tuoi', l, `Tuổi con (số bé) = (${2 * kidAge + gap} ${MINUS} ${gap}) : 2 = ${kidAge} (tuổi).`));
};

// =========================================================================== BIỂU THỨC CHỨA CHỮ, BÀI TOÁN BA BƯỚC
const letterExpr: T4Template = (r, c, l) => {
  const a = r.int(10, 200), b = r.int(2, 9), d = r.int(5, 99);
  const kind = r.int(0, 2);
  if (kind === 0) return Q.blanks(`Tính giá trị của biểu thức ${d} + a × ${b} với a = ${a}.`, ['{}'], [[d + a * b]], M('T4.PT.04', 'TOAN.BIEUTHUC', 'bieu_thuc_chu', l, `Thay a = ${a}, ta có ${d} + ${a} × ${b} = ${d} + ${a * b} = ${d + a * b}.`));
  if (kind === 1) {
    const m = r.int(2, 9);
    return Q.blanks(`Tính giá trị của biểu thức (a + b) × c với a = ${a}, b = ${d}, c = ${m}.`, ['{}'], [[(a + d) * m]], M('T4.PT.04', 'TOAN.BIEUTHUC', 'bieu_thuc_ba_chu', l, `(${a} + ${d}) × ${m} = ${a + d} × ${m} = ${(a + d) * m}.`));
  }
  return Q.blanks(`Chu vi hình vuông cạnh a là P = a × 4. Tính P với a = ${a} cm.`, ['P = {} cm'], [[a * 4]], M('T4.PT.04', 'TOAN.BIEUTHUC', 'cong_thuc', l, `P = ${a} × 4 = ${a * 4} (cm).`));
};
const letterPick: T4Template = (r, c, l) => {
  const a = r.int(2, 30), b = r.int(2, 9);
  const val = a * b - a;
  const opts = numChoices(r, val, [a * b, a * (b - 2), val + b], 100000);
  if (!opts || val < 0) return null;
  return Q.sc(`Với m = ${a}, giá trị của biểu thức m × ${b} ${MINUS} m là:`, opts, f(val), M('T4.PT.04', 'TOAN.BIEUTHUC', 'chon_gia_tri', l, `${a} × ${b} ${MINUS} ${a} = ${a * b} ${MINUS} ${a} = ${val}.`));
};
const threeStep: T4Template = (r, c, l) => {
  const price = r.int(3, 9) * 1000, n = r.int(2, 5), other = r.int(5, 20) * 1000, pay = 100000;
  const total = price * n + other;
  if (total >= pay) return null;
  return Q.blanks(`Mẹ mua ${n} quyển vở, mỗi quyển ${f(price)} đồng và một hộp bút giá ${f(other)} đồng. Mẹ đưa ${f(pay)} đồng. Cô bán hàng trả lại bao nhiêu tiền?`, ['{} đồng'], [[pay - total]],
    M('T4.PT.05', 'TOAN.LOIVAN', 'ba_buoc', l, `Tiền vở: ${f(price)} × ${n} = ${f(price * n)}. Tất cả: ${f(price * n)} + ${f(other)} = ${f(total)}. Trả lại: ${f(pay)} ${MINUS} ${f(total)} = ${f(pay - total)} (đồng).`));
};
const threeStepGoods: T4Template = (r, c, l) => {
  const a = r.int(120, 400), more = r.int(20, 90), k = r.int(2, 4);
  const b = a + more, d = b * k;
  if (!okOp(c, b, '*', k)) return null;
  return Q.blanks(`Kho A có ${a} tấn gạo, kho B nhiều hơn kho A ${more} tấn, kho C gấp ${k} lần kho B. Cả ba kho có bao nhiêu tấn gạo?`, ['{} tấn'], [[a + b + d]],
    M('T4.PT.05', 'TOAN.LOIVAN', 'ba_buoc_kho', l, `Kho B: ${a} + ${more} = ${b}. Kho C: ${b} × ${k} = ${d}. Cả ba: ${a} + ${b} + ${f(d)} = ${f(a + b + d)} (tấn).`));
};

// =========================================================================== GÓC, ĐƯỜNG THẲNG, HÌNH
const angleKind: T4Template = (r, c, l) => {
  const deg = r.pick([30, 45, 60, 75, 90, 110, 120, 135, 150, 180]);
  const kind = deg < 90 ? 'góc nhọn' : deg === 90 ? 'góc vuông' : deg < 180 ? 'góc tù' : 'góc bẹt';
  return Q.sc(`Góc có số đo ${deg}° là:`, ['góc nhọn', 'góc vuông', 'góc tù', 'góc bẹt'], kind, M('T4.HH.01', 'TOAN.HINH', 'loai_goc', l, 'Góc nhọn bé hơn 90°; góc vuông bằng 90°; góc tù lớn hơn 90° và bé hơn 180°; góc bẹt bằng 180°.'));
};
const angleFacts: T4Template = (r, c, l) => {
  const items: [string, number, string][] = [['Góc vuông có số đo {}°', 90, 'Góc vuông bằng 90°.'], ['Góc bẹt có số đo {}°', 180, 'Góc bẹt bằng 180°.'], ['Góc bẹt bằng {} góc vuông', 2, '180° = 90° × 2.']];
  const [line, v, why] = r.pick(items);
  return Q.blanks('Viết số thích hợp.', [line], [[v]], M('T4.HH.01', 'TOAN.HINH', 'so_do_goc', l, why));
};
const angleClock4: T4Template = (r, c, l) => {
  const h = r.pick([1, 2, 3, 4, 5, 6, 9, 10, 11]);
  const deg = Math.min(h, 12 - h) * 30;
  const kind = deg < 90 ? 'góc nhọn' : deg === 90 ? 'góc vuông' : deg < 180 ? 'góc tù' : 'góc bẹt';
  return Q.sc(`Lúc ${h} giờ đúng, kim giờ và kim phút tạo thành góc gì?`, ['góc nhọn', 'góc vuông', 'góc tù', 'góc bẹt'], kind,
    M('T4.TD.04', 'TOAN.HINH', 'goc_dong_ho', l, `Mỗi khoảng giữa hai số trên mặt đồng hồ là 30°. Lúc ${h} giờ hai kim cách ${Math.min(h, 12 - h)} khoảng, tức ${deg}°: ${kind}.`), { figure: { kind: 'clock', hour: h, minute: 0, alt: `Đồng hồ chỉ ${h} giờ` } });
};
const angleSum: T4Template = (r, c, l) => {
  const kind = r.int(0, 2);
  if (kind === 0) {
    const a = 5 * r.int(1, 17);
    return Q.blanks(`Một góc vuông được chia thành hai góc, một góc có số đo ${a}°. Góc còn lại có số đo bao nhiêu độ?`, ['{}°'], [[90 - a]],
      M('T4.TD.04', 'TOAN.HINH', 'chia_goc_vuong', l, `Góc vuông bằng 90°. 90 ${MINUS} ${a} = ${90 - a} (độ).`));
  }
  if (kind === 1) {
    const a = 10 * r.int(1, 17);
    return Q.blanks(`Một góc bẹt được chia thành hai góc, một góc có số đo ${a}°. Góc còn lại có số đo bao nhiêu độ?`, ['{}°'], [[180 - a]],
      M('T4.TD.04', 'TOAN.HINH', 'chia_goc_bet', l, `Góc bẹt bằng 180°. 180 ${MINUS} ${a} = ${180 - a} (độ).`));
  }
  const [P, Q1, R1] = r.pick([['A', 'B', 'C'], ['M', 'N', 'P'], ['D', 'E', 'G'], ['H', 'I', 'K']]);
  const a = 5 * r.int(2, 16);
  return Q.blanks(`Hai đường thẳng ${P}O và ${R1}O vuông góc với nhau tại O. Tia O${Q1} nằm giữa hai tia đó, góc ${P}O${Q1} = ${a}°. Góc ${Q1}O${R1} có số đo bao nhiêu độ?`, ['{}°'], [[90 - a]],
    M('T4.TD.04', 'TOAN.HINH', 'chia_goc_vuong', l, `Hai đường thẳng vuông góc tạo góc vuông 90°. 90 ${MINUS} ${a} = ${90 - a} (độ).`));
};
const angleDiff: T4Template = (r, c, l) => {
  const a = 5 * r.int(4, 34), b = 5 * r.int(2, 17);
  if (a === b) return null;
  const kindOf = (x: number) => (x < 90 ? 'góc nhọn' : x === 90 ? 'góc vuông' : 'góc tù');
  if (r.chance(0.5)) {
    const [big, small] = a > b ? [a, b] : [b, a];
    return Q.blanks(`Góc thứ nhất có số đo ${big}°, góc thứ hai có số đo ${small}°. Góc thứ nhất lớn hơn góc thứ hai bao nhiêu độ?`, ['{}°'], [[big - small]],
      M('T4.TD.04', 'TOAN.HINH', 'so_sanh_goc', l, `${big} ${MINUS} ${small} = ${big - small} (độ).`));
  }
  const x = a % 180 === 0 ? 95 : a;
  const opts = ['góc nhọn', 'góc vuông', 'góc tù', 'góc bẹt'];
  return Q.sc(`Góc có số đo ${x}° là góc gì?`, opts, kindOf(x),
    M('T4.TD.04', 'TOAN.HINH', 'loai_goc', l, `Góc nhọn bé hơn 90°, góc vuông bằng 90°, góc tù lớn hơn 90° và bé hơn 180°, góc bẹt bằng 180°. ${x}° là ${kindOf(x)}.`));
};
const lineFacts: T4Template = (r, c, l) => {
  const rows: [string, boolean][] = r.sample([
    ['Hai đường thẳng vuông góc tạo thành bốn góc vuông.', true] as [string, boolean],
    ['Hai đường thẳng song song không bao giờ cắt nhau.', true] as [string, boolean],
    ['Hai đường thẳng song song cắt nhau tại một điểm.', false] as [string, boolean],
    ['Hai cạnh kề nhau của hình chữ nhật vuông góc với nhau.', true] as [string, boolean],
    ['Hai cạnh đối diện của hình chữ nhật song song với nhau.', true] as [string, boolean],
    ['Dùng ê ke để vẽ hai đường thẳng vuông góc.', true] as [string, boolean],
    ['Hai đường thẳng vuông góc tạo thành hai góc nhọn và hai góc tù.', false] as [string, boolean],
  ], 4);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T4.HH.02', 'TOAN.DUNGSAI', 'vuong_goc_song_song', l, 'Vuông góc: cắt nhau tạo 4 góc vuông. Song song: không bao giờ cắt nhau.'));
};
const linePick: T4Template = (r, c, l) => {
  const items: [string, string, string[]][] = [
    ['Hai đường ray tàu hoả thẳng gợi cho ta hình ảnh hai đường thẳng', 'song song', ['vuông góc', 'cắt nhau tạo góc tù']],
    ['Mép bàn và chân bàn đứng thẳng gợi cho ta hình ảnh hai đường thẳng', 'vuông góc', ['song song', 'trùng nhau']],
    ['Hai cạnh đối diện của tờ giấy hình chữ nhật', 'song song', ['vuông góc', 'cắt nhau']],
    ['Hai cạnh kề nhau của viên gạch hình vuông', 'vuông góc', ['song song', 'không gặp nhau']],
  ];
  const [q, a, wrong] = r.pick(items);
  return Q.sc(`${q}:`, r.shuffle([a, ...wrong]), a, M('T4.HH.02', 'TOAN.HINH', 'nhan_biet_duong_thang', l, `${q} ${a}.`));
};
const rectLines: T4Template = (r, c, l) => {
  const ask = r.chance(0.5);
  return Q.blanks(`Hình chữ nhật ABCD có bao nhiêu cặp cạnh ${ask ? 'song song' : 'vuông góc'} với nhau?`, ['{} cặp'], [[ask ? 2 : 4]],
    M('T4.TD.04', 'TOAN.HINH', 'cap_canh', l, ask ? 'AB song song CD, AD song song BC: 2 cặp.' : 'Mỗi góc vuông cho một cặp cạnh vuông góc: AB–AD, AB–BC, CD–BC, CD–AD: 4 cặp.'));
};
const paraFacts: T4Template = (r, c, l) => {
  const rows: [string, boolean][] = r.sample([
    ['Hình bình hành có hai cặp cạnh đối diện song song và bằng nhau.', true] as [string, boolean],
    ['Hình thoi có bốn cạnh bằng nhau.', true] as [string, boolean],
    ['Hình thoi có hai cặp cạnh đối diện song song.', true] as [string, boolean],
    ['Hình bình hành nào cũng có bốn góc vuông.', false] as [string, boolean],
    ['Hình bình hành có bốn cạnh bằng nhau.', false] as [string, boolean],
    ['Hình vuông cũng là một hình thoi đặc biệt.', true] as [string, boolean],
  ], 4);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T4.HH.02', 'TOAN.DUNGSAI', 'binh_hanh_thoi', l, 'Hình bình hành: hai cặp cạnh đối diện song song và bằng nhau. Hình thoi: hình bình hành có bốn cạnh bằng nhau.'));
};
const paraPerim: T4Template = (r, c, l) => {
  if (r.chance(0.5)) { const a = r.int(5, 40), b = r.int(3, a); return Q.blanks(`Hình bình hành có hai cạnh kề dài ${a} cm và ${b} cm. Tính chu vi hình bình hành.`, ['{} cm'], [[(a + b) * 2]], M('T4.HH.02', 'TOAN.CHUVI', 'chu_vi_binh_hanh', l, `Hai cặp cạnh đối diện bằng nhau: (${a} + ${b}) × 2 = ${(a + b) * 2} (cm).`)); }
  const a = r.int(3, 30);
  return Q.blanks(`Hình thoi có cạnh ${a} cm. Tính chu vi hình thoi.`, ['{} cm'], [[a * 4]], M('T4.HH.02', 'TOAN.CHUVI', 'chu_vi_thoi', l, `Bốn cạnh bằng nhau: ${a} × 4 = ${a * 4} (cm).`));
};
const shapePick4: T4Template = (r, c, l) => {
  const items: [string, string][] = [['Tứ giác có hai cặp cạnh đối diện song song và bằng nhau', 'hình bình hành'], ['Tứ giác có hai cặp cạnh đối diện song song và bốn cạnh bằng nhau', 'hình thoi'], ['Tứ giác có bốn góc vuông và bốn cạnh bằng nhau', 'hình vuông']];
  const [q, a] = r.pick(items);
  return Q.sc(`${q} là:`, ['hình bình hành', 'hình thoi', 'hình vuông'], a, M('T4.HH.02', 'TOAN.HINH', 'nhan_dang_hinh', l, `${q} là ${a}.`));
};

// =========================================================================== ĐƠN VỊ ĐO
const massConvert: T4Template = (r, c, l) => {
  const items: [string, number, string][] = [['1 yến = {} kg', 10, '1 yến = 10 kg.'], ['1 tạ = {} kg', 100, '1 tạ = 100 kg.'], ['1 tấn = {} kg', 1000, '1 tấn = 1000 kg.'], ['1 tấn = {} tạ', 10, '1 tấn = 10 tạ.'], ['1 tạ = {} yến', 10, '1 tạ = 10 yến.']];
  const n = r.int(2, 9);
  const multi: [string, number, string][] = [[`${n} yến = {} kg`, n * 10, `${n} × 10 = ${n * 10}.`], [`${n} tạ = {} kg`, n * 100, `${n} × 100 = ${n * 100}.`], [`${n} tấn = {} kg`, n * 1000, `${n} × 1000 = ${f(n * 1000)}.`]];
  const [line, v, why] = r.pick(r.chance(0.5) ? items : multi);
  return Q.blanks('Viết số thích hợp.', [line], [[v]], M('T4.DL.01', 'TOAN.DOLUONG', 'yen_ta_tan', l, why));
};
const massCompare: T4Template = (r, c, l) => {
  const pairs: [string, number, string, number][] = [['3 tạ', 300, '30 yến', 300], ['2 tấn', 2000, '19 tạ', 1900], ['5 yến', 50, '48 kg', 48], ['1 tấn', 1000, '1100 kg', 1100], ['7 tạ', 700, '700 kg', 700], ['4 yến', 40, '1 tạ', 100]];
  const [x, xv, y, yv] = r.pick(pairs);
  const sign = xv > yv ? '>' : xv < yv ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${x} … ${y}`, ['>', '<', '='], sign, M('T4.DL.01', 'TOAN.DOLUONG', 'so_sanh_khoi_luong', l, `Đổi về ki-lô-gam: ${f(xv)} kg ${sign} ${f(yv)} kg.`));
};
const massWord: T4Template = (r, c, l) => {
  const bag = r.pick([50, 25]), bags = r.pick([4, 8, 12, 16, 20, 24, 28, 32, 36, 40]);
  const total = bag * bags;
  if (total % 100 !== 0) return null;
  return Q.blanks(`Một xe chở ${bags} bao gạo, mỗi bao ${bag} kg. Xe chở bao nhiêu tạ gạo?`, ['{} tạ'], [[total / 100]],
    M('T4.DL.01', 'TOAN.LOIVAN', 'khoi_luong_loi_van', l, `${bags} bao, mỗi bao ${bag} kg: tất cả ${f(total)} kg. Vì 100 kg = 1 tạ nên ${f(total)} kg = ${total / 100} tạ.`));
};
const areaConvert: T4Template = (r, c, l) => {
  const n = r.int(2, 9);
  const items: [string, number, string][] = [['1 dm² = {} cm²', 100, '1 dm² = 100 cm².'], ['1 m² = {} dm²', 100, '1 m² = 100 dm².'], ['1 cm² = {} mm²', 100, '1 cm² = 100 mm².'], [`${n} m² = {} dm²`, n * 100, `${n} × 100 = ${n * 100}.`], [`${n} dm² = {} cm²`, n * 100, `${n} × 100 = ${n * 100}.`], ['1 m² = {} cm²', 10000, '1 m² = 100 dm² = 10 000 cm².']];
  const [line, v, why] = r.pick(items);
  return Q.blanks('Viết số thích hợp.', [line], [[v]], M('T4.DL.02', 'TOAN.DOLUONG', 'dien_tich_don_vi', l, why));
};
const areaUnitPick: T4Template = (r, c, l) => {
  const items: [string, string][] = [['Diện tích lớp học khoảng 50 …', 'm²'], ['Diện tích mặt bàn học khoảng 30 …', 'dm²'], ['Diện tích một con tem khoảng 4 …', 'cm²'], ['Diện tích móng tay khoảng 80 …', 'mm²']];
  const [q, a] = r.pick(items);
  return Q.sc(`Chọn đơn vị thích hợp: ${q}`, ['m²', 'dm²', 'cm²', 'mm²'], a, M('T4.DL.02', 'TOAN.DOLUONG', 'chon_don_vi_dien_tich', l, `${q.replace('…', a)}.`));
};
const roomTiles: T4Template = (r, c, l) => {
  const a = r.int(3, 8), b = r.int(3, 6);
  return Q.blanks(`Nền phòng hình chữ nhật dài ${a} m, rộng ${b} m. Lát nền bằng các viên gạch vuông cạnh 1 dm. Cần bao nhiêu viên gạch?`, ['{} viên'], [[a * b * 100]],
    M('T4.TD.03', 'TOAN.DOLUONG', 'lat_gach', l, `Diện tích nền: ${a} × ${b} = ${a * b} (m²) = ${f(a * b * 100)} dm². Mỗi viên 1 dm² nên cần ${f(a * b * 100)} viên.`));
};
const timeConvert: T4Template = (r, c, l) => {
  const n = r.int(2, 9);
  const items: [string, number, string][] = [['1 phút = {} giây', 60, '1 phút = 60 giây.'], ['1 thế kỉ = {} năm', 100, '1 thế kỉ = 100 năm.'], [`${n} phút = {} giây`, n * 60, `${n} × 60 = ${n * 60}.`], [`${n} thế kỉ = {} năm`, n * 100, `${n} × 100 = ${n * 100}.`], ['Nửa phút = {} giây', 30, 'Nửa phút là 30 giây.']];
  const [line, v, why] = r.pick(items);
  return Q.blanks('Viết số thích hợp.', [line], [[v]], M('T4.DL.03', 'TOAN.GIOLICH', 'giay_the_ki', l, why));
};
const centuryOf: T4Template = (r, c, l) => {
  const y = r.int(1001, 2099);
  const cent = Math.ceil(y / 100);
  const ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  return Q.sc(`Năm ${y} thuộc thế kỉ nào?`, r.shuffle([cent, cent - 1, cent + 1].map((x) => `thế kỉ ${ROM[x]}`)), `thế kỉ ${ROM[cent]}`,
    M('T4.DL.03', 'TOAN.GIOLICH', 'the_ki', l, `Thế kỉ ${ROM[cent]} gồm các năm từ ${(cent - 1) * 100 + 1} đến ${cent * 100}.`));
};
const secondsRace: T4Template = (r, c, l) => {
  const a = r.int(55, 80), b = r.int(55, 80);
  if (a === b) return null;
  const k1 = kid(r), k2 = kid(r, k1);
  const win = a < b ? k1 : k2;
  return Q.sc(`${k1} chạy hết ${a} giây, ${k2} chạy hết ${b} giây. Ai chạy nhanh hơn?`, [k1, k2], win,
    M('T4.DL.03', 'TOAN.GIOLICH', 'so_sanh_giay', l, `Ai chạy hết ít thời gian hơn thì nhanh hơn: ${win} (${Math.min(a, b)} giây).`));
};

// =========================================================================== NHÂN, CHIA
function mulPair4(r: Rng, c: T4Ctx, two = c.mulMax > 10): [number, number] | null {
  const b = two ? r.int(11, 99) : r.int(2, 9);
  const a = r.int(two ? 100 : 1000, Math.floor(Math.min(c.max, two ? 999999 : 99999999) / b));
  return okOp(c, a, '*', b) ? [a, b] : null;
}
const mulCalc4: T4Template = (r, c, l) => {
  const p = mulPair4(r, c);
  if (!p) return null;
  const [a, b] = p;
  return Q.blanks('Tính.', [`${f(a)} × ${b} = {}`], [[a * b]], M('T4.NC.01', 'TOAN.TINH', 'nhan', l, b > 9 ? `Nhân lần lượt với chữ số hàng đơn vị và hàng chục của ${b} rồi cộng hai tích riêng: ${f(a)} × ${b} = ${f(a * b)}.` : `Nhân từ phải sang trái, nhớ sang hàng bên trái: ${f(a)} × ${b} = ${f(a * b)}.`));
};
const mulPick4: T4Template = (r, c, l) => {
  const p = mulPair4(r, c);
  if (!p) return null;
  const [a, b] = p;
  const opts = numChoices(r, a * b, [a * b + 10, a * b - b, a * b + a, a * b + 100], c.max);
  if (!opts) return null;
  return Q.sc(`${f(a)} × ${b} = ?`, opts, f(a * b), M('T4.NC.01', 'TOAN.TINH', 'chon_tich', l, `${f(a)} × ${b} = ${f(a * b)}.`));
};
const divCalc4: T4Template = (r, c, l) => {
  const two = c.mulMax > 10;
  const b = two ? r.int(11, 99) : r.int(2, 9);
  const q = r.int(two ? 10 : 100, two ? 999 : 99999);
  if (q * b > c.max || !okOp(c, q * b, '/', b)) return null;
  return Q.blanks('Tính.', [`${f(q * b)} : ${b} = {}`], [[q]], M('T4.NC.01', 'TOAN.TINH', 'chia', l, `Chia từ trái sang phải (chia, nhân, trừ, hạ): ${f(q * b)} : ${b} = ${f(q)}.`));
};
const divRem4: T4Template = (r, c, l) => {
  const two = c.mulMax > 10;
  const b = two ? r.int(11, 60) : r.int(3, 9);
  const q = r.int(two ? 10 : 100, two ? 500 : 9999), rem = r.int(1, b - 1);
  const a = q * b + rem;
  if (a > c.max || !okOp(c, a, '/', b)) return null;
  return Q.blanks('Tính.', [`${f(a)} : ${b} = {} (dư {})`], [[q, rem]], M('T4.NC.01', 'TOAN.TINH', 'chia_co_du', l, `${f(a)} : ${b} = ${f(q)} (dư ${rem}); kiểm tra: ${f(q)} × ${b} + ${rem} = ${f(a)}.`));
};
const mulDivWord: T4Template = (r, c, l) => {
  const p = mulPair4(r, c);
  if (!p) return null;
  const [a, b] = p;
  if (r.chance(0.5)) return Q.blanks(`Mỗi thùng có ${f(a)} gói bánh. Hỏi ${b} thùng như thế có bao nhiêu gói bánh?`, ['{} gói'], [[a * b]], M('T4.NC.01', 'TOAN.LOIVAN', 'nhan_loi_van', l, `${f(a)} × ${b} = ${f(a * b)} (gói).`));
  if (!okOp(c, a * b, '/', b)) return null;
  return Q.blanks(`Có ${f(a * b)} quyển sách xếp đều vào ${b} giá. Mỗi giá có bao nhiêu quyển?`, ['{} quyển'], [[a]], M('T4.NC.01', 'TOAN.LOIVAN', 'chia_loi_van', l, `${f(a * b)} : ${b} = ${f(a)} (quyển).`));
};
const mulProps: T4Template = (r, c, l) => {
  const pairs: [number, number][] = c.mulMax > 10 ? [[2, 5], [4, 25], [5, 20], [25, 4], [2, 50], [8, 125]] : c.pow10 ? [[2, 5], [4, 25], [2, 50], [5, 2]] : [[2, 5], [5, 2]];
  const pair = r.pick(pairs);
  const x = r.int(11, 99);
  return Q.blanks('Tính bằng cách thuận tiện.', [`${pair[0]} × ${x} × ${pair[1]} = {}`], [[pair[0] * pair[1] * x]],
    M('T4.NC.02', 'TOAN.TINH', 'nhan_thuan_tien', l, `Đổi chỗ, nhóm: (${pair[0]} × ${pair[1]}) × ${x} = ${pair[0] * pair[1]} × ${x} = ${f(pair[0] * pair[1] * x)}.`));
};
const mulPropPick: T4Template = (r, c, l) => {
  const a = r.int(12, 99), b = r.int(2, 9), d = r.int(2, 9);
  const right = `(${a} × ${b}) × ${d} = ${a} × (${b} × ${d})`;
  return Q.sc('Đẳng thức nào thể hiện tính chất kết hợp của phép nhân?', r.shuffle([right, `${a} × ${b} = ${b} × ${a}`, `${a} × 1 = ${a}`]), right,
    M('T4.NC.02', 'TOAN.TINH', 'tinh_chat_nhan', l, 'Kết hợp: (a × b) × c = a × (b × c). Giao hoán: a × b = b × a.'));
};
const pow10: T4Template = (r, c, l) => {
  const k = r.pick(P10), n = r.int(12, 999);
  if (r.chance(0.5)) return Q.blanks('Tính nhẩm.', [`${n} × ${f(k)} = {}`], [[n * k]], M('T4.NC.02', 'TOAN.TINH', 'nhan_10_100', l, `Nhân với ${f(k)}: viết thêm ${String(k).length - 1} chữ số 0 vào bên phải: ${f(n * k)}.`));
  return Q.blanks('Tính nhẩm.', [`${f(n * k)} : ${f(k)} = {}`], [[n]], M('T4.NC.02', 'TOAN.TINH', 'chia_10_100', l, `Chia cho ${f(k)}: bỏ bớt ${String(k).length - 1} chữ số 0 ở bên phải: ${n}.`));
};
const distributive: T4Template = (r, c, l) => {
  const a = c.mulMax > 10 ? r.int(12, 99) : r.int(2, 9), b = r.int(10, 90), d = 100 - b;
  if (r.chance(0.5)) return Q.blanks('Tính bằng cách thuận tiện.', [`${a} × ${b} + ${a} × ${d} = {}`], [[a * 100]],
    M('T4.NC.02', 'TOAN.TINH', 'phan_phoi', l, `${a} × ${b} + ${a} × ${d} = ${a} × (${b} + ${d}) = ${a} × 100 = ${f(a * 100)}.`));
  const x = r.int(2, 9), y = r.int(11, 40), z = r.int(2, 9);
  return Q.blanks('Tính.', [`${x} × (${y} + ${z}) = {}`], [[x * (y + z)]], M('T4.NC.02', 'TOAN.TINH', 'nhan_mot_tong', l, `${x} × (${y} + ${z}) = ${x} × ${y} + ${x} × ${z} = ${x * y} + ${x * z} = ${x * (y + z)}.`));
};
const estimate: T4Template = (r, c, l) => {
  const a = r.int(11, 89) * 100 + r.int(1, 49), b = r.int(11, 89) * 100 + r.int(1, 49);
  const ra = Math.round(a / 1000) * 1000, rb = Math.round(b / 1000) * 1000;
  const right = ra + rb;
  const opts = numChoices(r, right, [right + 1000, right - 1000, right + 2000], c.max);
  if (!opts) return null;
  return Q.sc(`Làm tròn mỗi số đến hàng nghìn rồi ước lượng tổng ${f(a)} + ${f(b)} khoảng:`, opts, f(right),
    M('T4.NC.03', 'TOAN.TINH', 'uoc_luong', l, `${f(a)} ≈ ${f(ra)}; ${f(b)} ≈ ${f(rb)}; tổng khoảng ${f(right)}.`));
};
const average: T4Template = (r, c, l) => {
  const n = r.int(3, 5), avg = r.int(20, 150);
  const vals = Array.from({ length: n - 1 }, () => avg + r.int(-15, 15));
  const last = avg * n - vals.reduce((a, b) => a + b, 0);
  if (last <= 0) return null;
  const all = r.shuffle([...vals, last]);
  return Q.blanks(`Tìm số trung bình cộng của các số: ${all.join('; ')}.`, ['{}'], [[avg]], M('T4.NC.04', 'TOAN.TINH', 'trung_binh_cong', l, `Tổng: ${all.join(' + ')} = ${avg * n}. Trung bình cộng: ${avg * n} : ${n} = ${avg}.`));
};
const averageWord: T4Template = (r, c, l) => {
  const days = r.int(3, 5), avg = r.int(30, 90);
  const vals = Array.from({ length: days - 1 }, () => avg + r.int(-12, 12));
  const last = avg * days - vals.reduce((a, b) => a + b, 0);
  if (last <= 0) return null;
  const all = [...vals, last];
  return Q.blanks(`Một cửa hàng bán được số xe đạp trong ${days} ngày lần lượt là ${all.join(', ')} chiếc. Trung bình mỗi ngày bán được bao nhiêu chiếc?`, ['{} chiếc'], [[avg]],
    M('T4.NC.04', 'TOAN.LOIVAN', 'trung_binh_loi_van', l, `(${all.join(' + ')}) : ${days} = ${avg * days} : ${days} = ${avg} (chiếc).`));
};
const averageMissing: T4Template = (r, c, l) => {
  const avg = r.int(20, 80), a = avg + r.int(-10, 10), b = avg + r.int(-10, 10);
  const x = avg * 3 - a - b;
  if (x <= 0) return null;
  return Q.blanks(`Trung bình cộng của ba số là ${avg}. Hai số đầu là ${a} và ${b}. Tìm số thứ ba.`, ['{}'], [[x]],
    M('T4.TD.03', 'TOAN.TINH', 'tim_so_tu_tbc', l, `Tổng ba số: ${avg} × 3 = ${avg * 3}. Số thứ ba: ${avg * 3} ${MINUS} ${a} ${MINUS} ${b} = ${x}.`));
};
const unitRate4: T4Template = (r, c, l) => {
  const per = r.int(12, 95), n1 = r.int(3, 9), n2 = r.int(10, 40);
  if (!okOp(c, per, '*', n2) && c.mulMax <= 10) return null;
  return Q.blanks(`${n1} bao gạo như nhau nặng ${per * n1} kg. Hỏi ${n2} bao như thế nặng bao nhiêu ki-lô-gam?`, ['{} kg'], [[per * n2]],
    M('T4.NC.05', 'TOAN.LOIVAN', 'rut_ve_don_vi', l, `Mỗi bao: ${per * n1} : ${n1} = ${per} (kg). ${n2} bao: ${per} × ${n2} = ${f(per * n2)} (kg).`));
};
const unitRateInv: T4Template = (r, c, l) => {
  const per = r.int(4, c.mulMax > 10 ? 12 : 9), n1 = r.int(3, 9), total2 = per * r.int(10, 30);
  return Q.blanks(`${n1} hộp bút như nhau có ${per * n1} cây bút. Hỏi ${total2} cây bút thì xếp được bao nhiêu hộp như thế?`, ['{} hộp'], [[total2 / per]],
    M('T4.NC.05', 'TOAN.LOIVAN', 'rut_ve_don_vi_chia', l, `Mỗi hộp: ${per * n1} : ${n1} = ${per} (cây). Số hộp: ${total2} : ${per} = ${total2 / per} (hộp).`));
};

// =========================================================================== THỐNG KÊ
const SUBJ = ['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học'];
const dataSeq: T4Template = (r, c, l) => {
  const vals = Array.from({ length: 6 }, () => r.int(120, 160));
  if (new Set(vals).size < 6) return null;
  const ask = r.int(0, 2);
  const list = vals.map((v) => `${v} cm`).join('; ');
  if (ask === 0) return Q.blanks(`Chiều cao (cm) của 6 bạn trong nhóm: ${list}. Bạn cao nhất cao bao nhiêu xăng-ti-mét?`, ['{} cm'], [[Math.max(...vals)]], M('T4.TK.01', 'TOAN.THONGKE', 'day_so_lieu', l, `Số lớn nhất trong dãy: ${Math.max(...vals)} cm.`));
  if (ask === 1) return Q.blanks(`Chiều cao (cm) của 6 bạn trong nhóm: ${list}. Bạn cao nhất cao hơn bạn thấp nhất bao nhiêu xăng-ti-mét?`, ['{} cm'], [[Math.max(...vals) - Math.min(...vals)]],
    M('T4.TK.01', 'TOAN.THONGKE', 'chenh_lech', l, `${Math.max(...vals)} ${MINUS} ${Math.min(...vals)} = ${Math.max(...vals) - Math.min(...vals)} (cm).`));
  const k = r.int(2, 6);
  return Q.blanks(`Dãy số liệu chiều cao: ${list}. Số thứ ${k} trong dãy là bao nhiêu?`, ['{} cm'], [[vals[k - 1]]], M('T4.TK.01', 'TOAN.THONGKE', 'doc_day', l, `Đếm từ trái sang: số thứ ${k} là ${vals[k - 1]}.`));
};
const barChart: T4Template = (r, c, l) => {
  const vals = SUBJ.map(() => r.int(4, 18));
  if (new Set(vals).size < 4) return null;
  const chart = SUBJ.map((s, i) => `cột ${s}: ${vals[i]} bạn`).join('; ');
  const ask = r.int(0, 2);
  if (ask === 0) {
    const mi = vals.indexOf(Math.max(...vals));
    return Q.sc(`Biểu đồ cột về môn học yêu thích của lớp 4A có: ${chart}. Môn nào được nhiều bạn yêu thích nhất?`, SUBJ, SUBJ[mi], M('T4.TK.02', 'TOAN.THONGKE', 'bieu_do_cot', l, `Cột cao nhất: ${SUBJ[mi]} (${vals[mi]} bạn).`));
  }
  if (ask === 1) return Q.blanks(`Biểu đồ cột về môn học yêu thích của lớp 4A có: ${chart}. Lớp 4A có bao nhiêu học sinh (mỗi bạn chọn một môn)?`, ['{} bạn'], [[vals.reduce((a, b) => a + b, 0)]],
    M('T4.TK.02', 'TOAN.THONGKE', 'tong_bieu_do', l, `${vals.join(' + ')} = ${vals.reduce((a, b) => a + b, 0)} (bạn).`));
  const [i, j] = r.sample([0, 1, 2, 3], 2);
  const [hi, lo] = vals[i] > vals[j] ? [i, j] : [j, i];
  return Q.blanks(`Biểu đồ cột về môn học yêu thích của lớp 4A có: ${chart}. Môn ${SUBJ[hi]} hơn môn ${SUBJ[lo]} bao nhiêu bạn chọn?`, ['{} bạn'], [[vals[hi] - vals[lo]]],
    M('T4.TK.02', 'TOAN.THONGKE', 'so_sanh_cot', l, `${vals[hi]} ${MINUS} ${vals[lo]} = ${vals[hi] - vals[lo]} (bạn).`));
};
const eventCount: T4Template = (r, c, l) => {
  const n = r.int(12, 20), heads = r.int(3, n - 3);
  const seq = r.shuffle([...Array(heads).fill('S'), ...Array(n - heads).fill('N')]);
  return Q.blanks(`Tung đồng xu ${n} lần, ghi lại (S: sấp, N: ngửa): ${seq.join(' ')}. Mặt sấp xuất hiện bao nhiêu lần?`, ['{} lần'], [[heads]],
    M('T4.TK.03', 'TOAN.THONGKE', 'so_lan_xuat_hien', l, `Đếm các chữ S: ${heads} lần (mặt ngửa ${n - heads} lần).`));
};
const eventDice: T4Template = (r, c, l) => {
  const rolls = Array.from({ length: 12 }, () => r.int(1, 6));
  const face = r.int(1, 6);
  const cnt = rolls.filter((x) => x === face).length;
  return Q.blanks(`Gieo xúc xắc 12 lần được số chấm: ${rolls.join(', ')}. Mặt ${face} chấm xuất hiện bao nhiêu lần?`, ['{} lần'], [[cnt]],
    M('T4.TK.03', 'TOAN.THONGKE', 'dem_xuc_xac', l, `Đếm số ${face} trong dãy: ${cnt} lần.`));
};

// =========================================================================== PHÂN SỐ
const fracRead: T4Template = (r, c, l) => {
  const b = r.int(3, 12), a = r.int(1, b - 1);
  const NUMS = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai'];
  const opts = [...new Set([fr(a, b), fr(b, a), fr(a, b + 1), fr(a + 1, b)])].slice(0, 3);
  return Q.sc(`Phân số "${NUMS[a]} phần ${NUMS[b]}" viết là:`, r.shuffle(opts), fr(a, b), M('T4.PS.01', 'TOAN.PHANSO', 'doc_viet_phan_so', l, `Tử số ${a} viết trên, mẫu số ${b} viết dưới: ${fr(a, b)}.`));
};
const fracShape4: T4Template = (r, c, l) => {
  const b = r.int(3, 8), a = r.int(1, b - 1);
  const cells = Array.from({ length: b }, (_, i) => (i < a ? '🟦' : '⬜'));
  const opts = [...new Set([fr(a, b), fr(b - a, b), fr(a, b - a || 1), fr(b, a)])].filter((x) => !x.endsWith('/0')).slice(0, 3);
  return Q.sc('Phân số chỉ phần đã tô màu của hình là:', r.shuffle(opts), fr(a, b), M('T4.PS.01', 'TOAN.PHANSO', 'phan_to_mau', l, `Hình chia ${b} phần bằng nhau, tô ${a} phần: ${fr(a, b)}.`),
    { figure: { kind: 'grid', rows: 1, cols: b, cells, alt: `Hình chia ${b} phần bằng nhau, tô màu ${a} phần` } });
};
const fracParts: T4Template = (r, c, l) => {
  const b = r.int(3, 15), a = r.int(1, b - 1);
  return Q.blanks(`Phân số ${fr(a, b)} có tử số và mẫu số là bao nhiêu?`, ['Tử số: {}', 'Mẫu số: {}'], [[a, b]], M('T4.PS.01', 'TOAN.PHANSO', 'tu_mau', l, `Tử số ${a} (số trên gạch ngang), mẫu số ${b} (số dưới gạch ngang).`));
};
const fracDivision: T4Template = (r, c, l) => {
  const a = r.int(1, 20), b = r.int(2, 12);
  if (a === b) return null;
  if (r.chance(0.5)) return Q.sc(`Thương của phép chia ${a} : ${b} viết dưới dạng phân số là:`, r.shuffle([fr(a, b), fr(b, a), fr(a + b, b)]), fr(a, b),
    M('T4.PS.01', 'TOAN.PHANSO', 'thuong_phan_so', l, `Số bị chia là tử số, số chia là mẫu số: ${fr(a, b)}.`));
  const n = r.int(2, 9);
  return Q.blanks(`Viết số tự nhiên ${n} dưới dạng phân số có mẫu số là 1.`, ['{}/1'], [[n]], M('T4.PS.01', 'TOAN.PHANSO', 'so_tu_nhien_phan_so', l, `${n} = ${n}/1.`));
};
const fracCompare1: T4Template = (r, c, l) => {
  const b = r.int(3, 12), a = r.pick([b - r.int(1, b - 1), b, b + r.int(1, 5)]);
  const sign = a > b ? '>' : a < b ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${fr(a, b)} … 1`, ['>', '<', '='], sign, M('T4.PS.02', 'TOAN.PHANSO', 'so_sanh_voi_1', l, 'Tử số bé hơn mẫu số thì phân số bé hơn 1; bằng thì bằng 1; lớn hơn thì lớn hơn 1.'));
};
const fracEquiv: T4Template = (r, c, l) => {
  const b = r.int(2, 9), a = r.int(1, b - 1), k = r.int(2, 6);
  if (r.chance(0.5)) return Q.blanks('Viết số thích hợp.', [`${fr(a, b)} = {}/${b * k}`], [[a * k]], M('T4.PS.02', 'TOAN.PHANSO', 'tinh_chat_co_ban', l, `Mẫu số nhân ${k} thì tử số cũng nhân ${k}: ${a} × ${k} = ${a * k}.`));
  return Q.blanks('Viết số thích hợp.', [`${fr(a * k, b * k)} = {}/${b}`], [[a]], M('T4.PS.02', 'TOAN.PHANSO', 'tinh_chat_co_ban_chia', l, `Mẫu số chia ${k} thì tử số cũng chia ${k}: ${a * k} : ${k} = ${a}.`));
};
const fracReduce: T4Template = (r, c, l) => {
  let b = r.int(2, 12), a = r.int(1, b - 1);
  const g = gcd(a, b); a /= g; b /= g;
  if (b === 1) return null;
  const k = r.int(2, 9);
  return Q.blanks(`Rút gọn phân số ${fr(a * k, b * k)} thành phân số tối giản.`, ['{}/{}'], [[a, b]], M('T4.PS.02', 'TOAN.PHANSO', 'rut_gon', l, `Chia cả tử và mẫu cho ${k}: ${fr(a * k, b * k)} = ${fr(a, b)}.`));
};
const fracIrreducible: T4Template = (r, c, l) => {
  const pool: [number, number][] = [];
  for (let i = 0; i < 10; i++) { const b = r.int(3, 15), a = r.int(1, b - 1); pool.push([a, b]); }
  const uniq = [...new Map(pool.map((p) => [fr(p[0], p[1]), p])).values()].slice(0, 4);
  if (uniq.length < 4) return null;
  const right = uniq.filter(([a, b]) => gcd(a, b) === 1).map(([a, b]) => fr(a, b));
  if (!right.length || right.length === 4) return null;
  return Q.mc('Chọn tất cả phân số tối giản.', uniq.map(([a, b]) => fr(a, b)), right, M('T4.PS.02', 'TOAN.PHANSO', 'toi_gian', l, `Phân số tối giản: tử và mẫu không cùng chia hết cho số nào lớn hơn 1. Đó là ${right.join(', ')}.`));
};
const fracCommon: T4Template = (r, c, l) => {
  const b = r.int(2, 6), d = b * r.int(2, 3), a = r.int(1, b - 1), e = r.int(1, d - 1);
  return Q.blanks(`Quy đồng mẫu số hai phân số ${fr(a, b)} và ${fr(e, d)} (lấy mẫu số chung là ${d}).`, [`${fr(a, b)} = {}/${d}`, `${fr(e, d)} = {}/${d}`], [[a * (d / b), e]],
    M('T4.PS.03', 'TOAN.PHANSO', 'quy_dong', l, `${d} : ${b} = ${d / b}; ${fr(a, b)} = ${fr(a * (d / b), d)}; giữ nguyên ${fr(e, d)}.`));
};
const fracCmp: T4Template = (r, c, l) => {
  const same = r.chance(0.5);
  let a: number, b: number, x: number, y: number;
  if (same) { b = r.int(3, 12); y = b; a = r.int(1, b - 1); x = r.int(1, b - 1); }
  else { a = r.int(1, 5); x = a; b = r.int(a + 1, 12); y = r.int(a + 1, 12); }
  if (a * y === x * b && (a !== x || b !== y)) return null;
  const sign = a * y > x * b ? '>' : a * y < x * b ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${fr(a, b)} … ${fr(x, y)}`, ['>', '<', '='], sign,
    M('T4.PS.03', 'TOAN.PHANSO', 'so_sanh_phan_so', l, same ? 'Cùng mẫu số: phân số nào có tử số lớn hơn thì lớn hơn.' : 'Cùng tử số: phân số nào có mẫu số bé hơn thì lớn hơn.'));
};
const fracOrder: T4Template = (r, c, l) => {
  const b = r.pick([6, 8, 10, 12]);
  const nums = r.sample([...Array(b - 1).keys()].map((i) => i + 1), 4);
  const order = [...nums].sort((x, y) => x - y).map((n) => fr(n, b));
  return Q.ord('Sắp xếp các phân số theo thứ tự từ bé đến lớn.', order, M('T4.PS.03', 'TOAN.SAPXEP', 'xep_phan_so', l, `Cùng mẫu số ${b}: xếp theo tử số từ bé đến lớn.`));
};
const fracCmpDiff: T4Template = (r, c, l) => {
  const b = r.int(2, 5), d = b * 2, a = r.int(1, b - 1), e = r.int(1, d - 1);
  if (a * 2 === e) return null;
  const sign = a * 2 > e ? '>' : '<';
  return Q.sc(`Chọn dấu thích hợp: ${fr(a, b)} … ${fr(e, d)}`, ['>', '<', '='], sign, M('T4.PS.03', 'TOAN.PHANSO', 'so_sanh_khac_mau', l, `Quy đồng: ${fr(a, b)} = ${fr(a * 2, d)}; so sánh ${fr(a * 2, d)} với ${fr(e, d)}: ${sign}.`));
};
const fracAddSame: T4Template = (r, c, l) => {
  const b = r.int(4, 15), a = r.int(1, b - 2), x = r.int(1, b - a - 1);
  const sub = c.topics.includes('fracSub') && (!c.topics.includes('fracAdd') || r.chance(0.5));
  if (sub) return Q.blanks('Tính.', [`${fr(a + x, b)} ${MINUS} ${fr(x, b)} = {}/${b}`], [[a]], M('T4.PS.04', 'TOAN.PHANSO', 'tru_cung_mau', l, `Cùng mẫu số: trừ hai tử số, giữ nguyên mẫu: ${a + x} ${MINUS} ${x} = ${a}.`));
  return Q.blanks('Tính.', [`${fr(a, b)} + ${fr(x, b)} = {}/${b}`], [[a + x]], M('T4.PS.04', 'TOAN.PHANSO', 'cong_cung_mau', l, `Cùng mẫu số: cộng hai tử số, giữ nguyên mẫu: ${a} + ${x} = ${a + x}.`));
};
const fracAddDiff: T4Template = (r, c, l) => {
  const b = r.int(2, 5), d = b * r.int(2, 3), a = r.int(1, b - 1), e = r.int(1, d - 1);
  const k = d / b;
  const sub = c.topics.includes('fracSub') && (!c.topics.includes('fracAdd') || r.chance(0.5));
  if (sub) {
    if (a * k <= e) return null;
    return Q.blanks('Tính.', [`${fr(a, b)} ${MINUS} ${fr(e, d)} = {}/${d}`], [[a * k - e]], M('T4.PS.04', 'TOAN.PHANSO', 'tru_khac_mau', l, `Quy đồng: ${fr(a, b)} = ${fr(a * k, d)}; ${fr(a * k, d)} ${MINUS} ${fr(e, d)} = ${fr(a * k - e, d)}.`));
  }
  return Q.blanks('Tính.', [`${fr(a, b)} + ${fr(e, d)} = {}/${d}`], [[a * k + e]], M('T4.PS.04', 'TOAN.PHANSO', 'cong_khac_mau', l, `Quy đồng: ${fr(a, b)} = ${fr(a * k, d)}; ${fr(a * k, d)} + ${fr(e, d)} = ${fr(a * k + e, d)}.`));
};
const fracWordAdd: T4Template = (r, c, l) => {
  const b = r.pick([5, 6, 7, 8, 9, 10]), a = r.int(1, b - 3), x = r.int(1, b - a - 1);
  const rest = b - a - x;
  return Q.blanks(`Một tấm vải, ngày đầu bán ${fr(a, b)} tấm, ngày sau bán ${fr(x, b)} tấm. Hỏi còn lại bao nhiêu phần tấm vải?`, ['{}/' + b], [[rest]],
    M('T4.TD.03', 'TOAN.PHANSO', 'phan_con_lai', l, `Đã bán: ${fr(a, b)} + ${fr(x, b)} = ${fr(a + x, b)}. Cả tấm là ${fr(b, b)}; còn lại: ${fr(b, b)} ${MINUS} ${fr(a + x, b)} = ${fr(rest, b)}.`));
};
const fracMul: T4Template = (r, c, l) => {
  const a = r.int(1, 6), b = r.int(2, 9), x = r.int(1, 6), y = r.int(2, 9);
  return Q.blanks('Tính (không cần rút gọn).', [`${fr(a, b)} × ${fr(x, y)} = {}/{}`], [[a * x, b * y]], M('T4.PS.05', 'TOAN.PHANSO', 'nhan_phan_so', l, `Tử nhân tử, mẫu nhân mẫu: ${fr(a * x, b * y)}.`));
};
const fracMulNat: T4Template = (r, c, l) => {
  const b = r.int(3, 9), a = r.int(1, b - 1), n = r.int(2, 6);
  return Q.blanks('Tính (không cần rút gọn).', [`${fr(a, b)} × ${n} = {}/${b}`], [[a * n]], M('T4.PS.05', 'TOAN.PHANSO', 'nhan_so_tu_nhien', l, `Nhân tử số với ${n}, giữ mẫu: ${a} × ${n} = ${a * n}.`));
};
const fracDiv: T4Template = (r, c, l) => {
  const a = r.int(1, 6), b = r.int(2, 9), x = r.int(1, 6), y = r.int(2, 9);
  return Q.blanks('Tính (không cần rút gọn).', [`${fr(a, b)} : ${fr(x, y)} = {}/{}`], [[a * y, b * x]], M('T4.PS.05', 'TOAN.PHANSO', 'chia_phan_so', l, `Nhân với phân số đảo ngược ${fr(y, x)}: ${fr(a, b)} × ${fr(y, x)} = ${fr(a * y, b * x)}.`));
};
const fracReciprocal: T4Template = (r, c, l) => {
  const a = r.int(2, 9), b = r.int(2, 9);
  if (a === b) return null;
  return Q.sc(`Phân số đảo ngược của ${fr(a, b)} là:`, r.shuffle([fr(b, a), fr(a, b), fr(a + 1, b)]), fr(b, a), M('T4.PS.05', 'TOAN.PHANSO', 'dao_nguoc', l, `Đổi chỗ tử số và mẫu số: ${fr(b, a)}.`));
};
const fracOf: T4Template = (r, c, l) => {
  const b = r.int(2, 9), a = r.int(1, b - 1), k = r.int(2, 20);
  const n = b * k;
  return Q.blanks(`Tìm ${fr(a, b)} của ${n}.`, ['{}'], [[a * k]], M('T4.PS.06', 'TOAN.PHANSO', 'phan_so_cua_mot_so', l, `${n} × ${fr(a, b)} = ${n} : ${b} × ${a} = ${a * k}.`));
};
const fracOfWord: T4Template = (r, c, l) => {
  const b = r.pick([3, 4, 5]), a = r.int(1, b - 1), k = r.int(5, 12);
  const n = b * k;
  return Q.blanks(`Lớp 4B có ${n} học sinh, trong đó ${fr(a, b)} số học sinh thích đá cầu. Có bao nhiêu bạn thích đá cầu?`, ['{} bạn'], [[a * k]],
    M('T4.PS.06', 'TOAN.LOIVAN', 'phan_so_loi_van', l, `${n} × ${fr(a, b)} = ${a * k} (bạn).`));
};
const fracOfRest: T4Template = (r, c, l) => {
  const b = r.pick([3, 4, 5]), a = r.int(1, b - 1), k = r.int(4, 15);
  const n = b * k;
  return Q.blanks(`Một bể có ${n} lít nước, người ta dùng ${fr(a, b)} số nước. Trong bể còn lại bao nhiêu lít?`, ['{} lít'], [[n - a * k]],
    M('T4.TD.03', 'TOAN.LOIVAN', 'con_lai_phan_so', l, `Đã dùng: ${n} × ${fr(a, b)} = ${a * k} (lít). Còn lại: ${n} ${MINUS} ${a * k} = ${n - a * k} (lít).`));
};

// =========================================================================== NHÓM DẠNG THEO MẢNG KIẾN THỨC
type LvMap = Partial<Record<Level, T4Template[]>>;
const NUMS: LvMap = { 1: [readPick, writeRead], 2: [placeValue, compose4], 3: [compareBig, neighbor4], 4: [orderBig, roundBig], 5: [makeBig, seqRule] };
const ADD: LvMap = { 1: [addCalc4, addPick4], 2: [addCalc4, findX4], 3: [addWord4, findX4], 4: [smartAdd, sumDiff4], 5: [sumDiffWord, threeStep] };
const MUL: LvMap = { 1: [mulCalc4, mulPick4], 2: [divCalc4, mulCalc4], 3: [mulDivWord, divRem4], 4: [mulProps, unitRate4], 5: [averageMissing, unitRateInv] };
const FRAC_BASE: LvMap = { 1: [fracRead, fracShape4], 2: [fracParts, fracCompare1], 3: [fracEquiv, fracDivision], 4: [fracReduce, fracCmp], 5: [fracIrreducible, fracOrder] };

const T: Record<T4Topic, LvMap> = {
  num100k: NUMS, num1m: NUMS, numMillion: NUMS,
  placeClass: { 1: [placeValue, readPick], 2: [classPick, placeValue], 3: [classPick, compose4], 4: [compose4, orderBig], 5: [makeBig, seqRule] },
  roundBig: { 1: [roundBig], 2: [roundBig, compareBig], 3: [roundBig, orderBig], 4: [roundBig, estimate], 5: [makeBig, roundBig] },
  cmpBig: { 1: [compareBig], 2: [compareBig, neighbor4], 3: [orderBig, compareBig], 4: [orderBig, makeBig], 5: [makeBig, seqRule] },
  naturalSeq: { 1: [neighbor4, naturalSeq], 2: [naturalSeq, neighbor4], 3: [seqRule, naturalSeq], 4: [evenCount, naturalSeq], 5: [seqRule, evenCount] },
  ops100k: { 1: [addCalc4, mulCalc4], 2: [divCalc4, addPick4], 3: [addWord4, mulDivWord], 4: [findX4, divRem4], 5: [threeStep, threeStepGoods] },
  evenOdd: { 1: [evenOdd], 2: [evenOdd, neighbor4], 3: [evenOdd, evenCount], 4: [evenCount], 5: [evenCount, makeBig] },
  letterExpr: { 1: [letterExpr], 2: [letterExpr, letterPick], 3: [letterPick, letterExpr], 4: [letterPick, threeStep], 5: [threeStepGoods, letterExpr] },
  threeStep: { 1: [addWord4, mulDivWord], 2: [mulDivWord, addWord4], 3: [threeStep], 4: [threeStepGoods, threeStep], 5: [threeStepGoods, sumDiffWord] },
  angleMeasure: { 1: [angleFacts, angleKind, angleDiff], 2: [angleKind, angleFacts, angleDiff], 3: [angleClock4, angleKind, angleDiff], 4: [angleSum, angleClock4, angleDiff, G4.angle], 5: [angleSum, angleClock4, G4.angle] },
  angleKind: { 1: [angleKind, angleDiff], 2: [angleKind, angleFacts, angleDiff], 3: [angleClock4, angleKind, angleDiff], 4: [angleSum, angleClock4, angleDiff, G4.angle], 5: [angleSum, angleClock4, G4.angle] },
  mass: { 1: [massConvert, areaUnitPick], 2: [massConvert, massCompare], 3: [massCompare, massWord], 4: [massWord, unitRate4], 5: [unitRateInv, massWord] },
  areaUnit: { 1: [areaConvert, areaUnitPick], 2: [areaConvert, areaUnitPick], 3: [areaConvert, roomTiles], 4: [roomTiles], 5: [roomTiles, areaConvert] },
  timeUnit: { 1: [timeConvert], 2: [timeConvert, centuryOf], 3: [centuryOf, secondsRace], 4: [centuryOf, timeConvert], 5: [secondsRace, centuryOf] },
  addBig: ADD, subBig: ADD,
  addProps: { 1: [addPropPick, addCalc4], 2: [smartAdd, addPropPick], 3: [smartAdd, addWord4], 4: [smartAdd, findX4], 5: [smartAdd, sumDiff4] },
  sumDiff: { 1: [sumDiff4], 2: [sumDiff4, addCalc4], 3: [sumDiffWord, sumDiff4], 4: [sumDiffWord, sumDiffAge], 5: [sumDiffAge, sumDiffWord] },
  perpendicular: { 1: [linePick, lineFacts], 2: [lineFacts, linePick], 3: [rectLines, lineFacts], 4: [rectLines, angleSum, G4.rect], 5: [rectLines, angleSum, angleClock4, G4.rect, G4.diagMid] },
  parallel: { 1: [linePick, lineFacts], 2: [lineFacts, linePick], 3: [rectLines, lineFacts], 4: [rectLines, shapePick4, angleSum, G4.triH, G4.para], 5: [rectLines, paraPerim, G4.triH, G4.para] },
  parallelogram: { 1: [shapePick4, paraFacts], 2: [paraFacts, shapePick4], 3: [paraPerim, paraFacts], 4: [paraPerim, rectLines, G4.para], 5: [paraPerim, angleSum, G4.para, G4.diagMid] },
  mul1: MUL, div1: { 1: [divCalc4], 2: [divCalc4, divRem4], 3: [mulDivWord, divRem4], 4: [unitRateInv, divRem4], 5: [averageMissing, unitRateInv] },
  mulProps: { 1: [mulPropPick, mulCalc4], 2: [mulProps, mulPropPick], 3: [mulProps, mulDivWord], 4: [mulProps, distributive], 5: [mulProps, unitRate4] },
  mulPow10: { 1: [pow10], 2: [pow10, mulCalc4], 3: [pow10, mulProps], 4: [pow10, mulProps], 5: [pow10, unitRate4] },
  distributive: { 1: [distributive, pow10], 2: [distributive, mulPropPick], 3: [distributive, mulDivWord], 4: [distributive, mulProps], 5: [distributive, unitRate4] },
  mul2: MUL, div2: { 1: [divCalc4], 2: [divCalc4, divRem4], 3: [mulDivWord, divRem4], 4: [unitRateInv, divRem4], 5: [averageMissing, unitRateInv] },
  estimate: { 1: [estimate], 2: [estimate, roundBig], 3: [estimate, addWord4], 4: [estimate], 5: [estimate, threeStep] },
  average: { 1: [average], 2: [average, averageWord], 3: [averageWord, average], 4: [averageMissing, averageWord], 5: [averageMissing, sumDiffWord] },
  unitRate: { 1: [unitRate4], 2: [unitRate4, unitRateInv], 3: [unitRateInv, unitRate4], 4: [unitRateInv, threeStep], 5: [unitRateInv, averageMissing] },
  dataSeq: { 1: [dataSeq], 2: [dataSeq, eventCount], 3: [dataSeq, barChart], 4: [dataSeq, average], 5: [averageWord, dataSeq] },
  barChart: { 1: [barChart], 2: [barChart, dataSeq], 3: [barChart], 4: [barChart, averageWord], 5: [barChart, averageMissing] },
  eventCount: { 1: [eventCount], 2: [eventCount, eventDice], 3: [eventDice, eventCount], 4: [eventDice], 5: [eventDice, eventCount] },
  fracConcept: FRAC_BASE, fracDivision: { 1: [fracDivision, fracRead], 2: [fracDivision, fracParts], 3: [fracCompare1, fracDivision], 4: [fracCompare1, fracEquiv], 5: [fracEquiv, fracDivision] },
  fracProperty: { 1: [fracEquiv], 2: [fracEquiv, fracParts], 3: [fracEquiv, fracCompare1], 4: [fracReduce, fracEquiv], 5: [fracReduce, fracIrreducible] },
  fracReduce: { 1: [fracReduce, fracEquiv], 2: [fracReduce, fracEquiv], 3: [fracIrreducible, fracReduce], 4: [fracIrreducible, fracReduce], 5: [fracIrreducible, fracCmpDiff] },
  fracCommon: { 1: [fracCommon, fracEquiv], 2: [fracCommon, fracEquiv], 3: [fracCommon, fracReduce], 4: [fracCmpDiff, fracCommon], 5: [fracCmpDiff, fracOrder] },
  fracCompare: { 1: [fracCmp, fracCompare1], 2: [fracCmp, fracCompare1], 3: [fracOrder, fracCmp], 4: [fracCmpDiff, fracOrder], 5: [fracCmpDiff, fracIrreducible] },
  fracAdd: { 1: [fracAddSame], 2: [fracAddSame, fracAddDiff], 3: [fracAddDiff, fracAddSame], 4: [fracAddDiff, fracWordAdd], 5: [fracWordAdd, fracAddDiff] },
  fracSub: { 1: [fracAddSame], 2: [fracAddSame, fracAddDiff], 3: [fracAddDiff, fracAddSame], 4: [fracAddDiff, fracWordAdd], 5: [fracWordAdd, fracAddDiff] },
  fracMul: { 1: [fracMulNat, fracMul], 2: [fracMul, fracMulNat], 3: [fracMul, fracOf], 4: [fracOfWord, fracMul], 5: [fracOfRest, fracOfWord] },
  fracDiv: { 1: [fracReciprocal], 2: [fracDiv, fracReciprocal], 3: [fracDiv, fracMul], 4: [fracDiv, fracOfWord], 5: [fracOfRest, fracDiv] },
  fracOf: { 1: [fracOf], 2: [fracOf, fracMulNat], 3: [fracOfWord, fracOf], 4: [fracOfWord, fracOfRest], 5: [fracOfRest, fracWordAdd] },
};

const retry = (t: T4Template): T4Template => (r, c, l) => {
  for (let i = 0; i < 15; i++) {
    const q = t(r, c, l);
    if (q) return q;
  }
  return null;
};
const RETRIED = new Map<T4Template, T4Template>();
const wrap = (t: T4Template) => RETRIED.get(t) ?? (RETRIED.set(t, retry(t)), RETRIED.get(t)!);

export function t4Pool(topics: T4Topic[]): T4Pool {
  const pool: T4Pool = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const t of topics) for (const lv of [1, 2, 3, 4, 5] as Level[]) for (const fn of T[t][lv] ?? []) if (!pool[lv].includes(wrap(fn))) pool[lv].push(wrap(fn));
  return pool;
}

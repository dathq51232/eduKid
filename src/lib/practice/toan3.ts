// BỘ SINH CÂU — TOÁN 3 (bám trình tự Kết nối tri thức, Toán 3 tập một + tập hai, Bài 1–81).
//
// Mỗi bài chọn dạng câu theo các "mảng kiến thức" của bài (toan3-plan.ts). Số, tình huống, câu chữ sinh ngẫu nhiên theo
// seed — không chép bài tập của sách. Mức L4–L5 có dạng NÂNG CAO phổ biến ở lớp 3 (tìm thành phần nhiều bước, quy luật
// dãy số, bài toán rút về đơn vị, tuổi, tổng – hiệu, gấp – giảm liên tiếp, lập số, chu vi – diện tích ngược…), đề tự viết.
//
// "Không vượt trước" (npm run check:practice): số không quá phạm vi bài (1000 → 10 000 → 100 000); nhân, chia chỉ trong
// các bảng đã học cho tới Bài 22; từ Bài 23 nhân/chia số nhiều chữ số với số có một chữ số; chia có dư từ Bài 25.
// Số từ 1000 trở lên viết tách lớp bằng khoảng trắng hẹp (U+202F), ví dụ 12 345.

import type { Level } from '../content/types';
import type { T3Lesson, T3Topic } from '../content/toan3-plan';
import type { Figure } from '../figures';
import { KIDS, Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { G3 } from './count-shapes';

export type T3Ctx = { lesson: number; max: number; tables: number[]; newTable?: number; bigMul: boolean; remainder: boolean; topics: T3Topic[] };
export type T3Template = (r: Rng, c: T3Ctx, l: Level) => PracticeQuestion | null;
export type T3Pool = Record<Level, T3Template[]>;

export function t3Context(p: T3Lesson): T3Ctx {
  const newTable = p.topics.includes('table') && p.no >= 5 && p.no <= 12 ? p.tables[p.tables.length - 1] : undefined;
  return { lesson: p.no, max: p.scope.maxNumber, tables: p.tables, newTable, bigMul: !!p.scope.bigMul, remainder: !!p.scope.remainder, topics: p.topics };
}

const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });
const MINUS = '−';
const NB = ' ';
/** 12345 → "12 345" (khoảng trắng hẹp); số dưới 1000 giữ nguyên */
export const f = (n: number) => (n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NB) : String(n));
const kid = (r: Rng, not?: string) => r.pick(KIDS.filter((k) => k !== not));

// ------------------------------------------------------------------- đọc số đến 100 000
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
  if (n < 1000) return read3(n);
  const th = Math.floor(n / 1000), rest = n % 1000;
  const head = `${read3(th)} nghìn`;
  return rest ? `${head} ${read3(rest, true)}` : head;
}

// ------------------------------------------------------------------- phép tính hợp lệ theo bài
const inTable = (c: T3Ctx, a: number, b: number) => (c.tables.includes(a) && b >= 1 && b <= 10) || (c.tables.includes(b) && a >= 1 && a <= 10);
type Op = '+' | '-' | '*' | '/';
function okOp(c: T3Ctx, a: number, op: Op, b: number): boolean {
  if (a < 0 || b < 0 || a > c.max || b > c.max) return false;
  if (op === '+') return a + b <= c.max;
  if (op === '-') return b <= a;
  if (op === '*') return a * b <= c.max && (inTable(c, a, b) || (c.bigMul && Math.min(a, b) <= 9 && Math.min(a, b) >= 2));
  if (b < 2 || b > 9) return false;
  if (!c.bigMul) return c.tables.includes(b) && a % b === 0 && a / b <= 10;
  return a % b === 0 || c.remainder;
}
const tbl = (r: Rng, c: T3Ctx) => (c.newTable && r.chance(0.6) ? c.newTable : r.pick(c.tables));
const numChoices = (r: Rng, right: number, wrong: number[], max: number) => {
  const opts = [...new Set([right, ...wrong.filter((x) => Number.isInteger(x) && x >= 0 && x <= max && x !== right)])].slice(0, 4);
  return opts.length >= 3 ? r.shuffle(opts).map(f) : null;
};
const mixRows = (r: Rng, rows: [string, boolean][]) => (rows.length < 3 || rows.every((x) => x[1]) || rows.every((x) => !x[1]) ? null : r.shuffle(rows));

const THINGS3 = ['quyển vở', 'cây bút', 'quả cam', 'bông hoa', 'cái bánh', 'viên bi', 'quả trứng', 'chiếc kẹo', 'cây con', 'tấm thiệp'];
const thing = (r: Rng) => r.pick(THINGS3);

// =========================================================================== SỐ (đọc, viết, cấu tạo, so sánh)
const numRange = (c: T3Ctx): [number, number] => (c.topics.some((t) => t.endsWith('100k')) ? [10000, 99999] : c.topics.some((t) => t.endsWith('10k')) ? [1000, 9999] : [100, 999]);
const PLACE = ['đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn'];

const readPick: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const n = r.int(lo, hi);
  const s = String(n);
  // số nhiễu: đổi chỗ hai chữ số hoặc đổi một chữ số
  const swap = (i: number) => Number(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2));
  const wrong = [swap(r.int(0, s.length - 2)), n + 10 ** r.int(0, s.length - 2), swap(r.int(0, s.length - 2))].filter((x) => String(x).length === s.length && x !== n);
  const opts = [...new Set([n, ...wrong])].slice(0, 3);
  if (opts.length < 3) return null;
  return Q.sc(`Số "${readVi(n)}" viết là:`, r.shuffle(opts).map(f), f(n), M('T3.SO.02', 'TOAN.DOCVIET', 'doc_viet_so', l, `"${readVi(n)}" viết là ${f(n)}.`));
};
const writeReading: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const n = r.int(lo, hi);
  const wrong = [n + 1, n + 10 ** (String(n).length - 2), Number(String(n).split('').reverse().join(''))].filter((x) => x !== n && x <= hi && x >= lo);
  const opts = [...new Set([n, ...wrong])].slice(0, 3);
  if (opts.length < 3) return null;
  const read = opts.map(readVi);
  return Q.sc(`Số ${f(n)} đọc là:`, r.shuffle(read), readVi(n), M('T3.SO.02', 'TOAN.DOCVIET', 'doc_so', l, `${f(n)} đọc là "${readVi(n)}".`));
};
const placeDigit: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const n = r.int(lo, hi);
  const s = String(n);
  const p = r.int(0, s.length - 1); // vị trí từ phải sang
  const d = Number(s[s.length - 1 - p]);
  if (d === 0) return null;
  return Q.blanks(`Trong số ${f(n)}, chữ số ${d} ở hàng ${PLACE[p]} có giá trị là bao nhiêu?`, ['Giá trị: {}'], [[d * 10 ** p]],
    M('T3.SO.02', 'TOAN.DOCVIET', 'gia_tri_chu_so', l, `Chữ số ${d} ở hàng ${PLACE[p]} có giá trị ${f(d * 10 ** p)}.`));
};
const compose: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const n = r.int(lo, hi);
  const s = String(n);
  const parts = s.split('').map((d, i) => [Number(d), PLACE[s.length - 1 - i]] as [number, string]);
  const text = parts.map(([d, p]) => `${d} ${p}`).join(', ');
  return Q.blanks(`Viết số gồm ${text}.`, ['Số đó là: {}'], [[n]], M('T3.SO.02', 'TOAN.DOCVIET', 'cau_tao_so', l, `${text} viết là ${f(n)}.`));
};
const expandSum: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const n = r.int(lo, hi);
  const s = String(n);
  const terms = s.split('').map((d, i) => Number(d) * 10 ** (s.length - 1 - i)).filter((x) => x > 0);
  if (terms.length < 3) return null;
  const hide = r.int(0, terms.length - 1);
  const line = terms.map((t, i) => (i === hide ? '{}' : f(t))).join(' + ');
  return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${f(n)} = ${line}`], [[terms[hide]]],
    M('T3.SO.02', 'TOAN.DOCVIET', 'viet_thanh_tong', l, `${f(n)} = ${terms.map(f).join(' + ')}.`));
};
const neighbors: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const n = r.int(lo + 1, hi - 1);
  const before = r.chance(0.5);
  return Q.blanks(`Số liền ${before ? 'trước' : 'sau'} của ${f(n)} là số nào?`, ['{}'], [[before ? n - 1 : n + 1]],
    M('T3.SO.03', 'TOAN.DOCVIET', 'lien_truoc_sau', l, `Số liền ${before ? 'trước' : 'sau'} ${before ? 'kém' : 'hơn'} ${f(n)} một đơn vị: ${f(before ? n - 1 : n + 1)}.`));
};
const compareNums: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const a = r.int(lo, hi);
  const s = String(a);
  // số so sánh khác ở một hàng để buộc phải xét từng hàng
  const i = r.int(0, s.length - 1);
  const nd = r.int(i === 0 ? 1 : 0, 9);
  const b = r.chance(0.15) ? a : Number(s.slice(0, i) + nd + s.slice(i + 1));
  const sign = a > b ? '>' : a < b ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${f(a)} … ${f(b)}`, ['>', '<', '='], sign,
    M('T3.SO.03', 'TOAN.SOSANH', 'so_sanh', l, a === b ? 'Hai số giống nhau nên bằng nhau.' : `Hai số cùng số chữ số; so sánh từng hàng từ trái sang phải, gặp hàng khác nhau đầu tiên: ${f(a)} ${sign} ${f(b)}.`));
};
const orderNums: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const base = r.int(lo, hi - 1000 > lo ? hi - 1000 : hi);
  const s = String(base);
  const set = new Set<number>([base]);
  for (let k = 0; k < 12 && set.size < 4; k++) {
    const i = r.int(1, s.length - 1);
    const x = Number(s.slice(0, i) + r.int(0, 9) + s.slice(i + 1));
    if (x >= lo && x <= hi) set.add(x);
  }
  if (set.size < 4) return null;
  const asc = r.chance(0.6);
  const order = [...set].sort((x, y) => (asc ? x - y : y - x)).map(f);
  return Q.ord(`Sắp xếp các số theo thứ tự từ ${asc ? 'bé đến lớn' : 'lớn đến bé'}.`, order, M('T3.SO.03', 'TOAN.SAPXEP', 'sap_xep', l, `Thứ tự đúng: ${order.join('; ')}.`));
};
const maxMinPick: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const nums = [...new Set(Array.from({ length: 4 }, () => r.int(lo, hi)))];
  if (nums.length < 4) return null;
  const big = r.chance(0.5);
  const right = big ? Math.max(...nums) : Math.min(...nums);
  return Q.sc(`Số ${big ? 'lớn' : 'bé'} nhất trong các số sau là:`, nums.map(f), f(right), M('T3.SO.03', 'TOAN.SOSANH', 'lon_be_nhat', l, `So sánh từng hàng từ trái sang phải: số ${big ? 'lớn' : 'bé'} nhất là ${f(right)}.`));
};
const makeNumber: T3Template = (r, c, l) => {
  const d = numRange(c)[0] === 100 ? 3 : numRange(c)[0] === 1000 ? 4 : 5;
  const digits = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], d);
  const big = r.chance(0.5);
  const sorted = [...digits].sort((a, b) => (big ? b - a : a - b));
  if (!big && sorted[0] === 0) { const k = sorted.findIndex((x) => x > 0); [sorted[0], sorted[k]] = [sorted[k], sorted[0]]; }
  const n = Number(sorted.join(''));
  return Q.blanks(`Dùng cả ${d} chữ số ${digits.join(', ')} (mỗi chữ số dùng một lần), viết số ${big ? 'lớn' : 'bé'} nhất có ${d} chữ số.`, ['Số đó là: {}'], [[n]],
    M('T3.TD.04', 'TOAN.DOCVIET', 'lap_so', l, big ? `Xếp chữ số lớn ở hàng cao: ${f(n)}.` : `Chữ số bé nhất khác 0 đứng đầu, còn lại xếp từ bé đến lớn: ${f(n)}.`));
};
const evenRule: T3Template = (r, c, l) => {
  const [lo, hi] = numRange(c);
  const step = r.pick(lo >= 10000 ? [1000, 5000, 10000, 2000] : lo >= 1000 ? [100, 500, 1000, 200] : [10, 50, 100, 25]);
  const start = r.int(lo, Math.max(lo, hi - 6 * step));
  const cells = Array.from({ length: 5 }, (_, i) => start + i * step);
  const next = start + 5 * step;
  if (next > hi) return null;
  return Q.blanks('Tìm quy luật rồi viết số tiếp theo.', [`${cells.map(f).join('; ')}; {}`], [[next]],
    M('T3.TD.02', 'TOAN.QUYLUAT', 'quy_luat', l, `Mỗi số hơn số đứng trước ${f(step)} đơn vị. Số tiếp theo: ${f(next)}.`));
};

// =========================================================================== LÀM TRÒN, SỐ LA MÃ
const ROUND_TO: Record<string, number[]> = { round: [10, 100], round100k: [1000, 10000] };
const roundOf = (n: number, to: number) => Math.round(n / to) * to;
const roundTo: T3Template = (r, c, l) => {
  const big = c.topics.includes('round100k');
  const to = r.pick(ROUND_TO[big ? 'round100k' : 'round']);
  const n = r.int(big ? 10001 : 1001, big ? 99499 : 9949);
  if (n % to === 0) return null;
  const right = roundOf(n, to);
  const opts = numChoices(r, right, [Math.floor(n / to) * to, Math.ceil(n / to) * to, right + to, right - to], c.max);
  if (!opts) return null;
  const name = to === 10 ? 'chục' : to === 100 ? 'trăm' : to === 1000 ? 'nghìn' : 'chục nghìn';
  const dig = Number(String(n).slice(-String(to).length)[0]);
  return Q.sc(`Làm tròn số ${f(n)} đến hàng ${name} được số nào?`, opts, f(right),
    M('T3.SO.04', 'TOAN.DOCVIET', 'lam_tron', l, `Xét chữ số ở hàng ngay sau hàng ${name} là ${dig}: ${dig >= 5 ? 'từ 5 trở lên thì làm tròn lên' : 'bé hơn 5 thì làm tròn xuống'}. Kết quả ${f(right)}.`));
};
const roundTable: T3Template = (r, c, l) => {
  const big = c.topics.includes('round100k');
  const to = r.pick(ROUND_TO[big ? 'round100k' : 'round']);
  const rows: [string, boolean][] = Array.from({ length: 4 }, () => {
    const n = r.int(big ? 10001 : 1001, big ? 99499 : 9949);
    const right = roundOf(n, to);
    const alt = right + (r.chance(0.5) ? to : -to);
    const shown = r.chance(0.5) || alt > c.max || alt <= 0 ? right : alt;
    return [`Làm tròn ${f(n)} đến hàng ${to === 10 ? 'chục' : to === 100 ? 'trăm' : to === 1000 ? 'nghìn' : 'chục nghìn'} được ${f(shown)}.`, shown === right];
  });
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.SO.04', 'TOAN.DUNGSAI', 'lam_tron_ds', l, 'Xét chữ số ở hàng ngay sau hàng cần làm tròn: từ 5 trở lên thì làm tròn lên, bé hơn 5 thì làm tròn xuống.'));
};
const roundRange: T3Template = (r, c, l) => {
  const big = c.topics.includes('round100k');
  const to = big ? 1000 : 100;
  const target = r.int(big ? 12 : 12, big ? 98 : 98) * to;
  const lo = target - to / 2, hi = target + to / 2 - 1;
  const ask = r.chance(0.5);
  return Q.blanks(`Một số khi làm tròn đến hàng ${to === 100 ? 'trăm' : 'nghìn'} được ${f(target)}. Số ${ask ? 'bé' : 'lớn'} nhất có thể là số nào?`, ['{}'], [[ask ? lo : hi]],
    M('T3.TD.04', 'TOAN.DOCVIET', 'lam_tron_nguoc', l, `Các số từ ${f(lo)} đến ${f(hi)} làm tròn đều được ${f(target)}. Số ${ask ? 'bé' : 'lớn'} nhất là ${f(ask ? lo : hi)}.`));
};
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
const romanRead: T3Template = (r, c, l) => {
  const n = r.int(1, 20);
  const opts = numChoices(r, n, [n + 1, n - 1, n === 4 ? 6 : n === 9 ? 11 : n + 2, n + 10], 20);
  if (!opts) return null;
  return Q.sc(`Số La Mã ${ROMAN[n]} là số nào?`, opts, String(n), M('T3.SO.05', 'TOAN.DOCVIET', 'so_la_ma', l, `${ROMAN[n]} = ${n}. (I = 1, V = 5, X = 10; chữ bé đứng trước chữ lớn thì trừ, đứng sau thì cộng.)`));
};
const romanWrite: T3Template = (r, c, l) => {
  const n = r.pick([4, 6, 9, 11, 14, 16, 19, 12, 7, 15, 18, 20]);
  const wrong = n === 4 ? ['IIII', 'VI'] : n === 9 ? ['VIIII', 'XI'] : n === 6 ? ['IV', 'VII'] : n === 11 ? ['IX', 'XII'] : n === 14 ? ['XVI', 'XIIII'] : n === 16 ? ['XIV', 'XVII'] : n === 19 ? ['XXI', 'XVIIII'] : n === 20 ? ['XIX', 'XVIII'] : [ROMAN[n - 1], ROMAN[n + 1]];
  return Q.sc(`Số ${n} viết bằng chữ số La Mã là:`, r.shuffle([ROMAN[n], ...wrong]), ROMAN[n], M('T3.SO.05', 'TOAN.DOCVIET', 'viet_la_ma', l, `${n} viết là ${ROMAN[n]}.`));
};
const romanOrder: T3Template = (r, c, l) => {
  const ns = r.sample([...Array(20).keys()].map((x) => x + 1), 4);
  const asc = [...ns].sort((a, b) => a - b).map((n) => ROMAN[n]);
  return Q.ord('Sắp xếp các số La Mã theo thứ tự từ bé đến lớn.', asc, M('T3.SO.05', 'TOAN.SAPXEP', 'xep_la_ma', l, `Đổi ra số: ${[...ns].sort((a, b) => a - b).map((n) => `${ROMAN[n]} = ${n}`).join('; ')}.`));
};
const romanClock: T3Template = (r, c, l) => {
  const h = r.int(1, 12);
  return Q.blanks(`Mặt đồng hồ ghi số La Mã. Kim giờ chỉ đúng vào số ${ROMAN[h]}, kim phút chỉ vào số XII. Đồng hồ chỉ mấy giờ?`, ['{} giờ'], [[h]],
    M('T3.SO.05', 'TOAN.GIOLICH', 'dong_ho_la_ma', l, `${ROMAN[h]} = ${h}; kim phút chỉ XII là giờ đúng: ${h} giờ.`));
};
const romanSticks: T3Template = (r, c, l) => {
  // chuyển một que diêm: số La Mã đứng ở hai đầu
  const pairs: [string, number, string][] = [['VI', 6, 'Bớt I ở bên phải V: V = 5'], ['IV', 4, 'Thêm I bên phải V: VI = 6'], ['XI', 11, 'Chuyển I sang trái X: IX = 9'], ['IX', 9, 'Chuyển I sang phải X: XI = 11']];
  const [from, n, how] = r.pick(pairs);
  const target = from === 'VI' ? 4 : from === 'IV' ? 6 : from === 'XI' ? 9 : 11;
  return Q.blanks(`Số La Mã ${from} (bằng ${n}). Chuyển chỗ que I sang bên kia của chữ còn lại thì được số nào?`, ['{}'], [[target]],
    M('T3.TD.04', 'TOAN.DOCVIET', 'que_diem_la_ma', l, `${how.replace(/: .*$/, '')}: được ${ROMAN[target]} = ${target}.`));
};

// =========================================================================== CỘNG, TRỪ
/** Cặp số cộng/trừ theo phạm vi bài */
const addRange = (c: T3Ctx): [number, number] => {
  if (c.topics.some((t) => t === 'add100k' || t === 'sub100k')) return [10000, 99999];
  if (c.topics.some((t) => t === 'add10k' || t === 'sub10k')) return [1000, 9999];
  return [100, 999];
};
function addPair(r: Rng, c: T3Ctx): [number, number] | null {
  const [lo, hi] = addRange(c);
  const a = r.int(lo, Math.floor(hi * 0.7)), b = r.int(Math.floor(lo / 2), hi - a);
  return a + b <= Math.min(hi, c.max) && b > 0 ? [a, b] : null;
}
const addCalc: T3Template = (r, c, l) => {
  const p = addPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const sub = c.topics.some((t) => t.startsWith('sub')) || (c.topics.includes('addsub1000') && r.chance(0.5)) || (!c.topics.some((t) => t.startsWith('add')) && r.chance(0.5));
  if (sub) return Q.blanks('Tính.', [`${f(a + b)} ${MINUS} ${f(b)} = {}`], [[a]], M('T3.PT.03', 'TOAN.TINH', 'tru', l, `Đặt tính rồi trừ từ phải sang trái (nhớ khi cần): ${f(a + b)} ${MINUS} ${f(b)} = ${f(a)}.`));
  return Q.blanks('Tính.', [`${f(a)} + ${f(b)} = {}`], [[a + b]], M('T3.PT.03', 'TOAN.TINH', 'cong', l, `Đặt tính rồi cộng từ phải sang trái (nhớ khi cần): ${f(a)} + ${f(b)} = ${f(a + b)}.`));
};
const addPick: T3Template = (r, c, l) => {
  const p = addPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const sub = c.topics.some((t) => t.startsWith('sub')) && r.chance(0.6);
  const right = sub ? a : a + b;
  const opts = numChoices(r, right, [right + 10, right - 10, right + 100, right - 1000, right + 1], c.max);
  if (!opts) return null;
  const expr = sub ? `${f(a + b)} ${MINUS} ${f(b)}` : `${f(a)} + ${f(b)}`;
  return Q.sc(`Kết quả của ${expr} là:`, opts, f(right), M('T3.PT.03', 'TOAN.TINH', 'chon_ket_qua', l, `${expr} = ${f(right)}. Chú ý phép ${sub ? 'trừ có nhớ' : 'cộng có nhớ'} sang hàng bên trái.`));
};
const addWord: T3Template = (r, c, l) => {
  const p = addPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const sub = r.chance(0.5);
  const unit = r.pick(['quyển sách', 'cây giống', 'kg gạo', 'lít nước', 'viên gạch']);
  const place = r.pick(['Thư viện', 'Nông trại', 'Cửa hàng', 'Nhà máy']);
  if (sub) return Q.blanks(`${place} có ${f(a + b)} ${unit}, đã dùng ${f(b)} ${unit}. Hỏi ${place.toLowerCase()} còn lại bao nhiêu ${unit}?`, [`{} ${unit}`], [[a]],
    M('T3.PT.03', 'TOAN.LOIVAN', 'loi_van_tru', l, `Còn lại: ${f(a + b)} ${MINUS} ${f(b)} = ${f(a)} (${unit}).`));
  return Q.blanks(`${place} có ${f(a)} ${unit}, nhận thêm ${f(b)} ${unit}. Hỏi ${place.toLowerCase()} có tất cả bao nhiêu ${unit}?`, [`{} ${unit}`], [[a + b]],
    M('T3.PT.03', 'TOAN.LOIVAN', 'loi_van_cong', l, `Tất cả: ${f(a)} + ${f(b)} = ${f(a + b)} (${unit}).`));
};
const findAddSub: T3Template = (r, c, l) => {
  const p = addPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const kind = r.int(0, 2);
  if (kind === 0) return Q.blanks('Tìm số thích hợp.', [`{} + ${f(b)} = ${f(a + b)}`], [[a]], M('T3.PT.02', 'TOAN.TIMX', 'tim_so_hang', l, `Số hạng = Tổng ${MINUS} Số hạng kia: ${f(a + b)} ${MINUS} ${f(b)} = ${f(a)}.`));
  if (kind === 1) return Q.blanks('Tìm số thích hợp.', [`{} ${MINUS} ${f(b)} = ${f(a)}`], [[a + b]], M('T3.PT.02', 'TOAN.TIMX', 'tim_so_bi_tru', l, `Số bị trừ = Hiệu + Số trừ: ${f(a)} + ${f(b)} = ${f(a + b)}.`));
  return Q.blanks('Tìm số thích hợp.', [`${f(a + b)} ${MINUS} {} = ${f(a)}`], [[b]], M('T3.PT.02', 'TOAN.TIMX', 'tim_so_tru', l, `Số trừ = Số bị trừ ${MINUS} Hiệu: ${f(a + b)} ${MINUS} ${f(a)} = ${f(b)}.`));
};
const findChain: T3Template = (r, c, l) => {
  const p = addPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const d = r.int(1, Math.max(1, Math.min(b - 1, Math.floor(a / 3))));
  // x + b − d = a + b − d ⇒ x = a
  const res = a + b - d;
  return Q.blanks('Tìm số thích hợp.', [`{} + ${f(b)} ${MINUS} ${f(d)} = ${f(res)}`], [[a]],
    M('T3.TD.01', 'TOAN.TIMX', 'tim_x_hai_buoc', l, `Tính ngược từ cuối: ${f(res)} + ${f(d)} = ${f(res + d)}; ${f(res + d)} ${MINUS} ${f(b)} = ${f(a)}.`));
};
const addTable: T3Template = (r, c, l) => {
  const rows: [string, boolean][] = Array.from({ length: 4 }, (): [string, boolean] => {
    const p = addPair(r, c);
    if (!p) return ['', true];
    const [a, b] = p;
    const truth = r.chance(0.5);
    const shown = truth ? a + b : a + b + r.pick([10, -10, 100, 1, -1]);
    if (shown > c.max) return ['', true];
    return [`${f(a)} + ${f(b)} = ${f(shown)}`, truth] as [string, boolean];
  }).filter((x) => x[0]);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.PT.03', 'TOAN.DUNGSAI', 'cong_ds', l, 'Tính lại từng phép cộng (đặt tính, nhớ sang hàng bên trái) rồi so với kết quả đã cho.'));
};
const compareSum: T3Template = (r, c, l) => {
  const p = addPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const d = r.pick([1, 10, 100]);
  const right = a + b;
  const other = Math.min(c.max, right + r.pick([-d, 0, d]));
  const sign = right > other ? '>' : right < other ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${f(a)} + ${f(b)} … ${f(other)}`, ['>', '<', '='], sign, M('T3.PT.03', 'TOAN.SOSANH', 'so_sanh_tong', l, `${f(a)} + ${f(b)} = ${f(right)}, mà ${f(right)} ${sign} ${f(other)}.`));
};

// =========================================================================== BẢNG NHÂN, BẢNG CHIA
const tableMul: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(2, 10);
  if (!okOp(c, a, '*', b)) return null;
  return Q.blanks('Tính nhẩm.', [`${a} × ${b} = {}`], [[a * b]], M('T3.NC.01', 'TOAN.NHANCHIA', 'bang_nhan', l, `Theo bảng nhân ${a}, ${a} × ${b} = ${a * b}.`));
};
const tableDiv: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(2, 10);
  if (!okOp(c, a * b, '/', a)) return null;
  return Q.blanks('Tính nhẩm.', [`${a * b} : ${a} = {}`], [[b]], M('T3.NC.01', 'TOAN.NHANCHIA', 'bang_chia', l, `Vì ${a} × ${b} = ${a * b} nên ${a * b} : ${a} = ${b}.`));
};
const tablePick: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(3, 10);
  const right = a * b;
  const opts = numChoices(r, right, [right + a, right - a, (a + 1) * b, right + 1], 100);
  if (!opts) return null;
  return Q.sc(`${a} × ${b} = ?`, opts, String(right), M('T3.NC.01', 'TOAN.NHANCHIA', 'chon_tich', l, `${a} × ${b} = ${right}. Mẹo: ${a} × ${b} = ${a} × ${b - 1} + ${a} = ${a * (b - 1)} + ${a}.`));
};
const tableSeq: T3Template = (r, c, l) => {
  const a = tbl(r, c);
  const start = r.int(1, 5);
  const cells = [start, start + 1, start + 2, start + 3].map((k) => k * a);
  return Q.blanks(`Đếm thêm ${a} rồi viết số tiếp theo.`, [`${cells.join('; ')}; {}`], [[(start + 4) * a]],
    M('T3.NC.01', 'TOAN.QUYLUAT', 'dem_them', l, `Mỗi số hơn số trước ${a} đơn vị (các tích trong bảng nhân ${a}). Số tiếp theo: ${(start + 4) * a}.`));
};
const tableWord: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(2, 9);
  if (!okOp(c, a, '*', b) || !okOp(c, a * b, '/', a)) return null;
  const s = thing(r);
  if (r.chance(0.5)) return Q.blanks(`Mỗi hộp có ${a} ${s}. Hỏi ${b} hộp như thế có bao nhiêu ${s}?`, [`{} ${s}`], [[a * b]],
    M('T3.NC.01', 'TOAN.LOIVAN', 'loi_van_nhan', l, `${b} hộp, mỗi hộp ${a} ${s}: ${a} × ${b} = ${a * b} (${s}).`));
  return Q.blanks(`Có ${a * b} ${s} chia đều vào ${a} hộp. Hỏi mỗi hộp có bao nhiêu ${s}?`, [`{} ${s}`], [[b]],
    M('T3.NC.01', 'TOAN.LOIVAN', 'loi_van_chia', l, `Chia đều thành ${a} phần: ${a * b} : ${a} = ${b} (${s}).`));
};
const family: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(2, 9);
  if (a === b || !okOp(c, a * b, '/', b) || !okOp(c, a * b, '/', a)) return null;
  return Q.blanks(`Từ ba số ${a}, ${b}, ${a * b}, viết các phép tính đúng.`, [`${a} × ${b} = {}`, `${a * b} : ${a} = {}`, `${a * b} : ${b} = {}`], [[a * b, b, a]],
    M('T3.NC.01', 'TOAN.NHANCHIA', 'phep_tinh_lien_quan', l, `${a} × ${b} = ${a * b}, nên ${a * b} : ${a} = ${b} và ${a * b} : ${b} = ${a}.`));
};
const tableCompare: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(2, 9), x = r.pick(c.tables), y = r.int(2, 9);
  const L1 = a * b, R1 = x * y;
  if (L1 === R1 && r.chance(0.5)) return null;
  const sign = L1 > R1 ? '>' : L1 < R1 ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${a} × ${b} … ${x} × ${y}`, ['>', '<', '='], sign, M('T3.NC.01', 'TOAN.SOSANH', 'so_sanh_tich', l, `${a} × ${b} = ${L1}; ${x} × ${y} = ${R1}. Vậy ${L1} ${sign} ${R1}.`));
};
const findMulDiv: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(2, 9);
  if (!okOp(c, a, '*', b) || !okOp(c, a * b, '/', a)) return null;
  const kind = r.int(0, 2);
  if (kind === 0) return Q.blanks('Tìm số thích hợp.', [`{} × ${a} = ${a * b}`], [[b]], M('T3.NC.02', 'TOAN.TIMX', 'tim_thua_so', l, `Thừa số = Tích : Thừa số kia: ${a * b} : ${a} = ${b}.`));
  if (kind === 1) return Q.blanks('Tìm số thích hợp.', [`{} : ${a} = ${b}`], [[a * b]], M('T3.NC.02', 'TOAN.TIMX', 'tim_so_bi_chia', l, `Số bị chia = Thương × Số chia: ${b} × ${a} = ${a * b}.`));
  if (!okOp(c, a * b, '/', b)) return null;
  return Q.blanks('Tìm số thích hợp.', [`${a * b} : {} = ${b}`], [[a]], M('T3.NC.02', 'TOAN.TIMX', 'tim_so_chia', l, `Số chia = Số bị chia : Thương: ${a * b} : ${b} = ${a}.`));
};
const findMulChain: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(2, 9), d = r.int(2, 20);
  if (!okOp(c, a, '*', b)) return null;
  const res = a * b + d;
  if (res > c.max) return null;
  return Q.blanks('Tìm số thích hợp.', [`{} × ${a} + ${d} = ${res}`], [[b]],
    M('T3.TD.01', 'TOAN.TIMX', 'tim_x_hai_buoc', l, `Tính ngược: ${res} ${MINUS} ${d} = ${a * b}; ${a * b} : ${a} = ${b}.`));
};
const legs: T3Template = (r, c, l) => {
  const chick = r.int(2, 8), dog = r.int(2, 8);
  const heads = chick + dog, total = chick * 2 + dog * 4;
  return Q.blanks(`Trong sân có gà và chó, đếm được ${heads} cái đầu và ${total} cái chân. Hỏi có bao nhiêu con chó?`, ['{} con chó'], [[dog]],
    M('T3.TD.04', 'TOAN.LOIVAN', 'ga_cho', l, `Giả sử cả ${heads} con đều là gà thì có ${heads * 2} chân, thiếu ${total} ${MINUS} ${heads * 2} = ${total - heads * 2} chân. Mỗi con chó hơn con gà 2 chân nên số chó là ${total - heads * 2} : 2 = ${dog}.`));
};
const mulAddMix: T3Template = (r, c, l) => {
  const a = tbl(r, c), b = r.int(2, 9), d = r.int(5, 40);
  if (!okOp(c, a, '*', b)) return null;
  const s = thing(r), k = kid(r);
  return Q.blanks(`${k} có ${b} hộp, mỗi hộp ${a} ${s}, và thêm ${d} ${s} để ngoài. Hỏi ${k} có tất cả bao nhiêu ${s}?`, [`{} ${s}`], [[a * b + d]],
    M('T3.BT.02', 'TOAN.LOIVAN', 'nhan_cong', l, `Trong hộp: ${a} × ${b} = ${a * b}. Tất cả: ${a * b} + ${d} = ${a * b + d} (${s}).`));
};
const unitRate: T3Template = (r, c, l) => {
  const per = r.int(3, 9), n1 = tbl(r, c), n2 = r.int(2, 9);
  if (n1 === n2 || !okOp(c, per * n1, '/', n1) || !okOp(c, per, '*', n2)) return null;
  const s = r.pick(['quyển vở', 'cái bánh', 'bông hoa', 'cây bút']);
  return Q.blanks(`${n1} hộp như nhau có ${per * n1} ${s}. Hỏi ${n2} hộp như thế có bao nhiêu ${s}?`, [`{} ${s}`], [[per * n2]],
    M('T3.TD.03', 'TOAN.LOIVAN', 'rut_ve_don_vi', l, `Rút về đơn vị: mỗi hộp có ${per * n1} : ${n1} = ${per} (${s}). ${n2} hộp: ${per} × ${n2} = ${per * n2} (${s}).`));
};

// =========================================================================== MỘT PHẦN MẤY
const fracOf: T3Template = (r, c, l) => {
  const d = r.pick(c.tables.filter((x) => x >= 2)), q = r.int(2, 9);
  const n = d * q;
  const opts = numChoices(r, q, [n - d, d, q + 1, q * 2], 100);
  if (!opts) return null;
  return Q.sc(`1/${d} của ${n} là bao nhiêu?`, opts, String(q), M('T3.NC.06', 'TOAN.PHANSO', 'mot_phan_may', l, `Chia ${n} thành ${d} phần bằng nhau, mỗi phần là ${n} : ${d} = ${q}.`));
};
const fracWord: T3Template = (r, c, l) => {
  const d = r.pick(c.tables), q = r.int(2, 9);
  const n = d * q, k = kid(r);
  return Q.blanks(`${k} có ${n} viên bi, ${k} cho em 1/${d} số bi. Hỏi ${k} cho em bao nhiêu viên bi?`, ['{} viên bi'], [[q]],
    M('T3.NC.06', 'TOAN.PHANSO', 'mot_phan_may_loi_van', l, `1/${d} số bi là ${n} : ${d} = ${q} (viên).`));
};
const fracReverse: T3Template = (r, c, l) => {
  const d = r.pick(c.tables), q = r.int(2, 9);
  return Q.blanks(`1/${d} của một số là ${q}. Số đó là bao nhiêu?`, ['{}'], [[d * q]],
    M('T3.TD.03', 'TOAN.PHANSO', 'tim_so_tu_phan', l, `Số đó gồm ${d} phần, mỗi phần là ${q}, nên số đó là ${q} × ${d} = ${d * q}.`));
};
const fracShape: T3Template = (r, c, l) => {
  const d = r.pick([2, 3, 4, 5, 6]);
  const cells = Array.from({ length: d }, (_, i) => (i === 0 ? '🟦' : '⬜'));
  return Q.sc(`Hình dưới được chia thành các phần bằng nhau, đã tô màu một phần. Phần tô màu là một phần mấy của hình?`, r.shuffle([2, 3, 4, 5, 6].filter((x) => x !== d).slice(0, 2).concat(d).map((x) => `1/${x}`)), `1/${d}`,
    M('T3.NC.06', 'TOAN.PHANSO', 'phan_to_mau', l, `Hình được chia thành ${d} phần bằng nhau, tô 1 phần: 1/${d}.`), { figure: { kind: 'grid', rows: 1, cols: d, cells, alt: `Hình chia ${d} phần bằng nhau, tô màu 1 phần` } });
};
const fracCompare: T3Template = (r, c, l) => {
  const [d1, d2] = r.sample(c.tables, 2);
  const n1 = d1 * r.int(2, 9), n2 = d2 * r.int(2, 9);
  const a = n1 / d1, b = n2 / d2;
  if (a === b) return null;
  const right = a > b ? `1/${d1} của ${n1}` : `1/${d2} của ${n2}`;
  return Q.sc('Số nào lớn hơn?', [`1/${d1} của ${n1}`, `1/${d2} của ${n2}`], right,
    M('T3.TD.03', 'TOAN.PHANSO', 'so_sanh_phan', l, `1/${d1} của ${n1} là ${n1} : ${d1} = ${a}; 1/${d2} của ${n2} là ${n2} : ${d2} = ${b}. Vậy ${right} lớn hơn.`));
};

// =========================================================================== HÌNH HỌC
const midpoint: T3Template = (r, c, l) => {
  const ab = c.bigMul ? r.int(2, 9) * 2 * (r.chance(0.5) ? 1 : 2) : r.int(2, 10) * 2;
  if (!okOp(c, ab, '/', 2) || !okOp(c, ab / 2, '*', 2)) return null;
  const rev = r.chance(0.4);
  if (rev) return Q.blanks(`M là trung điểm của đoạn thẳng AB, AM = ${ab / 2} cm. Hỏi đoạn thẳng AB dài bao nhiêu xăng-ti-mét?`, ['AB = {} cm'], [[ab]],
    M('T3.HH.01', 'TOAN.HINH', 'trung_diem_nguoc', l, `Trung điểm chia đoạn thẳng thành hai phần bằng nhau: AB = ${ab / 2} × 2 = ${ab} (cm).`));
  return Q.blanks(`Đoạn thẳng AB dài ${ab} cm, M là trung điểm của AB. Đoạn thẳng AM dài bao nhiêu xăng-ti-mét?`, ['AM = {} cm'], [[ab / 2]],
    M('T3.HH.01', 'TOAN.HINH', 'trung_diem', l, `M chia AB thành hai đoạn bằng nhau: AM = ${ab} : 2 = ${ab / 2} (cm).`));
};
const midpointFacts: T3Template = (r, c, l) => {
  const rows: [string, boolean][] = r.sample([
    ['Trung điểm của đoạn thẳng là điểm ở giữa và chia đoạn thẳng thành hai phần bằng nhau.', true] as [string, boolean],
    ['Mọi điểm ở giữa hai điểm A, B đều là trung điểm của AB.', false] as [string, boolean],
    ['Mỗi đoạn thẳng chỉ có một trung điểm.', true] as [string, boolean],
    ['Nếu M là trung điểm của AB thì AM dài gấp đôi MB.', false] as [string, boolean],
    ['Nếu M là trung điểm của AB thì AB dài gấp 2 lần AM.', true] as [string, boolean],
    ['Ba điểm A, M, B thẳng hàng và M nằm giữa A, B thì M là điểm ở giữa.', true] as [string, boolean],
  ], 4);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.HH.01', 'TOAN.DUNGSAI', 'trung_diem_ds', l, 'Trung điểm là điểm ở giữa và chia đoạn thẳng thành hai đoạn dài bằng nhau.'));
};
const circleRD: T3Template = (r, c, l) => {
  const rad = r.int(2, 9);
  if (r.chance(0.5)) return Q.blanks(`Hình tròn tâm O có bán kính ${rad} cm. Đường kính của hình tròn dài bao nhiêu xăng-ti-mét?`, ['{} cm'], [[rad * 2]],
    M('T3.HH.01', 'TOAN.HINH', 'duong_kinh', l, `Đường kính gấp 2 lần bán kính: ${rad} × 2 = ${rad * 2} (cm).`));
  return Q.blanks(`Hình tròn có đường kính ${rad * 2} cm. Bán kính của hình tròn dài bao nhiêu xăng-ti-mét?`, ['{} cm'], [[rad]],
    M('T3.HH.01', 'TOAN.HINH', 'ban_kinh', l, `Bán kính bằng một nửa đường kính: ${rad * 2} : 2 = ${rad} (cm).`));
};
const circleFacts: T3Template = (r, c, l) => {
  const rows: [string, boolean][] = r.sample([
    ['Mọi bán kính của một hình tròn đều dài bằng nhau.', true] as [string, boolean],
    ['Đường kính dài gấp 2 lần bán kính.', true] as [string, boolean],
    ['Tâm hình tròn là trung điểm của mỗi đường kính.', true] as [string, boolean],
    ['Bán kính dài hơn đường kính.', false] as [string, boolean],
    ['Một hình tròn chỉ có một bán kính.', false] as [string, boolean],
    ['Đường kính đi qua tâm của hình tròn.', true] as [string, boolean],
    ['Dùng thước kẻ để vẽ hình tròn.', false] as [string, boolean],
  ], 4);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.HH.01', 'TOAN.DUNGSAI', 'hinh_tron_ds', l, 'Hình tròn: các bán kính bằng nhau, đường kính gấp 2 lần bán kính và đi qua tâm; vẽ hình tròn bằng com-pa.'));
};
const circleRow: T3Template = (r, c, l) => {
  const rad = r.int(2, c.bigMul ? 6 : 5), n = r.int(2, 4);
  if (!okOp(c, rad * 2, '*', n)) return null;
  return Q.blanks(`Xếp ${n} hình tròn bằng nhau, bán kính ${rad} cm, sát nhau thành một hàng thẳng. Hàng hình tròn dài bao nhiêu xăng-ti-mét?`, ['{} cm'], [[rad * 2 * n]],
    M('T3.TD.04', 'TOAN.HINH', 'hang_hinh_tron', l, `Mỗi hình tròn có đường kính ${rad} × 2 = ${rad * 2} (cm). ${n} hình: ${rad * 2} × ${n} = ${rad * 2 * n} (cm).`));
};
const SHAPE3: [string, number, number, number][] = [['hình tam giác', 3, 3, 0], ['hình tứ giác', 4, 4, -1], ['hình chữ nhật', 4, 4, 4], ['hình vuông', 4, 4, 4]];
const shapeCount: T3Template = (r, c, l) => {
  const [name, v, e, right] = r.pick(SHAPE3);
  const ask = r.pick(right >= 0 ? ['đỉnh', 'cạnh', 'góc vuông'] : ['đỉnh', 'cạnh']);
  const ans = ask === 'đỉnh' ? v : ask === 'cạnh' ? e : right;
  return Q.sc(`${name[0].toUpperCase() + name.slice(1)} có mấy ${ask}?`, ['0', '3', '4', '5'], String(ans),
    M('T3.HH.02', 'TOAN.HINH', 'dinh_canh_goc', l, ask === 'góc vuông' ? (name === 'hình tam giác' ? 'Hình tam giác thường gặp không có 4 góc vuông; ở đây là 0.' : `${name} có 4 góc vuông.`) : `${name} có ${ans} ${ask}.`));
};
const rectFacts: T3Template = (r, c, l) => {
  const rows: [string, boolean][] = r.sample([
    ['Hình chữ nhật có 4 góc vuông.', true] as [string, boolean],
    ['Hình chữ nhật có hai cạnh dài bằng nhau và hai cạnh ngắn bằng nhau.', true] as [string, boolean],
    ['Hình vuông có 4 cạnh dài bằng nhau.', true] as [string, boolean],
    ['Hình vuông có 4 góc vuông.', true] as [string, boolean],
    ['Hình tam giác có 4 đỉnh.', false] as [string, boolean],
    ['Hình tứ giác nào cũng có 4 góc vuông.', false] as [string, boolean],
    ['Hình chữ nhật có 4 cạnh dài bằng nhau.', false] as [string, boolean],
  ], 4);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.HH.02', 'TOAN.DUNGSAI', 'hinh_ds', l, 'Hình chữ nhật: 4 góc vuông, các cạnh đối diện bằng nhau. Hình vuông: 4 góc vuông, 4 cạnh bằng nhau.'));
};
const angleClock: T3Template = (r, c, l) => {
  const h = r.pick([3, 9, 2, 4, 6, 12, 1, 5]);
  const right = h === 3 || h === 9;
  return Q.sc(`Lúc ${h} giờ, kim giờ và kim phút tạo thành góc vuông hay không?`, ['góc vuông', 'không phải góc vuông'], right ? 'góc vuông' : 'không phải góc vuông',
    M('T3.HH.02', 'TOAN.HINH', 'goc_vuong_dong_ho', l, right ? `Lúc ${h} giờ, kim phút chỉ 12 và kim giờ chỉ ${h}: hai kim vuông góc.` : `Lúc ${h} giờ hai kim không vuông góc (chỉ lúc 3 giờ và 9 giờ hai kim mới tạo góc vuông).`), { figure: { kind: 'clock', hour: h, minute: 0, alt: `Đồng hồ chỉ ${h} giờ` } });
};
const angleFacts: T3Template = (r, c, l) => {
  const items: [string, string][] = [['Dụng cụ dùng để kiểm tra góc vuông là', 'ê ke'], ['Dụng cụ dùng để vẽ hình tròn là', 'com-pa'], ['Dụng cụ dùng để kẻ đoạn thẳng là', 'thước thẳng']];
  const [q, a] = r.pick(items);
  return Q.sc(`${q}:`, ['ê ke', 'com-pa', 'thước thẳng'], a, M('T3.HH.02', 'TOAN.HINH', 'dung_cu', l, `${q} ${a}.`));
};
const countRightAngles: T3Template = (r, c, l) => {
  const sq = r.int(1, 3), rect = r.int(1, 3), tri = r.int(1, 3);
  return Q.blanks(`Một bức tranh có ${sq} hình vuông, ${rect} hình chữ nhật và ${tri} hình tam giác thường (không có góc vuông). Có tất cả bao nhiêu góc vuông?`, ['{} góc vuông'], [[(sq + rect) * 4]],
    M('T3.TD.04', 'TOAN.HINH', 'dem_goc_vuong', l, `Mỗi hình vuông, hình chữ nhật có 4 góc vuông: (${sq} + ${rect}) × 4 = ${(sq + rect) * 4}.`));
};
const SOLIDS: [string, number, number, number][] = [['khối lập phương', 8, 12, 6], ['khối hộp chữ nhật', 8, 12, 6]];
const solidCount: T3Template = (r, c, l) => {
  const [name, v, e, fc] = r.pick(SOLIDS);
  const ask = r.pick(['đỉnh', 'cạnh', 'mặt']);
  const ans = ask === 'đỉnh' ? v : ask === 'cạnh' ? e : fc;
  return Q.sc(`${name[0].toUpperCase() + name.slice(1)} có bao nhiêu ${ask}?`, ['4', '6', '8', '12'], String(ans), M('T3.HH.02', 'TOAN.HINH', 'khoi', l, `${name} có 8 đỉnh, 12 cạnh, 6 mặt.`));
};
const solidFacts: T3Template = (r, c, l) => {
  const rows: [string, boolean][] = r.sample([
    ['Các mặt của khối lập phương đều là hình vuông.', true] as [string, boolean],
    ['Khối hộp chữ nhật có 6 mặt.', true] as [string, boolean],
    ['Khối lập phương có 6 đỉnh.', false] as [string, boolean],
    ['Hộp bánh hình hộp chữ nhật có 12 cạnh.', true] as [string, boolean],
    ['Quả bóng có dạng khối lập phương.', false] as [string, boolean],
    ['Con xúc xắc thường có dạng khối lập phương.', true] as [string, boolean],
  ], 4);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.HH.02', 'TOAN.DUNGSAI', 'khoi_ds', l, 'Khối lập phương và khối hộp chữ nhật đều có 8 đỉnh, 12 cạnh, 6 mặt; mặt khối lập phương là hình vuông.'));
};
const cubePaint: T3Template = (r, c, l) => {
  const n = r.int(2, 6);
  return Q.blanks(`Có ${n} khối lập phương. Người ta sơn tất cả các mặt của mỗi khối. Hỏi đã sơn tất cả bao nhiêu mặt?`, ['{} mặt'], [[6 * n]],
    M('T3.TD.04', 'TOAN.HINH', 'son_mat', l, `Mỗi khối có 6 mặt: 6 × ${n} = ${6 * n} (mặt).`));
};
const polyline: T3Template = (r, c, l) => {
  const segs = Array.from({ length: r.int(3, 4) }, () => r.int(5, 40));
  return Q.blanks(`Đường gấp khúc gồm các đoạn thẳng dài ${segs.map((s) => `${s} cm`).join(', ')}. Đường gấp khúc dài bao nhiêu xăng-ti-mét?`, ['{} cm'], [[segs.reduce((a, b) => a + b, 0)]],
    M('T3.HH.03', 'TOAN.DODAI', 'duong_gap_khuc', l, `Cộng độ dài các đoạn: ${segs.join(' + ')} = ${segs.reduce((a, b) => a + b, 0)} (cm).`));
};
const unitsReview: T3Template = (r, c, l) => {
  const facts: [string, number, string][] = [['1 m = {} cm', 100, '1 m = 100 cm.'], ['1 m = {} dm', 10, '1 m = 10 dm.'], ['1 dm = {} cm', 10, '1 dm = 10 cm.'], ['1 km = {} m', 1000, '1 km = 1000 m.'], [`${r.int(2, 9)} m = {} cm`, 0, '']];
  const pick = r.pick(facts);
  if (pick[1] === 0) { const m = Number(pick[0].split(' ')[0]); return Q.blanks('Viết số thích hợp.', [pick[0]], [[m * 100]], M('T3.DL.01', 'TOAN.DOLUONG', 'doi_don_vi', l, `1 m = 100 cm nên ${m} m là ${m} trăm xăng-ti-mét, tức ${m * 100} cm.`)); }
  return Q.blanks('Viết số thích hợp.', [pick[0]], [[pick[1]]], M('T3.DL.01', 'TOAN.DOLUONG', 'doi_don_vi', l, pick[2]));
};

// =========================================================================== NHÂN, CHIA SỐ NHIỀU CHỮ SỐ
const mulDigits = (c: T3Ctx) => (c.topics.some((t) => t === 'mul5d' || t === 'div5d') ? 5 : c.topics.some((t) => t === 'mul4d' || t === 'div4d') ? 4 : c.topics.some((t) => t === 'mul3d' || t === 'div3d' || t === 'expr' || t === 'ratio') ? 3 : 2);
function mulPair(r: Rng, c: T3Ctx): [number, number] | null {
  const d = mulDigits(c), b = r.int(2, 9);
  const hi = Math.min(10 ** d - 1, Math.floor(c.max / b));
  const lo = 10 ** (d - 1);
  if (hi < lo) return null;
  const a = r.int(lo, hi);
  return okOp(c, a, '*', b) ? [a, b] : null;
}
const mulCalc: T3Template = (r, c, l) => {
  const p = mulPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  return Q.blanks('Tính.', [`${f(a)} × ${b} = {}`], [[a * b]], M('T3.NC.03', 'TOAN.TINH', 'nhan_nhieu_chu_so', l, `Đặt tính, nhân từ phải sang trái, nhớ sang hàng bên trái: ${f(a)} × ${b} = ${f(a * b)}.`));
};
const mulPick: T3Template = (r, c, l) => {
  const p = mulPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const right = a * b;
  const opts = numChoices(r, right, [right + 10, right - 10, right + b, right + 100], c.max);
  if (!opts) return null;
  return Q.sc(`${f(a)} × ${b} = ?`, opts, f(right), M('T3.NC.03', 'TOAN.TINH', 'chon_tich', l, `${f(a)} × ${b} = ${f(right)}. Nhớ cộng phần nhớ vào hàng bên trái.`));
};
const mulWord: T3Template = (r, c, l) => {
  const p = mulPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const u = r.pick(['kg gạo', 'viên gạch', 'quyển sách', 'lít dầu']);
  return Q.blanks(`Mỗi chuyến xe chở được ${f(a)} ${u}. Hỏi ${b} chuyến như thế chở được bao nhiêu ${u}?`, [`{} ${u}`], [[a * b]],
    M('T3.NC.03', 'TOAN.LOIVAN', 'loi_van_nhan', l, `${b} chuyến: ${f(a)} × ${b} = ${f(a * b)} (${u}).`));
};
function divPair(r: Rng, c: T3Ctx, exact = true): [number, number] | null {
  const d = mulDigits(c), b = r.int(2, 9);
  const lo = 10 ** (d - 1), hi = Math.min(10 ** d - 1, c.max);
  const q = r.int(Math.ceil(lo / b), Math.floor(hi / b));
  const rem = exact ? 0 : r.int(1, b - 1);
  const a = q * b + rem;
  if (a < lo || a > hi || !okOp(c, a, '/', b)) return null;
  return [a, b];
}
const divCalc: T3Template = (r, c, l) => {
  const p = divPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  return Q.blanks('Tính.', [`${f(a)} : ${b} = {}`], [[a / b]], M('T3.NC.03', 'TOAN.TINH', 'chia_nhieu_chu_so', l, `Đặt tính, chia từ trái sang phải (mỗi lần chia, nhân, trừ, hạ): ${f(a)} : ${b} = ${f(a / b)}.`));
};
const divRem: T3Template = (r, c, l) => {
  if (!c.remainder) return null;
  const p = divPair(r, c, false);
  if (!p) return null;
  const [a, b] = p;
  const q = Math.floor(a / b), rem = a % b;
  return Q.blanks('Tính.', [`${f(a)} : ${b} = {} (dư {})`], [[q, rem]], M('T3.NC.03', 'TOAN.TINH', 'chia_co_du', l, `${f(a)} : ${b} = ${f(q)} dư ${rem}. Kiểm tra: ${f(q)} × ${b} + ${rem} = ${f(a)}; số dư ${rem} bé hơn số chia ${b}.`));
};
const divWord: T3Template = (r, c, l) => {
  const p = divPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  const u = r.pick(['quyển vở', 'cây giống', 'kg gạo', 'viên kẹo']);
  return Q.blanks(`Có ${f(a)} ${u} chia đều cho ${b} lớp. Hỏi mỗi lớp nhận được bao nhiêu ${u}?`, [`{} ${u}`], [[a / b]],
    M('T3.NC.03', 'TOAN.LOIVAN', 'loi_van_chia', l, `Mỗi lớp: ${f(a)} : ${b} = ${f(a / b)} (${u}).`));
};
const busCeil: T3Template = (r, c, l) => {
  if (!c.remainder) return null;
  const b = r.int(4, 9), q = r.int(3, 9), rem = r.int(1, b - 1);
  const n = q * b + rem;
  return Q.blanks(`Có ${n} bạn đi tham quan, mỗi xe chở được ${b} bạn. Cần ít nhất bao nhiêu xe để chở hết các bạn?`, ['{} xe'], [[q + 1]],
    M('T3.TD.03', 'TOAN.LOIVAN', 'chia_du_lam_tron', l, `${n} : ${b} = ${q} (dư ${rem}). ${q} xe chở ${q * b} bạn, còn ${rem} bạn cần thêm 1 xe: ${q} + 1 = ${q + 1} (xe).`));
};
const remFacts: T3Template = (r, c, l) => {
  if (!c.remainder) return null;
  const b = r.int(3, 9);
  if (r.chance(0.5)) return Q.blanks(`Trong phép chia cho ${b}, số dư lớn nhất có thể là bao nhiêu?`, ['{}'], [[b - 1]],
    M('T3.NC.03', 'TOAN.NHANCHIA', 'so_du_lon_nhat', l, `Số dư luôn bé hơn số chia ${b}, nên số dư lớn nhất là ${b - 1}.`));
  const q = r.int(3, 9);
  return Q.blanks(`Một phép chia có số chia là ${b}, thương là ${q} và số dư là số lớn nhất có thể. Số bị chia là bao nhiêu?`, ['{}'], [[q * b + b - 1]],
    M('T3.TD.01', 'TOAN.TIMX', 'tim_so_bi_chia_du', l, `Số dư lớn nhất là ${b - 1}. Số bị chia = thương × số chia + số dư: ${q} × ${b} + ${b - 1} = ${q * b + b - 1}.`));
};
const findBig: T3Template = (r, c, l) => {
  const p = mulPair(r, c);
  if (!p) return null;
  const [a, b] = p;
  if (r.chance(0.5)) return Q.blanks('Tìm số thích hợp.', [`{} : ${b} = ${f(a)}`], [[a * b]], M('T3.NC.02', 'TOAN.TIMX', 'tim_so_bi_chia', l, `Số bị chia = Thương × Số chia: ${f(a)} × ${b} = ${f(a * b)}.`));
  return Q.blanks('Tìm số thích hợp.', [`{} × ${b} = ${f(a * b)}`], [[a]], M('T3.NC.02', 'TOAN.TIMX', 'tim_thua_so', l, `Thừa số = Tích : Thừa số kia: ${f(a * b)} : ${b} = ${f(a)}.`));
};
const mulDivTable: T3Template = (r, c, l) => {
  const rows: [string, boolean][] = [];
  for (let i = 0; i < 4; i++) {
    const p = mulPair(r, c);
    if (!p) continue;
    const [a, b] = p;
    const truth = r.chance(0.5);
    const shown = truth ? a * b : a * b + r.pick([10, -10, b, 100]);
    if (shown > c.max) continue;
    rows.push([`${f(a)} × ${b} = ${f(shown)}`, truth]);
  }
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.NC.03', 'TOAN.DUNGSAI', 'nhan_ds', l, 'Tính lại từng phép nhân (đặt tính, nhân từ phải sang trái, nhớ sang hàng bên trái).'));
};

// =========================================================================== GẤP, GIẢM, SO SÁNH GẤP MẤY LẦN
const timesCalc: T3Template = (r, c, l) => {
  const a = r.int(3, c.bigMul ? 30 : 9), k = r.int(2, 9);
  if (!okOp(c, a, '*', k)) return null;
  return Q.blanks(`Gấp ${a} lên ${k} lần được bao nhiêu?`, ['{}'], [[a * k]], M('T3.NC.04', 'TOAN.NHANCHIA', 'gap_len', l, `Gấp lên ${k} lần ta nhân với ${k}, được ${a} × ${k} = ${a * k}.`));
};
const reduceCalc: T3Template = (r, c, l) => {
  const k = r.int(2, 9), q = r.int(3, c.bigMul ? 30 : 9);
  if (!okOp(c, q * k, '/', k)) return null;
  return Q.blanks(`Giảm ${q * k} đi ${k} lần được bao nhiêu?`, ['{}'], [[q]], M('T3.NC.04', 'TOAN.NHANCHIA', 'giam_di', l, `Giảm đi ${k} lần ta chia cho ${k}, được ${q * k} : ${k} = ${q}.`));
};
const timesWord: T3Template = (r, c, l) => {
  const a = r.int(3, 20), k = r.int(2, 6);
  if (!okOp(c, a, '*', k)) return null;
  const k1 = kid(r), k2 = kid(r, k1);
  return Q.blanks(`${k1} có ${a} nhãn vở. Số nhãn vở của ${k2} gấp ${k} lần số nhãn vở của ${k1}. Hỏi ${k2} có bao nhiêu nhãn vở?`, ['{} nhãn vở'], [[a * k]],
    M('T3.NC.04', 'TOAN.LOIVAN', 'gap_len_loi_van', l, `Gấp ${a} lên ${k} lần: ${a} × ${k} = ${a * k} (nhãn vở).`));
};
const reduceWord: T3Template = (r, c, l) => {
  const k = r.int(2, 6), q = r.int(3, 15);
  if (!okOp(c, q * k, '/', k)) return null;
  return Q.blanks(`Đàn vịt có ${q * k} con. Số gà ít hơn, bằng số vịt giảm đi ${k} lần. Hỏi có bao nhiêu con gà?`, ['{} con gà'], [[q]],
    M('T3.NC.04', 'TOAN.LOIVAN', 'giam_di_loi_van', l, `Giảm ${q * k} đi ${k} lần: ${q * k} : ${k} = ${q} (con).`));
};
const timesVsAdd: T3Template = (r, c, l) => {
  const a = r.int(3, 9), k = r.int(2, 5);
  if (!okOp(c, a, '*', k)) return null;
  const opts = [`${a * k}`, `${a + k}`, `${a * k + a}`];
  if (new Set(opts).size < 3) return null;
  return Q.sc(`Gấp ${a} lên ${k} lần được số nào?`, r.shuffle(opts), String(a * k),
    M('T3.NC.04', 'TOAN.NHANCHIA', 'gap_khac_them', l, `"Gấp lên ${k} lần" là nhân với ${k} (${a} × ${k} = ${a * k}), khác "thêm ${k} đơn vị" (${a} + ${k} = ${a + k}).`));
};
const timesChain: T3Template = (r, c, l) => {
  const a = r.int(2, 9), k = r.int(2, 6), m = r.pick([2, 3]);
  if (!okOp(c, a, '*', k) || (a * k) % m !== 0 || !okOp(c, a * k, '/', m)) return null;
  return Q.blanks(`Lấy ${a} gấp lên ${k} lần rồi giảm đi ${m} lần thì được số nào?`, ['{}'], [[(a * k) / m]],
    M('T3.TD.03', 'TOAN.NHANCHIA', 'gap_roi_giam', l, `${a} × ${k} = ${a * k}; ${a * k} : ${m} = ${(a * k) / m}.`));
};
const ratioCalc: T3Template = (r, c, l) => {
  const b = r.int(2, 9), k = r.int(2, 9);
  if (!okOp(c, b * k, '/', b)) return null;
  return Q.blanks(`Số lớn là ${b * k}, số bé là ${b}. Số lớn gấp mấy lần số bé?`, ['{} lần'], [[k]], M('T3.NC.04', 'TOAN.NHANCHIA', 'gap_may_lan', l, `Lấy số lớn chia cho số bé: ${b * k} : ${b} = ${k} (lần).`));
};
const ratioWord: T3Template = (r, c, l) => {
  const b = r.int(2, 9), k = r.int(2, 9);
  if (!okOp(c, b * k, '/', b)) return null;
  return Q.blanks(`Đoạn dây xanh dài ${b * k} m, đoạn dây đỏ dài ${b} m. Đoạn dây xanh dài gấp mấy lần đoạn dây đỏ?`, ['{} lần'], [[k]],
    M('T3.NC.04', 'TOAN.LOIVAN', 'gap_may_lan_loi_van', l, `${b * k} : ${b} = ${k} (lần).`));
};
const ratioFraction: T3Template = (r, c, l) => {
  const b = r.int(2, 9), k = r.int(2, 9);
  if (!okOp(c, b * k, '/', b)) return null;
  return Q.sc(`Số bé ${b} bằng một phần mấy số lớn ${b * k}?`, r.shuffle([`1/${k}`, `1/${b}`, `1/${k + 1}`].filter((x, i, a) => a.indexOf(x) === i)), `1/${k}`,
    M('T3.TD.03', 'TOAN.PHANSO', 'bang_mot_phan_may', l, `Số lớn gấp ${b * k} : ${b} = ${k} lần số bé, nên số bé bằng 1/${k} số lớn.`));
};

// =========================================================================== BIỂU THỨC
function exprPick(r: Rng, c: T3Ctx): { text: string; val: number; how: string } | null {
  const kind = r.int(0, 3);
  const a = r.int(20, Math.min(400, c.max)), b = r.int(2, 9), d = r.int(2, 9);
  if (kind === 0) { // a + b × d
    if (!okOp(c, b, '*', d) || !okOp(c, a, '+', b * d)) return null;
    return { text: `${f(a)} + ${b} × ${d}`, val: a + b * d, how: `Nhân trước, cộng sau: ${b} × ${d} = ${b * d}; ${f(a)} + ${b * d} = ${f(a + b * d)}.` };
  }
  if (kind === 1) { // (a + b) × d
    const s = r.int(10, 99);
    if (!okOp(c, s, '*', d) || !okOp(c, s - b, '+', b)) return null;
    return { text: `(${s - b} + ${b}) × ${d}`, val: s * d, how: `Tính trong ngoặc trước: ${s - b} + ${b} = ${s}; ${s} × ${d} = ${s * d}.` };
  }
  if (kind === 2) { // a − b × d
    if (!okOp(c, b, '*', d) || !okOp(c, a, '-', b * d)) return null;
    return { text: `${f(a)} ${MINUS} ${b} × ${d}`, val: a - b * d, how: `Nhân trước, trừ sau: ${b} × ${d} = ${b * d}; ${f(a)} ${MINUS} ${b * d} = ${f(a - b * d)}.` };
  }
  const q = r.int(10, 99);
  const n = q * d;
  if (!okOp(c, n, '/', d) || !okOp(c, q, '+', b)) return null;
  return { text: `${f(n)} : ${d} + ${b}`, val: q + b, how: `Chia trước, cộng sau: ${f(n)} : ${d} = ${q}; ${q} + ${b} = ${q + b}.` };
}
const exprCalc: T3Template = (r, c, l) => {
  const e = exprPick(r, c);
  if (!e) return null;
  return Q.blanks('Tính giá trị của biểu thức.', [`${e.text} = {}`], [[e.val]], M('T3.BT.01', 'TOAN.BIEUTHUC', 'gia_tri_bieu_thuc', l, e.how));
};
const exprPickQ: T3Template = (r, c, l) => {
  const e = exprPick(r, c);
  if (!e) return null;
  const opts = numChoices(r, e.val, [e.val + 10, e.val - 2, e.val * 2, e.val + 1], c.max);
  if (!opts) return null;
  return Q.sc(`Giá trị của biểu thức ${e.text} là:`, opts, f(e.val), M('T3.BT.01', 'TOAN.BIEUTHUC', 'chon_gia_tri', l, e.how));
};
const exprParen: T3Template = (r, c, l) => {
  const a = r.int(2, 9), b = r.int(2, 9), d = r.int(2, 9);
  if (!okOp(c, a + b, '*', d) || !okOp(c, b, '*', d)) return null;
  const v1 = a + b * d, v2 = (a + b) * d;
  if (v1 === v2) return null;
  return Q.sc(`Biểu thức nào có giá trị bằng ${v2}?`, r.shuffle([`(${a} + ${b}) × ${d}`, `${a} + ${b} × ${d}`, `${a} × ${b} + ${d}`].filter((x, i, arr) => arr.indexOf(x) === i)), `(${a} + ${b}) × ${d}`,
    M('T3.BT.01', 'TOAN.BIEUTHUC', 'dau_ngoac', l, `(${a} + ${b}) × ${d} = ${a + b} × ${d} = ${v2}; còn ${a} + ${b} × ${d} = ${a} + ${b * d} = ${v1}.`));
};
const exprCompare: T3Template = (r, c, l) => {
  const e1 = exprPick(r, c), e2 = exprPick(r, c);
  if (!e1 || !e2 || e1.text === e2.text) return null;
  const sign = e1.val > e2.val ? '>' : e1.val < e2.val ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${e1.text} … ${e2.text}`, ['>', '<', '='], sign, M('T3.BT.01', 'TOAN.SOSANH', 'so_sanh_bieu_thuc', l, `${e1.text} = ${f(e1.val)}; ${e2.text} = ${f(e2.val)}. Vậy ${f(e1.val)} ${sign} ${f(e2.val)}.`));
};

// =========================================================================== BÀI TOÁN HAI BƯỚC
const twoStepMore: T3Template = (r, c, l) => {
  const big = c.max >= 10000;
  const a = r.int(big ? 1000 : 100, big ? 4000 : 400), d = r.int(big ? 100 : 10, big ? 999 : 99);
  if (!okOp(c, a, '+', d) || !okOp(c, a, '+', a + d)) return null;
  const k1 = r.pick(['Thùng thứ nhất', 'Kho A', 'Đội Một']), k2 = k1 === 'Thùng thứ nhất' ? 'thùng thứ hai' : k1 === 'Kho A' ? 'kho B' : 'đội Hai';
  const u = r.pick(['lít nước', 'kg thóc', 'cây giống']);
  return Q.blanks(`${k1} có ${f(a)} ${u}, ${k2} có nhiều hơn ${d} ${u}. Hỏi cả hai có bao nhiêu ${u}?`, [`{} ${u}`], [[2 * a + d]],
    M('T3.BT.02', 'TOAN.LOIVAN', 'hai_buoc_hon', l, `Bước 1: ${k2} có ${f(a)} + ${d} = ${f(a + d)}. Bước 2: cả hai có ${f(a)} + ${f(a + d)} = ${f(2 * a + d)} (${u}).`));
};
const twoStepTimes: T3Template = (r, c, l) => {
  const a = r.int(5, 30), k = r.int(2, 5);
  if (!okOp(c, a, '*', k) || !okOp(c, a, '+', a * k)) return null;
  return Q.blanks(`Bao gạo nhỏ nặng ${a} kg, bao gạo to nặng gấp ${k} lần bao nhỏ. Hỏi cả hai bao nặng bao nhiêu ki-lô-gam?`, ['{} kg'], [[a + a * k]],
    M('T3.BT.02', 'TOAN.LOIVAN', 'hai_buoc_gap', l, `Bao to: ${a} × ${k} = ${a * k} (kg). Cả hai bao: ${a} + ${a * k} = ${a + a * k} (kg).`));
};
const twoStepShare: T3Template = (r, c, l) => {
  const k = r.int(2, 6), q = r.int(5, 20), used = r.int(1, q - 1);
  if (!okOp(c, q * k, '/', k) || !okOp(c, q, '-', used)) return null;
  return Q.blanks(`Có ${q * k} quả cam xếp đều vào ${k} rổ. Người ta lấy ra ${used} quả từ một rổ. Hỏi rổ đó còn lại bao nhiêu quả cam?`, ['{} quả'], [[q - used]],
    M('T3.BT.02', 'TOAN.LOIVAN', 'hai_buoc_chia', l, `Mỗi rổ: ${q * k} : ${k} = ${q} (quả). Còn lại: ${q} ${MINUS} ${used} = ${q - used} (quả).`));
};
const ageProblem: T3Template = (r, c, l) => {
  const kid1 = r.int(7, 10), k = r.int(3, 5), later = r.int(2, 6);
  const mom = kid1 * k;
  if (!okOp(c, kid1, '*', k)) return null;
  if (r.chance(0.5)) return Q.blanks(`Năm nay con ${kid1} tuổi, tuổi mẹ gấp ${k} lần tuổi con. Hỏi ${later} năm nữa mẹ bao nhiêu tuổi?`, ['{} tuổi'], [[mom + later]],
    M('T3.TD.03', 'TOAN.LOIVAN', 'bai_toan_tuoi', l, `Tuổi mẹ năm nay: ${kid1} × ${k} = ${mom}. ${later} năm nữa: ${mom} + ${later} = ${mom + later} (tuổi).`));
  return Q.blanks(`Năm nay con ${kid1} tuổi, tuổi mẹ gấp ${k} lần tuổi con. Hỏi mẹ hơn con bao nhiêu tuổi?`, ['{} tuổi'], [[mom - kid1]],
    M('T3.TD.03', 'TOAN.LOIVAN', 'hieu_tuoi', l, `Tuổi mẹ: ${kid1} × ${k} = ${mom}. Mẹ hơn con: ${mom} ${MINUS} ${kid1} = ${mom - kid1} (tuổi).`));
};
const sumDiff: T3Template = (r, c, l) => {
  const big = c.bigMul ? r.int(30, Math.min(c.max / 2, 400)) : r.int(12, 60), small = c.bigMul ? r.int(10, big - 4) : r.int(2, Math.min(10, big - 2));
  if ((big + small) % 1 !== 0) return null;
  const sum = big + small, diff = big - small;
  if (!okOp(c, sum, '+', diff) || !okOp(c, sum - diff, '/', 2)) return null;
  return Q.blanks(`Hai số có tổng là ${f(sum)} và hiệu là ${diff}. Tìm số bé.`, ['Số bé: {}'], [[small]],
    M('T3.TD.03', 'TOAN.LOIVAN', 'tong_hieu', l, `Số bé = (Tổng ${MINUS} Hiệu) : 2 = (${f(sum)} ${MINUS} ${diff}) : 2 = ${f(sum - diff)} : 2 = ${f(small)}.`));
};
const equalize: T3Template = (r, c, l) => {
  const x = r.int(20, 200), d = r.int(2, c.bigMul ? 30 : 10) * 2;
  if (!okOp(c, x, '+', d) || !okOp(c, d, '/', 2)) return null;
  return Q.blanks(`Thùng A có ${x + d} lít nước, thùng B có ${x} lít nước. Phải chuyển bao nhiêu lít từ thùng A sang thùng B để hai thùng bằng nhau?`, ['{} lít'], [[d / 2]],
    M('T3.TD.03', 'TOAN.LOIVAN', 'chuyen_bang_nhau', l, `Thùng A hơn thùng B ${x + d} ${MINUS} ${x} = ${d} (lít). Chuyển một nửa phần hơn: ${d} : 2 = ${d / 2} (lít).`));
};

// =========================================================================== ĐƠN VỊ ĐO
const convert: T3Template = (r, c, l) => {
  const kinds = c.topics.filter((t) => ['mm', 'gram', 'ml'].includes(t));
  const kd = kinds.length ? r.pick(kinds) : r.pick(['mm', 'gram', 'ml']);
  const opts: [string, number, string][] = kd === 'mm' ? [['1 cm = {} mm', 10, '1 cm = 10 mm.'], ['1 m = {} mm', 1000, '1 m = 1000 mm.'], [`${r.int(2, 9)} cm = {} mm`, -10, 'mm']]
    : kd === 'gram' ? [['1 kg = {} g', 1000, '1 kg = 1000 g.'], [`${r.int(2, 9)} kg = {} g`, -1000, 'g']]
      : [['1 l = {} ml', 1000, '1 l = 1000 ml.'], [`${r.int(2, 9)} l = {} ml`, -1000, 'ml']];
  const [line, v, why] = r.pick(opts);
  if (v < 0) { const n = Number(line.split(' ')[0]); if (n * -v > c.max) return null; return Q.blanks('Viết số thích hợp.', [line], [[n * -v]], M('T3.DL.01', 'TOAN.DOLUONG', 'doi_don_vi', l, `${n} × ${-v} = ${n * -v} (${why}).`)); }
  return Q.blanks('Viết số thích hợp.', [line], [[v]], M('T3.DL.01', 'TOAN.DOLUONG', 'doi_don_vi', l, why));
};
const unitPick: T3Template = (r, c, l) => {
  const items: [string, string][] = [['Chiếc bút chì dài khoảng 15 …', 'cm'], ['Bề dày quyển vở khoảng 5 …', 'mm'], ['Quả trứng gà nặng khoảng 50 …', 'g'], ['Bao gạo nặng khoảng 25 …', 'kg'],
    ['Lọ thuốc nhỏ mắt chứa khoảng 10 …', 'ml'], ['Can nước chứa khoảng 5 …', 'l'], ['Nhiệt độ cơ thể người khỏe mạnh khoảng 37 …', '°C'], ['Một cốc nước chứa khoảng 250 …', 'ml']];
  const [q, a] = r.pick(items);
  const pool = ['cm', 'mm', 'g', 'kg', 'ml', 'l', '°C'].filter((x) => x !== a);
  return Q.sc(`Chọn đơn vị thích hợp: ${q}`, r.shuffle([a, ...r.sample(pool, 2)]), a, M('T3.DL.01', 'TOAN.DOLUONG', 'chon_don_vi', l, `${q.replace('…', a)}.`));
};
const unitCalc: T3Template = (r, c, l) => {
  const kd = r.pick(c.topics.filter((t) => ['mm', 'gram', 'ml'].includes(t)).length ? c.topics.filter((t) => ['mm', 'gram', 'ml'].includes(t)) : ['gram']);
  const u = kd === 'mm' ? 'mm' : kd === 'gram' ? 'g' : 'ml';
  const a = r.int(100, 600), b = r.int(50, 390);
  if (r.chance(0.5)) return Q.blanks('Tính.', [`${a} ${u} + ${b} ${u} = {} ${u}`], [[a + b]], M('T3.DL.01', 'TOAN.DOLUONG', 'tinh_don_vi', l, `Cộng như số tự nhiên rồi ghi đơn vị: ${a} + ${b} = ${a + b} (${u}).`));
  const k = r.int(2, 4);
  if (!okOp(c, Math.floor(a / 10), '*', k)) return null;
  return Q.blanks('Tính.', [`${Math.floor(a / 10)} ${u} × ${k} = {} ${u}`], [[Math.floor(a / 10) * k]], M('T3.DL.01', 'TOAN.DOLUONG', 'tinh_don_vi', l, `${Math.floor(a / 10)} × ${k} = ${Math.floor(a / 10) * k} (${u}).`));
};
const unitCompare: T3Template = (r, c, l) => {
  const pairs: [string, number, string, number][] = [['1 kg', 1000, '900 g', 900], ['1 kg', 1000, '1000 g', 1000], ['2 l', 2000, '1500 ml', 1500], ['5 cm', 50, '48 mm', 48], ['3 cm', 30, '30 mm', 30], ['1 l', 1000, '1200 ml', 1200], ['2 kg', 2000, '2500 g', 2500]];
  const ok = pairs.filter((p) => p[1] <= c.max && p[3] <= c.max);
  const [x, xv, y, yv] = r.pick(ok);
  const sign = xv > yv ? '>' : xv < yv ? '<' : '=';
  return Q.sc(`Chọn dấu thích hợp: ${x} … ${y}`, ['>', '<', '='], sign, M('T3.DL.01', 'TOAN.DOLUONG', 'so_sanh_don_vi', l, `Đổi về cùng đơn vị: ${x} = ${f(xv)} ${y.split(' ')[1]}; ${f(xv)} ${sign} ${f(yv)}.`));
};
const temp: T3Template = (r, c, l) => {
  const a = r.int(15, 35), d = r.int(2, 9);
  if (r.chance(0.5)) return Q.blanks(`Buổi sáng nhiệt độ là ${a} °C, buổi trưa tăng thêm ${d} °C. Nhiệt độ buổi trưa là bao nhiêu độ C?`, ['{} °C'], [[a + d]],
    M('T3.DL.01', 'TOAN.DOLUONG', 'nhiet_do', l, `${a} + ${d} = ${a + d} (°C).`));
  const items: [string, string][] = [['nước đá đang tan', '0 °C'], ['nước đang sôi', '100 °C'], ['cơ thể người khỏe mạnh', '37 °C']];
  const [what, ans] = r.pick(items);
  return Q.sc(`Nhiệt độ của ${what} khoảng bao nhiêu?`, ['0 °C', '37 °C', '100 °C'], ans, M('T3.DL.01', 'TOAN.DOLUONG', 'nhiet_do_thuc_te', l, `Nhiệt độ của ${what} khoảng ${ans}.`));
};
const weighPuzzle: T3Template = (r, c, l) => {
  const box = r.int(2, 9) * 50, n = r.int(2, 4);
  if (!okOp(c, box, '*', n)) return null;
  return Q.blanks(`Cân thăng bằng: đĩa bên trái có ${n} hộp sữa như nhau, đĩa bên phải có quả cân ${box * n} g. Mỗi hộp sữa nặng bao nhiêu gam?`, ['{} g'], [[box]],
    M('T3.TD.03', 'TOAN.DOLUONG', 'can_thang_bang', l, `${n} hộp nặng ${box * n} g, mỗi hộp: ${box * n} : ${n} = ${box} (g).`));
};

// =========================================================================== CHU VI, DIỆN TÍCH
const perimRect: T3Template = (r, c, l) => {
  const kind = r.int(0, 2);
  if (kind === 0) { const a = r.int(5, 40), b = r.int(5, 40), d = r.int(5, 40); return Q.blanks(`Hình tam giác có ba cạnh dài ${a} cm, ${b} cm, ${d} cm. Tính chu vi hình tam giác.`, ['{} cm'], [[a + b + d]], M('T3.HH.03', 'TOAN.CHUVI', 'chu_vi_tam_giac', l, `Chu vi = tổng ba cạnh: ${a} + ${b} + ${d} = ${a + b + d} (cm).`)); }
  if (kind === 1) { const a = r.int(6, 40), b = r.int(2, a - 1); return Q.blanks(`Hình chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm. Tính chu vi hình chữ nhật.`, ['{} cm'], [[(a + b) * 2]], M('T3.HH.03', 'TOAN.CHUVI', 'chu_vi_hcn', l, `Chu vi = (dài + rộng) × 2 = (${a} + ${b}) × 2 = ${(a + b) * 2} (cm).`)); }
  const a = r.int(3, 50);
  return Q.blanks(`Hình vuông có cạnh ${a} cm. Tính chu vi hình vuông.`, ['{} cm'], [[a * 4]], M('T3.HH.03', 'TOAN.CHUVI', 'chu_vi_hv', l, `Chu vi = cạnh × 4 = ${a} × 4 = ${a * 4} (cm).`));
};
const perimReverse: T3Template = (r, c, l) => {
  const a = r.int(3, 25);
  if (r.chance(0.5)) return Q.blanks(`Hình vuông có chu vi ${a * 4} cm. Cạnh hình vuông dài bao nhiêu xăng-ti-mét?`, ['{} cm'], [[a]], M('T3.TD.03', 'TOAN.CHUVI', 'canh_tu_chu_vi', l, `Cạnh = chu vi : 4 = ${a * 4} : 4 = ${a} (cm).`));
  const b = r.int(2, 20);
  return Q.blanks(`Hình chữ nhật có chu vi ${(a + b) * 2} cm, chiều rộng ${b} cm. Tính chiều dài.`, ['{} cm'], [[a]], M('T3.TD.03', 'TOAN.CHUVI', 'dai_tu_chu_vi', l, `Nửa chu vi: ${(a + b) * 2} : 2 = ${a + b} (cm). Chiều dài: ${a + b} ${MINUS} ${b} = ${a} (cm).`));
};
const areaCount: T3Template = (r, c, l) => {
  const rows = r.int(2, 4), cols = r.int(2, 5);
  return Q.blanks('Mỗi ô vuông có diện tích 1 cm². Hình chữ nhật dưới đây có diện tích bao nhiêu xăng-ti-mét vuông?', ['{} cm²'], [[rows * cols]],
    M('T3.HH.04', 'TOAN.CHUVI', 'dem_o_vuong', l, `Có ${rows} hàng, mỗi hàng ${cols} ô: ${cols} × ${rows} = ${rows * cols} (cm²).`), { figure: { kind: 'grid', rows, cols, cells: Array(rows * cols).fill('🟨'), alt: `Hình chữ nhật gồm ${rows} hàng, mỗi hàng ${cols} ô vuông` } });
};
const areaUnitFacts: T3Template = (r, c, l) => {
  const a = r.int(10, 90), b = r.int(5, 60);
  if (r.chance(0.5)) return Q.blanks('Tính.', [`${a} cm² + ${b} cm² = {} cm²`], [[a + b]], M('T3.HH.04', 'TOAN.CHUVI', 'tinh_cm2', l, `${a} + ${b} = ${a + b} (cm²).`));
  return Q.sc(`"${a} xăng-ti-mét vuông" viết là:`, r.shuffle([`${a} cm²`, `${a} cm`, `${a}² cm`]), `${a} cm²`, M('T3.HH.04', 'TOAN.CHUVI', 'viet_cm2', l, `Xăng-ti-mét vuông viết tắt là cm².`));
};
const areaRect: T3Template = (r, c, l) => {
  if (r.chance(0.5)) { const a = r.int(4, 30), b = r.int(2, 9); return Q.blanks(`Hình chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm. Tính diện tích hình chữ nhật.`, ['{} cm²'], [[a * b]], M('T3.HH.04', 'TOAN.CHUVI', 'dien_tich_hcn', l, `Diện tích = dài × rộng = ${a} × ${b} = ${a * b} (cm²).`)); }
  const a = r.int(2, 9);
  return Q.blanks(`Hình vuông có cạnh ${a} cm. Tính diện tích hình vuông.`, ['{} cm²'], [[a * a]], M('T3.HH.04', 'TOAN.CHUVI', 'dien_tich_hv', l, `Diện tích = cạnh × cạnh = ${a} × ${a} = ${a * a} (cm²).`));
};
const areaReverse: T3Template = (r, c, l) => {
  const a = r.int(3, 9);
  if (r.chance(0.5)) return Q.blanks(`Hình vuông có chu vi ${a * 4} cm. Tính diện tích hình vuông đó.`, ['{} cm²'], [[a * a]],
    M('T3.TD.03', 'TOAN.CHUVI', 'dien_tich_tu_chu_vi', l, `Cạnh: ${a * 4} : 4 = ${a} (cm). Diện tích: ${a} × ${a} = ${a * a} (cm²).`));
  const b = r.int(2, 9), len = r.int(b + 1, 30);
  return Q.blanks(`Hình chữ nhật có diện tích ${len * b} cm², chiều rộng ${b} cm. Tính chiều dài.`, ['{} cm'], [[len]], M('T3.TD.03', 'TOAN.CHUVI', 'dai_tu_dien_tich', l, `Chiều dài = diện tích : chiều rộng = ${len * b} : ${b} = ${len} (cm).`));
};
const areaPerimTable: T3Template = (r, c, l) => {
  const a = r.int(4, 12), b = r.int(2, 9);
  const rows: [string, boolean][] = [
    [`Hình chữ nhật dài ${a} cm, rộng ${b} cm có chu vi ${(a + b) * 2} cm.`, true],
    [`Hình chữ nhật dài ${a} cm, rộng ${b} cm có diện tích ${(a + b) * 2} cm².`, (a + b) * 2 === a * b],
    [`Hình vuông cạnh ${b} cm có diện tích ${b * b} cm².`, true],
    [`Hình vuông cạnh ${b} cm có chu vi ${b * b} cm.`, b * b === b * 4],
  ];
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.HH.04', 'TOAN.DUNGSAI', 'chu_vi_dien_tich_ds', l, 'Chu vi hình chữ nhật = (dài + rộng) × 2; diện tích = dài × rộng. Hình vuông: chu vi = cạnh × 4, diện tích = cạnh × cạnh.'));
};

// =========================================================================== ĐỒNG HỒ, THÁNG – NĂM, TIỀN
const clockFig = (h: number, m: number): Figure => ({ kind: 'clock', hour: h, minute: m, alt: `Đồng hồ chỉ ${h} giờ ${m} phút` });
const readClock3: T3Template = (r, c, l) => {
  const h = r.int(1, 11), m = r.int(1, 11) * 5 + (r.chance(0.3) ? r.int(1, 4) : 0);
  const t = (hh: number, mm: number) => `${hh} giờ ${mm} phút`;
  const opts = [...new Set([t(h, m), t(h + 1, m), t(h, (m + 5) % 60 || 5), t(Math.floor(m / 5) || 12, h * 5)])].slice(0, 4);
  if (opts.length < 3) return null;
  return Q.sc('Đồng hồ chỉ mấy giờ?', r.shuffle(opts), t(h, m), M('T3.DL.02', 'TOAN.GIOLICH', 'xem_dong_ho_phut', l, `Kim ngắn đã qua số ${h}, tức là ${h} giờ. Kim dài: mỗi số là 5 phút, đếm được ${m} phút. Đồng hồ chỉ ${t(h, m)}.`), { figure: clockFig(h, m) });
};
const clockKem: T3Template = (r, c, l) => {
  const h = r.int(1, 11), k = r.pick([5, 10, 15, 20]);
  return Q.blanks(`${h} giờ ${60 - k} phút còn gọi là ${h + 1} giờ kém bao nhiêu phút?`, ['Kém {} phút'], [[k]], M('T3.DL.02', 'TOAN.GIOLICH', 'gio_kem', l, `Còn ${60} ${MINUS} ${60 - k} = ${k} phút nữa là ${h + 1} giờ, nên ${h} giờ ${60 - k} phút là ${h + 1} giờ kém ${k} phút.`));
};
const duration3: T3Template = (r, c, l) => {
  const h = r.int(6, 9), m1 = r.int(0, 6) * 5, d = r.int(3, 10) * 5;
  const m2 = m1 + d;
  if (m2 >= 60) return null;
  const k = kid(r);
  return Q.blanks(`${k} bắt đầu đọc sách lúc ${h} giờ ${m1} phút và đọc xong lúc ${h} giờ ${m2} phút. ${k} đọc sách trong bao nhiêu phút?`, ['{} phút'], [[d]],
    M('T3.DL.02', 'TOAN.GIOLICH', 'khoang_thoi_gian', l, `${m2} ${MINUS} ${m1} = ${d} (phút).`));
};
const durationCross: T3Template = (r, c, l) => {
  const h = r.int(6, 10), m1 = r.int(8, 11) * 5, d = r.int(4, 9) * 5;
  const total = m1 + d;
  if (total < 60) return null;
  return Q.sc(`Bộ phim bắt đầu lúc ${h} giờ ${m1} phút và kéo dài ${d} phút. Bộ phim kết thúc lúc mấy giờ?`, r.shuffle([`${h + 1} giờ ${total - 60} phút`, `${h} giờ ${total - 60} phút`, `${h + 1} giờ ${total - 50} phút`]), `${h + 1} giờ ${total - 60} phút`,
    M('T3.TD.03', 'TOAN.GIOLICH', 'qua_gio', l, `${m1} + ${d} = ${total} phút, tức là 1 giờ ${total - 60} phút. Kết thúc lúc ${h + 1} giờ ${total - 60} phút.`));
};
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEK = ['chủ nhật', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy'];
const monthDays3: T3Template = (r, c, l) => {
  const m = r.pick([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  return Q.sc(`Tháng ${m} có bao nhiêu ngày?`, ['29', '30', '31'], String(DAYS[m - 1]), M('T3.DL.02', 'TOAN.GIOLICH', 'so_ngay_thang', l, `Tháng ${m} có ${DAYS[m - 1]} ngày (đếm trên nắm tay: tháng ở gò xương có 31 ngày).`));
};
const months31: T3Template = (r, c, l) => {
  const pick = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 5);
  const right = pick.filter((m) => DAYS[m - 1] === 31);
  if (!right.length || right.length === 5) return null;
  return Q.mc('Chọn tất cả các tháng có 31 ngày.', pick.map((m) => `tháng ${m}`), right.map((m) => `tháng ${m}`), M('T3.DL.02', 'TOAN.GIOLICH', 'thang_31', l, `Tháng có 31 ngày: 1, 3, 5, 7, 8, 10, 12. Trong các tháng đã cho: ${right.join(', ')}.`));
};
const weekdayCalc: T3Template = (r, c, l) => {
  const d = r.int(1, 10), w = r.int(0, 6), add = r.pick([7, 14, 21, 3, 5, 10]);
  if (d + add > 30) return null;
  const right = WEEK[(w + add) % 7];
  return Q.sc(`Ngày ${d} tháng 6 là ${WEEK[w]}. Ngày ${d + add} tháng 6 là thứ mấy?`, r.shuffle([...new Set([right, WEEK[(w + add + 1) % 7], WEEK[(w + add + 6) % 7], WEEK[w]])].slice(0, 4)), right,
    M('T3.DL.02', 'TOAN.GIOLICH', 'xem_lich', l, `Từ ngày ${d} đến ngày ${d + add} là ${add} ngày; ${add % 7 === 0 ? `${add} ngày là đúng ${add / 7} tuần nên vẫn là ${WEEK[w]}` : `${add} ngày = ${Math.floor(add / 7)} tuần và ${add % 7} ngày nên đếm thêm ${add % 7} ngày: ${right}`}.`));
};
const yearFacts: T3Template = (r, c, l) => {
  const facts: [string, number, string][] = [['1 năm có {} tháng', 12, 'Một năm có 12 tháng.'], ['1 tuần có {} ngày', 7, 'Một tuần có 7 ngày.'], ['1 giờ có {} phút', 60, 'Một giờ có 60 phút.'], ['Tháng 2 thường có {} ngày', 28, 'Tháng 2 thường có 28 ngày (có năm 29 ngày).']];
  const [line, v, why] = r.pick(facts);
  return Q.blanks('Viết số thích hợp.', [line], [[v]], M('T3.DL.02', 'TOAN.GIOLICH', 'thang_nam', l, why));
};
const NOTES = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
const moneySum: T3Template = (r, c, l) => {
  const ns = r.sample(NOTES.filter((n) => n <= c.max / 2), 3);
  const total = ns.reduce((a, b) => a + b, 0);
  if (total > c.max) return null;
  return Q.blanks(`Em có các tờ tiền: ${ns.map((n) => `${f(n)} đồng`).join(', ')}. Em có tất cả bao nhiêu tiền?`, ['{} đồng'], [[total]],
    M('T3.DL.03', 'TOAN.DOLUONG', 'cong_tien', l, `${ns.map(f).join(' + ')} = ${f(total)} (đồng).`));
};
const moneyChange: T3Template = (r, c, l) => {
  const pay = r.pick([20000, 50000, 100000].filter((x) => x <= c.max)), price = r.int(2, Math.floor(pay / 1000) - 1) * 1000;
  return Q.blanks(`Mẹ mua một quyển truyện giá ${f(price)} đồng, đưa cô bán hàng ${f(pay)} đồng. Cô bán hàng trả lại mẹ bao nhiêu tiền?`, ['{} đồng'], [[pay - price]],
    M('T3.DL.03', 'TOAN.LOIVAN', 'tien_thua', l, `${f(pay)} ${MINUS} ${f(price)} = ${f(pay - price)} (đồng).`));
};
const moneyBuy: T3Template = (r, c, l) => {
  const price = r.int(2, 9) * 1000 + r.pick([0, 500]), n = r.int(2, 6);
  if (!okOp(c, price, '*', n)) return null;
  return Q.blanks(`Mỗi quyển vở giá ${f(price)} đồng. Mua ${n} quyển vở hết bao nhiêu tiền?`, ['{} đồng'], [[price * n]],
    M('T3.DL.03', 'TOAN.LOIVAN', 'mua_nhieu', l, `${f(price)} × ${n} = ${f(price * n)} (đồng).`));
};
const moneyPick: T3Template = (r, c, l) => {
  const target = r.pick([15000, 25000, 30000, 70000, 60000].filter((x) => x <= c.max));
  const ways: Record<number, [string, string[]]> = {
    15000: ['10 000 đồng và 5 000 đồng', ['10 000 đồng và 2 000 đồng', '5 000 đồng và 5 000 đồng']],
    25000: ['20 000 đồng và 5 000 đồng', ['20 000 đồng và 2 000 đồng', '10 000 đồng và 10 000 đồng']],
    30000: ['20 000 đồng và 10 000 đồng', ['20 000 đồng và 5 000 đồng', '10 000 đồng và 5 000 đồng']],
    70000: ['50 000 đồng và 20 000 đồng', ['50 000 đồng và 10 000 đồng', '20 000 đồng và 20 000 đồng']],
    60000: ['50 000 đồng và 10 000 đồng', ['50 000 đồng và 5 000 đồng', '20 000 đồng và 20 000 đồng']],
  };
  const [right, wrong] = ways[target];
  const fmtNB = (s: string) => s.replace(/(\d+) (\d{3})/g, `$1${NB}$2`);
  return Q.sc(`Hai tờ tiền nào cộng lại được ${f(target)} đồng?`, r.shuffle([right, ...wrong].map(fmtNB)), fmtNB(right), M('T3.DL.03', 'TOAN.DOLUONG', 'chon_to_tien', l, `${fmtNB(right)} cộng lại được ${f(target)} đồng.`));
};

// =========================================================================== THỐNG KÊ, KHẢ NĂNG
const CLASSES = ['3A', '3B', '3C', '3D'];
const dataRead: T3Template = (r, c, l) => {
  const items = r.pick([['Số cây trồng được', 'cây'], ['Số sách quyên góp', 'quyển'], ['Số bạn tham gia câu lạc bộ', 'bạn']]);
  const vals = CLASSES.map(() => r.int(12, 60));
  if (new Set(vals).size < 4) return null;
  const table = CLASSES.map((cl, i) => `Lớp ${cl}: ${vals[i]} ${items[1]}`).join('; ');
  const ask = r.int(0, 2);
  if (ask === 0) {
    const mi = vals.indexOf(Math.max(...vals));
    return Q.sc(`Bảng số liệu – ${items[0]}: ${table}. Lớp nào có nhiều nhất?`, CLASSES.map((x) => `Lớp ${x}`), `Lớp ${CLASSES[mi]}`,
      M('T3.TK.01', 'TOAN.THONGKE', 'doc_bang_so_lieu', l, `So sánh các số trong bảng: lớp ${CLASSES[mi]} có ${vals[mi]} ${items[1]}, nhiều nhất.`));
  }
  if (ask === 1) {
    const [i, j] = r.sample([0, 1, 2, 3], 2);
    const [hi, lo] = vals[i] > vals[j] ? [i, j] : [j, i];
    return Q.blanks(`Bảng số liệu – ${items[0]}: ${table}. Lớp ${CLASSES[hi]} hơn lớp ${CLASSES[lo]} bao nhiêu ${items[1]}?`, [`{} ${items[1]}`], [[vals[hi] - vals[lo]]],
      M('T3.TK.01', 'TOAN.THONGKE', 'so_sanh_so_lieu', l, `${vals[hi]} ${MINUS} ${vals[lo]} = ${vals[hi] - vals[lo]} (${items[1]}).`));
  }
  const tot = vals.reduce((a, b) => a + b, 0);
  return Q.blanks(`Bảng số liệu – ${items[0]}: ${table}. Cả bốn lớp có tất cả bao nhiêu ${items[1]}?`, [`{} ${items[1]}`], [[tot]],
    M('T3.TK.01', 'TOAN.THONGKE', 'tong_so_lieu', l, `${vals.join(' + ')} = ${tot} (${items[1]}).`));
};
const dataOrder: T3Template = (r, c, l) => {
  const vals = CLASSES.map(() => r.int(12, 60));
  if (new Set(vals).size < 4) return null;
  const order = CLASSES.map((cl, i) => [cl, vals[i]] as [string, number]).sort((a, b) => b[1] - a[1]).map(([cl]) => `Lớp ${cl}`);
  return Q.ord(`Số bông hoa điểm tốt: ${CLASSES.map((cl, i) => `lớp ${cl} có ${vals[i]}`).join(', ')}. Xếp các lớp theo số hoa từ nhiều đến ít.`, order,
    M('T3.TK.01', 'TOAN.SAPXEP', 'xep_so_lieu', l, `Thứ tự: ${order.join(', ')}.`));
};
const tallyCount: T3Template = (r, c, l) => {
  const fruits = r.sample(['cam', 'xoài', 'chuối', 'táo'], 3);
  const counts = fruits.map(() => r.int(3, 9));
  const list = r.shuffle(fruits.flatMap((x, i) => Array(counts[i]).fill(x)));
  const ask = r.int(0, 2);
  return Q.blanks(`Các bạn chọn món quả yêu thích, ghi lại lần lượt: ${list.join(', ')}. Có bao nhiêu bạn chọn ${fruits[ask]}?`, ['{} bạn'], [[counts[ask]]],
    M('T3.TK.01', 'TOAN.THONGKE', 'kiem_dem', l, `Đếm số lần xuất hiện "${fruits[ask]}": ${counts[ask]} bạn.`));
};
const CHANCE3: [string, string][] = [
  ['Hộp có 5 bi đỏ. Lấy ra 1 viên bi thì ... lấy được bi đỏ.', 'chắc chắn'], ['Hộp có 5 bi đỏ. Lấy ra 1 viên bi thì ... lấy được bi vàng.', 'không thể'],
  ['Hộp có 3 bi đỏ và 2 bi xanh. Lấy ra 1 viên bi thì ... lấy được bi xanh.', 'có thể'], ['Gieo một con xúc xắc thì ... được mặt 7 chấm.', 'không thể'],
  ['Gieo một con xúc xắc thì ... được mặt 4 chấm.', 'có thể'], ['Tháng sau ... có 32 ngày.', 'không thể'], ['Rút 1 thẻ từ các thẻ số 2, 4, 6, 8 thì ... được số chẵn.', 'chắc chắn'],
  ['Rút 1 thẻ từ các thẻ số 1, 2, 3, 4 thì ... được số 3.', 'có thể'], ['Sau thứ hai ... là thứ ba.', 'chắc chắn'],
];
const chancePick3: T3Template = (r, c, l) => {
  const [p, a] = r.pick(CHANCE3);
  return Q.sc(`Chọn từ thích hợp thay cho "...": ${p}`, ['chắc chắn', 'có thể', 'không thể'], a, M('T3.TK.02', 'TOAN.THONGKE', 'kha_nang', l, a === 'chắc chắn' ? 'Luôn xảy ra: chắc chắn.' : a === 'không thể' ? 'Không bao giờ xảy ra: không thể.' : 'Có lúc xảy ra, có lúc không: có thể.'));
};
const chanceTable3: T3Template = (r, c, l) => {
  const rows = r.sample(CHANCE3, 4).map(([p, a]) => {
    const shown = r.chance(0.5) ? a : r.pick(['chắc chắn', 'có thể', 'không thể'].filter((x) => x !== a));
    return [p.replace('...', shown), shown === a] as [string, boolean];
  });
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', mixed, M('T3.TK.02', 'TOAN.DUNGSAI', 'kha_nang_ds', l, 'Chắc chắn: luôn xảy ra; có thể: có lúc xảy ra; không thể: không bao giờ xảy ra.'));
};
const chanceBalls: T3Template = (r, c, l) => {
  const red = r.int(2, 6), blue = r.int(2, 6);
  return Q.blanks(`Trong túi có ${red} bi đỏ và ${blue} bi xanh. Không nhìn vào túi, phải lấy ra ít nhất bao nhiêu viên bi để chắc chắn có 1 viên bi đỏ?`, ['{} viên'], [[blue + 1]],
    M('T3.TD.04', 'TOAN.THONGKE', 'chac_chan_lay_duoc', l, `Trường hợp kém may nhất: lấy hết ${blue} bi xanh trước. Lấy thêm 1 viên nữa chắc chắn là bi đỏ: ${blue} + 1 = ${blue + 1} (viên).`));
};


// ---- bổ sung để "Đổi bộ câu hỏi" không cạn câu ở các bài ít dạng
const solidObjects: T3Template = (r, c, l) => {
  const cube = ['con xúc xắc', 'khối ru-bích', 'hộp quà vuông đều các mặt'], box = ['hộp sữa', 'viên gạch', 'bao diêm', 'tủ lạnh', 'hộp bút'], other = ['quả bóng', 'lon nước ngọt', 'cái nón lá'];
  const isCube = r.chance(0.5);
  const right = r.pick(isCube ? cube : box);
  const wrong = r.sample([...(isCube ? box : cube), ...other], 2);
  return Q.sc(`Đồ vật nào có dạng ${isCube ? 'khối lập phương' : 'khối hộp chữ nhật'}?`, r.shuffle([right, ...wrong]), right,
    M('T3.HH.02', 'TOAN.HINH', 'nhan_dang_khoi', l, `${right[0].toUpperCase() + right.slice(1)} có dạng ${isCube ? 'khối lập phương (các mặt là hình vuông bằng nhau)' : 'khối hộp chữ nhật'}.`));
};
const cubeStack: T3Template = (r, c, l) => {
  const n = r.pick([2, 3]);
  const floors = r.int(2, n === 2 ? 5 : 3);
  return Q.blanks(`Xếp các khối lập phương nhỏ thành ${floors} tầng, mỗi tầng ${n} hàng, mỗi hàng ${n} khối. Có tất cả bao nhiêu khối lập phương nhỏ?`, ['{} khối'], [[n * n * floors]],
    M('T3.TD.04', 'TOAN.HINH', 'xep_khoi', l, `Mỗi tầng: ${n} × ${n} = ${n * n} (khối). ${floors} tầng: ${n * n} × ${floors} = ${n * n * floors} (khối).`));
};
const unitWord: T3Template = (r, c, l) => {
  const kd = r.pick(c.topics.filter((t) => ['gram', 'ml', 'mm'].includes(t)).length ? c.topics.filter((t) => ['gram', 'ml', 'mm'].includes(t)) : ['ml']);
  if (kd === 'ml') {
    const cup = r.pick([100, 150, 200, 250]), n = r.int(2, 3);
    if (!okOp(c, cup, '*', n) || cup * n >= 1000) return null;
    return Q.blanks(`Bình có 1 l nước. Rót ra ${n} cốc, mỗi cốc ${cup} ml. Trong bình còn lại bao nhiêu mi-li-lít nước?`, ['{} ml'], [[1000 - cup * n]],
      M('T3.DL.01', 'TOAN.LOIVAN', 'ml_loi_van', l, `1 l = 1000 ml. Đã rót: ${cup} × ${n} = ${cup * n} (ml). Còn lại: 1000 ${MINUS} ${cup * n} = ${1000 - cup * n} (ml).`));
  }
  if (kd === 'gram') {
    const a = r.int(2, 8) * 50, b = r.int(2, 6) * 50;
    if (a + b >= 1000) return null;
    return Q.blanks(`Túi đường nặng ${a} g, túi muối nặng ${b} g. Cả hai túi nặng bao nhiêu gam? Còn thiếu bao nhiêu gam nữa thì đủ 1 kg?`, ['Cả hai: {} g', 'Còn thiếu: {} g'], [[a + b, 1000 - a - b]],
      M('T3.DL.01', 'TOAN.LOIVAN', 'gam_loi_van', l, `${a} + ${b} = ${a + b} (g). 1 kg = 1000 g nên còn thiếu 1000 ${MINUS} ${a + b} = ${1000 - a - b} (g).`));
  }
  const a = r.int(3, 9), b = r.int(1, 9);
  return Q.blanks('Viết số thích hợp.', [`${a} cm ${b} mm = {} mm`], [[a * 10 + b]],
    M('T3.DL.01', 'TOAN.DOLUONG', 'doi_mm', l, `${a} cm = ${a * 10} mm, thêm ${b} mm được ${a * 10 + b} mm.`));
};
const unitSub: T3Template = (r, c, l) => {
  const u = r.pick(['g', 'ml']);
  const b = r.int(1, 9) * 50 + r.pick([0, 25]);
  return Q.blanks('Viết số thích hợp.', [`1 ${u === 'g' ? 'kg' : 'l'} ${MINUS} ${b} ${u} = {} ${u}`], [[1000 - b]],
    M('T3.DL.01', 'TOAN.DOLUONG', 'tru_don_vi', l, `Đổi 1 ${u === 'g' ? 'kg = 1000 g' : 'l = 1000 ml'}; 1000 ${MINUS} ${b} = ${1000 - b} (${u}).`));
};
const tempCompare: T3Template = (r, c, l) => {
  const cities = r.sample(['Hà Nội', 'Đà Lạt', 'Huế', 'Cần Thơ', 'Sa Pa'], 3);
  const t = cities.map(() => r.int(12, 36));
  if (new Set(t).size < 3) return null;
  if (r.chance(0.5)) {
    const mi = t.indexOf(Math.min(...t));
    return Q.sc(`Nhiệt độ cùng một buổi trưa: ${cities.map((x, i) => `${x} ${t[i]} °C`).join(', ')}. Nơi nào mát nhất?`, cities, cities[mi],
      M('T3.DL.01', 'TOAN.DOLUONG', 'so_sanh_nhiet_do', l, `Nhiệt độ thấp nhất là ${t[mi]} °C ở ${cities[mi]}.`));
  }
  const [i, j] = t[0] > t[1] ? [0, 1] : [1, 0];
  return Q.blanks(`Buổi trưa ở ${cities[i]} là ${t[i]} °C, ở ${cities[j]} là ${t[j]} °C. ${cities[i]} nóng hơn ${cities[j]} bao nhiêu độ C?`, ['{} °C'], [[t[i] - t[j]]],
    M('T3.DL.01', 'TOAN.DOLUONG', 'chenh_lech_nhiet_do', l, `${t[i]} ${MINUS} ${t[j]} = ${t[i] - t[j]} (°C).`));
};
const chanceCards: T3Template = (r, c, l) => {
  const nums = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 4).sort((a, b) => a - b);
  const kind = r.int(0, 2);
  const evens = nums.filter((x) => x % 2 === 0).length;
  const [ev, ans] = kind === 0 ? ['rút được thẻ ghi số lớn hơn 0', 'chắc chắn'] : kind === 1 ? ['rút được thẻ ghi số 10', 'không thể'] : ['rút được thẻ ghi số chẵn', evens === 0 ? 'không thể' : evens === 4 ? 'chắc chắn' : 'có thể'];
  return Q.sc(`Có 4 tấm thẻ ghi các số ${nums.join(', ')}. Rút ngẫu nhiên 1 thẻ. Khả năng ${ev} là:`, ['chắc chắn', 'có thể', 'không thể'], ans,
    M('T3.TK.02', 'TOAN.THONGKE', 'kha_nang_the', l, `Các thẻ: ${nums.join(', ')}. ${ans === 'chắc chắn' ? 'Thẻ nào cũng thỏa mãn nên chắc chắn.' : ans === 'không thể' ? 'Không thẻ nào thỏa mãn nên không thể.' : 'Có thẻ thỏa mãn, có thẻ không nên có thể.'}`));
};

// =========================================================================== NHÓM DẠNG THEO MẢNG KIẾN THỨC
type LvMap = Partial<Record<Level, T3Template[]>>;
const NUMS: LvMap = { 1: [readPick, writeReading], 2: [placeDigit, compose], 3: [compareNums, neighbors, expandSum], 4: [orderNums, maxMinPick], 5: [makeNumber, evenRule] };
const ADD: LvMap = { 1: [addCalc, addPick], 2: [addCalc, compareSum], 3: [addWord, addTable], 4: [findAddSub, findChain], 5: [twoStepMore, sumDiff, equalize] };
const MUL: LvMap = { 1: [mulCalc, mulPick], 2: [mulCalc, mulDivTable], 3: [mulWord, findBig], 4: [findBig, timesChain, mulAddMix], 5: [unitRate, twoStepTimes] };
const DIV: LvMap = { 1: [divCalc], 2: [divCalc, divRem], 3: [divWord, divRem], 4: [findBig, remFacts], 5: [busCeil, unitRate, remFacts] };

const T: Record<T3Topic, LvMap> = {
  num1000: NUMS, num10k: NUMS, num100k: NUMS,
  cmp10k: { 1: [compareNums, maxMinPick], 2: [compareNums, neighbors], 3: [orderNums, maxMinPick], 4: [orderNums, makeNumber], 5: [makeNumber, evenRule] },
  cmp100k: { 1: [compareNums, maxMinPick], 2: [compareNums, neighbors], 3: [orderNums, maxMinPick], 4: [orderNums, makeNumber], 5: [makeNumber, evenRule] },
  roman: { 1: [romanRead], 2: [romanWrite, romanRead], 3: [romanOrder, romanClock], 4: [romanClock, romanOrder], 5: [romanSticks, romanOrder] },
  round: { 1: [roundTo], 2: [roundTo, roundTable], 3: [roundTable, roundTo], 4: [roundRange, roundTable], 5: [roundRange] },
  round100k: { 1: [roundTo], 2: [roundTo, roundTable], 3: [roundTable, roundTo], 4: [roundRange, roundTable], 5: [roundRange] },
  addsub1000: ADD, add10k: ADD, sub10k: ADD, add100k: ADD, sub100k: ADD,
  findAddSub: { 1: [findAddSub], 2: [findAddSub, addCalc], 3: [findAddSub, addWord], 4: [findChain], 5: [findChain, sumDiff] },
  table: { 1: [tableMul, tableDiv], 2: [tablePick, tableSeq], 3: [tableWord, family], 4: [tableCompare, findMulDiv], 5: [mulAddMix, legs, unitRate] },
  findMulDiv: { 1: [findMulDiv], 2: [findMulDiv, tableDiv], 3: [tableWord, family], 4: [findMulChain, findMulDiv], 5: [findMulChain, unitRate] },
  fraction: { 1: [fracOf, fracShape], 2: [fracOf, fracShape], 3: [fracWord], 4: [fracReverse, fracCompare], 5: [fracCompare, fracReverse] },
  geoReview: { 1: [unitsReview, polyline], 2: [polyline, unitsReview], 3: [polyline, addWord], 4: [twoStepMore, polyline, G3.tri], 5: [equalize, polyline, G3.mid] },
  midpoint: { 1: [midpoint], 2: [midpoint, midpointFacts], 3: [midpointFacts, midpoint], 4: [midpoint, circleRow], 5: [circleRow, midpoint] },
  circle: { 1: [circleRD], 2: [circleRD, circleFacts], 3: [circleFacts, circleRD], 4: [circleRow], 5: [circleRow, circleRD] },
  angle: { 1: [angleClock, angleFacts], 2: [angleClock, shapeCount], 3: [rectFacts, angleClock, shapeCount, angleFacts], 4: [countRightAngles, G3.sq, G3.mid], 5: [countRightAngles, angleClock, G3.diag, G3.triH] },
  shapes: { 1: [shapeCount], 2: [shapeCount, rectFacts], 3: [rectFacts, shapeCount], 4: [countRightAngles, G3.sq, G3.tri, G3.mid], 5: [countRightAngles, G3.sq, G3.rect, G3.diag, G3.triH] },
  solids: { 1: [solidCount, solidObjects], 2: [solidCount, solidFacts, solidObjects], 3: [solidFacts, solidCount, solidObjects], 4: [cubePaint, cubeStack], 5: [cubePaint, cubeStack, countRightAngles] },
  mul2d: MUL, mul3d: MUL, mul4d: MUL, mul5d: MUL,
  div2d: DIV, div3d: DIV, div4d: DIV, div5d: DIV,
  times: { 1: [timesCalc], 2: [timesCalc, timesVsAdd], 3: [timesWord], 4: [timesChain, timesVsAdd], 5: [twoStepTimes, ageProblem] },
  reduce: { 1: [reduceCalc], 2: [reduceCalc, timesCalc], 3: [reduceWord], 4: [timesChain], 5: [twoStepShare, ageProblem] },
  remainder: { 1: [divRem], 2: [divRem, remFacts], 3: [remFacts, divRem], 4: [remFacts, busCeil], 5: [busCeil, remFacts] },
  twoStep: { 1: [mulCalc, addCalc], 2: [twoStepMore, mulWord], 3: [twoStepMore, twoStepTimes, twoStepShare], 4: [twoStepTimes, twoStepShare], 5: [ageProblem, unitRate, sumDiff] },
  mm: { 1: [convert, unitPick], 2: [convert, unitCompare, unitWord], 3: [unitCalc, unitCompare, unitWord], 4: [weighPuzzle, unitCalc, unitSub], 5: [weighPuzzle, equalize, unitWord] },
  gram: { 1: [convert, unitPick, unitSub], 2: [convert, unitCompare, unitSub], 3: [unitCalc, unitCompare, unitWord], 4: [weighPuzzle, unitCalc, unitWord], 5: [weighPuzzle, equalize, unitWord] },
  ml: { 1: [convert, unitPick, unitSub], 2: [convert, unitCompare, unitSub], 3: [unitCalc, unitCompare, unitWord], 4: [weighPuzzle, unitCalc, unitWord], 5: [weighPuzzle, equalize, unitWord] },
  temp: { 1: [temp, unitPick], 2: [temp, tempCompare], 3: [tempCompare, temp], 4: [tempCompare, weighPuzzle], 5: [weighPuzzle, tempCompare] },
  expr: { 1: [exprCalc], 2: [exprCalc, exprPickQ], 3: [exprPickQ, exprParen], 4: [exprCompare, exprParen], 5: [exprCompare, findMulChain] },
  ratio: { 1: [ratioCalc], 2: [ratioCalc, timesCalc], 3: [ratioWord], 4: [ratioFraction], 5: [ratioFraction, timesChain] },
  perimeter: { 1: [perimRect], 2: [perimRect, polyline], 3: [perimRect, areaPerimTable], 4: [perimReverse, G3.rect], 5: [perimReverse, areaReverse, G3.sq] },
  areaIntro: { 1: [areaCount], 2: [areaCount, areaUnitFacts], 3: [areaUnitFacts, areaCount], 4: [areaRect], 5: [areaRect, areaReverse] },
  area: { 1: [areaRect, areaCount], 2: [areaRect], 3: [areaPerimTable, areaRect], 4: [areaReverse, G3.sq], 5: [areaReverse, perimReverse, G3.sq, G3.rect] },
  clock: { 1: [readClock3], 2: [readClock3, clockKem], 3: [duration3, clockKem], 4: [durationCross], 5: [durationCross, weekdayCalc] },
  month: { 1: [monthDays3, yearFacts], 2: [yearFacts, months31], 3: [months31, weekdayCalc], 4: [weekdayCalc], 5: [weekdayCalc, durationCross] },
  money: { 1: [moneySum, moneyPick], 2: [moneyPick, moneySum], 3: [moneyChange, moneyBuy], 4: [moneyBuy, moneyChange], 5: [equalize, unitRate] },
  dataTable: { 1: [tallyCount, dataRead], 2: [dataRead, tallyCount], 3: [dataRead, dataOrder], 4: [dataOrder, dataRead], 5: [chanceBalls, dataRead] },
  chance: { 1: [chancePick3, chanceCards], 2: [chancePick3, chanceTable3, chanceCards], 3: [chanceTable3, chancePick3, chanceCards], 4: [chanceBalls, chanceCards], 5: [chanceBalls, chanceTable3] },
};

const retry = (t: T3Template): T3Template => (r, c, l) => {
  for (let i = 0; i < 15; i++) {
    const q = t(r, c, l);
    if (q) return q;
  }
  return null;
};
const RETRIED = new Map<T3Template, T3Template>();
const wrap = (t: T3Template) => RETRIED.get(t) ?? (RETRIED.set(t, retry(t)), RETRIED.get(t)!);

export function t3Pool(topics: T3Topic[]): T3Pool {
  const pool: T3Pool = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const t of topics) for (const lv of [1, 2, 3, 4, 5] as Level[]) for (const fn of T[t][lv] ?? []) if (!pool[lv].includes(wrap(fn))) pool[lv].push(wrap(fn));
  return pool;
}

// BỘ SINH CÂU — TOÁN 5 (bám trình tự Kết nối tri thức, Toán 5 tập một + tập hai, Bài 1–75).
//
// Mỗi bài chọn dạng câu theo các "mảng kiến thức" của bài (toan5-plan.ts). Số, tình huống, câu chữ sinh ngẫu nhiên theo
// seed — không chép bài tập của sách. Mức L4–L5 có dạng NÂNG CAO phổ biến ở lớp 5 (tổng – tỉ, hiệu – tỉ, phần trăm lãi,
// giảm giá, chuyển động ngược chiều – cùng chiều, hình ghép, nước dâng trong bể…), đề tự viết.
//
// "Không vượt trước" (npm run check:practice): chưa dùng số thập phân trước Bài 10 (khái niệm số thập phân).
// Số thập phân viết dấu phẩy (12,5); phần nguyên từ 1000 viết tách lớp bằng khoảng trắng hẹp (U+202F).

import type { Level } from '../content/types';
import type { T5Lesson, T5Topic } from '../content/toan5-plan';
import { KIDS, Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';
import { G5 } from './count-shapes';
import { f, readVi } from './toan4';

export type T5Ctx = { lesson: number; decimal: boolean; topics: T5Topic[] };
export type T5Template = (r: Rng, c: T5Ctx, l: Level) => PracticeQuestion | null;
export type T5Pool = Record<Level, T5Template[]>;

export function t5Context(p: T5Lesson): T5Ctx {
  return { lesson: p.no, decimal: p.scope.decimal, topics: p.topics };
}

const M = (o: string, f2: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f: f2, k, l, e, s: s ?? (l >= 3 ? e : undefined) });
const MINUS = '−';
const NB = ' ';
const kid = (r: Rng, not?: string) => r.pick(KIDS.filter((k) => k !== not));
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

// ------------------------------------------------------------------- số thập phân
/** làm sạch sai số dấu phẩy động */
const cl = (x: number) => Math.round(x * 10000) / 10000;
const parts = (x: number) => Math.abs(cl(x)).toFixed(4).replace(/\.?0+$/, '').split('.');
/** hiển thị: 1 250,75 */
export const d = (x: number) => {
  const [i, fp] = parts(x);
  const ip = i.length >= 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, NB) : i;
  return (x < 0 ? '-' : '') + ip + (fp ? ',' + fp : '');
};
/** đáp án ô điền: 1250,75 (không tách lớp) */
const da = (x: number) => {
  const [i, fp] = parts(x);
  return i + (fp ? ',' + fp : '');
};
/** số thập phân ngẫu nhiên có đúng k chữ số ở phần thập phân (chữ số cuối khác 0) */
const rd = (r: Rng, lo: number, hi: number, k: number) => {
  const p = 10 ** k;
  for (let i = 0; i < 20; i++) {
    const n = r.int(Math.round(lo * p), Math.round(hi * p));
    if (n % 10 !== 0) return n / p;
  }
  return (Math.round(lo * p) + 1) / p;
};
const decPlaces = (x: number) => (parts(x)[1] ?? '').length;
const fr = (a: number, b: number) => `${a}/${b}`;
const red = (a: number, b: number) => {
  const g = gcd(a, b);
  return [a / g, b / g] as const;
};
const frR = (a: number, b: number) => {
  const [x, y] = red(a, b);
  return y === 1 ? String(x) : fr(x, y);
};
const uniqOpts = (r: Rng, right: string, wrong: string[], n = 4) => {
  const opts = [...new Set([right, ...wrong.filter((w) => w && w !== right)])].slice(0, n);
  return opts.length >= 3 ? r.shuffle(opts) : null;
};
const decOpts = (r: Rng, x: number, wrong: number[]) => uniqOpts(r, d(x), wrong.filter((w) => w > 0).map(d));
const natOpts = (r: Rng, x: number, wrong: number[]) => uniqOpts(r, f(x), wrong.filter((w) => w > 0 && Number.isInteger(w)).map(f));
const cmpSign = (a: number, b: number) => (a > b ? '>' : a < b ? '<' : '=');

// =========================================================================== CHỦ ĐỀ 1. ÔN TẬP VÀ BỔ SUNG
const PLACE = ['đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn', 'trăm nghìn', 'triệu', 'chục triệu', 'trăm triệu'];
const bigN = (r: Rng) => r.int(10 ** r.int(4, 7), 10 ** 8 - 1);

const natRead: T5Template = (r, c, l) => {
  const n = bigN(r);
  const s = String(n);
  const i = r.int(0, s.length - 2);
  const swap = Number(s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2));
  const opts = natOpts(r, n, [swap, n + 10 ** r.int(1, s.length - 2), n * 10 > 10 ** 9 ? n - 1 : Math.floor(n / 10)]);
  if (!opts) return null;
  return Q.sc(`Số "${readVi(n)}" viết là:`, opts, f(n), M('T5.SO.01', 'TOAN.DOCVIET', 'doc_viet_so', l, `"${readVi(n)}" viết là ${f(n)}.`));
};
const natPlace: T5Template = (r, c, l) => {
  const n = bigN(r);
  const s = String(n);
  const p = r.int(1, s.length - 1);
  const dg = Number(s[s.length - 1 - p]);
  if (!dg) return null;
  return Q.blanks(`Trong số ${f(n)}, chữ số ${dg} ở hàng ${PLACE[p]} có giá trị là bao nhiêu?`, ['{}'], [[dg * 10 ** p]],
    M('T5.SO.01', 'TOAN.DOCVIET', 'gia_tri_chu_so', l, `Chữ số ${dg} ở hàng ${PLACE[p]} có giá trị ${f(dg * 10 ** p)}.`));
};
const natCmp: T5Template = (r, c, l) => {
  const a = bigN(r);
  const s = String(a).split('');
  const i = r.int(0, s.length - 1);
  s[i] = String((Number(s[i]) + r.int(1, 8)) % 10);
  const b = r.chance(0.15) ? a : Number(s.join(''));
  if (String(b).length !== String(a).length && r.chance(0.5)) return null;
  return Q.sc(`Chọn dấu thích hợp: ${f(a)} ? ${f(b)}`, ['>', '<', '='], cmpSign(a, b),
    M('T5.SO.01', 'TOAN.SOSANH', 'so_sanh_stn', l, `So sánh từng hàng từ trái sang phải: ${f(a)} ${cmpSign(a, b)} ${f(b)}.`));
};
const natOrder: T5Template = (r, c, l) => {
  const base = r.int(100, 999) * 1000;
  const ns = [...new Set([base + r.int(0, 999), base + r.int(0, 999), base - r.int(1, 99) * 1000 + r.int(0, 999), base + r.int(1, 9) * 100000])];
  if (ns.length < 4) return null;
  const sorted = [...ns].sort((a, b) => a - b).map(f);
  return Q.ord('Sắp xếp các số theo thứ tự từ bé đến lớn.', sorted, M('T5.SO.01', 'TOAN.SAPXEP', 'xep_stn', l, sorted.join(' < ') + '.'));
};
const natRound: T5Template = (r, c, l) => {
  const n = r.int(1000000, 99999999);
  const p = r.pick([3, 5]);
  const u = 10 ** p;
  const rr = Math.round(n / u) * u;
  return Q.blanks(`Làm tròn số ${f(n)} đến hàng ${PLACE[p]}.`, ['{}'], [[rr]],
    M('T5.SO.01', 'TOAN.DOCVIET', 'lam_tron_stn', l, `Xét chữ số hàng ${PLACE[p - 1]}: bé hơn 5 thì làm tròn xuống, từ 5 trở lên thì làm tròn lên. Được ${f(rr)}.`));
};
const natMake: T5Template = (r, c, l) => {
  const ds = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
  const big = r.chance(0.5);
  const sorted = [...ds].sort((a, b) => (big ? b - a : a - b));
  if (!big && sorted[0] === 0) [sorted[0], sorted[1]] = [sorted[1], sorted[0]];
  const n = Number(sorted.join(''));
  return Q.blanks(`Từ năm chữ số ${ds.join(', ')}, lập số ${big ? 'lớn' : 'bé'} nhất có năm chữ số khác nhau.`, ['{}'], [[n]],
    M('T5.TD.01', 'TOAN.DOCVIET', 'lap_so', l, big ? `Xếp các chữ số từ lớn đến bé: ${f(n)}.` : `Xếp các chữ số từ bé đến lớn, chữ số 0 không đứng đầu: ${f(n)}.`));
};

const natCalc: T5Template = (r, c, l) => {
  const k = r.int(0, 3);
  if (k === 0) { const a = r.int(10000, 900000), b = r.int(10000, 900000); return Q.blanks('Tính.', [`${f(a)} + ${f(b)} = {}`], [[a + b]], M('T5.SO.01', 'TOAN.TINH', 'cong_stn', l, `${f(a)} + ${f(b)} = ${f(a + b)}.`)); }
  if (k === 1) { const b = r.int(10000, 500000), a = b + r.int(10000, 400000); return Q.blanks('Tính.', [`${f(a)} ${MINUS} ${f(b)} = {}`], [[a - b]], M('T5.SO.01', 'TOAN.TINH', 'tru_stn', l, `${f(a)} ${MINUS} ${f(b)} = ${f(a - b)}.`)); }
  if (k === 2) { const a = r.int(102, 999), b = r.int(12, 99); return Q.blanks('Tính.', [`${f(a)} × ${b} = {}`], [[a * b]], M('T5.SO.01', 'TOAN.TINH', 'nhan_stn', l, `${f(a)} × ${b} = ${f(a * b)}.`)); }
  const b = r.int(12, 99), q = r.int(102, 999);
  return Q.blanks('Tính.', [`${f(b * q)} : ${b} = {}`], [[q]], M('T5.SO.01', 'TOAN.TINH', 'chia_stn', l, `${f(b * q)} : ${b} = ${q}.`));
};
const natExpr: T5Template = (r, c, l) => {
  const a = r.int(100, 999), b = r.int(12, 60), cc = r.int(3, 9), e = r.int(2, 9);
  const k = r.int(0, 1);
  const [txt, v] = k === 0 ? [`${a} + ${b} × ${cc}`, a + b * cc] : [`(${a} ${MINUS} ${b}) × ${e}`, (a - b) * e];
  return Q.blanks('Tính giá trị của biểu thức.', [`${txt} = {}`], [[v]],
    M('T5.SO.01', 'TOAN.BIEUTHUC', 'bieu_thuc_stn', l, 'Trong ngoặc làm trước; nhân, chia trước, cộng, trừ sau.', `${txt} = ${f(v)}.`));
};
const natSmart: T5Template = (r, c, l) => {
  const x = r.int(13, 99);
  const k = r.int(0, 2);
  if (k === 0) return Q.blanks('Tính bằng cách thuận tiện.', [`25 × ${x} × 4 = {}`], [[x * 100]], M('T5.SO.01', 'TOAN.BIEUTHUC', 'thuan_tien', l, `25 × 4 = 100, nên 25 × ${x} × 4 = ${x} × 100 = ${f(x * 100)}.`));
  if (k === 1) { const a = r.int(12, 98), b = 100 - (a % 100 === 0 ? 1 : 0); return Q.blanks('Tính bằng cách thuận tiện.', [`${x} × ${a} + ${x} × ${b - a} = {}`], [[x * b]], M('T5.SO.01', 'TOAN.BIEUTHUC', 'phan_phoi', l, `${x} × ${a} + ${x} × ${b - a} = ${x} × (${a} + ${b - a}) = ${x} × ${b} = ${f(x * b)}.`)); }
  return Q.blanks('Tính bằng cách thuận tiện.', [`125 × ${x} × 8 = {}`], [[x * 1000]], M('T5.SO.01', 'TOAN.BIEUTHUC', 'thuan_tien', l, `125 × 8 = 1000, nên 125 × ${x} × 8 = ${f(x * 1000)}.`));
};
const natFindX: T5Template = (r, c, l) => {
  const a = r.int(12, 95), x = r.int(105, 999);
  return r.chance(0.5)
    ? Q.blanks('Tìm x.', [`x × ${a} = ${f(a * x)}`, 'x = {}'], [[x]], M('T5.SO.01', 'TOAN.TIMX', 'tim_x', l, `x = ${f(a * x)} : ${a} = ${x}.`))
    : Q.blanks('Tìm x.', [`x : ${a} = ${x}`, 'x = {}'], [[a * x]], M('T5.SO.01', 'TOAN.TIMX', 'tim_x', l, `x = ${x} × ${a} = ${f(a * x)}.`));
};
const natWord: T5Template = (r, c, l) => {
  const boxes = r.int(12, 48), per = r.int(12, 36), sold = r.int(2, boxes - 2) * per;
  const left = boxes * per - sold;
  return Q.blanks(`Một cửa hàng nhập ${boxes} thùng nước, mỗi thùng ${per} chai. Cửa hàng đã bán ${f(sold)} chai. Hỏi cửa hàng còn lại bao nhiêu thùng nước?`, ['{} thùng'], [[left / per]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'loi_van_stn', l, `Số chai: ${boxes} × ${per} = ${f(boxes * per)}; còn ${f(boxes * per)} ${MINUS} ${f(sold)} = ${f(left)} chai = ${left / per} thùng.`));
};

const fracReduce: T5Template = (r, c, l) => {
  const a = r.int(1, 9), b = r.int(a + 1, 12);
  if (gcd(a, b) !== 1) return null;
  const k = r.int(2, 9);
  const opts = uniqOpts(r, fr(a, b), [fr(b, a), fr(a * k / gcd(a * k, 2) || a, b * k / gcd(a * k, 2) || b), fr(a + 1, b), fr(a, b + 1)]);
  if (!opts) return null;
  return Q.sc(`Rút gọn phân số ${fr(a * k, b * k)} được phân số tối giản là:`, opts, fr(a, b),
    M('T5.SO.02', 'TOAN.PHANSO', 'rut_gon', l, `Chia cả tử số và mẫu số cho ${k}: ${fr(a * k, b * k)} = ${fr(a, b)}.`));
};
const fracCmp: T5Template = (r, c, l) => {
  const b1 = r.int(3, 12), b2 = r.int(3, 12), a1 = r.int(1, b1 - 1), a2 = r.int(1, b2 - 1);
  if (b1 === b2 && a1 === a2) return null;
  const s = cmpSign(a1 * b2, a2 * b1);
  return Q.sc(`Chọn dấu thích hợp: ${fr(a1, b1)} ? ${fr(a2, b2)}`, ['>', '<', '='], s,
    M('T5.SO.02', 'TOAN.SOSANH', 'so_sanh_ps', l, `Quy đồng: ${fr(a1, b1)} = ${fr(a1 * b2, b1 * b2)}; ${fr(a2, b2)} = ${fr(a2 * b1, b1 * b2)}. Vậy ${fr(a1, b1)} ${s} ${fr(a2, b2)}.`));
};
const fracCommonD: T5Template = (r, c, l) => {
  const b1 = r.int(2, 9), b2 = r.int(2, 9);
  if (b1 === b2) return null;
  const m = lcm(b1, b2), a1 = r.int(1, b1 - 1), a2 = r.int(1, b2 - 1);
  return Q.blanks(`Quy đồng mẫu số hai phân số ${fr(a1, b1)} và ${fr(a2, b2)} với mẫu số chung ${m}.`, [`${fr(a1, b1)} = {}/${m}`, `${fr(a2, b2)} = {}/${m}`], [[a1 * m / b1, a2 * m / b2]],
    M('T5.SO.02', 'TOAN.PHANSO', 'quy_dong', l, `${fr(a1, b1)} = ${fr(a1 * m / b1, m)}; ${fr(a2, b2)} = ${fr(a2 * m / b2, m)}.`));
};
const fracOrder: T5Template = (r, c, l) => {
  const m = r.pick([12, 24, 30, 36]);
  const divs = [2, 3, 4, 5, 6, 8, 9, 10, 12].filter((x) => m % x === 0);
  const fs = new Map<number, string>();
  for (let i = 0; i < 12 && fs.size < 4; i++) {
    const b = r.pick(divs), a = r.int(1, b - 1);
    if (gcd(a, b) !== 1) continue;
    const v = (a * m) / b;
    if (!fs.has(v)) fs.set(v, fr(a, b));
  }
  if (fs.size < 4) return null;
  const sorted = [...fs.entries()].sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  return Q.ord('Sắp xếp các phân số theo thứ tự từ bé đến lớn.', sorted, M('T5.SO.02', 'TOAN.SAPXEP', 'xep_ps', l, `Quy đồng mẫu số ${m} rồi so sánh tử số: ${sorted.join(' < ')}.`));
};

const decFracPick: T5Template = (r, c, l) => {
  const right = fr(r.int(1, 99), r.pick([10, 100, 1000]));
  const wrong = r.sample([fr(r.int(1, 9), r.pick([3, 7, 20, 25, 50])), fr(r.int(1, 9), 11), fr(r.int(1, 30), 200), fr(10, r.int(3, 9))], 3);
  return Q.sc('Phân số nào là phân số thập phân?', r.shuffle([right, ...wrong]), right,
    M('T5.SO.03', 'TOAN.PHANSO', 'nhan_biet_pstp', l, `Phân số có mẫu số là 10, 100, 1000… gọi là phân số thập phân: ${right}.`));
};
const decFracMc: T5Template = (r, c, l) => {
  const rights = r.sample([fr(3, 10), fr(17, 100), fr(9, 1000), fr(41, 100), fr(7, 10), fr(123, 1000)], 2);
  const wrongs = r.sample([fr(3, 20), fr(10, 3), fr(9, 50), fr(1, 25), fr(100, 7)], 2);
  return Q.mc('Chọn tất cả các phân số thập phân.', r.shuffle([...rights, ...wrongs]), rights,
    M('T5.SO.03', 'TOAN.PHANSO', 'chon_pstp', l, 'Phân số thập phân có mẫu số là 10, 100, 1000…', `Phân số thập phân: ${rights.join('; ')}.`));
};
const toDecFrac: T5Template = (r, c, l) => {
  const [b, t] = r.pick([[2, 10], [5, 10], [4, 100], [20, 100], [25, 100], [50, 100], [8, 1000], [40, 1000], [125, 1000], [250, 1000]] as [number, number][]);
  const a = r.int(1, b - 1);
  if (gcd(a, b) !== 1) return null;
  const k = t / b;
  return Q.blanks(`Viết phân số ${fr(a, b)} thành phân số thập phân.`, [`${fr(a, b)} = {}/${t}`], [[a * k]],
    M('T5.SO.03', 'TOAN.PHANSO', 'viet_pstp', l, `Nhân cả tử số và mẫu số với ${k}: ${fr(a, b)} = ${fr(a * k, t)}.`));
};
const toDecFracRed: T5Template = (r, c, l) => {
  const [b, t] = r.pick([[300, 100], [3000, 1000], [600, 100], [70, 10], [900, 100], [30, 10]] as [number, number][]);
  const k = b / t;
  const a = k * r.int(1, t - 1);
  if (a >= b) return null;
  return Q.blanks(`Viết phân số ${fr(a, b)} thành phân số thập phân có mẫu số ${t}.`, [`${fr(a, b)} = {}/${t}`], [[a / k]],
    M('T5.SO.03', 'TOAN.PHANSO', 'viet_pstp_chia', l, `Chia cả tử số và mẫu số cho ${k}: ${fr(a, b)} = ${fr(a / k, t)}.`));
};
const decFracWord: T5Template = (r, c, l) => {
  const [b, t] = r.pick([[4, 100], [5, 10], [20, 100], [25, 100], [50, 100]] as [number, number][]);
  const a = r.int(1, b - 1);
  if (gcd(a, b) !== 1) return null;
  const n = t === 10 ? 40 : 200;
  return Q.blanks(`Khối lớp 5 có ${n} bạn, trong đó ${fr(a, b)} số bạn thích bơi. Viết ${fr(a, b)} thành phân số thập phân, rồi tính số bạn thích bơi.`, [`${fr(a, b)} = {}/${t}`, 'Số bạn thích bơi: {} bạn'], [[a * t / b, n * a / b]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'pstp_loi_van', l, `${fr(a, b)} = ${fr(a * t / b, t)}; ${n} × ${fr(a, b)} = ${n * a / b} (bạn).`));
};

const fracAddSame: T5Template = (r, c, l) => {
  const b = r.int(5, 15), a1 = r.int(1, b - 2), a2 = r.int(1, b - a1 - 1);
  const ans = frR(a1 + a2, b);
  const opts = uniqOpts(r, ans, [fr(a1 + a2, b + b), frR(a1 + a2 + 1, b), frR(Math.abs(a1 - a2) || 1, b)]);
  if (!opts) return null;
  return Q.sc(`${fr(a1, b)} + ${fr(a2, b)} = ?`, opts, ans, M('T5.SO.02', 'TOAN.PHANSO', 'cong_ps', l, `Cộng hai tử số, giữ nguyên mẫu số: ${fr(a1 + a2, b)}${ans !== fr(a1 + a2, b) ? ' = ' + ans : ''}.`));
};
const fracMulPick: T5Template = (r, c, l) => {
  const a = r.int(1, 6), b = r.int(a + 1, 9), x = r.int(1, 6), y = r.int(x + 1, 9);
  const ans = frR(a * x, b * y);
  const opts = uniqOpts(r, ans, [frR(a + x, b + y), frR(a * y, b * x), frR(a * x + 1, b * y)]);
  if (!opts) return null;
  return Q.sc(`${fr(a, b)} × ${fr(x, y)} = ?`, opts, ans, M('T5.SO.02', 'TOAN.PHANSO', 'nhan_ps', l, `Nhân tử số với tử số, mẫu số với mẫu số: ${fr(a * x, b * y)}${ans !== fr(a * x, b * y) ? ' = ' + ans : ''}.`));
};
const fracDivPick: T5Template = (r, c, l) => {
  const a = r.int(1, 6), b = r.int(a + 1, 9), x = r.int(1, 6), y = r.int(x + 1, 9);
  const ans = frR(a * y, b * x);
  const opts = uniqOpts(r, ans, [frR(a * x, b * y), frR(b * x, a * y), frR(a * y + 1, b * x)]);
  if (!opts) return null;
  return Q.sc(`${fr(a, b)} : ${fr(x, y)} = ?`, opts, ans, M('T5.SO.02', 'TOAN.PHANSO', 'chia_ps', l, `Nhân với phân số đảo ngược: ${fr(a, b)} × ${fr(y, x)} = ${fr(a * y, b * x)}${ans !== fr(a * y, b * x) ? ' = ' + ans : ''}.`));
};
const fracExpr: T5Template = (r, c, l) => {
  const b = r.pick([4, 6, 8, 10, 12]), a = r.int(1, b - 1), x = r.int(1, 4), y = r.pick([2, 3, 4]), z = r.int(2, 3);
  // a/b + x/y × z/(…)
  const n2 = x * z, d2 = y * (z + 1);
  const m = lcm(b, d2);
  const top = a * (m / b) + n2 * (m / d2);
  const ans = frR(top, m);
  const opts = uniqOpts(r, ans, [frR(a + n2, b + d2), frR(top + 1, m), frR((a * d2 + x * b) * z, b * y * (z + 1) * 2)]);
  if (!opts) return null;
  return Q.sc(`Tính: ${fr(a, b)} + ${fr(x, y)} × ${fr(z, z + 1)}`, opts, ans,
    M('T5.SO.02', 'TOAN.PHANSO', 'bieu_thuc_ps', l, 'Nhân trước, cộng sau.', `${fr(x, y)} × ${fr(z, z + 1)} = ${frR(n2, d2)}; ${fr(a, b)} + ${frR(n2, d2)} = ${ans}.`));
};
const fracRestWord: T5Template = (r, c, l) => {
  const b1 = r.pick([3, 4, 5]), b2 = r.pick([2, 3, 4]);
  const total = b1 * b2 * r.int(4, 12);
  const day1 = total / b1, rest = total - day1, day2 = rest / b2, left = rest - day2;
  return Q.blanks(`Một cửa hàng có ${total} kg gạo. Ngày đầu bán ${fr(1, b1)} số gạo, ngày thứ hai bán ${fr(1, b2)} số gạo còn lại. Hỏi cửa hàng còn bao nhiêu ki-lô-gam gạo?`, ['{} kg'], [[left]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'ps_con_lai', l, `Ngày đầu: ${total} : ${b1} = ${day1} kg; còn ${rest} kg. Ngày thứ hai: ${rest} : ${b2} = ${day2} kg. Còn lại ${left} kg.`));
};

const fracAddDiffPick: T5Template = (r, c, l) => {
  const b1 = r.int(2, 9), b2 = r.int(2, 9);
  if (b1 === b2) return null;
  const a1 = r.int(1, b1 - 1), a2 = r.int(1, b2 - 1);
  const m = lcm(b1, b2);
  const sub = l >= 2 && r.chance(0.6) && a1 * b2 > a2 * b1;
  const top = sub ? a1 * (m / b1) - a2 * (m / b2) : a1 * (m / b1) + a2 * (m / b2);
  const ans = frR(top, m);
  const opts = uniqOpts(r, ans, [fr(sub ? Math.abs(a1 - a2) || 1 : a1 + a2, b1 + b2), frR(top + 1, m), frR(sub ? a1 * (m / b1) + a2 * (m / b2) : Math.abs(a1 * (m / b1) - a2 * (m / b2)) || 1, m)]);
  if (!opts) return null;
  const op = sub ? MINUS : '+';
  return Q.sc(`${fr(a1, b1)} ${op} ${fr(a2, b2)} = ?`, opts, ans,
    M('T5.SO.02', 'TOAN.PHANSO', sub ? 'tru_ps_khac_mau' : 'cong_ps_khac_mau', l, `Quy đồng mẫu số ${m}: ${fr(a1 * (m / b1), m)} ${op} ${fr(a2 * (m / b2), m)} = ${fr(top, m)}${ans !== fr(top, m) ? ' = ' + ans : ''}.`));
};
const fracFindX: T5Template = (r, c, l) => {
  const b1 = r.int(2, 8), b2 = r.int(2, 8);
  if (b1 === b2) return null;
  const a1 = r.int(1, b1 - 1), a2 = r.int(1, b2 - 1);
  const m = lcm(b1, b2), sum = a1 * (m / b1) + a2 * (m / b2);
  const ans = fr(a1, b1);
  const opts = uniqOpts(r, ans, [frR(sum + a2 * (m / b2), m), frR(a2, b2), frR(a1 + 1, b1)]);
  if (!opts) return null;
  return Q.sc(`Tìm x, biết: x + ${fr(a2, b2)} = ${frR(sum, m)}`, opts, ans,
    M('T5.SO.02', 'TOAN.TIMX', 'tim_x_ps', l, `x = ${frR(sum, m)} ${MINUS} ${fr(a2, b2)} = ${ans}.`));
};
const fracTankWord: T5Template = (r, c, l) => {
  const b1 = r.int(3, 6), b2 = r.int(3, 8);
  if (b1 === b2) return null;
  const m = lcm(b1, b2), top = m / b1 + m / b2;
  if (top >= m) return null;
  return Q.blanks(`Vòi thứ nhất mỗi giờ chảy được ${fr(1, b1)} bể, vòi thứ hai mỗi giờ chảy được ${fr(1, b2)} bể. Nếu mở cả hai vòi cùng lúc thì mỗi giờ chảy được bao nhiêu phần của bể? (viết phân số tối giản)`, ['{}/{} bể'], [red(top, m) as unknown as number[]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'voi_nuoc', l, `${fr(1, b1)} + ${fr(1, b2)} = ${fr(m / b1, m)} + ${fr(m / b2, m)} = ${frR(top, m)} (bể).`));
};

const mixedRead: T5Template = (r, c, l) => {
  const w = r.int(1, 9), b = r.int(3, 9), a = r.int(1, b - 1);
  const ans = `${w} ${fr(a, b)}`;
  const opts = uniqOpts(r, ans, [`${a} ${fr(w, b)}`, `${w} ${fr(b, a)}`, `${b} ${fr(a, w + 1)}`]);
  if (!opts) return null;
  return Q.sc(`Hỗn số "${readVi(w)} và ${readVi(a)} phần ${readVi(b)}" viết là:`, opts, ans,
    M('T5.SO.03', 'TOAN.PHANSO', 'doc_viet_hon_so', l, `Hỗn số gồm phần nguyên ${w} và phần phân số ${fr(a, b)}: ${ans}.`));
};
const mixedToFrac: T5Template = (r, c, l) => {
  const w = r.int(1, 6), b = r.int(2, 9), a = r.int(1, b - 1);
  const ans = fr(w * b + a, b);
  const opts = uniqOpts(r, ans, [fr(w + a, b), fr(w * a + b, b), fr(w * b + a, b + w)]);
  if (!opts) return null;
  return Q.sc(`Chuyển hỗn số ${w} ${fr(a, b)} thành phân số.`, opts, ans,
    M('T5.SO.03', 'TOAN.PHANSO', 'hon_so_ps', l, `Tử số = ${w} × ${b} + ${a} = ${w * b + a}, mẫu số giữ nguyên: ${ans}.`));
};
const fracToMixed: T5Template = (r, c, l) => {
  const w = r.int(1, 8), b = r.int(2, 9), a = r.int(1, b - 1);
  return Q.blanks(`Viết phân số ${fr(w * b + a, b)} thành hỗn số.`, [`${fr(w * b + a, b)} = {} và {}/${b}`], [[w, a]],
    M('T5.SO.03', 'TOAN.PHANSO', 'ps_hon_so', l, `${w * b + a} : ${b} = ${w} dư ${a}, nên ${fr(w * b + a, b)} = ${w} ${fr(a, b)}.`));
};
const mixedCmp: T5Template = (r, c, l) => {
  const w = r.int(1, 5), b = r.int(3, 9), a = r.int(1, b - 1);
  const top = w * b + a + r.int(-2, 2);
  const s = cmpSign(w * b + a, top);
  return Q.sc(`Chọn dấu thích hợp: ${w} ${fr(a, b)} ? ${fr(top, b)}`, ['>', '<', '='], s,
    M('T5.SO.03', 'TOAN.SOSANH', 'so_sanh_hon_so', l, `${w} ${fr(a, b)} = ${fr(w * b + a, b)}, so với ${fr(top, b)}: dấu ${s}.`));
};
const mixedWord: T5Template = (r, c, l) => {
  const w1 = r.int(1, 4), w2 = r.int(1, 4), b = r.pick([2, 4]), a1 = r.int(1, b - 1), a2 = r.int(1, b - 1);
  const top = (w1 * b + a1) + (w2 * b + a2);
  return Q.blanks(`Đoạn dây thứ nhất dài ${w1} ${fr(a1, b)} m, đoạn dây thứ hai dài ${w2} ${fr(a2, b)} m. Cả hai đoạn dài bao nhiêu mét? (viết dưới dạng phân số có mẫu số ${b})`, [`{}/${b} m`], [[top]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'hon_so_loi_van', l, `${fr(w1 * b + a1, b)} + ${fr(w2 * b + a2, b)} = ${fr(top, b)} (m).`));
};

const rectArea: T5Template = (r, c, l) => {
  const a = r.int(12, 60), b = r.int(5, a - 1);
  if (l <= 2) {
    const sq = r.chance(0.4), area = r.chance(0.5);
    const shape = sq ? `Hình vuông có cạnh ${b} cm.` : `Hình chữ nhật có chiều dài ${a} m, chiều rộng ${b} m.`;
    const v = sq ? (area ? b * b : b * 4) : area ? a * b : (a + b) * 2;
    const u = sq ? (area ? 'cm²' : 'cm') : area ? 'm²' : 'm';
    return Q.blanks(`${shape} Tính ${area ? 'diện tích' : 'chu vi'}.`, [`{} ${u}`], [[v]], M('T5.HH.01', 'TOAN.CHUVI', area ? 'dt_hcn_hv' : 'cv_hcn_hv', l, sq ? (area ? `${b} × ${b} = ${v} cm².` : `${b} × 4 = ${v} cm.`) : area ? `${a} × ${b} = ${f(v)} m².` : `(${a} + ${b}) × 2 = ${v} m.`));
  }
  return r.chance(0.5)
    ? Q.blanks(`Hình chữ nhật có chiều dài ${a} m, chiều rộng ${b} m. Tính chu vi và diện tích.`, ['Chu vi: {} m', 'Diện tích: {} m²'], [[(a + b) * 2, a * b]], M('T5.HH.01', 'TOAN.CHUVI', 'cv_dt_hcn', l, `Chu vi: (${a} + ${b}) × 2 = ${(a + b) * 2} m. Diện tích: ${a} × ${b} = ${f(a * b)} m².`))
    : Q.blanks(`Hình vuông có cạnh ${b} cm. Tính chu vi và diện tích.`, ['Chu vi: {} cm', 'Diện tích: {} cm²'], [[b * 4, b * b]], M('T5.HH.01', 'TOAN.CHUVI', 'cv_dt_hv', l, `Chu vi: ${b} × 4 = ${b * 4} cm. Diện tích: ${b} × ${b} = ${b * b} cm².`));
};
const lenConvert: T5Template = (r, c, l) => {
  const conv: [string, string, number][] = [['km', 'm', 1000], ['m', 'cm', 100], ['m', 'mm', 1000], ['tấn', 'kg', 1000], ['kg', 'g', 1000], ['tạ', 'kg', 100], ['dm', 'mm', 100]];
  const [big, small, k] = r.pick(conv);
  const n = r.int(2, 95);
  if (r.chance(0.5)) return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} ${big} = {} ${small}`], [[n * k]], M('T5.DL.01', 'TOAN.DOLUONG', 'doi_don_vi', l, `1 ${big} = ${f(k)} ${small}, nên ${n} ${big} = ${f(n * k)} ${small}.`));
  const x = r.int(1, k - 1);
  return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} ${big} ${x} ${small} = {} ${small}`], [[n * k + x]], M('T5.DL.01', 'TOAN.DOLUONG', 'doi_don_vi', l, `${n} ${big} = ${f(n * k)} ${small}; thêm ${x} ${small} được ${f(n * k + x)} ${small}.`));
};
const rectFromPerim: T5Template = (r, c, l) => {
  const a = r.int(12, 50), b = r.int(5, a - 2);
  return Q.blanks(`Một hình chữ nhật có chu vi ${(a + b) * 2} m, chiều dài ${a} m. Tính diện tích hình chữ nhật đó.`, ['{} m²'], [[a * b]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'hcn_tu_chu_vi', l, `Nửa chu vi: ${a + b} m; chiều rộng: ${a + b} ${MINUS} ${a} = ${b} m; diện tích: ${a} × ${b} = ${f(a * b)} m².`));
};
const gardenPath: T5Template = (r, c, l) => {
  const a = r.int(15, 40), b = r.int(10, a - 2), w = r.pick([1, 2]);
  const inner = (a - 2 * w) * (b - 2 * w);
  return Q.blanks(`Một mảnh vườn hình chữ nhật dài ${a} m, rộng ${b} m. Người ta làm lối đi rộng ${w} m sát bốn cạnh vườn, phần còn lại trồng rau. Tính diện tích trồng rau.`, ['{} m²'], [[inner]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'loi_di_vuon', l, `Phần trồng rau dài ${a} ${MINUS} ${2 * w} = ${a - 2 * w} m, rộng ${b} ${MINUS} ${2 * w} = ${b - 2 * w} m; diện tích ${a - 2 * w} × ${b - 2 * w} = ${inner} m².`));
};

// =========================================================================== CHỦ ĐỀ 2. SỐ THẬP PHÂN
const DEC_PLACE = ['phần mười', 'phần trăm', 'phần nghìn'];
const decWrite: T5Template = (r, c, l) => {
  const ip = r.int(0, 99), k = r.int(1, 3);
  const x = cl(ip + rd(r, 0, 0.99, k) % 1);
  if (decPlaces(x) !== k) return null;
  const fp = parts(x)[1];
  const desc = fp.split('').map((dg, i) => `${dg} ${DEC_PLACE[i]}`).join(', ');
  const wrong = [cl(ip + Number('0.0' + fp)), cl(Number(fp) + ip / 100), cl(ip * 10 + Number('0.' + fp))];
  const opts = decOpts(r, x, wrong);
  if (!opts) return null;
  return Q.sc(`Số thập phân gồm ${ip} đơn vị, ${desc} viết là:`, opts, d(x), M('T5.STP.01', 'TOAN.DOCVIET', 'viet_stp', l, `Phần nguyên ${ip}, phần thập phân ${fp}: ${d(x)}.`));
};
const decParts: T5Template = (r, c, l) => {
  const x = rd(r, 1, 999, r.int(1, 3));
  const [ip, fp] = parts(x);
  return Q.blanks(`Số thập phân ${d(x)} có phần nguyên là bao nhiêu, phần thập phân gồm những chữ số nào (viết liền)?`, ['Phần nguyên: {}', 'Phần thập phân: {}'], [[ip, fp]],
    M('T5.STP.01', 'TOAN.DOCVIET', 'phan_nguyen_tp', l, `Chữ số bên trái dấu phẩy là phần nguyên (${ip}), bên phải dấu phẩy là phần thập phân (${fp}).`));
};
const decDigitPlace: T5Template = (r, c, l) => {
  const x = rd(r, 10, 999, 3);
  const [ip, fp] = parts(x);
  const all = [...ip.split('').map((dg, i) => [dg, PLACE[ip.length - 1 - i]]), ...fp.split('').map((dg, i) => [dg, DEC_PLACE[i]])];
  const cand = all.filter(([dg]) => all.filter((y) => y[0] === dg).length === 1);
  if (!cand.length) return null;
  const [dg, place] = r.pick(cand);
  const opts = r.shuffle([...new Set([place, ...r.sample(['đơn vị', 'chục', 'trăm', ...DEC_PLACE].filter((p) => p !== place), 3)])]);
  return Q.sc(`Trong số ${d(x)}, chữ số ${dg} thuộc hàng nào?`, opts, place, M('T5.STP.01', 'TOAN.DOCVIET', 'hang_stp', l, `Sau dấu phẩy lần lượt là hàng phần mười, phần trăm, phần nghìn. Chữ số ${dg} ở hàng ${place}.`));
};
const fracToDec: T5Template = (r, c, l) => {
  const t = r.pick([10, 100, 1000]);
  const a = r.int(1, t * 3);
  if (a % 10 === 0) return null;
  return Q.blanks('Viết phân số thập phân thành số thập phân.', [`${fr(a, t)} = {}`], [[da(a / t)]],
    M('T5.STP.01', 'TOAN.DOCVIET', 'pstp_stp', l, `Mẫu số ${t} có ${String(t).length - 1} chữ số 0 nên phần thập phân có ${String(t).length - 1} chữ số: ${fr(a, t)} = ${d(a / t)}.`));
};
const decToFrac: T5Template = (r, c, l) => {
  const [x, ans] = r.pick([[0.5, '1/2'], [0.25, '1/4'], [0.75, '3/4'], [0.2, '1/5'], [0.4, '2/5'], [0.6, '3/5'], [0.8, '4/5'], [0.125, '1/8'], [0.05, '1/20'], [0.04, '1/25']] as [number, string][]);
  const wrongs = ['1/2', '1/4', '3/4', '1/5', '2/5', '3/5', '4/5', '1/8', '1/20', '1/25'].filter((w) => w !== ans);
  return Q.sc(`Số thập phân ${d(x)} bằng phân số tối giản nào?`, r.shuffle([ans, ...r.sample(wrongs, 3)]), ans,
    M('T5.STP.01', 'TOAN.PHANSO', 'stp_ps', l, `${d(x)} = ${fr(Math.round(x * 1000), 1000)} = ${ans}.`));
};
const decCompose: T5Template = (r, c, l) => {
  const t = r.int(1, 9), u = r.int(0, 9), p1 = r.int(0, 9), p2 = r.int(1, 9);
  const x = cl(t * 10 + u + p1 / 10 + p2 / 100);
  return Q.blanks(`Viết số thập phân gồm: ${t} chục, ${u} đơn vị, ${p1} phần mười, ${p2} phần trăm.`, ['{}'], [[da(x)]],
    M('T5.STP.01', 'TOAN.DOCVIET', 'cau_tao_stp', l, `${t}${u},${p1}${p2} = ${d(x)}.`));
};

const decCmp: T5Template = (r, c, l) => {
  const a = rd(r, 1, 99, r.int(1, 3));
  const k = r.int(0, 3);
  const b = k === 0 ? cl(a + 0.01) : k === 1 ? cl(a - 0.1) : k === 2 ? Number(d(a).replace(',', '.') + '0') : rd(r, 1, 99, 2);
  if (b <= 0) return null;
  const bs = k === 2 ? d(a) + '0' : d(b);
  const s = cmpSign(a, b);
  return Q.sc(`Chọn dấu thích hợp: ${d(a)} ? ${bs}`, ['>', '<', '='], s, M('T5.STP.02', 'TOAN.SOSANH', 'so_sanh_stp', l, `So sánh phần nguyên trước, rồi lần lượt hàng phần mười, phần trăm…: ${d(a)} ${s} ${bs}.${k === 2 ? ' Thêm chữ số 0 vào tận cùng phần thập phân, giá trị không đổi.' : ''}`));
};
const decMax: T5Template = (r, c, l) => {
  const ip = r.int(1, 30);
  const xs = [...new Set([cl(ip + rd(r, 0.1, 0.9, 1)), cl(ip + rd(r, 0.01, 0.99, 2)), cl(ip + rd(r, 0.001, 0.999, 3)), cl(ip + rd(r, 0.1, 0.9, 1))])];
  if (xs.length < 3) return null;
  const big = r.chance(0.5);
  const ans = big ? Math.max(...xs) : Math.min(...xs);
  return Q.sc(`Số ${big ? 'lớn' : 'bé'} nhất trong các số sau là:`, r.shuffle(xs.map(d)), d(ans), M('T5.STP.02', 'TOAN.SOSANH', 'max_min_stp', l, `Cùng phần nguyên ${ip}, so sánh hàng phần mười, phần trăm…: số ${big ? 'lớn' : 'bé'} nhất là ${d(ans)}.`));
};
const decOrder: T5Template = (r, c, l) => {
  const ip = r.int(1, 20);
  const xs = [...new Set([ip + 0.5, cl(ip + rd(r, 0.01, 0.49, 2)), cl(ip + rd(r, 0.51, 0.99, 2)), cl(ip + 1 + rd(r, 0.1, 0.9, 1)), cl(ip - 1 + rd(r, 0.1, 0.9, 1))].map(cl))];
  if (xs.length < 4) return null;
  const sorted = r.sample(xs, 4).sort((a, b) => a - b).map(d);
  return Q.ord('Sắp xếp các số theo thứ tự từ bé đến lớn.', sorted, M('T5.STP.02', 'TOAN.SAPXEP', 'xep_stp', l, sorted.join(' < ') + '.'));
};
const decEqualMc: T5Template = (r, c, l) => {
  const x = rd(r, 1, 50, r.int(1, 2));
  const eq = [d(x) + '0', d(x) + '00'];
  const neq = [d(cl(x / 10)), d(x).replace(',', ',0')];
  if (neq.includes(d(x))) return null;
  const rights = [d(x), ...eq].slice(1);
  const opts = r.shuffle([...new Set([...rights, ...neq])]);
  if (opts.length < 4) return null;
  return Q.mc(`Chọn tất cả các số bằng ${d(x)}.`, opts, rights, M('T5.STP.02', 'TOAN.SOSANH', 'stp_bang_nhau', l, 'Thêm (hoặc bỏ) chữ số 0 ở tận cùng bên phải phần thập phân thì được số thập phân bằng nó.', `${d(x)} = ${rights.join(' = ')}.`));
};
const decBetween: T5Template = (r, c, l) => {
  const a = rd(r, 2, 80, 1);
  const k = r.int(0, 1);
  if (k === 0) return Q.blanks(`Tìm số tự nhiên x lớn nhất sao cho x < ${d(a)}.`, ['x = {}'], [[Math.floor(a)]], M('T5.TD.01', 'TOAN.SOSANH', 'stn_lon_nhat', l, `${Math.floor(a)} < ${d(a)} < ${Math.floor(a) + 1}, nên x = ${Math.floor(a)}.`));
  const b = cl(a + rd(r, 2, 4, 0) + 0.0);
  const lo = Math.floor(a) + 1, hi = Math.ceil(b) - 1;
  return Q.blanks(`Có bao nhiêu số tự nhiên x thoả mãn ${d(a)} < x < ${d(b)}?`, ['{} số'], [[hi - lo + 1]],
    M('T5.TD.01', 'TOAN.SOSANH', 'dem_stn_giua', l, `Các số tự nhiên đó là ${Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).join(', ')}: có ${hi - lo + 1} số.`));
};

const decMeasureLen: T5Template = (r, c, l) => {
  const kinds: [string, string, number][] = [['m', 'cm', 100], ['m', 'dm', 10], ['km', 'm', 1000], ['kg', 'g', 1000], ['tấn', 'kg', 1000], ['tạ', 'kg', 100]];
  const [big, small, k] = r.pick(kinds);
  const n = r.int(1, 20), x = r.int(1, k - 1);
  if (x % 10 === 0 && k > 10) return null;
  return Q.blanks('Viết số thập phân thích hợp vào chỗ trống.', [`${n} ${big} ${x} ${small} = {} ${big}`], [[da(n + x / k)]],
    M('T5.STP.03', 'TOAN.DOLUONG', 'so_do_stp', l, `${x} ${small} = ${fr(x, k)} ${big} = ${d(x / k)} ${big}, nên ${n} ${big} ${x} ${small} = ${d(n + x / k)} ${big}.`));
};
const decMeasureSmall: T5Template = (r, c, l) => {
  const kinds: [string, string, number][] = [['kg', 'g', 1000], ['m', 'cm', 100], ['km', 'm', 1000], ['tấn', 'kg', 1000]];
  const [big, small, k] = r.pick(kinds);
  const n = r.int(k / 10 + 1, k * 9);
  if (n % k === 0 || n % 10 === 0) return null;
  return Q.blanks('Viết số thập phân thích hợp vào chỗ trống.', [`${f(n)} ${small} = {} ${big}`], [[da(n / k)]],
    M('T5.STP.03', 'TOAN.DOLUONG', 'so_do_stp_nho', l, `1 ${small} = ${fr(1, k)} ${big}, nên ${f(n)} ${small} = ${d(n / k)} ${big}.`));
};
const decMeasureRev: T5Template = (r, c, l) => {
  const kinds: [string, string, number][] = [['m', 'cm', 100], ['kg', 'g', 1000], ['km', 'm', 1000], ['tấn', 'kg', 1000]];
  const [big, small, k] = r.pick(kinds);
  const x = rd(r, 0.1, 9.9, r.int(1, 2));
  return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${d(x)} ${big} = {} ${small}`], [[Math.round(x * k)]],
    M('T5.STP.03', 'TOAN.DOLUONG', 'stp_ra_don_vi_nho', l, `${d(x)} × ${f(k)} = ${f(Math.round(x * k))}, nên ${d(x)} ${big} = ${f(Math.round(x * k))} ${small}.`));
};
const decMeasureCmp: T5Template = (r, c, l) => {
  const a = rd(r, 1, 9, 2);
  const k = r.int(0, 2);
  const g = Math.round(a * 1000) + (k === 0 ? 0 : k === 1 ? 50 : -50);
  const s = cmpSign(a * 1000, g);
  return Q.sc(`Chọn dấu thích hợp: ${d(a)} kg ? ${f(g)} g`, ['>', '<', '='], s, M('T5.STP.03', 'TOAN.SOSANH', 'so_sanh_so_do', l, `${d(a)} kg = ${f(Math.round(a * 1000))} g, nên ${d(a)} kg ${s} ${f(g)} g.`));
};

const ROUND_TO = ['số tự nhiên gần nhất', 'hàng phần mười', 'hàng phần trăm'];
const decRoundT: T5Template = (r, c, l) => {
  const p = l <= 1 ? 0 : l === 2 ? 1 : 2;
  const x = rd(r, 1, 99, p + 1 + r.int(0, 1));
  const u = 10 ** p;
  const ans = Math.round(x * u + 1e-9) / u;
  return Q.blanks(`Làm tròn số ${d(x)} đến ${ROUND_TO[p]}.`, ['{}'], [[da(ans)]],
    M('T5.STP.02', 'TOAN.DOCVIET', 'lam_tron_stp', l, `Xét chữ số ngay sau hàng cần làm tròn: bé hơn 5 thì làm tròn xuống, từ 5 trở lên thì làm tròn lên. ${d(x)} ≈ ${d(ans)}.`));
};
const decRoundMc: T5Template = (r, c, l) => {
  const n = r.int(3, 40);
  const rights = [cl(n + rd(r, 0, 0.49, 1) - 0) , cl(n - rd(r, 0.01, 0.49, 2))].filter((x) => Math.round(x) === n);
  const wrongs = [cl(n + 0.5 + rd(r, 0.01, 0.4, 2)), cl(n - 0.5 - rd(r, 0.01, 0.4, 2))];
  if (rights.length < 2 || new Set([...rights, ...wrongs].map(d)).size < 4) return null;
  return Q.mc(`Chọn tất cả các số khi làm tròn đến số tự nhiên gần nhất thì được ${n}.`, r.shuffle([...rights, ...wrongs].map(d)), rights.map(d),
    M('T5.STP.02', 'TOAN.DOCVIET', 'lam_tron_chon', l, 'Xét chữ số hàng phần mười.', `${rights.map(d).join(' và ')} làm tròn được ${n}.`));
};
const decRoundWord: T5Template = (r, c, l) => {
  const kg = rd(r, 1, 5, 1), price = r.pick([23500, 31500, 18500, 42500]);
  const cost = Math.round(kg * price);
  const k = Math.round(cost / 1000) * 1000;
  return Q.blanks(`Mẹ mua ${d(kg)} kg thịt, giá ${f(price)} đồng một ki-lô-gam. Số tiền phải trả làm tròn đến hàng nghìn là bao nhiêu đồng?`, ['{} đồng'], [[k]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'lam_tron_tien', l, `${f(price)} × ${d(kg)} = ${f(cost)} (đồng) ≈ ${f(k)} đồng.`));
};

// =========================================================================== CHỦ ĐỀ 3. ĐƠN VỊ ĐO DIỆN TÍCH
const haConv: T5Template = (r, c, l) => {
  const k = r.int(0, 3);
  const n = r.int(2, 60);
  if (k === 0) return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} ha = {} m²`], [[n * 10000]], M('T5.DL.01', 'TOAN.DOLUONG', 'ha_m2', l, `1 ha = 10 000 m², nên ${n} ha = ${f(n * 10000)} m².`));
  if (k === 1) return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} km² = {} ha`], [[n * 100]], M('T5.DL.01', 'TOAN.DOLUONG', 'km2_ha', l, `1 km² = 100 ha, nên ${n} km² = ${n * 100} ha.`));
  if (k === 2) return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} km² = {} m²`], [[n * 1000000]], M('T5.DL.01', 'TOAN.DOLUONG', 'km2_m2', l, `1 km² = 1 000 000 m², nên ${n} km² = ${f(n * 1000000)} m².`));
  return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${f(n * 10000)} m² = {} ha`], [[n]], M('T5.DL.01', 'TOAN.DOLUONG', 'm2_ha', l, `10 000 m² = 1 ha, nên ${f(n * 10000)} m² = ${n} ha.`));
};
const haDecimal: T5Template = (r, c, l) => {
  if (!c.decimal) return null;
  const x = rd(r, 0.5, 9.9, r.int(1, 2));
  return r.chance(0.5)
    ? Q.blanks('Viết số thích hợp vào chỗ trống.', [`${d(x)} ha = {} m²`], [[Math.round(x * 10000)]], M('T5.DL.01', 'TOAN.DOLUONG', 'ha_m2_stp', l, `${d(x)} × 10 000 = ${f(Math.round(x * 10000))}.`))
    : Q.blanks('Viết số thập phân thích hợp vào chỗ trống.', [`${f(Math.round(x * 100))} ha = {} km²`], [[da(x)]], M('T5.DL.01', 'TOAN.DOLUONG', 'ha_km2_stp', l, `100 ha = 1 km², nên ${f(Math.round(x * 100))} ha = ${d(x)} km².`));
};
const areaCmp: T5Template = (r, c, l) => {
  const n = r.int(2, 9);
  const m2 = n * 10000 + r.pick([-2000, 0, 3000]);
  const s = cmpSign(n * 10000, m2);
  return Q.sc(`Chọn dấu thích hợp: ${n} ha ? ${f(m2)} m²`, ['>', '<', '='], s, M('T5.DL.01', 'TOAN.SOSANH', 'so_sanh_dt', l, `${n} ha = ${f(n * 10000)} m², nên ${n} ha ${s} ${f(m2)} m².`));
};
const fieldHa: T5Template = (r, c, l) => {
  const a = r.int(2, 9) * 100, b = r.int(1, 5) * 100;
  return Q.blanks(`Một cánh đồng hình chữ nhật dài ${a} m, rộng ${b} m. Diện tích cánh đồng bằng bao nhiêu héc-ta?`, ['{} ha'], [[a * b / 10000]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'dt_hecta', l, `${a} × ${b} = ${f(a * b)} m² = ${a * b / 10000} ha.`));
};
const AREA_U = ['mm²', 'cm²', 'dm²', 'm²', 'dam²', 'hm²', 'km²'];
const areaAdj: T5Template = (r, c, l) => {
  const i = r.int(0, 5);
  const n = r.int(2, 90);
  const up = r.chance(0.5);
  return up
    ? Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} ${AREA_U[i + 1]} = {} ${AREA_U[i]}`], [[n * 100]], M('T5.DL.01', 'TOAN.DOLUONG', 'doi_dt', l, `Hai đơn vị đo diện tích liền nhau gấp nhau 100 lần: ${n} ${AREA_U[i + 1]} = ${f(n * 100)} ${AREA_U[i]}.`))
    : Q.blanks('Viết số thích hợp vào chỗ trống.', [`${f(n * 100)} ${AREA_U[i]} = {} ${AREA_U[i + 1]}`], [[n]], M('T5.DL.01', 'TOAN.DOLUONG', 'doi_dt', l, `100 ${AREA_U[i]} = 1 ${AREA_U[i + 1]}, nên ${f(n * 100)} ${AREA_U[i]} = ${n} ${AREA_U[i + 1]}.`));
};
const areaMixed: T5Template = (r, c, l) => {
  const i = r.int(0, 3);
  const n = r.int(1, 20), x = r.int(1, 99);
  return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} ${AREA_U[i + 1]} ${x} ${AREA_U[i]} = {} ${AREA_U[i]}`], [[n * 100 + x]],
    M('T5.DL.01', 'TOAN.DOLUONG', 'doi_dt_ghep', l, `${n} ${AREA_U[i + 1]} = ${n * 100} ${AREA_U[i]}; ${n * 100} + ${x} = ${n * 100 + x}.`));
};
const areaDecimal: T5Template = (r, c, l) => {
  if (!c.decimal) return null;
  const i = r.int(0, 3);
  const x = rd(r, 0.5, 30, r.int(1, 2));
  return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${d(x)} ${AREA_U[i + 1]} = {} ${AREA_U[i]}`], [[Math.round(x * 100)]],
    M('T5.DL.01', 'TOAN.DOLUONG', 'doi_dt_stp', l, `${d(x)} × 100 = ${Math.round(x * 100)}, nên ${d(x)} ${AREA_U[i + 1]} = ${Math.round(x * 100)} ${AREA_U[i]}.`));
};
const areaOrder: T5Template = (r, c, l) => {
  const m = r.int(2, 9), dm = r.int(110, 990), cm = r.int(2, 9) * 10000 + r.int(0, 9) * 1000, m2 = r.int(1, 9), dm2 = r.int(10, 90);
  const vs: [string, number][] = [[`${m} m²`, m * 100], [`${dm} dm²`, dm], [`${f(cm)} cm²`, cm / 100], [`${m2} m² ${dm2} dm²`, m2 * 100 + dm2]];
  if (new Set(vs.map((v) => v[1])).size < 4) return null;
  const sorted = vs.sort((a, b) => a[1] - b[1]).map((v) => v[0]);
  return Q.ord('Sắp xếp các số đo diện tích theo thứ tự từ bé đến lớn.', sorted, M('T5.DL.01', 'TOAN.SAPXEP', 'xep_dt', l, `Đổi cùng đơn vị dm² rồi so sánh: ${sorted.join(' < ')}.`));
};

// =========================================================================== CHỦ ĐỀ 4. PHÉP TÍNH VỚI SỐ THẬP PHÂN
const decAddCalc: T5Template = (r, c, l) => {
  const a = rd(r, 1, 500, r.int(1, 2)), b = rd(r, 1, 500, r.int(1, 3));
  return Q.blanks('Tính.', [`${d(a)} + ${d(b)} = {}`], [[da(a + b)]], M('T5.STP.04', 'TOAN.TINH', 'cong_stp', l, 'Đặt tính sao cho các dấu phẩy thẳng cột, cộng như số tự nhiên rồi đặt dấu phẩy thẳng cột.', `${d(a)} + ${d(b)} = ${d(a + b)}.`));
};
const decAdd3: T5Template = (r, c, l) => {
  const a = rd(r, 1, 50, 1), x = rd(r, 1, 50, 2);
  const bb = cl(Math.ceil(a) + r.int(0, 5) - a);
  if (bb <= 0 || decPlaces(bb) === 0) return null;
  const s = cl(a + bb + x);
  return Q.blanks('Tính bằng cách thuận tiện.', [`${d(a)} + ${d(x)} + ${d(bb)} = {}`], [[da(s)]],
    M('T5.STP.04', 'TOAN.BIEUTHUC', 'cong_thuan_tien', l, `Nhóm ${d(a)} + ${d(bb)} = ${d(a + bb)} (số tự nhiên), rồi cộng ${d(x)}: ${d(s)}.`));
};
const decAddWord: T5Template = (r, c, l) => {
  const a = rd(r, 10, 80, 1), b = rd(r, 1, 20, 1), n = kid(r);
  return Q.blanks(`Bạn ${n} cân nặng ${d(a)} kg. Bạn ${kid(r, n)} nặng hơn bạn ${n} ${d(b)} kg. Hỏi cả hai bạn cân nặng bao nhiêu ki-lô-gam?`, ['{} kg'], [[da(a + a + b)]],
    M('T5.STP.04', 'TOAN.LOIVAN', 'cong_stp_loi_van', l, `Bạn thứ hai: ${d(a)} + ${d(b)} = ${d(a + b)} kg; cả hai: ${d(a)} + ${d(a + b)} = ${d(a + a + b)} kg.`));
};
const decPerimTri: T5Template = (r, c, l) => {
  const a = rd(r, 3, 20, 1), b = rd(r, 3, 20, 2), cc = rd(r, 3, 20, 1);
  return Q.blanks(`Hình tam giác có độ dài ba cạnh là ${d(a)} cm, ${d(b)} cm và ${d(cc)} cm. Tính chu vi hình tam giác.`, ['{} cm'], [[da(a + b + cc)]],
    M('T5.STP.04', 'TOAN.CHUVI', 'chu_vi_tg', l, `${d(a)} + ${d(b)} + ${d(cc)} = ${d(a + b + cc)} (cm).`));
};
const decSubCalc: T5Template = (r, c, l) => {
  const b = rd(r, 1, 300, r.int(1, 3)), a = cl(b + rd(r, 1, 300, r.int(1, 2)));
  return Q.blanks('Tính.', [`${d(a)} ${MINUS} ${d(b)} = {}`], [[da(a - b)]], M('T5.STP.04', 'TOAN.TINH', 'tru_stp', l, 'Đặt tính sao cho các dấu phẩy thẳng cột; phần thập phân thiếu chữ số thì coi là chữ số 0.', `${d(a)} ${MINUS} ${d(b)} = ${d(a - b)}.`));
};
const decSub2: T5Template = (r, c, l) => {
  const a = rd(r, 50, 99, 1), b = rd(r, 5, 20, 2), x = rd(r, 5, 20, 1);
  return Q.blanks('Tính bằng hai cách (đáp số giống nhau).', [`${d(a)} ${MINUS} ${d(b)} ${MINUS} ${d(x)} = {}`], [[da(a - b - x)]],
    M('T5.STP.04', 'TOAN.BIEUTHUC', 'tru_lien_tiep', l, `${d(a)} ${MINUS} (${d(b)} + ${d(x)}) = ${d(a)} ${MINUS} ${d(b + x)} = ${d(a - b - x)}.`));
};
const decSubWord: T5Template = (r, c, l) => {
  const total = rd(r, 20, 60, 1), used1 = rd(r, 3, 10, 2), used2 = rd(r, 3, 10, 1);
  return Q.blanks(`Một thùng có ${d(total)} l dầu. Lần đầu lấy ra ${d(used1)} l, lần sau lấy ra ${d(used2)} l. Hỏi trong thùng còn bao nhiêu lít dầu?`, ['{} l'], [[da(total - used1 - used2)]],
    M('T5.STP.04', 'TOAN.LOIVAN', 'tru_stp_loi_van', l, `Hai lần lấy: ${d(used1)} + ${d(used2)} = ${d(used1 + used2)} l; còn ${d(total)} ${MINUS} ${d(used1 + used2)} = ${d(total - used1 - used2)} l.`));
};
const decFindX: T5Template = (r, c, l) => {
  const a = rd(r, 2, 40, 1), b = rd(r, 2, 40, 2);
  const k = r.int(0, 2);
  if (k === 0) return Q.blanks('Tìm x.', [`x ${MINUS} ${d(a)} = ${d(b)}`, 'x = {}'], [[da(a + b)]], M('T5.STP.04', 'TOAN.TIMX', 'tim_x_stp', l, `x = ${d(b)} + ${d(a)} = ${d(a + b)}.`));
  if (k === 1) return Q.blanks('Tìm x.', [`${d(cl(a + b))} ${MINUS} x = ${d(a)}`, 'x = {}'], [[da(b)]], M('T5.STP.04', 'TOAN.TIMX', 'tim_x_stp', l, `x = ${d(a + b)} ${MINUS} ${d(a)} = ${d(b)}.`));
  const m = rd(r, 1, 9, 1), x = rd(r, 1, 30, 1);
  return Q.blanks('Tìm x.', [`x × ${d(m)} = ${d(cl(m * x))}`, 'x = {}'], [[da(x)]], M('T5.STP.04', 'TOAN.TIMX', 'tim_x_stp', l, `x = ${d(m * x)} : ${d(m)} = ${d(x)}.`));
};
const decMulNat: T5Template = (r, c, l) => {
  const a = rd(r, 0.1, 99, r.int(1, 3)), n = r.int(2, 45);
  return Q.blanks('Tính.', [`${d(a)} × ${n} = {}`], [[da(a * n)]], M('T5.STP.04', 'TOAN.TINH', 'nhan_stp_stn', l, 'Nhân như số tự nhiên, rồi đếm số chữ số phần thập phân để đặt dấu phẩy.', `${d(a)} × ${n} = ${d(a * n)}.`));
};
const decMulDec: T5Template = (r, c, l) => {
  const a = rd(r, 0.1, 40, r.int(1, 2)), b = rd(r, 0.1, 9, 1);
  return Q.blanks('Tính.', [`${d(a)} × ${d(b)} = {}`], [[da(a * b)]], M('T5.STP.04', 'TOAN.TINH', 'nhan_stp_stp', l, `Nhân như số tự nhiên; tổng số chữ số phần thập phân của hai thừa số là ${decPlaces(a) + decPlaces(b)}.`, `${d(a)} × ${d(b)} = ${d(a * b)}.`));
};
const decMulWord: T5Template = (r, c, l) => {
  const kg = rd(r, 1, 6, 1), price = r.int(12, 95) * 1000;
  return Q.blanks(`Một ki-lô-gam táo giá ${f(price)} đồng. Mua ${d(kg)} kg táo hết bao nhiêu tiền?`, ['{} đồng'], [[Math.round(kg * price)]],
    M('T5.STP.04', 'TOAN.LOIVAN', 'nhan_stp_loi_van', l, `${f(price)} × ${d(kg)} = ${f(Math.round(kg * price))} (đồng).`));
};
const decMulSmart: T5Template = (r, c, l) => {
  const x = rd(r, 1, 50, 2);
  const [p, q] = r.pick([[2.5, 4], [0.25, 4], [0.5, 2], [1.25, 8], [0.2, 5]] as [number, number][]);
  return Q.blanks('Tính bằng cách thuận tiện.', [`${d(p)} × ${d(x)} × ${q} = {}`], [[da(p * q * x)]],
    M('T5.STP.04', 'TOAN.BIEUTHUC', 'nhan_thuan_tien', l, `${d(p)} × ${q} = ${d(p * q)}, nên ${d(p)} × ${d(x)} × ${q} = ${d(x)} × ${d(p * q)} = ${d(p * q * x)}.`));
};
const decRectArea: T5Template = (r, c, l) => {
  const a = rd(r, 5, 25, 1), b = rd(r, 2, 9, 1);
  const half = r.chance(0.5);
  return half
    ? Q.blanks(`Một mảnh vườn hình chữ nhật dài ${d(a)} m, chiều rộng bằng một nửa chiều dài. Tính diện tích mảnh vườn.`, ['{} m²'], [[da(a * a / 2)]], M('T5.TD.01', 'TOAN.LOIVAN', 'dt_hcn_stp', l, `Chiều rộng: ${d(a)} : 2 = ${d(a / 2)} m; diện tích: ${d(a)} × ${d(a / 2)} = ${d(a * a / 2)} m².`))
    : Q.blanks(`Hình chữ nhật dài ${d(a)} m, rộng ${d(b)} m. Tính diện tích.`, ['{} m²'], [[da(a * b)]], M('T5.STP.04', 'TOAN.LOIVAN', 'dt_hcn_stp', l, `${d(a)} × ${d(b)} = ${d(a * b)} (m²).`));
};
const decDivNat: T5Template = (r, c, l) => {
  const n = r.int(2, 25), q = rd(r, 0.1, 40, r.int(1, 2));
  return Q.blanks('Tính.', [`${d(cl(q * n))} : ${n} = {}`], [[da(q)]], M('T5.STP.04', 'TOAN.TINH', 'chia_stp_stn', l, 'Chia phần nguyên trước, viết dấu phẩy vào thương rồi chia tiếp phần thập phân.', `${d(q * n)} : ${n} = ${d(q)}.`));
};
const natDivDec: T5Template = (r, c, l) => {
  const [b, q] = r.pick([[4, 0.25], [8, 0.125], [5, 0.2], [2, 0.5], [25, 0.04], [20, 0.05]] as [number, number][]);
  const a = r.int(1, 60);
  if (a % b === 0) return null;
  return Q.blanks('Tính (thương là số thập phân).', [`${a} : ${b} = {}`], [[da(a * q)]], M('T5.STP.04', 'TOAN.TINH', 'chia_stn_ra_stp', l, 'Chia còn dư thì viết dấu phẩy vào thương, thêm chữ số 0 vào bên phải số dư rồi chia tiếp.', `${a} : ${b} = ${d(a * q)}.`));
};
const decDivDec: T5Template = (r, c, l) => {
  const b = rd(r, 0.2, 9, 1), q = r.chance(0.5) ? r.int(2, 60) : rd(r, 1, 30, 1);
  return Q.blanks('Tính.', [`${d(cl(b * q))} : ${d(b)} = {}`], [[da(q)]], M('T5.STP.04', 'TOAN.TINH', 'chia_stp_stp', l, `Dời dấu phẩy của số bị chia và số chia cùng sang phải ${decPlaces(b)} chữ số rồi chia.`, `${d(b * q)} : ${d(b)} = ${d(q)}.`));
};
const decDivWord: T5Template = (r, c, l) => {
  const per = rd(r, 0.2, 2, 1), n = r.int(5, 30);
  const total = cl(per * n);
  return r.chance(0.5)
    ? Q.blanks(`Có ${d(total)} l nước mắm được rót đều vào ${n} chai. Hỏi mỗi chai có bao nhiêu lít nước mắm?`, ['{} l'], [[da(per)]], M('T5.STP.04', 'TOAN.LOIVAN', 'chia_stp_loi_van', l, `${d(total)} : ${n} = ${d(per)} (l).`))
    : Q.blanks(`Có ${d(total)} l nước mắm, rót vào các chai, mỗi chai ${d(per)} l. Cần bao nhiêu chai?`, ['{} chai'], [[n]], M('T5.STP.04', 'TOAN.LOIVAN', 'chia_stp_loi_van', l, `${d(total)} : ${d(per)} = ${n} (chai).`));
};
const decAverage: T5Template = (r, c, l) => {
  const xs = [rd(r, 30, 40, 1), rd(r, 30, 40, 1), rd(r, 30, 40, 1)];
  const s = cl(xs[0] + xs[1] + xs[2]);
  const avg = cl(s / 3);
  if (decPlaces(avg) > 2) return null;
  return Q.blanks(`Ba bạn cân nặng lần lượt ${xs.map(d).join(' kg, ')} kg. Trung bình mỗi bạn cân nặng bao nhiêu ki-lô-gam?`, ['{} kg'], [[da(avg)]],
    M('T5.TD.01', 'TOAN.LOIVAN', 'tbc_stp', l, `Tổng: ${d(s)} kg; trung bình: ${d(s)} : 3 = ${d(avg)} kg.`));
};
const pow10Mul: T5Template = (r, c, l) => {
  const x = rd(r, 0.01, 99, r.int(1, 3)), p = r.pick([10, 100, 1000]);
  return Q.blanks('Tính nhẩm.', [`${d(x)} × ${f(p)} = {}`], [[da(x * p)]], M('T5.STP.04', 'TOAN.TINH', 'nhan_10_100', l, `Nhân với ${f(p)}: dời dấu phẩy sang phải ${String(p).length - 1} chữ số. ${d(x)} × ${f(p)} = ${d(x * p)}.`));
};
const pow10Div: T5Template = (r, c, l) => {
  const x = rd(r, 1, 999, r.int(1, 2)), p = r.pick([10, 100, 1000]);
  return Q.blanks('Tính nhẩm.', [`${d(x)} : ${f(p)} = {}`], [[da(x / p)]], M('T5.STP.04', 'TOAN.TINH', 'chia_10_100', l, `Chia cho ${f(p)}: dời dấu phẩy sang trái ${String(p).length - 1} chữ số. ${d(x)} : ${f(p)} = ${d(x / p)}.`));
};
const pow01: T5Template = (r, c, l) => {
  const x = rd(r, 1, 999, r.int(0, 2) || 1), p = r.pick([0.1, 0.01, 0.001]);
  const n = String(Math.round(1 / p)).length - 1;
  return r.chance(0.5)
    ? Q.blanks('Tính nhẩm.', [`${d(x)} × ${d(p)} = {}`], [[da(x * p)]], M('T5.STP.04', 'TOAN.TINH', 'nhan_01', l, `Nhân với ${d(p)}: dời dấu phẩy sang trái ${n} chữ số. ${d(x)} × ${d(p)} = ${d(x * p)}.`))
    : Q.blanks('Tính nhẩm.', [`${d(x)} : ${d(p)} = {}`], [[da(x / p)]], M('T5.STP.04', 'TOAN.TINH', 'chia_01', l, `Chia cho ${d(p)} cũng như nhân với ${f(Math.round(1 / p))}: dời dấu phẩy sang phải ${n} chữ số. ${d(x)} : ${d(p)} = ${d(x / p)}.`));
};
const pow10Equal: T5Template = (r, c, l) => {
  const x = rd(r, 1, 99, 2);
  const right = `${d(x)} × 0,1`;
  const target = cl(x / 10);
  const opts = r.shuffle([right, `${d(x)} × 10`, `${d(x)} : 0,1`, `${d(x)} : 100`]);
  return Q.sc(`Phép tính nào có kết quả bằng ${d(x)} : 10?`, opts, right, M('T5.STP.04', 'TOAN.TINH', 'nhan_01_bang', l, `Nhân với 0,1 cũng như chia cho 10: ${d(x)} : 10 = ${d(x)} × 0,1 = ${d(target)}.`));
};

// =========================================================================== CHỦ ĐỀ 5. HÌNH PHẲNG
const triArea: T5Template = (r, c, l) => {
  const dec = c.decimal && r.chance(0.5);
  const a = dec ? rd(r, 3, 20, 1) : r.int(4, 40), h = r.int(2, 20);
  return Q.blanks(`Tính diện tích hình tam giác có độ dài đáy ${d(a)} cm và chiều cao ${h} cm.`, ['{} cm²'], [[da(a * h / 2)]],
    M('T5.HH.01', 'TOAN.HINH', 'dt_tam_giac', l, `S = đáy × chiều cao : 2 = ${d(a)} × ${h} : 2 = ${d(a * h / 2)} (cm²).`));
};
const triRight: T5Template = (r, c, l) => {
  const a = r.int(3, 30), b = r.int(3, 30);
  return Q.blanks(`Hình tam giác vuông có hai cạnh góc vuông dài ${a} cm và ${b} cm. Tính diện tích.`, ['{} cm²'], [[da(a * b / 2)]],
    M('T5.HH.01', 'TOAN.HINH', 'dt_tg_vuong', l, `Hai cạnh góc vuông là đáy và chiều cao: ${a} × ${b} : 2 = ${d(a * b / 2)} (cm²).`));
};
const triHeight: T5Template = (r, c, l) => {
  const a = r.int(4, 30), h = r.int(3, 25);
  return Q.blanks(`Hình tam giác có diện tích ${d(a * h / 2)} cm², độ dài đáy ${a} cm. Tính chiều cao.`, ['{} cm'], [[h]],
    M('T5.HH.01', 'TOAN.HINH', 'tim_chieu_cao_tg', l, `Chiều cao = diện tích × 2 : đáy = ${d(a * h / 2)} × 2 : ${a} = ${h} (cm).`));
};
const triInRect: T5Template = (r, c, l) => {
  const a = r.int(6, 30), b = r.int(4, 20);
  return Q.blanks(`Hình chữ nhật ABCD dài ${a} cm, rộng ${b} cm. Nối A với C. Tính diện tích hình tam giác ABC.`, ['{} cm²'], [[da(a * b / 2)]],
    M('T5.HH.01', 'TOAN.HINH', 'tg_trong_hcn', l, `Đường chéo AC chia hình chữ nhật thành hai tam giác bằng nhau: ${a} × ${b} : 2 = ${d(a * b / 2)} (cm²).`));
};
const triKind: T5Template = (r, c, l) => {
  const big = r.pick([40, 60, 90, 100, 120, 70]), small = r.int(20, Math.min(70, 170 - big));
  const third = 180 - big - small;
  if (third <= 0) return null;
  const mx = Math.max(big, small, third);
  const kind = mx < 90 ? 'tam giác nhọn' : mx === 90 ? 'tam giác vuông' : 'tam giác tù';
  return Q.sc(`Một hình tam giác có hai góc là ${big}° và ${small}°. Đó là hình tam giác gì?`, ['tam giác nhọn', 'tam giác vuông', 'tam giác tù'], kind,
    M('T5.TD.02', 'TOAN.HINH', 'loai_tam_giac', l, `Tổng ba góc là 180°, góc thứ ba: 180° ${MINUS} ${big}° ${MINUS} ${small}° = ${third}°. Góc lớn nhất ${mx}°: ${kind}.`));
};
const trapArea: T5Template = (r, c, l) => {
  const dec = c.decimal && l >= 2 && r.chance(0.6);
  const a = dec ? rd(r, 5, 20, 1) : r.int(6, 30), b = r.int(3, 20), h = r.int(2, 15);
  return Q.blanks(`Tính diện tích hình thang có độ dài hai đáy là ${d(a)} m và ${b} m, chiều cao ${h} m.`, ['{} m²'], [[da((a + b) * h / 2)]],
    M('T5.HH.01', 'TOAN.HINH', 'dt_hinh_thang', l, `S = (a + b) × h : 2 = (${d(a)} + ${b}) × ${h} : 2 = ${d((a + b) * h / 2)} (m²).`));
};
const trapHeight: T5Template = (r, c, l) => {
  const a = r.int(8, 30), b = r.int(4, 20), h = r.int(3, 15);
  return Q.blanks(`Hình thang có diện tích ${d((a + b) * h / 2)} cm², hai đáy dài ${a} cm và ${b} cm. Tính chiều cao.`, ['{} cm'], [[h]],
    M('T5.HH.01', 'TOAN.HINH', 'tim_chieu_cao_ht', l, `h = S × 2 : (a + b) = ${d((a + b) * h / 2)} × 2 : ${a + b} = ${h} (cm).`));
};
const trapWord: T5Template = (r, c, l) => {
  const a = r.int(6, 15) * 10, b = r.int(3, 9) * 10, h = r.int(4, 10) * 10, per = r.pick([5, 6, 8]);
  const S = (a + b) * h / 2;
  return Q.blanks(`Một thửa ruộng hình thang có hai đáy ${a} m và ${b} m, chiều cao ${h} m. Cứ 10 m² thu được ${per} kg thóc. Thửa ruộng thu được bao nhiêu ki-lô-gam thóc?`, ['{} kg'], [[S / 10 * per]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'ruong_hinh_thang', l, `Diện tích: (${a} + ${b}) × ${h} : 2 = ${f(S)} m²; số thóc: ${f(S)} : 10 × ${per} = ${f(S / 10 * per)} kg.`));
};
const trapSides: T5Template = (r, c, l) => {
  const sum = r.int(10, 40) * 2, diff = r.int(1, 8) * 2, h = r.int(4, 12);
  const a = (sum + diff) / 2, b = (sum - diff) / 2;
  if (b <= 0) return null;
  return Q.blanks(`Hình thang có diện tích ${f(sum * h / 2)} cm², chiều cao ${h} cm, đáy lớn hơn đáy bé ${diff} cm. Tính độ dài mỗi đáy.`, ['Đáy lớn: {} cm', 'Đáy bé: {} cm'], [[a, b]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'hai_day_ht', l, `Tổng hai đáy: ${f(sum * h / 2)} × 2 : ${h} = ${sum} cm. Đáy lớn: (${sum} + ${diff}) : 2 = ${a} cm; đáy bé: ${b} cm.`));
};
const circC: T5Template = (r, c, l) => {
  const useR = r.chance(0.5);
  const v = r.int(1, 30);
  const C = cl((useR ? v * 2 : v) * 3.14);
  return Q.blanks(`Tính chu vi hình tròn có ${useR ? 'bán kính' : 'đường kính'} ${v} cm.`, ['{} cm'], [[da(C)]],
    M('T5.HH.02', 'TOAN.HINH', 'chu_vi_tron', l, useR ? `C = r × 2 × 3,14 = ${v} × 2 × 3,14 = ${d(C)} (cm).` : `C = d × 3,14 = ${v} × 3,14 = ${d(C)} (cm).`));
};
const circS: T5Template = (r, c, l) => {
  const rr = r.int(1, 20);
  return Q.blanks(`Tính diện tích hình tròn có bán kính ${rr} dm.`, ['{} dm²'], [[da(rr * rr * 3.14)]],
    M('T5.HH.02', 'TOAN.HINH', 'dt_tron', l, `S = r × r × 3,14 = ${rr} × ${rr} × 3,14 = ${d(rr * rr * 3.14)} (dm²).`));
};
const circFromC: T5Template = (r, c, l) => {
  const dd = r.int(2, 40);
  return Q.blanks(`Một hình tròn có chu vi ${d(dd * 3.14)} cm. Tính đường kính và bán kính của hình tròn đó.`, ['Đường kính: {} cm', 'Bán kính: {} cm'], [[dd, da(dd / 2)]],
    M('T5.HH.02', 'TOAN.HINH', 'tim_duong_kinh', l, `d = C : 3,14 = ${d(dd * 3.14)} : 3,14 = ${dd} cm; r = ${dd} : 2 = ${d(dd / 2)} cm.`));
};
const circShade: T5Template = (r, c, l) => {
  const a = r.int(2, 10) * 2;
  const rr = a / 2;
  const S = cl(a * a - rr * rr * 3.14);
  return Q.blanks(`Một hình vuông cạnh ${a} cm có một hình tròn nằm bên trong, tiếp xúc với bốn cạnh (đường kính bằng cạnh hình vuông). Tính diện tích phần hình vuông nằm ngoài hình tròn.`, ['{} cm²'], [[da(S)]],
    M('T5.TD.02', 'TOAN.HINH', 'phan_to_mau', l, `Diện tích hình vuông: ${a * a} cm²; bán kính ${rr} cm, diện tích hình tròn: ${rr} × ${rr} × 3,14 = ${d(rr * rr * 3.14)} cm². Hiệu: ${d(S)} cm².`));
};
const wheelWord: T5Template = (r, c, l) => {
  const dd = r.pick([0.5, 0.6, 0.7, 0.65, 0.8]), n = r.int(10, 200);
  return Q.blanks(`Bánh xe đạp có đường kính ${d(dd)} m. Bánh xe lăn ${n} vòng thì xe đi được bao nhiêu mét?`, ['{} m'], [[da(dd * 3.14 * n)]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'banh_xe', l, `Chu vi bánh xe: ${d(dd)} × 3,14 = ${d(dd * 3.14)} m; ${n} vòng: ${d(dd * 3.14)} × ${n} = ${d(dd * 3.14 * n)} m.`));
};

// =========================================================================== CHỦ ĐỀ 7. TỈ SỐ
const ratioPick: T5Template = (r, c, l) => {
  const a = r.int(2, 9), b = r.int(2, 12);
  if (a === b) return null;
  const n = kid(r);
  const ans = frR(a, b);
  const opts = uniqOpts(r, ans, [frR(b, a), frR(a, a + b), frR(b, a + b)]);
  if (!opts) return null;
  return Q.sc(`Tổ của ${n} có ${a} bạn nam và ${b} bạn nữ. Tỉ số của số bạn nam và số bạn nữ là:`, opts, ans,
    M('T5.TS.01', 'TOAN.PHANSO', 'ti_so', l, `Tỉ số của số bạn nam và số bạn nữ là ${a} : ${b} hay ${ans}.`));
};
const ratioWhole: T5Template = (r, c, l) => {
  const a = r.int(2, 9), b = r.int(2, 12);
  const ans = frR(a, a + b);
  const opts = uniqOpts(r, ans, [frR(a, b), frR(b, a + b), frR(a + b, a)]);
  if (!opts) return null;
  return Q.sc(`Trong rổ có ${a} quả cam và ${b} quả quýt. Tỉ số của số cam và tổng số quả trong rổ là:`, opts, ans,
    M('T5.TS.01', 'TOAN.PHANSO', 'ti_so_tong', l, `Tổng số quả: ${a + b}. Tỉ số: ${a} : ${a + b} hay ${ans}.`));
};
const ratioPct: T5Template = (r, c, l) => {
  const a = r.int(1, 99);
  return Q.blanks(`Viết tỉ số ${fr(a, 100)} dưới dạng tỉ số phần trăm.`, [`${fr(a, 100)} = {}%`], [[a]],
    M('T5.TS.01', 'TOAN.PHANSO', 'ti_so_phan_tram', l, `${fr(a, 100)} viết là ${a}%.`));
};
const ratioOfPart: T5Template = (r, c, l) => {
  const b = r.int(3, 9), a = r.int(1, b - 1);
  if (gcd(a, b) !== 1) return null;
  const k = r.int(3, 9);
  return Q.blanks(`Đội văn nghệ có ${b * k} bạn. Số bạn nam bằng ${fr(a, b)} số bạn của cả đội. Hỏi đội có bao nhiêu bạn nữ?`, ['{} bạn'], [[(b - a) * k]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'ti_so_phan', l, `Số bạn nam: ${b * k} × ${fr(a, b)} = ${a * k}; số bạn nữ: ${b * k} ${MINUS} ${a * k} = ${(b - a) * k}.`));
};
const mapReal: T5Template = (r, c, l) => {
  const scale = r.pick([1000, 2000, 5000, 10000, 100000, 500000]);
  const cm = r.int(2, 15);
  const realCm = cm * scale;
  const [v, u] = realCm >= 100000 ? [realCm / 100000, 'km'] : [realCm / 100, 'm'];
  return Q.blanks(`Trên bản đồ tỉ lệ 1 : ${f(scale)}, quãng đường dài ${cm} cm. Độ dài thật của quãng đường là bao nhiêu ${u === 'km' ? 'ki-lô-mét' : 'mét'}?`, [`{} ${u}`], [[da(v)]],
    M('T5.TS.01', 'TOAN.LOIVAN', 'ti_le_ban_do', l, `Độ dài thật: ${cm} × ${f(scale)} = ${f(realCm)} cm = ${d(v)} ${u}.`));
};
const mapDraw: T5Template = (r, c, l) => {
  const scale = r.pick([500, 1000, 2000]);
  const cm = r.int(2, 20);
  const m = cm * scale / 100;
  return Q.blanks(`Sân trường dài ${m} m. Trên bản đồ tỉ lệ 1 : ${f(scale)}, chiều dài sân trường là bao nhiêu xăng-ti-mét?`, ['{} cm'], [[cm]],
    M('T5.TS.01', 'TOAN.LOIVAN', 'ti_le_ban_do_nguoc', l, `${m} m = ${f(m * 100)} cm; ${f(m * 100)} : ${f(scale)} = ${cm} (cm).`));
};
const mapArea: T5Template = (r, c, l) => {
  const scale = r.pick([1000, 2000]);
  const a = r.int(2, 9), b = r.int(1, a);
  const ra = a * scale / 100, rb = b * scale / 100;
  return Q.blanks(`Trên bản đồ tỉ lệ 1 : ${f(scale)}, một khu đất hình chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm. Diện tích thật của khu đất là bao nhiêu mét vuông?`, ['{} m²'], [[ra * rb]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'ti_le_dien_tich', l, `Chiều dài thật: ${ra} m; chiều rộng thật: ${rb} m; diện tích: ${f(ra * rb)} m².`));
};
const sumRatioT: T5Template = (r, c, l) => {
  const a = r.int(1, 7), b = r.int(a + 1, 9), u = r.int(3, 40);
  if (gcd(a, b) !== 1) return null;
  const S = (a + b) * u;
  const askBig = r.chance(0.5);
  return Q.blanks(`Tổng của hai số là ${S}. Tỉ số của hai số là ${fr(a, b)}. Tìm số ${askBig ? 'lớn' : 'bé'}.`, ['{}'], [[askBig ? b * u : a * u]],
    M('T5.TS.02', 'TOAN.LOIVAN', 'tong_ti', l, `Tổng số phần: ${a} + ${b} = ${a + b}; mỗi phần: ${S} : ${a + b} = ${u}. Số bé: ${a * u}; số lớn: ${b * u}.`));
};
const sumRatioWord: T5Template = (r, c, l) => {
  const a = r.int(1, 5), b = r.int(a + 1, 7), u = r.int(4, 25);
  if (gcd(a, b) !== 1) return null;
  return Q.blanks(`Hai lớp trồng được ${(a + b) * u} cây. Số cây lớp 5A bằng ${fr(a, b)} số cây lớp 5B. Mỗi lớp trồng bao nhiêu cây?`, ['Lớp 5A: {} cây', 'Lớp 5B: {} cây'], [[a * u, b * u]],
    M('T5.TS.02', 'TOAN.LOIVAN', 'tong_ti_loi_van', l, `Tổng số phần: ${a + b}; mỗi phần: ${u} cây. Lớp 5A: ${a * u}; lớp 5B: ${b * u}.`));
};
const sumRatioRect: T5Template = (r, c, l) => {
  const a = r.int(1, 4), b = r.int(a + 1, 6), u = r.int(2, 12);
  if (gcd(a, b) !== 1) return null;
  const P = (a + b) * u * 2;
  return Q.blanks(`Một hình chữ nhật có chu vi ${P} m, chiều rộng bằng ${fr(a, b)} chiều dài. Tính diện tích hình chữ nhật.`, ['{} m²'], [[a * u * b * u]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'tong_ti_hcn', l, `Nửa chu vi: ${P / 2} m; mỗi phần: ${P / 2} : ${a + b} = ${u} m. Chiều rộng ${a * u} m, chiều dài ${b * u} m; diện tích ${f(a * u * b * u)} m².`));
};
const sumRatioAge: T5Template = (r, c, l) => {
  const k = r.int(3, 6), child = r.int(5, 12);
  const mom = child * k;
  if (mom > 50) return null;
  return Q.blanks(`Tổng số tuổi của mẹ và con là ${mom + child} tuổi. Tuổi con bằng ${fr(1, k)} tuổi mẹ. Tính tuổi của mỗi người.`, ['Con: {} tuổi', 'Mẹ: {} tuổi'], [[child, mom]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'tong_ti_tuoi', l, `Tổng số phần: 1 + ${k} = ${k + 1}; tuổi con: ${mom + child} : ${k + 1} = ${child}; tuổi mẹ: ${mom}.`));
};
const diffRatioT: T5Template = (r, c, l) => {
  const a = r.int(1, 7), b = r.int(a + 1, 9), u = r.int(3, 40);
  if (gcd(a, b) !== 1) return null;
  const D = (b - a) * u;
  const askBig = r.chance(0.5);
  return Q.blanks(`Hiệu của hai số là ${D}. Tỉ số của hai số là ${fr(a, b)}. Tìm số ${askBig ? 'lớn' : 'bé'}.`, ['{}'], [[askBig ? b * u : a * u]],
    M('T5.TS.02', 'TOAN.LOIVAN', 'hieu_ti', l, `Hiệu số phần: ${b} ${MINUS} ${a} = ${b - a}; mỗi phần: ${D} : ${b - a} = ${u}. Số bé: ${a * u}; số lớn: ${b * u}.`));
};
const diffRatioWord: T5Template = (r, c, l) => {
  const a = r.int(1, 4), b = r.int(a + 1, 7), u = r.int(5, 30);
  if (gcd(a, b) !== 1) return null;
  return Q.blanks(`Kho thứ nhất có nhiều hơn kho thứ hai ${(b - a) * u} tấn gạo. Số gạo kho thứ hai bằng ${fr(a, b)} số gạo kho thứ nhất. Mỗi kho có bao nhiêu tấn gạo?`, ['Kho thứ nhất: {} tấn', 'Kho thứ hai: {} tấn'], [[b * u, a * u]],
    M('T5.TS.02', 'TOAN.LOIVAN', 'hieu_ti_loi_van', l, `Hiệu số phần: ${b - a}; mỗi phần: ${u} tấn. Kho thứ nhất: ${b * u} tấn; kho thứ hai: ${a * u} tấn.`));
};
const diffRatioAge: T5Template = (r, c, l) => {
  const k = r.int(3, 6), child = r.int(4, 12), mom = child * k;
  if (mom > 50) return null;
  const later = r.int(2, 6);
  return Q.blanks(`Mẹ hơn con ${mom - child} tuổi. Tuổi con bằng ${fr(1, k)} tuổi mẹ. Hỏi ${later} năm nữa con bao nhiêu tuổi?`, ['{} tuổi'], [[child + later]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'hieu_ti_tuoi', l, `Hiệu số phần: ${k} ${MINUS} 1 = ${k - 1}; tuổi con hiện nay: ${mom - child} : ${k - 1} = ${child}; ${later} năm nữa: ${child + later} tuổi.`));
};
const pctOfT: T5Template = (r, c, l) => {
  const b = r.pick([20, 25, 40, 50, 80, 200, 400]), a = r.int(1, b - 1);
  const p = cl(a / b * 100);
  if (decPlaces(p) > 1) return null;
  return Q.blanks(`Tìm tỉ số phần trăm của ${a} và ${b}.`, ['{}%'], [[da(p)]],
    M('T5.TS.03', 'TOAN.TINH', 'ti_so_pt', l, `${a} : ${b} = ${d(a / b)} = ${d(p)}%.`));
};
const pctOfWord: T5Template = (r, c, l) => {
  const total = r.pick([20, 25, 40, 50]), girls = r.int(5, total - 5);
  const p = cl(girls / total * 100);
  return Q.blanks(`Lớp 5B có ${total} học sinh, trong đó có ${girls} học sinh nữ. Số học sinh nữ chiếm bao nhiêu phần trăm số học sinh cả lớp?`, ['{}%'], [[da(p)]],
    M('T5.TS.03', 'TOAN.LOIVAN', 'ti_so_pt_loi_van', l, `${girls} : ${total} = ${d(girls / total)} = ${d(p)}%.`));
};
const pctDecimal: T5Template = (r, c, l) => {
  const x = r.int(1, 199) / 100;
  return Q.blanks('Viết thành tỉ số phần trăm.', [`${d(x)} = {}%`], [[Math.round(x * 100)]],
    M('T5.TS.03', 'TOAN.DOCVIET', 'stp_phan_tram', l, `Nhân với 100 rồi viết thêm kí hiệu %: ${d(x)} = ${Math.round(x * 100)}%.`));
};
const pctPlan: T5Template = (r, c, l) => {
  const plan = r.pick([20, 40, 50, 80, 200]), done = cl(plan * r.pick([1.1, 1.15, 1.2, 1.25, 0.8, 0.9]));
  if (!Number.isInteger(done)) return null;
  const p = cl(done / plan * 100);
  const over = cl(p - 100);
  return Q.blanks(`Theo kế hoạch, một xã trồng ${plan} ha rừng. Thực tế xã trồng được ${done} ha. Xã đã thực hiện được bao nhiêu phần trăm kế hoạch?`, ['{}%'], [[da(p)]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'pt_ke_hoach', l, `${done} : ${plan} = ${d(done / plan)} = ${d(p)}%${over > 0 ? `; vượt mức ${d(over)}%` : ''}.`));
};
const pctProfit: T5Template = (r, c, l) => {
  const buy = r.int(4, 20) * 10000, p = r.pick([10, 15, 20, 25]);
  const sell = buy * (100 + p) / 100;
  return Q.blanks(`Một chiếc áo mua vào giá ${f(buy)} đồng, bán ra giá ${f(sell)} đồng. Tiền lãi bằng bao nhiêu phần trăm giá mua?`, ['{}%'], [[p]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'pt_lai', l, `Tiền lãi: ${f(sell - buy)} đồng; ${f(sell - buy)} : ${f(buy)} = ${d(p / 100)} = ${p}%.`));
};
const pctValueT: T5Template = (r, c, l) => {
  const p = r.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]), n = r.int(2, 60) * 20;
  return Q.blanks(`Tìm ${p}% của ${f(n)}.`, ['{}'], [[da(n * p / 100)]],
    M('T5.TS.03', 'TOAN.TINH', 'gia_tri_pt', l, `${f(n)} × ${p} : 100 = ${d(n * p / 100)}.`));
};
const pctValueWord: T5Template = (r, c, l) => {
  const total = r.pick([400, 500, 600, 800, 1200]), p = r.pick([12, 15, 25, 35, 45, 60]);
  return Q.blanks(`Trường có ${f(total)} học sinh, trong đó số học sinh tham gia câu lạc bộ thể thao chiếm ${p}%. Hỏi có bao nhiêu học sinh tham gia câu lạc bộ thể thao?`, ['{} học sinh'], [[total * p / 100]],
    M('T5.TS.03', 'TOAN.LOIVAN', 'gia_tri_pt_loi_van', l, `${f(total)} × ${p} : 100 = ${total * p / 100} (học sinh).`));
};
const pctDiscount: T5Template = (r, c, l) => {
  const price = r.int(5, 50) * 10000, p = r.pick([10, 15, 20, 25, 30]);
  const pay = price * (100 - p) / 100;
  return Q.blanks(`Một đôi giày giá ${f(price)} đồng, nay được giảm giá ${p}%. Hỏi giá đôi giày sau khi giảm là bao nhiêu đồng?`, ['{} đồng'], [[pay]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'giam_gia', l, `Số tiền giảm: ${f(price)} × ${p} : 100 = ${f(price - pay)} đồng; giá mới: ${f(pay)} đồng.`));
};
const pctSavings: T5Template = (r, c, l) => {
  const money = r.int(2, 20) * 1000000, p = r.pick([0.5, 0.6, 0.8]);
  const interest = money * p / 100;
  return Q.blanks(`Bác An gửi tiết kiệm ${f(money)} đồng, lãi suất ${d(p)}% một tháng. Sau một tháng, bác An có tất cả bao nhiêu tiền (cả gốc và lãi)?`, ['{} đồng'], [[money + interest]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'tiet_kiem', l, `Tiền lãi: ${f(money)} × ${d(p)} : 100 = ${f(interest)} đồng; cả gốc và lãi: ${f(money + interest)} đồng.`));
};
const pctFindWhole: T5Template = (r, c, l) => {
  const p = r.pick([10, 20, 25, 40, 50]), whole = r.int(4, 40) * 10;
  const part = whole * p / 100;
  return Q.blanks(`${p}% số cây của vườn là ${part} cây. Hỏi vườn có tất cả bao nhiêu cây?`, ['{} cây'], [[whole]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'tim_so_tu_pt', l, `Số cây của vườn: ${part} : ${p} × 100 = ${whole} (cây).`));
};

// =========================================================================== CHỦ ĐỀ 8–9. THỂ TÍCH, HÌNH KHỐI
const volCubes: T5Template = (r, c, l) => {
  const a = r.int(2, 6), b = r.int(2, 5), h = r.int(2, 5);
  return Q.blanks(`Một khối được xếp từ các hình lập phương nhỏ cạnh 1 cm: mỗi lớp có ${a} hàng, mỗi hàng ${b} hình; khối có ${h} lớp. Thể tích của khối là bao nhiêu xăng-ti-mét khối?`, ['{} cm³'], [[a * b * h]],
    M('T5.HH.03', 'TOAN.HINH', 'the_tich_dem', l, `Mỗi lớp: ${a} × ${b} = ${a * b} hình; ${h} lớp: ${a * b * h} hình = ${a * b * h} cm³.`));
};
const volCompare: T5Template = (r, c, l) => {
  const A = r.int(10, 40), B = A + r.int(-6, 6);
  const ans = A > B ? 'Hình A' : A < B ? 'Hình B' : 'Bằng nhau';
  return Q.sc(`Hình A gồm ${A} hình lập phương nhỏ, hình B gồm ${B} hình lập phương nhỏ như thế. Hình nào có thể tích lớn hơn?`, ['Hình A', 'Hình B', 'Bằng nhau'], ans,
    M('T5.HH.03', 'TOAN.HINH', 'so_sanh_the_tich', l, `Hình nào gồm nhiều hình lập phương nhỏ hơn thì có thể tích lớn hơn: ${A} và ${B}.`));
};
const VOL_U: [string, string, number][] = [['dm³', 'cm³', 1000], ['m³', 'dm³', 1000]];
const volConv: T5Template = (r, c, l) => {
  const [big, small, k] = c.topics.includes('volUnits') && c.lesson === 46 ? VOL_U[0] : r.pick(VOL_U);
  const n = r.int(2, 90);
  return r.chance(0.5)
    ? Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} ${big} = {} ${small}`], [[n * k]], M('T5.DL.02', 'TOAN.DOLUONG', 'doi_the_tich', l, `1 ${big} = ${f(k)} ${small}, nên ${n} ${big} = ${f(n * k)} ${small}.`))
    : Q.blanks('Viết số thích hợp vào chỗ trống.', [`${f(n * k)} ${small} = {} ${big}`], [[n]], M('T5.DL.02', 'TOAN.DOLUONG', 'doi_the_tich', l, `${f(k)} ${small} = 1 ${big}, nên ${f(n * k)} ${small} = ${n} ${big}.`));
};
const volDec: T5Template = (r, c, l) => {
  const [big, small, k] = r.pick(VOL_U);
  const x = rd(r, 0.1, 9.9, r.int(1, 3));
  return r.chance(0.5)
    ? Q.blanks('Viết số thích hợp vào chỗ trống.', [`${d(x)} ${big} = {} ${small}`], [[Math.round(x * k)]], M('T5.DL.02', 'TOAN.DOLUONG', 'doi_the_tich_stp', l, `${d(x)} × ${f(k)} = ${f(Math.round(x * k))}.`))
    : Q.blanks('Viết số thập phân thích hợp vào chỗ trống.', [`${f(Math.round(x * k))} ${small} = {} ${big}`], [[da(x)]], M('T5.DL.02', 'TOAN.DOLUONG', 'doi_the_tich_stp', l, `${f(Math.round(x * k))} : ${f(k)} = ${d(x)}.`));
};
const volCmpT: T5Template = (r, c, l) => {
  const n = rd(r, 1, 9, 1);
  const cm = Math.round(n * 1000) + r.pick([-100, 0, 100]);
  const s = cmpSign(n * 1000, cm);
  return Q.sc(`Chọn dấu thích hợp: ${d(n)} dm³ ? ${f(cm)} cm³`, ['>', '<', '='], s, M('T5.DL.02', 'TOAN.SOSANH', 'so_sanh_the_tich', l, `${d(n)} dm³ = ${f(Math.round(n * 1000))} cm³, nên dấu ${s}.`));
};
const volLiter: T5Template = (r, c, l) => {
  const a = r.int(5, 20) / 10, b = r.int(4, 15) / 10, h = r.int(5, 12) / 10;
  const V = cl(a * b * h);
  return Q.blanks(`Một bể nước hình hộp chữ nhật dài ${d(a)} m, rộng ${d(b)} m, cao ${d(h)} m. Bể chứa được nhiều nhất bao nhiêu lít nước? (1 dm³ = 1 l)`, ['{} l'], [[Math.round(V * 1000)]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'be_nuoc_lit', l, `Thể tích: ${d(a)} × ${d(b)} × ${d(h)} = ${d(V)} m³ = ${f(Math.round(V * 1000))} dm³ = ${f(Math.round(V * 1000))} l.`));
};
const NETS: [string, string][] = [
  ['6 hình vuông bằng nhau', 'hình lập phương'],
  ['6 hình chữ nhật, từng cặp đối diện bằng nhau', 'hình hộp chữ nhật'],
  ['2 hình tròn bằng nhau và 1 hình chữ nhật', 'hình trụ'],
];
const netPick: T5Template = (r, c, l) => {
  const [desc, shape] = r.pick(NETS);
  return Q.sc(`Hình khai triển gồm ${desc} là hình khai triển của hình nào?`, ['hình lập phương', 'hình hộp chữ nhật', 'hình trụ'], shape,
    M('T5.HH.03', 'TOAN.HINH', 'hinh_khai_trien', l, `Hình khai triển của ${shape} gồm ${desc}.`));
};
const netCount: T5Template = (r, c, l) => {
  const [what, shape, n] = r.pick([['mặt', 'hình hộp chữ nhật', 6], ['cạnh', 'hình hộp chữ nhật', 12], ['đỉnh', 'hình hộp chữ nhật', 8], ['mặt', 'hình lập phương', 6], ['cạnh', 'hình lập phương', 12], ['đỉnh', 'hình lập phương', 8]] as [string, string, number][]);
  return Q.blanks(`${shape[0].toUpperCase() + shape.slice(1)} có bao nhiêu ${what}?`, [`{} ${what}`], [[n]], M('T5.HH.03', 'TOAN.HINH', 'mat_canh_dinh', l, `${shape[0].toUpperCase() + shape.slice(1)} có 6 mặt, 12 cạnh, 8 đỉnh.`));
};
const netFacts: T5Template = (r, c, l) => {
  const rows = r.sample<[string, boolean]>([
    ['Hình lập phương có 6 mặt là hình vuông bằng nhau.', true],
    ['Hình hộp chữ nhật có 8 cạnh.', false],
    ['Hình khai triển của hình trụ có 2 hình tròn.', true],
    ['Các mặt của hình hộp chữ nhật đều là hình vuông.', false],
    ['Hình lập phương có 12 cạnh bằng nhau.', true],
    ['Hình trụ có 6 mặt.', false],
  ], 4);
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return Q.table('Đúng ghi Đ, sai ghi S.', rows, M('T5.HH.03', 'TOAN.DUNGSAI', 'hinh_khoi_ds', l, 'Hình hộp chữ nhật, hình lập phương có 6 mặt, 12 cạnh, 8 đỉnh; hình trụ có hai đáy là hình tròn.'));
};
const netPaint: T5Template = (r, c, l) => {
  const a = r.int(2, 5);
  return Q.blanks(`Một khối gỗ hình lập phương cạnh ${a} dm được sơn kín 6 mặt rồi cắt thành các hình lập phương nhỏ cạnh 1 dm. Có bao nhiêu hình lập phương nhỏ được sơn đúng 3 mặt?`, ['{} hình'], [[8]],
    M('T5.TD.02', 'TOAN.HINH', 'son_mat', l, 'Chỉ các hình ở 8 đỉnh mới được sơn 3 mặt: có 8 hình.'));
};
const boxSxq: T5Template = (r, c, l) => {
  const dec = c.decimal && l >= 3;
  const a = dec ? rd(r, 2, 9, 1) : r.int(4, 20), b = r.int(2, 9), h = r.int(2, 12);
  const Sxq = cl((a + b) * 2 * h), Stp = cl(Sxq + a * b * 2);
  const tp = l === 2 || (l >= 3 && r.chance(0.6));
  return tp
    ? Q.blanks(`Hình hộp chữ nhật dài ${d(a)} cm, rộng ${b} cm, cao ${h} cm. Tính diện tích toàn phần.`, ['{} cm²'], [[da(Stp)]], M('T5.HH.03', 'TOAN.HINH', 'stp_hhcn', l, `Sxq = (${d(a)} + ${b}) × 2 × ${h} = ${d(Sxq)} cm²; Stp = ${d(Sxq)} + ${d(a)} × ${b} × 2 = ${d(Stp)} cm².`))
    : Q.blanks(`Hình hộp chữ nhật dài ${d(a)} cm, rộng ${b} cm, cao ${h} cm. Tính diện tích xung quanh.`, ['{} cm²'], [[da(Sxq)]], M('T5.HH.03', 'TOAN.HINH', 'sxq_hhcn', l, `Sxq = chu vi đáy × chiều cao = (${d(a)} + ${b}) × 2 × ${h} = ${d(Sxq)} cm².`));
};
const boxOpen: T5Template = (r, c, l) => {
  const a = r.int(4, 12), b = r.int(3, a), h = r.int(2, 8);
  const S = (a + b) * 2 * h + a * b;
  return Q.blanks(`Người ta làm một cái hộp không nắp hình hộp chữ nhật dài ${a} dm, rộng ${b} dm, cao ${h} dm bằng bìa. Tính diện tích bìa cần dùng (không tính mép dán).`, ['{} dm²'], [[S]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'hop_khong_nap', l, `Sxq: (${a} + ${b}) × 2 × ${h} = ${(a + b) * 2 * h} dm²; thêm một mặt đáy ${a * b} dm²: ${S} dm².`));
};
const roomPaint: T5Template = (r, c, l) => {
  const a = r.int(5, 9), b = r.int(4, a), h = r.int(3, 4), door = r.pick([2, 3, 4]);
  const S = (a + b) * 2 * h + a * b - door;
  return Q.blanks(`Một căn phòng hình hộp chữ nhật dài ${a} m, rộng ${b} m, cao ${h} m. Người ta quét vôi bốn bức tường và trần nhà, trừ cửa có diện tích ${door} m². Tính diện tích cần quét vôi.`, ['{} m²'], [[S]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'quet_voi', l, `Bốn bức tường: (${a} + ${b}) × 2 × ${h} = ${(a + b) * 2 * h} m²; trần: ${a * b} m²; trừ cửa: ${(a + b) * 2 * h} + ${a * b} ${MINUS} ${door} = ${S} m².`));
};
const cubeS: T5Template = (r, c, l) => {
  const dec = c.decimal && r.chance(l >= 3 ? 0.7 : 0.4);
  const a = dec ? rd(r, 1, 9, 1) : r.int(2, 30);
  const tp = l >= 2 && r.chance(0.6);
  return tp
    ? Q.blanks(`Hình lập phương có cạnh ${d(a)} cm. Tính diện tích toàn phần.`, ['{} cm²'], [[da(a * a * 6)]], M('T5.HH.03', 'TOAN.HINH', 'stp_hlp', l, `Một mặt: ${d(a)} × ${d(a)} = ${d(a * a)} cm²; Stp = ${d(a * a)} × 6 = ${d(a * a * 6)} cm².`))
    : Q.blanks(`Hình lập phương có cạnh ${d(a)} cm. Tính diện tích xung quanh.`, ['{} cm²'], [[da(a * a * 4)]], M('T5.HH.03', 'TOAN.HINH', 'sxq_hlp', l, `Sxq = cạnh × cạnh × 4 = ${d(a)} × ${d(a)} × 4 = ${d(a * a * 4)} cm².`));
};
const cubeEdge: T5Template = (r, c, l) => {
  const a = r.int(2, 12);
  return Q.blanks(`Một hình lập phương có diện tích toàn phần ${a * a * 6} cm². Tính độ dài cạnh hình lập phương.`, ['{} cm'], [[a]],
    M('T5.HH.03', 'TOAN.HINH', 'canh_tu_stp', l, `Diện tích một mặt: ${a * a * 6} : 6 = ${a * a} cm²; ${a} × ${a} = ${a * a}, nên cạnh ${a} cm.`));
};
const cubeScale: T5Template = (r, c, l) => {
  const k = r.pick([2, 3]);
  const what = r.pick(['diện tích toàn phần', 'thể tích']);
  const n = what === 'thể tích' ? k ** 3 : k ** 2;
  return Q.sc(`Nếu gấp cạnh hình lập phương lên ${k} lần thì ${what} của nó gấp lên mấy lần?`, r.shuffle([...new Set([String(n), String(k), String(k * 2), String(k ** 3 === n ? k ** 2 : k ** 3)])]), String(n),
    M('T5.TD.02', 'TOAN.HINH', 'gap_canh', l, what === 'thể tích' ? `Thể tích = cạnh × cạnh × cạnh, gấp ${k} × ${k} × ${k} = ${n} lần.` : `Diện tích một mặt = cạnh × cạnh, gấp ${k} × ${k} = ${n} lần.`));
};
const boxV: T5Template = (r, c, l) => {
  const dec = c.decimal && l >= 2;
  const a = dec ? rd(r, 1, 9, 1) : r.int(3, 20), b = r.int(2, 10), h = r.int(2, 10);
  return Q.blanks(`Tính thể tích hình hộp chữ nhật có chiều dài ${d(a)} dm, chiều rộng ${b} dm, chiều cao ${h} dm.`, ['{} dm³'], [[da(a * b * h)]],
    M('T5.HH.03', 'TOAN.HINH', 'v_hhcn', l, `V = ${d(a)} × ${b} × ${h} = ${d(a * b * h)} (dm³).`));
};
const boxHeight: T5Template = (r, c, l) => {
  const a = r.int(3, 15), b = r.int(2, 10), h = r.int(2, 12);
  return Q.blanks(`Một hình hộp chữ nhật có thể tích ${a * b * h} cm³, chiều dài ${a} cm, chiều rộng ${b} cm. Tính chiều cao.`, ['{} cm'], [[h]],
    M('T5.HH.03', 'TOAN.HINH', 'tim_chieu_cao_hhcn', l, `Diện tích đáy: ${a} × ${b} = ${a * b} cm²; chiều cao: ${a * b * h} : ${a * b} = ${h} cm.`));
};
const waterRise: T5Template = (r, c, l) => {
  const a = r.int(4, 10) * 10, b = r.int(3, 8) * 10, rise = r.int(1, 5);
  return Q.blanks(`Một bể kính hình hộp chữ nhật có đáy dài ${a} cm, rộng ${b} cm, đang chứa nước. Thả một hòn đá chìm hẳn vào bể thì mực nước dâng lên ${rise} cm. Thể tích hòn đá là bao nhiêu xăng-ti-mét khối?`, ['{} cm³'], [[a * b * rise]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'nuoc_dang', l, `Thể tích hòn đá bằng thể tích nước dâng lên: ${a} × ${b} × ${rise} = ${f(a * b * rise)} cm³.`));
};
const cubeV: T5Template = (r, c, l) => {
  const dec = c.decimal && r.chance(l >= 2 ? 0.7 : 0.4);
  const a = dec ? rd(r, 1, 5, 1) : r.int(2, 30);
  return Q.blanks(`Tính thể tích hình lập phương có cạnh ${d(a)} m.`, ['{} m³'], [[da(a * a * a)]],
    M('T5.HH.03', 'TOAN.HINH', 'v_hlp', l, `V = ${d(a)} × ${d(a)} × ${d(a)} = ${d(a * a * a)} (m³).`));
};
const cubeFromV: T5Template = (r, c, l) => {
  const a = r.int(2, 10);
  return Q.blanks(`Một hình lập phương có thể tích ${a * a * a} cm³. Cạnh hình lập phương dài bao nhiêu xăng-ti-mét?`, ['{} cm'], [[a]],
    M('T5.HH.03', 'TOAN.HINH', 'canh_tu_v', l, `${a} × ${a} × ${a} = ${a * a * a}, nên cạnh dài ${a} cm.`));
};
const cubeVsBox: T5Template = (r, c, l) => {
  const a = r.int(3, 9), b = r.int(2, 8), h = r.int(2, 8), e = r.int(3, 8);
  const V1 = a * b * h, V2 = e * e * e;
  if (V1 === V2) return null;
  const ans = V1 > V2 ? 'Hình hộp chữ nhật' : 'Hình lập phương';
  return Q.sc(`Hình hộp chữ nhật dài ${a} cm, rộng ${b} cm, cao ${h} cm và hình lập phương cạnh ${e} cm. Hình nào có thể tích lớn hơn?`, ['Hình hộp chữ nhật', 'Hình lập phương'], ans,
    M('T5.TD.02', 'TOAN.HINH', 'so_sanh_v', l, `Hình hộp chữ nhật: ${V1} cm³; hình lập phương: ${V2} cm³. ${ans} có thể tích lớn hơn.`));
};

// =========================================================================== CHỦ ĐỀ 10. THỜI GIAN, CHUYỂN ĐỘNG
const timeConv: T5Template = (r, c, l) => {
  const items: [string, string, number][] = [['giờ', 'phút', 60], ['phút', 'giây', 60], ['ngày', 'giờ', 24], ['năm', 'tháng', 12], ['thế kỉ', 'năm', 100], ['tuần', 'ngày', 7]];
  const [big, small, k] = r.pick(items);
  const n = r.int(2, 15);
  return Q.blanks('Viết số thích hợp vào chỗ trống.', [`${n} ${big} = {} ${small}`], [[n * k]], M('T5.DL.03', 'TOAN.DOLUONG', 'doi_thoi_gian', l, `1 ${big} = ${k} ${small}, nên ${n} ${big} = ${n * k} ${small}.`));
};
const timeDecHour: T5Template = (r, c, l) => {
  const x = r.pick([0.5, 1.5, 2.5, 0.25, 1.25, 0.75, 3.5, 0.2, 1.2]);
  return r.chance(0.5)
    ? Q.blanks('Viết số thích hợp vào chỗ trống.', [`${d(x)} giờ = {} phút`], [[Math.round(x * 60)]], M('T5.DL.03', 'TOAN.DOLUONG', 'gio_stp', l, `${d(x)} × 60 = ${Math.round(x * 60)} (phút).`))
    : Q.blanks('Viết số thập phân thích hợp vào chỗ trống.', [`${Math.round(x * 60)} phút = {} giờ`], [[da(x)]], M('T5.DL.03', 'TOAN.DOLUONG', 'phut_ra_gio', l, `${Math.round(x * 60)} : 60 = ${d(x)} (giờ).`));
};
const centuryT: T5Template = (r, c, l) => {
  const y = r.int(1001, 2100);
  const cent = Math.ceil(y / 100);
  const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
  const opts = r.shuffle([...new Set([cent, cent - 1, cent + 1].filter((x) => x >= 1 && x <= 21))].map((x) => `thế kỉ ${ROMAN[x]}`));
  return Q.sc(`Năm ${y} thuộc thế kỉ nào?`, opts, `thế kỉ ${ROMAN[cent]}`, M('T5.DL.03', 'TOAN.GIOLICH', 'the_ki', l, `Thế kỉ ${ROMAN[cent]} từ năm ${(cent - 1) * 100 + 1} đến năm ${cent * 100}.`));
};
const monthDays: T5Template = (r, c, l) => {
  const y = r.int(2020, 2035);
  const leap = y % 4 === 0;
  return Q.blanks(`Năm ${y} có bao nhiêu ngày? (Tháng Hai năm đó có ${leap ? 29 : 28} ngày.)`, ['{} ngày'], [[leap ? 366 : 365]],
    M('T5.DL.03', 'TOAN.GIOLICH', 'so_ngay_nam', l, leap ? 'Năm nhuận có 366 ngày (tháng Hai có 29 ngày).' : 'Năm không nhuận có 365 ngày.'));
};
const hm = (mins: number) => (mins % 60 ? `${Math.floor(mins / 60)} giờ ${mins % 60} phút` : `${mins / 60} giờ`);
const timeAdd: T5Template = (r, c, l) => {
  const a = r.int(1, 9) * 60 + r.int(10, 55), b = r.int(1, 5) * 60 + r.int(10, 55);
  return Q.blanks('Tính.', [`${hm(a)} + ${hm(b)} = {} giờ {} phút`], [[Math.floor((a + b) / 60), (a + b) % 60]],
    M('T5.DL.03', 'TOAN.TINH', 'cong_thoi_gian', l, `Cộng giờ với giờ, phút với phút; đủ 60 phút thì đổi thành 1 giờ: ${hm(a + b)}.`));
};
const timeSub: T5Template = (r, c, l) => {
  const b = r.int(1, 5) * 60 + r.int(20, 55), a = b + r.int(1, 4) * 60 + r.int(5, 50);
  if (a % 60 >= b % 60 && l >= 2) return null;
  return Q.blanks('Tính.', [`${hm(a)} ${MINUS} ${hm(b)} = {} giờ {} phút`], [[Math.floor((a - b) / 60), (a - b) % 60]],
    M('T5.DL.03', 'TOAN.TINH', 'tru_thoi_gian', l, `Số phút không đủ trừ thì đổi 1 giờ = 60 phút: ${hm(a - b)}.`));
};
const timeWord: T5Template = (r, c, l) => {
  const start = r.int(6, 14) * 60 + r.pick([0, 15, 30, 45]), dur = r.int(1, 3) * 60 + r.pick([20, 35, 50]);
  const end = start + dur;
  return Q.blanks(`Một xe khách khởi hành lúc ${hm(start)}, đi hết ${hm(dur)}. Hỏi xe đến nơi lúc mấy giờ?`, ['{} giờ {} phút'], [[Math.floor(end / 60), end % 60]],
    M('T5.DL.03', 'TOAN.LOIVAN', 'gio_den', l, `${hm(start)} + ${hm(dur)} = ${hm(end)}.`));
};
const timeElapsed: T5Template = (r, c, l) => {
  const start = r.int(6, 12) * 60 + r.pick([10, 25, 40, 50]), end = start + r.int(1, 4) * 60 + r.pick([5, 15, 35]);
  return Q.blanks(`Bạn ${kid(r)} bắt đầu làm bài lúc ${hm(start)} và làm xong lúc ${hm(end)}. Bạn đã làm bài trong bao lâu?`, ['{} giờ {} phút'], [[Math.floor((end - start) / 60), (end - start) % 60]],
    M('T5.DL.03', 'TOAN.LOIVAN', 'thoi_gian_troi_qua', l, `${hm(end)} ${MINUS} ${hm(start)} = ${hm(end - start)}.`));
};
const timeMul: T5Template = (r, c, l) => {
  const a = r.int(1, 3) * 60 + r.int(10, 50), n = r.int(2, 6);
  return Q.blanks('Tính.', [`${hm(a)} × ${n} = {} giờ {} phút`], [[Math.floor(a * n / 60), (a * n) % 60]],
    M('T5.DL.03', 'TOAN.TINH', 'nhan_thoi_gian', l, `Nhân từng loại đơn vị rồi đổi phút ra giờ: ${hm(a * n)}.`));
};
const timeDiv: T5Template = (r, c, l) => {
  const n = r.int(2, 6), q = r.int(1, 2) * 60 + r.int(5, 50);
  return Q.blanks('Tính.', [`${hm(q * n)} : ${n} = {} giờ {} phút`], [[Math.floor(q / 60), q % 60]],
    M('T5.DL.03', 'TOAN.TINH', 'chia_thoi_gian', l, `Chia giờ trước, số giờ dư đổi ra phút rồi chia tiếp: ${hm(q)}.`));
};
const timeMulWord: T5Template = (r, c, l) => {
  const n = r.int(4, 12), pm = r.int(12, 40);
  return Q.blanks(`Một người thợ làm một sản phẩm hết ${pm} phút. Hỏi làm ${n} sản phẩm như thế hết bao nhiêu thời gian?`, ['{} giờ {} phút'], [[Math.floor(pm * n / 60), (pm * n) % 60]],
    M('T5.DL.03', 'TOAN.LOIVAN', 'nhan_tg_loi_van', l, `${pm} × ${n} = ${pm * n} phút = ${hm(pm * n)}.`));
};
const speedT: T5Template = (r, c, l) => {
  const v = r.int(8, 60), t = r.int(2, 5);
  return Q.blanks(`Một người đi xe máy được ${v * t} km trong ${t} giờ. Tính vận tốc của người đó.`, ['{} km/giờ'], [[v]],
    M('T5.DL.04', 'TOAN.LOIVAN', 'van_toc', l, `v = s : t = ${v * t} : ${t} = ${v} (km/giờ).`));
};
const speedMin: T5Template = (r, c, l) => {
  const v = r.int(40, 250), t = r.int(2, 9);
  return Q.blanks(`Một vận động viên chạy ${f(v * t)} m trong ${t} phút. Tính vận tốc chạy của vận động viên đó.`, ['{} m/phút'], [[v]],
    M('T5.DL.04', 'TOAN.LOIVAN', 'van_toc_m_phut', l, `v = ${f(v * t)} : ${t} = ${v} (m/phút).`));
};
const speedHalf: T5Template = (r, c, l) => {
  const v = r.int(8, 50) * 2, t = r.pick([1.5, 2.5, 0.5, 3.5]);
  return Q.blanks(`Một ô tô đi quãng đường ${d(v * t)} km hết ${hm(t * 60)}. Tính vận tốc của ô tô.`, ['{} km/giờ'], [[v]],
    M('T5.DL.04', 'TOAN.LOIVAN', 'van_toc_gio_phut', l, `${hm(t * 60)} = ${d(t)} giờ; v = ${d(v * t)} : ${d(t)} = ${v} (km/giờ).`));
};
const speedConv: T5Template = (r, c, l) => {
  const v = r.pick([6, 12, 18, 24, 30, 36, 42, 48, 54, 60]);
  return Q.blanks(`Đổi vận tốc: ${v} km/giờ = ? m/phút`, ['{} m/phút'], [[v * 1000 / 60]],
    M('T5.TD.02', 'TOAN.DOLUONG', 'doi_van_toc', l, `${v} km = ${f(v * 1000)} m; 1 giờ = 60 phút; ${f(v * 1000)} : 60 = ${v * 1000 / 60} (m/phút).`));
};
const distT: T5Template = (r, c, l) => {
  const v = r.int(10, 60), t = r.chance(0.5) ? r.int(2, 5) : r.pick([1.5, 2.5]);
  return Q.blanks(`Một ô tô đi với vận tốc ${v} km/giờ trong ${d(t)} giờ. Tính quãng đường ô tô đi được.`, ['{} km'], [[da(v * t)]],
    M('T5.DL.04', 'TOAN.LOIVAN', 'quang_duong', l, `s = v × t = ${v} × ${d(t)} = ${d(v * t)} (km).`));
};
const timeT: T5Template = (r, c, l) => {
  const v = r.int(10, 60), t = r.pick([2, 3, 4, 1.5, 2.5]);
  return Q.blanks(`Một người đi xe đạp quãng đường ${d(v * t)} km với vận tốc ${v} km/giờ. Hỏi người đó đi hết bao nhiêu giờ?`, ['{} giờ'], [[da(t)]],
    M('T5.DL.04', 'TOAN.LOIVAN', 'thoi_gian_cd', l, `t = s : v = ${d(v * t)} : ${v} = ${d(t)} (giờ).`));
};
const meetT: T5Template = (r, c, l) => {
  const v1 = r.int(30, 55), v2 = r.int(30, 55), t = r.pick([1, 2, 3, 1.5, 2.5]);
  const s = cl((v1 + v2) * t);
  return Q.blanks(`Hai ô tô xuất phát cùng lúc từ hai thành phố cách nhau ${d(s)} km, đi ngược chiều nhau. Vận tốc hai xe là ${v1} km/giờ và ${v2} km/giờ. Sau bao lâu hai xe gặp nhau?`, ['{} giờ'], [[da(t)]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'nguoc_chieu', l, `Mỗi giờ hai xe gần nhau ${v1} + ${v2} = ${v1 + v2} km; thời gian gặp nhau: ${d(s)} : ${v1 + v2} = ${d(t)} giờ.`));
};
const chaseT: T5Template = (r, c, l) => {
  const v1 = r.int(10, 20), v2 = v1 + r.int(10, 30), t = r.int(1, 4);
  const gap = (v2 - v1) * t;
  return Q.blanks(`Một xe đạp đi trước xe máy ${gap} km, hai xe đi cùng chiều, xuất phát cùng lúc. Xe đạp đi ${v1} km/giờ, xe máy đi ${v2} km/giờ. Sau mấy giờ xe máy đuổi kịp xe đạp?`, ['{} giờ'], [[t]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'cung_chieu', l, `Mỗi giờ xe máy gần xe đạp ${v2} ${MINUS} ${v1} = ${v2 - v1} km; ${gap} : ${v2 - v1} = ${t} giờ.`));
};
const arriveT: T5Template = (r, c, l) => {
  const v = r.int(30, 50), t = r.pick([1.5, 2.5, 2, 3]), start = r.int(6, 10) * 60 + r.pick([0, 15, 30]);
  const end = start + t * 60;
  return Q.blanks(`Một ô tô đi từ A lúc ${hm(start)} với vận tốc ${v} km/giờ. Quãng đường AB dài ${d(v * t)} km. Hỏi ô tô đến B lúc mấy giờ?`, ['{} giờ {} phút'], [[Math.floor(end / 60), end % 60]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'gio_den_cd', l, `Thời gian đi: ${d(v * t)} : ${v} = ${d(t)} giờ = ${hm(t * 60)}; đến B lúc ${hm(end)}.`));
};

// =========================================================================== CHỦ ĐỀ 11. THỐNG KÊ, XÁC SUẤT
const DATA_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];
const dataList = (r: Rng) => DATA_NAMES.map(() => r.int(12, 48));
const dataMax: T5Template = (r, c, l) => {
  const xs = dataList(r);
  const big = r.chance(0.5);
  const v = big ? Math.max(...xs) : Math.min(...xs);
  if (xs.filter((x) => x === v).length > 1) return null;
  const day = DATA_NAMES[xs.indexOf(v)];
  return Q.sc(`Số sách thư viện cho mượn trong tuần: ${DATA_NAMES.map((n, i) => `${n}: ${xs[i]}`).join('; ')}. Ngày nào cho mượn ${big ? 'nhiều' : 'ít'} sách nhất?`, DATA_NAMES.slice(), day,
    M('T5.TK.01', 'TOAN.THONGKE', 'doc_so_lieu', l, `Ngày ${day.toLowerCase()} có ${v} cuốn, ${big ? 'nhiều' : 'ít'} nhất.`));
};
const dataAvg: T5Template = (r, c, l) => {
  const xs = dataList(r);
  const s = xs.reduce((a, b) => a + b, 0);
  return Q.blanks(`Số sách thư viện cho mượn trong 5 ngày: ${xs.join(', ')}. Trung bình mỗi ngày cho mượn bao nhiêu cuốn sách?`, ['{} cuốn'], [[da(s / 5)]],
    M('T5.TK.01', 'TOAN.THONGKE', 'tbc_so_lieu', l, `Tổng: ${s} cuốn; ${s} : 5 = ${d(s / 5)} cuốn.`));
};
const dataRange: T5Template = (r, c, l) => {
  const xs = dataList(r);
  return Q.blanks(`Nhiệt độ cao nhất các ngày trong tuần (°C): ${xs.map((x) => x - 10).join(', ')}. Ngày nóng nhất hơn ngày mát nhất bao nhiêu độ?`, ['{} °C'], [[Math.max(...xs) - Math.min(...xs)]],
    M('T5.TK.01', 'TOAN.THONGKE', 'hieu_lon_nho', l, `${Math.max(...xs) - 10} ${MINUS} ${Math.min(...xs) - 10} = ${Math.max(...xs) - Math.min(...xs)} (°C).`));
};
const dataSortT: T5Template = (r, c, l) => {
  const names = r.sample(['Lan', 'Minh', 'Hà', 'Tú', 'Khoa', 'Vy'], 4);
  const xs = [...new Set(names.map(() => rd(r, 1.5, 3.5, 2)))];
  if (xs.length < 4) return null;
  const pairs = names.map((n, i) => [n, xs[i]] as [string, number]);
  const sorted = [...pairs].sort((a, b) => b[1] - a[1]).map((p) => p[0]);
  return Q.ord(`Kết quả nhảy xa (m): ${pairs.map(([n, x]) => `${n}: ${d(x)}`).join('; ')}. Xếp tên các bạn theo thành tích từ cao đến thấp.`, sorted,
    M('T5.TK.01', 'TOAN.SAPXEP', 'xep_so_lieu', l, `${[...pairs].sort((a, b) => b[1] - a[1]).map(([n, x]) => `${n} (${d(x)})`).join(' > ')}.`));
};
const dataAboveAvg: T5Template = (r, c, l) => {
  const xs = dataList(r);
  const avg = xs.reduce((a, b) => a + b, 0) / 5;
  const n = xs.filter((x) => x > avg).length;
  return Q.blanks(`Số học sinh đi học sớm trong 5 ngày: ${xs.join(', ')}. Có bao nhiêu ngày số học sinh đi học sớm nhiều hơn mức trung bình?`, ['{} ngày'], [[n]],
    M('T5.TD.02', 'TOAN.THONGKE', 'tren_trung_binh', l, `Trung bình: ${d(avg)}; các ngày nhiều hơn: ${xs.filter((x) => x > avg).join(', ')} — ${n} ngày.`));
};
const PIE_CATS = ['Bóng đá', 'Bơi lội', 'Cờ vua', 'Cầu lông', 'Bóng rổ'];
const pieData = (r: Rng) => {
  const cats = r.sample(PIE_CATS, 4);
  const a = r.pick([40, 35, 30, 45]), b = r.pick([25, 20, 30]), cc = r.pick([15, 10, 20]);
  const last = 100 - a - b - cc;
  if (last <= 0 || new Set([a, b, cc, last]).size < 4) return null;
  return cats.map((x, i) => [x, [a, b, cc, last][i]] as [string, number]);
};
const pieText = (ps: [string, number][]) => `Biểu đồ hình quạt tròn cho biết tỉ số phần trăm học sinh thích các môn thể thao: ${ps.map(([n, p]) => `${n} ${p}%`).join(', ')}.`;
const pieMost: T5Template = (r, c, l) => {
  const ps = pieData(r);
  if (!ps) return null;
  const best = [...ps].sort((a, b) => b[1] - a[1])[0][0];
  return Q.sc(`${pieText(ps)} Môn nào được nhiều bạn thích nhất?`, ps.map((p) => p[0]), best, M('T5.TK.01', 'TOAN.THONGKE', 'bieu_do_quat', l, `Phần quạt lớn nhất ứng với tỉ số phần trăm lớn nhất: ${best}.`));
};
const pieMissing: T5Template = (r, c, l) => {
  const ps = pieData(r);
  if (!ps) return null;
  const hide = r.int(0, 3);
  return Q.blanks(`Biểu đồ hình quạt tròn về các môn thể thao học sinh yêu thích: ${ps.map(([n, p], i) => `${n} ${i === hide ? '?' : p + '%'}`).join(', ')}. Tìm số phần trăm còn thiếu của ${ps[hide][0]}.`, ['{}%'], [[ps[hide][1]]],
    M('T5.TK.01', 'TOAN.THONGKE', 'quat_thieu', l, `Cả hình tròn là 100%: 100 ${MINUS} ${ps.filter((_, i) => i !== hide).map((p) => p[1]).join(` ${MINUS} `)} = ${ps[hide][1]}%.`));
};
const pieCount: T5Template = (r, c, l) => {
  const ps = pieData(r);
  if (!ps) return null;
  const total = r.pick([40, 80, 120, 200]);
  const [name, p] = r.pick(ps);
  return Q.blanks(`${pieText(ps)} Có ${total} học sinh tham gia khảo sát. Có bao nhiêu học sinh thích ${name.toLowerCase()}?`, ['{} học sinh'], [[total * p / 100]],
    M('T5.TK.01', 'TOAN.THONGKE', 'quat_so_luong', l, `${total} × ${p} : 100 = ${total * p / 100} (học sinh).`));
};
const pieDiff: T5Template = (r, c, l) => {
  const ps = pieData(r);
  if (!ps) return null;
  const total = r.pick([40, 80, 200]);
  const [a, b] = r.sample(ps, 2);
  const diff = Math.abs(a[1] - b[1]) * total / 100;
  return Q.blanks(`${pieText(ps)} Có ${total} học sinh tham gia khảo sát. Số bạn thích ${a[0].toLowerCase()} và số bạn thích ${b[0].toLowerCase()} chênh nhau bao nhiêu bạn?`, ['{} bạn'], [[diff]],
    M('T5.TD.02', 'TOAN.THONGKE', 'quat_chenh_lech', l, `Chênh lệch ${Math.abs(a[1] - b[1])}% của ${total} bạn: ${diff} bạn.`));
};
const pieTotal: T5Template = (r, c, l) => {
  const ps = pieData(r);
  if (!ps) return null;
  const total = r.pick([40, 80, 120, 200, 400]);
  const [name, p] = r.pick(ps.filter((x) => (total * x[1]) % 100 === 0));
  return Q.blanks(`${pieText(ps)} Biết có ${total * p / 100} bạn thích ${name.toLowerCase()}. Có tất cả bao nhiêu bạn tham gia khảo sát?`, ['{} bạn'], [[total]],
    M('T5.TD.02', 'TOAN.THONGKE', 'quat_tong', l, `${total * p / 100} : ${p} × 100 = ${total} (bạn).`));
};
const coinRatio: T5Template = (r, c, l) => {
  const n = r.pick([10, 20, 25, 40, 50]), m = r.int(2, n - 2);
  const ans = frR(m, n);
  const opts = uniqOpts(r, ans, [frR(n - m, n), frR(m, n - m), frR(n, m)]);
  if (!opts) return null;
  return Q.sc(`Tung một đồng xu ${n} lần, có ${m} lần xuất hiện mặt sấp. Tỉ số của số lần xuất hiện mặt sấp và tổng số lần tung là:`, opts, ans,
    M('T5.TK.02', 'TOAN.THONGKE', 'ti_so_su_kien', l, `${m} : ${n} = ${ans}.`));
};
const eventPct: T5Template = (r, c, l) => {
  const n = r.pick([20, 25, 50]), m = r.int(3, n - 3);
  return Q.blanks(`Gieo một con xúc xắc ${n} lần, có ${m} lần xuất hiện mặt 6 chấm. Số lần xuất hiện mặt 6 chấm chiếm bao nhiêu phần trăm tổng số lần gieo?`, ['{}%'], [[m * 100 / n]],
    M('T5.TK.02', 'TOAN.THONGKE', 'ti_so_su_kien_pt', l, `${m} : ${n} = ${d(m / n)} = ${m * 100 / n}%.`));
};
const eventComplement: T5Template = (r, c, l) => {
  const n = r.pick([20, 30, 40, 50]), m = r.int(3, n - 3);
  const ans = frR(n - m, n);
  const opts = uniqOpts(r, ans, [frR(m, n), frR(n - m, m), frR(m, n - m)]);
  if (!opts) return null;
  return Q.sc(`Bạn ${kid(r)} ném bóng vào rổ ${n} lần, ném trúng ${m} lần. Tỉ số của số lần ném trượt và tổng số lần ném là:`, opts, ans,
    M('T5.TK.02', 'TOAN.THONGKE', 'ti_so_bu', l, `Số lần trượt: ${n} ${MINUS} ${m} = ${n - m}; tỉ số: ${n - m} : ${n} = ${ans}.`));
};
const eventCompare: T5Template = (r, c, l) => {
  const n1 = r.pick([10, 20]), n2 = r.pick([25, 50]), m1 = r.int(3, n1 - 2), m2 = r.int(5, n2 - 3);
  const p1 = m1 / n1, p2 = m2 / n2;
  if (p1 === p2) return null;
  const a = kid(r), b = kid(r, a);
  const ans = p1 > p2 ? a : b;
  return Q.sc(`Bạn ${a} ném ${n1} lần, trúng ${m1} lần. Bạn ${b} ném ${n2} lần, trúng ${m2} lần. Bạn nào có tỉ số ném trúng cao hơn?`, [a, b], ans,
    M('T5.TD.02', 'TOAN.THONGKE', 'so_sanh_ti_so', l, `${a}: ${m1} : ${n1} = ${d(p1 * 100)}%; ${b}: ${m2} : ${n2} = ${d(p2 * 100)}%. Bạn ${ans} cao hơn.`));
};

const circRing: T5Template = (r, c, l) => {
  const R = r.int(3, 15), rr = r.int(1, R - 1);
  const S = cl((R * R - rr * rr) * 3.14);
  return Q.blanks(`Một vành khăn được tạo bởi hai hình tròn cùng tâm có bán kính ${R} cm và ${rr} cm. Tính diện tích vành khăn.`, ['{} cm²'], [[da(S)]],
    M('T5.TD.02', 'TOAN.HINH', 'vanh_khan', l, `Hình tròn lớn: ${R} × ${R} × 3,14 = ${d(R * R * 3.14)} cm²; hình tròn bé: ${rr} × ${rr} × 3,14 = ${d(rr * rr * 3.14)} cm²; vành khăn: ${d(S)} cm².`));
};
const halfCircle: T5Template = (r, c, l) => {
  const dd = r.int(2, 20) * 2;
  const P = cl(dd * 3.14 / 2 + dd);
  return Q.blanks(`Một nửa hình tròn có đường kính ${dd} m. Tính chu vi của nửa hình tròn đó (gồm cả đường kính).`, ['{} m'], [[da(P)]],
    M('T5.TD.02', 'TOAN.HINH', 'nua_hinh_tron', l, `Nửa đường tròn: ${dd} × 3,14 : 2 = ${d(dd * 3.14 / 2)} m; thêm đường kính ${dd} m: ${d(P)} m.`));
};
const edgeSum: T5Template = (r, c, l) => {
  if (r.chance(0.5)) {
    const a = r.int(2, 40);
    return Q.blanks(`Tính tổng độ dài các cạnh của hình lập phương có cạnh ${a} cm.`, ['{} cm'], [[a * 12]], M('T5.HH.03', 'TOAN.HINH', 'tong_canh_hlp', l, `Hình lập phương có 12 cạnh bằng nhau: ${a} × 12 = ${a * 12} cm.`));
  }
  const a = r.int(4, 30), b = r.int(2, a), h = r.int(2, 20);
  return Q.blanks(`Tính tổng độ dài các cạnh của hình hộp chữ nhật dài ${a} cm, rộng ${b} cm, cao ${h} cm.`, ['{} cm'], [[(a + b + h) * 4]], M('T5.HH.03', 'TOAN.HINH', 'tong_canh_hhcn', l, `Có 4 cạnh dài, 4 cạnh rộng, 4 cạnh cao: (${a} + ${b} + ${h}) × 4 = ${(a + b + h) * 4} cm.`));
};
const netFaces: T5Template = (r, c, l) => {
  const a = r.int(3, 20), b = r.int(2, a - 1), h = r.int(2, 15);
  const [x, y] = r.pick([[a, b], [a, h], [b, h]] as [number, number][]);
  return Q.blanks(`Hình khai triển của hình hộp chữ nhật dài ${a} cm, rộng ${b} cm, cao ${h} cm có bao nhiêu hình chữ nhật kích thước ${x} cm × ${y} cm?`, ['{} hình'], [[x === y ? 4 : 2]],
    M('T5.HH.03', 'TOAN.HINH', 'mat_khai_trien', l, 'Hình hộp chữ nhật có 3 cặp mặt đối diện bằng nhau, mỗi kích thước có đúng 2 mặt.'));
};
const cubeFace: T5Template = (r, c, l) => {
  const a = c.decimal && r.chance(0.5) ? rd(r, 1, 9, 1) : r.int(2, 30);
  return Q.blanks(`Một hình lập phương có diện tích xung quanh ${d(a * a * 4)} dm². Tính diện tích một mặt và diện tích toàn phần.`, ['Một mặt: {} dm²', 'Toàn phần: {} dm²'], [[da(a * a), da(a * a * 6)]],
    M('T5.HH.03', 'TOAN.HINH', 'mat_tu_sxq', l, `Một mặt: ${d(a * a * 4)} : 4 = ${d(a * a)} dm²; toàn phần: ${d(a * a)} × 6 = ${d(a * a * 6)} dm².`));
};
const cubeOpenBox: T5Template = (r, c, l) => {
  const a = c.decimal && r.chance(0.6) ? rd(r, 1, 6, 1) : r.int(2, 20);
  return Q.blanks(`Người ta làm một cái hộp không nắp hình lập phương cạnh ${d(a)} dm. Tính diện tích bìa cần dùng (không tính mép dán).`, ['{} dm²'], [[da(a * a * 5)]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'hop_lp_khong_nap', l, `Hộp không nắp có 5 mặt: ${d(a)} × ${d(a)} × 5 = ${d(a * a * 5)} dm².`));
};
const cubeTank: T5Template = (r, c, l) => {
  const a = r.int(5, 20), fill = r.pick([50, 75, 80, 60]);
  const V = a * a * a;
  return Q.blanks(`Một bể nước hình lập phương cạnh ${a} dm đang chứa nước đến ${fill}% thể tích bể. Trong bể có bao nhiêu lít nước?`, ['{} l'], [[da(V * fill / 100)]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'be_lp_lit', l, `Thể tích bể: ${a} × ${a} × ${a} = ${f(V)} dm³ = ${f(V)} l; ${fill}% là ${d(V * fill / 100)} l.`));
};
const fracRoadWord: T5Template = (r, c, l) => {
  const b1 = r.int(3, 7), b2 = r.int(3, 7);
  if (b1 === b2) return null;
  const m = lcm(b1, b2), done = m / b1 + m / b2;
  if (done >= m) return null;
  return Q.sc(`Một người đi bộ: giờ đầu đi được ${fr(1, b1)} quãng đường, giờ thứ hai đi được ${fr(1, b2)} quãng đường. Người đó còn phải đi bao nhiêu phần quãng đường nữa?`,
    r.shuffle([...new Set([frR(m - done, m), frR(done, m), frR(m - done + 1, m), fr(b1 + b2 - 2, b1 + b2)])]), frR(m - done, m),
    M('T5.TD.01', 'TOAN.LOIVAN', 'ps_quang_duong', l, `Đã đi: ${fr(1, b1)} + ${fr(1, b2)} = ${frR(done, m)}; còn lại: 1 ${MINUS} ${frR(done, m)} = ${frR(m - done, m)}.`));
};
const speedFromTimes: T5Template = (r, c, l) => {
  const start = r.int(6, 10) * 60 + r.pick([0, 15, 30, 45]), t = r.pick([1.5, 2, 2.5, 3]), v = r.int(20, 55);
  const end = start + t * 60;
  return Q.blanks(`Một xe máy đi từ A lúc ${hm(start)} và đến B lúc ${hm(end)}. Quãng đường AB dài ${d(v * t)} km. Tính vận tốc của xe máy.`, ['{} km/giờ'], [[v]],
    M('T5.TD.02', 'TOAN.LOIVAN', 'van_toc_tu_gio', l, `Thời gian đi: ${hm(end)} ${MINUS} ${hm(start)} = ${hm(t * 60)} = ${d(t)} giờ; v = ${d(v * t)} : ${d(t)} = ${v} km/giờ.`));
};
const speedMs: T5Template = (r, c, l) => {
  const v = r.pick([36, 54, 72, 18, 90, 108]);
  return Q.blanks(`Đổi vận tốc: ${v} km/giờ = ? m/giây`, ['{} m/giây'], [[v / 3.6]],
    M('T5.TD.02', 'TOAN.DOLUONG', 'doi_van_toc_giay', l, `${v} km = ${f(v * 1000)} m; 1 giờ = 3600 giây; ${f(v * 1000)} : 3600 = ${v / 3.6} (m/giây).`));
};

// =========================================================================== GOM THEO MẢNG KIẾN THỨC
type LvMap = Partial<Record<Level, T5Template[]>>;
const T: Record<T5Topic, LvMap> = {
  natRev: { 1: [natRead, natPlace], 2: [natCmp, natPlace], 3: [natOrder, natRound], 4: [natRound, natOrder], 5: [natMake] },
  natOps: { 1: [natCalc], 2: [natExpr, natCalc], 3: [natSmart, natExpr], 4: [natFindX, natSmart], 5: [natWord] },
  fracRev: { 1: [fracReduce], 2: [fracCmp, fracReduce], 3: [fracCommonD, fracCmp], 4: [fracOrder, fracCommonD], 5: [fracOrder] },
  decFrac: { 1: [decFracPick], 2: [toDecFrac, decFracPick], 3: [decFracMc, toDecFrac], 4: [toDecFracRed], 5: [decFracWord] },
  fracOps: { 1: [fracAddSame], 2: [fracMulPick, fracAddSame], 3: [fracDivPick, fracMulPick], 4: [fracExpr], 5: [fracRestWord] },
  fracAddDiff: { 1: [fracAddDiffPick], 2: [fracAddDiffPick], 3: [fracAddDiffPick, fracFindX], 4: [fracFindX, fracRoadWord], 5: [fracTankWord, fracRoadWord] },
  mixed: { 1: [mixedRead], 2: [mixedToFrac], 3: [fracToMixed, mixedToFrac], 4: [mixedCmp], 5: [mixedWord] },
  geoRev: { 1: [rectArea], 2: [lenConvert, rectArea], 3: [lenConvert, rectArea], 4: [rectFromPerim, G5.sq], 5: [gardenPath, G5.sq] },
  decConcept: { 1: [decWrite, decParts], 2: [decDigitPlace, decWrite], 3: [fracToDec, decDigitPlace], 4: [decToFrac, fracToDec], 5: [decCompose] },
  decCompare: { 1: [decCmp], 2: [decMax, decCmp], 3: [decOrder], 4: [decEqualMc, decOrder], 5: [decBetween] },
  decMeasure: { 1: [decMeasureLen], 2: [decMeasureSmall, decMeasureLen], 3: [decMeasureRev, decMeasureSmall], 4: [decMeasureCmp], 5: [decMeasureCmp, decMeasureRev] },
  decRound: { 1: [decRoundT], 2: [decRoundT], 3: [decRoundT], 4: [decRoundMc], 5: [decRoundWord] },
  kmHa: { 1: [haConv], 2: [haConv, haDecimal], 3: [areaCmp, haDecimal], 4: [areaCmp, fieldHa], 5: [fieldHa, haDecimal] },
  areaUnits: { 1: [areaAdj], 2: [areaAdj, areaMixed], 3: [areaMixed, areaDecimal], 4: [areaDecimal, areaOrder], 5: [areaOrder] },
  decAdd: { 1: [decAddCalc], 2: [decAdd3, decAddCalc], 3: [decAddWord, decAdd3], 4: [decFindX], 5: [decPerimTri, decAddWord] },
  decSub: { 1: [decSubCalc], 2: [decSub2, decSubCalc], 3: [decSubWord], 4: [decFindX], 5: [decSubWord, decSub2] },
  decMul: { 1: [decMulNat], 2: [decMulDec, decMulNat], 3: [decMulWord, decMulDec], 4: [decMulSmart], 5: [decRectArea] },
  decDiv: { 1: [decDivNat], 2: [natDivDec, decDivNat], 3: [decDivDec, natDivDec], 4: [decDivWord], 5: [decAverage, decDivWord] },
  decPow10: { 1: [pow10Mul], 2: [pow10Div, pow10Mul], 3: [pow01], 4: [pow01, pow10Equal], 5: [pow10Equal] },
  triangle: { 1: [triArea], 2: [triRight, triArea], 3: [triHeight, triRight], 4: [triInRect, triHeight, G5.tri], 5: [triKind, G5.tri, G5.diagMid] },
  trapezoid: { 1: [trapArea], 2: [trapArea], 3: [trapHeight], 4: [trapWord, trapHeight, G5.trap], 5: [trapSides, G5.trap, G5.tri] },
  circle: { 1: [circC], 2: [circS, circC], 3: [circFromC, circS], 4: [wheelWord, circFromC, halfCircle], 5: [circShade, circRing, halfCircle] },
  ratio: { 1: [ratioPick], 2: [ratioPct, ratioPick], 3: [ratioWhole, ratioPct], 4: [ratioOfPart, ratioWhole], 5: [ratioOfPart] },
  mapScale: { 1: [mapReal], 2: [mapReal, mapDraw], 3: [mapDraw, mapReal], 4: [mapArea, mapDraw], 5: [mapArea] },
  sumRatio: { 1: [sumRatioT], 2: [sumRatioT], 3: [sumRatioWord, sumRatioT], 4: [sumRatioRect, sumRatioWord], 5: [sumRatioAge, sumRatioRect] },
  diffRatio: { 1: [diffRatioT], 2: [diffRatioT], 3: [diffRatioWord, diffRatioT], 4: [diffRatioWord], 5: [diffRatioAge] },
  pctOf: { 1: [pctOfT], 2: [pctDecimal, pctOfT], 3: [pctOfWord, pctDecimal], 4: [pctPlan, pctOfWord], 5: [pctProfit, pctPlan] },
  pctValue: { 1: [pctValueT], 2: [pctValueT, pctValueWord], 3: [pctValueWord, pctDiscount], 4: [pctDiscount, pctSavings], 5: [pctFindWhole, pctSavings] },
  volume: { 1: [volCubes], 2: [volCompare, volCubes], 3: [volCubes, volCompare], 4: [volCubes], 5: [volLiter] },
  volUnits: { 1: [volConv], 2: [volConv, volDec], 3: [volDec, volCmpT], 4: [volCmpT, volDec], 5: [volLiter] },
  net: { 1: [netPick, edgeSum], 2: [netCount, edgeSum, netFaces], 3: [netFacts, netFaces], 4: [netFacts, edgeSum], 5: [netPaint, netFaces] },
  boxArea: { 1: [boxSxq], 2: [boxSxq], 3: [boxSxq], 4: [boxOpen], 5: [roomPaint, boxOpen] },
  cubeArea: { 1: [cubeS, edgeSum], 2: [cubeS, cubeFace], 3: [cubeEdge, cubeS, cubeFace], 4: [cubeScale, cubeEdge, cubeOpenBox], 5: [cubeOpenBox, cubeScale] },
  boxVol: { 1: [boxV], 2: [boxV], 3: [boxHeight, boxV], 4: [volLiter, boxHeight], 5: [waterRise] },
  cubeVol: { 1: [cubeV], 2: [cubeV], 3: [cubeFromV, cubeV], 4: [cubeScale, cubeFromV, cubeTank], 5: [cubeVsBox, cubeTank] },
  timeUnits: { 1: [timeConv], 2: [timeDecHour, timeConv], 3: [centuryT, timeDecHour], 4: [monthDays, centuryT], 5: [centuryT, monthDays] },
  timeAddSub: { 1: [timeAdd], 2: [timeSub, timeAdd], 3: [timeWord, timeSub], 4: [timeElapsed, timeWord], 5: [timeElapsed] },
  timeMulDiv: { 1: [timeMul], 2: [timeDiv, timeMul], 3: [timeMulWord, timeDiv], 4: [timeMulWord], 5: [timeMulWord, timeDiv] },
  speed: { 1: [speedT], 2: [speedMin, speedT], 3: [speedHalf, speedMin], 4: [speedConv, speedHalf], 5: [speedConv, speedFromTimes, speedMs] },
  distTime: { 1: [distT], 2: [timeT, distT], 3: [timeT, distT], 4: [meetT, chaseT], 5: [arriveT, meetT, chaseT] },
  dataSort: { 1: [dataMax], 2: [dataAvg, dataMax], 3: [dataRange, dataAvg], 4: [dataSortT, dataRange], 5: [dataAboveAvg] },
  pieChart: { 1: [pieMost], 2: [pieMissing, pieMost], 3: [pieCount, pieMissing], 4: [pieDiff, pieCount], 5: [pieTotal] },
  eventRatio: { 1: [coinRatio], 2: [eventPct, coinRatio], 3: [eventComplement, eventPct], 4: [eventComplement], 5: [eventCompare] },
};

const retry = (t: T5Template): T5Template => (r, c, l) => {
  for (let i = 0; i < 15; i++) {
    const q = t(r, c, l);
    if (q) return q;
  }
  return null;
};
const RETRIED = new Map<T5Template, T5Template>();
const wrap = (t: T5Template) => RETRIED.get(t) ?? (RETRIED.set(t, retry(t)), RETRIED.get(t)!);

export function t5Pool(topics: T5Topic[]): T5Pool {
  const pool: T5Pool = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const t of topics) for (const lv of [1, 2, 3, 4, 5] as Level[]) for (const fn of T[t][lv] ?? []) if (!pool[lv].includes(wrap(fn))) pool[lv].push(wrap(fn));
  return pool;
}

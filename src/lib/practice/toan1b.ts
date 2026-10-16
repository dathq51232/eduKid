// BỘ SINH BÀI LUYỆN TẬP NGẪU NHIÊN — TOÁN 1, HỌC KÌ 2 (bám trình tự Kết nối tri thức, Toán 1 tập hai, Bài 21–41).
//
// Dạng bài tham khảo cách ra bài của sách giáo khoa và vở bài tập Toán 1 tập hai (que tính chục – đơn vị, bảng các số
// từ 1 đến 100, so sánh và xếp thứ tự số, đo độ dài bằng thước xăng-ti-mét, đặt tính cộng – trừ không nhớ, xem giờ đúng,
// các ngày trong tuần, tờ lịch...). Mọi số, tranh và câu chữ đều sinh ngẫu nhiên theo seed — không chép bài của sách.
//
// Quy tắc "không vượt trước" (kiểm tra tự động: npm run check:practice):
//   - Bài 21–22: số đến 99; từ Bài 23: số đến 100.
//   - Trước Bài 29 chỉ có phép tính trong phạm vi 10 (đã học ở học kì 1).
//   - Bài 29: cộng số có hai chữ số với số có một chữ số; Bài 30: cộng hai số có hai chữ số;
//     Bài 31: thêm trừ cho số có một chữ số; từ Bài 32: cộng, trừ trong phạm vi 100.
//   - Mọi phép cộng, trừ đều KHÔNG NHỚ (lớp 1 chưa học cộng, trừ có nhớ).

import type { Level } from '../content/types';
import type { Figure } from '../figures';
import { KIDS, Q, STUFF, numOptions, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';

/** Phạm vi của bài học kì 2 */
export type Pt2 = 'none' | 'add1' | 'add' | 'sub1' | 'all';
export type Ctx2 = { lesson: number; max: number; pt2: Pt2 };
export type Template2 = (r: Rng, c: Ctx2, l: Level) => PracticeQuestion | null;

// Câu L3 trở lên luôn có lời giải; mẫu nào chưa viết lời giải riêng thì dùng nhận xét (đã đủ các bước)
const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s: s ?? (l >= 3 ? e : undefined) });
const MINUS = '−';
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Bảng Đúng/Sai: phải có cả nhận định đúng và sai */
function mixRows(r: Rng, rows: [string, boolean][]): [string, boolean][] | null {
  if (rows.length < 3) return null;
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return r.shuffle(rows);
}

// ===========================================================================
// SỐ VÀ CÁCH ĐỌC SỐ
// ===========================================================================
const UNIT_WORD = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

/** Cách đọc số từ 0 đến 100: 21 → "hai mươi mốt", 15 → "mười lăm", 34 → "ba mươi tư" */
export function readVi(n: number): string {
  if (n === 100) return 'một trăm';
  if (n <= 10) return n === 10 ? 'mười' : UNIT_WORD[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  const head = t === 1 ? 'mười' : `${UNIT_WORD[t]} mươi`;
  if (u === 0) return head;
  const tail = u === 5 ? 'lăm' : u === 1 && t > 1 ? 'mốt' : u === 4 && t > 1 ? 'tư' : UNIT_WORD[u];
  return `${head} ${tail}`;
}

const tensFig = (n: number): Figure => ({
  kind: 'tens', tens: Math.floor(n / 10), ones: n % 10,
  alt: `${Math.floor(n / 10)} bó que tính, mỗi bó một chục, và ${n % 10} que tính lẻ`,
});
const seqFig = (cells: string[]): Figure => ({ kind: 'sequence', cells, alt: `Dãy số: ${cells.join(', ')}` });

/** Số có hai chữ số (giới hạn theo bài) */
const twoDigit = (r: Rng, c: Ctx2) => r.int(11, Math.min(99, c.max));

// --- Bài 21: Số có hai chữ số -------------------------------------------------
const tensCount: Template2 = (r, c, l) => {
  const n = twoDigit(r, c);
  const rev = (n % 10) * 10 + Math.floor(n / 10);
  const opts = new Set<number>([n, n + 1 <= 99 ? n + 1 : n - 2, n - 1, n % 10 ? rev : n + 10 <= 99 ? n + 10 : n - 10]);
  if (opts.size < 4 || [...opts].some((x) => x < 10 || x > 99)) return null;
  return Q.sc('Có tất cả bao nhiêu que tính?', [...opts].sort((a, b) => a - b).map(String), String(n),
    M('T1.SO.05', 'TOAN.DEM', 'chuc_don_vi', l, `Có ${Math.floor(n / 10)} chục que tính và ${n % 10} que tính lẻ: ${n} que tính.`),
    { figure: tensFig(n) });
};

const tensOnesBlank: Template2 = (r, c, l) => {
  const n = twoDigit(r, c);
  return Q.blanks('Viết số thích hợp vào ô trống.', [`${n} gồm {} chục và {} đơn vị.`], [[Math.floor(n / 10), n % 10]],
    M('T1.SO.05', 'TOAN.DOCVIET', 'chuc_don_vi', l, `${n}: chữ số ${Math.floor(n / 10)} chỉ số chục, chữ số ${n % 10} chỉ số đơn vị.`));
};

const composeBlank: Template2 = (r, c, l) => {
  const t = r.int(1, 9);
  const u = r.int(0, 9);
  const n = t * 10 + u;
  if (n > c.max) return null;
  return Q.blanks('Viết số thích hợp vào ô trống.', [`Số gồm ${t} chục và ${u} đơn vị là: {}`], [[n]],
    M('T1.SO.05', 'TOAN.DOCVIET', 'chuc_don_vi', l, `${t} chục và ${u} đơn vị viết là ${n}.`), { figure: tensFig(n) });
};

const readNum: Template2 = (r, c, l) => {
  const n = twoDigit(r, c);
  if (n % 10 === Math.floor(n / 10)) return null;
  const rev = (n % 10) * 10 + Math.floor(n / 10);
  const others = [rev >= 10 ? rev : n + 10, n + 1 <= 99 ? n + 1 : n - 1].filter((x) => x !== n && x <= 99);
  const opts = r.shuffle([...new Set([n, ...others])].map(readVi));
  if (opts.length < 3) return null;
  return Q.sc(`Số ${n} đọc là:`, opts, readVi(n),
    M('T1.SO.04', 'TOAN.DOCVIET', 'doc_so', l, `${n} đọc là "${readVi(n)}".`));
};

const writeNum: Template2 = (r, c, l) => {
  const n = twoDigit(r, c);
  return Q.blanks('Viết số.', [`"${cap(readVi(n))}" viết là: {}`], [[n]],
    M('T1.SO.04', 'TOAN.DOCVIET', 'doc_so', l, `"${readVi(n)}" viết là ${n}.`,
      `"${cap(readVi(n))}": có ${Math.floor(n / 10)} chục và ${n % 10} đơn vị, nên viết chữ số ${Math.floor(n / 10)} trước, chữ số ${n % 10} sau: ${n}.`));
};

const seqHoles: Template2 = (r, c, l) => {
  const len = 7;
  const start = r.int(10, c.max - len + 1);
  const seq = Array.from({ length: len }, (_, i) => start + i);
  const holes = r.sample([1, 2, 3, 4, 5, 6], 3).sort((a, b) => a - b);
  const cells = seq.map((x, i) => (holes.includes(i) ? '?' : String(x)));
  return Q.blanks('Số còn thiếu trong dãy là số nào? Viết theo thứ tự từ trái sang phải.', ['{}  {}  {}'], [holes.map((i) => seq[i])],
    M('T1.SO.04', 'TOAN.SOTHIEU', 'thu_tu_so', l, `Đếm thêm 1: ${seq.join(', ')}.`,
      `Mỗi số liền sau hơn số liền trước 1 đơn vị. Đếm tiếp từ ${start}: ${seq.join(', ')}. Các số còn thiếu: ${holes.map((i) => seq[i]).join(', ')}.`),
    { figure: seqFig(cells) });
};

const roundTens: Template2 = (r, c, l) => {
  const tens = r.sample([10, 20, 30, 40, 50, 60, 70, 80, 90], r.int(2, 3));
  const others = r.sample([...Array(89).keys()].map((i) => i + 11).filter((x) => x % 10 !== 0 && x <= c.max), 5 - tens.length);
  const opts = r.shuffle([...tens, ...others]).map(String);
  return Q.mc('Chọn tất cả các số tròn chục.', opts, tens.map(String),
    M('T1.SO.05', 'TOAN.DOCVIET', 'tron_chuc', l, `Số tròn chục có chữ số hàng đơn vị là 0: ${tens.sort((a, b) => a - b).join(', ')}.`,
      `Số tròn chục là số có 0 đơn vị (10, 20, 30, …, 90). Trong các số đã cho, số tròn chục là: ${tens.join(', ')}.`));
};

const tensBond: Template2 = (r, c, l) => {
  const n = twoDigit(r, c);
  if (n % 10 === 0) return null;
  const t = Math.floor(n / 10) * 10;
  const askTens = r.chance(0.5);
  return Q.blanks(`Tách số ${n} thành số tròn chục và số đơn vị. Số còn thiếu là số nào?`, ['Số còn thiếu: {}'], [[askTens ? t : n % 10]],
    M('T1.SO.05', 'TOAN.SOTHIEU', 'chuc_don_vi', l, `${n} gồm ${t} và ${n % 10}.`,
      `${n} gồm ${Math.floor(n / 10)} chục và ${n % 10} đơn vị, tức là gồm số tròn chục ${t} và ${n % 10}.`),
    { figure: { kind: 'bond', whole: String(n), parts: askTens ? ['?', String(n % 10)] : [String(t), '?'], alt: `Sơ đồ tách số ${n}` } });
};

const matchRead: Template2 = (r, c, l) => {
  const ns = r.sample([...Array(89).keys()].map((i) => i + 11).filter((x) => x <= c.max), 3);
  return Q.mt('Ghép mỗi số với cách đọc đúng.', ns.map((n) => [String(n), cap(readVi(n))] as [string, string]),
    M('T1.SO.04', 'TOAN.DOCVIET', 'doc_so', l, ns.map((n) => `${n}: ${readVi(n)}`).join('; ') + '.',
      'Đọc số chục trước rồi đến số đơn vị. Chú ý: 1 đơn vị (từ 21) đọc là "mốt", 4 đơn vị (từ 24) có thể đọc là "tư", 5 đơn vị đọc là "lăm".'));
};

const stepSeq: Template2 = (r, c, l) => {
  const step = r.pick([10, 2, 5]);
  const len = 6;
  const startMax = c.max - step * (len - 1);
  let start = step === 10 ? r.int(1, Math.min(9, startMax)) * (r.chance(0.5) ? 10 : 1) : r.int(1, startMax);
  if (step === 10 && start > startMax) start = r.int(1, startMax);
  const seq = Array.from({ length: len }, (_, i) => start + i * step);
  if (seq[len - 1] > c.max) return null;
  const holes = r.sample([2, 3, 4, 5], 2).sort((a, b) => a - b);
  const cells = seq.map((x, i) => (holes.includes(i) ? '?' : String(x)));
  return Q.blanks('Tìm quy luật rồi viết số còn thiếu (theo thứ tự từ trái sang phải).', ['{}  {}'], [holes.map((i) => seq[i])],
    M('T1.SO.04', 'TOAN.SOTHIEU', 'day_so_quy_luat', l, `Mỗi số hơn số trước ${step} đơn vị: ${seq.join(', ')}.`,
      `So sánh hai số đứng cạnh nhau: ${seq[0]} rồi ${seq[1]}, mỗi lần thêm ${step}. Đếm thêm ${step}: ${seq.join(', ')}.`),
    { figure: seqFig(cells) });
};

const digitsFacts: Template2 = (r, c, l) => {
  const ns = r.sample([...Array(89).keys()].map((i) => i + 11).filter((x) => x <= c.max && x % 10 !== Math.floor(x / 10)), 4);
  const rows: [string, boolean][] = ns.map((n) => {
    const t = Math.floor(n / 10), u = n % 10;
    return r.chance(0.5) ? [`${n} gồm ${t} chục và ${u} đơn vị.`, true] : [`${n} gồm ${u} chục và ${t} đơn vị.`, u === t];
  });
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.SO.05', 'TOAN.DUNGSAI', 'chuc_don_vi', l, 'Chữ số bên trái chỉ số chục, chữ số bên phải chỉ số đơn vị.',
      `Kiểm tra từng câu: ${ns.map((n) => `${n} gồm ${Math.floor(n / 10)} chục và ${n % 10} đơn vị`).join('; ')}.`));
};

const makeNumbers: Template2 = (r, c, l) => {
  const withZero = r.chance(0.5);
  const ds = withZero ? [0, ...r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 2)] : r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
  const valid = new Set<number>();
  for (const a of ds) for (const b of ds) if (a !== b && a !== 0) valid.add(a * 10 + b);
  const wrong = new Set<number>();
  for (const a of ds) wrong.add(a * 11); // dùng một thẻ hai lần
  const pool = [...valid].filter((x) => x <= c.max);
  const right = r.sample(pool, Math.min(3, pool.length));
  const bad = r.sample([...wrong].filter((x) => x >= 11 && x <= c.max), 2);
  if (right.length < 2 || bad.length < 1) return null;
  const opts = r.shuffle([...right, ...bad]).map(String);
  return Q.mc(`Có ba tấm thẻ số ${ds.join(', ')}. Ghép hai trong ba tấm thẻ (mỗi tấm dùng một lần) để được số có hai chữ số. Chọn tất cả các số ghép được.`,
    opts, right.map(String),
    M('T1.SO.04', 'TOAN.DOCVIET', 'lap_so', l, `Ghép được: ${right.join(', ')}.`,
      `Mỗi tấm thẻ chỉ dùng một lần${withZero ? ', và thẻ 0 không đứng đầu' : ''}, nên ${bad.join(', ')} không ghép được (phải dùng một thẻ hai lần). Các số ghép được: ${right.join(', ')}.`));
};

// --- Bài 22: So sánh số có hai chữ số ------------------------------------------
const signOf = (a: number, b: number) => (a > b ? '>' : a < b ? '<' : '=');
const whyCompare = (a: number, b: number) => {
  const ta = Math.floor(a / 10), tb = Math.floor(b / 10);
  if (a === b) return `${a} = ${b}.`;
  if (ta !== tb) return `${a} có ${ta} chục, ${b} có ${tb} chục; ${Math.max(ta, tb)} chục nhiều hơn, nên ${a} ${signOf(a, b)} ${b}.`;
  return `Cùng ${ta} chục; so sánh đơn vị: ${a % 10} và ${b % 10}, nên ${a} ${signOf(a, b)} ${b}.`;
};

const signPick2: Template2 = (r, c, l) => {
  const a = twoDigit(r, c);
  const kind = r.pick(['tens', 'units', 'eq', 'rev'] as const);
  let b: number;
  if (kind === 'eq') b = a;
  else if (kind === 'rev') b = (a % 10) * 10 + Math.floor(a / 10);
  else if (kind === 'units') b = Math.floor(a / 10) * 10 + r.int(0, 9);
  else b = r.int(1, 9) * 10 + (a % 10);
  if (b < 10 || b > c.max || (kind !== 'eq' && a === b)) return null;
  return Q.sc(`Chọn dấu thích hợp: ${a} ... ${b}`, ['>', '<', '='], signOf(a, b),
    M('T1.SO.06', 'TOAN.SOSANH', 'so_sanh_100', l, whyCompare(a, b)));
};

const pickBiggerPair: Template2 = (r, c, l) => {
  const a = twoDigit(r, c);
  const b = r.chance(0.5) ? (a % 10) * 10 + Math.floor(a / 10) : twoDigit(r, c);
  if (a === b || b < 10) return null;
  const big = r.chance(0.5);
  const ans = big ? Math.max(a, b) : Math.min(a, b);
  return Q.sc(`Số nào ${big ? 'lớn hơn' : 'bé hơn'}?`, [String(a), String(b)], String(ans),
    M('T1.SO.06', 'TOAN.SOSANH', 'so_sanh_100', l, whyCompare(a, b)));
};

const distinctTwoDigit = (r: Rng, c: Ctx2, n: number) => {
  const xs = new Set<number>();
  for (let g = 0; xs.size < n && g < 50; g++) xs.add(twoDigit(r, c));
  return [...xs];
};

const biggestOf: Template2 = (r, c, l) => {
  const xs = distinctTwoDigit(r, c, r.int(3, 4));
  if (xs.length < 3) return null;
  const big = r.chance(0.5);
  const ans = big ? Math.max(...xs) : Math.min(...xs);
  return Q.sc(`Số nào ${big ? 'lớn nhất' : 'bé nhất'}?`, xs.map(String), String(ans),
    M('T1.SO.06', 'TOAN.SOSANH', 'lon_nhat_be_nhat', l, `So sánh số chục trước, rồi đến số đơn vị: số ${big ? 'lớn nhất' : 'bé nhất'} là ${ans}.`));
};

const orderNums: Template2 = (r, c, l) => {
  const xs = distinctTwoDigit(r, c, 4);
  if (xs.length < 4) return null;
  const asc = r.chance(0.5);
  const sorted = [...xs].sort((a, b) => (asc ? a - b : b - a));
  return Q.ord(`Xếp các số theo thứ tự từ ${asc ? 'bé đến lớn' : 'lớn đến bé'}.`, sorted.map(String),
    M('T1.SO.06', 'TOAN.SAPXEP', 'sap_xep_100', l, sorted.join(', ') + '.',
      `So sánh từng cặp số (số chục trước, số đơn vị sau) rồi xếp: ${sorted.join(asc ? ' < ' : ' > ')}.`));
};

const signTable: Template2 = (r, c, l) => {
  const rows: [string, boolean][] = [];
  for (let i = 0; i < 4; i++) {
    const a = twoDigit(r, c);
    const b = r.chance(0.5) ? (a % 10) * 10 + Math.floor(a / 10) : Math.floor(a / 10) * 10 + r.int(0, 9);
    if (b < 10) return null;
    const truth = r.chance(0.5);
    const real = signOf(a, b);
    const shown = truth ? real : r.pick(['>', '<', '='].filter((s) => s !== real));
    rows.push([`${a} ${shown} ${b}`, shown === real]);
  }
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.SO.06', 'TOAN.DUNGSAI', 'so_sanh_100', l, 'So sánh số chục trước; nếu số chục bằng nhau thì so sánh số đơn vị.',
      'Với mỗi dòng, so sánh hai số: số nào nhiều chục hơn thì lớn hơn; cùng số chục thì số nào nhiều đơn vị hơn thì lớn hơn. Dấu đúng mới chọn Đ.'));
};

const compareWord: Template2 = (r, c, l) => {
  const names = ['1A', '1B', '1C'];
  const xs = new Set<number>();
  for (let g = 0; xs.size < 3 && g < 30; g++) xs.add(r.int(25, 40));
  if (xs.size < 3) return null;
  const v = [...xs];
  const most = r.chance(0.5);
  const ans = names[v.indexOf(most ? Math.max(...v) : Math.min(...v))];
  return Q.sc(`Lớp 1A có ${v[0]} học sinh, lớp 1B có ${v[1]} học sinh, lớp 1C có ${v[2]} học sinh. Lớp nào có ${most ? 'nhiều' : 'ít'} học sinh nhất?`,
    names.map((n) => `Lớp ${n}`), `Lớp ${ans}`,
    M('T1.SO.06', 'TOAN.SOSANH', 'lon_nhat_be_nhat', l, `Số ${most ? 'lớn nhất' : 'bé nhất'} là ${most ? Math.max(...v) : Math.min(...v)}: lớp ${ans}.`,
      `So sánh ba số ${v.join(', ')}: số ${most ? 'lớn nhất' : 'bé nhất'} là ${most ? Math.max(...v) : Math.min(...v)}, đó là số học sinh của lớp ${ans}.`));
};

const betweenNums: Template2 = (r, c, l) => {
  const a = r.int(11, Math.min(85, c.max - 8));
  const b = a + r.int(4, 7);
  const inside = r.sample([...Array(b - a - 1).keys()].map((i) => a + 1 + i), 2);
  const outside = r.sample([a, b, a - 1, b + 1, b + 3].filter((x) => x >= 10 && x <= c.max), 3);
  const opts = r.shuffle([...inside, ...outside]).map(String);
  return Q.mc(`Chọn tất cả các số lớn hơn ${a} và bé hơn ${b}.`, opts, inside.map(String),
    M('T1.SO.06', 'TOAN.SOSANH', 'so_sanh_100', l, `Các số lớn hơn ${a} và bé hơn ${b}: từ ${a + 1} đến ${b - 1}.`,
      `Số phải đứng sau ${a} và đứng trước ${b} khi đếm. ${a} và ${b} không được chọn vì không lớn hơn ${a} hoặc không bé hơn ${b}.`));
};

// --- Bài 23: Bảng các số từ 1 đến 100 ------------------------------------------
const neighbor: Template2 = (r, c, l) => {
  const n = r.int(11, c.max - 1);
  const after = r.chance(0.5);
  const ans = after ? n + 1 : n - 1;
  return Q.sc(`Số đứng ngay ${after ? 'sau' : 'trước'} số ${n} là số nào?`, numOptions(r, ans, 10, c.max), String(ans),
    M('T1.SO.04', 'TOAN.DOCVIET', 'thu_tu_so', l, `Đếm: ${n - 1}, ${n}, ${n + 1}. Số đứng ngay ${after ? 'sau' : 'trước'} ${n} là ${ans}.`));
};

const HUNDRED_FACTS: [string, string, string[], string][] = [
  ['99 thêm 1 là số nào?', '100', ['90', '98', '100', '101'], '99 thêm 1 là 100.'],
  ['Số 100 gồm mấy chục?', '10 chục', ['1 chục', '10 chục', '100 chục'], '100 gồm 10 chục.'],
  ['Số lớn nhất có hai chữ số là số nào?', '99', ['90', '98', '99', '100'], 'Số lớn nhất có hai chữ số là 99.'],
  ['Số bé nhất có hai chữ số là số nào?', '10', ['10', '11', '1', '20'], 'Số bé nhất có hai chữ số là 10.'],
  ['Số 100 đọc là:', 'một trăm', ['mười', 'một trăm', 'một mươi'], '100 đọc là "một trăm".'],
  ['Số tròn chục lớn nhất bé hơn 100 là số nào?', '90', ['80', '90', '99'], 'Các số tròn chục: 10, 20, …, 90. Số lớn nhất là 90.'],
];
const hundredFacts: Template2 = (r, _c, l) => {
  const [p, ans, opts, e] = r.pick(HUNDRED_FACTS);
  return Q.sc(p, opts.filter((o) => !/^\d+$/.test(o) || Number(o) <= 100), ans, M('T1.SO.04', 'TOAN.DOCVIET', 'so_100', l, e));
};

const hundredRow: Template2 = (r, _c, l) => {
  const row = r.int(0, 9);
  const seq = Array.from({ length: 10 }, (_, i) => row * 10 + i + 1);
  const holes = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3).sort((a, b) => a - b);
  const cells = seq.map((x, i) => (holes.includes(i) ? '?' : String(x)));
  return Q.blanks('Đây là một hàng của bảng các số từ 1 đến 100. Viết các số còn thiếu (từ trái sang phải).', ['{}  {}  {}'], [holes.map((i) => seq[i])],
    M('T1.SO.04', 'TOAN.SOTHIEU', 'bang_100', l, `Hàng này: ${seq.join(', ')}.`,
      `Trong một hàng, mỗi ô sau hơn ô trước 1. Đếm từ ${seq[0]}: ${seq.join(', ')}.`), { figure: seqFig(cells) });
};

const hundredBelow: Template2 = (r, _c, l) => {
  const n = r.int(11, 89);
  const dir = r.pick(['below', 'above', 'right', 'left'] as const);
  const ans = dir === 'below' ? n + 10 : dir === 'above' ? n - 10 : dir === 'right' ? n + 1 : n - 1;
  if (dir === 'right' && n % 10 === 0) return null;
  if (dir === 'left' && n % 10 === 1) return null;
  const where = { below: 'ngay bên dưới', above: 'ngay bên trên', right: 'ngay bên phải', left: 'ngay bên trái' }[dir];
  return Q.sc(`Trong bảng các số từ 1 đến 100 (mỗi hàng 10 số), số ${where} số ${n} là số nào?`,
    [...new Set([ans, n + 10, n - 10, n + 1, n - 1])].filter((x) => x >= 1 && x <= 100).slice(0, 4).sort((a, b) => a - b).map(String), String(ans),
    M('T1.SO.04', 'TOAN.DOCVIET', 'bang_100', l, `Số ${where} ${n} là ${ans}.`,
      `Trong bảng, đi sang phải thì thêm 1, đi xuống một hàng thì thêm 1 chục (10). Vì thế số ${where} ${n} là ${ans}.`));
};

const sameDigits: Template2 = (r, _c, l) => {
  const same = r.sample([11, 22, 33, 44, 55, 66, 77, 88, 99], r.int(2, 3));
  const other = r.sample([12, 21, 23, 32, 45, 54, 67, 76, 89, 98, 10, 20], 5 - same.length);
  return Q.mc('Chọn tất cả các số có hai chữ số giống nhau.', r.shuffle([...same, ...other]).map(String), same.map(String),
    M('T1.SO.04', 'TOAN.DOCVIET', 'bang_100', l, `Số có hai chữ số giống nhau: ${same.sort((a, b) => a - b).join(', ')}.`,
      'Số có hai chữ số giống nhau là số có chữ số hàng chục bằng chữ số hàng đơn vị, như 11, 22, 33.'));
};

// ===========================================================================
// ĐỘ DÀI VÀ ĐO ĐỘ DÀI
// ===========================================================================
const BAR_COLORS = ['#ff9f8f', '#7fb3ff', '#7ed3a8', '#f7c948', '#c7a6ff'];
const STRIP = ['A', 'B', 'C', 'D'];
const barsFig = (lens: number[], ruler: boolean, max = Math.max(...lens) + 1): Figure => ({
  kind: 'ruler', ruler, max: Math.max(max, ruler ? 10 : max),
  items: lens.map((len, i) => ({ label: `Băng ${STRIP[i]}`, length: len, color: BAR_COLORS[i] })),
  alt: ruler
    ? `Các băng giấy đặt thẳng từ vạch 0 của thước: ${lens.map((len, i) => `băng ${STRIP[i]} dài đến vạch ${len}`).join(', ')}`
    : `Các băng giấy đặt thẳng một đầu: ${lens.map((len, i) => `băng ${STRIP[i]} dài ${len} ô`).join(', ')}`,
});
const distinctLens = (r: Rng, n: number, lo: number, hi: number) => r.sample([...Array(hi - lo + 1).keys()].map((i) => i + lo), n);

const longerOf2: Template2 = (r, _c, l) => {
  const lens = distinctLens(r, 2, 3, 12);
  const longer = r.chance(0.5);
  const ans = longer ? (lens[0] > lens[1] ? 0 : 1) : lens[0] < lens[1] ? 0 : 1;
  return Q.sc(`Băng giấy nào ${longer ? 'dài hơn' : 'ngắn hơn'}?`, ['Băng A', 'Băng B'], `Băng ${STRIP[ans]}`,
    M('T1.HH.05', 'TOAN.DODAI', 'dai_ngan', l, `Hai băng đặt thẳng một đầu; băng ${STRIP[ans]} có đầu kia ${longer ? 'vượt ra xa hơn' : 'ngắn lại hơn'}.`),
    { figure: barsFig(lens, false) });
};

const longestOf3: Template2 = (r, _c, l) => {
  const lens = distinctLens(r, r.int(3, 4), 2, 13);
  const longest = r.chance(0.5);
  const v = longest ? Math.max(...lens) : Math.min(...lens);
  const ans = `Băng ${STRIP[lens.indexOf(v)]}`;
  return Q.sc(`Băng giấy nào ${longest ? 'dài nhất' : 'ngắn nhất'}?`, lens.map((_, i) => `Băng ${STRIP[i]}`), ans,
    M('T1.HH.05', 'TOAN.DODAI', 'dai_ngan', l, `${ans} ${longest ? 'dài nhất' : 'ngắn nhất'}.`),
    { figure: barsFig(lens, false) });
};

const tallerOf: Template2 = (r, _c, l) => {
  const kids = r.sample(KIDS, 3);
  const hs = distinctLens(r, 3, 60, 95);
  const tall = r.chance(0.5);
  const v = tall ? Math.max(...hs) : Math.min(...hs);
  const ans = kids[hs.indexOf(v)];
  return Q.sc(`Ba bạn trồng cây. Cây của ${kids[0]} cao ${hs[0]} cm, cây của ${kids[1]} cao ${hs[1]} cm, cây của ${kids[2]} cao ${hs[2]} cm. Cây của bạn nào ${tall ? 'cao nhất' : 'thấp nhất'}?`,
    kids, ans,
    M('T1.HH.05', 'TOAN.DODAI', 'cao_thap', l, `Số đo ${tall ? 'lớn nhất' : 'bé nhất'} là ${v} cm: cây của ${ans}.`,
      `Cây nào có số đo lớn hơn thì cao hơn. So sánh ${hs.join(', ')}: số ${tall ? 'lớn nhất' : 'bé nhất'} là ${v}, đó là cây của ${ans}.`));
};

const reverseRelation: Template2 = (r, _c, l) => {
  const pairs: [string, string, string, string][] = [
    ['Bút mực dài hơn bút chì.', 'Bút chì … bút mực.', 'ngắn hơn', 'dài hơn'],
    ['Sợi dây đỏ ngắn hơn sợi dây xanh.', 'Sợi dây xanh … sợi dây đỏ.', 'dài hơn', 'ngắn hơn'],
    ['Cây cau cao hơn cây chuối.', 'Cây chuối … cây cau.', 'thấp hơn', 'cao hơn'],
    ['Con hươu cao hơn con ngựa.', 'Con ngựa … con hươu.', 'thấp hơn', 'cao hơn'],
    ['Thước kẻ dài hơn cục tẩy.', 'Cục tẩy … thước kẻ.', 'ngắn hơn', 'dài hơn'],
  ];
  const [fact, ask, ans, wrong] = r.pick(pairs);
  return Q.sc(`${fact} Chọn từ thích hợp: ${ask}`, r.shuffle([ans, wrong, 'bằng']), ans,
    M('T1.HH.05', 'TOAN.DODAI', 'dai_ngan', l, `Nếu vật thứ nhất ${wrong} vật thứ hai thì vật thứ hai ${ans} vật thứ nhất.`,
      `"${fact}" — đổi chỗ hai vật thì phải đổi từ so sánh: vật kia ${ans}.`));
};

const measureRuler: Template2 = (r, _c, l) => {
  const len = r.int(2, 14);
  return Q.blanks('Băng giấy đặt thẳng từ vạch 0 của thước. Băng giấy dài bao nhiêu xăng-ti-mét?', ['Băng giấy dài {} cm.'], [[len]],
    M('T1.HH.05', 'TOAN.DODAI', 'do_cm', l, `Đầu kia của băng giấy ở vạch ${len}: băng dài ${len} cm.`),
    { figure: { kind: 'ruler', ruler: true, max: 15, items: [{ label: 'Băng giấy', length: len, color: '#7fb3ff' }], alt: `Băng giấy đặt thẳng từ vạch 0 của thước, đầu kia ở vạch ${len}` } });
};

const measureCompare: Template2 = (r, _c, l) => {
  const lens = distinctLens(r, 2, 3, 14);
  return Q.blanks('Đo độ dài hai băng giấy bằng thước. Viết số đo vào ô trống.', ['Băng A dài {} cm.', 'Băng B dài {} cm.'], [lens],
    M('T1.HH.06', 'TOAN.DODAI', 'do_cm', l, `Băng A dài ${lens[0]} cm, băng B dài ${lens[1]} cm.`,
      `Cả hai băng đều đặt từ vạch 0. Nhìn đầu kia của mỗi băng đến vạch nào trên thước: băng A đến vạch ${lens[0]}, băng B đến vạch ${lens[1]}. Băng ${lens[0] > lens[1] ? 'A' : 'B'} dài hơn.`),
    { figure: barsFig(lens, true, 15) });
};

const ESTIMATES: [string, string, string[]][] = [
  ['Chiếc bút chì dài khoảng', '15 cm', ['1 cm', '15 cm', '90 cm']],
  ['Cục tẩy dài khoảng', '4 cm', ['4 cm', '40 cm', '80 cm']],
  ['Quyển vở dài khoảng', '24 cm', ['2 cm', '24 cm', '100 cm']],
  ['Cái kẹp giấy dài khoảng', '3 cm', ['3 cm', '30 cm', '60 cm']],
  ['Chiếc thước kẻ của em dài khoảng', '20 cm', ['2 cm', '20 cm', '90 cm']],
  ['Bàn chải đánh răng dài khoảng', '18 cm', ['1 cm', '18 cm', '80 cm']],
  ['Gang tay của em dài khoảng', '10 cm', ['1 cm', '10 cm', '50 cm']],
  ['Chiếc lá bàng dài khoảng', '12 cm', ['1 cm', '12 cm', '70 cm']],
];
const estimateLen: Template2 = (r, _c, l) => {
  const [p, ans, opts] = r.pick(ESTIMATES);
  return Q.sc(`${p}:`, opts, ans,
    M('T1.HH.06', 'TOAN.DODAI', 'uoc_luong', l, `${p} ${ans}.`,
      `Nhớ: 1 cm chỉ bằng bề ngang một đầu ngón tay nhỏ, một gang tay khoảng 10 cm. So với vật thật, số đo hợp lí nhất là ${ans}.`));
};

const UNIT_ESTIMATES: [string, string, string[]][] = [
  ['Bàn học của em cao khoảng', '6 gang tay', ['6 cm', '6 gang tay', '6 bước chân']],
  ['Bảng lớp học dài khoảng', '3 sải tay', ['3 cm', '3 gang tay', '3 sải tay']],
  ['Lớp học dài khoảng', '20 bước chân', ['20 cm', '20 gang tay', '20 bước chân']],
  ['Quyển sách Toán dài khoảng', '3 gang tay', ['3 gang tay', '3 sải tay', '3 bước chân']],
];
const estimateUnit: Template2 = (r, _c, l) => {
  const [p, ans, opts] = r.pick(UNIT_ESTIMATES);
  return Q.sc(`${p}:`, opts, ans,
    M('T1.HH.06', 'TOAN.DODAI', 'uoc_luong', l, `${p} ${ans}.`,
      'Gang tay dùng đo vật nhỏ (sách, bàn), sải tay dùng đo vật dài (bảng), bước chân dùng đo đoạn đường dài (phòng học, sân).'));
};

const longerThanN: Template2 = (r, _c, l) => {
  const lens = distinctLens(r, 3, 3, 14);
  const n = r.int(Math.min(...lens), Math.max(...lens) - 1);
  const right = lens.map((x, i) => (x > n ? `Băng ${STRIP[i]}` : '')).filter(Boolean);
  if (!right.length || right.length === 3) return null;
  return Q.mc(`Chọn tất cả các băng giấy dài hơn ${n} cm.`, lens.map((_, i) => `Băng ${STRIP[i]}`), right,
    M('T1.HH.06', 'TOAN.DODAI', 'do_cm', l, `Băng dài hơn ${n} cm: ${right.join(', ')}.`,
      `Đo từng băng: ${lens.map((x, i) => `băng ${STRIP[i]} dài ${x} cm`).join(', ')}. So với ${n} cm, chọn băng có số đo lớn hơn ${n}.`),
    { figure: barsFig(lens, true, 15) });
};

const informalUnits: Template2 = (r, _c, l) => {
  const things = r.sample(['cái bàn', 'cái ghế', 'cái tủ', 'cái giường', 'tấm thảm'], 2);
  const [a, b] = distinctLens(r, 2, 3, 9);
  const unit = r.pick(['gang tay', 'sải tay']);
  const longer = r.chance(0.5);
  const ans = longer ? (a > b ? things[0] : things[1]) : a < b ? things[0] : things[1];
  return Q.sc(`Em đo bằng ${unit}: ${things[0]} dài ${a} ${unit}, ${things[1]} dài ${b} ${unit}. Đồ vật nào ${longer ? 'dài hơn' : 'ngắn hơn'}?`,
    things.map(cap), cap(ans),
    M('T1.HH.06', 'TOAN.DODAI', 'don_vi_tu_quy_uoc', l, `Cùng đo bằng ${unit}: ${a} ${a > b ? '>' : '<'} ${b}, nên ${ans} ${longer ? 'dài hơn' : 'ngắn hơn'}.`,
      `Hai đồ vật được đo bằng cùng một ${unit} nên so sánh số đo: ${a} và ${b}. Số ${longer ? 'lớn hơn' : 'bé hơn'} ứng với ${ans}.`));
};

const pathCompare: Template2 = (r, _c, l) => {
  const p1 = r.int(1, 5), p2 = r.int(1, 5);
  const total = p1 + p2;
  const other = r.int(Math.max(2, total - 3), Math.min(10, total + 3));
  if (other === total) return null;
  const shorter = total < other ? 'Đường A' : 'Đường B';
  return Q.sc(`Đường A gồm hai đoạn dài ${p1} cm và ${p2} cm. Đường B dài ${other} cm. Đường nào ngắn hơn?`, ['Đường A', 'Đường B'], shorter,
    M('T1.HH.09', 'TOAN.DODAI', 'do_cm', l, `Đường A dài ${p1} + ${p2} = ${total} cm; ${total} ${total < other ? '<' : '>'} ${other}: ${shorter.toLowerCase()} ngắn hơn.`,
      `Tính độ dài đường A: ${p1} + ${p2} = ${total} (cm). So sánh ${total} cm với ${other} cm. Số bé hơn là đường ngắn hơn: ${shorter}.`));
};

const lengthsTable: Template2 = (r, _c, l) => {
  const lens = distinctLens(r, 3, 3, 13);
  const [a, b, c] = lens;
  const rows: [string, boolean][] = [
    [`Băng A dài ${r.chance(0.5) ? a : a + 1} cm.`, false],
    [`Băng ${b > c ? 'B' : 'C'} dài hơn băng ${b > c ? 'C' : 'B'}.`, true],
    [`Băng ${STRIP[lens.indexOf(Math.min(...lens))]} ngắn nhất.`, true],
    [`Băng ${STRIP[lens.indexOf(Math.max(...lens))]} ngắn hơn băng ${STRIP[lens.indexOf(Math.min(...lens))]}.`, false],
  ];
  rows[0][1] = rows[0][0] === `Băng A dài ${a} cm.`;
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Quan sát các băng giấy trên thước. Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.HH.06', 'TOAN.DUNGSAI', 'do_cm', l, `Băng A dài ${a} cm, băng B dài ${b} cm, băng C dài ${c} cm.`,
      `Đọc số đo mỗi băng trên thước: A ${a} cm, B ${b} cm, C ${c} cm. Rồi đối chiếu từng nhận định.`),
    { figure: barsFig(lens, true, 15) });
};

// ===========================================================================
// PHÉP CỘNG, PHÉP TRỪ (KHÔNG NHỚ) TRONG PHẠM VI 100
// ===========================================================================
type Op = '+' | '-';
const PT2_RANK: Record<Pt2, number> = { none: 0, add1: 1, add: 2, sub1: 3, all: 4 };

/** Một phép cộng không nhớ hợp lệ theo bài; big = cho phép cả hai số có hai chữ số */
function addPair(r: Rng, c: Ctx2, big = PT2_RANK[c.pt2] >= 2): [number, number] | null {
  for (let g = 0; g < 30; g++) {
    const two = big && r.chance(0.6);
    const a = r.int(1, 9) * 10 + r.int(0, 8);
    const b = two ? r.int(1, 9) * 10 + r.int(0, 9 - (a % 10)) : r.int(1, 9 - (a % 10));
    if (b < 1 || a + b > 99 || a + b > c.max) continue;
    return r.chance(0.2) && !two ? [b, a] : [a, b];
  }
  return null;
}

/** Một phép trừ không nhớ hợp lệ theo bài */
function subPair(r: Rng, c: Ctx2, big = PT2_RANK[c.pt2] >= 4): [number, number] | null {
  for (let g = 0; g < 30; g++) {
    const a = r.int(11, Math.min(99, c.max));
    const two = big && r.chance(0.6);
    const b = two ? r.int(1, Math.floor(a / 10)) * 10 + r.int(0, a % 10) : r.int(1, Math.max(1, a % 10));
    if (b < 1 || b > a || (!two && b > a % 10)) continue;
    if (two && b > a) continue;
    return [a, b];
  }
  return null;
}

const canSub = (c: Ctx2) => PT2_RANK[c.pt2] >= 3;
const pairFor = (r: Rng, c: Ctx2, op: Op) => (op === '+' ? addPair(r, c) : subPair(r, c));
const opsOf = (c: Ctx2): Op[] => (canSub(c) ? (c.lesson === 31 || c.lesson === 32 ? ['-', '-', '+'] : ['+', '-']) : ['+']);
const sym = (op: Op) => (op === '+' ? '+' : MINUS);
const calc = (a: number, op: Op, b: number) => (op === '+' ? a + b : a - b);
const columnWhy = (a: number, op: Op, b: number) => {
  const res = calc(a, op, b);
  const verb = op === '+' ? 'cộng' : 'trừ';
  return `Đặt tính thẳng cột: đơn vị thẳng đơn vị, chục thẳng chục. ${a % 10} ${verb} ${b % 10} bằng ${res % 10}, viết ${res % 10}; ` +
    (b >= 10 ? `${Math.floor(a / 10)} ${verb} ${Math.floor(b / 10)} bằng ${Math.floor(res / 10)}, viết ${Math.floor(res / 10)}.` : `hạ ${Math.floor(a / 10)}, viết ${Math.floor(a / 10)}.`) +
    ` Vậy ${a} ${sym(op)} ${b} = ${res}.`;
};
const outcomeOf = (op: Op) => (op === '+' ? 'T1.PT.04' : 'T1.PT.04');

const calcOp: Template2 = (r, c, l) => {
  const op = r.pick(opsOf(c));
  const p = pairFor(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  return Q.blanks('Tính.', [`${a} ${sym(op)} ${b} = {}`], [[calc(a, op, b)]],
    M(outcomeOf(op), 'TOAN.TINH', op === '+' ? 'cong_100' : 'tru_100', l, columnWhy(a, op, b)));
};

const columnOp: Template2 = (r, c, l) => {
  const op = r.pick(opsOf(c));
  const p = pairFor(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  return Q.blanks(`Đặt tính rồi tính: ${a} ${sym(op)} ${b}`, [`${a} ${sym(op)} ${b} = {}`], [[res]],
    M('T1.PT.04', 'TOAN.TINH', 'dat_tinh', l, columnWhy(a, op, b)),
    { figure: { kind: 'column', a: String(a), b: String(b), op: op === '+' ? '+' : '−', result: res >= 10 ? '??' : '?', alt: `Phép tính ${a} ${sym(op)} ${b} đặt theo cột` } });
};

const pickResult: Template2 = (r, c, l) => {
  const op = r.pick(opsOf(c));
  const p = pairFor(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  // Lỗi hay gặp: đặt lệch cột (cộng số đơn vị vào hàng chục)
  const slip = op === '+' && b < 10 ? a + b * 10 : op === '-' && b < 10 ? a - b * 10 : res + 10;
  const opts = [...new Set([res, slip, res + 1, res - 1, res + 10, res - 10])].filter((x) => x >= 0 && x <= c.max).slice(0, 4);
  if (opts.length < 3) return null;
  return Q.sc(`${a} ${sym(op)} ${b} = ?`, r.shuffle(opts).map(String), String(res),
    M('T1.PT.04', 'TOAN.TINH', op === '+' ? 'cong_100' : 'tru_100', l, columnWhy(a, op, b)));
};

const tensMental: Template2 = (r, c, l) => {
  // Trừ hai số tròn chục là trừ hai số có hai chữ số: chỉ từ Bài 32
  const op: Op = PT2_RANK[c.pt2] >= 4 ? r.pick(opsOf(c)) : '+';
  let a: number, b: number;
  if (op === '+') { a = r.int(1, 8); b = r.int(1, 9 - a); } else { a = r.int(2, 9); b = r.int(1, a - 1); }
  const res = calc(a, op, b);
  return Q.blanks('Tính nhẩm.', [`${a * 10} ${sym(op)} ${b * 10} = {}`], [[res * 10]],
    M('T1.PT.05', 'TOAN.TINH', 'tron_chuc', l, `${a} chục ${op === '+' ? '+' : '−'} ${b} chục = ${res} chục, nên ${a * 10} ${sym(op)} ${b * 10} = ${res * 10}.`));
};

const ADD_STORIES = [
  (a: number, b: number, s: string) => `Trong hộp có ${a} ${s}. Mẹ bỏ thêm vào ${b} ${s}. Hỏi trong hộp có tất cả bao nhiêu ${s}?`,
  (a: number, b: number, s: string) => `${KIDS[a % KIDS.length]} có ${a} ${s}, ${KIDS[(a + 3) % KIDS.length]} có ${b} ${s}. Hỏi cả hai bạn có bao nhiêu ${s}?`,
  (a: number, b: number) => `Trên cây có ${a} con chim. Có thêm ${b} con chim bay đến. Hỏi trên cây có tất cả bao nhiêu con chim?`,
];
const SUB_STORIES = [
  (a: number, b: number, s: string) => `Trong hộp có ${a} ${s}. Em lấy ra ${b} ${s}. Hỏi trong hộp còn lại bao nhiêu ${s}?`,
  (a: number, b: number) => `Một xe buýt chở ${a} hành khách. Đến bến, có ${b} hành khách xuống xe. Hỏi trên xe còn lại bao nhiêu hành khách?`,
  (a: number, b: number) => `Trên cây có ${a} quả. Các bạn hái xuống ${b} quả. Hỏi trên cây còn lại bao nhiêu quả?`,
];
const wordOp: Template2 = (r, c, l) => {
  const op = r.pick(opsOf(c));
  const p = pairFor(r, c, op);
  if (!p) return null;
  const [a, b] = op === '+' ? (p[0] < p[1] ? [p[1], p[0]] : p) : p;
  const s = r.pick(STUFF).unit;
  const text = op === '+' ? r.pick(ADD_STORIES)(a, b, s) : r.pick(SUB_STORIES)(a, b, s);
  const res = calc(a, op, b);
  return Q.blanks(text, [`Phép tính: ${a} ${sym(op)} ${b} = {}`], [[res]],
    M('T1.PT.07', 'TOAN.LOIVAN', op === '+' ? 'loi_van_cong' : 'loi_van_tru', l, `${a} ${sym(op)} ${b} = ${res}.`,
      `${op === '+' ? '"Thêm", "tất cả", "cả hai" là gộp lại: làm phép cộng.' : '"Lấy ra", "xuống", "còn lại" là bớt đi: làm phép trừ.'} ${a} ${sym(op)} ${b} = ${res}.`));
};

const partitionWord: Template2 = (r, c, l) => {
  const p = subPair(r, c, true);
  if (!p) return null;
  const [total, part] = p;
  const [x, y] = r.pick([['cây nhãn', 'cây vải'], ['bạn rùa', 'bạn thỏ'], ['bông hoa đỏ', 'bông hoa vàng'], ['quả bóng xanh', 'quả bóng đỏ']]);
  const res = total - part;
  return Q.blanks(`Có tất cả ${total} ${x.split(' ')[0]} gồm ${x} và ${y}, trong đó có ${part} ${x}. Hỏi có bao nhiêu ${y}?`, [`Phép tính: ${total} ${MINUS} ${part} = {}`], [[res]],
    M('T1.PT.07', 'TOAN.LOIVAN', 'loi_van_tru', l, `${total} ${MINUS} ${part} = ${res}.`,
      `Tất cả có ${total}, bớt đi phần đã biết (${part} ${x}) thì còn lại phần cần tìm: ${total} ${MINUS} ${part} = ${res} ${y}.`));
};

const missingOp: Template2 = (r, c, l) => {
  const op = r.pick(opsOf(c));
  const p = pairFor(r, c, op);
  if (!p) return null;
  const [a, b] = p;
  const res = calc(a, op, b);
  const hideFirst = op === '+' && r.chance(0.5);
  const line = hideFirst ? `{} + ${b} = ${res}` : `${a} ${sym(op)} {} = ${res}`;
  const ans = hideFirst ? a : b;
  return Q.blanks('Tìm số còn thiếu.', [line], [[ans]],
    M('T1.PT.04', 'TOAN.SOTHIEU', 'tim_so', l, `${a} ${sym(op)} ${b} = ${res}.`,
      op === '+'
        ? `Tách theo hàng: đơn vị ${a % 10} + ${b % 10} = ${res % 10}; chục ${Math.floor(a / 10)} + ${Math.floor(b / 10)} = ${Math.floor(res / 10)}. Số còn thiếu là ${ans}.`
        : `Số bị trừ ${a}, hiệu ${res}: thử từng hàng — đơn vị ${a % 10} ${MINUS} ? = ${res % 10}, chục ${Math.floor(a / 10)} ${MINUS} ? = ${Math.floor(res / 10)}. Số còn thiếu là ${b}.`));
};

const columnDigit: Template2 = (r, c, l) => {
  const op = r.pick(opsOf(c));
  const p = op === '+' ? addPair(r, c, PT2_RANK[c.pt2] >= 2) : subPair(r, c, PT2_RANK[c.pt2] >= 4);
  if (!p) return null;
  const [a, b] = p;
  if (a < 10 || b < 10) return null;
  const res = calc(a, op, b);
  if (res < 10) return null;
  const hideA = r.chance(0.5);
  const A = String(a), B = String(b), R = String(res);
  const fa = hideA ? `${A[0]}?` : A;
  const fb = hideA ? B : `${B[0]}?`;
  const ans = hideA ? A[1] : B[1];
  return Q.blanks('Tìm chữ số còn thiếu trong phép tính đặt theo cột.', ['Chữ số còn thiếu là {}'], [[ans]],
    M('T1.PT.04', 'TOAN.SOTHIEU', 'dat_tinh', l, `${a} ${sym(op)} ${b} = ${res}.`,
      `Xét hàng đơn vị: ${hideA ? `? ${op === '+' ? '+' : MINUS} ${B[1]}` : `${A[1]} ${op === '+' ? '+' : MINUS} ?`} = ${R[1]}, nên chữ số còn thiếu là ${ans}.`),
    { figure: { kind: 'column', a: fa, b: fb, op: op === '+' ? '+' : '−', result: R, alt: `Phép tính đặt cột có một chữ số bị che` } });
};

const tfCalc: Template2 = (r, c, l) => {
  const rows: [string, boolean][] = [];
  for (let i = 0; i < 4; i++) {
    const op = r.pick(opsOf(c));
    const p = pairFor(r, c, op);
    if (!p) return null;
    const [a, b] = p;
    const res = calc(a, op, b);
    const ok = r.chance(0.5);
    const shown = ok ? res : r.pick([res + 1, res - 1, res + 10, res - 10].filter((x) => x >= 0 && x <= c.max));
    rows.push([`${a} ${sym(op)} ${b} = ${shown}`, shown === res]);
  }
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.PT.04', 'TOAN.DUNGSAI', 'kiem_tra_tinh', l, 'Tính lại từng phép tính rồi đối chiếu kết quả.',
      'Với mỗi dòng: tính hàng đơn vị trước, hàng chục sau, rồi so với kết quả đã ghi. Ghi đúng thì chọn Đ, sai thì chọn S.'));
};

const chain: Template2 = (r, c, l) => {
  const ops = opsOf(c);
  for (let g = 0; g < 20; g++) {
    const op1 = r.pick(ops), op2 = r.pick(ops);
    const p = pairFor(r, c, op1);
    if (!p) continue;
    const mid = calc(p[0], op1, p[1]);
    // phép tính thứ hai bắt đầu từ kết quả giữa
    const q = op2 === '+'
      ? (() => { const bmax = 9 - (mid % 10); if (bmax < 1) return null; const two = PT2_RANK[c.pt2] >= 2 && r.chance(0.5) && Math.floor(mid / 10) < 9; return two ? r.int(1, 9 - Math.floor(mid / 10)) * 10 + r.int(0, bmax) : r.int(1, bmax); })()
      : (() => { if (mid % 10 < 1 && !(PT2_RANK[c.pt2] >= 4 && mid >= 20)) return null; const two = PT2_RANK[c.pt2] >= 4 && mid >= 20 && r.chance(0.5); return two ? r.int(1, Math.floor(mid / 10) - 1) * 10 + r.int(0, mid % 10) : r.int(1, Math.max(1, mid % 10)); })();
    if (q === null || q < 1) continue;
    if (op2 === '-' && (q > mid || q % 10 > mid % 10)) continue;
    if (op2 === '+' && (mid + q > Math.min(99, c.max) || (mid % 10) + (q % 10) > 9)) continue;
    if (op2 === '+' && PT2_RANK[c.pt2] < 2 && mid > 9 && q > 9) continue;
    const res = calc(mid, op2, q);
    return Q.blanks('Tính (từ trái sang phải).', [`${p[0]} ${sym(op1)} ${p[1]} ${sym(op2)} ${q} = {}`], [[res]],
      M('T1.PT.06', 'TOAN.TINH', 'hai_dau_tinh', l, `${p[0]} ${sym(op1)} ${p[1]} = ${mid}; ${mid} ${sym(op2)} ${q} = ${res}.`,
        `Tính lần lượt từ trái sang phải. Bước 1: ${p[0]} ${sym(op1)} ${p[1]} = ${mid}. Bước 2: ${mid} ${sym(op2)} ${q} = ${res}.`));
  }
  return null;
};

const maxResult: Template2 = (r, c, l) => {
  const exprs: { t: string; v: number }[] = [];
  for (let g = 0; exprs.length < 3 && g < 20; g++) {
    const op = r.pick(opsOf(c));
    const p = pairFor(r, c, op);
    if (!p) continue;
    const v = calc(p[0], op, p[1]);
    if (exprs.some((e) => e.v === v)) continue;
    exprs.push({ t: `${p[0]} ${sym(op)} ${p[1]}`, v });
  }
  if (exprs.length < 3) return null;
  const big = r.chance(0.5);
  const best = exprs.reduce((m, e) => ((big ? e.v > m.v : e.v < m.v) ? e : m));
  return Q.sc(`Phép tính nào có kết quả ${big ? 'lớn nhất' : 'bé nhất'}?`, exprs.map((e) => e.t), best.t,
    M('T1.PT.04', 'TOAN.SOSANH', 'so_sanh_ket_qua', l, exprs.map((e) => `${e.t} = ${e.v}`).join('; ') + '.',
      `Tính từng phép tính: ${exprs.map((e) => `${e.t} = ${e.v}`).join('; ')}. So sánh các kết quả: ${big ? 'lớn nhất' : 'bé nhất'} là ${best.v}.`));
};

const compareExpr: Template2 = (r, c, l) => {
  const op = r.pick(opsOf(c));
  const p = pairFor(r, c, op);
  if (!p) return null;
  const v = calc(p[0], op, p[1]);
  const other = r.pick([v, v + r.int(1, 5), v - r.int(1, 5)].filter((x) => x >= 0 && x <= c.max));
  return Q.sc(`Chọn dấu thích hợp: ${p[0]} ${sym(op)} ${p[1]} ... ${other}`, ['>', '<', '='], signOf(v, other),
    M('T1.PT.04', 'TOAN.SOSANH', 'so_sanh_ket_qua', l, `${p[0]} ${sym(op)} ${p[1]} = ${v}; ${v} ${signOf(v, other)} ${other}.`,
      `Tính trước: ${p[0]} ${sym(op)} ${p[1]} = ${v}. Rồi so sánh ${v} với ${other}.`));
};

const overN: Template2 = (r, c, l) => {
  const items: { t: string; v: number }[] = [];
  for (let g = 0; items.length < 4 && g < 30; g++) {
    const op = r.pick(opsOf(c));
    const p = pairFor(r, c, op);
    if (!p) continue;
    const v = calc(p[0], op, p[1]);
    if (items.some((e) => e.v === v)) continue;
    items.push({ t: `${p[0]} ${sym(op)} ${p[1]}`, v });
  }
  if (items.length < 4) return null;
  const vs = items.map((e) => e.v).sort((a, b) => a - b);
  const n = vs[1] + (vs[2] - vs[1] > 1 ? 1 : 0);
  const right = items.filter((e) => e.v > n).map((e) => e.t);
  if (!right.length || right.length === 4) return null;
  return Q.mc(`Chọn tất cả các phép tính có kết quả lớn hơn ${n}.`, items.map((e) => e.t), right,
    M('T1.PT.04', 'TOAN.SOSANH', 'so_sanh_ket_qua', l, items.map((e) => `${e.t} = ${e.v}`).join('; ') + '.',
      `Tính từng phép tính rồi so sánh kết quả với ${n}: ${items.map((e) => `${e.t} = ${e.v}`).join('; ')}.`));
};

// ===========================================================================
// THỜI GIAN: XEM GIỜ, CÁC NGÀY TRONG TUẦN, TỜ LỊCH
// ===========================================================================
const clockFig = (h: number): Figure => ({ kind: 'clock', hour: h, alt: `Đồng hồ: kim ngắn chỉ số ${h}, kim dài chỉ số 12` });
const hourOptions = (r: Rng, h: number) => [...new Set([h, (h % 12) + 1, h === 1 ? 12 : h - 1, ((h + 5) % 12) + 1])].map((x) => `${x} giờ`);

const clockRead: Template2 = (r, _c, l) => {
  const h = r.int(1, 12);
  return Q.sc('Đồng hồ chỉ mấy giờ?', r.shuffle(hourOptions(r, h)), `${h} giờ`,
    M('T1.HH.08', 'TOAN.GIOLICH', 'xem_gio', l, `Kim dài chỉ số 12, kim ngắn chỉ số ${h}: ${h} giờ.`), { figure: clockFig(h) });
};

const clockPick: Template2 = (r, _c, l) => {
  const hs = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3);
  const labels = ['Đồng hồ A', 'Đồng hồ B', 'Đồng hồ C'];
  const figs: Record<string, Figure> = {};
  hs.forEach((h, i) => (figs[labels[i]] = clockFig(h)));
  const ans = labels[0 + r.int(0, 2)];
  const h = hs[labels.indexOf(ans)];
  return Q.sc(`Đồng hồ nào chỉ ${h} giờ?`, labels, ans,
    M('T1.HH.08', 'TOAN.GIOLICH', 'xem_gio', l, `${ans}: kim ngắn chỉ số ${h}, kim dài chỉ số 12.`), { optionFigures: figs });
};

const clockMatch: Template2 = (r, _c, l) => {
  const hs = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3);
  return Q.mt('Ghép mỗi cách đặt kim đồng hồ với giờ đúng.', hs.map((h) => [`Kim ngắn chỉ số ${h}, kim dài chỉ số 12`, `${h} giờ`] as [string, string]),
    M('T1.HH.08', 'TOAN.GIOLICH', 'xem_gio', l, 'Khi kim dài chỉ số 12, kim ngắn chỉ số nào thì đồng hồ chỉ đúng số giờ đó.',
      `Đọc số mà kim ngắn chỉ: ${hs.map((h) => `số ${h} là ${h} giờ`).join(', ')}.`));
};

const SESSIONS: [string, string][] = [
  ['Em thức dậy lúc 6 giờ', 'sáng'],
  ['Em đi học lúc 7 giờ', 'sáng'],
  ['Cả nhà ăn cơm trưa lúc 11 giờ', 'trưa'],
  ['Em tan học về nhà lúc 5 giờ', 'chiều'],
  ['Em đá bóng với bạn lúc 4 giờ', 'chiều'],
  ['Em đi ngủ lúc 9 giờ', 'tối'],
  ['Cả nhà ăn cơm tối lúc 7 giờ', 'tối'],
];
const sessionPick: Template2 = (r, _c, l) => {
  const [p, ans] = r.pick(SESSIONS);
  return Q.sc(`${p} … Chọn buổi thích hợp.`, ['sáng', 'trưa', 'chiều', 'tối'], ans,
    M('T1.HH.08', 'TOAN.GIOLICH', 'buoi_trong_ngay', l, `${p} ${ans}.`,
      'Một ngày có các buổi: sáng (thức dậy, đi học), trưa (ăn trưa), chiều (tan học, vui chơi), tối (ăn tối, đi ngủ). Chọn buổi hợp với việc làm.'));
};

const hoursLater: Template2 = (r, _c, l) => {
  // Cộng, trừ giờ không nhớ: kết quả không quá 10, hoặc bắt đầu từ 10 giờ
  const h = r.int(1, 10);
  const k = r.int(1, h === 10 ? 2 : Math.min(3, 10 - h));
  const later = r.chance(0.6);
  const ans = later ? h + k : h - k;
  if (ans < 1) return null;
  return Q.sc(`Bây giờ là ${h} giờ. ${later ? `${k} giờ nữa` : `${k} giờ trước`} là mấy giờ?`, r.shuffle(hourOptions(r, ans)), `${ans} giờ`,
    M('T1.HH.09', 'TOAN.GIOLICH', 'tinh_gio', l, `${h} ${later ? '+' : MINUS} ${k} = ${ans}: ${ans} giờ.`,
      `Kim ngắn đang chỉ số ${h}. ${later ? 'Sau' : 'Trước đó'} ${k} giờ, kim ngắn ${later ? 'tiến thêm' : 'lùi lại'} ${k} số: ${h} ${later ? '+' : MINUS} ${k} = ${ans}. Vậy là ${ans} giờ.`),
    { figure: clockFig(h) });
};

const tfClock: Template2 = (r, _c, l) => {
  const hs = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 4);
  const rows: [string, boolean][] = hs.map((h) => {
    const ok = r.chance(0.5);
    const said = ok ? h : (h % 12) + 1;
    return [`Kim ngắn chỉ số ${h}, kim dài chỉ số 12 thì đồng hồ chỉ ${said} giờ.`, said === h];
  });
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.HH.08', 'TOAN.DUNGSAI', 'xem_gio', l, 'Kim dài chỉ số 12 thì đọc giờ theo số mà kim ngắn chỉ.',
      'Với mỗi dòng, so sánh số kim ngắn chỉ với số giờ được nói. Bằng nhau thì Đ, khác nhau thì S.'));
};

const clockWord: Template2 = (r, _c, l) => {
  const start = r.int(6, 8);
  const k = r.int(2, 10 - start); // kết quả không quá 10 giờ: cộng không nhớ
  const kid = r.pick(KIDS);
  const act = r.pick(['đi tham quan vườn thú', 'đi dã ngoại', 'học ở trường']);
  return Q.sc(`Buổi sáng, ${kid} bắt đầu ${act} lúc ${start} giờ và đi trong ${k} giờ. Hỏi ${kid} xong lúc mấy giờ?`,
    r.shuffle(hourOptions(r, start + k)), `${start + k} giờ`,
    M('T1.HH.09', 'TOAN.GIOLICH', 'tinh_gio', l, `${start} + ${k} = ${start + k}: ${start + k} giờ.`,
      `Bắt đầu lúc ${start} giờ, thêm ${k} giờ nữa: ${start} + ${k} = ${start + k}. ${kid} xong lúc ${start + k} giờ.`));
};

export const WEEKDAYS = ['thứ Hai', 'thứ Ba', 'thứ Tư', 'thứ Năm', 'thứ Sáu', 'thứ Bảy', 'Chủ nhật'];
const Wd = (i: number) => WEEKDAYS[((i % 7) + 7) % 7];
const dayOpts = (r: Rng, i: number) => r.shuffle([...new Set([Wd(i), Wd(i + 1), Wd(i - 1), Wd(i + 2)])].map(cap));

const nextDay: Template2 = (r, _c, l) => {
  const i = r.int(0, 6);
  const after = r.chance(0.6);
  const ans = after ? i + 1 : i - 1;
  return Q.sc(`Ngày đứng ngay ${after ? 'sau' : 'trước'} ${Wd(i)} trong tuần là ngày nào?`, dayOpts(r, ans), cap(Wd(ans)),
    M('T1.HH.07', 'TOAN.GIOLICH', 'ngay_trong_tuan', l, `Thứ tự các ngày: ${WEEKDAYS.join(', ')}. Ngay ${after ? 'sau' : 'trước'} ${Wd(i)} là ${Wd(ans)}.`));
};

const yesterdayTomorrow: Template2 = (r, _c, l) => {
  const i = r.int(0, 6);
  const tomorrow = r.chance(0.5);
  const ans = tomorrow ? i + 1 : i - 1;
  return Q.sc(`Hôm nay là ${Wd(i)}. ${tomorrow ? 'Ngày mai' : 'Hôm qua'} là ngày nào?`, dayOpts(r, ans), cap(Wd(ans)),
    M('T1.HH.07', 'TOAN.GIOLICH', 'hom_qua_ngay_mai', l, `${tomorrow ? 'Ngày mai là ngày ngay sau' : 'Hôm qua là ngày ngay trước'} hôm nay: ${Wd(ans)}.`));
};

const WEEK_FACTS: [string, string, string[], string][] = [
  ['Một tuần lễ có mấy ngày?', '7 ngày', ['5 ngày', '6 ngày', '7 ngày'], 'Một tuần lễ có 7 ngày: thứ Hai, thứ Ba, thứ Tư, thứ Năm, thứ Sáu, thứ Bảy, Chủ nhật.'],
  ['Ngày cuối cùng của tuần (theo lịch) là ngày nào?', 'Chủ nhật', ['Thứ Bảy', 'Chủ nhật', 'Thứ Hai'], 'Tuần bắt đầu từ thứ Hai và kết thúc vào Chủ nhật.'],
  ['Em đi học từ thứ Hai đến thứ Sáu. Mỗi tuần em đi học mấy ngày?', '5 ngày', ['4 ngày', '5 ngày', '7 ngày'], 'Thứ Hai, thứ Ba, thứ Tư, thứ Năm, thứ Sáu: 5 ngày.'],
];
const weekFacts: Template2 = (r, _c, l) => {
  const [p, ans, opts, e] = r.pick(WEEK_FACTS);
  return Q.sc(p, opts, ans, M('T1.HH.07', 'TOAN.GIOLICH', 'ngay_trong_tuan', l, e, l >= 3 ? e : undefined));
};

const weekOrder: Template2 = (r, _c, l) => {
  const i = r.int(0, 3);
  const days = [0, 1, 2, 3].map((k) => cap(Wd(i + k)));
  return Q.ord('Xếp các ngày theo đúng thứ tự trong tuần.', days,
    M('T1.HH.07', 'TOAN.SAPXEP', 'ngay_trong_tuan', l, days.join(', ') + '.', `Thứ tự trong tuần: ${WEEKDAYS.join(', ')}. Các ngày đã cho xếp lại: ${days.join(', ')}.`));
};

const dayAfterN: Template2 = (r, _c, l) => {
  const i = r.int(0, 6);
  const k = r.int(2, 3);
  const back = r.chance(0.35);
  const ans = back ? i - k : i + k;
  const walk = [1, 2, 3].slice(0, k).map((d) => Wd(back ? i - d : i + d));
  return Q.sc(`Hôm nay là ${Wd(i)}. Hỏi ${k} ngày ${back ? 'trước' : 'nữa'} là ngày nào?`, dayOpts(r, ans), cap(Wd(ans)),
    M('T1.HH.07', 'TOAN.GIOLICH', 'hom_qua_ngay_mai', l, `${back ? 'Đếm lùi' : 'Đếm tiếp'} ${k} ngày: ${walk.join(', ')}.`,
      `${back ? 'Đếm lùi' : 'Đếm tiếp'} từ ${Wd(i)}: ${walk.join(', ')}. Ngày thứ ${k} đếm được là ${Wd(ans)}.`));
};

const yesterdayTomorrow2: Template2 = (r, _c, l) => {
  const y = r.int(0, 6);
  const ans = y + 2;
  return Q.sc(`Nếu hôm qua là ${Wd(y)} thì ngày mai là ngày nào?`, dayOpts(r, ans), cap(Wd(ans)),
    M('T1.HH.07', 'TOAN.GIOLICH', 'hom_qua_ngay_mai', l, `Hôm qua ${Wd(y)} → hôm nay ${Wd(y + 1)} → ngày mai ${Wd(ans)}.`,
      `Hôm qua là ${Wd(y)} thì hôm nay là ngày ngay sau: ${Wd(y + 1)}. Ngày mai là ngày ngay sau hôm nay: ${Wd(ans)}.`));
};

const calFig = (month: number, day: number, wd: number): Figure => ({
  kind: 'calendar', month, day, weekday: cap(Wd(wd)), alt: `Tờ lịch: tháng ${month}, ngày ${day}, ${Wd(wd)}`,
});

const calendarRead: Template2 = (r, _c, l) => {
  const month = r.int(1, 12), day = r.int(1, 28), wd = r.int(0, 6);
  const ask = r.pick(['thu', 'ngay', 'thang'] as const);
  if (ask === 'thu') return Q.sc('Tờ lịch cho biết hôm đó là thứ mấy?', dayOpts(r, wd), cap(Wd(wd)),
    M('T1.HH.08', 'TOAN.GIOLICH', 'xem_lich', l, `Dòng dưới cùng của tờ lịch ghi: ${Wd(wd)}.`), { figure: calFig(month, day, wd) });
  if (ask === 'ngay') return Q.sc('Tờ lịch cho biết hôm đó là ngày bao nhiêu?', numOptions(r, day, 1, 31, 3).map((x) => `Ngày ${x}`), `Ngày ${day}`,
    M('T1.HH.08', 'TOAN.GIOLICH', 'xem_lich', l, `Số lớn ở giữa tờ lịch là ngày: ngày ${day}.`), { figure: calFig(month, day, wd) });
  return Q.sc('Tờ lịch cho biết hôm đó thuộc tháng mấy?', numOptions(r, month, 1, 12, 3).map((x) => `Tháng ${x}`), `Tháng ${month}`,
    M('T1.HH.08', 'TOAN.GIOLICH', 'xem_lich', l, `Dòng trên cùng của tờ lịch ghi tháng: tháng ${month}.`), { figure: calFig(month, day, wd) });
};

const calendarNext: Template2 = (r, _c, l) => {
  const month = r.int(1, 12), day = r.int(1, 27), wd = r.int(0, 6);
  const tomorrow = r.chance(0.5);
  const d2 = tomorrow ? day + 1 : day - 1;
  if (d2 < 1) return null;
  const ans = `${cap(Wd(tomorrow ? wd + 1 : wd - 1))}, ngày ${d2}`;
  const opts = r.shuffle([ans, `${cap(Wd(tomorrow ? wd + 1 : wd - 1))}, ngày ${tomorrow ? d2 + 1 : d2 - 1 || d2 + 2}`, `${cap(Wd(tomorrow ? wd - 1 : wd + 1))}, ngày ${d2}`]);
  if (new Set(opts).size < 3) return null;
  return Q.sc(`Tờ lịch là hôm nay. ${tomorrow ? 'Ngày mai' : 'Hôm qua'} là thứ mấy, ngày bao nhiêu?`, opts, ans,
    M('T1.HH.08', 'TOAN.GIOLICH', 'xem_lich', l, `Hôm nay ${Wd(wd)}, ngày ${day}. ${tomorrow ? 'Ngày mai' : 'Hôm qua'}: ${ans.toLowerCase()}.`,
      `${tomorrow ? 'Ngày mai: thứ tiếp theo và ngày thêm 1' : 'Hôm qua: thứ ngay trước và ngày bớt 1'}. Từ ${Wd(wd)}, ngày ${day} được ${ans.toLowerCase()}.`),
    { figure: calFig(month, day, wd) });
};

const dateWeekday: Template2 = (r, _c, l) => {
  const wd = r.int(0, 4);
  const day = r.int(10, 25);
  const k = r.int(1, 2);
  const ans = day + k;
  if ((day % 10) + k > 9) return null; // cộng không nhớ
  return Q.blanks(`Trong một tuần, ${Wd(wd)} là ngày ${day}. Hỏi ${Wd(wd + k)} tuần đó là ngày bao nhiêu?`, ['Ngày {}'], [[ans]],
    M('T1.HH.09', 'TOAN.GIOLICH', 'xem_lich', l, `${Wd(wd + k)} sau ${Wd(wd)} ${k} ngày: ${day} + ${k} = ${ans}.`,
      `Mỗi ngày tiếp theo thì số ngày thêm 1. Từ ${Wd(wd)} (ngày ${day}) đếm tiếp ${k} ngày đến ${Wd(wd + k)}: ${day} + ${k} = ${ans}.`));
};

// --- Bổ sung để mỗi cấp độ có nhiều câu khác nhau ---------------------------------
const lengthCompareNum: Template2 = (r, _c, l) => {
  const [a, b] = distinctLens(r, 2, 5, 30);
  const things = r.pick([['Bút A', 'Bút B'], ['Sợi dây đỏ', 'Sợi dây xanh'], ['Băng giấy vàng', 'Băng giấy tím'], ['Thước của Mai', 'Thước của Nam']]);
  const longer = r.chance(0.5);
  const ans = (longer ? a > b : a < b) ? things[0] : things[1];
  return Q.sc(`${things[0]} dài ${a} cm, ${things[1].charAt(0).toLowerCase() + things[1].slice(1)} dài ${b} cm. Vật nào ${longer ? 'dài hơn' : 'ngắn hơn'}?`, things, ans,
    M('T1.HH.05', 'TOAN.DODAI', 'do_cm', l, `${a} ${signOf(a, b)} ${b}, nên ${ans.charAt(0).toLowerCase() + ans.slice(1)} ${longer ? 'dài hơn' : 'ngắn hơn'}.`));
};

const clockHand: Template2 = (r, _c, l) => {
  const h = r.int(1, 12);
  const askShort = r.chance(0.6);
  const ans = askShort ? h : 12;
  const opts = [...new Set([ans, askShort ? 12 : h, ((ans + 2) % 12) + 1])].map((x) => `Số ${x}`);
  if (opts.length < 3) return null;
  return Q.sc(`Lúc ${h} giờ đúng, kim ${askShort ? 'ngắn' : 'dài'} của đồng hồ chỉ số mấy?`, r.shuffle(opts), `Số ${ans}`,
    M('T1.HH.08', 'TOAN.GIOLICH', 'xem_gio', l, `Giờ đúng: kim dài chỉ số 12, kim ngắn chỉ số giờ (${h}).`));
};

const countDays: Template2 = (r, _c, l) => {
  const i = r.int(0, 4);
  const j = r.int(i + 1, 6);
  const n = j - i + 1;
  return Q.blanks(`Từ ${Wd(i)} đến ${Wd(j)} (tính cả hai ngày) có mấy ngày?`, ['Có {} ngày.'], [[n]],
    M('T1.HH.07', 'TOAN.GIOLICH', 'ngay_trong_tuan', l, `Đếm: ${Array.from({ length: n }, (_, k) => Wd(i + k)).join(', ')}: ${n} ngày.`,
      `Kể lần lượt các ngày và đếm: ${Array.from({ length: n }, (_, k) => `${Wd(i + k)} (${k + 1})`).join(', ')}. Có ${n} ngày.`));
};

const scheduleDays: Template2 = (r, _c, l) => {
  const act = r.pick(['tập bơi', 'học vẽ', 'đá bóng', 'học đàn']);
  const kid = r.pick(KIDS);
  const on = r.sample([0, 1, 2, 3, 4, 5, 6], 3).sort((a, b) => a - b);
  const off = [0, 1, 2, 3, 4, 5, 6].filter((d) => !on.includes(d));
  const ask = r.pick(off);
  const opts = r.shuffle([ask, ...r.sample(on, 2)]).map((d) => cap(Wd(d)));
  return Q.sc(`Mỗi tuần, ${kid} ${act} vào ${on.map(Wd).join(', ')}. Ngày nào ${kid} KHÔNG ${act}?`, opts, cap(Wd(ask)),
    M('T1.HH.07', 'TOAN.GIOLICH', 'ngay_trong_tuan', l, `${kid} ${act} vào ${on.map(Wd).join(', ')}; ${Wd(ask)} không có trong danh sách.`,
      `Đối chiếu từng lựa chọn với các ngày ${kid} ${act} (${on.map(Wd).join(', ')}). Ngày không có trong danh sách là ${Wd(ask)}.`));
};

// ===========================================================================
// DANH SÁCH THEO BÀI
// ===========================================================================
export type Pool2 = Record<Level, Template2[]>;
const merge = (...pools: Pool2[]): Pool2 =>
  ([1, 2, 3, 4, 5] as Level[]).reduce((o, lv) => ({ ...o, [lv]: [...new Set(pools.flatMap((p) => p[lv]))] }), {} as Pool2);

const P21: Pool2 = { 1: [tensCount], 2: [tensOnesBlank, composeBlank, readNum], 3: [seqHoles, roundTens, tensBond, writeNum], 4: [matchRead, stepSeq], 5: [digitsFacts, makeNumbers] };
const P22: Pool2 = { 1: [signPick2, pickBiggerPair], 2: [biggestOf, pickBiggerPair], 3: [orderNums], 4: [signTable], 5: [compareWord, betweenNums] };
const P23: Pool2 = { 1: [neighbor], 2: [hundredFacts, readNum, composeBlank], 3: [hundredRow, seqHoles], 4: [sameDigits, stepSeq], 5: [hundredBelow] };
const P25: Pool2 = { 1: [longerOf2], 2: [longestOf3, tallerOf], 3: [reverseRelation, tallerOf], 4: [informalUnits], 5: [pathCompare] };
const P26: Pool2 = { 1: [longerOf2, lengthCompareNum], 2: [measureRuler, longestOf3], 3: [measureCompare, estimateLen], 4: [longerThanN, informalUnits], 5: [lengthsTable] };
const P27: Pool2 = { 1: [measureRuler, lengthCompareNum], 2: [estimateLen, longestOf3], 3: [measureCompare, estimateUnit], 4: [longerThanN, estimateUnit], 5: [lengthsTable, pathCompare] };
const PADD: Pool2 = { 1: [calcOp], 2: [columnOp, pickResult], 3: [wordOp], 4: [missingOp, tfCalc, columnDigit], 5: [chain, maxResult, overN] };
const PADD2: Pool2 = merge(PADD, { 1: [], 2: [tensMental], 3: [], 4: [], 5: [] });
const PSUB: Pool2 = { 1: [calcOp], 2: [columnOp, pickResult, tensMental], 3: [wordOp], 4: [missingOp, tfCalc, columnDigit], 5: [chain, maxResult, compareExpr] };
const PSUB2: Pool2 = merge(PSUB, { 1: [], 2: [], 3: [], 4: [], 5: [partitionWord, overN] });
const P34: Pool2 = { 1: [clockRead, clockHand], 2: [clockPick, clockHand], 3: [clockMatch, sessionPick], 4: [hoursLater, tfClock], 5: [clockWord] };
const P35: Pool2 = { 1: [nextDay], 2: [yesterdayTomorrow, weekFacts], 3: [weekOrder, scheduleDays], 4: [dayAfterN, countDays], 5: [yesterdayTomorrow2, scheduleDays] };
const P36: Pool2 = { 1: [calendarRead], 2: [clockRead, yesterdayTomorrow, clockHand, calendarRead], 3: [calendarNext, clockPick], 4: [dateWeekday, hoursLater], 5: [yesterdayTomorrow2, clockWord] };

export const POOLS2 = {
  numbers: merge(P21, P22, P23),
  length: merge(P25, P26, P27),
  calc: merge(PADD2, PSUB2),
  time: merge(P34, P35, P36),
};

export type LessonSpec2 = { no: number; ctx: Omit<Ctx2, 'lesson'>; pool: Pool2 };
const N99 = { max: 99, pt2: 'none' as Pt2 };
const N100 = { max: 100, pt2: 'none' as Pt2 };
const ALL = { max: 100, pt2: 'all' as Pt2 };

/** Bài 21–37, 39 (Bài 38, 40, 41 trộn thêm dạng bài học kì 1 — xem src/lib/practice/index.ts) */
export const TOAN1_HK2_PRACTICE: LessonSpec2[] = [
  { no: 21, ctx: N99, pool: P21 },
  { no: 22, ctx: N99, pool: merge(P22, { 1: [], 2: [], 3: [tensOnesBlank], 4: [], 5: [] }) },
  { no: 23, ctx: N100, pool: P23 },
  { no: 24, ctx: N100, pool: merge(P21, P22, P23) },
  { no: 25, ctx: N100, pool: P25 },
  { no: 26, ctx: N100, pool: P26 },
  { no: 27, ctx: N100, pool: P27 },
  { no: 28, ctx: N100, pool: merge(P25, P26, P27) },
  { no: 29, ctx: { max: 100, pt2: 'add1' }, pool: PADD },
  { no: 30, ctx: { max: 100, pt2: 'add' }, pool: PADD2 },
  { no: 31, ctx: { max: 100, pt2: 'sub1' }, pool: PSUB },
  { no: 32, ctx: ALL, pool: PSUB2 },
  { no: 33, ctx: ALL, pool: merge(PADD2, PSUB2) },
  { no: 34, ctx: ALL, pool: P34 },
  { no: 35, ctx: ALL, pool: P35 },
  { no: 36, ctx: ALL, pool: P36 },
  { no: 37, ctx: ALL, pool: merge(P34, P35, P36) },
  { no: 39, ctx: ALL, pool: merge(P21, P22, P23, PADD2, PSUB2) },
];

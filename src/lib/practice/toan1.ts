// BỘ SINH BÀI LUYỆN TẬP NGẪU NHIÊN — TOÁN 1, HỌC KÌ 1 (bám trình tự Kết nối tri thức, Bài 1–20).
//
// Dạng bài tham khảo cách ra bài của vở bài tập (đếm hình trong tranh, chọn nhóm, điền dãy số, bảng Đúng/Sai,
// tách – gộp số, nhận dạng hình qua đồ vật, đếm hình que tính, tìm quy luật, khối hình, vị trí…), nhưng mọi số,
// tranh và câu chữ đều sinh ngẫu nhiên theo seed nên mỗi lượt là một đề mới, không chép nội dung của sách.
//
// Mỗi "mẫu" (template) nhận bộ số ngẫu nhiên + phạm vi bài và trả về một câu hỏi tự chấm được.
// Quy tắc "không vượt trước": Bài 1 chỉ dùng số 0–5; trước Bài 10 không có dấu + / −; mọi số ≤ 10.
// Kiểm tra tự động: npm run check:practice

import type { Level } from '../content/types';
import { BLOCK_LABEL, SHAPE_LABEL, type BlockName, type Figure, type ShapeName } from '../figures';
import {
  ANIMALS, BLOCK_OBJECTS, COLORS, KIDS, Q, SHAPES, SHAPE_OBJECTS, STUFF, THINGS, TOYS, bare, buildScene, numOptions,
  objectsFig, shapeFig, shapeRow, shapeTitle, type Ctx, type Meta, type PracticeQuestion, type Thing,
} from './kit';
import type { Rng } from './rng';

export type Template = (r: Rng, c: Ctx, l: Level) => PracticeQuestion | null;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const M = (o: string, f: string, k: string, l: Level, e: string, s?: string): Meta => ({ o, f, k, l, e, s });
const MINUS = '−';

/** Bảng Đúng/Sai: bảo đảm có cả nhận định đúng và sai, rồi đảo thứ tự */
function mixRows(r: Rng, rows: [string, boolean][]): [string, boolean][] | null {
  if (rows.length < 3) return null;
  if (rows.every((x) => x[1]) || rows.every((x) => !x[1])) return null;
  return r.shuffle(rows);
}

// ===========================================================================
// 1. ĐẾM, ĐỌC, VIẾT SỐ
// ===========================================================================
const countPick: Template = (r, c, l) => {
  const t = r.pick(THINGS);
  const n = r.int(Math.max(1, c.focusMin), c.max);
  return Q.sc(`Có mấy ${t.name}?`, numOptions(r, n, 0, c.max), String(n),
    M('T1.SO.01', 'TOAN.DEM', c.max <= 5 ? 'dem_5' : 'dem_10', l, `Đếm lần lượt 1, 2, … đến ${n}. Có ${n} ${t.name}.`),
    { figure: objectsFig([{ t, n }]) });
};

const countFill: Template = (r, c, l) => {
  const t = r.pick(THINGS);
  const n = r.int(Math.max(1, c.focusMin), c.max);
  return Q.blanks('Đếm rồi viết số thích hợp vào ô trống.', [`Có {} ${t.name}.`], [[n]],
    M('T1.SO.01', 'TOAN.DEM', c.max <= 5 ? 'dem_5' : 'dem_10', l, `Có ${n} ${t.name}.`), { figure: objectsFig([{ t, n }]) });
};

const countTwo: Template = (r, c, l) => {
  const kinds = r.sample(THINGS, r.chance(0.5) && l >= 3 ? 3 : 2);
  const ns = kinds.map(() => r.int(1, c.max));
  if (new Set(ns).size < ns.length) return null; // số lượng khác nhau cho dễ nhìn
  if (Math.max(...ns) < c.focusMin) return null;
  const parts = kinds.map((t, i) => `${ns[i]} ${t.name}`).join(', ');
  return Q.blanks('Đếm từng loại rồi viết số vào ô trống.', kinds.map((t) => `Có {} ${t.name}.`), [ns],
    M('T1.SO.01', 'TOAN.DEM', 'dem_10', l, `Có ${parts}.`, `Đếm riêng từng hàng, mỗi đồ vật chỉ đếm một lần: ${parts}.`),
    { figure: objectsFig(kinds.map((t, i) => ({ t, n: ns[i] }))) });
};

const pickGroupN: Template = (r, c, l) => {
  const t = r.pick(THINGS);
  const n = r.int(Math.max(2, c.focusMin), c.max);
  const others = r.sample([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 1 && x <= c.max), 2);
  if (others.length < 2) return null;
  const counts = r.shuffle([n, ...others]);
  const labels = ['Nhóm A', 'Nhóm B', 'Nhóm C'];
  const figs: Record<string, Figure> = {};
  counts.forEach((k, i) => (figs[labels[i]] = objectsFig([{ t, n: k }])));
  const right = labels[counts.indexOf(n)];
  return Q.sc(`Chọn nhóm có đúng ${n} ${t.name}.`, labels, right,
    M('T1.SO.01', 'TOAN.DEM', 'dem_10', l, `${right} có ${n} ${t.name}.`), { optionFigures: figs });
};

function sequenceQ(r: Rng, c: Ctx, l: Level, desc: boolean) {
  const len = Math.min(6, c.max + 1);
  const start = r.int(0, c.max - len + 1);
  let seq = Array.from({ length: len }, (_, i) => start + i);
  if (desc) seq = seq.reverse();
  const holes = r.sample(seq.map((_, i) => i).slice(1), 2).sort((a, b) => a - b); // giữ ô đầu để biết bắt đầu từ đâu
  const cells = seq.map((x, i) => (holes.includes(i) ? '?' : String(x)));
  const ans = holes.map((i) => seq[i]);
  return Q.blanks(
    desc ? 'Đếm ngược rồi điền số còn thiếu.' : 'Điền số còn thiếu vào dãy số.',
    ['Các số còn thiếu (từ trái sang phải): {} và {}'],
    [ans],
    M('T1.SO.01', 'TOAN.SOTHIEU', 'thu_tu_so', l, `Dãy số đầy đủ: ${seq.join(', ')}.`,
      `${desc ? 'Đếm lùi' : 'Đếm thêm'} từng số một bắt đầu từ ${seq[0]}: ${seq.join(', ')}. Hai số còn thiếu là ${ans[0]} và ${ans[1]}.`),
    { figure: { kind: 'sequence', cells, alt: `Dãy số: ${cells.map((x) => (x === '?' ? 'ô trống' : x)).join(', ')}` } },
  );
}
const sequenceAsc: Template = (r, c, l) => sequenceQ(r, c, l, false);
const sequenceDesc: Template = (r, c, l) => sequenceQ(r, c, l, true);

const countOn: Template = (r, c, l) => {
  const a = r.int(0, c.max - 3);
  const ans = a + 3;
  return Q.sc(`Đếm tiếp: ${a}, ${a + 1}, ${a + 2}, … Số tiếp theo là số mấy?`, numOptions(r, ans, 0, c.max), String(ans),
    M('T1.SO.01', 'TOAN.SOTHIEU', 'thu_tu_so', l, `Sau ${a + 2} là ${ans}.`));
};

const positionInRow: Template = (r, c, l) => {
  const len = r.int(4, Math.min(c.max, 8));
  const p = r.int(2, len - 1); // không ở hai đầu
  const fromRight = len - p + 1;
  if (fromRight === p) return null; // tránh trùng với thứ tự từ trái
  const cells = Array.from({ length: len }, (_, i) => (i === p - 1 ? '👧' : '👦'));
  return Q.sc('Các bạn đứng thành một hàng. Bạn gái đứng thứ mấy, tính từ bên phải sang?', numOptions(r, fromRight, 1, len), String(fromRight),
    M('T1.SO.01', 'TOAN.DEM', 'dem_10', l, `Đếm từ bên phải: bạn gái là bạn thứ ${fromRight}.`,
      `Bắt đầu đếm từ bạn đứng ngoài cùng bên phải: 1, 2, … Đếm đến bạn gái thì được ${fromRight}. Vậy bạn gái đứng thứ ${fromRight} tính từ bên phải.`),
    { figure: { kind: 'grid', rows: 1, cols: len, cells, alt: `Hàng ${len} bạn, bạn gái đứng thứ ${p} từ trái sang` } });
};

const tfCount: Template = (r, c, l) => {
  const kinds = r.sample(THINGS, 2);
  const ns = kinds.map(() => r.int(1, c.max));
  if (ns[0] === ns[1] && c.lesson < 3) return null;
  const rows: [string, boolean][] = kinds.map((t, i) => {
    const truthy = r.chance(0.5);
    const shown = truthy ? ns[i] : r.pick([ns[i] - 1, ns[i] + 1].filter((x) => x >= 0 && x <= c.max));
    return [`Có ${shown} ${t.name}.`, shown === ns[i]];
  });
  if (c.lesson >= 3) {
    const [a, b] = kinds.map((t) => bare(t.name));
    const more = r.chance(0.5);
    rows.push([`Số ${a} ${more ? 'nhiều hơn' : 'ít hơn'} số ${b}.`, more ? ns[0] > ns[1] : ns[0] < ns[1]]);
    rows.push([`Số ${a} bằng số ${b}.`, ns[0] === ns[1]]);
  } else {
    const t = kinds[0];
    const shown = r.int(0, c.max);
    rows.push([`Có ${shown} ${t.name} và ${ns[1]} ${kinds[1].name}.`, shown === ns[0]]);
  }
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  const facts = kinds.map((t, i) => `${ns[i]} ${t.name}`).join(' và ');
  return Q.table('Quan sát tranh. Đúng chọn Đ, sai chọn S.', mixed,
    M(c.lesson >= 3 ? 'T1.SO.02' : 'T1.SO.01', 'TOAN.DUNGSAI', 'dem_10', l, `Trong tranh có ${facts}.`,
      `Đếm từng loại: có ${facts}. Đối chiếu từng nhận định với số vừa đếm.`),
    { figure: objectsFig(kinds.map((t, i) => ({ t, n: ns[i] }))) });
};

const rowsWithN: Template = (r, c, l) => {
  const t = r.pick(THINGS);
  const n = r.int(Math.max(2, Math.min(c.focusMin, c.max - 1)), c.max);
  const rows = Array.from({ length: r.int(4, 5) }, () => (r.chance(0.4) ? n : r.int(1, c.max)));
  const k = rows.filter((x) => x === n).length;
  if (k === 0 || k === rows.length) return null;
  return Q.blanks(`Có mấy hàng có đúng ${n} ${t.name}?`, ['Có {} hàng.'], [[k]],
    M('T1.SO.01', 'TOAN.DEM', 'dem_10', l, `Có ${k} hàng có đúng ${n} ${t.name}.`,
      `Đếm số ${bare(t.name)} ở từng hàng: ${rows.join(', ')}. Những hàng có ${n} ${t.name}: ${k} hàng.`),
    { figure: { kind: 'objects', groups: rows.map((x) => ({ icon: t.icon, count: x })), alt: `Các hàng ${t.name}: ${rows.join(', ')}` } });
};

// ===========================================================================
// 2. NHIỀU HƠN, ÍT HƠN, BẰNG NHAU (Bài 3)
// ===========================================================================
function twoThings(r: Rng): [Thing, Thing] {
  const [a, b] = r.sample(THINGS, 2);
  return [a, b];
}
const compareFig = (a: Thing, na: number, b: Thing, nb: number): Figure => ({
  kind: 'compare', rows: [{ icon: a.icon, count: na }, { icon: b.icon, count: nb }], alt: `Hàng trên ${na} ${a.name}, hàng dưới ${nb} ${b.name}`,
});

const compareRows: Template = (r, c, l) => {
  const [a, b] = twoThings(r);
  const na = r.int(1, c.max);
  const nb = r.chance(0.2) ? na : r.int(1, c.max);
  const ans = na > nb ? 'nhiều hơn' : na < nb ? 'ít hơn' : 'bằng';
  return Q.sc(`Số ${bare(a.name)} … số ${bare(b.name)}.`, ['nhiều hơn', 'ít hơn', 'bằng'], ans,
    M('T1.SO.02', 'TOAN.SOSANH', 'nhieu_it', l, `Nối mỗi ${bare(a.name)} với một ${bare(b.name)}: số ${bare(a.name)} ${ans} số ${bare(b.name)}.`),
    { figure: compareFig(a, na, b, nb) });
};

const pickExtremeGroup: Template = (r, c, l) => {
  const t = r.pick(THINGS);
  const counts = r.sample(Array.from({ length: c.max }, (_, i) => i + 1), 3);
  const most = r.chance(0.5);
  const target = most ? Math.max(...counts) : Math.min(...counts);
  const labels = ['Nhóm A', 'Nhóm B', 'Nhóm C'];
  const figs: Record<string, Figure> = {};
  counts.forEach((k, i) => (figs[labels[i]] = objectsFig([{ t, n: k }])));
  const right = labels[counts.indexOf(target)];
  return Q.sc(`Nhóm nào có ${most ? 'nhiều' : 'ít'} ${bare(t.name)} nhất?`, labels, right,
    M('T1.SO.02', 'TOAN.SOSANH', 'nhieu_it', l, `${right} có ${target} ${t.name}, ${most ? 'nhiều' : 'ít'} nhất.`), { optionFigures: figs });
};

const matchEqual: Template = (r, c, l) => {
  const [a, b] = twoThings(r);
  const n = r.int(2, c.max);
  const others = r.sample([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 1 && x <= c.max), 2);
  if (others.length < 2) return null;
  const counts = r.shuffle([n, ...others]);
  const labels = ['Nhóm A', 'Nhóm B', 'Nhóm C'];
  const figs: Record<string, Figure> = {};
  counts.forEach((k, i) => (figs[labels[i]] = objectsFig([{ t: b, n: k }])));
  const right = labels[counts.indexOf(n)];
  return Q.sc(`Chọn nhóm có số ${bare(b.name)} bằng số ${bare(a.name)} trong tranh.`, labels, right,
    M('T1.SO.02', 'TOAN.SOSANH', 'nhieu_it', l, `Tranh có ${n} ${a.name}; ${right} có ${n} ${b.name}.`),
    { figure: objectsFig([{ t: a, n }]), optionFigures: figs });
};

function makeEqualQ(r: Rng, c: Ctx, l: Level, add: boolean) {
  const [a, b] = twoThings(r);
  const small = r.int(1, c.max - 1);
  const big = r.int(small + 1, Math.min(c.max, small + 4));
  const diff = big - small;
  // add: hàng trên ít hơn, cần thêm; bớt: hàng trên nhiều hơn, cần bớt
  const na = add ? small : big;
  const nb = add ? big : small;
  const A = bare(a.name), B = bare(b.name);
  const prompt = add ? `Cần thêm mấy ${a.name} để số ${A} bằng số ${B}?` : `Cần bớt đi mấy ${a.name} để số ${A} bằng số ${B}?`;
  const sol = add
    ? `Nối mỗi ${A} với một ${B}. Còn ${diff} ${b.name} chưa được nối, nên cần thêm ${diff} ${a.name}.`
    : `Nối mỗi ${B} với một ${A}. Còn thừa ${diff} ${a.name} chưa được nối, nên cần bớt đi ${diff} ${a.name}.`;
  return Q.sc(prompt, numOptions(r, diff, 1, Math.min(c.max, 6)), String(diff),
    M('T1.SO.02', 'TOAN.SOSANH', 'nhieu_it', l, `${add ? 'Thêm' : 'Bớt'} ${diff} ${a.name} thì hai hàng bằng nhau.`, sol),
    { figure: compareFig(a, na, b, nb) });
}
const addToEqual: Template = (r, c, l) => makeEqualQ(r, c, l, true);
const removeToEqual: Template = (r, c, l) => makeEqualQ(r, c, l, false);

const whoMost: Template = (r, c, l) => {
  const [x, y, z] = r.sample(KIDS, 3);
  const item = r.pick(STUFF);
  const asks = r.pick(['nhiều', 'ít'] as const);
  // x > y > z (nhiều hơn)
  const usesFewer = r.chance(0.5);
  const lines = usesFewer
    ? `${z} có ít ${item.name} hơn ${y}. ${y} có ít ${item.name} hơn ${x}.`
    : `${x} có nhiều ${item.name} hơn ${y}. ${y} có nhiều ${item.name} hơn ${z}.`;
  const ans = asks === 'nhiều' ? x : z;
  return Q.sc(`${lines} Bạn nào có ${asks} ${item.name} nhất?`, r.shuffle([x, y, z]), ans,
    M('T1.SO.02', 'TOAN.SOSANH', 'nhieu_it', l, `Từ nhiều đến ít: ${x}, ${y}, ${z}.`,
      `Sắp xếp ba bạn theo số ${item.name}: ${x} nhiều hơn ${y}, ${y} nhiều hơn ${z}. Vậy ${x} có nhiều nhất, ${z} có ít nhất. Câu hỏi hỏi bạn có ${asks} nhất nên chọn ${ans}.`));
};

// ===========================================================================
// 3. SO SÁNH SỐ (Bài 4)
// ===========================================================================
const sign = (a: number, b: number) => (a > b ? '>' : a < b ? '<' : '=');
const SIGN_WORD: Record<string, string> = { '>': 'lớn hơn', '<': 'bé hơn', '=': 'bằng' };

const signPick: Template = (r, c, l) => {
  const a = r.int(0, c.max);
  const b = r.chance(0.15) ? a : r.int(0, c.max);
  const s = sign(a, b);
  return Q.sc(`Chọn dấu thích hợp: ${a} … ${b}`, ['>', '<', '='], s,
    M('T1.SO.02', 'TOAN.SOSANH', 'dau_so_sanh', l, `${a} ${SIGN_WORD[s]} ${b}, viết ${a} ${s} ${b}.`));
};

const signPicture: Template = (r, c, l) => {
  const [a, b] = twoThings(r);
  const na = r.int(1, c.max);
  const nb = r.chance(0.2) ? na : r.int(1, c.max);
  const s = sign(na, nb);
  return Q.sc(`Đếm rồi chọn dấu: số ${bare(a.name)} … số ${bare(b.name)}`, ['>', '<', '='], s,
    M('T1.SO.02', 'TOAN.SOSANH', 'dau_so_sanh', l, `Có ${na} ${a.name} và ${nb} ${b.name}: ${na} ${s} ${nb}.`),
    { figure: compareFig(a, na, b, nb) });
};

const extreme: Template = (r, c, l) => {
  const nums = r.sample(Array.from({ length: c.max + 1 }, (_, i) => i), 4);
  const big = r.chance(0.5);
  const ans = big ? Math.max(...nums) : Math.min(...nums);
  return Q.sc(`Trong các số ${nums.join(', ')}, số nào ${big ? 'lớn' : 'bé'} nhất?`, nums.map(String), String(ans),
    M('T1.SO.02', 'TOAN.SOSANH', 'so_sanh_so', l, `Số ${big ? 'lớn' : 'bé'} nhất là ${ans}.`));
};

const orderNums: Template = (r, c, l) => {
  const nums = r.sample(Array.from({ length: c.max + 1 }, (_, i) => i), 4);
  const up = r.chance(0.5);
  const order = [...nums].sort((a, b) => (up ? a - b : b - a)).map(String);
  return Q.ord(`Xếp các số theo thứ tự từ ${up ? 'bé đến lớn' : 'lớn đến bé'}.`, order,
    M('T1.SO.02', 'TOAN.SAPXEP', 'so_sanh_so', l, `Thứ tự đúng: ${order.join(', ')}.`,
      `Tìm số ${up ? 'bé' : 'lớn'} nhất xếp trước, rồi đến số ${up ? 'bé' : 'lớn'} nhất trong các số còn lại… Được: ${order.join(', ')}.`));
};

const signTable: Template = (r, c, l) => {
  const rows: [string, boolean][] = [];
  const used = new Set<string>();
  while (rows.length < 4) {
    const a = r.int(0, c.max), b = r.int(0, c.max);
    const s = r.pick(['>', '<', '='] as const);
    const text = `${a} ${s} ${b}`;
    if (used.has(text)) continue;
    used.add(text);
    rows.push([text, sign(a, b) === s]);
  }
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.SO.02', 'TOAN.DUNGSAI', 'dau_so_sanh', l, 'So sánh hai số rồi xem dấu đã viết có đúng không.',
      mixed.map(([t]) => { const [a, , b] = t.split(' '); return `${a} ${sign(+a, +b)} ${b}`; }).join('; ') + '.'));
};

const allLess: Template = (r, c, l) => {
  const b = r.int(3, c.max - 1);
  const less = r.chance(0.5);
  const opts = r.sample(Array.from({ length: c.max + 1 }, (_, i) => i).filter((x) => x !== b), 5).sort((x, y) => x - y);
  const right = opts.filter((x) => (less ? x < b : x > b));
  if (right.length < 1 || right.length === opts.length) return null;
  return Q.mc(`Chọn TẤT CẢ các số ${less ? 'bé' : 'lớn'} hơn ${b}.`, opts.map(String), right.map(String),
    M('T1.SO.02', 'TOAN.SOSANH', 'so_sanh_so', l, `Các số ${less ? 'bé' : 'lớn'} hơn ${b}: ${right.join(', ')}.`,
      `Đếm từ 0 đến ${c.max}: các số đứng ${less ? 'trước' : 'sau'} ${b} là số ${less ? 'bé' : 'lớn'} hơn ${b}. Trong các số đã cho đó là ${right.join(', ')}.`));
};

const between: Template = (r, c, l) => {
  const a = r.int(0, c.max - 2);
  const ans = a + 1;
  return Q.sc(`Số nào lớn hơn ${a} nhưng bé hơn ${a + 2}?`, numOptions(r, ans, 0, c.max), String(ans),
    M('T1.SO.02', 'TOAN.SOSANH', 'so_sanh_so', l, `Đếm: ${a}, ${ans}, ${a + 2}. Số ở giữa là ${ans}.`,
      `Số lớn hơn ${a} đứng sau ${a}; số bé hơn ${a + 2} đứng trước ${a + 2}. Chỉ có ${ans} đứng giữa ${a} và ${a + 2}.`));
};

const betweenCount: Template = (r, c, l) => {
  const a = r.int(0, c.max - 3);
  const b = r.int(a + 2, Math.min(c.max, a + 5));
  const list = Array.from({ length: b - a - 1 }, (_, i) => a + 1 + i);
  return Q.blanks(`Có mấy số lớn hơn ${a} và bé hơn ${b}?`, ['Có {} số.'], [[list.length]],
    M('T1.SO.02', 'TOAN.SOSANH', 'so_sanh_so', l, `Đó là các số ${list.join(', ')}.`,
      `Đếm các số đứng sau ${a} và trước ${b}: ${list.join(', ')}. Có ${list.length} số.`));
};

// ===========================================================================
// 4. MẤY VÀ MẤY (Bài 5)
// ===========================================================================
const bondFig = (whole: string, a: string, b: string): Figure => ({
  kind: 'bond', whole, parts: [a, b], alt: `Sơ đồ tách gộp: ${whole === '?' ? 'ô trống' : whole} gồm ${a === '?' ? 'ô trống' : a} và ${b === '?' ? 'ô trống' : b}`,
});

const bondPart: Template = (r, c, l) => {
  const n = r.int(3, c.max);
  const a = r.int(1, n - 1);
  const left = r.chance(0.5);
  return Q.blanks('Viết số thích hợp vào ô trống.', [left ? `${n} gồm {} và ${n - a}` : `${n} gồm ${a} và {}`], [[left ? a : n - a]],
    M('T1.PT.01', 'TOAN.SOTHIEU', 'may_va_may', l, `${n} gồm ${a} và ${n - a}.`),
    { figure: bondFig(String(n), left ? '?' : String(a), left ? String(n - a) : '?') });
};

const bondWhole: Template = (r, c, l) => {
  const a = r.int(1, c.max - 1);
  const b = r.int(1, c.max - a);
  return Q.blanks('Viết số thích hợp vào ô trống.', [`${a} và ${b} được {}`], [[a + b]],
    M('T1.PT.01', 'TOAN.SOTHIEU', 'may_va_may', l, `${a} và ${b} được ${a + b}.`), { figure: bondFig('?', String(a), String(b)) });
};

const bondPicture: Template = (r, c, l) => {
  const [x, y] = twoThings(r);
  const a = r.int(1, c.max - 1);
  const b = r.int(1, c.max - a);
  return Q.blanks('Quan sát tranh rồi viết số thích hợp.', [`Có {} ${x.name} và {} ${y.name}.`, 'Gộp lại được {}.'], [[a, b, a + b]],
    M('T1.PT.01', 'TOAN.DEM', 'may_va_may', l, `${a} và ${b} được ${a + b}.`), { figure: objectsFig([{ t: x, n: a }, { t: y, n: b }]) });
};

const splitWord: Template = (r, c, l) => {
  const item = r.pick(STUFF);
  const n = r.int(4, c.max);
  const a = r.int(1, n - 1);
  const name = r.pick(KIDS);
  return Q.blanks(`${name} có ${n} ${item.name}, xếp vào hai hộp. Hộp thứ nhất có ${a} ${item.name}. Hộp thứ hai có mấy ${item.name}?`,
    [`Hộp thứ hai có {} ${item.name}.`], [[n - a]],
    M('T1.PT.03', 'TOAN.LOIVAN', 'may_va_may', l, `${n} gồm ${a} và ${n - a}.`,
      `Tất cả có ${n} ${item.name}. Hộp thứ nhất có ${a}. Đếm tiếp từ ${a} đến ${n}: được ${n - a} lần. Vậy ${n} gồm ${a} và ${n - a}; hộp thứ hai có ${n - a} ${item.name}.`));
};

const whichWhole: Template = (r, c, l) => {
  const a = r.int(1, c.max - 2);
  const b = r.int(1, c.max - a);
  const s = a + b;
  return Q.sc(`Số nào gồm ${a} và ${b}?`, numOptions(r, s, 1, c.max, 3), String(s),
    M('T1.PT.01', 'TOAN.SOTHIEU', 'may_va_may', l, `${a} và ${b} được ${s}.`,
      `Đếm ${a}, rồi đếm thêm ${b} nữa: được ${s}. Vậy ${s} gồm ${a} và ${b}.`));
};

const splitAll: Template = (r, c, l) => {
  const n = r.int(5, c.max);
  const good = r.sample(Array.from({ length: n - 1 }, (_, i) => i + 1).filter((a) => a <= n - a), Math.min(3, Math.floor((n - 1) / 2)));
  if (good.length < 2) return null;
  const goodPairs = good.map((a) => `${a} và ${n - a}`);
  const bad: string[] = [];
  while (bad.length < 2) {
    const a = r.int(1, n - 1);
    const b = n - a + r.pick([-1, 1]);
    const t = `${a} và ${b}`;
    if (b >= 1 && a + b <= c.max && !bad.includes(t) && !goodPairs.includes(t)) bad.push(t);
  }
  const opts = r.shuffle([...goodPairs, ...bad]);
  return Q.mc(`Chọn TẤT CẢ các cách tách số ${n} thành hai phần.`, opts, goodPairs,
    M('T1.PT.01', 'TOAN.SOTHIEU', 'may_va_may', l, `${n} gồm ${goodPairs.join('; ')}.`,
      `Với mỗi cách, đếm phần thứ nhất rồi đếm thêm phần thứ hai. Cách nào đếm được đúng ${n} là đúng: ${goodPairs.join('; ')}.`));
};

const bondTable: Template = (r, c, l) => {
  const rows: [string, boolean][] = [];
  const used = new Set<string>();
  while (rows.length < 4) {
    const n = r.int(3, c.max);
    const a = r.int(1, n - 1);
    const truthy = r.chance(0.5);
    const b = truthy ? n - a : n - a + r.pick([-1, 1]);
    const t = `${n} gồm ${a} và ${b}.`;
    if (b < 1 || used.has(t)) continue;
    used.add(t);
    rows.push([t, a + b === n]);
  }
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.PT.01', 'TOAN.DUNGSAI', 'may_va_may', l, 'Gộp hai phần lại, xem có được đúng số đã cho không.',
      'Với mỗi dòng: đếm phần thứ nhất rồi đếm thêm phần thứ hai. Nếu đếm được đúng số đầu dòng thì chọn Đ, nếu không thì chọn S.'));
};

const halves: Template = (r, c, l) => {
  const h = r.int(1, Math.floor(c.max / 2));
  const n = h * 2;
  const item = r.pick(STUFF);
  const name = r.pick(KIDS);
  return Q.blanks(`${name} chia đều ${n} ${item.name} cho hai bạn, hai bạn được số ${bare(item.name)} bằng nhau. Mỗi bạn được mấy ${item.name}?`,
    [`${n} gồm {} và {}`, `Mỗi bạn được {} ${item.name}.`], [[h, h, h]],
    M('T1.PT.01', 'TOAN.LOIVAN', 'may_va_may', l, `${n} gồm ${h} và ${h}.`,
      `Chia lần lượt: mỗi lượt đưa cho bạn thứ nhất một ${bare(item.name)}, bạn thứ hai một ${bare(item.name)}, cho đến khi hết ${n} ${item.name}. Mỗi bạn được ${h}. Vậy ${n} gồm ${h} và ${h}.`));
};

// ===========================================================================
// 5. HÌNH PHẲNG (Bài 7, 9)
// ===========================================================================
const shapeOptions = (r: Rng) => r.shuffle(SHAPES).map(shapeTitle);

const shapeName: Template = (r, _c, l) => {
  const s = r.pick(SHAPES);
  return Q.sc('Đây là hình gì?', shapeOptions(r), shapeTitle(s),
    M('T1.HH.02', 'TOAN.HINH', 'hinh_phang', l, `Đây là ${SHAPE_LABEL[s]}.`), { figure: shapeFig(s, r.pick(COLORS)) });
};

const objectShape: Template = (r, _c, l) => {
  const s = r.pick(SHAPES);
  const obj = r.pick(SHAPE_OBJECTS[s]);
  return Q.sc(`${obj} thường có dạng hình gì?`, shapeOptions(r), shapeTitle(s),
    M('T1.HH.02', 'TOAN.HINH', 'hinh_phang', l, `${obj} có dạng ${SHAPE_LABEL[s]}.`));
};

const oddOne: Template = (r, _c, l) => {
  const [main, odd] = r.sample(SHAPES, 2);
  if ((main === 'square' && odd === 'rectangle') || (main === 'rectangle' && odd === 'square')) return null; // dễ nhầm
  const items = Array.from({ length: 4 }, () => ({ shape: main, color: r.pick(COLORS) }));
  items[r.int(0, 3)] = { shape: odd, color: r.pick(COLORS) };
  return Q.sc('Trong hàng có một hình khác các hình còn lại. Đó là hình gì?', shapeOptions(r), shapeTitle(odd),
    M('T1.HH.02', 'TOAN.HINH', 'hinh_phang', l, `Ba hình là ${SHAPE_LABEL[main]}, một hình là ${SHAPE_LABEL[odd]}.`),
    { figure: { kind: 'shapes', items, alt: `Ba ${SHAPE_LABEL[main]} và một ${SHAPE_LABEL[odd]}` } });
};

const countScene: Template = (r, c, l) => {
  const { fig, counts } = buildScene(r);
  const kinds = SHAPES.filter((s) => counts[s] > 0 && counts[s] <= c.max);
  if (kinds.length < 2) return null;
  const ask = r.sample(kinds, Math.min(3, kinds.length));
  const ns = ask.map((s) => counts[s]);
  const facts = ask.map((s, i) => `${ns[i]} ${SHAPE_LABEL[s]}`).join(', ');
  return Q.blanks('Trong tranh, mỗi loại hình có bao nhiêu hình?', ask.map((s) => `Có {} ${SHAPE_LABEL[s]}.`), [ns],
    M('T1.HH.02', 'TOAN.DEM', 'hinh_phang', l, `Có ${facts}.`,
      `Đếm lần lượt từng loại hình, đếm hình nào thì đánh dấu hình đó để không đếm lại: ${facts}.`), { figure: fig });
};

const classifyObjects: Template = (r, _c, l) => {
  const s = r.pick(SHAPES);
  const good = r.sample(SHAPE_OBJECTS[s], 2);
  const others = SHAPES.filter((x) => x !== s && !(s === 'square' && x === 'rectangle') && !(s === 'rectangle' && x === 'square'));
  const bad = r.sample(others, 2).map((x) => r.pick(SHAPE_OBJECTS[x]));
  return Q.mc(`Chọn TẤT CẢ đồ vật thường có dạng ${SHAPE_LABEL[s]}.`, r.shuffle([...good, ...bad]), good,
    M('T1.HH.02', 'TOAN.HINH', 'hinh_phang', l, `${good.join(', ')} có dạng ${SHAPE_LABEL[s]}.`,
      `Nghĩ xem mặt của từng đồ vật trông giống hình nào: ${good.join(', ')} giống ${SHAPE_LABEL[s]}; các đồ vật còn lại có dạng hình khác.`));
};

const tfShapes: Template = (r, c, l) => {
  const kinds = r.sample(SHAPES, 3);
  const { fig, counts } = shapeRow(r, kinds, r.int(6, 9));
  const rows: [string, boolean][] = [];
  for (const s of r.sample(kinds, 2)) {
    const truthy = r.chance(0.5);
    const shown = truthy ? counts[s] : counts[s] + r.pick([-1, 1]);
    if (shown < 0) return null;
    rows.push([`Có ${shown} ${SHAPE_LABEL[s]}.`, shown === counts[s]]);
  }
  const [a, b] = r.sample(kinds, 2);
  const more = r.chance(0.5);
  rows.push([`Số ${SHAPE_LABEL[a]} ${more ? 'nhiều hơn' : 'ít hơn'} số ${SHAPE_LABEL[b]}.`, more ? counts[a] > counts[b] : counts[a] < counts[b]]);
  const d = kinds.find((x) => x !== a && x !== b) as ShapeName;
  rows.push([`Có ${counts[d]} ${SHAPE_LABEL[d]}.`, true]);
  const mixed = mixRows(r, rows);
  if (!mixed || Object.values(counts).some((x) => x > c.max)) return null;
  const facts = kinds.map((s) => `${counts[s]} ${SHAPE_LABEL[s]}`).join(', ');
  return Q.table('Quan sát các hình. Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.HH.02', 'TOAN.DUNGSAI', 'hinh_phang', l, `Có ${facts}.`, `Đếm từng loại hình: ${facts}. Rồi đối chiếu từng nhận định.`), { figure: fig });
};

function shapeChoice(r: Rng, right: ShapeName) {
  const opts = r.shuffle(SHAPES);
  const figs: Record<string, Figure> = {};
  for (const s of opts) figs[shapeTitle(s)] = shapeFig(s);
  return { options: opts.map(shapeTitle), figs, correct: shapeTitle(right) };
}

const patternRow: Template = (r, _c, l) => {
  const unit = r.sample(SHAPES, r.chance(0.5) ? 2 : 3);
  const len = unit.length === 2 ? r.int(5, 7) : r.int(6, 8);
  const seq = Array.from({ length: len }, (_, i) => unit[i % unit.length]);
  const next = unit[len % unit.length];
  const ch = shapeChoice(r, next);
  return Q.sc('Các hình được xếp theo quy luật. Hình tiếp theo (ở ô có dấu ?) là hình gì?', ch.options, ch.correct,
    M('T1.HH.04', 'TOAN.HINH', 'quy_luat', l, `Các hình lặp lại theo nhóm: ${unit.map((s) => SHAPE_LABEL[s]).join(', ')}.`,
      `Tìm nhóm hình lặp lại: ${unit.map((s) => SHAPE_LABEL[s]).join(' → ')}, rồi lại bắt đầu từ đầu. Đếm tiếp theo nhóm đó thì ô có dấu ? là ${SHAPE_LABEL[next]}.`),
    { figure: { kind: 'pattern', cols: len + 1, cells: [...seq, '?'], alt: `Dãy hình: ${seq.map((s) => SHAPE_LABEL[s]).join(', ')}, ô cuối có dấu hỏi` }, optionFigures: ch.figs });
};

const pattern3x3: Template = (r, _c, l) => {
  const three = r.sample(SHAPES, 3);
  const shift = r.chance(0.5) ? 1 : 2;
  const grid: ShapeName[] = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) grid.push(three[(col + row * shift) % 3]);
  const hole = r.int(0, 8);
  const right = grid[hole];
  const cells = grid.map((s, i) => (i === hole ? '?' : s)) as (ShapeName | '?')[];
  const ch = shapeChoice(r, right);
  return Q.sc('Mỗi hàng và mỗi cột đều có đủ ba loại hình khác nhau. Hình nào đặt vào ô có dấu ? là đúng?', ch.options, ch.correct,
    M('T1.HH.04', 'TOAN.HINH', 'quy_luat', l, `Ô có dấu ? là ${SHAPE_LABEL[right]}.`,
      `Nhìn hàng có ô dấu ?: hàng đó đã có hai loại hình, còn thiếu ${SHAPE_LABEL[right]}. Kiểm tra cột: cột đó cũng thiếu ${SHAPE_LABEL[right]}. Vậy chọn ${SHAPE_LABEL[right]}.`),
    { figure: { kind: 'pattern', cols: 3, cells, alt: 'Lưới 3 hàng 3 cột gồm ba loại hình, một ô có dấu hỏi' }, optionFigures: ch.figs });
};

// ===========================================================================
// 6. LẮP GHÉP, XẾP HÌNH — QUE TÍNH (Bài 8, 9)
// ===========================================================================
type Seg = [number, number, number, number];
const U = 44;
function dedupeSegs(segs: Seg[]): Seg[] {
  const key = (s: Seg) => {
    const [a, b, c2, d] = s;
    return a < c2 || (a === c2 && b <= d) ? `${a},${b},${c2},${d}` : `${c2},${d},${a},${b}`;
  };
  const seen = new Map<string, Seg>();
  for (const s of segs) seen.set(key(s), s);
  return [...seen.values()];
}

/** k ô vuông nối nhau thành đường gấp khúc (không tạo khối 2×2, nên không có hình vuông lớn) */
function squarePath(r: Rng, k: number) {
  const cells: [number, number][] = [[0, 0]];
  let guard = 0;
  while (cells.length < k && guard++ < 50) {
    const [x, y] = cells[cells.length - 1];
    const [dx, dy] = r.pick([[1, 0], [1, 0], [0, 1], [0, -1]] as [number, number][]);
    const nx = x + dx, ny = y + dy;
    if (cells.some(([a, b]) => a === nx && b === ny)) continue;
    const next = [...cells, [nx, ny] as [number, number]];
    const has2x2 = next.some(([a, b]) => [[a + 1, b], [a, b + 1], [a + 1, b + 1]].every(([p, q]) => next.some(([m, n]) => m === p && n === q)));
    if (has2x2) continue;
    cells.push([nx, ny]);
  }
  if (cells.length < k) return null;
  const minY = Math.min(...cells.map((c) => c[1]));
  const segs: Seg[] = [];
  for (const [cx, cy0] of cells) {
    const x = cx * U, y = (cy0 - minY) * U;
    segs.push([x, y, x + U, y], [x, y + U, x + U, y + U], [x, y, x, y + U], [x + U, y, x + U, y + U]);
  }
  const all = dedupeSegs(segs);
  const w = (Math.max(...cells.map((c) => c[0])) + 1) * U;
  const h = (Math.max(...cells.map((c) => c[1])) - minY + 1) * U;
  return { segs: all, w, h };
}

/** n tam giác xếp so le thành một hàng (úp – ngửa) */
function triangleRow(n: number) {
  const H = 40;
  const half = U / 2;
  const segs: Seg[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * half;
    if (i % 2 === 0) segs.push([x, H, x + half, 0], [x + half, 0, x + U, H], [x, H, x + U, H]);
    else segs.push([x, 0, x + half, H], [x + half, H, x + U, 0], [x, 0, x + U, 0]);
  }
  return { segs: dedupeSegs(segs), w: (n + 1) * half, h: H };
}

const sticksFig = (g: { segs: Seg[]; w: number; h: number }, alt: string, color = '#e8a33d'): Figure => ({ kind: 'sticks', w: g.w, h: g.h, segs: g.segs, color, alt });

const sticksSquares: Template = (r, c, l) => {
  const k = r.int(2, 4);
  const g = squarePath(r, k);
  if (!g) return null;
  return Q.blanks('Hình dưới đây được xếp bằng que tính.', ['Có {} hình vuông.'], [[k]],
    M('T1.HH.04', 'TOAN.DEM', 'xep_hinh', l, `Có ${k} hình vuông nhỏ.`, l >= 3 ? `Đếm từng ô vuông nhỏ, mỗi ô đếm một lần: có ${k} hình vuông.` : undefined),
    { figure: sticksFig(g, `Que tính xếp thành ${k} ô vuông liền nhau`) });
};

const sticksTriangles: Template = (r, _c, l) => {
  const n = r.int(2, 4);
  const g = triangleRow(n);
  return Q.blanks('Hình dưới đây được xếp bằng que tính.', ['Có {} hình tam giác.'], [[n]],
    M('T1.HH.04', 'TOAN.DEM', 'xep_hinh', l, `Có ${n} hình tam giác.`, `Đếm lần lượt từ trái sang phải cả hình tam giác ngửa và hình tam giác úp: có ${n} hình.`),
    { figure: sticksFig(g, `Que tính xếp thành ${n} hình tam giác liền nhau`, '#5aa0e0') });
};

const sticksCount: Template = (r, c, l) => {
  const tri = r.chance(0.5);
  const g = tri ? triangleRow(r.int(2, 4)) : squarePath(r, r.int(2, 3));
  if (!g || g.segs.length > c.max) return null;
  return Q.blanks('Hình dưới đây được xếp bằng bao nhiêu que tính?', ['Cần {} que tính.'], [[g.segs.length]],
    M('T1.HH.04', 'TOAN.DEM', 'xep_hinh', l, `Hình được xếp bằng ${g.segs.length} que tính.`,
      'Đếm từng que tính một (đếm que nào thì đánh dấu que đó). Cạnh chung của hai hình chỉ là một que, chỉ đếm một lần.'),
    { figure: sticksFig(g, 'Hình xếp bằng que tính', tri ? '#5aa0e0' : '#e8a33d') });
};

const COMPOSE: { q: string; a: ShapeName; why: string }[] = [
  { q: 'Ghép 2 hình vuông bằng nhau đặt cạnh nhau, được hình gì?', a: 'rectangle', why: 'Hai hình vuông đặt cạnh nhau tạo thành một hình dài hơn: hình chữ nhật.' },
  { q: 'Ghép 3 hình vuông bằng nhau thành một hàng ngang, được hình gì?', a: 'rectangle', why: 'Ba hình vuông xếp thành hàng tạo thành hình chữ nhật dài.' },
  { q: 'Ghép 4 hình vuông bằng nhau thành 2 hàng, mỗi hàng 2 hình, được hình gì?', a: 'square', why: 'Hai hàng, mỗi hàng hai hình vuông tạo thành một hình vuông to.' },
  { q: 'Gấp đôi tờ giấy hình vuông theo đường chéo, được hình gì?', a: 'triangle', why: 'Gấp theo đường chéo, tờ giấy vuông thành hình tam giác.' },
  { q: 'Ghép 2 hình tam giác là hai nửa của một hình vuông, được hình gì?', a: 'square', why: 'Hai nửa của hình vuông ghép lại thành hình vuông.' },
  { q: 'Gấp đôi tờ giấy hình vuông theo đường ở giữa (từ cạnh này sang cạnh đối diện), được hình gì?', a: 'rectangle', why: 'Gấp đôi theo đường giữa, tờ giấy vuông thành hình chữ nhật.' },
];
const compose: Template = (r, _c, l) => {
  const it = r.pick(COMPOSE);
  return Q.sc(it.q, shapeOptions(r), shapeTitle(it.a), M('T1.HH.04', 'TOAN.HINH', 'xep_hinh', l, it.why, l >= 3 ? `${it.why} Em có thể lấy giấy thử gấp hoặc ghép để kiểm tra.` : undefined));
};

const sticksNeeded: Template = (r, c, l) => {
  const tri = r.chance(0.5);
  const k = tri ? r.int(1, 3) : r.int(1, 2);
  const per = tri ? 3 : 4;
  const ans = k * per;
  const shape = tri ? 'hình tam giác' : 'hình vuông';
  const counting = Array.from({ length: k }, (_, i) => `${shape} thứ ${i + 1} cần ${per} que`).join(', ');
  return Q.sc(`Cần mấy que tính để xếp ${k} ${shape} rời nhau (không chung cạnh)?`, numOptions(r, ans, 1, c.max), String(ans),
    M('T1.HH.04', 'TOAN.LOIVAN', 'xep_hinh', l, `Mỗi ${shape} cần ${per} que; ${k} hình cần ${ans} que.`,
      `Mỗi ${shape} có ${per} cạnh, mỗi cạnh là 1 que tính. ${cap(counting)}. Đếm tất cả được ${ans} que.`));
};

const sharedVsApart: Template = (r, _c, l) => {
  const tri = r.chance(0.5);
  const shared = tri ? triangleRow(2) : { segs: dedupeSegs([[0, 0, U, 0], [0, U, U, U], [0, 0, 0, U], [U, 0, U, U], [U, 0, 2 * U, 0], [U, U, 2 * U, U], [2 * U, 0, 2 * U, U]] as Seg[]), w: 2 * U, h: U };
  const apartSegs: Seg[] = tri
    ? [[0, 40, 22, 0], [22, 0, 44, 40], [0, 40, 44, 40], [64, 40, 86, 0], [86, 0, 108, 40], [64, 40, 108, 40]]
    : [[0, 0, U, 0], [0, U, U, U], [0, 0, 0, U], [U, 0, U, U], [U + 20, 0, 2 * U + 20, 0], [U + 20, U, 2 * U + 20, U], [U + 20, 0, U + 20, U], [2 * U + 20, 0, 2 * U + 20, U]];
  const apart = { segs: apartSegs, w: tri ? 108 : 2 * U + 20, h: tri ? 40 : U };
  const name = r.pick(KIDS);
  const shape = tri ? 'hình tam giác' : 'hình vuông';
  const have = shared.segs.length;
  const figs: Record<string, Figure> = { 'Cách 1': sticksFig(shared, `Hai ${shape} chung một cạnh`), 'Cách 2': sticksFig(apart, `Hai ${shape} rời nhau`) };
  const swap = r.chance(0.5);
  if (swap) [figs['Cách 1'], figs['Cách 2']] = [figs['Cách 2'], figs['Cách 1']];
  const right = swap ? 'Cách 2' : 'Cách 1';
  return Q.sc(`${name} có ${have} que tính và muốn xếp 2 ${shape}. ${name} xếp theo cách nào thì đủ que?`, ['Cách 1', 'Cách 2'], right,
    M('T1.HH.04', 'TOAN.LOIVAN', 'xep_hinh', l, `Xếp chung một cạnh cần ${have} que, xếp rời nhau cần ${apart.segs.length} que.`,
      `Đếm que ở mỗi cách: xếp rời nhau cần ${apart.segs.length} que; xếp chung một cạnh thì cạnh chung chỉ cần 1 que nên cần ${have} que. ${name} có ${have} que nên chọn cách xếp chung cạnh (${right}).`),
    { optionFigures: figs });
};

const tfScene: Template = (r, c, l) => {
  const { fig, counts } = buildScene(r);
  const kinds = SHAPES.filter((s) => counts[s] > 0);
  if (kinds.length < 3 || kinds.some((s) => counts[s] > c.max)) return null;
  const rows: [string, boolean][] = [];
  for (const s of r.sample(kinds, 3)) {
    const truthy = r.chance(0.5);
    const shown = truthy ? counts[s] : counts[s] + r.pick([-1, 1]);
    if (shown < 1) return null;
    rows.push([`Có ${shown} ${SHAPE_LABEL[s]}.`, shown === counts[s]]);
  }
  const [a, b] = r.sample(kinds, 2);
  if (counts[a] === counts[b]) return null;
  rows.push([`Số ${SHAPE_LABEL[a]} nhiều hơn số ${SHAPE_LABEL[b]}.`, counts[a] > counts[b]]);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  const facts = kinds.map((s) => `${counts[s]} ${SHAPE_LABEL[s]}`).join(', ');
  return Q.table('Quan sát tranh ghép hình. Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.HH.02', 'TOAN.DUNGSAI', 'hinh_phang', l, `Tranh có ${facts}.`, `Đếm từng loại hình trong tranh: ${facts}. Rồi đối chiếu từng nhận định.`), { figure: fig });
};

// ===========================================================================
// 7. PHÉP CỘNG, PHÉP TRỪ TRONG PHẠM VI 10 (Bài 10–13)
// ===========================================================================
function sumPair(r: Rng, c: Ctx, minSum = 2) {
  const s = r.int(minSum, c.max);
  const a = r.chance(0.1) ? 0 : r.int(1, s - 1);
  return { a, b: s - a, s };
}
function subPair(r: Rng, c: Ctx) {
  const n = r.int(2, c.max);
  const k = r.chance(0.1) ? 0 : r.int(1, n - 1);
  return { n, k, d: n - k };
}

const addCalc: Template = (r, c, l) => {
  const lines: string[] = [];
  const ans: number[] = [];
  const count = l >= 2 ? 3 : 2;
  const seen = new Set<string>();
  while (lines.length < count) {
    const { a, b, s } = sumPair(r, c);
    if (seen.has(`${a}+${b}`)) continue;
    seen.add(`${a}+${b}`);
    lines.push(`${a} + ${b} = {}`);
    ans.push(s);
  }
  return Q.blanks('Tính.', lines, [ans], M('T1.PT.02', 'TOAN.TINH', 'cong_10', l, lines.map((x, i) => x.replace('{}', String(ans[i]))).join('; ') + '.'));
};

const subCalc: Template = (r, c, l) => {
  const lines: string[] = [];
  const ans: number[] = [];
  const count = l >= 2 ? 3 : 2;
  const seen = new Set<string>();
  while (lines.length < count) {
    const { n, k, d } = subPair(r, c);
    if (seen.has(`${n}-${k}`)) continue;
    seen.add(`${n}-${k}`);
    lines.push(`${n} ${MINUS} ${k} = {}`);
    ans.push(d);
  }
  return Q.blanks('Tính.', lines, [ans], M('T1.PT.02', 'TOAN.TINH', 'tru_10', l, lines.map((x, i) => x.replace('{}', String(ans[i]))).join('; ') + '.'));
};

const addPicture: Template = (r, c, l) => {
  const t = r.pick(THINGS);
  const { a, b, s } = sumPair(r, c, 3);
  if (a === 0) return null;
  return Q.blanks(`Hàng trên có ${a} ${t.name}, hàng dưới có ${b} ${t.name}. Viết phép tính để biết có tất cả mấy ${t.name}.`, ['{} + {} = {}'], [[a, b, s], [b, a, s]],
    M('T1.PT.03', 'TOAN.TINH', 'cong_10', l, `${a} + ${b} = ${s}.`), { figure: objectsFig([{ t, n: a }, { t, n: b }]) });
};

const MOVERS: { t: Thing; verb: string }[] = [
  { t: { icon: '🐦', name: 'con chim' }, verb: 'bay đi' },
  { t: { icon: '🦋', name: 'con bướm' }, verb: 'bay đi' },
  { t: { icon: '🐟', name: 'con cá' }, verb: 'bơi đi' },
  { t: { icon: '🦆', name: 'con vịt' }, verb: 'bơi đi' },
  { t: { icon: '🐰', name: 'con thỏ' }, verb: 'chạy đi' },
  { t: { icon: '🎈', name: 'quả bóng bay' }, verb: 'bị vỡ' },
  { t: { icon: '🚗', name: 'chiếc ô tô' }, verb: 'chạy đi' },
];

const subPicture: Template = (r, c, l) => {
  const m = r.pick(MOVERS);
  const n = r.int(3, c.max);
  const k = r.int(1, n - 1);
  return Q.blanks(`Có ${n} ${m.t.name}, ${k} ${m.t.name} ${m.verb}. Viết phép tính để biết còn lại mấy ${m.t.name}.`, [`{} ${MINUS} {} = {}`], [[n, k, n - k]],
    M('T1.PT.03', 'TOAN.TINH', 'tru_10', l, `${n} ${MINUS} ${k} = ${n - k}.`), { figure: objectsFig([{ t: m.t, n }]) });
};

function exprOptions(r: Rng, c: Ctx, target: number, op: '+' | '-', n = 3) {
  const make = (v: number) => {
    if (op === '+') { const a = r.int(0, v); return `${a} + ${v - a}`; }
    const k = r.int(0, c.max - v); return `${v + k} ${MINUS} ${k}`;
  };
  const right = make(target);
  const wrongVals = r.sample([target - 2, target - 1, target + 1, target + 2].filter((x) => x >= 0 && x <= c.max), n - 1);
  const opts = r.shuffle([right, ...wrongVals.map(make)]);
  return new Set(opts).size === opts.length ? { opts, right } : null;
}

const exprWhich = (op: '+' | '-'): Template => (r, c, l) => {
  const target = r.int(op === '+' ? 2 : 0, op === '+' ? c.max : c.max - 2);
  const e = exprOptions(r, c, target, op);
  if (!e) return null;
  return Q.sc(`Phép tính nào có kết quả bằng ${target}?`, e.opts, e.right,
    M('T1.PT.02', 'TOAN.TINH', op === '+' ? 'cong_10' : 'tru_10', l, `${e.right} = ${target}.`));
};
const addWhich = exprWhich('+');
const subWhich = exprWhich('-');

function calcTable(r: Rng, c: Ctx, l: Level, ops: ('+' | '-')[]) {
  const rows: [string, boolean][] = [];
  const used = new Set<string>();
  while (rows.length < 4) {
    const op = r.pick(ops);
    let text: string;
    let real: number;
    if (op === '+') { const { a, b, s } = sumPair(r, c); text = `${a} + ${b}`; real = s; } else { const { n, k, d } = subPair(r, c); text = `${n} ${MINUS} ${k}`; real = d; }
    const truthy = r.chance(0.5);
    const shown = truthy ? real : real + r.pick([-1, 1]);
    if (shown < 0 || shown > c.max || used.has(text)) continue;
    used.add(text);
    rows.push([`${text} = ${shown}`, shown === real]);
  }
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table('Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.PT.02', 'TOAN.DUNGSAI', ops.length > 1 ? 'cong_tru_10' : ops[0] === '+' ? 'cong_10' : 'tru_10', l, 'Tính kết quả từng phép tính rồi so với số đã viết.',
      'Tính lại từng dòng (có thể đếm thêm với phép cộng, đếm bớt với phép trừ). Kết quả trùng số đã viết thì chọn Đ, khác thì chọn S.'));
}
const addTable: Template = (r, c, l) => calcTable(r, c, l, ['+']);
const subTable: Template = (r, c, l) => calcTable(r, c, l, ['-']);
const mixTable: Template = (r, c, l) => calcTable(r, c, l, ['+', '-']);

const ADD_STORIES = [
  (n: string, a: number, b: number, u: string) => `${n} có ${a} ${u}. Mẹ cho ${n} thêm ${b} ${u}. Hỏi ${n} có tất cả bao nhiêu ${u}?`,
  (n: string, a: number, b: number, u: string) => `Trên bàn có ${a} ${u}. ${n} đặt thêm ${b} ${u}. Hỏi trên bàn có tất cả bao nhiêu ${u}?`,
  (n: string, a: number, b: number, u: string) => `${n} có ${a} ${u}, bạn của ${n} có ${b} ${u}. Hỏi cả hai bạn có bao nhiêu ${u}?`,
];
const SUB_STORIES = [
  (n: string, a: number, b: number, u: string) => `${n} có ${a} ${u}. ${n} cho bạn ${b} ${u}. Hỏi ${n} còn lại bao nhiêu ${u}?`,
  (n: string, a: number, b: number, u: string) => `Trong hộp có ${a} ${u}. ${n} lấy ra ${b} ${u}. Hỏi trong hộp còn lại bao nhiêu ${u}?`,
  (n: string, a: number, b: number, u: string) => `${n} có ${a} ${u}, đã dùng hết ${b} ${u}. Hỏi ${n} còn lại bao nhiêu ${u}?`,
];

const addWord: Template = (r, c, l) => {
  const { a, b, s } = sumPair(r, c, 3);
  if (a === 0 || b === 0) return null;
  const u = r.pick(STUFF).unit;
  const name = r.pick(KIDS);
  return Q.blanks(r.pick(ADD_STORIES)(name, a, b, u), ['Phép tính: {} + {} = {}', `Trả lời: Có tất cả {} ${u}.`], [[a, b, s, s], [b, a, s, s]],
    M('T1.PT.07', 'TOAN.LOIVAN', 'loi_van', l, `${a} + ${b} = ${s}.`,
      `Bài toán hỏi "tất cả" nên gộp hai phần lại, làm phép cộng: ${a} + ${b} = ${s}. Trả lời: có tất cả ${s} ${u}.`));
};

const subWord: Template = (r, c, l) => {
  const { n, k, d } = subPair(r, c);
  if (k === 0 || n < 3) return null;
  const u = r.pick(STUFF).unit;
  const name = r.pick(KIDS);
  return Q.blanks(r.pick(SUB_STORIES)(name, n, k, u), [`Phép tính: {} ${MINUS} {} = {}`, `Trả lời: Còn lại {} ${u}.`], [[n, k, d, d]],
    M('T1.PT.07', 'TOAN.LOIVAN', 'loi_van', l, `${n} ${MINUS} ${k} = ${d}.`,
      `Bài toán hỏi "còn lại" sau khi bớt đi nên làm phép trừ: lấy số lúc đầu ${n} trừ đi số bớt đi ${k}: ${n} ${MINUS} ${k} = ${d}. Trả lời: còn lại ${d} ${u}.`));
};

const addMissing: Template = (r, c, l) => {
  const { a, b, s } = sumPair(r, c, 3);
  const left = r.chance(0.5);
  return Q.blanks('Điền số thích hợp vào ô trống.', [left ? `{} + ${b} = ${s}` : `${a} + {} = ${s}`], [[left ? a : b]],
    M('T1.PT.02', 'TOAN.SOTHIEU', 'cong_10', l, `${a} + ${b} = ${s}.`,
      `${left ? `Số nào cộng ${b} được ${s}?` : `${a} cộng mấy được ${s}?`} Đếm thêm từ ${left ? b : a} đến ${s}: được ${left ? a : b}. Vậy số cần điền là ${left ? a : b}.`));
};

const subMissing: Template = (r, c, l) => {
  const { n, k, d } = subPair(r, c);
  const first = r.chance(0.5);
  return Q.blanks('Điền số thích hợp vào ô trống.', [first ? `{} ${MINUS} ${k} = ${d}` : `${n} ${MINUS} {} = ${d}`], [[first ? n : k]],
    M('T1.PT.02', 'TOAN.SOTHIEU', 'tru_10', l, `${n} ${MINUS} ${k} = ${d}.`,
      first
        ? `Số nào bớt đi ${k} thì còn ${d}? Lấy ${d} cộng thêm ${k}: ${d} + ${k} = ${n}. Vậy số cần điền là ${n}.`
        : `${n} bớt đi mấy thì còn ${d}? Đếm từ ${d} lên ${n} được ${k}. Vậy số cần điền là ${k}.`));
};

const calcCompare = (op: '+' | '-'): Template => (r, c, l) => {
  let left: string, v: number;
  if (op === '+') { const p = sumPair(r, c); left = `${p.a} + ${p.b}`; v = p.s; } else { const p = subPair(r, c); left = `${p.n} ${MINUS} ${p.k}`; v = p.d; }
  const other = r.chance(0.25) ? v : r.int(Math.max(0, v - 2), Math.min(c.max, v + 2));
  const s = sign(v, other);
  return Q.sc(`Chọn dấu thích hợp: ${left} … ${other}`, ['>', '<', '='], s,
    M('T1.SO.02', 'TOAN.SOSANH', op === '+' ? 'cong_10' : 'tru_10', l, `${left} = ${v}, mà ${v} ${s} ${other}.`,
      `Tính trước: ${left} = ${v}. Sau đó so sánh ${v} với ${other}: ${v} ${SIGN_WORD[s]} ${other}. Vậy chọn dấu ${s}.`));
};
const addCompare = calcCompare('+');
const subCompare = calcCompare('-');

const manyEqual = (op: '+' | '-'): Template => (r, c, l) => {
  const target = r.int(op === '+' ? 4 : 1, op === '+' ? c.max : c.max - 3);
  const good = new Set<string>();
  let guard = 0;
  while (good.size < 2 && guard++ < 30) {
    if (op === '+') { const a = r.int(1, target - 1); good.add(`${a} + ${target - a}`); } else { const k = r.int(1, c.max - target); good.add(`${target + k} ${MINUS} ${k}`); }
  }
  if (good.size < 2) return null;
  const bad = new Set<string>();
  guard = 0;
  while (bad.size < 2 && guard++ < 30) {
    const v = target + r.pick([-1, 1, 2]);
    if (v < 0 || v > c.max) continue;
    if (op === '+') { if (v < 1) continue; const a = r.int(0, v); bad.add(`${a} + ${v - a}`); } else { const k = r.int(0, c.max - v); bad.add(`${v + k} ${MINUS} ${k}`); }
  }
  if (bad.size < 2) return null;
  const right = [...good];
  return Q.mc(`Chọn TẤT CẢ các phép tính có kết quả bằng ${target}.`, r.shuffle([...right, ...bad]), right,
    M('T1.PT.02', 'TOAN.TINH', op === '+' ? 'cong_10' : 'tru_10', l, `${right.join(' và ')} đều bằng ${target}.`,
      `Tính từng phép tính: ${[...right, ...bad].map((e) => `${e} = ${evalExpr(e)}`).join('; ')}. Chọn các phép tính bằng ${target}.`));
};
const addMany = manyEqual('+');
const subMany = manyEqual('-');

function evalExpr(e: string): number {
  const m = e.match(/^(\d+) ([+−]) (\d+)$/);
  if (!m) return NaN;
  return m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3];
}

const family: Template = (r, c, l) => {
  const { a, b, s } = sumPair(r, c, 3);
  if (a === 0 || a === b) return null;
  return Q.blanks(`Biết ${a} + ${b} = ${s}. Viết kết quả các phép tính sau.`, [`${b} + ${a} = {}`, `${s} ${MINUS} ${a} = {}`, `${s} ${MINUS} ${b} = {}`], [[s, b, a]],
    M('T1.PT.02', 'TOAN.TINH', 'cong_tru_10', l, `${b} + ${a} = ${s}; ${s} ${MINUS} ${a} = ${b}; ${s} ${MINUS} ${b} = ${a}.`,
      `Đổi chỗ hai số trong phép cộng thì kết quả không đổi: ${b} + ${a} = ${s}. ${s} gồm ${a} và ${b}, nên ${s} bớt ${a} còn ${b}, ${s} bớt ${b} còn ${a}.`));
};

const opPick: Template = (r, c, l) => {
  const plus = r.chance(0.5);
  let a: number, b: number, res: number;
  if (plus) { const p = sumPair(r, c, 3); a = p.a; b = p.b; res = p.s; } else { const p = subPair(r, c); a = p.n; b = p.k; res = p.d; }
  if (b === 0) return null;
  const op = plus ? '+' : MINUS;
  return Q.sc(`Chọn dấu + hoặc ${MINUS} thích hợp: ${a} … ${b} = ${res}`, ['+', MINUS], op,
    M('T1.PT.02', 'TOAN.TINH', 'cong_tru_10', l, `${a} ${op} ${b} = ${res}.`,
      `Kết quả ${res} ${res > a ? `lớn hơn ${a}, nên phải thêm vào: dùng dấu +` : `bé hơn ${a}, nên phải bớt đi: dùng dấu ${MINUS}`}. ${a} ${op} ${b} = ${res}.`));
};

const biggest: Template = (r, c, l) => {
  const exprs: string[] = [];
  const vals: number[] = [];
  let guard = 0;
  while (exprs.length < 3 && guard++ < 40) {
    let e: string, v: number;
    if (r.chance(0.5)) { const p = sumPair(r, c); e = `${p.a} + ${p.b}`; v = p.s; } else { const p = subPair(r, c); e = `${p.n} ${MINUS} ${p.k}`; v = p.d; }
    if (vals.includes(v)) continue;
    exprs.push(e);
    vals.push(v);
  }
  if (exprs.length < 3) return null;
  const big = r.chance(0.5);
  const target = big ? Math.max(...vals) : Math.min(...vals);
  const right = exprs[vals.indexOf(target)];
  return Q.sc(`Phép tính nào có kết quả ${big ? 'lớn' : 'bé'} nhất?`, exprs, right,
    M('T1.PT.02', 'TOAN.TINH', 'cong_tru_10', l, `${right} = ${target}.`,
      `Tính từng phép tính: ${exprs.map((e, i) => `${e} = ${vals[i]}`).join('; ')}. Số ${big ? 'lớn' : 'bé'} nhất là ${target}, nên chọn ${right}.`));
};

// ===========================================================================
// 8. KHỐI LẬP PHƯƠNG, KHỐI HỘP CHỮ NHẬT (Bài 14)
// ===========================================================================
const BLOCK_TITLES: Record<BlockName, string> = { cube: 'Khối lập phương', box: 'Khối hộp chữ nhật' };

const blockName: Template = (r, _c, l) => {
  const k = r.pick(['cube', 'box'] as BlockName[]);
  return Q.sc('Đây là khối gì?', r.shuffle(Object.values(BLOCK_TITLES)), BLOCK_TITLES[k],
    M('T1.HH.03', 'TOAN.HINH', 'hinh_khoi', l, `Đây là ${BLOCK_LABEL[k]}.`), { figure: { kind: 'blocks', items: [k], alt: 'Một hình khối' } });
};

const objectBlock: Template = (r, _c, l) => {
  const k = r.pick(['cube', 'box'] as BlockName[]);
  const obj = r.pick(BLOCK_OBJECTS[k]);
  return Q.sc(`${obj} có dạng khối gì?`, r.shuffle(Object.values(BLOCK_TITLES)), BLOCK_TITLES[k],
    M('T1.HH.03', 'TOAN.HINH', 'hinh_khoi', l, `${obj} có dạng ${BLOCK_LABEL[k]}.`));
};

const countBlocks: Template = (r, c, l) => {
  const total = r.int(4, Math.min(7, c.max));
  const items: BlockName[] = ['cube', 'box'];
  while (items.length < total) items.push(r.pick(['cube', 'box'] as BlockName[]));
  const row = r.shuffle(items);
  const nc = row.filter((x) => x === 'cube').length;
  const nb = total - nc;
  return Q.blanks('Đếm các khối trong hình.', ['Có {} khối lập phương.', 'Có {} khối hộp chữ nhật.'], [[nc, nb]],
    M('T1.HH.03', 'TOAN.DEM', 'hinh_khoi', l, `Có ${nc} khối lập phương và ${nb} khối hộp chữ nhật.`,
      l >= 3 ? `Khối lập phương có các mặt là hình vuông (dài, rộng, cao bằng nhau); khối hộp chữ nhật dài hơn. Đếm từng loại: ${nc} và ${nb}.` : undefined),
    { figure: { kind: 'blocks', items: row, alt: `${nc} khối lập phương và ${nb} khối hộp chữ nhật xếp thành hàng` } });
};

const stackCount: Template = (r, c, l) => {
  const cols = r.int(2, 3);
  const stacks = Array.from({ length: cols }, () => r.int(1, l >= 4 ? 4 : 3));
  const total = stacks.reduce((s, x) => s + x, 0);
  if (total > c.max || total < 3) return null;
  return Q.blanks('Các khối lập phương được xếp thành các cột như hình.', ['Có tất cả {} khối lập phương.'], [[total]],
    M('T1.HH.03', 'TOAN.DEM', 'hinh_khoi', l, `Có ${stacks.join(' + ')} = ${total} khối.`,
      `Đếm từng cột: ${stacks.map((x, i) => `cột ${i + 1} có ${x} khối`).join(', ')}. Cộng lại: ${stacks.join(' + ')} = ${total}.`),
    { figure: { kind: 'blocks', stacks, alt: `Các cột khối lập phương cao ${stacks.join(', ')} khối` } });
};

const classifyBlocks: Template = (r, _c, l) => {
  const k = r.pick(['cube', 'box'] as BlockName[]);
  const other: BlockName = k === 'cube' ? 'box' : 'cube';
  const good = r.sample(BLOCK_OBJECTS[k], 2);
  const bad = [r.pick(BLOCK_OBJECTS[other]), r.pick(['Quả bóng', 'Quả cam', 'Lon nước ngọt', 'Cái nón lá'])];
  return Q.mc(`Chọn TẤT CẢ đồ vật có dạng ${BLOCK_LABEL[k]}.`, r.shuffle([...good, ...bad]), good,
    M('T1.HH.03', 'TOAN.HINH', 'hinh_khoi', l, `${good.join(', ')} có dạng ${BLOCK_LABEL[k]}.`,
      `${BLOCK_TITLES[k]} có ${k === 'cube' ? 'các mặt đều là hình vuông bằng nhau' : 'các mặt là hình chữ nhật, trông dài hơn khối lập phương'}. Đó là: ${good.join(', ')}.`));
};

const tfBlocks: Template = (r, c, l) => {
  const total = r.int(4, 7);
  const items: BlockName[] = ['cube', 'box'];
  while (items.length < total) items.push(r.pick(['cube', 'box'] as BlockName[]));
  const row = r.shuffle(items);
  const nc = row.filter((x) => x === 'cube').length;
  const nb = total - nc;
  if (nc === nb) return null;
  const rows: [string, boolean][] = [];
  const t1 = r.chance(0.5);
  rows.push([`Có ${t1 ? nc : nc + 1} khối lập phương.`, t1]);
  const t2 = r.chance(0.5);
  rows.push([`Có ${t2 ? nb : nb > 1 ? nb - 1 : nb + 1} khối hộp chữ nhật.`, t2]);
  rows.push([`Số khối lập phương nhiều hơn số khối hộp chữ nhật.`, nc > nb]);
  rows.push([`Có tất cả ${total} khối.`, true]);
  const mixed = mixRows(r, rows);
  if (!mixed || total > c.max) return null;
  return Q.table('Quan sát các khối. Đúng chọn Đ, sai chọn S.', mixed,
    M('T1.HH.03', 'TOAN.DUNGSAI', 'hinh_khoi', l, `Có ${nc} khối lập phương, ${nb} khối hộp chữ nhật.`, `Đếm từng loại khối: ${nc} khối lập phương, ${nb} khối hộp chữ nhật, tất cả ${total} khối. Rồi đối chiếu từng nhận định.`),
    { figure: { kind: 'blocks', items: row, alt: `${nc} khối lập phương và ${nb} khối hộp chữ nhật` } });
};

const towersEqual: Template = (r, c, l) => {
  const a = r.int(1, 4);
  const b = r.int(a + 1, Math.min(6, c.max - a));
  return Q.blanks('Cột bên trái thấp hơn cột bên phải. Cần xếp thêm mấy khối lập phương vào cột bên trái để hai cột cao bằng nhau?', ['Cần thêm {} khối.'], [[b - a]],
    M('T1.HH.03', 'TOAN.LOIVAN', 'hinh_khoi', l, `${b} ${MINUS} ${a} = ${b - a}.`,
      `Cột trái có ${a} khối, cột phải có ${b} khối. Đếm thêm từ ${a} đến ${b}: được ${b - a}. Vậy cần thêm ${b - a} khối (${b} ${MINUS} ${a} = ${b - a}).`),
    { figure: { kind: 'blocks', stacks: [a, b], alt: `Cột trái ${a} khối, cột phải ${b} khối` } });
};

const towersCut: Template = (r, c, l) => {
  const a = r.int(1, 4);
  const b = r.int(a + 1, Math.min(6, c.max - a));
  return Q.blanks('Cột bên phải cao hơn cột bên trái. Cần lấy bớt mấy khối ở cột bên phải để hai cột cao bằng nhau?', ['Cần lấy bớt {} khối.'], [[b - a]],
    M('T1.HH.03', 'TOAN.LOIVAN', 'hinh_khoi', l, `${b} ${MINUS} ${a} = ${b - a}.`,
      `Cột trái có ${a} khối, cột phải có ${b} khối. Cột phải nhiều hơn ${b - a} khối, nên lấy bớt ${b - a} khối ở cột phải (${b} ${MINUS} ${a} = ${b - a}).`),
    { figure: { kind: 'blocks', stacks: [a, b], alt: `Cột trái ${a} khối, cột phải ${b} khối` } });
};

// ===========================================================================
// 9. VỊ TRÍ, ĐỊNH HƯỚNG (Bài 15)
// ===========================================================================
const rowFig = (xs: Thing[], extra?: string): Figure => ({
  kind: 'grid', rows: 1, cols: xs.length + (extra ? 1 : 0), cells: [...xs.map((x) => x.icon), ...(extra ? [extra] : [])],
  alt: `Từ trái sang phải: ${xs.map((x) => x.name).join(', ')}`,
});
const VIEW = ' (nhìn theo tranh)';

const rowMiddle: Template = (r, _c, l) => {
  const xs = r.sample(ANIMALS, 3);
  return Q.sc('Con vật nào đứng ở giữa?', xs.map((x) => cap(x.name)), cap(xs[1].name),
    M('T1.HH.01', 'TOAN.HINH', 'vi_tri', l, `${cap(xs[1].name)} đứng giữa ${xs[0].name} và ${xs[2].name}.`), { figure: rowFig(xs) });
};

const leftRight: Template = (r, _c, l) => {
  const xs = r.sample(ANIMALS, r.int(3, 4));
  const [i, j] = r.sample(xs.map((_, k) => k), 2);
  const ans = i < j ? 'Bên trái' : 'Bên phải';
  return Q.sc(`${cap(xs[i].name)} ở bên trái hay bên phải ${xs[j].name}?${VIEW}`, ['Bên trái', 'Bên phải'], ans,
    M('T1.HH.01', 'TOAN.HINH', 'trai_phai', l, `${cap(xs[i].name)} ở ${ans.toLowerCase()} ${xs[j].name}.`), { figure: rowFig(xs) });
};

const nextTo: Template = (r, _c, l) => {
  const xs = r.sample(ANIMALS, r.int(4, 5));
  const right = r.chance(0.5);
  const i = right ? r.int(0, xs.length - 2) : r.int(1, xs.length - 1);
  const ans = xs[right ? i + 1 : i - 1];
  return Q.sc(`Ngay bên ${right ? 'phải' : 'trái'} ${xs[i].name} là con gì?${VIEW}`, r.shuffle(xs.filter((x) => x !== xs[i])).map((x) => cap(x.name)), cap(ans.name),
    M('T1.HH.01', 'TOAN.HINH', 'trai_phai', l, `Ngay bên ${right ? 'phải' : 'trái'} ${xs[i].name} là ${ans.name}.`,
      l >= 3 ? `Tìm ${xs[i].name} trong hàng, rồi nhìn sang ô liền bên ${right ? 'phải' : 'trái'}: đó là ${ans.name}.` : undefined), { figure: rowFig(xs) });
};

function shelf(r: Rng) {
  const items = r.sample(TOYS, r.int(5, 7));
  const pos = r.sample(Array.from({ length: 9 }, (_, i) => i), items.length);
  const cells: (string | null)[] = Array.from({ length: 9 }, () => null);
  items.forEach((t, k) => (cells[pos[k]] = t.icon));
  const where = new Map(items.map((t, k) => [t, pos[k]] as const));
  const fig: Figure = { kind: 'grid', rows: 3, cols: 3, cells, alt: 'Giá đồ chơi có 3 ngăn: ' + ['trên cùng', 'giữa', 'dưới cùng'].map((nm, row) => `ngăn ${nm}: ${items.filter((t) => Math.floor((where.get(t) as number) / 3) === row).map((t) => t.name).join(', ') || 'trống'}`).join('; ') };
  return { items, where, fig, cells };
}
const ROW_NAME = ['Ngăn trên cùng', 'Ngăn giữa', 'Ngăn dưới cùng'];

const shelfLevel: Template = (r, _c, l) => {
  const s = shelf(r);
  const t = r.pick(s.items);
  const row = Math.floor((s.where.get(t) as number) / 3);
  return Q.sc(`${cap(t.name)} ở ngăn nào của giá?`, ROW_NAME, ROW_NAME[row],
    M('T1.HH.01', 'TOAN.HINH', 'tren_duoi', l, `${cap(t.name)} ở ${ROW_NAME[row].toLowerCase()}.`,
      `Giá có ba ngăn từ trên xuống: ngăn trên cùng, ngăn giữa, ngăn dưới cùng. ${cap(t.name)} nằm ở ${ROW_NAME[row].toLowerCase()}.`), { figure: s.fig });
};

const shelfAbove: Template = (r, _c, l) => {
  const s = shelf(r);
  const below = r.chance(0.5);
  const cands = s.items.filter((t) => {
    const p = s.where.get(t) as number;
    const q = below ? p + 3 : p - 3;
    return q >= 0 && q < 9 && s.cells[q];
  });
  if (!cands.length) return null;
  const t = r.pick(cands);
  const p = s.where.get(t) as number;
  const ansIcon = s.cells[below ? p + 3 : p - 3];
  const ans = s.items.find((x) => x.icon === ansIcon) as Thing;
  const opts = r.shuffle([ans, ...r.sample(s.items.filter((x) => x !== t && x !== ans), 2)]).map((x) => cap(x.name));
  return Q.sc(`Đồ vật ở ngay phía ${below ? 'dưới' : 'trên'} ${t.name} là gì?`, opts, cap(ans.name),
    M('T1.HH.01', 'TOAN.HINH', 'tren_duoi', l, `Ngay phía ${below ? 'dưới' : 'trên'} ${t.name} là ${ans.name}.`,
      `Tìm ${t.name}, rồi nhìn thẳng ${below ? 'xuống ngăn dưới' : 'lên ngăn trên'}, cùng cột: đó là ${ans.name}.`), { figure: s.fig });
};

const queue: Template = (r, _c, l) => {
  const xs = r.sample(ANIMALS, r.int(4, 5));
  const kind = r.pick(['dau', 'cuoi', 'sau', 'truoc'] as const);
  let prompt: string, ans: Thing, why: string;
  if (kind === 'dau') { ans = xs[xs.length - 1]; prompt = 'Con vật nào đi đầu hàng?'; why = 'Con vật gần mũi tên nhất đi đầu.'; }
  else if (kind === 'cuoi') { ans = xs[0]; prompt = 'Con vật nào đi cuối hàng?'; why = 'Con vật xa mũi tên nhất đi cuối.'; }
  else if (kind === 'sau') { const i = r.int(1, xs.length - 1); ans = xs[i - 1]; prompt = `Con vật nào đi ngay sau ${xs[i].name}?`; why = `Hàng đi về phía mũi tên, nên con đứng ngay bên trái ${xs[i].name} là con đi ngay sau.`; }
  else { const i = r.int(0, xs.length - 2); ans = xs[i + 1]; prompt = `Con vật nào đi ngay trước ${xs[i].name}?`; why = `Hàng đi về phía mũi tên, nên con đứng ngay bên phải ${xs[i].name} là con đi ngay trước.`; }
  return Q.sc(`Các con vật xếp hàng đi về phía mũi tên ➡️. ${prompt}`, r.shuffle(xs).map((x) => cap(x.name)), cap(ans.name),
    M('T1.HH.01', 'TOAN.HINH', 'truoc_sau', l, `${cap(ans.name)}. ${why}`, `${why} Đó là ${ans.name}.`), { figure: rowFig(xs, '➡️') });
};

const tfPositions: Template = (r, _c, l) => {
  const xs = r.sample(ANIMALS, 4);
  const rows: [string, boolean][] = [];
  const used = new Set<string>();
  let guard = 0;
  while (rows.length < 3 && guard++ < 30) {
    const [i, j] = r.sample([0, 1, 2, 3], 2);
    const saysLeft = r.chance(0.5);
    const text = `${cap(xs[i].name)} ở bên ${saysLeft ? 'trái' : 'phải'} ${xs[j].name}.`;
    const pair = [i, j].sort().join('-'); // mỗi cặp con vật chỉ hỏi một lần
    if (used.has(pair)) continue;
    used.add(pair);
    rows.push([text, saysLeft ? i < j : i > j]);
  }
  const m = r.int(1, 2);
  const truthy = r.chance(0.5);
  const a = truthy ? xs[m - 1] : xs[r.pick([0, 1, 2, 3].filter((k) => k !== m - 1 && k !== m + 1 && k !== m))];
  const b = xs[m + 1];
  rows.push([`${cap(xs[m].name)} đứng giữa ${a.name} và ${b.name}.`, a === xs[m - 1]]);
  const mixed = mixRows(r, rows);
  if (!mixed) return null;
  return Q.table(`Quan sát hàng con vật${VIEW}. Đúng chọn Đ, sai chọn S.`, mixed,
    M('T1.HH.01', 'TOAN.DUNGSAI', 'trai_phai', l, `Từ trái sang phải: ${xs.map((x) => x.name).join(', ')}.`,
      `Đọc hàng từ trái sang phải: ${xs.map((x) => x.name).join(', ')}. Con đứng trước (gần bên trái hơn) là ở bên trái con đứng sau. Đối chiếu từng nhận định.`),
    { figure: rowFig(xs) });
};

const countSide: Template = (r, c, l) => {
  const xs = r.sample(ANIMALS, r.int(5, Math.min(7, c.max)));
  const i = r.int(1, xs.length - 2);
  const right = r.chance(0.5);
  const n = right ? xs.length - 1 - i : i;
  return Q.blanks(`Có mấy con vật đứng bên ${right ? 'phải' : 'trái'} ${xs[i].name}?${VIEW}`, ['Có {} con vật.'], [[n]],
    M('T1.HH.01', 'TOAN.DEM', 'trai_phai', l, `Có ${n} con vật ở bên ${right ? 'phải' : 'trái'} ${xs[i].name}.`,
      `Tìm ${xs[i].name}, rồi đếm các con vật ở phía bên ${right ? 'phải' : 'trái'} (không đếm ${xs[i].name}): được ${n} con.`), { figure: rowFig(xs) });
};

// ===========================================================================
// CÁC BÀI
// ===========================================================================
export type Pool = Record<Level, Template[]>;
export type LessonSpec = { no: number; ctx: Omit<Ctx, 'lesson'>; pool: Pool };

const N5 = { max: 5, focusMin: 1, ops: [] as const };
const N10 = { max: 10, focusMin: 1, ops: [] as const };
const ADD = { max: 10, focusMin: 1, ops: ['+'] as const };
const ADDSUB = { max: 10, focusMin: 1, ops: ['+', '-'] as const };

const P1: Pool = { 1: [countPick], 2: [countFill, pickGroupN], 3: [countTwo, sequenceAsc], 4: [sequenceDesc, tfCount], 5: [positionInRow, rowsWithN] };
const P2: Pool = { 1: [countPick, countOn], 2: [countFill, pickGroupN], 3: [countTwo, sequenceAsc], 4: [sequenceDesc, tfCount], 5: [positionInRow, rowsWithN] };
const P3: Pool = { 1: [compareRows], 2: [pickExtremeGroup, matchEqual], 3: [addToEqual, countTwo], 4: [removeToEqual, tfCount], 5: [whoMost] };
const P4: Pool = { 1: [signPick], 2: [signPicture, extreme], 3: [orderNums], 4: [signTable, allLess], 5: [between, betweenCount] };
const P5: Pool = { 1: [bondPart], 2: [bondPicture, bondWhole], 3: [splitWord, whichWhole], 4: [splitAll, bondTable], 5: [halves] };
const P7: Pool = { 1: [shapeName, objectShape], 2: [oddOne, objectShape], 3: [countScene, classifyObjects], 4: [tfShapes, patternRow], 5: [pattern3x3] };
const P8: Pool = { 1: [compose, shapeName], 2: [sticksSquares, compose, oddOne], 3: [sticksTriangles, sticksCount, countScene], 4: [sticksNeeded, tfScene], 5: [sharedVsApart, pattern3x3] };
const P10: Pool = { 1: [addCalc], 2: [addPicture, addWhich], 3: [addTable, addWord], 4: [addMissing, addWord], 5: [addCompare, addMany] };
const P11: Pool = { 1: [subCalc], 2: [subPicture, subWhich], 3: [subTable, subWord], 4: [subMissing, subWord], 5: [subCompare, subMany] };
const P12: Pool = { 1: [addCalc, subCalc], 2: [addWhich, subWhich], 3: [family, mixTable], 4: [opPick, biggest], 5: [subMissing, addCompare, subCompare] };
const P14: Pool = { 1: [blockName, objectBlock], 2: [countBlocks, objectBlock], 3: [stackCount, classifyBlocks], 4: [tfBlocks, stackCount], 5: [towersEqual, towersCut, stackCount] };
const P15: Pool = { 1: [rowMiddle], 2: [leftRight, nextTo], 3: [shelfLevel, queue], 4: [shelfAbove, tfPositions], 5: [countSide] };

const merge = (...pools: Pool[]): Pool =>
  ([1, 2, 3, 4, 5] as Level[]).reduce((o, lv) => ({ ...o, [lv]: [...new Set(pools.flatMap((p) => p[lv]))] }), {} as Pool);

export const TOAN1_PRACTICE: LessonSpec[] = [
  { no: 1, ctx: N5, pool: P1 },
  { no: 2, ctx: { ...N10, focusMin: 6 }, pool: P2 },
  { no: 3, ctx: N10, pool: P3 },
  { no: 4, ctx: N10, pool: P4 },
  { no: 5, ctx: N10, pool: P5 },
  { no: 6, ctx: N10, pool: merge(P2, P3, P4, P5) },
  { no: 7, ctx: N10, pool: P7 },
  { no: 8, ctx: N10, pool: P8 },
  { no: 9, ctx: N10, pool: merge(P7, P8) },
  { no: 10, ctx: ADD, pool: P10 },
  { no: 11, ctx: ADDSUB, pool: P11 },
  { no: 12, ctx: ADDSUB, pool: P12 },
  { no: 13, ctx: ADDSUB, pool: merge(P10, P11, P12) },
  { no: 14, ctx: ADDSUB, pool: P14 },
  { no: 15, ctx: ADDSUB, pool: P15 },
  { no: 16, ctx: ADDSUB, pool: merge(P14, P15) },
  { no: 17, ctx: ADDSUB, pool: merge(P2, P3, P4, P5) },
  { no: 18, ctx: ADDSUB, pool: merge(P10, P11, P12) },
  { no: 19, ctx: ADDSUB, pool: merge(P7, P8, P14, P15) },
  { no: 20, ctx: ADDSUB, pool: merge(P2, P4, P5, P7, P10, P11, P12, P14, P15) },
];

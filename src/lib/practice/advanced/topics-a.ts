// Chuyên đề nâng cao lớp 4–5 (phần A): Trồng cây – khoảng cách, Tính tuổi, Giả thiết tạm, Đánh số trang.
// Mỗi dạng chọn đáp án trước rồi dựng đề (xem engine.ts). Lớp 5 dùng số lớn hơn.

import type { Rng } from '../rng';
import { KIDS } from '../kit';
import { f, oc, type AdvCtx, type GenPool, type Problem } from './engine';

const big = (c: AdvCtx, g4: number, g5: number) => (c.grade === 4 ? g4 : g5);
/** Dữ kiện thừa (lớp nhiễu) — chỉ dùng ở mức L4–L5 */
const extra = (r: Rng, on: boolean, list: string[]) => (on && r.chance(0.6) ? ` ${r.pick(list)}` : '');

// =========================================================================================
// 1. TRỒNG CÂY — KHOẢNG CÁCH
// =========================================================================================
type Mode = 'both' | 'one' | 'none' | 'circle';
/** Vét cạn: đặt cây ở từng vị trí 0, d, 2d, … rồi đếm theo cách trồng */
function plant(L: number, d: number, mode: Mode): number {
  let n = 0;
  for (let x = 0; x <= L; x += d) {
    if (mode === 'circle' && x === L) continue; // vòng tròn: điểm cuối trùng điểm đầu
    if (mode === 'one' && x === 0) continue;
    if (mode === 'none' && (x === 0 || x === L)) continue;
    n++;
  }
  return n;
}
const ROADS = [
  { tree: 'cây bàng', where: 'dọc một bên đường' },
  { tree: 'cây phượng', where: 'dọc bờ kênh' },
  { tree: 'cây sao', where: 'dọc lối vào trường' },
  { tree: 'khóm hoa', where: 'dọc hàng rào' },
];
const TREE_NOISE = ['Mỗi cây cao khoảng 2 m.', 'Lớp 4A và lớp 4B cùng tham gia trồng.', 'Mỗi hố trồng cây sâu 5 dm.'];

function treeLine(r: Rng, c: AdvCtx, mode: Exclude<Mode, 'circle'>, noisy: boolean): Problem | null {
  const d = r.pick([2, 3, 4, 5, 6, 8, 10]);
  const k = r.int(mode === 'none' ? 4 : 5, big(c, 30, 80));
  const L = k * d;
  const { tree, where } = r.pick(ROADS);
  const how = mode === 'both' ? 'hai đầu đều có cây' : mode === 'one' ? 'một đầu giáp tường rào nên không trồng, đầu kia có cây' : 'hai đầu là hai cột điện nên không trồng cây';
  const ans = mode === 'both' ? k + 1 : mode === 'one' ? k : k - 1;
  const last = mode === 'both' ? `Hai đầu đều trồng nên số cây nhiều hơn số khoảng 1: ${k} + 1 = ${ans} (cây).`
    : mode === 'one' ? `Một đầu không trồng nên số cây bằng số khoảng: ${ans} cây.`
    : `Hai đầu không trồng nên số cây ít hơn số khoảng 1: ${k} − 1 = ${ans} (cây).`;
  return {
    prompt: `Người ta trồng ${tree} ${where} dài ${f(L)} m, cứ ${d} m trồng một cây, ${how}.${extra(r, noisy, TREE_NOISE)} Hỏi trồng tất cả bao nhiêu cây?`,
    answer: ans, unit: 'cây',
    steps: [`Số khoảng cách: ${f(L)} : ${d} = ${k} (khoảng).`, last],
    traps: mode === 'both'
      ? [{ value: k, why: 'quên cộng 1 (lấy số khoảng làm số cây)' }, { value: k + 2, why: 'cộng thừa' }, { value: k - 1, why: 'trừ 1 như khi hai đầu không trồng' }]
      : mode === 'one'
        ? [{ value: k + 1, why: 'cộng 1 như khi hai đầu đều trồng' }, { value: k - 1, why: 'trừ 1 như khi hai đầu không trồng' }]
        : [{ value: k, why: 'quên trừ 1 khi hai đầu không trồng' }, { value: k + 1, why: 'cộng 1 như khi hai đầu đều trồng' }],
    brute: () => plant(L, d, mode),
    outcome: oc(c, '03'), skill: 'trong_cay',
  };
}

const treeCircle = (r: Rng, c: AdvCtx): Problem => {
  const d = r.pick([2, 3, 4, 5, 6]);
  const k = r.int(8, big(c, 40, 90));
  const L = k * d;
  return {
    prompt: `Quanh một hồ nước hình tròn có chu vi ${f(L)} m, người ta trồng cây cách đều nhau ${d} m. Hỏi trồng được bao nhiêu cây?`,
    answer: k, unit: 'cây',
    steps: [`Trồng khép kín một vòng thì số cây bằng số khoảng.`, `Số cây: ${f(L)} : ${d} = ${k} (cây).`],
    traps: [{ value: k + 1, why: 'cộng 1 như trồng trên đường thẳng' }, { value: k - 1, why: 'trừ 1 như khi hai đầu không trồng' }],
    brute: () => plant(L, d, 'circle'),
    outcome: oc(c, '03'), skill: 'trong_cay_vong',
  };
};

const treeReverse = (r: Rng, c: AdvCtx): Problem => {
  const d = r.pick([3, 4, 5, 6, 8, 10]);
  const n = r.int(6, big(c, 30, 60));
  const L = (n - 1) * d;
  return {
    prompt: `Một hàng có ${n} cây thẳng hàng, hai cây liền nhau cách nhau ${d} m. Hỏi cây đầu tiên cách cây cuối cùng bao nhiêu mét?`,
    answer: L, unit: 'm',
    steps: [`${n} cây thẳng hàng thì có ${n} − 1 = ${n - 1} khoảng cách.`, `Cây đầu cách cây cuối: ${n - 1} × ${d} = ${f(L)} (m).`],
    traps: [{ value: n * d, why: 'nhân số cây với khoảng cách (quên số khoảng ít hơn số cây 1)' }, { value: (n + 1) * d, why: 'cộng thêm 1 khoảng' }],
    brute: () => { for (let len = d; len <= 2000; len += d) if (plant(len, d, 'both') === n) return len; return null; },
    outcome: oc(c, '03'), skill: 'trong_cay_nguoc',
  };
};

const treeTwoSides = (r: Rng, c: AdvCtx, l: number): Problem => {
  const d = r.pick([4, 5, 6, 8, 10]);
  const k = r.int(6, big(c, 25, 60));
  const L = k * d;
  return {
    prompt: `Hai bên một con đường dài ${f(L)} m, người ta trồng cây ở cả hai bên, cứ ${d} m một cây và ở cả hai đầu đường đều có cây.${extra(r, l >= 4, TREE_NOISE)} Hỏi cần tất cả bao nhiêu cây?`,
    answer: 2 * (k + 1), unit: 'cây',
    steps: [`Số khoảng mỗi bên: ${f(L)} : ${d} = ${k} (khoảng).`, `Số cây mỗi bên: ${k} + 1 = ${k + 1} (cây).`, `Hai bên: ${k + 1} × 2 = ${2 * (k + 1)} (cây).`],
    traps: [{ value: k + 1, why: 'chỉ tính một bên đường' }, { value: 2 * k, why: 'quên cộng 1 ở mỗi bên' }, { value: 2 * k + 1, why: 'chỉ cộng 1 cho cả hai bên' }],
    brute: () => 2 * plant(L, d, 'both'),
    outcome: oc(c, '03'), skill: 'trong_cay_hai_ben',
  };
};

const sawWood = (r: Rng, c: AdvCtx): Problem => {
  const d = r.pick([2, 3, 4, 5]);
  const p = r.int(3, big(c, 10, 15));
  const m = r.int(2, 9);
  const L = p * d;
  return {
    prompt: `Một cây gỗ dài ${L} dm được cưa thành các đoạn dài ${d} dm. Mỗi lần cưa mất ${m} phút. Hỏi cưa xong cây gỗ mất bao nhiêu phút?`,
    answer: (p - 1) * m, unit: 'phút',
    steps: [`Số đoạn gỗ: ${L} : ${d} = ${p} (đoạn).`, `Cưa ${p} đoạn chỉ cần ${p} − 1 = ${p - 1} lần cưa (lần cuối cưa được 2 đoạn).`, `Thời gian: ${p - 1} × ${m} = ${(p - 1) * m} (phút).`],
    traps: [{ value: p * m, why: 'lấy số đoạn làm số lần cưa' }, { value: (p + 1) * m, why: 'cộng thêm 1 lần cưa' }],
    brute: () => { let cuts = 0; for (let x = d; x < L; x += d) cuts++; return cuts * m; },
    outcome: oc(c, '03'), skill: 'cua_go',
  };
};

const stairs = (r: Rng, c: AdvCtx): Problem => {
  const per = r.int(8, 20);
  const a = r.int(3, 6);
  const b = r.int(a + 2, big(c, 10, 15));
  const T = (a - 1) * per;
  const name = r.pick(KIDS);
  return {
    prompt: `${name} đi bộ đều từ tầng 1 lên tầng ${a} hết ${T} giây. Cũng đi đều như vậy, ${name} đi từ tầng 1 lên tầng ${b} hết bao nhiêu giây?`,
    answer: (b - 1) * per, unit: 'giây',
    steps: [`Từ tầng 1 lên tầng ${a} phải đi ${a} − 1 = ${a - 1} đoạn cầu thang.`, `Mỗi đoạn hết: ${T} : ${a - 1} = ${per} (giây).`, `Lên tầng ${b} phải đi ${b} − 1 = ${b - 1} đoạn: ${b - 1} × ${per} = ${(b - 1) * per} (giây).`],
    traps: [{ value: b * per, why: 'đếm cả tầng 1 thành một đoạn cầu thang' }, { value: (T % a === 0 ? (T / a) * b : 0), why: 'chia cho số tầng thay vì số đoạn cầu thang' }],
    brute: () => { let t = 0; for (let fl = 1; fl < b; fl++) t += T / (a - 1); return t; },
    outcome: oc(c, '03'), skill: 'cau_thang',
  };
};

const alternate = (r: Rng, c: AdvCtx): Problem => {
  const d = r.pick([3, 4, 5, 6]);
  const k = 2 * r.int(4, big(c, 15, 30));
  const L = k * d;
  return {
    prompt: `Dọc lối đi dài ${f(L)} m, người ta trồng xen kẽ cây phượng và cây bàng, hai cây liền nhau cách nhau ${d} m, hai đầu lối đi đều là cây phượng. Hỏi có bao nhiêu cây bàng?`,
    answer: k / 2, unit: 'cây',
    steps: [`Số khoảng: ${f(L)} : ${d} = ${k} (khoảng).`, `Số cây: ${k} + 1 = ${k + 1} (cây).`, `Xen kẽ, hai đầu là phượng nên phượng nhiều hơn bàng 1 cây.`, `Số cây bàng: (${k + 1} − 1) : 2 = ${k / 2} (cây).`],
    traps: [{ value: k / 2 + 1, why: 'đó là số cây phượng' }, { value: k + 1, why: 'đó là tổng số cây' }, { value: k, why: 'lấy số khoảng' }],
    brute: () => { let bang = 0, i = 0; for (let x = 0; x <= L; x += d, i++) if (i % 2 === 1) bang++; return bang; },
    outcome: oc(c, '03'), skill: 'trong_xen_ke',
  };
};

export const TREES: GenPool = {
  1: [(r, c) => treeLine(r, c, 'both', false), (r, c) => treeLine(r, c, 'one', false)],
  2: [(r, c) => treeLine(r, c, 'both', false), (r, c) => treeLine(r, c, 'none', false), treeCircle],
  3: [treeReverse, (r, c) => treeLine(r, c, 'none', false), treeCircle, (r, c) => treeLine(r, c, 'one', false)],
  4: [treeTwoSides, sawWood, treeReverse, (r, c) => treeLine(r, c, 'none', true)],
  5: [stairs, alternate, sawWood, treeTwoSides],
};

// =========================================================================================
// 2. TÍNH TUỔI
// =========================================================================================
const PAIRS = [['mẹ', 'con', 'hai mẹ con'], ['bố', 'con', 'hai bố con']] as const;
/** Vét cạn tuổi con 1–80 thỏa điều kiện; trả về nghiệm duy nhất */
const findAge = (ok: (child: number) => boolean) => { const s: number[] = []; for (let x = 1; x <= 80; x++) if (ok(x)) s.push(x); return s.length === 1 ? s[0] : null; };

const ageDiffSame = (r: Rng, c: AdvCtx): Problem => {
  const [p, ch] = r.pick(PAIRS);
  const h = r.int(22, 34), n = r.int(3, 12), child = r.int(4, 12);
  return {
    prompt: `Năm nay ${p} hơn ${ch} ${h} tuổi. Hỏi sau ${n} năm nữa ${p} hơn ${ch} bao nhiêu tuổi?`,
    answer: h, unit: 'tuổi',
    steps: [`Mỗi năm ${p} và ${ch} đều thêm 1 tuổi nên hiệu số tuổi không đổi.`, `Sau ${n} năm ${p} vẫn hơn ${ch} ${h} tuổi.`],
    traps: [{ value: h + n, why: 'cộng thêm số năm vào hiệu' }, { value: h - n, why: 'trừ số năm khỏi hiệu' }, { value: h + 2 * n, why: 'cộng thêm 2 lần số năm' }],
    brute: () => (child + h + n) - (child + n),
    outcome: oc(c, '03'), skill: 'tuoi_hieu',
  };
};

const ageSumLater = (r: Rng, c: AdvCtx): Problem => {
  const [, , both] = r.pick(PAIRS);
  const child = r.int(4, 12), h = r.int(22, 34), n = r.int(2, 9);
  const S = 2 * child + h;
  return {
    prompt: `Năm nay tổng số tuổi của ${both} là ${S} tuổi. Hỏi sau ${n} năm nữa tổng số tuổi của ${both} là bao nhiêu?`,
    answer: S + 2 * n, unit: 'tuổi',
    steps: [`Mỗi năm mỗi người thêm 1 tuổi, hai người thêm 2 tuổi.`, `Sau ${n} năm tổng số tuổi tăng: ${n} × 2 = ${2 * n} (tuổi).`, `Tổng số tuổi khi đó: ${S} + ${2 * n} = ${S + 2 * n} (tuổi).`],
    traps: [{ value: S + n, why: 'chỉ cộng số năm một lần (quên có hai người)' }, { value: S, why: 'nghĩ tổng số tuổi không đổi' }],
    brute: () => (child + n) + (child + h + n),
    outcome: oc(c, '03'), skill: 'tuoi_tong',
  };
};

const ageSumDiff = (r: Rng, c: AdvCtx): Problem => {
  const [p, ch, both] = r.pick(PAIRS);
  const child = r.int(5, 14), h = r.int(22, 34);
  const S = 2 * child + h;
  return {
    prompt: `Tổng số tuổi của ${both} là ${S} tuổi, ${p} hơn ${ch} ${h} tuổi. Hỏi ${ch} bao nhiêu tuổi?`,
    answer: child, unit: 'tuổi',
    steps: [`Tuổi ${ch} (số bé) = (Tổng − Hiệu) : 2.`, `Tuổi ${ch}: (${S} − ${h}) : 2 = ${child} (tuổi).`],
    traps: [{ value: child + h, why: `đó là tuổi ${p}` }, { value: S - h, why: 'quên chia 2' }],
    brute: () => findAge((x) => x + (x + h) === S),
    outcome: oc(c, '03'), skill: 'tuoi_tong_hieu',
  };
};

const ageSumLaterFind = (r: Rng, c: AdvCtx): Problem => {
  const [p, ch, both] = r.pick(PAIRS);
  const child = r.int(5, 12), h = r.int(22, 34), n = r.int(2, 8);
  const S2 = 2 * child + h + 2 * n;
  return {
    prompt: `Sau ${n} năm nữa tổng số tuổi của ${both} là ${S2} tuổi. Biết ${p} hơn ${ch} ${h} tuổi. Hỏi năm nay ${ch} bao nhiêu tuổi?`,
    answer: child, unit: 'tuổi',
    steps: [`Sau ${n} năm, mỗi người thêm ${n} tuổi nên tổng tăng ${n} × 2 = ${2 * n} (tuổi).`, `Tổng số tuổi năm nay: ${S2} − ${2 * n} = ${S2 - 2 * n} (tuổi).`, `Tuổi ${ch} năm nay: (${S2 - 2 * n} − ${h}) : 2 = ${child} (tuổi).`],
    traps: [{ value: child + n, why: `đó là tuổi ${ch} sau ${n} năm` }, { value: child + h, why: `đó là tuổi ${p}` }],
    brute: () => findAge((x) => (x + n) + (x + h + n) === S2),
    outcome: oc(c, '03'), skill: 'tuoi_tong_sau',
  };
};

const ageTimes = (r: Rng, c: AdvCtx): Problem | null => {
  const [p, ch] = r.pick(PAIRS);
  const k = r.int(3, 7), child = r.int(4, 12);
  const h = (k - 1) * child;
  if (h < 18 || h > 40) return null;
  return {
    prompt: `Năm nay tuổi ${p} gấp ${k} lần tuổi ${ch}, ${p} hơn ${ch} ${h} tuổi. Hỏi ${ch} bao nhiêu tuổi?`,
    answer: child, unit: 'tuổi',
    steps: [`Coi tuổi ${ch} là 1 phần thì tuổi ${p} là ${k} phần.`, `Hiệu số phần bằng nhau: ${k} − 1 = ${k - 1} (phần).`, `Tuổi ${ch}: ${h} : ${k - 1} = ${child} (tuổi).`],
    traps: [{ value: k * child, why: `đó là tuổi ${p}` }, { value: h % k === 0 ? h / k : 0, why: 'chia hiệu cho số lần (quên trừ 1)' }],
    brute: () => findAge((x) => x * k - x === h),
    outcome: oc(c, '03'), skill: 'tuoi_hieu_ti',
  };
};

const ageTimesLater = (r: Rng, c: AdvCtx): Problem | null => {
  const [p, ch] = r.pick(PAIRS);
  const k = r.int(3, 5), later = r.int(7, 14), n = r.int(2, 6);
  const child = later - n, h = (k - 1) * later;
  if (child < 2 || h < 20 || h > 40) return null;
  return {
    prompt: `Hiện nay ${p} hơn ${ch} ${h} tuổi. Sau ${n} năm nữa tuổi ${p} gấp ${k} lần tuổi ${ch}. Hỏi hiện nay ${ch} bao nhiêu tuổi?`,
    answer: child, unit: 'tuổi',
    steps: [`Hiệu số tuổi không đổi: sau ${n} năm ${p} vẫn hơn ${ch} ${h} tuổi.`, `Lúc đó hiệu số phần: ${k} − 1 = ${k - 1} (phần); tuổi ${ch} lúc đó: ${h} : ${k - 1} = ${later} (tuổi).`, `Tuổi ${ch} hiện nay: ${later} − ${n} = ${child} (tuổi).`],
    traps: [{ value: later, why: `đó là tuổi ${ch} sau ${n} năm (quên lùi lại)` }, { value: later + n, why: 'cộng thêm số năm thay vì trừ' }],
    brute: () => findAge((x) => x + h + n === k * (x + n)),
    outcome: oc(c, '03'), skill: 'tuoi_ti_sau',
  };
};

const ageTimesPast = (r: Rng, c: AdvCtx): Problem => {
  const k = r.int(4, 7), past = r.int(3, 8), n = r.int(3, 8);
  const S = past * (k + 1) + 2 * n;
  const now = past + n;
  return {
    prompt: `Cách đây ${n} năm, tuổi bố gấp ${k} lần tuổi con. Hiện nay tổng số tuổi của hai bố con là ${S} tuổi. Hỏi hiện nay con bao nhiêu tuổi?`,
    answer: now, unit: 'tuổi',
    steps: [`Cách đây ${n} năm tổng số tuổi kém hiện nay: ${n} × 2 = ${2 * n} (tuổi) → tổng lúc đó: ${S} − ${2 * n} = ${S - 2 * n} (tuổi).`, `Lúc đó tổng số phần: ${k} + 1 = ${k + 1} (phần); tuổi con lúc đó: ${S - 2 * n} : ${k + 1} = ${past} (tuổi).`, `Tuổi con hiện nay: ${past} + ${n} = ${now} (tuổi).`],
    traps: [{ value: past, why: `đó là tuổi con cách đây ${n} năm` }, { value: S % (k + 1) === 0 ? S / (k + 1) : 0, why: 'chia tổng hiện nay cho số phần (quên lùi về quá khứ)' }],
    brute: () => findAge((x) => { const dad = S - x; return x - n > 0 && dad - n === k * (x - n); }),
    outcome: oc(c, '03'), skill: 'tuoi_ti_truoc',
  };
};

export const AGES: GenPool = {
  1: [ageDiffSame, ageSumLater],
  2: [ageSumLater, ageSumDiff, ageDiffSame],
  3: [ageSumDiff, ageTimes],
  4: [ageSumLaterFind, ageTimes, ageTimesLater],
  5: [ageTimesLater, ageTimesPast, ageSumLaterFind],
};

// =========================================================================================
// 3. GIẢ THIẾT TẠM (gà – chó, xe, vé, điểm thi)
// =========================================================================================
/** Vét cạn số con loại A (0..N) thỏa tổng; trả về nghiệm duy nhất */
const solveMix = (N: number, total: number, a: number, b: number) => { const s: number[] = []; for (let x = 0; x <= N; x++) if (x * a + (N - x) * b === total) s.push(x); return s.length === 1 ? s[0] : null; };

const legsCount = (r: Rng, c: AdvCtx): Problem => {
  const g = r.int(3, big(c, 20, 40)), d = r.int(2, big(c, 15, 30));
  return {
    prompt: `Trong sân có ${g} con gà và ${d} con chó. Hỏi có tất cả bao nhiêu cái chân?`,
    answer: 2 * g + 4 * d, unit: 'chân',
    steps: [`Gà có 2 chân: ${g} × 2 = ${2 * g} (chân).`, `Chó có 4 chân: ${d} × 4 = ${4 * d} (chân).`, `Tất cả: ${2 * g} + ${4 * d} = ${2 * g + 4 * d} (chân).`],
    traps: [{ value: 2 * (g + d), why: 'coi mọi con đều 2 chân' }, { value: 4 * (g + d), why: 'coi mọi con đều 4 chân' }],
    brute: () => { let s = 0; for (let i = 0; i < g; i++) s += 2; for (let i = 0; i < d; i++) s += 4; return s; },
    outcome: oc(c, '03'), skill: 'ga_cho_xuoi',
  };
};

const chickenDog = (r: Rng, c: AdvCtx, ask: 'dog' | 'hen'): Problem | null => {
  const g = r.int(5, big(c, 30, 60)), d = r.int(3, big(c, 25, 50));
  if (g === d) return null; // hai số bằng nhau làm đề kém hay (đáp án nhiễu trùng)
  const N = g + d, F = 2 * g + 4 * d;
  const ans = ask === 'dog' ? d : g;
  return {
    prompt: `Vừa gà vừa chó có ${N} con, đếm được ${F} cái chân. Hỏi có bao nhiêu con ${ask === 'dog' ? 'chó' : 'gà'}?`,
    answer: ans, unit: 'con',
    steps: [`Giả sử cả ${N} con đều là gà: ${N} × 2 = ${2 * N} (chân).`, `Số chân còn thiếu: ${F} − ${2 * N} = ${F - 2 * N} (chân).`, `Mỗi con chó hơn con gà 2 chân → số chó: ${F - 2 * N} : 2 = ${d} (con).`, ...(ask === 'hen' ? [`Số gà: ${N} − ${d} = ${g} (con).`] : [])],
    traps: ask === 'dog'
      ? [{ value: g, why: 'đó là số gà' }, { value: F - 2 * N, why: 'quên chia cho 2' }, { value: F % 4 === 0 ? F / 4 : 0, why: 'lấy số chân chia 4' }]
      : [{ value: d, why: 'đó là số chó (bài hỏi số gà)' }, { value: F - 2 * N, why: 'quên chia cho 2' }],
    brute: () => { const dogs = solveMix(N, F, 4, 2); return dogs === null ? null : ask === 'dog' ? dogs : N - dogs; },
    outcome: oc(c, '03'), skill: 'ga_cho',
  };
};

/** đáp án (số xe loại B) trùng với lỗi "quên chia" thì bỏ */
const W_EQ = (A: number, B: number, x: number, y: number) => (A - B) * x === y;
const vehicles = (r: Rng, c: AdvCtx): Problem | null => {
  const tri = r.pick([true, false]);
  const [A, B, nameA, nameB] = tri ? [3, 2, 'xe ba bánh', 'xe đạp'] as const : [4, 2, 'ô tô', 'xe máy'] as const;
  const x = r.int(4, big(c, 25, 50)), y = r.int(4, big(c, 25, 50));
  if (x === y || W_EQ(A, B, x, y)) return null;
  const N = x + y, W = A * x + B * y;
  return {
    prompt: `Bãi xe có ${N} chiếc gồm ${nameA} và ${nameB}, đếm được tất cả ${W} bánh xe. Hỏi có bao nhiêu chiếc ${nameB}?`,
    answer: y, unit: 'chiếc',
    steps: [`Giả sử cả ${N} chiếc đều là ${nameB}: ${N} × ${B} = ${N * B} (bánh).`, `Số bánh còn thiếu: ${W} − ${N * B} = ${W - N * B} (bánh).`, `Mỗi ${nameA} hơn ${nameB} ${A - B} bánh → số ${nameA}: ${W - N * B} : ${A - B} = ${x} (chiếc).`, `Số ${nameB}: ${N} − ${x} = ${y} (chiếc).`],
    traps: [{ value: x, why: `đó là số ${nameA}` }, { value: W - N * B, why: 'quên chia cho số bánh chênh lệch' }],
    brute: () => { const a = solveMix(N, W, A, B); return a === null ? null : N - a; },
    outcome: oc(c, '03'), skill: 'gia_thiet_tam_xe',
  };
};

const quizScore = (r: Rng, c: AdvCtx): Problem | null => {
  const N = r.int(10, 20), a = r.pick([5, 10]), b = r.pick([2, 3, 5]);
  const right = r.int(Math.ceil(N / 2), N - 1);
  const P = a * right - b * (N - right);
  if (P <= 0 || right * 2 === N) return null;
  const name = r.pick(KIDS);
  const lost = a * N - P;
  return {
    prompt: `Một cuộc thi có ${N} câu hỏi. Mỗi câu trả lời đúng được ${a} điểm, mỗi câu trả lời sai bị trừ ${b} điểm. ${name} trả lời đủ ${N} câu và được ${P} điểm. Hỏi ${name} trả lời đúng bao nhiêu câu?`,
    answer: right, unit: 'câu',
    steps: [`Nếu đúng cả ${N} câu: ${N} × ${a} = ${a * N} (điểm).`, `Số điểm bị hụt: ${a * N} − ${P} = ${lost} (điểm).`, `Mỗi câu sai làm hụt ${a} + ${b} = ${a + b} điểm (không được ${a} điểm và còn bị trừ ${b} điểm).`, `Số câu sai: ${lost} : ${a + b} = ${N - right} (câu); số câu đúng: ${N} − ${N - right} = ${right} (câu).`],
    traps: [{ value: N - right, why: 'đó là số câu sai' }, { value: P % a === 0 ? P / a : 0, why: 'lấy số điểm chia cho điểm một câu (quên điểm bị trừ)' }],
    brute: () => { const s: number[] = []; for (let x = 0; x <= N; x++) if (a * x - b * (N - x) === P) s.push(x); return s.length === 1 ? s[0] : null; },
    outcome: oc(c, '03'), skill: 'gia_thiet_tam_diem',
  };
};

const tickets = (r: Rng, c: AdvCtx): Problem | null => {
  const big1 = r.pick([20, 25, 30, 40]), small = r.pick([10, 15]);
  const adult = r.int(5, big(c, 30, 60)), kids = r.int(5, big(c, 40, 80));
  if (adult === kids) return null;
  const N = adult + kids, T = big1 * adult + small * kids;
  return {
    prompt: `Một đoàn tham quan mua ${N} vé gồm vé người lớn và vé trẻ em, hết tất cả ${f(T)} nghìn đồng. Vé người lớn giá ${big1} nghìn đồng, vé trẻ em giá ${small} nghìn đồng. Hỏi đoàn mua bao nhiêu vé người lớn?`,
    answer: adult, unit: 'vé',
    steps: [`Giả sử cả ${N} vé đều là vé trẻ em: ${N} × ${small} = ${f(N * small)} (nghìn đồng).`, `Số tiền còn thiếu: ${f(T)} − ${f(N * small)} = ${f(T - N * small)} (nghìn đồng).`, `Mỗi vé người lớn đắt hơn ${big1} − ${small} = ${big1 - small} (nghìn đồng).`, `Số vé người lớn: ${f(T - N * small)} : ${big1 - small} = ${adult} (vé).`],
    traps: [{ value: kids, why: 'đó là số vé trẻ em' }, { value: T % big1 === 0 ? T / big1 : 0, why: 'lấy tổng tiền chia giá vé người lớn' }],
    brute: () => solveMix(N, T, big1, small),
    outcome: oc(c, '03'), skill: 'gia_thiet_tam_ve',
  };
};

export const MIXES: GenPool = {
  1: [legsCount],
  2: [legsCount, (r, c) => chickenDog(r, c, 'dog')],
  3: [(r, c) => chickenDog(r, c, 'dog'), vehicles],
  4: [(r, c) => chickenDog(r, c, 'hen'), vehicles, tickets],
  5: [quizScore, tickets],
};

// =========================================================================================
// 4. ĐÁNH SỐ TRANG — ĐẾM CHỮ SỐ
// =========================================================================================
/** Vét cạn: viết từng trang 1..N rồi đếm chữ số */
const digitsBrute = (N: number) => { let s = 0; for (let i = 1; i <= N; i++) s += String(i).length; return s; };
/** Công thức theo từng nhóm 1, 2, 3, 4 chữ số */
const digitsOf = (N: number) => { let s = 0, start = 1, w = 1; while (start <= N) { const end = Math.min(N, start * 10 - 1); s += (end - start + 1) * w; start *= 10; w++; } return s; };

function pageSteps(N: number): string[] {
  const s: string[] = ['Từ trang 1 đến trang 9 có 9 trang, mỗi trang 1 chữ số → 9 chữ số.'];
  if (N >= 10) s.push(`Từ trang 10 đến trang ${Math.min(N, 99)} có ${Math.min(N, 99) - 9} trang, mỗi trang 2 chữ số → ${Math.min(N, 99) - 9} × 2 = ${(Math.min(N, 99) - 9) * 2} chữ số.`);
  if (N >= 100) s.push(`Từ trang 100 đến trang ${f(Math.min(N, 999))} có ${Math.min(N, 999) - 99} trang, mỗi trang 3 chữ số → ${Math.min(N, 999) - 99} × 3 = ${f((Math.min(N, 999) - 99) * 3)} chữ số.`);
  if (N >= 1000) s.push(`Từ trang 1000 đến trang ${f(N)} có ${N - 999} trang, mỗi trang 4 chữ số → ${N - 999} × 4 = ${f((N - 999) * 4)} chữ số.`);
  s.push(`Tổng cộng: ${f(digitsOf(N))} chữ số.`);
  return s;
}

const pageCount = (r: Rng, c: AdvCtx, three: boolean): Problem => {
  const N = three ? r.int(100, big(c, 600, 1500)) : r.int(15, 99);
  const D = digitsOf(N);
  return {
    prompt: `Để đánh số trang một cuốn sách dày ${f(N)} trang (bắt đầu từ trang 1) cần dùng tất cả bao nhiêu chữ số?`,
    answer: D, unit: 'chữ số',
    steps: pageSteps(N),
    traps: three
      ? [{ value: 3 * N, why: 'coi mọi trang đều có 3 chữ số' }, { value: D - 189, why: 'quên các trang có 1 và 2 chữ số' }, { value: D - 3, why: 'đếm thiếu trang 100' }]
      : [{ value: 2 * N, why: 'coi mọi trang đều có 2 chữ số' }, { value: N, why: 'coi mỗi trang một chữ số' }, { value: D - 2, why: 'đếm thiếu trang 10' }],
    brute: () => digitsBrute(N),
    outcome: oc(c, '04'), skill: 'danh_so_trang',
  };
};

const pageReverse = (r: Rng, c: AdvCtx, three: boolean): Problem => {
  const N = three ? r.int(100, big(c, 800, 2000)) : r.int(15, 99);
  const D = digitsOf(N);
  const prev = N >= 1000 ? 2889 : N >= 100 ? 189 : 9;
  const w = N >= 1000 ? 4 : N >= 100 ? 3 : 2;
  const base = N >= 1000 ? 999 : N >= 100 ? 99 : 9;
  return {
    prompt: `Người ta dùng tất cả ${f(D)} chữ số để đánh số trang một cuốn sách (bắt đầu từ trang 1). Hỏi cuốn sách dày bao nhiêu trang?`,
    answer: N, unit: 'trang',
    steps: [
      `Các trang từ 1 đến ${base} dùng hết ${f(prev)} chữ số (từ 1 đến 9 có 9 chữ số${base >= 99 ? ', từ 10 đến 99 có 180 chữ số' : ''}${base >= 999 ? ', từ 100 đến 999 có 2700 chữ số' : ''}).`,
      `Còn lại: ${f(D)} − ${f(prev)} = ${f(D - prev)} chữ số, mỗi trang tiếp theo có ${w} chữ số → ${f(D - prev)} : ${w} = ${N - base} (trang).`,
      `Số trang: ${base} + ${N - base} = ${f(N)} (trang).`,
    ],
    traps: [{ value: Number.isInteger(D / w) ? D / w : 0, why: `lấy số chữ số chia ${w} (quên các trang ít chữ số hơn)` }, { value: N - base, why: `quên cộng ${base} trang đầu` }],
    brute: () => { let used = 0; for (let p = 1; p <= 9999; p++) { used += String(p).length; if (used === D) return p; if (used > D) return null; } return null; },
    outcome: oc(c, '04'), skill: 'danh_so_trang_nguoc',
  };
};

/** Số lần chữ số d (1–9) xuất hiện khi viết 1..N — đếm theo từng hàng */
function countDigitByPlace(N: number, d: number): number[] {
  const out: number[] = [];
  for (let p = 1; p <= N; p *= 10) {
    const high = Math.floor(N / (p * 10)), cur = Math.floor(N / p) % 10, low = N % p;
    out.push(high * p + (cur > d ? p : cur === d ? low + 1 : 0));
  }
  return out;
}
const PLACE = ['đơn vị', 'chục', 'trăm', 'nghìn'];

const digitFreq = (r: Rng, c: AdvCtx): Problem | null => {
  const N = r.int(40, big(c, 300, 999)), d = r.int(1, 9);
  const per = countDigitByPlace(N, d);
  const total = per.reduce((s, x) => s + x, 0);
  let containing = 0; for (let i = 1; i <= N; i++) if (String(i).includes(String(d))) containing++;
  if (containing === total && per[0] === total) return null; // không còn bẫy nào khác đáp án
  return {
    prompt: `Viết các số tự nhiên từ 1 đến ${f(N)}. Hỏi chữ số ${d} được viết bao nhiêu lần?`,
    answer: total, unit: 'lần',
    steps: [...per.map((x, i) => `Ở hàng ${PLACE[i]}: chữ số ${d} xuất hiện ${x} lần.`), `Tổng: ${per.join(' + ')} = ${total} (lần).`],
    traps: [{ value: containing, why: `đếm số các số có chứa chữ số ${d} (số như ${d}${d} chỉ tính một lần)` }, { value: per[0], why: 'chỉ đếm ở hàng đơn vị' }],
    brute: () => { let s = 0; for (let i = 1; i <= N; i++) for (const ch of String(i)) if (ch === String(d)) s++; return s; },
    outcome: oc(c, '04'), skill: 'dem_chu_so',
  };
};

const nthDigit = (r: Rng, c: AdvCtx): Problem | null => {
  const k = r.int(12, big(c, 189, 1500));
  let s = ''; for (let i = 1; s.length <= k; i++) s += String(i); // viết dư để có chữ số đứng sau
  const ans = s[k - 1];
  if (s[k - 2] === ans && s[k] === ans) return null; // hai chữ số bên cạnh giống hệt → bẫy "đếm lệch" không còn ý nghĩa
  const steps = ['Các số 1 → 9 dùng 9 chữ số.'];
  if (k <= 189) {
    const q = Math.floor((k - 9 - 1) / 2), num = 10 + q, pos = (k - 9 - 1) % 2;
    steps.push(`Còn ${k} − 9 = ${k - 9} chữ số thuộc các số có 2 chữ số: số thứ ${q + 1} trong nhóm này là ${num}.`, `Chữ số thứ ${k} là chữ số ${pos === 0 ? 'hàng chục' : 'hàng đơn vị'} của ${num}: ${ans}.`);
  } else {
    const q = Math.floor((k - 189 - 1) / 3), num = 100 + q, pos = (k - 189 - 1) % 3;
    steps.push('Các số 10 → 99 dùng 180 chữ số (tổng 189 chữ số).', `Còn ${k} − 189 = ${k - 189} chữ số thuộc các số có 3 chữ số: số thứ ${q + 1} trong nhóm này là ${num}.`, `Chữ số thứ ${k} là chữ số hàng ${['trăm', 'chục', 'đơn vị'][pos]} của ${num}: ${ans}.`);
  }
  return {
    prompt: `Viết liền các số tự nhiên bắt đầu từ 1 thành một dãy chữ số: 123456789 rồi viết tiếp 10, 11, 12, … (không có dấu cách). Hỏi chữ số thứ ${f(k)} của dãy là chữ số nào?`,
    answer: ans,
    steps,
    traps: [{ value: s[k - 2], why: 'đếm lệch một vị trí' }, { value: s[k], why: 'đếm lệch một vị trí' }],
    brute: () => { let t = ''; for (let i = 1; t.length < k; i++) t += String(i); return t[k - 1]; },
    outcome: oc(c, '04'), skill: 'chu_so_thu_k',
  };
};

export const PAGES: GenPool = {
  1: [(r, c) => pageCount(r, c, false)],
  2: [(r, c) => pageCount(r, c, false), (r, c) => pageCount(r, c, true)],
  3: [(r, c) => pageCount(r, c, true), (r, c) => pageReverse(r, c, false)],
  4: [(r, c) => pageReverse(r, c, true), digitFreq],
  5: [nthDigit, digitFreq, (r, c) => pageReverse(r, c, true)],
};


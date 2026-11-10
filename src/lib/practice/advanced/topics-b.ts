// Chuyên đề nâng cao lớp 5 (phần B): Dãy phân số khử dần, Công việc chung có biến động.

import type { Rng } from '../rng';
import { addF, frac, fs, lcm, oc, type AdvCtx, type Frac, type GenPool, type Problem } from './engine';

// =========================================================================================
// 5. DÃY PHÂN SỐ KHỬ DẦN (telescoping)
// =========================================================================================
/** Vét cạn: cộng lần lượt từng số hạng (phân số tối giản sau mỗi bước) */
const sum = (terms: Frac[]) => terms.reduce(addF, frac(0, 1));
/** Các số hạng tử t / (k × (k + d)) với k = 1, 1 + d, … , n */
const steps2 = (t: number, d: number, n: number) => { const out: Frac[] = []; for (let k = 1; k <= n; k += d) out.push(frac(t, k * (k + d))); return out; };
const series = (t: number, d: number, n: number) => `${t}/(1 × ${1 + d}) + ${t}/(${1 + d} × ${1 + 2 * d}) + ${t}/(${1 + 2 * d} × ${1 + 3 * d}) + … + ${t}/(${n} × ${n + d})`;

const teleOne = (r: Rng, c: AdvCtx, asProducts: boolean): Problem => {
  const n = r.int(5, 40);
  const ans = frac(n, n + 1);
  const shown = asProducts
    ? `1/2 + 1/6 + 1/12 + 1/20 + … + 1/${n * (n + 1)}`
    : series(1, 1, n);
  return {
    prompt: `Tính: S = ${shown}`,
    answer: fs(ans),
    steps: [
      ...(asProducts ? [`Nhận xét: 2 = 1 × 2; 6 = 2 × 3; 12 = 3 × 4; 20 = 4 × 5; … ; ${n * (n + 1)} = ${n} × ${n + 1}.`] : []),
      `Mỗi số hạng tách thành hiệu: 1/(1 × 2) = 1 − 1/2; 1/(2 × 3) = 1/2 − 1/3; … ; 1/(${n} × ${n + 1}) = 1/${n} − 1/${n + 1}.`,
      `Cộng lại, các phân số ở giữa triệt tiêu: S = 1 − 1/${n + 1} = ${fs(ans)}.`,
    ],
    traps: [{ value: fs(frac(1, n + 1)), why: 'chỉ lấy số trừ cuối cùng' }, { value: fs(frac(n - 1, n)), why: 'đếm thiếu một số hạng' }, { value: fs(frac(1, n * (n + 1))), why: 'chỉ lấy số hạng cuối' }],
    brute: () => fs(sum(steps2(1, 1, n))),
    outcome: oc(c, '02', '01'), skill: 'day_phan_so_1',
  };
};

const teleTwo = (r: Rng, c: AdvCtx): Problem => {
  const n = 2 * r.int(3, 25) + 1, a = r.int(2, 7);
  const ans = frac(a * (n + 1), 2 * (n + 2));
  return {
    prompt: `Tính: S = ${series(a, 2, n)}`,
    answer: fs(ans),
    steps: [
      `Ta có 2/(1 × 3) = 1 − 1/3; 2/(3 × 5) = 1/3 − 1/5; … ; 2/(${n} × ${n + 2}) = 1/${n} − 1/${n + 2}.`,
      `Nên 2/(1 × 3) + … + 2/(${n} × ${n + 2}) = 1 − 1/${n + 2} = ${n + 1}/${n + 2}.`,
      `Tử số của S là ${a}, gấp ${a}/2 lần tử số 2: S = ${a}/2 × ${n + 1}/${n + 2} = ${fs(ans)}.`,
    ],
    traps: [{ value: fs(frac(a * (n + 1), n + 2)), why: 'quên chia cho 2 (khoảng cách giữa hai thừa số là 2)' }, { value: fs(frac(n + 1, 2 * (n + 2))), why: `quên nhân với tử số ${a}` }, { value: fs(frac(n + 1, n + 2)), why: 'coi như mọi tử số bằng 2' }],
    brute: () => fs(sum(steps2(a, 2, n))),
    outcome: oc(c, '02', '01'), skill: 'day_phan_so_2',
  };
};

const teleHalves = (r: Rng, c: AdvCtx): Problem => {
  const k = r.int(4, 10), p = 2 ** k;
  const ans = frac(p - 1, p);
  return {
    prompt: `Tính: S = 1/2 + 1/4 + 1/8 + 1/16 + … + 1/${p}`,
    answer: fs(ans),
    steps: [`Ta có 1/2 = 1 − 1/2; 1/4 = 1/2 − 1/4; 1/8 = 1/4 − 1/8; … ; 1/${p} = 1/${p / 2} − 1/${p}.`, `Cộng lại, các phân số ở giữa triệt tiêu: S = 1 − 1/${p} = ${fs(ans)}.`],
    traps: [{ value: fs(frac(1, p)), why: 'chỉ lấy số hạng cuối' }, { value: fs(frac(p + 1, p)), why: 'cộng 1/' + p + ' thay vì trừ' }],
    brute: () => { const t: Frac[] = []; for (let q = 2; q <= p; q *= 2) t.push(frac(1, q)); return fs(sum(t)); },
    outcome: oc(c, '02', '01'), skill: 'day_phan_so_luy_thua',
  };
};

const teleThree = (r: Rng, c: AdvCtx): Problem => {
  const n = 1 + 3 * r.int(4, 16);
  const ans = frac(n + 2, 3 * (n + 3));
  return {
    prompt: `Tính: S = ${series(1, 3, n)}`,
    answer: fs(ans),
    steps: [
      `Ta có 3/(1 × 4) = 1 − 1/4; 3/(4 × 7) = 1/4 − 1/7; … ; 3/(${n} × ${n + 3}) = 1/${n} − 1/${n + 3}.`,
      `Nên 3 × S = 1 − 1/${n + 3} = ${n + 2}/${n + 3}.`,
      `S = ${n + 2}/${n + 3} : 3 = ${fs(ans)}.`,
    ],
    traps: [{ value: fs(frac(n + 2, n + 3)), why: 'quên chia cho 3 (khoảng cách giữa hai thừa số là 3)' }, { value: fs(frac(n + 2, n + 3 + 3)), why: 'cộng 3 vào mẫu thay vì chia 3' }],
    brute: () => fs(sum(steps2(1, 3, n))),
    outcome: oc(c, '02', '01'), skill: 'day_phan_so_3',
  };
};

const teleFindX = (r: Rng, c: AdvCtx): Problem => {
  const x = 2 * r.int(4, 40) + 1;
  const S = frac(x + 1, 2 * (x + 2));
  return {
    prompt: `Tìm số tự nhiên x, biết: 1/(1 × 3) + 1/(3 × 5) + 1/(5 × 7) + … + 1/(x × (x + 2)) = ${fs(S)}`,
    answer: x,
    steps: [
      'Nhân cả tổng với 2: 2/(1 × 3) + 2/(3 × 5) + … + 2/(x × (x + 2)) = 1 − 1/(x + 2).',
      `Vậy 1 − 1/(x + 2) = 2 × ${fs(S)} = ${x + 1}/${x + 2}, suy ra 1/(x + 2) = 1/${x + 2}.`,
      `x + 2 = ${x + 2}, nên x = ${x}.`,
    ],
    traps: [{ value: x + 2, why: 'lấy luôn x + 2 làm x' }, { value: x - 2, why: 'trừ thừa' }],
    brute: () => { const hit: number[] = []; for (let y = 1; y <= 199; y += 2) if (fs(sum(steps2(1, 2, y))) === fs(S)) hit.push(y); return hit.length === 1 ? hit[0] : null; },
    outcome: oc(c, '02', '01'), skill: 'day_phan_so_tim_x',
  };
};

export const FRACS: GenPool = {
  1: [(r, c) => teleOne(r, c, false)],
  2: [(r, c) => teleOne(r, c, true), (r, c) => teleOne(r, c, false)],
  3: [teleTwo, (r, c) => teleOne(r, c, true)],
  4: [teleHalves, teleThree, teleTwo],
  5: [teleFindX, teleThree],
};

// =========================================================================================
// 6. CÔNG VIỆC CHUNG (có người nghỉ giữa chừng, vòi chảy vào – tháo ra)
// =========================================================================================
// Cách giải cho tiểu học: coi cả công việc là W phần (W = BCNN các số ngày) để mọi phép chia đều tròn.
const W2 = (a: number, b: number) => lcm(a, b);
let PAIRS: [number, number][] | null = null;
let TRIPLES: [number, number, number][] | null = null;
const pairs = () => (PAIRS ??= (() => { const o: [number, number][] = []; for (let a = 3; a <= 30; a++) for (let b = a + 1; b <= 60; b++) if ((a * b) % (a + b) === 0) o.push([a, b]); return o; })());
const triples = () => (TRIPLES ??= (() => {
  const o: [number, number, number][] = [];
  for (let a = 3; a <= 30; a++) for (let b = a + 1; b <= 40; b++) for (let c = b + 1; c <= 60; c++) {
    const W = lcm(lcm(a, b), c);
    if (W <= 600 && W % (W / a + W / b + W / c) === 0) o.push([a, b, c]);
  }
  return o;
})());
/** Vét cạn: mô phỏng từng ngày (đơn vị phần việc) đến khi xong; trả số ngày nếu xong đúng tròn ngày */
const simulate = (W: number, ratesByDay: (day: number) => number) => { let done = 0; for (let day = 1; day <= 500; day++) { done += ratesByDay(day); if (done === W) return day; if (done > W) return null; } return null; };

const workRate = (r: Rng, c: AdvCtx): Problem => {
  const a = r.int(3, 12);
  let b = r.int(3, 15); if (b === a) b = a + 1;
  const ans = frac(a + b, a * b);
  return {
    prompt: `Người thứ nhất làm một mình xong một công việc trong ${a} ngày, người thứ hai làm một mình xong trong ${b} ngày. Hỏi một ngày cả hai người cùng làm được mấy phần công việc?`,
    answer: fs(ans), unit: 'công việc',
    steps: [`Một ngày người thứ nhất làm được 1/${a} công việc, người thứ hai làm được 1/${b} công việc.`, `Cả hai người: 1/${a} + 1/${b} = ${fs(ans)} (công việc).`],
    traps: [{ value: fs(frac(1, a + b)), why: 'cộng số ngày rồi lấy 1 chia' }, { value: fs(frac(2, a + b)), why: 'cộng tử với tử, mẫu với mẫu' }, { value: fs(frac(1, a)), why: 'chỉ tính một người' }],
    brute: () => fs(addF(frac(1, a), frac(1, b))),
    outcome: oc(c, '03'), skill: 'cong_viec_nang_suat',
  };
};

const workTogether = (r: Rng, c: AdvCtx): Problem => {
  const [a, b] = r.pick(pairs());
  const W = W2(a, b), ra = W / a, rb = W / b, T = W / (ra + rb);
  return {
    prompt: `Đội A làm một mình xong một đoạn đường trong ${a} ngày, đội B làm một mình xong trong ${b} ngày. Nếu hai đội cùng làm thì sau bao nhiêu ngày xong đoạn đường?`,
    answer: T, unit: 'ngày',
    steps: [`Coi đoạn đường là ${W} phần bằng nhau.`, `Một ngày đội A làm ${W} : ${a} = ${ra} phần, đội B làm ${W} : ${b} = ${rb} phần.`, `Một ngày hai đội làm ${ra} + ${rb} = ${ra + rb} phần → thời gian: ${W} : ${ra + rb} = ${T} (ngày).`],
    traps: [{ value: (a + b) % 2 === 0 ? (a + b) / 2 : 0, why: 'lấy trung bình cộng số ngày' }, { value: a + b, why: 'cộng số ngày của hai đội' }, { value: b - a, why: 'lấy hiệu số ngày' }],
    brute: () => simulate(W, () => ra + rb),
    outcome: oc(c, '03'), skill: 'cong_viec_hai_doi',
  };
};

const workThree = (r: Rng, c: AdvCtx): Problem => {
  const [a, b, d] = r.pick(triples());
  const W = lcm(lcm(a, b), d), s = W / a + W / b + W / d, T = W / s;
  return {
    prompt: `Ba người cùng làm một công việc. Nếu làm một mình, người thứ nhất mất ${a} ngày, người thứ hai mất ${b} ngày, người thứ ba mất ${d} ngày. Hỏi cả ba người cùng làm thì mất bao nhiêu ngày?`,
    answer: T, unit: 'ngày',
    steps: [`Coi công việc là ${W} phần bằng nhau.`, `Một ngày ba người làm: ${W / a} + ${W / b} + ${W / d} = ${s} (phần).`, `Thời gian: ${W} : ${s} = ${T} (ngày).`],
    traps: [{ value: (a + b + d) % 3 === 0 ? (a + b + d) / 3 : 0, why: 'lấy trung bình cộng số ngày' }, { value: a + b + d, why: 'cộng số ngày' }, { value: a, why: 'chỉ lấy người làm nhanh nhất' }],
    brute: () => simulate(W, () => s),
    outcome: oc(c, '03'), skill: 'cong_viec_ba_nguoi',
  };
};

const workLeave = (r: Rng, c: AdvCtx): Problem | null => {
  const a = r.int(4, 20), b = r.int(a + 2, 40);
  const W = W2(a, b), ra = W / a, rb = W / b;
  if (W > 600) return null;
  const ts: number[] = [];
  for (let t = 1; t * (ra + rb) < W; t++) if ((W - t * (ra + rb)) % rb === 0) ts.push(t);
  if (!ts.length) return null;
  const t = r.pick(ts), k = (W - t * (ra + rb)) / rb;
  return {
    prompt: `Đội A làm một mình xong một công việc trong ${a} ngày, đội B làm một mình xong trong ${b} ngày. Hai đội cùng làm ${t} ngày thì đội A chuyển đi làm việc khác, đội B làm tiếp phần còn lại. Hỏi đội B phải làm thêm bao nhiêu ngày nữa?`,
    answer: k, unit: 'ngày',
    steps: [`Coi công việc là ${W} phần. Một ngày đội A làm ${ra} phần, đội B làm ${rb} phần.`, `${t} ngày hai đội làm được: (${ra} + ${rb}) × ${t} = ${(ra + rb) * t} (phần).`, `Còn lại: ${W} − ${(ra + rb) * t} = ${W - (ra + rb) * t} (phần).`, `Đội B làm nốt: ${W - (ra + rb) * t} : ${rb} = ${k} (ngày).`],
    traps: [{ value: t + k, why: 'cộng cả số ngày làm chung (bài chỉ hỏi phần đội B làm thêm)' }, { value: b - t, why: 'lấy số ngày của đội B trừ số ngày làm chung' }, { value: b, why: 'coi như đội B làm từ đầu' }],
    brute: () => { const more = simulate(W - t * (ra + rb), () => rb); return more; },
    outcome: oc(c, '03'), skill: 'cong_viec_nghi_giua',
  };
};

/** Các bộ (T1, T2, T3, t) cho ra số ngày làm thêm tròn — liệt kê sẵn một lần */
let LEAVE3: [number, number, number, number][] | null = null;
const leave3 = () => (LEAVE3 ??= (() => {
  const o: [number, number, number, number][] = [];
  for (let a = 6; a <= 15; a++) for (let b = a + 1; b <= 24; b++) for (let d = b + 1; d <= 36; d++) {
    const W = lcm(lcm(a, b), d);
    if (W > 720) continue;
    const all = W / a + W / b + W / d, rest = W / b + W / d;
    for (let t = 1; t * all < W; t++) if ((W - t * all) % rest === 0) o.push([a, b, d, t]);
  }
  return o;
})());

const workThreeLeave = (r: Rng, c: AdvCtx): Problem => {
  const [a, b, d, t] = r.pick(leave3());
  const W = lcm(lcm(a, b), d);
  const ra = W / a, rb = W / b, rd = W / d, all = ra + rb + rd, rest = rb + rd;
  const k = (W - t * all) / rest;
  const askTotal = r.chance(0.5);
  return {
    prompt: `Ba đội cùng làm một đoạn đường. Nếu làm riêng, đội 1 mất ${a} ngày, đội 2 mất ${b} ngày, đội 3 mất ${d} ngày. Cả ba đội làm chung ${t} ngày thì đội 1 chuyển đi làm việc khác, hai đội còn lại làm tiếp đến khi xong. ${askTotal ? 'Hỏi kể từ lúc bắt đầu, đoạn đường được làm xong sau tất cả bao nhiêu ngày?' : 'Hỏi hai đội còn lại phải làm thêm bao nhiêu ngày?'}`,
    answer: askTotal ? t + k : k, unit: 'ngày',
    steps: [
      `Coi đoạn đường là ${W} phần. Một ngày đội 1 làm ${ra} phần, đội 2 làm ${rb} phần, đội 3 làm ${rd} phần.`,
      `${t} ngày cả ba đội làm: (${ra} + ${rb} + ${rd}) × ${t} = ${all * t} (phần); còn lại ${W} − ${all * t} = ${W - all * t} (phần).`,
      `Đội 2 và đội 3 một ngày làm ${rb} + ${rd} = ${rest} (phần) → làm thêm ${W - all * t} : ${rest} = ${k} (ngày).`,
      ...(askTotal ? [`Tổng thời gian: ${t} + ${k} = ${t + k} (ngày).`] : []),
    ],
    traps: askTotal
      ? [{ value: k, why: 'quên cộng số ngày làm chung' }, { value: W % rest === 0 ? W / rest : 0, why: 'coi như hai đội làm từ đầu' }]
      : [{ value: t + k, why: 'cộng cả số ngày làm chung' }, { value: W % rest === 0 ? W / rest : 0, why: 'coi như hai đội làm từ đầu' }],
    brute: () => { const day = simulate(W, (dd) => (dd <= t ? all : rest)); return day === null ? null : askTotal ? day : day - t; },
    outcome: oc(c, '03'), skill: 'cong_viec_ba_doi_nghi',
  };
};

let PIPES: [number, number][] | null = null;
const pipes = () => (PIPES ??= (() => { const o: [number, number][] = []; for (let a = 2; a <= 12; a++) for (let b = a + 1; b <= 36; b++) if ((a * b) % (b - a) === 0 && (a * b) / (b - a) <= 40) o.push([a, b]); return o; })());

const pipeInOut = (r: Rng, c: AdvCtx): Problem => {
  const [a, b] = r.pick(pipes());
  const W = lcm(a, b), vin = W / a, vout = W / b, T = W / (vin - vout);
  return {
    prompt: `Vòi thứ nhất chảy đầy bể cạn trong ${a} giờ. Vòi thứ hai tháo hết nước của bể đầy trong ${b} giờ. Bể đang cạn, nếu mở cả hai vòi cùng lúc thì sau bao nhiêu giờ bể đầy?`,
    answer: T, unit: 'giờ',
    steps: [`Coi bể là ${W} phần. Một giờ vòi thứ nhất chảy vào ${W} : ${a} = ${vin} phần, vòi thứ hai tháo ra ${W} : ${b} = ${vout} phần.`, `Mỗi giờ bể thêm: ${vin} − ${vout} = ${vin - vout} (phần).`, `Thời gian bể đầy: ${W} : ${vin - vout} = ${T} (giờ).`],
    traps: [{ value: (a * b) % (a + b) === 0 ? (a * b) / (a + b) : 0, why: 'coi như cả hai vòi cùng chảy vào' }, { value: b - a, why: 'lấy hiệu số giờ' }, { value: a + b, why: 'cộng số giờ' }],
    brute: () => simulate(W, () => vin - vout),
    outcome: oc(c, '03'), skill: 'voi_nuoc',
  };
};

export const WORKS: GenPool = {
  1: [workRate],
  2: [workTogether, workRate],
  3: [workThree, workTogether],
  4: [workLeave, pipeInOut],
  5: [workThreeLeave, pipeInOut, workLeave],
};

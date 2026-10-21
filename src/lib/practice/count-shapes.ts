// BÀI TẬP NÂNG CAO "ĐẾM HÌNH" — Toán lớp 2–5 (gắn vào các bài hình học, mức 4–5).
//
// Hình vẽ sinh ngẫu nhiên theo seed từ các họ hình quen thuộc của toán nâng cao tiểu học (tham khảo cách phân dạng
// của các chuyên đề đếm hình phổ biến: tam giác có các đoạn thẳng chung đỉnh, hình chữ nhật chia ô, lưới ô vuông,
// hình vuông có đường chéo, góc chung đỉnh, hình bình hành, hình thang giữa các đường song song). Đề và lời giải do
// EduChain Kids tự viết. ĐÁP ÁN ĐƯỢC TÍNH TỪ CHÍNH HÌNH VẼ (src/lib/geometry-count.ts) và phải khớp công thức của
// họ hình — lệch thì bỏ câu (scripts/check-practice.ts + check-count-shapes.ts kiểm tra).

import type { Level } from '../content/types';
import type { Figure } from '../figures';
import { analyze, anglesAt, groupByPieces, shapesOf, type Seg, type ShapeKind } from '../geometry-count';
import { Q, type Meta, type PracticeQuestion } from './kit';
import type { Rng } from './rng';

type Label = { x: number; y: number; t: string; dx?: number; dy?: number };
type Ask = ShapeKind | 'segment' | 'angle';
/** Một hình vẽ + câu hỏi + đáp án theo công thức + lời giải đếm theo nhóm */
export type Built = { segs: Seg[]; w: number; h: number; labels?: Label[]; ask: Ask; formula: number; explain: (n: number) => string; alt: string; angleAt?: [number, number] };

const NOUN: Record<Ask, string> = {
  triangle: 'hình tam giác', quad: 'hình tứ giác', rectangle: 'hình chữ nhật', square: 'hình vuông',
  parallelogram: 'hình bình hành', trapezoid: 'hình thang', segment: 'đoạn thẳng', angle: 'góc',
};
const sumList = (n: number) => Array.from({ length: n }, (_, i) => n - i); // n, n−1, …, 1
const sumText = (n: number) => `${sumList(n).join(' + ')} = ${(n * (n + 1)) / 2}`;
const T = (n: number) => (n * (n + 1)) / 2;

/** Đếm theo công thức cho từng loại hỏi, từ chính hình vẽ */
export function countOf(b: Pick<Built, 'segs' | 'ask' | 'angleAt'>): number {
  const a = analyze(b.segs);
  if (b.ask === 'segment') return a.segments;
  if (b.ask === 'angle') return anglesAt(a, b.angleAt![0], b.angleAt![1]);
  return shapesOf(a, b.ask).length;
}

// ------------------------------------------------------------------ các họ hình

/** Tam giác ABC, từ đỉnh A kẻ k đoạn thẳng xuống cạnh đáy; thêm `hs` đường song song với đáy */
export function fan(k: number, hs = 0, ask: Ask = 'triangle', labelled = false): Built {
  const W = 300, H = 210, A: [number, number] = [W / 2, 0];
  const segs: Seg[] = [[A[0], A[1], 0, H], [A[0], A[1], W, H], [0, H, W, H]];
  const xs = Array.from({ length: k }, (_, i) => (W * (i + 1)) / (k + 1));
  for (const x of xs) segs.push([A[0], A[1], x, H]);
  const ys = Array.from({ length: hs }, (_, i) => (H * (i + 1)) / (hs + 1));
  for (const y of ys) { const d = (W / 2) * (y / H); segs.push([W / 2 - d, y, W / 2 + d, y]); }
  const n = k + 2, L = hs + 1;
  const names = 'BDEGHIK'.slice(0, k + 1).split('');
  const labels: Label[] | undefined = labelled ? [{ x: A[0], y: A[1], t: 'A' }, { x: 0, y: H, t: 'B', dy: 20 }, ...xs.map((x, i) => ({ x, y: H, t: names[i + 1] ?? '', dy: 20 })), { x: W, y: H, t: 'C', dy: 20 }] : undefined;
  const pts = labelled ? ['B', ...names.slice(1, k + 1), 'C'] : [];
  const formula = ask === 'segment' ? T(n - 1) + n : ask === 'trapezoid' ? T(n - 1) * T(L - 1) : T(n - 1) * L;
  const explain = (N: number) => {
    if (ask === 'segment') return `Trên cạnh đáy có ${n} điểm (${pts.join(', ')}): nối lần lượt từ trái sang phải được ${sumText(n - 1)} đoạn thẳng. Từ A nối xuống ${n} điểm đó được ${n} đoạn thẳng. Tổng: ${T(n - 1)} + ${n} = ${N} đoạn thẳng.`;
    if (ask === 'trapezoid') return `Hình thang nằm giữa hai đường nằm ngang (kể cả cạnh đáy). Giữa hai đường ngang bất kì có ${sumText(n - 1)} hình thang (đếm hình đơn, ghép 2, ghép 3…). Có ${L} đường ngang nên có ${T(L - 1)} cặp đường ngang. Tổng: ${T(n - 1)} × ${T(L - 1)} = ${N} hình thang.`;
    if (hs === 0) return `Đếm theo nhóm: ${n - 1} tam giác đơn, ${n - 2} tam giác ghép 2${n - 1 >= 3 ? ', ' + sumList(n - 1).slice(2).map((c, i) => `${c} tam giác ghép ${i + 3}`).join(', ') : ''}. Tổng: ${sumText(n - 1)} hình tam giác.`;
    return `Mọi tam giác đều có đỉnh A, cạnh đáy nằm trên một đường nằm ngang. Trên mỗi đường ngang có ${sumText(n - 1)} tam giác (như hình chỉ có các đoạn chung đỉnh A). Có ${L} đường ngang (kể cả cạnh đáy BC): ${Array(L).fill(T(n - 1)).join(' + ')} = ${N} hình tam giác.`;
  };
  const alt = `Hình tam giác, từ đỉnh trên kẻ ${k} đoạn thẳng xuống cạnh đáy${hs ? `, có thêm ${hs} đoạn thẳng nằm ngang song song với đáy` : ''}`;
  return { segs, w: W, h: H, labels, ask, formula, explain, alt };
}

/** Hình chữ nhật chia thành k + 1 phần bởi k đoạn thẳng đứng */
export function strip(k: number, ask: 'quad' | 'rectangle'): Built {
  const W = 300, H = 110;
  const segs: Seg[] = [[0, 0, W, 0], [0, H, W, H], [0, 0, 0, H], [W, 0, W, H]];
  for (let i = 1; i <= k; i++) segs.push([(W * i) / (k + 1), 0, (W * i) / (k + 1), H]);
  const n = k + 1;
  return {
    segs, w: W, h: H, ask, formula: T(n),
    explain: (N) => `Đếm theo nhóm: ${n} hình đơn${n >= 2 ? ', ' + sumList(n).slice(1).map((c, i) => `${c} hình ghép ${i + 2}`).join(', ') : ''}. Tổng: ${sumText(n)} = ${N} ${NOUN[ask]}.`,
    alt: `Hình chữ nhật được chia bởi ${k} đoạn thẳng đứng thành ${n} phần bằng nhau`,
  };
}

/** Lưới a hàng × b cột ô vuông */
export function grid(a: number, b: number, ask: 'square' | 'rectangle'): Built {
  const U = Math.min(70, 300 / b, 210 / a);
  const segs: Seg[] = [];
  for (let i = 0; i <= a; i++) segs.push([0, i * U, b * U, i * U]);
  for (let j = 0; j <= b; j++) segs.push([j * U, 0, j * U, a * U]);
  const m = Math.min(a, b);
  const sizes = Array.from({ length: m }, (_, i) => (a - i) * (b - i));
  const formula = ask === 'square' ? sizes.reduce((s, x) => s + x, 0) : T(a) * T(b);
  const explain = (N: number) => ask === 'square'
    ? `Đếm theo cỡ: ${sizes.map((c, i) => `${c} hình vuông cạnh ${i + 1} ô`).join(', ')}. Tổng: ${sizes.join(' + ')} = ${N} hình vuông.`
    : `Một hàng ngang ${b} ô có ${sumText(b)} hình chữ nhật. Xét theo chiều cao: ${sumList(a).map((c, i) => `cao ${i + 1} ô có ${c} chỗ đặt`).join(', ')} → ${sumText(a)} chỗ. Tổng: ${T(b)} × ${T(a)} = ${N} hình chữ nhật (tính cả hình vuông).`;
  return { segs, w: b * U, h: a * U, ask, formula, explain, alt: `Lưới ô vuông ${a} hàng, ${b} cột` };
}

/** Hình bình hành chia thành a × b hình bình hành nhỏ */
export function paraGrid(a: number, b: number): Built {
  const U = Math.min(70, 240 / b), V = Math.min(60, 180 / a), S = 40;
  const segs: Seg[] = [];
  for (let i = 0; i <= a; i++) { const off = (S * (a - i)) / a; segs.push([off, i * V, off + b * U, i * V]); }
  for (let j = 0; j <= b; j++) segs.push([S + j * U, 0, j * U, a * V]);
  return {
    segs, w: S + b * U, h: a * V, ask: 'parallelogram', formula: T(a) * T(b),
    explain: (N) => a === 1
      ? `Đếm theo nhóm: ${sumList(b).map((c, i) => `${c} hình ${i === 0 ? 'đơn' : `ghép ${i + 1}`}`).join(', ')}. Tổng: ${sumText(b)} = ${N} hình bình hành.`
      : `Mỗi hàng có ${sumText(b)} hình bình hành. Theo chiều cao: ${sumText(a)} cách chọn (cao 1 hàng, 2 hàng…). Tổng: ${T(b)} × ${T(a)} = ${N} hình bình hành.`,
    alt: `Hình bình hành được chia thành ${a * b} hình bình hành nhỏ bằng nhau`,
  };
}

/** n tia chung gốc O (các góc nhỏ hơn góc bẹt) */
export function rays(n: number, r: Rng): Built {
  const O: [number, number] = [150, 190];
  const span = r.int(110, 165), start = r.int(5, 175 - span);
  const angles = Array.from({ length: n }, (_, i) => start + (span * i) / (n - 1));
  const segs: Seg[] = angles.map((d) => { const t = (d * Math.PI) / 180; return [O[0], O[1], O[0] + 165 * Math.cos(t), O[1] - 165 * Math.sin(t)]; });
  return {
    segs, w: 300, h: 200, ask: 'angle', angleAt: O, formula: (n * (n - 1)) / 2,
    labels: [{ x: O[0], y: O[1], t: 'O', dy: 20 }],
    explain: (N) => `Có ${n} tia chung gốc O. Tia thứ nhất tạo với ${n - 1} tia còn lại ${n - 1} góc, tia thứ hai tạo thêm ${n - 2} góc…: ${sumText(n - 1)}. Có ${N} góc đỉnh O.`,
    alt: `${n} tia chung gốc O`,
  };
}

/** Hình cố định: lời giải đếm theo số mảnh nhỏ ghép thành */
function fixed(segs: Seg[], w: number, h: number, ask: ShapeKind, formula: number, alt: string, intro: string): Built {
  return {
    segs, w, h, ask, formula, alt,
    explain: (N) => {
      const g = groupByPieces(shapesOf(analyze(segs), ask));
      return `${intro} Đếm theo số phần nhỏ: ${g.map(([k, c]) => `${c} hình gồm ${k} phần`).join(', ')}. Tổng: ${g.map((x) => x[1]).join(' + ')} = ${N} ${NOUN[ask]}.`;
    },
  };
}
const SQ = 210;
const square: Seg[] = [[0, 0, SQ, 0], [SQ, 0, SQ, SQ], [SQ, SQ, 0, SQ], [0, SQ, 0, 0]];
export const squareDiag = () => fixed([...square, [0, 0, SQ, SQ], [SQ, 0, 0, SQ]], SQ, SQ, 'triangle', 8, 'Hình vuông có hai đường chéo', 'Hai đường chéo chia hình vuông thành 4 tam giác nhỏ.');
export const squareDiagMid = (ask: 'triangle' | 'rectangle' = 'triangle') => fixed([...square, [0, 0, SQ, SQ], [SQ, 0, 0, SQ], [SQ / 2, 0, SQ / 2, SQ], [0, SQ / 2, SQ, SQ / 2]], SQ, SQ, ask, ask === 'triangle' ? 16 : 9,
  'Hình vuông có hai đường chéo và hai đường nối trung điểm các cạnh đối diện', ask === 'triangle' ? 'Hình vuông được chia thành 8 tam giác nhỏ bằng nhau.' : 'Hai đường nối trung điểm chia hình vuông thành 4 hình vuông nhỏ.');
/** Tam giác nối trung điểm ba cạnh (4 tam giác nhỏ + tam giác lớn) */
export const midTriangle = () => fixed([[150, 0, 0, 200], [150, 0, 300, 200], [0, 200, 300, 200], [75, 100, 225, 100], [75, 100, 150, 200], [225, 100, 150, 200]], 300, 200, 'triangle', 5,
  'Hình tam giác có các đoạn thẳng nối trung điểm ba cạnh', 'Các đoạn nối trung điểm chia hình thành 4 tam giác nhỏ.');
/** Hình chữ nhật chia đôi, mỗi nửa có một đường chéo — các tam giác vuông */
export const rectTwoDiag = () => fixed([[0, 0, 300, 0], [0, 150, 300, 150], [0, 0, 0, 150], [300, 0, 300, 150], [150, 0, 150, 150], [0, 0, 150, 150], [300, 0, 150, 150]], 300, 150, 'triangle', 5,
  'Hình chữ nhật gồm hai hình vuông, mỗi hình vuông có một đường chéo, hai đường chéo gặp nhau ở cạnh dưới', 'Hình được chia thành các tam giác nhỏ.');

// ------------------------------------------------------------------ câu hỏi

/** Câu hỏi từ một hình: L4 chọn đáp án (nhiễu là các lỗi đếm hay gặp), L5 điền số */
export function ask(b: Built, l: Level, outcome: string, extra = ''): PracticeQuestion | null {
  const n = countOf(b);
  if (n !== b.formula || n < 2) return null; // hình vẽ và công thức phải khớp
  const noun = NOUN[b.ask];
  const what = b.ask === 'angle' ? 'góc đỉnh O (góc nhỏ hơn góc bẹt)' : b.ask === 'rectangle' ? 'hình chữ nhật (tính cả hình vuông)' : b.ask === 'segment' ? 'đoạn thẳng có hai đầu là hai điểm đã ghi tên' : noun;
  const prompt = `Hình bên có bao nhiêu ${what}?${extra}`;
  const m: Meta = { o: outcome, f: 'TOAN.HINH', k: `dem_hinh_${b.ask}`, l, e: b.explain(n), s: `Cách đếm: đếm hình đơn trước, rồi hình ghép 2, ghép 3… để không bỏ sót, không đếm trùng. ${b.explain(n)}` };
  const figure: Figure = { kind: 'lines', w: b.w, h: b.h, segs: b.segs, labels: b.labels, alt: b.alt };
  if (l >= 5) return Q.blanks(prompt, [`{} ${noun}`], [[n]], m, { figure });
  // nhiễu: chỉ đếm hình đơn, quên hình lớn nhất, đếm thừa
  const pieces = b.ask === 'angle' || b.ask === 'segment' ? n - 2 : groupByPieces(shapesOf(analyze(b.segs), b.ask))[0]?.[1] ?? n - 2;
  const opts = [...new Set([n, n - 1, n + 1, pieces, n + 2, n - 2].filter((x) => x > 0))].slice(0, 4);
  return Q.sc(prompt, [...opts].sort((x, y) => x - y).map(String), String(n), m, { figure });
}

// ------------------------------------------------------------------ mẫu câu theo lớp (gắn vào pool các bài hình học)

type Tpl = (r: Rng, c: unknown, l: Level) => PracticeQuestion | null;
const pickK = (r: Rng, l: Level, lo: [number, number], hi: [number, number]) => (l >= 5 ? r.int(...hi) : r.int(...lo));

/** Lớp 2: đoạn thẳng, tam giác chung đỉnh, hình tứ giác trong hình chữ nhật chia phần, hình vuông có 2 đường chéo */
export const G2: Record<'tri' | 'seg' | 'quad' | 'diag', Tpl> = {
  tri: (r, _c, l) => ask(fan(pickK(r, l, [1, 2], [2, 3])), l, 'T2.TD.04'),
  seg: (r, _c, l) => ask(fan(pickK(r, l, [1, 1], [1, 2]), 0, 'segment', true), l, 'T2.TD.04'),
  quad: (r, _c, l) => ask(strip(pickK(r, l, [1, 2], [2, 3]), 'quad'), l, 'T2.TD.04'),
  diag: (_r, _c, l) => ask(squareDiag(), l, 'T2.TD.04'),
};
/** Lớp 3: hình vuông, hình chữ nhật trong lưới ô; tam giác (chung đỉnh, nối trung điểm, có đường song song) */
export const G3: Record<'sq' | 'rect' | 'tri' | 'mid' | 'diag' | 'triH', Tpl> = {
  sq: (r, _c, l) => (l >= 5 ? ask(grid(r.int(2, 3), r.int(3, 4), 'square'), l, 'T3.TD.04') : ask(grid(2, r.int(2, 3), 'square'), l, 'T3.TD.04')),
  rect: (r, _c, l) => (l >= 5 ? ask(grid(2, r.int(2, 3), 'rectangle'), l, 'T3.TD.04') : ask(strip(r.int(2, 3), 'rectangle'), l, 'T3.TD.04')),
  tri: (r, _c, l) => ask(fan(pickK(r, l, [2, 3], [3, 4])), l, 'T3.TD.04'),
  mid: (_r, _c, l) => ask(midTriangle(), l, 'T3.TD.04'),
  diag: (r, _c, l) => ask(r.chance(0.5) ? squareDiag() : rectTwoDiag(), l, 'T3.TD.04'),
  triH: (r, _c, l) => ask(fan(r.int(1, 2), 1), l, 'T3.TD.04'),
};
/** Lớp 4: góc chung đỉnh, hình bình hành, hình chữ nhật, tam giác có đường song song */
export const G4: Record<'angle' | 'para' | 'rect' | 'triH' | 'diagMid', Tpl> = {
  angle: (r, _c, l) => ask(rays(pickK(r, l, [3, 4], [5, 6]), r), l, 'T4.TD.04'),
  para: (r, _c, l) => ask(l >= 5 ? paraGrid(2, r.int(2, 3)) : paraGrid(1, r.int(2, 4)), l, 'T4.TD.04'),
  rect: (r, _c, l) => ask(grid(l >= 5 ? 3 : 2, r.int(3, 4), 'rectangle'), l, 'T4.TD.04'),
  triH: (r, _c, l) => ask(fan(r.int(2, 3), l >= 5 ? 2 : 1), l, 'T4.TD.04'),
  diagMid: (_r, _c, l) => ask(squareDiagMid('rectangle'), l, 'T4.TD.04'),
};
/** Lớp 5: tam giác, hình thang giữa các đường song song; hình vuông có đường chéo và đường trung bình */
export const G5: Record<'tri' | 'trap' | 'diagMid' | 'sq', Tpl> = {
  tri: (r, _c, l) => ask(fan(r.int(2, 3), l >= 5 ? 2 : 1), l, 'T5.TD.02'),
  trap: (r, _c, l) => ask(fan(r.int(1, l >= 5 ? 3 : 2), l >= 5 ? 2 : 1, 'trapezoid'), l, 'T5.TD.02'),
  diagMid: (_r, _c, l) => ask(squareDiagMid('triangle'), l, 'T5.TD.02'),
  sq: (r, _c, l) => ask(grid(r.int(3, 4), 4, 'square'), l, 'T5.TD.02'),
};

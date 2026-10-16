// Game A — Thám tử quy luật: dữ liệu câu hỏi soạn sẵn + logic.
//
// Mỗi câu chỉ ghi QUY LUẬT và số hình hiện ra; dãy hình, đáp án và lời giải thích đều được TÍNH từ quy luật,
// nên không thể có câu sai đáp án. validatePattern() kiểm tra thêm: dãy hiện ra đủ dài để thấy quy luật
// (ít nhất 2 lần lặp), lựa chọn không trùng nhau, đúng 1 đáp án đúng, số lựa chọn 3–4.
// Không có câu sinh ngẫu nhiên.

import type { GameLevel } from './catalog';
import { DIRECTION_NAME, SHAPE_NAME, shapeLabel, type Direction, type Shape, type ShapeColor } from './shapes';

export type PatternItem =
  | { kind: 'shape'; shape: Shape; color: ShapeColor }
  | { kind: 'count'; shape: Shape; color: ShapeColor; n: number }
  | { kind: 'arrow'; dir: Direction; color: ShapeColor };

export type PatternRule =
  /** Một nhóm hình lặp lại: AB, ABC, AABB… */
  | { type: 'repeat'; unit: PatternItem[] }
  /** Dáng hình và màu đổi theo hai nhóm lặp khác nhau */
  | { type: 'twoAttr'; shapes: Shape[]; colors: ShapeColor[] }
  /** Số hình tăng / giảm đều */
  | { type: 'grow'; shape: Shape; color: ShapeColor; start: number; step: number }
  /** Mũi tên xoay đều */
  | { type: 'rotate'; color: ShapeColor; start: Direction; step: 1 | 2 | 3 };

export type PatternQuestion = {
  id: string;
  level: GameLevel;
  rule: PatternRule;
  /** Số hình hiện ra trước dấu "?" */
  shown: number;
  distractors: PatternItem[];
};

// Viết tắt cho gọn
const S = (shape: Shape, color: ShapeColor): PatternItem => ({ kind: 'shape', shape, color });
const C = (shape: Shape, color: ShapeColor, n: number): PatternItem => ({ kind: 'count', shape, color, n });
const A = (dir: Direction, color: ShapeColor): PatternItem => ({ kind: 'arrow', dir, color });

export const PATTERN_QUESTIONS: PatternQuestion[] = [
  // L1 — Làm quen: nhóm 2 hình (AB), 3 lựa chọn
  { id: 'p1-1', level: 1, rule: { type: 'repeat', unit: [S('circle', 'red'), S('square', 'blue')] }, shown: 6, distractors: [S('square', 'blue'), S('triangle', 'green')] },
  { id: 'p1-2', level: 1, rule: { type: 'repeat', unit: [S('star', 'yellow'), S('heart', 'red')] }, shown: 5, distractors: [S('star', 'yellow'), S('circle', 'red')] },
  { id: 'p1-3', level: 1, rule: { type: 'repeat', unit: [S('moon', 'yellow'), S('drop', 'blue')] }, shown: 6, distractors: [S('drop', 'blue'), S('star', 'yellow')] },
  { id: 'p1-4', level: 1, rule: { type: 'repeat', unit: [S('triangle', 'green'), S('triangle', 'orange')] }, shown: 7, distractors: [S('triangle', 'green'), S('square', 'orange')] },
  { id: 'p1-5', level: 1, rule: { type: 'repeat', unit: [S('square', 'purple'), S('circle', 'purple')] }, shown: 6, distractors: [S('circle', 'purple'), S('square', 'red')] },

  // L2 — Cơ bản: nhóm 3 hình (ABC, AAB, ABB), 3 lựa chọn
  { id: 'p2-1', level: 2, rule: { type: 'repeat', unit: [S('circle', 'red'), S('square', 'blue'), S('triangle', 'green')] }, shown: 7, distractors: [S('circle', 'red'), S('triangle', 'green')] },
  { id: 'p2-2', level: 2, rule: { type: 'repeat', unit: [S('star', 'yellow'), S('star', 'yellow'), S('moon', 'blue')] }, shown: 7, distractors: [S('moon', 'blue'), S('heart', 'yellow')] },
  { id: 'p2-3', level: 2, rule: { type: 'repeat', unit: [S('heart', 'red'), S('circle', 'green'), S('circle', 'green')] }, shown: 6, distractors: [S('circle', 'green'), S('heart', 'green')] },
  { id: 'p2-4', level: 2, rule: { type: 'repeat', unit: [S('drop', 'blue'), S('drop', 'green'), S('drop', 'orange')] }, shown: 8, distractors: [S('drop', 'blue'), S('drop', 'green')] },
  { id: 'p2-5', level: 2, rule: { type: 'repeat', unit: [S('hexagon', 'purple'), S('plus', 'orange'), S('diamond', 'blue')] }, shown: 6, distractors: [S('plus', 'orange'), S('diamond', 'blue')] },

  // L3 — Vận dụng: nhóm 4 hình (AABB, ABCD, ABBC, AABC, ABAC), 4 lựa chọn
  { id: 'p3-1', level: 3, rule: { type: 'repeat', unit: [S('circle', 'blue'), S('circle', 'blue'), S('square', 'yellow'), S('square', 'yellow')] }, shown: 9, distractors: [S('square', 'yellow'), S('triangle', 'blue'), S('circle', 'yellow')] },
  { id: 'p3-2', level: 3, rule: { type: 'repeat', unit: [S('star', 'red'), S('moon', 'blue'), S('heart', 'green'), S('drop', 'orange')] }, shown: 8, distractors: [S('moon', 'blue'), S('heart', 'green'), S('drop', 'orange')] },
  { id: 'p3-3', level: 3, rule: { type: 'repeat', unit: [S('triangle', 'green'), S('circle', 'red'), S('circle', 'red'), S('square', 'blue')] }, shown: 9, distractors: [S('square', 'blue'), S('triangle', 'green'), S('circle', 'blue')] },
  { id: 'p3-4', level: 3, rule: { type: 'repeat', unit: [S('heart', 'purple'), S('heart', 'purple'), S('star', 'yellow'), S('moon', 'orange')] }, shown: 10, distractors: [S('heart', 'purple'), S('moon', 'orange'), S('star', 'purple')] },
  { id: 'p3-5', level: 3, rule: { type: 'repeat', unit: [S('diamond', 'blue'), S('circle', 'red'), S('diamond', 'blue'), S('square', 'green')] }, shown: 9, distractors: [S('diamond', 'blue'), S('square', 'green'), S('triangle', 'red')] },

  // L4 — Thử thách: số hình tăng / giảm đều, mũi tên xoay; 4 lựa chọn (số hình không quá 10)
  { id: 'p4-1', level: 4, rule: { type: 'grow', shape: 'circle', color: 'red', start: 1, step: 1 }, shown: 4, distractors: [C('circle', 'red', 4), C('circle', 'red', 6), C('circle', 'red', 3)] },
  { id: 'p4-2', level: 4, rule: { type: 'rotate', color: 'blue', start: 0, step: 1 }, shown: 5, distractors: [A(0, 'blue'), A(2, 'blue'), A(3, 'blue')] },
  { id: 'p4-3', level: 4, rule: { type: 'grow', shape: 'star', color: 'yellow', start: 2, step: 2 }, shown: 3, distractors: [C('star', 'yellow', 7), C('star', 'yellow', 6), C('star', 'yellow', 9)] },
  { id: 'p4-4', level: 4, rule: { type: 'rotate', color: 'green', start: 0, step: 2 }, shown: 4, distractors: [A(2, 'green'), A(1, 'green'), A(3, 'green')] },
  { id: 'p4-5', level: 4, rule: { type: 'grow', shape: 'heart', color: 'purple', start: 9, step: -2 }, shown: 3, distractors: [C('heart', 'purple', 4), C('heart', 'purple', 2), C('heart', 'purple', 5)] },

  // L5 — Mở rộng: hai đặc điểm đổi cùng lúc, nhóm 4 hình xen kẽ, mũi tên xoay ngược; 4 lựa chọn
  { id: 'p5-1', level: 5, rule: { type: 'twoAttr', shapes: ['circle', 'square'], colors: ['red', 'blue', 'green'] }, shown: 7, distractors: [S('square', 'red'), S('circle', 'blue'), S('triangle', 'blue')] },
  { id: 'p5-2', level: 5, rule: { type: 'rotate', color: 'orange', start: 1, step: 3 }, shown: 5, distractors: [A(1, 'orange'), A(2, 'orange'), A(3, 'orange')] },
  { id: 'p5-3', level: 5, rule: { type: 'twoAttr', shapes: ['star', 'moon', 'heart'], colors: ['yellow', 'purple'] }, shown: 6, distractors: [S('star', 'purple'), S('moon', 'yellow'), S('heart', 'yellow')] },
  { id: 'p5-4', level: 5, rule: { type: 'repeat', unit: [S('triangle', 'red'), S('circle', 'blue'), S('square', 'green'), S('circle', 'blue')] }, shown: 9, distractors: [S('square', 'green'), S('triangle', 'red'), S('circle', 'green')] },
  { id: 'p5-5', level: 5, rule: { type: 'twoAttr', shapes: ['diamond', 'drop', 'plus'], colors: ['orange', 'blue'] }, shown: 6, distractors: [S('diamond', 'blue'), S('drop', 'orange'), S('plus', 'orange')] },
];

// ---------------------------------------------------------------------------
// Logic
// ---------------------------------------------------------------------------
const mod = (a: number, n: number) => ((a % n) + n) % n;

export function itemAt(rule: PatternRule, i: number): PatternItem {
  switch (rule.type) {
    case 'repeat':
      return rule.unit[i % rule.unit.length];
    case 'twoAttr':
      return S(rule.shapes[i % rule.shapes.length], rule.colors[i % rule.colors.length]);
    case 'grow':
      return C(rule.shape, rule.color, rule.start + rule.step * i);
    case 'rotate':
      return A(mod(rule.start + rule.step * i, 4) as Direction, rule.color);
  }
}

export const itemKey = (it: PatternItem) =>
  it.kind === 'shape' ? `s:${it.shape}:${it.color}` : it.kind === 'count' ? `c:${it.shape}:${it.color}:${it.n}` : `a:${it.dir}:${it.color}`;

export function itemName(it: PatternItem): string {
  if (it.kind === 'shape') return shapeLabel(it.shape, it.color);
  if (it.kind === 'count') return `${it.n} ${SHAPE_NAME[it.shape]}`;
  return `mũi tên chỉ ${DIRECTION_NAME[it.dir]}`;
}

export const sequenceOf = (q: PatternQuestion) => Array.from({ length: q.shown }, (_, i) => itemAt(q.rule, i));
export const answerOf = (q: PatternQuestion) => itemAt(q.rule, q.shown);

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Các lựa chọn: đáp án được đặt ở một vị trí cố định theo mã câu (không ngẫu nhiên, nhưng không luôn ở cùng chỗ) */
export function optionsOf(q: PatternQuestion): PatternItem[] {
  const opts = [...q.distractors];
  opts.splice(hash(q.id) % (opts.length + 1), 0, answerOf(q));
  return opts;
}

/** Chu kì ngắn nhất của một dãy (để chắc chắn quy luật không bị hiểu theo cách khác) */
function minimalPeriod<T>(xs: T[]): number {
  for (let p = 1; p <= xs.length; p++) {
    if (xs.every((x, i) => i < p || x === xs[i - p])) return p;
  }
  return xs.length;
}

export function explainPattern(q: PatternQuestion): string {
  const ans = itemName(answerOf(q));
  const r = q.rule;
  switch (r.type) {
    case 'repeat': {
      const k = r.unit.length;
      const pos = q.shown % k;
      const group = `Mỗi nhóm có ${k} hình: ${r.unit.map(itemName).join(', ')}. Nhóm này cứ lặp lại.`;
      return pos === 0
        ? `${group} Nhóm cuối vừa đủ ${k} hình, nên bắt đầu nhóm mới bằng ${ans}.`
        : `${group} Nhóm cuối mới có ${pos} hình, hình thứ ${pos + 1} của nhóm là ${ans}.`;
    }
    case 'twoAttr':
      return `Hình đổi lần lượt: ${r.shapes.map((s) => SHAPE_NAME[s]).join(' → ')}, rồi lặp lại. Màu đổi lần lượt theo một nhóm khác. Ghép hình và màu tiếp theo được ${ans}.`;
    case 'grow': {
      const counts = sequenceOf(q).map((it) => (it.kind === 'count' ? it.n : 0)).join(', ');
      const how = r.step > 0 ? `thêm ${r.step}` : `bớt ${-r.step}`;
      return `Số hình là ${counts}. Mỗi lần ${how} ${SHAPE_NAME[r.shape]}, nên tiếp theo là ${ans}.`;
    }
    case 'rotate': {
      const cycle: string[] = [];
      for (let i = 0; i < 4; i++) {
        const d = mod(r.start + r.step * i, 4) as Direction;
        const name = DIRECTION_NAME[d];
        if (cycle.includes(name)) break;
        cycle.push(name);
      }
      return `Mũi tên lần lượt chỉ ${cycle.join(' → ')}, rồi lặp lại. Vì thế tiếp theo là ${ans}.`;
    }
  }
}

/** Trả về danh sách lỗi của một câu (rỗng = câu hợp lệ) */
export function validatePattern(q: PatternQuestion): string[] {
  const errs: string[] = [];
  const opts = optionsOf(q);
  const keys = opts.map(itemKey);
  const ans = itemKey(answerOf(q));
  if (opts.length < 3 || opts.length > 4) errs.push(`${q.id}: cần 3–4 lựa chọn, đang có ${opts.length}`);
  if (new Set(keys).size !== keys.length) errs.push(`${q.id}: có lựa chọn trùng nhau`);
  if (keys.filter((k) => k === ans).length !== 1) errs.push(`${q.id}: phải có đúng 1 đáp án đúng`);
  const wantOpts = q.level <= 2 ? 3 : 4;
  if (opts.length !== wantOpts) errs.push(`${q.id}: cấp độ L${q.level} cần ${wantOpts} lựa chọn`);
  const r = q.rule;
  if (r.type === 'repeat') {
    const unitKeys = r.unit.map(itemKey);
    if (minimalPeriod(unitKeys) !== unitKeys.length) errs.push(`${q.id}: nhóm lặp chưa tối giản`);
    const seq = sequenceOf(q).map(itemKey);
    if (minimalPeriod(seq) !== unitKeys.length) errs.push(`${q.id}: dãy hiện ra có thể hiểu theo quy luật khác`);
    if (q.shown < 2 * unitKeys.length) errs.push(`${q.id}: cần hiện ít nhất 2 lần nhóm lặp`);
  } else if (r.type === 'twoAttr') {
    if (minimalPeriod(r.shapes) !== r.shapes.length || minimalPeriod(r.colors) !== r.colors.length) errs.push(`${q.id}: nhóm hình/màu chưa tối giản`);
    if (r.shapes.length === r.colors.length) errs.push(`${q.id}: hai nhóm cùng độ dài thì chỉ là quy luật lặp thường`);
    if (q.shown < 2 * Math.max(r.shapes.length, r.colors.length)) errs.push(`${q.id}: cần hiện ít nhất 2 lần mỗi nhóm`);
  } else if (r.type === 'grow') {
    if (q.shown < 3) errs.push(`${q.id}: cần ít nhất 3 nhóm để thấy quy luật tăng/giảm`);
    for (let i = 0; i <= q.shown; i++) {
      const it = itemAt(r, i);
      if (it.kind === 'count' && (it.n < 1 || it.n > 10)) errs.push(`${q.id}: số hình phải từ 1 đến 10`);
    }
    for (const d of q.distractors) if (d.kind === 'count' && (d.n < 1 || d.n > 10)) errs.push(`${q.id}: lựa chọn có số hình ngoài 1–10`);
  } else if (r.type === 'rotate') {
    if (q.shown < 3) errs.push(`${q.id}: cần ít nhất 3 mũi tên`);
  }
  return errs;
}

export const patternsForLevel = (level: GameLevel) => PATTERN_QUESTIONS.filter((q) => q.level === level);

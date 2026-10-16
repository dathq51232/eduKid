// Từ vựng, hình và hàm dựng câu hỏi dùng chung cho bộ sinh bài luyện tập.

import type { ContentQuestion, Level } from '../content/types';
import { SHAPE_LABEL, type Figure, type ScenePart, type ShapeName } from '../figures';
import type { AnswerKey } from '../types';
import type { Rng } from './rng';

export type PracticeQuestion = ContentQuestion & {
  figure?: Figure;
  optionFigures?: Record<string, Figure>;
  blanks?: string[];
  statements?: string[];
};

/** Phạm vi kiến thức của bài: số lớn nhất, số nhỏ nhất nên dùng khi đếm, phép tính đã học. */
export type Ctx = { lesson: number; max: number; focusMin: number; ops: readonly ('+' | '-')[] };

export type Meta = { o: string; f: string; l: Level; e: string; s?: string; k?: string };
const base = (m: Meta) => ({ explanation: m.e, solution: m.s, level: m.l, outcome: m.o, form: m.f, skill: m.k });

type Extra = Pick<PracticeQuestion, 'figure' | 'optionFigures'>;

export const Q = {
  /** Chọn 1 đáp án */
  sc: (prompt: string, options: string[], correct: string, m: Meta, x: Extra = {}): PracticeQuestion => ({
    type: 'single_choice', prompt, options, key: { correct }, ...base(m), ...x,
  }),
  /** Chọn nhiều đáp án */
  mc: (prompt: string, options: string[], correct: string[], m: Meta, x: Extra = {}): PracticeQuestion => ({
    type: 'multiple_choice', prompt, options, key: { correct }, ...base(m), ...x,
  }),
  /** Sắp xếp (truyền thứ tự đúng; trang làm bài tự đảo) */
  ord: (prompt: string, order: string[], m: Meta, x: Extra = {}): PracticeQuestion => ({
    type: 'ordering', prompt, options: [...order], key: { order }, ...base(m), ...x,
  }),
  /** Ghép cặp: [trái, phải][] (vế phải hiển thị theo thứ tự đảo) */
  mt: (prompt: string, pairs: [string, string][], m: Meta, x: Extra = {}): PracticeQuestion => ({
    type: 'matching', prompt, left: pairs.map((p) => p[0]), options: pairs.map((p) => p[1]),
    key: { pairs: Object.fromEntries(pairs) }, ...base(m), ...x,
  }),
  /** Điền nhiều ô: lines chứa "{}"; answers = các bộ đáp án chấp nhận (mỗi bộ đủ các ô) */
  blanks: (prompt: string, lines: string[], answers: (number | string)[][], m: Meta, x: Extra = {}): PracticeQuestion => {
    const sets = answers.map((a) => a.map(String));
    const uniq = sets.filter((s, i) => sets.findIndex((t) => t.join('|') === s.join('|')) === i);
    return { type: 'fill_blanks', prompt, options: [], blanks: lines, key: { answers: uniq } as AnswerKey, ...base(m), ...x };
  },
  /** Bảng Đúng/Sai */
  table: (prompt: string, rows: [string, boolean][], m: Meta, x: Extra = {}): PracticeQuestion => ({
    type: 'true_false_table', prompt, options: [], statements: rows.map((r) => r[0]),
    key: { truth: rows.map((r) => (r[1] ? 'Đúng' : 'Sai')) } as AnswerKey, ...base(m), ...x,
  }),
};

// ---------------------------------------------------------------------------
// Từ vựng
// ---------------------------------------------------------------------------
export type Thing = { icon: string; name: string }; // name gồm cả loại từ: "quả táo", "con cá"
export const THINGS: Thing[] = [
  { icon: '🍎', name: 'quả táo' },
  { icon: '🍊', name: 'quả cam' },
  { icon: '🍓', name: 'quả dâu tây' },
  { icon: '🍌', name: 'quả chuối' },
  { icon: '🐟', name: 'con cá' },
  { icon: '🐤', name: 'con gà con' },
  { icon: '🐞', name: 'con bọ rùa' },
  { icon: '🦋', name: 'con bướm' },
  { icon: '🐢', name: 'con rùa' },
  { icon: '🌸', name: 'bông hoa' },
  { icon: '⭐', name: 'ngôi sao' },
  { icon: '🎈', name: 'quả bóng bay' },
  { icon: '🚗', name: 'chiếc ô tô' },
  { icon: '✏️', name: 'chiếc bút chì' },
  { icon: '🧁', name: 'chiếc bánh' },
  { icon: '🐰', name: 'con thỏ' },
  { icon: '🦆', name: 'con vịt' },
  { icon: '⚽', name: 'quả bóng' },
  { icon: '🍄', name: 'cây nấm' },
  { icon: '🐝', name: 'con ong' },
];

/** Bỏ loại từ: "quả táo" -> "táo" (dùng trong câu "số táo nhiều hơn số cam") */
export const bare = (name: string) => name.replace(/^(quả|con|bông|ngôi|chiếc|cây|cái|quyển|viên)\s+/, '');

export const ANIMALS: Thing[] = [
  { icon: '🐶', name: 'con chó' },
  { icon: '🐱', name: 'con mèo' },
  { icon: '🐰', name: 'con thỏ' },
  { icon: '🐻', name: 'con gấu' },
  { icon: '🐷', name: 'con lợn' },
  { icon: '🐸', name: 'con ếch' },
  { icon: '🦆', name: 'con vịt' },
  { icon: '🐔', name: 'con gà' },
  { icon: '🐵', name: 'con khỉ' },
  { icon: '🐘', name: 'con voi' },
];

export const TOYS: Thing[] = [
  { icon: '📕', name: 'quyển sách' },
  { icon: '⚽', name: 'quả bóng' },
  { icon: '🧸', name: 'con gấu bông' },
  { icon: '🚗', name: 'chiếc ô tô' },
  { icon: '🎁', name: 'hộp quà' },
  { icon: '🥁', name: 'cái trống' },
  { icon: '⏰', name: 'đồng hồ báo thức' },
  { icon: '🎒', name: 'cái cặp' },
];

export const KIDS = ['An', 'Bình', 'Mai', 'Lan', 'Nam', 'Hà', 'Minh', 'Hoa', 'Tú', 'Linh', 'Khoa', 'Vy'];

/** Đồ vật dùng trong bài toán có lời văn: tên + đơn vị đếm */
export const STUFF = [
  { name: 'quyển vở', unit: 'quyển vở' },
  { name: 'cái kẹo', unit: 'cái kẹo' },
  { name: 'bông hoa', unit: 'bông hoa' },
  { name: 'quả cam', unit: 'quả cam' },
  { name: 'viên bi', unit: 'viên bi' },
  { name: 'chiếc bút chì', unit: 'chiếc bút chì' },
  { name: 'quả bóng bay', unit: 'quả bóng bay' },
  { name: 'cái nhãn vở', unit: 'cái nhãn vở' },
];

export const SHAPES: ShapeName[] = ['circle', 'square', 'triangle', 'rectangle'];
export const shapeTitle = (s: ShapeName) => SHAPE_LABEL[s].replace(/^h/, 'H'); // "Hình tròn"
export const COLORS = ['#ffb4a8', '#ffd66b', '#9fd8b5', '#a9c8ff', '#d6b8ff', '#ffc78a'];

/** Đồ vật thật có dạng hình phẳng */
export const SHAPE_OBJECTS: Record<ShapeName, string[]> = {
  circle: ['Mặt đồng hồ treo tường', 'Bánh xe đạp', 'Đồng xu', 'Chiếc đĩa ăn cơm', 'Mặt trống', 'Nắp hộp sữa bò tròn'],
  square: ['Chiếc bánh chưng', 'Chiếc khăn mùi xoa', 'Mặt con xúc xắc', 'Ô bàn cờ vua'],
  triangle: ['Biển báo nguy hiểm', 'Miếng bánh mì sandwich cắt chéo', 'Lá cờ đuôi nheo', 'Mái nhà nhìn từ phía trước', 'Chiếc thước ê-ke'],
  rectangle: ['Quyển vở', 'Cánh cửa ra vào', 'Bảng lớp học', 'Phong bì thư', 'Tờ tiền', 'Chiếc điện thoại'],
};

export const BLOCK_OBJECTS = {
  cube: ['Con xúc xắc', 'Khối rubik', 'Khối gỗ vuông đồ chơi'],
  box: ['Hộp sữa giấy', 'Viên gạch', 'Hộp bút', 'Bao diêm', 'Hộp bánh quy', 'Chiếc tủ lạnh'],
};

// ---------------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------------
/** n lựa chọn số (gồm đáp án), gần đáp án, trong [lo, hi], xếp tăng dần */
export function numOptions(r: Rng, correct: number, lo: number, hi: number, n = 4): string[] {
  const pool: number[] = [];
  for (let d = 1; d <= hi - lo && pool.length < 12; d++) {
    if (correct - d >= lo) pool.push(correct - d);
    if (correct + d <= hi) pool.push(correct + d);
  }
  const near = pool.slice(0, Math.max(n + 1, 5));
  const picks = r.sample(near, Math.min(n - 1, near.length));
  return [correct, ...picks].sort((a, b) => a - b).map(String);
}

export const objectsFig = (groups: { t: Thing; n: number }[]): Figure => ({
  kind: 'objects',
  groups: groups.map((g) => ({ icon: g.t.icon, count: g.n })),
  alt: groups.map((g) => `${g.n} ${g.t.name}`).join(', '),
});

export const shapeFig = (shape: ShapeName, color = '#ffffff'): Figure => ({
  kind: 'shapes', items: [{ shape, color }], alt: SHAPE_LABEL[shape],
});

/** Đếm số lượng mỗi loại hình trong danh sách */
export function tally<T extends string>(items: T[]): Record<T, number> {
  const out = {} as Record<T, number>;
  for (const x of items) out[x] = (out[x] ?? 0) + 1;
  return out;
}

// ---------------------------------------------------------------------------
// Tranh ghép từ hình phẳng: nhà, cây, mặt trời, ô tô, cờ, người tuyết, kem, thuyền
// ---------------------------------------------------------------------------
type Thingy = (x: number, y: number, c: (i: number) => string) => ScenePart[];
const P = (shape: ShapeName, x: number, y: number, w: number, h: number, color: string): ScenePart => ({ shape, x, y, w, h, color });

const BUILDERS: Record<string, Thingy> = {
  // ngôi nhà: mái tam giác, thân vuông, cửa chữ nhật, cửa sổ vuông
  house: (x, y, c) => [P('triangle', x, y, 90, 44, c(0)), P('square', x + 12, y + 44, 66, 66, c(1)), P('rectangle', x + 22, y + 74, 20, 36, c(2)), P('square', x + 50, y + 58, 18, 18, c(3))],
  // cây thông: hai tầng lá tam giác, thân chữ nhật
  pine: (x, y, c) => [P('triangle', x + 8, y, 54, 44, c(2)), P('triangle', x, y + 30, 70, 50, c(2)), P('rectangle', x + 27, y + 80, 16, 30, c(5))],
  // mặt trời
  sun: (x, y, c) => [P('circle', x + 10, y + 10, 56, 56, c(1))],
  // ô tô: thân chữ nhật, cabin vuông, hai bánh tròn
  car: (x, y, c) => [P('square', x + 22, y + 40, 40, 40, c(3)), P('rectangle', x, y + 66, 104, 34, c(0)), P('circle', x + 12, y + 92, 26, 26, c(4)), P('circle', x + 66, y + 92, 26, 26, c(4))],
  // lá cờ: cán chữ nhật dài, lá cờ tam giác
  flag: (x, y, c) => [P('rectangle', x, y, 8, 110, c(5)), P('triangle', x + 8, y + 2, 46, 40, c(0))],
  // người tuyết: hai hình tròn, mũ vuông
  snowman: (x, y, c) => [P('square', x + 22, y, 30, 30, c(4)), P('circle', x + 12, y + 30, 50, 50, '#ffffff'), P('circle', x + 2, y + 76, 70, 70, '#ffffff')],
  // thuyền: thân chữ nhật, buồm tam giác
  boat: (x, y, c) => [P('triangle', x + 30, y, 52, 60, c(1)), P('rectangle', x, y + 62, 110, 30, c(3))],
  // cây tròn
  tree: (x, y, c) => [P('circle', x, y, 70, 70, c(2)), P('rectangle', x + 27, y + 68, 16, 40, c(5))],
};
const SIZES: Record<string, [number, number]> = {
  house: [92, 112], pine: [72, 112], sun: [76, 76], car: [106, 120], flag: [56, 112], snowman: [74, 148], boat: [112, 94], tree: [72, 110],
};

/** Tranh gồm 2–3 vật ghép từ hình; trả về tranh và số hình mỗi loại */
export function buildScene(r: Rng, count = r.int(2, 3)) {
  const names = r.sample(Object.keys(BUILDERS), count);
  const palette = r.shuffle(COLORS);
  const c = (i: number) => palette[i % palette.length];
  const parts: ScenePart[] = [];
  let x = 6;
  let h = 0;
  for (const n of names) h = Math.max(h, SIZES[n][1]);
  for (const n of names) {
    const [w, hh] = SIZES[n];
    parts.push(...BUILDERS[n](x, h - hh + 6, c));
    x += w + 18;
  }
  const counts = tally(parts.map((p) => p.shape));
  const fig: Figure = {
    kind: 'scene',
    w: x - 12,
    h: h + 12,
    parts,
    alt: `Tranh ghép từ hình: ${SHAPES.filter((s) => counts[s]).map((s) => `${counts[s]} ${SHAPE_LABEL[s]}`).join(', ')}`,
  };
  return { fig, counts: SHAPES.reduce((o, s) => ({ ...o, [s]: counts[s] ?? 0 }), {} as Record<ShapeName, number>) };
}

/** Một hàng hình phẳng ngẫu nhiên (các loại trong `kinds`), tổng `total` hình */
export function shapeRow(r: Rng, kinds: ShapeName[], total: number) {
  const items: ShapeName[] = kinds.slice(); // mỗi loại ít nhất 1
  while (items.length < total) items.push(r.pick(kinds));
  const row = r.shuffle(items).map((shape) => ({ shape, color: r.pick(COLORS) }));
  const counts = tally(row.map((x) => x.shape));
  const fig: Figure = { kind: 'shapes', items: row, alt: kinds.map((s) => `${counts[s]} ${SHAPE_LABEL[s]}`).join(', ') };
  return { fig, counts: SHAPES.reduce((o, s) => ({ ...o, [s]: counts[s] ?? 0 }), {} as Record<ShapeName, number>) };
}

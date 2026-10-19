// Game E — Sudoku mini: điền sao cho mỗi hàng, mỗi cột, mỗi vùng đều có đủ các hình / số, không lặp lại.
// Logic thuần: tạo lưới đầy đủ từ mẫu chuẩn rồi xáo (đổi kí hiệu, đổi hàng / cột trong cùng dải), sau đó
// khoét ô trống sao cho đề LUÔN CÓ ĐÚNG MỘT LỜI GIẢI (kiểm bằng bộ đếm nghiệm quay lui).

import type { GameLevel } from './catalog';

export type SudokuLevel = { n: 4 | 6; br: number; bc: number; blanks: number; symbols: boolean };
export const SUDOKU_LEVELS: Record<GameLevel, SudokuLevel> = {
  1: { n: 4, br: 2, bc: 2, blanks: 6, symbols: true },
  2: { n: 4, br: 2, bc: 2, blanks: 8, symbols: false },
  3: { n: 4, br: 2, bc: 2, blanks: 11, symbols: false },
  4: { n: 6, br: 2, bc: 3, blanks: 16, symbols: false },
  5: { n: 6, br: 2, bc: 3, blanks: 22, symbols: false },
};

/** grid[r][c]: 1..n, 0 = ô trống */
export type Grid = number[][];
export type Sudoku = { n: number; br: number; bc: number; puzzle: Grid; solution: Grid; seed: number; symbols: boolean };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const range = (k: number) => Array.from({ length: k }, (_, i) => i);

/** Các số không được đặt vào ô (r, c) vì đã có ở cùng hàng, cột hoặc vùng */
export function usedAt(g: Grid, br: number, bc: number, r: number, c: number): Set<number> {
  const n = g.length;
  const s = new Set<number>();
  for (let i = 0; i < n; i++) {
    if (i !== c && g[r][i]) s.add(g[r][i]);
    if (i !== r && g[i][c]) s.add(g[i][c]);
  }
  const r0 = Math.floor(r / br) * br, c0 = Math.floor(c / bc) * bc;
  for (let i = r0; i < r0 + br; i++) for (let j = c0; j < c0 + bc; j++) if ((i !== r || j !== c) && g[i][j]) s.add(g[i][j]);
  return s;
}

/** Đếm số lời giải (dừng khi đạt `cap`) */
export function countSolutions(g0: Grid, br: number, bc: number, cap = 2): number {
  const g = g0.map((row) => [...row]);
  const n = g.length;
  let count = 0;
  const rec = (): void => {
    if (count >= cap) return;
    let best: { r: number; c: number; opts: number[] } | null = null;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (g[r][c]) continue;
        const used = usedAt(g, br, bc, r, c);
        const opts = range(n).map((i) => i + 1).filter((v) => !used.has(v));
        if (!best || opts.length < best.opts.length) best = { r, c, opts };
      }
    if (!best) {
      count++;
      return;
    }
    for (const v of best.opts) {
      g[best.r][best.c] = v;
      rec();
      g[best.r][best.c] = 0;
      if (count >= cap) return;
    }
  };
  rec();
  return count;
}

/** Lưới đầy đủ hợp lệ: mẫu chuẩn + xáo kí hiệu, hàng trong dải, dải, cột trong cột-vùng, cột-vùng */
function fullGrid(n: number, br: number, bc: number, rand: () => number): Grid {
  const sym = shuffle(range(n).map((i) => i + 1), rand);
  const bands = shuffle(range(n / br), rand);
  const rows = bands.flatMap((b) => shuffle(range(br), rand).map((k) => b * br + k));
  const stacks = shuffle(range(n / bc), rand);
  const cols = stacks.flatMap((s) => shuffle(range(bc), rand).map((k) => s * bc + k));
  const base = (r: number, c: number) => (bc * (r % br) + Math.floor(r / br) + c) % n;
  return rows.map((r) => cols.map((c) => sym[base(r, c)]));
}

export function generateSudoku(level: GameLevel, seed: number): Sudoku {
  const cfg = SUDOKU_LEVELS[level];
  const rand = mulberry32(seed);
  for (let attempt = 0; ; attempt++) {
    const solution = fullGrid(cfg.n, cfg.br, cfg.bc, rand);
    const puzzle = solution.map((row) => [...row]);
    let blanks = 0;
    for (const idx of shuffle(range(cfg.n * cfg.n), rand)) {
      if (blanks >= cfg.blanks) break;
      const r = Math.floor(idx / cfg.n), c = idx % cfg.n;
      const keep = puzzle[r][c];
      puzzle[r][c] = 0;
      if (countSolutions(puzzle, cfg.br, cfg.bc) === 1) blanks++;
      else puzzle[r][c] = keep;
    }
    if (blanks === cfg.blanks || attempt > 30) return { n: cfg.n, br: cfg.br, bc: cfg.bc, puzzle, solution, seed, symbols: cfg.symbols };
  }
}

export type Conflict = { where: 'row' | 'col' | 'box'; r: number; c: number };
/** Ô khác trong cùng hàng / cột / vùng đã có số v (để giải thích vì sao sai) */
export function findConflict(g: Grid, br: number, bc: number, r: number, c: number, v: number): Conflict | null {
  const n = g.length;
  for (let i = 0; i < n; i++) if (i !== c && g[r][i] === v) return { where: 'row', r, c: i };
  for (let i = 0; i < n; i++) if (i !== r && g[i][c] === v) return { where: 'col', r: i, c };
  const r0 = Math.floor(r / br) * br, c0 = Math.floor(c / bc) * bc;
  for (let i = r0; i < r0 + br; i++) for (let j = c0; j < c0 + bc; j++) if ((i !== r || j !== c) && g[i][j] === v) return { where: 'box', r: i, c: j };
  return null;
}

export type Hint = { r: number; c: number; value: number; reason: 'single' | 'reveal'; used: number[] };
/** Gợi ý: ưu tiên ô chỉ còn một khả năng (kèm các số đã có quanh nó); không có thì cho biết đáp án một ô. */
export function findHint(s: Sudoku, current: Grid): Hint | null {
  // chỉ tính các ô đúng (bỏ qua ô em điền sai) để lập luận không bị lệch
  const g = current.map((row, r) => row.map((v, c) => (v && v === s.solution[r][c] ? v : 0)));
  let firstEmpty: Hint | null = null;
  for (let r = 0; r < s.n; r++)
    for (let c = 0; c < s.n; c++) {
      if (g[r][c]) continue;
      const used = usedAt(g, s.br, s.bc, r, c);
      if (used.size === s.n - 1) return { r, c, value: s.solution[r][c], reason: 'single', used: [...used].sort((a, b) => a - b) };
      if (!firstEmpty) firstEmpty = { r, c, value: s.solution[r][c], reason: 'reveal', used: [...used].sort((a, b) => a - b) };
    }
  return firstEmpty;
}

export const isSolved = (s: Sudoku, g: Grid) => g.every((row, r) => row.every((v, c) => v === s.solution[r][c]));

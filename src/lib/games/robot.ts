// Game D — Robot lập trình: em xếp thẻ lệnh thành "chương trình", bấm Chạy để robot nhặt hết ngôi sao.
// Logic thuần (không có giao diện): tạo màn chơi có seed, chạy chương trình, tìm lời giải ngắn nhất (BFS).
//
// Ba kiểu lệnh tăng dần theo cấp độ:
//  - 'arrows'   (L1–L3): mỗi thẻ là một bước theo mũi tên Lên / Phải / Xuống / Trái.
//  - 'counted'  (L4)   : thẻ có số bước, ví dụ "Phải × 3" — làm quen với vòng lặp "lặp lại 3 lần".
//  - 'relative' (L5)   : robot có hướng nhìn; lệnh "Tiến × n", "Quay trái", "Quay phải" như lập trình thật.
// Màn chơi luôn giải được: chỉ nhận màn có lời giải, và số thẻ cho phép ≥ số thẻ của lời giải ngắn nhất.

import type { GameLevel } from './catalog';

export type RDir = 0 | 1 | 2 | 3; // 0 lên, 1 phải, 2 xuống, 3 trái
export const R_DIRS: RDir[] = [0, 1, 2, 3];
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
export const R_DIR_LABEL: Record<RDir, string> = { 0: 'Lên', 1: 'Phải', 2: 'Xuống', 3: 'Trái' };
export const R_DIR_SPOKEN: Record<RDir, string> = { 0: 'lên', 1: 'sang phải', 2: 'xuống', 3: 'sang trái' };

export type Mode = 'arrows' | 'counted' | 'relative';
export type Cmd = { kind: 'move'; dir: RDir; n: number } | { kind: 'fwd'; n: number } | { kind: 'turn'; side: 'L' | 'R' };
export type RPos = { x: number; y: number };

export type RobotLevel = {
  size: number;
  stars: number;
  rocks: number;
  mode: Mode;
  /** Số thẻ được dùng thêm so với lời giải ngắn nhất (null = thoải mái, tối đa MAX_CARDS) */
  slack: number | null;
  /** Độ dài lời giải ngắn nhất (tính bằng số thẻ) mong muốn */
  opt: [number, number];
};
export const MAX_CARDS = 14;
export const MAX_COUNT = 5;
export const ROUND_SIZE = 5;

export const ROBOT_LEVELS: Record<GameLevel, RobotLevel> = {
  1: { size: 4, stars: 1, rocks: 1, mode: 'arrows', slack: null, opt: [2, 4] },
  2: { size: 5, stars: 2, rocks: 4, mode: 'arrows', slack: 3, opt: [5, 8] },
  3: { size: 5, stars: 3, rocks: 5, mode: 'arrows', slack: 1, opt: [7, 11] },
  4: { size: 6, stars: 3, rocks: 7, mode: 'counted', slack: 1, opt: [4, 7] },
  5: { size: 6, stars: 2, rocks: 6, mode: 'relative', slack: 1, opt: [5, 8] },
};

export type Puzzle = {
  size: number;
  mode: Mode;
  start: RPos;
  /** Hướng nhìn ban đầu (chỉ dùng ở kiểu 'relative') */
  facing: RDir;
  stars: RPos[];
  rocks: RPos[];
  /** Số thẻ của lời giải ngắn nhất */
  best: number;
  /** Số thẻ tối đa em được dùng */
  limit: number;
  seed: number;
};

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

const key = (p: RPos) => `${p.x},${p.y}`;
const inside = (n: number, x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n;
export const turn = (d: RDir, side: 'L' | 'R'): RDir => (((d + (side === 'R' ? 1 : 3)) % 4) as RDir);

type Board = { n: number; rock: Set<string>; starIdx: Map<string, number> };
const boardOf = (p: Pick<Puzzle, 'size' | 'rocks' | 'stars'>): Board => ({
  n: p.size,
  rock: new Set(p.rocks.map(key)),
  starIdx: new Map(p.stars.map((s, i) => [key(s), i])),
});
const free = (b: Board, x: number, y: number) => inside(b.n, x, y) && !b.rock.has(`${x},${y}`);

/** Lời giải ngắn nhất (ít thẻ nhất) bằng BFS trên trạng thái (vị trí, hướng, các sao đã nhặt). null nếu không giải được. */
export function solve(p: Pick<Puzzle, 'size' | 'mode' | 'start' | 'facing' | 'stars' | 'rocks'>): Cmd[] | null {
  const b = boardOf(p);
  const all = (1 << p.stars.length) - 1;
  const rel = p.mode === 'relative';
  type S = { x: number; y: number; f: RDir; m: number };
  const sk = (s: S) => `${s.x},${s.y},${rel ? s.f : 0},${s.m}`;
  const s0: S = { x: p.start.x, y: p.start.y, f: rel ? p.facing : 0, m: 0 };
  const prev = new Map<string, { from: string; cmd: Cmd } | null>([[sk(s0), null]]);
  const states = new Map<string, S>([[sk(s0), s0]]);
  const q: S[] = [s0];
  const walk = (s: S, d: RDir, steps: number): S | null => {
    let { x, y, m } = s;
    for (let i = 0; i < steps; i++) {
      x += DX[d];
      y += DY[d];
      if (!free(b, x, y)) return null;
      const si = b.starIdx.get(`${x},${y}`);
      if (si !== undefined) m |= 1 << si;
      if (m === all) return { x, y, f: s.f, m }; // robot dừng ngay khi nhặt đủ sao
    }
    return { x, y, f: s.f, m };
  };
  for (let i = 0; i < q.length; i++) {
    const s = q[i];
    if (s.m === all) {
      const out: Cmd[] = [];
      let k: string | undefined = sk(s);
      while (k) {
        const pr = prev.get(k);
        if (!pr) break;
        out.unshift(pr.cmd);
        k = pr.from;
      }
      return out;
    }
    const nexts: { s: S; cmd: Cmd }[] = [];
    if (p.mode === 'arrows') {
      for (const d of R_DIRS) {
        const t = walk(s, d, 1);
        if (t) nexts.push({ s: t, cmd: { kind: 'move', dir: d, n: 1 } });
      }
    } else if (p.mode === 'counted') {
      for (const d of R_DIRS)
        for (let k = 1; k <= MAX_COUNT; k++) {
          const t = walk(s, d, k);
          if (!t) break;
          nexts.push({ s: t, cmd: { kind: 'move', dir: d, n: k } });
          if (t.m === all) break;
        }
    } else {
      for (const side of ['L', 'R'] as const) nexts.push({ s: { ...s, f: turn(s.f, side) }, cmd: { kind: 'turn', side } });
      for (let k = 1; k <= MAX_COUNT; k++) {
        const t = walk(s, s.f, k);
        if (!t) break;
        nexts.push({ s: t, cmd: { kind: 'fwd', n: k } });
        if (t.m === all) break;
      }
    }
    for (const nx of nexts) {
      const k = sk(nx.s);
      if (prev.has(k)) continue;
      prev.set(k, { from: sk(s), cmd: nx.cmd });
      states.set(k, nx.s);
      q.push(nx.s);
    }
  }
  return null;
}

/** Tạo một màn chơi theo cấp độ (cùng seed → cùng màn). Luôn giải được. */
export function generatePuzzle(level: GameLevel, seed: number): Puzzle {
  const cfg = ROBOT_LEVELS[level];
  const rand = mulberry32(seed);
  const n = cfg.size;
  const pick = (taken: Set<string>): RPos => {
    for (;;) {
      const p = { x: Math.floor(rand() * n), y: Math.floor(rand() * n) };
      if (!taken.has(key(p))) {
        taken.add(key(p));
        return p;
      }
    }
  };
  let fallback: Puzzle | null = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const taken = new Set<string>();
    const start = pick(taken);
    const stars = Array.from({ length: cfg.stars }, () => pick(taken));
    const rocks = Array.from({ length: cfg.rocks }, () => pick(taken));
    const facing = Math.floor(rand() * 4) as RDir;
    const base = { size: n, mode: cfg.mode, start, facing, stars, rocks };
    const sol = solve(base);
    if (!sol) continue;
    const best = sol.length;
    const limit = Math.min(MAX_CARDS, cfg.slack === null ? MAX_CARDS : best + cfg.slack);
    const pz: Puzzle = { ...base, best, limit: Math.max(limit, best), seed };
    if (best >= cfg.opt[0] && best <= cfg.opt[1]) return pz;
    if (!fallback && best >= 1 && best <= MAX_CARDS) fallback = pz;
  }
  if (fallback) return fallback;
  // Màn dự phòng chắc chắn giải được: không có đá, một sao ở góc đối diện
  const start = { x: 0, y: 0 };
  const stars = [{ x: n - 1, y: n - 1 }];
  const sol = solve({ size: n, mode: cfg.mode, start, facing: 1, stars, rocks: [] }) as Cmd[];
  return { size: n, mode: cfg.mode, start, facing: 1, stars, rocks: [], best: sol.length, limit: Math.min(MAX_CARDS, sol.length + (cfg.slack ?? 4)), seed };
}

/** rot: góc quay của robot tính dồn (độ), không quấn về 0 — để hình vẽ luôn quay đúng chiều, mỗi lần đúng 90° (hoặc 180°) */
export type Frame = { x: number; y: number; f: RDir; rot: number; got: number[] };

/** Hướng ban đầu robot nhìn: kiểu 'relative' theo màn chơi, các kiểu khác nhìn sang phải */
export const startFacing = (p: Pick<Puzzle, 'mode' | 'facing'>): RDir => (p.mode === 'relative' ? p.facing : 1);
/** Góc quay ngắn nhất từ hướng a sang hướng b: 0, +90 (phải), -90 (trái) hoặc 180 */
export const turnDelta = (a: RDir, b: RDir): number => [0, 90, 180, -90][(b - a + 4) % 4];
export type RunResult = {
  frames: Frame[];
  result: 'win' | 'crash' | 'short';
  /** Chỉ số thẻ lệnh đang chạy ở mỗi khung hình (để tô sáng thẻ) */
  cmdAt: number[];
  /** Ô robot định đi vào khi va (đá hoặc ra ngoài sân) */
  blocked?: { x: number; y: number; out: boolean };
  /** Chỉ số thẻ lệnh làm robot va */
  failAt?: number;
};

/** Chạy chương trình từng bước. Robot dừng khi nhặt đủ sao (thắng), khi va đá / ra ngoài sân (va), hoặc hết lệnh (thiếu sao). */
export function runProgram(p: Puzzle, prog: Cmd[]): RunResult {
  const b = boardOf(p);
  let x = p.start.x, y = p.start.y, f: RDir = startFacing(p), rot = f * 90;
  const got: number[] = [];
  const frames: Frame[] = [{ x, y, f, rot, got: [] }];
  const cmdAt: number[] = [-1];
  const stepTo = (d: RDir, ci: number): 'ok' | 'win' | 'crash' => {
    const nx = x + DX[d], ny = y + DY[d];
    if (!free(b, nx, ny)) return 'crash';
    x = nx;
    y = ny;
    const si = b.starIdx.get(`${x},${y}`);
    if (si !== undefined && !got.includes(si)) got.push(si);
    frames.push({ x, y, f, rot, got: [...got] });
    cmdAt.push(ci);
    return got.length === p.stars.length ? 'win' : 'ok';
  };
  for (let ci = 0; ci < prog.length; ci++) {
    const c = prog[ci];
    if (c.kind === 'turn') {
      f = turn(f, c.side);
      rot += c.side === 'R' ? 90 : -90;
      frames.push({ x, y, f, rot, got: [...got] });
      cmdAt.push(ci);
      continue;
    }
    const d: RDir = c.kind === 'move' ? c.dir : f;
    if (c.kind === 'move' && c.dir !== f) {
      // kiểu mũi tên: robot quay mặt về hướng đi (một khung hình riêng) rồi mới bước
      rot += turnDelta(f, c.dir);
      f = c.dir;
      frames.push({ x, y, f, rot, got: [...got] });
      cmdAt.push(ci);
    }
    for (let k = 0; k < c.n; k++) {
      const r = stepTo(d, ci);
      if (r === 'win') return { frames, result: 'win', cmdAt };
      if (r === 'crash') {
        const bx = x + DX[d], by = y + DY[d];
        return { frames, result: 'crash', cmdAt, blocked: { x: bx, y: by, out: !inside(p.size, bx, by) }, failAt: ci };
      }
    }
  }
  return { frames, result: 'short', cmdAt };
}

/** Lời đọc của một thẻ lệnh */
export function cmdLabel(c: Cmd): string {
  if (c.kind === 'move') return c.n > 1 ? `${R_DIR_LABEL[c.dir]} ${c.n} bước` : R_DIR_LABEL[c.dir];
  if (c.kind === 'fwd') return `Tiến ${c.n} bước`;
  return c.side === 'L' ? 'Quay trái' : 'Quay phải';
}

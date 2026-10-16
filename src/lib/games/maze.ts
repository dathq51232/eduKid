// Game C — Mê cung phiêu lưu: tạo mê cung và di chuyển (logic thuần).
//
// Mê cung được tạo bằng thuật toán "đào hầm" (DFS ngẫu nhiên có seed) → mê cung hoàn hảo: mọi ô đều nối với nhau
// và giữa hai ô bất kì luôn có đúng một đường đi. Vì vậy từ ô xuất phát luôn đến được đích.
// solveMaze() (BFS) kiểm tra lại điều đó và cho biết số bước ngắn nhất.

import type { GameLevel } from './catalog';

export type Dir = 'up' | 'right' | 'down' | 'left';
export const DIRS: Dir[] = ['up', 'right', 'down', 'left'];
const BIT: Record<Dir, number> = { up: 1, right: 2, down: 4, left: 8 };
const OPP: Record<Dir, Dir> = { up: 'down', right: 'left', down: 'up', left: 'right' };
const DX: Record<Dir, number> = { up: 0, right: 1, down: 0, left: -1 };
const DY: Record<Dir, number> = { up: -1, right: 0, down: 1, left: 0 };
export const DIR_LABEL: Record<Dir, string> = { up: 'Lên', right: 'Phải', down: 'Xuống', left: 'Trái' };

export const SIZE_BY_LEVEL: Record<GameLevel, number> = { 1: 5, 2: 6, 3: 8, 4: 10, 5: 12 };

export type Pos = { x: number; y: number };
export type Maze = {
  w: number;
  h: number;
  /** open[y][x]: các hướng KHÔNG có tường (cộng bit up=1, right=2, down=4, left=8) */
  open: number[][];
  start: Pos;
  goal: Pos;
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

const inside = (m: { w: number; h: number }, x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h;

export function generateMaze(size: number, seed: number): Maze {
  const w = size;
  const h = size;
  const rand = mulberry32(seed);
  const open = Array.from({ length: h }, () => Array.from({ length: w }, () => 0));
  const seen = Array.from({ length: h }, () => Array.from({ length: w }, () => false));
  const stack: Pos[] = [{ x: 0, y: 0 }];
  seen[0][0] = true;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const next = DIRS.filter((d) => inside({ w, h }, cur.x + DX[d], cur.y + DY[d]) && !seen[cur.y + DY[d]][cur.x + DX[d]]);
    if (!next.length) {
      stack.pop();
      continue;
    }
    const d = next[Math.floor(rand() * next.length)];
    const nx = cur.x + DX[d];
    const ny = cur.y + DY[d];
    open[cur.y][cur.x] |= BIT[d];
    open[ny][nx] |= BIT[OPP[d]];
    seen[ny][nx] = true;
    stack.push({ x: nx, y: ny });
  }
  return { w, h, open, start: { x: 0, y: 0 }, goal: { x: w - 1, y: h - 1 }, seed };
}

export const canMove = (m: Maze, p: Pos, d: Dir) => (m.open[p.y][p.x] & BIT[d]) !== 0;
export const hasWall = (m: Maze, p: Pos, d: Dir) => !canMove(m, p, d);

export function move(m: Maze, p: Pos, d: Dir): Pos | null {
  if (!canMove(m, p, d)) return null;
  const nx = p.x + DX[d];
  const ny = p.y + DY[d];
  return inside(m, nx, ny) ? { x: nx, y: ny } : null;
}

/** BFS: số bước ngắn nhất từ xuất phát đến đích (null nếu không đến được) và số ô đi tới được */
export function solveMaze(m: Maze): { steps: number | null; reachable: number } {
  const dist = Array.from({ length: m.h }, () => Array.from({ length: m.w }, () => -1));
  dist[m.start.y][m.start.x] = 0;
  const q: Pos[] = [m.start];
  let reachable = 0;
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    reachable++;
    for (const d of DIRS) {
      const n = move(m, p, d);
      if (n && dist[n.y][n.x] < 0) {
        dist[n.y][n.x] = dist[p.y][p.x] + 1;
        q.push(n);
      }
    }
  }
  const s = dist[m.goal.y][m.goal.x];
  return { steps: s < 0 ? null : s, reachable };
}

/** Phím bàn phím → hướng (mũi tên và WASD) */
export function keyToDir(key: string): Dir | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down';
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    default:
      return null;
  }
}

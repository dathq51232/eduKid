// Máy đối thủ cờ tướng: tìm kiếm alpha-beta sâu dần theo thời gian + xét nốt nước ăn quân,
// điểm quân + vị trí (tốt qua sông, mã ra giữa, xe linh hoạt). Ba mức như cờ vua.
import { XqBoard, uciOf, type XMove, K, H, R, C, P } from './engine';
import type { BotLevel } from '@/lib/chess/bot';

const VAL = [0, 0, 120, 120, 280, 600, 290, 40];
const MATE = 100000;

/** Điểm nhìn từ bên đang đi */
export function xqEvaluate(bd: XqBoard): number {
  let s = 0; const b = bd.b;
  for (let i = 0; i < 90; i++) {
    const v = b[i]; if (!v) continue;
    const t = Math.abs(v); const side = Math.sign(v);
    const f = i % 9, r = (i / 9) | 0;
    const adv = side > 0 ? 9 - r : r; // số hàng đã tiến (0 = hàng nhà)
    let w = VAL[t];
    if (t === P) { if (adv >= 5) w += 40 + (adv - 5) * 12 - Math.abs(f - 4) * 4; if (adv >= 9) w -= 30; }
    else if (t === H) w += 12 - (Math.abs(f - 4) + Math.abs(r - 4.5)) * 3 + (adv >= 5 ? 10 : 0);
    else if (t === C) w += (f === 4 ? 12 : 0) + (adv <= 2 ? 6 : 0);
    else if (t === R) w += (adv >= 5 ? 16 : 0) + (f === 0 || f === 8 ? -8 : 0);
    else if (t === K) w += f === 4 ? 6 : 0;
    s += side * w;
  }
  return s * bd.side;
}

type Ctx = { nodes: number; deadline: number; stop: boolean; killers: XMove[][]; keys: string[] };

function order(ms: XMove[], ctx: Ctx, ply: number): XMove[] {
  const k = ctx.killers[ply];
  const sc = (m: XMove) => (m.cap ? 1e5 + 10 * VAL[Math.abs(m.cap)] : k && k.some((x) => x.from === m.from && x.to === m.to) ? 5e4 : 0);
  return ms.sort((a, b) => sc(b) - sc(a));
}

function quiesce(bd: XqBoard, alpha: number, beta: number, ctx: Ctx, qd: number): number {
  ctx.nodes++;
  const stand = xqEvaluate(bd);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (qd <= 0) return alpha;
  for (const m of bd.gen(true).sort((a, b) => VAL[Math.abs(b.cap)] - VAL[Math.abs(a.cap)])) {
    if (Math.abs(m.cap) === K) return MATE; // ăn được tướng (thế cờ không hợp lệ phía trước)
    if (!bd.make(m)) continue;
    const v = -quiesce(bd, -beta, -alpha, ctx, qd - 1);
    bd.unmake();
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function search(bd: XqBoard, depth: number, alpha: number, beta: number, ctx: Ctx, ply: number, qd: number): number {
  if ((++ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) ctx.stop = true;
  if (ctx.stop) return 0;
  const key = bd.key();
  if (ply > 0 && ctx.keys.includes(key)) return 0; // tránh đi lặp lại
  const inCheck = bd.inCheck();
  if (depth <= 0 && !inCheck) return quiesce(bd, alpha, beta, ctx, qd);
  ctx.keys.push(key);
  let legal = 0;
  for (const m of order(bd.gen(), ctx, ply)) {
    if (!bd.make(m)) continue;
    legal++;
    const v = -search(bd, depth - 1, -beta, -alpha, ctx, ply + 1, qd);
    bd.unmake();
    if (ctx.stop) { ctx.keys.pop(); return 0; }
    if (v >= beta) { if (!m.cap) { const k = (ctx.killers[ply] ??= []); k.unshift(m); k.length = Math.min(k.length, 2); } ctx.keys.pop(); return beta; }
    if (v > alpha) alpha = v;
  }
  ctx.keys.pop();
  if (!legal) return -MATE + ply; // cờ tướng: hết nước = thua
  return alpha;
}

const CFG: Record<BotLevel, { maxDepth: number; ms: number; qd: number }> = {
  1: { maxDepth: 1, ms: 250, qd: 0 },
  2: { maxDepth: 3, ms: 700, qd: 3 },
  3: { maxDepth: 7, ms: 1600, qd: 6 },
};

/** Chọn nước (UCCI) cho bên đang đi. history: các khóa thế cờ đã qua để máy tránh lặp lại / chiếu dai. */
export function xqPickMove(fen: string, level: BotLevel, rand: () => number = Math.random, opts?: { ms?: number; history?: string[] }): string | null {
  const bd = new XqBoard(fen);
  const roots = bd.legal();
  if (!roots.length) return null;
  const cfg = CFG[level];
  const ctx: Ctx = { nodes: 0, deadline: Date.now() + (opts?.ms ?? cfg.ms), stop: false, killers: [], keys: [...(opts?.history ?? [])] };
  let scored = roots.map((m) => ({ m, v: 0 }));
  for (let d = 1; d <= cfg.maxDepth; d++) {
    const cur: { m: XMove; v: number }[] = [];
    for (const { m } of scored) {
      bd.make(m);
      const v = -search(bd, d - 1, -Infinity, Infinity, ctx, 1, cfg.qd);
      bd.unmake();
      if (ctx.stop) break;
      cur.push({ m, v });
    }
    if (ctx.stop && cur.length < scored.length) {
      if (cur.length) { const best = cur.reduce((a, c) => (c.v > a.v ? c : a)); if (best.v > cur[0].v) scored = [best, ...scored.filter((s) => s.m !== best.m)]; }
      break;
    }
    scored = cur.sort((a, b) => b.v - a.v);
    if (Math.abs(scored[0].v) > MATE / 2) break;
  }
  let pick = scored[0];
  if (level === 1) pick = rand() < 0.35 ? scored[Math.floor(rand() * scored.length)] : scored[Math.floor(rand() * Math.min(3, scored.length))];
  else if (level === 2) { const near = scored.filter((s) => s.v >= scored[0].v - 25); if (near.length > 1 && Math.abs(scored[0].v) < MATE / 2) pick = near[Math.floor(rand() * near.length)]; }
  return uciOf(pick.m);
}


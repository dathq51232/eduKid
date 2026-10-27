// Máy đối thủ cờ vua cho học sinh: bàn 0x88 tự viết (nhanh hơn chess.js ~50 lần cho việc tìm nước),
// tìm kiếm alpha-beta sâu dần theo thời gian + xét nốt các nước ăn quân + bảng điểm vị trí quân.
// Ba mức: Dễ (nhìn 1 nước, hay đi ngẫu nhiên), Vừa (≈3 nước), Khó (≈4–5 nước).
// Trọng tài luật vẫn là chess.js (giấy phép BSD-2): nước máy chọn được kiểm lại bằng chess.js trước khi đi.

export type BotLevel = 1 | 2 | 3;
export const BOT_LEVELS: { id: BotLevel; label: string; note: string }[] = [
  { id: 1, label: 'Dễ', note: 'Mới tập chơi' },
  { id: 2, label: 'Vừa', note: 'Đã biết luật' },
  { id: 3, label: 'Khó', note: 'Thử thách' },
];

// Mã quân: 1 tốt, 2 mã, 3 tượng, 4 xe, 5 hậu, 6 vua; Trắng dương, Đen âm.
const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
const VAL = [0, 100, 320, 330, 500, 900, 0];
const CH: Record<string, number> = { p: P, n: N, b: B, r: R, q: Q, k: K };
const LET = ' pnbrqk';

const PST: number[][] = [
  [],
  [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
];
// Vua cuối ván: nên ra giữa bàn
const K_END = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];

const KN = [33, 31, 18, 14, -33, -31, -18, -14];
const KG = [1, -1, 16, -16, 17, 15, -17, -15];
const DIAG = [17, 15, -17, -15];
const ORTH = [1, -1, 16, -16];

type Mv = { f: number; t: number; pr: number; cap: number; fl: number }; // fl: 1 bắt tốt qua đường, 2 nhập thành, 4 tốt đi 2 ô
type Undo = { mv: Mv; castle: number; ep: number; half: number };

const sq = (s: string) => (s.charCodeAt(0) - 97) + (8 - Number(s[1])) * 16;
const name = (x: number) => String.fromCharCode(97 + (x & 7)) + (8 - (x >> 4));
const idx64 = (x: number) => (x >> 4) * 8 + (x & 7);

export class Board {
  b = new Int8Array(128);
  side = 1; // 1 Trắng, -1 Đen
  castle = 0; // 1 K, 2 Q, 4 k, 8 q
  ep = -1;
  half = 0;
  hist: Undo[] = [];
  keys: string[] = [];

  constructor(fen: string) {
    const [pos, s, c, e, h] = fen.split(' ');
    let r = 0, f = 0;
    for (const ch of pos) {
      if (ch === '/') { r++; f = 0; continue; }
      if (/\d/.test(ch)) { f += Number(ch); continue; }
      const t = CH[ch.toLowerCase()];
      this.b[r * 16 + f] = ch === ch.toUpperCase() ? t : -t;
      f++;
    }
    this.side = s === 'b' ? -1 : 1;
    this.castle = (c.includes('K') ? 1 : 0) | (c.includes('Q') ? 2 : 0) | (c.includes('k') ? 4 : 0) | (c.includes('q') ? 8 : 0);
    this.ep = e && e !== '-' ? sq(e) : -1;
    this.half = Number(h) || 0;
  }

  key(): string { return String.fromCharCode(...this.b) + this.side + this.castle + this.ep; }

  attacked(s: number, by: number): boolean {
    const b = this.b;
    const pd = by === 1 ? 16 : -16; // tốt của bên "by" nằm phía dưới (Trắng) hoặc trên (Đen) ô s
    for (const d of [pd - 1, pd + 1]) { const x = s + d; if (!(x & 0x88) && b[x] === by * P) return true; }
    for (const d of KN) { const x = s + d; if (!(x & 0x88) && b[x] === by * N) return true; }
    for (const d of KG) { const x = s + d; if (!(x & 0x88) && b[x] === by * K) return true; }
    for (const d of DIAG) for (let x = s + d; !(x & 0x88); x += d) { const v = b[x]; if (v) { if (v === by * B || v === by * Q) return true; break; } }
    for (const d of ORTH) for (let x = s + d; !(x & 0x88); x += d) { const v = b[x]; if (v) { if (v === by * R || v === by * Q) return true; break; } }
    return false;
  }

  king(side: number): number { for (let x = 0; x < 128; x++) if (!(x & 0x88) && this.b[x] === side * K) return x; return -1; }
  inCheck(side = this.side): boolean { const k = this.king(side); return k >= 0 && this.attacked(k, -side); }

  gen(capsOnly = false): Mv[] {
    const out: Mv[] = []; const b = this.b; const me = this.side;
    const add = (f: number, t: number, fl = 0) => {
      const cap = fl & 1 ? -me * P : b[t];
      const pc = b[f] * me;
      if (pc === P && ((me === 1 && t < 8) || (me === -1 && t >= 112))) { for (const pr of [Q, N, R, B]) out.push({ f, t, pr, cap, fl }); }
      else out.push({ f, t, pr: 0, cap, fl });
    };
    for (let f = 0; f < 128; f++) {
      if (f & 0x88) { f += 7; continue; }
      const v = b[f]; if (!v || Math.sign(v) !== me) continue;
      const pc = v * me;
      if (pc === P) {
        const d = me === 1 ? -16 : 16;
        const t = f + d;
        if (!capsOnly && !(t & 0x88) && !b[t]) {
          add(f, t);
          const start = me === 1 ? (f >> 4) === 6 : (f >> 4) === 1;
          if (start && !b[t + d]) out.push({ f, t: t + d, pr: 0, cap: 0, fl: 4 });
        } else if (capsOnly && !(t & 0x88) && !b[t] && ((me === 1 && t < 8) || (me === -1 && t >= 112))) add(f, t);
        for (const c of [d - 1, d + 1]) {
          const x = f + c; if (x & 0x88) continue;
          if (b[x] && Math.sign(b[x]) === -me) add(f, x);
          else if (x === this.ep) add(f, x, 1);
        }
      } else if (pc === N || pc === K) {
        for (const d of pc === N ? KN : KG) { const x = f + d; if (x & 0x88) continue; const w = b[x]; if (!w ? !capsOnly : Math.sign(w) === -me) add(f, x); }
        if (pc === K && !capsOnly) {
          const home = me === 1 ? 116 : 4;
          if (f === home && !this.attacked(f, -me)) {
            const ks = me === 1 ? 1 : 4, qs = me === 1 ? 2 : 8;
            if (this.castle & ks && !b[f + 1] && !b[f + 2] && b[f + 3] === me * R && !this.attacked(f + 1, -me) && !this.attacked(f + 2, -me)) out.push({ f, t: f + 2, pr: 0, cap: 0, fl: 2 });
            if (this.castle & qs && !b[f - 1] && !b[f - 2] && !b[f - 3] && b[f - 4] === me * R && !this.attacked(f - 1, -me) && !this.attacked(f - 2, -me)) out.push({ f, t: f - 2, pr: 0, cap: 0, fl: 2 });
          }
        }
      } else {
        const dirs = pc === B ? DIAG : pc === R ? ORTH : KG;
        for (const d of dirs) for (let x = f + d; !(x & 0x88); x += d) {
          const w = b[x];
          if (!w) { if (!capsOnly) add(f, x); continue; }
          if (Math.sign(w) === -me) add(f, x);
          break;
        }
      }
    }
    return out;
  }

  make(m: Mv): boolean {
    const b = this.b; const me = this.side;
    this.hist.push({ mv: m, castle: this.castle, ep: this.ep, half: this.half });
    this.keys.push(this.key());
    const pc = b[m.f];
    b[m.t] = m.pr ? me * m.pr : pc; b[m.f] = 0;
    if (m.fl & 1) b[m.t + (me === 1 ? 16 : -16)] = 0;
    if (m.fl & 2) { if (m.t > m.f) { b[m.f + 1] = b[m.f + 3]; b[m.f + 3] = 0; } else { b[m.f - 1] = b[m.f - 4]; b[m.f - 4] = 0; } }
    this.ep = m.fl & 4 ? (m.f + m.t) >> 1 : -1;
    this.half = Math.abs(pc) === P || m.cap ? 0 : this.half + 1;
    for (const [s, mask] of [[116, 3], [4, 12], [119, 1], [112, 2], [7, 4], [0, 8]] as const) if (m.f === s || m.t === s) this.castle &= ~mask;
    this.side = -me;
    if (this.inCheck(me)) { this.unmake(); return false; }
    return true;
  }

  unmake(): void {
    const u = this.hist.pop(); if (!u) return; this.keys.pop();
    const m = u.mv; const b = this.b;
    this.side = -this.side; const me = this.side;
    b[m.f] = m.pr ? me * P : b[m.t];
    b[m.t] = m.fl & 1 ? 0 : m.cap;
    if (m.fl & 1) b[m.t + (me === 1 ? 16 : -16)] = -me * P;
    if (m.fl & 2) { if (m.t > m.f) { b[m.f + 3] = b[m.f + 1]; b[m.f + 1] = 0; } else { b[m.f - 4] = b[m.f - 1]; b[m.f - 1] = 0; } }
    this.castle = u.castle; this.ep = u.ep; this.half = u.half;
  }

  legal(): Mv[] { return this.gen().filter((m) => { if (this.make(m)) { this.unmake(); return true; } return false; }); }

  /** Điểm nhìn từ bên đang đi */
  evaluate(): number {
    let s = 0, mat = 0;
    const b = this.b;
    for (let x = 0; x < 128; x++) { if (x & 0x88) { x += 7; continue; } const v = b[x]; if (v && Math.abs(v) !== K && Math.abs(v) !== P) mat += VAL[Math.abs(v)]; }
    const endgame = mat <= 2600;
    for (let x = 0; x < 128; x++) {
      if (x & 0x88) { x += 7; continue; }
      const v = b[x]; if (!v) continue;
      const t = Math.abs(v); const i = v > 0 ? idx64(x) : idx64(x ^ 0x70);
      const w = VAL[t] + (t === K && endgame ? K_END[i] : PST[t][i]);
      s += v > 0 ? w : -w;
    }
    return s * this.side;
  }

  repeated(): boolean { const k = this.key(); let n = 0; for (let i = this.keys.length - 2; i >= 0 && i >= this.keys.length - this.half - 1; i -= 2) if (this.keys[i] === k && ++n >= 1) return true; return false; }
}

const MATE = 100000;
type Ctx = { nodes: number; deadline: number; stop: boolean; killers: Mv[][] };

function scoreMove(m: Mv, ctx: Ctx, ply: number, pv?: Mv): number {
  if (pv && pv.f === m.f && pv.t === m.t && pv.pr === m.pr) return 1e6;
  if (m.cap) return 1e5 + 10 * VAL[Math.abs(m.cap)] - (m.pr ? 0 : 1);
  if (m.pr) return 9e4 + VAL[m.pr];
  const k = ctx.killers[ply];
  if (k && k.some((x) => x.f === m.f && x.t === m.t)) return 5e4;
  return 0;
}

function quiesce(bd: Board, alpha: number, beta: number, ctx: Ctx, qd: number): number {
  ctx.nodes++;
  const stand = bd.evaluate();
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (qd <= 0) return alpha;
  const ms = bd.gen(true).sort((a, b) => VAL[Math.abs(b.cap)] - VAL[Math.abs(a.cap)]);
  for (const m of ms) {
    if (!bd.make(m)) continue;
    const v = -quiesce(bd, -beta, -alpha, ctx, qd - 1);
    bd.unmake();
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function search(bd: Board, depth: number, alpha: number, beta: number, ctx: Ctx, ply: number, qd: number): number {
  if ((++ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) ctx.stop = true;
  if (ctx.stop) return 0;
  if (ply > 0 && (bd.half >= 100 || bd.repeated())) return 0;
  const inCheck = bd.inCheck();
  if (depth <= 0 && !inCheck) return quiesce(bd, alpha, beta, ctx, qd);
  const ms = bd.gen();
  ms.sort((a, b) => scoreMove(b, ctx, ply) - scoreMove(a, ctx, ply));
  let legal = 0;
  for (const m of ms) {
    if (!bd.make(m)) continue;
    legal++;
    const v = -search(bd, depth - 1, -beta, -alpha, ctx, ply + 1, qd);
    bd.unmake();
    if (ctx.stop) return 0;
    if (v >= beta) { if (!m.cap) { const k = (ctx.killers[ply] ??= []); k.unshift(m); k.length = Math.min(k.length, 2); } return beta; }
    if (v > alpha) alpha = v;
  }
  if (!legal) return inCheck ? -MATE + ply : 0;
  return alpha;
}

const CFG: Record<BotLevel, { maxDepth: number; ms: number; qd: number }> = {
  1: { maxDepth: 1, ms: 200, qd: 0 },
  2: { maxDepth: 3, ms: 500, qd: 3 },
  3: { maxDepth: 6, ms: 1300, qd: 6 },
};

export type BotMove = { from: string; to: string; promotion?: string };

/** Chọn nước cho bên đang đi trong thế cờ FEN. history: các FEN trước đó (để máy tránh lặp lại thế cờ). */
export function pickMove(fen: string, level: BotLevel, rand: () => number = Math.random, opts?: { ms?: number }): BotMove | null {
  const bd = new Board(fen);
  const roots = bd.legal();
  if (!roots.length) return null;
  const cfg = CFG[level];
  const ctx: Ctx = { nodes: 0, deadline: Date.now() + (opts?.ms ?? cfg.ms), stop: false, killers: [] };
  let scored = roots.map((m) => ({ m, v: 0 }));
  for (let d = 1; d <= cfg.maxDepth; d++) {
    const cur: { m: Mv; v: number }[] = [];
    let alpha = -Infinity;
    for (const { m } of scored) {
      bd.make(m);
      // Cửa sổ hẹp cho các nước sau nước tốt nhất; mức Dễ/Vừa cần điểm chính xác của mọi nước để chọn ngẫu nhiên
      const v = level === 3 && alpha > -Infinity ? -search(bd, d - 1, -alpha - 1, -alpha + 1, ctx, 1, cfg.qd) : -search(bd, d - 1, -Infinity, Infinity, ctx, 1, cfg.qd);
      bd.unmake();
      if (ctx.stop) break;
      cur.push({ m, v });
      if (v > alpha) alpha = v;
    }
    if (ctx.stop && cur.length < scored.length) {
      // Độ sâu chưa xong: chỉ dùng nếu đã tìm được nước tốt hơn nước tốt nhất cũ
      if (cur.length && cur[0].m === scored[0].m) { const best = cur.reduce((a, c) => (c.v > a.v ? c : a)); if (best.v > cur[0].v) scored = [best, ...scored.filter((s) => s.m !== best.m)]; }
      break;
    }
    scored = cur.sort((a, b) => b.v - a.v);
    if (Math.abs(scored[0].v) > MATE / 2) break;
  }
  let pick = scored[0];
  if (level === 1) {
    pick = rand() < 0.35 ? scored[Math.floor(rand() * scored.length)] : scored[Math.floor(rand() * Math.min(3, scored.length))];
  } else if (level === 2) {
    const near = scored.filter((s) => s.v >= scored[0].v - 25);
    if (near.length > 1 && Math.abs(scored[0].v) < MATE / 2) pick = near[Math.floor(rand() * near.length)];
  }
  return { from: name(pick.m.f), to: name(pick.m.t), promotion: pick.m.pr ? LET[pick.m.pr] : undefined };
}

/** Đếm số thế cờ (perft) — dùng để kiểm thử bộ sinh nước khớp luật chuẩn */
export function perft(fen: string, depth: number): number {
  const bd = new Board(fen);
  const go = (d: number): number => { if (!d) return 1; let n = 0; for (const m of bd.gen()) { if (!bd.make(m)) continue; n += go(d - 1); bd.unmake(); } return n; };
  return go(depth);
}

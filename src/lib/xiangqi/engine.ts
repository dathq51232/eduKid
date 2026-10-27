// Bộ luật cờ tướng (tự viết, có kiểm thử perft): bàn 9×10, sinh nước hợp lệ, chiếu, tướng đối mặt,
// kết thúc ván. Dùng chung cho trình duyệt (bàn cờ, máy đối thủ) và máy chủ (trọng tài ván trực tuyến).
//
// Toạ độ: ô = r*9 + f; f 0–8 từ trái sang (nhìn từ bên Đỏ), r 0 = hàng trên cùng (bên Đen), r 9 = hàng dưới cùng (bên Đỏ).
// Ghi nước kiểu UCCI: cột a–i, hàng 0–9 tính từ dưới bên Đỏ lên (vd "h2e2" = Pháo đầu). Bên Đỏ = 'w', bên Đen = 'b'.

export type XSide = 'w' | 'b';
export type XKind = 'k' | 'a' | 'e' | 'h' | 'r' | 'c' | 'p';
export type XMove = { from: number; to: number; cap: number }; // cap: mã quân bị ăn (0 nếu không)

// Mã quân: 1 tướng, 2 sĩ, 3 tượng, 4 mã, 5 xe, 6 pháo, 7 tốt; Đỏ dương, Đen âm
export const K = 1, A = 2, E = 3, H = 4, R = 5, C = 6, P = 7;
const KIND: XKind[] = ['k', 'k', 'a', 'e', 'h', 'r', 'c', 'p'];
const CODE: Record<string, number> = { k: K, a: A, b: E, e: E, n: H, h: H, r: R, c: C, p: P };
export const kindOf = (v: number): XKind => KIND[Math.abs(v)];
export const sideOfCode = (v: number): XSide => (v > 0 ? 'w' : 'b');

export const START_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

const F = (i: number) => i % 9;
const Rk = (i: number) => (i / 9) | 0;
const inPalace = (i: number, s: number) => { const f = F(i), r = Rk(i); return f >= 3 && f <= 5 && (s > 0 ? r >= 7 : r <= 2); };
const ownHalf = (i: number, s: number) => (s > 0 ? Rk(i) >= 5 : Rk(i) <= 4);

export const sqName = (i: number) => String.fromCharCode(97 + F(i)) + (9 - Rk(i));
export const sqIndex = (s: string) => (9 - Number(s[1])) * 9 + (s.charCodeAt(0) - 97);
export const uciOf = (m: { from: number; to: number }) => sqName(m.from) + sqName(m.to);
export const UCI_RE = /^[a-i][0-9][a-i][0-9]$/;

export class XqBoard {
  b = new Int8Array(90);
  side = 1; // 1 Đỏ, -1 Đen
  quiet = 0; // số nửa nước liên tiếp không ăn quân
  hist: { m: XMove; quiet: number }[] = [];

  constructor(fen = START_FEN) {
    const [pos, s, , , q] = fen.split(' ');
    let i = 0;
    for (const ch of pos) {
      if (ch === '/') continue;
      if (/\d/.test(ch)) { i += Number(ch); continue; }
      const v = CODE[ch.toLowerCase()];
      if (!v) throw new Error('FEN lỗi');
      this.b[i++] = ch === ch.toUpperCase() ? v : -v;
    }
    if (i !== 90) throw new Error('FEN lỗi');
    this.side = s === 'b' ? -1 : 1;
    this.quiet = Number(q) || 0;
  }

  clone(): XqBoard { const x = new XqBoard(this.fen()); x.hist = this.hist.slice(); return x; }

  fen(): string {
    const L = ' kaenrcp'; const rows: string[] = [];
    for (let r = 0; r < 10; r++) {
      let row = '', e = 0;
      for (let f = 0; f < 9; f++) {
        const v = this.b[r * 9 + f];
        if (!v) { e++; continue; }
        if (e) { row += e; e = 0; }
        const l = L[Math.abs(v)].replace('e', 'b').replace('h', 'n');
        row += v > 0 ? l.toUpperCase() : l;
      }
      rows.push(row + (e ? e : ''));
    }
    return `${rows.join('/')} ${this.side > 0 ? 'w' : 'b'} - - ${this.quiet} ${Math.floor(this.hist.length / 2) + 1}`;
  }
  key(): string { return String.fromCharCode(...this.b.map((v) => v + 20)) + this.side; }

  king(s: number): number { for (let i = 0; i < 90; i++) if (this.b[i] === s * K) return i; return -1; }

  /** Ô i có bị bên "by" tấn công không (gồm cả luật tướng đối mặt) */
  attacked(i: number, by: number): boolean {
    const b = this.b; const f = F(i), r = Rk(i);
    // Xe, Pháo, Tướng (đối mặt) theo hàng/cột
    for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let x = f + df, y = r + dr, screens = 0;
      while (x >= 0 && x < 9 && y >= 0 && y < 10) {
        const v = b[y * 9 + x];
        if (v) {
          if (screens === 0) {
            if (v === by * R) return true;
            if (v === by * K && df === 0) return true; // tướng đối mặt trên cùng cột
            screens = 1;
          } else { if (v === by * C) return true; break; }
        }
        x += df; y += dr;
      }
    }
    // Mã: từ ô của mã nhảy tới i, chân mã ở ô cạnh mã theo hướng dài
    for (const [df, dr, lf, lr] of [[1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1], [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0]]) {
      const hf = f - df, hr = r - dr;
      if (hf < 0 || hf > 8 || hr < 0 || hr > 9) continue;
      if (b[hr * 9 + hf] !== by * H) continue;
      if (!b[(hr + lr) * 9 + (hf + lf)]) return true;
    }
    // Tốt: tốt đỏ tấn công ô phía trên nó (r-1) và ngang khi đã qua sông
    const pf = by > 0 ? r + 1 : r - 1; // hàng nơi tốt địch phải đứng để tiến vào i
    if (pf >= 0 && pf <= 9 && b[pf * 9 + f] === by * P) return true;
    for (const dx of [-1, 1]) {
      const x = f + dx; if (x < 0 || x > 8) continue;
      const v = b[r * 9 + x];
      if (v === by * P && !ownHalf(r * 9 + x, by)) return true;
    }
    return false;
  }

  inCheck(s = this.side): boolean { const k = this.king(s); return k >= 0 && this.attacked(k, -s); }

  /** Nước giả hợp lệ (chưa xét bị chiếu sau khi đi) */
  gen(capsOnly = false): XMove[] {
    const out: XMove[] = []; const b = this.b; const me = this.side;
    const add = (from: number, to: number) => { const v = b[to]; if (v && Math.sign(v) === me) return; if (capsOnly && !v) return; out.push({ from, to, cap: v }); };
    for (let i = 0; i < 90; i++) {
      const v = b[i]; if (!v || Math.sign(v) !== me) continue;
      const t = Math.abs(v); const f = F(i), r = Rk(i);
      if (t === K || t === A) {
        const dirs = t === K ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [df, dr] of dirs) { const x = f + df, y = r + dr; if (x < 0 || x > 8 || y < 0 || y > 9) continue; const j = y * 9 + x; if (inPalace(j, me)) add(i, j); }
      } else if (t === E) {
        for (const [df, dr] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
          const x = f + df, y = r + dr; if (x < 0 || x > 8 || y < 0 || y > 9) continue;
          const j = y * 9 + x; if (!ownHalf(j, me)) continue; // tượng không qua sông
          if (b[(r + dr / 2) * 9 + (f + df / 2)]) continue; // bị cản mắt tượng
          add(i, j);
        }
      } else if (t === H) {
        for (const [df, dr, lf, lr] of [[1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1], [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0]]) {
          const x = f + df, y = r + dr; if (x < 0 || x > 8 || y < 0 || y > 9) continue;
          if (b[(r + lr) * 9 + (f + lf)]) continue; // bị cản chân mã
          add(i, y * 9 + x);
        }
      } else if (t === R || t === C) {
        for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          let x = f + df, y = r + dr, jumped = false;
          while (x >= 0 && x < 9 && y >= 0 && y < 10) {
            const j = y * 9 + x; const w = b[j];
            if (t === R) { if (!w) { if (!capsOnly) add(i, j); } else { if (Math.sign(w) !== me) add(i, j); break; } }
            else if (!jumped) { if (!w) { if (!capsOnly) add(i, j); } else jumped = true; }
            else if (w) { if (Math.sign(w) !== me) add(i, j); break; }
            x += df; y += dr;
          }
        }
      } else { // tốt
        const fy = r - me; // Đỏ tiến lên (r giảm)
        if (fy >= 0 && fy <= 9) add(i, fy * 9 + f);
        if (!ownHalf(i, me)) for (const dx of [-1, 1]) { const x = f + dx; if (x >= 0 && x <= 8) add(i, r * 9 + x); }
      }
    }
    return out;
  }

  make(m: XMove): boolean {
    const me = this.side;
    this.hist.push({ m, quiet: this.quiet });
    this.b[m.to] = this.b[m.from]; this.b[m.from] = 0;
    this.quiet = m.cap ? 0 : this.quiet + 1;
    this.side = -me;
    if (this.inCheck(me)) { this.unmake(); return false; }
    return true;
  }
  unmake(): void {
    const h = this.hist.pop(); if (!h) return;
    const { m } = h;
    this.b[m.from] = this.b[m.to]; this.b[m.to] = m.cap;
    this.quiet = h.quiet; this.side = -this.side;
  }
  legal(): XMove[] { return this.gen().filter((m) => { if (this.make(m)) { this.unmake(); return true; } return false; }); }
}

/** Đếm số thế cờ — dùng kiểm thử bộ sinh nước với số chuẩn (44, 1920, 79666, 3290240) */
export function xqPerft(fen: string, depth: number): number {
  const bd = new XqBoard(fen);
  const go = (d: number): number => { if (!d) return 1; let n = 0; for (const m of bd.gen()) { if (!bd.make(m)) continue; n += go(d - 1); bd.unmake(); } return n; };
  return go(depth);
}

export type XqReason = 'checkmate' | 'stalemate' | 'perpetual_check' | 'repetition' | 'move_limit' | 'material';
export type XqResult = { winner: XSide | null; reason: XqReason };
export const MOVE_LIMIT_PLIES = 120; // 60 nước mỗi bên không ăn quân → hòa

/** Ván cờ tướng: bàn + lịch sử thế cờ (để xét lặp lại, chiếu dai) */
export class XqGame {
  bd: XqBoard;
  keys: string[];
  checks: boolean[] = []; // nước thứ i có chiếu tướng không
  ucis: string[] = [];

  constructor(fen = START_FEN) { this.bd = new XqBoard(fen); this.keys = [this.bd.key()]; }

  static fromMoves(moves: string[]): XqGame { const g = new XqGame(); for (const m of moves) if (!g.move(m)) throw new Error(`Nước không hợp lệ: ${m}`); return g; }

  turn(): XSide { return this.bd.side > 0 ? 'w' : 'b'; }
  fen(): string { return this.bd.fen(); }
  inCheck(): boolean { return this.bd.inCheck(); }
  get(i: number): { side: XSide; kind: XKind } | null { const v = this.bd.b[i]; return v ? { side: sideOfCode(v), kind: kindOf(v) } : null; }
  movesFrom(i: number): XMove[] { return this.bd.legal().filter((m) => m.from === i); }
  legal(): XMove[] { return this.bd.legal(); }

  /** Đi nước UCCI; trả về nước đã đi hoặc null nếu không hợp lệ */
  move(uci: string): XMove | null {
    if (!UCI_RE.test(uci)) return null;
    const from = sqIndex(uci.slice(0, 2)), to = sqIndex(uci.slice(2, 4));
    const m = this.bd.legal().find((x) => x.from === from && x.to === to);
    if (!m) return null;
    this.bd.make(m);
    this.ucis.push(uci); this.keys.push(this.bd.key()); this.checks.push(this.bd.inCheck());
    return m;
  }
  undo(): void { if (!this.ucis.length) return; this.bd.unmake(); this.ucis.pop(); this.keys.pop(); this.checks.pop(); }

  /** Kết quả theo luật (null = còn đánh tiếp) */
  result(): XqResult | null {
    const bd = this.bd;
    if (!bd.legal().length) {
      // Cờ tướng: hết nước đi là thua, dù có bị chiếu hay không
      return { winner: bd.side > 0 ? 'b' : 'w', reason: bd.inCheck() ? 'checkmate' : 'stalemate' };
    }
    // Lặp lại thế cờ lần thứ 3: bên nào chiếu liên tục suốt vòng lặp (chiếu dai) thì thua; còn lại hòa
    const k = this.keys[this.keys.length - 1];
    const idx: number[] = [];
    for (let i = this.keys.length - 1; i >= 0; i--) if (this.keys[i] === k) idx.push(i);
    if (idx.length >= 3) {
      const s0 = idx[2]; // lần xuất hiện thứ 3 tính ngược từ hiện tại: xét các nước trong vòng lặp từ đó tới giờ
      const moverAll: Record<XSide, boolean> = { w: true, b: true };
      for (let j = s0; j < this.checks.length; j++) {
        const side: XSide = j % 2 === 0 ? 'w' : 'b'; // nước thứ j (0-based) do Đỏ đi nếu j chẵn
        if (!this.checks[j]) moverAll[side] = false;
      }
      if (moverAll.w && !moverAll.b) return { winner: 'b', reason: 'perpetual_check' };
      if (moverAll.b && !moverAll.w) return { winner: 'w', reason: 'perpetual_check' };
      return { winner: null, reason: 'repetition' };
    }
    if (bd.quiet >= MOVE_LIMIT_PLIES) return { winner: null, reason: 'move_limit' };
    // Không bên nào còn quân qua sông tấn công được (xe, mã, pháo, tốt) → hòa
    let attackers = 0;
    for (let i = 0; i < 90; i++) { const t = Math.abs(bd.b[i]); if (t === R || t === H || t === C || t === P) { attackers++; break; } }
    if (!attackers) return { winner: null, reason: 'material' };
    return null;
  }

  /** Quân một bên còn có thể chiếu bí được không (khi đối thủ hết giờ) */
  canMate(side: XSide): boolean {
    const s = side === 'w' ? 1 : -1;
    for (let i = 0; i < 90; i++) { const v = this.bd.b[i]; if (Math.sign(v) === s && [R, H, C, P].includes(Math.abs(v))) return true; }
    return false;
  }
}

// ---------- Ghi nước kiểu Việt Nam: X1.1 (Xe 1 tiến 1), P2-5 (Pháo 2 bình 5), M8/7 (Mã 8 thoái 7) ----------
const VN_ABBR: Record<XKind, string> = { k: 'Tg', a: 'S', e: 'T', h: 'M', r: 'X', c: 'P', p: 'B' };
/** Ký hiệu nước đi theo cách ghi cờ tướng tiếng Việt, tính trên bàn TRƯỚC khi đi */
export function vnNotation(bd: XqBoard, m: { from: number; to: number }): string {
  const v = bd.b[m.from]; const s = Math.sign(v); const t = Math.abs(v); const kind = KIND[t];
  // Cột tính từ phải sang trái của người đi: Đỏ cột 1 = f 8; Đen cột 1 = f 0
  const col = (i: number) => (s > 0 ? 9 - F(i) : F(i) + 1);
  const fr = Rk(m.from), tr = Rk(m.to);
  const fwd = s > 0 ? fr - tr : tr - fr; // >0 tiến, <0 thoái
  // Hai quân cùng loại cùng cột → dùng "t" (trước) / "s" (sau) thay số cột
  let head = `${VN_ABBR[kind]}${col(m.from)}`;
  const same: number[] = [];
  for (let r = 0; r < 10; r++) if (bd.b[r * 9 + F(m.from)] === v) same.push(r);
  if (same.length >= 2 && t !== P) {
    const front = s > 0 ? Math.min(...same) : Math.max(...same);
    head = `${VN_ABBR[kind]}${fr === front ? 't' : 's'}`;
  }
  const straight = t === K || t === R || t === C || t === P;
  if (fwd === 0) return `${head}-${col(m.to)}`;
  const sign = fwd > 0 ? '.' : '/';
  return `${head}${sign}${straight ? Math.abs(fwd) : col(m.to)}`;
}

'use client';
// Mảnh giao diện dùng chung cho các trang cờ tướng: chuyển ván sang dữ liệu bàn cờ, quân bị ăn, danh sách nước kiểu Việt.
import { XqBoard, XqGame, kindOf, sideOfCode, vnNotation, type XKind } from '@/lib/xiangqi/engine';
import { XqDiscIcon, type XqPiece, type XqPoint } from './XiangqiBoard';

export const pt = (i: number): XqPoint => ({ f: i % 9, r: (i / 9) | 0 });
export const idx = (p: XqPoint) => p.r * 9 + p.f;
export const XQ_SIDE = { w: 'Đỏ', b: 'Đen' } as const;

/** Bàn cờ [hàng][cột] cho XiangqiBoard (Đỏ = 'r') */
export function boardOf(bd: XqBoard): (XqPiece | null)[][] {
  const B: (XqPiece | null)[][] = [];
  for (let r = 0; r < 10; r++) {
    const row: (XqPiece | null)[] = [];
    for (let f = 0; f < 9; f++) { const v = bd.b[r * 9 + f]; row.push(v ? { side: sideOfCode(v) === 'w' ? 'r' : 'b', kind: kindOf(v) } : null); }
    B.push(row);
  }
  return B;
}

const START: Record<XKind, number> = { k: 1, a: 2, e: 2, h: 2, r: 2, c: 2, p: 5 };
const VALUE: Record<XKind, number> = { k: 0, a: 2, e: 2, h: 4, r: 9, c: 4.5, p: 1 };
/** Quân mỗi bên đã ăn được (w = Đỏ ăn quân Đen) + chênh lệch điểm quân */
export function capturedOf(bd: XqBoard): { w: XKind[]; b: XKind[]; diff: number } {
  const zero = (): Record<XKind, number> => ({ k: 0, a: 0, e: 0, h: 0, r: 0, c: 0, p: 0 });
  const left = { w: zero(), b: zero() };
  for (let i = 0; i < 90; i++) { const v = bd.b[i]; if (v) left[sideOfCode(v)][kindOf(v)]++; }
  const lost = (s: 'w' | 'b') => (['r', 'c', 'h', 'e', 'a', 'p'] as XKind[]).flatMap((k) => Array(Math.max(0, START[k] - left[s][k])).fill(k) as XKind[]);
  const mat = (s: 'w' | 'b') => (Object.keys(VALUE) as XKind[]).reduce((t, k) => t + VALUE[k] * left[s][k], 0);
  return { w: lost('b'), b: lost('w'), diff: Math.round((mat('w') - mat('b')) * 2) / 2 };
}

/** Ký hiệu tiếng Việt của mọi nước trong ván (P2-5, M8.7…) */
export function vnHistory(ucis: string[]): string[] {
  const g = new XqGame(); const out: string[] = [];
  for (const u of ucis) {
    const before = g.bd.clone();
    const m = g.move(u); if (!m) break;
    out.push(vnNotation(before, m));
  }
  return out;
}

export function XqMoveList({ notes }: { notes: string[] }) {
  const rows: [number, string, string?][] = [];
  for (let i = 0; i < notes.length; i += 2) rows.push([i / 2 + 1, notes[i], notes[i + 1]]);
  return (
    <div className="chs-moves" aria-label="Các nước đã đi">
      {rows.length === 0 ? <p className="dash-muted">Chưa có nước nào. Bên Đỏ đi trước.</p> : (
        <ol>{rows.map(([n, a, b]) => <li key={n}><span>{n}.</span><b className="xq-mv is-r">{a}</b><b className="xq-mv">{b ?? ''}</b></li>)}</ol>
      )}
    </div>
  );
}

export function CapturedRow({ kinds, side }: { kinds: XKind[]; side: 'r' | 'b' }) {
  return <span className="chs-caps xq-caps">{kinds.map((k, i) => <XqDiscIcon key={i} piece={{ side, kind: k }} size={22} />)}</span>;
}

export const XQ_RULES = [
  'Bên Đỏ đi trước. Mỗi quân đi theo luật riêng: Xe đi thẳng, Pháo phải có ngòi mới ăn được, Mã bị cản chân, Tượng không qua sông và bị cản mắt, Sĩ và Tướng không ra khỏi cung.',
  'Hai Tướng không được đối mặt trên cùng một cột mà không có quân nào chắn giữa.',
  'Thắng khi chiếu bí, khi đối thủ hết nước đi, xin thua hoặc hết giờ.',
  'Chiếu dai làm lặp lại thế cờ 3 lần thì bên chiếu bị xử thua; lặp lại không chiếu thì hòa.',
  'Hòa khi hai bên đồng ý, khi 60 nước liền không ăn quân, hoặc khi cả hai không còn quân tấn công.',
];

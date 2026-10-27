// Phần dùng chung của ván cờ vua: kiểu đồng hồ, kết quả ván theo luật FIDE, quân bị ăn, lời nhắn tiếng Việt.
import { Chess, type Color, type PieceSymbol } from 'chess.js';

export type TimeControl = { id: string; label: string; base: number; inc: number }; // giây
export const TIME_CONTROLS: TimeControl[] = [
  { id: 'free', label: 'Không tính giờ', base: 0, inc: 0 },
  { id: '5+3', label: '5 phút + 3 giây', base: 300, inc: 3 },
  { id: '10+5', label: '10 phút + 5 giây', base: 600, inc: 5 },
  { id: '15+10', label: '15 phút + 10 giây', base: 900, inc: 10 },
];

export type ResultReason = 'checkmate' | 'stalemate' | 'repetition' | 'fifty' | 'material' | 'timeout' | 'resign' | 'agreement' | 'timeout_vs_material';
export type GameResult = { winner: Color | null; reason: ResultReason };

export const REASON_TEXT: Record<ResultReason, string> = {
  checkmate: 'Chiếu hết',
  stalemate: 'Hết nước đi (hòa pat)',
  repetition: 'Lặp lại thế cờ 3 lần',
  fifty: 'Luật 50 nước',
  material: 'Không đủ quân để chiếu hết',
  timeout: 'Hết giờ',
  timeout_vs_material: 'Hết giờ nhưng đối thủ không đủ quân chiếu hết',
  resign: 'Xin thua',
  agreement: 'Hai bên đồng ý hòa',
};

/** Kết quả theo luật trên bàn cờ (không tính đồng hồ/xin thua). null = ván còn tiếp. */
export function boardResult(g: Chess): GameResult | null {
  if (g.isCheckmate()) return { winner: g.turn() === 'w' ? 'b' : 'w', reason: 'checkmate' };
  if (g.isStalemate()) return { winner: null, reason: 'stalemate' };
  if (g.isInsufficientMaterial()) return { winner: null, reason: 'material' };
  if (g.isThreefoldRepetition()) return { winner: null, reason: 'repetition' };
  if (g.isDrawByFiftyMoves()) return { winner: null, reason: 'fifty' };
  return null;
}

/** Bên "color" còn đủ quân để có thể chiếu hết không (dùng khi đối thủ hết giờ — luật FIDE 6.9) */
export function canMate(g: Chess, color: Color): boolean {
  const mine = g.board().flat().filter((c) => c && c.color === color).map((c) => c!.type);
  if (mine.some((t) => t === 'p' || t === 'r' || t === 'q')) return true;
  const minors = mine.filter((t) => t === 'n' || t === 'b').length;
  return minors >= 2;
}

/** Kết quả khi một bên hết giờ */
export function timeoutResult(g: Chess, flagged: Color): GameResult {
  const other: Color = flagged === 'w' ? 'b' : 'w';
  return canMate(g, other) ? { winner: other, reason: 'timeout' } : { winner: null, reason: 'timeout_vs_material' };
}

const START: Record<PieceSymbol, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Quân mỗi bên đã ăn được + chênh lệch điểm quân (Tốt 1, Mã/Tượng 3, Xe 5, Hậu 9) */
export function captured(g: Chess): { w: PieceSymbol[]; b: PieceSymbol[]; diff: number } {
  const left: Record<Color, Record<PieceSymbol, number>> = { w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 } };
  for (const c of g.board().flat()) if (c) left[c.color][c.type]++;
  const lost = (col: Color) => {
    const out: PieceSymbol[] = [];
    for (const t of ['q', 'r', 'b', 'n', 'p'] as PieceSymbol[]) {
      // quân phong cấp: số quân lớn có thể vượt ban đầu (bỏ qua), tốt đã phong vẫn tính là mất
      const n = START[t] - left[col][t];
      for (let i = 0; i < n; i++) out.push(t);
    }
    return out;
  };
  const mat = (col: Color) => (Object.keys(left[col]) as PieceSymbol[]).reduce((s, t) => s + VALUE[t] * left[col][t], 0);
  // w = quân Trắng đã ăn (tức quân Đen bị mất)
  return { w: lost('b'), b: lost('w'), diff: mat('w') - mat('b') };
}

export function fmtClock(ms: number): string {
  const t = Math.max(0, ms);
  if (t < 10_000) return `${Math.floor(t / 1000)},${Math.floor((t % 1000) / 100)}`;
  const s = Math.ceil(t / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const SIDE_NAME: Record<Color, string> = { w: 'Trắng', b: 'Đen' };

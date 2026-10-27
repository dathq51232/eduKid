'use client';
// Mảnh giao diện dùng chung cho các trang cờ vua: tab chế độ, danh sách nước đi có hình quân.
import Link from 'next/link';
import type { Color, PieceSymbol } from 'chess.js';
import { PieceIcon } from './ChessPieces';

const FIG: Record<string, PieceSymbol> = { N: 'n', B: 'b', R: 'r', Q: 'q', K: 'k' };

/** Ký hiệu nước đi có hình quân thay cho chữ cái tiếng Anh (Nf3 → [Mã]f3) */
export function San({ san, color }: { san?: string; color: Color }) {
  if (!san) return <b />;
  const t = FIG[san[0]];
  const rest = (t ? san.slice(1) : san).replace(/=([NBRQ])/, '=');
  const promo = /=([NBRQ])/.exec(san)?.[1];
  return <b className="chs-san">{t && <PieceIcon type={t} color={color} size={18} />}{rest}{promo && <PieceIcon type={FIG[promo]} color={color} size={18} />}</b>;
}

export function MoveList({ sans }: { sans: string[] }) {
  const rows: [number, string, string?][] = [];
  for (let i = 0; i < sans.length; i += 2) rows.push([i / 2 + 1, sans[i], sans[i + 1]]);
  return (
    <div className="chs-moves" aria-label="Các nước đã đi">
      {rows.length === 0 ? <p className="dash-muted">Chưa có nước nào.</p> : (
        <ol>{rows.map(([n, a, b]) => <li key={n}><span>{n}.</span><San san={a} color="w" /><San san={b} color="b" /></li>)}</ol>
      )}
    </div>
  );
}

export type ChessTab = 'bot' | 'online' | 'cup';
export function ChessTabs({ active }: { active: ChessTab }) {
  return (
    <nav className="chs-tabs" aria-label="Chế độ chơi">
      {active === 'bot' ? <span aria-current="page">Chơi với máy</span> : <Link href="/co/vua">Chơi với máy</Link>}
      {active === 'online' ? <span aria-current="page">Đấu với bạn</span> : <Link href="/co/vua/ban">Đấu với bạn</Link>}
      <span className="is-soon">Giải đấu <em>sắp có</em></span>
    </nav>
  );
}

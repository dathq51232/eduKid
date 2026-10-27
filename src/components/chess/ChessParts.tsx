'use client';
// Mảnh giao diện dùng chung cho các trang cờ vua: tab chế độ, danh sách nước đi có hình quân.
import Link from 'next/link';
import { useEffect, useState } from 'react';
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
export function ChessTabs({ active, base = '/co/vua' }: { active: ChessTab; base?: string }) {
  return (
    <nav className="chs-tabs" aria-label="Chế độ chơi">
      {active === 'bot' ? <span aria-current="page">Chơi với máy</span> : <Link href={base}>Chơi với máy</Link>}
      {active === 'online' ? <span aria-current="page">Đấu với bạn</span> : <Link href={`${base}/ban`}>Đấu với bạn</Link>}
      <span className="is-soon">Giải đấu <em>sắp có</em></span>
    </nav>
  );
}

/**
 * Đồng hồ tự chạy: chỉ thành phần này vẽ lại theo nhịp, không kéo cả bàn cờ vẽ lại theo.
 * left = thời gian còn lại (ms) tại mốc since (Date.now() của máy này); running = đang trừ giờ.
 */
export function LiveClock({ left, since, running, fmt }: { left: number; since: number; running: boolean; fmt: (ms: number) => string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [running]);
  const ms = running ? left - (Date.now() - since) : left;
  return <span className={`chs-clock${running ? ' is-on' : ''}${ms < 20000 ? ' is-low' : ''}`}>{fmt(ms)}</span>;
}

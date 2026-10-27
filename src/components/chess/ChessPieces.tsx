// Bộ quân cờ vua vẽ riêng cho EduChain Kids (SVG, khung 45×45): nét tròn, đầy đặn, dễ nhận ra trên màn hình nhỏ.
import type { PieceSymbol, Color } from 'chess.js';

const BASE = 'M11.5 35.5h22a1.5 1.5 0 0 1 1.5 1.5v2.5h-25V37a1.5 1.5 0 0 1 1.5-1.5z';

export function PieceShape({ type, color }: { type: PieceSymbol; color: Color }) {
  const w = color === 'w';
  // Quân gỗ: Trắng = gỗ hoàng dương sáng, Đen = gỗ mun
  const fill = w ? '#f8ecd2' : '#3a291d';
  const stroke = w ? '#4a2e17' : '#120a05';
  const mark = w ? '#4a2e17' : '#e6cfa6';
  const common = { fill, stroke, strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  switch (type) {
    case 'p':
      return (
        <g {...common}>
          <circle cx="22.5" cy="12.5" r="5.5" />
          <path d="M18 19.5h9l-1.2 3.2c3.4 3 4.7 8 5.2 12.8H14c.5-4.8 1.8-9.8 5.2-12.8z" />
          <path d={BASE} />
        </g>
      );
    case 'r':
      return (
        <g {...common}>
          <path d="M12.5 8h4v3h3V8h6v3h3V8h4v6.5h-20z" />
          <path d="M15 14.5h15l-1 15H16z" />
          <path d="M13.5 29.5h18l1.5 6h-21z" />
          <path d={BASE} />
          <path d="M15 18h15M14.5 29.5h16" fill="none" stroke={mark} strokeWidth="1.1" opacity=".55" />
        </g>
      );
    case 'n':
      return (
        <g {...common}>
          <path d="M13.5 35.5c0-4.5 1.5-7.5 4-10.5 2-2.4 3.4-4.6 3.6-7.4-1.6 1.2-3.2 2.3-5.4 2.6-1.8.3-3.4-.6-3.6-2.3-.3-2 1.2-3.6 3-5.6 1.6-1.8 2.6-3.4 3.4-5.8l1.6 2.6c6.4.6 11.4 5.2 12.2 12.6.6 5.4-.6 10.4-1.8 14.3z" />
          <circle cx="20" cy="13.8" r="1.25" fill={mark} stroke="none" />
          <path d="M14.4 17.6l1.4-.6" fill="none" stroke={mark} strokeWidth="1.2" />
          <path d="M25.5 11c3 2 5.2 6 5 11" fill="none" stroke={mark} strokeWidth="1.1" opacity=".55" />
          <path d={BASE} />
        </g>
      );
    case 'b':
      return (
        <g {...common}>
          <circle cx="22.5" cy="7.8" r="2.4" />
          <path d="M22.5 10.5c-5.4 3.6-8.4 8.6-6.6 13.5 1 2.6 3.6 3.8 6.6 3.8s5.6-1.2 6.6-3.8c1.8-4.9-1.2-9.9-6.6-13.5z" />
          <path d="M24.6 14.6l-3.8 5.6" fill="none" stroke={mark} strokeWidth="1.4" />
          <path d="M16.5 27.8h12l-1 3.2h-10z" />
          <path d="M17.5 31h10l3 4.5h-16z" />
          <path d={BASE} />
        </g>
      );
    case 'q':
      return (
        <g {...common}>
          <path d="M11 14.5l3.8 14.5h15.4L34 14.5l-6 7.2-2.4-10.2-3.1 9.4-3.1-9.4-2.4 10.2z" />
          {[[11, 13.5], [16.6, 10.4], [22.5, 9], [28.4, 10.4], [34, 13.5]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.1" />)}
          <path d="M14.8 29h15.4l-.8 3H15.6z" />
          <path d="M15.6 32h13.8l1.6 3.5H14z" />
          <path d={BASE} />
        </g>
      );
    case 'k':
      return (
        <g {...common}>
          <path d="M22.5 4.5v7M19 7.6h7" fill="none" strokeWidth="2.2" />
          <path d="M22.5 12.2c-2.6 0-4 2.4-3 5-5.6-2.2-10.6 1.6-9 7 .9 2.9 3.6 5 4.4 5.6h15.2c.8-.6 3.5-2.7 4.4-5.6 1.6-5.4-3.4-9.2-9-7 1-2.6-.4-5-3-5z" />
          <path d="M14.9 29.8h15.2l-.8 2.6H15.7z" />
          <path d="M15.7 32.4h13.6l1.6 3.1H14.1z" />
          <path d="M19.5 17.2c1.4 1.4 2.4 3.2 3 5.6.6-2.4 1.6-4.2 3-5.6" fill="none" stroke={mark} strokeWidth="1.1" opacity=".6" />
          <path d={BASE} />
        </g>
      );
  }
}

export function PieceIcon({ type, color, size = 22, title }: { type: PieceSymbol; color: Color; size?: number; title?: string }) {
  return (
    <svg viewBox="0 0 45 45" width={size} height={size} aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <PieceShape type={type} color={color} />
    </svg>
  );
}

export const PIECE_NAME: Record<PieceSymbol, string> = { p: 'Tốt', n: 'Mã', b: 'Tượng', r: 'Xe', q: 'Hậu', k: 'Vua' };

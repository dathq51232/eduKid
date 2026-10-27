'use client';

// Bàn cờ tướng gỗ chạm (theo mẫu bàn gỗ truyền thống): 9 đường dọc × 10 đường ngang, sông "Sở hà – Hán giới", cung tướng,
// dấu chữ thập ở vị trí pháo/tốt, quân tròn bằng gỗ khắc tên quân bằng tiếng Việt (đỏ / đen).
// Thành phần này chỉ vẽ và báo điểm được chạm; luật cờ tướng nằm ở src/lib/xiangqi.
import { useId } from 'react';
import { WoodDefs, WoodFrame, WoodSurface } from '@/components/chess/Wood';

export type XqSide = 'r' | 'b';
export type XqKind = 'k' | 'a' | 'e' | 'h' | 'r' | 'c' | 'p';
export type XqPiece = { side: XqSide; kind: XqKind };
export type XqPoint = { f: number; r: number }; // f: 0–8 từ trái sang (nhìn từ bên Đỏ), r: 0–9 từ trên (bên Đen) xuống

export const XQ_VIET: Record<XqKind, string> = { k: 'Tướng', a: 'Sĩ', e: 'Tượng', h: 'Mã', r: 'Xe', c: 'Pháo', p: 'Tốt' };

export const C = 80; // khoảng cách giữa hai đường
const PAD = 66; // mặt gỗ quanh lưới
const T = 46; // bề dày khung
const W = 2 * T + 2 * PAD + 8 * C;
const H = 2 * T + 2 * PAD + 9 * C;
const GX = T + PAD, GY = T + PAD;
const INK = '#3a2210';

/** Quân cờ tướng gỗ (tâm 0,0; bán kính ~36), khắc tên quân tiếng Việt */
export function XqDisc({ p, piece, lifted = false }: { p: string; piece: XqPiece; lifted?: boolean }) {
  const red = piece.side === 'r';
  const ink = red ? '#b4231a' : '#2a1d14';
  const name = XQ_VIET[piece.kind];
  return (
    <g filter={`url(#${p}${lifted ? 'lift' : 'shadow'})`}>
      <circle cy="3.5" r="36" fill={`url(#${p}edge)`} />
      <circle r="35" fill={`url(#${p}disc)`} stroke="#9a6b3b" strokeWidth="1.5" />
      <circle r="35" fill="#000" filter={`url(#${p}grainV)`} opacity=".14" />
      <circle r="28.5" fill="none" stroke={ink} strokeWidth="2.2" opacity=".85" />
      <circle r="27" fill="none" stroke="#fff6e4" strokeWidth=".9" opacity=".6" />
      <text y={name.length > 3 ? 6.5 : 8.5} textAnchor="middle" fontSize={name.length > 4 ? 17 : name.length > 3 ? 19.5 : 24} fontWeight="800" fill={ink} fontFamily="var(--font-display), system-ui, sans-serif" letterSpacing="-.2">{name}</text>
    </g>
  );
}

type Props = {
  board: (XqPiece | null)[][]; // [r][f]
  orientation?: XqSide;
  selected?: XqPoint | null;
  targets?: (XqPoint & { capture?: boolean })[];
  lastMove?: { from: XqPoint; to: XqPoint } | null;
  check?: XqPoint | null;
  onPoint?: (pt: XqPoint) => void;
  label?: string;
};

export default function XiangqiBoard({ board, orientation = 'r', selected, targets = [], lastMove, check, onPoint, label }: Props) {
  const p = `xq${useId().replace(/:/g, '')}`;
  const flip = orientation === 'b';
  const X = (f: number) => GX + (flip ? 8 - f : f) * C;
  const Y = (r: number) => GY + (flip ? 9 - r : r) * C;

  const line = (x1: number, y1: number, x2: number, y2: number, k: string) => (
    <g key={k}>
      <line x1={x1 + 1.2} y1={y1 + 1.2} x2={x2 + 1.2} y2={y2 + 1.2} stroke="#efc993" strokeWidth="2" opacity=".55" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
  const lines: React.ReactNode[] = [];
  for (let r = 0; r <= 9; r++) lines.push(line(GX, GY + r * C, GX + 8 * C, GY + r * C, `h${r}`));
  for (let f = 0; f <= 8; f++) {
    if (f === 0 || f === 8) lines.push(line(GX + f * C, GY, GX + f * C, GY + 9 * C, `v${f}`));
    else { lines.push(line(GX + f * C, GY, GX + f * C, GY + 4 * C, `vt${f}`)); lines.push(line(GX + f * C, GY + 5 * C, GX + f * C, GY + 9 * C, `vb${f}`)); }
  }
  for (const [r0, r1] of [[0, 2], [7, 9]]) {
    lines.push(line(GX + 3 * C, GY + r0 * C, GX + 5 * C, GY + r1 * C, `d${r0}a`));
    lines.push(line(GX + 5 * C, GY + r0 * C, GX + 3 * C, GY + r1 * C, `d${r0}b`));
  }
  // Dấu chữ thập vị trí pháo, tốt
  const marks: [number, number][] = [[1, 2], [7, 2], [1, 7], [7, 7], ...[0, 2, 4, 6, 8].flatMap((f) => [[f, 3], [f, 6]] as [number, number][])];
  const markPaths = marks.map(([f, r]) => {
    const x = GX + f * C, y = GY + r * C, g = 7, l = 15;
    let d = '';
    for (const sx of [-1, 1]) {
      if ((f === 0 && sx === -1) || (f === 8 && sx === 1)) continue;
      for (const sy of [-1, 1]) d += `M${x + sx * (g + l)} ${y + sy * g}H${x + sx * g}V${y + sy * (g + l)}`;
    }
    return <path key={`m${f}${r}`} d={d} fill="none" stroke={INK} strokeWidth="2.2" />;
  });
  const river = (txt: string, cx: number) => (
    <g key={txt}>
      <text x={cx + 1.5} y={GY + 4.5 * C + 15} textAnchor="middle" className="xq-river is-hi">{txt}</text>
      <text x={cx} y={GY + 4.5 * C + 13.5} textAnchor="middle" className="xq-river">{txt}</text>
    </g>
  );
  const files = [...Array(9)].map((_, i) => i);

  const hit = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * W, sy = ((e.clientY - rect.top) / rect.height) * H;
    const fv = Math.round((sx - GX) / C), rv = Math.round((sy - GY) / C);
    if (fv < 0 || fv > 8 || rv < 0 || rv > 9) return;
    if (Math.hypot(sx - (GX + fv * C), sy - (GY + rv * C)) > C * 0.5) return;
    onPoint({ f: flip ? 8 - fv : fv, r: flip ? 9 - rv : rv });
  };

  return (
    <div className="xq-board">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label ?? 'Bàn cờ tướng'} onPointerDown={hit} style={{ touchAction: 'manipulation' }}>
        <WoodDefs p={p} />
        <WoodFrame p={p} w={W} h={H} t={T} />
        <WoodSurface p={p} x={T} y={T} w={W - 2 * T} h={H - 2 * T} />
        {/* viền đôi quanh lưới */}
        <rect x={GX - 9} y={GY - 9} width={8 * C + 18} height={9 * C + 18} fill="none" stroke={INK} strokeWidth="4" />
        {lines}
        {markPaths}
        {river('SỞ HÀ', GX + 2 * C)}{river('HÁN GIỚI', GX + 6 * C)}
        {/* số cột: Đen ở trên đếm 1→9 từ trái, Đỏ ở dưới đếm 1→9 từ phải (đúng quy ước ghi nước) */}
        {files.map((i) => (
          <g key={`n${i}`} className="xq-num">
            <text x={GX + i * C} y={T + 19} textAnchor="middle">{flip ? 9 - i : i + 1}</text>
            <text x={GX + i * C} y={H - T - 6} textAnchor="middle">{flip ? i + 1 : 9 - i}</text>
          </g>
        ))}
        {lastMove && [lastMove.from, lastMove.to].map((pt, i) => (
          <g key={`lm${i}`} transform={`translate(${X(pt.f)} ${Y(pt.r)})`} className="xq-last">
            {i === 0 ? <circle r="10" /> : <path d="M-40 -26v-14h14M26 -40h14v14M40 26v14h-14M-26 40h-14v-14" fill="none" />}
          </g>
        ))}
        {check && <circle cx={X(check.f)} cy={Y(check.r)} r="44" className="xq-check" />}
        {board.flatMap((row, r) => row.map((pc, f) => pc && (
          <g key={`${f}-${r}`} transform={`translate(${X(f)} ${Y(r)})`} className={selected && selected.f === f && selected.r === r ? 'xq-sel' : undefined}>
            <XqDisc p={p} piece={pc} lifted={Boolean(selected && selected.f === f && selected.r === r)} />
          </g>
        )))}
        {targets.map((t) => t.capture
          ? <circle key={`t${t.f}${t.r}`} cx={X(t.f)} cy={Y(t.r)} r="41" className="xq-tgt-cap" />
          : <circle key={`t${t.f}${t.r}`} cx={X(t.f)} cy={Y(t.r)} r="12" className="xq-tgt" />)}
      </svg>
    </div>
  );
}

/** Thế cờ ban đầu */
export function xqStart(): (XqPiece | null)[][] {
  const B: (XqPiece | null)[][] = [...Array(10)].map(() => Array(9).fill(null));
  const back: XqKind[] = ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'];
  back.forEach((k, f) => { B[0][f] = { side: 'b', kind: k }; B[9][f] = { side: 'r', kind: k }; });
  for (const f of [1, 7]) { B[2][f] = { side: 'b', kind: 'c' }; B[7][f] = { side: 'r', kind: 'c' }; }
  for (const f of [0, 2, 4, 6, 8]) { B[3][f] = { side: 'b', kind: 'p' }; B[6][f] = { side: 'r', kind: 'p' }; }
  return B;
}

/** Một quân cờ tướng đứng riêng (dùng làm hình minh họa) */
export function XqDiscIcon({ piece, size = 64 }: { piece: XqPiece; size?: number }) {
  const p = `xqi${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="-42 -42 84 90" width={size} height={size * 90 / 84} aria-hidden="true">
      <WoodDefs p={p} />
      <XqDisc p={p} piece={piece} />
    </svg>
  );
}

'use client';

// Bàn cờ vua: chạm-chạm hoặc kéo-thả, chấm gợi ý nước hợp lệ, tô nước vừa đi, vua bị chiếu đỏ, chọn quân phong cấp.
// Luật lấy từ chess.js; bàn chỉ hiển thị và báo nước người chơi chọn qua onMove.
import { memo, useId, useMemo, useRef, useState } from 'react';
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { PieceShape, PIECE_NAME } from './ChessPieces';
import { WoodDefs, WoodFrame } from './Wood';

export type BoardMove = { from: string; to: string; promotion?: string };
type Props = {
  fen: string;
  orientation: Color;
  movable: Color | null;
  lastMove?: { from: string; to: string } | null;
  hint?: { from: string; to: string } | null;
  onMove: (m: BoardMove) => void;
  label?: string;
};

const FILES = 'abcdefgh';
const S = 100;
const T = 44; // khung gỗ
const VB = 800 + 2 * T;

function ChessBoard({ fen, orientation, movable, lastMove, hint, onMove, label }: Props) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const board = game.board();
  const turn = game.turn();
  const canMove = movable !== null && movable === turn && !game.isGameOver();
  const [sel, setSel] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ sq: string; x: number; y: number } | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggedRef = useRef<string | null>(null);
  const [lastFen, setLastFen] = useState(fen);
  if (lastFen !== fen) { setLastFen(fen); setSel(null); setPromo(null); setDrag(null); }

  const targets = useMemo(() => {
    if (!sel || !canMove) return new Map<string, boolean>();
    return new Map(game.moves({ square: sel as Square, verbose: true }).map((m) => [m.to, Boolean(m.captured)]));
  }, [sel, canMove, game]);

  const pos = (sq: string) => {
    const f = FILES.indexOf(sq[0]); const r = Number(sq[1]);
    return orientation === 'w' ? { x: f * S, y: (8 - r) * S } : { x: (7 - f) * S, y: (r - 1) * S };
  };
  const sqAt = (clientX: number, clientY: number): string | null => {
    const el = svgRef.current; if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = Math.floor((((clientX - r.left) / r.width) * VB - T) / S); const rw = Math.floor((((clientY - r.top) / r.height) * VB - T) / S);
    if (c < 0 || c > 7 || rw < 0 || rw > 7) return null;
    return orientation === 'w' ? FILES[c] + (8 - rw) : FILES[7 - c] + (rw + 1);
  };
  const svgPoint = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * VB - T, y: ((clientY - r.top) / r.height) * VB - T };
  };
  const pieceAt = (sq: string) => game.get(sq as Square);

  const tryMove = (from: string, to: string) => {
    const legal = game.moves({ square: from as Square, verbose: true }).filter((m) => m.to === to);
    if (!legal.length) return false;
    if (legal.some((m) => m.promotion)) { setPromo({ from, to }); return true; }
    onMove({ from, to }); setSel(null); return true;
  };

  const down = (e: React.PointerEvent) => {
    if (promo || !canMove) return;
    const sq = sqAt(e.clientX, e.clientY); if (!sq) return;
    const p = pieceAt(sq);
    if (sel && sel !== sq && targets.has(sq)) { draggedRef.current = null; tryMove(sel, sq); return; }
    if (p && p.color === turn) {
      setSel(sq);
      const pt = svgPoint(e.clientX, e.clientY);
      setDrag({ sq, x: pt.x, y: pt.y });
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } else setSel(null);
  };
  const move = (e: React.PointerEvent) => { if (!drag) return; const pt = svgPoint(e.clientX, e.clientY); setDrag({ ...drag, x: pt.x, y: pt.y }); };
  const up = (e: React.PointerEvent) => {
    if (!drag) return;
    const to = sqAt(e.clientX, e.clientY);
    const from = drag.sq; setDrag(null);
    if (to && to !== from) { draggedRef.current = to; if (!tryMove(from, to)) draggedRef.current = null; }
  };
  const key = (e: React.KeyboardEvent) => { if (e.key === 'Escape') { setSel(null); setPromo(null); } };

  let checkSq: string | null = null;
  if (game.inCheck()) for (const row of board) for (const c of row) if (c && c.type === 'k' && c.color === turn) checkSq = c.square;

  const animTo = lastMove && draggedRef.current !== lastMove.to ? lastMove : null;

  return (
    <div className="chs-board" onKeyDown={key}>
      <ChessBackdrop orientation={orientation} />
      <svg ref={svgRef} className="chs-fg" viewBox={`0 0 ${VB} ${VB}`} role="img" aria-label={label ?? 'Bàn cờ vua'} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)} style={{ touchAction: 'none' }}>
        <g transform={`translate(${T} ${T})`}>
        {lastMove && [lastMove.from, lastMove.to].map((s) => { const p = pos(s); return <rect key={`l${s}`} x={p.x} y={p.y} width={S} height={S} className="chs-last" />; })}
        {hint && (() => { const p = pos(hint.from); return <rect x={p.x} y={p.y} width={S} height={S} className="chs-hint" />; })()}
        {sel && (() => { const p = pos(sel); return <rect x={p.x} y={p.y} width={S} height={S} className="chs-sel" />; })()}
        {checkSq && (() => { const p = pos(checkSq); return <circle cx={p.x + 50} cy={p.y + 50} r="48" className="chs-check" />; })()}
        {board.flat().map((c) => {
          if (!c) return null;
          const p = pos(c.square);
          const dragging = drag?.sq === c.square;
          const anim = animTo && animTo.to === c.square ? (() => { const f = pos(animTo.from); return { dx: f.x - p.x, dy: f.y - p.y }; })() : null;
          return (
            <g key={`${c.square}${anim ? `-${fen}` : ''}`} className={`chs-piece${dragging ? ' is-ghost' : ''}${anim ? ' is-moved' : ''}`} style={anim ? ({ '--dx': `${anim.dx}px`, '--dy': `${anim.dy}px` } as React.CSSProperties) : undefined}>
              <g transform={`translate(${p.x + 5} ${p.y + 5}) scale(${90 / 45})`}><ellipse cx="22.5" cy="39.6" rx="12.5" ry="2.8" fill="#2a1607" opacity=".3" /><PieceShape type={c.type} color={c.color} /></g>
            </g>
          );
        })}
        {[...targets].map(([s, cap]) => { const p = pos(s); return cap ? <circle key={`t${s}`} cx={p.x + 50} cy={p.y + 50} r="44" className="chs-tgt-cap" /> : <circle key={`t${s}`} cx={p.x + 50} cy={p.y + 50} r="15" className="chs-tgt" />; })}
        {hint && (() => {
          // Mũi tên gợi ý từ quân cần đi tới ô đích
          const a = pos(hint.from), b = pos(hint.to);
          const x1 = a.x + 50, y1 = a.y + 50, x2 = b.x + 50, y2 = b.y + 50;
          const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
          const ex = x2 - ux * 30, ey = y2 - uy * 30;
          return <g aria-hidden="true">
            <line x1={x1 + ux * 22} y1={y1 + uy * 22} x2={ex} y2={ey} className="chs-arrow" />
            <polygon points={`${x2 - ux * 6},${y2 - uy * 6} ${ex - uy * 24 - ux * 6},${ey + ux * 24 - uy * 6} ${ex + uy * 24 - ux * 6},${ey - ux * 24 - uy * 6}`} className="chs-arrow-head" />
          </g>;
        })()}
        {drag && (() => { const c = pieceAt(drag.sq); if (!c) return null; return <g className="chs-drag" transform={`translate(${drag.x - 55} ${drag.y - 60}) scale(${110 / 45})`}><PieceShape type={c.type} color={c.color} /></g>; })()}
        </g>
      </svg>
      {promo && (
        <div className="chs-promo" role="dialog" aria-label="Chọn quân phong cấp">
          <p>Tốt được phong thành quân nào?</p>
          <div>
            {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((t) => (
              <button key={t} type="button" onClick={() => { onMove({ ...promo, promotion: t }); setPromo(null); setSel(null); }} aria-label={PIECE_NAME[t]}>
                <svg viewBox="0 0 45 45" width="56" height="56" aria-hidden="true"><PieceShape type={t} color={turn} /></svg>
                <span>{PIECE_NAME[t]}</span>
              </button>
            ))}
          </div>
          <button type="button" className="ct-link" onClick={() => setPromo(null)}>Thôi</button>
        </div>
      )}
    </div>
  );
}

// Lớp nền tĩnh (khung chạm, ô gỗ có vân, toạ độ): chỉ vẽ lại khi lật bàn. Quân cờ ở lớp trên, không dùng bộ lọc SVG.
const ChessBackdrop = memo(function ChessBackdrop({ orientation }: { orientation: Color }) {
  const wp = `cb${useId().replace(/:/g, '')}`;
  const files = orientation === 'w' ? FILES : [...FILES].reverse().join('');
  return (
    <svg className="chs-bg" viewBox={`0 0 ${VB} ${VB}`} aria-hidden="true">
      <WoodDefs p={wp} />
      <WoodFrame p={wp} w={VB} h={VB} t={T} />
      <g transform={`translate(${T} ${T})`}>
        {Array.from({ length: 64 }, (_, i) => {
          const x = (i % 8) * S, y = Math.floor(i / 8) * S; const dark = ((i % 8) + Math.floor(i / 8)) % 2 === 1;
          return <rect key={i} x={x} y={y} width={S} height={S} className={dark ? 'chs-dk' : 'chs-lt'} />;
        })}
        <rect width="800" height="800" fill="#000" filter={`url(#${wp}grain)`} opacity=".42" />
        {[...Array(8)].map((_, i) => (
          <g key={`c${i}`} className="chs-coord">
            <text x={i * S + 50} y={800 + 31} textAnchor="middle">{files[i]}</text>
            <text x={-22} y={i * S + 57} textAnchor="middle">{orientation === 'w' ? 8 - i : i + 1}</text>
          </g>
        ))}
      </g>
    </svg>
  );
});

export default memo(ChessBoard);

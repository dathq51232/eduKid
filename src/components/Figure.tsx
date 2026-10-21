// Vẽ hình minh hoạ cho câu hỏi (src/lib/figures.ts). Toàn bộ là SVG/HTML, không tải ảnh ngoài.

import type { BlockName, Figure as FigureData, ShapeName } from '@/lib/figures';

const INK = '#1f2a44';

function ShapePath({ shape, x, y, w, h, color }: { shape: ShapeName; x: number; y: number; w: number; h: number; color: string }) {
  const common = { fill: color, stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2;
    return <circle cx={x + w / 2} cy={y + h / 2} r={r - 1.5} {...common} />;
  }
  if (shape === 'triangle') return <polygon points={`${x + w / 2},${y + 1.5} ${x + w - 1.5},${y + h - 1.5} ${x + 1.5},${y + h - 1.5}`} {...common} />;
  return <rect x={x + 1.5} y={y + 1.5} width={w - 3} height={h - 3} rx={2} {...common} />;
}

/** Một hình phẳng đứng riêng (dùng cho hàng hình, lưới quy luật, lựa chọn là hình). */
export function ShapeIcon({ shape, color = '#cfe0ff', size = 56 }: { shape: ShapeName; color?: string; size?: number }) {
  const w = shape === 'rectangle' ? size * 1.45 : size;
  const h = shape === 'rectangle' ? size * 0.8 : size;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="fig-shape">
      <ShapePath shape={shape} x={0} y={0} w={w} h={h} color={color} />
    </svg>
  );
}

// Khối lập phương / hộp chữ nhật vẽ kiểu phối cảnh: mặt trước + mặt trên + mặt bên
function blockFaces(x: number, y: number, w: number, h: number, d: number) {
  const front = `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`;
  const top = `${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`;
  const side = `${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`;
  return { front, top, side };
}

function Block({ kind, x, y, unit, color }: { kind: BlockName; x: number; y: number; unit: number; color: string }) {
  const w = kind === 'cube' ? unit : unit * 1.9;
  const h = kind === 'cube' ? unit : unit * 0.95;
  const d = unit * 0.38;
  const f = blockFaces(x, y + d, w, h, d);
  const st = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round' as const };
  return (
    <g>
      <polygon points={f.side} fill={shade(color, -0.22)} {...st} />
      <polygon points={f.top} fill={shade(color, 0.25)} {...st} />
      <polygon points={f.front} fill={color} {...st} />
    </g>
  );
}

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amount >= 0 ? v + (255 - v) * amount : v * (1 + amount))));
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function Figure({ figure, compact = false }: { figure: FigureData; compact?: boolean }) {
  const cls = `figure is-${figure.kind}${compact ? ' is-compact' : ''}`;

  switch (figure.kind) {
    case 'objects':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          {figure.groups.map((g, gi) => (
            <div key={gi} className="fig-row">
              {Array.from({ length: g.count }, (_, i) => (
                <span key={i} className="fig-emoji" aria-hidden="true">{g.icon}</span>
              ))}
            </div>
          ))}
        </div>
      );

    case 'compare': {
      const cols = Math.max(...figure.rows.map((r) => r.count), 1);
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          {figure.rows.map((r, ri) => (
            <div key={ri} className="fig-compare-row" style={{ gridTemplateColumns: `repeat(${cols}, 44px)` }}>
              {Array.from({ length: r.count }, (_, i) => (
                <span key={i} className="fig-emoji" aria-hidden="true">{r.icon}</span>
              ))}
            </div>
          ))}
        </div>
      );
    }

    case 'shapes':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <div className="fig-row">
            {figure.items.map((it, i) => <ShapeIcon key={i} shape={it.shape} color={it.color} size={compact ? 44 : 52} />)}
          </div>
        </div>
      );

    case 'scene':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <svg viewBox={`0 0 ${figure.w} ${figure.h}`} className="fig-svg" aria-hidden="true">
            {figure.parts.map((p, i) => <ShapePath key={i} {...p} />)}
          </svg>
        </div>
      );

    case 'lines':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <svg viewBox={figure.labels?.length ? `-26 -30 ${figure.w + 52} ${figure.h + 60}` : `-14 -14 ${figure.w + 28} ${figure.h + 28}`} className="fig-svg is-lines" aria-hidden="true">
            {figure.segs.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={2.4} strokeLinecap="round" />)}
            {figure.labels?.map((p, i) => (
              <g key={`l${i}`}>
                <circle cx={p.x} cy={p.y} r={3.2} fill={INK} />
                <text x={p.x + (p.dx ?? 0)} y={p.y + (p.dy ?? -8)} fontSize={15} fontWeight={700} textAnchor="middle" fill="#c62828">{p.t}</text>
              </g>
            ))}
          </svg>
        </div>
      );
    case 'sticks':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <svg viewBox={`-8 -8 ${figure.w + 16} ${figure.h + 16}`} className="fig-svg is-sticks" aria-hidden="true">
            {figure.segs.map(([x1, y1, x2, y2], i) => {
              // Que tính: thân que + đầu que tròn ở một đầu
              const len = Math.hypot(x2 - x1, y2 - y1);
              const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
              const a = [x1 + ux * 5, y1 + uy * 5], b = [x2 - ux * 5, y2 - uy * 5];
              return (
                <g key={i}>
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={figure.color} strokeWidth={7} strokeLinecap="round" />
                  <circle cx={b[0]} cy={b[1]} r={4.2} fill="#9c2a22" />
                </g>
              );
            })}
          </svg>
        </div>
      );

    case 'pattern':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <div className="fig-pattern" style={{ gridTemplateColumns: `repeat(${figure.cols}, minmax(0, 64px))`, width: `min(100%, ${figure.cols * 70}px)` }}>
            {figure.cells.map((c, i) => (
              <span key={i} className={`fig-cell${c === '?' ? ' is-ask' : ''}`}>
                {c === '?' ? '?' : <ShapeIcon shape={c} color="#ffffff" size={46} />}
              </span>
            ))}
          </div>
        </div>
      );

    case 'sequence':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <div className="fig-sequence">
            {figure.cells.map((c, i) => (
              <span key={i} className={`fig-box${c === '?' || c === '…' ? ' is-ask' : ''}`}>{c}</span>
            ))}
          </div>
        </div>
      );

    case 'bond': {
      const node = (x: number, y: number, t: string) => (
        <g>
          <circle cx={x} cy={y} r={26} fill={t === '?' ? '#fff3d1' : '#fff'} stroke={INK} strokeWidth={2.5} />
          <text x={x} y={y + 9} textAnchor="middle" className="fig-bond-text">{t}</text>
        </g>
      );
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <svg viewBox="0 0 220 150" className="fig-svg is-bond" aria-hidden="true">
            <line x1={110} y1={36} x2={52} y2={112} stroke={INK} strokeWidth={2.5} />
            <line x1={110} y1={36} x2={168} y2={112} stroke={INK} strokeWidth={2.5} />
            {node(110, 32, figure.whole)}
            {node(50, 116, figure.parts[0])}
            {node(170, 116, figure.parts[1])}
          </svg>
        </div>
      );
    }

    case 'blocks': {
      const unit = 40;
      const d = unit * 0.38;
      if (figure.stacks) {
        const cols = figure.stacks.length;
        const maxH = Math.max(...figure.stacks, 1);
        const W = cols * unit + d + 8;
        const H = maxH * unit + d + 8;
        return (
          <div className={cls} role="img" aria-label={figure.alt}>
            <svg viewBox={`-4 -4 ${W} ${H}`} width={W} height={H} className="fig-svg is-blocks" aria-hidden="true">
              {figure.stacks.map((n, c) =>
                Array.from({ length: n }, (_, r) => (
                  <Block key={`${c}-${r}`} kind="cube" x={c * unit} y={(maxH - 1 - r) * unit} unit={unit} color={c % 2 ? '#f7c948' : '#7fb3ff'} />
                )),
              )}
            </svg>
          </div>
        );
      }
      const items = figure.items ?? [];
      // Xếp tối đa 4 khối mỗi hàng để khối đủ to trên điện thoại
      const perRow = 4;
      const rowsOf: BlockName[][] = [];
      for (let i = 0; i < items.length; i += perRow) rowsOf.push(items.slice(i, i + perRow));
      const wOf = (k: BlockName) => (k === 'cube' ? unit : unit * 1.9) + d + 14;
      const W = Math.max(...rowsOf.map((row) => row.reduce((s, k) => s + wOf(k), 0)), 1);
      const rowH = unit + d + 14;
      const H = rowsOf.length * rowH;
      const colors = ['#7fb3ff', '#f7c948', '#7ed3a8', '#ff9f8f', '#c7a6ff'];
      let n = 0;
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <svg viewBox={`-4 -4 ${W + 8} ${H + 8}`} width={W + 8} height={H + 8} className="fig-svg is-blocks" aria-hidden="true">
            {rowsOf.map((row, ri) => {
              let x = 0;
              return row.map((k) => {
                const i = n++;
                const el = <Block key={i} kind={k} x={x} y={ri * rowH + (k === 'cube' ? 0 : unit * 0.05)} unit={unit} color={colors[i % colors.length]} />;
                x += wOf(k);
                return el;
              });
            })}
          </svg>
        </div>
      );
    }

    case 'grid':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <div className="fig-grid" style={{ gridTemplateColumns: `repeat(${figure.cols}, minmax(0, 64px))`, width: `min(100%, ${figure.cols * 70 + 12}px)` }}>
            {figure.cells.map((c, i) => (
              <span key={i} className="fig-grid-cell">{c ? <span aria-hidden="true">{c}</span> : null}</span>
            ))}
          </div>
        </div>
      );

    case 'tens': {
      // Mỗi bó 10 que buộc dây ở giữa; que lẻ đứng riêng bên phải
      const bundleW = 34, gap = 14, stickW = 12;
      const W = figure.tens * (bundleW + gap) + (figure.ones ? gap + figure.ones * stickW : 0) + 8;
      const H = 120;
      const stick = (x: number, key: string) => (
        <g key={key}>
          <rect x={x} y={8} width={6} height={100} rx={3} fill="#f2c14e" stroke="#a0703c" strokeWidth={1.2} />
          <circle cx={x + 3} cy={10} r={3.4} fill="#9c2a22" />
        </g>
      );
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <svg viewBox={`-4 0 ${W} ${H}`} className="fig-svg is-tens" style={{ width: `min(${Math.max(W, 120)}px, 86vw)` }} aria-hidden="true">
            {Array.from({ length: figure.tens }, (_, b) => {
              const x0 = b * (bundleW + gap);
              return (
                <g key={`b${b}`}>
                  {Array.from({ length: 5 }, (_, i) => stick(x0 + i * 7, `b${b}-${i}`))}
                  <rect x={x0 - 2} y={52} width={bundleW + 2} height={9} rx={3} fill="#e2483d" stroke={INK} strokeWidth={1.5} />
                </g>
              );
            })}
            {Array.from({ length: figure.ones }, (_, i) => stick(figure.tens * (bundleW + gap) + gap + i * stickW, `o${i}`))}
          </svg>
        </div>
      );
    }

    case 'clock': {
      const mi = figure.minute ?? 0;
      const h = ((figure.hour % 12) + 12) % 12 + mi / 60; // kim giờ nhích dần theo số phút (lớp 2: giờ rưỡi, giờ kém…)
      const ang = (h * 30 * Math.PI) / 180;
      const hx = 60 + Math.sin(ang) * 26, hy = 60 - Math.cos(ang) * 26;
      const mAng = (mi * 6 * Math.PI) / 180;
      const mx = 60 + Math.sin(mAng) * 43, my = 60 - Math.cos(mAng) * 43;
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <svg viewBox="0 0 120 120" className="fig-svg is-clock" aria-hidden="true">
            <circle cx={60} cy={60} r={55} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={60} cy={60} r={49} fill="none" stroke="#e2483d" strokeWidth={2} />
            {Array.from({ length: 12 }, (_, i) => {
              const a = ((i + 1) * 30 * Math.PI) / 180;
              return (
                <text key={i} x={60 + Math.sin(a) * 39} y={60 - Math.cos(a) * 39 + 5} textAnchor="middle" className="fig-clock-num">{i + 1}</text>
              );
            })}
            <line x1={60} y1={60} x2={hx} y2={hy} stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <line x1={60} y1={60} x2={mx} y2={my} stroke="#2557c9" strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={60} cy={60} r={4.5} fill={INK} />
          </svg>
        </div>
      );
    }

    case 'ruler': {
      // Mỗi băng có tên ở phía trên, đặt thẳng từ vạch 0; thước chia xăng-ti-mét ở dưới cùng
      const unit = 24; // 1 cm trên hình
      const rowH = 50;
      const left = 14;
      const W = left + figure.max * unit + 44;
      const H = figure.items.length * rowH + (figure.ruler ? 50 : 6);
      const x0 = left;
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <svg viewBox={`0 0 ${W} ${H}`} className="fig-svg is-ruler" style={{ width: `min(${W}px, 86vw)` }} aria-hidden="true">
            {figure.ruler && <line x1={x0} y1={0} x2={x0} y2={H - 44} stroke="#9aa9c2" strokeWidth={1.5} strokeDasharray="4 3" />}
            {figure.items.map((it, i) => (
              <g key={i}>
                <text x={x0} y={i * rowH + 17} className="fig-ruler-label">{it.label}</text>
                <rect x={x0} y={i * rowH + 22} width={it.length * unit} height={24} rx={6} fill={it.color} stroke={INK} strokeWidth={2} />
              </g>
            ))}
            {figure.ruler && (
              <g transform={`translate(0 ${figure.items.length * rowH + 6})`}>
                <rect x={x0 - 8} y={0} width={figure.max * unit + 40} height={40} rx={4} fill="#ffd7e4" stroke={INK} strokeWidth={1.5} />
                {Array.from({ length: figure.max + 1 }, (_, k) => (
                  <g key={k}>
                    <line x1={x0 + k * unit} y1={0} x2={x0 + k * unit} y2={k % 5 === 0 ? 16 : 11} stroke={INK} strokeWidth={1.5} />
                    <text x={x0 + k * unit} y={33} textAnchor="middle" className="fig-ruler-num">{k}</text>
                  </g>
                ))}
                <text x={x0 + figure.max * unit + 24} y={33} textAnchor="middle" className="fig-ruler-num">cm</text>
              </g>
            )}
          </svg>
        </div>
      );
    }

    case 'calendar':
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <div className="fig-calendar">
            <span className="fig-cal-month">Tháng {figure.month}</span>
            <span className="fig-cal-day">{figure.day}</span>
            <span className="fig-cal-weekday">{figure.weekday}</span>
          </div>
        </div>
      );

    case 'column': {
      const cell = (t: string) => <span className={`fig-col-cell${t === '?' ? ' is-ask' : ''}`}>{t}</span>;
      const digits = (s: string) => s.padStart(2, ' ').split('').map((d) => (d === ' ' ? '' : d));
      return (
        <div className={cls} role="img" aria-label={figure.alt}>
          <div className="fig-column">
            <span className="fig-col-op">{figure.op}</span>
            <div className="fig-col-rows">
              <div className="fig-col-row">{digits(figure.a).map((d, i) => <span key={i}>{cell(d)}</span>)}</div>
              <div className="fig-col-row">{digits(figure.b).map((d, i) => <span key={i}>{cell(d)}</span>)}</div>
              <div className="fig-col-row is-result">{digits(figure.result).map((d, i) => <span key={i}>{cell(d)}</span>)}</div>
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

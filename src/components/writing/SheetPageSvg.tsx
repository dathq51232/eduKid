'use client';

// Vẽ một trang vở A4 (SVG, đơn vị mm): giấy ô li, lề đỏ, tiêu đề + họ tên, chữ mẫu / chữ tô, hoạ tiết góc, viền trang.
// Cùng một SVG dùng để xem trước trên màn hình và để in (trình duyệt in đúng 210 x 297 mm).
import { Fragment } from 'react';
import { FloralScope, Floral } from './floral';
import { FALLBACK_FONT, fallbackScale, fontFamily, textSegments, type Corner, type FontId, type SheetLayout, type SheetPage, type SheetSettings } from '@/lib/writing/sheet';

export const MOTIFS: { id: string; label: string }[] = [
  { id: 'hoa', label: 'Chùm hoa' }, { id: 'la', label: 'Cành lá' }, { id: 'sao', label: 'Ngôi sao' }, { id: 'buom', label: 'Bướm' },
  { id: 'may', label: 'Mây cầu vồng' }, { id: 'mat-troi', label: 'Mặt trời' }, { id: 'but', label: 'Bút chì' }, { id: 'tim', label: 'Trái tim' },
  { id: 'nhac', label: 'Nốt nhạc' }, { id: 'bong', label: 'Bóng bay' }, { id: 'sen', label: 'Hoa sen' }, { id: 'tre', label: 'Lá tre' },
];

/** Pha màu với trắng (0..1) để có màu nhạt cho hoạ tiết */
function tint(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const m = (v: number) => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0');
  return `#${m(r)}${m(g)}${m(b)}`;
}

/** Hoạ tiết trong ô 100 x 100, dáng cho góc trên-trái (góc khác lật gương) */
export function Motif({ id, color }: { id: string; color: string }) {
  const c1 = color, c2 = tint(color, 0.45), c3 = tint(color, 0.75);
  const leaf = '#4ade80', leafD = '#16a34a';
  switch (id) {
    case 'hoa': {
      const flower = (cx: number, cy: number, r: number, fill: string) => (
        <g>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={cx} cy={cy - r * 0.9} rx={r * 0.62} ry={r * 0.95} fill={fill} transform={`rotate(${a} ${cx} ${cy})`} />)}
          <circle cx={cx} cy={cy} r={r * 0.5} fill="#facc15" />
        </g>
      );
      return (<g>
        <path d="M2 60 Q30 40 48 12" stroke={leafD} strokeWidth="2" fill="none" />
        <ellipse cx="24" cy="44" rx="9" ry="4" fill={leaf} transform="rotate(-40 24 44)" />
        <ellipse cx="40" cy="30" rx="8" ry="3.5" fill={leaf} transform="rotate(30 40 30)" />
        {flower(22, 20, 13, c1)}{flower(52, 12, 8, c2)}{flower(10, 50, 7, c2)}
        <circle cx="64" cy="26" r="2.5" fill={c3} /><circle cx="36" cy="54" r="2" fill={c3} />
      </g>);
    }
    case 'la':
      return (<g>
        <path d="M0 6 Q40 10 70 44 M0 6 Q12 40 44 70" stroke={leafD} strokeWidth="2" fill="none" />
        {[[22, 10, -20], [40, 20, 10], [56, 32, 40], [10, 24, 70], [18, 42, 100], [30, 56, 120]].map(([x, y, a], i) => (
          <path key={i} d="M0 0 Q8 -9 18 0 Q8 9 0 0Z" fill={i % 2 ? leaf : c2} stroke={leafD} strokeWidth="0.8" transform={`translate(${x} ${y}) rotate(${a})`} />
        ))}
        <circle cx="64" cy="48" r="4" fill={c1} /><circle cx="46" cy="64" r="3" fill={c1} />
      </g>);
    case 'sao': {
      const star = (x: number, y: number, r: number, f: string) => {
        const p = Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`; }).join(' ');
        return <polygon points={p} fill={f} stroke={c1} strokeWidth="0.8" strokeLinejoin="round" />;
      };
      return <g>{star(20, 20, 16, '#facc15')}{star(50, 14, 9, c2)}{star(14, 50, 9, c2)}{star(42, 40, 6, c3)}{star(66, 30, 4, '#facc15')}{star(28, 66, 4, '#facc15')}</g>;
    }
    case 'buom':
      return (<g transform="translate(34 34) rotate(-30)">
        <ellipse cx="-12" cy="-8" rx="13" ry="10" fill={c1} /><ellipse cx="12" cy="-8" rx="13" ry="10" fill={c1} />
        <ellipse cx="-9" cy="9" rx="9" ry="7" fill={c2} /><ellipse cx="9" cy="9" rx="9" ry="7" fill={c2} />
        <circle cx="-12" cy="-8" r="4" fill={c3} /><circle cx="12" cy="-8" r="4" fill={c3} />
        <rect x="-2" y="-14" width="4" height="28" rx="2" fill="#334155" />
        <path d="M-1 -14 Q-6 -24 -10 -26 M1 -14 Q6 -24 10 -26" stroke="#334155" strokeWidth="1.2" fill="none" />
      </g>);
    case 'may':
      return (<g>
        {['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#a855f7'].map((col, i) => (
          <path key={col} d={`M${4 + i * 4} 70 A${52 - i * 4} ${52 - i * 4} 0 0 1 ${56 - i * 0} ${18 + i * 4}`} stroke={col} strokeWidth="3.4" fill="none" opacity=".85" />
        ))}
        <g fill="#fff" stroke={c2} strokeWidth="1.2">
          <path d="M8 26 a9 9 0 0 1 14 -8 a11 11 0 0 1 20 4 a8 8 0 0 1 2 15 h-34 a7 7 0 0 1 -2 -11z" />
        </g>
      </g>);
    case 'mat-troi':
      return (<g>
        <g transform="translate(8 8)">
          {Array.from({ length: 12 }, (_, i) => <line key={i} x1="26" y1="26" x2={26 + 26 * Math.cos((i * Math.PI) / 6)} y2={26 + 26 * Math.sin((i * Math.PI) / 6)} stroke="#f59e0b" strokeWidth="2.6" strokeLinecap="round" />)}
          <circle cx="26" cy="26" r="16" fill="#facc15" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="20" cy="23" r="1.8" fill="#7c2d12" /><circle cx="32" cy="23" r="1.8" fill="#7c2d12" />
          <path d="M19 30 Q26 36 33 30" stroke="#7c2d12" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="16" cy="29" r="2.5" fill={c2} /><circle cx="36" cy="29" r="2.5" fill={c2} />
        </g>
      </g>);
    case 'but':
      return (<g transform="translate(8 60) rotate(-45)">
        <rect x="0" y="-6" width="52" height="12" fill={c1} /><rect x="0" y="-6" width="52" height="4" fill={c2} />
        <rect x="-8" y="-6" width="8" height="12" fill="#fda4af" /><rect x="-2" y="-6" width="3" height="12" fill="#94a3b8" />
        <path d="M52 -6 L66 0 L52 6Z" fill="#fde68a" /><path d="M61 -2 L66 0 L61 2Z" fill="#334155" />
        <path d="M14 14 q6 6 12 0 t12 0 t12 0" stroke={c2} strokeWidth="1.5" fill="none" />
      </g>);
    case 'tim': {
      const heart = (x: number, y: number, s: number, f: string) => <path d="M0 3 C0 -2 6 -3 7 1 C8 -3 14 -2 14 3 C14 8 7 12 7 13 C7 12 0 8 0 3Z" fill={f} transform={`translate(${x} ${y}) scale(${s})`} />;
      return <g>{heart(4, 6, 2.2, c1)}{heart(40, 6, 1.2, c2)}{heart(8, 42, 1.2, c2)}{heart(36, 32, 0.8, c3)}{heart(56, 20, 0.6, c1)}</g>;
    }
    case 'nhac':
      return (<g fill={c1}>
        <ellipse cx="14" cy="48" rx="7" ry="5" transform="rotate(-20 14 48)" /><rect x="19" y="12" width="2.4" height="36" />
        <ellipse cx="40" cy="40" rx="7" ry="5" transform="rotate(-20 40 40)" /><rect x="45" y="6" width="2.4" height="34" />
        <path d="M19 12 L47.4 6 L47.4 14 L21.4 20Z" />
        <ellipse cx="62" cy="22" rx="4.5" ry="3.4" fill={c2} transform="rotate(-20 62 22)" /><rect x="65.5" y="2" width="1.8" height="20" fill={c2} />
      </g>);
    case 'bong':
      return (<g>
        {[[18, 22, c1], [40, 14, c2], [30, 40, '#facc15']].map(([x, y, f], i) => (
          <g key={i}>
            <path d={`M${x} ${Number(y) + 13} q-3 12 4 22`} stroke="#64748b" strokeWidth="0.8" fill="none" />
            <ellipse cx={x} cy={y} rx="10" ry="13" fill={String(f)} /><ellipse cx={Number(x) - 3} cy={Number(y) - 5} rx="2.5" ry="4" fill="#fff" opacity=".6" />
          </g>
        ))}
      </g>);
    case 'sen':
      return (<g>
        <ellipse cx="30" cy="54" rx="26" ry="8" fill={leaf} stroke={leafD} strokeWidth="1" />
        <path d="M30 50 C14 46 12 26 22 16 C26 30 30 38 30 50Z" fill={c2} stroke={c1} strokeWidth="1" />
        <path d="M30 50 C46 46 48 26 38 16 C34 30 30 38 30 50Z" fill={c2} stroke={c1} strokeWidth="1" />
        <path d="M30 50 C22 38 24 18 30 8 C36 18 38 38 30 50Z" fill={c3} stroke={c1} strokeWidth="1" />
      </g>);
    case 'tre':
      return (<g>
        <path d="M4 4 L64 64" stroke={leafD} strokeWidth="1.6" />
        {[[14, 14, -50], [26, 26, 40], [38, 38, -50], [50, 50, 40], [20, 20, 140], [44, 44, 140]].map(([x, y, a], i) => (
          <path key={i} d="M0 0 Q14 -5 28 0 Q14 5 0 0Z" fill={i % 2 ? leaf : '#86efac'} stroke={leafD} strokeWidth="0.7" transform={`translate(${x} ${y}) rotate(${a})`} />
        ))}
      </g>);
    default:
      return null;
  }
}

// Góc phải: lật gương ngang. Góc dưới: chỉ lật dọc với hoạ tiết dây leo (hoa, lá, tre); hình có chiều đứng (mặt trời, bóng bay...) giữ nguyên.
const VINE = new Set(['hoa', 'la', 'tre', 'may']);
const flipOf = (corner: Corner, id: string, s: number) => {
  const h = corner === 'tr' || corner === 'br';
  const v = (corner === 'bl' || corner === 'br') && VINE.has(id);
  return `translate(${h ? s : 0} ${v ? s : 0}) scale(${h ? -1 : 1} ${v ? -1 : 1})`;
};

function CornerDeco({ corner, value, size, color, W, H }: { corner: Corner; value: string; size: number; color: string; W: number; H: number }) {
  if (!value || value === 'none') return null;
  const m = 5; // cách mép giấy
  const x = corner === 'tl' || corner === 'bl' ? m : W - m - size;
  const y = corner === 'tl' || corner === 'tr' ? m : H - m - size;
  if (value.startsWith('f:')) {
    // hoa văn bo góc: lật gương theo cả hai chiều để cành hoa luôn ôm mép giấy
    const h = corner === 'tr' || corner === 'br', v = corner === 'bl' || corner === 'br';
    return (
      <g transform={`translate(${x} ${y})`}>
        <g transform={`translate(${h ? size : 0} ${v ? size : 0}) scale(${(h ? -1 : 1) * size / 100} ${(v ? -1 : 1) * size / 100})`}><Floral id={value.slice(2)} /></g>
      </g>
    );
  }
  if (value.startsWith('s:')) {
    return <image href={`/stickers/hd/${value.slice(2)}.webp`} x={x} y={y} width={size} height={size} preserveAspectRatio="xMidYMid meet" />;
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={flipOf(corner, value.slice(2), size)}>
        <g transform={`scale(${size / 72})`}><Motif id={value.slice(2)} color={color} /></g>
      </g>
    </g>
  );
}

function Border({ s, W, H }: { s: SheetSettings; W: number; H: number }) {
  const c = s.borderColor;
  const m = 6;
  const w = W - m * 2, h = H - m * 2;
  switch (s.border) {
    case 'don': return <rect x={m} y={m} width={w} height={h} rx="3" fill="none" stroke={c} strokeWidth="0.6" />;
    case 'doi': return (<g fill="none" stroke={c}><rect x={m} y={m} width={w} height={h} rx="3" strokeWidth="0.9" /><rect x={m + 1.6} y={m + 1.6} width={w - 3.2} height={h - 3.2} rx="2" strokeWidth="0.3" /></g>);
    case 'cham': return <rect x={m} y={m} width={w} height={h} rx="3" fill="none" stroke={c} strokeWidth="1" strokeDasharray="0.1 2.4" strokeLinecap="round" />;
    case 'song': {
      // viền gợn sóng (vỏ sò)
      const seg = 6;
      const nx = Math.round(w / seg), ny = Math.round(h / seg);
      const sx = w / nx, sy = h / ny;
      let d = `M${m} ${m}`;
      for (let i = 0; i < nx; i++) d += ` q${sx / 2} -2.2 ${sx} 0`;
      for (let i = 0; i < ny; i++) d += ` q2.2 ${sy / 2} 0 ${sy}`;
      for (let i = 0; i < nx; i++) d += ` q${-sx / 2} 2.2 ${-sx} 0`;
      for (let i = 0; i < ny; i++) d += ` q-2.2 ${-sy / 2} 0 ${-sy}`;
      return <path d={d + 'Z'} fill="none" stroke={c} strokeWidth="0.6" />;
    }
    default: return null;
  }
}

/** Giấy ô li: dòng li mảnh, dòng kẻ đậm mỗi ô lớn (4 hoặc 5 li), đường dọc mỗi ô lớn, lề đỏ */
function Grid({ s, page, li, sq }: { s: SheetSettings; page: SheetPage; li: number; sq: number }) {
  const { x0, x1, y0, y1 } = page.grid;
  const lines: React.ReactNode[] = [];
  const n = Math.round((y1 - y0) / li);
  for (let i = 0; i <= n; i++) {
    const y = y0 + i * li;
    const main = i % s.paper === 0;
    lines.push(<line key={`h${i}`} x1={x0} x2={x1} y1={y} y2={y} stroke={s.lineColor} strokeWidth={main ? 0.26 : 0.12} strokeOpacity={main ? 0.85 : 0.5} />);
  }
  if (s.grid === 'vuong') {
    // ô li vuông (như vở Toán): kẻ dọc mỗi li, đậm mỗi ô lớn
    const m = Math.round((x1 - x0) / li);
    for (let j = 0; j <= m; j++) {
      const x = x0 + j * li;
      const main = j % s.paper === 0;
      lines.push(<line key={`v${j}`} x1={x} x2={x} y1={y0} y2={y1} stroke={s.lineColor} strokeWidth={main ? 0.26 : 0.12} strokeOpacity={main ? 0.85 : 0.5} />);
    }
  } else if (s.vertical) {
    const m = Math.round((x1 - x0) / sq);
    for (let j = 0; j <= m; j++) {
      const x = x0 + j * sq;
      lines.push(<line key={`v${j}`} x1={x} x2={x} y1={y0} y2={y1} stroke={s.lineColor} strokeWidth="0.12" strokeOpacity="0.55" />);
    }
  }
  if (s.margin) lines.push(<line key="lề" x1={x0 + sq} x2={x0 + sq} y1={y0 - 1} y2={y1 + 1} stroke={s.marginColor} strokeWidth="0.35" />);
  return <g>{lines}</g>;
}

/** Chữ vẽ bằng font tập viết; ký tự font không vẽ đúng thì vẽ bằng font hệ thống (cỡ khớp chiều cao chữ thường) */
function SegText({ text, font, fs }: { text: string; font: FontId; fs: number }) {
  return (<>{textSegments(text, font).map((g, i) => g.safe ? <tspan key={i}>{g.t}</tspan> : <tspan key={i} fontFamily={FALLBACK_FONT} fontSize={fs * fallbackScale(font)}>{g.t}</tspan>)}</>);
}

function Header({ s, page, W }: { s: SheetSettings; page: SheetPage; W: number }) {
  const { x0, x1, y0 } = page.grid;
  const mid = (x0 + x1) / 2;
  // tránh hoa văn góc trên đè lên dòng Họ tên / Ngày
  const padL = s.corners.tl !== 'none' ? Math.max(0, 5 + s.decoSize * 0.45 - x0) : 0;
  const padR = s.corners.tr !== 'none' ? Math.max(0, 5 + s.decoSize * 0.45 - (W - x1)) : 0;
  const narrow = W < 200; // khổ nhỏ: Ngày xuống dòng dưới
  const t = s.title.trim();
  return (
    <g fontFamily={`${fontFamily('in-n')}, Arial, sans-serif`} fill="#1f2937">
      {t && <text x={mid} y={y0 - (s.header ? (narrow ? 15.5 : 13.5) : 5)} textAnchor="middle" fontSize="7.4" fontFamily={`${fontFamily('hp4b')}, cursive`} fill={s.ink} style={{ whiteSpace: 'pre' }}><SegText text={t} font="hp4b" fs={7.4} /></text>}
      {s.header && (
        <g fontSize="3.6">
          <text x={x0 + padL} y={y0 - (narrow ? 8.5 : 4)}>Họ và tên: <tspan fill="#94a3b8">{narrow ? '.......................................' : '.........................................................'}</tspan></text>
          <text x={narrow ? x1 - padR : x0 + (x1 - x0) * 0.59 + padL * 0.5 - padR * 0.5} y={y0 - (narrow ? 8.5 : 4)} textAnchor={narrow ? 'end' : 'start'}>Lớp: <tspan fill="#94a3b8">...............</tspan></text>
          <text x={x1 - padR} y={y0 - 3.5} textAnchor="end">Ngày: <tspan fill="#94a3b8">......./......./...........</tspan></text>
        </g>
      )}
    </g>
  );
}

export default function SheetPageSvg({ s, layout, page, index, className }: { s: SheetSettings; layout: SheetLayout; page: SheetPage; index: number; className?: string }) {
  const fam = `${fontFamily(s.font)}, cursive`;
  const { W, H } = layout;
  const traceProps = s.traceStyle === 'mo'
    ? { fill: s.traceColor, fillOpacity: 0.55 }
    : s.traceStyle === 'cham'
      ? { fill: 'none', stroke: s.traceColor, strokeWidth: 0.22, strokeDasharray: '0.05 0.55', strokeLinecap: 'round' as const }
      : { fill: 'none', stroke: s.traceColor, strokeWidth: 0.16 };
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} width={`${W}mm`} height={`${H}mm`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Trang vở ${index + 1}`}>
      <FloralScope>
      <rect width={W} height={H} fill="#fff" />
      <Border s={s} W={W} H={H} />
      {(['tl', 'tr', 'bl', 'br'] as Corner[]).map((c) => <CornerDeco key={c} corner={c} value={s.corners[c]} size={s.decoSize} color={s.decoColor} W={W} H={H} />)}
      {page.header && <Header s={s} page={page} W={W} />}
      <Grid s={s} page={page} li={layout.li} sq={layout.sq} />
      <g fontFamily={fam} fontSize={layout.fs}>
        {page.rows.map((r, i) => (
          <Fragment key={i}>
            {r.pieces.map((p, j) => (
              <text key={j} x={p.x} y={r.base} style={{ whiteSpace: 'pre' }} {...(r.kind === 'mau' ? { fill: s.ink } : traceProps)}><SegText text={p.text} font={s.font} fs={layout.fs} /></text>
            ))}
          </Fragment>
        ))}
      </g>
      </FloralScope>
    </svg>
  );
}

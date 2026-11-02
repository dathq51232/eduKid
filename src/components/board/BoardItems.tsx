// Vẽ các vật trên Bảng trắng bằng SVG (chỉ dùng thuộc tính trực tiếp, không dùng class CSS, để xuất ảnh giữ nguyên hình).
import { memo, useMemo } from 'react';
import type React from 'react';
import { BRUSH, centerPath, inkOutline, outlinePath } from '@/lib/writing/ink';
import { cmText, shapePoints, type InkItem, type Item, type MathItem, type ShapeItem, type SolidItem, type TextItem } from '@/lib/board/types';

export const TEXT_FONT = { print: 'PraiseBaloo, Arial, sans-serif', script: 'PraiseScript, cursive' } as const;
const fmt = (v: number) => (Math.round(v * 100) / 100).toLocaleString('vi-VN');

function InkView({ it }: { it: InkItem }) {
  const b = BRUSH[it.brush];
  const d = useMemo(() => it.brush === 'marker' ? centerPath(it.pts)
    : outlinePath(inkOutline(it.pts, { size: it.size, thinning: b.thinning, taperStart: it.taper[0], taperEnd: it.taper[1], streamline: 0 })), [it.pts, it.size, it.brush, it.taper, b.thinning]);
  return (
    <g transform={`scale(${it.w / (it.ow || 1)} ${it.h / (it.oh || 1)})`}>
      {it.brush === 'marker'
        ? <path d={d} fill="none" stroke={it.color} strokeOpacity={b.alpha} strokeWidth={it.size} strokeLinecap="round" strokeLinejoin="round" />
        : <path d={d} fill={it.color} fillOpacity={b.alpha} />}
    </g>
  );
}

function Label({ x, y, text, color, dark }: { x: number; y: number; text: string; color: string; dark: boolean }) {
  return <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontFamily={TEXT_FONT.print} fontWeight={700} fontSize={19} fill={color} stroke={dark ? '#1f3b2d' : '#ffffff'} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round">{text}</text>;
}

function ShapeView({ it, dark }: { it: ShapeItem; dark: boolean }) {
  const { w, h, stroke, sw } = it;
  const dash = it.dash ? `${sw * 3} ${sw * 2.2}` : undefined;
  const common = { stroke, strokeWidth: sw, strokeDasharray: dash, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const labels: React.JSX.Element[] = [];
  if (it.shape === 'line' || it.shape === 'arrow') {
    const [x1, y1, x2, y2] = it.flip ? [0, h, w, 0] : [0, 0, w, h];
    const a = Math.atan2(y2 - y1, x2 - x1), L = Math.hypot(w, h), hs = Math.max(14, sw * 4);
    if (it.measure) {
      const nx = -Math.sin(a), ny = Math.cos(a);
      labels.push(<Label key="l" x={(x1 + x2) / 2 + nx * -22} y={(y1 + y2) / 2 + ny * -22} text={cmText(L)} color={stroke} dark={dark} />);
    }
    return (
      <g>
        <line x1={x1} y1={y1} x2={it.shape === 'arrow' ? x2 - Math.cos(a) * hs * 0.6 : x2} y2={it.shape === 'arrow' ? y2 - Math.sin(a) * hs * 0.6 : y2} {...common} />
        {it.shape === 'arrow' && <polygon points={`${x2},${y2} ${x2 - Math.cos(a - 0.42) * hs * 1.3},${y2 - Math.sin(a - 0.42) * hs * 1.3} ${x2 - Math.cos(a + 0.42) * hs * 1.3},${y2 - Math.sin(a + 0.42) * hs * 1.3}`} fill={stroke} />}
        {it.measure && <><circle cx={x1} cy={y1} r={sw + 2} fill={stroke} /><circle cx={x2} cy={y2} r={sw + 2} fill={stroke} /></>}
        {labels}
      </g>
    );
  }
  if (it.shape === 'circle' || it.shape === 'ellipse') {
    return (
      <g>
        <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={it.fill} {...common} />
        {it.measure && it.shape === 'circle' && <>
          <circle cx={w / 2} cy={h / 2} r={sw + 1.5} fill={stroke} />
          <line x1={w / 2} y1={h / 2} x2={w} y2={h / 2} stroke={stroke} strokeWidth={Math.max(1.5, sw * 0.7)} strokeDasharray="7 5" />
          <Label x={w * 0.75} y={h / 2 - 16} text={`r = ${cmText(w / 2)}`} color={stroke} dark={dark} />
        </>}
        {it.measure && it.shape === 'ellipse' && <Label x={w / 2} y={h + 20} text={`${cmText(w)} × ${cmText(h)}`} color={stroke} dark={dark} />}
      </g>
    );
  }
  const pts = shapePoints(it) ?? [];
  if (it.measure && pts.length > 2) {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      let ox = mx - cx, oy = my - cy; const d = Math.hypot(ox, oy) || 1; ox /= d; oy /= d;
      labels.push(<Label key={i} x={mx + ox * 22} y={my + oy * 22} text={cmText(Math.hypot(q[0] - p[0], q[1] - p[1]))} color={stroke} dark={dark} />);
    });
  }
  const m = 16;
  return (
    <g>
      <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={it.fill} {...common} />
      {it.shape === 'rtri' && <path d={`M0 ${h - m}H${m}V${h}`} fill="none" stroke={stroke} strokeWidth={Math.max(1.5, sw * 0.6)} />}
      {(it.shape === 'rect' || it.shape === 'square') && it.measure && <path d={`M0 ${m}H${m}V0`} fill="none" stroke={stroke} strokeWidth={Math.max(1.5, sw * 0.6)} />}
      {labels}
    </g>
  );
}

function SolidView({ it }: { it: SolidItem }) {
  const { w, h, color: c } = it;
  const st = { stroke: c, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const hid = it.hidden ? { stroke: c, strokeWidth: 2.2, strokeDasharray: '9 7', strokeOpacity: 0.85 } : null;
  switch (it.solid) {
    case 'cube': case 'box': {
      const dx = w * (it.solid === 'cube' ? 0.3 : 0.28), dy = h * (it.solid === 'cube' ? 0.3 : 0.32), fw = w - dx, fh = h - dy;
      const F = [[0, dy], [fw, dy], [fw, h], [0, h]], B = [[dx, 0], [w, 0], [w, fh], [dx, fh]];
      const P = (a: number[][]) => a.map((p) => p.join(',')).join(' ');
      return (
        <g>
          <polygon points={P([F[0], F[1], B[1], B[0]])} fill={c} fillOpacity={0.16} {...st} />
          <polygon points={P([F[1], B[1], B[2], F[2]])} fill={c} fillOpacity={0.36} {...st} />
          <polygon points={P(F)} fill={c} fillOpacity={0.24} {...st} />
          {hid && <path d={`M${B[0]}L${B[3]}L${B[2]}M${B[3]}L${F[3]}`} fill="none" {...hid} />}
        </g>
      );
    }
    case 'cyl': {
      const ry = Math.min(h * 0.14, w * 0.25), rx = w / 2;
      return (
        <g>
          <path d={`M0 ${ry}V${h - ry}A${rx} ${ry} 0 0 0 ${w} ${h - ry}V${ry}`} fill={c} fillOpacity={0.26} {...st} />
          <ellipse cx={rx} cy={ry} rx={rx} ry={ry} fill={c} fillOpacity={0.14} {...st} />
          {hid && <path d={`M0 ${h - ry}A${rx} ${ry} 0 0 1 ${w} ${h - ry}`} fill="none" {...hid} />}
        </g>
      );
    }
    case 'sphere': {
      const r = Math.min(w, h) / 2, cx = w / 2, cy = h / 2, ry = r * 0.28;
      return (
        <g>
          <defs><radialGradient id={`sph-${it.id}`} cx="0.35" cy="0.3" r="0.75"><stop offset="0" stopColor="#ffffff" stopOpacity="0.85" /><stop offset="1" stopColor={c} stopOpacity="0.45" /></radialGradient></defs>
          <circle cx={cx} cy={cy} r={r} fill={`url(#sph-${it.id})`} {...st} />
          <path d={`M${cx - r} ${cy}A${r} ${ry} 0 0 0 ${cx + r} ${cy}`} fill="none" {...st} strokeWidth={2.2} />
          {hid && <path d={`M${cx - r} ${cy}A${r} ${ry} 0 0 1 ${cx + r} ${cy}`} fill="none" {...hid} />}
        </g>
      );
    }
    case 'cone': {
      const ry = Math.min(h * 0.14, w * 0.25), rx = w / 2, by = h - ry;
      return (
        <g>
          <path d={`M${rx} 0L${w} ${by}A${rx} ${ry} 0 0 1 0 ${by}Z`} fill={c} fillOpacity={0.26} {...st} />
          {hid ? <path d={`M0 ${by}A${rx} ${ry} 0 0 1 ${w} ${by}`} fill="none" {...hid} /> : null}
          {hid && <line x1={rx} y1={0} x2={rx} y2={by} {...hid} />}
          {hid && <line x1={rx} y1={by} x2={w} y2={by} {...hid} />}
        </g>
      );
    }
    case 'pyramid': {
      const P1 = [0, h], P2 = [w * 0.68, h], P3 = [w, h - h * 0.24], P4 = [w * 0.32, h - h * 0.24], A = [w * 0.5, 0];
      return (
        <g>
          <polygon points={[A, P1, P2].map((p) => p.join(',')).join(' ')} fill={c} fillOpacity={0.24} {...st} />
          <polygon points={[A, P2, P3].map((p) => p.join(',')).join(' ')} fill={c} fillOpacity={0.4} {...st} />
          {hid && <path d={`M${P1}L${P4}L${P3}M${A}L${P4}`} fill="none" {...hid} />}
        </g>
      );
    }
  }
}

function TextView({ it }: { it: TextItem }) {
  const lines = it.text.split('\n');
  return (
    <g transform={`scale(${it.w / (it.ow || 1)} ${it.h / (it.oh || 1)})`}>
      <text x={4} y={0} fontFamily={TEXT_FONT[it.font]} fontWeight={it.font === 'script' ? 600 : 700} fontSize={it.size} fill={it.color}>
        {lines.map((l, i) => <tspan key={i} x={4} dy={i ? it.size * 1.25 : it.size * 1.02}>{l || ' '}</tspan>)}
      </text>
    </g>
  );
}

/* ---------- đồ dùng Toán ---------- */
export function mathSize(m: MathItem): [number, number] {
  switch (m.tool) {
    case 'numberline': return [1000, 190];
    case 'fraction': return m.shape === 'circle' ? [300, m.label ? 400 : 300] : [520, m.label ? 300 : 200];
    case 'clock': return [300, m.digital ? 370 : 300];
    case 'sticks': return [Math.max(220, m.tens * 92 + m.ones * 26 + 40), 330];
    case 'blocks': return [Math.max(240, m.hundreds * 170 + m.tens * 26 + Math.ceil(m.ones / 5) * 26 + 50), 260];
  }
}

function MathView({ it, ink, dark }: { it: MathItem; ink: string; dark: boolean }) {
  const [W, H] = mathSize(it);
  const paper = dark ? '#284b3a' : '#ffffff';
  let body: React.JSX.Element;
  switch (it.tool) {
    case 'numberline': {
      const span = Math.max(1e-6, it.to - it.from), step = Math.max(1e-6, it.step);
      const n = Math.min(60, Math.round(span / step));
      const X = (v: number) => 50 + ((v - it.from) / span) * 880;
      const ticks = Array.from({ length: n + 1 }, (_, i) => Math.round((it.from + i * step) * 1000) / 1000);
      const y = 120;
      body = (
        <g>
          <line x1={30} y1={y} x2={965} y2={y} stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <polygon points={`980,${y} 958,${y - 11} 958,${y + 11}`} fill={ink} />
          {ticks.map((v) => (
            <g key={v} data-tick={v}>
              <rect x={X(v) - 880 / n / 2} y={y - 40} width={880 / n} height={95} fill="transparent" />
              <line x1={X(v)} y1={y - 13} x2={X(v)} y2={y + 13} stroke={ink} strokeWidth={3} />
              <text x={X(v)} y={y + 42} textAnchor="middle" fontFamily={TEXT_FONT.print} fontWeight={700} fontSize={n > 20 ? 18 : 24} fill={ink}>{fmt(v)}</text>
            </g>
          ))}
          {it.hops && it.marks.slice(1).map((v, i) => {
            const a = X(it.marks[i]), b = X(v), d = v - it.marks[i], top = y - 22 - Math.min(80, Math.abs(b - a) * 0.35);
            return (
              <g key={`h${i}`} pointerEvents="none">
                <path d={`M${a} ${y - 8}Q${(a + b) / 2} ${top} ${b} ${y - 8}`} fill="none" stroke="#e11d48" strokeWidth={3} />
                <polygon points={`${b},${y - 6} ${b - Math.sign(b - a) * 12},${y - 16} ${b - Math.sign(b - a) * 3},${y - 22}`} fill="#e11d48" />
                <text x={(a + b) / 2} y={top + (y - 8 - top) / 2 - 6} textAnchor="middle" fontFamily={TEXT_FONT.print} fontWeight={800} fontSize={24} fill="#e11d48" stroke={paper} strokeWidth={5} paintOrder="stroke">{d >= 0 ? '+' : '−'}{fmt(Math.abs(d))}</text>
              </g>
            );
          })}
          {it.marks.map((v, i) => <circle key={`m${i}`} cx={X(v)} cy={y} r={10} fill="#e11d48" stroke={paper} strokeWidth={3} pointerEvents="none" />)}
        </g>
      );
      break;
    }
    case 'fraction': {
      const k = it.on.length, fill = '#f59e0b';
      const parts = it.shape === 'circle'
        ? Array.from({ length: it.n }, (_, i) => {
          const r = 140, cx = 150, cy = 150;
          if (it.n === 1) return <circle key={i} data-part={i} cx={cx} cy={cy} r={r} fill={it.on.includes(i) ? fill : paper} stroke={ink} strokeWidth={3} />;
          const a0 = (i / it.n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / it.n) * Math.PI * 2 - Math.PI / 2;
          const large = a1 - a0 > Math.PI ? 1 : 0;
          return <path key={i} data-part={i} d={`M${cx} ${cy}L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r}A${r} ${r} 0 ${large} 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}Z`} fill={it.on.includes(i) ? fill : paper} stroke={ink} strokeWidth={3} strokeLinejoin="round" />;
        })
        : Array.from({ length: it.n }, (_, i) => <rect key={i} data-part={i} x={10 + (i * 500) / it.n} y={10} width={500 / it.n} height={180} fill={it.on.includes(i) ? fill : paper} stroke={ink} strokeWidth={3} />);
      const ly = it.shape === 'circle' ? 300 : 200;
      body = (
        <g>
          {parts}
          {it.label && (
            <g pointerEvents="none" fontFamily={TEXT_FONT.print} fontWeight={800} fontSize={36} fill={ink} textAnchor="middle">
              <text x={W / 2} y={ly + 40}>{k}</text>
              <line x1={W / 2 - 26} y1={ly + 52} x2={W / 2 + 26} y2={ly + 52} stroke={ink} strokeWidth={4} />
              <text x={W / 2} y={ly + 90}>{it.n}</text>
            </g>
          )}
        </g>
      );
      break;
    }
    case 'clock': {
      const cx = 150, cy = 150;
      const ha = (((it.hour % 12) + it.minute / 60) * 30 - 90) * Math.PI / 180, ma = (it.minute * 6 - 90) * Math.PI / 180;
      body = (
        <g>
          <circle cx={cx} cy={cy} r={142} fill={paper} stroke={ink} strokeWidth={6} />
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i * 6 - 90) * Math.PI / 180, r0 = i % 5 ? 130 : 122;
            return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * 137} y2={cy + Math.sin(a) * 137} stroke={ink} strokeWidth={i % 5 ? 2 : 4} />;
          })}
          {Array.from({ length: 12 }, (_, i) => {
            const a = ((i + 1) * 30 - 90) * Math.PI / 180;
            return <text key={i} x={cx + Math.cos(a) * 100} y={cy + Math.sin(a) * 100 + 11} textAnchor="middle" fontFamily={TEXT_FONT.print} fontWeight={800} fontSize={30} fill={ink}>{i + 1}</text>;
          })}
          <g data-hand="h"><line x1={cx} y1={cy} x2={cx + Math.cos(ha) * 70} y2={cy + Math.sin(ha) * 70} stroke="transparent" strokeWidth={30} /><line x1={cx} y1={cy} x2={cx + Math.cos(ha) * 70} y2={cy + Math.sin(ha) * 70} stroke="#2563eb" strokeWidth={10} strokeLinecap="round" /></g>
          <g data-hand="m"><line x1={cx} y1={cy} x2={cx + Math.cos(ma) * 112} y2={cy + Math.sin(ma) * 112} stroke="transparent" strokeWidth={30} /><line x1={cx} y1={cy} x2={cx + Math.cos(ma) * 112} y2={cy + Math.sin(ma) * 112} stroke="#e11d48" strokeWidth={6} strokeLinecap="round" /></g>
          <circle cx={cx} cy={cy} r={9} fill={ink} />
          {it.digital && (
            <g pointerEvents="none">
              <rect x={70} y={306} width={160} height={56} rx={12} fill={dark ? '#0f2a1d' : '#111827'} />
              <text x={150} y={346} textAnchor="middle" fontFamily="'Courier New', monospace" fontWeight={700} fontSize={36} fill="#34d399">{String(it.hour).padStart(2, '0')}:{String(it.minute).padStart(2, '0')}</text>
            </g>
          )}
        </g>
      );
      break;
    }
    case 'sticks': {
      const stick = (x: number, key: string, tilt = 0) => (
        <g key={key} transform={`rotate(${tilt} ${x} 140)`}>
          <rect x={x - 5} y={30} width={10} height={220} rx={4} fill="#facc15" stroke="#a16207" strokeWidth={1.5} />
          <rect x={x - 5} y={30} width={10} height={16} rx={4} fill="#ef4444" />
        </g>
      );
      const els: React.JSX.Element[] = [];
      let x = 30;
      for (let t = 0; t < it.tens; t++) {
        for (let i = 0; i < 10; i++) els.push(stick(x + 10 + i * 6.5, `t${t}-${i}`, (i - 4.5) * 0.6));
        els.push(<rect key={`b${t}`} x={x} y={150} width={84} height={16} rx={6} fill="#2563eb" />);
        x += 92;
      }
      for (let o = 0; o < it.ones; o++) { els.push(stick(x + 12, `o${o}`)); x += 26; }
      body = (
        <g>
          {els}
          <text x={W / 2} y={300} textAnchor="middle" fontFamily={TEXT_FONT.print} fontWeight={800} fontSize={26} fill={ink}>{it.tens} chục và {it.ones} que = {it.tens * 10 + it.ones}</text>
        </g>
      );
      break;
    }
    case 'blocks': {
      const s = 14, els: React.JSX.Element[] = [];
      const cube = (x: number, y: number, key: string, col: string) => <rect key={key} x={x} y={y} width={s} height={s} fill={col} stroke="#1e3a8a" strokeWidth={1} />;
      let x = 20;
      for (let hI = 0; hI < it.hundreds; hI++) {
        for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) els.push(cube(x + c * s, 20 + r * s, `h${hI}-${r}-${c}`, '#60a5fa'));
        x += 10 * s + 30;
      }
      for (let t = 0; t < it.tens; t++) { for (let r = 0; r < 10; r++) els.push(cube(x, 20 + r * s, `t${t}-${r}`, '#34d399')); x += s + 12; }
      x += 8;
      for (let o = 0; o < it.ones; o++) els.push(cube(x + Math.floor(o / 5) * (s + 12), 20 + (o % 5) * (s + 6) + 60, `o${o}`, '#fbbf24'));
      body = (
        <g>
          {els}
          <text x={W / 2} y={215} textAnchor="middle" fontFamily={TEXT_FONT.print} fontWeight={800} fontSize={24} fill={ink}>{it.hundreds} trăm {it.tens} chục {it.ones} đơn vị = {it.hundreds * 100 + it.tens * 10 + it.ones}</text>
        </g>
      );
      break;
    }
  }
  return <svg x={0} y={0} width={it.w} height={it.h} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" overflow="visible">{body}</svg>;
}

export const ItemView = memo(function ItemView({ it, dark }: { it: Item; dark: boolean }) {
  const ink = dark ? '#f8fafc' : '#1f2937';
  let body: React.JSX.Element | null = null;
  switch (it.kind) {
    case 'ink': body = <InkView it={it} />; break;
    case 'shape': body = <ShapeView it={it} dark={dark} />; break;
    case 'solid': body = <SolidView it={it} />; break;
    case 'text': body = <TextView it={it} />; break;
    case 'sticker': body = <image href={it.src} x={0} y={0} width={it.w} height={it.h} preserveAspectRatio="xMidYMid meet" />; break;
    case 'math': body = <MathView it={it} ink={ink} dark={dark} />; break;
  }
  return <g data-id={it.id} transform={`translate(${it.x} ${it.y}) rotate(${it.rot} ${it.w / 2} ${it.h / 2})`}>{body}</g>;
});

/** Biểu tượng nhỏ cho nút chọn hình / khối */
export function ShapeIcon({ k }: { k: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const map: Record<string, React.JSX.Element> = {
    line: <line x1="4" y1="20" x2="20" y2="4" {...s} />, arrow: <><line x1="4" y1="20" x2="19" y2="5" {...s} /><path d="M11 4h9v9" {...s} /></>,
    square: <rect x="4" y="4" width="16" height="16" {...s} />, rect: <rect x="2" y="6" width="20" height="12" {...s} />,
    tri: <path d="M12 3 21 20H3Z" {...s} />, rtri: <path d="M4 3v17h16Z" {...s} />, circle: <circle cx="12" cy="12" r="9" {...s} />,
    ellipse: <ellipse cx="12" cy="12" rx="10" ry="6" {...s} />, rhombus: <path d="M12 2 21 12 12 22 3 12Z" {...s} />,
    para: <path d="M7 5h15l-5 14H2Z" {...s} />, trap: <path d="M7 5h10l5 14H2Z" {...s} />, poly: <path d="M12 2 21 9 18 21H6L3 9Z" {...s} />,
    cube: <><rect x="3" y="8" width="13" height="13" {...s} /><path d="M3 8l5-5h13v13l-5 5M16 8l5-5" {...s} /></>,
    box: <><rect x="2" y="9" width="15" height="11" {...s} /><path d="M2 9l5-5h15v11l-5 5M17 9l5-5" {...s} /></>,
    cyl: <><ellipse cx="12" cy="5" rx="8" ry="3" {...s} /><path d="M4 5v14a8 3 0 0 0 16 0V5" {...s} /></>,
    sphere: <><circle cx="12" cy="12" r="9" {...s} /><path d="M3 12a9 3 0 0 0 18 0" {...s} /></>,
    cone: <><path d="M12 2 20 19M12 2 4 19" {...s} /><ellipse cx="12" cy="19" rx="8" ry="3" {...s} /></>,
    pyramid: <path d="M12 2 2 20h13l7-5ZM12 2l3 18" {...s} />,
  };
  return <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">{map[k]}</svg>;
}

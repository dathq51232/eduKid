// Hình vẽ các vật phẩm quà tặng theo bộ nhận diện EDKC (SVG nhẹ, dùng ảnh logo lục giác có sẵn).
// Bảng màu thương hiệu: xanh #0056B5 · vàng #FFC107 · hồng #E91663 · tím #9C2780 (+ xanh lá, cam của logo).
import { useId } from 'react';
import type { GiftArt as Art } from '@/lib/gifts';

const C = { blue: '#0056B5', yellow: '#FFC107', pink: '#E91663', purple: '#9C2780', green: '#4CAF50', orange: '#F28C1B', ink: '#1d2a4a' };
const LOGO = '/brand/logo-mark.webp';

function Logo({ x, y, s }: { x: number; y: number; s: number }) {
  return <image href={LOGO} x={x - s / 2} y={y - s / 2} width={s} height={s} preserveAspectRatio="xMidYMid meet" />;
}
function Word({ x, y, size, white = false }: { x: number; y: number; size: number; white?: boolean }) {
  const cols = white ? ['#ffffff', C.yellow, '#ff8fbd', '#e3a6ff'] : [C.blue, C.yellow, C.pink, C.purple];
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily="'Fredoka','Quicksand',system-ui,sans-serif" fontWeight="800" fontSize={size} letterSpacing="1">
      {'EDKC'.split('').map((ch, i) => <tspan key={ch} fill={cols[i]}>{ch}</tspan>)}
    </text>
  );
}

function Badge({ ring, face, id }: { ring: string; face: string; id: string }) {
  return (
    <g>
      <ellipse cx="100" cy="176" rx="52" ry="9" fill="#000" opacity=".12" />
      <circle cx="100" cy="100" r="74" fill={ring} />
      <circle cx="100" cy="100" r="74" fill={`url(#${id}-shine)`} />
      <circle cx="100" cy="100" r="58" fill={face} />
      <Logo x={100} y={100} s={84} />
      <path d="M48 62 A62 62 0 0 1 126 34" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

export default function GiftArt({ art, size = 120, locked = false }: { art: Art; size?: number; locked?: boolean }) {
  const id = useId().replace(/:/g, '');
  const body = (() => {
    switch (art) {
      case 'badge-blue': return <Badge id={id} ring={C.blue} face="#dcecff" />;
      case 'badge-pink': return <Badge id={id} ring={C.pink} face="#ffe0ec" />;
      case 'badge-purple': return <Badge id={id} ring={C.purple} face="#f3e3ff" />;
      case 'cubes': {
        const cube = (x: number, y: number, rot: number, col: string, ch: string) => (
          <g transform={`translate(${x} ${y}) rotate(${rot})`} key={ch}>
            <rect x="-27" y="-23" width="54" height="54" rx="12" fill="#000" opacity=".14" />
            <rect x="-27" y="-27" width="54" height="54" rx="12" fill={col} />
            <rect x="-27" y="-27" width="54" height="22" rx="12" fill="#fff" opacity=".18" />
            <text x="0" y="12" textAnchor="middle" fontFamily="'Fredoka',system-ui,sans-serif" fontWeight="800" fontSize="34" fill="#fff6dc" stroke="#0003" strokeWidth="1">{ch}</text>
          </g>
        );
        return <g>{cube(62, 70, -10, '#2283c9', 'E')}{cube(136, 64, 8, '#58ad55', 'D')}{cube(58, 140, 6, '#6d4fb0', 'K')}{cube(138, 138, -7, '#e48d28', 'C')}</g>;
      }
      case 'pen':
        return (
          <g transform="rotate(-38 100 100)">
            <ellipse cx="104" cy="168" rx="56" ry="7" fill="#000" opacity=".1" transform="rotate(38 100 100)" />
            <rect x="88" y="18" width="24" height="132" rx="12" fill={C.blue} />
            <rect x="88" y="18" width="9" height="132" rx="4.5" fill="#fff" opacity=".22" />
            <path d="M88 150 L112 150 L104 178 L96 178 Z" fill="#dfe7f3" />
            <path d="M97 174 L103 174 L100 186 Z" fill={C.ink} />
            <rect x="110" y="26" width="7" height="52" rx="3.5" fill="#cfd8e6" />
            <rect x="86" y="80" width="28" height="10" rx="3" fill={C.yellow} />
            <Logo x={100} y={115} s={22} />
          </g>
        );
      case 'notebook':
        return (
          <g>
            <rect x="46" y="30" width="116" height="150" rx="10" fill="#000" opacity=".12" />
            <rect x="40" y="24" width="116" height="150" rx="10" fill={C.blue} />
            <rect x="40" y="24" width="18" height="150" rx="9" fill="#00449a" />
            {[40, 62, 84, 106, 128, 150].map((y) => <circle key={y} cx="49" cy={y} r="4" fill="#dfe9f7" />)}
            <rect x="148" y="24" width="8" height="150" fill="#fff" opacity=".12" />
            <Logo x={106} y={88} s={64} />
            <rect x="72" y="128" width="68" height="26" rx="8" fill="#fff" />
            <Word x={106} y={148} size={19} />
          </g>
        );
      case 'bottle':
        return (
          <g>
            <ellipse cx="100" cy="184" rx="40" ry="7" fill="#000" opacity=".12" />
            <rect x="82" y="14" width="36" height="26" rx="8" fill="#22252e" />
            <rect x="88" y="6" width="24" height="12" rx="6" fill="none" stroke="#22252e" strokeWidth="5" />
            <path d="M84 40 L116 40 L124 58 Q132 66 132 80 L132 170 Q132 182 120 182 L80 182 Q68 182 68 170 L68 80 Q68 66 76 58 Z" fill="#f7f8fb" stroke="#d8dde7" strokeWidth="2" />
            <rect x="74" y="66" width="10" height="106" rx="5" fill="#fff" />
            <Logo x={100} y={112} s={50} />
            <Word x={100} y={158} size={20} />
          </g>
        );
      case 'tote':
      case 'tote-dark': {
        const dark = art === 'tote-dark';
        const bag = dark ? '#4a4c52' : '#efe3cc', edge = dark ? '#36373c' : '#d9c8a8', strap = dark ? '#2f3034' : '#d9c8a8';
        return (
          <g>
            <ellipse cx="100" cy="186" rx="62" ry="7" fill="#000" opacity=".12" />
            <path d="M70 70 Q70 18 100 18 Q130 18 130 70" fill="none" stroke={strap} strokeWidth="9" strokeLinecap="round" />
            <path d="M40 64 L160 64 L170 182 L30 182 Z" fill={bag} stroke={edge} strokeWidth="2" />
            <path d="M40 64 L160 64 L161 74 L39 74 Z" fill={edge} opacity=".6" />
            {dark ? <Logo x={100} y={124} s={92} /> : <><Logo x={100} y={112} s={62} /><Word x={100} y={168} size={22} /></>}
          </g>
        );
      }
      case 'tshirt':
        return (
          <g>
            <ellipse cx="100" cy="186" rx="60" ry="7" fill="#000" opacity=".1" />
            <path d="M70 22 Q100 40 130 22 L172 44 L158 84 L140 76 L140 182 L60 182 L60 76 L42 84 L28 44 Z" fill="#fdfdfd" stroke="#d9dee7" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M80 26 Q100 44 120 26" fill="none" stroke="#d9dee7" strokeWidth="3" />
            <Logo x={100} y={98} s={58} />
            <Word x={100} y={150} size={22} />
          </g>
        );
      case 'gold':
        return (
          <g>
            <path d="M74 8 L96 70 L80 74 L58 12 Z" fill={C.blue} /><path d="M126 8 L104 70 L120 74 L142 12 Z" fill={C.pink} />
            <ellipse cx="100" cy="186" rx="44" ry="7" fill="#000" opacity=".12" />
            <polygon points="100,52 152,82 152,142 100,172 48,142 48,82" fill={`url(#${id}-gold)`} stroke="#b77d00" strokeWidth="4" strokeLinejoin="round" />
            <polygon points="100,66 140,89 140,135 100,158 60,135 60,89" fill="#fff4cf" stroke="#e7b230" strokeWidth="3" strokeLinejoin="round" />
            <Logo x={100} y={112} s={70} />
            <path d="M62 86 L92 68" stroke="#fff" strokeOpacity=".7" strokeWidth="6" strokeLinecap="round" />
          </g>
        );
    }
  })();
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={`gift-art${locked ? ' is-locked' : ''}`} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-shine`} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe27a" /><stop offset=".5" stopColor="#f6b91c" /><stop offset="1" stopColor="#d48d00" /></linearGradient>
      </defs>
      {body}
    </svg>
  );
}

// Chất liệu gỗ dùng chung cho bàn cờ vua và cờ tướng: vân gỗ (SVG feTurbulence), khung chạm hoa văn, bóng quân.
// Mọi id trong <defs> có tiền tố riêng (p) để nhiều bàn cờ trên cùng trang không đè nhau.

export function WoodDefs({ p }: { p: string }) {
  return (
    <defs>
      {/* Vân gỗ: nhiễu kéo dài theo một chiều, tô màu nâu và chồng lên mặt gỗ */}
      <filter id={`${p}grain`} x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="4" seed="11" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.17  0 0 0 0 0.06  0 0 0 1.1 -0.38" result="c" />
        <feComposite in="c" in2="SourceGraphic" operator="in" />
      </filter>
      <filter id={`${p}grainV`} x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
        <feTurbulence type="fractalNoise" baseFrequency="0.09 0.004" numOctaves="4" seed="5" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.11  0 0 0 0 0.04  0 0 0 1.2 -0.36" result="c" />
        <feComposite in="c" in2="SourceGraphic" operator="in" />
      </filter>
      <linearGradient id={`${p}face`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#cf9d63" />
        <stop offset=".55" stopColor="#ba8550" />
        <stop offset="1" stopColor="#a06c3c" />
      </linearGradient>
      <linearGradient id={`${p}frame`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8a5a31" />
        <stop offset=".5" stopColor="#6e4423" />
        <stop offset="1" stopColor="#4f2f17" />
      </linearGradient>
      <radialGradient id={`${p}disc`} cx=".38" cy=".32" r=".75">
        <stop offset="0" stopColor="#fbf0da" />
        <stop offset=".6" stopColor="#ecd3a6" />
        <stop offset="1" stopColor="#d4b07a" />
      </radialGradient>
      <linearGradient id={`${p}edge`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c99c63" />
        <stop offset="1" stopColor="#8c6236" />
      </linearGradient>
      <filter id={`${p}shadow`} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.6" floodColor="#2a1607" floodOpacity=".55" />
      </filter>
      <filter id={`${p}lift`} x="-40%" y="-40%" width="180%" height="190%">
        <feDropShadow dx="0" dy="9" stdDeviation="5" floodColor="#2a1607" floodOpacity=".5" />
      </filter>
      {/* Hoa văn "chữ hồi" chạm trên khung */}
      <pattern id={`${p}fret`} width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M4 24V4h20v16H10V10h8v6" fill="none" stroke="#3b2210" strokeWidth="2.4" strokeLinecap="square" opacity=".55" />
        <path d="M5 25V5h20v16H11V11h8v6" fill="none" stroke="#c48d58" strokeWidth="1" strokeLinecap="square" opacity=".35" />
      </pattern>
    </defs>
  );
}

/** Khung gỗ chạm: nền khung, dải hoa văn, gờ trong/ngoài. (x,y,w,h) là toàn bộ khung; t là bề dày khung. */
export function WoodFrame({ p, w, h, t }: { p: string; w: number; h: number; t: number }) {
  const band = t * 0.42;
  return (
    <g>
      <rect x="0" y="0" width={w} height={h} rx={t * 0.45} fill={`url(#${p}frame)`} />
      <rect x="0" y="0" width={w} height={h} rx={t * 0.45} fill="#000" filter={`url(#${p}grain)`} opacity=".55" />
      {/* dải hoa văn chạy quanh khung */}
      <path fillRule="evenodd" d={`M${t * 0.28} ${t * 0.28}h${w - t * 0.56}v${h - t * 0.56}h${-(w - t * 0.56)}z M${t * 0.28 + band} ${t * 0.28 + band}h${w - t * 0.56 - 2 * band}v${h - t * 0.56 - 2 * band}h${-(w - t * 0.56 - 2 * band)}z`} fill={`url(#${p}fret)`} />
      <rect x={t * 0.28} y={t * 0.28} width={w - t * 0.56} height={h - t * 0.56} fill="none" stroke="#2f1a0b" strokeWidth="2" opacity=".6" />
      <rect x={t * 0.28 + band} y={t * 0.28 + band} width={w - t * 0.56 - 2 * band} height={h - t * 0.56 - 2 * band} fill="none" stroke="#2f1a0b" strokeWidth="2" opacity=".6" />
      {/* gờ sáng mép ngoài + gờ tối mép trong (cảm giác nổi khối) */}
      <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx={t * 0.45} fill="none" stroke="#b98450" strokeWidth="3" opacity=".7" />
      <rect x={t - 3} y={t - 3} width={w - 2 * t + 6} height={h - 2 * t + 6} fill="none" stroke="#2a1608" strokeWidth="6" opacity=".7" />
      {/* hoa góc */}
      {[[t * 0.5, t * 0.5], [w - t * 0.5, t * 0.5], [t * 0.5, h - t * 0.5], [w - t * 0.5, h - t * 0.5]].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`} transform={`translate(${cx} ${cy})`} opacity=".85">
          <circle r={t * 0.3} fill="#7b4c26" stroke="#2f1a0b" strokeWidth="2" />
          {[0, 45, 90, 135].map((a) => <ellipse key={a} rx={t * 0.24} ry={t * 0.08} transform={`rotate(${a})`} fill="#a26a37" stroke="#3b2210" strokeWidth="1.2" />)}
          <circle r={t * 0.07} fill="#3b2210" />
        </g>
      ))}
    </g>
  );
}

/** Mặt gỗ phẳng có vân (dùng cho mặt bàn cờ tướng) */
export function WoodSurface({ p, x, y, w, h }: { p: string; x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${p}face)`} />
      <rect x={x} y={y} width={w} height={h} fill="#000" filter={`url(#${p}grain)`} opacity=".5" />
    </g>
  );
}

/** Chỉ các dải màu cho quân cờ tướng (không có bộ lọc) — dùng ở lớp quân cờ */
export function DiscDefs({ p }: { p: string }) {
  return (
    <defs>
      <radialGradient id={`${p}disc`} cx=".38" cy=".32" r=".75">
        <stop offset="0" stopColor="#fbf0da" />
        <stop offset=".6" stopColor="#ecd3a6" />
        <stop offset="1" stopColor="#d4b07a" />
      </radialGradient>
      <linearGradient id={`${p}edge`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c99c63" />
        <stop offset="1" stopColor="#8c6236" />
      </linearGradient>
    </defs>
  );
}

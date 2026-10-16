// Huy hiệu thành tích: cùng phong cách nét mực + màu phẳng như Milo. Không có giá trị quy đổi, chỉ để động viên.

export type BadgeIcon = 'pattern' | 'memory' | 'maze' | 'steady' | 'explorer' | 'star';

const INK = '#1f2a44';

const FILL: Record<BadgeIcon, string> = {
  pattern: '#2f6fed',
  memory: '#8b5cf6',
  maze: '#1f9d6b',
  steady: '#e2483d',
  explorer: '#f08a24',
  star: '#f5b82e',
};

function Glyph({ icon }: { icon: BadgeIcon }) {
  const s = { fill: '#fff', stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  switch (icon) {
    case 'pattern':
      return (
        <g>
          <circle cx="34" cy="40" r="6" {...s} />
          <rect x="44" y="34" width="12" height="12" rx="2" {...s} />
          <circle cx="66" cy="40" r="6" {...s} />
        </g>
      );
    case 'memory':
      return (
        <g>
          <rect x="34" y="28" width="16" height="22" rx="3" {...s} />
          <rect x="50" y="28" width="16" height="22" rx="3" {...s} transform="rotate(10 58 39)" />
        </g>
      );
    case 'maze':
      return (
        <path d="M33 28 H67 V52 H41 V36 H59 V44" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      );
    case 'steady':
      // Ba bậc thang: tiến bộ từng bước
      return <path d="M32 52 V44 H42 V36 H52 V28 H68 V52 Z" {...s} />;
    case 'explorer':
      return (
        <g>
          <circle cx="50" cy="40" r="13" {...s} />
          <path d="M50 30 L54 40 L50 50 L46 40 Z" fill={INK} />
        </g>
      );
    case 'star':
      return <path d="M50 26l4.3 8.8 9.7 1.4-7 6.8 1.7 9.6L50 48l-8.7 4.6 1.7-9.6-7-6.8 9.7-1.4L50 26z" {...s} />;
  }
}

type Props = { icon: BadgeIcon; earned?: boolean; size?: number };

export default function MiloBadge({ icon, earned = true, size = 72 }: Props) {
  const fill = earned ? FILL[icon] : '#e6ebf3';
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" className={`milo-badge${earned ? '' : ' is-locked'}`}>
      {/* Dải ruy băng */}
      <path d="M34 62 L26 94 L38 88 L44 98 L50 70 Z" fill={earned ? '#f5b82e' : '#d5deea'} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M66 62 L74 94 L62 88 L56 98 L50 70 Z" fill={earned ? '#f5b82e' : '#d5deea'} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="50" cy="40" r="33" fill={fill} stroke={INK} strokeWidth="3" strokeDasharray={earned ? undefined : '6 5'} />
      <circle cx="50" cy="40" r="25" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2.5" />
      {earned ? <Glyph icon={icon} /> : <path d="M42 40 V35 a8 8 0 0 1 16 0 V40 M39 40 H61 V54 H39 Z" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />}
    </svg>
  );
}

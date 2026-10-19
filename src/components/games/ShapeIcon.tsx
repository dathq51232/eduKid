import { COLOR_HEX, type Direction, type Shape, type ShapeColor } from '@/lib/games/shapes';

const INK = '#1f2a44';

/** Đường vẽ của từng hình trong khung 40 × 40 */
export function ShapePath({ shape, fill }: { shape: Shape; fill: string }) {
  const p = { fill, stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  switch (shape) {
    case 'circle':
      return <circle cx="20" cy="20" r="14" {...p} />;
    case 'square':
      return <rect x="7" y="7" width="26" height="26" rx="4" {...p} />;
    case 'triangle':
      return <path d="M20 5 L35 33 H5 Z" {...p} />;
    case 'star':
      return <path d="M20 4l4.6 9.6 10.4 1.4-7.6 7.2 1.9 10.4L20 27.6l-9.3 5 1.9-10.4L5 15l10.4-1.4L20 4z" {...p} />;
    case 'heart':
      return <path d="M20 34 C 8 26 4 19 6 13 C 8 7 16 6 20 12 C 24 6 32 7 34 13 C 36 19 32 26 20 34 Z" {...p} />;
    case 'diamond':
      return <path d="M20 4 L35 20 L20 36 L5 20 Z" {...p} />;
    case 'hexagon':
      return <path d="M12 6 H28 L36 20 L28 34 H12 L4 20 Z" {...p} />;
    case 'moon':
      return <path d="M27 6 C 16 6 8 13 8 21 C 8 29 15 35 24 35 C 29 35 33 33 35 29 C 25 31 18 25 18 18 C 18 12 21 8 27 6 Z" {...p} />;
    case 'drop':
      return <path d="M20 4 C 26 13 32 19 32 25 C 32 31 27 36 20 36 C 13 36 8 31 8 25 C 8 19 14 13 20 4 Z" {...p} />;
    case 'plus':
      return <path d="M15 5 H25 V15 H35 V25 H25 V35 H15 V25 H5 V15 H15 Z" {...p} />;
  }
}

type Props = {
  shape: Shape;
  color: ShapeColor;
  size?: number;
  /** Có nhãn thì hình được đọc cho trình đọc màn hình; không có thì là hình trang trí */
  label?: string;
};

export default function ShapeIcon({ shape, color, size = 40, label }: Props) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className="shape-icon"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <ShapePath shape={shape} fill={COLOR_HEX[color]} />
    </svg>
  );
}

/** Mũi tên chỉ hướng (dùng cho quy luật xoay) */
export function ArrowIcon({ dir, color, size = 40, label }: { dir: Direction; color: ShapeColor; size?: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className="shape-icon"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g transform={`rotate(${dir * 90} 20 20)`}>
        <path
          d="M20 4 L34 19 H25 V36 H15 V19 H6 Z"
          fill={COLOR_HEX[color]}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

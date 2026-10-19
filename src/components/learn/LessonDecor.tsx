import type { SubjectCode } from '@/lib/types';

// Nền trang làm bài theo môn: họa tiết mờ ở hai bên mép + viền nét đứt mờ quanh màn hình.
// Nằm SAU nội dung (z-index âm, không nhận chạm), nên không bao giờ che câu hỏi.
// Họa tiết chỉ trôi nhẹ khi bật hiệu ứng và máy không bật "giảm chuyển động".

const INK = '#1f2a44';
type Motif = { x: number; y: number; size: number; rot?: number; el: React.ReactNode };

const digit = (t: string, color: string) => (
  <text x="20" y="31" textAnchor="middle" fontSize="34" fontWeight="900" fill={color} fontFamily="var(--font-display), sans-serif">{t}</text>
);
const shape = (kind: 'circle' | 'square' | 'tri' | 'star', color: string) => {
  const p = { fill: color, stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  if (kind === 'circle') return <circle cx="20" cy="20" r="13" {...p} />;
  if (kind === 'square') return <rect x="7" y="7" width="26" height="26" rx="5" {...p} />;
  if (kind === 'tri') return <path d="M20 5 L35 33 H5Z" {...p} />;
  return <path d="M20 4l4.6 9.6 10.4 1.4-7.6 7.2 1.9 10.4L20 27.6l-9.3 5 1.9-10.4L5 15l10.4-1.4L20 4z" {...p} />;
};
const letter = (t: string, color: string) => (
  <text x="20" y="31" textAnchor="middle" fontSize="32" fontWeight="700" fill={color} fontFamily="Georgia, 'Times New Roman', serif">{t}</text>
);
const pencil = (color: string) => (
  <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
    <rect x="4" y="14" width="24" height="10" rx="2" fill={color} />
    <path d="M28 14 L38 19 L28 24Z" fill="#f2d3a7" />
    <rect x="0" y="14" width="5" height="10" rx="1.5" fill="#e2483d" />
  </g>
);
const balloon = (t: string, color: string) => (
  <g>
    <path d="M20 34 Q16 42 22 48" fill="none" stroke={INK} strokeWidth="1.6" />
    <ellipse cx="20" cy="18" rx="14" ry="17" fill={color} stroke={INK} strokeWidth="2.2" />
    <text x="20" y="24" textAnchor="middle" fontSize="16" fontWeight="900" fill="#fff" fontFamily="var(--font-display), sans-serif">{t}</text>
  </g>
);

const C = { red: '#e2483d', blue: '#2f6fed', green: '#1f9d6b', yellow: '#f5b82e', purple: '#8b5cf6', orange: '#f08a24' };

// Vị trí theo % màn hình: cột trái (x ≤ 6) và cột phải (x ≥ 92), để chừa giữa cho nội dung
const SETS: Record<SubjectCode, { tint: string; motifs: Motif[] }> = {
  toan: {
    tint: 'rgba(47, 111, 237, .16)',
    motifs: [
      { x: 2, y: 16, size: 56, el: digit('3', C.blue) },
      { x: 4, y: 38, size: 40, el: shape('circle', C.yellow) },
      { x: 1.5, y: 56, size: 50, el: digit('+', C.purple) },
      { x: 4, y: 74, size: 42, el: shape('tri', C.red) },
      { x: 2, y: 90, size: 54, el: digit('9', C.orange) },
      { x: 94, y: 20, size: 58, el: digit('7', C.red) },
      { x: 92, y: 40, size: 40, rot: 14, el: shape('square', C.blue) },
      { x: 95, y: 58, size: 54, el: digit('5', C.green) },
      { x: 92.5, y: 76, size: 40, el: shape('star', C.yellow) },
      { x: 95, y: 92, size: 48, el: digit('=', C.blue) },
    ],
  },
  'tieng-viet': {
    tint: 'rgba(226, 72, 61, .15)',
    motifs: [
      { x: 2, y: 16, size: 54, el: letter('Ă', C.red) },
      { x: 3.5, y: 36, size: 50, rot: 25, el: pencil('#2f6fed') },
      { x: 2, y: 56, size: 50, el: letter('b', C.green) },
      { x: 4, y: 76, size: 46, el: letter('ơ', C.purple) },
      { x: 2, y: 92, size: 48, el: letter('đ', C.orange) },
      { x: 94, y: 18, size: 52, el: letter('ê', C.blue) },
      { x: 92, y: 38, size: 52, rot: -30, el: pencil('#ffc83d') },
      { x: 95, y: 58, size: 54, el: letter('Ư', C.purple) },
      { x: 92.5, y: 76, size: 46, el: letter('g', C.red) },
      { x: 95, y: 92, size: 48, el: letter('â', C.green) },
    ],
  },
  'tieng-anh': {
    tint: 'rgba(139, 92, 246, .17)',
    motifs: [
      { x: 2, y: 18, size: 54, el: balloon('A', C.red) },
      { x: 4.5, y: 44, size: 46, el: balloon('C', C.green) },
      { x: 2, y: 70, size: 50, el: balloon('E', C.orange) },
      { x: 3.5, y: 92, size: 42, el: shape('star', C.yellow) },
      { x: 94, y: 22, size: 52, el: balloon('B', C.blue) },
      { x: 92, y: 48, size: 46, el: balloon('D', C.purple) },
      { x: 95, y: 72, size: 50, el: balloon('Z', C.yellow) },
      { x: 92.5, y: 92, size: 40, el: shape('circle', C.blue) },
    ],
  },
};

export default function LessonDecor({ subject, animate }: { subject: SubjectCode; animate: boolean }) {
  const set = SETS[subject] ?? SETS.toan;
  return (
    <div className={`lesson-decor${animate ? ' is-animated' : ''}`} aria-hidden="true">
      <div className="lesson-decor-frame" style={{ borderColor: set.tint }} />
      {set.motifs.map((m, i) => (
        <svg
          key={i}
          className="lesson-decor-motif"
          viewBox="0 0 40 50"
          width={m.size}
          height={m.size * 1.25}
          style={{ left: `${m.x}%`, top: `${m.y}%`, ['--rot' as string]: `${m.rot ?? 0}deg`, ['--d' as string]: `${(i % 5) * 0.9}s` }}
        >
          {m.el}
        </svg>
      ))}
    </div>
  );
}

import MiloMascot, { type MiloVariant } from '@/components/mascot/MiloMascot';

export type StopStatus = 'todo' | 'skipped' | 'correct' | 'wrong' | 'timeout';
export type TrailMood = 'idle' | 'jump' | 'tilt';

const INK = '#1f2a44';
const H = 140;
const STAR = (x: number, y: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};

/** Vị trí các chặng trên con đường uốn lượn (cùng công thức cho mọi số câu) */
export function stopPoints(n: number, W = 1000): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    return { x: 46 + t * (W - 120), y: 104 + 18 * Math.sin(t * Math.PI * 2.2) };
  });
}

/**
 * Đường tiến độ: mỗi câu là một chặng; câu đúng có ngôi sao vàng; Milo đứng ở câu đang làm.
 * Trả lời đúng: Milo nhảy lên + "Giỏi quá!"; chưa đúng: Milo nghiêng đầu động viên. Cờ đỏ ở đích.
 */
type Props = { statuses: StopStatus[]; current: number; mood: TrailMood; message?: string; variant?: MiloVariant };

/** Một bản vẽ con đường với chiều rộng W (bản rộng cho máy tính / iPad, bản hẹp cho điện thoại để Milo đủ to) */
function Road({ statuses, current, mood, message, variant, W }: Props & { W: number }) {
  const pts = stopPoints(statuses.length, W);
  const flag = { x: W - 40, y: pts.length ? pts[pts.length - 1].y - 6 : 70 };
  const all = [{ x: 14, y: pts[0]?.y ?? 70 }, ...pts, flag];
  let d = `M${all[0].x} ${all[0].y}`;
  for (let i = 1; i < all.length; i++) {
    const a = all[i - 1], b = all[i], mx = (a.x + b.x) / 2;
    d += ` C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
  }
  const cur = pts[Math.max(0, Math.min(current, pts.length - 1))];
  const bubbleLeft = cur && cur.x > W - 300;
  return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className={W < 800 ? 'is-narrow' : 'is-wide'}>
        <path d={d} fill="none" stroke="#e7d7b4" strokeWidth="20" strokeLinecap="round" />
        <path d={d} fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="10 12" strokeLinecap="round" />
        {pts.map((p, i) => {
          const s = statuses[i];
          const isCur = i === current;
          if (s === 'correct')
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="13" fill="#ffc83d" stroke={INK} strokeWidth="2.5" />
                <path d={STAR(p.x, p.y, 8)} fill="#f5b82e" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
              </g>
            );
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isCur ? 14 : 11}
                fill={isCur ? '#e3f8ea' : '#fff'}
                stroke={isCur ? '#1f9d6b' : s === 'wrong' || s === 'timeout' ? '#c58a00' : INK}
                strokeWidth={isCur ? 3.5 : 2.5}
                strokeDasharray={s === 'skipped' ? '4 3' : undefined}
              />
              {!isCur && (s === 'wrong' || s === 'timeout' || s === 'skipped') && (
                <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize="12" fontWeight="800" fill="#8a93a8">{i + 1}</text>
              )}
            </g>
          );
        })}
        <g>
          <path d={`M${flag.x} ${flag.y - 34} v36 M${flag.x} ${flag.y - 34} h24 l-6 7 l6 7 h-24`} fill="#e2483d" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
        {cur && (
          <g className={`milo-trail-milo is-${mood}`} style={{ transformOrigin: `${cur.x}px ${cur.y}px` }}>
            <ellipse cx={cur.x} cy={cur.y + 2} rx="18" ry="5" fill={INK} opacity=".16" />
            <MiloMascot x={cur.x - 50} y={cur.y - 104} size={100} variant={variant} />
          </g>
        )}
        {cur && message && (
          <g className="milo-trail-bubble" transform={`translate(${bubbleLeft ? cur.x - 276 : cur.x + 52} ${cur.y - 96})`}>
            <rect width="224" height="44" rx="16" fill="#fff" stroke={INK} strokeWidth="2.5" />
            <text x="112" y="29" textAnchor="middle" fontSize="21" fontWeight="800" fill={INK}>{message}</text>
          </g>
        )}
      </svg>
  );
}

export default function MiloTrail(props: Props) {
  const done = props.statuses.filter((s) => s === 'correct').length;
  return (
    <div className="milo-trail" role="img" aria-label={`Đường tiến độ: câu ${props.current + 1} trên ${props.statuses.length}, đã đúng ${done} câu.`}>
      <Road {...props} W={1000} />
      <Road {...props} W={560} />
    </div>
  );
}

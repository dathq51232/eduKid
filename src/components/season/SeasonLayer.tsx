'use client';

// Lớp trang trí theo mùa lễ — gắn một lần ở layout gốc. Mùa nào đang bật do script trong layout quyết định (data-season).
// Hạt rơi là các thẻ HTML riêng, chỉ animate transform/opacity; không setState theo khung hình.
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';
import { SEASON_HIDDEN_PATHS, SEASON_QUIET_PATHS, audienceOf, type Season } from '@/lib/seasons';
import { setSeasonFx, useSeason, useSeasonFx } from '@/lib/use-season';
import '@/styles/ssn.css';

// Vị trí cố định (không random) để lần nào vẽ cũng giống nhau: [left %, thời gian rơi (s), trễ (s), cỡ (px)]
const DROPS: [number, number, number, number][] = [
  [4, 14, 0, 22], [12, 18, 6, 14], [21, 12, 3, 18], [30, 16, 9, 12], [39, 20, 1, 20], [48, 13, 7, 14],
  [57, 17, 4, 24], [66, 15, 10, 13], [74, 19, 2, 19], [83, 14, 8, 15], [91, 18, 5, 21], [97, 16, 11, 12],
];
const CONFETTI = ['#ff6b6b', '#ffc83d', '#22c55e', '#7dd3fc', '#8b5cf6', '#ff8fd1'];

function Particles({ s }: { s: Season }) {
  if (s.effect === 'none') return null;
  return (
    <div className={`ssn-fall is-${s.effect}`} aria-hidden="true">
      {DROPS.map(([x, dur, delay, size], i) => {
        const style = { left: `${x}%`, width: size, height: size, ['--ssn-d' as string]: `${dur}s`, ['--ssn-delay' as string]: `${-delay}s` };
        if (s.effect === 'confetti') return <i key={i} className="ssn-p ssn-conf" style={{ ...style, background: CONFETTI[i % CONFETTI.length] }} />;
        const src = s.particles?.[i % s.particles.length];
        if (s.effect === 'snow' && (!src || i % 3 !== 0)) {
          const dot = Math.round(size / 2.5) + 4;
          return <i key={i} className="ssn-p ssn-dot" style={{ ...style, width: dot, height: dot }} />;
        }
        if (!src) return null;
        // eslint-disable-next-line @next/next/no-img-element
        return <img key={i} src={src} alt="" className="ssn-p ssn-img" style={style} decoding="async" loading="lazy" draggable={false} />;
      })}
    </div>
  );
}

export default function SeasonLayer() {
  const season = useSeason();
  const fx = useSeasonFx();
  const path = usePathname() ?? '/';
  const [open, setOpen] = useState(false);

  // Lời chào của Milo: mở ra một lần mỗi phiên cho mỗi mùa, tự thu gọn sau vài giây
  useEffect(() => {
    if (!season) return;
    const key = `educhain-season-greet-${season.id}`;
    let seen = false;
    try { seen = sessionStorage.getItem(key) === '1'; sessionStorage.setItem(key, '1'); } catch { /* bỏ qua */ }
    if (seen) return;
    const a = window.setTimeout(() => setOpen(true), 600);
    const b = window.setTimeout(() => setOpen(false), 9000);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [season]);

  if (!season || SEASON_HIDDEN_PATHS.some((p) => path.includes(p))) return null;
  const quiet = SEASON_QUIET_PATHS.some((p) => path.startsWith(p));
  const greet = season.greet[audienceOf(path)];

  return (
    <>
      {fx && !quiet && <Particles s={season} />}
      <div className={`ssn-chip${open ? ' is-open' : ''}`} role="status">
        <button type="button" className="ssn-chip-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}
          aria-label={open ? 'Thu gọn lời chào' : `${season.name} — xem lời chào của Milo`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={season.icon} alt="" width={30} height={30} draggable={false} />
        </button>
        {open && (
          <div className="ssn-chip-body">
            <b>{season.name}</b>
            <span>{greet}</span>
            <button type="button" className="ssn-fx" onClick={() => setSeasonFx(!fx)}>
              <Sparkles aria-hidden="true" /> {fx ? 'Tắt hiệu ứng' : 'Bật hiệu ứng'}
            </button>
          </div>
        )}
        {open && (
          <button type="button" className="ssn-x" onClick={() => setOpen(false)} aria-label="Đóng">
            <X aria-hidden="true" />
          </button>
        )}
      </div>
    </>
  );
}

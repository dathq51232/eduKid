'use client';

// "Thế giới của em": cảnh nền theo chủ đề (Vũ trụ, Rừng xanh, Đại dương, Vương quốc kẹo), icon chủ đề, bộ chọn và Milo theo chủ đề.
// Cảnh là một SVG tĩnh; mọi chuyển động (sao lấp lánh, bong bóng, đồ vật trôi) là phần tử HTML riêng chỉ đổi transform/opacity.
import { useEffect, useState } from 'react';
import { Check, Palette, X } from 'lucide-react';
import MiloMascot, { type MiloVariant } from '@/components/mascot/MiloMascot';
import { KID_THEMES, kidTheme, saveKidTheme, useKidTheme, type KidThemeId } from '@/lib/kid-theme';

/* ---------------- Cảnh nền toàn màn hình ---------------- */

const STARS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 397) % 1600, y: (i * 233) % 640, r: 1 + (i % 3) * 0.8, o: 0.45 + ((i * 7) % 5) / 10 }));

function SpaceScene() {
  return (
    <>
      <defs>
        <radialGradient id="kwSpace" cx=".5" cy=".15" r="1">
          <stop offset="0" stopColor="#4a37a8" />
          <stop offset=".5" stopColor="#231a66" />
          <stop offset="1" stopColor="#0c0e2e" />
        </radialGradient>
        <radialGradient id="kwNeb1" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ff79d6" stopOpacity=".45" /><stop offset="1" stopColor="#ff79d6" stopOpacity="0" /></radialGradient>
        <radialGradient id="kwNeb2" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#4fc3ff" stopOpacity=".4" /><stop offset="1" stopColor="#4fc3ff" stopOpacity="0" /></radialGradient>
        <linearGradient id="kwPlanet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc46b" /><stop offset="1" stopColor="#ff5f8f" /></linearGradient>
        <linearGradient id="kwMoonGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7a68e6" /><stop offset="1" stopColor="#3b2d96" /></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#kwSpace)" />
      <ellipse cx="420" cy="260" rx="560" ry="260" fill="url(#kwNeb1)" />
      <ellipse cx="1240" cy="400" rx="520" ry="240" fill="url(#kwNeb2)" />
      {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />)}
      <g transform="translate(1390 170)">
        <circle r="72" fill="#f4f1ff" />
        <circle cx="-22" cy="-14" r="14" fill="#dcd5fb" />
        <circle cx="20" cy="18" r="20" fill="#dcd5fb" />
        <circle cx="26" cy="-30" r="8" fill="#dcd5fb" />
      </g>
      <g transform="translate(250 560) rotate(-16)">
        <path d="M-210 0 A210 46 0 0 1 210 0" fill="none" stroke="#ffe3a8" strokeWidth="16" opacity=".85" />
        <circle r="124" fill="url(#kwPlanet)" />
        <path d="M-118 -30 Q0 -6 118 -30" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="14" />
        <path d="M-122 26 Q0 50 122 26" fill="none" stroke="#c2185b" strokeOpacity=".25" strokeWidth="16" />
        <circle cx="-44" cy="-56" r="34" fill="#fff" opacity=".22" />
        <path d="M-210 0 A210 46 0 0 0 210 0" fill="none" stroke="#ffe3a8" strokeWidth="16" />
      </g>
      <path d="M0 790 Q380 735 800 778 T1600 760 L1600 900 L0 900 Z" fill="url(#kwMoonGround)" />
      {[[180, 830, 60], [560, 860, 38], [980, 820, 52], [1340, 850, 44]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r / 3.2} fill="#2c2178" opacity=".55" />
      ))}
    </>
  );
}

const LEAF = 'M0 0 C60 -46 170 -46 236 0 C170 46 60 46 0 0 Z';
function LeafFan({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  const angles = [-150, -122, -95, -68, -40];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      {angles.map((a, i) => (
        <g key={a} transform={`rotate(${a + 180})`}>
          <path d={LEAF} fill={i % 2 ? '#2f8f46' : '#3fae55'} />
          <path d="M8 0 L224 0" stroke="#226b34" strokeWidth="4" opacity=".5" />
        </g>
      ))}
    </g>
  );
}
function JungleScene() {
  return (
    <>
      <defs>
        <linearGradient id="kwJSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e4f8cf" /><stop offset=".6" stopColor="#bfe8a0" /><stop offset="1" stopColor="#93d273" /></linearGradient>
        <radialGradient id="kwJSun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff6b8" stopOpacity=".95" /><stop offset="1" stopColor="#fff6b8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#kwJSky)" />
      <circle cx="1220" cy="140" r="220" fill="url(#kwJSun)" />
      <path d="M0 560 Q160 470 330 540 T700 520 T1080 500 T1600 540 L1600 900 L0 900 Z" fill="#9fd884" />
      {[120, 330, 520, 760, 980, 1190, 1420].map((x, i) => (
        <g key={x} transform={`translate(${x} ${600 - (i % 3) * 18})`} fill={i % 2 ? '#5bb34f' : '#4aa045'}>
          <rect x="-10" y="0" width="20" height="120" fill="#8a5a33" />
          <circle cx="0" cy="-30" r="70" /><circle cx="-56" cy="6" r="52" /><circle cx="56" cy="6" r="52" />
        </g>
      ))}
      <path d="M0 720 Q400 670 800 708 T1600 700 L1600 900 L0 900 Z" fill="#6dbb4f" />
      {[[140, 0, 230], [430, 0, 160], [1160, 0, 200], [1470, 0, 260]].map(([x, , h], i) => (
        <g key={i}>
          <path d={`M${x} 0 Q${x + 26} ${h / 2} ${x} ${h}`} fill="none" stroke="#3f8f3a" strokeWidth="6" />
          {[0.3, 0.55, 0.8].map((t) => <ellipse key={t} cx={x + 14} cy={h * t} rx="16" ry="8" fill="#4fae4a" transform={`rotate(-30 ${x + 14} ${h * t})`} />)}
        </g>
      ))}
      <LeafFan x={-20} y={910} />
      <LeafFan x={1620} y={910} flip />
    </>
  );
}

function OceanScene() {
  return (
    <>
      <defs>
        <linearGradient id="kwSea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9be6ff" /><stop offset=".4" stopColor="#47b6ea" /><stop offset=".8" stopColor="#1977c4" /><stop offset="1" stopColor="#11589e" />
        </linearGradient>
        <linearGradient id="kwSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6dca3" /><stop offset="1" stopColor="#e3bd78" /></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#kwSea)" />
      {[[200, 90], [520, 70], [900, 110], [1260, 80]].map(([x, w], i) => (
        <polygon key={i} points={`${x},0 ${x + w},0 ${x + w * 3},900 ${x + w * 1.4},900`} fill="#fff" opacity=".1" />
      ))}
      <path d="M0 40 Q100 20 200 40 T400 40 T600 40 T800 40 T1000 40 T1200 40 T1400 40 T1600 40 L1600 0 L0 0 Z" fill="#c9f2ff" opacity=".7" />
      <path d="M0 780 Q300 730 640 770 T1260 750 T1600 770 L1600 900 L0 900 Z" fill="url(#kwSand)" />
      {[[110, 780, 1.2], [260, 800, 0.8], [1350, 770, 1.1], [1500, 800, 0.9], [760, 790, 0.7]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="none" strokeLinecap="round" strokeWidth="14">
          <path d="M0 0 C-30 -60 30 -110 0 -170 C-30 -220 20 -260 6 -300" stroke="#2fa86b" />
          <path d="M34 4 C10 -50 60 -90 36 -150" stroke="#3cc07c" />
        </g>
      ))}
      {[[420, 800, '#ff7f7f'], [1080, 780, '#ffad5c'], [1200, 805, '#ff8fc0']].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`} fill={c as string}>
          <circle r="26" /><circle cx="-30" cy="10" r="20" /><circle cx="30" cy="8" r="22" /><circle cx="0" cy="-30" r="18" />
        </g>
      ))}
      <ellipse cx="620" cy="815" rx="70" ry="28" fill="#8396ad" />
      <ellipse cx="930" cy="830" rx="46" ry="20" fill="#9aabbf" />
    </>
  );
}

const SPRINKLES = Array.from({ length: 46 }, (_, i) => ({ x: (i * 353) % 1600, y: 40 + ((i * 197) % 520), a: (i * 61) % 180, c: ['#ff6fa8', '#ffc83d', '#7dd3fc', '#a78bfa', '#4ade80'][i % 5] }));
function Lolly({ x, y, s, c }: { x: number; y: number; s: number; c: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-7" y="0" width="14" height="190" rx="7" fill="#fff" stroke="#f3c3d8" strokeWidth="3" />
      <circle cy="-10" r="72" fill={c} />
      <path d="M0 -10 m-52 0 a52 52 0 1 1 52 52 a38 38 0 1 1 -38 -38 a24 24 0 1 1 24 24" fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" opacity=".85" />
      <circle cx="-28" cy="-42" r="14" fill="#fff" opacity=".35" />
    </g>
  );
}
function CandyScene() {
  return (
    <>
      <defs>
        <linearGradient id="kwCSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe0f0" /><stop offset="1" stopColor="#fff2da" /></linearGradient>
        <pattern id="kwStripe" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="56" height="56" fill="#ff9cc6" /><rect width="26" height="56" fill="#fff" />
        </pattern>
        <pattern id="kwStripe2" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <rect width="48" height="48" fill="#a6e4ff" /><rect width="22" height="48" fill="#fff" />
        </pattern>
      </defs>
      <rect width="1600" height="900" fill="url(#kwCSky)" />
      {SPRINKLES.map((p, i) => <rect key={i} x={p.x} y={p.y} width="16" height="6" rx="3" fill={p.c} opacity=".7" transform={`rotate(${p.a} ${p.x + 8} ${p.y + 3})`} />)}
      {[[260, 140, 1], [1180, 110, 0.8], [760, 210, 0.6]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity=".9">
          <circle r="50" /><circle cx="56" cy="10" r="40" /><circle cx="-56" cy="12" r="38" /><circle cx="10" cy="-30" r="36" />
        </g>
      ))}
      <Lolly x={150} y={600} s={1} c="#ff7fb3" />
      <Lolly x={1460} y={580} s={1.1} c="#a78bfa" />
      <Lolly x={1250} y={680} s={0.7} c="#ffb84d" />
      <path d="M0 690 Q300 600 640 680 T1300 650 T1600 680 L1600 900 L0 900 Z" fill="url(#kwStripe2)" />
      <path d="M0 760 Q400 700 820 750 T1600 740 L1600 900 L0 900 Z" fill="url(#kwStripe)" />
      {[[380, 770, '#4ade80'], [560, 790, '#ffc83d'], [980, 772, '#7dd3fc'], [1110, 790, '#ff6fa8']].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M-34 0 Q-34 -46 0 -46 Q34 -46 34 0 Z" fill={c as string} />
          <ellipse cx="-10" cy="-30" rx="9" ry="6" fill="#fff" opacity=".5" />
        </g>
      ))}
    </>
  );
}

const TWINKLE = [[12, 10], [24, 30], [38, 8], [52, 22], [66, 12], [78, 34], [88, 8], [18, 48], [72, 50], [46, 40]];
const BUBBLES = [[8, 9], [16, 13], [27, 7], [41, 11], [58, 8], [69, 12], [80, 10], [92, 14], [35, 9], [86, 6]];

/** Cảnh nền cố định phía sau trang. page = trang thường (có lớp phủ dịu ở giữa cho chữ dễ đọc); không có = màn làm bài */
export function KidScene({ theme, motion = true, page = false }: { theme: KidThemeId; motion?: boolean; page?: boolean }) {
  if (theme === 'meadow') return null;
  const t = kidTheme(theme);
  return (
    <div className={`kw is-${theme}${motion ? ' is-live' : ''}${page ? ' is-page' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
        {theme === 'space' ? <SpaceScene /> : theme === 'jungle' ? <JungleScene /> : theme === 'ocean' ? <OceanScene /> : <CandyScene />}
      </svg>
      {theme === 'space' && TWINKLE.map(([x, y], i) => <i key={i} className="kw-tw" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.7}s` }} />)}
      {theme === 'ocean' && BUBBLES.map(([x, d], i) => <i key={i} className="kw-bub" style={{ left: `${x}%`, animationDuration: `${d}s`, animationDelay: `${-(i * 1.3)}s`, width: 10 + (i % 3) * 8, height: 10 + (i % 3) * 8 }} />)}
      {page && <span className="kw-wash" />}
      {t.floaters.map((f, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={f.src} alt="" width={f.s} height={f.s} className={`kw-fl${f.keep ? ' is-keep' : ''}`} decoding="async" draggable={false}
          style={{ left: `${f.x}%`, top: `${f.y}%`, ['--kw-d' as string]: `${f.d}s`, ['--kw-delay' as string]: `${-i * 1.1}s` }} />
      ))}
    </div>
  );
}

/** Đặt cảnh theo chủ đề đã chọn cho trang Của em / Chọn bài (Đồng cỏ = giao diện quen thuộc, không thêm gì) */
export default function KidWorld() {
  const theme = useKidTheme();
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'meadow') delete el.dataset.kid;
    else el.dataset.kid = theme;
    return () => { delete el.dataset.kid; };
  }, [theme]);
  return <KidScene theme={theme} page />;
}

/** Milo mặc đồ hợp chủ đề (Vũ trụ → phi hành gia, Kẹo → hoạ sĩ); chủ đề khác giữ trang phục theo môn */
export function ThemedMilo({ size, fallback = 'default', className }: { size: number; fallback?: MiloVariant; className?: string }) {
  const theme = useKidTheme();
  return <MiloMascot size={size} variant={kidTheme(theme).milo ?? fallback} className={className} />;
}

/* ---------------- Icon chủ đề ---------------- */

function BadgeArt({ id }: { id: KidThemeId }) {
  const g = `ktg-${id}`;
  switch (id) {
    case 'space':
      return (
        <>
          <defs><radialGradient id={g} cx=".3" cy=".2" r="1.1"><stop offset="0" stopColor="#6b55e6" /><stop offset=".55" stopColor="#30238c" /><stop offset="1" stopColor="#140f45" /></radialGradient></defs>
          <rect width="120" height="120" rx="30" fill={`url(#${g})`} />
          {[[18, 20, 1.6], [96, 16, 1.2], [104, 52, 1.8], [12, 64, 1.1], [62, 12, 1], [84, 96, 1.4], [30, 100, 1]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" />)}
          <path d="M98 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffe17a" />
          <g transform="translate(26 34) rotate(-18)">
            <ellipse rx="20" ry="5" fill="none" stroke="#ffe3a8" strokeWidth="3" />
            <circle r="11" fill="#ff8a7a" />
            <path d="M-20 0 A20 5 0 0 0 20 0" fill="none" stroke="#ffe3a8" strokeWidth="3" />
          </g>
          <path d="M0 98 Q30 88 60 96 T120 92 L120 120 L0 120Z" fill="#5b49d6" opacity=".7" />
        </>
      );
    case 'jungle':
      return (
        <>
          <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9f7b8" /><stop offset="1" stopColor="#5fbf4a" /></linearGradient></defs>
          <rect width="120" height="120" rx="30" fill={`url(#${g})`} />
          <circle cx="92" cy="26" r="13" fill="#ffe36b" /><circle cx="92" cy="26" r="20" fill="#ffe36b" opacity=".3" />
          {[[-8, 118, -60, '#2f8f46'], [-8, 118, -30, '#3fae55'], [128, 118, -120, '#2f8f46'], [128, 118, -150, '#3fae55'], [-6, 10, 30, '#3fae55'], [126, 6, 150, '#2f8f46']].map(([x, y, a, c], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
              <path d="M0 0 C14 -12 40 -12 56 0 C40 12 14 12 0 0Z" fill={c as string} />
              <path d="M3 0 L52 0" stroke="#1f6b33" strokeWidth="1.5" opacity=".6" />
            </g>
          ))}
        </>
      );
    case 'ocean':
      return (
        <>
          <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a6ecff" /><stop offset=".55" stopColor="#3aa9e6" /><stop offset="1" stopColor="#1468b8" /></linearGradient></defs>
          <rect width="120" height="120" rx="30" fill={`url(#${g})`} />
          <path d="M0 26 Q15 18 30 26 T60 26 T90 26 T120 26" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="4" />
          <path d="M0 40 Q15 32 30 40 T60 40 T90 40 T120 40" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="3" />
          {[[20, 70, 5], [28, 56, 3], [100, 64, 6], [92, 84, 3.5], [16, 92, 3]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" fillOpacity=".25" stroke="#fff" strokeOpacity=".8" strokeWidth="1.5" />)}
          <path d="M0 104 Q30 96 60 102 T120 100 L120 120 L0 120Z" fill="#f4d79b" />
        </>
      );
    case 'candy':
      return (
        <>
          <defs>
            <linearGradient id={g} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc7e1" /><stop offset="1" stopColor="#ffe6bf" /></linearGradient>
            <pattern id={`${g}-s`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="7" height="16" fill="#fff" opacity=".45" /></pattern>
          </defs>
          <rect width="120" height="120" rx="30" fill={`url(#${g})`} />
          <rect width="120" height="120" rx="30" fill={`url(#${g}-s)`} />
          {[[18, 22, 30, '#ff6fa8'], [98, 18, -20, '#7dd3fc'], [106, 70, 60, '#a78bfa'], [14, 76, -40, '#4ade80'], [60, 14, 10, '#ffc83d'], [30, 104, 20, '#ff6fa8'], [90, 104, -30, '#ffc83d']].map(([x, y, a, c], i) => (
            <rect key={i} x={(x as number) - 6} y={(y as number) - 2.5} width="12" height="5" rx="2.5" fill={c as string} transform={`rotate(${a} ${x} ${y})`} />
          ))}
        </>
      );
    default:
      return (
        <>
          <defs><linearGradient id={g} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7cc8ff" /><stop offset="1" stopColor="#dff3ff" /></linearGradient></defs>
          <rect width="120" height="120" rx="30" fill={`url(#${g})`} />
          <circle cx="94" cy="24" r="12" fill="#ffd84a" /><circle cx="94" cy="24" r="19" fill="#ffd84a" opacity=".3" />
          <g fill="#fff" opacity=".95"><circle cx="24" cy="30" r="9" /><circle cx="34" cy="27" r="11" /><circle cx="44" cy="31" r="8" /></g>
          <path d="M0 88 Q30 70 62 84 T120 80 L120 120 L0 120Z" fill="#9adb7a" />
          <path d="M0 100 Q40 88 76 98 T120 96 L120 120 L0 120Z" fill="#5fb348" />
          {[[16, 106, '#ff8fb1'], [44, 112, '#fff'], [98, 108, '#ffd23f']].map(([x, y, c], i) => <circle key={i} cx={x} cy={y} r="3.2" fill={c as string} />)}
        </>
      );
  }
}

/** Icon chủ đề: ô cảnh vẽ tay + nhân vật 3D bật ra khỏi khung */
export function ThemeBadge({ id, size = 96 }: { id: KidThemeId; size?: number }) {
  const t = kidTheme(id);
  return (
    <span className={`kt-badge is-${id}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="kt-bg">
        <BadgeArt id={id} />
        <ellipse cx="38" cy="16" rx="30" ry="9" fill="#fff" opacity=".28" />
        <rect x="1.5" y="1.5" width="117" height="117" rx="28.5" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.side} alt="" className="kt-side" decoding="async" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.hero} alt="" className="kt-hero" decoding="async" draggable={false} />
    </span>
  );
}

/** Lưới chọn chủ đề (radio) */
export function KidThemePicker({ compact = false }: { compact?: boolean }) {
  const theme = useKidTheme();
  return (
    <div className={`kt-grid${compact ? ' is-compact' : ''}`} role="radiogroup" aria-label="Chọn thế giới của em">
      {KID_THEMES.map((t) => {
        const on = t.id === theme;
        return (
          <button key={t.id} type="button" role="radio" aria-checked={on} className={`kt-card${on ? ' is-on' : ''}`}
            style={{ ['--kt-c' as string]: t.color }} onClick={() => saveKidTheme(t.id)}>
            <ThemeBadge id={t.id} size={compact ? 76 : 92} />
            <b>{t.name}</b>
            {!compact && <small>{t.tag}</small>}
            {on && <span className="kt-check" aria-hidden="true"><Check strokeWidth={3} /></span>}
          </button>
        );
      })}
    </div>
  );
}

/** Mục "Thế giới của em" trên trang Của em */
export function KidThemeSection() {
  return (
    <section className="dash-section kt-section" id="the-gioi" aria-labelledby="kt-title">
      <h2 id="kt-title"><Palette aria-hidden="true" /> Thế giới của em</h2>
      <p className="dash-muted">Chọn khung cảnh em thích. Trang Của em, Chọn bài và Làm bài sẽ đổi theo, Milo cũng thay trang phục cho hợp!</p>
      <KidThemePicker />
    </section>
  );
}

/** Nút nhỏ mở bộ chọn chủ đề (trang Chọn bài) */
export function KidThemeButton() {
  const [open, setOpen] = useState(false);
  const theme = useKidTheme();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <>
      <button type="button" className="kt-open" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <ThemeBadge id={theme} size={30} /> Thế giới của em
      </button>
      {open && (
        <div className="kt-pop" role="dialog" aria-modal="true" aria-labelledby="kt-pop-t" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="kt-pop-box">
            <header>
              <h2 id="kt-pop-t"><Palette aria-hidden="true" /> Thế giới của em</h2>
              <button type="button" className="kt-pop-x" onClick={() => setOpen(false)} aria-label="Đóng" autoFocus><X aria-hidden="true" /></button>
            </header>
            <KidThemePicker compact />
          </div>
        </div>
      )}
    </>
  );
}

// Hình minh họa trang chủ theo bộ nhận diện EduChain Kids — vẽ bằng SVG ngay trong mã (không tải ảnh từ ngoài).

type P = { className?: string };

export function Cloud({ className }: P) {
  return (
    <svg aria-hidden="true" viewBox="0 0 220 110" className={className}>
      <path d="M38 96c-20 0-32-14-30-30 2-15 16-24 31-22 3-20 21-34 42-32 15 1 27 10 33 22 7-9 19-14 31-12 19 3 31 19 29 37 14 1 26 13 26 27 0 6-3 10-8 10H38z" fill="currentColor" />
    </svg>
  );
}

/** Đồi cỏ phía dưới khung hero */
export function Hills({ className }: P) {
  return (
    <svg aria-hidden="true" viewBox="0 0 800 120" preserveAspectRatio="none" className={className}>
      <path d="M0 70c120-50 240-50 360-10s240 30 440-30v90H0z" fill="var(--hill-back)" />
      <path d="M0 96c160-40 300-30 430 0s250 20 370-20v44H0z" fill="var(--hill-front)" />
    </svg>
  );
}

/** Bảng phấn "Cùng nhau tiến bộ!" */
export function Chalkboard({ className }: P) {
  return (
    <svg viewBox="0 0 200 120" className={className} role="img" aria-label="Bảng: Cùng nhau tiến bộ!">
      <rect x="4" y="4" width="192" height="104" rx="10" fill="#8a5a34" />
      <rect x="14" y="14" width="172" height="84" rx="6" fill="#1f5b45" />
      <text x="100" y="50" textAnchor="middle" fontSize="22" fontWeight="700" fill="#f4f7ef" fontFamily="var(--font-display, 'Quicksand'), sans-serif">Cùng nhau</text>
      <text x="100" y="80" textAnchor="middle" fontSize="22" fontWeight="700" fill="#f4f7ef" fontFamily="var(--font-display, 'Quicksand'), sans-serif">tiến bộ!</text>
      <path d="M60 108v10M140 108v10" stroke="#8a5a34" strokeWidth="6" />
    </svg>
  );
}

/** Nền hero: trời xanh, mây, hàng cây, bãi cỏ, lối đi, hoa — màu lấy từ biến CSS nên có cả bản ban ngày và ban đêm */
export function GardenScene({ className }: P) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gs-sky-1)" />
          <stop offset="1" stopColor="var(--gs-sky-2)" />
        </linearGradient>
        <linearGradient id="gs-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gs-grass-1)" />
          <stop offset="1" stopColor="var(--gs-grass-2)" />
        </linearGradient>
        <radialGradient id="gs-sun" cx="80%" cy="10%" r="45%">
          <stop offset="0" stopColor="var(--gs-glow)" stopOpacity=".9" />
          <stop offset="1" stopColor="var(--gs-glow)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gs-leaf" cx="40%" cy="30%" r="70%">
          <stop offset="0" stopColor="var(--gs-leaf-1)" />
          <stop offset="1" stopColor="var(--gs-leaf-2)" />
        </radialGradient>
      </defs>
      <rect width="1200" height="520" fill="url(#gs-sky)" />
      <rect width="1200" height="520" fill="url(#gs-sun)" />
      {/* mây */}
      <g fill="var(--gs-cloud)">
        <path d="M640 120c-18 0-30-12-28-26 2-12 14-20 28-18 4-18 20-28 38-26 13 1 23 9 28 19 6-7 16-11 26-9 16 3 26 16 25 32 12 1 22 11 22 22 0 4-2 6-6 6z" opacity=".95" />
        <path d="M900 70c-14 0-24-10-22-21 2-10 11-16 22-14 3-14 16-22 30-20 10 1 18 7 22 15 5-5 12-8 20-7 13 2 21 13 20 25 10 1 18 9 18 17 0 3-2 5-5 5z" opacity=".9" />
        <path d="M380 60c-12 0-20-8-19-17 2-8 9-13 19-12 2-12 13-19 25-17 8 1 15 6 18 12 4-4 10-6 16-5 11 2 17 11 16 21 8 1 15 7 15 14 0 2-1 4-4 4z" opacity=".85" />
      </g>
      {/* đồi xa */}
      <path d="M0 340c140-40 300-50 460-30s320 10 470-24 220-20 270 0v234H0z" fill="var(--gs-hill)" />
      {/* hàng cây xa */}
      <g fill="var(--gs-far-tree)">
        <circle cx="500" cy="318" r="34" /><circle cx="540" cy="306" r="40" /><circle cx="584" cy="320" r="30" />
        <circle cx="760" cy="312" r="30" /><circle cx="796" cy="300" r="38" />
      </g>
      {/* cây lớn bên phải */}
      <g>
        <rect x="1052" y="190" width="30" height="170" rx="12" fill="var(--gs-trunk)" />
        <path d="M1066 260c-20-10-34-26-38-44M1068 240c20-8 32-22 36-38" stroke="var(--gs-trunk)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <g fill="url(#gs-leaf)">
          <circle cx="1010" cy="120" r="70" /><circle cx="1100" cy="90" r="84" /><circle cx="1170" cy="160" r="70" />
          <circle cx="1060" cy="190" r="62" /><circle cx="960" cy="190" r="50" /><circle cx="1150" cy="40" r="60" />
        </g>
      </g>
      {/* lá cây góc trái trên */}
      <g fill="url(#gs-leaf)" opacity=".95">
        <circle cx="-10" cy="10" r="80" /><circle cx="70" cy="-20" r="60" /><circle cx="30" cy="70" r="40" />
      </g>
      {/* bãi cỏ */}
      <path d="M0 388c180-30 380-30 560-8s420 22 640-16v156H0z" fill="url(#gs-grass)" />
      {/* lối đi */}
      <path d="M470 520c30-50 90-86 170-104 60-14 120-20 190-26-60 14-110 26-150 46-50 26-80 54-96 84z" fill="var(--gs-path)" />
      {/* bụi cây */}
      <g fill="var(--gs-bush)">
        <circle cx="920" cy="400" r="34" /><circle cx="956" cy="388" r="40" /><circle cx="998" cy="402" r="30" />
        <circle cx="70" cy="420" r="30" /><circle cx="104" cy="410" r="36" />
      </g>
      {/* hoa */}
      <g>
        {[[90, 470, '#ff8fb1'], [140, 488, '#ffd34d'], [210, 470, '#ffffff'], [330, 500, '#ff8fb1'], [860, 470, '#ffd34d'], [1010, 486, '#ff8fb1'], [1100, 462, '#ffffff'], [1160, 494, '#ffd34d'], [600, 500, '#ffffff']].map(([x, y, c]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x as number} cy={y as number} r="6" fill={c as string} opacity="var(--gs-flower-op)" />
            <circle cx={x as number} cy={y as number} r="2.4" fill="#f5a623" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Bướm bay */
export function Butterfly({ className, color = '#a78bfa' }: P & { color?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 32" className={className}>
      <path d="M20 16C14 2 2 2 3 10c1 6 8 8 17 6zM20 16C26 2 38 2 37 10c-1 6-8 8-17 6z" fill={color} />
      <path d="M20 16c-6 4-12 10-9 14 3 2 7-4 9-14zM20 16c6 4 12 10 9 14-3 2-7-4-9-14z" fill={color} opacity=".75" />
      <path d="M20 8v18" stroke="#4b3a6b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Chồng sách nhiều màu */
export function BookPile({ className, books }: P & { books: { w: number; c: string }[] }) {
  const h = 22;
  const W = Math.max(...books.map((b) => b.w)) + 8;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${books.length * h + 4}`} className={className}>
      {books.map((b, i) => {
        const y = (books.length - 1 - i) * h + 2;
        const x = (W - b.w) / 2 + (i % 2 ? 3 : -3);
        return (
          <g key={i}>
            <rect x={x} y={y} width={b.w} height={h - 2} rx="4" fill={b.c} />
            <rect x={x + b.w - 14} y={y + 3} width="10" height={h - 8} rx="2" fill="#fff8e6" />
            <path d={`M${x + 8} ${y + 6}h${b.w - 30}M${x + 8} ${y + 13}h${b.w - 40}`} stroke="#ffffff" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  );
}

/** Ảnh đại diện học sinh (minh họa) */
export function KidAvatar({ className }: P) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="24" fill="#dbeafe" />
      <path d="M8 48c2-10 8-14 16-14s14 4 16 14z" fill="#2457c5" />
      <circle cx="24" cy="22" r="11" fill="#f6c9a0" />
      <path d="M12 20c0-9 6-13 12-13 7 0 13 4 12 13-3-4-7-6-12-6-4 0-9 2-12 6z" fill="#4a2b17" />
      <circle cx="20" cy="23" r="1.6" fill="#2b1a0e" /><circle cx="28" cy="23" r="1.6" fill="#2b1a0e" />
      <path d="M20.5 28q3.5 3 7 0" stroke="#b5552f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

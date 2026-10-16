// Milo bản lớn cho trang chủ: cú nâu lông xù, kính tròn xanh dương, đeo cặp xanh, hai cánh ôm quyển sách xanh mở.
// Vẽ bằng SVG có tô chuyển màu để có khối (không tải ảnh từ ngoài).

export default function MiloHero({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 320 360"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <radialGradient id="mh-fur" cx="45%" cy="35%" r="70%">
          <stop offset="0" stopColor="#b98250" />
          <stop offset=".6" stopColor="#94603a" />
          <stop offset="1" stopColor="#6b4124" />
        </radialGradient>
        <radialGradient id="mh-head" cx="50%" cy="38%" r="65%">
          <stop offset="0" stopColor="#c08a57" />
          <stop offset=".65" stopColor="#9a643b" />
          <stop offset="1" stopColor="#6e4325" />
        </radialGradient>
        <radialGradient id="mh-face" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#f1d9b0" />
          <stop offset="1" stopColor="#d4a874" />
        </radialGradient>
        <radialGradient id="mh-belly" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fbefd6" />
          <stop offset="1" stopColor="#e3c497" />
        </radialGradient>
        <radialGradient id="mh-eye" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6ecf5" />
        </radialGradient>
        <radialGradient id="mh-iris" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#5a3a22" />
          <stop offset="1" stopColor="#1d120a" />
        </radialGradient>
        <linearGradient id="mh-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4d8dff" />
          <stop offset="1" stopColor="#1f58d6" />
        </linearGradient>
        <linearGradient id="mh-pack" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3f86f5" />
          <stop offset="1" stopColor="#1d4fb8" />
        </linearGradient>
        <linearGradient id="mh-book" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b7cf0" />
          <stop offset="1" stopColor="#1f4fb3" />
        </linearGradient>
        <linearGradient id="mh-beak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc24a" />
          <stop offset="1" stopColor="#f08a1c" />
        </linearGradient>
      </defs>

      {/* bóng dưới chân */}
      <ellipse cx="160" cy="346" rx="112" ry="12" fill="#2b4a1c" opacity=".22" />

      {/* cặp sách phía sau */}
      <rect x="214" y="168" width="82" height="128" rx="30" fill="url(#mh-pack)" />
      <rect x="226" y="226" width="58" height="46" rx="14" fill="#2a63d8" stroke="#174399" strokeWidth="2" />
      <path d="M234 238h42" stroke="#174399" strokeWidth="2" />
      <rect x="250" y="231" width="10" height="10" rx="3" fill="#ffc83d" />

      {/* thân */}
      <ellipse cx="160" cy="252" rx="104" ry="96" fill="url(#mh-fur)" />
      {/* lông xù hai bên thân */}
      <path d="M60 236c-10 8-12 20-6 30 2-10 7-16 14-20M262 236c10 8 12 20 6 30-2-10-7-16-14-20" fill="#7d4f2c" />
      <ellipse cx="160" cy="268" rx="64" ry="70" fill="url(#mh-belly)" />
      <g fill="none" stroke="#d2ad7c" strokeWidth="2.6" strokeLinecap="round">
        <path d="M128 236q8 7 16 0M152 236q8 7 16 0M176 236q8 7 16 0" />
        <path d="M140 254q8 7 16 0M164 254q8 7 16 0" />
      </g>

      {/* quai cặp trên vai */}
      <path d="M94 186c-4 30-2 56 8 82" stroke="#2a63d8" strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M226 186c4 30 2 56-8 82" stroke="#2a63d8" strokeWidth="14" strokeLinecap="round" fill="none" />

      {/* chân */}
      <g fill="#f5a623" stroke="#c97a10" strokeWidth="2">
        <path d="M120 334c-10 0-16 6-16 10h34c0-4-6-10-18-10z" />
        <path d="M200 334c-12 0-18 6-18 10h34c0-4-6-10-16-10z" />
      </g>

      {/* quyển sách mở */}
      <g>
        <path d="M70 262c32-10 62-6 90 10 28-16 58-20 90-10v66c-32-10-62-6-90 10-28-16-58-20-90-10z" fill="url(#mh-book)" />
        <path d="M80 266c28-7 54-3 80 10v58c-26-13-52-17-80-10z" fill="#f4f8ff" />
        <path d="M240 266c-28-7-54-3-80 10v58c26-13 52-17 80-10z" fill="#ffffff" />
        <path d="M160 276v60" stroke="#c9d6ee" strokeWidth="2" />
        <g stroke="#a9bde3" strokeWidth="3" strokeLinecap="round">
          <path d="M94 284c18-3 36-1 54 6M94 298c18-3 36-1 54 6M94 312c18-3 36-1 54 6" />
          <path d="M172 290c18-7 36-9 54-6M172 304c18-7 36-9 54-6" />
        </g>
        <path d="M206 310l3.5 7 7.5 1-5.5 5.2 1.4 7.5-6.9-3.6-6.9 3.6 1.4-7.5-5.5-5.2 7.5-1z" fill="#ffc83d" stroke="#e09b00" strokeWidth="1.2" />
      </g>

      {/* cánh ôm sách */}
      <path d="M56 214c-20 26-18 70 6 96 10 8 26 6 30-6 4-14-4-22-4-36 0-22-12-44-32-54z" fill="#7d4f2c" />
      <path d="M264 214c20 26 18 70-6 96-10 8-26 6-30-6-4-14 4-22 4-36 0-22 12-44 32-54z" fill="#7d4f2c" />
      <path d="M66 254c4 14 10 26 18 34M254 254c-4 14-10 26-18 34" stroke="#5e3a1f" strokeWidth="2.4" fill="none" strokeLinecap="round" />

      {/* đầu */}
      <path d="M58 70l-10-50 46 28z" fill="#7d4f2c" />
      <path d="M262 70l10-50-46 28z" fill="#7d4f2c" />
      <path d="M60 60l-4-26 22 18M260 60l4-26-22 18" stroke="#5e3a1f" strokeWidth="2" fill="none" />
      <ellipse cx="160" cy="128" rx="122" ry="104" fill="url(#mh-head)" />
      {/* chỏm lông trên đỉnh đầu */}
      <path d="M140 30c4-14 14-20 22-20-4 6-4 12 0 18 6-8 14-10 20-8-6 4-8 10-6 16z" fill="#a46c40" />
      {/* mặt sáng hình trái tim */}
      <path d="M160 72c-22-26-74-24-92 8-14 26-6 66 22 80 22 11 52 8 70-4 18 12 48 15 70 4 28-14 36-54 22-80-18-32-70-34-92-8z" fill="url(#mh-face)" />

      {/* lông mày */}
      <path d="M84 62c12-10 34-12 48-2M236 62c-12-10-34-12-48-2" stroke="#6e4325" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* mắt */}
      <circle cx="112" cy="116" r="40" fill="url(#mh-eye)" />
      <circle cx="208" cy="116" r="40" fill="url(#mh-eye)" />
      <circle cx="116" cy="120" r="25" fill="url(#mh-iris)" />
      <circle cx="204" cy="120" r="25" fill="url(#mh-iris)" />
      <circle cx="116" cy="121" r="13" fill="#0b0705" />
      <circle cx="204" cy="121" r="13" fill="#0b0705" />
      <circle cx="125" cy="108" r="8" fill="#fff" />
      <circle cx="213" cy="108" r="8" fill="#fff" />
      <circle cx="108" cy="130" r="3.5" fill="#fff" opacity=".9" />
      <circle cx="196" cy="130" r="3.5" fill="#fff" opacity=".9" />

      {/* kính tròn xanh */}
      <g fill="none">
        <circle cx="112" cy="116" r="46" stroke="url(#mh-glass)" strokeWidth="11" />
        <circle cx="208" cy="116" r="46" stroke="url(#mh-glass)" strokeWidth="11" />
        <path d="M150 104q10-10 20 0" stroke="#2a63d8" strokeWidth="9" strokeLinecap="round" />
        <path d="M78 88a44 44 0 0 1 30-16M174 88a44 44 0 0 1 30-16" stroke="#9cc0ff" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M66 112l-12-4M254 112l12-4" stroke="#1f58d6" strokeWidth="8" strokeLinecap="round" />
      </g>

      {/* má hồng */}
      <ellipse cx="80" cy="168" rx="14" ry="8" fill="#f29a8a" opacity=".55" />
      <ellipse cx="240" cy="168" rx="14" ry="8" fill="#f29a8a" opacity=".55" />

      {/* mỏ cười */}
      <path d="M144 158c4-10 28-10 32 0l-16 16z" fill="url(#mh-beak)" stroke="#c97a10" strokeWidth="2" strokeLinejoin="round" />
      <path d="M148 170c6 16 18 16 24 0-8 4-16 4-24 0z" fill="#e1702a" />
      <path d="M152 172c4 8 12 8 16 0" fill="#f06a6a" />
    </svg>
  );
}

/* eslint-disable @next/next/no-img-element -- hình dán nền, kích thước tự do */
import { memo } from 'react';
import type React from 'react';
import { SCENE_BY_ID } from '@/lib/deck/scenes';
import type { SceneVariant } from '@/lib/deck/types';

/** Đám mây đáy phẳng kiểu Canva */
function FlatCloud({ x, y, w, op = 0.92 }: { x: number; y: number; w: number; op?: number }) {
  const h = w * 0.36;
  return (
    <g transform={`translate(${x},${y})`} opacity={op}>
      <path
        d={`M ${w * 0.08} ${h} H ${w * 0.94} C ${w} ${h} ${w} ${h * 0.65} ${w * 0.86} ${h * 0.62} C ${w * 0.84} ${h * 0.25} ${w * 0.62} ${h * 0.18} ${w * 0.54} ${h * 0.42} C ${w * 0.44} ${h * 0.04} ${w * 0.16} ${h * 0.08} ${w * 0.14} ${h * 0.52} C ${w * 0.01} ${h * 0.54} ${w * 0.01} ${h} ${w * 0.08} ${h} Z`}
        fill="#ffffff"
      />
    </g>
  );
}

/** Cây dừa nghiêng chuẩn mẫu Canva Đại dương */
function PalmTree({ bx, by, tx, ty, scale = 1 }: { bx: number; by: number; tx: number; ty: number; scale?: number }) {
  const cx = (bx + tx) / 2 - 35 * scale;
  const cy = (by + ty) / 2 + 15 * scale;
  return (
    <g>
      {/* Thân dừa cong có đốt */}
      <path
        d={`M ${bx - 22 * scale} ${by} Q ${cx - 16 * scale} ${cy} ${tx - 10 * scale} ${ty} L ${tx + 12 * scale} ${ty} Q ${cx + 16 * scale} ${cy} ${bx + 22 * scale} ${by} Z`}
        fill="#8d5531"
      />
      {[0.18, 0.34, 0.5, 0.66, 0.82].map((t, i) => {
        const px = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * tx;
        const py = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ty;
        const w = (22 - t * 10) * scale;
        return <line key={i} x1={px - w} y1={py + 4} x2={px + w} y2={py - 4} stroke="#6b3e20" strokeWidth={4 * scale} strokeLinecap="round" />;
      })}
      {/* Tán lá dừa 2 tông xanh */}
      <g transform={`translate(${tx},${ty}) scale(${scale})`}>
        <path d="M 0 0 C -90 -90 -210 -70 -260 10 C -180 -10 -90 5 0 12 Z" fill="#7cb342" />
        <path d="M 0 0 C -110 -30 -220 30 -250 120 C -160 65 -80 35 0 15 Z" fill="#8bc34a" />
        <path d="M 0 0 C -40 -110 60 -170 160 -130 C 75 -85 25 -45 0 5 Z" fill="#689f38" />
        <path d="M 0 0 C 80 -80 200 -50 250 35 C 160 5 80 5 0 12 Z" fill="#8bc34a" />
        <path d="M 0 0 C 70 -10 160 70 175 165 C 105 95 50 45 0 15 Z" fill="#7cb342" />
        <path d="M 0 0 C -30 30 -60 110 -45 185 C -15 115 0 55 6 12 Z" fill="#689f38" />
        {/* Quả dừa */}
        <circle cx="-8" cy="14" r="18" fill="#5d3a1a" />
        <circle cx="14" cy="12" r="17" fill="#4e3014" />
        <circle cx="3" cy="24" r="16" fill="#6b4220" />
      </g>
    </g>
  );
}

/** Cảnh bìa Đại dương & Đảo dừa (khớp mẫu Canva "Động vật dưới đại dương") */
function OceanCoverSvg() {
  return (
    <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
      {/* Bầu trời & Mây trắng đáy phẳng */}
      <rect width="1600" height="505" fill="#ccf2ff" />
      <FlatCloud x={190} y={36} w={490} op={0.95} />
      <FlatCloud x={1020} y={135} w={430} op={0.92} />

      {/* Mặt biển xanh ngọc & gợn sóng trắng */}
      <rect y="500" width="1600" height="400" fill="#6cc5d8" />
      {[
        [30, 540, 90], [260, 555, 70], [450, 535, 110], [820, 540, 85],
        [70, 625, 120], [280, 660, 80], [110, 725, 95], [45, 810, 110], [240, 835, 85],
      ].map(([x, y, w], i) => (
        <line key={i} x1={x} y1={y} x2={x + w} y2={y} stroke="#d8f4f8" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      ))}

      {/* Thuyền buồm nhỏ phía chân trời */}
      <g transform="translate(1015, 385)">
        <path d="M 28 0 L 28 88 L 2 88 Z" fill="#dceef2" />
        <path d="M 32 6 L 68 88 L 32 88 Z" fill="#fbbf24" />
        <path d="M 0 92 H 74 L 62 110 H 12 Z" fill="#475569" />
        <path d="M 8 100 H 66" stroke="#38bdf8" strokeWidth="4" />
      </g>

      {/* Viền sóng trắng xô bờ & Bãi cát vàng uốn cong */}
      <path d="M 355 900 C 375 745 730 680 1260 520 L 1600 520 L 1600 900 Z" fill="#e6f4f7" />
      <path d="M 405 900 C 430 760 770 695 1290 535 L 1600 535 L 1600 900 Z" fill="#ebd2b2" />
      <path d="M 445 900 C 475 775 810 710 1320 550 L 1600 550 L 1600 900 Z" fill="#f7e1c4" />

      {/* Đảo xanh bên phải */}
      <path d="M 1135 555 C 1235 405 1435 325 1600 315 L 1600 885 C 1365 865 1210 770 1255 685 C 1280 635 1175 605 1135 555 Z" fill="#7cb342" />
      {/* Cụm đá góc phải dưới */}
      <path d="M 1455 900 C 1465 820 1515 795 1555 830 C 1575 775 1600 785 1600 900 Z" fill="#b8ada1" />
      <path d="M 1495 900 C 1510 840 1565 835 1590 900 Z" fill="#9e9388" />

      {/* 2 Cây dừa nghiêng trên đảo */}
      <PalmTree bx={1295} by={530} tx={1075} ty={165} scale={1.02} />
      <PalmTree bx={1465} by={565} tx={1325} ty={105} scale={1.15} />

      {/* Cá heo phóng lên giữa biển */}
      <g transform="translate(680, 355)">
        <path d="M 35 105 C 15 60 45 15 95 18 C 102 -8 118 -4 114 22 C 155 35 178 80 162 135 C 182 145 190 165 168 168 C 150 168 142 155 138 142 C 132 100 105 78 68 88 C 52 92 42 108 35 105 Z" fill="#7aa7c7" />
        <path d="M 42 98 C 68 72 112 76 136 125 C 115 92 75 86 42 98 Z" fill="#dcebf5" />
        <circle cx="52" cy="64" r="4.5" fill="#0f172a" />
      </g>

      {/* Chú hải cẩu đốm đáng yêu bên bờ biển */}
      <g transform="translate(390, 485)">
        {/* Thân hải cẩu */}
        <path d="M 55 95 C 52 35 105 15 135 45 C 155 65 160 125 185 150 C 225 185 265 200 255 245 C 245 275 175 280 95 275 C 45 272 25 245 32 195 C 38 150 55 130 55 95 Z" fill="#94a3b8" />
        {/* Bụng sáng */}
        <path d="M 55 95 C 75 90 108 110 112 165 C 116 215 98 265 65 268 C 35 265 28 225 35 180 C 42 135 48 110 55 95 Z" fill="#e2e8f0" />
        {/* Các đốm lưng */}
        {[[135, 115, 11], [155, 145, 9], [140, 170, 12], [170, 185, 10], [195, 200, 13], [160, 215, 11], [215, 220, 9]].map(([cx, cy, r], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.7} fill="#334155" />
        ))}
        {/* Chân vây */}
        <path d="M 105 215 C 125 215 135 265 125 285 C 105 292 75 288 78 268 C 82 248 92 215 105 215 Z" fill="#334155" />
        <path d="M 32 235 C 12 245 2 265 18 275 C 35 280 52 268 48 252 Z" fill="#334155" />
        {/* Khuôn mặt & Râu */}
        <circle cx="72" cy="56" r="7" fill="#0f172a" />
        <circle cx="112" cy="58" r="7" fill="#0f172a" />
        <ellipse cx="90" cy="70" rx="8" ry="6" fill="#0f172a" />
        <path d="M 62 78 L 22 72 M 62 84 L 20 84 M 64 90 L 26 96" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 116 78 L 154 72 M 118 84 L 156 84 M 114 90 L 148 96" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Rùa biển trên bãi cát */}
      <g transform="translate(680, 675)">
        <ellipse cx="95" cy="55" rx="62" ry="42" fill="#7c6f36" />
        <path d="M 35 58 Q 95 20 155 58 Q 95 72 35 58 Z" fill="#9e8c45" />
        <path d="M 32 58 C 12 45 2 52 6 66 C 12 76 30 72 36 64 Z" fill="#84a93c" />
        <circle cx="14" cy="58" r="3" fill="#0f172a" />
        <ellipse cx="55" cy="88" rx="22" ry="10" transform="rotate(-20 55 88)" fill="#84a93c" />
        <ellipse cx="132" cy="86" rx="20" ry="9" transform="rotate(20 132 86)" fill="#84a93c" />
      </g>

      {/* Chú cua đỏ vẫy càng */}
      <g transform="translate(935, 560)">
        <ellipse cx="50" cy="48" rx="34" ry="24" fill="#df5a49" />
        <circle cx="38" cy="26" r="4" fill="#0f172a" />
        <circle cx="62" cy="26" r="4" fill="#0f172a" />
        <path d="M 22 36 C 6 22 4 8 18 8 C 26 8 28 18 22 24" fill="#df5a49" stroke="#df5a49" strokeWidth="5" strokeLinecap="round" />
        <path d="M 78 36 C 94 22 96 8 82 8 C 74 8 72 18 78 24" fill="#df5a49" stroke="#df5a49" strokeWidth="5" strokeLinecap="round" />
        <path d="M 18 52 L 2 62 M 20 60 L 6 72 M 82 52 L 98 62 M 80 60 L 94 72" stroke="#df5a49" strokeWidth="4.5" strokeLinecap="round" />
      </g>

      {/* Sao biển & Vỏ sò trên cát */}
      <g transform="translate(1085, 705)">
        <polygon points="45,15 52,32 70,34 56,46 60,64 45,54 30,64 34,46 20,34 38,32" fill="#e14d43" />
        <path d="M 0 18 C 0 0 28 0 28 18 L 14 32 Z" fill="#f48fb1" />
        <path d="M 55 5 C 55 -10 78 -10 78 5 L 66 18 Z" fill="#f8bbd0" />
      </g>
    </svg>
  );
}

/** Cảnh dưới lòng đại dương (cho các góc máy center, right, left, bottom) */
function OceanUnderwaterSvg({ variant }: { variant: SceneVariant }) {
  return (
    <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
      {/* Tia nắng chiếu xuyên mặt nước */}
      <polygon points="180,0 380,0 620,900 320,900" fill="#ffffff" opacity="0.14" />
      <polygon points="680,0 920,0 1180,900 840,900" fill="#ffffff" opacity="0.11" />
      <polygon points="1180,0 1360,0 1560,900 1320,900" fill="#ffffff" opacity="0.1" />

      {/* Gợn sóng mặt nước phía trên */}
      <path d="M 0 0 H 1600 V 48 Q 1400 72 1200 48 T 800 48 T 400 48 T 0 48 Z" fill="#e0f7fa" opacity="0.65" />

      {/* Đáy cát vàng uốn lượn */}
      <path d="M 0 790 Q 400 735 820 785 T 1600 765 L 1600 900 L 0 900 Z" fill="#f3d9b1" />
      <path d="M 0 825 Q 520 780 1040 820 T 1600 805 L 1600 900 L 0 900 Z" fill="#e6c79c" />

      {/* Rong biển & San hô bên trái */}
      {(variant !== 'right' || true) && (
        <g transform="translate(30, 620)">
          <path d="M 30 240 Q 5 160 35 90 Q 65 30 30 -20" fill="none" stroke="#2e7d32" strokeWidth="18" strokeLinecap="round" />
          <path d="M 75 240 Q 105 170 75 110 Q 45 55 80 10" fill="none" stroke="#43a047" strokeWidth="15" strokeLinecap="round" />
          <path d="M 135 235 C 115 170 145 125 145 125 C 145 125 175 165 155 235 Z" fill="#f472b6" />
          <path d="M 165 235 C 165 180 195 140 205 185 C 215 210 185 235 165 235 Z" fill="#fb923c" />
        </g>
      )}

      {/* Rong biển & San hô bên phải */}
      <g transform="translate(1340, 630)">
        <path d="M 180 230 Q 205 150 175 80 Q 145 20 180 -30" fill="none" stroke="#2e7d32" strokeWidth="18" strokeLinecap="round" />
        <path d="M 135 230 Q 105 165 135 105 Q 165 50 130 5" fill="none" stroke="#66bb6a" strokeWidth="14" strokeLinecap="round" />
        <circle cx="65" cy="195" r="42" fill="#facc15" opacity="0.9" />
        <path d="M 15 225 C 5 170 45 150 55 225 Z" fill="#f87171" />
      </g>

      {/* Bong bóng nước */}
      {[[160, 420, 14], [185, 360, 9], [1420, 380, 16], [1395, 310, 10], [820, 710, 12], [840, 660, 8]].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.45)" stroke="#ffffff" strokeWidth="2" />
      ))}

      {/* Sao biển trên cát */}
      <polygon points="295,815 302,832 320,834 306,846 310,864 295,854 280,864 284,846 270,834 288,832" fill="#ef4444" />
      <polygon points="1185,805 1192,822 1210,824 1196,836 1200,854 1185,844 1170,854 1174,836 1160,824 1178,822" fill="#f97316" />
    </svg>
  );
}

/** Đồi cỏ & thiên nhiên đa lớp cho các chủ đề đất liền / vũ trụ / tết / kẹo ngọt */
function LandThemeSvg({ id, variant }: { id: string; variant: SceneVariant }) {
  switch (id) {
    case 'garden':
    case 'farm':
    case 'yard':
    case 'dino': {
      const c1 = id === 'dino' ? '#6ee7b7' : id === 'yard' ? '#fde047' : '#86efac';
      const c2 = id === 'dino' ? '#34d399' : id === 'yard' ? '#facc15' : '#4ade80';
      const c3 = id === 'dino' ? '#10b981' : id === 'yard' ? '#eab308' : '#22c55e';
      return (
        <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <FlatCloud x={140} y={42} w={420} op={0.9} />
          <FlatCloud x={980} y={68} w={360} op={0.85} />
          {id === 'dino' && (
            /* Dãy núi & núi lửa kỷ Jura phía xa */
            <g opacity="0.75">
              <polygon points="980,580 1160,260 1340,580" fill="#94a3b8" />
              <polygon points="1125,320 1160,260 1195,320" fill="#f97316" />
              <circle cx="1160" cy="210" r="32" fill="#cbd5e1" opacity="0.7" />
              <circle cx="1190" cy="170" r="44" fill="#e2e8f0" opacity="0.6" />
            </g>
          )}
          {variant === 'cover' ? (
            <>
              <path d="M 0 640 Q 480 560 960 620 T 1600 520 L 1600 900 L 0 900 Z" fill={c1} />
              <path d="M 320 900 C 460 690 880 610 1600 470 L 1600 900 Z" fill={c2} />
              <path d="M 780 900 C 960 720 1280 640 1600 580 L 1600 900 Z" fill={c3} />
            </>
          ) : (
            <>
              <path d="M 0 710 Q 420 650 840 700 T 1600 670 L 1600 900 L 0 900 Z" fill={c1} />
              <path d="M 0 775 Q 540 720 1080 770 T 1600 740 L 1600 900 L 0 900 Z" fill={c2} />
            </>
          )}
          {id === 'farm' && (
            /* Hàng rào gỗ trắng nông trại */
            <g opacity="0.85">
              <rect x="0" y="665" width="1600" height="10" fill="#ffffff" />
              <rect x="0" y="695" width="1600" height="10" fill="#ffffff" />
              {Array.from({ length: 20 }, (_, i) => (
                <rect key={i} x={30 + i * 82} y="645" width="14" height="75" rx="4" fill="#ffffff" />
              ))}
            </g>
          )}
        </svg>
      );
    }
    case 'space':
      return (
        <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          {/* Các ngôi sao lấp lánh trên bầu trời đêm */}
          {[[120, 90, 4], [280, 150, 3], [520, 70, 5], [760, 130, 3.5], [1080, 80, 4], [1340, 160, 5], [1490, 70, 3], [90, 420, 3.5], [1480, 440, 4]].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#fef08a" opacity="0.85" />
          ))}
          {/* Bề mặt hành tinh tím dưới đáy */}
          <path d="M 0 760 Q 520 660 1120 730 T 1600 710 L 1600 900 L 0 900 Z" fill="#4c1d95" />
          <path d="M 0 800 Q 480 720 1040 780 T 1600 760 L 1600 900 L 0 900 Z" fill="#5b21b6" />
          <ellipse cx="340" cy="830" rx="65" ry="22" fill="#3b0764" opacity="0.6" />
          <ellipse cx="980" cy="845" rx="85" ry="26" fill="#3b0764" opacity="0.6" />
        </svg>
      );
    case 'candy':
      return (
        <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <FlatCloud x={120} y={48} w={420} op={0.92} />
          <FlatCloud x={1020} y={60} w={380} op={0.88} />
          {/* Tầng mây kem bông xốp hồng & vàng dưới đáy */}
          <path d="M 0 740 Q 200 670 400 730 Q 600 660 800 730 Q 1000 660 1200 730 Q 1400 670 1600 730 L 1600 900 L 0 900 Z" fill="#fbcfe8" />
          <path d="M 0 800 Q 260 735 520 795 Q 800 730 1080 795 Q 1340 735 1600 795 L 1600 900 L 0 900 Z" fill="#f9a8d4" />
        </svg>
      );
    case 'pond':
      return (
        <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <FlatCloud x={150} y={40} w={420} op={0.92} />
          <path d="M 0 540 Q 400 500 800 535 T 1600 520 L 1600 900 L 0 900 Z" fill="#38bdf8" opacity="0.45" />
          {/* Lá sen nổi trên mặt hồ */}
          <ellipse cx="280" cy="770" rx="95" ry="38" fill="#22c55e" />
          <ellipse cx="1180" cy="790" rx="115" ry="44" fill="#16a34a" />
          <ellipse cx="760" cy="830" rx="85" ry="32" fill="#4ade80" />
        </svg>
      );
    case 'kitchen':
      return (
        <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          {/* Mái hiên sọc tiệm bánh ngọt kiểu Canva */}
          {Array.from({ length: 16 }, (_, i) => (
            <path
              key={i}
              d={`M ${i * 100} 0 H ${(i + 1) * 100} V 42 C ${(i + 1) * 100} 68 ${i * 100} 68 ${i * 100} 42 Z`}
              fill={i % 2 === 0 ? '#fb7185' : '#ffffff'}
              opacity="0.88"
            />
          ))}
          <rect y="680" width="1600" height="220" fill="#fed7aa" />
          <rect y="672" width="1600" height="16" fill="#d97706" opacity="0.55" />
        </svg>
      );
    case 'class':
      return (
        <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          {/* Sàn gỗ lớp học & chân tường */}
          <rect y="700" width="1600" height="200" fill="#d9a066" />
          <rect y="686" width="1600" height="16" fill="#b45309" opacity="0.65" />
        </svg>
      );
    case 'tet':
      return (
        <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="1320" cy="420" r="240" fill="#fbbf24" opacity="0.18" />
          <rect y="852" width="1600" height="48" fill="#fbbf24" opacity="0.85" />
        </svg>
      );
    case 'family':
      if (variant === 'cover') {
        // Cảnh bìa cắm trại gia đình (Slide 1.webp): vòm lá cây góc trên, đồi cỏ vàng cốm, lều chữ A cam vàng có sao
        return (
          <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
            {/* Đồi cỏ vàng cốm ấm áp dưới đáy */}
            <path d="M 0 600 Q 340 570 680 630 T 1600 610 L 1600 900 L 0 900 Z" fill="#e5ce5c" />
            <path d="M 0 680 Q 480 630 980 690 T 1600 660 L 1600 900 L 0 900 Z" fill="#d9be46" opacity="0.7" />
            {/* Bụi cây xanh cốm bên cạnh lều */}
            <circle cx="745" cy="640" r="65" fill="#b4cb68" />
            <circle cx="795" cy="615" r="55" fill="#c5d87d" />
            <circle cx="705" cy="665" r="48" fill="#a2bc57" />
            {/* Thân cây & vòm lá góc phải */}
            <path d="M 1510 0 C 1540 240 1560 480 1600 720 L 1600 0 Z" fill="#6b4c35" />
            <circle cx="1360" cy="40" r="130" fill="#b5cf6b" opacity="0.92" />
            <circle cx="1480" cy="140" r="145" fill="#94b853" opacity="0.92" />
            <circle cx="1540" cy="290" r="125" fill="#a3c460" opacity="0.9" />
            <circle cx="1190" cy="20" r="95" fill="#dce79b" opacity="0.85" />
            {/* Vòm lá góc trái trên */}
            <circle cx="60" cy="30" r="115" fill="#a3c460" opacity="0.9" />
            <circle cx="180" cy="20" r="95" fill="#cde087" opacity="0.88" />
            <circle cx="30" cy="140" r="85" fill="#c5d87d" opacity="0.85" />
            {/* Lều cắm trại chữ A màu vàng cam (x: 820..1460, y: 80..720) */}
            <line x1="1155" y1="65" x2="1205" y2="145" stroke="#b46924" strokeWidth="12" strokeLinecap="round" />
            <line x1="1205" y1="65" x2="1155" y2="145" stroke="#b46924" strokeWidth="12" strokeLinecap="round" />
            <polygon points="1180,100 815,695 1475,695" fill="#f39c3d" stroke="#d47a22" strokeWidth="6" />
            <polygon points="1180,100 945,695 1415,695" fill="#fdf1cd" />
            <polygon points="1180,185 1030,695 1330,695" fill="#e67e22" />
            {/* Các ngôi sao trang trí trên vải lều */}
            <polygon points="1175,235 1185,256 1208,259 1191,274 1195,296 1175,285 1155,296 1159,274 1142,259 1165,256" fill="#f5b041" />
            <polygon points="1095,385 1102,400 1118,402 1106,412 1109,428 1095,420 1081,428 1084,412 1072,402 1088,400" fill="#f7dc6f" />
            <polygon points="1075,470 1083,486 1100,489 1087,500 1090,518 1075,509 1060,518 1063,500 1050,489 1067,486" fill="#f39c3d" />
          </svg>
        );
      }
      if (variant === 'center' || variant === 'bottom') {
        // Nền kem ấm + Thảm hoa dại màu nước sát đáy (Slide 2, 10, 11, 12)
        const flowers: [number, number, string, string, number][] = [
          [75, 810, '#f48fb1', '#d81b60', 28],
          [165, 845, '#ce93d8', '#8e24aa', 22],
          [265, 775, '#ffd54f', '#f57f17', 34],
          [385, 825, '#ff8a80', '#c62828', 26],
          [490, 815, '#d1c4e9', '#5e35b1', 24],
          [570, 765, '#ffd54f', '#f57f17', 32],
          [690, 835, '#ffab91', '#d84315', 22],
          [800, 755, '#ffd54f', '#f57f17', 36],
          [945, 765, '#f8bbd0', '#ad1457', 34],
          [1030, 830, '#ff8a80', '#c62828', 28],
          [1135, 785, '#f48fb1', '#c2185b', 25],
          [1255, 820, '#f8bbd0', '#ad1457', 24],
          [1335, 785, '#ff8a80', '#c62828', 30],
          [1425, 825, '#ffd54f', '#f57f17', 25],
          [1515, 755, '#ffd54f', '#f57f17', 36],
        ];
        return (
          <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
            <FlatCloud x={140} y={36} w={480} op={0.55} />
            <FlatCloud x={1020} y={48} w={440} op={0.5} />
            {/* Cành lá xanh mảnh vươn từ chân trang */}
            {flowers.map(([fx, fy], i) => (
              <path
                key={`s${i}`}
                d={`M ${fx + (i % 2 === 0 ? -12 : 12)} 900 Q ${fx} ${(fy + 900) / 2} ${fx} ${fy}`}
                fill="none"
                stroke="#7cb342"
                strokeWidth="4.5"
                opacity="0.72"
              />
            ))}
            {/* Bông hoa 6 cánh màu nước */}
            {flowers.map(([fx, fy, petal, center, r], i) => (
              <g key={`f${i}`}>
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <ellipse
                    key={deg}
                    cx={fx}
                    cy={fy - r * 0.55}
                    rx={r * 0.36}
                    ry={r * 0.58}
                    fill={petal}
                    opacity="0.9"
                    transform={`rotate(${deg} ${fx} ${fy})`}
                  />
                ))}
                <circle cx={fx} cy={fy} r={r * 0.22} fill={center} />
              </g>
            ))}
          </svg>
        );
      }
      // Two-Tier Grounded Horizon: 75% Kem Ấm (#fdfaf0) + 25% Dải cỏ Xanh Cốm (#dce7a7) từ y = 670..900 (Slide 3, 4, 5, 6, 7, 8, 9)
      return (
        <svg className="dk-scene-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <rect x="0" y="670" width="1600" height="230" fill="#dce7a7" />
          <line x1="0" y1="670" x2="1600" y2="670" stroke="#c8d88b" strokeWidth="3" />
        </svg>
      );
    default:
      return null;
  }
}

/** Cảnh nền minh hoạ đa góc máy (vẽ sau các vật, không bấm được) */
function SceneBg({ id, variant = 'cover' }: { id: string; variant?: SceneVariant }) {
  const [rawId, explicitVar] = id.split(':') as [string, SceneVariant | undefined];
  const sc = SCENE_BY_ID[rawId];
  if (!sc) return null;
  const v: SceneVariant = explicitVar ?? variant ?? 'cover';
  const bg = v === 'cover' ? sc.bg : (sc.bgInner ?? sc.bg);
  const parts = sc.variants?.[v] ?? sc.parts;

  return (
    <div className="dk-scene" aria-hidden="true" style={{ background: bg }}>
      {rawId === 'sea' ? (
        v === 'cover' ? <OceanCoverSvg /> : <OceanUnderwaterSvg variant={v} />
      ) : (
        <LandThemeSvg id={rawId} variant={v} />
      )}
      {parts.map((p, i) =>
        p.src ? (
          <img
            key={i}
            src={p.src}
            alt=""
            draggable={false}
            style={{
              left: p.x,
              top: p.y,
              width: p.w,
              opacity: p.op,
              transform: [p.flip ? 'scaleX(-1)' : '', p.rot ? `rotate(${p.rot}deg)` : ''].filter(Boolean).join(' ') || undefined,
              filter: 'drop-shadow(0 10px 18px rgba(15,23,42,0.18))',
            }}
          />
        ) : (
          <div key={i} style={{ left: p.x, top: p.y, width: p.w, height: p.h, ...cssObj(p.css) }} />
        ),
      )}
    </div>
  );
}

function cssObj(css?: string): React.CSSProperties {
  const o: Record<string, string> = {};
  for (const d of (css ?? '').split(';')) {
    const k = d.indexOf(':');
    if (k > 0) o[d.slice(0, k).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = d.slice(k + 1).trim();
  }
  return o as React.CSSProperties;
}

export default memo(SceneBg);

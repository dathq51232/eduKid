import MiloMascot from '@/components/mascot/MiloMascot';

/** Huy hiệu hoàn thành bài: dải ruy băng + đồng huy chương vàng có Milo */
export default function MedalBadge({ size = 150 }: { size?: number }) {
  return (
    <svg className="medal-badge" viewBox="0 0 210 230" width={size} height={(size * 230) / 210} aria-hidden="true">
      <path d="M70 120 L45 220 L78 200 L95 228 L110 130Z" fill="#e2483d" stroke="#1f2a44" strokeWidth="4" strokeLinejoin="round" />
      <path d="M140 120 L165 220 L132 200 L115 228 L100 130Z" fill="#2f6fed" stroke="#1f2a44" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="105" cy="92" r="78" fill="#ffc83d" stroke="#1f2a44" strokeWidth="5" />
      <circle cx="105" cy="92" r="62" fill="#fff3d1" stroke="#c58a00" strokeWidth="3" strokeDasharray="6 6" />
      <MiloMascot x={65} y={42} size={80} />
    </svg>
  );
}

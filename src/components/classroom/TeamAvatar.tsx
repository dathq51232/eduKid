'use client';

// Hình đại diện tổ thi đua: hình 3D nhiều màu trong vòng tròn màu của tổ (emoji tự nhập thì hiện bằng chữ).
import { teamIconSrc } from '@/lib/classroom/class-tools';

export default function TeamAvatar({ emoji, size = 28, color, className }: { emoji: string; size?: number; color?: string; className?: string }) {
  const src = teamIconSrc(emoji);
  return (
    <span className={`team-av${color ? ' has-bg' : ''} ${className ?? ''}`.trim()} aria-hidden="true"
      style={{ width: size, height: size, ...(color ? { ['--c' as string]: color, padding: Math.round(size * 0.12) } : {}) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" width={size} height={size} decoding="async" draggable={false} /> : <span style={{ fontSize: size * 0.72 }}>{emoji}</span>}
    </span>
  );
}

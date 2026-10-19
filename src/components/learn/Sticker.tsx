import type { StickerId } from '@/lib/stickers';

/** Sticker 3D (ảnh nền trong suốt trong public/stickers/<id>.webp, 200 × 200) */
export default function Sticker({ id, size = 96, label }: { id: StickerId; size?: number; label?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/stickers/${id}.webp`}
      width={size}
      height={size}
      className="sticker-art"
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}

// Milo — linh vật cú của EduChain Kids (tranh chính thức: cú nâu, kính tròn xanh dương, đeo cặp, ôm sách, giơ ngón cái).
// Ảnh nằm trong dự án (public/brand/milo.webp, milo-sm.webp) — không tải từ địa chỉ ngoài.

export type MiloMood = 'happy' | 'cheer' | 'think' | 'oops';

type Props = {
  /** Giữ để tương thích chỗ gọi cũ; tranh chính thức dùng chung một tư thế */
  mood?: MiloMood;
  size?: number;
  /** Có title thì Milo được đọc như một hình ảnh; mặc định là hình trang trí */
  title?: string;
  className?: string;
  /** Vị trí khi đặt Milo bên trong một hình SVG khác (ví dụ mê cung) */
  x?: number;
  y?: number;
};

const src = (size: number) => (size <= 140 ? '/brand/milo-sm.webp' : '/brand/milo.webp');

export default function MiloMascot({ size = 96, title, className, x, y }: Props) {
  const height = (size * 124) / 120;
  if (x !== undefined || y !== undefined) {
    // Bên trong một hình SVG
    return (
      <image
        href={src(size)}
        x={x}
        y={y}
        width={size}
        height={size}
        preserveAspectRatio="xMidYMid meet"
        className={`milo ${className ?? ''}`.trim()}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src(size)}
      width={size}
      height={height}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      className={`milo ${className ?? ''}`.trim()}
      style={{ objectFit: 'contain' }}
      loading="lazy"
      decoding="async"
    />
  );
}

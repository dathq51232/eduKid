// Chữ có emoji → emoji hiện bằng hình 3D / hình minh hoạ (đề bài, đáp án, phiếu bài tập).
import { splitEmoji } from '@/lib/emoji-img';

export default function EmojiText({ text, className }: { text: string; className?: string }) {
  const parts = splitEmoji(text);
  if (parts.length === 1 && !parts[0].src) return <>{text}</>;
  return (
    <>{parts.map((p, i) => (p.src
      // eslint-disable-next-line @next/next/no-img-element -- hình nhỏ có sẵn trong dự án
      ? <img key={i} src={p.src} alt={p.t} className={`emo-img ${className ?? ''}`.trim()} draggable={false} decoding="async" loading="lazy" />
      : <span key={i}>{p.t}</span>))}</>
  );
}

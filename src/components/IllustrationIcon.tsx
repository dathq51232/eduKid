import { illustrationIconSrc } from '@/lib/illustration-icons';

export default function IllustrationIcon({ value, alt = value, className }: { value: string; alt?: string; className?: string }) {
  const src = illustrationIconSrc(value);
  if (!src) return <span className={className}>{value}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- small, local transparent illustration
  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" draggable={false} />;
}

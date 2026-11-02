// Logo EduChain Kids (11/2026): khối lục giác ghép 4 mảnh xếp hình E-D-K-C (3D) + chữ "EduChainKids" nhiều màu.
// Ảnh nằm trong dự án: public/brand/logo-mark(.webp|-sm.webp) — biểu tượng, public/brand/logo-word.webp — chữ,
// public/brand/logo-full.webp — trọn bộ. Có 2 kiểu: biểu tượng (mark) và biểu tượng + chữ (full); tagline tuỳ chọn.

type Props = { size?: number; withText?: boolean; tagline?: boolean; className?: string };

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ, đã tối ưu sẵn (webp)
    <img src={size > 64 ? '/brand/logo-mark.webp' : '/brand/logo-mark-sm.webp'} width={size} height={size} alt="" aria-hidden="true" className={`logo-mark ${className ?? ''}`.trim()} style={{ width: size, height: size }} decoding="async" />
  );
}

/** Chữ thương hiệu "EduChainKids" (ảnh chữ 3D nhiều màu). height: chiều cao ảnh (px) */
export function BrandWord({ className, height = 26, fixed = false }: { className?: string; height?: number; fixed?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh chữ đã tối ưu sẵn (webp)
    <img src="/brand/logo-word.webp" width={Math.round(height * 6.75)} height={height} alt="EduChain Kids" className={`brand-word logo-word ${className ?? ''}`.trim()} style={fixed ? { height, width: 'auto' } : undefined} decoding="async" />
  );
}

export default function BrandLogo({ size = 40, withText = true, tagline = false, className }: Props) {
  const h = Math.round(size * 0.6);
  return (
    <span className={`brand-logo ${className ?? ''}`.trim()}>
      <LogoMark size={Math.round(size * 1.12)} />
      {withText && (tagline
        ? <span className="brand-stack"><BrandWord height={h} fixed /><span className="brand-tag">Kết nối giáo viên và học sinh</span></span>
        : <BrandWord height={h} fixed />)}
    </span>
  );
}

// Logo EduChain Kids (10/2026): Milo – chú cú đeo kính xanh – trong vòng tròn xanh dương → xanh lá
// (ảnh public/brand/logo-owl.webp, cắt từ bộ nhận diện), chữ "EduChain" xanh dương + "Kids" nhiều màu.
// Có 2 kiểu: biểu tượng (mark) và biểu tượng + chữ (full); tagline tuỳ chọn cho trang đăng nhập.

type Props = { size?: number; withText?: boolean; tagline?: boolean; className?: string };

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ, đã tối ưu sẵn (128px webp)
    <img src="/brand/logo-owl.webp" width={size} height={size} alt="" aria-hidden="true" className={`logo-mark ${className ?? ''}`.trim()} decoding="async" />
  );
}

/** Chữ thương hiệu: "Kids" mỗi chữ một màu (cam – xanh lá – hồng – tím) như logo */
export function BrandWord({ className }: { className?: string }) {
  return (
    <span className={`brand-word ${className ?? ''}`.trim()}>
      <span className="bw-edu">EduChain</span><span className="bw-kids" aria-label="Kids"><i>K</i><i>i</i><i>d</i><i>s</i></span>
    </span>
  );
}

export default function BrandLogo({ size = 40, withText = true, tagline = false, className }: Props) {
  return (
    <span className={`brand-logo ${className ?? ''}`.trim()}>
      <LogoMark size={size} />
      {withText && (tagline
        ? <span className="brand-stack"><BrandWord /><span className="brand-tag">Kết nối giáo viên và học sinh</span></span>
        : <BrandWord />)}
    </span>
  );
}

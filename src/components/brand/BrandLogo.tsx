// Logo EduChain Kids: quyển sách mở (trang xanh dương + xanh lá) và ngôi sao vàng.
// Vẽ bằng SVG, không tải ảnh từ ngoài. Có 2 kiểu: biểu tượng (mark) và biểu tượng + chữ (full).

type Props = { size?: number; withText?: boolean; className?: string };

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`logo-mark ${className ?? ''}`.trim()} aria-hidden="true" focusable="false">
      {/* bìa sách */}
      <path d="M4 22c10-3 19-1 28 5 9-6 18-8 28-5v32c-10-3-19-1-28 5-9-6-18-8-28-5z" fill="#1d47a8" />
      {/* trang trái xanh dương, trang phải xanh lá */}
      <path d="M8 21c8-2 16 0 24 5v28c-8-5-16-6-24-4z" fill="#2f6ff0" />
      <path d="M56 21c-8-2-16 0-24 5v28c8-5 16-6 24-4z" fill="#22c55e" />
      <path d="M12 28c5-1 10 0 15 3M12 35c5-1 10 0 15 3M37 31c5-3 10-4 15-3M37 38c5-3 10-4 15-3" stroke="#fff" strokeOpacity=".75" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M32 26v28" stroke="#163a8a" strokeWidth="2" />
      {/* ngôi sao */}
      <path d="M32 2l4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L32 25.6l-9.3 4.9 1.8-10.3-7.5-7.3 10.4-1.5z" fill="#ffc83d" stroke="#f0a500" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function BrandLogo({ size = 40, withText = true, className }: Props) {
  return (
    <span className={`brand-logo ${className ?? ''}`.trim()}>
      <LogoMark size={size} />
      {withText && (
        <span className="brand-word">
          <span className="bw-edu">Edu</span><span className="bw-chain">Chain</span> <span className="bw-kids">Kids</span>
        </span>
      )}
    </span>
  );
}

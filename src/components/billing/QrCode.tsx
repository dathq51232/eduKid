import { encodeQr, qrSvgPath } from '@/lib/qr';

/** Mã QR vẽ bằng SVG (nền trắng, ô đen) — chạy được cả ở máy chủ lẫn trình duyệt */
export default function QrCode({ text, size = 240, label }: { text: string; size?: number; label: string }) {
  const { path, viewSize } = qrSvgPath(encodeQr(text));
  return (
    <svg className="qr-code" width={size} height={size} viewBox={`0 0 ${viewSize} ${viewSize}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={viewSize} height={viewSize} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}

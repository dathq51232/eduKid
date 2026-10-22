import type { NextConfig } from 'next';

// Header bảo mật cho mọi trang. CSP vừa phải: chỉ tải mã/ảnh từ chính trang và Supabase,
// cấm nhúng trang vào web khác (chống clickjacking), cấm plugin, cấm gửi form ra ngoài.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'self' blob: data:",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    // Trang dev (next dev) cần 'unsafe-eval' cho hot reload: chỉ gắn CSP khi chạy bản production
    if (process.env.NODE_ENV !== 'production') return [];
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  // game Robot lập trình đã gỡ (10/2026): link cũ đưa về trang trò chơi
  async redirects() {
    return [{ source: '/tro-choi/robot-lap-trinh', destination: '/tro-choi', permanent: false }];
  },
};

export default nextConfig;
